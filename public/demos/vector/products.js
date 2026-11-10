export const categories = { tee: 'تیشرت', hoodie: 'هودی', jacket: 'کاپشن', shirt: 'پیراهن', pants: 'شلوار' };
export const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
const palette = {
  charcoal: { id: 'charcoal', name: 'زغالی', hex: '#29292b' },
  cream: { id: 'cream', name: 'استخوانی', hex: '#dcd7c9' },
  wine: { id: 'wine', name: 'زرشکی', hex: '#782c39' },
  olive: { id: 'olive', name: 'زیتونی', hex: '#707260' },
  grey: { id: 'grey', name: 'خاکستری', hex: '#6d6c70' },
  sand: { id: 'sand', name: 'شنی', hex: '#bca98c' },
  indigo: { id: 'indigo', name: 'نیلی', hex: '#536e86' },
};
const rows = [
  ['tee-01', 'tee', 'تیشرت ORIGINALS GRAY', 'GRAY / 03', 890000, 'charcoal', 'پنبهٔ سنگین ۲۸۰ گرم، سرشانهٔ افتاده و یقهٔ کش‌باف؛ از کالکشن خاکستری اوریجینال.', '۱۰۰٪ پنبه', 'آزاد / اورسایز', 'انتخاب استودیو'],
  ['tee-02', 'tee', 'تیشرت ORIGINALS WHITE', 'WHITE / 01', 950000, 'cream', 'تیشرت روشن کالکشن اوریجینال، با برش آزاد و جزئیات قرمز.', '۱۰۰٪ پنبه', 'باکسی / آزاد', 'تازه رسیده'],
  ['tee-03', 'tee', 'تیشرت ORIGINALS SPORT', 'SPORT / 02', 780000, 'charcoal', 'تیشرت کالکشن ورزشی با ترکیب مشکی و قرمز و فرم آزاد.', 'پنبهٔ نرم', 'آزاد / لانگ', ''],
  ['hoodie-01', 'hoodie', 'هودی سنگین DRIFT', 'DRIFT / 04', 2190000, 'wine', 'کلاه دولایهٔ خوش‌فرم، جیب کانگورویی و پارچهٔ دورس سنگین؛ حجمی که استایل شما را تعریف می‌کند.', 'دورس پنبه‌ای ۴۲۰ گرم', 'اورسایز', 'انتخاب استودیو'],
  ['hoodie-02', 'hoodie', 'هودی زیپ‌دار LAYER', 'LAYER / 05', 2450000, 'cream', 'یک لایهٔ گرم برای هوای خنک، با زیپ فلزی و جیب‌های راحت در دو طرف.', 'دورس پنبه‌ای', 'آزاد', ''],
  ['hoodie-03', 'hoodie', 'هودی باکسی SHADOW', 'SHADOW / 06', 1990000, 'grey', 'قد کوتاه‌تر، سرشانهٔ افتاده و کلاه بزرگ؛ بافتی نرم با ایستایی مشخص.', 'پنبه و پلی‌استر', 'باکسی', 'تازه رسیده'],
  ['jacket-01', 'jacket', 'کاپشن پافر SHELL', 'SHELL / 07', 4890000, 'charcoal', 'پافر حجم‌دار با دوخت‌های افقی، یقهٔ ایستاده و جیب زیپ‌دار؛ همراه روزهای سرد شهر.', 'رویهٔ نایلون مات', 'آزاد / پافر', 'انتخاب استودیو'],
  ['jacket-02', 'jacket', 'کاپشن بامبر FLIGHT', 'FLIGHT / 08', 3650000, 'olive', 'بامبر کلاسیک با سرآستین کش‌باف و جیب روی آستین؛ فرم آشنا با حال‌وهوای امروز.', 'نایلون آستردار', 'آزاد', ''],
  ['jacket-03', 'jacket', 'بادگیر TRACE', 'TRACE / 09', 2790000, 'sand', 'بادگیر سبک کلاه‌دار با برش‌های هندسی؛ برای قدم‌زدن در هوای متغیر.', 'نایلون سبک', 'آزاد', ''],
  ['shirt-01', 'shirt', 'پیراهن آکسفورد BLANK', 'BLANK / 10', 1690000, 'cream', 'پیراهن آکسفورد با یقهٔ کلاسیک و فرم آزاد؛ تنها یا روی یک تیشرت ساده.', 'پنبهٔ آکسفورد', 'آزاد', ''],
  ['shirt-02', 'shirt', 'اورشرت دنیم RAW', 'RAW / 11', 2390000, 'indigo', 'دنیم شسته با دو جیب سینه و دوخت روشن؛ لایه‌ای کاربردی برای تمام فصل‌ها.', 'دنیم پنبه‌ای', 'آزاد / اورشرت', 'تازه رسیده'],
  ['shirt-03', 'shirt', 'پیراهن لینن AIR', 'AIR / 12', 1790000, 'charcoal', 'بافت طبیعی لینن، یقهٔ باز و برش راحت؛ برای روزهایی با ریتم آرام‌تر.', 'ترکیب لینن و پنبه', 'آزاد', ''],
  ['pants-01', 'pants', 'شلوار کارگو UTILITY', 'UTILITY / 13', 2490000, 'charcoal', 'پاچهٔ آزاد، کمر کشی و جیب‌های کاربردی؛ یک همراه شهری برای هر روز.', 'پارچهٔ تکنیکال', 'راسته / آزاد', ''],
  ['pants-02', 'pants', 'شلوار پلیسه WIDE', 'WIDE / 14', 2290000, 'cream', 'پنبهٔ محکم با پلیسهٔ ظریف و خط مستقیم پاچه؛ راحتی با فرمی مرتب.', 'پنبهٔ توییل', 'واید', ''],
  ['pants-03', 'pants', 'جین راسته EVERYDAY', 'EVERYDAY / 15', 2690000, 'indigo', 'جین آبی شسته با پنج جیب و پاچهٔ راسته؛ از آن انتخاب‌هایی که همیشه برمی‌گردید سراغشان.', 'دنیم پنبه‌ای', 'راسته / آزاد', ''],
];
export const featuredIds = ['tee-02', 'tee-03', 'tee-01'];
export const products = rows.map(([id, cat, name, code, price, base, detail, fabric, fit, badge], index) => {
  const colorIds = featuredIds.includes(id) ? [base] : [...new Set([base, 'charcoal', 'cream', 'wine'])].slice(0, 3);
  const colors = colorIds.map((color) => palette[color]);
  if (id === 'tee-03') colors[0] = { ...colors[0], name: 'مشکی و قرمز' };
  return { id, cat, name, code, price, detail, fabric, fit, badge: featuredIds.includes(id) ? 'ORIGINALS' : badge === 'انتخاب استودیو' ? '' : badge, colors, sizes, imageColor: palette[base].name,
    image: './assets/img/' + id + '.webp', added: rows.length - index, featured: featuredIds.includes(id),
    variants: colors.flatMap((color, c) => sizes.map((size, s) => ({ color: color.id, size, stock: s === 4 && (index % 4 === 0 || (index + c) % 3 === 0) ? 0 : 3 + (index + s + c) % 5 }))),
  };
});
export const byId = (id) => products.find((p) => p.id === id);
export const money = (value) => new Intl.NumberFormat('fa-IR').format(value);
export const latinDigits = (value) => String(value).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
export const normalize = (value) => latinDigits(value).normalize('NFKC').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[\u064B-\u065F\u0670\u0640\u200c\u200d]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
export function selectProducts({ query = '', category = 'all', size = 'all', sort = 'newest', favorites = null } = {}) {
  const words = normalize(query).split(' ').filter(Boolean);
  return products.filter((p) => (category === 'all' || p.cat === category) && (!favorites || favorites.includes(p.id))
    && (size === 'all' || p.variants.some((v) => v.size === size && v.stock > 0))
    && words.every((word) => normalize(`${p.name} ${p.code} ${categories[p.cat]} ${p.detail} ${p.colors.map((c) => c.name).join(' ')}`).includes(word)))
    .sort((a, b) => sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : b.added - a.added);
}
export const variantKey = (id, color, size) => `${id}~${color}~${size}`;
export function variantFor(id, color, size) { return byId(id)?.variants.find((v) => v.color === color && v.size === size); }
export function cleanCart(value) {
  const clean = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return clean;
  for (const [key, qty] of Object.entries(value)) {
    const parts = key.split('~'); if (parts.length !== 3 || !Number.isInteger(qty) || qty <= 0) continue;
    const variant = variantFor(...parts); if (variant?.stock) clean[key] = Math.min(qty, variant.stock);
  }
  return clean;
}
export function addToCart(cart, id, color, size) {
  const variant = variantFor(id, color, size);
  if (!color || !size) return { cart, error: 'رنگ و سایز خود را انتخاب کنید.' };
  if (!variant?.stock) return { cart, error: 'این ترکیب رنگ و سایز موجود نیست.' };
  const key = variantKey(id, color, size);
  if ((cart[key] || 0) >= variant.stock) return { cart, error: 'تمام موجودی این ترکیب در سبد شماست.' };
  return { cart: { ...cart, [key]: (cart[key] || 0) + 1 }, error: null };
}
export function cartLines(cart) {
  return Object.entries(cleanCart(cart)).map(([key, qty]) => { const [id, color, size] = key.split('~'); const product = byId(id); return { key, qty, product, color: product.colors.find((c) => c.id === color), size, stock: variantFor(id, color, size).stock }; });
}
export function orderErrors(data) {
  const errors = {};
  if (String(data.name || '').trim().length < 3) errors.name = 'نام و نام خانوادگی را کامل وارد کنید.';
  if (!/^09\d{9}$/.test(latinDigits(data.phone || '').replace(/\s/g, ''))) errors.phone = 'شمارهٔ همراه ۱۱ رقمی با ۰۹ شروع می‌شود.';
  if (String(data.address || '').trim().length < 10) errors.address = 'شهر، خیابان و پلاک را وارد کنید.';
  if (!/^\d{10}$/.test(latinDigits(data.postal || '').trim())) errors.postal = 'کد پستی باید ۱۰ رقم باشد.';
  return errors;
}
