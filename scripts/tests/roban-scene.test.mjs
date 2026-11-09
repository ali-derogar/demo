import assert from 'node:assert/strict';
import test from 'node:test';
import { environment, source } from './helpers.mjs';
import { renderers, environments, rendererControl } from './roban-renderer.mock.mjs';

test('Roban showroom pauses outside the viewport, in background and under dialogs; restores WebGL and releases resources', async (t) => {
  const env = await environment({ width: 1440, height: 900 });
  t.after(() => env.cleanup());
  document.body.innerHTML = '<section class="hero"><div id="showroom"><canvas></canvas></div></section>';
  let visibility;
  const originalObserver = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver = class { constructor(fn) { visibility = fn; } observe(target) { visibility([{ target, isIntersecting: true }]); } disconnect() {} };
  t.after(() => { globalThis.IntersectionObserver = originalObserver; });
  const { mountShowroom } = await source('src/demos/roban/scene.ts', { three: new URL('./roban-renderer.mock.mjs', import.meta.url).href });
  const host = document.querySelector('#showroom'), canvas = host.querySelector('canvas');
  const showroom = mountShowroom(host, { onProductSelect() {} });
  t.after(() => showroom.dispose());
  await env.advance(32);
  const renderer = renderers.at(-1);
  assert.equal(host.dataset.scene, 'ready'); assert.ok(renderer.frames > 0);
  const initial = renderer.frames;
  visibility([{ isIntersecting: false }]); await env.advance(32); assert.equal(renderer.frames, initial);
  visibility([{ isIntersecting: true }]); await env.advance(32); assert.ok(renderer.frames > initial);
  document.dispatchEvent(new CustomEvent('roban:overlay', { detail: { open: true } }));
  const paused = renderer.frames; await env.advance(32); assert.equal(renderer.frames, paused);
  document.dispatchEvent(new CustomEvent('roban:overlay', { detail: { open: false } })); await env.advance(32); assert.ok(renderer.frames > paused);
  Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'));
  const background = renderer.frames; await env.advance(32); assert.equal(renderer.frames, background);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); await env.advance(32); assert.ok(renderer.frames > background);
  const oldEnvironment = environments.at(-1);
  canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })); assert.equal(host.dataset.scene, 'fallback');
  const lost = renderer.frames; await env.advance(32); assert.equal(renderer.frames, lost);
  canvas.dispatchEvent(new Event('webglcontextrestored')); await env.advance(32);
  assert.equal(host.dataset.scene, 'ready'); assert.ok(oldEnvironment.disposed); assert.notEqual(environments.at(-1), oldEnvironment);
  env.setViewport(390, 844); await env.advance(32); assert.equal(renderer.fov, 40); assert.ok(renderer.pixelRatio <= 1.5);
  showroom.dispose(); const stopped = renderer.frames; await env.advance(32); assert.equal(renderer.frames, stopped); assert.ok(renderer.disposed); assert.ok(environments.at(-1).disposed);
  assert.equal(host.dataset.scene, 'poster'); assert.deepEqual(env.errors, []);
});


test('Roban keeps its poster and product controls available when WebGL cannot initialize', async (t) => {
  const env = await environment(); t.after(() => env.cleanup());
  document.body.innerHTML = '<section class="hero"><div id="showroom"><img alt="ویترین روبان"><canvas></canvas><button>دیدن محصول</button></div></section>';
  const { mountShowroom } = await source('src/demos/roban/scene.ts', { three: new URL('./roban-renderer.mock.mjs', import.meta.url).href });
  rendererControl.unavailable = true; t.after(() => { rendererControl.unavailable = false; });
  const host = document.querySelector('#showroom'); const app = mountShowroom(host, { onProductSelect() {} });
  assert.equal(host.dataset.scene, 'fallback'); assert.ok(host.querySelector('img')); assert.ok(host.querySelector('button'));
  assert.doesNotThrow(() => app.dispose()); assert.deepEqual(env.errors, []);
});
