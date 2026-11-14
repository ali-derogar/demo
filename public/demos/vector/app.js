import { mountSoundtrack } from './sound.js?v=vector-3';
import { mountRack } from './rack.js?v=rail-purchase-4';
import { products, categories, sizes, featuredIds, byId, money, selectProducts, cleanCart, addToCart, cartLines, variantFor, orderErrors } from './products.js';
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const price = (amount) => `${money(amount)} <small>تومان</small>`;
const capsules = [{ id: 'hoodie-03', theme: 'core', label: 'CORE' }, { id: 'jacket-01', theme: 'shell', label: 'SHELL' }, { id: 'hoodie-01', theme: 'drift', label: 'DRIFT' }];
const posters = Object.fromEntries(capsules.map(({theme}) => [theme, ['room', 'detail', 'film'].map((phase) => './assets/img/' + phase + '-' + theme + '.webp')]));

export function mountStore({ scene = true, sound = scene } = {}) {
  const $ = (selector) => document.querySelector(selector), $$ = (selector) => [...document.querySelectorAll(selector)];
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Selection stays usable with storage disabled. */ } };
  let cart = cleanCart(read('vector-cart-v1', {}));
  const saved = read('vector-favorites-v1', []);
  let favorites = Array.isArray(saved) ? [...new Set(saved.filter((id) => !!byId(id)))] : [];
  const state = { query: '', category: 'all', size: 'all', sort: 'newest', favoritesOnly: false };
  const heroColors = Object.fromEntries(featuredIds.map((id) => [id, byId(id).colors[0].id]));
  let selectedHero = null, selectedId = '', selectedColor = '', selectedSize = '', view = '', orderData = {}, opener = null, oldOverflow = '';
  let showroom = null, disposed = false, pageHidden = false, toastTimer, scenePending = false, menuOpen = false, mobileIndex = 1, productReady = false, scrollFrame = 0, posterTimer, catalogOpener = null, catalogOverflow = '';
  const dialog = $('#shop-dialog'), host = $('#showroom'), catalog = $('#catalog-dialog');
  $('#rail').hidden = /^#studio\//.test(location.hash);
  const rack = mountRack($('#rail'), { onProductOpen: openProduct });
  const soundtrack = sound ? mountSoundtrack($('#studio-audio'), $('#sound-toggle')) : null;
  const lines = () => cartLines(cart), count = () => lines().reduce((sum, line) => sum + line.qty, 0);
  const total = () => lines().reduce((sum, line) => sum + line.qty * line.product.price, 0);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scrollTo = (selector) => { if (selector !== '#home' && !catalog.open) setMenu(true); $(selector)?.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' }); };
  function notify(message) { clearTimeout(toastTimer); (dialog.open ? dialog : catalog.open ? catalog : document.body).append($('#toast')); $('#toast').textContent = message; $('#toast').classList.add('is-visible'); toastTimer = setTimeout(() => $('#toast').classList.remove('is-visible'), 2700); }
  function updateBadges() {
    $$('.cart-count').forEach((el) => { el.textContent = money(count()); });
    $$('[data-action="cart"]').forEach((el) => el.setAttribute('aria-label', `سبد خرید، ${money(count())} کالا`));
    $('.favorite-count').hidden = !favorites.length;
    $$('[data-action="favorites"]').forEach((el) => el.setAttribute('aria-pressed', String(state.favoritesOnly)));
  }
  function renderProducts() {
    const list = selectProducts({ ...state, favorites: state.favoritesOnly ? favorites : null });
    $('#product-grid').innerHTML = list.map((p) => `<article class="product-card" data-id="${p.id}" data-image-cutout="${p.imageHasAlpha}"><div class="product-photo"><button data-product="${p.id}" aria-label="مشاهدهٔ ${p.name}"><img src="${p.image}" width="${p.imageWidth}" height="${p.imageHeight}" loading="lazy" alt="${p.name}؛ رنگ ${p.imageColor}"></button><button class="favorite-button" data-favorite="${p.id}" aria-label="علاقه‌مندی: ${p.name}" aria-pressed="${favorites.includes(p.id)}">${icon('heart')}</button>${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}</div><div class="product-info"><div class="product-code"><span dir="ltr">${p.code}</span><span dir="ltr">VECTOR ORIGINALS</span></div><h3><button data-product="${p.id}">${p.name}</button></h3><div class="product-meta"><span>${p.fit}</span><span class="mini-colors" aria-label="${money(p.colors.length)} رنگ">${p.colors.map((c) => `<i style="background:${c.hex}" title="${c.name}"></i>`).join('')}</span></div><div class="product-bottom"><span class="price">${price(p.price)}</span><button class="add-button" data-product="${p.id}" aria-label="انتخاب سایز و رنگ ${p.name}">${icon('plus')}</button></div></div></article>`).join('');
    $('#result-count').textContent = `${money(list.length)} مدل${state.favoritesOnly ? ' در علاقه‌مندی‌ها' : ' لباس'}`;
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
    notify(favorites.includes(id) ? 'به علاقه‌مندی‌ها اضافه شد.' : 'از علاقه‌مندی‌ها حذف شد.');
  }
  function overlayChanged() { document.dispatchEvent(new CustomEvent('vector:overlay', { detail: { open: dialog.open || menuOpen } })); }
  function catalogClosed() {
    menuOpen = false; $('.menu-toggle').setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = catalogOverflow; overlayChanged();
    if (catalogOpener?.isConnected) catalogOpener.focus({ preventScroll: true });
    document.body.append($('#toast'));
  }
  function setMenu(open) {
    if (open === catalog.open) return;
    menuOpen = open; $('.menu-toggle').setAttribute('aria-expanded', String(open));
    if (open) { catalogOpener = document.activeElement; catalogOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden'; catalog.showModal(); $('[data-action="close-catalog"]').focus({ preventScroll: true }); }
    else catalog.close();
    overlayChanged();
  }
  catalog.addEventListener('close', catalogClosed);
  function show(html, nextView) {
    if (!dialog.open) { opener = document.activeElement; oldOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden'; }
    view = nextView; $('#dialog-content').innerHTML = html;
    if (!dialog.open) dialog.showModal(); dialog.scrollTop = 0; overlayChanged();
    (nextView === 'checkout' ? dialog.querySelector('input') : dialog.querySelector('[data-action="close"]'))?.focus({ preventScroll: true });
  }
  const close = () => dialog.close();
  function dialogClosed() {
    view = ''; orderData = {}; document.documentElement.style.overflow = oldOverflow; (catalog.open ? catalog : document.body).append($('#toast')); overlayChanged();
    const focus = opener?.isConnected ? opener : opener?.dataset.product ? $(`[data-product="${opener.dataset.product}"]`) : $('[data-action="cart"]'); focus?.focus({ preventScroll: true });
  }
  dialog.addEventListener('close', dialogClosed);
  function colorButtons(p, color, attribute = 'data-color') {
    return p.colors.map((c) => `<button ${attribute}="${c.id}" aria-label="رنگ ${c.name}" aria-pressed="${color === c.id}" title="${c.name}"><i style="background:${c.hex}"></i></button>`).join('');
  }
  function updateStoryScroll() {
    scrollFrame = 0; if (!selectedHero) return;
    const track = $('#story-track'), top = track.getBoundingClientRect().top + window.scrollY;
    const progress = Math.max(0, Math.min(1, (window.scrollY - top) / Math.max(1, track.offsetHeight - window.innerHeight)));
    showroom?.setProgress(progress);
    const phase = progress < .24 ? 0 : progress < .77 ? 1 : 2;
    $('#story-step').textContent = ['01 / THE STUDIO', '02 / EVERY ANGLE', '03 / THE COLLECTION'][phase];
    $('#story-progress-bar').style.transform = `scaleX(${progress})`;
    $$('[data-story-step]').forEach((el, index) => { if (index === phase) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current'); });
    $('#story-offer').hidden = progress < .86; $('#scroll-hint').hidden = progress > .97;
    const capsule = capsules.find((c) => c.id === selectedHero);
    const image = posters[capsule.theme][phase]; if ($('.showroom-poster').getAttribute('src') !== image) $('.showroom-poster').src = image;
  }
  function scrollChanged() { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateStoryScroll); }
  function selectHero(id, updateHistory = true) {
    const capsule = capsules.find((c) => c.id === id); if (id && !capsule) return;
    selectedHero = id; productReady = false; document.body.classList.toggle('story-active', !!id);
    $('#rail').hidden = !!id; rack.refresh();
    document.body.dataset.studioTheme = capsule?.theme || 'home';
    $('#home-ui').hidden = !!id; $('#story-track').hidden = !id; $('#story-ui').hidden = !id;
    $$('[data-scene-product]').forEach((el) => el.setAttribute('aria-pressed', String(el.dataset.sceneProduct === id)));
    if (capsule) {
      $('#story-name').textContent = `VECTOR / ${capsule.label}`; $('#story-buy').dataset.product = id;
      $('#offer-copy').textContent = byId(id).name; $('.showroom-poster').src = posters[capsule.theme][0];
      host.classList.add('is-static'); window.scrollTo({ top: 0, behavior: 'instant' });
      showroom?.select(id); updateStoryScroll();
    } else {
      $('.showroom-poster').src = './assets/img/hero-01.webp'; host.classList.remove('is-static');
      $('#load-state').hidden = true; showroom?.select(null); window.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (updateHistory) {
      const hash = capsule ? '#studio/' + capsule.theme : '#home';
      if (location.hash !== hash) history.pushState({ vectorStudio: capsule?.theme || null }, '', hash);
    }
  }
  function sceneStatus(status) {
    if (disposed) return;
    if (status === 'loading-product') { $('#load-state').hidden = false; $('#load-state').classList.add('is-product'); $('#load-label').textContent = 'در حال آماده‌سازی کالکشن'; }
    if (status === 'product-ready') { productReady = true; host.classList.remove('is-static'); $('#load-state').hidden = true; updateStoryScroll(); }
    if (status === 'ready' && (!selectedHero || productReady)) { host.classList.remove('is-static'); $('#load-state').hidden = true; }
    if (['fallback', 'context-lost', 'partial', 'product-error'].includes(status)) {
      host.classList.add('is-static'); $('#load-state').hidden = false; $('#load-state').classList.toggle('is-product', !!selectedHero);
      $('#load-label').textContent = 'نمای ثابت در دسترس است.'; $('#poster-entry').hidden = false;
      $('#studio-hint').textContent = 'برای دیدن جزئیات، یک لباس انتخاب کنید.';
    }
  }
  function routeChanged() {
    if (location.hash === '#rail') { if (selectedHero) selectHero(null, false); $('#rail').scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' }); return; }
    const match = /^#studio\/(core|drift|shell|white|sport|gray)$/.exec(location.hash); const aliases = { white: 'core', sport: 'drift', gray: 'shell' };
    selectHero(match ? capsules.find((c) => c.theme === (aliases[match[1]] || match[1])).id : null, false);
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
      const link = dialog.querySelector('[data-action="view-studio"]'); link.textContent = `مدل ${p.imageColor} را از نزدیک ببینید ↗`;
    }
  }
  function openProduct(id, fromStudio = false, retain = false) {
    const p = byId(id); if (!p) return;
    if (!retain) { selectedId = id; selectedColor = fromStudio ? heroColors[id] || '' : ''; selectedSize = ''; }
    show(`<div class="product-detail"><div class="detail-image" data-transparent="${p.imageHasAlpha}"><img src="${p.image}" width="${p.imageWidth}" height="${p.imageHeight}" alt="${p.name}، رنگ ${p.imageColor}"><span class="image-caption">تصویر محصول در رنگ ${p.imageColor}</span></div><div><p class="detail-code" dir="ltr">${p.code} — VECTOR ORIGINALS</p><h2 id="dialog-title">${p.name}</h2><p class="detail-description">${p.detail}</p><div class="detail-specs"><span>جنس<strong>${p.fabric}</strong></span><span>فرم<strong>${p.fit}</strong></span></div><span class="detail-price">${price(p.price)}</span><p class="option-label">رنگ: <strong id="selected-color">انتخاب کنید</strong></p><div class="color-options" role="group" aria-label="انتخاب رنگ">${colorButtons(p, selectedColor)}</div><div class="option-label"><span>سایز</span><button data-action="size-guide">راهنمای سایز ↙</button></div><div class="size-options" role="group" aria-label="انتخاب سایز">${sizes.map((size) => `<button data-size="${size}" aria-pressed="false">${size}</button>`).join('')}</div><p class="variant-status" id="variant-status" aria-live="polite"></p><p class="selection-error" id="selection-error" role="alert"></p><div class="detail-actions"><button class="btn" id="detail-add" data-add="${p.id}">افزودن به سبد ${icon('plus')}</button><button class="favorite-button" data-favorite="${p.id}" aria-label="علاقه‌مندی: ${p.name}" aria-pressed="${favorites.includes(p.id)}">${icon('heart')}</button></div><button class="scene-detail-link" data-action="cart">دیدن سبد خرید ↗</button>${p.featured ? '<button class="scene-detail-link" data-action="view-studio">دیدن در استودیو ↗</button>' : ''}</div></div>`, 'product'); syncProductOptions();
  }
  function openCart(focusKey) {
    const items = lines();
    show(`<h2 id="dialog-title">سبد خرید <span>(${money(count())})</span></h2>${items.length ? items.map(({ product: p, key, qty, color, size, stock }) => `<div class="cart-line"><img src="${p.image}" width="85" height="100" alt="${p.name}؛ تصویر رنگ ${p.imageColor}"><div><h3>${p.name}</h3><p>${color.name} / سایز <b dir="ltr">${size}</b></p><div class="quantity" role="group" aria-label="تعداد ${p.name} ${color.name} ${size}"><button data-quantity="${key}:minus" aria-label="کاهش تعداد">−</button><span>${money(qty)}</span><button data-quantity="${key}:plus" ${qty >= stock ? 'disabled' : ''} aria-label="افزایش تعداد">+</button></div></div><div><span class="price">${price(p.price * qty)}</span><button class="remove-item" data-remove="${key}" aria-label="حذف ${p.name} ${color.name} ${size}">حذف</button></div></div>`).join('') + `<div class="cart-summary"><span>جمع سبد خرید</span><strong>${price(total())}</strong></div><p class="demo-notice">این فروشگاه یک نمونه‌کار است. قیمت‌ها و موجودی آزمایشی‌اند و خرید واقعی انجام نمی‌شود. برای امتحان کردن فرم، اطلاعات ساختگی بنویسید.</p><button class="btn full-width" data-action="checkout">ادامهٔ سفارش ${icon('arrow')}</button>` : `<div class="empty-cart">${icon('bag')}<h3>سبد خریدتان خالی است.</h3><p>هنوز لباسی به سبد اضافه نکرده‌اید.</p><button class="btn" data-action="browse">دیدن لباس‌ها ${icon('arrow')}</button></div>`}`, 'cart');
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
    show(`${back ? '<button class="back-button" data-action="back-product">→ بازگشت به انتخاب لباس</button>' : ''}<p class="eyebrow">اندازه‌ها به سانتی‌متر</p><h2 id="dialog-title">راهنمای سایز</h2><p class="size-note">یکی از لباس‌هایی که اندازه‌تان است را روی سطح صاف بگذارید. عرض سینه، قد و دور کمر آن را بدون کشیدن پارچه اندازه بگیرید و با جدول مقایسه کنید.</p><table class="size-table"><thead><tr><th>سایز</th><th>عرض سینه</th><th>قد بالاتنه</th><th>دور کمر شلوار</th></tr></thead><tbody>${sizes.map((size, i) => `<tr><td dir="ltr">${size}</td><td>${money(52 + i * 3)}</td><td>${money(68 + i * 2)}</td><td>${money(74 + i * 6)}</td></tr>`).join('')}</tbody></table><p class="size-note">عرض سینه، فاصلهٔ دو طرف لباس است؛ دور کمر، اندازهٔ کامل کمر شلوار. این جدول نمونه است و برای خرید واقعی کاربرد ندارد.</p>`, 'guide');
  }
  function submit(event) {
    if (event.target.id !== 'checkout-form') return;
    event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)), errors = orderErrors(data);
    for (const name of ['name', 'phone', 'address', 'postal']) { event.target.elements[name].setAttribute('aria-invalid', String(!!errors[name])); $('#error-' + name).textContent = errors[name] || ''; }
    if (Object.keys(errors).length) { event.target.elements[Object.keys(errors)[0]].focus(); return; }
    orderData = data;
    show(`<button class="back-button" data-action="edit-order">→ ویرایش اطلاعات</button><h2 id="dialog-title">مرور سفارش</h2>${summary()}<p id="order-address" class="detail-description"></p><button class="btn full-width" data-action="confirm-order">تأیید سفارش نمایشی ${icon('arrow')}</button>`, 'review');
    $('#order-address').textContent = `${data.name} · ${data.phone} — ${data.address} · کد پستی ${data.postal}`;
  }
  function resetFilters() { Object.assign(state, { query: '', category: 'all', size: 'all', sort: 'newest', favoritesOnly: false }); $('#search').value = ''; $('#size-filter').value = 'all'; $('#sort').value = 'newest'; renderProducts(); }
  function click(event) {
    const button = event.target.closest('button,a');
    if (menuOpen && event.target === catalog) return;
    if (!button || button.disabled) return;
    const d = button.dataset;
    if (button.matches('.brand')) setMenu(false);
    if (d.sceneProduct) return selectHero(d.sceneProduct);
    if (d.sceneAction) {
      if (d.sceneAction === 'reset') return selectHero(null);
      if (d.sceneAction === 'prev' || d.sceneAction === 'next') {
        mobileIndex = Math.max(0, Math.min(2, mobileIndex + (d.sceneAction === 'next' ? 1 : -1)));
        showroom?.focus(mobileIndex); $('#studio-hint').textContent = `ORIGINALS / ${capsules[mobileIndex].label} — برای ورود انتخاب کنید.`; return;
      }
      if (!showroom || host.dataset.scene !== 'ready' || host.classList.contains('is-static')) return notify('نمای ثابت فعال است؛ انتخاب سایز و خرید در دسترس است.');
      if (d.sceneAction === 'left') showroom.rotate(-Math.PI / 4);
      if (d.sceneAction === 'right') showroom.rotate(Math.PI / 4);
      if (d.sceneAction === 'in') showroom.zoom(.15);
      if (d.sceneAction === 'out') showroom.zoom(-.15);
      return;
    }
    if (d.storyStep !== undefined && selectedHero) {
      const track = $('#story-track'), top = track.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + Number(d.storyStep) * Math.max(1, track.offsetHeight - window.innerHeight), behavior: reduced.matches ? 'auto' : 'smooth' }); return;
    }
    if (d.product) return openProduct(d.product, d.fromStudio === 'true');
    if (d.favorite) return toggleFavorite(d.favorite);
    if (d.color && view === 'product') {
      if (!byId(selectedId).colors.some((c) => c.id === d.color)) return;
      selectedColor = d.color;
      if (selectedSize && !variantFor(selectedId, selectedColor, selectedSize)?.stock) selectedSize = '';
      if (byId(selectedId).featured) heroColors[selectedId] = selectedColor;
      syncProductOptions(); return;
    }
    if (d.size && view === 'product') { selectedSize = d.size; syncProductOptions(); return; }
    if (d.add && view === 'product' && d.add === selectedId) {
      const result = addToCart(cart, selectedId, selectedColor, selectedSize);
      if (result.error) { $('#selection-error').textContent = result.error; return; }
      cart = result.cart; persistCart(); syncProductOptions(); notify('به سبد خرید اضافه شد.'); return;
    }
    if (d.category) { state.category = d.category; state.query = ''; state.favoritesOnly = false; $('#search').value = ''; renderProducts(); scrollTo('#shop'); }
    if (d.filter) { state.category = d.filter; renderProducts(); }
    if (d.quantity) {
      const [key, direction] = d.quantity.split(':'), line = lines().find((l) => l.key === key); if (!line) return;
      const quantity = Math.min(line.stock, line.qty + (direction === 'plus' ? 1 : -1)); if (quantity) cart[key] = quantity; else delete cart[key]; persistCart(); openCart(d.quantity);
    }
    if (d.remove) { delete cart[d.remove]; persistCart(); openCart(); }
    if (d.action === 'cart') openCart();
    if (d.action === 'close') close();
    if (d.action === 'browse') { close(); scrollTo('#shop'); }
    if (d.action === 'checkout' || d.action === 'edit-order') checkout();
    if (d.action === 'confirm-order' && view === 'review' && count()) {
      const amount = total(), quantity = count(); cart = {}; persistCart(); orderData = {};
      show(`<div class="success-view"><div class="success-mark">↗</div><p class="eyebrow">سفارش آزمایشی</p><h2 id="dialog-title">سفارش شما ثبت شد.</h2><p>ممنون که فروشگاه وکتور را امتحان کردید.</p><span class="order-reference">${money(quantity)} لباس · ${price(amount)}</span><p>این رسید نمایشی است؛ پرداخت یا ارسالی انجام نمی‌شود.</p><button class="btn" data-action="browse">بازگشت به لباس‌ها ${icon('arrow')}</button></div>`, 'success');
    }
    if (d.action === 'favorites') { state.favoritesOnly = !state.favoritesOnly; renderProducts(); scrollTo('#shop'); }
    if (d.action === 'reset') resetFilters();
    if (d.action === 'search') { scrollTo('#shop'); $('#search').focus({ preventScroll: true }); }
    if (d.action === 'size-guide') sizeGuide();
    if (d.action === 'back-product') openProduct(selectedId, false, true);
    if (d.action === 'view-studio') { const id = selectedId; close(); setMenu(false); selectHero(id); }
    if (d.action === 'menu') setMenu(!menuOpen);
    if (d.action === 'catalog') { setMenu(true); }
    if (d.action === 'close-catalog') setMenu(false);
    if (d.action === 'home') { event.preventDefault(); if (dialog.open) close(); setMenu(false); selectHero(null); }
    if (d.action === 'poster') { $('#load-state').hidden = true; }
    if (d.action === 'credits') show('<h2 id="dialog-title">دربارهٔ وکتور</h2><p class="credits-copy">وکتور یک نمونه‌کار فروشگاه لباس است. در استودیو می‌توانید سه لباس اصلی را از نزدیک ببینید و در پایین صفحه، شش لباس تازه را روی رگال مرور کنید. هر مدل را که پسندیدید، رنگ و سایزش را انتخاب کنید. سفارش و پرداخت نمایشی‌اند.</p>', 'credits');
    if (button.id === 'clear-search') { state.query = ''; $('#search').value = ''; renderProducts(); $('#search').focus(); }
  }
  const searchInput = () => { state.query = $('#search').value; renderProducts(); };
  const sortInput = () => { state.sort = $('#sort').value; renderProducts(); };
  const sizeInput = () => { state.size = $('#size-filter').value; renderProducts(); };
  const outside = (event) => { const r = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) close(); };
  const keyboard = (event) => {
    if (event.key !== 'Escape' || dialog.open) return;
    if (catalog.open) { event.preventDefault(); setMenu(false); }
    else if (selectedHero) selectHero(null);
  };
  const resize = () => { if (selectedHero) updateStoryScroll(); };
  document.addEventListener('click', click); document.addEventListener('submit', submit); document.addEventListener('keydown', keyboard);
  dialog.addEventListener('click', outside); $('#search').addEventListener('input', searchInput); $('#sort').addEventListener('change', sortInput); $('#size-filter').addEventListener('change', sizeInput); window.addEventListener('resize', resize);
  renderProducts(); document.documentElement.classList.add('js');
  $('#catalog-count').textContent = money(products.length);
  if (!scene) { host.classList.add('is-static'); $('#load-state').hidden = true; }
  let revealObserver;
  if ('IntersectionObserver' in window) { revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); } }), { threshold: .08 }); $$('.reveal').forEach((el) => revealObserver.observe(el)); }
  else $$('.reveal').forEach((el) => el.classList.add('is-visible'));
  async function startScene() {
    if (!scene || showroom || disposed || pageHidden || scenePending) return;
    scenePending = true;
    try {
      const { mountShowroom } = await import('./scene.js?v=collection-6'); if (disposed || pageHidden) return;
      showroom = mountShowroom(host, { onProductSelect: selectHero, onShop: () => setMenu(true), onStatus: sceneStatus, onProgress: (value) => { $('#load-progress').style.transform = `scaleX(${value})`; } });
      showroom.focus(mobileIndex); if (selectedHero) showroom.select(selectedHero); overlayChanged();
    } catch { host.dataset.scene = 'fallback'; sceneStatus('fallback'); }
    finally { scenePending = false; }
  }
  const pageHide = () => { pageHidden = true; showroom?.dispose(); showroom = null; };
  const pageShow = () => { pageHidden = false; if (!disposed) startScene(); };
  window.addEventListener('pagehide', pageHide); window.addEventListener('pageshow', pageShow);
  window.addEventListener('scroll', scrollChanged, { passive: true }); window.addEventListener('popstate', routeChanged); window.addEventListener('hashchange', routeChanged);
  if (/^#studio\//.test(location.hash) || location.hash === '#rail') routeChanged(); startScene();
  posterTimer = setTimeout(() => { if (!$('#load-state').hidden) $('#poster-entry').hidden = false; }, 7000);
  return { getState: () => ({ cart: { ...cart }, favorites: [...favorites], ...state, selectedId, selectedColor, selectedSize, selectedHero, heroColors: { ...heroColors }, view, rack: rack.getState() }), dispose() {
    if (disposed) return; disposed = true; rack.dispose(); soundtrack?.dispose(); clearTimeout(toastTimer); clearTimeout(posterTimer); cancelAnimationFrame(scrollFrame); revealObserver?.disconnect(); showroom?.dispose();
    if (dialog.open) { dialog.close(); document.documentElement.style.overflow = oldOverflow; }
    if (catalog.open) catalog.close(); catalog.removeEventListener('close', catalogClosed);
    document.removeEventListener('click', click); document.removeEventListener('submit', submit); document.removeEventListener('keydown', keyboard); dialog.removeEventListener('close', dialogClosed); dialog.removeEventListener('click', outside);
    $('#search').removeEventListener('input', searchInput); $('#sort').removeEventListener('change', sortInput); $('#size-filter').removeEventListener('change', sizeInput); window.removeEventListener('resize', resize); window.removeEventListener('pagehide', pageHide); window.removeEventListener('pageshow', pageShow); window.removeEventListener('scroll', scrollChanged); window.removeEventListener('popstate', routeChanged); window.removeEventListener('hashchange', routeChanged);
  } };
}
if (typeof document !== 'undefined' && document.body?.dataset.demo === 'vector' && !globalThis.__VECTOR_NO_AUTOBOOT__) mountStore();
