import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';
import { products, selectProducts, cleanCart, addToCart, variantKey, variantFor, orderErrors } from '../../public/demos/vector/products.js';
import { source } from './helpers.mjs';

const html = await readFile(new URL('../../public/demos/vector/index.html', import.meta.url), 'utf8');
const script = await build({ entryPoints: [new URL('../../public/demos/vector/app.js', import.meta.url).pathname], bundle: true, write: false, format: 'iife', globalName: 'VectorStore', platform: 'browser', external: ['./scene.js*'] });
function store(t, saved = {}) {
  const errors = [], vc = new VirtualConsole(); vc.on('jsdomError', (e) => errors.push(e));
  const dom = new JSDOM(html, { url: 'http://localhost/demos/vector/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  w.__VECTOR_NO_AUTOBOOT__ = true; w.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  w.HTMLElement.prototype.scrollIntoView = function () {}; w.scrollTo = () => {};
  w.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  w.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new w.Event('close')); };
  for (const [key, value] of Object.entries(saved)) w.localStorage.setItem(key, value);
  w.eval(script.outputFiles[0].text); const app = w.VectorStore.mountStore({ scene: false });
  const q = (selector) => w.document.querySelector(selector);
  const click = (selector) => { const el = q(selector); assert.ok(el, selector); el.focus(); el.click(); return el; };
  const input = (selector, value, type = 'input') => { q(selector).value = value; q(selector).dispatchEvent(new w.Event(type, { bubbles: true })); };
  t.after(() => { app.dispose(); assert.deepEqual(errors, []); w.close(); });
  return { w, q, click, input, app };
}

test('Vector is first, Roban moves to second, and all 15 products have local assets and variant-aware size filtering', async () => {
  const { projects } = await source('src/data/projects.ts');
  assert.equal(projects[0].id, 'vector'); assert.equal(projects[1].id, 'roban');
  assert.equal(projects[0].url, '/demos/vector/'); assert.equal(projects[0].visual.layout, 'streetwear');
  assert.equal(products.length, 15); assert.equal(new Set(products.map((p) => p.cat)).size, 5);
  assert.equal(selectProducts({ query: 'كاپشن پافر' })[0].id, 'jacket-01');
  assert.equal(selectProducts({ category: 'hoodie' }).length, 3);
  assert.ok(selectProducts({ size: 'XXL' }).length < products.length);
  assert.equal(selectProducts({ category: 'tee', size: 'XXL' }).some((p) => p.id === 'tee-01'), false);
  const cheap = selectProducts({ sort: 'low' }); assert.ok(cheap.every((p, i) => !i || cheap[i - 1].price <= p.price));
  for (const p of products) assert.ok((await readFile(new URL(`../../public/demos/vector/${p.image}`, import.meta.url))).length > 1000);
});

test('Vector cart requires explicit options, separates colors/sizes, rejects forged variants and caps each stock', () => {
  assert.ok(addToCart({}, 'tee-01', '', '').error);
  assert.ok(addToCart({}, 'tee-01', 'charcoal', 'XXL').error);
  assert.ok(addToCart({}, 'missing', 'charcoal', 'M').error);
  let { cart } = addToCart({}, 'hoodie-01', 'wine', 'M');
  cart = addToCart(cart, 'hoodie-01', 'wine', 'L').cart;
  cart = addToCart(cart, 'hoodie-01', 'cream', 'M').cart;
  assert.equal(Object.keys(cart).length, 3);
  const key = variantKey('hoodie-01', 'wine', 'M'), stock = variantFor('hoodie-01', 'wine', 'M').stock;
  assert.deepEqual(cleanCart({ [key]: 100, 'tee-01~forged~M': 1, 'tee-01~charcoal~XXL': 1, 'tee-01~charcoal~L': '2', 'tee-01~cream~M': -1 }), { [key]: stock });
  assert.ok(addToCart({ [key]: stock }, 'hoodie-01', 'wine', 'M').error);
  for (const value of [null, [], 'broken', 2]) assert.deepEqual(cleanCart(value), {});
  assert.deepEqual(orderErrors({ name: 'کاربر آزمایشی', phone: '۰۹۱۲۳۴۵۶۷۸۹', address: 'شهر نمونه، خیابان نمونه، پلاک ۱۲', postal: '١٢٣٤٥٦٧٨٩٠' }), {});
});

test('Vector catalog controls combine search, categories, sizes, sorting and favorites and recover from empty results', (t) => {
  const { q, click, input, w } = store(t);
  assert.equal(q('#product-grid').children.length, 15);
  input('#search', 'كاپشن پافر'); assert.equal(q('#product-grid').children.length, 1);
  click('[data-filter="tee"]'); assert.equal(q('#empty-state').hidden, false);
  click('[data-action="reset"]'); input('#size-filter', 'XXL', 'change'); assert.ok(q('#product-grid').children.length < 15);
  click('[data-action="reset"]'); click('[data-favorite="hoodie-01"]'); click('.favorites-filter');
  assert.equal(q('#product-grid').children.length, 1); assert.ok(w.localStorage.getItem('vector-favorites-v1').includes('hoodie-01'));
  click('[data-favorite="hoodie-01"]'); assert.equal(q('#empty-state').hidden, false);
});

test('Vector actual option controls enforce color/size, preserve selections through size guide and create independent cart lines', (t) => {
  const { click, q, app, w } = store(t);
  const opener = click('[data-product="hoodie-01"]');
  click('[data-add="hoodie-01"]'); assert.ok(q('#selection-error').textContent); assert.equal(Object.keys(app.getState().cart).length, 0);
  click('[data-color="wine"]'); assert.equal(q('[data-size="XXL"]').disabled, true);
  click('[data-size="M"]'); click('[data-action="size-guide"]'); click('[data-action="back-product"]');
  assert.equal(q('[data-size="M"]').getAttribute('aria-pressed'), 'true');
  click('[data-add="hoodie-01"]'); click('[data-size="L"]'); click('[data-add="hoodie-01"]');
  click('[data-color="cream"]'); click('[data-add="hoodie-01"]'); assert.equal(Object.keys(app.getState().cart).length, 3);
  click('[data-action="close"]'); assert.equal(w.document.activeElement, opener); assert.equal(w.document.documentElement.style.overflow, '');
  click('[data-action="cart"]'); assert.equal(q('#dialog-content').querySelectorAll('.cart-line').length, 3);
  click('[data-remove="hoodie-01~cream~L"]'); assert.equal(q('#dialog-content').querySelectorAll('.cart-line').length, 2);
});

test('Vector reference capsules enter their own story and connect the exact product to the persistent shopping flow', (t) => {
  const { click, q, app, w } = store(t);
  click('[data-scene-product="tee-02"]'); assert.equal(app.getState().selectedHero, 'tee-02');
  assert.equal(w.location.hash, '#studio/white'); assert.equal(q('#home-ui').hidden, true); assert.equal(q('#story-ui').hidden, false);
  assert.equal(q('.showroom-poster').getAttribute('src'), './assets/img/room-white.webp');
  click('#story-buy'); assert.equal(app.getState().selectedColor, 'cream');
  click('[data-size="M"]'); click('[data-add="tee-02"]'); assert.equal(app.getState().cart['tee-02~cream~M'], 1);
  click('[data-action="view-studio"]'); assert.equal(q('#shop-dialog').open, false);
  click('[data-scene-action="reset"]'); assert.equal(app.getState().selectedHero, null); assert.equal(q('#story-ui').hidden, true);
  assert.equal(w.location.hash, '#home');
});

test('Vector order validates Persian digits, reviews/edits and completes without persisting or executing customer input', (t) => {
  const { click, q, app, w } = store(t);
  click('[data-product="hoodie-01"]'); click('[data-color="cream"]'); click('[data-size="M"]'); click('[data-add="hoodie-01"]'); click('[data-action="close"]'); click('[data-action="cart"]'); click('[data-action="checkout"]');
  const submit = () => q('#checkout-form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  submit(); assert.equal(q('[name="phone"]').getAttribute('aria-invalid'), 'true');
  const personal = { name: '<img src=x onerror=alert(1)>', phone: '۰۹۱۲۳۴۵۶۷۸۹', address: 'شهر نمونه، خیابان نمایشی، پلاک ۱۲', postal: '۱۲۳۴۵۶۷۸۹۰' };
  for (const [key, value] of Object.entries(personal)) q(`[name="${key}"]`).value = value;
  submit(); assert.equal(app.getState().view, 'review'); assert.equal(q('#order-address').querySelector('img'), null); assert.ok(q('#order-address').textContent.includes(personal.name));
  click('[data-action="edit-order"]'); assert.equal(q('[name="name"]').value, personal.name); submit(); click('[data-action="confirm-order"]');
  assert.equal(app.getState().view, 'success'); assert.equal(Object.keys(app.getState().cart).length, 0); assert.equal(w.localStorage.getItem('vector-cart-v1'), '{}');
  for (let i = 0; i < w.localStorage.length; i++) for (const value of Object.values(personal)) assert.ok(!w.localStorage.getItem(w.localStorage.key(i)).includes(value));
});

test('Vector cleans persisted data, restores variants and remains usable with storage denied', (t) => {
  const { app, click, w } = store(t, { 'vector-cart-v1': '{"tee-01~charcoal~M":2,"missing~grey~M":9}', 'vector-favorites-v1': '["tee-01","tee-01","forged"]' });
  assert.equal(app.getState().cart['tee-01~charcoal~M'], 2); assert.equal(Object.keys(app.getState().cart).length, 1); assert.equal(app.getState().favorites.length, 1);
  w.Storage.prototype.setItem = () => { throw new Error('denied'); };
  click('[data-product="hoodie-01"]'); click('[data-color="cream"]'); click('[data-size="M"]'); click('[data-add="hoodie-01"]'); assert.equal(app.getState().cart['hoodie-01~cream~M'], 1);
});

test('Vector corrupt storage recovers, variant stock is enforced and catalog closes on Escape and keeps its state through desktop resize', (t) => {
  const { app, click, q, w } = store(t, { 'vector-cart-v1': '{broken', 'vector-favorites-v1': '42' });
  assert.equal(Object.keys(app.getState().cart).length, 0); assert.equal(app.getState().favorites.length, 0);
  click('[data-product="tee-01"]'); click('[data-color="charcoal"]'); click('[data-size="M"]');
  for (let i = 0; i < 10; i++) click('[data-add="tee-01"]');
  assert.equal(app.getState().cart['tee-01~charcoal~M'], variantFor('tee-01', 'charcoal', 'M').stock); assert.equal(q('#detail-add').disabled, true);
  click('[data-action="close"]'); click('[data-action="menu"]'); assert.equal(q('.menu-toggle').getAttribute('aria-expanded'), 'true');
  w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); assert.equal(q('.menu-toggle').getAttribute('aria-expanded'), 'false');
  click('[data-action="menu"]'); Object.defineProperty(w, 'innerWidth', { value: 1200, configurable: true }); w.dispatchEvent(new w.Event('resize')); assert.equal(q('#catalog-dialog').open, true);
});


test('Vector nested catalog/product/cart dialogs preserve focus and release the correct scroll lock', (t) => {
  const { click, q, w } = store(t);
  const opener = click('[data-action="catalog"]'); assert.equal(q('#catalog-dialog').open, true);
  click('[data-product="hoodie-01"]'); click('[data-color="wine"]'); click('[data-size="M"]'); click('[data-add="hoodie-01"]');
  click('#shop-dialog [data-action="cart"]'); assert.equal(q('#catalog-dialog').open, true); assert.equal(q('#shop-dialog').open, true);
  click('[data-action="close"]'); assert.equal(w.document.documentElement.style.overflow, 'hidden');
  click('[data-action="close-catalog"]'); assert.equal(w.document.documentElement.style.overflow, ''); assert.equal(w.document.activeElement, opener);
});
