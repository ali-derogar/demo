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

export interface TimelineNode {
  title: string;
  meta: string;
}

/**
 * گره‌های تایم‌لاین «درباره من»؛ فقط مهارت و تحصیلات، بدون نام کارفرما یا شرح وظایف شرکتی.
 */
export const aboutTimeline: TimelineNode[] = [
  { title: 'کارشناسی مهندسی کامپیوتر', meta: 'دانشگاه یادگار امام (ره) — تهران' },
  { title: 'بک‌اند و یادگیری ماشین', meta: 'FastAPI · Django · Celery · scikit-learn' },
  { title: 'سازنده‌ی اپ موبایل', meta: 'دو اپلیکیشن با BeeWare' },
  { title: 'طراح رابط', meta: `${projects.length} سایت نمونه‌کار در این گالری` },
];

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
  title: 'مهندس نرم‌افزار',
  /** اجزای تگ‌لاین؛ با «·» کنار هم چیده می‌شوند (لاتین، dir=ltr) */
  tagline: ['Python', 'FastAPI · Django', 'Machine Learning', 'BeeWare'],
  location: 'تهران، ایران',
  summary: [
    'من علی دروگرم؛ مهندس نرم‌افزار. تمرکز اصلی‌ام بک‌اند پایتون است: سرویس‌های مقیاس‌پذیر و RESTful با FastAPI و Django و صف‌های تسک توزیع‌شده با Celery، Redis و RabbitMQ.',
    'دو اپلیکیشن موبایل هم با BeeWare ساخته‌ام و در حوزه‌ی هوش مصنوعی و یادگیری ماشین کار کرده‌ام؛ تحلیل داده و مدل‌سازی با NumPy، pandas، Matplotlib، scikit-learn و یادگیری عمیق.',
    'در کنار این‌ها رابط کاربری هم طراحی و پیاده می‌کنم؛ همان سایت‌هایی که در این گالری می‌بینید. سعی می‌کنم چیزی که کاربر لمس می‌کند به‌اندازه‌ی چیزی که پشت صحنه اجرا می‌شود تمیز و دقیق باشد.',
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
    id: 'ml',
    title: 'هوش مصنوعی و یادگیری ماشین',
    items: ['NumPy', 'pandas', 'Matplotlib', 'scikit-learn', 'Deep Learning', 'تحلیل داده'],
  },
  {
    id: 'mobile',
    title: 'اپلیکیشن موبایل',
    items: ['BeeWare', 'Toga', 'Briefcase', 'Python'],
  },
  {
    id: 'devops',
    title: 'DevOps و ابزار',
    items: ['Docker', 'Git', 'CI Workflows', 'Linux', 'Agile/Scrum', 'Prompt Engineering'],
  },
];

export type IconKey =
  | 'cpu'
  | 'layers'
  | 'sparkles'
  | 'phone'
  | 'bot'
  | 'code'
  | 'telegram'
  | 'mail'
  | 'call'
  | 'github';

export type Tone = 'cyan' | 'violet' | 'magenta' | 'amber' | 'gold';

export interface Capability {
  id: string;
  /** شماره‌ی دو رقمی نمایشی (فارسی) */
  n: string;
  title: string;
  text: string;
  tags: string[];
  icon: IconKey;
  tone: Tone;
}

/** شش توانمندی اصلی؛ در بخش اسکرول افقیِ پین‌شده نمایش داده می‌شود */
export const capabilities: Capability[] = [
  { id: 'backend', n: '۰۱', title: 'بک‌اند پایتون', text: 'سرویس‌های مقیاس‌پذیر و RESTful با FastAPI و Django.', tags: ['FastAPI', 'Django', 'gRPC', 'Pydantic'], icon: 'cpu', tone: 'cyan' },
  { id: 'queue', n: '۰۲', title: 'صف و مقیاس', text: 'پردازش ناهمگام کارهای سنگین با صف‌های توزیع‌شده.', tags: ['Celery', 'Redis', 'RabbitMQ'], icon: 'layers', tone: 'violet' },
  { id: 'ai', n: '۰۳', title: 'هوش مصنوعی و ML', text: 'تحلیل داده و مدل‌سازی تا یادگیری عمیق.', tags: ['NumPy', 'pandas', 'scikit-learn', 'Deep Learning'], icon: 'sparkles', tone: 'magenta' },
  { id: 'mobile', n: '۰۴', title: 'اپلیکیشن موبایل', text: 'دو اپ با BeeWare ساخته‌ام؛ پایتون در هر دو پلتفرم.', tags: ['BeeWare', 'Toga', 'Briefcase'], icon: 'phone', tone: 'amber' },
  { id: 'automation', n: '۰۵', title: 'ربات و اتوماسیون', text: 'ربات تلگرام و خط‌لوله‌های خزش داده.', tags: ['Pyrogram', 'Playwright', 'BeautifulSoup'], icon: 'bot', tone: 'gold' },
  { id: 'frontend', n: '۰۶', title: 'رابط کاربری', text: 'همان سایت‌هایی که در این گالری می‌بینید؛ تمیز و دقیق.', tags: ['React', 'Vite', 'TypeScript', 'CSS'], icon: 'code', tone: 'cyan' },
];

/**
 * جزئیات محل کار فعلی و شرح وظایف شرکتی عمداً نمایش داده نمی‌شود.
 * برای همین این فهرست خالی است؛ تایم‌لاین فقط تحصیلات را نشان می‌دهد.
 */
export const experiences: ExperienceEntry[] = [];

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
  'NumPy',
  'pandas',
  'scikit-learn',
  'Deep Learning',
  'BeeWare',
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
