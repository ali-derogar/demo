const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'namooneh-kade/1.0 (portfolio site; local image hosting)';

const OK_LICENSE = /(public domain|cc0|cc by|cc-by|attribution|gfdl|bsd|mit)/i;

async function api(params) {
  const url = new URL(API);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set('format', 'json');
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Commons API HTTP ${res.status}`);
  return res.json();
}

function pick(imageinfo) {
  const md = imageinfo.extmetadata ?? {};
  const clean = (value) => String(value ?? '').replace(/<[^>]*>/g, '').trim();
  return {
    mime: imageinfo.mime,
    thumburl: imageinfo.thumburl || imageinfo.url,
    url: imageinfo.url,
    descriptionUrl: md.UsageTerms?.value ?? imageinfo.descriptionurl ?? '',
    license: clean(md.LicenseShortName?.value) || 'نامعلوم',
    artist: clean(md.Artist?.value) || 'نامعلوم',
    description: clean(md.ImageDescription?.value),
    okLicense: OK_LICENSE.test(clean(md.LicenseShortName?.value)) || !md.LicenseShortName,
  };
}

/** جست‌وجوی تصاویر در Wikimedia Commons؛ نتایج به ترتیب مرتبط‌بودن */
export async function searchCommons(query, { limit = 12, width = 900 } = {}) {
  const data = await api({
    action: 'query',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6',
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|mime|extmetadata',
    iiurlwidth: String(width),
  });
  const pages = Object.values(data?.query?.pages ?? {});
  return pages
    .map((page) => ({ title: page.title, ...pick(page.imageinfo?.[0] ?? {}) }))
    .filter((row) => row.mime?.startsWith('image/') && row.okLicense && row.mime !== 'image/tiff');
}

/** اطلاعات یک فایل مشخص برای دانلود */
export async function imageInfo(title, width = 1600) {
  const name = title.startsWith('File:') ? title : `File:${title}`;
  const data = await api({
    action: 'query',
    titles: name,
    prop: 'imageinfo',
    iiprop: 'url|mime|extmetadata',
    iiurlwidth: String(width),
  });
  const page = Object.values(data?.query?.pages ?? {})[0];
  if (!page || page.missing !== undefined || !page.imageinfo) return null;
  return { title: page.title, ...pick(page.imageinfo[0]) };
}
