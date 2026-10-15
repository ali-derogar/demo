/* ===== مکتب‌خانه — منطق دمو ===== */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var fa = function (value) {
    return String(value).replace(/[0-9]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[Number(d)]; });
  };
  var toFaDigits = function (text) {
    return String(text).replace(/[۰-۹]/g, function (d) { return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); })
      .replace(/[٠-٩]/g, function (d) { return String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)); });
  };
  var money = function (n) { return fa(Math.round(n).toLocaleString('en-US').replace(/,/g, '٬')); };

  /* ---------- داده‌ها ---------- */
  var DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
  var LEVELS = { novice: 'تازه‌کار', middle: 'نیمه‌حرفه‌ای', pro: 'پیشرفته' };
  var CRAFTS = { khat: 'خوشنویسی', negar: 'نگارگری', mosiqi: 'موسیقی', adab: 'ادبیات', najom: 'نجوم', hesab: 'حساب' };

  var COURSES = [
    {
      id: 'khat', name: 'قلم و مرکب', craft: 'khat', level: 'novice',
      img: 'course-khat', alt: 'صفحه‌ی خوشنویسی نستعلیق از موزه‌ی قلم‌های مردان قزوینی',
      sessions: 24, days: [0, 2], time: '۱۸:۰۰', long: 90, fee: 1450000,
      rating: 4.9, students: 212, teacher: 'استاد نوری‌قلم', room: 'حوزه‌ی آبی', startIn: 3,
      blurb: 'از تراشیدن قلم تا نوشتن نخستین سطرِ راست؛ پایه‌ی همه‌چیز همین‌جاست.',
      weeks: [
        ['قلم‌گیری', 'نحوه‌ی گرفتن قلم، زاویه‌ی نی روی کاغذ و آزمونِ خط صاف.'],
        ['الف و دندانه', 'کشیده‌ی الف، دندانه‌های «بـ» و «پـ»، و اندازه‌ی سیاه و سفید.'],
        ['«به نام»', 'نوشتن ترکیب در سه اندازه؛ تمرین فاصله‌ی بین حروف.'],
        ['مصرع کوتاه', 'یک بیت از گلستان، سطرنویسی روی خطِ راهنما.'],
        ['ترکیب و سطر', 'یک سطر کامل با دو کشیده؛ تحویل ورق برای تصحیح.']
      ],
      incl: ['قلم نیِ تراشیده', 'مرکب بادام', 'کاغذ آهار', 'پاشکن و زیرقلمی', 'دفترچه‌ی مشق']
    },
    {
      id: 'negar', name: 'گل و مرغ', craft: 'negar', level: 'middle',
      img: 'course-negar', alt: 'تصویر پنج قزلباش در بازدید از شیخ، کارگاه معین مصور، اصفهان',
      sessions: 18, days: [1, 3], time: '۱۶:۰۰', long: 105, fee: 1680000,
      rating: 4.8, students: 121, teacher: 'استاد وحدت', room: 'حوزه‌ی فیروزج', startIn: 6,
      blurb: 'رنگ‌های معدنی، برون‌دهی و ترنج؛ نقاشی ایرانی را از روی نمونه می‌خوانیم.',
      weeks: [
        ['طرح‌کشی', 'انتقال طرح با غبار‌پاشی و خط‌گیری اولیه روی کاغذ کاهی.'],
        ['رنگ‌سازی', 'ساخت رنگ از سنگ‌لاورد و زرنیخ؛ آزمایش غلظت روی حاشیه.'],
        ['برون‌دهی', 'سایه‌ی نرم در گلبرگ و پر؛ تمرین قلم‌مو در یک جهت.'],
        ['ترنج و ختمه', 'طرح تقارنِ هندسی و پر کردنِ کادرِ هشتی.'],
        ['قطعه‌ی تمام', 'ترکیب گل و مرغ در یک کادرِ بسته و جلا‌زدن.']
      ],
      incl: ['قلم‌موی کرک', 'سنگ‌لاورد', 'کاغذ کاهی آهاردار', 'برگه‌ی طلا (۱۰ قطعه)', 'قالب ترنج']
    },
    {
      id: 'mosiqi', name: 'سنتور: از شور تا چهارمضراب', craft: 'mosiqi', level: 'middle',
      img: 'course-mosiqi', alt: 'زنی قاجاری در حال نواختن سنتور',
      sessions: 20, days: [2, 4], time: '۱۹:۰۰', long: 75, fee: 1590000,
      rating: 4.9, students: 168, teacher: 'استاد گرازی', room: 'حوزه‌ی صدای زیر', startIn: 8,
      blurb: 'گوش اول، مضراب دوم. دستگاه‌ها را با یاد گرفتنِ سه گوشه شروع می‌کنیم.',
      weeks: [
        ['کوک و سلامت', 'شناسایی فاصله‌ها و کوک کردن سیم‌ها با گوش، نه با برنامه‌ی کوک.'],
        ['شور', 'گوشه‌های اصلی شور و یک مثالِ ساده در پرده‌ی اول.'],
        ['مضراب', 'پارچه‌زنی و ریزه‌زنی؛ تمرین با مترونوم از ۶۰ تا ۹۲.'],
        ['چهارمضراب', 'الگوی چهارضرب روی دو سیم و اتصال به گوشه‌ها.'],
        ['قطعه‌ی گوش‌دادنی', 'نواختن یک گوشه‌ی کامل برای گروه.']
      ],
      incl: ['مضراب نخی', 'کیفِ حمل', 'دفتر گوشه‌ها', 'ضبطِ جلسات', 'یک جلسه‌ی کوک رایگان']
    },
    {
      id: 'adab', name: 'خواندنِ حافظ', craft: 'adab', level: 'novice',
      img: 'course-adab', alt: 'صفحه‌ی سرلوحه‌دار از دیوان حافظ با اِعراب',
      sessions: 16, days: [0, 3], time: '۲۰:۰۰', long: 75, fee: 980000,
      rating: 4.7, students: 305, teacher: 'استاد شمسایی', room: 'حوزه‌ی کتابخانه', startIn: 3,
      blurb: 'غزل را اول درست بخوان، بعد معنی. تصحیحِ خوانش، کار اصلی ماست.',
      weeks: [
        ['عروض و تقطیع', 'پیدا کردن بحر غزل با گوش، نه با فرمول.'],
        ['غزل اول', 'خوانش بلند، رفعِ ابهامِ واژه‌ها و یادداشت حاشیه.'],
        ['ایهام', 'جایی که بیت دو معنا دارد؛ تمرین روی سه غزل.'],
        ['مقابلۀ نسخه', 'مقایسه‌ی خوانشِ دو مصحح مختلف.'],
        ['جلسه‌ی خوانش', 'هر هنرجو یک غزل را بلند می‌خواند و استاد تصحیح می‌کند.']
      ],
      incl: ['دیوان با ترجمه', 'جزوه‌ی عروض', 'ضبط جلسات', 'کارنامه‌ی خوانش']
    },
    {
      id: 'shahnameh', name: 'شاهنامه‌خوانی', craft: 'adab', level: 'novice',
      img: 'course-shahnameh', alt: 'نگارگری شاهنامه؛ دیو اکوان رستم را به دریا می‌اندازد',
      sessions: 12, days: [5], time: '۱۸:۳۰', long: 90, fee: 860000,
      rating: 4.8, students: 143, teacher: 'استاد شمسایی', room: 'حوزه‌ی کتابخانه', startIn: 11,
      blurb: 'هفته‌ای یک روایت؛ از رستم تا ضحاک، با نگارگرهای همان صفحه.',
      weeks: [
        ['ضحاک', 'اسطوره، تاریخ و خوانشِ متن در هفت بیت.'],
        ['کاوه', 'چرا درفشِ کاوه رنگ گرفت؛ نگاه به تصویرِ صحنه.'],
        ['سیاوش', 'مظالم‌خواهی و ساختار روایت.'],
        ['هفت‌خوان', 'شماره‌گذاری صحنه‌ها و ترجمه‌ی بصری.'],
        ['جلسه‌ی باز', 'هر کس یک صحنه را برای گروه تعریف می‌کند.']
      ],
      incl: ['برگه‌ی روایت', 'نگاره‌های چاپی', 'ضبط جلسات']
    },
    {
      id: 'najom', name: 'اسطرلاب و نجوم عملی', craft: 'najom', level: 'pro',
      img: 'course-najom', alt: 'اسطرلاب مسطح ایرانی متعلق به سال ۳۷۴ هجری',
      sessions: 14, days: [4], time: '۲۱:۰۰', long: 120, fee: 1290000,
      rating: 4.6, students: 62, teacher: 'استاد بهرامی‌مقر', room: 'بامِ مکتب', startIn: 14,
      blurb: 'با یک اسطرلاب کاغذی، ساعت شب، قبله و ارتفاع ستاره را می‌خوانیم.',
      weeks: [
        ['صفائح و پوله', 'چیدن صفائح و فهمیدن زاویه‌ها روی کاغذ.'],
        ['پیدا کردن قبله', 'سایه‌ی ساعت‌ها و خطِ نصف‌النهار.'],
        ['افق و مطلع', 'نمودارِ افق برای عرضِ جغرافیایی شهر ما.'],
        ['ستاره‌ها', 'سه ستاره‌ی پرنور و ارتفاعشان در نیمه‌ی شب.'],
        ['شبِ رصد', 'یک شبِ حضوری روی بام، با اسطرلاب و چشم.']
      ],
      incl: ['بسته‌ی اسطرلاب کاغذی', 'نقشه‌ی آسمان', 'شب رصد', 'جزوه‌ی تقویم']
    },
    {
      id: 'hesab', name: 'حساب و جبر', craft: 'hesab', level: 'middle',
      img: 'course-hesab', alt: 'صفحه‌ای از نسخه‌ی خطی کتاب الجبر و المقابله',
      sessions: 16, days: [1, 5], time: '۱۷:۰۰', long: 90, fee: 1120000,
      rating: 4.7, students: 88, teacher: 'استاد مقرمی', room: 'حوزه‌ی عدد', startIn: 6,
      blurb: 'مسئله را اول با کلمه بنویس، بعد با عدد — همان کاری که خوارزمی کرد.',
      weeks: [
        ['عدد و صورت', 'کار با کسرهای معمولی روی کاغذِ شطرنجی.'],
        ['جبر و مقابله', 'طرف‌های معادله را یکی می‌کنیم؛ جمع و تفریقِ هم‌سو.'],
        ['مساحت', 'رابطه‌ی مربع و مستطیل در مسائلِ زمین‌دار.'],
        ['وارون', 'پس‌زدن عملیات برای پیدا کردن مجهول.'],
        ['مسئله‌های مکتب', 'تقسیم هزینه‌ی اشتراک و زمانِ کلاس‌ها.']
      ],
      incl: ['جزوه‌ی مسئله', 'کاغذ شطرنجی', 'ضبط جلسات']
    }
  ];

  var TASKS = [
    ['قلم‌گیری و تراش', 'هفته‌ی ۱ · خوشنویسی'],
    ['الف و دندانه', 'هفته‌ی ۲ · خوشنویسی'],
    ['«به نام» در سه اندازه', 'هفته‌ی ۳ · خوشنویسی'],
    ['مصرعِ تمرینی', 'هفته‌ی ۴ · خوشنویسی'],
    ['پاک‌کردن لبه‌ها', 'هفته‌ی ۵ · خوشنویسی'],
    ['سطرآرایی سیاه و سفید', 'هفته‌ی ۶ · خوشنویسی'],
    ['دو بیت از گلستان', 'هفته‌ی ۷ · خوشنویسی'],
    ['تحویل ورق به استاد', 'هفته‌ی ۸ · خوشنویسی']
  ];

  /* ---------- وضعیت ---------- */
  var FAV_KEY = 'maktab-favorites-v1';
  var PROGRESS_KEY = 'maktab-progress-v1';

  var readStore = function (key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) { return fallback; }
  };
  var writeStore = function (key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* حالت خصوصی مرورگر */ }
  };

  var favorites = readStore(FAV_KEY, []);
  if (!Array.isArray(favorites)) favorites = [];
  var done = readStore(PROGRESS_KEY, [true, true, true, false, false, false, false, false]);
  if (!Array.isArray(done) || done.length !== TASKS.length) {
    done = [true, true, true, false, false, false, false, false];
  }

  var state = { craft: 'all', level: 'all', text: '', sort: 'popular' };
  var selectedPlan = '';
  var billing = 'month';

  var seed = function (str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  };
  var seatsFor = function (course, day) {
    var used = 6 + (seed(course.id + day) % 6);
    return Math.max(0, 12 - used);
  };

  /* ---------- اعلان ---------- */
  var toastHost = $('#toasts');
  var toast = function (msg) {
    if (!toastHost) return;
    var box = document.createElement('div');
    box.className = 'toast';
    box.textContent = msg;
    toastHost.appendChild(box);
    window.setTimeout(function () {
      box.style.opacity = '0';
      box.style.transition = 'opacity .4s ease';
      window.setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 420);
    }, 3200);
  };

  /* ---------- نمایش تدریجی ---------- */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var io = null;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  }
  var markReveal = function (nodes) {
    if (!io) return;
    nodes.forEach(function (node) {
      node.classList.add('reveal');
      io.observe(node);
    });
  };
  markReveal($$('.section-head, .promise__item, .plan, .teacher, .library-fig, .progress-card'));

  /* ---------- دوره‌ها ---------- */
  var gridEl = $('#course-grid');
  var emptyEl = $('#course-empty');
  var countEl = $('#course-count');

  var matches = function (c) {
    if (state.craft !== 'all' && c.craft !== state.craft) return false;
    if (state.level !== 'all' && c.level !== state.level) return false;
    if (state.text) {
      var hay = (c.name + ' ' + c.teacher + ' ' + c.blurb + ' ' + c.room + ' ' +
        CRAFTS[c.craft] + ' ' + c.incl.join(' ')).replace(/\s+/g, '');
      if (hay.indexOf(state.text) < 0) return false;
    }
    return true;
  };

  var sorted = function (list) {
    var out = list.slice();
    if (state.sort === 'cheap') out.sort(function (a, b) { return a.fee - b.fee; });
    else if (state.sort === 'long') out.sort(function (a, b) { return b.sessions - a.sessions; });
    else if (state.sort === 'soon') out.sort(function (a, b) { return a.startIn - b.startIn; });
    else out.sort(function (a, b) { return b.students - a.students; });
    return out;
  };

  var courseCard = function (c) {
    var src = './assets/img/' + c.img + '.webp';
    var isFav = favorites.indexOf(c.id) >= 0;
    var when = c.days.map(function (d) { return DAYS[d]; }).join(' و ');
    return '<article class="course" data-id="' + c.id + '">' +
      '<div class="course__media">' +
      '<img src="' + src + '" alt="' + c.alt + '" width="1100" height="825" loading="lazy">' +
      '<span class="course__level">' + LEVELS[c.level] + '</span>' +
      '<button class="course__fav" type="button" data-act="fav" aria-pressed="' + (isFav ? 'true' : 'false') +
      '" aria-label="نشانه‌گذاری دوره‌ی ' + c.name + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 4h10v16l-5-4-5 4z"/></svg>' +
      '</button></div>' +
      '<div class="course__body">' +
      '<p class="course__craft">' + CRAFTS[c.craft] + '</p>' +
      '<h3 class="course__title">' + c.name + '</h3>' +
      '<p class="course__blurb">' + c.blurb + '</p>' +
      '<ul class="course__facts">' +
      '<li>' + fa(c.sessions) + ' جلسه · ' + when + '، ساعت ' + c.time + '</li>' +
      '<li>' + c.teacher + ' · ' + c.room + '</li>' +
      '<li>شروع از ' + fa(c.startIn) + ' روز دیگر · ' + fa(c.students) + ' هنرجو</li>' +
      '</ul>' +
      '<div class="course__foot">' +
      '<p class="course__fee"><strong>' + money(c.fee) + '</strong>تومان / ماه</p>' +
      '<button class="btn btn--outline btn--sm" type="button" data-act="open">برنامه‌ی دوره</button>' +
      '</div></div></article>';
  };

  var ctaTile = function () {
    return '<div class="course course--cta">' +
      '<h3>هنوز نمی‌دانید کدام رشته؟</h3>' +
      '<p>یک ربع وقت بگذارید؛ بگویید دستتان را چه چیزی آرام می‌کند — قلم، رنگ، صدا یا عدد — و ما یک دوره‌ی آزمایشی برایتان می‌گذاریم.</p>' +
      '<a class="btn btn--primary btn--sm" href="#contact">مشاوره‌ی رایگان</a>' +
      '</div>';
  };

  var renderCourses = function () {
    if (!gridEl) return;
    var list = sorted(COURSES.filter(matches));
    gridEl.innerHTML = list.map(courseCard).join('') + ctaTile();
    if (countEl) {
      countEl.innerHTML = list.length
        ? 'نمایش <strong>' + fa(list.length) + '</strong> دوره' +
          (favorites.length ? ' · ' + fa(favorites.length) + ' دوره نشانه‌گذاری شده' : '')
        : 'دوره‌ای با این فیلترها نیست';
    }
    if (emptyEl) emptyEl.hidden = list.length !== 0;
    markReveal($$('.course', gridEl));
  };

  var syncChips = function () {
    $$('#craft-chips .chip').forEach(function (chip) {
      chip.classList.toggle('is-on', chip.getAttribute('data-craft') === state.craft);
    });
    var levelSel = $('#course-level');
    if (levelSel) levelSel.value = state.level;
  };

  var chips = $('#craft-chips');
  if (chips) {
    chips.addEventListener('click', function (ev) {
      var chip = ev.target.closest('.chip');
      if (!chip) return;
      state.craft = chip.getAttribute('data-craft');
      syncChips();
      renderCourses();
    });
  }

  var qEl = $('#course-q');
  if (qEl) {
    qEl.addEventListener('input', function () {
      state.text = toFaDigits(qEl.value).replace(/[^\p{L}\p{N}]/gu, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase();
      renderCourses();
    });
  }

  var levelEl = $('#course-level');
  if (levelEl) {
    levelEl.addEventListener('change', function () {
      state.level = levelEl.value;
      renderCourses();
    });
  }

  var sortEl = $('#course-sort');
  if (sortEl) {
    sortEl.addEventListener('change', function () {
      state.sort = sortEl.value;
      renderCourses();
    });
  }

  var clearFilters = function () {
    state.craft = 'all';
    state.level = 'all';
    state.text = '';
    if (qEl) qEl.value = '';
    syncChips();
    renderCourses();
  };
  var clearBtn = $('#course-clear');
  if (clearBtn) clearBtn.addEventListener('click', function () { clearFilters(); toast('فیلترها برداشته شد.'); });
  var resetBtn = $('#course-reset');
  if (resetBtn) resetBtn.addEventListener('click', function () { clearFilters(); });

  if (gridEl) {
    gridEl.addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-act]');
      var card = ev.target.closest('.course');
      if (!btn || !card || !card.getAttribute('data-id')) return;
      var course = COURSES.find(function (c) { return c.id === card.getAttribute('data-id'); });
      if (!course) return;
      if (btn.getAttribute('data-act') === 'fav') {
        var at = favorites.indexOf(course.id);
        if (at >= 0) { favorites.splice(at, 1); toast('از نشانه‌ها برداشته شد: ' + course.name); }
        else { favorites.push(course.id); toast('نشانه شد: ' + course.name); }
        writeStore(FAV_KEY, favorites);
        btn.setAttribute('aria-pressed', at >= 0 ? 'false' : 'true');
        renderCourses();
        return;
      }
      openCourse(course);
    });
  }

  /* ---------- گفت‌وگوی دوره ---------- */
  var dialog = $('#course-dialog');
  var bodyEl = $('#dialog-body');
  var titleEl = $('#dialog-title');

  var openCourse = function (c) {
    if (!dialog || !bodyEl || !titleEl) return;
    var src = './assets/img/' + c.img + '.webp';
    var when = c.days.map(function (d) { return DAYS[d]; }).join(' و ');
    var seats = seatsFor(c, c.days[0]);
    titleEl.textContent = c.name;
    bodyEl.innerHTML =
      '<div class="d-media"><img src="' + src + '" alt="' + c.alt + '" width="1100" height="825"></div>' +
      '<dl class="d-grid">' +
      '<div><dt>جلسات</dt><dd>' + fa(c.sessions) + ' جلسه</dd></div>' +
      '<div><dt>ساعت کلاس</dt><dd dir="ltr">' + c.time + '</dd></div>' +
      '<div><dt>ظرفیت باقی</dt><dd>' + fa(seats) + ' نفر</dd></div>' +
      '</dl>' +
      '<p class="d-blurb">' + c.blurb + ' این دوره در سطح ' + LEVELS[c.level] + '، روزهای ' + when +
      ' با ' + c.teacher + ' در ' + c.room + ' برگزار می‌شود. هر جلسه ' + fa(c.long) + ' دقیقه است و ضبطش تا ۳۰ روز در پنل شما می‌ماند.</p>' +
      '<p class="d-sub">برنامه‌ی هفتگی</p>' +
      '<div class="week">' + c.weeks.map(function (w, i) {
        return '<div class="week__row"><span class="week__n">' + fa(i + 1) + '</span>' +
          '<span><strong>' + w[0] + '</strong><span>' + w[1] + '</span></span></div>';
      }).join('') + '</div>' +
      '<p class="d-sub">آنچه در شهریه هست</p>' +
      '<ul class="incl">' + c.incl.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul>' +
      '<div class="d-foot">' +
      '<p class="fee"><strong>' + money(c.fee) + ' تومان</strong>شهریه‌ی ماهانه</p>' +
      '<button class="btn btn--primary" type="button" data-enroll="' + c.id + '">نام‌نویسی در این دوره</button>' +
      '</div>';
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };

  if (dialog) {
    dialog.addEventListener('click', function (ev) {
      if (ev.target === dialog) dialog.close();
      var btn = ev.target.closest('[data-enroll]');
      if (!btn) return;
      var id = btn.getAttribute('data-enroll');
      var course = COURSES.find(function (c) { return c.id === id; });
      dialog.close();
      fillEnroll(id);
      toast('دوره‌ی «' + (course ? course.name : '') + '» در فرم نام‌نویسی آماده شد.');
      var contact = $('#contact');
      if (contact) contact.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
    var closeBtn = $('#dialog-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { dialog.close(); });
  }

  var fillEnroll = function (id) {
    var sel = $('#e-course');
    if (sel) {
      $$('option', sel).forEach(function (opt) { if (opt.value === id) sel.value = id; });
    }
    var course = COURSES.find(function (c) { return c.id === id; });
    if (course) {
      var lvl = $('#e-level');
      if (lvl && LEVELS[course.level]) lvl.value = course.level;
    }
  };

  /* ---------- برنامه‌ی هفتگی ---------- */
  var tabsEl = $('#day-tabs');
  var schedEl = $('#schedule-list');
  var schedNote = $('#schedule-note');
  var activeDay = 0;

  var sessionsOn = function (day) {
    return COURSES.filter(function (c) { return c.days.indexOf(day) >= 0; })
      .sort(function (a, b) { return a.time.localeCompare(b.time, 'fa'); })
      .map(function (c) { return { course: c, day: day }; });
  };

  var renderTabs = function () {
    if (!tabsEl) return;
    tabsEl.innerHTML = DAYS.map(function (name, i) {
      var n = sessionsOn(i).length;
      return '<button class="day-tab' + (i === activeDay ? ' is-on' : '') + '" type="button" role="tab" ' +
        'aria-selected="' + (i === activeDay ? 'true' : 'false') + '" data-day="' + i + '">' + name +
        '<span class="day-tab__n">' + fa(n) + '</span></button>';
    }).join('');
  };

  var renderSchedule = function () {
    if (!schedEl) return;
    var list = sessionsOn(activeDay);
    if (!list.length) {
      schedEl.innerHTML = '<p class="sess sess--none">' + DAYS[activeDay] + ' مکتب کلاسی ندارد؛ ضبطِ جلسات و کتابخانه باز است.</p>';
    } else {
      schedEl.innerHTML = list.map(function (item) {
        var c = item.course;
        var seats = seatsFor(c, item.day);
        var tight = seats <= 2;
        return '<article class="sess" data-id="' + c.id + '">' +
          '<p class="sess__time">' + c.time + '<em>' + fa(c.long) + ' دقیقه</em></p>' +
          '<div class="sess__main"><h3>' + c.name + '</h3><p>' + CRAFTS[c.craft] + ' · ' + c.teacher + '</p></div>' +
          '<p class="sess__room">' + c.room + '</p>' +
          '<p class="sess__seats' + (tight ? ' is-tight' : '') + '">' + (seats ? fa(seats) + ' جای مانده' : 'تکمیل شده') + '</p>' +
          '<button class="btn btn--outline btn--sm" type="button" data-act="open">جزئیات</button>' +
          '</article>';
      }).join('');
    }
    if (schedNote) {
      schedNote.textContent = 'در ' + DAYS[activeDay] + ' ' + fa(list.length) +
        ' جلسه ثبت شده است. ظرفیت‌ها لحظه‌ای است؛ رزرو نهایی در نام‌نویسی انجام می‌شود.';
    }
    markReveal($$('.sess', schedEl));
  };

  if (tabsEl) {
    tabsEl.addEventListener('click', function (ev) {
      var tab = ev.target.closest('.day-tab');
      if (!tab) return;
      activeDay = Number(tab.getAttribute('data-day'));
      renderTabs();
      renderSchedule();
    });
  }

  if (schedEl) {
    schedEl.addEventListener('click', function (ev) {
      var card = ev.target.closest('.sess');
      if (!card || !card.getAttribute('data-id')) return;
      var course = COURSES.find(function (c) { return c.id === card.getAttribute('data-id'); });
      if (course) openCourse(course);
    });
  }

  /* ---------- اتاق من ---------- */
  var taskHost = $('#task-list');
  var ringBar = $('#ring-bar');
  var ringValue = $('#ring-value');
  var progressLine = $('#progress-line');
  var statDone = $('#stat-done');
  var statLeft = $('#stat-left');
  var CIRC = 327;

  var roomCopy = [
    'هنوز مشقی علامت نزده‌اید؛ با هفته‌ی ۱ شروع کنید.',
    'شروع خوب است. قلم‌گیری را تمام کرده‌اید.',
    'سه ورق تصحیح شده؛ به سطرآرایی رسیده‌اید.',
    'نیمه‌ی راه. از اینجا به بعد سرعت می‌گیرد.',
    'پنج مشق تمام؛ ترکیب‌ها دارد صاف می‌شود.',
    'شش ورق؛ فقط دو تمرین تا قطعه‌ی پایان.',
    'هفت مشق. یک تحویل ورق مانده.',
    'همه‌ی مشق‌ها تحویل شده. منتظر نمایشگاه باشید.'
  ];

  var renderTasks = function () {
    if (!taskHost) return;
    taskHost.innerHTML = TASKS.map(function (task, i) {
      return '<li class="task"><label class="task__label"><input type="checkbox" data-index="' + i + '"' +
        (done[i] ? ' checked' : '') + '>' +
        '<span class="task__box" aria-hidden="true"></span>' +
        '<span class="task__text"><strong>' + task[0] + '</strong><em>' + task[1] + '</em></span>' +
        '<span class="task__state">' + (done[i] ? 'تصحیح شد' : 'در انتظار') + '</span></label></li>';
    }).join('');
    paintProgress();
  };

  var paintProgress = function () {
    var count = done.filter(Boolean).length;
    var part = count / TASKS.length;
    if (ringBar) ringBar.style.strokeDashoffset = String(Math.round(CIRC * (1 - part)));
    if (ringValue) ringValue.textContent = fa(Math.round(part * 100)) + '٪';
    if (statDone) statDone.textContent = fa(count);
    if (statLeft) statLeft.textContent = fa(TASKS.length - count);
    if (progressLine) progressLine.textContent = roomCopy[Math.min(count, roomCopy.length - 1)];
    var nextTitle = $('#next-title');
    var nextMeta = $('#next-meta');
    if (nextTitle && nextMeta) {
      var first = COURSES.find(function (c) { return c.days.indexOf(activeDay) >= 0; }) || COURSES[0];
      var open = TASKS.findIndex(function (t, i) { return !done[i]; });
      nextTitle.textContent = open >= 0 ? TASKS[open][0] : 'قطعه‌ی نمایشگاه';
      nextMeta.textContent = DAYS[activeDay] + ' ' + first.time + ' · ' + first.room + ' · ' +
        fa(seatsFor(first, activeDay)) + ' هنرجو';
    }
  };

  if (taskHost) {
    taskHost.addEventListener('change', function (ev) {
      var box = ev.target.closest('input[type="checkbox"]');
      if (!box) return;
      var i = Number(box.getAttribute('data-index'));
      done[i] = box.checked;
      writeStore(PROGRESS_KEY, done);
      var label = box.closest('.task');
      if (label) {
        var stateEl = $('.task__state', label);
        if (stateEl) stateEl.textContent = box.checked ? 'تصحیح شد' : 'در انتظار';
      }
      paintProgress();
      if (box.checked) toast('مشق علامت خورد · ' + TASKS[i][0]);
    });
  }

  var checkAll = $('#task-check-all');
  if (checkAll) {
    checkAll.addEventListener('click', function () {
      var allDone = done.every(Boolean);
      done = TASKS.map(function () { return !allDone; });
      writeStore(PROGRESS_KEY, done);
      renderTasks();
      toast(allDone ? 'دفترچه از نو باز شد.' : 'همه‌ی مشق‌ها علامت خورد.');
    });
  }

  var clearTasks = $('#task-clear');
  if (clearTasks) {
    clearTasks.addEventListener('click', function () {
      done = TASKS.map(function () { return false; });
      writeStore(PROGRESS_KEY, done);
      renderTasks();
      toast('دفترچه‌ی مشق پاک شد.');
    });
  }

  /* ---------- اشتراک ---------- */
  var billMonth = $('#bill-month');
  var billYear = $('#bill-year');
  var planNote = $('#plan-note');

  var paintPlans = function () {
    $$('.plan__price').forEach(function (price) {
      var amount = $('.amount', price);
      var unit = $('.unit', price);
      if (!amount) return;
      amount.textContent = billing === 'year' ? amount.getAttribute('data-year') : amount.getAttribute('data-month');
      if (unit) unit.textContent = billing === 'year' ? 'تومان / سال' : 'تومان / ماه';
    });
    if (billMonth) {
      billMonth.classList.toggle('is-on', billing === 'month');
      billMonth.setAttribute('aria-pressed', billing === 'month' ? 'true' : 'false');
    }
    if (billYear) {
      billYear.classList.toggle('is-on', billing === 'year');
      billYear.setAttribute('aria-pressed', billing === 'year' ? 'true' : 'false');
    }
    if (planNote) {
      planNote.innerHTML = selectedPlan
        ? 'انتخاب شما: <strong>' + selectedPlan + '</strong> — ' + (billing === 'year' ? 'سالانه، دو ماه مهمان مکتب' : 'ماهانه') + '. در فرم نام‌نویسی یادداشت کنید تا همان فعال شود.'
        : 'هنوز اشتراکی انتخاب نشده.';
    }
  };

  if (billMonth) billMonth.addEventListener('click', function () { billing = 'month'; paintPlans(); });
  if (billYear) billYear.addEventListener('click', function () { billing = 'year'; paintPlans(); });
  $$('.plan__pick').forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectedPlan = btn.getAttribute('data-plan');
      paintPlans();
      toast('اشتراک «' + selectedPlan + '» انتخاب شد.');
      var note = $('#e-note');
      if (note && !note.value) note.value = 'اشتراک: ' + selectedPlan;
    });
  });

  /* ---------- فرم نام‌نویسی ---------- */
  var form = $('#enroll-form');
  var courseSel = $('#e-course');
  var daysHost = $('#e-days');
  var live = $('#enroll-live');

  if (courseSel) {
    courseSel.innerHTML = COURSES.map(function (c) {
      return '<option value="' + c.id + '">' + c.name + ' — ' + CRAFTS[c.craft] + '</option>';
    }).join('');
  }

  if (daysHost) {
    daysHost.innerHTML = DAYS.slice(0, 6).map(function (name, i) {
      return '<label class="check-label"><input type="checkbox" value="' + name + '" data-day="' + i + '"><span>' + name + '</span></label>';
    }).join('');
  }

  var makeCode = function (salt, prefix) {
    var alphabet = 'ACDEFHJKLMNPRTWXY34679';
    var n = seed(salt);
    var out = '';
    for (var i = 0; i < 4; i += 1) {
      out += alphabet.charAt(n % alphabet.length);
      n = Math.floor(n / alphabet.length) + (i + 1) * 31;
    }
    return prefix + '-' + out;
  };

  var setError = function (input, errId, bad) {
    var err = $('#' + errId);
    if (input) input.classList.toggle('is-bad', bad);
    if (err) err.hidden = !bad;
    input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return !bad;
  };

  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var nameEl = $('#e-name');
      var phoneEl = $('#e-phone');
      var okName = setError(nameEl, 'e-name-err', String(nameEl.value).trim().length < 3);
      var digits = toFaDigits(phoneEl.value).replace(/\D/g, '').replace(/^98/, '');
      var okPhone = setError(phoneEl, 'e-phone-err', !/^09\d{9}$/.test(digits));
      if (!okName) { nameEl.focus(); toast('نام‌تان را کامل بنویسید.'); return; }
      if (!okPhone) { phoneEl.focus(); toast('شماره‌ی همراه ۱۱ رقمی و با ۰۹ شروع شود.'); return; }

      var course = COURSES.find(function (c) { return c.id === courseSel.value; }) || COURSES[0];
      var chosen = $$('input:checked', daysHost).map(function (box) { return box.value; });
      var code = makeCode(phoneEl.value + course.id + Date.now(), 'MKT');
      if (live) {
        live.innerHTML = 'درخواست شما ثبت شد، ' + String(nameEl.value).trim().split(/\s+/)[0] +
          '. دوره‌ی <strong>' + course.name + '</strong> برای روزهای ' +
          (chosen.length ? chosen.join(' و ') : 'هر روزی') + ' رزرو شد. کد پیگیری:' +
          '<span class="code">' + code + '</span>';
      }
      toast('درخواست ثبت شد · کد پیگیری ' + code);
      form.reset();
      if (noteKept()) { /* nothing */ }
      paintPlans();
    });
  }

  var noteKept = function () {
    var note = $('#e-note');
    if (note) note.value = selectedPlan ? 'اشتراک: ' + selectedPlan : '';
    return true;
  };

  /* ---------- فرم آغازین ---------- */
  var finder = $('#finder');
  if (finder) {
    finder.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var craft = $('#craft');
      var level = $('#level');
      state.craft = craft ? craft.value : 'all';
      state.level = level ? level.value : 'all';
      syncChips();
      renderCourses();
      var courses = COURSES.filter(matches);
      toast(courses.length
        ? fa(courses.length) + ' دوره با انتخاب شما پیدا شد.'
        : 'با این سطح و رشته دوره‌ای نیست؛ سطح را تغییر دهید.');
      var target = $('#courses');
      if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  }

  /* ---------- فهرست موبایل ---------- */
  var toggle = $('#menu-toggle');
  var drawer = $('#nav-drawer');
  if (toggle && drawer) {
    var backdrop = document.createElement('div');
    backdrop.className = 'mobile-menu-backdrop';
    backdrop.setAttribute('hidden', '');
    document.body.appendChild(backdrop);
    var setDrawer = function (open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      drawer.hidden = !open;
      backdrop.hidden = !open;
      document.body.classList.toggle('menu-open', open);
    };
    toggle.addEventListener('click', function () { setDrawer(drawer.hidden); });
    backdrop.addEventListener('click', function () { setDrawer(false); });
    drawer.addEventListener('click', function (ev) {
      if (ev.target.closest('a')) setDrawer(false);
    });
  }

  /* ---------- لنگرها ---------- */
  document.addEventListener('click', function (ev) {
    var link = ev.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href');
    if (!id || id === '#') return;
    var target = document.querySelector(id);
    if (!target) return;
    ev.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    if (typeof target.focus === 'function') {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });

  /* ---------- راه‌اندازی ---------- */
  syncChips();
  renderCourses();
  renderTabs();
  renderSchedule();
  renderTasks();
  paintPlans();
})();
