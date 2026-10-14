/* ===== بخار — منطق دمو ===== */
(function () {
  'use strict';

  const FA = '۰۱۲۳۴۵۶۷۸۹';
  const toFa = (value) => String(value).replace(/\d/g, (d) => FA[Number(d)]);
  const money = (n) => toFa(new Intl.NumberFormat('en-US').format(n).replace(/,/g, '٬'));
  const latinDigits = (s) => s.replace(/[۰-۹]/g, (d) => String(FA.indexOf(d))).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const digitsOnly = (s) => latinDigits(s).replace(/[\s-]/g, '');
  const $ = (sel) => document.querySelector(sel);

  const DAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  // شنبه تا چهارشنبه ۹ تا ۲۳ · پنج‌شنبه و جمعه ۹ تا ۲۴
  const HOURS = [
    { day: 'شنبه', from: 9, to: 23 },
    { day: 'یک‌شنبه', from: 9, to: 23 },
    { day: 'دوشنبه', from: 9, to: 23 },
    { day: 'سه‌شنبه', from: 9, to: 23 },
    { day: 'چهارشنبه', from: 9, to: 23 },
    { day: 'پنج‌شنبه', from: 9, to: 24 },
    { day: 'جمعه', from: 9, to: 24 },
  ];
  const CLOSE_JS = { 0: 23, 1: 23, 2: 23, 3: 23, 4: 23, 5: 24, 6: 23 };

  const COURSES = [
    { key: 'breakfast', title: 'صبحانه · تا ساعت ۱۲' },
    { key: 'drink', title: 'نوشیدنی' },
    { key: 'salty', title: 'میان‌وعده' },
    { key: 'sweet', title: 'شیرینی' },
  ];

  const MENU = [
    { n: 'املت سبزی', c: 'breakfast', p: 245000, v: true, d: 'سه تخم‌مرغ، شوید و تره‌ی تازه، پنیر محلی', t: ['پرفروش'] },
    { n: 'پنکی کارامل موز', c: 'breakfast', p: 230000, v: true, d: 'سه لایه پنکیک، کارامل نمکی، موز رسیده', t: ['پرفروش'] },
    { n: 'تست آووکادو', c: 'breakfast', p: 285000, v: true, d: 'نان خمیرترش، آووکادوی له‌شده، کنجد بوداده، لیمو' },
    { n: 'نیمرو با گوجه‌های کبابی', c: 'breakfast', p: 210000, v: true, d: 'دو تخم‌مرغ محلی، گوجه‌ی آتیشی، نان گرم' },
    { n: 'حلیم بادمجان', c: 'breakfast', p: 198000, v: false, d: 'بادمجون کبابی، گردو، رب انار، نعنا داغ' },
    { n: 'پنیر و گردو و نان خمیرترش', c: 'breakfast', p: 165000, v: true, d: 'پنیر لیقوان، گردوی تازه، سبزی خوردن' },
    { n: 'اسپرسو دبل', c: 'drink', p: 115000, v: true, d: 'دو شات، تلخی تمیز، کِرِمای گود' },
    { n: 'کاپوچینو', c: 'drink', p: 145000, v: true, d: 'شیر بخاردیده، پودر کاکائو' },
    { n: 'لاته هنری', c: 'drink', p: 158000, v: true, d: 'شیر کامل یا جو؛ نقش را باریستا می‌زند' },
    { n: 'دم‌آوری یرگاچیف', c: 'drink', p: 172000, v: true, d: 'فیلتر کاغذی، یادِ به و گل محمدی', t: ['تازه'] },
    { n: 'چای زعفرانی', c: 'drink', p: 95000, v: true, d: 'دم‌کشِ غلیظ با نبات و خرمای مضافتی' },
    { n: 'شکلات داغ', c: 'drink', p: 162000, v: true, d: 'شکلات ۵۵٪، شیر گرم، خامه‌ی زده‌نشده' },
    { n: 'آب‌پرتقال تازه', c: 'drink', p: 128000, v: true, d: 'پرتقال تامسون، همان لحظه گرفته می‌شود' },
    { n: 'ساندویچ بوقلمون دودی', c: 'salty', p: 235000, v: false, d: 'نان باگت، کاهو، پنیر، سس خردل عسلی' },
    { n: 'سوپ جو با قارچ', c: 'salty', p: 155000, v: true, d: 'جو پرک، قارچ، جعفری، لیمو' },
    { n: 'سالاد سزار با مرغ', c: 'salty', p: 248000, v: false, d: 'کاهو رومی، مرغ گریل، کروت، پارمزان', t: ['پرفروش'] },
    { n: 'کوکو سیب‌زمینی', c: 'salty', p: 178000, v: true, d: 'تخم‌مرغ، سیب‌زمینی، زرشک، نان گرم' },
    { n: 'کیک شکلات سه‌لایه', c: 'sweet', p: 165000, v: true, d: 'اسفنج کاکائو، موس شیری، سس تلخ' },
    { n: 'تارت توت‌فرنگی', c: 'sweet', p: 172000, v: true, d: 'خمیر کره‌ای، کرم قنادی، توت تازه' },
    { n: 'شیرینی توت و گل', c: 'sweet', p: 148000, v: true, d: 'لایه‌های کره‌ای، خامه‌ی گلاب، توت خشک', t: ['فصلی'] },
    { n: 'باقلای پسته', c: 'sweet', p: 132000, v: true, d: 'پسته‌ی اکبری، شربت گلاب، یک برش کوچک' },
  ];

  const BEANS = [
    { n: 'یرگاچیف · اتیوپی', r: 2, p: 320000, d: 'رُست روشن · یادِ به، گل محمدی، چای سیاه' },
    { n: 'سیرادو · کلمبیا', r: 3, p: 295000, d: 'رُست میان · کارامل، گردو، پرتقال' },
    { n: 'منت‌گن · برزیل', r: 4, p: 268000, d: 'رُست تیره · شکلات تلخ، فندق، بدنه‌ی سنگین' },
  ];

  // بازه‌های رزرو (عصر و شام) — دقیقه‌ها برای محاسبه
  const SLOTS = [[13, 0], [14, 0], [17, 0], [18, 0], [18, 30], [19, 0], [19, 30], [20, 0], [20, 30], [21, 0], [21, 30]];
  const TABLES = 8;

  const seed = (text) => {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  };

  // هر چه نفرات بیشتر، میزهای کمتری جواب می‌دهند
  function freeTables(dateKey, slotIndex, party) {
    const raw = seed(`${dateKey}#${slotIndex}`) % (TABLES + 1);
    return Math.max(0, raw - Math.max(0, party - 2));
  }

  const fmtTime = ([h, m]) => `${toFa(String(h).padStart(2, '0'))}:${toFa(String(m).padStart(2, '0'))}`;

  const longDate = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' });
  const shortDay = new Intl.DateTimeFormat('fa-IR', { weekday: 'short' });
  const shortDate = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short' });

  const week = [];
  const now = new Date();
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    week.push({
      date: d,
      key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
      jsDay: d.getDay(),
      name: shortDay.format(d),
      sub: i === 0 ? 'امروز' : shortDate.format(d),
    });
  }

  const state = { party: 2, day: 0, course: 'all', veg: false, slot: -1 };

  /* ===== منو ===== */
  const board = $('#menu-board');
  const boardEmpty = $('#menu-empty');
  const menuCount = $('#menu-count');

  function visibleItems() {
    return MENU.filter((item) => (state.course === 'all' || item.c === state.course) && (!state.veg || item.v));
  }

  function renderMenu() {
    const items = visibleItems();
    board.textContent = '';
    boardEmpty.hidden = items.length > 0;

    COURSES.forEach((course) => {
      const rows = items.filter((item) => item.c === course.key);
      if (!rows.length) return;
      const group = document.createElement('div');
      group.className = 'board__group';

      const title = document.createElement('p');
      title.className = 'board__title';
      title.textContent = course.title;
      group.append(title);

      const list = document.createElement('ul');
      list.className = 'board__list';
      rows.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'item';

        const head = document.createElement('div');
        head.className = 'item__head';
        const name = document.createElement('p');
        name.className = 'item__name';
        name.textContent = item.n;
        const leader = document.createElement('span');
        leader.className = 'item__leader';
        leader.setAttribute('aria-hidden', 'true');
        const price = document.createElement('p');
        price.className = 'item__price';
        price.textContent = money(item.p);
        head.append(name, leader, price);

        const desc = document.createElement('p');
        desc.className = 'item__desc';
        desc.textContent = item.d;

        li.append(head, desc);

        const tags = [];
        if (item.v) tags.push(['tag--veg', 'گیاهی']);
        (item.t || []).forEach((label) => tags.push([label === 'پرفروش' ? 'tag--new' : '', label]));
        if (tags.length) {
          const wrap = document.createElement('ul');
          wrap.className = 'item__tags';
          tags.forEach(([cls, label]) => {
            const tag = document.createElement('li');
            tag.className = `tag ${cls}`.trim();
            tag.textContent = label;
            wrap.append(tag);
          });
          li.append(wrap);
        }
        list.append(li);
      });
      group.append(list);
      board.append(group);
    });

    menuCount.textContent = `${toFa(items.length)} آیتم از ${toFa(MENU.length)}`;
  }

  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach((c) => {
        c.classList.toggle('is-active', c === chip);
        c.setAttribute('aria-pressed', String(c === chip));
      });
      state.course = chip.dataset.course;
      renderMenu();
    });
  });

  $('#veg-only').addEventListener('change', (event) => {
    state.veg = event.target.checked;
    renderMenu();
  });

  renderMenu();

  /* ===== رزرو میز ===== */
  const partyCount = $('#party-count');
  const partyMinus = $('#party-minus');
  const partyPlus = $('#party-plus');
  const dayStrip = $('#day-strip');
  const slotList = $('#slot-list');
  const slotNote = $('#slot-note');
  const formWrap = $('#booking-form-wrap');
  const formSummary = $('#formSummary');
  const doneBox = $('#booking-done');
  const live = $('#booking-live');

  week.forEach((day, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day';
    btn.innerHTML =
      `<span class="day__name"></span><span class="day__date"></span>` +
      `<span class="day__meter" aria-hidden="true"><i></i></span><span class="day__load"></span>`;
    btn.children[0].textContent = day.name;
    btn.children[1].textContent = day.sub;
    btn.addEventListener('click', () => {
      state.day = index;
      state.slot = -1;
      render();
    });
    dayStrip.append(btn);
  });

  function dayLoad(day) {
    let hours = 0;
    let tables = 0;
    SLOTS.forEach((_, i) => {
      if (isPast(day, i)) return;
      const free = freeTables(day.key, i, state.party);
      if (free > 0) {
        hours += 1;
        tables += free;
      }
    });
    return { hours, tables };
  }

  function isPast(day, slotIndex) {
    if (day.jsDay !== now.getDay() || day.date.toDateString() !== now.toDateString()) return false;
    const [h, m] = SLOTS[slotIndex];
    return h * 60 + m <= now.getHours() * 60 + now.getMinutes() + 60;
  }

  function renderDays() {
    [...dayStrip.children].forEach((btn, index) => {
      const day = week[index];
      const load = dayLoad(day);
      const ratio = Math.min(1, load.tables / (SLOTS.length * TABLES * 0.5));
      btn.classList.toggle('is-active', index === state.day);
      btn.classList.toggle('is-out', load.hours === 0);
      btn.disabled = load.hours === 0;
      btn.querySelector('i').style.width = `${Math.round(ratio * 100)}%`;
      btn.querySelector('.day__load').textContent =
        load.hours === 0 ? 'پُر' : ratio > 0.6 ? 'آزاد' : ratio > 0.25 ? 'محدود' : 'کم';
      btn.setAttribute('aria-pressed', String(index === state.day));
      btn.setAttribute('aria-label',
        `${longDate.format(day.date)} — ${load.hours === 0 ? 'جای خالی ندارد' : `${toFa(load.hours)} ساعت جا دارد`}`);
    });
  }

  function renderSlots() {
    const day = week[state.day];
    slotList.textContent = '';
    let open = 0;

    SLOTS.forEach((slot, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot';
      const free = isPast(day, index) ? 0 : freeTables(day.key, index, state.party);
      if (free > 0) open += 1;

      btn.innerHTML = `<span class="slot__time"></span><span class="slot__free"></span>`;
      btn.children[0].textContent = fmtTime(slot);
      btn.children[1].textContent = isPast(day, index) ? 'گذشته' : free === 0 ? 'پُر' : `${toFa(free)} میز خالی`;
      btn.disabled = free === 0;
      btn.classList.toggle('is-active', index === state.slot);
      btn.setAttribute('aria-pressed', String(index === state.slot));
      btn.addEventListener('click', () => {
        state.slot = index;
        render();
      });
      slotList.append(btn);
    });

    const weekHours = week.reduce((sum, d) => sum + dayLoad(d).hours, 0);
    if (weekHours === 0) {
      slotNote.textContent = '';
      slotNote.append(`برای ${toFa(state.party)} نفر در این هفته جایی نمانده. `);
      const tel = document.createElement('a');
      tel.href = 'tel:+982188001234';
      tel.textContent = 'تماس بگیرید';
      slotNote.append(tel, ' تا میز بزرگ‌تر یا شب بعدی را برایتان نگه داریم.');
    } else if (open === 0) {
      slotNote.textContent =
        `برای ${toFa(state.party)} نفر در ${longDate.format(day.date)} جایی نمانده؛ یکی از شب‌های روشن‌تر را انتخاب کنید.`;
    } else if (state.slot === -1) {
      slotNote.textContent =
        `${toFa(open)} ساعت در این شب جا دارد. عددی که زیر هر ساعت می‌بینید، تعداد میزهای خالی همان ساعت است.`;
    } else {
      slotNote.textContent = 'ساعت را انتخاب کردید؛ حالا نام و شماره‌تان را بنویسید.';
    }
  }

  function renderForm() {
    if (state.slot === -1) {
      formWrap.hidden = true;
      return;
    }
    doneBox.hidden = true;
    const day = week[state.day];
    formSummary.textContent =
      `${longDate.format(day.date)} · ساعت ${fmtTime(SLOTS[state.slot])} · ${toFa(state.party)} نفر`;
    formWrap.hidden = false;
  }

  function render() {
    partyCount.textContent = toFa(state.party);
    partyMinus.disabled = state.party <= 1;
    partyPlus.disabled = state.party >= 7;
    if (state.day > 0 && dayLoad(week[state.day]).hours === 0) state.day = 0;
    renderDays();
    if (state.slot >= 0 && (isPast(week[state.day], state.slot) || freeTables(week[state.day].key, state.slot, state.party) === 0)) {
      state.slot = -1;
    }
    renderSlots();
    renderForm();
  }

  partyMinus.addEventListener('click', () => { state.party = Math.max(1, state.party - 1); render(); });
  partyPlus.addEventListener('click', () => { state.party = Math.min(7, state.party + 1); render(); });

  /* ===== ثبت رزرو ===== */
  const form = $('#booking-form');
  const nameInput = $('#b-name');
  const phoneInput = $('#b-phone');
  const errorName = $('#e-name');
  const errorPhone = $('#e-phone');

  const mark = (input, node, ok) => {
    node.hidden = ok;
    input.setAttribute('aria-invalid', String(!ok));
  };

  const validPhone = (value) => /^09\d{9}$/.test(digitsOnly(value));

  [nameInput, phoneInput].forEach((input) => {
    input.addEventListener('input', () => {
      if (input === nameInput) mark(nameInput, errorName, input.value.trim().length >= 2);
      else mark(phoneInput, errorPhone, validPhone(input.value));
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const phone = digitsOnly(phoneInput.value);
    const okName = name.length >= 2;
    const okPhone = validPhone(phone);
    mark(nameInput, errorName, okName);
    mark(phoneInput, errorPhone, okPhone);
    if (!okName) { nameInput.focus(); return; }
    if (!okPhone) { phoneInput.focus(); return; }

    const day = week[state.day];
    const time = fmtTime(SLOTS[state.slot]);
    const occasion = $('#b-occasion').value;
    const code = toFa(String(seed(name + phone + day.key + time) % 9000 + 1000));

    doneBox.innerHTML =
      '<p class="done-head"><span class="done-mark" aria-hidden="true">✓</span><span>میزتان نگه داشته شد</span></p>' +
      `<dl class="done-grid">
        <div><dt>به نام</dt><dd data-k="name"></dd></div>
        <div><dt>شب</dt><dd data-k="day"></dd></div>
        <div><dt>ساعت</dt><dd data-k="time"></dd></div>
        <div><dt>نفرات</dt><dd data-k="party"></dd></div>
        ${occasion ? `<div><dt>مناسبت</dt><dd data-k="occ"></dd></div>` : ''}
      </dl>` +
      `<p class="done-note">کد پیگیری: <span class="done-code">بخار–${code}</span></p>` +
      '<p class="done-note">این نمونه‌ی نمایشی است؛ رزرو جایی ثبت نشد و تماسی گرفته نمی‌شود.</p>' +
      '<button class="btn btn--ghost" type="button" id="again">یک رزرو دیگر</button>';

    const set = (k, value) => { doneBox.querySelector(`[data-k="${k}"]`).textContent = value; };
    set('name', name);
    set('day', longDate.format(day.date));
    set('time', time);
    set('party', `${toFa(state.party)} نفر`);
    if (occasion) set('occ', occasion);

    doneBox.querySelector('#again').addEventListener('click', () => {
      doneBox.hidden = true;
      form.reset();
      state.slot = -1;
      render();
      $('#table').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    formWrap.hidden = true;
    doneBox.hidden = false;
    live.textContent = `رزرو ${name} برای ${toFa(state.party)} نفر، ${longDate.format(day.date)} ساعت ${time} ثبت شد.`;
    doneBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  render();

  /* ===== ساعت کاری و وضعیت زنده ===== */
  const hoursBody = $('#hours-table tbody');
  const todayName = DAYS[now.getDay()];
  HOURS.forEach((row) => {
    const tr = document.createElement('tr');
    const close = row.to === 24 ? '۲۴ (نیمه‌شب)' : toFa(row.to);
    tr.innerHTML = `<td></td><td></td>`;
    tr.children[0].textContent = row.day;
    tr.children[1].textContent = `${toFa(row.from)} تا ${close}`;
    if (row.day.replace('\u200c', '') === todayName.replace('\u200c', '')) tr.classList.add('is-today');
    hoursBody.append(tr);
  });

  const status = $('#open-status');
  const statusText = $('#open-status-text');
  const hourNow = now.getHours() + now.getMinutes() / 60;
  const openAt = 9;
  const closeAt = CLOSE_JS[now.getDay()];

  if (hourNow >= openAt && hourNow < closeAt) {
    status.classList.add('is-open');
    statusText.textContent = hourNow >= 11
      ? `الان باز است — تا ساعت ${toFa(closeAt)} · صبحانه تمام شده`
      : `الان باز است — صبحانه تا ساعت ۱۲ سرو می‌شود`;
  } else if (hourNow < openAt) {
    status.classList.add('is-closed');
    statusText.textContent = `الان بسته است — امروز ساعت ${toFa(openAt)} باز می‌شود`;
  } else {
    status.classList.add('is-closed');
    statusText.textContent = 'امروز بسته شد — فردا ساعت ' + toFa(openAt) + ' دوباره اینجا هستیم';
  }

  /* ===== دانه‌ها ===== */
  const beanList = $('#bean-list');
  BEANS.forEach((bean) => {
    const li = document.createElement('li');
    li.className = 'bean';
    li.innerHTML =
      '<p class="bean__name"></p><p class="bean__price"></p><p class="bean__notes"></p>' +
      '<p class="bean__roast"><span>درجه‌ی رُست</span><span class="roast-scale" aria-hidden="true"></span></p>';
    li.querySelector('.bean__name').textContent = bean.n;
    li.querySelector('.bean__price').textContent = `${money(bean.p)} تومان · هر کیلو`;
    li.querySelector('.bean__notes').textContent = bean.d;
    const scale = li.querySelector('.roast-scale');
    for (let i = 1; i <= 5; i += 1) {
      const dot = document.createElement('i');
      if (i <= bean.r) dot.className = 'on';
      scale.append(dot);
    }
    beanList.append(li);
  });

  /* ===== فهرست موبایل ===== */
  const toggle = $('#menu-toggle');
  const drawer = $('#nav-drawer');
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    drawer.hidden = !open;
  };
  toggle.addEventListener('click', () => setOpen(drawer.hidden));
  drawer.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !drawer.hidden) { setOpen(false); toggle.focus(); }
  });

  /* ===== ظهور با اسکرول ===== */
  const targets = document.querySelectorAll('.section > .wrap > *');
  targets.forEach((el) => el.classList.add('reveal'));

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach((el) => io.observe(el));
  } else {
    targets.forEach((el) => el.classList.add('is-in'));
  }

  /* ===== سال پاورقی ===== */
  $('#year').textContent = new Intl.DateTimeFormat('fa-IR', { calendar: 'persian', year: 'numeric' }).format(now);
}());
