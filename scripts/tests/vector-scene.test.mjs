import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Vector3, Vector2, Raycaster, MeshStandardMaterial, Box3, Mesh } from 'three';
import { environment, source } from './helpers.mjs';
import { decodeCollection } from '../lib/vector-assets.mjs';
import { renderers, control } from './vector-renderer.mock.mjs';
const root = new URL('../../public/demos/vector/assets/collection/', import.meta.url);
const models = new Map();
const model = (path) => { if (!models.has(path)) models.set(path, decodeCollection(new URL(path, root))); return models.get(path); };
function provider() {
  const textures = new Set();
  return { textures, disposed: false,
    async model(path) {
      const nodes = await model(path);
      for (const node of Object.values(nodes)) node.traverse((object) => {
        if (object instanceof Mesh && object.material.normalMap) { const texture = object.material.normalMap; textures.add(texture); texture.addEventListener('dispose', () => { texture.released = true; }); }
      });
      return nodes;
    },
    dispose() { this.disposed = true; textures.forEach((texture) => texture.dispose()); },
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

test('Vector ships the supplied clothing and two hoodie colorways and independent studio lettering', async () => {
  const manifest = JSON.parse(await readFile(new URL('ATTRIBUTION.json', root), 'utf8'));
  for (const item of manifest.files) {
    const bytes = await readFile(new URL(item.file, root)); assert.equal(bytes.length, item.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256);
  }
  const { buildOverview, buildRoom, buildDetail } = await source('src/demos/vector/scene.ts');
  const { capsules } = await source('src/demos/vector/studio.ts');
  const nodes = { ...await model('collection.glb'), ...await model('lettering.glb') };
  const overview = buildOverview(nodes), counts = [];
  assert.equal(overview.world.children.length, 4);
  for (const [i, garment] of overview.shirts.entries()) {
    let count = 0, triangles = 0, fabric = false;
    garment.traverse((object) => { if (object instanceof Mesh) { count += object.geometry.attributes.position.count; triangles += object.geometry.index.count / 3; assert.ok(object.material instanceof MeshStandardMaterial); fabric ||= !!object.material.normalMap; } });
    assert.ok(count > 10000); assert.ok(fabric); counts.push(count);
    assert.equal(garment.userData.sourceArchive, i < 2 ? 'models/Blender.zip' : 'models/Jacket+70_obj.zip');
    assert.equal(garment.userData.sourceModel, i < 2 ? 'DG100024' : 'W-Jacket 70');
    if (i < 2) assert.equal(triangles, 430254, 'The supplied hoodie surface must retain its original triangles');
    assert.deepEqual(garment.position.toArray(), capsules[i].position);
    const bounds = new Box3().setFromObject(garment).getSize(new Vector3()); assert.ok(bounds.x > .6 && bounds.y > .5 && bounds.z > .1);
    const room = buildRoom(capsules[i].theme, nodes); assert.ok(room.world.getObjectByName('VECTOR original architecture'));
    const detail = buildDetail(capsules[i].theme, nodes); assert.ok(detail.world.getObjectByName('VECTOR pattern orbit')); assert.equal(detail.marquees.length, 4);
  }
  assert.equal(new Set(counts).size, 2);
  for (const file of ['src/demos/vector/scene.ts','src/demos/vector/assets.ts','src/demos/vector/design.ts','public/demos/vector/app.js','public/demos/vector/index.html']) {
    assert.doesNotMatch(await readFile(new URL('../../'+file, import.meta.url), 'utf8'), /adidas|Foot Locker|assets\/reference|ShirtScrolling/iu);
  }
});

test('Vector supplied garments are pickable and each mobile capsule moves to the center', async (t) => {
  const { env, host, mount } = await fixture(t, { width: 390, height: 844, reduced: true });
  const selections = [], app = mount({ onProductSelect: (id) => selections.push(id) }); await app.ready;
  for (const index of [0, 1, 2]) {
    app.focus(index); await env.advance(48); const renderer = renderers.at(-1), shirt = renderer.scene.getObjectByName(['CORE', 'DRIFT', 'SHELL'][index]);
    const center = new Vector3(0, .04, 0); shirt.localToWorld(center); center.project(renderer.camera); assert.ok(Math.abs(center.x) < .05);
    const caster = new Raycaster(); caster.setFromCamera(new Vector2(center.x, center.y), renderer.camera); assert.ok(caster.intersectObject(shirt, true).length > 0);
    const bounds = host.querySelector('canvas').getBoundingClientRect(), x = bounds.left + (center.x * .5 + .5) * bounds.width, y = bounds.top + (.5 - center.y * .5) * bounds.height;
    for (const type of ['pointerdown', 'pointerup']) { const event = new Event(type); Object.defineProperties(event, { clientX: { value: x }, clientY: { value: y }, pointerId: { value: 1 } }); host.querySelector('canvas').dispatchEvent(event); }
  }
  assert.deepEqual(selections, ['hoodie-03', 'hoodie-01', 'jacket-01']); assert.equal(host.dataset.scene, 'ready');
});

test('Vector product rooms, rotating detail and original collection installation load on demand and scroll choreography is reversible', async (t) => {
  const { env, mount } = await fixture(t, { width: 1440, height: 900, reduced: true });
  const app = mount(); await app.ready; await env.advance(32); assert.equal(app.getState().detailReady, false);
  await app.select('hoodie-03'); await env.advance(48); assert.equal(app.getState().filmReady, true);
  const renderer = renderers.at(-1); assert.ok(renderer.scene.getObjectByName('CORE'));
  app.setProgress(.5); await env.advance(32); const detail = renderer.scene.getObjectByName('VECTOR pattern orbit').parent; const halfwayYaw = detail.rotation.y;
  assert.ok(Math.abs(halfwayYaw) > 1); app.rotate(.5); await env.advance(32); assert.ok(Math.abs(detail.rotation.y - halfwayYaw - .5) < .00001);
  app.setProgress(.99); await env.advance(32); assert.ok(renderer.scene.children.some((g) => g.visible && g.children?.some((o) => o.userData.action === 'shop')));
  app.setProgress(.5); await env.advance(32); assert.ok(Math.abs(detail.rotation.y - halfwayYaw - .5) < .00001);
  app.setProgress(0); await env.advance(32); assert.equal(app.getState().progress, 0);
  await app.select(null); await env.advance(32); assert.equal(renderer.scene.getObjectByName('VECTOR pattern orbit'), undefined); assert.equal(app.getState().selected, null);
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
  app.dispose(); const stopped = renderer.frames; await env.advance(48); assert.equal(renderer.frames, stopped); assert.ok(renderer.disposed); assert.ok(assets.disposed); assert.ok([...assets.textures].every((t) => t.released)); assert.deepEqual(env.errors, []);
});

test('Vector reduced motion renders only changes and vertical touch scroll never rotates the selected garment', async (t) => {
  const { env, host, mount } = await fixture(t, { reduced: true }); const app = mount(); await app.ready; await env.advance(64);
  const renderer = renderers.at(-1), frames = renderer.frames; await env.advance(160); assert.equal(renderer.frames, frames);
  await app.select('jacket-01'); await env.advance(32);
  function pointer(type, x, y) { const event = new Event(type); Object.defineProperties(event, { clientX: { value: x }, clientY: { value: y }, pointerId: { value: 1 } }); host.querySelector('canvas').dispatchEvent(event); }
  pointer('pointerdown', 100, 100); pointer('pointermove', 102, 150); pointer('pointerup', 102, 150); assert.equal(app.getState().manualYaw, 0);
  pointer('pointerdown', 100, 100); pointer('pointermove', 150, 102); pointer('pointerup', 150, 102); assert.ok(app.getState().manualYaw > 0);
  await env.advance(32); const rotated = renderer.frames; await env.advance(160); assert.equal(renderer.frames, rotated); assert.deepEqual(env.errors, []);
});

test('Vector ignores an older product response after a new selection and handles asset failure without losing the poster', async (t) => {
  const { env, assets, mount, host } = await fixture(t, { reduced: true }); let release;
  const gate = new Promise((resolve) => { release = resolve; });
  let hold = false; assets.model = async (path) => { if (hold && path === 'collection.glb') { hold = false; await gate; } return model(path); };
  const app = mount(); await app.ready;
  hold = true; const older = app.select('hoodie-03'); await app.select('jacket-01'); release(); await older; await env.advance(32);
  assert.equal(app.getState().selected, 'jacket-01'); assert.equal(renderers.at(-1).scene.getObjectByName('VECTOR collection installation').getObjectByName('CORE'), undefined);
  assert.ok(renderers.at(-1).scene.getObjectByName('SHELL')); app.dispose(); assert.equal(host.dataset.scene, 'poster');
});

test('Vector missing WebGL or failed model loading retains real asset posters and safe navigation controls', async (t) => {
  const { env, assets, mount, host } = await fixture(t);
  control.unavailable = true; const fallback = mount(); assert.equal(host.dataset.scene, 'fallback'); assert.ok(host.querySelector('img'));
  assert.doesNotThrow(() => { fallback.focus(2); fallback.rotate(1); fallback.zoom(.2); fallback.dispose(); });
  control.unavailable = false; assets.model = async () => { throw new Error('asset unavailable'); };
  const failed = mount(); await assert.rejects(failed.ready); await env.advance(32); assert.equal(host.dataset.scene, 'fallback'); assert.ok(host.querySelector('img'));
});
