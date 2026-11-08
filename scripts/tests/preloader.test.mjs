import assert from 'node:assert/strict';
import test from 'node:test';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFile } from 'node:fs/promises';
import { source, environment } from './helpers.mjs';

async function loader(t, { bootstrap = false, ready = false, reduced = false, fakeTimers = false } = {}) {
  const env = await environment({ reduced });
  if (bootstrap) {
    const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
    const document = new env.w.DOMParser().parseFromString(html, 'text/html');
    env.w.document.body.prepend(env.w.document.importNode(document.getElementById('im-boot-loader'), true));
    env.w.document.documentElement.classList.add('im-booting');
  }
  const timers = new Map();
  if (fakeTimers) {
    let id = 0;
    env.w.setTimeout = (callback, delay) => { timers.set(++id, { callback, delay }); return id; };
    env.w.clearTimeout = (id) => timers.delete(id);
  }
  const { Preloader } = await source('src/components/Preloader.tsx');
  const root = createRoot(env.q('#root'));
  let completions = 0;
  const action = async (fn) => act(async () => { await fn(); await env.settle(); });
  const render = async (value) => action(() => root.render(React.createElement(React.StrictMode, null, React.createElement(Preloader, { ready: value, onComplete: () => completions++ }))));
  const event = async (type, property, value, selector = '#im-boot-loader') => action(() => {
    const event = new Event(type, { bubbles: true });
    Object.defineProperty(event, property, { value });
    env.q(selector).dispatchEvent(event);
  });
  t.after(async () => { try { await action(() => root.unmount()); assert.equal(document.body.style.overflow, ''); assert.deepEqual(env.errors, []); } finally { env.cleanup(); } });
  await render(ready);
  return { ...env, action, render, timers, root, event, get completions() { return completions; } };
}

test('loading waits for the real scene, fonts and artwork entrance instead of a fabricated percentage', async (t) => {
  const env = await loader(t);
  assert.equal(document.body.style.overflow, 'hidden');
  assert.equal(env.q('.im-loader').getAttribute('role'), 'status');
  assert.equal(env.q('[role="progressbar"]'), null);
  assert.equal(env.q('.im-loader').textContent.includes('%'), false);
  await env.action(() => env.resolveFonts());
  await env.event('animationend', 'animationName', 'im-loader-enter', '.im-loader__body');
  assert.equal(env.q('.im-loader').dataset.state, 'loading');
  await env.render(true);
  assert.equal(env.q('.im-loader').dataset.state, 'leaving');
  assert.equal(env.completions, 0);
  await env.event('transitionend', 'propertyName', 'opacity');
  assert.equal(env.completions, 1);
  assert.equal(document.body.style.overflow, '');
  await env.event('transitionend', 'propertyName', 'opacity');
  assert.equal(env.completions, 1, 'completion and scroll release are idempotent');
});

test('a ready scene cannot hide the loading surface before fonts and the entrance finish', async (t) => {
  const env = await loader(t, { ready: true });
  await env.action(() => env.resolveFonts());
  assert.equal(env.q('.im-loader').dataset.state, 'loading');
  await env.event('animationend', 'animationName', 'unrelated-animation', '.im-loader__body');
  assert.equal(env.q('.im-loader').dataset.state, 'loading');
  await env.event('animationend', 'animationName', 'im-loader-enter', '.im-loader__body');
  assert.equal(env.q('.im-loader').dataset.state, 'leaving');
});

test('the original HTML artwork survives StrictMode and is removed once without a duplicate loader', async (t) => {
  const env = await loader(t, { bootstrap: true, ready: true });
  const art = env.q('.im-loader__art');
  assert.equal(document.querySelectorAll('#im-boot-loader').length, 1);
  await env.action(() => env.resolveFonts());
  await env.event('animationend', 'animationName', 'im-loader-enter', '.im-loader__body');
  assert.equal(env.q('.im-loader__art'), art, 'React keeps the same animated SVG image alive');
  await env.event('transitionend', 'propertyName', 'opacity');
  assert.equal(env.completions, 1); assert.equal(env.q('.im-loader'), null);
  assert.equal(document.documentElement.classList.contains('im-booting'), false);
});

test('reduced motion skips the entrance and exit delay while preserving real readiness', async (t) => {
  const env = await loader(t, { reduced: true });
  await env.action(() => env.resolveFonts());
  assert.equal(env.completions, 0);
  await env.render(true);
  assert.equal(env.completions, 1);
  assert.equal(document.body.style.overflow, '');
});

test('slow scene loading offers an explicit entry and clears every pending timer on unmount', async (t) => {
  const env = await loader(t, { fakeTimers: true });
  const skip = env.q('.im-loader__skip'); assert.equal(skip.hidden, true);
  await env.action(() => [...env.timers.values()].find((timer) => timer.delay === 6000).callback());
  assert.equal(skip.hidden, false);
  await env.action(() => skip.click());
  assert.equal(env.completions, 1, 'the visitor can enter the native site while the scene is still pending');
  assert.equal(document.body.style.overflow, '');
  await env.action(() => env.root.unmount());
  assert.equal(env.timers.size, 0);
  await env.action(() => env.resolveFonts());
  assert.equal(env.completions, 1, 'late resources cannot restart a finished loader');
});

test('closing a pending bootstrap loader cancels it and releases scroll without a late callback', async (t) => {
  const env = await loader(t, { bootstrap: true, fakeTimers: true });
  await env.action(() => env.root.unmount());
  assert.equal(env.timers.size, 0); assert.equal(env.q('.im-loader'), null);
  await env.action(() => env.resolveFonts());
  assert.equal(env.completions, 0);
  assert.equal(document.documentElement.classList.contains('im-booting'), false);
});

test('the app releases loading after a rendered frame and never replays it during context recovery', async (t) => {
  const env = await environment();
  const { renderers } = await import('./renderer.mock.mjs');
  const { default: App } = await source('src/App.tsx', { three: new URL('./renderer.mock.mjs', import.meta.url).href });
  const root = createRoot(env.q('#root'));
  const action = async (fn) => act(async () => { await fn(); await env.settle(); });
  t.after(async () => { try { await action(() => root.unmount()); assert.equal(document.body.style.overflow, ''); assert.deepEqual(env.errors, []); } finally { env.cleanup(); } });
  await action(() => root.render(React.createElement(React.StrictMode, null, React.createElement(App))));
  await action(() => {});
  assert.ok(renderers.at(-1).frames > 0, 'a real Stage frame exists before readiness is reported');
  assert.equal(env.q('.im-experience').hasAttribute('inert'), true);
  await env.finishLoading(action);
  assert.equal(env.q('.im-loader'), null);
  assert.equal(env.q('.im-experience').hasAttribute('inert'), false);
  assert.equal(document.body.style.overflow, '');
  const canvas = env.q('canvas');
  await action(() => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await action(() => canvas.dispatchEvent(new Event('webglcontextrestored')));
  await action(() => {});
  assert.equal(env.q('.im-stage').dataset.status, 'ready');
  assert.equal(env.q('.im-loader'), null, 'recovering graphics cannot replay the introduction or re-lock scrolling');
  assert.equal(document.body.style.overflow, '');
});
