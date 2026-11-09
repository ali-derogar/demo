export const services = {
  general: { label: 'مشاورهٔ عمومی' },
  botox: { label: 'بوتاکس', number: '01 / EXPRESSION', title: ['ظرافت در', 'حالتِ چهره.'], description: 'گاهی یک تغییر ظریف، همان چیزی‌ست که در ذهن داری. در مشاورهٔ بوتاکس، دربارهٔ خواسته‌ها و تناسب انتخاب با چهره‌ات گفت‌وگو می‌کنیم.', first: 'بررسی حالت و خطوط چهره' },
  filler: { label: 'فیلر و فرم‌دهی لب', number: '02 / BALANCE', title: ['تعادل در', 'هر منحنی.'], description: 'زیبایی لب‌ها در تناسبی‌ست که با چهرهٔ تو معنا می‌گیرد. از فرم دلخواهت بگو تا در مشاوره، انتخاب‌ها و پرسش‌هایت را بررسی کنیم.', first: 'گفت‌وگو دربارهٔ فرم و تناسب لب' },
  laser: { label: 'لیزر موهای زائد', number: '03 / LIGHT', title: ['قرارِ تازه‌ای', 'با مراقبت.'], description: 'برای یک روتین شخصی‌تر وقت بگذار. در مشاورهٔ لیزر، ناحیهٔ موردنظر، ویژگی‌های پوست و سؤال‌هایت بررسی می‌شوند.', first: 'بررسی پوست و ناحیهٔ موردنظر' },
  skin: { label: 'مراقبت و جوان‌سازی پوست', number: '04 / GLOW', title: ['روایتِ تازهٔ', 'پوستِ تو.'], description: 'شناخت پوست، آغاز یک مسیر شخصی است. دربارهٔ دغدغه‌هایت صحبت می‌کنیم و پزشک گزینه‌های مراقبت از پوست را با تو مرور می‌کند.', first: 'شناخت پوست و خواسته‌های تو' },
};

/** All calendar boundaries use Tehran, regardless of the visitor or host timezone. */
export function calendarOptions(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (name) => Number(parts.find((p) => p.type === name).value);
  const base = Date.UTC(part('year'), part('month') - 1, part('day'), 12);
  const format = (date, options) => new Intl.DateTimeFormat('fa-IR-u-ca-persian', { ...options, timeZone: 'Asia/Tehran' }).format(date);
  const days = [];
  for (let offset = 1; days.length < 5; offset++) {
    const date = new Date(base + offset * 86400000);
    if (date.getUTCDay() === 5) continue;
    days.push({ id: date.toISOString().slice(0, 10), weekday: format(date, { weekday: 'short' }), day: format(date, { day: 'numeric' }), month: format(date, { month: 'long' }), full: format(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) });
  }
  return days;
}

export function slotsForDay(day) {
  const seed = Number(String(day).replaceAll('-', ''));
  return ['۱۰:۰۰', '۱۱:۳۰', '۱۴:۰۰', '۱۶:۳۰'].map((label, index) => ({ id: ['10:00', '11:30', '14:00', '16:30'][index], label, available: (seed + index) % 4 !== 0 }));
}

export function validateBooking({ service, day, time }, days) {
  if (!Object.hasOwn(services, service)) return 'موضوع مشاوره را انتخاب کن.';
  if (!days.some((d) => d.id === day)) return 'یک روز از روزهای پیشنهادی انتخاب کن.';
  if (!slotsForDay(day).some((slot) => slot.id === time && slot.available)) return 'یک ساعت در دسترس انتخاب کن.';
  return '';
}
