export const services = {
  general: { label: 'مشاورهٔ عمومی' },
  botox: { label: 'بوتاکس', number: '01 / BOTOX', title: ['بوتاکس', 'پیشانی و دور چشم'], description: 'در مشاورهٔ بوتاکس می‌توانید دربارهٔ خطوط صورت، ناحیهٔ تزریق و هزینه سؤال کنید.', first: 'بررسی خطوط صورت' },
  filler: { label: 'تزریق ژل لب', number: '02 / LIP FILLER', title: ['ژل لب', 'فرم و حجم لب'], description: 'فرم و حجم دلخواهتان را با پزشک مطرح کنید. نوع ژل و جزئیات تزریق در جلسهٔ مشاوره بررسی می‌شود.', first: 'بررسی فرم لب و مدل دلخواه' },
  laser: { label: 'لیزر موهای زائد', number: '03 / LASER', title: ['لیزر موهای زائد', 'صورت و بدن'], description: 'ناحیهٔ موردنظر و سابقهٔ جلسات قبلی را به پزشک بگویید تا شرایط انجام لیزر بررسی شود.', first: 'بررسی پوست و ناحیهٔ موردنظر' },
  skin: { label: 'مراقبت و جوان‌سازی پوست', number: '04 / SKIN', title: ['خدمات پوست', 'مراقبت و جوان‌سازی'], description: 'برای بررسی وضعیت پوست و روش‌های مراقبت، نوبت مشاوره بگیرید. دربارهٔ محصولات و درمان‌های قبلی‌تان هم با پزشک صحبت کنید.', first: 'بررسی وضعیت پوست' },
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
  if (!Object.hasOwn(services, service)) return 'لطفاً خدمت موردنظر را انتخاب کنید.';
  if (!days.some((d) => d.id === day)) return 'لطفاً روز مراجعه را انتخاب کنید.';
  if (!slotsForDay(day).some((slot) => slot.id === time && slot.available)) return 'لطفاً یکی از ساعت‌های خالی را انتخاب کنید.';
  return '';
}
