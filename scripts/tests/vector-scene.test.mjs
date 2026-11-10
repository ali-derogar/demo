import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Texture, CubeTexture, Vector3, Vector2, Raycaster, MeshBasicMaterial } from 'three';
import { environment, source } from './helpers.mjs';
import { decodeReference } from '../lib/vector-assets.mjs';
import { renderers, control } from './vector-renderer.mock.mjs';
const root = new URL('../../public/demos/vector/assets/reference/', import.meta.url);
const models = new Map();
const model = (path) => { if (!models.has(path)) models.set(path, decodeReference(new URL(path, root))); return models.get(path); };
function provider() {
  const textures = [], cache = new Map();
  return { textures, disposed: false, model,
    async texture(path) { if (!cache.has(path)) { const texture = new Texture(); texture.name = path; texture.flipY = false; texture.addEventListener('dispose', () => { texture.released = true; }); textures.push(texture); cache.set(path, texture); } return cache.get(path); },
    async cube() { return new CubeTexture(); },
    dispose() { this.disposed = true; this.textures.forEach((texture) => texture.dispose()); },
  };
}
async function fixture(t, config = {}) {
  const env = await environment(config), assets = provider(); let app;
  document.body.innerHTML = '<div id="showroom"><img alt="استودیو"><canvas></canvas></div>';
  env.w.HTMLMediaElement.prototype.load = function () {};
  env.w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  env.w.HTMLMediaElement.prototype.pause = function () {};
  t.after(() => { app?.dispose(); env.cleanup(); control.unavailable = false; });
  const module = await source('src/demos/vector/scene.ts', { three: new URL('./vector-renderer.mock.mjs', import.meta.url).href });
  const host = document.querySelector('#showroom');
  return { env, assets, host, module, mount(options = {}) { app = module.mountShowroom(host, { onProductSelect() {}, assets, ...options }); return app; } };
}

test('Vector uses verified reference GLBs, UV-matched baked materials and the original three capsule placements', async () => {
  const manifest = JSON.parse(await readFile(new URL('ATTRIBUTION.json', root), 'utf8'));
  assert.equal(manifest.files.length, 55);
  for (const item of manifest.files) {
    const bytes = await readFile(new URL(item.file, root)); assert.equal(bytes.length, item.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256);
  }
  assert.equal(manifest.files.find((f) => f.file === 'models/main/MainStudio.glb').sha256, '280168e3d1b7f3f4e018cc45edf2a004778e7b381b1f3a58c21407bcb09c6ac3');
  const { buildOverview, buildRoom, buildDetail } = await source('src/demos/vector/scene.ts');
  const { overviewMaps, roomMaps, detailMaps, capsules } = await source('src/demos/vector/studio.ts');
  const assets = provider(), maps = Object.fromEntries(await Promise.all(Object.keys(overviewMaps).map(async (key) => [key, await assets.texture(overviewMaps[key])])));
  const overview = buildOverview(await model('models/main/MainStudio.glb'), maps);
  assert.equal(overview.world.children.length, 4);
  for (const [i, shirt] of overview.shirts.entries()) {
    assert.equal(shirt.geometry.attributes.position.count, 15598); assert.ok(shirt.geometry.attributes.uv.count > 15000);
    assert.ok(shirt.material instanceof MeshBasicMaterial); assert.equal(shirt.material.map.name, overviewMaps[capsules[i].theme + 'Shirt']);
    assert.deepEqual(shirt.position.toArray(), capsules[i].position);
  }
  for (const theme of ['white', 'sport', 'gray']) {
    const cap = theme[0].toUpperCase() + theme.slice(1), maps = Object.fromEntries(await Promise.all(Object.entries(roomMaps[theme]).map(async ([key, path]) => [key, await assets.texture(path)])));
    const room = buildRoom(theme, await model(`models/${theme}/${cap}Studio.glb`), maps); assert.equal(room.shirt.position.y, .7); assert.ok(room.world.children.length >= 4);
    const detailTextures = Object.fromEntries(await Promise.all(Object.entries(detailMaps[theme]).map(async ([key, path]) => [key, await assets.texture(path)])));
    const detail = buildDetail(theme, await model('models/ShirtScrolling.glb'), detailTextures); assert.ok(detail.texts.children.length > 80); assert.equal(detail.marquees.length, 4);
  }
});

test('Vector actual reference shirts are pickable and each mobile capsule moves to the center without fabricated geometry', async (t) => {
  const { env, host, mount } = await fixture(t, { width: 390, height: 844, reduced: true });
  const selections = [], app = mount({ onProductSelect: (id) => selections.push(id) }); await app.ready;
  for (const index of [0, 1, 2]) {
    app.focus(index); await env.advance(48); const renderer = renderers.at(-1), shirt = renderer.scene.getObjectByName(['Shirt_White', 'Shirt_Sport', 'Shirt_Gray'][index]);
    const center = new Vector3(0, .04, 0); shirt.localToWorld(center); center.project(renderer.camera); assert.ok(Math.abs(center.x) < .05);
    const caster = new Raycaster(); caster.setFromCamera(new Vector2(center.x, center.y), renderer.camera); assert.ok(caster.intersectObject(shirt).length > 0);
    const bounds = host.querySelector('canvas').getBoundingClientRect(), x = bounds.left + (center.x * .5 + .5) * bounds.width, y = bounds.top + (.5 - center.y * .5) * bounds.height;
    for (const type of ['pointerdown', 'pointerup']) { const event = new Event(type); Object.defineProperties(event, { clientX: { value: x }, clientY: { value: y }, pointerId: { value: 1 } }); host.querySelector('canvas').dispatchEvent(event); }
  }
  assert.deepEqual(selections, ['tee-02', 'tee-03', 'tee-01']); assert.equal(host.dataset.scene, 'ready');
});

test('Vector product rooms, rotating detail sphere and film load on demand and scroll choreography is reversible', async (t) => {
  const { env, mount } = await fixture(t, { width: 1440, height: 900, reduced: true });
  const app = mount(); await app.ready; await env.advance(32); assert.equal(app.getState().detailReady, false);
  await app.select('tee-02'); await env.advance(48); assert.equal(app.getState().filmReady, true);
  const renderer = renderers.at(-1); assert.ok(renderer.scene.getObjectByName('DJ_Table'));
  app.setProgress(.5); await env.advance(32); const detail = renderer.scene.getObjectByName('Sphere_ENV').parent; const halfwayYaw = detail.rotation.y;
  assert.ok(Math.abs(halfwayYaw) > 1); app.rotate(.5); await env.advance(32); assert.ok(Math.abs(detail.rotation.y - halfwayYaw - .5) < .00001);
  app.setProgress(.99); await env.advance(32); assert.ok(renderer.scene.children.some((g) => g.visible && g.children?.some((o) => o.userData.action === 'shop')));
  app.setProgress(.5); await env.advance(32); assert.ok(Math.abs(detail.rotation.y - halfwayYaw - .5) < .00001);
  app.setProgress(0); await env.advance(32); assert.equal(app.getState().progress, 0);
  await app.select(null); await env.advance(32); assert.equal(renderer.scene.getObjectByName('DJ_Table'), undefined); assert.equal(app.getState().selected, null);
});

test('Vector pauses GPU work in overlays, offscreen and background, recovers context and releases loaded resources', async (t) => {
  const { env, assets, host, mount } = await fixture(t, { width: 1440, height: 900 });
  let intersect; const original = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver = class { constructor(fn) { intersect = fn; } observe(target) { intersect([{ target, isIntersecting: true }]); } disconnect() {} };
  t.after(() => { globalThis.IntersectionObserver = original; });
  const app = mount(); await app.ready; await env.advance(32); const renderer = renderers.at(-1);
  document.dispatchEvent(new CustomEvent('vector:overlay', { detail: { open: true } })); const paused = renderer.frames; await env.advance(100); assert.equal(renderer.frames, paused);
  document.dispatchEvent(new CustomEvent('vector:overlay', { detail: { open: false } })); await env.advance(32); assert.ok(renderer.frames > paused);
  intersect([{ isIntersecting: false }]); const offscreen = renderer.frames; await env.advance(32); assert.equal(renderer.frames, offscreen); intersect([{ isIntersecting: true }]);
  Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); const background = renderer.frames; await env.advance(32); assert.equal(renderer.frames, background);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); await env.advance(32);
  const canvas = host.querySelector('canvas'); canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })); const lost = renderer.frames; await env.advance(32); assert.equal(renderer.frames, lost); assert.equal(host.dataset.scene, 'fallback');
  canvas.dispatchEvent(new Event('webglcontextrestored')); await env.advance(32); assert.equal(host.dataset.scene, 'ready');
  app.dispose(); const stopped = renderer.frames; await env.advance(48); assert.equal(renderer.frames, stopped); assert.ok(renderer.disposed); assert.ok(assets.disposed); assert.ok(assets.textures.every((t) => t.released)); assert.deepEqual(env.errors, []);
});

test('Vector reduced motion renders only changes and vertical touch scroll never rotates the selected garment', async (t) => {
  const { env, host, mount } = await fixture(t, { reduced: true }); const app = mount(); await app.ready; await env.advance(64);
  const renderer = renderers.at(-1), frames = renderer.frames; await env.advance(160); assert.equal(renderer.frames, frames);
  await app.select('tee-01'); await env.advance(32);
  function pointer(type, x, y) { const event = new Event(type); Object.defineProperties(event, { clientX: { value: x }, clientY: { value: y }, pointerId: { value: 1 } }); host.querySelector('canvas').dispatchEvent(event); }
  pointer('pointerdown', 100, 100); pointer('pointermove', 102, 150); pointer('pointerup', 102, 150); assert.equal(app.getState().manualYaw, 0);
  pointer('pointerdown', 100, 100); pointer('pointermove', 150, 102); pointer('pointerup', 150, 102); assert.ok(app.getState().manualYaw > 0);
  await env.advance(32); const rotated = renderer.frames; await env.advance(160); assert.equal(renderer.frames, rotated); assert.deepEqual(env.errors, []);
});

test('Vector ignores an older product response after a new selection and handles asset failure without losing the poster', async (t) => {
  const { env, assets, mount, host } = await fixture(t, { reduced: true }); let release;
  const gate = new Promise((resolve) => { release = resolve; });
  assets.model = async (path) => { if (path === 'models/white/WhiteStudio.glb') await gate; return model(path); };
  const app = mount(); await app.ready;
  const older = app.select('tee-02'); await app.select('tee-01'); release(); await older; await env.advance(32);
  assert.equal(app.getState().selected, 'tee-01'); assert.equal(renderers.at(-1).scene.getObjectByName('DJ_Table'), undefined);
  assert.ok(renderers.at(-1).scene.getObjectByName('Asset')); app.dispose(); assert.equal(host.dataset.scene, 'poster');
});

test('Vector missing WebGL or failed model loading retains real asset posters and safe navigation controls', async (t) => {
  const { env, assets, mount, host } = await fixture(t);
  control.unavailable = true; const fallback = mount(); assert.equal(host.dataset.scene, 'fallback'); assert.ok(host.querySelector('img'));
  assert.doesNotThrow(() => { fallback.focus(2); fallback.rotate(1); fallback.zoom(.2); fallback.dispose(); });
  control.unavailable = false; assets.model = async () => { throw new Error('asset unavailable'); };
  const failed = mount(); await assert.rejects(failed.ready); await env.advance(32); assert.equal(host.dataset.scene, 'fallback'); assert.ok(host.querySelector('img'));
});
