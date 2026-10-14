#!/usr/bin/env node
/**
 * یکپارچگی منبع را بررسی می‌کند:
 *  - هر ارجاع تصویری در HTML/CSS/JS دموها به فایلی وجود دارد که واقعاً روی دیسک است
 *  - هیچ فایل تصویری بی‌استفاده‌ای نمانده باشد
 *  - هیچ نشانی تصویر بیرونی (http/https) استفاده نشده باشد
 *  - هیچ پیوند یا آیکون گیت‌هابی در رابط عمومی نباشد
 *  - ATTRIBUTION.json هر تصویر محلی را پوشش دهد
 *  - index.html هر دمو lang=fa و dir=rtl داشته باشد
 *  - فایل‌های تصویری واقعاً تصویر معتبر باشند (متادیتای sharp)
 *
 *  usage: node scripts/check-site.mjs
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const DEMOS = ['fashion', 'sports', 'cars', 'store'];
const IMAGE_EXT = /\.(webp|jpe?g|png|avif|gif|svg)$/i;
const errors = [];
const warnings = [];
const say = (list, msg) => list.push(msg);

async function read(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

/** همه‌ی ارجاع‌های تصویر در یک متن، با مسیر نسبی-به-فایل */
function imageRefs(text, fileDir) {
  const refs = [];
  const patterns = [
    /src=["']([^"']+\.(?:webp|jpe?g|png|avif|svg|gif))["']/gi,
    /url\(\s*['"]?([^'")]+\.(?:webp|jpe?g|png|avif|svg|gif))['"]?\s*\)/gi,
    /["'`](\.?\/?assets\/[^"'`\\]+\.(?:webp|jpe?g|png|avif|svg|gif))["'`]/gi,
    /image:\s*["'']([^"'']+\.webp)["'']/gi,
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const raw = m[1];
      if (/^(https?:|data:|\/\/)/i.test(raw)) {
        refs.push({ external: raw, resolved: null });
        continue;
      }
      const clean = raw.replace(/^\.\//, '');
      refs.push({ external: null, resolved: resolve(fileDir, clean), raw });
    }
  }
  return refs;
}

const galleryText = (await read(join(ROOT, 'index.html'))) ?? '';
const gallerySrc = await walk(join(ROOT, 'src'));
const galleryFiles = [];
for (const path of gallerySrc) if (/\.(ts|tsx|css)$/.test(path)) galleryFiles.push(path);

// ۱) گالری: هیچ پیوند گیت‌هاب و هیچ تصویر بیرونی نباشد
for (const path of [...galleryFiles, join(ROOT, 'index.html')]) {
  const text = await read(path);
  if (!text) continue;
  if (/github/i.test(text)) say(errors, `گیت‌هاب در ${path.replace(ROOT, '.')}`);
  if (/https?:\/\/[^\s"'`)]+\.(?:jpe?g|png|webp|avif)/i.test(text))
    say(errors, `تصویر بیرونی در ${path.replace(ROOT, '.')}`);
}
if (!/lang="fa"/.test(galleryText)) say(errors, 'index.html ریشه: lang="fa" ندارد');
if (!/dir="rtl"/.test(galleryText)) say(errors, 'index.html ریشه: dir="rtl" ندارد');

// ۲) ارجاع‌های پیش‌نمایش در ثبت پروژه‌ها باید وجود داشته باشند
const registryText = (await read(join(ROOT, 'src/data/projects.ts'))) ?? '';
const previewRefs = [...registryText.matchAll(/preview:\s*'([^']+)'/g)].map((m) => m[1]);
for (const ref of previewRefs) {
  const local = join(PUBLIC, ref.replace(/^\//, ''));
  if (!(await stat(local).then(() => true).catch(() => false)))
    say(errors, `پیش‌نمایش ثبت‌شده روی دیسک نیست: ${ref}`);
}
const altCount = [...registryText.matchAll(/previewAlt:\s*'([^']+)'/g)].length;
if (altCount !== previewRefs.length) say(errors, 'برای بعضی پیش‌نمایش‌ها alt تعریف نشده است');

// ۳) دموها
for (const slug of DEMOS) {
  const dir = join(PUBLIC, 'demos', slug);
  const html = await read(join(dir, 'index.html'));
  const css = await read(join(dir, 'styles.css'));
  const js = await read(join(dir, 'app.js'));
  if (!html) {
    say(errors, `demos/${slug}: index.html وجود ندارد`);
    continue;
  }
  if (!/lang="fa"/.test(html) || !/dir="rtl"/.test(html))
    say(errors, `demos/${slug}: lang=fa/dir=rtl کامل نیست`);
  if (/github/i.test(html) || /github/i.test(css ?? '') || /github/i.test(js ?? ''))
    say(errors, `demos/${slug}: اشاره‌ی گیت‌هاب در رابط عمومی`);

  const sources = [
    [html, dir],
    [css, dir],
    [(js ?? '') + (js ? '' : ''), dir],
  ];
  const used = new Set();
  for (const [text, baseDir] of sources) {
    for (const ref of imageRefs(text, baseDir)) {
      if (ref.external) {
        say(errors, `demos/${slug}: نشانی تصویر بیرونی ${ref.external}`);
        continue;
      }
      used.add(ref.resolved);
      if (!(await stat(ref.resolved).then(() => true).catch(() => false)))
        say(errors, `demos/${slug}: تصویر ارجاع‌شده یافت نشد → ${basename(ref.resolved)}`);
    }
  }

  // فایل‌های تصویری روی دیسک
  const imgDir = join(dir, 'assets', 'img');
  const onDisk = (await readdir(imgDir).catch(() => [])).filter((f) => IMAGE_EXT.test(f));

  // دموهایی که مسیر تصویر را در JS می‌سازند، نام فایل را رشته‌ی تنها نگه می‌دارند
  const jsNames = new Set(
    [...(js ?? '').matchAll(/['"`]([\w.\-/]+)['"`]/g)].map((m) => m[1].split('/').pop()),
  );
  for (const file of onDisk) {
    if (jsNames.has(basename(file, extname(file)))) used.add(join(imgDir, file));
  }

  for (const file of onDisk) {
    const full = join(imgDir, file);
    if (!used.has(full)) say(warnings, `demos/${slug}: تصویر بی‌استفاده → assets/img/${file}`);
    const meta = await sharp(full).metadata().catch(() => null);
    if (!meta || !['webp', 'jpeg', 'png', 'avif'].includes(meta.format))
      say(errors, `demos/${slug}: فایل نامعتبر/غیرتصویری → ${file}`);
    else if (meta.width < 300 || meta.height < 200)
      say(warnings, `demos/${slug}: تصویر خیلی کوچک → ${file} (${meta.width}x${meta.height})`);
    const { size } = await stat(full);
    if (size > 400_000) say(warnings, `demos/${slug}: حجم زیاد → ${file} (${Math.round(size / 1024)}KB)`);
  }

  // alt برای همه‌ی تصاویر محتوا
  const noAlt = [...html.matchAll(/<img(?![^>]*\balt=)[^>]*>/gi)];
  if (noAlt.length) say(errors, `demos/${slug}: ${noAlt.length} تگ img بدون alt`);
  const emptyAlt = [...html.matchAll(/<img[^>]*\balt=["']\s*["'][^>]*>/gi)];
  if (emptyAlt.length) say(warnings, `demos/${slug}: ${emptyAlt.length} img با alt خالی`);

  // attribution
  const attribution = await read(join(dir, 'assets', 'ATTRIBUTION.json'));
  if (!attribution) {
    say(errors, `demos/${slug}: assets/ATTRIBUTION.json نیست`);
  } else {
    let items;
    try {
      items = JSON.parse(attribution);
    } catch (e) {
      say(errors, `demos/${slug}: ATTRIBUTION.json نامعتبر است (${e.message})`);
      items = [];
    }
    const covered = new Set(items.map((i) => basename(String(i.file ?? i.out ?? ''))));
    for (const file of onDisk) {
      if (!covered.has(file)) say(errors, `demos/${slug}: ${file} در attribution نیست`);
    }
    for (const item of items) {
      if (!item.license || !item.title) say(errors, `demos/${slug}: attribution بی‌عنوان/بی‌لایسنس → ${item.file}`);
    }
  }

  // فایل‌های CSS/JS ارجاع‌شده در HTML
  for (const m of html.matchAll(/(?:href|src)=["'](?!https?:|data:|#)([^"']+\.(?:css|js))["']/gi)) {
    const target = resolve(dir, m[1]);
    if (!(await stat(target).then(() => true).catch(() => false)))
      say(errors, `demos/${slug}: فایل ${m[1]} ارجاع‌شده در index.html وجود ندارد`);
  }
}

// ۴) پیش‌نمایش‌ها
for (const slug of DEMOS) {
  const file = join(PUBLIC, 'images', 'previews', `${slug}.webp`);
  const info = await stat(file).catch(() => null);
  if (!info) {
    say(errors, `پیش‌نمایش public/images/previews/${slug}.webp نیست`);
    continue;
  }
  const meta = await sharp(file).metadata().catch(() => null);
  if (!meta || meta.format !== 'webp') say(errors, `پیش‌نمایش ${slug}.webp فرمت webp ندارد`);
  else if (meta.width !== 1200 || meta.height !== 800)
    say(warnings, `پیش‌نمایش ${slug}.webp ابعاد ${meta.width}x${meta.height} است (انتظار ۱۲۰۰×۸۰۰)`);
  if (info.size > 250_000) say(warnings, `پیش‌نمایش ${slug}.webp حجیم است (${Math.round(info.size / 1024)}KB)`);
}

console.log(`بررسی ${DEMOS.length} دمو + گالری…`);
for (const w of warnings) console.log(`  ⚠ ${w}`);
if (errors.length) {
  console.error(`\n✖ ${errors.length} خطا:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✔ همه‌ی بررسی‌ها پاس شد (${warnings.length} هشدار)`);
