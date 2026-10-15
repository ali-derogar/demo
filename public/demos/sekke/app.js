/* ===== سکه — موتور تابلوی زنده =====
   یک حلقه‌ی requestAnimationFrame؛ بقیه‌ی موشن‌ها CSS یا کاری است که همان حلقه زمان‌بندی می‌کند. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const body = document.body;
  body.classList.add('js');

  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let REDUCED = mqReduce.matches;
  const now = () => performance.now();
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  /* ---------- مدل عدد ---------- */
  const SEED = 'sekke-tablo-1404';
  const TICK_MS = 1200;
  const FEE = 0.004;
  const DRIVER = { USD: 92400, XAU: 3386.4, OZ: 31.1034768 };
  const GRAM24 = DRIVER.XAU / DRIVER.OZ * DRIVER.USD;

  const INSTRUMENTS = [
    { id: 'emami', fa: 'سکه امامی', group: 'coin', g: 7.32, bubble: 0.049, spread: 0.006, step: 5000, vol: 0.00042, bias: 0.0145 },
    { id: 'bahar', fa: 'سکه بهار آزادی', group: 'coin', g: 7.32, bubble: 0.031, spread: 0.006, step: 5000, vol: 0.00038, bias: 0.0095 },
    { id: 'half', fa: 'نیم سکه', group: 'coin', g: 3.66, bubble: 0.085, spread: 0.0075, step: 5000, vol: 0.00052, bias: -0.0075 },
    { id: 'quarter', fa: 'ربع سکه', group: 'coin', g: 1.83, bubble: 0.21, spread: 0.009, step: 5000, vol: 0.0006, bias: 0.0225 },
    { id: 'grami', fa: 'سکه گرمی', group: 'coin', g: 0.9167, bubble: 0.15, spread: 0.0085, step: 1000, vol: 0.00055, bias: -0.0115 },
    { id: 'melted', fa: 'طلای آب‌شده', group: 'coin', g: 1, bubble: 0.006, spread: 0.005, step: 5000, vol: 0.00034, bias: 0.0052 },
    { id: 'bar100', fa: 'شمش ۱۰۰ گرمی', group: 'coin', g: 100, bubble: 0.018, spread: 0.0055, step: 50000, vol: 0.0003, bias: 0.0068 },
    { id: 'gram18', fa: 'گرم ۱۸ عیار', group: 'coin', g: 0.75, bubble: 0, spread: 0.0045, step: 1000, vol: 0.00036, bias: 0.0041 },
    { id: 'mesghal', fa: 'مثقال طلا', group: 'coin', g: 0.75 * 4.352, bubble: 0, spread: 0.005, step: 1000, vol: 0.0004, bias: -0.0086 },
    { id: 'usd', fa: 'دلار آمریکا', group: 'currency', usd: 1, step: 100, vol: 0.00026, spread: 0.004, bias: -0.0032 },
    { id: 'eur', fa: 'یورو', group: 'currency', usd: 1.062, step: 100, vol: 0.00028, spread: 0.0045, bias: 0.0024 },
    { id: 'gbp', fa: 'پوند استرلینگ', group: 'currency', usd: 1.283, step: 100, vol: 0.0003, spread: 0.005, bias: 0.0048 },
    { id: 'aed', fa: 'درهم امارات', group: 'currency', usd: 0.2723, step: 100, vol: 0.00024, spread: 0.005, bias: -0.0014 },
    { id: 'try', fa: 'لیر ترکی', group: 'currency', usd: 0.0235, step: 10, vol: 0.00045, spread: 0.007, bias: -0.0135 },
    { id: 'ounce', fa: 'اونس طلا', group: 'ounce', oz: true, step: 0.01, vol: 0.00016, spread: 0.0012, bias: 0.0036 },
  ];

  const basePrice = (row) => (row.oz ? DRIVER.XAU : row.usd != null ? DRIVER.USD * row.usd : GRAM24 * row.g * (1 + (row.bubble || 0)));
  const intrinsicOf = (row) => (row.oz || row.usd != null ? null : GRAM24 * row.g);

  function fnv(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(a) {
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function dayChange(row) {
    const r = mulberry32(fnv(`${SEED}:${row.id}`));
    const span = row.group === 'currency' ? 0.0035 : row.group === 'ounce' ? 0.0022 : 0.006;
    return row.bias + (r() - 0.5) * span;
  }

  /* ---------- قلمِ اعداد ---------- */
  const FA = 0x06f0;
  const toFa = (v) => String(v).replace(/\d/g, (d) => String.fromCharCode(FA + Number(d)));
  const toEn = (v) => String(v).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  function group(n) {
    const parts = String(n).split('.');
    const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return toFa((parts.length > 1 ? `${int}.${parts[1]}` : int).replace(/,/g, '٬').replace(/\./g, '٫'));
  }
  const roundTo = (n, step) => (step >= 1 ? Math.round(n / step) * step : Math.round(n * 100) / 100);
  const money = (n, step) => group(step >= 1 ? roundTo(n, step) : Number(n).toFixed(2));
  const pct = (v) => `${group(Math.abs(v * 100).toFixed(1))}٪`;
  const dec = (n, dp = 2) => toFa(Number(n).toFixed(dp).replace('.', '٫'));

  /* ---------- حالتِ زنده ---------- */
  const state = new Map();
  for (const row of INSTRUMENTS) {
    const market = basePrice(row);
    const change = dayChange(row);
    state.set(row.id, { row, market, base: market, prev: market / (1 + change), change, dir: 0 });
  }
  const rnd = mulberry32(fnv(`${SEED}:walk`));
  const bidOf = (s) => s.market * (1 - s.row.spread);

  /* ---------- حلقه‌ی یکتا ---------- */
  const tweens = [];
  let raf = 0;
  let running = false;
  let lastTick = 0;
  let lastClock = 0;
  let dirty = new Set();

  function tween(from, to, ms, apply, key) {
    if (REDUCED || ms <= 0 || !Number.isFinite(to)) { apply(to); return; }
    /* یک عنصر نباید هم‌زمان دو tween داشته باشد؛ وگرنه قدیمی‌تر از همه آخر نوشته می‌شود */
    if (key) for (let i = tweens.length - 1; i >= 0; i -= 1) if (tweens[i].key === key) tweens.splice(i, 1);
    tweens.push({ from, to, ms, t0: now(), apply, key });
  }
  function stepTweens(t) {
    /* از قدیمی به تازه بنویس تا آخرین نوشتن، تازه‌ترین هدف باشد */
    for (let i = 0; i < tweens.length; i += 1) {
      const tw = tweens[i];
      const p = clamp((t - tw.t0) / tw.ms, 0, 1);
      tw.apply(tw.from + (tw.to - tw.from) * (1 - Math.pow(1 - p, 3)));
    }
    for (let i = tweens.length - 1; i >= 0; i -= 1) if ((t - tweens[i].t0) / tweens[i].ms >= 1) tweens.splice(i, 1);
  }

  function engineTick() {
    for (const s of state.values()) {
      const pull = ((s.base - s.market) / s.base) * 0.09;
      const shock = (rnd() - 0.5) * 2 * s.row.vol * 3.4;
      const next = s.market * (1 + pull + shock);
      s.dir = Math.sign(next - s.market);
      s.market = next;
      s.change = s.market / s.prev - 1;
      dirty.add(s.row.id);
    }
  }

  function loop(t) {
    raf = requestAnimationFrame(loop);
    stepTweens(t);
    if (chart.replay > 0) {
      chart.replay = Math.min(1, chart.replay + 0.012);
      chart.needsDraw = true;
      if (chart.replay >= 1) finishReplay();
    }
    if (t - lastClock >= 1000) { lastClock = t; paintClock(); }
    if (t - lastTick >= TICK_MS) {
      lastTick = t;
      if (!document.hidden) { engineTick(); flush(); }
    }
    drawChartFrame(t);
  }
  function start() {
    if (running) return;
    running = true;
    lastTick = lastClock = now();
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else { start(); flush(); }
  });

  /* ---------- نوسانِ رنگ ---------- */
  function flash(el) {
    if (REDUCED || !el || typeof el.animate !== 'function') return;
    el.animate([{ backgroundColor: 'rgba(233,189,87,.22)' }, { backgroundColor: 'rgba(0,0,0,0)' }],
      { duration: 420, easing: 'linear' });
  }

  /* ---------- تابلو ---------- */
  const boardBody = $('#board-body');
  const rows = new Map();
  for (const tr of $$('tr[data-id]', boardBody)) {
    rows.set(tr.dataset.id, {
      tr,
      buy: $('.c-buy .num', tr),
      sell: $('.c-sell .num', tr),
      chg: $('.c-chg', tr),
      chgNum: $('.c-chg .num', tr),
      spark: $('.c-spark canvas', tr),
    });
  }
  const visible = new Set();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target.dataset.id);
        else visible.delete(e.target.dataset.id);
      }
    }, { threshold: 0 });
    for (const r of rows.values()) io.observe(r.tr);
  } else {
    for (const id of rows.keys()) visible.add(id);
  }

  const triUp = '<svg class="tri" viewBox="0 0 10 7" width="10" height="7" aria-hidden="true" focusable="false"><path d="M5 0 10 7H0z" fill="currentColor"/></svg>';
  const triDown = '<svg class="tri" viewBox="0 0 10 7" width="10" height="7" aria-hidden="true" focusable="false"><path d="M5 0 10 7H0z" fill="currentColor" transform="rotate(180 5 3.5)"/></svg>';

  function paintChg(cell, num, change) {
    const up = change >= 0;
    cell.classList.toggle('is-up', up);
    cell.classList.toggle('is-down', !up);
    cell.innerHTML = (up ? triUp : triDown);
    cell.appendChild(num);
    num.textContent = pct(change);
  }

  function flush() {
    /* فقط ردیف‌های قابل‌مشاهده؛ بیش از شش تراشه در هر تیک نه */
    const ids = [...dirty].filter((id) => rows.has(id) && visible.has(id));
    ids.sort((a, b) => Math.abs(state.get(b).change) - Math.abs(state.get(a).change)).slice(0, 6)
      .forEach((id) => flash(rows.get(id).sell.parentElement));
    for (const id of ids) {
      const r = rows.get(id);
      const s = state.get(id);
      r.buy.textContent = money(bidOf(s), s.row.step);
      r.sell.textContent = money(s.market, s.row.step);
      paintChg(r.chg, r.chgNum, s.change);
      drawSpark(r.spark, id);
    }
    for (const id of dirty) {
      if (id === heroId) paintHero();
      if (railIds.includes(id)) paintRail(id);
      paintTapeCell(id);
    }
    if (selected && rows.has(selected)) paintDetail(selected);
    if (dirty.has(chart.symbol.value)) { drawChartStats(); chart.needsDraw = true; }
    paintWallet();
    dirty = new Set();
  }

  /* ---------- جست‌وجو، فیلتر، مرتب‌سازی ---------- */
  let filter = 'all';
  let query = '';
  let sorted = false;
  function applyView(animate) {
    const list = [...rows.values()];
    const flip = animate && !REDUCED
      ? new Map(list.map((r) => [r.tr, r.tr.getBoundingClientRect()]))
      : null;
    for (const r of list) {
      const s = state.get(r.tr.dataset.id);
      const matchGroup = filter === 'all' || s.row.group === filter;
      const matchText = !query || s.row.fa.includes(query);
      r.tr.classList.toggle('is-hidden', !(matchGroup && matchText));
    }
    if (sorted) {
      list.sort((a, b) => state.get(b.tr.dataset.id).change - state.get(a.tr.dataset.id).change);
    }
    list.forEach((r) => boardBody.appendChild(r.tr));
    if (flip) {
      for (const r of list) {
        if (r.tr.classList.contains('is-hidden')) continue;
        const before = flip.get(r.tr);
        const after = r.tr.getBoundingClientRect();
        const dy = before.top - after.top;
        if (dy && before.width) {
          r.tr.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }],
            { duration: 340, easing: 'cubic-bezier(.22,.85,.28,1)' });
        }
      }
    }
  }
  $$('.chip[data-filter]').forEach((chip) => chip.addEventListener('click', () => {
    filter = chip.dataset.filter;
    $$('.chip[data-filter]').forEach((c) => {
      const on = c === chip;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-pressed', String(on));
    });
    applyView(true);
  }));
  $('#board-search').addEventListener('input', (e) => { query = e.target.value.trim(); applyView(false); });
  $('#sort-toggle').addEventListener('click', (e) => {
    sorted = !sorted;
    e.currentTarget.classList.toggle('is-on', sorted);
    e.currentTarget.setAttribute('aria-pressed', String(sorted));
    applyView(true);
  });

  /* ---------- برگه‌ی نماد ---------- */
  let selected = 'emami';
  const detailBox = $('#rate-detail');
  function paintDetail(id) {
    const s = state.get(id);
    const row = s.row;
    const intr = intrinsicOf(row);
    const unit = row.oz ? 'دلار' : 'تومان';
    const num = (v, step, unit) => `<span class="num" dir="ltr">${money(v, step)}</span>${unit ? ` ${unit}` : ''}`;
    const math = intr == null
      ? `<li><span>مبنای نرخ</span><b>${row.oz ? 'اونسِ جهانیِ طلا' : 'نرخِ دلاریِ مرجع'}</b></li>
         <li><span>خرید از شما</span><b>${num(bidOf(s), row.step, unit)}</b></li>
         <li><span>فاصله‌ی خرید و فروش</span><b><span class="num" dir="ltr">${dec(row.spread * 100, 2)}</span>٪</b></li>`
      : `<li><span>طلای خالص</span><b><span class="num" dir="ltr">${dec(row.g, row.g < 1 ? 4 : 2)}</span> گرم × ${num(GRAM24, 1000)} = ${num(intr, 1000)} تومان</b></li>
         <li><span>حباب</span><b><span class="num" dir="ltr">${dec((row.bubble || 0) * 100, 1)}</span>٪ = ${num(s.base - intr, 1000)} تومان</b></li>
         <li><span>نرخ تابلو</span><b>${num(intr, 1000)} × <span class="num" dir="ltr">${dec(1 + (row.bubble || 0), 3)}</span> ≈ ${num(s.base, row.step)} تومان</b></li>`;
    detailBox.querySelector('#rate-title').textContent = row.fa;
    detailBox.querySelector('.rate__price .num').textContent = money(s.market, row.step);
    detailBox.querySelector('.rate__meta').innerHTML =
      `خرید <span class="num" dir="ltr">${money(bidOf(s), row.step)}</span> · فروش <span class="num" dir="ltr">${money(s.market, row.step)}</span> · کارمزد <span class="num" dir="ltr">${dec(row.spread * 100, 2)}</span>٪`;
    detailBox.querySelector('.rate__math').innerHTML = math;
    detailBox.querySelector('.rate__driver').innerHTML = row.oz
      ? `مبنای محاسبه: اونسِ جهانی · دلار <span class="num" dir="ltr">${group(DRIVER.USD)}</span> تومان`
      : `اونس <span class="num" dir="ltr">${dec(DRIVER.XAU)}</span> دلار · دلار <span class="num" dir="ltr">${group(DRIVER.USD)}</span> تومان · هر اونس <span class="num" dir="ltr">${dec(DRIVER.OZ, 4)}</span> گرم`;
    detailBox.querySelector('.rate__note').innerHTML = `نرخِ تابلو به نزدیک‌ترین <span class="num" dir="ltr">${money(row.step, 1)}</span> تومان گرد می‌شود؛ خودِ محاسبه گرد نیست.`;
    drawSpark(detailBox.querySelector('#rate-spark'), id, true);
  }
  for (const r of rows.values()) {
    const open = () => {
      selected = r.tr.dataset.id;
      for (const x of rows.values()) x.tr.classList.toggle('is-sel', x.tr.dataset.id === selected);
      paintDetail(selected);
      detailBox.animate(REDUCED ? [] : [{ opacity: .4 }, { opacity: 1 }], { duration: 260 });
    };
    /* هدفِ لمی خودِ سطر است؛ دکمه فقط برای صفحه‌کلید */
    r.tr.addEventListener('click', open);
    $('.row__open', r.tr).addEventListener('click', (e) => { e.stopPropagation(); open(); });
    r.tr.style.cursor = 'pointer';
  }
  rows.get('emami').tr.classList.add('is-sel');

  /* ---------- اسپارک‌لاین ---------- */
  function seriesFor(id) {
    const s = state.get(id);
    const key = `spark:${id}`;
    if (!sparkCache.has(key)) {
      const r = mulberry32(fnv(`${SEED}:${id}:spark`));
      const pts = [];
      let v = s.prev;
      for (let i = 0; i < 40; i += 1) { v *= 1 + (r() - 0.5) * s.row.vol * 6 + (s.base - v) / s.base * 0.03; pts.push(v); }
      const k = s.base / pts[pts.length - 1];
      sparkCache.set(key, pts.map((p) => p * k));
    }
    return sparkCache.get(key);
  }
  const sparkCache = new Map();
  function drawSpark(cv, id, big = false) {
    if (!cv || !cv.getContext) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = big ? cv.clientWidth || 320 : 88;
    const h = big ? 86 : 26;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    if (big) cv.style.height = '86px';
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const pts = seriesFor(id);
    const s = state.get(id);
    const lo = Math.min(...pts), hi = Math.max(...pts);
    const x = (i) => (i / (pts.length - 1)) * (w - 2) + 1;
    const y = (v) => h - 3 - ((v - lo) / Math.max(hi - lo, 1e-9)) * (h - 6);
    const up = pts[pts.length - 1] >= pts[0];
    const col = up ? cssVar('--up') : cssVar('--down');
    if (big) {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, up ? 'rgba(38,240,161,.28)' : 'rgba(255,93,93,.24)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      pts.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))));
      ctx.lineTo(x(pts.length - 1), h); ctx.lineTo(x(0), h); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
    }
    ctx.beginPath();
    pts.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))));
    ctx.strokeStyle = col;
    ctx.lineWidth = big ? 1.6 : 1.2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x(pts.length - 1), y(pts[pts.length - 1]), big ? 2.8 : 2, 0, Math.PI * 2);
    ctx.fillStyle = cssVar('--gold-hi');
    ctx.fill();
  }

  const styleRead = getComputedStyle(document.documentElement);
  const cssVar = (name) => styleRead.getPropertyValue(name).trim() || '#e9bd57';

  /* ---------- سرستون ---------- */
  let heroId = 'emami';
  const hero = {
    box: $('#hero-rate'),
    label: $('.hero__label'),
    value: $('.hero__value .num'),
    buy: $$('.hero__pair b')[0],
    avg: $$('.hero__pair b')[1],
    chg: $('#hero-chg'),
    chgNum: $('#hero-chg .num'),
  };
  function paintHero() {
    const s = state.get(heroId);
    hero.label.textContent = `${s.row.fa} · فروش به شما`;
    const target = roundTo(s.market, s.row.step);
    const from = Number(toEn(hero.value.textContent.replace(/[^\d۰-۹]/g, ''))) || target;
    tween(from, target, REDUCED ? 0 : 500, (v) => { hero.value.textContent = money(v, s.row.step); }, 'hero');
    hero.buy.textContent = money(bidOf(s), s.row.step);
    hero.avg.textContent = money(s.base, s.row.step);
    paintChg(hero.chg, hero.chgNum, s.change);
  }
  $$('.pick[data-id]').forEach((btn) => btn.addEventListener('click', () => {
    heroId = btn.dataset.id;
    $$('.pick[data-id]').forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    paintHero();
  }));

  const railIds = ['ounce', 'usd', 'gram18', 'mesghal'];
  const railCells = new Map($$('.rail__item').map((li) => [li.dataset.id, {
    value: $('.rail__value', li), chg: $('.rail__chg', li), num: $('.rail__chg .num', li),
  }]));
  function paintRail(id) {
    const cell = railCells.get(id);
    const s = state.get(id);
    if (!cell || !s) return;
    cell.value.textContent = money(s.market, s.row.step);
    paintChg(cell.chg, cell.num, s.change);
  }

  /* ---------- نوارِ نرخ ---------- */
  const tapeTrack = $('.tape__track');
  const tapeCells = new Map();
  for (const cell of $$('.tape__cell', tapeTrack)) {
    const list = tapeCells.get(cell.dataset.id) || [];
    list.push({ price: $('b', cell), d: $('.tape__d', cell) });
    tapeCells.set(cell.dataset.id, list);
  }
  function paintTapeCell(id) {
    const s = state.get(id);
    const list = tapeCells.get(id);
    if (!s || !list) return;
    for (const cell of list) {
      cell.price.textContent = money(s.market, s.row.step);
      const up = s.change >= 0;
      cell.d.classList.toggle('is-up', up);
      cell.d.classList.toggle('is-down', !up);
      cell.d.textContent = pct(s.change);
    }
  }
  /* بازنویسیِ انبوه فقط هنگام چرخه‌ی حلقه — تا layout داخل translate رخ ندهد */
  tapeTrack.addEventListener('animationiteration', () => {
    for (const id of state.keys()) paintTapeCell(id);
  });

  /* ---------- نمودار ---------- */
  const chart = {
    cv: $('#chart-canvas'),
    frame: $('.chart__frame'),
    symbol: $('#chart-symbol'),
    readout: $('#chart-readout'),
    live: $('#chart-live'),
    tf: '1h',
    ma: true,
    replay: 0,
    visible: true,
    needsDraw: true,
    pointer: -1,
  };
  const candleCache = new Map();
  const TF_LEN = { '5m': 84, '1h': 72, '1d': 60 };
  function buildSeries(id, tf) {
    const key = `${id}:${tf}`;
    if (candleCache.has(key)) return candleCache.get(key);
    const s = state.get(id);
    const row = s.row;
    const n = TF_LEN[tf];
    const r = mulberry32(fnv(`${SEED}:${id}:${tf}`));
    const scale = tf === '5m' ? 0.5 : tf === '1d' ? 2.6 : 1;
    const out = [];
    let price = s.prev;
    for (let i = 0; i < n; i += 1) {
      const o = price;
      const wick = row.vol * 3.2 * scale;
      const h = o * (1 + Math.abs(r() - 0.5) * wick * 2);
      const l = o * (1 - Math.abs(r() - 0.5) * wick * 2);
      const c = l + r() * (h - l || o * 0.0002);
      out.push({ o, h, l, c, v: 40 + r() * 260 });
      price = c;
    }
    const k = s.base / out[out.length - 1].c;
    for (const c of out) { c.o *= k; c.h *= k; c.l *= k; c.c *= k; }
    candleCache.set(key, out);
    return out;
  }

  let chartSize = { w: 0, h: 0, dpr: 1 };
  function syncChartSize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(280, chart.frame.clientWidth);
    const h = Math.max(220, chart.frame.clientHeight);
    if (chart.cv.width !== Math.round(w * dpr) || chart.cv.height !== Math.round(h * dpr)) {
      chart.cv.width = Math.round(w * dpr);
      chart.cv.height = Math.round(h * dpr);
      chartSize = { w, h, dpr };
      chart.needsDraw = true;
    } else chartSize = { w, h, dpr };
  }
  let sizeTimer = 0;
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => {
      clearTimeout(sizeTimer);
      sizeTimer = setTimeout(() => { syncChartSize(); drawChart(now()); }, 160);
    }).observe(chart.frame);
  } else {
    window.addEventListener('resize', () => { syncChartSize(); drawChart(now()); });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      chart.visible = entries[0].isIntersecting;
      if (chart.visible) chart.needsDraw = true;
    }, { threshold: 0 }).observe(chart.frame);
  }

  let lastDraw = 0;
  function drawChartFrame(t) {
    if (!chart.visible || document.hidden) return;
    const animating = chart.replay > 0 || tweens.length > 0;
    if (!animating && !chart.needsDraw && t - lastDraw < 400) return;
    if (REDUCED && !chart.needsDraw && !animating) return;
    drawChart(t);
  }

  function drawChart(t) {
    syncChartSize();
    const { w, h } = chartSize;
    const ctx = chart.cv.getContext('2d');
    ctx.setTransform(chartSize.dpr, 0, 0, chartSize.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const row = state.get(chart.symbol.value).row;
    const all = buildSeries(chart.symbol.value, chart.tf);
    const n = candleCount(w);
    const data = all.slice(all.length - n);
    const shown = chart.replay > 0 ? Math.max(2, Math.floor(n * chart.replay)) : n;
    const live = state.get(chart.symbol.value).market;

    const padT = 14, padB = 22, padS = 62;
    const axisStep = row.step >= 1000 ? row.step : 1;
    const volH = Math.round((h - padT - padB) * 0.18);
    const priceH = h - padT - padB - volH - 8;
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < shown; i += 1) { lo = Math.min(lo, data[i].l); hi = Math.max(hi, data[i].h); }
    lo = Math.min(lo, live); hi = Math.max(hi, live);
    const spanY = Math.max(hi - lo, hi * 1e-4);
    const y = (v) => padT + priceH - ((v - lo) / spanY) * priceH;
    const slot = (w - padS - 12) / n;
    const x = (i) => 12 + i * slot + slot / 2;

    /* شبکه و برچسبِ قیمت */
    ctx.font = '11px Vazirmatn, Tahoma, sans-serif';
    ctx.textBaseline = 'middle';
    for (let g = 0; g <= 4; g += 1) {
      const v = lo + (spanY * g) / 4;
      const gy = Math.round(y(v)) + 0.5;
      ctx.strokeStyle = 'rgba(233,189,87,.08)';
      ctx.beginPath(); ctx.moveTo(12, gy); ctx.lineTo(w - padS, gy); ctx.stroke();
      ctx.fillStyle = 'rgba(168,155,131,.85)';
      ctx.textAlign = 'right';
      ctx.fillText(money(v, axisStep), w - 6, gy);
    }

    /* حجم */
    let vmax = 0;
    for (let i = 0; i < shown; i += 1) vmax = Math.max(vmax, data[i].v);
    for (let i = 0; i < shown; i += 1) {
      const c = data[i];
      const bh = (c.v / vmax) * volH;
      ctx.fillStyle = c.c >= c.o ? 'rgba(38,240,161,.22)' : 'rgba(255,93,93,.2)';
      ctx.fillRect(Math.round(x(i) - slot * 0.32), padT + priceH + 8 + (volH - bh), Math.max(1, slot * 0.64), bh);
    }

    /* میله‌های شمع */
    const bodyW = Math.max(2, Math.round(slot * 0.56));
    for (let i = 0; i < shown; i += 1) {
      const c = data[i];
      const up = c.c >= c.o;
      const cx = Math.round(x(i)) + 0.5;
      ctx.strokeStyle = up ? cssVar('--up') : cssVar('--down');
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, y(c.h)); ctx.lineTo(cx, y(c.l)); ctx.stroke();
      const top = y(Math.max(c.o, c.c));
      const bh = Math.max(1.5, Math.abs(y(c.o) - y(c.c)));
      ctx.fillStyle = up ? 'rgba(38,240,161,.85)' : 'rgba(255,93,93,.82)';
      ctx.fillRect(Math.round(cx - bodyW / 2), Math.round(top), bodyW, Math.round(bh));
    }

    /* کندلِ زنده */
    if (chart.replay === 0) {
      const c = data[n - 1];
      const ly = Math.round(y(live)) + 0.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(251,233,182,.5)';
      ctx.beginPath(); ctx.moveTo(12, ly); ctx.lineTo(w - padS, ly); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = cssVar('--gold-hi');
      ctx.textAlign = 'right';
      ctx.fillText(money(live, axisStep), w - 6, clamp(ly, 10, h - 10));
    }

    /* میانگین متحرک */
    if (chart.ma && shown > 20) {
      ctx.beginPath();
      let sum = 0;
      for (let i = 0; i < shown; i += 1) {
        sum += data[i].c;
        if (i >= 20) sum -= data[i - 20].c;
        if (i >= 19) {
          const ma = sum / 20;
          const px = x(i);
          if (i === 19) ctx.moveTo(px, y(ma)); else ctx.lineTo(px, y(ma));
        }
      }
      ctx.strokeStyle = 'rgba(233,189,87,.85)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    /* crosshair */
    if (chart.pointer >= 0 && chart.pointer < shown) {
      const px = Math.round(x(chart.pointer)) + 0.5;
      ctx.strokeStyle = 'rgba(242,236,224,.35)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(px, padT); ctx.lineTo(px, h - padB); ctx.stroke();
      ctx.setLineDash([]);
    }

    /* برچسبِ زمان */
    ctx.fillStyle = 'rgba(168,155,131,.8)';
    ctx.textAlign = 'center';
    const labels = w < 640 ? 3 : 4;
    const stepMin = chart.tf === '5m' ? 5 : chart.tf === '1d' ? 1440 : 60;
    for (let i = 0; i < labels; i += 1) {
      const idx = Math.round((i * (shown - 1)) / (labels - 1));
      const mins = (shown - 1 - idx) * stepMin;
      const d = new Date(Date.now() - mins * 60000);
      ctx.fillText(timeText(d), clamp(x(idx), 24, w - padS - 24), h - 10);
    }
    lastDraw = t;
    chart.needsDraw = false;
  }

  const timeFmt = new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', hour12: false });
  const dayFmt = new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', month: 'numeric', day: 'numeric' });
  function timeText(d) {
    if (chart.tf === '1d') return dayFmt.format(d);
    /* هفتاد‌وسه کندلِ یک‌ساعته یعنی سه روز؛ ساعتِ خالی رویِ محور تکراری می‌شود */
    if (chart.tf === '1h' && chartSize.w >= 640) return `${dayFmt.format(d)} · ${timeFmt.format(d)}`;
    return timeFmt.format(d);
  }

  function drawChartStats() {
    const id = chart.symbol.value;
    const s = state.get(id);
    const all = buildSeries(id, chart.tf);
    const first = all[0];
    const hi = all.reduce((m, c) => Math.max(m, c.h), 0);
    const lo = all.reduce((m, c) => Math.min(m, c.l), Infinity);
    const vol = Math.round(all.reduce((m, c) => m + c.v, 0));
    $('#st-open').textContent = money(first.o, s.row.step);
    $('#st-high').textContent = money(hi, s.row.step);
    $('#st-low').textContent = money(lo, s.row.step);
    $('#st-close').textContent = money(s.market, s.row.step);
    $('#st-vol').textContent = group(vol);
  }

  chart.symbol.addEventListener('change', () => {
    selected = chart.symbol.value;
    chart.needsDraw = true;
    drawChartStats();
    if (rows.has(selected)) paintDetail(selected);
  });
  $$('.tab[data-tf]').forEach((tab) => tab.addEventListener('click', () => {
    chart.tf = tab.dataset.tf;
    $$('.tab[data-tf]').forEach((b) => {
      const on = b === tab;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    chart.needsDraw = true;
    drawChartStats();
  }));
  $('#ma-toggle').addEventListener('click', (e) => {
    chart.ma = !chart.ma;
    e.currentTarget.classList.toggle('is-on', chart.ma);
    e.currentTarget.setAttribute('aria-pressed', String(chart.ma));
    chart.needsDraw = true;
  });
  $('#replay').addEventListener('click', (e) => {
    if (chart.replay > 0) return;
    replayBtn = e.currentTarget;
    chart.live.textContent = 'پخشِ مجدد';
    e.currentTarget.setAttribute('aria-pressed', 'true');
    if (REDUCED) finishReplay();
    else chart.replay = 0.001;
    chart.needsDraw = true;
  });
  let replayBtn = null;
  function finishReplay() {
    chart.replay = 0;
    chart.live.textContent = 'پخشِ زنده';
    if (replayBtn) replayBtn.setAttribute('aria-pressed', 'false');
    replayBtn = null;
  }
  function candleCount(w) {
    const all = buildSeries(chart.symbol.value, chart.tf);
    return Math.min(all.length, Math.max(14, Math.floor((w - 74) / 11)));
  }
  chart.cv.addEventListener('pointermove', (e) => {
    const rect = chart.cv.getBoundingClientRect();
    const n = candleCount(rect.width);
    const plotW = rect.width - 74;
    const idx = clamp(Math.floor(((e.clientX - rect.left - 12) / (plotW / n))), 0, n - 1);
    chart.pointer = idx;
    chart.needsDraw = true;
    const all = buildSeries(chart.symbol.value, chart.tf);
    const data = all.slice(all.length - n);
    const c = data[idx];
    if (c) {
      const s = state.get(chart.symbol.value);
      chart.readout.classList.add('is-on');
      chart.readout.innerHTML =
        `<span>فتح <b class="num" dir="ltr">${money(c.o, s.row.step)}</b></span>` +
        `<span>تسویه <b class="num" dir="ltr">${money(c.c, s.row.step)}</b></span>` +
        `<span>بیشترین <b class="num" dir="ltr">${money(c.h, s.row.step)}</b></span>` +
        `<span>کمترین <b class="num" dir="ltr">${money(c.l, s.row.step)}</b></span>`;
    }
  });
  chart.cv.addEventListener('pointerleave', () => {
    chart.pointer = -1;
    chart.readout.classList.remove('is-on');
    chart.needsDraw = true;
  });

  /* ---------- تبدیل سریع ---------- */
  const conv = {
    amount: $('#conv-amount'),
    from: $('#conv-from'),
    to: $('#conv-to'),
    form: $('#conv-form'),
    out: $('#conv-out-box'),
    unit: $('#conv-amount-unit'),
    lines: $$('.conv__line b'),
    total: $('#conv-out'),
    rate: $('.conv__rate'),
  };
  const TOMAN = { id: 'toman', fa: 'تومان', step: 1, spread: 0 };
  const optionsFor = (sel, selected2) => {
    sel.innerHTML = '';
    [{ id: 'toman', fa: 'تومان' }, ...INSTRUMENTS].forEach((row) => {
      const o = document.createElement('option');
      o.value = row.id;
      o.textContent = row.fa;
      if (row.id === selected2) o.selected = true;
      sel.appendChild(o);
    });
  };
  optionsFor(conv.from, 'emami');
  optionsFor(conv.to, 'toman');
  const priceIn = (id, side) => {
    if (id === 'toman') return 1;
    const s = state.get(id);
    return side === 'buy' ? s.market : bidOf(s);
  };
  function qty() {
    const raw = Number(toEn(conv.amount.value).replace(/[٬٫]/g, (m) => (m === '٬' ? '' : '.')));
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  }
  function paintConvert(ms = 420) {
    const sFrom = conv.from.value === 'toman' ? TOMAN : state.get(conv.from.value).row;
    const side = $$('input[name=side]', conv.form).find((r) => r.checked).value;
    const unitLabel = conv.to.value === 'toman' ? 'تومان' : state.get(conv.to.value).row.fa;
    conv.unit.textContent = conv.from.value === 'toman' ? 'تومان' : state.get(conv.from.value).row.fa;
    const q = qty();
    const rate = priceIn(conv.from.value, side) * (1 + (side === 'buy' ? sFrom.spread : 0));
    const base = q * rate / priceIn(conv.to.value, side === 'buy' ? 'sell' : 'buy');
    const fee = base * FEE;
    /* خروجی همیشه تومان نیست؛ گاهی «تعداد» است و گردِ تابلو معنایی ندارد */
    const fmt = (v) => (conv.to.value === 'toman'
      ? money(v, 1000)
      : group(Math.abs(v) >= 100 ? Math.round(v) : v.toFixed(Math.abs(v) >= 1 ? 1 : 3)));
    /* جمعِ دو سطرِ پایین باید دقیقاً با عددِ درشتِ جواب برابر باشد */
    const snap = (v) => (conv.to.value === 'toman' ? roundTo(v, 1000)
      : Math.abs(v) >= 100 ? Math.round(v) : Number(v.toFixed(Math.abs(v) >= 1 ? 1 : 3)));
    const baseS = snap(base);
    const feeS = snap(fee);
    const total = side === 'buy' ? baseS + feeS : baseS - feeS;
    const from = Number(toEn(conv.total.textContent.replace(/[^\d۰-۹]/g, ''))) || 0;
    tween(from, total, ms, (v) => { conv.total.textContent = fmt(v); }, 'conv');
    conv.lines[0].textContent = fmt(baseS);
    conv.lines[1].textContent = fmt(feeS);
    conv.rate.innerHTML = conv.to.value === 'toman'
      ? `نرخِ تابلو <span class="num" dir="ltr">${money(rate, sFrom.step)}</span> · فردایی <span class="num" dir="ltr">${money(rate * 1.0085, sFrom.step)}</span>`
      : `هر ${sFrom.fa} = <span class="num" dir="ltr">${fmt(base / Math.max(q, 1e-9))}</span> ${unitLabel}`;
    $$('.conv__u', conv.out).forEach((u) => { u.textContent = unitLabel; });
  }
  [conv.amount, conv.from, conv.to].forEach((el) => {
    el.addEventListener('input', () => paintConvert(240));
    el.addEventListener('change', () => paintConvert(240));
  });
  $$('input[name=side]', conv.form).forEach((r) => r.addEventListener('change', () => paintConvert(240)));

  $('#conv-copy').addEventListener('click', async () => {
    const text = `${qty()} ${conv.unit.textContent} → ${conv.total.textContent} ${conv.to.selectedOptions[0].textContent}`;
    try { await navigator.clipboard.writeText(text); toast('نتیجه کپی شد', 'ok'); }
    catch { toast('کپی نشد؛ متن را انتخاب کنید'); }
  });

  /* ---------- پنجره‌ی سفارش ---------- */
  const dlg = $('#order-dialog');
  const sheetBody = $('#sheet-body');
  $('#conv-order').addEventListener('click', () => {
    const side = $$('input[name=side]', conv.form).find((r) => r.checked).value;
    sheetBody.innerHTML =
      `<p>طرفِ معامله: <b>${side === 'buy' ? 'خرید' : 'فروش'}</b></p>` +
      `<p>از: <b>${conv.unit.textContent}</b> به: <b>${conv.to.selectedOptions[0].textContent}</b></p>` +
      `<p>مبلغ: <b>${conv.total.textContent}</b></p>` +
      `<p>اعتبارِ نرخ: تا <b>${toFa('۰۵:۰۰')} دقیقه</b>ی دیگر.</p>` +
      `<p class="conv__disclaimer">این یک نمونه‌کار است؛ سفارشی ثبت نمی‌شود.</p>`;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
  });
  const closeSheet = () => { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); };
  $('#sheet-close').addEventListener('click', closeSheet);
  $('#sheet-cancel').addEventListener('click', closeSheet);
  $('#sheet-confirm').addEventListener('click', () => { closeSheet(); toast('درخواستِ شما در صفِ بررسی است', 'ok'); });
  dlg.addEventListener('cancel', closeSheet);

  /* ---------- استعلام اصالت ---------- */
  const WEIGHTS = [
    { w: 7.32, name: 'سکه‌ی تمام بهار آزادی' },
    { w: 3.66, name: 'نیم سکه' },
    { w: 1.83, name: 'ربع سکه' },
    { w: 1.0819, name: 'سکه گرمی' },
  ];
  $('#auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const serialRaw = toEn($('#serial').value).replace(/\D/g, '');
    const weightRaw = Number(toEn($('#weight').value).replace(/[٬]/g, '').replace('٫', '.'));
    const box = $('#auth-result');
    const text = $('.verdict__text', box);
    box.classList.remove('is-ok', 'is-no');
    if (serialRaw.length !== 8) {
      text.innerHTML = '<b>شماره‌ی سریال معتبر نیست</b>هشت رقمِ روی حاشیه‌ی سکه را وارد کنید.';
      return;
    }
    if (!Number.isFinite(weightRaw) || weightRaw <= 0) {
      text.innerHTML = '<b>وزن را وارد کنید</b>ترازوی زرگری را صفر کنید و سکه را بگذارید.';
      return;
    }
    const near = WEIGHTS.reduce((best, x) => (Math.abs(x.w - weightRaw) < Math.abs(best.w - weightRaw) ? x : best), WEIGHTS[0]);
    const diff = Math.abs(weightRaw - near.w);
    const h = fnv(`${SEED}:${serialRaw}:${near.w.toFixed(4)}`);
    const mint = h % 100;
    const digitSum = [...serialRaw].reduce((s, d) => s + Number(d), 0);
    const ok = diff <= near.w * 0.012 && mint >= 9 && digitSum % 7 !== 0;
    box.classList.add(ok ? 'is-ok' : 'is-no');
    text.innerHTML = ok
      ? `<b>نمونه با مشخصاتِ کارخانه می‌خواند</b>${near.name} · وزنِ استاندارد <span class="num" dir="ltr">${dec(near.w, 4)}</span> گرم · انحراف <span class="num" dir="ltr">${dec(diff * 1000, 1)}</span> صدم‌گرم · کدِ رهگیری <span class="num" dir="ltr">${toFa(String(h % 1_000_000).padStart(6, '0'))}</span>`
      : diff > near.w * 0.012
        ? `<b>وزن با ${near.name} نمی‌خواند</b>اختلاف <span class="num" dir="ltr">${dec(diff, 3)}</span> گرم؛ سکه را به ترازویِ مرجعِ شعبه بیاورید.`
        : `<b>این سریال در پایگاه ثبت نشده</b>سریال <span class="num" dir="ltr">${toFa(serialRaw)}</span> در فهرستِ ضربِ این دوره نیست. معامله را تعلیق کنید.`;
  });

  /* ---------- سبد پیگیری ---------- */
  const WATCH_KEY = 'sekke.watch.v1';
  const watchList = $('#watch-list');
  const watchEmpty = $('#wallet-empty');
  const totalEl = $('#watch-total');
  let watch = [];
  try { watch = JSON.parse(localStorage.getItem(WATCH_KEY) || '[]'); } catch { watch = []; }
  if (!Array.isArray(watch)) watch = [];
  watch = watch.filter((x) => x && state.has(x.id) && Number.isFinite(x.qty) && x.qty > 0);
  const watchEls = new Map();

  function saveWatch() {
    try { localStorage.setItem(WATCH_KEY, JSON.stringify(watch)); } catch { /* حالتِ خصوصی مرورگر */ }
  }
  function renderWatch() {
    for (const el of $$('.watch-row', watchList)) el.remove();
    watchEls.clear();
    watchEmpty.hidden = watch.length > 0;
    for (const item of watch) {
      const li = document.createElement('li');
      li.className = 'watch-row';
      li.innerHTML =
        '<span class="watch-row__name"></span>' +
        '<span class="watch-row__qty"><button type="button" data-d="-1" aria-label="کم کردن">−</button>' +
        '<span class="num tnum" dir="ltr"></span>' +
        '<button type="button" data-d="1" aria-label="اضافه کردن">+</button></span>' +
        '<span class="watch-row__value"><b class="num" dir="ltr"></b><i class="watch-row__u">تومان</i></span>' +
        '<span class="watch-row__pnl"><span class="num" dir="ltr"></span></span>' +
        '<button type="button" class="watch-row__drop">حذف</button>';
      li.querySelector('.watch-row__name').textContent = state.get(item.id).row.fa;
      watchList.appendChild(li);
      watchEls.set(item.id, {
        li, qty: $('.watch-row__qty .num', li), value: $('.watch-row__value .num', li),
        pnl: $('.watch-row__pnl', li), pnlNum: $('.watch-row__pnl .num', li),
      });
      $$('button[data-d]', li).forEach((b) => b.addEventListener('click', () => {
        item.qty = Math.max(0.25, Math.round((item.qty + Number(b.dataset.d) * 0.25) * 100) / 100);
        saveWatch(); paintWallet();
      }));
      $('.watch-row__drop', li).addEventListener('click', () => {
        watch = watch.filter((x) => x.id !== item.id);
        saveWatch(); renderWatch(); paintWallet();
      });
    }
    paintWallet();
  }
  function paintWallet() {
    let sum = 0;
    for (const item of watch) {
      const s = state.get(item.id);
      const cell = watchEls.get(item.id);
      if (!s || !cell) continue;
      const value = item.qty * s.market;
      sum += value;
      cell.qty.textContent = dec(item.qty, item.qty % 1 ? 2 : 0);
      cell.value.textContent = money(value, s.row.step);
      const pnl = s.market / (item.entry || s.market) - 1;
      paintChg(cell.pnl, $('.num', cell.pnl), pnl);
    }
    const from = Number(toEn(totalEl.textContent.replace(/[^\d۰-۹]/g, ''))) || 0;
    if (Math.abs(from - sum) > 1) tween(from, sum, REDUCED ? 0 : 500, (v) => { totalEl.textContent = money(v, 1000); }, 'wallet');
    else totalEl.textContent = money(sum, 1000);
  }
  $('#rate-watch').addEventListener('click', () => {
    const s = state.get(selected);
    const found = watch.find((x) => x.id === selected);
    if (found) found.qty = Math.round((found.qty + 1) * 100) / 100;
    else watch.push({ id: selected, qty: 1, entry: s.market });
    saveWatch(); renderWatch();
    toast(`${s.row.fa} به سبد اضافه شد`, 'ok');
  });
  $('#wallet-clear').addEventListener('click', () => {
    watch = [];
    saveWatch(); renderWatch();
    toast('سبد پاک شد');
  });

  /* ---------- ساعت و وضعیتِ شعب ---------- */
  const clocks = [$('#wall-clock'), $('#board-clock')];
  const DAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const clockFmt = Intl.DateTimeFormat
    ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tehran', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short' })
    : null;
  function clockNow() {
    try {
      const parts = clockFmt.formatToParts(new Date());
      const val = (t) => Number(parts.find((p) => p.type === t).value);
      const wd = parts.find((p) => p.type === 'weekday').value.slice(0, 3);
      return { h: val('hour') % 24, m: val('minute'), s: val('second'), day: DAY[wd] ?? 0 };
    } catch {
      const d = new Date();
      return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds(), day: d.getDay() };
    }
  }
  function paintClock() {
    const { h, m, s, day } = clockNow();
    const text = `${toFa(String(h).padStart(2, '0'))}:${toFa(String(m).padStart(2, '0'))}:${toFa(String(s).padStart(2, '0'))}`;
    for (const el of clocks) if (el) el.textContent = text;
    const hour = h + m / 60;
    $$('.branch__status').forEach((p) => {
      const days = p.dataset.days ? p.dataset.days.split(',').map(Number) : null;
      const off = !!days && !days.includes(day);
      const shift = (c) => (day === 4 && p.dataset.thu ? Math.min(c, Number(p.dataset.thu)) : c);
      const wins = off ? [] : [[Number(p.dataset.open), shift(Number(p.dataset.close))]]
        .concat(p.dataset.open2 ? [[Number(p.dataset.open2), Number(p.dataset.close2)]] : []);
      const live = wins.some(([o, c]) => hour >= o && hour < c);
      const pill = $('.pill', p);
      pill.classList.toggle('is-off', !live);
      pill.textContent = live ? 'در حالِ خدمت' : (off ? 'تعطیلِ هفته' : 'بسته است');
      const nextEl = $('.branch__next', p);
      if (live) { nextEl.textContent = ''; return; }
      const later = wins.map(([o]) => o).filter((o) => o > hour).sort((a, b) => a - b)[0];
      const first = wins.length ? wins[0][0] : Number(p.dataset.open);
      const hh = toFa(String((later ?? first + 24) % 24).padStart(2, '0')) + ':' + toFa('00');
      nextEl.textContent = `باز می‌شود ${hh}`;
    });
  }

  /* ---------- فرمِ درخواست نرخ ---------- */
  const phoneOf = (v) => toEn(v).replace(/\D/g, '');
  $('#c-symbol').innerHTML = '';
  INSTRUMENTS.forEach((row) => {
    const o = document.createElement('option');
    o.value = row.id;
    o.textContent = row.fa;
    $('#c-symbol').appendChild(o);
  });
  $('#rate-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#c-name');
    const phone = $('#c-phone');
    let ok = true;
    for (const [field, valid] of [[name, name.value.trim().length >= 3], [phone, /^09\d{9}$/.test(phoneOf(phone.value))]]) {
      const err = $(`#${field.id}-error`);
      field.parentElement.classList.toggle('is-bad', !valid);
      err.hidden = valid;
      field.setAttribute('aria-invalid', String(!valid));
      if (!valid) ok = false;
    }
    if (!ok) { toast('اطلاعات را کامل کنید'); return; }
    const code = fnv(`${SEED}:${phoneOf(phone.value)}:${name.value}`) % 1_000_000;
    const ticket = $('#ticket');
    ticket.hidden = false;
    ticket.innerHTML = `کدِ پیگیری شما <span class="num" dir="ltr">${toFa(String(code).padStart(6, '0'))}</span> است. کارشناسِ همان نماد با شما تماس می‌گیرد.`;
    toast('درخواست ثبت شد؛ کدِ پیگیری را نگه دارید', 'ok');
    e.target.reset();
  });

  /* ---------- اعلان ---------- */
  const toasts = $('#toasts');
  function toast(text, kind = '') {
    const div = document.createElement('div');
    if (kind) div.className = kind;
    div.textContent = text;
    toasts.appendChild(div);
    setTimeout(() => {
      div.style.transition = 'opacity .3s';
      div.style.opacity = '0';
      setTimeout(() => div.remove(), 320);
    }, 3200);
  }

  /* ---------- سرصفحه و فهرست موبایل ---------- */
  const header = $('#site-header');
  const toggle = $('#menu-toggle');
  const drawer = $('#nav-drawer');
  addEventListener('scroll', () => { header.classList.toggle('is-stuck', scrollY > 24); }, { passive: true });
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    drawer.hidden = open;
  });
  for (const a of $$('a', drawer)) a.addEventListener('click', () => { drawer.hidden = true; toggle.setAttribute('aria-expanded', 'false'); });

  /* ---------- کارت‌های ورق‌خور (لمس) ---------- */
  for (const coin of $$('.coin')) {
    coin.addEventListener('click', (e) => {
      if (e.target.closest('a,button')) return;
      coin.classList.toggle('is-flip');
    });
  }

  /* ---------- ظهور با اسکرول ---------- */
  if ('IntersectionObserver' in window) {
    const revealIo = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); revealIo.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    for (const el of $$('.reveal')) revealIo.observe(el);
  } else {
    for (const el of $$('.reveal')) el.classList.add('in');
  }

  mqReduce.addEventListener('change', (e) => { REDUCED = e.matches; chart.needsDraw = true; });

  /* ---------- راه‌اندازی ---------- */
  function boot() {
    hero.value.textContent = money(state.get(heroId).market, state.get(heroId).row.step);
    paintHero();
    for (const id of railIds) paintRail(id);
    for (const id of state.keys()) paintTapeCell(id);
    applyView(false);
    paintDetail(selected);
    paintConvert(0);
    renderWatch();
    paintClock();
    drawChartStats();
    syncChartSize();
    drawChart(now());
    start();
  }
  boot();
})();
