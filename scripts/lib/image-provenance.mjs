/** Generated originals have prompts, not invented stock URLs or third-party licenses. */
export function provenanceError(item) {
  if (!item.title) return 'عنوان تصویر ثبت نشده';
  if (item.origin === 'generated') {
    if (item.generator !== 'image_gen' || typeof item.prompt !== 'string' || !item.prompt.trim()) return 'تصویر تولیدشده باید ابزار image_gen و دستور ساخت داشته باشد';
    return null;
  }
  if (item.origin === 'original' || item.origin === 'rendered') {
    if (!/^scripts\/[\w-]+\.(py|mjs)$/.test(String(item.generator ?? ''))) return 'اثر تألیفی باید مسیر سازندهٔ محلی داشته باشد';
    if (!item.artist) return 'نام سازندهٔ اثر تألیفی ثبت نشده';
    if (item.origin === 'rendered' && (!Array.isArray(item.derivedFrom) || !item.derivedFrom.length || !Array.isArray(item.sources) || !item.sources.length)) return 'رندر باید مدل و فایل‌های منبع داشته باشد';
    return null;
  }
  if (!item.license) return 'لایسنس تصویر ثبت نشده';
  if (!/^https?:\/\//.test(String(item.source ?? ''))) return 'منبع تصویر باید نشانی وب باشد';
  return null;
}
