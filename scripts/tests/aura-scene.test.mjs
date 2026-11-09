import assert from 'node:assert/strict';
import test from 'node:test';
import { environment, source } from './helpers.mjs';
import { renderers, environments, rendererControl } from './aura-renderer.mock.mjs';

const markup = '<div id="sculpture"><canvas></canvas><button class="atlas-hotspot" data-region="botox">پیشانی</button><button data-rotate="1">چرخش</button><span id="scene-instruction">برای چرخاندن، بکشید</span></div>';
test('Aura suspends the GPU offscreen, in background and under booking, recovers context and releases its resources', async (t) => {
  const env = await environment({ width: 390, height: 844 }); t.after(() => env.cleanup());
  document.body.innerHTML = markup;
  let visibility;
  const original = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver = class { constructor(fn) { visibility = fn; } observe(target) { visibility([{ target, isIntersecting: true }]); } disconnect() {} };
  t.after(() => { globalThis.IntersectionObserver = original; });
  const { mountSculpture } = await source('src/demos/aura/scene.ts', { three: new URL('./aura-renderer.mock.mjs', import.meta.url).href });
  const host = document.querySelector('#sculpture'), canvas = host.querySelector('canvas'), app = mountSculpture(host); t.after(() => app.dispose());
  await env.advance(32); const renderer = renderers.at(-1);
  assert.equal(host.dataset.scene, 'ready'); assert.ok(renderer.frames > 0); assert.ok(renderer.pixelRatio <= 1.5);
  assert.match(host.querySelector('.atlas-hotspot').style.getPropertyValue('--pin-x'), /px$/);
  visibility([{ isIntersecting: false }]); const offscreen = renderer.frames; await env.advance(64); assert.equal(renderer.frames, offscreen);
  visibility([{ isIntersecting: true }]); await env.advance(32); assert.ok(renderer.frames > offscreen);
  document.dispatchEvent(new CustomEvent('aura:overlay', { detail: { open: true } })); const covered = renderer.frames; await env.advance(64); assert.equal(renderer.frames, covered);
  document.dispatchEvent(new CustomEvent('aura:overlay', { detail: { open: false } })); await env.advance(32); assert.ok(renderer.frames > covered);
  Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); const background = renderer.frames; await env.advance(64); assert.equal(renderer.frames, background);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); await env.advance(32); assert.ok(renderer.frames > background);
  const oldEnvironment = environments.at(-1); canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })); assert.equal(host.dataset.scene, 'fallback');
  const lost = renderer.frames; await env.advance(32); assert.equal(renderer.frames, lost);
  canvas.dispatchEvent(new Event('webglcontextrestored')); await env.advance(32); assert.equal(host.dataset.scene, 'ready'); assert.ok(oldEnvironment.disposed);
  app.dispose(); const stopped = renderer.frames; await env.advance(64); assert.equal(renderer.frames, stopped); assert.ok(renderer.disposed); assert.ok(environments.at(-1).disposed); assert.equal(host.dataset.scene, 'poster'); assert.deepEqual(env.errors, []);
});

test('Aura reduced motion draws only when needed while keeping rotation controls functional', async (t) => {
  const env = await environment({ reduced: true }); document.body.innerHTML = markup;
  const { mountSculpture } = await source('src/demos/aura/scene.ts', { three: new URL('./aura-renderer.mock.mjs', import.meta.url).href });
  const app = mountSculpture(document.querySelector('#sculpture')); t.after(() => { app.dispose(); env.cleanup(); }); await env.advance(32);
  const renderer = renderers.at(-1), resting = renderer.frames; await env.advance(200); assert.equal(renderer.frames, resting);
  document.querySelector('[data-rotate]').click(); await env.advance(32); assert.ok(renderer.frames > resting);
  const rotated = renderer.frames; await env.advance(200); assert.equal(renderer.frames, rotated);
});

test('Aura retains the fallback sculpture and region buttons when WebGL is unavailable', async (t) => {
  const env = await environment(); t.after(() => env.cleanup()); document.body.innerHTML = markup;
  const { mountSculpture } = await source('src/demos/aura/scene.ts', { three: new URL('./aura-renderer.mock.mjs', import.meta.url).href });
  rendererControl.unavailable = true; t.after(() => { rendererControl.unavailable = false; });
  const host = document.querySelector('#sculpture'), app = mountSculpture(host);
  assert.equal(host.dataset.scene, 'fallback'); assert.ok(host.querySelector('.atlas-hotspot')); assert.equal(host.querySelector('[data-rotate]').hidden, true);
  assert.doesNotThrow(() => app.select('botox')); assert.doesNotThrow(() => app.dispose());
});
