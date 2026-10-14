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
    title: 'آینه؛ خانه‌ی مد و استایل',
    tagline: 'مجموعه‌های فصلی، نگاه‌بان عکس و معرفی مدل‌ها',
    description:
      'برند پوشاکی که لباس را پیش از خرید نشان می‌دهد؛ مجموعه‌های فصلی، گالری عکس، پروفایل مدل‌ها و راهنمای استایل. فضایی روشن و تصویرمحور، با تایپوگرافی درشت و جای کافی برای نفس کشیدن.',
    category: 'fashion',
    categoryLabel: 'مد و پوشاک',
    preview: '/images/previews/fashion.webp',
    previewAlt: 'پیش‌نمایش وب‌سایت مد و پوشاک؛ بخش آغازین با عکس مدل‌ها و مجموعه‌های فصلی',
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
    title: 'پیکان؛ باشگاه ورزشی و تناسب اندام',
    tagline: 'برنامه‌های تمرینی، رشته‌های ورزشی و ثبت‌نام کلاس',
    description:
      'باشگاهی که از صفحه‌ی نخست حس حرکت می‌دهد؛ رشته‌های مختلف، برنامه‌های تمرینی با قیمت شفاف، برنامه‌ی هفتگی و ثبت‌نام آنلاین کلاس. طراحی تیره و پرانرژی، با شمارش دستاوردها و معرفی قهرمانان.',
    category: 'sports',
    categoryLabel: 'ورزش و تناسب اندام',
    preview: '/images/previews/sports.webp',
    previewAlt: 'پیش‌نمایش وب‌سایت باشگاه ورزشی؛ بخش آغازین تیره با عکس ورزشکار و برنامه‌های تمرینی',
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
    tagline: 'مشخصات فنی، مقایسه‌ی خودروها و درخواست مشاوره',
    description:
      'نمایشگاهی که خرید خودرو را ساده می‌کند؛ جست‌وجو در میان خودروها، فیلتر بر اساس کلاس بدنه، مشخصات کامل هر مدل، مقایسه‌ی دو یا سه خودرو کنار هم و درخواست مشاوره. قیمت‌ها به تومان.',
    category: 'cars',
    categoryLabel: 'خودرو',
    preview: '/images/previews/cars.webp',
    previewAlt: 'پیش‌نمایش وب‌سایت نمایشگاه خودرو؛ بخش آغازین با عکس خودروی اسپرت و کارت مشخصات',
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
    highlights: ['فیلتر کلاس خودرو', 'مشخصات کامل', 'مقایسه‌ی خودروها', 'درخواست مشاوره'],
    accent: '#7fb2ff',
  },
  {
    id: 'store',
    title: 'لوازم؛ فروشگاه سبک زندگی',
    tagline: 'خرید آسان؛ جست‌وجو، فیلتر دسته‌بندی و سبد خرید',
    description:
      'فروشگاه آنلاین لوازم روزمره و گجت؛ محصول‌ها با عکس و قیمت واقعی، جست‌وجو و فیلتر دسته‌بندی، مرتب‌سازی بر اساس قیمت و سبد خریدی که حتی با بستن صفحه هم خالی نمی‌شود. ظاهری گرم، ساده و سریع.',
    category: 'store',
    categoryLabel: 'فروشگاه اینترنتی',
    preview: '/images/previews/store.webp',
    previewAlt: 'پیش‌نمایش وب‌سایت فروشگاه اینترنتی؛ فهرست محصولات و سبد خرید کنار صفحه',
    url: '/demos/store/',
    technologies: ['HTML', 'CSS', 'JavaScript', 'localStorage'],
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
    highlights: ['سبد خرید همیشه‌حفظ', 'جست‌وجو و فیلتر', 'مرتب‌سازی قیمت', 'مشاهده‌ی سریع محصول'],
    accent: '#ff8a5c',
  },
  {
    id: 'cafe',
    title: 'بخار؛ کافه و صبحانه',
    tagline: 'منوی فصلی، ساعت کاری و رزرو میز با ظرفیت واقعی',
    description:
      'کافه‌ای که پیش از رفتن، میزت را رزرو می‌کند؛ منوی نوشیدنی و صبحانه با قیمت، فیلتر گیاهی و ویژه، و رزرو میزی که با تعداد نفرات و پرشدن جا کم‌وفراوان می‌شود. فضایی تیره و گرم، بوی قهوه و نور کم.',
    category: 'cafe',
    categoryLabel: 'کافه و رستوران',
    preview: '/images/previews/cafe.webp',
    previewAlt: 'پیش‌نمایش وب‌سایت کافه؛ بخش آغازین با تصویر باریستا در بخار اسپرسو و منوی شب',
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
    highlights: ['رزرو میز با ظرفیت', 'فیلتر منو', 'ساعت و نشانی', 'دانه‌ی هفته'],
    accent: '#93b07a',
  },
];

/** دسته‌بندی‌ها از خودِ ثبت پروژه‌ها ساخته می‌شوند؛ نیازی به ویرایش دستی نیست. */
export const categories: { value: DemoCategory; label: string }[] = [
  { value: 'all', label: 'همه‌ی نمونه‌ها' },
  ...projects
    .filter((p, i, arr) => arr.findIndex((q) => q.category === p.category) === i)
    .map((p) => ({ value: p.category, label: p.categoryLabel })),
];
