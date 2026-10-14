#!/usr/bin/env node
/**
 * ابزار تصویر Wikimedia Commons
 *   node scripts/fetch-images.mjs search "متن جست‌وجو" [تعداد]
 *   node scripts/fetch-images.mjs build
 *
 * جست‌وجو گزینه‌های معتبر با مجوز آزاد را نشان می‌دهد؛ build فایل‌های
 * انتخاب‌شده در scripts/image-manifest.mjs را دانلود و اعتبارسنجی می‌کند.
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { searchCommons, imageInfo } from './lib/commons.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'namooneh-kade/1.0 (portfolio site; image download for local hosting)';

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function cmdSearch(query, limit = 12) {
  const rows = await searchCommons(query, { limit });
  if (!rows.length) {
    console.log('نتیجه‌ای یافت نشد.');
    return;
  }
  for (const row of rows) {
    console.log(`\n• ${row.title}`);
    console.log(`  mime=${row.mime}  license=${row.license}  artist=${(row.artist || '—').slice(0, 40)}`);
    console.log(`  desc=${(row.description || '').replace(/\s+/g, ' ').slice(0, 150)}`);
  }
}

async function cmdBuild(manifest) {
  const report = [];
  for (const slot of manifest) {
    const target = join(ROOT, slot.out);
    const info = await imageInfo(slot.title, slot.width ?? 1600);
    if (!info?.thumburl) {
      console.error(`✖ ${slot.title}: اطلاعات تصویر پیدا نشد`);
      process.exitCode = 1;
      continue;
    }
    const raw = await download(info.thumburl);
    const image = sharp(raw, { failOn: 'error' }).rotate();
    const meta = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(meta.format)) {
      console.error(`✖ ${slot.out}: فرمت نامعتبر (${meta.format})`);
      process.exitCode = 1;
      continue;
    }
    await mkdir(dirname(target), { recursive: true });
    const pipeline = image.resize({
      width: slot.width ?? 1600,
      height: slot.height,
      fit: slot.cover ? 'cover' : 'inside',
      withoutEnlargement: true,
    });
    const quality = slot.quality ?? 82;
    const buffer = await (slot.format === 'jpeg' ? pipeline.jpeg({ quality, progressive: true }) : pipeline.webp({ quality, effort: 6 }))
      .toBuffer();
    await writeFile(target, buffer);
    report.push({
      out: slot.out,
      title: info.title,
      license: info.license,
      artist: info.artist,
      source: info.descriptionUrl,
      bytes: buffer.length,
      px: `${Math.round(buffer.length / 1024)}KB`,
    });
    console.log(`✔ ${slot.out}  ${Math.round(buffer.length / 1024)}KB  ${info.license}`);
  }

  const attributionFile = join(ROOT, 'public/images/ATTRIBUTION.json');
  await mkdir(dirname(attributionFile), { recursive: true });
  let merged = [];
  try {
    merged = JSON.parse(await readFile(attributionFile, 'utf8'));
  } catch {
    /* اولین اجرا */
  }
  for (const item of report) {
    const i = merged.findIndex((m) => m.out === item.out);
    if (i >= 0) merged[i] = item;
    else merged.push(item);
  }
  await writeFile(attributionFile, JSON.stringify(merged, null, 2));
  console.log(`\n${report.length} تصویر؛ attribution → ${attributionFile.replace(ROOT, '.')}`);
}

const [command, ...args] = process.argv.slice(2);
if (command === 'search') {
  const trailing = Number(args.at(-1));
  const limit = Number.isFinite(trailing) && trailing > 0 && trailing <= 20 ? args.pop() : 12;
  await cmdSearch(args.join(' '), Number(limit));
} else if (command === 'build') {
  const { manifest } = await import('./image-manifest.mjs');
  await cmdBuild(manifest);
} else {
  console.log('usage: node scripts/fetch-images.mjs <search|build> [...]');
}
