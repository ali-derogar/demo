import { projects } from './projects';

/**
 * ثبت متمرکز هویت و اطلاعات شخصی.
 * برخلاف projects.ts که نمونه‌کارها را نگه می‌دارد، این فایل «خودِ آدم» را توصیف می‌کند:
 * معرفی، مهارت‌ها، تجربه، تحصیلات و راه‌های تماس. پروژه‌های خصوصی گیت‌هاب عمداً فهرست نمی‌شوند.
 */

export interface SkillGroup {
  id: string;
  /** عنوان فارسی گروه */
  title: string;
  /** نام‌های تخصصی؛ لاتین‌ها هنگام رندر با dir="ltr" نشان داده می‌شوند */
  items: string[];
}

export interface ExperienceEntry {
  role: string;
  company: string;
  location: string;
  /** بازه‌ی زمانی از پیش به تقویم جلالی نوشته شده؛ مبدل تاریخ نداریم */
  periodFa: string;
  current?: boolean;
  points: string[];
  stack: string[];
}

export interface EducationEntry {
  degree: string;
  field: string;
  org: string;
  location: string;
}

export interface LanguageEntry {
  name: string;
  level: string;
}

export type ContactKind = 'github' | 'telegram' | 'email' | 'phone';

export interface ContactLink {
  id: ContactKind;
  label: string;
  /** مقدار نمایشی؛ برای تماس‌های حساس مثل تلفن */
  value: string;
  href: string;
  /** توضیح کوتاه فارسی زیر کارت */
  note?: string;
  external: boolean;
}

export const profile = {
  brand: 'persianbotyar',
  name: 'علی دروگر',
  title: 'توسعه‌دهنده‌ی بک‌اند پایتون',
  /** اجزای تگ‌لاین؛ با «·» کنار هم چیده می‌شوند (لاتین، dir=ltr) */
  tagline: ['FastAPI', 'Django', 'Distributed Systems', 'Async Microservices'],
  location: 'تهران، ایران',
  summary: [
    'من علی دروگرم؛ توسعه‌دهنده‌ی بک‌اند پایتون. سرویس‌های مقیاس‌پذیر و RESTful با FastAPI و Django می‌سازم و صف‌های تسک توزیع‌شده با Celery، Redis و RabbitMQ را طراحی و نگهداری می‌کنم.',
    'در کنار کار روی بک‌اند، رابط کاربری هم طراحی و پیاده می‌کنم؛ همان سایت‌هایی که در این گالری می‌بینید. سعی می‌کنم چیزی که کاربر لمس می‌کند به‌اندازه‌ی چیزی که پشت صحنه اجرا می‌شود تمیز و دقیق باشد.',
    'روی دیتابیس‌های رابطه‌ای و NoSQL، مهندسی تست خودکار و اتوماسیون تلگرام کار کرده‌ام و کد را با اصول clean code و الگوهای طراحی می‌نویسم.',
  ],
} as const;

export const skillGroups: SkillGroup[] = [
  { id: 'languages', title: 'زبان‌ها', items: ['Python', 'JavaScript', 'HTML', 'CSS'] },
  {
    id: 'backend',
    title: 'فریمورک و API',
    items: ['FastAPI', 'Django', 'Django REST Framework', 'gRPC', 'Pydantic', 'Uvicorn'],
  },
  {
    id: 'data',
    title: 'دیتابیس و ORM/ODM',
    items: ['PostgreSQL', 'SQLite', 'MongoDB', 'InfluxDB', 'SQLAlchemy', 'Beanie', 'Bunnet'],
  },
  {
    id: 'async',
    title: 'صف تسک و کش',
    items: ['Celery', 'Redis', 'RabbitMQ', 'Distributed Task Queues', 'Flower'],
  },
  {
    id: 'testing',
    title: 'تست و کیفیت',
    items: ['Pytest', 'Unittest', 'Doctest', 'TDD', 'Code Review', 'Clean Code', 'OOP'],
  },
  {
    id: 'automation',
    title: 'اتوماسیون، خزش و ربات',
    items: ['Pyrogram', 'Telegram API', 'Playwright', 'BeautifulSoup', 'Async Bot Dev'],
  },
  {
    id: 'devops',
    title: 'DevOps و ابزار هوش مصنوعی',
    items: ['Docker', 'Git', 'CI Workflows', 'Linux', 'Agile/Scrum', 'Prompt Engineering'],
  },
];

export const experiences: ExperienceEntry[] = [
  {
    role: 'توسعه‌دهنده‌ی نرم‌افزار',
    company: 'شرکت دانش‌گستر سینا',
    location: 'تهران، ایران',
    periodFa: 'تیر ۱۴۰۲ — اکنون',
    current: true,
    points: [
      'مهندسی و مقیاس‌دهی میکروسرویس‌های بک‌اند با FastAPI و پایتون روی MongoDB؛ کاهش تأخیر پاسخ API و مقیاس افقی پایدار.',
      'طراحی خط‌لوله‌های خزش و ورود داده با Playwright؛ پردازش بیش از ۱۰٬۰۰ رکورد در روز با تلاش مجدد خودکار و ضدربات.',
      'راه‌اندازی و یکپارچه‌سازی صف‌های پیام ناهمگام با Celery، Redis و RabbitMQ برای افزایش throughput کارهای پس‌زمینه.',
      'استانداردسازی بازبینی کد و تست خودکار با Pytest، Unittest و Doctest در جریان CI/CD.',
      'منتورینگ توسعه‌دهنده‌های جونیور، معماری OOP و استراتژی شاخه‌های Git در چارچوب Agile/Scrum.',
    ],
    stack: ['FastAPI', 'Python', 'MongoDB', 'Celery', 'Redis', 'RabbitMQ', 'Playwright'],
  },
];

export const education: EducationEntry[] = [
  {
    degree: 'کارشناسی',
    field: 'مهندسی کامپیوتر',
    org: 'دانشگاه یادگار امام (ره)',
    location: 'تهران، ایران',
  },
];

export const languages: LanguageEntry[] = [
  { name: 'فارسی', level: 'زبان مادری' },
  { name: 'انگلیسی', level: 'سطح حرفه‌ای' },
];

export const contactLinks: ContactLink[] = [
  {
    id: 'telegram',
    label: 'تلگرام',
    value: '@armin1129',
    href: 'https://t.me/armin1129',
    note: 'سریع‌ترین راه برای گفت‌وگو و سفارش پروژه.',
    external: true,
  },
  {
    id: 'github',
    label: 'گیت‌هاب',
    value: 'ali-derogar',
    href: 'https://github.com/ali-derogar',
    external: true,
  },
  {
    id: 'email',
    label: 'ایمیل',
    value: 'Aliderogar1129@gmail.com',
    href: 'mailto:Aliderogar1129@gmail.com',
    note: 'برای مکاتبه‌ی رسمی و ارسال جزئیات پروژه.',
    external: false,
  },
  {
    id: 'phone',
    label: 'تماس',
    value: '+۹۸ ۹۲۱ ۱۲۲ ۱۹۰۷',
    href: 'tel:+989211221907',
    note: 'مستقیم و تلفنی، ساعت کاری تهران.',
    external: false,
  },
];

/** نوار متحرک فناوری‌ها بین هیرو و گالری؛ هویت بک‌اند بدون فهرست‌کردن پروژه‌ها */
export const techMarquee: string[] = [
  'FastAPI',
  'Django',
  'Celery',
  'Redis',
  'RabbitMQ',
  'PostgreSQL',
  'MongoDB',
  'InfluxDB',
  'Pyrogram',
  'Playwright',
  'Docker',
  'gRPC',
  'Pytest',
  'Pydantic',
];

export interface HeroStat {
  value: number;
  label: string;
  /** پیشوند نمایشی مثل «+» */
  prefix?: string;
}

/** آمار هیرو از خودِ داده‌ها مشتق می‌شود تا همیشه تازه بماند */
export const heroStats: HeroStat[] = [
  { value: projects.length, label: 'نمونه‌کار' },
  { value: new Set(projects.map((p) => p.category)).size, label: 'حوزه‌ی کاری' },
  { value: 2, prefix: '+', label: 'سال تجربه' },
  { value: skillGroups.length, label: 'گروه مهارت' },
];
