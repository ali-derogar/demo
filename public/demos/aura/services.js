export const services = {
  general: { label: 'مشاورهٔ عمومی' },
  botox: { label: 'بوتاکس', number: '01 / EXPRESSION', title: ['بوتاکس،', 'برای کدام خطوط؟'], description: 'پیشانی یا دور چشم؟ ناحیه‌ای که مدنظرت است را در مشاوره مشخص کن تا پزشک حالت چهره و انتخاب‌های مناسب را بررسی کند.', first: 'بررسی خطوط و حالت چهره' },
  filler: { label: 'فیلر و فرم‌دهی لب', number: '02 / BALANCE', title: ['فیلر لب،', 'با چه فرمی؟'], description: 'به فرم لب فکر می‌کنی یا حجم آن؟ از چیزی که دوست داری بگو تا تناسبش با چهره‌ات در جلسهٔ مشاوره بررسی شود.', first: 'بررسی فرم لب و خواستهٔ تو' },
  laser: { label: 'لیزر موهای زائد', number: '03 / LIGHT', title: ['لیزر،', 'برای کدام ناحیه؟'], description: 'ناحیهٔ موردنظرت را مشخص کن. برنامهٔ جلسات پس از بررسی پوست و شرایطت در مشاوره تعیین می‌شود.', first: 'بررسی پوست و ناحیهٔ انتخابی' },
  skin: { label: 'مراقبت و جوان‌سازی پوست', number: '04 / SKIN', title: ['پوستت،', 'چه چیزی نیاز دارد؟'], description: 'از دغدغهٔ پوستت و محصولاتی که استفاده می‌کنی بگو. اول وضعیت پوست بررسی می‌شود، بعد دربارهٔ روش مراقبت تصمیم می‌گیری.', first: 'بررسی پوست و مراقبت‌های فعلی' },
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
