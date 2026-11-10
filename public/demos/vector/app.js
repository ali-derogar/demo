import { products, categories, sizes, featuredIds, byId, money, selectProducts, cleanCart, addToCart, cartLines, variantFor, orderErrors } from './products.js';
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const price = (amount) => `${money(amount)} <small>تومان</small>`;

export function mountStore({ scene = true } = {}) {
  const $ = (selector) => document.querySelector(selector), $$ = (selector) => [...document.querySelectorAll(selector)];
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Selection stays usable with storage disabled. */ } };
  let cart = cleanCart(read('vector-cart-v1', {}));
  const saved = read('vector-favorites-v1', []);
  let favorites = Array.isArray(saved) ? [...new Set(saved.filter((id) => !!byId(id)))] : [];
  const state = { query: '', category: 'all', size: 'all', sort: 'newest', favoritesOnly: false };
  const heroColors = Object.fromEntries(featuredIds.map((id) => [id, byId(id).colors[0].id]));
  let selectedHero = null, selectedId = '', selectedColor = '', selectedSize = '', view = '', orderData = {}, opener = null, oldOverflow = '';
  let showroom = null, disposed = false, pageHidden = false, toastTimer, scenePending = false, menuOpen = false;
  const dialog = $('#shop-dialog'), host = $('#showroom');
  const lines = () => cartLines(cart), count = () => lines().reduce((sum, line) => sum + line.qty, 0);
  const total = () => lines().reduce((sum, line) => sum + line.qty * line.product.price, 0);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scrollTo = (selector) => $(selector)?.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
  function notify(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').classList.add('is-visible'); toastTimer = setTimeout(() => $('#toast').classList.remove('is-visible'), 2700); }
  function updateBadges() {
    $$('.cart-count').forEach((el) => { el.textContent = money(count()); });
    $$('[data-action="cart"]').forEach((el) => el.setAttribute('aria-label', `سبد خرید، ${money(count())} کالا`));
    $('.favorite-count').hidden = !favorites.length;
    $$('[data-action="favorites"]').forEach((el) => el.setAttribute('aria-pressed', String(state.favoritesOnly)));
  }
  function renderProducts() {
    const list = selectProducts({ ...state, favorites: state.favoritesOnly ? favorites : null });
    $('#product-grid').innerHTML = list.map((p) => `<article class="product-card" data-id="${p.id}"><div class="product-photo"><button data-product="${p.id}" aria-label="مشاهدهٔ ${p.name}"><img src="${p.image}" width="900" height="900" loading="lazy" alt="${p.name}؛ رنگ ${p.imageColor}"></button><button class="favorite-button" data-favorite="${p.id}" aria-label="علاقه‌مندی: ${p.name}" aria-pressed="${favorites.includes(p.id)}">${icon('heart')}</button>${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}</div><div class="product-info"><div class="product-code"><span dir="ltr">${p.code}</span><span dir="ltr">VECTOR ORIGINALS</span></div><h3><button data-product="${p.id}">${p.name}</button></h3><div class="product-meta"><span>${p.fit}</span><span class="mini-colors" aria-label="${money(p.colors.length)} رنگ">${p.colors.map((c) => `<i style="background:${c.hex}" title="${c.name}"></i>`).join('')}</span></div><div class="product-bottom"><span class="price">${price(p.price)}</span><button class="add-button" data-product="${p.id}" aria-label="انتخاب سایز و رنگ ${p.name}">${icon('plus')}</button></div></div></article>`).join('');
    $('#result-count').textContent = `${money(list.length)} انتخاب${state.favoritesOnly ? ' از علاقه‌مندی‌های شما' : ' برای مسیر شما'}`;
    $('#empty-state').hidden = list.length > 0; $('#clear-search').hidden = !state.query;
    $$('[data-filter]').forEach((el) => el.setAttribute('aria-pressed', String(el.dataset.filter === state.category))); updateBadges();
  }
  function persistCart() { write('vector-cart-v1', cart); updateBadges(); }
  function toggleFavorite(id) {
    if (!byId(id)) return;
    const focus = document.activeElement;
    favorites = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id]; write('vector-favorites-v1', favorites); renderProducts();
    if (dialog.open) dialog.querySelector(`[data-favorite="${id}"]`)?.setAttribute('aria-pressed', String(favorites.includes(id)));
    else if (focus?.dataset.favorite === id) $(`[data-favorite="${id}"]`)?.focus({ preventScroll: true });
    notify(favorites.includes(id) ? 'در علاقه‌مندی‌های شما ماند.' : 'از علاقه‌مندی‌ها برداشته شد.');
  }
  function overlayChanged() { document.dispatchEvent(new CustomEvent('vector:overlay', { detail: { open: dialog.open || menuOpen } })); }
  function setMenu(open) { menuOpen = open; $('.main-nav').classList.toggle('is-open', open); $('.menu-toggle').setAttribute('aria-expanded', String(open)); $('.menu-toggle').setAttribute('aria-label', open ? 'بستن منو' : 'بازکردن منو'); overlayChanged(); }
  function show(html, nextView) {
    if (!dialog.open) { opener = document.activeElement; oldOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden'; }
    view = nextView; $('#dialog-content').innerHTML = html;
    if (!dialog.open) dialog.showModal(); dialog.scrollTop = 0; overlayChanged();
    (nextView === 'checkout' ? dialog.querySelector('input') : dialog.querySelector('[data-action="close"]'))?.focus({ preventScroll: true });
  }
  const close = () => dialog.close();
  function dialogClosed() {
    view = ''; orderData = {}; document.documentElement.style.overflow = oldOverflow; overlayChanged();
    const focus = opener?.isConnected ? opener : opener?.dataset.product ? $(`[data-product="${opener.dataset.product}"]`) : $('[data-action="cart"]'); focus?.focus({ preventScroll: true });
  }
  dialog.addEventListener('close', dialogClosed);
  function colorButtons(p, color, attribute = 'data-color') {
    return p.colors.map((c) => `<button ${attribute}="${c.id}" aria-label="رنگ ${c.name}" aria-pressed="${color === c.id}" title="${c.name}"><i style="background:${c.hex}"></i></button>`).join('');
  }
  function selectHero(id) {
    const p = byId(id); if (id && !p?.featured) return;
    selectedHero = id; $('.hero').classList.toggle('is-focused', !!id);
    $$('[data-scene-product]').forEach((el) => el.setAttribute('aria-pressed', String(el.dataset.sceneProduct === id)));
    $('#scene-options').hidden = !id;
    if (p) {
      const color = p.colors.find((c) => c.id === heroColors[id]);
      $('#hero-title').textContent = p.name; $('#hero-description').textContent = `${p.fabric} · ${p.fit}`;
      $('.hero-actions').innerHTML = `<button class="btn" data-product="${p.id}" data-from-studio="true">انتخاب سایز و خرید ${icon('arrow')}</button> <span class="hero-price">${price(p.price)}</span>`;
      $('#studio-caption').textContent = `${p.name} / ${color.name}`; $('#scene-colors').innerHTML = colorButtons(p, color.id, 'data-scene-color');
      $('#studio-hint').textContent = host.dataset.scene === 'fallback' ? 'نمای ثابت؛ انتخاب رنگ، سایز و خرید در دسترس است.' : 'برای چرخاندن، افقی بکشید؛ یا از دکمه‌ها استفاده کنید.';
      showroom?.setColor(id, color.hex);
    } else {
      $('#hero-title').innerHTML = 'قواعد خودت را <em>بپوش.</em>'; $('#hero-description').textContent = 'برای مسیرهایی که خودت می‌سازی.';
      $('.hero-actions').innerHTML = `<a class="btn" href="#shop">کالکشن را کشف کن ${icon('arrow')}</a>`;
      $('#studio-caption').textContent = 'یک لباس انتخاب کنید.'; $('#studio-hint').textContent = 'انتخاب کنید، بچرخانید، از نزدیک ببینید.';
    }
    showroom?.select(id);
  }
  function syncProductOptions() {
    const p = byId(selectedId); if (!p || view !== 'product') return;
    const color = p.colors.find((c) => c.id === selectedColor), variant = variantFor(p.id, selectedColor, selectedSize);
    $('#selected-color').textContent = color?.name || 'انتخاب کنید';
    dialog.querySelectorAll('[data-color]').forEach((el) => el.setAttribute('aria-pressed', String(el.dataset.color === selectedColor)));
    dialog.querySelectorAll('[data-size]').forEach((el) => {
      const available = selectedColor ? variantFor(p.id, selectedColor, el.dataset.size)?.stock > 0 : p.variants.some((v) => v.size === el.dataset.size && v.stock > 0);
      el.disabled = !available; el.setAttribute('aria-pressed', String(el.dataset.size === selectedSize));
    });
    $('#variant-status').textContent = variant ? `${money(variant.stock)} عدد موجود در رنگ ${color.name}، سایز ${selectedSize}` : 'رنگ و سایز مناسب خود را انتخاب کنید.';
    $('#selection-error').textContent = '';
    $('#detail-add').disabled = !!variant && (!variant.stock || (cart[`${p.id}~${selectedColor}~${selectedSize}`] || 0) >= variant.stock);
    if (p.featured) {
      const link = dialog.querySelector('[data-action="view-studio"]'); link.textContent = color ? `رنگ ${color.name} را در استودیو ببین ↗` : 'این لباس را در استودیو ببین ↗';
    }
  }
  function openProduct(id, fromStudio = false, retain = false) {
    const p = byId(id); if (!p) return;
    if (!retain) { selectedId = id; selectedColor = fromStudio ? heroColors[id] || '' : ''; selectedSize = ''; }
    show(`<div class="product-detail"><div class="detail-image"><img src="${p.image}" width="900" height="900" alt="${p.name}، رنگ ${p.imageColor}"><span class="image-caption">تصویر محصول در رنگ ${p.imageColor}</span></div><div><p class="detail-code" dir="ltr">${p.code} — VECTOR ORIGINALS</p><h2 id="dialog-title">${p.name}</h2><p class="detail-description">${p.detail}</p><div class="detail-specs"><span>جنس<strong>${p.fabric}</strong></span><span>فرم<strong>${p.fit}</strong></span></div><span class="detail-price">${price(p.price)}</span><p class="option-label">رنگ: <strong id="selected-color">انتخاب کنید</strong></p><div class="color-options" role="group" aria-label="انتخاب رنگ">${colorButtons(p, selectedColor)}</div><div class="option-label"><span>سایز</span><button data-action="size-guide">راهنمای سایز ↙</button></div><div class="size-options" role="group" aria-label="انتخاب سایز">${sizes.map((size) => `<button data-size="${size}" aria-pressed="false">${size}</button>`).join('')}</div><p class="variant-status" id="variant-status" aria-live="polite"></p><p class="selection-error" id="selection-error" role="alert"></p><div class="detail-actions"><button class="btn" id="detail-add" data-add="${p.id}">افزودن به سبد ${icon('plus')}</button><button class="favorite-button" data-favorite="${p.id}" aria-label="علاقه‌مندی: ${p.name}" aria-pressed="${favorites.includes(p.id)}">${icon('heart')}</button></div>${p.featured ? '<button class="scene-detail-link" data-action="view-studio">دیدن در استودیو ↗</button>' : ''}</div></div>`, 'product'); syncProductOptions();
  }
  function openCart(focusKey) {
    const items = lines();
    show(`<h2 id="dialog-title">انتخاب‌های شما <span>(${money(count())})</span></h2>${items.length ? items.map(({ product: p, key, qty, color, size, stock }) => `<div class="cart-line"><img src="${p.image}" width="85" height="100" alt="${p.name}؛ تصویر رنگ ${p.imageColor}"><div><h3>${p.name}</h3><p>${color.name} / سایز <b dir="ltr">${size}</b></p><div class="quantity" role="group" aria-label="تعداد ${p.name} ${color.name} ${size}"><button data-quantity="${key}:minus" aria-label="کاهش تعداد">−</button><span>${money(qty)}</span><button data-quantity="${key}:plus" ${qty >= stock ? 'disabled' : ''} aria-label="افزایش تعداد">+</button></div></div><div><span class="price">${price(p.price * qty)}</span><button class="remove-item" data-remove="${key}" aria-label="حذف ${p.name} ${color.name} ${size}">حذف</button></div></div>`).join('') + `<div class="cart-summary"><span>جمع انتخاب‌ها</span><strong>${price(total())}</strong></div><p class="demo-notice">این فروشگاه نمونهٔ نمایشی است؛ قیمت و موجودی فرضی‌اند و سفارش به پرداخت یا ارسال واقعی منتهی نمی‌شود. برای آزمودن فرم، اطلاعات ساختگی وارد کنید.</p><button class="btn full-width" data-action="checkout">ادامهٔ سفارش ${icon('arrow')}</button>` : `<div class="empty-cart">${icon('bag')}<h3>اولین انتخابت چه خواهد بود؟</h3><p>کالکشن منتظر شماست.</p><button class="btn" data-action="browse">دیدن محصولات ${icon('arrow')}</button></div>`}`, 'cart');
    if (focusKey) dialog.querySelector(`[data-quantity="${focusKey}"]`)?.focus({ preventScroll: true });
  }
  function summary() { return `<div class="checkout-items">${lines().map(({ product: p, qty, color, size }) => `<p><span>${p.name} · ${color.name} / ${size} × ${money(qty)}</span><span>${price(p.price * qty)}</span></p>`).join('')}<p class="checkout-total"><span>مجموع سفارش</span><span>${price(total())}</span></p></div>`; }
  function checkout() {
    if (!count()) return openCart();
    show(`<button class="back-button" data-action="cart">→ بازگشت به سبد</button><h2 id="dialog-title">اطلاعات دریافت‌کننده</h2>${summary()}<p class="size-note">برای امتحان‌کردن این فرم از اطلاعات ساختگی استفاده کنید. اطلاعات فرم ذخیره یا ارسال نمی‌شود.</p><form id="checkout-form" class="checkout-form" novalidate><label class="field">نام و نام خانوادگی<input name="name" autocomplete="off" maxlength="80" required aria-describedby="error-name"><span class="field-error" id="error-name"></span></label><label class="field">شمارهٔ همراه<input name="phone" type="tel" inputmode="tel" dir="ltr" autocomplete="off" maxlength="20" required aria-describedby="error-phone"><span class="field-error" id="error-phone"></span></label><label class="field wide">نشانی کامل<textarea name="address" autocomplete="off" maxlength="500" required aria-describedby="error-address"></textarea><span class="field-error" id="error-address"></span></label><label class="field wide">کد پستی<input name="postal" inputmode="numeric" dir="ltr" autocomplete="off" maxlength="10" required aria-describedby="error-postal"><span class="field-error" id="error-postal"></span></label><button class="btn wide" type="submit">مرور سفارش ${icon('arrow')}</button></form>`, 'checkout');
    for (const [name, value] of Object.entries(orderData)) { const field = dialog.querySelector(`[name="${name}"]`); if (field) field.value = value; }
  }
  function sizeGuide() {
    const back = view === 'product';
    show(`${back ? '<button class="back-button" data-action="back-product">→ بازگشت به انتخاب لباس</button>' : ''}<p class="eyebrow">اندازه‌ها به سانتی‌متر</p><h2 id="dialog-title">فرمی که با شما هماهنگ است.</h2><p class="size-note">این جدول برای بالاتنهٔ کالکشن مفهومی وکتور است. عرض سینه و قد لباس را روی سطح صاف، بدون کشیدن پارچه اندازه بگیرید. برای فرم آزادتر یک سایز بالاتر انتخاب کنید.</p><table class="size-table"><thead><tr><th>سایز</th><th>عرض سینه</th><th>قد بالاتنه</th><th>دور کمر شلوار</th></tr></thead><tbody>${sizes.map((size, i) => `<tr><td dir="ltr">${size}</td><td>${money(52 + i * 3)}</td><td>${money(68 + i * 2)}</td><td>${money(74 + i * 6)}</td></tr>`).join('')}</tbody></table><p class="size-note">عرض سینهٔ بالاتنه با دور سینه متفاوت است. دور کمر شلوار، اندازهٔ کامل محیط کمر است. جدول راهنمای انتخاب نمایشی است.</p>`, 'guide');
  }
  function submit(event) {
    if (event.target.id !== 'checkout-form') return;
    event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)), errors = orderErrors(data);
    for (const name of ['name', 'phone', 'address', 'postal']) { event.target.elements[name].setAttribute('aria-invalid', String(!!errors[name])); $('#error-' + name).textContent = errors[name] || ''; }
    if (Object.keys(errors).length) { event.target.elements[Object.keys(errors)[0]].focus(); return; }
    orderData = data;
    show(`<button class="back-button" data-action="edit-order">→ ویرایش اطلاعات</button><h2 id="dialog-title">یک نگاه آخر.</h2>${summary()}<p id="order-address" class="detail-description"></p><button class="btn full-width" data-action="confirm-order">تأیید سفارش نمایشی ${icon('arrow')}</button>`, 'review');
    $('#order-address').textContent = `${data.name} · ${data.phone} — ${data.address} · کد پستی ${data.postal}`;
  }
  function resetFilters() { Object.assign(state, { query: '', category: 'all', size: 'all', sort: 'newest', favoritesOnly: false }); $('#search').value = ''; $('#size-filter').value = 'all'; $('#sort').value = 'newest'; renderProducts(); }
  function click(event) {
    const button = event.target.closest('button,a');
    if (menuOpen && !event.target.closest('.site-header')) setMenu(false);
    if (!button || button.disabled) return;
    const d = button.dataset;
    if (button.closest('.main-nav') || button.matches('.brand')) setMenu(false);
    if (d.sceneProduct) return selectHero(d.sceneProduct);
    if (d.sceneColor && selectedHero) {
      const c = byId(selectedHero).colors.find((color) => color.id === d.sceneColor); if (!c) return;
      heroColors[selectedHero] = c.id; selectHero(selectedHero); return;
    }
    if (d.sceneAction) {
      if (d.sceneAction === 'reset') return selectHero(null);
      if (host.dataset.scene === 'fallback' || !showroom) return notify('نمای ثابت فعال است؛ می‌توانید رنگ، سایز و خرید را انتخاب کنید.');
      if (d.sceneAction === 'left') showroom.rotate(-Math.PI / 4);
      if (d.sceneAction === 'right') showroom.rotate(Math.PI / 4);
      if (d.sceneAction === 'in') showroom.zoom(.35);
      if (d.sceneAction === 'out') showroom.zoom(-.35);
      return;
    }
    if (d.product) return openProduct(d.product, d.fromStudio === 'true');
    if (d.favorite) return toggleFavorite(d.favorite);
    if (d.color && view === 'product') {
      if (!byId(selectedId).colors.some((c) => c.id === d.color)) return;
      selectedColor = d.color;
      if (selectedSize && !variantFor(selectedId, selectedColor, selectedSize)?.stock) selectedSize = '';
      if (byId(selectedId).featured) { heroColors[selectedId] = selectedColor; showroom?.setColor(selectedId, byId(selectedId).colors.find((c) => c.id === selectedColor).hex); if (selectedHero === selectedId) selectHero(selectedId); }
      syncProductOptions(); return;
    }
    if (d.size && view === 'product') { selectedSize = d.size; syncProductOptions(); return; }
    if (d.add && view === 'product' && d.add === selectedId) {
      const result = addToCart(cart, selectedId, selectedColor, selectedSize);
      if (result.error) { $('#selection-error').textContent = result.error; return; }
      cart = result.cart; persistCart(); syncProductOptions(); notify('انتخاب شما به سبد اضافه شد.'); return;
    }
    if (d.category) { state.category = d.category; state.query = ''; state.favoritesOnly = false; $('#search').value = ''; renderProducts(); scrollTo('#shop'); }
    if (d.filter) { state.category = d.filter; renderProducts(); }
    if (d.quantity) {
      const [key, direction] = d.quantity.split(':'), line = lines().find((l) => l.key === key); if (!line) return;
      const quantity = Math.min(line.stock, line.qty + (direction === 'plus' ? 1 : -1)); if (quantity) cart[key] = quantity; else delete cart[key]; persistCart(); openCart(d.quantity);
    }
    if (d.remove) { delete cart[d.remove]; persistCart(); openCart(); }
    if (d.action === 'cart') { setMenu(false); openCart(); }
    if (d.action === 'close') close();
    if (d.action === 'browse') { close(); scrollTo('#shop'); }
    if (d.action === 'checkout' || d.action === 'edit-order') checkout();
    if (d.action === 'confirm-order' && view === 'review' && count()) {
      const amount = total(), quantity = count(); cart = {}; persistCart(); orderData = {};
      show(`<div class="success-view"><div class="success-mark">↗</div><p class="eyebrow">YOUR NEXT DIRECTION.</p><h2 id="dialog-title">انتخابت ثبت شد.</h2><p>سفارش نمایشی شما کامل شد.</p><span class="order-reference">${money(quantity)} لباس · ${price(amount)}</span><p>این رسید نمایشی است؛ پرداخت یا ارسالی انجام نمی‌شود.</p><button class="btn" data-action="browse">ادامهٔ کشف کالکشن ${icon('arrow')}</button></div>`, 'success');
    }
    if (d.action === 'favorites') { state.favoritesOnly = !state.favoritesOnly; renderProducts(); scrollTo('#shop'); }
    if (d.action === 'reset') resetFilters();
    if (d.action === 'search') { scrollTo('#shop'); $('#search').focus({ preventScroll: true }); }
    if (d.action === 'size-guide') sizeGuide();
    if (d.action === 'back-product') openProduct(selectedId, false, true);
    if (d.action === 'view-studio') { const id = selectedId; close(); selectHero(id); scrollTo('#home'); }
    if (d.action === 'menu') setMenu(!menuOpen);
    if (button.id === 'clear-search') { state.query = ''; $('#search').value = ''; renderProducts(); $('#search').focus(); }
  }
  const searchInput = () => { state.query = $('#search').value; renderProducts(); };
  const sortInput = () => { state.sort = $('#sort').value; renderProducts(); };
  const sizeInput = () => { state.size = $('#size-filter').value; renderProducts(); };
  const outside = (event) => { const r = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) close(); };
  const keyboard = (event) => { if (event.key === 'Escape' && menuOpen) { setMenu(false); $('.menu-toggle').focus(); } else if (event.key === 'Escape' && !dialog.open && selectedHero) selectHero(null); };
  const resize = () => { if (window.innerWidth > 760 && menuOpen) setMenu(false); };
  document.addEventListener('click', click); document.addEventListener('submit', submit); document.addEventListener('keydown', keyboard);
  dialog.addEventListener('click', outside); $('#search').addEventListener('input', searchInput); $('#sort').addEventListener('change', sortInput); $('#size-filter').addEventListener('change', sizeInput); window.addEventListener('resize', resize);
  renderProducts(); document.documentElement.classList.add('js');
  if (window.innerWidth <= 760) selectHero('hoodie-01');
  let revealObserver;
  if ('IntersectionObserver' in window) { revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); } }), { threshold: .08 }); $$('.reveal').forEach((el) => revealObserver.observe(el)); }
  else $$('.reveal').forEach((el) => el.classList.add('is-visible'));
  async function startScene() {
    if (!scene || showroom || disposed || pageHidden || scenePending) return;
    scenePending = true;
    try {
      const { mountShowroom } = await import('./scene.js'); if (disposed || pageHidden) return;
      showroom = mountShowroom(host, { onProductSelect: selectHero });
      for (const id of featuredIds) showroom.setColor(id, byId(id).colors.find((c) => c.id === heroColors[id]).hex);
      showroom.select(selectedHero); overlayChanged();
      if (host.dataset.scene === 'fallback') $('#studio-hint').textContent = 'نمای ثابت؛ انتخاب رنگ، سایز و خرید در دسترس است.';
    } catch { host.dataset.scene = 'fallback'; }
    finally { scenePending = false; }
  }
  const pageHide = () => { pageHidden = true; showroom?.dispose(); showroom = null; };
  const pageShow = () => { pageHidden = false; if (!disposed) startScene(); };
  window.addEventListener('pagehide', pageHide); window.addEventListener('pageshow', pageShow); startScene();
  return { getState: () => ({ cart: { ...cart }, favorites: [...favorites], ...state, selectedId, selectedColor, selectedSize, selectedHero, heroColors: { ...heroColors }, view }), dispose() {
    if (disposed) return; disposed = true; clearTimeout(toastTimer); revealObserver?.disconnect(); showroom?.dispose();
    if (dialog.open) { dialog.close(); document.documentElement.style.overflow = oldOverflow; }
    document.removeEventListener('click', click); document.removeEventListener('submit', submit); document.removeEventListener('keydown', keyboard); dialog.removeEventListener('close', dialogClosed); dialog.removeEventListener('click', outside);
    $('#search').removeEventListener('input', searchInput); $('#sort').removeEventListener('change', sortInput); $('#size-filter').removeEventListener('change', sizeInput); window.removeEventListener('resize', resize); window.removeEventListener('pagehide', pageHide); window.removeEventListener('pageshow', pageShow);
  } };
}
if (typeof document !== 'undefined' && document.body?.dataset.demo === 'vector' && !globalThis.__VECTOR_NO_AUTOBOOT__) mountStore();
