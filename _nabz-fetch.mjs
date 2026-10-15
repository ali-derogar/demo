#!/usr/bin/env node
/** دانلود تصویرهای دمو «نبض» از Wikimedia Commons (همان مسیر fetch-images.mjs) */
import { writeFile, mkdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { imageInfo } from '/home/darklord/Desktop/demo/scripts/lib/commons.mjs';

const ROOT = '/home/darklord/Desktop/demo';
const UA = 'namooneh-kade/1.0 (portfolio site; image download for local hosting)';
const sleep = (ms) => new Promise((d) => setTimeout(d, ms));

export const SLOTS = [
  { out: 'public/demos/nabz/assets/img/hero-01.webp', title: 'File:Pretty Lights at the Aragon Ballroom - 8 November 2013 - Light show.jpg', width: 1600 },
  { out: 'public/demos/nabz/assets/img/crowd-01.webp', title: 'File:Crowds at the Cornbury Music Festival - geograph.org.uk - 489442.jpg', width: 1200 },
  { out: 'public/demos/nabz/assets/img/crowd-02.webp', title: 'File:Deine Stimme Gegen Armut P8 concert Audience during show finale (535303487).jpg', width: 1200 },
  { out: 'public/demos/nabz/assets/img/venue-01.webp', title: 'File:Cricket Wireless Amphitheatre in Chula Vista.jpg', width: 1200 },
  { out: 'public/demos/nabz/assets/img/stage-laser.webp', title: 'File:Laser show at Reading.jpg', width: 1100 },
  { out: 'public/demos/nabz/assets/img/stage-shell.webp', title: 'File:Concert shell in Ciechocinek (Amphitheatre), Aleksandrów County, Kuyavian-Pomeranian Voivodeship, Poland, August 2022.jpg', width: 1100 },
  { out: 'public/demos/nabz/assets/img/stage-amphi.webp', title: 'File:North Island Credit Union Amphitheatre in 2024.jpg', width: 1100 },
  { out: 'public/demos/nabz/assets/img/stage-band.webp', title: 'File:Poparzeni Kawą Trzy, 62. Krajowy Festiwal Piosenki Polskiej w Opolu, 2025, KsP 146.jpg', width: 1100 },
  { out: 'public/demos/nabz/assets/img/artist-santur.webp', title: 'File:Santur Player @ Annecy (7898408658).jpg', width: 900 },
  { out: 'public/demos/nabz/assets/img/artist-setar2.webp', title: 'File:"An Iranian setar player in northern Iran-Canon Photography-Photogrspher Mostafa Meraji" 08.jpg', width: 900 },
  { out: 'public/demos/nabz/assets/img/artist-violin.webp', title: 'File:Violinist performing with The Grand Stars Orchestra.jpg', width: 900 },
  { out: 'public/demos/nabz/assets/img/artist-drum.webp', title: 'File:Drummer performing on stage during a live music concert at night with dynamic lighting effects.jpg', width: 900 },
  { out: 'public/demos/nabz/assets/img/artist-vocal.webp', title: 'File:Energetic live performance by a vocalist with a guitarist in the background at a concert in an outdoor venue during the night.jpg', width: 900 },
  { out: 'public/demos/nabz/assets/img/artist-keys.webp', title: 'File:DFC 5598 Close-up of a keyboardists hands playing a synthesizer under colorful stage lights during a live performance in Pattaya.jpg', width: 900 },
  { out: 'public/demos/nabz/assets/img/artist-dj.webp', title: "File:Vagator, Goa, India, DJ playing music on turntable.jpg", width: 900 },
  { out: 'public/demos/nabz/assets/img/artist-dj2.webp', title: 'File:DJ Don PePe at 2026 Montreux Jazz Festival 01.jpg', width: 900 },
  { out: 'public/demos/nabz/assets/img/artist-reggae.webp', title: 'File:Ijahman Levi - 24 Ostróda Reggae Festival 2025, Scena Główna na stadionie - Red Stage, KsP 11620111.jpg', width: 900 },
  { out: 'public/demos/nabz/assets/img/art-projection.webp', title: 'File:2023-05-06 11-46-51 ILCE-7C DSC16813 Kiri DxO.jpg', width: 1100 },
  { out: 'public/demos/nabz/assets/img/art-laser.webp', title: 'File:Berliner Dom, laser show.jpg', width: 1100 },
];

const only = process.argv.slice(2);
const report = [];
let known = [];
try { known = JSON.parse(await readFile('/tmp/nabz-images.json', 'utf8')); } catch { /* اولین اجرا */ }
for (const slot of SLOTS) {
  if (only.length && !only.some((o) => slot.out.includes(o))) continue;
  const target = join(ROOT, slot.out);
  const have = await stat(target).then(() => true).catch(() => false);
  if (have && known.some((k) => k.file === slot.out.replace('public/demos/nabz/assets/', ''))) { console.log(`= ${slot.out.split('/').pop()} تکمیل است`); continue; }
  await sleep(2500);
  let info = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try { info = await imageInfo(slot.title, slot.width); break; }
    catch (e) { console.log(`  … ${slot.out.split('/').pop()} شلوغ است (${e.message})، تلاش ${attempt + 1}`); await sleep(25000 * (attempt + 1)); }
  }
  if (!info?.thumburl) { console.error(`✖ ${slot.title}`); continue; }
  const file = slot.out.replace('public/demos/nabz/assets/', '');
  const base = { file, title: slot.title.replace(/^File:/, ''), artist: info.artist, license: info.license, source: info.descriptionUrl };
  if (have) {
    const m = await sharp(target).metadata();
    const kb = Math.round((await stat(target)).size / 1024);
    report.push({ ...base, px: `${m.width}x${m.height}`, kb });
    console.log(`= ${file.split('/').pop()}  ${m.width}x${m.height}  ${kb}KB  ${info.license}`);
    continue;
  }
  const res = await fetch(info.thumburl, { headers: { 'User-Agent': UA } });
  if (!res.ok) { console.error(`✖ HTTP ${res.status} ${slot.out}`); continue; }
  const raw = Buffer.from(await res.arrayBuffer());
  const image = sharp(raw, { failOn: 'error' }).rotate();
  const meta = await image.metadata();
  if (!['jpeg', 'png', 'webp'].includes(meta.format)) { console.error(`✖ format ${slot.out}`); continue; }
  await mkdir(dirname(target), { recursive: true });
  const buffer = await image.resize({ width: slot.width, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80, effort: 6 }).toBuffer();
  await writeFile(target, buffer);
  const out = { ...base, px: `${meta.width}x${meta.height}`, kb: Math.round(buffer.length / 1024) };
  report.push(out);
  console.log(`✔ ${slot.out.split('/').pop()}  ${out.px}  ${out.kb}KB  ${out.license}  ${out.artist.slice(0, 28)}`);
}
let merged = [];
try { merged = JSON.parse(await readFile('/tmp/nabz-images.json', 'utf8')); } catch { /* اولین اجرا */ }
for (const item of report) {
  const i = merged.findIndex((m) => m.file === item.file);
  if (i >= 0) merged[i] = item; else merged.push(item);
}
await writeFile('/tmp/nabz-images.json', JSON.stringify(merged, null, 2));
console.log(`\n${report.length} تازه؛ ${merged.length} کل`);
