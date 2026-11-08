export type DemoCategory = 'fashion' | 'sports' | 'cars' | 'store' | (string & {});

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
}

/**
 * ثبت متمرکز پروژه‌ها.
 * برای افزودن دموی تازه: پوشه‌ی public/demos/<id> را بسازید، تصویر پیش‌نمایش را
 * در public/images/previews بگذارید و یک عضو به این فهرست بیفزایید.
 * کامپوننت‌های گالری خودکار با همین فهرست به‌روز می‌شوند.
 */
export const projects: DemoProject[] = [
  {
    id: 'fashion',
    title: 'آینه؛ سایت مد و پوشاک',
    tagline: 'مجموعه‌های لباس، عکس‌ها و معرفی مدل‌ها',
    description:
      'سایتی برای معرفی یک برند پوشاک و مجموعه\u200cهای فصلی آن. گالری عکس، معرفی مدل\u200cها و پیشنهادهایی برای ست کردن لباس در این نمونه آمده است.',
    category: 'fashion',
    categoryLabel: 'مد و پوشاک',
    preview: '/images/previews/fashion.webp',
    previewAlt: 'صفحه‌ی سایت آینه با عکس مدل و مجموعه‌های لباس',
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
  {
    id: 'sports',
    title: 'پیکان؛ سایت باشگاه ورزشی',
    tagline: 'برنامه‌ی کلاس‌ها و ثبت‌نام باشگاه',
    description:
      'سایت یک باشگاه ورزشی با معرفی رشته\u200cها، مربی\u200cها و برنامهٔ کلاس\u200cها. می\u200cتوانید برنامهٔ تمرین را انتخاب کنید و فرم ثبت\u200cنام را امتحان کنید.',
    category: 'sports',
    categoryLabel: 'ورزش و تناسب اندام',
    preview: '/images/previews/sports.webp',
    previewAlt: 'صفحه‌ی سایت پیکان با عکس ورزشکار و برنامه‌های تمرینی',
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
    title: 'ماشین‌نما؛ نمایشگاه خودرو',
    tagline: 'دیدن مشخصات و مقایسه‌ی خودروها',
    description:
      'فهرست خودروها با عکس، قیمت و مشخصات فنی. می\u200cتوانید دو یا سه مدل را کنار هم مقایسه کنید و فرم درخواست مشاوره را ببینید.',
    category: 'cars',
    categoryLabel: 'خودرو',
    preview: '/images/previews/cars.webp',
    previewAlt: 'صفحه‌ی نمایشگاه ماشین‌نما با عکس خودرو و مشخصاتش',
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
    title: 'لوازم؛ فروشگاه اینترنتی',
    tagline: 'پیدا کردن محصول و اضافه کردن به سبد خرید',
    description:
      'فروشگاه لوازم خانه و میز کار با جست\u200cوجو و دسته\u200cبندی محصولات. سبد خرید در مرورگر ذخیره می\u200cشود و با بستن صفحه از بین نمی\u200cرود.',
    category: 'store',
    categoryLabel: 'فروشگاه اینترنتی',
    preview: '/images/previews/store.webp',
    previewAlt: 'صفحه‌ی فروشگاه لوازم با محصولات و سبد خرید',
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
    title: 'بخار؛ کافه و صبحانه',
    tagline: 'منوی کافه، ساعت کاری و رزرو میز',
    description:
      'منوی کافه با دسته\u200cبندی غذاها و نوشیدنی\u200cها. در بخش رزرو، روز و تعداد نفرات را انتخاب می\u200cکنید و ساعت\u200cهای خالی را می\u200cبینید.',
    category: 'cafe',
    categoryLabel: 'کافه و رستوران',
    preview: '/images/previews/cafe.webp',
    previewAlt: 'صفحه‌ی کافه بخار با عکس باریستا و منوی کافه',
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
    title: 'مسیر؛ آژانس مسافرتی',
    tagline: 'پیدا کردن تور و حساب کردن قیمت سفر',
    description:
      'فهرست تورهای داخلی و خارجی همراه با برنامهٔ روزانهٔ سفر. با انتخاب مقصد، تاریخ حرکت و تعداد مسافر، هزینهٔ سفر محاسبه می\u200cشود.',
    category: 'travel',
    categoryLabel: 'سفر و گردشگری',
    preview: '/images/previews/travel.webp',
    previewAlt: 'صفحه‌ی سایت مسیر با عکس سی‌وسه‌پل و فهرست مقصدها',
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
    title: 'مکتب‌خانه؛ آموزشگاه هنرهای سنتی',
    tagline: 'پیدا کردن دوره و دنبال کردن مشق‌ها',
    description:
      'سایت یک آموزشگاه هنرهای سنتی با دوره\u200cها و برنامهٔ هفتگی کلاس\u200cها. در بخش «اتاق من» می\u200cتوانید تمرین\u200cهای انجام\u200cشده را علامت بزنید و پیشرفتتان را نگه دارید.',
    category: 'education',
    categoryLabel: 'آموزش',
    preview: '/images/previews/maktab.webp',
    previewAlt: 'صفحه‌ی سایت مکتب‌خانه با سرلوحه‌ی نستعلیق و فهرست دوره‌ها',
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
    id: 'nabz',
    title: 'نبض؛ فستیوال موسیقی و هنر دیجیتال',
    tagline: 'دیدن برنامه‌ی شب‌ها و گرفتن بلیت',
    description:
      'سایت یک جشنوارهٔ موسیقی برای معرفی هنرمندان، دیدن برنامهٔ اجراها و انتخاب بلیت. با انتخاب هر شب، برنامهٔ همان شب نمایش داده می\u200cشود.',
    category: 'event',
    categoryLabel: 'رویداد و موسیقی',
    preview: '/images/previews/nabz.webp',
    previewAlt: 'صفحه‌ی سایت نبض با تایپوگرافی درشت و تصویر متحرک موسیقی',
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
    title: 'سکه؛ سایت صرافی',
    tagline: 'تابلوی نرخ طلا، سکه و ارز',
    description:
      'تابلوی نرخ طلا، سکه و ارز با نمودار قیمت و ماشین\u200cحساب تبدیل. نرخ\u200cهای این نمونه شبیه\u200cسازی شده\u200cاند تا بتوانید کار با تابلو و نمودار را امتحان کنید.',
    category: 'finance',
    categoryLabel: 'مالی و صرافی',
    preview: '/images/previews/sekke.webp',
    previewAlt: 'صفحه‌ی سایت سکه با نرخِ درشتِ سکه امامی و تابلوی زنده‌ی طلا و ارز',
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
];

/** دسته‌بندی‌ها از خودِ ثبت پروژه‌ها ساخته می‌شوند؛ نیازی به ویرایش دستی نیست. */
export const categories: { value: DemoCategory; label: string }[] = [
  { value: 'all', label: 'همه‌ی نمونه‌ها' },
  ...projects
    .filter((p, i, arr) => arr.findIndex((q) => q.category === p.category) === i)
    .map((p) => ({ value: p.category, label: p.categoryLabel })),
];
