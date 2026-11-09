export type DemoCategory = 'fashion' | 'sports' | 'cars' | 'store' | (string & {});

export interface ProjectVisual {
  surface: string;
  foreground: string;
  muted: string;
  image: string;
  layout: 'editorial' | 'athletic' | 'automotive' | 'retail' | 'cafe' | 'travel' | 'craft' | 'festival' | 'finance' | 'boutique' | 'aesthetic';
}

export interface DemoProject {
  /** شناسه‌ی یکتا؛ همان نام پوشه‌ی داخل public/demos */
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: DemoCategory;
  categoryLabel: string;
  /** تصویر محلی پیش‌نمایش داخل public/images/previews */
  preview: string;
  previewAlt: string;
  /** نشانی وب‌سایت دمو؛ باید با / پایانی تمام شود */
  url: string;
  technologies: string[];
  /** واژه‌های کلیدی برای جست‌وجوی فارسی */
  keywords: string[];
  highlights: string[];
  accent: string;
  visual: ProjectVisual;
}

/**
 * ثبت متمرکز پروژه‌ها.
 * برای افزودن دموی تازه: پوشه‌ی public/demos/<id> را بسازید، تصویر پیش‌نمایش را
 * در public/images/previews بگذارید و یک عضو به این فهرست بیفزایید.
 * کامپوننت‌های گالری خودکار با همین فهرست به‌روز می‌شوند.
 */
export const projects: DemoProject[] = [
  {
    id: 'roban',
    title: 'روبان؛ دنیای کوچک قشنگی‌ها',
    tagline: 'فروشگاه اکسسوری دخترانه با ویترین سه‌بعدی',
    description: 'فروشگاهی فانتزی برای اکسسوری مو، زیورآلات و لوازم کوچک روزمره؛ با ویترین سه‌بعدی تعاملی، جست‌وجوی فارسی، علاقه‌مندی و مسیر کامل خرید نمایشی.',
    category: 'store', categoryLabel: 'فروشگاه اینترنتی',
    preview: '/images/previews/roban.webp',
    previewAlt: 'ویترین صورتی و یاسی روبان با کیف، مروارید و آینه روی سکوهای رنگی',
    url: '/demos/roban/',
    technologies: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'Three.js'],
    keywords: ['دخترانه', 'فروشگاه', 'اکسسوری', 'کیف', 'آینه', 'مروارید', 'زیورآلات', 'گیره مو', 'سبد خرید', 'سه‌بعدی', 'فانتزی', 'صورتی', 'روبان'],
    highlights: ['ویترین سه‌بعدی تعاملی', 'جست‌وجو و علاقه‌مندی', 'ذخیرهٔ سبد خرید', 'سفارش نمایشی'],
    accent: '#dc86aa',
    visual: { surface: '#fff8f4', foreground: '#522a46', muted: '#826776', image: '/demos/roban/assets/img/hero-01.webp', layout: 'boutique' },
  },
  {
    id: 'nabz',
    visual: { surface: '#06050b', foreground: '#ece9f5', muted: '#a49fbd', image: '/demos/nabz/assets/img/hero-01.webp', layout: 'festival' },
    title: 'نبض؛ فستیوال موسیقی و هنر دیجیتال',
    tagline: 'دیدن برنامه‌ی شب‌ها و گرفتن بلیت',
    description:
      'سایت یک جشنوارهٔ موسیقی برای معرفی هنرمندان، دیدن برنامهٔ اجراها و انتخاب بلیت. با انتخاب هر شب، برنامهٔ همان شب نمایش داده می\u200cشود.',
    category: 'event',
    categoryLabel: 'رویداد و موسیقی',
    preview: '/images/previews/nabz.webp',
    previewAlt: 'طرح گرافیکی رابط «نبض» با رنگ‌ها، تصاویر و محتوای همان سایت',
    url: '/demos/nabz/',
    technologies: ['HTML', 'CSS', 'JavaScript'],
    keywords: [
      'موسیقی',
      'فستیوال',
      'جشنواره',
      'بلیت',
      'رویداد',
      'صحنه',
      'نورپردازی',
      'تصویرنگاری',
      'دی‌جی',
      'شعر',
      'بازارچه',
      'dark',
      'neon',
      'visualizer',
    ],
    highlights: ['تصویر متحرک موسیقی', 'فیلتر برنامه‌ی هنرمندان به تفکیک شب', 'خط زمانِ شب‌به‌شب', 'فروش بلیت با جمعِ خودکار'],
    accent: '#ff2e88',
  },
  {
    id: 'sekke',
    visual: { surface: '#0a0806', foreground: '#f2ece0', muted: '#a89b83', image: '/demos/sekke/assets/img/gold-bars.webp', layout: 'finance' },
    title: 'سکه؛ سایت صرافی',
    tagline: 'تابلوی نرخ طلا، سکه و ارز',
    description:
      'تابلوی نرخ طلا، سکه و ارز با نمودار قیمت و ماشین\u200cحساب تبدیل. نرخ\u200cهای این نمونه شبیه\u200cسازی شده\u200cاند تا بتوانید کار با تابلو و نمودار را امتحان کنید.',
    category: 'finance',
    categoryLabel: 'مالی و صرافی',
    preview: '/images/previews/sekke.webp',
    previewAlt: 'طرح گرافیکی رابط «سکه» با رنگ‌ها، تصاویر و محتوای همان سایت',
    url: '/demos/sekke/',
    technologies: ['HTML', 'CSS', 'JavaScript'],
    keywords: [
      'طلا',
      'سکه',
      'صرافی',
      'ارز',
      'دلار',
      'نرخ',
      'بورس',
      'نمودار',
      'شمش',
      'مثقال',
      'تومان',
      'gold',
      'ticker',
    ],
    highlights: [
      'به‌روزرسانی نرخ‌های نمونه',
      'نمودارِ کندل‌استیک با پنج بازه‌ی زمانی',
      'ماشین‌حساب تبدیل و بررسی نمونهٔ مشخصات سکه',
      'ساعتِ کاریِ شعب با وقتِ تهران',
    ],
    accent: '#f2c14e',
  },
  {
    id: 'aura',
    title: 'اُرا؛ کلینیک پوست و زیبایی',
    tagline: 'زیبایی تو، از نزدیک',
    description: 'سایت مفهومی کلینیک زیبایی با پرترهٔ سینمایی، فرم فلزی سه‌بعدی واکنش‌گرا به اسکرول، نمایش تصویری خدمات و مجسمهٔ قابل چرخش با دو نمای فرم و خطوط؛ همراه با رزرو مرحله‌ای مشاوره.',
    category: 'beauty', categoryLabel: 'کلینیک زیبایی',
    preview: '/images/previews/aura.webp',
    previewAlt: 'رابط مشکی و زرشکی اُرا با پرترهٔ سینمایی، حلقهٔ کروم سه‌بعدی و تیتر زیبایی تو، از نزدیک',
    url: '/demos/aura/',
    technologies: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'Three.js'],
    keywords: ['کلینیک', 'زیبایی', 'پوست', 'بوتاکس', 'ژل', 'فیلر', 'لب', 'لیزر', 'جوان‌سازی', 'مشاوره', 'رزرو', 'سه‌بعدی', 'اُرا', 'aura'],
    highlights: ['فرم کروم سه‌بعدی و حرکت با اسکرول', 'مجسمه با دو نمای فرم و خطوط', 'نمایش تصویری خدمات', 'رزرو مرحله‌ای با تقویم شمسی'],
    accent: '#c796aa',
    visual: { surface: '#171316', foreground: '#f1e4de', muted: '#b993a5', image: '/demos/aura/assets/img/campaign.webp', layout: 'aesthetic' },
  },
  {
    id: 'sports',
    visual: { surface: '#0b0d0b', foreground: '#f2f4ec', muted: '#a7ada0', image: '/demos/sports/assets/img/hero-01.webp', layout: 'athletic' },
    title: 'پیکان؛ سایت باشگاه ورزشی',
    tagline: 'برنامه‌ی کلاس‌ها و ثبت‌نام باشگاه',
    description:
      'سایت یک باشگاه ورزشی با معرفی رشته\u200cها، مربی\u200cها و برنامهٔ کلاس\u200cها. می\u200cتوانید برنامهٔ تمرین را انتخاب کنید و فرم ثبت\u200cنام را امتحان کنید.',
    category: 'sports',
    categoryLabel: 'ورزش و تناسب اندام',
    preview: '/images/previews/sports.webp',
    previewAlt: 'طرح گرافیکی رابط «پیکان» با رنگ‌ها، تصاویر و محتوای همان سایت',
    url: '/demos/sports/',
    technologies: ['HTML', 'CSS', 'JavaScript'],
    keywords: [
      'ورزش',
      'باشگاه',
      'تمرین',
      'تناسب اندام',
      'بدنسازی',
      'دویدن',
      'فوتبال',
      'قهرمان',
      'ثبت‌نام',
      'کلاس',
      'برنامه‌ی هفتگی',
      'dark',
      'energetic',
    ],
    highlights: ['برنامه‌های تمرینی', 'رشته‌های ورزشی', 'برنامه‌ی هفتگی', 'ثبت‌نام کلاس'],
    accent: '#c8ff3d',
  },
  {
    id: 'cars',
    visual: { surface: '#0b0e13', foreground: '#eef2f8', muted: '#98a4b6', image: '/demos/cars/assets/img/hero.webp', layout: 'automotive' },
    title: 'ماشین‌نما؛ نمایشگاه خودرو',
    tagline: 'دیدن مشخصات و مقایسه‌ی خودروها',
    description:
      'فهرست خودروها با عکس، قیمت و مشخصات فنی. می\u200cتوانید دو یا سه مدل را کنار هم مقایسه کنید و فرم درخواست مشاوره را ببینید.',
    category: 'cars',
    categoryLabel: 'خودرو',
    preview: '/images/previews/cars.webp',
    previewAlt: 'طرح گرافیکی رابط «ماشین‌نما» با رنگ‌ها، تصاویر و محتوای همان سایت',
    url: '/demos/cars/',
    technologies: ['HTML', 'CSS', 'JavaScript'],
    keywords: [
      'خودرو',
      'ماشین',
      'نمایشگاه',
      'اسپرت',
      'شاسی‌بلند',
      'سدان',
      'برقی',
      'مشخصات فنی',
      'مقایسه',
      'مشاوره',
      'قیمت',
      'dark',
    ],
    highlights: ['انتخاب نوع بدنه', 'مشخصات خودرو', 'مقایسه‌ی خودروها', 'درخواست مشاوره'],
    accent: '#7fb2ff',
  },
  {
    id: 'store',
    visual: { surface: '#f7f3ec', foreground: '#2c2723', muted: '#756a60', image: '/demos/store/assets/img/hero-01.webp', layout: 'retail' },
    title: 'لوازم؛ فروشگاه اینترنتی',
    tagline: 'پیدا کردن محصول و اضافه کردن به سبد خرید',
    description:
      'فروشگاه لوازم خانه و میز کار با جست\u200cوجو و دسته\u200cبندی محصولات. سبد خرید در مرورگر ذخیره می\u200cشود و با بستن صفحه از بین نمی\u200cرود.',
    category: 'store',
    categoryLabel: 'فروشگاه اینترنتی',
    preview: '/images/previews/store.webp',
    previewAlt: 'طرح گرافیکی رابط «لوازم» با رنگ‌ها، تصاویر و محتوای همان سایت',
    url: '/demos/store/',
    technologies: ['HTML', 'CSS', 'JavaScript'],
    keywords: [
      'فروشگاه',
      'خرید',
      'سبد خرید',
      'محصول',
      'گجت',
      'لوازم',
      'قیمت',
      'تومان',
      'چراغ',
      'هدفون',
      'مرتب‌سازی',
      'light',
      'warm',
    ],
    highlights: ['ذخیره‌ی سبد خرید', 'جست‌وجوی محصول', 'مرتب‌سازی قیمت', 'جزئیات محصول'],
    accent: '#ff8a5c',
  },
  {
    id: 'cafe',
    visual: { surface: '#171009', foreground: '#f0e6d6', muted: '#a2937e', image: '/demos/cafe/assets/img/hero-01.webp', layout: 'cafe' },
    title: 'بخار؛ کافه و صبحانه',
    tagline: 'منوی کافه، ساعت کاری و رزرو میز',
    description:
      'منوی کافه با دسته\u200cبندی غذاها و نوشیدنی\u200cها. در بخش رزرو، روز و تعداد نفرات را انتخاب می\u200cکنید و ساعت\u200cهای خالی را می\u200cبینید.',
    category: 'cafe',
    categoryLabel: 'کافه و رستوران',
    preview: '/images/previews/cafe.webp',
    previewAlt: 'طرح گرافیکی رابط «بخار» با رنگ‌ها، تصاویر و محتوای همان سایت',
    url: '/demos/cafe/',
    technologies: ['HTML', 'CSS', 'JavaScript'],
    keywords: [
      'کافه',
      'قهوه',
      'صبحانه',
      'رزرو میز',
      'منو',
      'اسپرسو',
      'لاته',
      'چای',
      'دسر',
      'شام',
      'میز',
      'dark',
      'cozy',
    ],
    highlights: ['رزرو میز', 'دسته‌بندی منو', 'ساعت کاری و آدرس', 'معرفی قهوه‌ها'],
    accent: '#93b07a',
  },
  {
    id: 'travel',
    visual: { surface: '#f6f3ec', foreground: '#12303a', muted: '#57707c', image: '/demos/travel/assets/img/hero-01.webp', layout: 'travel' },
    title: 'مسیر؛ آژانس مسافرتی',
    tagline: 'پیدا کردن تور و حساب کردن قیمت سفر',
    description:
      'فهرست تورهای داخلی و خارجی همراه با برنامهٔ روزانهٔ سفر. با انتخاب مقصد، تاریخ حرکت و تعداد مسافر، هزینهٔ سفر محاسبه می\u200cشود.',
    category: 'travel',
    categoryLabel: 'سفر و گردشگری',
    preview: '/images/previews/travel.webp',
    previewAlt: 'طرح گرافیکی رابط «مسیر» با رنگ‌ها، تصاویر و محتوای همان سایت',
    url: '/demos/travel/',
    technologies: ['HTML', 'CSS', 'JavaScript'],
    keywords: [
      'سفر',
      'گردشگری',
      'تور',
      'آژانس',
      'مقصد',
      'هتل',
      'پرواز',
      'ویزا',
      'بیمه',
      'کویر',
      'جزیره',
      'light',
      'boarding-pass',
    ],
    highlights: ['فهرست مقصدها با فیلتر', 'برنامه‌ی روزبه‌روز تور', 'محاسبه‌ی قیمت سفر', 'ظرفیت تاریخ حرکت'],
    accent: '#2ec4b6',
  },
  {
    id: 'maktab',
    visual: { surface: '#f7f0e2', foreground: '#2a2419', muted: '#6d6049', image: '/demos/maktab/assets/img/hero-01.webp', layout: 'craft' },
    title: 'مکتب‌خانه؛ آموزشگاه هنرهای سنتی',
    tagline: 'پیدا کردن دوره و دنبال کردن مشق‌ها',
    description:
      'سایت یک آموزشگاه هنرهای سنتی با دوره\u200cها و برنامهٔ هفتگی کلاس\u200cها. در بخش «اتاق من» می\u200cتوانید تمرین\u200cهای انجام\u200cشده را علامت بزنید و پیشرفتتان را نگه دارید.',
    category: 'education',
    categoryLabel: 'آموزش',
    preview: '/images/previews/maktab.webp',
    previewAlt: 'طرح گرافیکی رابط «مکتب‌خانه» با رنگ‌ها، تصاویر و محتوای همان سایت',
    url: '/demos/maktab/',
    technologies: ['HTML', 'CSS', 'JavaScript'],
    keywords: [
      'آموزش',
      'خوشنویسی',
      'نگارگری',
      'موسیقی',
      'ادبیات',
      'شاهنامه',
      'نجوم',
      'حساب',
      'دوره',
      'مشق',
      'اشتراک',
      'paper',
      'nastaliq',
    ],
    highlights: ['فهرست دوره‌ها با رشته و سطح', 'برنامه‌ی هفتگی کلاس‌ها', 'پیشرفت مشق‌ها در اتاق من', 'اشتراک ماهانه و سالانه'],
    accent: '#a98cf0',
  },
  {
    id: 'fashion',
    visual: { surface: '#f4f1ea', foreground: '#211d18', muted: '#6e6759', image: '/demos/fashion/assets/img/hero-01.webp', layout: 'editorial' },
    title: 'آینه؛ سایت مد و پوشاک',
    tagline: 'مجموعه‌های لباس، عکس‌ها و معرفی مدل‌ها',
    description:
      'سایتی برای معرفی یک برند پوشاک و مجموعه\u200cهای فصلی آن. گالری عکس، معرفی مدل\u200cها و پیشنهادهایی برای ست کردن لباس در این نمونه آمده است.',
    category: 'fashion',
    categoryLabel: 'مد و پوشاک',
    preview: '/images/previews/fashion.webp',
    previewAlt: 'طرح گرافیکی رابط «آینه» با رنگ‌ها، تصاویر و محتوای همان سایت',
    url: '/demos/fashion/',
    technologies: ['HTML', 'CSS', 'JavaScript'],
    keywords: [
      'مد',
      'پوشاک',
      'استایل',
      'فشن',
      'لباس',
      'مجموعه',
      'مدل',
      'اکسسوری',
      'خبرنامه',
      'نگاه‌بان',
      'گالری',
      'light',
      'editorial',
    ],
    highlights: ['مجموعه‌های فصلی', 'گالری عکس', 'معرفی مدل‌ها', 'راهنمای استایل'],
    accent: '#b0803c',
  },
];

/** دسته‌بندی‌ها از خودِ ثبت پروژه‌ها ساخته می‌شوند؛ نیازی به ویرایش دستی نیست. */
export const categories: { value: DemoCategory; label: string }[] = [
  { value: 'all', label: 'همه‌ی نمونه‌ها' },
  ...projects
    .filter((p, i, arr) => arr.findIndex((q) => q.category === p.category) === i)
    .map((p) => ({ value: p.category, label: p.categoryLabel })),
];
