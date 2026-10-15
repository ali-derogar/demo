/* ===== نبض — منطق صفحه و موشن ===== */
(() => {
'use strict';

const body = document.body;
body.classList.add('js');

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = window.matchMedia('(pointer:fine)').matches;
const EASE = 'cubic-bezier(.22,.85,.28,1)';
const DUR = REDUCED ? 1 : 480;

const $ = (sel, root) => (root || document).querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

/* ---------- ارقام فارسی ---------- */
const toFa = (n) => String(n).replace(/\d/g, (d) => String.fromCharCode(0x06f0 + Number(d)));
const toEn = (s) => String(s).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
                              .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
const money = (n) => {
  const s = String(Math.round(n));
  const out = [];
  let c = 0;
  for (let i = s.length - 1; i >= 0; i -= 1) { out.unshift(s[i]); c += 1; if (c % 3 === 0 && i > 0) out.unshift('\u066C'); }
  return toFa(out.join(''));
};

/* ---------- سربرگ چسبنده ---------- */
const header = $('#site-header');
const onScrollHeader = () => header.classList.toggle('is-stuck', window.scrollY > 24);
onScrollHeader();
window.addEventListener('scroll', onScrollHeader, { passive: true });

/* ---------- فهرست موبایل ---------- */
const toggle = $('#menu-toggle');
const drawer = $('#nav-drawer');
const setDrawer = (open) => {
  toggle.setAttribute('aria-expanded', String(open));
  drawer.hidden = !open;
};
setDrawer(false);
toggle.addEventListener('click', () => setDrawer(toggle.getAttribute('aria-expanded') !== 'true'));
drawer.addEventListener('click', (e) => { if (e.target.closest('a')) setDrawer(false); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) setDrawer(false); });

/* ---------- تیتر کینتیک ---------- */
$$('#hero-title .w').forEach((w, i) => w.style.setProperty('--d', String(i)));

/* ---------- آشکارسازی با اسکرول ---------- */
const revealables = $$('.reveal, .stage-card');
if ('IntersectionObserver' in window && !REDUCED) {
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      en.target.classList.add('in');
      io.unobserve(en.target);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
  revealables.forEach((el) => io.observe(el));
} else {
  revealables.forEach((el) => el.classList.add('in'));
}

/* ---------- شمارش معکوس ---------- */
const TARGET = new Date(2026, 10, 12, 18, 0, 0);
const cd = { d: $('#cd-days'), h: $('#cd-hours'), m: $('#cd-mins'), s: $('#cd-secs') };
const pad = (n) => toFa(String(n).padStart(2, '0'));
function tickCountdown() {
  const left = TARGET.getTime() - Date.now();
  if (left <= 0) {
    cd.d.textContent = '۰۰'; cd.h.textContent = '۰۰'; cd.m.textContent = '۰۰'; cd.s.textContent = '۰۰';
    const label = $('.countdown__label');
    if (label) label.textContent = 'فستیوال شروع شده است';
    return;
  }
  const sec = Math.floor(left / 1000);
  cd.d.textContent = pad(Math.floor(sec / 86400));
  cd.h.textContent = pad(Math.floor(sec / 3600) % 24);
  cd.m.textContent = pad(Math.floor(sec / 60) % 60);
  cd.s.textContent = pad(sec % 60);
}
tickCountdown();
setInterval(tickCountdown, 1000);

/* ---------- جلوه‌های صوتی روی بوم ---------- */
const canvas = $('#visualizer');
const energy = { v: 0 };
const kick = (amount) => { energy.v = Math.min(1.6, energy.v + amount); };

function buildVisualizer() {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let w = 0, h = 0, dpr = 1, bars = [], phase = 0, raf = 0, visible = true, running = false;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const box = canvas.getBoundingClientRect();
    w = Math.max(320, Math.round(box.width));
    h = Math.max(140, Math.round(box.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = clamp(Math.round(w / 14), 28, 96);
    bars = new Array(count).fill(0).map(() => ({ v: 0, t: 0, s: 0.4 + Math.random() * 0.9 }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    phase += REDUCED ? 0 : 0.016;
    const beat = Math.pow(Math.max(0, Math.sin(phase * 1.55)), 8)
      + 0.55 * Math.pow(Math.max(0, Math.sin(phase * 0.71 + 1.2)), 12);
    const drive = 0.55 + beat * 0.55 + energy.v * 0.85;
    energy.v *= 0.94;

    const n = bars.length;
    const gap = 3;
    const bw = (w - gap * (n - 1)) / n;
    const floor = h * 0.985;
    const maxH = h * 0.82;

    const grad = ctx.createLinearGradient(0, floor, 0, floor - maxH);
    grad.addColorStop(0, 'rgba(255,46,136,0.85)');
    grad.addColorStop(0.5, 'rgba(139,92,246,0.7)');
    grad.addColorStop(1, 'rgba(33,229,255,0.55)');

    ctx.fillStyle = grad;
    for (let i = 0; i < n; i += 1) {
      const b = bars[i];
      const k = i / (n - 1);
      const target =
        (Math.sin(phase * 2.1 + k * 9.4) * 0.5 + 0.5) * 0.45 * b.s +
        (Math.sin(phase * 3.7 + k * 23.1) * 0.5 + 0.5) * 0.28 +
        (Math.sin(phase * 0.9 + k * 3.1) * 0.5 + 0.5) * 0.22 +
        beat * (0.35 + 0.5 * Math.abs(Math.sin(k * 12.7)));
      b.t = target * drive * (1 - 0.42 * k);
      b.v += (b.t - b.v) * 0.18;
      const bh = Math.max(2, b.v * maxH);
      const x = i * (bw + gap);
      const r = Math.min(bw / 2, 3);
      ctx.beginPath();
      ctx.moveTo(x, floor);
      ctx.lineTo(x, floor - bh + r);
      ctx.quadraticCurveTo(x, floor - bh, x + r, floor - bh);
      ctx.lineTo(x + bw - r, floor - bh);
      ctx.quadraticCurveTo(x + bw, floor - bh, x + bw, floor - bh + r);
      ctx.lineTo(x + bw, floor);
      ctx.closePath();
      ctx.fill();
    }

    /* موج همگام با ضرب */
    ctx.beginPath();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(33,229,255,0.42)';
    for (let x = 0; x <= w; x += 8) {
      const y = h * 0.26
        + Math.sin(x * 0.012 + phase * 2.2) * (16 + beat * 26)
        + Math.sin(x * 0.031 - phase * 1.3) * 9;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    if (running && !REDUCED) raf = requestAnimationFrame(draw);
  }

  function start() { if (running || REDUCED) return; running = true; raf = requestAnimationFrame(draw); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize();
  draw();
  window.addEventListener('resize', () => { resize(); if (!running) draw(); }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible && !document.hidden) start(); else stop();
    }, { threshold: 0.05 }).observe(canvas);
  } else { start(); }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (visible) start();
  });

  if (REDUCED) stop();
  return null;
}
if (canvas) buildVisualizer();

/* ---------- نور دنبال‌کننده‌ی نشانگر ---------- */
const glow = $('#hero-glow');
if (glow && FINE && !REDUCED) {
  let gx = 50, gy = 40, gg = false;
  $('.hero').addEventListener('pointermove', (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    gx = ((e.clientX - r.left) / r.width) * 100;
    gy = ((e.clientY - r.top) / r.height) * 100;
    if (gg) return;
    gg = true;
    requestAnimationFrame(() => {
      glow.style.setProperty('--mx', gx.toFixed(1) + '%');
      glow.style.setProperty('--my', gy.toFixed(1) + '%');
      gg = false;
    });
  }, { passive: true });
}

/* ---------- فیلتر شب با جابه‌جایی نرم ---------- */
const grid = $('#artist-grid');
const tabs = $$('.day-tab');
const live = $('#lineup-live');
const NIGHT_LABEL = { n1: 'شب اول', n2: 'شب دوم', n3: 'شب سوم' };

function filterDay(day) {
  const cards = $$('.artist-card', grid);
  const first = new Map();
  cards.forEach((c) => { if (!c.hidden) first.set(c, c.getBoundingClientRect()); });

  let shown = 0;
  cards.forEach((c) => {
    const keep = day === 'all' || c.dataset.day === day || c.classList.contains('artist-card--soon');
    c.hidden = !keep;
    if (keep && !c.classList.contains('artist-card--soon')) shown += 1;
  });

  if (!REDUCED && typeof Element.prototype.animate === 'function') {
    cards.forEach((c) => {
      if (c.hidden) return;
      const f = first.get(c);
      const l = c.getBoundingClientRect();
      if (!f || f.width === 0) {
        c.animate([{ opacity: 0, transform: 'translateY(20px) scale(.97)' }, { opacity: 1, transform: 'none' }],
          { duration: DUR, easing: EASE });
        return;
      }
      const dx = f.left - l.left;
      const dy = f.top - l.top;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }],
          { duration: DUR, easing: EASE });
      }
    });
  }

  const label = day === 'all' ? 'هر سه شب' : NIGHT_LABEL[day];
  live.textContent = label + ' نمایش داده می‌شود — ' + toFa(shown) + ' اجرا';
  kick(0.5);
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => { t.setAttribute('aria-pressed', String(t === tab)); t.classList.toggle('is-on', t === tab); });
    filterDay(tab.dataset.day);
  });
});

/* ---------- کارت‌های مغناطیسی ---------- */
if (FINE && !REDUCED) {
  $$('.artist-card, .art-card').forEach((card) => {
    let pending = null;
    card.addEventListener('pointermove', (e) => {
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = null;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', (px * 7).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-py * 6).toFixed(2) + 'deg');
        card.style.setProperty('--tx', (px * 5).toFixed(2) + 'px');
        card.style.setProperty('--ty', (py * 5).toFixed(2) + 'px');
      });
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      if (pending) { cancelAnimationFrame(pending); pending = null; }
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--tx', '0px');
      card.style.setProperty('--ty', '0px');
    });
  });
}

/* ---------- خط زمانِ شب‌ها ---------- */
const nights = $('#nights');
if (nights) {
  const fill = $('#nights-fill');
  const rail = $('.nights__rail', nights);
  const cards = $$('.night', nights);
  const wide = window.matchMedia('(min-width:901px)');
  let ticking = false;

  function setProps(el, props) {
    for (const k in props) el.style.setProperty(k, props[k]);
  }

  function updateNights() {
    ticking = false;
    if (!rail || !fill) return;
    const rb = rail.getBoundingClientRect();
    const p = clamp((window.innerHeight * 0.55 - rb.top) / Math.max(rb.height, 1), 0, 1);
    fill.style.height = (p * 100).toFixed(1) + '%';
    if (!wide.matches || REDUCED) {
      cards.forEach((c) => { setProps(c, { '--py': '0', '--so': '1', '--sl': '0' }); c.classList.add('in'); });
      return;
    }
    const mid = window.innerHeight * 0.55;
    cards.forEach((c) => {
      const b = c.getBoundingClientRect();
      const d = clamp((b.top + b.height / 2 - mid) / Math.max(window.innerHeight * 0.62, 1), -1.4, 1.4);
      const near = 1 - Math.min(Math.abs(d), 1);
      setProps(c, {
        '--py': (d * 30).toFixed(1),
        '--so': clamp(0.45 + near * 0.62, 0.45, 1).toFixed(3),
        '--sl': clamp(near, 0, 1).toFixed(3),
      });
      c.classList.toggle('in', Math.abs(d) < 0.42);
    });
  }
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateNights);
  }, { passive: true });
  window.addEventListener('resize', updateNights, { passive: true });
  wide.addEventListener('change', updateNights);
  updateNights();
}

/* ---------- بلیت ---------- */
const PASSES = [
  { key: 'single', name: 'تک‌شب', price: 1850000 },
  { key: 'triple', name: 'هر سه شب', price: 4400000 },
  { key: 'vip', name: 'وی‌آی‌پی پژواک', price: 7900000 },
];
const qty = { single: 0, triple: 0, vip: 0 };
const totalEl = $('#order-total');
const detailEl = $('#order-detail');
const bookSum = $('#book-sum');
const passSel = $('#b-pass');
const countSel = $('#b-count');
let shownTotal = 0;
let totalRaf = 0;

PASSES.forEach((p) => {
  const o = document.createElement('option');
  o.value = p.key; o.textContent = p.name;
  passSel.appendChild(o);
});
passSel.value = 'triple';
for (let i = 0; i <= 8; i += 1) {
  const o = document.createElement('option');
  o.value = String(i); o.textContent = toFa(i);
  countSel.appendChild(o);
}
countSel.value = '0';

function animateTotal(to) {
  cancelAnimationFrame(totalRaf);
  if (REDUCED) { shownTotal = to; totalEl.textContent = money(to); return; }
  const from = shownTotal;
  const t0 = performance.now();
  const span = 520;
  const step = (now) => {
    const k = clamp((now - t0) / span, 0, 1);
    const e = 1 - Math.pow(1 - k, 3);
    shownTotal = Math.round(from + (to - from) * e);
    totalEl.textContent = money(shownTotal);
    if (k < 1) totalRaf = requestAnimationFrame(step);
  };
  totalRaf = requestAnimationFrame(step);
}

function renderOrder() {
  let total = 0;
  const parts = [];
  PASSES.forEach((p) => {
    qty[p.key] = clamp(qty[p.key], 0, 8);
    total += qty[p.key] * p.price;
    const n = $('.stepper[data-pass="' + p.key + '"] .stepper__n');
    if (n) n.textContent = toFa(qty[p.key]);
    if (qty[p.key]) parts.push(toFa(qty[p.key]) + ' بلیت ' + p.name);
  });
  animateTotal(total);
  detailEl.textContent = parts.length ? parts.join(' · ') : 'هنوز بلیتی انتخاب نشده است.';
  bookSum.textContent = 'جمع انتخاب‌های شما: ' + money(total) + ' تومان';
  const key = parts.length ? PASSES.find((p) => qty[p.key] > 0) : null;
  if (key) {
    passSel.value = key.key;
    countSel.value = String(qty[key.key]);
  }
}

$$('.stepper').forEach((box) => {
  box.addEventListener('click', (e) => {
    const btn = e.target.closest('.stepper__btn');
    if (!btn) return;
    const k = box.dataset.pass;
    qty[k] = clamp(qty[k] + Number(btn.dataset.step), 0, 8);
    renderOrder();
    if (qty[k] > 0) kick(0.35);
  });
});

passSel.addEventListener('change', () => { countSel.value = String(qty[passSel.value] || 0); });
countSel.addEventListener('change', () => { qty[passSel.value] = Number(countSel.value) || 0; renderOrder(); });
renderOrder();

/* ---------- پنجره‌ی جزئیات ---------- */
const sheet = $('#artist-dialog');
const sheetTitle = $('#sheet-title');
const sheetBody = $('#sheet-body');

const ARTISTS = {
  soheil: { n: 'سهیل مهرآیین', r: 'تار و بداهه‌نوازی', img: 'artist-setar2', stage: 'پوسته‌ی پژواک', night: 'شب اول', time: '۲۰:۳۰', len: '۵۵ دقیقه', band: 'سه نفره', bio: 'سهیل مهرآیین تار را با دستانِ بی‌مضراب می‌نوازد و در همین اجرا قطعه‌ای تازه می‌آورد که ماه پیش ضبط شده است.' },
  niloofar: { n: 'نیلوفر رستگار', r: 'ویولن با ارکستر زهی', img: 'artist-violin', stage: 'صحنه‌ی اصلی', night: 'شب اول', time: '۲۲:۰۰', len: '۷۰ دقیقه', band: '۱۲ نوازنده', bio: 'برنامه‌ی نیلوفر رستگار ترکیبی است از قطعات دستگاهی و یک تنظیم الکترونیک که با حلقه‌ی ضبط زنده ساخته می‌شود.' },
  mahnaz: { n: 'ماهناز', r: 'آواز و گیتار', img: 'artist-vocal', stage: 'باغ‌صحنه', night: 'شب اول', time: '۲۳:۳۰', len: '۶۰ دقیقه', band: 'دو نفره', bio: 'اجرای ماهناز بی‌تلفن و با گیتار کلاسیک است؛ صدای سالن فقط از بلندگوهای کنار صحنه می‌آید.' },
  arash: { n: 'آرش دلنوازان', r: 'سنتور و الکترونیک', img: 'artist-santur', stage: 'پوسته‌ی پژواک', night: 'شب دوم', time: '۲۰:۱۵', len: '۵۰ دقیقه', band: 'تنها', bio: 'آرش دلنوازان سنتور را با پدای لوپ و یک سینتی‌سایزر قدیمی همراه می‌کند. بخش آخر بی‌کلام است.' },
  bahram: { n: 'بهرام کیمره', r: 'سینتی‌سایزر و لوپ استیشن', img: 'artist-keys', stage: 'سالن هولوگرام', night: 'شب دوم', time: '۲۱:۴۵', len: '۶۵ دقیقه', band: 'یک نفره', bio: 'ست بهرام کیمره از ضبط‌های میدانیِ بازارهای ایران شروع می‌شود و به یک ضرب پیوسته می‌رسد.' },
  arman: { n: 'دی‌جی آرمان', r: 'ست دی‌جی پایانی', img: 'artist-dj', stage: 'سالن هولوگرام', night: 'شب دوم', time: '۰۰:۳۰', len: '۹۰ دقیقه', band: 'دی‌جی ست', bio: 'آرمان هر سه صفحه را هم‌زمان می‌چرخاند؛ نور سالن با همان ضربِ روی صحنه هماهنگ است.' },
  kivan: { n: 'کیوان ضرب', r: 'پرکاشن و گروه ریتم', img: 'artist-drum', stage: 'باغ‌صحنه', night: 'شب سوم', time: '۲۰:۴۵', len: '۴۵ دقیقه', band: 'شش نفره', bio: 'گروه ریتم کیوان ضرب با دهل، تنبک و یک ساز ساخته‌شده از ظروف فلزی روی صحنه می‌آید.' },
  soroush: { n: 'دی‌جی سروش', r: 'ست پایانی صحنه‌ی اصلی', img: 'artist-dj2', stage: 'صحنه‌ی اصلی', night: 'شب سوم', time: '۲۲:۱۵', len: '۱۰۰ دقیقه', band: 'دی‌جی + زنده', bio: 'سروش این بار با نوازنده‌ی بس در کنارش اجرا می‌کند و نمای لیزری روی گنبد باغ می‌افتد.' },
  rijab: { n: 'رجب حریر', r: 'خواننده‌ی مهمان', img: 'artist-reggae', stage: 'صحنه‌ی تار', night: 'شب سوم', time: '۰۱:۴۰', len: '۷۵ دقیقه', band: 'هفت نفره', bio: 'رجب حریر مهمان ویژه‌ی شب آخر است و برای اولین بار در ایران با گروه کاملش می‌خواند.' },
};

function openSheet(title, html) {
  sheetTitle.textContent = title;
  sheetBody.innerHTML = html;
  if (typeof sheet.showModal === 'function') sheet.showModal();
  else sheet.setAttribute('open', '');
}
function closeSheet() {
  if (typeof sheet.close === 'function' && sheet.open) sheet.close();
  else sheet.removeAttribute('open');
}
$('#sheet-close').addEventListener('click', closeSheet);
sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });

$$('.artist-card__more').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.artist-card');
    const a = ARTISTS[card.dataset.artist];
    if (!a) return;
    openSheet('جزئیات اجرا', [
      '<div class="detail-hero"><img src="./assets/img/' + a.img + '.webp" alt="' + a.n + ' در حال اجرا" width="900" height="600" loading="lazy"></div>',
      '<h3>' + a.n + '</h3>',
      '<p class="role">' + a.r + '</p>',
      '<ul class="facts">',
      '<li><span>زمان</span><b>' + a.night + '، ' + a.time + '</b></li>',
      '<li><span>صحنه</span><b>' + a.stage + '</b></li>',
      '<li><span>مدت</span><b>' + a.len + '</b></li>',
      '<li><span>ترکیب</span><b>' + a.band + '</b></li>',
      '</ul>',
      '<p class="bio">' + a.bio + '</p>',
      '<a class="btn btn--wire btn--block" href="#passes" data-close>انتخاب بلیت این شب</a>',
    ].join(''));
    kick(0.4);
  });
});
sheetBody.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(); });

/* ---------- فرم ثبت‌نام ---------- */
const form = $('#book-form');
const nightsBox = $('#b-nights');
Object.keys(NIGHT_LABEL).forEach((k) => {
  const label = document.createElement('label');
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.value = k;
  label.appendChild(input);
  label.appendChild(document.createTextNode(' ' + NIGHT_LABEL[k]));
  nightsBox.appendChild(label);
});

function fieldOf(el) { return el.closest('.field'); }
function mark(el, bad, msg) {
  const f = fieldOf(el);
  f.classList.toggle('is-bad', bad);
  const err = $('.err', f);
  if (err) err.hidden = !bad;
  if (bad && msg) err.textContent = msg;
  el.setAttribute('aria-invalid', String(bad));
}

const normPhone = (v) => toEn(v).replace(/[\s-]/g, '').replace(/^98/, '0');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('#b-name');
  const phone = $('#b-phone');
  let bad = null;

  if (name.value.trim().length < 3) { mark(name, true, 'نام‌تان را کامل بنویسید.'); bad = bad || name; }
  else mark(name, false);

  const digits = normPhone(phone.value);
  if (!/^09\d{9}$/.test(digits)) { mark(phone, true, 'شماره‌ی ۱۱ رقمی و با ۰۹ شروع شود.'); bad = bad || phone; }
  else mark(phone, false);

  const picked = $$('input:checked', nightsBox).map((i) => i.value);
  if (!picked.length) { toast('دست‌کم یک شب را علامت بزنید.', 'bad'); bad = bad || nightsBox; }

  if (!Object.values(qty).some((n) => n > 0)) {
    toast('اول از جدول بلیت تعداد را انتخاب کنید.', 'bad');
    bad = bad || $('#passes');
  }

  if (bad) {
    if (bad.scrollIntoView) bad.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
    if (bad.focus) try { bad.focus({ preventScroll: true }); } catch (_) { bad.focus(); }
    return;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const lines = PASSES.filter((p) => qty[p.key] > 0)
    .map((p) => '<li><span>' + p.name + '</span><b>' + toFa(qty[p.key]) + ' × ' + money(p.price) + '</b></li>')
    .join('');
  openSheet('درخواست ثبت شد', [
    '<p class="role">کد پیگیری: <bdi dir="ltr">' + toFa(code) + '</bdi></p>',
    '<p class="bio">' + esc(name.value.trim()) + ' عزیز، تا پایان روز کاری با شماره‌ی <bdi dir="ltr">' + esc(normPhone(phone.value)) + '</bdi> تماس می‌گیریم و بلیت‌ها را قطعی می‌کنیم.</p>',
    '<ul class="facts">' + lines +
    '<li><span>شب‌های انتخابی</span><b>' + picked.map((k) => NIGHT_LABEL[k]).join('، ') + '</b></li>' +
    '<li><span>جمع کل</span><b>' + money(Object.keys(qty).reduce((s, k) => s + qty[k] * (PASSES.find((p) => p.key === k).price), 0)) + ' تومان</b></li>' +
    '</ul>',
    '<button class="btn btn--solid btn--block" type="button" data-close>باشه، فهمیدم</button>',
  ].join(''));
  toast('درخواست شما ثبت شد؛ کد پیگیری ' + toFa(code), 'ok');
  kick(0.6);
  form.reset();
  $$('.field', form).forEach((f) => f.classList.remove('is-bad'));
});

/* ---------- اعلان ---------- */
const toastBox = $('#toasts');
function toast(msg, kind) {
  const el = document.createElement('div');
  el.className = kind || '';
  el.textContent = msg;
  toastBox.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s ease,transform .3s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 320);
  }, 2800);
}

})();
