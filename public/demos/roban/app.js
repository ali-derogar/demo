import { products, categories, selectProducts, cleanCart, orderErrors, money } from './products.js';
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const price = (amount) => `${money(amount)} <small>تومان</small>`;

export function mountStore({ scene = true } = {}) {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Shopping remains available without storage. */ } };
  let cart = cleanCart(read('roban-cart-v1', {}));
  const saved = read('roban-favorites-v1', []);
  let favorites = Array.isArray(saved) ? [...new Set(saved.filter((id) => products.some((p) => p.id === id)))] : [];
  const state = { query: '', category: 'all', sort: 'newest', favoritesOnly: false };
  const dialog = $('#shop-dialog');
  let opener = null, view = '', selectedId = '', toastTimer, showroom = null, disposed = false;
  let orderData = {};
  const byId = (id) => products.find((p) => p.id === id);
  const cartProducts = () => products.filter((p) => cart[p.id]);
  const count = () => Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const total = () => cartProducts().reduce((sum, p) => sum + p.price * cart[p.id], 0);
  const notify = (message) => { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').classList.add('is-visible'); toastTimer = setTimeout(() => $('#toast').classList.remove('is-visible'), 2600); };
  function updateBadges() {
    $$('.cart-count').forEach((el) => { el.textContent = money(count()); });
    $$('[data-action="cart"]').forEach((el) => el.setAttribute('aria-label', `سبد خرید، ${money(count())} کالا`));
    $('.favorite-count').hidden = !favorites.length;
    $$('[data-action="favorites"]').forEach((el) => el.setAttribute('aria-pressed', String(state.favoritesOnly)));
  }
  function renderProducts() {
    const list = selectProducts({ ...state, favorites: state.favoritesOnly ? favorites : null });
    $('#product-grid').innerHTML = list.map((p) => `<article class="product-card" data-id="${p.id}"><div class="product-photo"><button data-product="${p.id}" aria-label="دیدن ${p.name}"><img src="${p.image}" width="800" height="800" loading="lazy" alt="${p.name}؛ ${p.subtitle}"></button><button class="favorite-button" data-favorite="${p.id}" aria-label="علاقه‌مندی: ${p.name}" aria-pressed="${favorites.includes(p.id)}">${icon('heart')}</button>${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}</div><div class="product-info"><h3><button data-product="${p.id}">${p.name}</button></h3><p>${p.subtitle}</p><span class="product-color" style="background:${p.color}" aria-hidden="true"></span><div class="product-bottom"><span class="price">${price(p.price)}</span><button class="add-button" data-add="${p.id}" aria-label="افزودن ${p.name} به سبد">${icon('plus')}</button></div></div></article>`).join('');
    $('#result-count').textContent = `${money(list.length)} قشنگی${state.favoritesOnly ? ' از علاقه‌مندی‌هات' : ' برای انتخاب تو'}`;
    $('#empty-state').hidden = list.length > 0;
    $('#clear-search').hidden = !state.query;
    $$('[data-filter]').forEach((el) => el.setAttribute('aria-pressed', String(el.dataset.filter === state.category)));
    updateBadges();
  }
  function persistCart() { write('roban-cart-v1', cart); updateBadges(); }
  function add(id) {
    const p = byId(id); if (!p) return;
    if ((cart[id] || 0) >= p.stock) { notify('از این کوچولو بیشتر از ۹ تا نداریم.'); return; }
    cart[id] = (cart[id] || 0) + 1; persistCart(); notify(`${p.name} به سبدت اضافه شد ♡`);
  }
  function toggleFavorite(id) {
    if (!byId(id)) return;
    const oldFocus = document.activeElement;
    favorites = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id];
    write('roban-favorites-v1', favorites); renderProducts();
    if (dialog.open && view === 'product') dialog.querySelector('[data-favorite]')?.setAttribute('aria-pressed', String(favorites.includes(id)));
    else if (oldFocus?.dataset.favorite === id) document.querySelector(`[data-favorite="${id}"]`)?.focus({ preventScroll: true });
    notify(favorites.includes(id) ? 'توی لیست دوست‌داشتنی‌هات موند ♡' : 'از علاقه‌مندی‌ها برداشته شد.');
  }
  function overlayChanged() { document.dispatchEvent(new CustomEvent('roban:overlay', { detail: { open: dialog.open } })); }
  function show(html, nextView) {
    if (!dialog.open) opener = document.activeElement;
    view = nextView;
    $('#dialog-content').innerHTML = html;
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    overlayChanged();
    const focus = nextView === 'checkout' ? dialog.querySelector('input') : dialog.querySelector('[data-action="close"]');
    focus?.focus({ preventScroll: true });
  }
  function close() { dialog.close(); }
  const dialogClosed = () => { view = ''; orderData = {}; overlayChanged(); const focus = opener?.isConnected ? opener : opener?.dataset.product ? document.querySelector(`[data-product="${opener.dataset.product}"]`) : document.querySelector('[data-action="cart"]'); focus?.focus({ preventScroll: true }); };
  dialog.addEventListener('close', dialogClosed);
  function openProduct(id) {
    const p = byId(id); if (!p) return; selectedId = id;
    show(`<div class="product-detail"><div class="detail-image"><img src="${p.image}" width="800" height="800" alt="${p.name}؛ ${p.subtitle}"></div><div><p class="detail-category">${categories[p.cat]} / با عشق انتخاب شده</p><h2 id="dialog-title">${p.name}</h2><p class="detail-description">${p.detail}</p><ul class="detail-specs">${p.specs.map((s) => `<li>${s}</li>`).join('')}</ul><span class="detail-price">${price(p.price)}</span><div class="detail-actions"><button class="btn" data-add="${p.id}">اضافه به سبد قشنگی‌ها ${icon('plus')}</button><button class="favorite-button" data-favorite="${p.id}" aria-label="علاقه‌مندی: ${p.name}" aria-pressed="${favorites.includes(p.id)}">${icon('heart')}</button></div></div></div>`, 'product');
  }
  function openCart(focusKey) {
    const items = cartProducts();
    show(`<h2 id="dialog-title">سبد قشنگی‌های تو <span>(${money(count())})</span></h2>${items.length ? items.map((p) => `<div class="cart-line"><img src="${p.image}" width="82" height="95" alt="${p.name}"><div><h3>${p.name}</h3><p>${price(p.price)}</p><div class="quantity" role="group" aria-label="تعداد ${p.name}"><button data-quantity="${p.id}:plus" ${cart[p.id] >= p.stock ? 'disabled' : ''} aria-label="افزایش تعداد ${p.name}">+</button><span>${money(cart[p.id])}</span><button data-quantity="${p.id}:minus" aria-label="کاهش تعداد ${p.name}">−</button></div></div><div><span class="price">${price(p.price * cart[p.id])}</span><button class="remove-item" data-remove="${p.id}" aria-label="حذف ${p.name}">برداشتن</button></div></div>`).join('') + `<div class="cart-summary"><span>جمع قشنگی‌ها</span><strong>${price(total())}</strong></div><p class="demo-notice">این فروشگاه نمونهٔ نمایشی است؛ محصولات و قیمت‌ها فرضی‌اند و سفارش به پرداخت یا ارسال واقعی منتهی نمی‌شود.</p><button class="btn full-width" data-action="checkout">ادامهٔ سفارش ${icon('arrow')}</button>` : `<div class="empty-cart">${icon('bag')}<h3>سبدت منتظر یه قشنگیه.</h3><p>از بین کوچولوها، دلبرِ خودت رو پیدا کن.</p><button class="btn" data-action="browse">بریم سراغ محصولات ${icon('arrow')}</button></div>`}`, 'cart');
    if (focusKey) dialog.querySelector(`[data-quantity="${focusKey}"]`)?.focus({ preventScroll: true });
  }
  function summary() { return `<div class="checkout-items">${cartProducts().map((p) => `<p><span>${p.name} × ${money(cart[p.id])}</span><span>${price(p.price * cart[p.id])}</span></p>`).join('')}<p class="checkout-total"><span>مجموع سفارش نمایشی</span><span>${price(total())}</span></p></div>`; }
  function checkout() {
    if (!count()) return openCart();
    show(`<button class="back-button" data-action="cart">→ بازگشت به سبد</button><h2 id="dialog-title">قشنگی‌ها برای کی باشه؟</h2>${summary()}<p class="demo-notice">این یک سفارش نمایشی است و پرداخت و ارسال واقعی ندارد. برای امتحان‌کردن فرم، اطلاعات ساختگی وارد کن. اطلاعات فرم ذخیره نمی‌شود.</p><form id="checkout-form" class="checkout-form" novalidate><label class="field">نام و نام خانوادگی<input name="name" autocomplete="off" required maxlength="80" aria-describedby="error-name"><span class="field-error" id="error-name"></span></label><label class="field">شمارهٔ همراه<input name="phone" type="tel" inputmode="tel" autocomplete="off" dir="ltr" required maxlength="20" aria-describedby="error-phone"><span class="field-error" id="error-phone"></span></label><label class="field wide">نشانی کامل<textarea name="address" autocomplete="off" required maxlength="500" aria-describedby="error-address"></textarea><span class="field-error" id="error-address"></span></label><label class="field wide">کد پستی<input name="postal" inputmode="numeric" autocomplete="off" dir="ltr" required maxlength="10" aria-describedby="error-postal"><span class="field-error" id="error-postal"></span></label><button class="btn wide" type="submit">مرور سفارش ${icon('arrow')}</button></form>`, 'checkout');
    for (const [key, value] of Object.entries(orderData)) { const input = dialog.querySelector(`[name="${key}"]`); if (input) input.value = value; }
  }
  const handleSubmit = (event) => {
    if (event.target.id !== 'checkout-form') return;
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const errors = orderErrors(data);
    for (const name of ['name', 'phone', 'address', 'postal']) {
      const field = event.target.elements[name]; field.setAttribute('aria-invalid', String(!!errors[name])); $('#error-' + name).textContent = errors[name] || '';
    }
    const first = Object.keys(errors)[0];
    if (first) { event.target.elements[first].focus(); return; }
    orderData = data;
    show(`<button class="back-button" data-action="edit-order">→ ویرایش اطلاعات</button><h2 id="dialog-title">یک نگاه آخر به انتخاب‌هات</h2>${summary()}<div id="order-address" class="detail-description"></div><p class="demo-notice">با تأیید، فقط یک رسید نمایشی ساخته می‌شود؛ هیچ پرداخت، ارسال یا ذخیرهٔ اطلاعات شخصی انجام نمی‌شود.</p><button class="btn full-width" data-action="confirm-order">تأیید سفارش نمایشی ${icon('heart')}</button>`, 'review');
    $('#order-address').textContent = `${data.name} · ${data.phone} — ${data.address} · کد پستی ${data.postal}`;
  };
  const handleClick = (event) => {
    const target = event.target.closest('button,a'); if (!target) return;
    const d = target.dataset;
    if (d.product) return openProduct(d.product);
    if (d.favorite) return toggleFavorite(d.favorite);
    if (d.add) return add(d.add);
    if (d.category) { state.category = d.category; state.query = ''; state.favoritesOnly = false; $('#search').value = ''; renderProducts(); $('#shop').scrollIntoView({ behavior: 'smooth' }); }
    if (d.filter) { state.category = d.filter; renderProducts(); }
    if (d.quantity) {
      const [id, direction] = d.quantity.split(':'); const p = byId(id); if (!p || !cart[id]) return;
      cart[id] = Math.min(p.stock, cart[id] + (direction === 'plus' ? 1 : -1)); if (!cart[id]) delete cart[id];
      persistCart(); openCart(d.quantity);
    }
    if (d.remove) { delete cart[d.remove]; persistCart(); openCart(); }
    if (d.action === 'cart') openCart();
    if (d.action === 'close') close();
    if (d.action === 'checkout') checkout();
    if (d.action === 'edit-order') checkout();
    if (d.action === 'confirm-order' && view === 'review') {
      const orderTotal = total(), orderCount = count(); cart = {}; persistCart(); orderData = {};
      show(`<div class="success-view">${icon('bow')}<h2 id="dialog-title">قشنگی‌هات انتخاب شدن!</h2><p>سفارش نمایشی تو با موفقیت تکمیل شد.</p><span class="order-reference">${money(orderCount)} کوچولوی دوست‌داشتنی · ${price(orderTotal)}</span><p>این رسید صرفاً نمایشی است؛ پرداخت یا ارسالی انجام نمی‌شود.</p><button class="btn" data-action="browse">دوباره بگردیم؟ ${icon('arrow')}</button></div>`, 'success');
    }
    if (d.action === 'browse') { close(); $('#shop').scrollIntoView({ behavior: 'smooth' }); }
    if (d.action === 'favorites') { state.favoritesOnly = !state.favoritesOnly; renderProducts(); $('#shop').scrollIntoView({ behavior: 'smooth' }); }
    if (d.action === 'reset') { state.query = ''; state.category = 'all'; state.favoritesOnly = false; state.sort = 'newest'; $('#search').value = ''; $('#sort').value = 'newest'; renderProducts(); }
    if (d.action === 'search') { $('#shop').scrollIntoView({ behavior: 'smooth' }); $('#search').focus({ preventScroll: true }); }
    if (target.id === 'clear-search') { state.query = ''; $('#search').value = ''; renderProducts(); $('#search').focus(); }
  };
  const searchInput = () => { state.query = $('#search').value; renderProducts(); };
  const sortInput = () => { state.sort = $('#sort').value; renderProducts(); };
  const outside = (event) => { const r = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) close(); };
  document.addEventListener('click', handleClick); document.addEventListener('submit', handleSubmit);
  dialog.addEventListener('click', outside); $('#search').addEventListener('input', searchInput); $('#sort').addEventListener('change', sortInput);
  renderProducts();
  document.documentElement.classList.add('js');
  let observer;
  if ('IntersectionObserver' in window) { observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: .08 }); $$('.reveal').forEach((el) => observer.observe(el)); }
  else $$('.reveal').forEach((el) => el.classList.add('is-visible'));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  async function startScene() {
    if (reduced.matches) $('#showroom').dataset.scene = 'reduced';
    if (!scene || reduced.matches || disposed || showroom) return;
    try {
      const { mountShowroom } = await import('./scene.js');
      if (disposed || reduced.matches || showroom) return;
      showroom = mountShowroom($('#showroom'), { onProductSelect: openProduct });
    } catch { $('#showroom').dataset.scene = 'fallback'; }
  }
  const motionChanged = () => { if (reduced.matches) { showroom?.dispose(); showroom = null; $('#showroom').dataset.scene = 'reduced'; } else startScene(); };
  reduced.addEventListener('change', motionChanged);
  startScene();
  const pageHide = (event) => { if (!event.persisted) { showroom?.dispose(); showroom = null; } };
  window.addEventListener('pagehide', pageHide);
  return { getState: () => ({ cart: { ...cart }, favorites: [...favorites], ...state, view, selectedId }), dispose() { disposed = true; clearTimeout(toastTimer); observer?.disconnect(); showroom?.dispose(); reduced.removeEventListener('change', motionChanged); document.removeEventListener('click', handleClick); document.removeEventListener('submit', handleSubmit); dialog.removeEventListener('close', dialogClosed); dialog.removeEventListener('click', outside); $('#search').removeEventListener('input', searchInput); $('#sort').removeEventListener('change', sortInput); window.removeEventListener('pagehide', pageHide); } };
}
if (typeof document !== 'undefined' && document.body?.dataset.demo === 'roban' && !globalThis.__ROBAN_NO_AUTOBOOT__) mountStore();
