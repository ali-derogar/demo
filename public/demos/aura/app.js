import { services, calendarOptions, slotsForDay, validateBooking } from './services.js';

export function mountAura({ scene = true } = {}) {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const events = new AbortController();
  const listen = (target, event, handler, options = {}) => target.addEventListener(event, handler, { ...options, signal: events.signal });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 'botox', look = 'solid', sceneController, heroController, disposed = false, observer, sceneObserver, motionFrame = 0;
  let sceneModule;
  const sceneAPI = () => sceneModule ??= import('./scene.js');

  function selectRegion(id) {
    if (!services[id]?.title) return;
    active = id;
    const service = services[id];
    $$('[data-region]').forEach((button) => { const selected = button.dataset.region === id; button.classList.toggle('is-active', selected); button.setAttribute('aria-pressed', String(selected)); });
    $('#atlas-number').textContent = service.number;
    $('#atlas-name').replaceChildren(document.createTextNode(service.title[0]), document.createElement('br'), document.createTextNode(service.title[1]));
    $('#atlas-description').textContent = service.description;
    $('#atlas-first').textContent = service.first;
    $('#atlas-book').dataset.book = id;
    $('#atlas-book').replaceChildren(document.createTextNode(`نوبت مشاورهٔ ${id === 'filler' ? 'ژل لب' : id === 'skin' ? 'پوست' : id === 'laser' ? 'لیزر' : 'بوتاکس'} `), Object.assign(document.createElement('span'), { textContent: '↖' }));
    $('#atlas-book span').setAttribute('aria-hidden', 'true');
    const detail = $('#atlas-detail'); detail.classList.remove('changing');
    if (!reduced.matches) { void detail.offsetWidth; detail.classList.add('changing'); }
    sceneController?.select(id);
    $$('[data-service-visual]').forEach((visual) => visual.classList.toggle('is-active', visual.dataset.serviceVisual === id));
    $('#service-visual-label').textContent = { botox: '01 / BOTOX', filler: '02 / FILLER', laser: '03 / LASER', skin: '04 / SKIN' }[id];
  }
  $$('[data-region]').forEach((button) => listen(button, 'click', () => selectRegion(button.dataset.region)));
  $$('.treatment-toggle').forEach((toggle) => listen(toggle, 'click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    $$('.treatment-toggle').forEach((other) => {
      const expanded = other === toggle && open;
      other.setAttribute('aria-expanded', String(expanded));
      $(`#${other.getAttribute('aria-controls')}`).hidden = !expanded;
      other.closest('.treatment').classList.toggle('is-open', expanded);
    });
    if (open) selectRegion(toggle.closest('.treatment').dataset.treatment);
  }));
  $$('[data-look]').forEach((button) => listen(button, 'click', () => {
    look = button.dataset.look;
    $$('[data-look]').forEach((control) => control.setAttribute('aria-pressed', String(control === button)));
    $('#sculpture').dataset.look = look;
    sceneController?.setLook(look);
  }));

  const menu = $('#main-nav'), menuToggle = $('#menu-toggle');
  function closeMenu(focus = false) { menu.classList.remove('is-open'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'باز کردن منو'); if (focus) menuToggle.focus({ preventScroll: true }); }
  listen(menuToggle, 'click', () => { const open = menuToggle.getAttribute('aria-expanded') !== 'true'; menu.classList.toggle('is-open', open); menuToggle.setAttribute('aria-expanded', String(open)); menuToggle.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو'); });
  $$('#main-nav a').forEach((a) => listen(a, 'click', () => closeMenu()));
  listen(document, 'pointerdown', (e) => { if (!menu.contains(e.target) && !menuToggle.contains(e.target)) closeMenu(); });
  listen(document, 'keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu(true); });
  listen(window, 'resize', () => { if (window.innerWidth > 800) closeMenu(); }, { passive: true });

  const dialog = $('#booking-dialog'), form = $('#booking-form'), serviceSelect = $('#booking-service');
  const flow = $('#booking-flow'), review = $('#booking-review'), success = $('#booking-success');
  let days = [], selection = { service: 'general', day: '', time: '' }, returnFocus, pending = null;
  function overlay(open) { document.body.classList.toggle('has-dialog', open); document.dispatchEvent(new CustomEvent('aura:overlay', { detail: { open } })); }
  function showStep(step) {
    [flow, review, success].forEach((node) => { node.hidden = node !== step; });
    const title = step.querySelector('h2'); title.tabIndex = -1;
    dialog.setAttribute('aria-labelledby', title.id);
    title.focus({ preventScroll: true });
    dialog.scrollTop = 0;
  }
  function renderTimes() {
    const container = $('#time-options'); container.replaceChildren();
    if (!selection.day) { const hint = document.createElement('span'); hint.className = 'time-hint'; hint.textContent = 'برای دیدن ساعت‌های خالی، ابتدا روز مراجعه را انتخاب کنید.'; container.append(hint); return; }
    for (const slot of slotsForDay(selection.day)) {
      const label = document.createElement('label'); label.className = 'time-choice';
      const input = document.createElement('input'); input.type = 'radio'; input.name = 'time'; input.value = slot.id; input.disabled = !slot.available; input.checked = selection.time === slot.id; input.setAttribute('aria-label', `${slot.label}${slot.available ? '' : '، در دسترس نیست'}`);
      const text = document.createElement('span'); text.textContent = slot.label;
      label.append(input, text); container.append(label);
    }
  }
  function renderDates() {
    $('#date-options').replaceChildren();
    for (const day of days) {
      const label = document.createElement('label'); label.className = 'date-choice';
      const input = document.createElement('input'); input.type = 'radio'; input.name = 'day'; input.value = day.id; input.checked = selection.day === day.id; input.setAttribute('aria-label', day.full);
      const body = document.createElement('span');
      for (const [tag, value] of [['small', day.weekday], ['strong', day.day], ['em', day.month]]) body.append(Object.assign(document.createElement(tag), { textContent: value }));
      label.append(input, body); $('#date-options').append(label);
    }
    renderTimes();
  }
  function openBooking(trigger) {
    if (dialog.open) return;
    returnFocus = trigger;
    closeMenu();
    days = calendarOptions();
    selection = { service: Object.hasOwn(services, trigger.dataset.book) ? trigger.dataset.book : 'general', day: '', time: '' };
    serviceSelect.value = selection.service; pending = null; $('#booking-error').textContent = '';
    renderDates();
    flow.hidden = false; review.hidden = true; success.hidden = true;
    dialog.setAttribute('aria-labelledby', 'booking-title');
    dialog.showModal(); overlay(true); showStep(flow);
  }
  $$('[data-book]').forEach((button) => listen(button, 'click', () => openBooking(button)));
  $$('[data-close]').forEach((button) => listen(button, 'click', () => dialog.close()));
  listen(dialog, 'close', () => { overlay(false); pending = null; returnFocus?.focus({ preventScroll: true }); });
  listen(dialog, 'click', (event) => { if (event.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); });
  listen(serviceSelect, 'change', () => { selection.service = serviceSelect.value; $('#booking-error').textContent = ''; });
  listen(form, 'change', (event) => {
    if (event.target.name === 'day') { selection.day = event.target.value; selection.time = ''; renderTimes(); }
    if (event.target.name === 'time') selection.time = event.target.value;
    $('#booking-error').textContent = '';
  });
  function receipt(container, value) {
    container.replaceChildren();
    const day = days.find((d) => d.id === value.day), slot = slotsForDay(value.day).find((s) => s.id === value.time);
    for (const [label, text] of [['خدمت', services[value.service].label], ['روز مراجعه', day.full], ['ساعت', slot.label]]) {
      const row = document.createElement('div');
      row.append(Object.assign(document.createElement('dt'), { textContent: label }), Object.assign(document.createElement('dd'), { textContent: text })); container.append(row);
    }
  }
  listen(form, 'submit', (event) => {
    event.preventDefault();
    selection.service = serviceSelect.value;
    const error = validateBooking(selection, days);
    $('#booking-error').textContent = error;
    if (error) { const target = !selection.day ? $('input[name="day"]') : $('input[name="time"]:not(:disabled)'); target?.focus(); return; }
    pending = { ...selection }; receipt($('#review-details'), pending); showStep(review);
  });
  listen($('#edit-booking'), 'click', () => { pending = null; showStep(flow); });
  listen($('#confirm-booking'), 'click', () => {
    if (!pending) return;
    const current = calendarOptions();
    const error = validateBooking(pending, current);
    if (error) { days = current; selection.day = ''; selection.time = ''; pending = null; renderDates(); showStep(flow); $('#booking-error').textContent = 'این زمان دیگر در فهرست نوبت‌ها نیست. لطفاً روز و ساعت دیگری انتخاب کنید.'; return; }
    receipt($('#success-details'), pending); pending = null; showStep(success);
  });

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => { for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }, { threshold: .08, rootMargin: '0px 0px 10px 0px' });
    $$('.reveal').forEach((el) => observer.observe(el)); document.documentElement.classList.add('js-ready');
  }
  // Scroll controls image depth and the introduction's word reveal, without taking over native scrolling.
  const words = [];
  const lens = $('#portrait-lens'), campaign = $('#campaign-image'), detailToggle = $('#detail-toggle');
  let detailOpen = false, photoPointer = null;
  listen(detailToggle, 'click', () => { detailOpen = !detailOpen; detailToggle.setAttribute('aria-pressed', String(detailOpen)); detailToggle.firstChild.textContent = detailOpen ? 'بستن نمای نزدیک ' : 'جزئیات تصویر '; detailToggle.querySelector('span').textContent = detailOpen ? '−' : '+'; photoPointer = null; scheduleMotion(); });
  listen($('#home'), 'pointermove', (event) => {
    if (!detailOpen || event.pointerType !== 'mouse') return;
    const r = $('#home').getBoundingClientRect();
    if (event.clientX < r.left + r.width * .58) photoPointer = { x: event.clientX, y: event.clientY };
    scheduleMotion();
  }, { passive: true });
  listen($('#home'), 'pointerleave', () => { photoPointer = null; scheduleMotion(); });
  $$('.word-reveal').forEach((heading) => {
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT), textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    for (const node of textNodes) {
      const fragment = document.createDocumentFragment();
      for (const value of node.textContent.split(/(\s+)/)) {
        if (!value) continue;
        if (/^\s+$/.test(value)) fragment.append(document.createTextNode(value));
        else { const span = document.createElement('span'); span.className = 'intro-word'; span.textContent = value; fragment.append(span); words.push(span); }
      }
      node.replaceWith(fragment);
    }
  });
  function updateMotion() {
    motionFrame = 0; if (disposed || document.hidden) return;
    const hero = $('#home'), h = Math.max(window.innerHeight, 1), heroRect = hero.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, -heroRect.top / Math.max(1, heroRect.height)));
    hero.style.setProperty('--hero-progress', reduced.matches ? '0' : progress.toFixed(4));
    if (detailOpen && campaign.complete && campaign.naturalWidth) {
      const image = campaign.getBoundingClientRect(), zoom = 1.7, radius = window.innerWidth < 600 ? 66 : 85;
      const x = photoPointer?.x ?? heroRect.left + heroRect.width * (window.innerWidth < 600 ? .49 : .28);
      const y = photoPointer?.y ?? heroRect.top + heroRect.height * (window.innerWidth < 600 ? .66 : .43);
      const fit = Math.max(image.width / campaign.naturalWidth, image.height / campaign.naturalHeight);
      const iw = campaign.naturalWidth * fit, ih = campaign.naturalHeight * fit;
      const objectPosition = getComputedStyle(campaign).objectPosition.split(' ').map(parseFloat);
      const left = image.left + (image.width - iw) * (objectPosition[0] / 100), top = image.top + (image.height - ih) * ((objectPosition[1] || 50) / 100);
      lens.style.width = `${radius * 2}px`; lens.style.height = `${radius * 2}px`;
      lens.style.left = `${x - heroRect.left - radius}px`; lens.style.top = `${y - heroRect.top - radius}px`;
      lens.style.backgroundSize = `${iw * zoom}px ${ih * zoom}px`;
      lens.style.backgroundPosition = `${radius - (x - left) * zoom}px ${radius - (y - top) * zoom}px`;
      lens.classList.add('is-visible');
    } else lens.classList.remove('is-visible');
    const heading = $('.word-reveal'), top = heading.getBoundingClientRect().top;
    const reveal = Math.max(0, Math.min(1, (h * .9 - top) / (h * .5)));
    words.forEach((word, index) => word.style.setProperty('--word-alpha', reduced.matches ? '1' : String(.18 + .82 * Math.max(0, Math.min(1, reveal * (words.length + 1) - index)))));
    const space = $('.space-image'), rect = space.getBoundingClientRect();
    if (rect.top < h && rect.bottom > 0) space.style.setProperty('--space-offset', reduced.matches ? '0' : String(Math.max(-1, Math.min(1, (rect.top - h * .4) / h))));
  }
  function scheduleMotion() { if (!motionFrame && !disposed) motionFrame = requestAnimationFrame(updateMotion); }
  listen(window, 'scroll', scheduleMotion, { passive: true }); listen(window, 'resize', scheduleMotion, { passive: true });
  listen(campaign, 'load', scheduleMotion);
  listen(document, 'visibilitychange', scheduleMotion); listen(reduced, 'change', scheduleMotion); scheduleMotion();
  async function loadScene() {
    sceneObserver?.disconnect();
    try {
      const { mountSculpture } = await sceneAPI();
      if (disposed) return;
      sceneController = mountSculpture($('#sculpture'));
      sceneController.select(active);
      sceneController.setLook(look);
    } catch { $('#sculpture').dataset.scene = 'fallback'; $('#scene-instruction').textContent = 'یک ناحیه را انتخاب کنید'; $$('[data-rotate]').forEach((button) => { button.hidden = true; }); }
  }
  if (scene) {
    void sceneAPI().then(({ mountHero }) => { if (!disposed) heroController = mountHero($('#hero-sculpture')); }).catch(() => { if (!disposed) $('#hero-sculpture').dataset.scene = 'fallback'; });
    if ('IntersectionObserver' in window) { sceneObserver = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) void loadScene(); }, { rootMargin: '400px' }); sceneObserver.observe($('#sculpture')); }
    else void loadScene();
  }
  return { selectRegion, dispose() { disposed = true; events.abort(); cancelAnimationFrame(motionFrame); observer?.disconnect(); sceneObserver?.disconnect(); sceneController?.dispose(); heroController?.dispose(); if (dialog.open) dialog.close(); overlay(false); document.documentElement.classList.remove('js-ready'); } };
}

if (!window.__AURA_NO_AUTOBOOT__) {
  const app = mountAura();
  window.addEventListener('pagehide', (event) => { if (!event.persisted) app.dispose(); }, { once: true });
}
