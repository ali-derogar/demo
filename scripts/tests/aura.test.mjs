import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';
import { PerspectiveCamera, Vector3 } from 'three';
import { calendarOptions, slotsForDay, validateBooking } from '../../public/demos/aura/services.js';
import { source } from './helpers.mjs';

const html = await readFile(new URL('../../public/demos/aura/index.html', import.meta.url), 'utf8');
const script = await build({ entryPoints: [new URL('../../public/demos/aura/app.js', import.meta.url).pathname], bundle: true, write: false, platform: 'browser', format: 'iife', globalName: 'Aura', external: ['./scene.js'] });
function clinic(t) {
  const errors = [], vc = new VirtualConsole(); vc.on('jsdomError', (e) => errors.push(e));
  const dom = new JSDOM(html, { url: 'http://localhost/demos/aura/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc }), w = dom.window;
  w.__AURA_NO_AUTOBOOT__ = true;
  w.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  w.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  w.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new w.Event('close')); };
  w.eval(script.outputFiles[0].text);
  const app = w.Aura.mountAura({ scene: false }), q = (selector) => w.document.querySelector(selector);
  const click = (selector) => { const el = q(selector); assert.ok(el, selector); el.focus(); el.click(); return el; };
  const change = (selector, value) => { const el = q(selector); el.value = value; el.dispatchEvent(new w.Event('change', { bubbles: true })); };
  const chooseSlot = () => { click('input[name="day"]'); click('input[name="time"]:not(:disabled)'); };
  t.after(() => { app.dispose(); assert.deepEqual(errors, []); w.close(); });
  return { w, q, click, change, chooseSlot };
}

test('Aura calendar respects the Tehran day boundary, skips Fridays and rejects unavailable or forged appointments', () => {
  const before = calendarOptions(new Date('2026-11-09T20:29:59Z'));
  const after = calendarOptions(new Date('2026-11-09T20:30:00Z'));
  assert.equal(before[0].id, '2026-11-10'); assert.equal(after[0].id, '2026-11-11');
  assert.equal(new Set(after.map((d) => d.id)).size, 5);
  assert.ok(after.every((day) => new Date(day.id).getUTCDay() !== 5 && /[۰-۹]/.test(day.full)));
  const day = after[0].id, available = slotsForDay(day).find((s) => s.available), unavailable = slotsForDay(day).find((s) => !s.available);
  assert.equal(validateBooking({ service: 'botox', day, time: available.id }, after), '');
  assert.ok(validateBooking({ service: '__proto__', day, time: available.id }, after));
  assert.ok(validateBooking({ service: 'skin', day: '1990-01-01', time: available.id }, after));
  assert.ok(validateBooking({ service: 'skin', day, time: unavailable.id }, after));
});

test('Aura synchronizes accessible atlas regions, treatment disclosure and the consultation service', (t) => {
  const { q, click } = clinic(t);
  click('.atlas-hotspot[data-region="filler"]');
  assert.equal(q('.region-tabs [data-region="filler"]').getAttribute('aria-pressed'), 'true');
  assert.equal(q('.atlas-hotspot[data-region="botox"]').getAttribute('aria-pressed'), 'false');
  assert.match(q('#atlas-name').textContent, /فیلر لب/);
  assert.equal(q('[data-service-visual="filler"]').classList.contains('is-active'), true);
  assert.equal(q('[data-service-visual="botox"]').classList.contains('is-active'), false);
  click('#atlas-book'); assert.equal(q('#booking-service').value, 'filler');
  click('[data-close]'); assert.equal(q('#booking-dialog').open, false);
  click('[aria-controls="treatment-laser"]');
  assert.equal(q('#treatment-laser').hidden, false); assert.equal(q('#treatment-botox').hidden, true);
  assert.equal(q('.region-tabs [data-region="laser"]').getAttribute('aria-pressed'), 'true');
  assert.equal(q('#service-visual-label').textContent, '03 / LASER');
  click('[data-look="lines"]');
  assert.equal(q('[data-look="solid"]').getAttribute('aria-pressed'), 'false');
  assert.equal(q('#sculpture').dataset.look, 'lines');
  click('[aria-controls="treatment-laser"]'); assert.equal(q('#treatment-laser').hidden, true);
});

test('Aura booking validates choices, invalidates a time after changing dates, supports review/edit and confirms only a demo receipt', (t) => {
  const { w, q, click, change, chooseSlot } = clinic(t);
  click('[data-book="skin"]');
  assert.equal(q('#booking-service').value, 'skin');
  assert.equal(w.document.body.classList.contains('has-dialog'), true);
  click('.booking-submit'); assert.match(q('#booking-error').textContent, /روز/);
  chooseSlot();
  click('.date-choice:nth-child(2) input');
  assert.equal(q('input[name="time"]:checked'), null);
  click('.booking-submit'); assert.match(q('#booking-error').textContent, /ساعت/);
  click('input[name="time"]:not(:disabled)'); click('.booking-submit');
  assert.equal(q('#booking-review').hidden, false); assert.equal(q('#booking-flow').hidden, true);
  assert.match(q('#review-details').textContent, /مراقبت و جوان‌سازی پوست/);
  assert.equal(q('#booking-dialog').getAttribute('aria-labelledby'), 'review-title');
  click('#edit-booking'); assert.equal(q('#booking-flow').hidden, false);
  assert.ok(q('input[name="day"]:checked')); assert.ok(q('input[name="time"]:checked'));
  change('#booking-service', 'laser'); click('.booking-submit'); click('#confirm-booking');
  assert.equal(q('#booking-success').hidden, false); assert.match(q('#success-details').textContent, /لیزر موهای زائد/);
  assert.match(q('#booking-success').textContent, /نوبتی در کلینیک ثبت نشده/);
  assert.equal(w.localStorage.length, 0);
  click('#booking-success [data-close]');
  assert.equal(w.document.body.classList.contains('has-dialog'), false);
  assert.equal(w.document.activeElement.dataset.book, 'skin');
  click('[data-book="botox"]'); assert.equal(q('input[name="day"]:checked'), null); assert.equal(q('#booking-review').hidden, true);
});

test('Aura mobile menu closes with Escape and returns keyboard focus', (t) => {
  const { q, click, w } = clinic(t);
  click('#menu-toggle'); assert.equal(q('#menu-toggle').getAttribute('aria-expanded'), 'true');
  w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(q('#menu-toggle').getAttribute('aria-expanded'), 'false'); assert.equal(w.document.activeElement.id, 'menu-toggle');
  click('#menu-toggle'); click('#main-nav a'); assert.equal(q('#main-nav').classList.contains('is-open'), false);
});

test('Aura is the fourth registered project and its real sculpture geometry and projected anchors fit desktop and phone frames', async () => {
  const { projects } = await source('src/data/projects.ts'); assert.equal(projects[3].id, 'aura');
  const { createBust } = await source('src/demos/aura/scene.ts');
  for (const [width, height] of [[600, 600], [390, 460], [320, 410]]) {
    const { world, pins } = createBust(width < 768);
    const camera = new PerspectiveCamera(38, width / height, .1, 30);
    camera.position.set(0, .05, Math.max(7.4, 5.1 / (2 * Math.tan(38 * Math.PI / 360) * Math.min(1, width / height)))); camera.lookAt(0, -.18, 0); camera.updateMatrixWorld();
    world.traverse((mesh) => { if (mesh.isMesh) for (const value of mesh.geometry.attributes.position.array) assert.ok(Number.isFinite(value)); });
    for (const yaw of [-.65, -.16, .65]) for (const pitch of [-.14, .14]) {
      world.rotation.set(pitch, yaw, 0); world.updateMatrixWorld(true);
      world.traverse((mesh) => { if (!mesh.isMesh) return; const positions = mesh.geometry.attributes.position; for (let i = 0; i < positions.count; i++) { const p = new Vector3().fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).project(camera); assert.ok(Math.abs(p.x) < .98 && Math.abs(p.y) < .98, `sculpture fits ${width} at ${yaw}, ${pitch}`); } });
      for (const pin of Object.values(pins)) { const p = pin.getWorldPosition(new Vector3()).project(camera); assert.ok(Math.abs(p.x) < .8 && Math.abs(p.y) < .85, `anchor ${pin.name} fits`); }
    }
    world.traverse((mesh) => { if (mesh.isMesh) { mesh.geometry.dispose(); mesh.material.dispose(); } });
  }
});

test('Aura chrome contour is a finite closed band and remains framed while scroll and pointer tilt it', async () => {
  const { createContour } = await source('src/demos/aura/scene.ts');
  for (const [width, height] of [[893, 740], [429, 560], [352, 510]]) {
    const { group, contour } = createContour(width < 768), positions = contour.geometry.attributes.position;
    for (let i = 0; i < 4; i++) assert.ok(new Vector3().fromBufferAttribute(positions, i).distanceTo(new Vector3().fromBufferAttribute(positions, positions.count - 4 + i)) < .00001, 'closed seam');
    const camera = new PerspectiveCamera(38, width / height, .1, 30);
    camera.position.set(0, 0, Math.max(7.5, 4.8 / (2 * Math.tan(38 * Math.PI / 360) * Math.min(1, width / height)))); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
    for (const progress of [0, 1]) for (const pointer of [-1, 1]) {
      group.rotation.set(-.05 + pointer * .08, -.2 + pointer * .15 + progress * .45, -.23 - progress * .2); group.position.set(-.07 - progress * .18, .02, progress * .2); group.updateMatrixWorld(true);
      group.traverse((mesh) => { if (!mesh.isMesh) return; const vertices = mesh.geometry.attributes.position; for (let i = 0; i < vertices.count; i++) { const p = new Vector3().fromBufferAttribute(vertices, i).applyMatrix4(mesh.matrixWorld).project(camera); assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y)); assert.ok(Math.abs(p.x) < .98 && Math.abs(p.y) < .98, `contour fits ${width}`); } });
    }
    group.traverse((mesh) => { if (mesh.isMesh) { mesh.geometry.dispose(); mesh.material.dispose(); } });
  }
});
