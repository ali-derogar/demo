/** ابزار جست‌وجوی فارسی: یکسان‌سازی حروف، ارقام و فاصله‌ها */

const LETTER_MAP: ReadonlyMap<string, string> = new Map([
  ['ي', 'ی'], // ي عربی -> ی فارسی
  ['ك', 'ک'], // ك عربی -> ک فارسی
  ['ى', 'ی'], // ى آخر -> ی
  ['ئ', 'ئ'],
  ['ة', 'ه'], // ة -> ه
  ['و', 'و'],
]);

const DIACRITICS = /[ً-ْٰٔ]/g; // اعراب، تنوین، مدّه
const TATWEEL = /\u0640/g;
const ZWNJ = /\u200c/g;
const CONJUNCTION = /\u200cو/g;
const SPACES = /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g;
const DIGITS = /[٠-٩۰-۹]/g;
const FA_DIGIT_BASE = '۰';
const AR_DIGIT_BASE = '٠';

const FA_TO_DIGIT = '۰۱۲۳۴۵۶۷۸۹';

/** فارسی‌سازی متن برای مقایسه: بدون حساسیت به ي/ی، ك/ک، نیم‌فاصله و ارقام */
export function normalizeFa(input: string): string {
  let out = input.normalize('NFKC');
  out = out.replace(DIGITS, (ch) => {
    const code = ch.charCodeAt(0);
    if (code >= AR_DIGIT_BASE.charCodeAt(0) && code <= AR_DIGIT_BASE.charCodeAt(0) + 9) {
      return String(code - AR_DIGIT_BASE.charCodeAt(0));
    }
    return String(code - FA_DIGIT_BASE.charCodeAt(0));
  });
  // «جست‌وجو» و «جستجو» باید یک چیز دیده شوند: واو پیوندی پس از نیم‌فاصله حذف می‌شود
  out = out.replace(CONJUNCTION, '\u200c');
  out = out.replace(TATWEEL, '').replace(ZWNJ, '').replace(DIACRITICS, '');
  out = out.replace(SPACES, ' ');
  out = Array.from(out)
    .map((ch) => LETTER_MAP.get(ch) ?? ch)
    .join('');
  return out.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * جست‌وجوی چندکلمه‌ای: هر واژه‌ی پرس‌وجو باید در یکی از فیلدها پیدا شود
 * (ترکیب واژه‌ها با AND). ترتیب واژه‌ها الزامی نیست.
 */
export function matchesFa(query: string, fields: string[]): boolean {
  const normalizedQuery = normalizeFa(query);
  if (!normalizedQuery) return true;
  const haystack = normalizeFa(fields.filter(Boolean).join(' '));
  return normalizedQuery
    .split(' ')
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

const persianNumber = new Intl.NumberFormat('fa-IR');

/** عدد با ارقام فارسی و جداکننده‌ی هزارگان */
export function faNumber(value: number): string {
  return persianNumber.format(value);
}

/** رقم فارسی برای شمارنده‌های کوچک؛ رشته هم می‌پذیرد تا صفرِ پیشوند حفظ شود */
export function faDigit(value: number | string): string {
  return String(value).replace(/\d/g, (d) => FA_TO_DIGIT[Number(d)]);
}

const COUNT_WORDS = ['یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه', 'ده'];

/** عدد به حرف؛ برای متن‌های تیتر که رقم در آن‌ها مصنوعی می‌ایستد */
export function faCount(value: number): string {
  return COUNT_WORDS[value - 1] ?? faDigit(value);
}

export function faYear(date = new Date()): string {
  return new Intl.DateTimeFormat('fa-IR', { calendar: 'persian', year: 'numeric' }).format(date);
}
