import assert from 'node:assert/strict';
import test from 'node:test';
import { PerspectiveCamera, Texture, Vector3 } from 'three';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFile } from 'node:fs/promises';
import { source, environment } from './helpers.mjs';
import { requests } from './orbit-loader.mock.mjs';

test('presentation progress is reversible and independent of elapsed time', async () => {
  const { galleryFrame, galleryMetrics } = await source('src/immersive/orbit.ts');
  const m=galleryMetrics(1400,844,9);
  const positions=[1400,1450,1520,1600,1750,1900,2000,2200,2400];
  const forward=positions.map(y=>galleryFrame(y,m));
  const reverse=[...positions].reverse().map(y=>galleryFrame(y,m)).reverse();
  assert.deepEqual(forward,reverse);
  for(let i=0;i<100;i++) assert.deepEqual(galleryFrame(1520,m),forward[2]);
});

for (const [width, height] of [[320, 568], [390, 500], [390, 844], [768, 1024], [1440, 900]]) {
  test(`real panes transform into correctly framed projects without fading or early enlargement / ${width}px`, async (t) => {
    const env = await environment({ width, height }); t.after(() => env.cleanup());
    const { createWorkOrbit } = await source('src/immersive/WorkOrbit.ts');
    const { projects } = await source('src/data/projects.ts');
    const { createPresentation, projectFrame } = await source('src/immersive/projectPresentation.ts');
    const orbit = createWorkOrbit({ capabilities: { getMaxAnisotropy: () => 1 } }, false, width < 768); t.after(() => orbit.dispose());
    orbit.resize(width, height, 1); orbit.prepare(projects);
    const camera = new PerspectiveCamera(54, width / height, .1, 120), eye = new Vector3(), aim = new Vector3();
    for (let index = 0; index < 9; index++) {
      const p = createPresentation(); p.projectId = projects[index].id; p.phase = 'opening';
      const state = { items: projects, target: index, position: index, selectedIndex: index, selection: 1, scrollDriven: true, presentation: p, dragging: false, ready: false };
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
      assert.ok(Math.abs(p.bounds.left + p.bounds.width / 2 - expected.left - expected.width / 2) < width * .025, 'the live card remains in its intended column');
      assert.ok(p.bounds.width <= expected.width + .05 && p.bounds.height <= expected.height + .05, 'motion stays inside the framing budget');
      assert.ok(Math.abs(p.bounds.width / p.bounds.height - 1.5) < .02, 'the original photo aspect is preserved on the actual mesh');
      assert.ok(pane.material.uniforms.uFlatten.value > 0 && pane.material.uniforms.uFlatten.value < 1, 'the selected pane retains depth instead of becoming a flat billboard');
      assert.equal(pane.material.uniforms.uPresentation.value, 1, 'the glass title yields to readable native metadata');
      assert.ok(p.bounds.width <= width * (width < 1024 ? .94 : .62) + 1e-6);
      const rim = pane.getObjectByName('project-rim'); assert.equal(rim.visible, true); assert.ok(rim.geometry.attributes.normal);
      const before = pane.matrixWorld.clone();
      orbit.update(state, camera, 3.5, 1 / 60, 1, false);
      assert.deepEqual(pane.matrixWorld.toArray(), before.toArray(), 'the scroll-driven card stops when scrolling stops');
      assert.ok(p.bounds.left > 0 && p.bounds.left + p.bounds.width < width);
      const centerMouse = new MouseEvent('pointermove', { bubbles: true, clientX: width / 2, clientY: height / 2 });
      Object.defineProperty(centerMouse, 'pointerType', { value: 'mouse' }); window.dispatchEvent(centerMouse);
      for (let frame = 0; frame < 60; frame++) orbit.update(state, camera, 3.5, 1 / 60, 1, false);
      const neutral = pane.quaternion.clone();
      const mouse = new MouseEvent('pointermove', { bubbles: true, clientX: width * .95, clientY: height * .2 });
      Object.defineProperty(mouse, 'pointerType', { value: 'mouse' }); window.dispatchEvent(mouse);
      for (let frame = 0; frame < 60; frame++) orbit.update(state, camera, 3.5, 1 / 60, 1, false);
      if (width < 768) assert.ok(pane.quaternion.angleTo(neutral) < 1e-7, 'mobile does not depend on hover');
      else assert.ok(pane.quaternion.angleTo(neutral) > .005, 'desktop pointer tilts the actual card');
      assert.ok(p.bounds.left > 0 && p.bounds.left + p.bounds.width < width);
      document.documentElement.dispatchEvent(new Event('pointerleave'));
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
  orbit.update(state, camera, 1, 0, .4, false); assert.equal(presentation.ready, false, 'the poster stays until a rendered frame');
  orbit.present(state); assert.equal(presentation.ready, true);
  presentation.ready = false;
  orbit.update(state, camera, 1, 0, 1, false); assert.equal(presentation.ready, false);
  orbit.present(state); assert.equal(presentation.ready, true);
  orbit.update(state, camera, 1, 0, .4, false); orbit.present(state);
  assert.equal(presentation.ready, true, 'dimming for an info panel must not replace the rendered card with an HTML poster');
});

test('texture loading never turns the live scene into an opaque project page', async (t) => {
  const env = await environment({ width: 1440, height: 900 });
  const { ProjectView } = await source('src/immersive/ProjectView.tsx');
  const { projects } = await source('src/data/projects.ts');
  const { createPresentation } = await source('src/immersive/projectPresentation.ts');
  const presentation = createPresentation(); Object.assign(presentation, { projectId: 'fashion', progress: 1, phase: 'open', surface: 'webgl', ready: false });
  const motionRef = { current: { presentation } }, root = createRoot(env.q('#root'));
  const action = async (fn) => { await act(async () => { fn(); await env.settle(); }); };
  t.after(async () => { try { await action(() => root.unmount()); assert.deepEqual(env.errors, []); } finally { env.cleanup(); } });
  const style = document.createElement('style'); style.textContent = await readFile(new URL('../../src/styles/project.css', import.meta.url), 'utf8'); document.head.append(style);
  await action(() => root.render(React.createElement(ProjectView, { project: projects[0], motionRef, onClose() {} })));
  const page = env.q('.im-project');
  assert.equal(page.dataset.ready, 'false'); assert.equal(page.dataset.surface, 'webgl');
  assert.equal(getComputedStyle(page).backgroundColor, 'rgba(0, 0, 0, 0)', 'waiting for a texture leaves the original world visible');
  await action(() => { presentation.surface = 'fallback'; });
  assert.equal(page.dataset.surface, 'fallback'); assert.ok(env.q('.im-project__poster img'));
  await action(() => { presentation.surface = 'webgl'; presentation.ready = true; });
  assert.equal(page.dataset.ready, 'true'); assert.equal(page.dataset.surface, 'webgl');
});

test('the project glaze reuses the main star field rather than creating another particle cloud', async (t) => {
  const env = await environment(); t.after(() => env.cleanup());
  const { createProjectEnvironment } = await source('src/immersive/ProjectEnvironment.ts');
  for (const mobile of [false, true]) {
    const scene = createProjectEnvironment(mobile, false, new Texture());
    assert.equal(scene.group.children.filter((item) => item.isPoints).length, 0);
    assert.equal(scene.group.children.length, 1);
    const surface = scene.group.children[0];
    scene.setQuality(1); assert.equal(surface.material.uniforms.uDetail.value, 0);
    let disposed = 0;
    surface.geometry.addEventListener('dispose', () => disposed++); surface.material.addEventListener('dispose', () => disposed++);
    scene.dispose(); assert.equal(disposed, 2);
  }
});

test('star repulsion has a bounded pixel radius, follows smoothly and returns after pointer leave', async () => {
  const { createStarPointer } = await source('src/immersive/projectStars.ts');
  const field = createStarPointer();
  const input = { x: 600, y: 200, active: true, nx: 0, ny: 0 };
  for (let i = 0; i < 60; i++) field.update(input, 1440, 900, 1 / 60, true);
  assert.deepEqual(field.viewport.toArray(), [1440, 900]);
  assert.equal(field.pointer.x, 600); assert.equal(field.pointer.y, 700, 'pointer coordinates match the bottom-up star projection');
  assert.equal(field.pointer.z, 150); assert.ok(field.pointer.w > .99 && field.pointer.w <= 1);
  field.update({ ...input, x: 1000 }, 1440, 900, 1 / 60, true);
  assert.ok(field.pointer.x > 600 && field.pointer.x < 1000, 'movement is damped instead of teleporting the particle field');
  const before = field.pointer.w;
  field.update({ ...input, active: false }, 1440, 900, 1 / 60, true);
  assert.ok(field.pointer.w > 0 && field.pointer.w < before);
  for (let i = 0; i < 60; i++) field.update(input, 1440, 900, 1 / 60, false);
  assert.ok(field.pointer.w < .001, 'repelled stars relax back instead of staying displaced');
  const mobile = createStarPointer();
  for (let i = 0; i < 60; i++) mobile.update(input, 390, 844, 1 / 60, false);
  assert.equal(mobile.pointer.w, 0, 'coarse pointers do not require hover');
  assert.equal(mobile.pointer.z, 90);
});

for (const [width,height] of [[320,568],[390,500],[390,844],[768,1024],[1440,900]]) {
  test(`every original pane grows without overshoot and exactly retraces its projection / ${width}`,async(t)=>{
    const env=await environment({width,height});t.after(()=>env.cleanup());
    const {createWorkOrbit}=await source('src/immersive/WorkOrbit.ts');
    const {projects}=await source('src/data/projects.ts');
    const {createPresentation,projectFrame}=await source('src/immersive/projectPresentation.ts');
    const orbit=createWorkOrbit({capabilities:{getMaxAnisotropy:()=>1}},false,width<768);t.after(()=>orbit.dispose());
    orbit.resize(width,height,1);orbit.prepare(projects);
    const camera=new PerspectiveCamera(54,width/height,.1,120),eye=new Vector3(),aim=new Vector3();
    for(let index=0;index<projects.length;index++) {
      const presentation=createPresentation();presentation.projectId=projects[index].id;
      const state={items:projects,target:index,position:index,selectedIndex:index,selection:0,scrollDriven:true,presentation,dragging:false,ready:false};
      const original=orbit.group.children[index],snapshots=[];
      const render=(progress,time)=>{
        presentation.progress=progress;state.selection=progress;
        orbit.cameraPose(state,camera.aspect,camera.fov,eye,aim);camera.position.copy(eye);camera.lookAt(aim);camera.rotateZ(-.015*(1-progress));camera.updateMatrixWorld();
        orbit.update(state,camera,time,1/60,1,false,false);
      };
      let previousWidth=0;
      for(let frame=0;frame<=40;frame++) {
        render(frame/40,frame/60);
        const bounds={...presentation.bounds};
        assert.ok(bounds.width>=previousWidth-.05,`card ${index} cannot shrink while opening at ${frame}`);
        assert.ok(bounds.width<=projectFrame(width,height,height).width+.1,`card ${index} never overshoots its final frame`);
        snapshots.push(bounds);previousWidth=bounds.width;
        assert.equal(orbit.group.children[index],original,'opening never creates a second pane');
      }
      for(let frame=40;frame>=0;frame--) {
        render(frame/40,2+(40-frame)/60);
        for(const key of ['left','top','width','height']) assert.ok(Math.abs(presentation.bounds[key]-snapshots[frame][key])<1e-8,`reversal retraces ${key} of card ${index}`);
      }
    }
  });
}
