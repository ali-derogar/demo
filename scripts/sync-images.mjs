#!/usr/bin/env node
/**
 * ATTRIBUTION.json هر دمو را می‌خواند و دو چیز می‌سازد:
 *  ۱) public/images/ATTRIBUTION.json — فهرست کامل تصویرها با منبع و لایسنس
 *  ۲) scripts/image-manifest.mjs   — مانیفست بازسازی که `npm run fetch:images` با آن کار می‌کند
 *
 *  usage: node scripts/sync-images.mjs
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { demoIds } from './lib/demos.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEMOS = await demoIds(ROOT);
const rows = [];

for (const slug of DEMOS) {
  const path = join(ROOT, 'public', 'demos', slug, 'assets', 'ATTRIBUTION.json');
  let items = [];
  try {
    items = JSON.parse(await readFile(path, 'utf8'));
  } catch {
    console.warn(`  ⚠ ${slug}: ATTRIBUTION.json خوانده نشد`);
    continue;
  }
  for (const item of items) {
    const rel = String(item.file ?? item.out ?? '').replace(/^\.?\//, '');
    const localPath = rel.startsWith('public/') ? rel : join('public', 'demos', slug, 'assets', rel);
    const abs = join(ROOT, localPath);
    const meta = await sharp(abs).metadata().catch(() => null);
    rows.push({
      out: localPath,
      file: basename(localPath),
      demo: slug,
      title: item.title,
      artist: item.artist,
      license: item.license,
      source: item.source ?? item.descriptionUrl ?? '',
      width: meta?.width ?? null,
      height: meta?.height ?? null,
      bytes: meta?.size ?? null,
      format: meta?.format ?? null,
    });
  }
}

// تصاویر پیش‌نمایش گالری از تصویر آغازین همان دمو ساخته می‌شوند
for (const slug of DEMOS) {
  const abs = join(ROOT, 'public', 'images', 'previews', `${slug}.webp`);
  const meta = await sharp(abs).metadata().catch(() => null);
  if (!meta) continue;
  const heroRows = rows.filter((r) => r.demo === slug && /^hero/i.test(r.file));
  const source = heroRows.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
  rows.push({
    out: `public/images/previews/${slug}.webp`,
    file: `${slug}.webp`,
    demo: slug,
    title: `پیش‌نمایش گالری از ${source?.title ?? 'تصویر همان دمو'}`,
    artist: source?.artist ?? '—',
    license: source?.license ?? '—',
    source: source?.source ?? '',
    derivedFrom: source?.out ?? '',
    width: meta.width,
    height: meta.height,
    bytes: meta.size,
    format: meta.format,
  });
}

rows.sort((a, b) => a.out.localeCompare(b.out));
await writeFile(join(ROOT, 'public', 'images', 'ATTRIBUTION.json'), JSON.stringify(rows, null, 2) + '\n');

const manifest = `/**
 * این فایل با \`node scripts/sync-images.mjs\` از ATTRIBUTION.json هر دمو ساخته می‌شود.
 * برای بازسازی همه‌ی تصویرها: node scripts/fetch-images.mjs build
 * (توجه: ابعاد/کیفیت هر مقصد همان چیزی است که در مخزن موجود است.)
 */
export const manifest = ${JSON.stringify(rows.map((r) => ({ out: r.out, title: r.title, width: r.width, format: r.format === 'jpeg' ? 'jpeg' : 'webp', cover: true, quality: 80 })), null, 2)};
`;
await writeFile(join(ROOT, 'scripts', 'image-manifest.mjs'), manifest);

console.log(`${rows.length} تصویر → public/images/ATTRIBUTION.json و scripts/image-manifest.mjs`);
const licenses = {};
for (const r of rows) licenses[r.license ?? 'نامعلوم'] = (licenses[r.license ?? 'نامعلوم'] ?? 0) + 1;
for (const [license, count] of Object.entries(licenses)) console.log(`  ${license}: ${count}`);
