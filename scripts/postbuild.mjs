#!/usr/bin/env node
/**
 * بررسی خروجی build: وجود چهار دمو، تصاویر پیش‌نمایش و سلامت فایل‌ها.
 */
import { readFile, access, stat, readdir } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const DEMOS = ['fashion', 'sports', 'cars', 'store'];
const PREVIEW_SLOTS = DEMOS;

const problems = [];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function countImages(dir) {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) total += await countImages(join(dir, entry.name));
    else if (/\.(webp|jpe?g|png|avif)$/i.test(entry.name)) total += 1;
  }
  return total;
}

// ۱) صفحه‌ی گالری
if (!(await exists(join(DIST, 'index.html')))) problems.push('dist/index.html یافت نشد');

// ۲) هر چهار دمو باید index.html داشته باشند
const demoReport = [];
for (const slug of DEMOS) {
  const dir = join(DIST, 'demos', slug);
  if (!(await exists(join(dir, 'index.html')))) {
    problems.push(`dist/demos/${slug}/index.html وجود ندارد`);
    continue;
  }
  const html = await readFile(join(dir, 'index.html'), 'utf8');
  const images = await countImages(join(dir, 'assets'));
  if (!/<html[^>]*\blang=["']fa["']/i.test(html)) problems.push(`${slug}: lang="fa" ندارد`);
  if (!/<html[^>]*\bdir=["']rtl["']/i.test(html)) problems.push(`${slug}: dir="rtl" ندارد`);
  if (/github\.com|github|گیت‌هاب/i.test(html)) problems.push(`${slug}: نشانی گیت‌هاب در HTML عمومی است`);
  if (/https?:\/\/(?!fonts\.)[^"')\s]*\.(jpe?g|png|webp|avif)/i.test(html))
    problems.push(`${slug}: تصویر دوربردی (URL بیرونی) در HTML استفاده شده`);
  demoReport.push({ slug, images });
}

// ۳) تصاویر پیش‌نمایش گالری
for (const slug of PREVIEW_SLOTS) {
  const file = join(DIST, 'images', 'previews', `${slug}.webp`);
  if (!(await exists(file))) {
    problems.push(`پیش‌نمایش dist/images/previews/${slug}.webp وجود ندارد`);
    continue;
  }
  const { size } = await stat(file);
  if (size < 4000) problems.push(`پیش‌نمایش ${slug}.webp غیرمنطقی کوچک است (${size}B)`);
}

console.log('\n── خلاصه‌ی build ──');
for (const item of demoReport) console.log(`  ✔ /demos/${item.slug}/  (${item.images} تصویر محلی)`);

if (problems.length) {
  console.error('\n✖ مشکلات:');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log('  ✔ همه‌ی بررسی‌های ساختاری پاس شد\n');
