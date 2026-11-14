import { rackItems, byId, money } from './products.js';

const hanger = `<svg class="rail-hanger" viewBox="0 0 240 105" aria-hidden="true"><path class="rail-hook" d="M120 34V22c0-13 20-13 20-2 0 8-11 10-20 14"/><path class="rail-shoulders" d="m120 34 101 52c5 3 3 8-3 8H22c-6 0-8-5-3-8Z"/></svg>`;

/** A photographic rail: product data and shopping remain owned by the store. */
export function mountRack(root, { onProductOpen } = {}) {
  if (!root) return { dispose() {}, refresh() {}, getState: () => ({}) };
  const q = (selector) => root.querySelector(selector);
  const stage = q('.rail-stage'), slots = q('.rail-items'), status = q('#rail-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = -1, hovered = -1, focused = -1, loaded = false, disposed = false, gesture = null, suppressClick = false;
  let visible = false, overlay = false;
  slots.innerHTML = rackItems.map((item, i) => `<button type="button" class="rail-item" data-rail-index="${i}" aria-label="انتخاب رنگ، سایز و خرید ${byId(item.id).name}" aria-haspopup="dialog" aria-pressed="false" tabindex="${i === 0 ? 0 : -1}" style="--item-color:${item.accent}"><span class="rail-swing"><span class="rail-garment">${hanger}<img class="rail-image rail-image--side" data-src="${item.side}" width="1024" height="1280" alt="" decoding="async" draggable="false"><img class="rail-image rail-image--front" data-src="${item.front}" width="1024" height="1280" alt="" decoding="async" draggable="false"></span></span><span class="rail-label" dir="ltr"><small>0${i + 1}</small>${item.label}</span></button>`).join('');
  const buttons = [...slots.querySelectorAll('.rail-item')];
  const images = [...slots.querySelectorAll('img')];
  const activeIndex = () => hovered >= 0 ? hovered : focused >= 0 ? focused : selected;
  function render() {
    const active = activeIndex();
    root.dataset.active = String(active >= 0);
    buttons.forEach((button, i) => {
      const offset = i - (rackItems.length - 1) / 2;
      const separation = active < 0 || i === active ? 0 : i < active ? -.62 : .62;
      button.style.setProperty('--slot', String(offset * .48 + separation));
      button.style.setProperty('--swing', `${i % 2 ? -1 : 1}deg`);
      button.style.zIndex = String(i === active ? 30 : 10 + i);
      button.dataset.active = String(i === active);
      button.setAttribute('aria-pressed', String(i === selected));
      button.tabIndex = i === (active >= 0 ? active : 0) ? 0 : -1;
    });
    const index = active >= 0 ? active : 0, item = rackItems[index], product = byId(item.id);
    stage.style.setProperty('--mobile-offset', String(-((active >= 0 ? active : 2.5) - 2.5) * .48));
    q('#rail-number').textContent = active >= 0 ? `0${index + 1}` : '—';
    q('#rail-idle').hidden = active >= 0;
    q('#rail-product').hidden = active < 0;
    q('#rail-name').textContent = product.name;
    q('#rail-code').textContent = item.label;
    q('#rail-fabric').textContent = `${product.fabric} / ${product.fit}`;
    q('#rail-price').textContent = money(product.price);
    q('#rail-buy').dataset.product = product.id;
    q('#rail-buy').setAttribute('aria-label', `انتخاب سایز و خرید ${product.name}`);
    root.dataset.paused = String(!visible || document.hidden || overlay || root.hidden || reduced.matches);
  }
  function choose(index, focus = false) {
    selected = (index + rackItems.length) % rackItems.length;
    hovered = -1; focused = -1;
    if (focus) buttons[selected].focus({ preventScroll: true });
    render();
    status.textContent = `${byId(rackItems[selected].id).name}، ${money(selected + 1)} از ${money(rackItems.length)}`;
  }
  const imageReady = (event) => { event.currentTarget.dataset.ready = 'true'; };
  const imageFailed = (event) => {
    const image = event.currentTarget;
    if (image.classList.contains('rail-image--side') && !image.dataset.fallback) {
      image.dataset.fallback = 'true'; image.src = rackItems[Number(image.closest('[data-rail-index]').dataset.railIndex)].front;
    } else {
      image.hidden = true;
      status.textContent = 'دریافت تصویر کامل نشد؛ انتخاب لباس و خرید همچنان در دسترس است.';
    }
  };
  function loadImages() {
    if (loaded || root.hidden) return;
    loaded = true;
    images.forEach((image) => {
      image.addEventListener('load', imageReady); image.addEventListener('error', imageFailed);
      image.src = image.dataset.src;
    });
  }
  function click(event) {
    const item = event.target.closest('[data-rail-index]');
    if (item && suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; return; }
    if (item) {
      const index = Number(item.dataset.railIndex);
      choose(index, true);
      onProductOpen?.(rackItems[index].id);
      return;
    }
    const direction = event.target.closest('[data-rail-step]');
    if (direction) {
      const step = Number(direction.dataset.railStep), current = activeIndex();
      choose(current >= 0 ? current + step : step > 0 ? 0 : rackItems.length - 1);
    }
  }
  function over(event) {
    if (event.pointerType === 'touch' || gesture) return;
    const button = event.target.closest('[data-rail-index]');
    if (button) { hovered = Number(button.dataset.railIndex); render(); }
  }
  function out(event) {
    if (event.relatedTarget && slots.contains(event.relatedTarget)) return;
    hovered = -1; render();
  }
  function focusIn(event) {
    const button = event.target.closest('[data-rail-index]');
    if (button) { focused = Number(button.dataset.railIndex); hovered = -1; render(); }
  }
  function focusOut(event) {
    if (!slots.contains(event.relatedTarget)) { focused = -1; render(); }
  }
  function keyboard(event) {
    if (!event.target.closest('[data-rail-index]')) return;
    const index = activeIndex() < 0 ? 0 : activeIndex();
    if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      choose(event.key === 'Home' ? 0 : event.key === 'End' ? rackItems.length - 1 : index + (event.key === 'ArrowRight' ? 1 : -1), true);
    }
    if (event.key === 'Escape') { selected = hovered = focused = -1; render(); status.textContent = 'نمای کلی رگال'; }
  }
  function pointerDown(event) {
    suppressClick = false;
    if (event.pointerType === 'mouse' || event.isPrimary === false || event.button > 0) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false, vertical: false };
  }
  function pointerMove(event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (!gesture.horizontal && !gesture.vertical && Math.max(Math.abs(dx), Math.abs(dy)) > 12) {
      gesture.horizontal = Math.abs(dx) > Math.abs(dy) * 1.2;
      gesture.vertical = !gesture.horizontal;
      if (gesture.horizontal) stage.setPointerCapture?.(event.pointerId);
    }
    if (gesture.horizontal) event.preventDefault();
  }
  function pointerUp(event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    const start = gesture; gesture = null;
    if (stage.hasPointerCapture?.(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    if (start.horizontal && Math.abs(event.clientX - start.x) > 38) {
      suppressClick = true;
      choose((activeIndex() >= 0 ? activeIndex() : 0) + (event.clientX < start.x ? 1 : -1));
    }
  }
  function cancel() { gesture = null; }
  const visibility = () => render();
  const overlayChanged = (event) => { overlay = !!event.detail.open; render(); };
  const changes = () => render();
  root.addEventListener('click', click, true);
  slots.addEventListener('pointerover', over); slots.addEventListener('pointerleave', out);
  slots.addEventListener('focusin', focusIn); slots.addEventListener('focusout', focusOut);
  slots.addEventListener('keydown', keyboard);
  stage.addEventListener('pointerdown', pointerDown); stage.addEventListener('pointermove', pointerMove, { passive: false });
  stage.addEventListener('pointerup', pointerUp); stage.addEventListener('pointercancel', cancel);
  document.addEventListener('visibilitychange', visibility); document.addEventListener('vector:overlay', overlayChanged);
  window.addEventListener('resize', changes); reduced.addEventListener('change', changes);
  let observer, preloadObserver;
  if ('IntersectionObserver' in window) {
    preloadObserver = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { loadImages(); if (loaded) preloadObserver.unobserve(root); } }, { rootMargin: '350px 0px' });
    preloadObserver.observe(root);
    observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) loadImages(); render(); });
    observer.observe(root);
  } else { visible = true; loadImages(); }
  render();
  return {
    refresh() { if (!disposed) { if (visible) loadImages(); render(); } },
    getState: () => ({ selected, active: activeIndex(), loaded }),
    dispose() {
      if (disposed) return; disposed = true; observer?.disconnect(); preloadObserver?.disconnect();
      root.removeEventListener('click', click, true);
      slots.removeEventListener('pointerover', over); slots.removeEventListener('pointerleave', out);
      slots.removeEventListener('focusin', focusIn); slots.removeEventListener('focusout', focusOut); slots.removeEventListener('keydown', keyboard);
      stage.removeEventListener('pointerdown', pointerDown); stage.removeEventListener('pointermove', pointerMove); stage.removeEventListener('pointerup', pointerUp); stage.removeEventListener('pointercancel', cancel);
      document.removeEventListener('visibilitychange', visibility); document.removeEventListener('vector:overlay', overlayChanged);
      window.removeEventListener('resize', changes); reduced.removeEventListener('change', changes);
      images.forEach((image) => { image.removeEventListener('load', imageReady); image.removeEventListener('error', imageFailed); });
    },
  };
}
