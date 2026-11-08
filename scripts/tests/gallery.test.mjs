import assert from 'node:assert/strict';
import test from 'node:test';
import { PerspectiveCamera, Vector3, Texture } from 'three';
import { source, environment } from './helpers.mjs';
import { requests } from './orbit-loader.mock.mjs';

test('gallery metrics hold the first and last projects and invert every drag/button coordinate', async () => {
  const { galleryMetrics, projectFromScroll, scrollForProject } = await source('src/immersive/orbit.ts');
  for (const viewport of [844, 1024, 900]) {
    const m = galleryMetrics(1700, viewport, 9);
    assert.equal(m.entry, .8 * viewport);
    assert.equal(m.step, .62 * viewport);
    for (const y of [m.start - 100, m.start, m.start + .4 * viewport, m.start + .8 * viewport]) assert.equal(projectFromScroll(y, m), 0);
    for (let position = 0; position <= 8; position += .125) assert.ok(Math.abs(projectFromScroll(scrollForProject(position, m), m) - position) < 1e-10);
    const last = scrollForProject(8, m);
    assert.ok(Math.abs(m.start + m.travel - last - .3 * viewport) < 1e-9);
    assert.equal(projectFromScroll(last + .15 * viewport, m), 8);
    assert.equal(projectFromScroll(m.start + m.travel + 100, m), 8);
    assert.equal(m.height, viewport + m.travel);
    for (const reduced of [false, true]) {
      const one = galleryMetrics(1700, viewport, 1, reduced);
      assert.equal(one.travel, 0); assert.equal(projectFromScroll(8000, one), 0);
    }
    assert.equal(galleryMetrics(1700, viewport, 9, true).travel, 0);
  }
});

function pointDistance(p, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz);
}
function cross(a, b, c) { return (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x); }
function segmentDistance(a, b, c, d) {
  if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) return 0;
  return Math.min(pointDistance(a, c, d), pointDistance(b, c, d), pointDistance(c, a, b), pointDistance(d, a, b));
}

for (const [width, height] of [[390, 844], [768, 1024], [1440, 900]]) {
  test(`curved panes have zero intersections, including swept deformation and selection / ${width}px`, async (t) => {
    const env = await environment({ width, height }); t.after(() => env.cleanup());
    const { createWorkOrbit } = await source('src/immersive/WorkOrbit.ts');
    const { projects } = await source('src/data/projects.ts');
    const { ORBIT_HOVER_BEND, ORBIT_SPEED_BEND } = await source('src/immersive/orbit.ts');
    const orbit = createWorkOrbit({ capabilities: { getMaxAnisotropy: () => 1 } }, false); t.after(() => orbit.dispose());
    orbit.resize(width, height, 1); orbit.prepare(projects);
    const panels = orbit.group.children;
    // Vertical extrusion of each actual curved mesh. The extra radius includes every
    // possible shader displacement (.018 hover + 3 * .5 * .025 velocity), not just a frozen frame.
    const sweptMargin = 2 * (ORBIT_HOVER_BEND + 3 * .5 * ORBIT_SPEED_BEND) * 1.02;
    const geometry = panels[0].geometry;
    const vertices = geometry.attributes.position;
    const columns = geometry.parameters.widthSegments + 1;
    const collisions = [];
    const camera = new PerspectiveCamera(54, width / height, .1, 120);
    for (let selected = 0; selected < projects.length; selected++) {
      for (const progress of [0, .25, .5, .75, 1]) {
        const state = { items: projects, target: selected, position: selected, selection: progress, selectedIndex: selected, dragging: false, ready: false };
        panels.forEach((panel, index) => { panel.material.uniforms.uSelected.value = index === selected ? progress : 0; });
        orbit.update(state, camera, 0, 0, 1, false);
        const profiles = panels.map((panel) => Array.from({ length: columns }, (_, i) => new Vector3().fromBufferAttribute(vertices, i).applyMatrix4(panel.matrixWorld)));
        for (let a = 0; a < panels.length; a++) for (let b = a + 1; b < panels.length; b++) {
          if (Math.abs(panels[a].position.y - panels[b].position.y) > 1.5 * (panels[a].scale.y + panels[b].scale.y)) continue;
          let distance = Infinity;
          for (let i = 1; i < columns; i++) for (let j = 1; j < columns; j++) distance = Math.min(distance, segmentDistance(profiles[a][i - 1], profiles[a][i], profiles[b][j - 1], profiles[b][j]));
          if (distance <= sweptMargin) collisions.push({ a, b, selected, progress, distance });
        }
      }
    }
    assert.deepEqual(collisions, []);
  });

  test(`all nine card centers can be seen and picked; selected card stays within the viewport / ${width}px`, async (t) => {
    const env = await environment({ width, height }); t.after(() => env.cleanup());
    const { createWorkOrbit } = await source('src/immersive/WorkOrbit.ts');
    const { projects } = await source('src/data/projects.ts');
    const orbit = createWorkOrbit({ capabilities: { getMaxAnisotropy: () => 1 } }, false); t.after(() => orbit.dispose());
    orbit.resize(width, height, 1); orbit.prepare(projects);
    const camera = new PerspectiveCamera(54, width / height, .1, 120), eye = new Vector3(), aim = new Vector3();
    for (let index = 0; index < projects.length; index++) for (const selected of [false, true]) {
      const state = { items: projects, target: index, position: index, selection: selected ? 1 : 0, selectedIndex: selected ? index : null, dragging: false, ready: false };
      orbit.cameraPose(state, camera.aspect, camera.fov, eye, aim);
      camera.position.copy(eye); camera.lookAt(aim); camera.rotateZ(selected ? 0 : -.025); camera.updateMatrixWorld();
      for (let frame = 0; frame < 120; frame++) orbit.update(state, camera, frame / 60, 1 / 60, 1, false);
      const card = orbit.group.children[index];
      for (const x of [-.8, 0, .8]) for (const y of [-.5, 0, .5]) {
        const point = new Vector3(x, y, 0).applyMatrix4(card.matrixWorld).project(camera);
        assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1 && point.z > -1 && point.z < 1);
        assert.equal(orbit.hitTest(camera, (point.x + 1) * width / 2, (1 - point.y) * height / 2, width, height), index, `center of ${index} remains unobscured, selected=${selected}`);
      }
      const vertices = card.geometry.attributes.position;
      for (let v = 0; v < vertices.count; v++) {
        const point = new Vector3().fromBufferAttribute(vertices, v).applyMatrix4(card.matrixWorld).project(camera);
        assert.ok(Math.abs(point.x) < .99 && Math.abs(point.y) < .99, `card ${index} fits the viewport, selected=${selected}`);
      }
      assert.equal(card.material.depthWrite, false);
      assert.ok(card.material.uniforms.uReveal.value > .99);
      const ordered = [...orbit.group.children].sort((a, b) => a.renderOrder - b.renderOrder);
      for (let p = 1; p < ordered.length; p++) assert.ok(ordered[p].userData.depth >= ordered[p - 1].userData.depth, 'glass draws from back to front');
    }
  });
}

test('first three images preload with two requests; poster survives slow textures and entry until a rendered card is ready', async (t) => {
  const env = await environment({ width: 1440, height: 900 }); t.after(() => env.cleanup());
  const { createWorkOrbit } = await source('src/immersive/WorkOrbit.ts', { three: new URL('./orbit-loader.mock.mjs', import.meta.url).href });
  const { projects } = await source('src/data/projects.ts');
  requests.length = 0;
  const orbit = createWorkOrbit({ capabilities: { getMaxAnisotropy: () => 1 } }, false); t.after(() => orbit.dispose());
  orbit.preload(projects); await env.settle();
  assert.deepEqual(requests.map((request) => request.url), projects.slice(0, 2).map((project) => project.preview));
  requests[1].resolve(new Texture()); await env.settle();
  assert.equal(requests[2].url, projects[2].preview);
  const state = { items: projects, target: 0, position: 0, selection: 0, selectedIndex: null, dragging: false, ready: false };
  orbit.resize(1440, 900, 1); orbit.prepare(projects);
  const camera = new PerspectiveCamera(54, 1440 / 900, .1, 120), eye = new Vector3(), aim = new Vector3();
  orbit.cameraPose(state, camera.aspect, camera.fov, eye, aim); camera.position.copy(eye); camera.lookAt(aim); camera.updateMatrixWorld();
  orbit.update(state, camera, 1, 1 / 60, 1, false); orbit.present(state);
  assert.equal(state.ready, false, 'other loaded cards cannot hide the first poster');
  requests[0].resolve(new Texture()); await env.settle();
  orbit.update(state, camera, 1, 1 / 60, .5, false); orbit.present(state);
  assert.equal(state.ready, false, 'entry reveal must finish first');
  orbit.update(state, camera, 1, 1 / 60, 1, false);
  assert.equal(state.ready, false, 'texture preparation is not a rendered frame');
  orbit.present(state); assert.equal(state.ready, true);
  state.selectedIndex = 0;
  for (let frame = 0; frame < 45; frame++) { orbit.advance(state, 1 / 60); orbit.update(state, camera, frame / 60, 1 / 60, 1, false); orbit.present(state); }
  assert.ok(state.selection > .98, 'selection settles in about 700ms');
  assert.ok(orbit.group.children[0].material.uniforms.uReveal.value > .98, 'selected card never fades away');
  assert.ok(orbit.group.children[1].material.uniforms.uReveal.value < .35);
});
