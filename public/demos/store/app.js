/* ===== لوازم — فروشگاه نمونه‌ی نمایشی ===== */
(function () {
  'use strict';

  /* ---------- داده‌ها ---------- */
  var CATEGORIES = {
    digital: 'دیجیتال',
    home: 'خانه و آشپزخانه',
    decor: 'نور و دکور',
    acc: 'اکسسوری'
  };

  var PRODUCTS = [
    { id: 'hp01', cat: 'digital', name: 'هدفون سیم‌دار الگا', desc: 'هدفون دورگوش با صدای گرم و کابل بافته', price: 1290000, oldPrice: 1540000, rating: 4.5, popularity: 88, added: 6, img: 'headphones-01', alt: 'هدفون مشکی دورگوش با سری L روی تنه‌ی درخت',
      long: 'هدفون دورگوشی با پد‌های نرم و بدنه‌ی فلزی؛ برای گوش دادن روزمره به موسیقی و پادکست. صدای گرم با بیس ملایم و فیش ۳٫۵ میلی‌متری.',
      specs: ['جنس بدنه: آلیاژ فلزی و پلاستیک فشرده', 'اتصال: فیش ۳٫۵ میلی‌متری', 'گارانتی نمونه: ۶ ماه', 'ابعاد بسته: ۱۹×۱۷×۷ سانتی‌متر'] },
    { id: 'sp01', cat: 'digital', name: 'اسپیکر بلوتوثی جمع‌وجور', desc: 'اسپیکر استوانه‌ای قابل‌حمل با بافت پارچه‌ای', price: 2450000, oldPrice: null, rating: 4.8, popularity: 130, added: 14, img: 'speaker-01', alt: 'اسپیکر بلوتوثی استوانه‌ای کرم‌رنگ با بافت پارچه‌ای روی میز چوبی',
      long: 'اسپیکر بی‌سیم کوچک که راحت توی کوله جا می‌شود. بدنه‌ی پارچه‌ای مقاوم، باتری روزپاسخ و اتصال بلوتوثی سریع به گوشی و لپ‌تاپ.',
      specs: ['اتصال: بلوتوث ۵٫۰', 'باتری: تا ۸ ساعت پخش', 'گارانتی نمونه: ۹ ماه', 'وزن: ۵۴۰ گرم'] },
    { id: 'kb01', cat: 'digital', name: 'کیبورد مکانیکی حرفه‌ای', desc: 'کیبورد مکانیکی با کلیدهای گرد و نور پس‌زمینه', price: 1850000, oldPrice: 2100000, rating: 4.6, popularity: 96, added: 10, img: 'keyboard-01', alt: 'کیبورد مکانیکی با کلیدهای سفید گرد و نور رنگی روی میز روشن',
      long: 'کیبورد مکانیکی با سوییچ‌های کلیک‌دار و نور پس‌زمینه‌ی رنگی. برای تایپ طولانی و بازی مناسب است و کلیدهایش به‌راحتی تمیز می‌شوند.',
      specs: ['نوع سوییچ: مکانیکی کلیک‌دار', 'اتصال: USB با کابل بافته', 'گارانتی نمونه: ۱۲ ماه', 'چیدمان: ۸۷ کلید'] },
    { id: 'ms01', cat: 'digital', name: 'موس بی‌سیم ارگونومیک', desc: 'موس گرد و خوش‌دست با اسکرول نرم', price: 690000, oldPrice: null, rating: 4.2, popularity: 61, added: 3, img: 'mouse-01', alt: 'موس کامپیوتر نارنجی‌رنگ گرد روی سطح سفید',
      long: 'موس بی‌سیم با فرم دایره‌ای که مچ را اذیت نمی‌کند. اسکرول بی‌صدا و گیرنده‌ی USB کوچک داخل بدنه.',
      specs: ['اتصال: بی‌سیم ۲٫۴ گیگاهرتز', 'دقت: ۱۶۰۰ DPI', 'گارانتی نمونه: ۶ ماه', 'باتری: یک قلمی AA'] },
    { id: 'mg01', cat: 'home', name: 'ماگ سرامیکی طرح قلب', desc: 'ماگ لعاب‌دار دست‌ساز با نقش قلب', price: 345000, oldPrice: 420000, rating: 4.7, popularity: 120, added: 8, img: 'mug-01', alt: 'ماگ‌های سرامیکی نارنجی و عسلی با نقش قلب مشکی',
      long: 'ماگ سفالی لعاب‌دار با نقش دست‌ِ‌گلی قلب؛ چون دست‌ساز است هیچ دو ماگ دقیقاً شبیه هم نیستند. مناسب چای و قهوه‌ی صبح.',
      specs: ['جنس: سرامیک لعاب‌دار', 'ظرفیت: ۳۰۰ میلی‌لیتر', 'شست‌و‌شو: ماشین ظرفشویی مجاز', 'گارانتی نمونه: سلامت فیزیکی ۷ روز'] },
    { id: 'fp01', cat: 'home', name: 'فرنچ‌پرس استیل صیقلی', desc: 'قهوه‌ساز فشاری تمام‌استیل نشکن', price: 890000, oldPrice: null, rating: 4.4, popularity: 74, added: 11, img: 'press-01', alt: 'فرنچ‌پرس استیل براق با دسته و فیلتر کشیده',
      long: 'قهوه‌ساز فشاری با بدنه‌ی استیل که مثل مدل‌های شیشه‌ای نمی‌شکند. فیلتر توری ریز، ته‌نشین کم و شست‌وشوی آسان.',
      specs: ['جنس: استیل ضدزنگ', 'ظرفیت: ۳۵۰ میلی‌لیتر', 'گارانتی نمونه: ۱۲ ماه', 'ابعاد: ۱۸×۸ سانتی‌متر'] },
    { id: 'tp01', cat: 'home', name: 'قوری چینی گل‌برجسته', desc: 'قوری سفید با نقش برجسته‌ی کلاسیک', price: 1150000, oldPrice: null, rating: 4.9, popularity: 55, added: 13, img: 'teapot-01', alt: 'قوری چینی سفید با نقش‌های برجسته‌ی گل و پرنده روی در',
      long: 'قوری چینی سفید با بدنه‌ی گل‌برجسته؛ برای مهمانی‌های خانگی و میز عصرانه. درِ سنگین که موقع ریختن نمی‌افتد.',
      specs: ['جنس: چینی', 'ظرفیت: ۹۰۰ میلی‌لیتر', 'مناسب: اجاق و مایکروفر نیست', 'گارانتی نمونه: سلامت فیزیکی ۷ روز'] },
    { id: 'cb01', cat: 'home', name: 'تخته سرو و برش چوبی', desc: 'تخته یکپارچه با رگه‌های طبیعی چوب', price: 520000, oldPrice: 610000, rating: 4.3, popularity: 67, added: 5, img: 'board-01', alt: 'تخته چوبی روشن مستطیلی روی میز چوب تیره',
      long: 'تخته‌ی چندکاره برای برش سبزیجات و سرو پنیر و آجیل. چوب روشن با رگه‌های طبیعی و گوشه‌های گرد ایمن.',
      specs: ['جنس: چوب راش', 'ابعاد: ۳۸×۲۸×۲ سانتی‌متر', 'نگهداری: شست‌وشوی دستی', 'گارانتی نمونه: ۳ ماه'] },
    { id: 'lm01', cat: 'decor', name: 'چراغ مطالعه رومیزی', desc: 'چراغ سفید با نور گرم و بازوی خمیده', price: 1480000, oldPrice: 1720000, rating: 4.6, popularity: 92, added: 12, img: 'lamp-01', alt: 'چراغ مطالعه سفید روشن با بازوی خمیده روی پیشخوان',
      long: 'چراغ رومیزی با طراحی مینیمال و نور گرم متمرکز؛ برای میز کار و مطالعه‌ی شب. کلید لمسی روی پایه.',
      specs: ['نور: LED گرم، ۷ وات', 'جنس: فلنچ رنگ‌شده', 'سیم: ۱٫۵ متر با کلید', 'گارانتی نمونه: ۱۸ ماه'] },
    { id: 'vs01', cat: 'decor', name: 'گلدان سفالی دست‌ساز', desc: 'گلدان لعابی فیروزه‌ای با دو دسته', price: 780000, oldPrice: null, rating: 4.5, popularity: 70, added: 7, img: 'vase-01', alt: 'گلدان سفالی فیروزه‌ای با نقش برجسته و دو دسته حلقوی',
      long: 'گلدان سفالی لعابی با نقش برجسته و دو دسته؛ حتی بدون گل هم روی میز حرف دارد. کف صاف و باثبات.',
      specs: ['جنس: سفال لعاب‌دار', 'ارتفاع: ۲۶ سانتی‌متر', 'دهانه: ضدآب با لعاب داخلی', 'گارانتی نمونه: سلامت فیزیکی ۷ روز'] },
    { id: 'cd01', cat: 'decor', name: 'شمع معطر ژله‌ای', desc: 'شمع ژله‌ای شفاف با رایحه‌ی ملایم', price: 265000, oldPrice: null, rating: 4.8, popularity: 105, added: 9, img: 'candle-01', alt: 'شمع معطر ژله‌ای صورتی روشن داخل ظرف شیشه‌ای',
      long: 'شمع ژله‌ای شفاف با رایحه‌ی ملایم و نور زیبا؛ ساعت سوخت بالا و دود کم. مناسب دکور ویترین و میز شام.',
      specs: ['وزن: ۲۲۰ گرم', 'سوخت: حدود ۳۵ ساعت', 'رایحه: وانیل', 'گارانتی نمونه: سلامت فیزیکی ۷ روز'] },
    { id: 'wt01', cat: 'acc', name: 'ساعت مچی کلاسیک', desc: 'قاب طلایی با صفحه‌ی مینیمال و بند چرم', price: 3200000, oldPrice: null, rating: 4.7, popularity: 112, added: 15, img: 'watch-01', alt: 'ساعت مچی کلاسیک قاب طلایی با صفحه سفید و بند چرم مشکی در کف دست',
      long: 'ساعت مچی با قاب طلایی باریک و صفحه‌ی ساده؛ بند چرم دست‌دوز. برای میز کار و مهمانی هر دو جواب می‌دهد.',
      specs: ['جنس قاب: آلیاژ آبکاری طلایی', 'بند: چرم طبیعی', 'مقاومت: پاشش آب', 'گارانتی نمونه: ۱۲ ماه'] },
    { id: 'bp01', cat: 'acc', name: 'کوله‌پشتی جین دکور', desc: 'کوله پارچه‌ی جین با بند کتان و بند چرم', price: 1350000, oldPrice: 1590000, rating: 4.4, popularity: 84, added: 4, img: 'backpack-01', alt: 'کوله‌پشتی آبی جین با بندهای قهوه‌ای روی زمینه روشن',
      long: 'کوله‌ی پارچه‌ای از جنس جین با بند دوشی کتان و دسته‌ی چرمی. دهانه‌ی بندکشی و جای لپ‌تاپ ۱۳ اینچی.',
      specs: ['جنس: پارچه جین', 'ظرفیت: ۱۸ لیتر', 'جای لپ‌تاپ: تا ۱۳ اینچ', 'گارانتی نمونه: ۶ ماه'] },
    { id: 'sg01', cat: 'acc', name: 'عینک آفتابی خلبانی', desc: 'فریم فلزی باریک با عدسی دودی', price: 950000, oldPrice: null, rating: 4.6, popularity: 99, added: 2, img: 'sunglasses-01', alt: 'عینک آفتابی خلبانی فریم نقره‌ای با عدسی دودی کنار جعبه‌ی نارنجی',
      long: 'عینک آفتابی مدل خلبانی با فریم فلزی سبک و عدسی دودی ضد UV۴۰۰. همراه با جعبه و دستمال تمیز.',
      specs: ['عدسی: پلی‌کربنات UV400', 'فریم: آلیاژ سبک', 'همراه: جعبه و دستمال', 'گارانتی نمونه: ۶ ماه'] }
  ];

  /* ---------- ابزار اعداد فارسی ---------- */
  var FA_DIGITS = [];
  for (var fd = 0; fd < 10; fd++) FA_DIGITS.push(String.fromCharCode(0x06F0 + fd));
  function toFa(str) {
    return String(str).replace(/\d/g, function (d) { return FA_DIGITS[+d]; });
  }
  function toLatinDigits(str) {
    return String(str)
      .replace(/[\u06F0-\u06F9]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); })
      .replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); });
  }
  function money(n) {
    return toFa(String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '٬'));
  }
  function faRating(r) {
    return toFa(r.toFixed(1)).replace('.', '٫');
  }
  function stars(r) {
    var full = Math.round(r);
    return '★'.repeat(full) + '☆'.repeat(5 - full) + ' ' + faRating(r);
  }

  /* نرمال‌سازی متن فارسی برای جست‌وجو: ي→ی، ك→ک، حذف نیم‌فاصله و فاصله‌ها */
  function normalize(s) {
    return toLatinDigits(String(s))
      .replace(/\u200c/g, '')
      .replace(/[يى]/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/[‌‍]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /* ---------- وضعیت ---------- */
  var CART_KEY = 'lavazem-cart-v1';
  var state = { query: '', cat: 'all', sort: 'newest' };
  var cart = loadCart();

  function loadCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var obj = raw ? JSON.parse(raw) : {};
      var clean = {};
      PRODUCTS.forEach(function (p) {
        var q = parseInt(obj[p.id], 10);
        if (q > 0) clean[p.id] = Math.min(q, 99);
      });
      return clean;
    } catch (e) { return {}; }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* خصوصی: بی‌صدا */ }
  }
  function cartCount() {
    return Object.keys(cart).reduce(function (s, k) { return s + cart[k]; }, 0);
  }
  function cartTotal() {
    return Object.keys(cart).reduce(function (s, k) {
      var p = productById(k);
      return p ? s + p.price * cart[k] : s;
    }, 0);
  }
  function productById(id) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
    return null;
  }

  /* ---------- عناصر DOM ---------- */
  function $(sel) { return document.querySelector(sel); }
  var grid = $('#product-grid');
  var emptyState = $('#empty-state');
  var resultCount = $('#result-count');
  var searchInput = $('#search-input');
  var headerSearch = $('#header-search-input');
  var sortSelect = $('#sort-select');
  var cartCountEl = $('#cart-count');
  var cartOpenBtn = $('#cart-open');
  var drawer = $('#cart-drawer');
  var backdrop = $('#drawer-backdrop');
  var drawerBody = $('#drawer-body');
  var drawerFoot = $('#drawer-foot');
  var modalBackdrop = $('#modal-backdrop');
  var qvBody = $('#qv-body');
  var toastRegion = $('#toast-region');

  /* ---------- فیلتر و مرتب‌سازی ---------- */
  function filterProducts(list, query, cat) {
    var q = normalize(query);
    return list.filter(function (p) {
      if (cat !== 'all' && p.cat !== cat) return false;
      if (!q) return true;
      var hay = normalize(p.name + ' ' + p.desc + ' ' + CATEGORIES[p.cat]);
      return hay.indexOf(q) !== -1;
    });
  }
  function sortProducts(list, mode) {
    var arr = list.slice();
    if (mode === 'cheap') arr.sort(function (a, b) { return a.price - b.price; });
    else if (mode === 'expensive') arr.sort(function (a, b) { return b.price - a.price; });
    else if (mode === 'popular') arr.sort(function (a, b) { return b.popularity - a.popularity; });
    else arr.sort(function (a, b) { return b.added - a.added; });
    return arr;
  }

  /* ---------- رندر محصولات ---------- */
  function cardHTML(p) {
    var discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    return '' +
      '<article class="card" data-id="' + p.id + '">' +
        '<button type="button" class="card-media" data-open="' + p.id + '" aria-label="نمایش سریع ' + p.name + '">' +
          '<img src="./assets/img/' + p.img + '.webp" alt="' + p.alt + '" loading="lazy" width="900" height="900">' +
          (discount ? '<span class="badge">٪' + toFa(discount) + ' تخفیف</span>' : '') +
        '</button>' +
        '<div class="card-body">' +
          '<button type="button" class="card-name" data-open="' + p.id + '">' + p.name + '</button>' +
          '<p class="card-desc">' + p.desc + '</p>' +
          '<p class="rating" aria-label="امتیاز ' + faRating(p.rating) + ' از ۵">' + stars(p.rating) + '</p>' +
          '<div class="price-row">' +
            '<span class="price">' + money(p.price) + ' <small>تومان</small></span>' +
            (p.oldPrice ? '<span class="old-price">' + money(p.oldPrice) + '</span><span class="save-chip">تخفیف</span>' : '') +
          '</div>' +
          '<button type="button" class="add-btn" data-add="' + p.id + '">افزودن به سبد</button>' +
        '</div>' +
      '</article>';
  }

  function renderGrid() {
    var list = sortProducts(filterProducts(PRODUCTS, state.query, state.cat), state.sort);
    grid.innerHTML = list.map(cardHTML).join('');
    emptyState.hidden = list.length !== 0;
    resultCount.textContent = 'نمایش ' + toFa(list.length) + ' کالا' +
      (state.cat !== 'all' ? ' از دسته «' + CATEGORIES[state.cat] + '»' : '') +
      (state.query ? ' برای «' + state.query + '»' : '');
  }

  function renderChips() {
    document.querySelectorAll('.chip').forEach(function (c) {
      var on = c.dataset.cat === state.cat;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function renderCatCounts() {
    document.querySelectorAll('.cat-tile').forEach(function (t) {
      var n = PRODUCTS.filter(function (p) { return p.cat === t.dataset.cat; }).length;
      t.querySelector('.cat-count').textContent = toFa(n) + ' کالا';
    });
  }

  /* ---------- سبد خرید ---------- */
  function updateBadge() {
    cartCountEl.textContent = toFa(cartCount());
  }

  function addToCart(id, qty) {
    var p = productById(id);
    if (!p) return;
    cart[id] = Math.min((cart[id] || 0) + (qty || 1), 99);
    saveCart(); updateBadge();
    toast('«' + p.name + '» به سبد اضافه شد');
    if (!drawer.hidden) renderCartView();
  }
  function setQty(id, qty) {
    if (qty < 1) qty = 1;
    cart[id] = Math.min(qty, 99);
    saveCart(); updateBadge();
    renderCartView();
  }
  function removeFromCart(id) {
    var p = productById(id);
    delete cart[id];
    saveCart(); updateBadge();
    toast(p ? '«' + p.name + '» از سبد حذف شد' : 'حذف شد');
    renderCartView();
  }

  function lineHTML(id) {
    var p = productById(id);
    if (!p) return '';
    return '' +
      '<div class="cart-line" data-line="' + id + '">' +
        '<img src="./assets/img/' + p.img + '.webp" alt="' + p.alt + '" width="64" height="64">' +
        '<div>' +
          '<p class="cl-name">' + p.name + '</p>' +
          '<p class="cl-price">' + money(p.price) + ' تومان هر عدد — جمع: ' + money(p.price * cart[id]) + ' تومان</p>' +
          '<div class="cl-actions">' +
            '<span class="stepper" aria-label="تعداد ' + p.name + '">' +
              '<button type="button" data-dec="' + id + '" aria-label="کم کردن تعداد ' + p.name + '">−</button>' +
              '<span class="qty">' + toFa(cart[id]) + '</span>' +
              '<button type="button" data-inc="' + id + '" aria-label="زیاد کردن تعداد ' + p.name + '">+</button>' +
            '</span>' +
            '<button type="button" class="remove-btn" data-remove="' + id + '">حذف</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  var checkoutMode = false;

  function renderCartView() {
    var ids = Object.keys(cart);
    if (checkoutMode) { renderCheckoutView(); return; }
    if (!ids.length) {
      drawerBody.innerHTML =
        '<div class="cart-empty"><p class="cart-empty-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.6 3.5h2.9l2.4 11.2h9.9l2.2-8.1H6.4"/><circle cx="9.6" cy="19.3" r="1.6"/><circle cx="17.2" cy="19.3" r="1.6"/></svg></p>' +
        '<p>سبد خرید شما خالی است</p>' +
        '<button type="button" class="btn btn-primary" id="start-shopping">شروع خرید</button></div>';
      drawerFoot.innerHTML = '';
      var s = $('#start-shopping');
      if (s) s.addEventListener('click', function () { closeDrawer(); document.getElementById('products').scrollIntoView(); });
      return;
    }
    drawerBody.innerHTML = ids.map(lineHTML).join('') +
      '<div class="demo-note" role="note">این سبد فقط نمایشی است؛ هیچ خرید یا پرداخت واقعی انجام نمی‌شود.</div>';
    drawerFoot.innerHTML =
      '<div class="sum-row"><span>جمع کل</span><span class="sum-total">' + money(cartTotal()) + ' تومان</span></div>' +
      '<button type="button" class="btn btn-primary btn-block" id="go-checkout">تسویه حساب</button>';
    $('#go-checkout').addEventListener('click', function () {
      checkoutMode = true; renderCartView();
      var first = $('#co-name'); if (first) first.focus();
    });
  }

  function renderCheckoutView() {
    var ids = Object.keys(cart);
    var lines = ids.map(function (id) {
      var p = productById(id);
      return '<div class="line"><span>' + p.name + ' × ' + toFa(cart[id]) + '</span><span>' + money(p.price * cart[id]) + ' تومان</span></div>';
    }).join('');
    drawerBody.innerHTML =
      '<button type="button" class="btn btn-ghost" id="back-to-cart" style="margin-bottom:1rem">→ بازگشت به سبد</button>' +
      '<div class="demo-note" role="note">این نمونه‌ی نمایشی است؛ پرداختی انجام نمی‌شود و اطلاعاتی جایی فرستاده نمی‌شود.</div>' +
      '<form id="checkout-form" novalidate>' +
        '<div class="field"><label for="co-name">نام و نام خانوادگی</label>' +
          '<input id="co-name" name="name" autocomplete="name" aria-describedby="err-name">' +
          '<p class="err" id="err-name"></p></div>' +
        '<div class="field"><label for="co-city">شهر</label>' +
          '<input id="co-city" name="city" autocomplete="address-level2" aria-describedby="err-city">' +
          '<p class="err" id="err-city"></p></div>' +
        '<div class="field"><label for="co-postal">کد پستی (۱۰ رقم)</label>' +
          '<input id="co-postal" name="postal" inputmode="numeric" autocomplete="postal-code" placeholder="مثلاً ۱۴۵۹۸۷۶۵۴۳" aria-describedby="err-postal">' +
          '<p class="err" id="err-postal"></p></div>' +
        '<div class="co-summary"><strong>خلاصه‌ی سفارش</strong>' + lines +
          '<div class="line" style="margin-top:.5rem;font-weight:900"><span>جمع کل</span><span>' + money(cartTotal()) + ' تومان</span></div></div>' +
        '<button type="submit" class="btn btn-primary btn-block">ثبت سفارش</button>' +
      '</form>';
    $('#back-to-cart').addEventListener('click', function () { checkoutMode = false; renderCartView(); });
    $('#checkout-form').addEventListener('submit', submitCheckout);
  }

  function setFieldError(inputId, msg) {
    var input = document.getElementById(inputId);
    var err = document.getElementById('err-' + inputId.replace('co-', ''));
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      err.textContent = msg; err.classList.add('show');
    } else {
      input.removeAttribute('aria-invalid');
      err.textContent = ''; err.classList.remove('show');
    }
    return !msg;
  }

  function validateCheckout(data) {
    var ok = true;
    var name = data.name.trim();
    ok = setFieldError('co-name', name.length < 4 ? 'نام را کامل وارد کنید (حداقل ۴ حرف).' : '') && ok;
    ok = setFieldError('co-city', data.city.trim().length < 2 ? 'نام شهر را وارد کنید.' : '') && ok;
    var postal = toLatinDigits(data.postal).replace(/[\s-]/g, '');
    ok = setFieldError('co-postal', /^\d{10}$/.test(postal) ? '' : 'کد پستی باید ۱۰ رقم باشد.') && ok;
    return ok;
  }

  function submitCheckout(ev) {
    ev.preventDefault();
    var data = {
      name: $('#co-name').value,
      city: $('#co-city').value,
      postal: $('#co-postal').value
    };
    if (!validateCheckout(data)) {
      var bad = drawer.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }
    var name = data.name.trim().split(/\s+/)[0];
    checkoutMode = false;
    cart = {};
    saveCart(); updateBadge();
    drawerBody.innerHTML =
      '<div class="success-view"><p class="big" aria-hidden="true"><svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12.4 2.7 2.6L16.2 9"/></svg></p>' +
      '<h3>' + escapeHtml(name) + ' عزیز، سفارش شما ثبت شد</h3>' +
      '<p>سبد خرید پاک شد و آماده‌ی خرید بعدی هستید.</p>' +
      '<div class="demo-note" role="note" style="text-align:start">این نمونه‌ی نمایشی است؛ هیچ خرید یا پرداختی انجام نشد.</div>' +
      '<button type="button" class="btn btn-primary" id="success-close">بازگشت به فروشگاه</button></div>';
    drawerFoot.innerHTML = '';
    toast('سفارش نمونه ثبت شد؛ پرداختی انجام نشد');
    $('#success-close').addEventListener('click', closeDrawer);
    $('#success-close').focus();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- سبد: باز و بسته + تله‌ی فوکوس ---------- */
  function trapKeydown(e, container, onEscape) {
    if (e.key === 'Escape') { e.preventDefault(); onEscape(); return; }
    if (e.key !== 'Tab') return;
    var focusables = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    var list = Array.prototype.filter.call(focusables, function (el) { return !el.disabled && el.offsetParent !== null; });
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  var drawerKeyHandler = null;
  function openDrawer() {
    backdrop.hidden = false; drawer.hidden = false;
    document.body.style.overflow = 'hidden';
    cartOpenBtn.setAttribute('aria-expanded', 'true');
    renderCartView();
    drawerKeyHandler = function (e) { trapKeydown(e, drawer, closeDrawer); };
    document.addEventListener('keydown', drawerKeyHandler);
    $('#cart-close').focus();
  }
  function closeDrawer() {
    drawer.hidden = true; backdrop.hidden = true;
    document.body.style.overflow = '';
    cartOpenBtn.setAttribute('aria-expanded', 'false');
    if (drawerKeyHandler) document.removeEventListener('keydown', drawerKeyHandler);
    cartOpenBtn.focus();
  }

  /* ---------- مشاهده‌ی سریع ---------- */
  var qvQty = 1, qvId = null, qvKeyHandler = null, qvTrigger = null;
  function openQuickView(id, trigger) {
    var p = productById(id);
    if (!p) return;
    qvId = id; qvQty = 1; qvTrigger = trigger || document.activeElement;
    qvBody.innerHTML =
      '<div class="qv-media"><img src="./assets/img/' + p.img + '.webp" alt="' + p.alt + '" width="900" height="900"></div>' +
      '<div class="qv-info">' +
        '<p class="rating">' + stars(p.rating) + '</p>' +
        '<h3 id="qv-title">' + p.name + '</h3>' +
        '<p class="qv-desc">' + p.long + '</p>' +
        '<ul class="qv-specs">' + p.specs.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>' +
        '<div class="qv-buy">' +
          '<span class="qv-price">' + money(p.price) + ' <small style="font-size:.8rem;font-weight:600">تومان</small></span>' +
          (p.oldPrice ? '<span class="old-price">' + money(p.oldPrice) + '</span>' : '') +
          '<span class="stepper" aria-label="تعداد">' +
            '<button type="button" id="qv-dec" aria-label="کم کردن تعداد">−</button>' +
            '<span class="qty" id="qv-qty">۱</span>' +
            '<button type="button" id="qv-inc" aria-label="زیاد کردن تعداد">+</button>' +
          '</span>' +
          '<button type="button" class="btn btn-primary" id="qv-add">افزودن به سبد</button>' +
        '</div>' +
      '</div>';
    modalBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#qv-dec').addEventListener('click', function () { if (qvQty > 1) qvQty--; $('#qv-qty').textContent = toFa(qvQty); });
    $('#qv-inc').addEventListener('click', function () { if (qvQty < 99) qvQty++; $('#qv-qty').textContent = toFa(qvQty); });
    $('#qv-add').addEventListener('click', function () { addToCart(qvId, qvQty); closeQuickView(); });
    qvKeyHandler = function (e) { trapKeydown(e, document.getElementById('quick-view'), closeQuickView); };
    document.addEventListener('keydown', qvKeyHandler);
    $('#qv-close').focus();
  }
  function closeQuickView() {
    modalBackdrop.hidden = true;
    document.body.style.overflow = '';
    if (qvKeyHandler) document.removeEventListener('keydown', qvKeyHandler);
    if (qvTrigger && qvTrigger.focus) qvTrigger.focus();
  }

  /* ---------- توست ---------- */
  function toast(msg) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    toastRegion.appendChild(el);
    setTimeout(function () {
      el.classList.add('out');
      setTimeout(function () { el.remove(); }, 350);
    }, 2600);
  }

  /* ---------- رویدادها ---------- */
  grid.addEventListener('click', function (e) {
    var add = e.target.closest('[data-add]');
    if (add) { addToCart(add.dataset.add, 1); return; }
    var open = e.target.closest('[data-open]');
    if (open) { openQuickView(open.dataset.open, open); }
  });

  searchInput.addEventListener('input', function () {
    state.query = searchInput.value;
    headerSearch.value = searchInput.value;
    renderGrid();
  });
  headerSearch.addEventListener('input', function () {
    state.query = headerSearch.value;
    searchInput.value = headerSearch.value;
    renderGrid();
    if (headerSearch.value) document.getElementById('products').scrollIntoView({ block: 'start' });
  });
  sortSelect.addEventListener('change', function () { state.sort = sortSelect.value; renderGrid(); });

  document.querySelectorAll('.chip').forEach(function (c) {
    c.addEventListener('click', function () {
      state.cat = c.dataset.cat;
      renderChips(); renderGrid();
    });
  });

  document.querySelectorAll('.cat-tile').forEach(function (t) {
    t.addEventListener('click', function () {
      state.cat = t.dataset.cat;
      renderChips(); renderGrid();
      document.getElementById('products').scrollIntoView();
    });
  });

  document.querySelectorAll('[data-cat-link]').forEach(function (a) {
    a.addEventListener('click', function () {
      state.cat = a.dataset.catLink;
      renderChips(); renderGrid();
    });
  });

  $('#reset-filters').addEventListener('click', function () {
    state.query = ''; state.cat = 'all'; state.sort = 'newest';
    searchInput.value = ''; headerSearch.value = ''; sortSelect.value = 'newest';
    renderChips(); renderGrid();
  });

  cartOpenBtn.addEventListener('click', openDrawer);
  $('#cart-close').addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  drawer.addEventListener('click', function (e) {
    var inc = e.target.closest('[data-inc]');
    if (inc) { setQty(inc.dataset.inc, cart[inc.dataset.inc] + 1); return; }
    var dec = e.target.closest('[data-dec]');
    if (dec) { setQty(dec.dataset.dec, cart[dec.dataset.dec] - 1); return; }
    var rm = e.target.closest('[data-remove]');
    if (rm) removeFromCart(rm.dataset.remove);
  });

  $('#qv-close').addEventListener('click', closeQuickView);
  modalBackdrop.addEventListener('click', function (e) {
    if (e.target === modalBackdrop) closeQuickView();
  });

  /* ---------- شروع ---------- */
  updateBadge();
  renderChips();
  renderCatCounts();
  renderGrid();
})();
