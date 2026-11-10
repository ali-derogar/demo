import assert from 'node:assert/strict';
import test from 'node:test';
import { PerspectiveCamera, Vector3, Raycaster, Vector2, Mesh } from 'three';
import { environment, source } from './helpers.mjs';
import { renderers, environments, rendererControl } from './roban-renderer.mock.mjs';

test('Vector sewn garments have finite volume, fit overview and selected cameras and can be picked on desktop and mobile', async () => {
  const { createShowroom, showroomFrame } = await source('src/demos/vector/scene.ts');
  for (const [width, height] of [[1440, 450], [768, 500], [390, 343]]) {
    const { world, garments } = createShowroom(width < 768);
    assert.deepEqual(garments.map((g) => g.name), ['tee-01', 'hoodie-01', 'jacket-01']);
    const camera = new PerspectiveCamera(38, width / height, .1, 80);
    for (const selected of [null, 0, 1, 2]) {
      const frame = showroomFrame(camera.aspect, selected, 0); camera.position.copy(frame.position); camera.lookAt(frame.target); camera.updateMatrixWorld(); world.updateMatrixWorld(true);
      const visible = selected === null ? garments : [garments[selected]];
      for (const garment of visible) {
        let count = 0;
        garment.traverse((object) => { if (!object.isMesh) return; const vertices = object.geometry.attributes.position;
          for (let i = 0; i < vertices.count; i += 3) {
            const vertex = new Vector3().fromBufferAttribute(vertices, i).applyMatrix4(object.matrixWorld).project(camera);
            assert.ok(Number.isFinite(vertex.x) && Number.isFinite(vertex.y) && Number.isFinite(vertex.z));
            assert.ok(Math.abs(vertex.x) < 1 && Math.abs(vertex.y) < 1, `${garment.name} fits ${width} selected=${selected}: ${vertex.toArray()}`); count++;
          }
        });
        assert.ok(count > 1000, 'substantial sewn geometry');
        const point = garment.localToWorld(new Vector3(0, 0, .3)).project(camera), raycaster = new Raycaster(); raycaster.setFromCamera(new Vector2(point.x, point.y), camera);
        assert.ok(raycaster.intersectObject(garment, true).length > 0);
      }
    }
    world.traverse((o) => { if (o instanceof Mesh) { o.geometry.dispose(); o.material.normalMap?.dispose(); o.material.dispose(); } });
  }
});

test('Vector scene selection, colors, full rotation, bounded zoom, overlay pauses, background and WebGL restoration use the real scene', async (t) => {
  const env = await environment({ width: 1440, height: 900 }); t.after(() => env.cleanup());
  document.body.innerHTML = '<div id="showroom"><img alt="استودیو"><canvas></canvas></div>';
  let visibility; const original = globalThis.IntersectionObserver;
  globalThis.IntersectionObserver = class { constructor(fn) { visibility = fn; } observe(target) { visibility([{ target, isIntersecting: true }]); } disconnect() {} };
  t.after(() => { globalThis.IntersectionObserver = original; });
  const { mountShowroom } = await source('src/demos/vector/scene.ts', { three: new URL('./roban-renderer.mock.mjs', import.meta.url).href });
  const host = document.querySelector('#showroom'), canvas = host.querySelector('canvas');
  const app = mountShowroom(host, { onProductSelect() {} }); t.after(() => app.dispose());
  await env.advance(80); const renderer = renderers.at(-1); assert.equal(host.dataset.scene, 'ready');
  app.select('hoodie-01'); app.setColor('hoodie-01', '#dcd7c9'); app.rotate(Math.PI * 2); app.zoom(20); await env.advance(1600);
  assert.equal(app.getState().selected, 1); assert.equal(app.getState().rotations[1], Math.PI * 2); assert.equal(app.getState().zoom, 1.25);
  const garment = renderer.scene.getObjectByName('hoodie-01'); assert.equal(garment.userData.fabric[0].color.getHexString(), 'dcd7c9');
  assert.ok(Math.abs(garment.rotation.y - Math.PI * 2) < .02);
  document.dispatchEvent(new CustomEvent('vector:overlay', { detail: { open: true } })); const paused = renderer.frames; await env.advance(60); assert.equal(renderer.frames, paused);
  document.dispatchEvent(new CustomEvent('vector:overlay', { detail: { open: false } })); await env.advance(40); assert.ok(renderer.frames > paused);
  visibility([{ isIntersecting: false }]); const offscreen = renderer.frames; await env.advance(40); assert.equal(renderer.frames, offscreen);
  visibility([{ isIntersecting: true }]); await env.advance(40); assert.ok(renderer.frames > offscreen);
  Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); const background = renderer.frames; await env.advance(40); assert.equal(renderer.frames, background);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); await env.advance(40);
  const oldEnvironment = environments.at(-1); canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })); const lost = renderer.frames; await env.advance(40); assert.equal(renderer.frames, lost); assert.equal(host.dataset.scene, 'fallback');
  canvas.dispatchEvent(new Event('webglcontextrestored')); await env.advance(40); assert.ok(oldEnvironment.disposed); assert.equal(host.dataset.scene, 'ready'); assert.equal(app.getState().selected, 1); assert.equal(garment.userData.fabric[0].color.getHexString(), 'dcd7c9');
  app.select(null); await env.advance(30); assert.equal(app.getState().selected, null);
  env.setViewport(390, 844); await env.advance(40); assert.ok(renderer.pixelRatio <= 1.5);
  app.dispose(); const final = renderer.frames; await env.advance(40); assert.equal(renderer.frames, final); assert.ok(renderer.disposed); assert.ok(environments.at(-1).disposed);
  assert.deepEqual(env.errors, []);
});

test('Vector maximum zoom preserves all garment vertices through a complete turn in the narrow mobile frame', async () => {
  const { createShowroom, showroomFrame } = await source('src/demos/vector/scene.ts');
  const { world, garments } = createShowroom(true), camera = new PerspectiveCamera(38, 390 / 343, .1, 80);
  for (const [index, garment] of garments.entries()) for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    garment.rotation.y = angle; world.updateMatrixWorld(true);
    const frame = showroomFrame(camera.aspect, index, 1.25); camera.position.copy(frame.position); camera.lookAt(frame.target); camera.updateMatrixWorld();
    garment.traverse((object) => { if (!object.isMesh) return; const vertices = object.geometry.attributes.position;
      for (let i = 0; i < vertices.count; i++) { const p = new Vector3().fromBufferAttribute(vertices, i).applyMatrix4(object.matrixWorld).project(camera); assert.ok(Math.abs(p.x) < 1 && Math.abs(p.y) < 1, `${garment.name} angle ${angle} remains framed: ${p.toArray()}`); }
    });
  }
  world.traverse((o) => { if (o instanceof Mesh) { o.geometry.dispose(); o.material.normalMap?.dispose(); o.material.dispose(); } });
});

test('Vector reduced motion stays still but explicit rotate/color controls draw, and vertical touch never becomes a drag', async (t) => {
  const env = await environment({ reduced: true });
  document.body.innerHTML = '<div id="showroom"><canvas></canvas></div>';
  const { mountShowroom } = await source('src/demos/vector/scene.ts', { three: new URL('./roban-renderer.mock.mjs', import.meta.url).href });
  const host = document.querySelector('#showroom'), canvas = host.querySelector('canvas');
  const app = mountShowroom(host, { onProductSelect() {} }); t.after(() => { app.dispose(); env.cleanup(); });
  await env.advance(50); const renderer = renderers.at(-1), initial = renderer.frames; await env.advance(200); assert.equal(renderer.frames, initial);
  app.select('tee-01'); app.rotate(.5); await env.advance(50); assert.ok(renderer.frames > initial);
  const rotated = renderer.frames; await env.advance(200); assert.equal(renderer.frames, rotated);
  function pointer(type, x, y) { const e = new Event(type); Object.defineProperties(e, { clientX: { value: x }, clientY: { value: y }, pointerId: { value: 1 } }); canvas.dispatchEvent(e); }
  pointer('pointerdown', 100, 100); pointer('pointermove', 102, 140); pointer('pointerup', 102, 140); assert.equal(app.getState().rotations[0], .5);
  pointer('pointerdown', 100, 100); pointer('pointermove', 150, 102); pointer('pointerup', 150, 102); assert.ok(app.getState().rotations[0] > .5);
  await env.advance(30); assert.deepEqual(env.errors, []);
});

test('Vector WebGL failure retains the poster, semantic controls and a safe disposable controller', async (t) => {
  const env = await environment(); t.after(() => env.cleanup());
  document.body.innerHTML = '<div id="showroom"><img alt="استودیو"><canvas></canvas><button>انتخاب لباس</button></div>';
  const { mountShowroom } = await source('src/demos/vector/scene.ts', { three: new URL('./roban-renderer.mock.mjs', import.meta.url).href });
  rendererControl.unavailable = true; t.after(() => { rendererControl.unavailable = false; });
  const host = document.querySelector('#showroom'), app = mountShowroom(host, { onProductSelect() {} });
  assert.equal(host.dataset.scene, 'fallback'); assert.ok(host.querySelector('img')); assert.ok(host.querySelector('button'));
  assert.doesNotThrow(() => { app.select('tee-01'); app.setColor('tee-01', '#fff'); app.rotate(.2); app.zoom(.3); app.dispose(); });
});
