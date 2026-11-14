export const categories = { tee: 'تیشرت', hoodie: 'هودی', jacket: 'کاپشن', shirt: 'پیراهن', pants: 'شلوار' };
export const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
const palette = {
  charcoal: { id: 'charcoal', name: 'زغالی', hex: '#29292b' },
  cream: { id: 'cream', name: 'استخوانی', hex: '#dcd7c9' },
  wine: { id: 'wine', name: 'زرشکی', hex: '#4e1728' },
  olive: { id: 'olive', name: 'زیتونی', hex: '#707260' },
  grey: { id: 'grey', name: 'خاکستری', hex: '#6d6c70' },
  sand: { id: 'sand', name: 'شنی', hex: '#bca98c' },
  indigo: { id: 'indigo', name: 'نیلی', hex: '#536e86' },
  petrol: { id: 'petrol', name: 'آبی نفتی', hex: '#234c59' },
  silver: { id: 'silver', name: 'نقره‌ای', hex: '#b9bec2' },
  brick: { id: 'brick', name: 'آجری', hex: '#a34e39' },
  denim: { id: 'denim', name: 'دنیم تیره', hex: '#253b55' },
  sage: { id: 'sage', name: 'زیتونی روشن', hex: '#a9b292' },
};
const rows = [
  ['tee-01', 'tee', 'تیشرت زغالی FORM', 'FORM / 03', 890000, 'charcoal', 'پنبهٔ سنگین، سرشانهٔ افتاده و یقهٔ کش‌باف؛ با فرم ساده و دوخت ظریف.', '۱۰۰٪ پنبه', 'آزاد / اورسایز', 'انتخاب استودیو'],
  ['tee-02', 'tee', 'تیشرت پنبه‌ای BASE', 'BASE / 01', 950000, 'cream', 'پنبهٔ استخوانی با برش آزاد، یقهٔ کش‌باف و لیبل کوچک پایین لباس.', '۱۰۰٪ پنبه', 'باکسی / آزاد', 'تازه رسیده'],
  ['tee-03', 'tee', 'تیشرت جیب‌دار AXIS', 'AXIS / 02', 780000, 'olive', 'تیشرت زیتونی با جیب سینه، برش آزاد و قد بلندتر.', 'پنبهٔ نرم', 'آزاد / لانگ', ''],
  ['hoodie-01', 'hoodie', 'هودی دورس DRIFT', 'DRIFT / 04', 2190000, 'wine', 'هودی زرشکی با کلاه خوش‌فرم، بند روشن و سرآستین کش‌باف؛ دوخت‌های ظریف روی پارچهٔ دورس.', 'دورس پنبه و پلی‌استر', 'آزاد', 'انتخاب استودیو'],
  ['hoodie-02', 'hoodie', 'هودی زیپ‌دار LAYER', 'LAYER / 05', 2450000, 'cream', 'یک لایهٔ گرم برای هوای خنک، با زیپ فلزی و جیب‌های راحت در دو طرف.', 'دورس پنبه‌ای', 'آزاد', ''],
  ['hoodie-03', 'hoodie', 'هودی استخوانی CORE', 'CORE / 06', 1990000, 'cream', 'هودی دورس استخوانی با کلاه فرم‌دار، سرآستین کش‌باف و نشان ظریف وکتور؛ ساده و خوش‌فرم.', 'دورس پنبه و پلی‌استر', 'آزاد', 'تازه رسیده'],
  ['jacket-01', 'jacket', 'کاپشن پلار SHELL', 'SHELL / 07', 4890000, 'charcoal', 'پلار زغالی با بافت برجسته، خطوط دوخت روشن، یقهٔ ایستاده، زیپ سرتاسری و بند تنظیم پایین لباس.', 'پلار بافت‌دار', 'آزاد', 'انتخاب استودیو'],
  ['jacket-02', 'jacket', 'کاپشن بامبر FLIGHT', 'FLIGHT / 08', 3650000, 'olive', 'بامبر آستردار با سرآستین کش‌باف و جیب روی آستین. برش آزاد آن جا برای یک لایه لباس زیر کاپشن می‌گذارد.', 'نایلون آستردار', 'آزاد', ''],
  ['jacket-03', 'jacket', 'بادگیر TRACE', 'TRACE / 09', 2790000, 'sand', 'بادگیر سبک کلاه‌دار با برش‌های هندسی؛ برای قدم‌زدن در هوای متغیر.', 'نایلون سبک', 'آزاد', ''],
  ['shirt-01', 'shirt', 'پیراهن آکسفورد BLANK', 'BLANK / 10', 1690000, 'cream', 'پیراهن آکسفورد با یقهٔ کلاسیک و فرم آزاد؛ تنها یا روی یک تیشرت ساده.', 'پنبهٔ آکسفورد', 'آزاد', ''],
  ['shirt-02', 'shirt', 'اورشرت دنیم RAW', 'RAW / 11', 2390000, 'indigo', 'پیراهن دنیم شسته با دو جیب سینه و دوخت روشن. هم به‌تنهایی پوشیده می‌شود، هم با دکمه‌های باز روی تیشرت.', 'دنیم پنبه‌ای', 'آزاد / اورشرت', 'تازه رسیده'],
  ['shirt-03', 'shirt', 'پیراهن لینن AIR', 'AIR / 12', 1790000, 'charcoal', 'پیراهن لینن و پنبه با یقهٔ باز و برش آزاد. بافت پارچه ساده است و به‌راحتی با جین یا شلوار پارچه‌ای ست می‌شود.', 'ترکیب لینن و پنبه', 'آزاد', ''],
  ['pants-01', 'pants', 'شلوار کارگو UTILITY', 'UTILITY / 13', 2490000, 'charcoal', 'شلوار کارگو با پاچهٔ آزاد، کمر کشی و جیب‌های بزرگ کنار پا. مناسب پوشیدن با تیشرت و هودی.', 'پارچهٔ تکنیکال', 'راسته / آزاد', ''],
  ['pants-02', 'pants', 'شلوار پلیسه WIDE', 'WIDE / 14', 2290000, 'cream', 'شلوار پنبه‌ای با پلیسهٔ جلو و پاچهٔ گشاد. هم با پیراهن جور است، هم با یک تیشرت ساده.', 'پنبهٔ توییل', 'واید', ''],
  ['pants-03', 'pants', 'جین راسته EVERYDAY', 'EVERYDAY / 15', 2690000, 'indigo', 'جین آبی شسته با پنج جیب و پاچهٔ راسته. برش ساده‌ای دارد و با بیشتر لباس‌های روزمره ست می‌شود.', 'دنیم پنبه‌ای', 'راسته / آزاد', ''],
  ['hoodie-04', 'hoodie', 'هودی باکسی PULSE', 'PULSE / 16', 2350000, 'cream', 'هودی استخوانی با سرشانهٔ افتاده، کلاه حجم‌دار، جیب کانگورویی و لبه‌های کش‌باف پهن؛ یک لیبل قرمز کوچک کنار لبهٔ لباس.', 'دورس پنبه‌ای سنگین', 'باکسی / اورسایز', 'روی رگال'],
  ['hoodie-05', 'hoodie', 'هودی زیپ‌دار COVE', 'COVE / 17', 2650000, 'petrol', 'هودی آبی نفتی با زیپ فلزی برس‌خورده، جیب‌های مورب و کلاه خوش‌فرم. دورس نرم و برش آزاد برای پوشیدن روی تیشرت.', 'دورس پنبه‌ای', 'آزاد', 'روی رگال'],
  ['jacket-04', 'jacket', 'کاپشن تکنیکال NOMAD', 'NOMAD / 18', 4450000, 'silver', 'کاپشن نقره‌ای مات با یقهٔ ایستاده، برش‌های هندسی روی سینه و جیب‌های زیپ‌دار مشکی؛ سبک، کاربردی و قابل تنظیم در پایین لباس.', 'نایلون تکنیکال', 'آزاد', 'روی رگال'],
  ['jacket-05', 'jacket', 'کاپشن بامبر VOLT', 'VOLT / 19', 4150000, 'brick', 'بامبر آجری با حجم نرم، یقه و سرآستین کش‌باف، زیپ فلزی تیره و جیب کوچک روی آستین؛ با آستر سبک و دو جیب در جلو.', 'نایلون مات آستردار', 'بامبر / آزاد', 'روی رگال'],
  ['shirt-04', 'shirt', 'اورشرت دنیم GRID', 'GRID / 20', 2450000, 'denim', 'اورشرت دنیم تیره با دو جیب دردار روی سینه، دکمه‌های فلزی و دوخت دوبل نخودی؛ برش باکسی برای پوشیدن روی تیشرت.', 'دنیم پنبه‌ای', 'باکسی / اورشرت', 'روی رگال'],
  ['shirt-05', 'shirt', 'اورشرت کاربردی DUNE', 'DUNE / 21', 2250000, 'sage', 'اورشرت زیتونی روشن با بافت توییل، جیب‌های بزرگ دردار، دکمه‌های هم‌رنگ و لبهٔ صاف؛ یک لایهٔ سبک با فرم آزاد.', 'پنبهٔ توییل', 'آزاد / اورشرت', 'روی رگال'],
];
const imageDimensions = { 'hoodie-01': [1200, 1400], 'hoodie-03': [1200, 1400], 'jacket-01': [1200, 1400] };
export const featuredIds = ['hoodie-03', 'hoodie-01', 'jacket-01'];
export const rackIds = ['hoodie-04', 'jacket-05', 'shirt-04', 'hoodie-05', 'jacket-04', 'shirt-05'];
const rackSideImages = {
  'hoodie-04': './assets/img/hoodie-04-side.webp', 'hoodie-05': './assets/img/hoodie-05-side.webp',
  'jacket-04': './assets/img/jacket-04-side.webp', 'jacket-05': './assets/img/jacket-05-side.webp',
  'shirt-04': './assets/img/shirt-04-side.webp', 'shirt-05': './assets/img/shirt-05-side.webp',
};
export const products = rows.map(([id, cat, name, code, price, base, detail, fabric, fit, badge], index) => {
  const onRack = rackIds.includes(id);
  const colorIds = cat === 'tee' || onRack ? [base] : [...new Set([base, 'charcoal', 'cream', 'wine'])].slice(0, 3);
  const colors = colorIds.map((color) => palette[color]);
  const [imageWidth, imageHeight] = imageDimensions[id] || (onRack ? [1024, 1280] : [900, 900]);
  return { id, cat, name, code, price, detail, fabric, fit, badge: featuredIds.includes(id) ? 'ORIGINALS' : badge === 'انتخاب استودیو' ? '' : badge, colors, sizes, imageColor: palette[base].name,
    image: './assets/img/' + id + '.webp', imageWidth, imageHeight, added: onRack ? 30 - rackIds.indexOf(id) : 15 - index, featured: featuredIds.includes(id), onRack,
    variants: colors.flatMap((color, c) => sizes.map((size, s) => ({ color: color.id, size, stock: s === 4 && (index % 4 === 0 || (index + c) % 3 === 0) ? 0 : 3 + (index + s + c) % 5 }))),
  };
});
export const rackItems = rackIds.map((id) => {
  const product = products.find((p) => p.id === id);
  return { id, label: product.code.split(' / ')[0], front: product.image, side: rackSideImages[id], accent: product.colors[0].hex };
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
