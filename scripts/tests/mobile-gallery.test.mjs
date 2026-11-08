import assert from 'node:assert/strict';
import test from 'node:test';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { source, environment } from './helpers.mjs';

async function app(t) {
  const env = await environment({ hash: '#demos', width: 390, height: 844 });
  const { default: App } = await source('src/App.tsx');
  const root = createRoot(env.q('#root'));
  env.action = async (callback) => act(async () => { await callback(); await env.settle(); });
  t.after(async () => { try { await env.action(() => root.unmount()); assert.deepEqual(env.errors, []); } finally { env.cleanup(); } });
  await env.action(() => root.render(React.createElement(React.StrictMode, null, React.createElement(App))));
  await env.action(() => {});
  await env.finishLoading(env.action);
  return env;
}

test('direct mobile controls browse all projects, reflect filters and finish the final progress segment without adding history', async (t) => {
  const env = await app(t);
  const { projects } = await source('src/data/projects.ts');
  const next = env.q('button[aria-label="نمونه‌کار بعدی"]');
  const previous = env.q('button[aria-label="نمونه‌کار قبلی"]');
  const entries = history.length;
  assert.equal(previous.disabled, true);
  await env.action(() => env.w.scrollTo({ top: env.workTop + .4 }));
  assert.equal(env.q('.im-project'), null, 'subpixel scroll rounding leaves the resting card collapsed');
  for (let index = 0; index < projects.length; index++) {
    const active = env.q('.im-orbit__captions > li:not([hidden])');
    assert.equal(active.querySelector('h3').textContent, projects[index].title.split('؛')[0]);
    assert.equal(active.querySelector('.im-orbit__visit').getAttribute('href'), projects[index].url);
    assert.equal(active.querySelector('.im-orbit__visit').target, '_blank');
    assert.equal(env.q('.im-orbit__steps [data-state="current"]').previousElementSibling === null, index === 0);
    assert.equal(env.q('.im-work-track').style.getPropertyValue('--orbit-accent'), projects[index].accent);
    if (index < projects.length - 1) await env.action(() => next.click());
  }
  assert.equal(next.disabled, true);
  assert.equal(previous.disabled, false);
  assert.equal(history.length, entries);
  const height = env.q('.im-work--orbit').offsetHeight;
  await env.action(() => env.w.scrollTo({ top: env.workTop + (8 * 1.2 + .8) * height }));
  assert.ok(Math.abs(Number(env.q('.im-work-track').style.getPropertyValue('--step-progress')) - 1) < 1e-8);
  await env.action(() => [...document.querySelectorAll('.im-filter')].find((button) => button.textContent === 'مد و پوشاک').click());
  assert.equal(next.disabled, true);
  assert.equal(previous.disabled, true);
  assert.equal(document.querySelectorAll('.im-orbit__steps > span').length, 1);
  assert.equal(env.q('.im-orbit__captions > li:not([hidden]) .im-orbit__visit').getAttribute('href'), '/demos/fashion/');
});

test('the persistent mobile caption closes a routed project and keeps direct demo actions out of drag navigation', async (t) => {
  const env = await app(t);
  await env.action(() => env.q('.im-orbit__project-link').click());
  assert.equal(location.hash, '#work/fashion');
  const close = env.q('.im-orbit__captions > li:not([hidden]) .im-orbit__mobile-actions button');
  assert.equal(close.hidden, false);
  const pointer = (target, type, x) => {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: 400 });
    Object.defineProperties(event, { pointerId: { value: 22 }, pointerType: { value: 'touch' } });
    target.dispatchEvent(event);
  };
  const y = env.scroll;
  const visit = env.q('.im-orbit__captions > li:not([hidden]) .im-orbit__visit');
  await env.action(() => { pointer(visit, 'pointerdown', 150); pointer(visit, 'pointermove', 240); pointer(visit, 'pointerup', 240); });
  assert.equal(env.scroll, y);
  await env.action(() => close.click());
  await env.action(() => env.advance(50));
  assert.equal(location.hash, '#demos');
  assert.equal(env.scroll, env.workTop);
  assert.equal(env.q('.im-project'), null);
  assert.equal(env.q('.im-orbit__captions > li:not([hidden]) .im-orbit__mobile-actions button').hidden, true);
});
