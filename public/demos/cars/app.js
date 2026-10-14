/* ===== ماشین‌نما — نمایشگاه خودرو (نمونه‌ی نمایشی) ===== */
(function () {
  'use strict';

  /* ---------- کلاس‌های بدنه ---------- */
  var CLASSES = [
    { id: 'sport', label: 'اسپرت' },
    { id: 'luxury', label: 'سدان لوکس' },
    { id: 'suv', label: 'شاسی‌بلند' },
    { id: 'electric', label: 'برقی' },
    { id: 'city', label: 'شهری' }
  ];

  /* ---------- خودروها ---------- */
  var CARS = [
    { id: '911', name: '۹۱۱ توربو اس', brand: 'پورشه', cls: 'sport', price: 28500000000,
      power: 650, torque: 800, accel: 2.7, econ: '۱۲٫۴ لیتر', econLabel: 'مصرف ترکیبی',
      gearbox: '۸ سرعته دوکلاچه', seats: 4, length: '۴٫۵۱ متر', weight: '۱٬۶۴۰ کیلوگرم', boot: '۲۶۵ لیتر',
      desc: 'یه کوپه‌ی اسپرت با موتور عقب، برای رانندگی شهری و پیست.',
      feats: ['دیفرانسیل عقب فعال', 'ترمز سرامیکی', 'صندلی‌های اسپرت گرماشو', 'دوربین ۳۶۰ درجه'],
      imgs: [
        { src: 'porsche-911-main', alt: 'پورشه ۹۱۱ توربو اس خاکستری با رینگ طلایی، نمای سه‌ربع جلو' },
        { src: 'porsche-911-alt', alt: 'نمای دیگر از پورشه ۹۱۱ توربو اس در نور روز' }
      ], tag: 'منتخب' },

    { id: 'm4', name: 'M4 کوپه', brand: 'بی‌ام‌و', cls: 'sport', price: 14800000000,
      power: 510, torque: 650, accel: 3.9, econ: '۹٫۸ لیتر', econLabel: 'مصرف ترکیبی',
      gearbox: '۸ سرعته اتوماتیک', seats: 4, length: '۴٫۷۹ متر', weight: '۱٬۷۲۵ کیلوگرم', boot: '۴۴۵ لیتر',
      desc: 'موتور توئین‌توربو و بدنه‌ی کوپه، برای علاقه‌مندهای خودروهای اسپرت.',
      feats: ['حالت راکت برای شتاب', 'گریل عریض ورودی هوا', 'رینگ ۱۹/۲۰ اینچی', 'هدآپ دیسپلی'],
      imgs: [
        { src: 'bmw-m4-main', alt: 'بی‌ام‌و M4 کوپه سفید با گریل مشکی بزرگ، نمای سه‌ربع جلو' },
        { src: 'bmw-m4-alt', alt: 'نمای دیگر از بی‌ام‌و M4 کوپه سفید' }
      ], tag: 'محبوب' },

    { id: 'taycan', name: 'تایکان توربو جی‌تی', brand: 'پورشه', cls: 'electric', price: 24900000000,
      power: 646, torque: 900, accel: 2.3, econ: '۴۴۲ کیلومتر', econLabel: 'پیمایش با یک شارژ',
      gearbox: 'تک‌سرعت با دنده‌ی اسپرت', seats: 4, length: '۴٫۹۶ متر', weight: '۲۲۲۰ کیلوگرم', boot: '۴۰۷ لیتر',
      desc: 'یه سدان برقی پرقدرت با آیرودینامیک فعال و شتاب بالا.',
      feats: ['بسته‌ی ویساکاخ', 'باله‌ی عقب ثابت', 'شارژ ۱۰ تا ۸۰ درصد در ۱۸ دقیقه', 'سیستم ۸۰۰ ولت'],
      imgs: [
        { src: 'taycan-main', alt: 'پورشه تایکان توربو جی‌تی آبی پررنگ، نمای سه‌ربع جلو در سالن نمایشگاه' },
        { src: 'taycan-alt', alt: 'نمای دیگر از تایکان توربو جی‌تی آبی' }
      ], tag: 'جدید' },

    { id: 'model3', name: 'مدل ۳', brand: 'تسلا', cls: 'electric', price: 8900000000,
      power: 325, torque: 420, accel: 5.3, econ: '۴۳۰ کیلومتر', econLabel: 'پیمایش با یک شارژ',
      gearbox: 'تک‌سرعت', seats: 5, length: '۴٫۷۲ متر', weight: '۱۷۶۰ کیلوگرم', boot: '۴۲۵ لیتر',
      desc: 'سدان برقی با کابین ساده که بیشتر امکاناتش از نمایشگر وسط کنترل می‌شه.',
      feats: ['خلبان خودکار سطح ۲', 'به‌روزرسانی بی‌سیم', 'پروپیل حرارتی', 'دو صندوق جلو و عقب'],
      imgs: [
        { src: 'tesla-main', alt: 'تسلا مدل ۳ سفید با سقف شیشه‌ای، نمای سه‌ربع جلو' },
        { src: 'tesla-alt', alt: 'نمای عقب از تسلا مدل ۳ سفید' }
      ] },

    { id: 'cs', name: 'کلاس S', brand: 'مرسدس بنز', cls: 'luxury', price: 19200000000,
      power: 429, torque: 520, accel: 4.9, econ: '۸٫۶ لیتر', econLabel: 'مصرف ترکیبی',
      gearbox: '۹ سرعته اتوماتیک', seats: 5, length: '۵٫۱۸ متر', weight: '۲۰۱۵ کیلوگرم', boot: '۵۴۰ لیتر',
      desc: 'سدان لوکس با کابین کم‌صدا و صندلی عقب مجهز به ماساژور.',
      feats: ['معلق هوای فعال', 'چرخ‌های عقب چرخان', 'نمایشگر سرتاسری', 'صندلی عقب برقی با ماساژ'],
      imgs: [
        { src: 'benz-s-main', alt: 'مرسدس بنز کلاس S مشکی در حال حرکت، نمای جلو' },
        { src: 'benz-s-alt', alt: 'نمای سه‌ربع جلو از کلاس S در نمایشگاه IAA' }
      ], tag: 'لوکس' },

    { id: 'a8', name: 'A8L', brand: 'آئودی', cls: 'luxury', price: 15600000000,
      power: 340, torque: 500, accel: 5.7, econ: '۹٫۲ لیتر', econLabel: 'مصرف ترکیبی',
      gearbox: '۸ سرعته تیپ‌ترونیک', seats: 5, length: '۵٫۱۸ متر', weight: '۱٬۹۴۵ کیلوگرم', boot: '۵۰۵ لیتر',
      desc: 'سدان جادار با موتور هیبرید ملایم، برای سفر و رفت‌وآمد روزانه.',
      feats: ['معلق هوای پیش‌نگر', 'چهار چرخ متحرک کواترو', 'صفحه‌ی لمسی صندلی عقب', 'صدای بانگ و اِج'],
      imgs: [
        { src: 'audi-a8-main', alt: 'آئودی A8L سفید با رینگ‌های چندپره، نمای سه‌ربع جلو' },
        { src: 'audi-a8-alt', alt: 'نمای عقب از آئودی A8L سفید' }
      ] },

    { id: 'defender', name: 'دیفندر ۱۱۰', brand: 'لندروور', cls: 'suv', price: 12400000000,
      power: 400, torque: 550, accel: 6.1, econ: '۱۱٫۴ لیتر', econLabel: 'مصرف ترکیبی',
      gearbox: '۸ سرعته اتوماتیک', seats: 5, length: '۵٫۰۲ متر', weight: '۲٬۳۶۳ کیلوگرم', boot: '۸۵۷ لیتر',
      desc: 'شاسی‌بلندی برای رفت‌وآمد شهری و سفرهای خارج از جاده.',
      feats: ['مدل‌های زمین نایاب', 'عمق عبور از آب ۹۰ سانتی‌متر', 'فاصله‌ی محوری بلند', 'رینگ ۲۲ اینچی'],
      imgs: [
        { src: 'defender-main', alt: 'لندروور دیفندر سفید و مشکی با رینگ طلایی، نمای سه‌ربع جلو' },
        { src: 'defender-alt', alt: 'نمای دیگر از دیفندر با بدنه‌ی تیونینگ‌شده' }
      ], tag: 'محبوب' },

    { id: 'rav4', name: 'RAV۴', brand: 'تویوتا', cls: 'suv', price: 6400000000,
      power: 203, torque: 243, accel: 8.8, econ: '۸٫۱ لیتر', econLabel: 'مصرف ترکیبی',
      gearbox: '۸ سرعته اتوماتیک', seats: 5, length: '۴٫۶۰ متر', weight: '۱۶۵۵ کیلوگرم', boot: '۵۸۰ لیتر',
      desc: 'کراس‌اور خانوادگی برای استفاده‌ی روزمره، با هزینه‌ی نگهداری پایین.',
      feats: ['ایمنی فعال تویوتا سافتی', 'صندلی برقی راننده', 'دوربین نقطه‌ی کور', 'کنترل کشش شیب'],
      imgs: [
        { src: 'rav4-main', alt: 'تویوتا RAV4 خاکستری سبز، نمای سه‌ربع جلو در حاشیه‌ی شهر' },
        { src: 'rav4-alt', alt: 'نمای جلو از تویوتا RAV4' }
      ] },

    { id: 'clio', name: 'کلیو ئی‌تک', brand: 'رنو', cls: 'city', price: 3250000000,
      power: 143, torque: 205, accel: 9.9, econ: '۴٫۳ لیتر', econLabel: 'مصرف ترکیبی',
      gearbox: 'گیربکس تمام‌الکتریکی چندمد', seats: 5, length: '۴٫۰۵ متر', weight: '۱٬۳۴۴ کیلوگرم', boot: '۳۰۱ لیتر',
      desc: 'هاچ‌بک هیبرید برای رانندگی شهری و مسیرهای پرترافیک.',
      feats: ['حالت کاملاً برقی در شهر', 'نمایشگر عمودی مدیا', 'پارک خودکار', 'تهویه‌ی اتوماتیک'],
      imgs: [
        { src: 'clio-main', alt: 'رنو کلیو نقره‌ای، نمای سه‌ربع جلو مقابل نمایندگی' },
        { src: 'clio-alt', alt: 'نمای عقب از رنو کلیو نقره‌ای' }
      ] },

    { id: 'swift', name: 'سوئیفت هیبرید', brand: 'سوزوکی', cls: 'city', price: 2980000000,
      power: 83, torque: 107, accel: 12.5, econ: '۴٫۸ لیتر', econLabel: 'مصرف ترکیبی',
      gearbox: 'CVT', seats: 5, length: '۳٫۸۴ متر', weight: '۹۰۰ کیلوگرم', boot: '۲۶۵ لیتر',
      desc: 'هاچ‌بک کوچک و سبک که توی جای پارک‌های تنگ هم راحت جا می‌شه.',
      feats: ['بدنه‌ی سبک هارتکت', 'میل‌هیبرید ۱۲ ولت', 'شروع توقف‌شروع', 'مصرف پایین در شهر'],
      imgs: [
        { src: 'swift-main', alt: 'سوزوکی سوئیفت قهوه‌ای فلزی، نمای سه‌ربع جلو در نمایشگاه خودرو' }
      ], tag: 'اقتصادی' }
  ];

  /* ---------- ابزار فارسی ---------- */
  var FA = [];
  for (var d = 0; d < 10; d++) FA.push(String.fromCharCode(0x06f0 + d));
  function toFa(v) { return String(v).replace(/[0-9]/g, function (x) { return FA[+x]; }); }
  function toLatin(v) {
    return String(v)
      .replace(/[۰-۹]/g, function (x) { return String(x.charCodeAt(0) - 0x06f0); })
      .replace(/[٠-٩]/g, function (x) { return String(x.charCodeAt(0) - 0x0660); });
  }
  function money(n) { return toFa(String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '٬')); }
  function dec(n) { return toFa(String(n)).replace('.', '٫'); }

  function norm(s) {
    return toLatin(String(s))
      .replace(/\u200c|\u200d|\u0640/g, '')
      .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک')
      .replace(/[^\u0600-\u06ff\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim().toLowerCase();
  }
  function matches(query, fields) {
    var q = norm(query);
    if (!q) return true;
    var hay = norm(fields.join(' '));
    return q.split(' ').every(function (t) { return hay.indexOf(t) > -1; });
  }
  function classLabel(id) {
    for (var i = 0; i < CLASSES.length; i++) if (CLASSES[i].id === id) return CLASSES[i].label;
    return '';
  }
  function byId(id) {
    for (var i = 0; i < CARS.length; i++) if (CARS[i].id === id) return CARS[i];
    return null;
  }
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* ---------- وضعیت ---------- */
  var state = { query: '', cls: 'all', sort: 'featured', compare: [] };
  var MAX_COMPARE = 3;

  var $ = function (sel) { return document.querySelector(sel); };
  var grid = $('#car-grid');
  var chipsBox = $('#class-chips');
  var countEl = $('#result-count');
  var noticeEl = $('#compare-notice');
  var emptyEl = $('#fleet-empty');
  var searchEl = $('#car-search');
  var clearEl = $('#search-clear');
  var sortEl = $('#car-sort');

  /* ---------- فیلترها ---------- */
  function buildChips() {
    var html = '<button class="chip" type="button" data-cls="all" aria-pressed="true">'
      + 'همه <span class="chip__n num">' + toFa(CARS.length) + '</span></button>';
    CLASSES.forEach(function (c) {
      var n = CARS.filter(function (car) { return car.cls === c.id; }).length;
      html += '<button class="chip" type="button" data-cls="' + c.id + '" aria-pressed="false">'
        + esc(c.label) + ' <span class="chip__n num">' + toFa(n) + '</span></button>';
    });
    chipsBox.innerHTML = html;
    chipsBox.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      state.cls = b.dataset.cls;
      Array.prototype.forEach.call(chipsBox.children, function (c) {
        c.setAttribute('aria-pressed', String(c === b));
      });
      render();
    });
  }

  function visible() {
    var list = CARS.filter(function (c) {
      if (state.cls !== 'all' && c.cls !== state.cls) return false;
      return matches(state.query, [c.name, c.brand, classLabel(c.cls), c.desc, c.tag || '']);
    });
    var s = state.sort;
    list.sort(function (a, b) {
      if (s === 'price-asc') return a.price - b.price;
      if (s === 'price-desc') return b.price - a.price;
      if (s === 'power') return b.power - a.power;
      if (s === 'accel') return a.accel - b.accel;
      return CARS.indexOf(a) - CARS.indexOf(b);
    });
    return list;
  }

  /* ---------- کارت‌ها ---------- */
  function specCell(v, l) { return '<span class="spec"><span class="spec__v num">' + v + '</span><span class="spec__l">' + l + '</span></span>'; }

  function card(c) {
    var pressed = state.compare.indexOf(c.id) > -1;
    var img = c.imgs[0];
    return '<article class="car" data-id="' + c.id + '">'
      + '<div class="car__media">'
      +   '<img src="./assets/img/' + img.src + '.webp" alt="' + esc(img.alt) + '" loading="lazy" width="1100" height="690">'
      +   (c.tag ? '<span class="car__class">' + esc(c.tag) + '</span>' : '')
      + '</div>'
      + '<div class="car__body">'
      +   '<h3 class="car__name">' + esc(c.name) + '</h3>'
      +   '<p class="car__brand">' + esc(c.brand) + ' · ' + esc(classLabel(c.cls)) + '</p>'
      +   '<p class="car__desc">' + esc(c.desc) + '</p>'
      +   '<div class="spec-row">'
      +     specCell(toFa(c.power), 'اسب بخار')
      +     specCell(dec(c.accel), 'ثانیه ۰ تا ۱۰۰')
      +     specCell(c.econ, c.econLabel === 'پیمایش با یک شارژ' ? 'پیمایش' : 'مصرف')
      +   '</div>'
      +   '<div class="car__foot">'
      +     '<span class="price num">' + money(c.price) + '<small>تومان</small></span>'
      +   '</div>'
      +   '<div class="car__actions">'
      +     '<button class="btn btn--primary btn--sm" type="button" data-act="detail">دیدن جزئیات</button>'
      +     '<button class="btn btn--ghost btn--sm btn--cmp" type="button" data-act="compare" aria-pressed="' + pressed + '">'
      +       (pressed ? 'در مقایسه ✓' : 'مقایسه') + '</button>'
      +   '</div>'
      + '</div></article>';
  }

  function render() {
    var list = visible();
    grid.innerHTML = list.map(card).join('');
    var showEmpty = list.length === 0;
    emptyEl.hidden = !showEmpty;
    grid.hidden = showEmpty;
    countEl.textContent = showEmpty
      ? 'خودرویی پیدا نشد'
      : 'نمایش ' + toFa(list.length) + ' خودرو' + (state.cls !== 'all' ? ' از دستهٔ «' + classLabel(state.cls) + '»' : '')
        + (state.query ? ' برای «' + state.query + '»' : '');
    clearEl.hidden = !state.query;
    renderCompare();
  }

  /* ---------- تعامل با لیست ---------- */
  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-act]');
    if (!btn) return;
    var id = btn.closest('.car').dataset.id;
    if (btn.dataset.act === 'detail') openDetail(id);
    else toggleCompare(id);
  });

  searchEl.addEventListener('input', function () { state.query = searchEl.value.trim(); render(); });
  clearEl.addEventListener('click', function () { searchEl.value = ''; state.query = ''; render(); searchEl.focus(); });
  sortEl.addEventListener('change', function () { state.sort = sortEl.value; render(); });
  $('#empty-reset').addEventListener('click', function () {
    state.query = ''; state.cls = 'all'; searchEl.value = '';
    Array.prototype.forEach.call(chipsBox.children, function (c, i) { c.setAttribute('aria-pressed', String(i === 0)); });
    render(); searchEl.focus();
  });

  /* ---------- مقایسه ---------- */
  function toggleCompare(id) {
    var at = state.compare.indexOf(id);
    if (at > -1) { state.compare.splice(at, 1); notice(''); }
    else if (state.compare.length >= MAX_COMPARE) {
      notice('حداکثر ' + toFa(MAX_COMPARE) + ' خودرو را می‌توانید مقایسه کنید؛ اول یکی را حذف کنید.');
      return;
    } else { state.compare.push(id); notice(''); }
    render();
  }

  function notice(msg) {
    noticeEl.textContent = msg;
    noticeEl.hidden = !msg;
  }

  var ROWS = [
    { k: 'class', l: 'کلاس بدنه', f: function (c) { return classLabel(c.cls); } },
    { k: 'price', l: 'قیمت (تومان)', f: function (c) { return money(c.price); }, best: function (a, b) { return a.price < b.price; } },
    { k: 'power', l: 'قدرت', f: function (c) { return toFa(c.power) + ' اسب' ; }, best: function (a, b) { return a.power > b.power; } },
    { k: 'torque', l: 'گشتاور', f: function (c) { return toFa(c.torque) + ' نیوتن‌متر'; }, best: function (a, b) { return a.torque > b.torque; } },
    { k: 'accel', l: 'شتاب ۰ تا ۱۰۰', f: function (c) { return dec(c.accel) + ' ثانیه'; }, best: function (a, b) { return a.accel < b.accel; } },
    { k: 'econ', l: 'مصرف / پیمایش', f: function (c) { return c.econ; } },
    { k: 'gearbox', l: 'گیربکس', f: function (c) { return c.gearbox; } },
    { k: 'seats', l: 'ظرفیت', f: function (c) { return toFa(c.seats) + ' نفر'; } },
    { k: 'length', l: 'طول', f: function (c) { return c.length; } },
    { k: 'weight', l: 'وزن', f: function (c) { return c.weight; } },
    { k: 'boot', l: 'صندوق', f: function (c) { return c.boot; } }
  ];

  function renderCompare() {
    var bar = $('#compare-bar');
    var body = $('#compare-body');
    var picked = state.compare.map(byId).filter(Boolean);

    if (!picked.length) {
      bar.innerHTML = '';
      bar.hidden = true;
      body.innerHTML = '<div class="compare-empty"><strong>هنوز خودرویی انتخاب نشده</strong>'
        + 'از کارت خودروها، دو یا سه مدل رو برای مقایسه انتخاب کنید.</div>';
      return;
    }
    bar.hidden = false;

    bar.innerHTML = picked.map(function (c) {
      return '<span class="pick"><img src="./assets/img/' + c.imgs[0].src + '.webp" alt="">'
        + esc(c.brand) + ' ' + esc(c.name)
        + '<button type="button" data-drop="' + c.id + '" aria-label="حذف ' + esc(c.name) + ' از مقایسه">'
        + '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="11" height="11"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" fill="none"/></svg>'
        + '</button></span>';
    }).join('<span class="compare-hint">' + (picked.length < MAX_COMPARE ? 'می‌توانید ' + toFa(MAX_COMPARE - picked.length) + ' خودروی دیگر هم اضافه کنید' : '') + '</span>');

    var bests = {};
    ROWS.forEach(function (r) {
      if (!r.best || picked.length < 2) return;
      var win = picked[0];
      picked.forEach(function (c) { if (r.best(c, win)) win = c; });
      bests[r.k] = win.id;
    });

    var head = '<tr><th scope="col">مشخصات</th>' + picked.map(function (c) {
      return '<th scope="col"><img src="./assets/img/' + c.imgs[0].src + '.webp" alt="' + esc(c.imgs[0].alt) + '"><span>' + esc(c.brand) + ' ' + esc(c.name) + '</span></th>';
    }).join('') + '</tr>';

    var rows = ROWS.map(function (r) {
      return '<tr><th scope="row">' + r.l + '</th>' + picked.map(function (c) {
        return '<td class="num' + (bests[r.k] === c.id ? ' best' : '') + '">' + r.f(c) + '</td>';
      }).join('') + '</tr>';
    }).join('');

    body.innerHTML = '<div class="compare-scroll"><table class="compare">'
      + '<caption class="sr-only">جدول مقایسه‌ی مشخصات فنی خودروهای انتخاب‌شده</caption>'
      + '<thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>';
  }

  $('#compare-bar').addEventListener('click', function (e) {
    var b = e.target.closest('[data-drop]');
    if (b) toggleCompare(b.dataset.drop);
  });

  /* ---------- پنجره‌ی جزئیات ---------- */
  var dlg = $('#car-dialog');
  var dlgBody = $('#dialog-body');
  var current = null;

  function openDetail(id) {
    var c = byId(id);
    if (!c) return;
    current = c;
    var inCompare = state.compare.indexOf(id) > -1;

    dlgBody.innerHTML =
      '<div class="dl-media"><img id="dl-img" src="./assets/img/' + c.imgs[0].src + '.webp" alt="' + esc(c.imgs[0].alt) + '" width="1100" height="690"></div>'
      + (c.imgs.length > 1 ? '<div class="dl-thumbs">' + c.imgs.map(function (im, i) {
        return '<button type="button" data-view="' + i + '" data-active="' + (i === 0) + '" aria-label="نمایش ' + esc(im.alt) + '">'
          + '<img src="./assets/img/' + im.src + '.webp" alt=""></button>';
      }).join('') + '</div>' : '')
      + '<div class="dl-head"><h2 id="dialog-title">' + esc(c.brand) + ' ' + esc(c.name) + '</h2>'
      + '<span class="dl-class">' + esc(classLabel(c.cls)) + '</span></div>'
      + '<p class="dl-summary">' + esc(c.desc) + ' قیمت و مشخصات این صفحه برای نمایش نمونه‌کاره.</p>'
      + '<div class="dl-grid">'
      +   '<div><h3 class="dl-h">مشخصات فنی</h3><table class="dl-table"><tbody>'
      +     [['قدرت', toFa(c.power) + ' اسب بخار'], ['گشتاور', toFa(c.torque) + ' نیوتن‌متر'],
             ['شتاب ۰ تا ۱۰۰', dec(c.accel) + ' ثانیه'], [c.econLabel, c.econ],
             ['گیربکس', c.gearbox], ['ظرفیت', toFa(c.seats) + ' نفر'],
             ['طول', c.length], ['وزن', c.weight], ['حجم صندوق', c.boot]]
        .map(function (r) { return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td></tr>'; }).join('')
      +   '</tbody></table></div>'
      +   '<div><h3 class="dl-h">امکانات خودرو</h3><ul class="dl-feats">'
      +     c.feats.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('')
      +   '</ul></div>'
      + '</div>'
      + '<div class="dl-foot">'
      +   '<span class="dl-price num">' + money(c.price) + '<span>تومان · قیمت نمونه</span></span>'
      +   '<span class="dl-actions">'
      +     '<button class="btn btn--ghost btn--sm btn--cmp" type="button" data-act="compare" aria-pressed="' + inCompare + '">'
      +       (inCompare ? 'حذف از مقایسه' : 'افزودن به مقایسه') + '</button>'
      +     '<button class="btn btn--primary btn--sm" type="button" data-act="consult">مشاوره برای این خودرو</button>'
      +   '</span>'
      + '</div>';

    dlg.setAttribute('aria-label', c.brand + ' ' + c.name);
    if (typeof dlg.showModal !== 'function') { dlg.setAttribute('open', ''); }
    else dlg.showModal();
    $('#dialog-close').focus();
  }

  function closeDetail() {
    if (typeof dlg.close === 'function' && dlg.open) dlg.close();
    else dlg.removeAttribute('open');
  }

  dlgBody.addEventListener('click', function (e) {
    var thumb = e.target.closest('[data-view]');
    if (thumb && current) {
      var im = current.imgs[+thumb.dataset.view];
      var big = document.getElementById('dl-img');
      big.src = './assets/img/' + im.src + '.webp';
      big.alt = im.alt;
      Array.prototype.forEach.call(dlgBody.querySelectorAll('[data-view]'), function (b) {
        b.dataset.active = String(b === thumb);
      });
      return;
    }
    var b = e.target.closest('button[data-act]');
    if (!b || !current) return;
    if (b.dataset.act === 'compare') {
      toggleCompare(current.id);
      var now = state.compare.indexOf(current.id) > -1;
      b.setAttribute('aria-pressed', String(now));
      b.textContent = now ? 'حذف از مقایسه' : 'افزودن به مقایسه';
    } else if (b.dataset.act === 'consult') {
      var sel = $('#f-car');
      sel.value = current.id;
      closeDetail();
      document.getElementById('consult').scrollIntoView({ block: 'start' });
      setTimeout(function () { $('#f-name').focus(); }, 320);
    }
  });

  $('#dialog-close').addEventListener('click', closeDetail);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDetail(); });

  /* ---------- فرم مشاوره ---------- */
  var form = $('#consult-form');
  var done = $('#form-done');

  function setError(inputId, errId, msg) {
    var input = $(inputId), err = $(errId);
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', err.id);
      err.textContent = msg;
      err.hidden = false;
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
      err.hidden = true;
      err.textContent = '';
    }
    return !msg;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#f-name').value.trim();
    var phone = toLatin($('#f-phone').value).replace(/[\s-()]/g, '');
    var carId = $('#f-car').value;
    var okName = setError('#f-name', '#e-name',
      name.length < 3 ? 'لطفاً اسمتون رو کامل بنویسید؛ حداقل ۳ حرف.' : '');
    var okPhone = setError('#f-phone', '#e-phone',
      !/^09\d{9}$/.test(phone) ? 'شماره موبایل باید ۱۱ رقم باشه و با ۰۹ شروع بشه.' : '');
    if (!okName || !okPhone) {
      done.hidden = true;
      (okName ? $('#f-phone') : $('#f-name')).focus();
      return;
    }
    var car = carId ? byId(carId) : null;
    var timeText = $('#f-time').options[$('#f-time').selectedIndex].textContent;
    done.textContent = 'درخواست آزمایشی برای ' + (car ? car.brand + ' ' + car.name : 'مشاوره‌ی عمومی')
      + ' ثبت شد، ' + name + '. زمان تماس انتخابی: ' + timeText
      + ' — این فرم نمونه‌ست و تماسی گرفته نمی‌شه.';
    done.hidden = false;
    setError('#f-name', '#e-name', '');
    setError('#f-phone', '#e-phone', '');
    form.reset();
    done.scrollIntoView({ block: 'nearest' });
  });

  form.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'f-name' && t.getAttribute('aria-invalid')) setError('#f-name', '#e-name', '');
    if (t.id === 'f-phone' && t.getAttribute('aria-invalid')) setError('#f-phone', '#e-phone', '');
  });

  /* ---------- فهرست موبایل ---------- */
  var toggle = $('#menu-toggle');
  var drawer = $('#nav-drawer');
  toggle.addEventListener('click', function () {
    var open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    drawer.hidden = open;
  });
  drawer.addEventListener('click', function (e) {
    if (e.target.closest('a')) { toggle.setAttribute('aria-expanded', 'false'); drawer.hidden = true; }
  });

  /* ---------- راه‌اندازی ---------- */
  function fillCarSelect() {
    var sel = $('#f-car');
    CLASSES.forEach(function (cl) {
      var group = document.createElement('optgroup');
      group.label = cl.label;
      CARS.filter(function (c) { return c.cls === cl.id; }).forEach(function (c) {
        var o = document.createElement('option');
        o.value = c.id;
        o.textContent = c.brand + ' ' + c.name;
        group.appendChild(o);
      });
      sel.appendChild(group);
    });
  }

  function setYear() {
    try {
      var y = new Intl.DateTimeFormat('fa-IR', { calendar: 'persian', year: 'numeric' }).format(new Date());
      $('#year').textContent = y;
    } catch (e) { /* سال میلادی پایین‌تر */ }
  }

  document.getElementById('stat-fleet').textContent = toFa(CARS.length);
  buildChips();
  fillCarSelect();
  setYear();
  render();
})();
