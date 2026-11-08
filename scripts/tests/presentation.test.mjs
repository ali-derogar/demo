import assert from 'node:assert/strict';
import test from 'node:test';
import { PerspectiveCamera, Texture, Vector3 } from 'three';
import { source, environment } from './helpers.mjs';
import { requests } from './orbit-loader.mock.mjs';

test('presentation takes 1.5 seconds, reverses without a jump and reduced motion settles immediately', async () => {
  const { createPresentation, advancePresentation } = await source('src/immersive/projectPresentation.ts');
  const p = createPresentation(); p.projectId = 'fashion'; p.phase = 'opening';
  advancePresentation(p, .3); assert.ok(Math.abs(p.progress - .2) < 1e-12); assert.equal(p.phase, 'opening');
  p.phase = 'closing'; advancePresentation(p, .15); assert.ok(Math.abs(p.progress - .1) < 1e-12);
  p.phase = 'opening'; advancePresentation(p, 1.35); assert.equal(p.progress, 1); assert.equal(p.phase, 'open');
  p.phase = 'closing'; advancePresentation(p, 1.5); assert.equal(p.phase, 'closed'); assert.equal(p.projectId, null);
  p.projectId = 'fashion'; p.phase = 'opening'; advancePresentation(p, 0, true); assert.equal(p.phase, 'open');
  p.phase = 'closing'; advancePresentation(p, 0, true); assert.equal(p.phase, 'closed');
});

for (const [width, height] of [[390, 844], [768, 1024], [1440, 900]]) {
  test(`real panes transform into correctly framed projects without fading or early enlargement / ${width}px`, async (t) => {
    const env = await environment({ width, height }); t.after(() => env.cleanup());
    const { createWorkOrbit } = await source('src/immersive/WorkOrbit.ts');
    const { projects } = await source('src/data/projects.ts');
    const { createPresentation, projectFrame } = await source('src/immersive/projectPresentation.ts');
    const orbit = createWorkOrbit({ capabilities: { getMaxAnisotropy: () => 1 } }, false); t.after(() => orbit.dispose());
    orbit.resize(width, height, 1); orbit.prepare(projects);
    const camera = new PerspectiveCamera(54, width / height, .1, 120), eye = new Vector3(), aim = new Vector3();
    for (let index = 0; index < 9; index++) {
      const p = createPresentation(); p.projectId = projects[index].id; p.phase = 'opening';
      const state = { items: projects, target: index, position: index, selectedIndex: index, selection: 1, presentation: p, dragging: false, ready: false };
      const pane = orbit.group.children[index];
      for (const progress of [0, .1, .2, .4, .7, 1]) {
        p.progress = progress;
        orbit.cameraPose(state, camera.aspect, camera.fov, eye, aim);
        camera.position.copy(eye); camera.lookAt(aim); camera.updateMatrixWorld();
        orbit.update(state, camera, 1.5 * progress, 0, 1, false);
        assert.equal(pane.material.uniforms.uReveal.value, 1, 'hero is visible for every transition frame');
        if (progress <= .2) assert.equal(pane.material.uniforms.uFlatten.value, 0, 'flattening/enlargement wait for neighboring cards');
        if (progress >= .2) for (const neighbor of orbit.group.children) if (neighbor !== pane) assert.equal(neighbor.material.uniforms.uReveal.value, 0);
        const b = p.bounds;
        assert.ok(b && [b.left, b.top, b.width, b.height].every(Number.isFinite));
        assert.ok(b.left > 0 && b.top > 0 && b.left + b.width < width && b.top + b.height < height, `card ${index} remains inside the viewport at ${progress}`);
      }
      const expected = projectFrame(width, height, height);
      for (const key of Object.keys(expected)) assert.ok(Math.abs(p.bounds[key] - expected[key]) < 1e-4, `project ${index}: projected ${key} matches native hit area`);
      assert.ok(Math.abs(p.bounds.width / p.bounds.height - 1.5) < 1e-8, 'the original photo aspect is preserved');
      assert.equal(pane.material.uniforms.uPresentation.value, 1, 'the glass title yields to readable native metadata');
      assert.ok(p.bounds.width <= width * (width < 1024 ? .9 : .62) + 1e-6);
    }
  });
}

test('project poster retires only after its own image and a fully visible rendered card; texture is shared', async (t) => {
  const env = await environment({ width: 1440, height: 900 }); t.after(() => env.cleanup()); requests.length = 0;
  const { createWorkOrbit } = await source('src/immersive/WorkOrbit.ts', { three: new URL('./orbit-loader.mock.mjs', import.meta.url).href });
  const { projects } = await source('src/data/projects.ts');
  const { createPresentation } = await source('src/immersive/projectPresentation.ts');
  const orbit = createWorkOrbit({ capabilities: { getMaxAnisotropy: () => 1 } }, false); t.after(() => orbit.dispose());
  orbit.resize(1440, 900, 1);
  const presentation = createPresentation(); Object.assign(presentation, { projectId: 'fashion', progress: 1, phase: 'open' });
  const state = { items: projects, target: 0, position: 0, selectedIndex: 0, selection: 1, presentation, dragging: false, ready: false };
  const camera = new PerspectiveCamera(54, 1440 / 900, .1, 120), eye = new Vector3(), aim = new Vector3();
  orbit.advance(state, 0); await env.settle();
  orbit.cameraPose(state, camera.aspect, camera.fov, eye, aim); camera.position.copy(eye); camera.lookAt(aim); camera.updateMatrixWorld();
  orbit.update(state, camera, 1, 0, 1, false); orbit.present(state); assert.equal(presentation.ready, false);
  const image = new Texture({ width: 1200, height: 800 }); requests.find((r) => r.url === projects[0].preview).resolve(image); await env.settle();
  assert.equal(orbit.texture('fashion'), image, 'environment uses the same cached texture as the pane');
  orbit.update(state, camera, 1, 0, .4, false); orbit.present(state); assert.equal(presentation.ready, false);
  orbit.update(state, camera, 1, 0, 1, false); assert.equal(presentation.ready, false);
  orbit.present(state); assert.equal(presentation.ready, true);
});

test('project environment respects particle budgets, full-screen distribution, quality reduction and disposal', async (t) => {
  const env = await environment(); t.after(() => env.cleanup());
  const { createProjectEnvironment } = await source('src/immersive/ProjectEnvironment.ts');
  for (const mobile of [false, true]) {
    const scene = createProjectEnvironment(mobile, false, new Texture());
    assert.equal(scene.budget, mobile ? 6144 : 24576);
    const points = scene.group.children.find((item) => item.isPoints);
    assert.equal(points.geometry.attributes.position.count, scene.budget);
    scene.setQuality(1); assert.equal(points.geometry.drawRange.count, scene.budget / 2);
    const uv = points.geometry.attributes.aSample;
    const y = Array.from({ length: scene.budget / 2 }, (_, i) => uv.getY(i));
    assert.ok(Math.max(...y) - Math.min(...y) > .95, 'lower quality keeps points across the whole image');
    scene.setQuality(2); assert.equal(points.geometry.drawRange.count, scene.budget / 4);
    let disposed = 0;
    for (const object of scene.group.children) {
      object.geometry.addEventListener('dispose', () => disposed++); object.material.addEventListener('dispose', () => disposed++);
    }
    scene.dispose(); assert.equal(disposed, 4);
  }
});
