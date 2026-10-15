/* ===== مسیر — منطق دمو ===== */
(() => {
  'use strict';

  const DESTS = [
    {
      id: 'isfahan', name: 'اصفهان، نصف جهان', where: 'اصفهان · ایران', img: 'dest-isfahan',
      region: 'iran', tags: ['iran', 'city'], nights: 2, price: 4800000, rating: 4.8, reviews: 412,
      keys: 'اصفهان نقش جهان بازار چیذول منارجنبان زاینده رود پل',
      blurb: 'دو شب کنار زاینده‌رود، با یک عصر کامل در بازار و یک غروب روی سی‌وسه‌پل.',
      incl: ['بلیت رفت و برگشت', 'هتل ۴ ستاره', 'صبحانه', 'گشت شهری با راهنما'],
      days: [
        ['روز نخست', 'ورود و عصر آزاد', 'بعد از تحویل اتاق، پیاده‌روی دور میدان نقش‌جهان و چای در یک خانه‌ی تاریخی همان کوچه.'],
        ['روز دوم', 'میدان، بازار، منارجنبان', 'گشت صبح با راهنما، نهار در غذای سنتی و بعدازظهر منارجنبان و آتشکده.'],
        ['روز سوم', 'پلها و بازگشت', 'صبح سی‌وسه‌پل و پل خداآفرین، بعدازظهر خرید و حرکت به سمت مبدأ.'],
      ],
    },
    {
      id: 'shiraz', name: 'شیراز و باغ ارم', where: 'فارس · ایران', img: 'dest-shiraz',
      region: 'iran', tags: ['iran', 'city'], nights: 2, price: 5200000, rating: 4.7, reviews: 348,
      keys: 'شیراز نصیرالملک حافظ سعدی باغ ارم قران',
      blurb: 'نور صورتیِ صبح در نصیرالملک، غروب حافظ و دو شب مهمان بودن در شهر.',
      incl: ['بلیت رفت و برگشت', 'هتل بوتیک', 'صبحانه', 'گشت شعر و باغ'],
      days: [
        ['روز نخست', 'صبحِ نصیرالملک', 'ساعت ۸ سر جای نور صورتی؛ بعدازظهر بازار وکیل و چای در تیمچه.'],
        ['روز دوم', 'چراغ‌ها و آرامگاها', 'باغ ارم و قرآن صبح، حافظیه و سعدی بعدازظهر، شام در دل شهر.'],
        ['روز سوم', 'بازگشت', 'صبح آزاد برای خرید مسقط و عطر، سپس حرکت به سمت فرودگاه.'],
      ],
    },
    {
      id: 'persepolis', name: 'تخت جمشید از نزدیک', where: 'فارس · ایران', img: 'dest-persepolis',
      region: 'iran', tags: ['iran', 'city', 'nature'], nights: 3, price: 6100000, rating: 4.9, reviews: 205,
      keys: 'تخت جمشید نقش رستم پاسارگاد شیراز ستون',
      blurb: 'سه روز باستان‌شناسی سبک: تخت جمشید در ساعت کم‌تردد، نقش رستم و پاسارگاد.',
      incl: ['بلیت رفت و برگشت', 'اقامت در تخت جمشید و شیراز', 'ورودی آثار', 'راهنمای متخصص'],
      days: [
        ['روز نخست', 'نزدیک تخت جمشید', 'حرکت از شیراز، عصر گشت آزاد در تخت جمشید وقتی جمعیت رفته است.'],
        ['روز دوم', 'تخت جمشید و نقش رستم', 'گشت صبح با راهنما، نهار در روستا و بعدازظهر نقش رستم و کعبه‌زردشت.'],
        ['روز سوم', 'پاسارگاد', 'صبح آرام در پاسارگاد و بازگشت بعدازظهر به شیراز.'],
        ['روز چهارم', 'بازگشت', 'تحویل اتاق و حرکت به سمت فرودگاه.'],
      ],
    },
    {
      id: 'kish', name: 'قشم، روزهای دریا', where: 'هرمزگان · ایران', img: 'dest-kish',
      region: 'iran', tags: ['iran', 'sea', 'nature'], nights: 3, price: 8900000, rating: 4.6, reviews: 520,
      keys: 'قشم کیش دریا جزیره ساحل مرجان درکه غفاری',
      blurb: 'سه شب روی آب گرم، با یک روز کامل قایق و یک روز جنگل حرا.',
      incl: ['بلیت پرواز', 'هتل ساحلی', 'صبحانه و شام', 'قایق و گشت جزیره'],
      days: [
        ['روز نخست', 'ساحل', 'ورود، اتاق روبه‌روی دریا و عصر در ساحل مرجان.'],
        ['روز دوم', 'جنگل حرا', 'صبح قایق در آبراه حرا، بعدازظهر درکه و بازار.'],
        ['روز سوم', 'آب‌های جنوب', 'اسنورکل و غارکوفت، شب موسیقی روی سکوی ساحل.'],
        ['روز چهارم', 'بازگشت', 'صبح آزاد و پرواز بهپس.'],
      ],
    },
    {
      id: 'hormuz', name: 'هرمز و خاکِ رنگی', where: 'هرمزگان · ایران', img: 'dest-hormuz',
      region: 'iran', tags: ['iran', 'sea', 'nature'], nights: 2, price: 6700000, rating: 4.7, reviews: 318,
      keys: 'هرمز جزیره خاک سرخ دره مجرا هلی تولم کشتی پرتغال',
      blurb: 'دو شب در جزیره‌ی کوچک؛ دره‌ی مجرا، خاک سرخ و غروب پشت کشتی پرتغالی.',
      incl: ['بلیت رفت و برگشت', 'اقامت در بوم‌گردی', 'تمام وعده‌ها', 'ترانسفر و گشت جزیره'],
      days: [
        ['روز نخست', 'ورود با کشتی', 'از بندرعباس به جزیره؛ بعدازظهر دره‌ی مجرا و غروب روی سواحل سرخ.'],
        ['روز دوم', 'دور جزیره', 'صبح هلی‌چکه و نمکدان، عصر بازارک و شام محلی با ماهی.'],
        ['روز سوم', 'آرامش پیش از رفتن', 'صبح آزاد، چای روی بام و بازگشت به بندرعباس.'],
      ],
    },
    {
      id: 'anzali', name: 'انزلی، دریاچه و باران', where: 'گیلان · ایران', img: 'dest-anzali',
      region: 'iran', tags: ['iran', 'nature', 'sea'], nights: 2, price: 7400000, rating: 4.5, reviews: 176,
      keys: 'انزلی دریاچه بندر قایق ماهی بازار فریدونکنه گیلان باران',      blurb: 'دو شب کنار دریاچه، با صبح زود در بازار ماهی و قایق میان نی‌ها.',
      incl: ['بلیت رفت و برگشت', 'هتل کنار دریاچه', 'صبحانه', 'قایق در دریاچه'],
      days: [
        ['روز نخست', 'بندر و بازار ماهی', 'عصر پیاده در بلوار ساحلی و صبح زود در بازار ماهی‌فروشان.'],
        ['روز دوم', 'دریاچه', 'قایق میان نی‌ها، پل روبان و بعدازظهر فریدونکنه.'],
        ['روز سوم', 'بازگشت', 'صبح در ساحل و حرکت به سمت مبدأ.'],
      ],
    },
    {
      id: 'forest', name: 'جاده‌ی الوست و دلِ جنگل', where: 'مازندران · ایران', img: 'dest-forest',
      region: 'iran', tags: ['iran', 'nature'], nights: 2, price: 5600000, rating: 4.6, reviews: 240,
      keys: 'الوست جنگل جاده رودبار مازندران جنگلک',
      blurb: 'یک آخرِ هفته‌ی جنگلی: جاده‌ی الوست، آبشار و شب در کلبه‌ی چوبی.',
      incl: ['مینی‌بوس از تهران', 'کلبه‌ی چوبی', 'شام و صبحانه', 'راهنمای پیاده‌روی'],
      days: [
        ['روز نخست', 'حرکت از تهران', 'صبح از تهران، نهار در رودبار و عصر رسیدن به کلبه.'],
        ['روز دوم', 'آبشار', 'پیاده‌روی تا آبشار و نهار در روستا، عصر برگشت و آتش شبانه.'],
        ['روز سوم', 'برگشت', 'صبح در مه‌جنگل و حرکت به سمت تهران.'],
      ],
    },
    {
      id: 'desert', name: 'مرنجاب، کویر در سکوت', where: 'اصفهان · ایران', img: 'dest-desert',
      region: 'iran', tags: ['iran', 'nature', 'desert'], nights: 1, price: 6200000, rating: 4.7, reviews: 189,
      keys: 'مرنجاب کویر کاروانسار ستاره رمل دشت',
      blurb: 'یک شب کامل زیر آسمان کویر، با کاروانسار و آتش و بی‌صدایی.',
      incl: ['ترانسفر از کاشان', 'اقامت در کاروانسار', 'شام و صبحانه', 'گشت رصد'],
      days: [
        ['روز نخست', 'ورود به رمل', 'عصر از کاشان، غروب روی تپه‌ی شنی و شام دور آتش.'],
        ['روز دوم', 'ستاره‌ها و بازگشت', 'شب‌نگری و طلوع، صبح در کاروانسار و برگشت به کاشان.'],
      ],
    },
    {
      id: 'dizin', name: 'دیزین، اسکی و برف', where: 'البرز · ایران', img: 'dest-dizin',
      region: 'iran', tags: ['iran', 'nature', 'snow'], nights: 2, price: 9800000, rating: 4.4, reviews: 143,
      keys: 'دیزین اسکی برف پیست زمستان البرز شمدان',
      blurb: 'سه روز روی پیست، با آموزش برای مبتدی‌ها و بورد برای حرفه‌ای‌ها.',
      incl: ['ترانسفر از تهران', 'اقامت در شمدان', 'لیفت سه روز', 'اجاره‌ی تجهیزات'],
      days: [
        ['روز نخست', 'آشنایی با پیست', 'ظهر رسیدن، تحویل تجهیزات و یک دور آرام پایین پیست.'],
        ['روز دوم', 'روز کامل اسکی', 'صبح با مربی، بعدازظهر گشت آزاد و عصر سونا.'],
        ['روز سوم', 'برفِ صبح', 'چند ساعت دیگر روی پیست و برگشت عصر به تهران.'],
      ],
    },
    {
      id: 'mashhad', name: 'مشهد، حرم و طبرق', where: 'خراسان · ایران', img: 'dest-mashhad',
      region: 'iran', tags: ['iran', 'city', 'pilgrim'], nights: 3, price: 7200000, rating: 4.8, reviews: 810,
      keys: 'مشهد حرم رضا طبرق نیشابور زیارت',
      blurb: 'چهار روز با صبح‌های حرم و یک نیم‌روز در نیشابور.',
      incl: ['بلیت قطار', 'هتل نزدیک حرم', 'صبحانه', 'گشت طبرق و نیشابور'],
      days: [
        ['روز نخست', 'حرم در شب', 'رسیدن، تحویل اتاق و زیارت ساعت بیست.'],
        ['روز دوم', 'طبرق', 'صبح آرام در حرم، بعدازظهر موزه و کتابخانه‌ی آستان.'],
        ['روز سوم', 'نیشابور', 'نیم‌روز بیرون از شهر؛ خیام و عطار و بازگشت عصر.'],
        ['روز چهارم', 'بازگشت', 'صبح آزاد، بازارچه و قطار برگشت.'],
      ],
    },
    {
      id: 'istanbul', name: 'استانبول، دو قاره', where: 'ترکیه · خارجی', img: 'dest-istanbul',
      region: 'abroad', tags: ['abroad', 'city'], nights: 4, price: 18500000, rating: 4.7, reviews: 635,
      keys: 'استانبول ترکیه سلطان احمد ایاصوفیه بسفر بازار بزرگ',
      blurb: 'پنج شب در سلطان‌مت و یک کروز باریک بسفر، با ویزا و ترانسفر همراه.',
      incl: ['پرواز رفت و برگشت', 'هتل ۴ ستاره', 'صبحانه', 'ویزا و ترانسفر'],
      days: [
        ['روز نخست', 'فرود و سلطان‌مت', 'ترانسفر، تحویل اتاق و عصر در میدان سلطان‌احمد.'],
        ['روز دوم', 'شهر کهنه', 'ایاصوفیه، کاخ توپقاپی و بازار بزرگ با راهنمای فارسی.'],
        ['روز سوم', 'بسفر', 'کروز یک‌روزه‌ی بسفر و بعدازظهر در تقسیم و استقلال.'],
        ['روز چهارم', 'روز آزاد', 'خرید یا صبح در بالات؛ عصر گشت خوراک با راهنما.'],
        ['روز پنجم', 'بازگشت', 'ترانسفر به فرودگاه و پرواز بهپس.'],
      ],
    },
    {
      id: 'tbilisi', name: 'تفلیس، شهر قدیم', where: 'گرجستان · خارجی', img: 'dest-tbilisi',
      region: 'abroad', tags: ['abroad', 'city', 'nature'], nights: 4, price: 14200000, rating: 4.5, reviews: 297,
      keys: 'تفلیس گرجستان شهر قدیم کوه متاتسمینده شراب',
      blurb: 'پنج شب در شهر بالکان‌مانند، با یک روز کازبیگی و یک شب سوپرا.',
      incl: ['پرواز رفت و برگشت', 'هتل در شهر قدیم', 'صبحانه', 'گشت کازبیگی'],
      days: [
        ['روز نخست', 'ورود', 'ترانسفر و قدم زدن در کوچه‌های چوبی شهر قدیم.'],
        ['روز دوم', 'تاریخ شهر', 'قلعه‌ی ناریکالا، حمام‌های سولولاکی و پل صلح.'],
        ['روز سوم', 'کازبیگی', 'یک روز کامل جاده‌ی کوهی و کلیسای گرتیسمیندا.'],
        ['روز چهارم', 'شراب و سوپرا', 'صبح در بازار، عصر در منطقه‌ی شراب و شب سوپرا.'],
        ['روز پنجم', 'بازگشت', 'ترانسفر فرودگاهی و پرواز.'],
      ],
    },
    {
      id: 'dubai', name: 'دبی، برج و بیابان', where: 'امارات · خارجی', img: 'dest-dubai',
      region: 'abroad', tags: ['abroad', 'city', 'desert'], nights: 4, price: 24500000, rating: 4.6, reviews: 742,
      keys: 'دبی امارات برج خلیفه دانه مارینا دسر سافاری',
      blurb: 'پنج شب، دو چهره: شب‌های روشنِ برج و بعدازظهرهای قرمز در بیابان.',
      incl: ['پرواز رفت و برگشت', 'هتل مرکزی', 'صبحانه', 'سافاری بیابان', 'ویزا'],
      days: [
        ['روز نخست', 'مارینا', 'فرود، ترانسفر و عصر در پیاده‌راه مارینا.'],
        ['روز دوم', 'شهر بلند', 'برج خلیفه، دبی مال و نمای شب از پل.'],
        ['روز سوم', 'بیابان', 'صبح آزاد و بعدازظهر سافاری با شام کمپ.'],
        ['روز چهارم', 'قدیم و جدید', 'دیره، آبوره و بعدازظهر در لاگونا.'],
        ['روز پنجم', 'بازگشت', 'خرید آخر و پرواز.'],
      ],
    },
    {
      id: 'cappadocia', name: 'کاپادوکیا، صبحِ بالون', where: 'ترکیه · خارجی', img: 'dest-cappadocia',
      region: 'abroad', tags: ['abroad', 'nature'], nights: 5, price: 27800000, rating: 4.9, reviews: 168,
      keys: 'کاپادوکیا بالون صخره گورمه ترکیه غار',
      blurb: 'شش شب در شهر صخره‌ای؛ بالون سر صبح و دو روز گشت دره‌ها.',
      incl: ['پرواز رفت و برگشت', 'هتل غاری', 'صبحانه', 'بالون و گشت دره‌ها', 'ویزا'],
      days: [
        ['روز نخست', 'گورمه', 'فرود و بعدازظهر در بازار و موزه‌ی روباز.'],
        ['روز دوم', 'بالون', 'ساعت ۵ بیدارباش و بالون بر فراز صخره‌ها؛ بعدازظهر استراحت.'],
        ['روز سوم', 'دره‌ها', 'گشت دره‌ی عشق و دره‌ی سرخ با راهنما.'],
        ['روز چهارم', 'شهر زیرزمینی', 'درینکویو و کاروان‌سرا و سفالگری آوانوس.'],
        ['روز پنجم', 'روز آزاد', 'خرید، حمام ترکی یا دور دوم بالون.'],
        ['روز ششم', 'بازگشت', 'ترانسفر و پرواز به ایران.'],
      ],
    },
  ];

  const FAV_KEY = 'masir-favorites-v1';
  const byId = (sel) => document.querySelector(sel);
  const fa = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const toman = (n) => n.toLocaleString('fa-IR', { maximumFractionDigits: 0 });
  const PRICE_TEXT = new Intl.NumberFormat('fa-IR');

  /* --- ظرفیت و وضعیت‌های ساختگی ولی پایدار --- */
  function seed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return Math.abs(h >>> 0);
  }
  const seatsFor = (tourId, dateIso) => 4 + (seed(`${tourId}:${dateIso}`) % 22);
  const rankOf = (d) => DESTS.indexOf(d);
  const makeCode = (salt, prefix) => prefix + fa(String(100000 + (seed(salt) % 900000)));

  /* --- علاقه‌مندی‌ها --- */
  let favs = new Set();
  try {
    const stored = JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]');
    if (Array.isArray(stored)) favs = new Set(stored.filter((x) => typeof x === 'string'));
  } catch { favs = new Set(); }
  const saveFavs = () => { try { localStorage.setItem(FAV_KEY, JSON.stringify([...favs])); } catch { /* خصوصی */ } };

  /* --- اعلان --- */
  const toastBox = byId('#toasts');
  let toastTimer = null;
  function toast(text, warn) {
    if (!toastBox) return;
    toastBox.innerHTML = '';
    const el = document.createElement('p');
    el.className = warn ? 'toast toast--warn' : 'toast';
    el.textContent = text;
    toastBox.append(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.remove(); }, 3600);
  }

  /* --- فهرست مقصدها --- */
  const state = { tag: 'all', text: '', sort: 'suggest' };
  const grid = byId('#dest-grid');
  const empty = byId('#dest-empty');
  const count = byId('#dest-count');

  const matches = (d) => {
    if (state.tag === 'fav') return favs.has(d.id);
    if (state.tag !== 'all' && !d.tags.includes(state.tag)) return false;
    const q = state.text.trim();
    if (!q) return true;
    return `${d.name} ${d.where} ${d.keys} ${d.blurb}`.includes(q);
  };

  const sorted = (list) => {
    const copy = [...list];
    if (state.sort === 'cheap') copy.sort((a, b) => a.price - b.price);
    else if (state.sort === 'rich') copy.sort((a, b) => b.price - a.price);
    else if (state.sort === 'short') copy.sort((a, b) => a.nights - b.nights);
    else if (state.sort === 'liked') copy.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    else copy.sort((a, b) => rankOf(a) - rankOf(b));
    return copy;
  };

  function cardHtml(d) {
    const on = favs.has(d.id);
    const src = './assets/img/' + d.img + '.webp';
    return `
      <article class="dest reveal${on ? ' dest--fav' : ''}" data-id="${d.id}">
        <div class="dest__media">
          <img src="${src}" alt="نمای ${d.name}" width="1100" height="733" loading="lazy" decoding="async">
          <span class="dest__badge">${d.region === 'iran' ? 'داخلی' : 'خارجی'}</span>
          <button class="dest__fav" type="button" aria-pressed="${on}" data-act="fav"
            aria-label="${on ? 'حذف' : 'افزودن'} ${d.name} به علاقه‌مندی‌ها">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 20.2c-5.5-3.5-7.8-6.4-7.8-9.5A4 4 0 0 1 12 8.1a4 4 0 0 1 7.8 2.6c0 3.1-2.3 6-7.8 9.5z"/>
            </svg>
          </button>
          <span class="dest__price">${toman(d.price)} <small>تومان/نفر</small></span>
        </div>
        <div class="dest__body">
          <div class="dest__top">
            <h3 class="dest__title">${d.name}</h3>
            <span class="dest__where">${d.where}</span>
          </div>
          <p class="dest__blurb">${d.blurb}</p>
          <div class="dest__meta">
            <span>${fa(d.nights + 1)} روزه · ${fa(d.nights)} شب</span>
            <span class="stars" aria-label="امتیاز ${fa(d.rating)} از ۵">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z"/></svg>
              <b>${fa(d.rating)}</b>
            </span>
            <span>${fa(d.reviews)} نظر</span>
          </div>
          <div class="dest__actions">
            <button class="btn btn--ink" type="button" data-act="open">دیدن برنامه</button>
            <button class="btn btn--soft" type="button" data-act="price">قیمت من</button>
          </div>
        </div>
      </article>`;
  }

  function render() {
    const list = sorted(DESTS.filter(matches));
    grid.innerHTML = list.map(cardHtml).join('');
    empty.hidden = list.length > 0;
    count.textContent = list.length
      ? `${fa(list.length)} مقصد · ${state.tag === 'all' ? 'همه' : byId(`.chip[data-tag="${state.tag}"]`)?.textContent ?? ''}`
      : 'مقصدی نمایش داده نمی‌شود';
    observeReveals();
  }

  /* --- ابزار پالایش --- */
  byId('#dest-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.tag = chip.dataset.tag;
    [...e.currentTarget.children].forEach((c) => c.classList.toggle('is-on', c === chip));
    render();
  });

  const destQ = byId('#dest-q');
  const destClear = byId('#dest-clear');
  destQ.addEventListener('input', () => {
    state.text = destQ.value;
    destClear.hidden = !destQ.value;
    render();
  });
  destClear.addEventListener('click', () => {
    destQ.value = '';
    state.text = '';
    destClear.hidden = true;
    render();
    destQ.focus();
  });
  byId('#dest-sort').addEventListener('change', (e) => { state.sort = e.target.value; render(); });
  byId('#dest-reset').addEventListener('click', () => {
    state.tag = 'all'; state.text = ''; state.sort = 'suggest';
    destQ.value = ''; destClear.hidden = true; byId('#dest-sort').value = 'suggest';
    [...byId('#dest-chips').children].forEach((c) => c.classList.toggle('is-on', c.dataset.tag === 'all'));
    render();
  });

  /* --- جست‌وجوی بخش آغازین --- */
  byId('#finder').addEventListener('submit', (e) => {
    e.preventDefault();
    const region = byId('#region').value;
    state.tag = region;
    state.text = byId('#q').value;
    destQ.value = state.text;
    destClear.hidden = !state.text;
    [...byId('#dest-chips').children].forEach((c) => c.classList.toggle('is-on', c.dataset.tag === region));
    render();
    byId('#destinations').scrollIntoView({ behavior: smooth, block: 'start' });
    const found = DESTS.filter(matches).length;
    toast(found ? `${fa(found)} تور با این شرایط پیدا شد` : 'توری با این شرایط نیست؛ فیلترها را تغییر دهید', !found);
  });

  /* --- کلیک روی کارت‌ها --- */
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const card = btn.closest('.dest');
    const d = DESTS.find((x) => x.id === card?.dataset.id);
    if (!d) return;
    if (btn.dataset.act === 'fav') {
      if (favs.has(d.id)) favs.delete(d.id); else favs.add(d.id);
      saveFavs();
      render();
      toast(favs.has(d.id) ? `${d.name} به علاقه‌مندی‌ها اضافه شد` : `${d.name} از علاقه‌مندی‌ها حذف شد`);
    } else if (btn.dataset.act === 'open') {
      openTour(d);
    } else if (btn.dataset.act === 'price') {
      pickTour(d.id);
      byId('#pricing').scrollIntoView({ behavior: smooth, block: 'start' });
    }
  });

  /* --- پنجره‌ی تور --- */
  const dialog = byId('#tour-dialog');
  const body = byId('#dialog-body');

  function openTour(d) {
    byId('#dialog-title').textContent = d.name;
    const src = './assets/img/' + d.img + '.webp';
    body.innerHTML = `
      <div class="sb-hero">
        <img src="${src}" alt="نمای ${d.name}" width="1100" height="733" loading="lazy">
      </div>
      <p class="sb-meta">
        <span><b>${fa(d.nights + 1)}</b> روز و <b>${fa(d.nights)}</b> شب</span>
        <span>از <b>${toman(d.price)}</b> تومان برای هر نفر</span>
        <span class="stars"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z"/></svg><b>${fa(d.rating)}</b> <span>(${fa(d.reviews)} نظر)</span></span>
      </p>
      <p class="sb-blurb">${d.blurb}</p>
      <p class="sb-sub">برنامه‌ی سفر</p>
      <div class="day-list">
        ${d.days.map(([title, head, text], i) => `
          <details class="day-item"${i === 0 ? ' open' : ''}>
            <summary><span class="day-no">${fa(i + 1)}</span><span>${title} · ${head}</span>
              <svg class="day-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6.5 9.5 5.5 5.5 5.5-5.5"/></svg>
            </summary>
            <p>${text}</p>
          </details>`).join('')}
      </div>
      <p class="sb-sub">در برگه‌ی تور چیست</p>
      <ul class="incl">${d.incl.map((x) => `<li>${x}</li>`).join('')}</ul>
      <div class="sb-actions">
        <button class="btn btn--primary" type="button" id="sb-price">محاسبه‌ی قیمت این تور</button>
        <button class="btn btn--soft" type="button" id="sb-fav">${favs.has(d.id) ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}</button>
      </div>`;
    if (!dialog.open) dialog.showModal();
    byId('#sb-price').addEventListener('click', () => {
      dialog.close();
      pickTour(d.id);
      byId('#pricing').scrollIntoView({ behavior: smooth, block: 'start' });
    });
    byId('#sb-fav').addEventListener('click', () => {
      if (favs.has(d.id)) favs.delete(d.id); else favs.add(d.id);
      saveFavs();
      render();
      byId('#sb-fav').textContent = favs.has(d.id) ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی';
    });
    body.scrollTop = 0;
    byId('#dialog-close').focus({ preventScroll: true });
  }

  byId('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); dialog.close(); });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  /* --- محاسبه‌ی قیمت --- */
  const tour = byId('#tour');
  const depart = byId('#depart');
  const adults = byId('#adults');
  const children = byId('#children');
  const breakdown = byId('#breakdown');
  const totalEl = byId('#total');
  const route = byId('#stub-route');
  const capacity = byId('#capacity-note');
  const form = byId('#book-form');

  tour.innerHTML = DESTS.map((d) =>
    `<option value="${d.id}">${d.name} — ${fa(d.nights + 1)} روز</option>`).join('');

  const iso = (d) => d.toISOString().slice(0, 10);
  const jalali = new Intl.DateTimeFormat('fa-IR', { calendar: 'persian', day: 'numeric', month: 'long' });
  const jalaliDay = new Intl.DateTimeFormat('fa-IR', { calendar: 'persian', weekday: 'long' });
  const departures = [6, 11, 18, 25, 33].map((offset) => {
    const d = new Date();
    d.setHours(11, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return { value: iso(d), label: `${jalaliDay.format(d)} ${jalali.format(d)}` };
  });
  depart.innerHTML = departures.map((o) => `<option value="${o.value}">${o.label}</option>`).join('');

  const picked = () => DESTS.find((d) => d.id === tour.value) ?? DESTS[0];
  const num = (el) => { const n = parseInt(String(el.value).replace(/[۰-۹]/g, (x) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(x)), 10); return Number.isFinite(n) ? n : 0; };
  const setNum = (el, v, min, max) => { el.value = fa(Math.min(max, Math.max(min, v))); };

  const line = (label, value, muted) =>
    `<li${muted ? ' class="muted"' : ''}><span>${label}</span><b>${value}</b></li>`;
  let lastTotal = 0;

  function recompute() {
    const d = picked();
    const a = num(adults);
    const c = num(children);
    const head = a + c;
    const date = depart.value;
    const seats = seatsFor(d.id, date);
    const base = d.price * a;
    const kid = Math.round(d.price * 0.75) * c;
    const transfer = byId('#add-transfer').checked ? 450000 : 0;
    const single = byId('#add-single').checked ? Math.round(d.price * a * 0.19) : 0;
    const g = byId('#add-tour').checked ? Math.round(d.price * 0.06) * head : 0;
    const total = base + kid + transfer + single + g;

    route.textContent = `${d.where.split(' · ')[0]} — ${fa(d.nights + 1)} روز`;
    const rows = [
      line(`بزرگسال × ${fa(a)}`, toman(base)),
      c ? line(`کودک × ${fa(c)}`, toman(kid)) : null,
      transfer ? line('ترانسفر خصوصی', toman(transfer)) : null,
      single ? line('اتاق یک‌نفره', toman(single)) : null,
      g ? line('گشت روزانه', toman(g)) : null,
      byId('#add-transfer').checked ? null : line('ترانسفر فرودگاهی', 'در قیمت تور', true),
      line('بیمه‌ی سفر', 'شامل', true),
    ].filter(Boolean);
    breakdown.innerHTML = rows.join('');
    lastTotal = total;
    totalEl.textContent = PRICE_TEXT.format(total);

    const left = seats - head;
    capacity.classList.toggle('is-tight', left < 0 || left <= 2);
    if (left < 0) {
      capacity.textContent = `در این تاریخ فقط ${fa(seats)} جای خالی است؛ ${fa(-left)} نفر کم شود یا تاریخ دیگر.`;
    } else if (left <= 2) {
      capacity.textContent = `${fa(d.nights + 1)} روز با ${fa(seats)} صندلی خالی — نزدیک به پر شدن.`;
    } else {
      capacity.textContent = `${fa(d.nights + 1)} روز با ${fa(seats)} صندلی خالی در این تاریخ.`;
    }
    byId('#quote-submit').disabled = left < 0;
  }

  function pickTour(id) {
    tour.value = id;
    recompute();
  }

  [tour, depart].forEach((el) => el.addEventListener('change', recompute));
  ['#add-transfer', '#add-single', '#add-tour'].forEach((sel) => byId(sel).addEventListener('change', recompute));

  const steps = [['#minus-adults', adults, 1, 6, -1], ['#plus-adults', adults, 1, 6, 1],
    ['#minus-children', children, 0, 4, -1], ['#plus-children', children, 0, 4, 1]];
  for (const [sel, el, min, max, delta] of steps) {
    byId(sel).addEventListener('click', () => { setNum(el, num(el) + delta, min, max); recompute(); });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = picked();
    const head = num(adults) + num(children);
    const result = byId('#quote-result');
    const code = makeCode(`${d.id}${depart.value}${head}${Date.now()}`, 'MSR-');
    byId('#quote-code').textContent = code;
    result.hidden = false;
    result.querySelector('.confirm__text').textContent =
      `${d.name}، ${fa(head)} نفر، ${jalali.format(new Date(depart.value))} — جمعِ ${PRICE_TEXT.format(lastTotal)} تومان.`;
    result.scrollIntoView({ behavior: smooth, block: 'center' });
    toast('درخواست ثبت شد؛ تا یک ساعت آینده تماس می‌گیریم');
  });
  byId('#quote-close').addEventListener('click', () => { byId('#quote-result').hidden = true; });

  /* --- فرم تماس --- */
  const cForm = byId('#contact-form');
  const digits = (v) => String(v).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[^\d]/g, '');
  const showErr = (input, errBox, msg) => {
    errBox.textContent = msg ?? '';
    errBox.hidden = !msg;
    input.style.borderColor = msg ? 'var(--danger)' : '';
    return !msg;
  };
  cForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameEl = byId('#c-name'), phoneEl = byId('#c-phone');
    const live = byId('#contact-live');
    const okName = showErr(nameEl, byId('#c-name-err'), nameEl.value.trim().length >= 3 ? '' : 'نام کامل خود را بنویسید.');
    const d = digits(phoneEl.value);
    const okPhone = showErr(phoneEl, byId('#c-phone-err'), /^09\d{9}$/.test(d) ? '' : 'شماره‌ی موبایل ۱۱ رقمی و با ۰۹ شروع شود.');
    if (!(okName && okPhone)) {
      live.className = 'form-note is-bad';
      live.textContent = 'درخواست فرستاده نشد؛ دو مورد را درست کنید.';
      (!okName ? nameEl : phoneEl).focus();
      return;
    }
    const code = makeCode(phoneEl.value + nameEl.value, 'MSR-C');
    live.className = 'form-note is-ok';
    live.innerHTML = `درخواست شما ثبت شد. کد پیگیری: <bdi dir="ltr">${code}</bdi>`;
    toast('برای شما تماس گرفته می‌شود');
    cForm.reset();
  });

  /* --- فهرست موبایل --- */
  const toggle = byId('#menu-toggle');
  const drawer = byId('#nav-drawer');
  const backdrop = document.createElement('button');
  backdrop.type = 'button';
  backdrop.className = 'mobile-menu-backdrop';
  backdrop.setAttribute('aria-label', 'بستن فهرست');
  const closeNav = () => {
    drawer.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    backdrop.remove();
  };
  toggle.addEventListener('click', () => {
    const open = drawer.hidden;
    drawer.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) toggle.after(backdrop); else backdrop.remove();
  });
  backdrop.addEventListener('click', closeNav);
  drawer.addEventListener('click', (e) => { if (e.target.closest('a')) closeNav(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });

  /* --- ظهور تدریجی --- */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smooth = reduce ? 'auto' : 'smooth';
  let io = null;
  function observeReveals() {
    const items = [...document.querySelectorAll('.reveal:not(.is-in)')];
    if (reduce || !('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('is-in')); return; }
    io ??= new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    }, { rootMargin: '80px 0px', threshold: 0.05 });
    items.forEach((el) => io.observe(el));
  }

  /* --- شروع --- */
  const scrollTargets = [...document.querySelectorAll('a[href^="#"]')];
  for (const a of scrollTargets) {
    a.addEventListener('click', (e) => {
      const target = document.getElementById(a.getAttribute('href').slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: smooth, block: 'start' });
      if (target.id === 'top') window.scrollTo({ top: 0, behavior: smooth });
    });
  }

  const staticReveals = document.querySelectorAll('.section-head, .service, .voice, .promise__item, .pass, .faq__item');
  staticReveals.forEach((el) => el.classList.add('reveal'));
  render();
  setNum(adults, 2, 1, 6);
  setNum(children, 0, 0, 4);
  recompute();
  observeReveals();
})();
