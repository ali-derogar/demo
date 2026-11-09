import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';
import { PerspectiveCamera, Vector3, Box3, Raycaster, Vector2 } from 'three';
import { products, selectProducts, cleanCart, orderErrors } from '../../public/demos/roban/products.js';
import { provenanceError } from '../lib/image-provenance.mjs';
import { source } from './helpers.mjs';

const html = await readFile(new URL('../../public/demos/roban/index.html', import.meta.url), 'utf8');
const script = await build({ entryPoints: [new URL('../../public/demos/roban/app.js', import.meta.url).pathname], bundle: true, write: false, format: 'iife', globalName: 'Roban', platform: 'browser', external: ['./scene.js'] });
function store(t, saved = {}) {
  const errors = [], vc = new VirtualConsole(); vc.on('jsdomError', (e) => errors.push(e));
  const dom = new JSDOM(html, { url: 'http://localhost/demos/roban/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  w.__ROBAN_NO_AUTOBOOT__ = true;
  w.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  w.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new w.Event('close')); };
  for (const [k, v] of Object.entries(saved)) w.localStorage.setItem(k, v);
  w.eval(script.outputFiles[0].text);
  const app = w.Roban.mountStore({ scene: false });
  const q = (selector) => w.document.querySelector(selector);
  const click = (selector) => { const el = q(selector); assert.ok(el, selector); el.focus(); el.click(); return el; };
  const input = (selector, value) => { q(selector).value = value; q(selector).dispatchEvent(new w.Event('input', { bubbles: true })); };
  t.after(() => { app.dispose(); assert.deepEqual(errors, []); w.close(); });
  return { w, q, click, input, app };
}

test('Roban catalog searches Persian variants and all query words, and combines sorting, category and favorites', () => {
  assert.equal(products.length, 12);
  assert.equal(selectProducts({ query: 'كِيف ابري' })[0].id, 'bag-01');
  assert.equal(selectProducts({ query: 'قلب صورتي', category: 'jewel' }).length, 2);
  assert.equal(selectProducts({ category: 'hair' }).length, 3);
  const list = selectProducts({ sort: 'low' }); assert.equal(list[0].id, 'hair-03'); assert.ok(list.every((p, i) => !i || p.price >= list[i - 1].price));
  assert.deepEqual(selectProducts({ favorites: ['bag-01'], category: 'hair' }), []);
  assert.deepEqual(selectProducts({ query: 'ناموجود' }), []);
});

test('Roban rejects corrupt cart entries, caps stock and validates Persian and Arabic digits', () => {
  assert.deepEqual(cleanCart({ 'bag-01': 50, 'hair-01': -1, 'bag-02': 1.2, 'jewel-01': '2', bad: 1 }), { 'bag-01': 9 });
  for (const value of [null, [], 'broken', 5]) assert.deepEqual(cleanCart(value), {});
  assert.deepEqual(orderErrors({ name: 'مشتری نمایشی', phone: '۰۹۱۲۳۴۵۶۷۸۹', address: 'شهر نمونه، خیابان نمایشی، پلاک ۱۲', postal: '١٢٣٤٥٦٧٨٩٠' }), {});
  assert.equal(Object.keys(orderErrors({})).length, 4);
});

test('Roban real controls combine filters, show empty results, clear search and preserve favorite state', (t) => {
  const { w, q, click, input, app } = store(t);
  assert.equal(q('#product-grid').children.length, 12);
  input('#search', 'كِيف ابري'); assert.equal(q('#product-grid').children.length, 1);
  click('[data-filter="hair"]'); assert.equal(q('#empty-state').hidden, false);
  click('[data-action="reset"]'); assert.equal(q('#product-grid').children.length, 12);
  click('[data-favorite="bag-01"]'); click('.favorites-filter'); assert.equal(q('#product-grid').children.length, 1);
  assert.equal(q('.favorites-filter').getAttribute('aria-pressed'), 'true');
  assert.equal(w.localStorage.getItem('roban-favorites-v1'), '["bag-01"]');
  click('[data-favorite="bag-01"]'); assert.equal(q('#product-grid').children.length, 0);
  assert.equal(app.getState().favorites.length, 0);
});

test('Roban actual cart/order handlers validate, review, edit and complete a demo order without persisting personal data', (t) => {
  const { w, q, click, app } = store(t);
  click('[data-add="bag-01"]'); click('[data-add="jewel-01"]'); click('[data-action="cart"]');
  assert.equal(q('#shop-dialog').open, true);
  click('[data-quantity="bag-01:plus"]'); assert.equal(app.getState().cart['bag-01'], 2);
  click('[data-remove="jewel-01"]'); assert.equal(q('.cart-summary strong').textContent.includes('۱٬۷۸۰٬۰۰۰'), true);
  click('[data-action="checkout"]');
  const submit = () => q('#checkout-form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  submit(); assert.equal(q('[name="phone"]').getAttribute('aria-invalid'), 'true'); assert.ok(q('#error-name').textContent);
  for (const [key, value] of Object.entries({ name: 'مشتری نمایشی', phone: '۰۹۱۲۳۴۵۶۷۸۹', address: 'شهر نمونه، خیابان نمایشی، پلاک ۱۲', postal: '۱۲۳۴۵۶۷۸۹۰' })) q(`[name="${key}"]`).value = value;
  submit(); assert.equal(app.getState().view, 'review'); assert.ok(q('#order-address').textContent.includes('مشتری نمایشی'));
  click('[data-action="edit-order"]'); assert.equal(q('[name="name"]').value, 'مشتری نمایشی'); submit();
  click('[data-action="confirm-order"]'); assert.equal(app.getState().view, 'success'); assert.equal(Object.keys(app.getState().cart).length, 0);
  assert.equal(w.localStorage.getItem('roban-cart-v1'), '{}');
  for (let i = 0; i < w.localStorage.length; i++) assert.ok(!w.localStorage.getItem(w.localStorage.key(i)).includes('مشتری نمایشی'));
  click('[data-action="browse"]'); assert.equal(q('#shop-dialog').open, false);
});

test('Roban restores valid saved items, survives corrupt storage, enforces stock and returns dialog focus', (t) => {
  const { q, click, app, w } = store(t, { 'roban-cart-v1': '{bad json', 'roban-favorites-v1': '42' });
  assert.equal(Object.keys(app.getState().cart).length, 0);
  assert.equal(app.getState().favorites.length, 0);
  const opener = click('.scene-products [data-product="daily-01"]'); assert.ok(q('#dialog-title').textContent.includes('لی‌لی'));
  click('[data-action="close"]'); assert.equal(w.document.activeElement, opener);
  for (let i = 0; i < 11; i++) click('[data-add="bag-01"]');
  assert.equal(app.getState().cart['bag-01'], 9);
  click('[data-action="cart"]'); assert.equal(q('[data-quantity="bag-01:plus"]').disabled, true);
  for (let i = 0; i < 9; i++) click('[data-quantity="bag-01:minus"]');
  assert.ok(q('.empty-cart')); assert.equal(Object.keys(app.getState().cart).length, 0);
});

test('Roban reload restores saved quantities and favorites and shopping survives denied storage', (t) => {
  const { w, app, click, q } = store(t, { 'roban-cart-v1': '{"bag-01":2,"missing":4}', 'roban-favorites-v1': '["hair-01","missing","hair-01"]' });
  assert.equal(app.getState().cart['bag-01'], 2); assert.equal(Object.keys(app.getState().cart).length, 1);
  assert.deepEqual([...app.getState().favorites], ['hair-01']);
  w.Storage.prototype.setItem = () => { throw new Error('Storage denied'); };
  click('[data-add="bag-01"]'); assert.equal(app.getState().cart['bag-01'], 3);
  click('[data-action="cart"]'); assert.equal(q('#shop-dialog').open, true);
});

test('generated provenance requires the real generator and prompt; photographs retain source/license requirements', () => {
  assert.equal(provenanceError({ title: 'image', origin: 'generated', generator: 'image_gen', prompt: 'original product photograph' }), null);
  assert.ok(provenanceError({ title: 'image', origin: 'generated', generator: 'other', prompt: 'x' }));
  assert.ok(provenanceError({ title: 'image', origin: 'generated', generator: 'image_gen' }));
  assert.ok(provenanceError({ title: 'photo', license: 'CC0' }));
  assert.equal(provenanceError({ title: 'photo', license: 'CC0', source: 'https://example.com/photo' }), null);
});

test('Roban creates finite real 3D product geometry that fits desktop and phone cameras and can be ray-picked', async () => {
  const { createAccessories } = await source('src/demos/roban/scene.ts');
  for (const [compact, width, height] of [[false, 720, 555], [true, 390, 390]]) {
    const { world, products: models } = createAccessories(compact);
    assert.deepEqual(models.map((m) => m.name), ['bag-01', 'jewel-01', 'daily-01']);
    const camera = new PerspectiveCamera(compact ? 40 : 37, width / height, .1, 40); camera.position.set(0, 3.3, compact ? 10.3 : 9.3); camera.lookAt(0, .95, 0); camera.updateMatrixWorld(); world.updateMatrixWorld(true);
    world.traverse((m) => { if (m.isMesh) for (const n of m.geometry.attributes.position.array) assert.ok(Number.isFinite(n)); });
    const raycaster = new Raycaster();
    for (const model of models) {
      const box = new Box3().setFromObject(model), center = box.getCenter(new Vector3()).project(camera);
      assert.ok(Math.abs(center.x) < .9 && Math.abs(center.y) < .9, `${model.name} fits ${width}`);
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) { const point = new Vector3(x, y, z).project(camera); assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1, `${model.name} corners fit ${width}`); }
      raycaster.setFromCamera(new Vector2(center.x, center.y), camera);
      // A bracelet center is intentionally open; pick an actual pearl instead.
      if (model.name === 'jewel-01') { const point = model.children[0].getWorldPosition(new Vector3()).project(camera); raycaster.setFromCamera(new Vector2(point.x, point.y), camera); }
      assert.ok(raycaster.intersectObject(model, true).length, `${model.name} is real pickable geometry`);
    }
    world.traverse((m) => { if (m.isMesh) { m.geometry.dispose(); m.material.dispose(); } });
  }
});
