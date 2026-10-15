import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
const dir = 'public/demos/nabz/assets/img';
const files = (await readdir(dir)).filter((f) => f.endsWith('.webp')).sort();
const CW = 320, CH = 220, LAB = 26, COLS = 4;
const rows = Math.ceil(files.length / COLS);
const cells = [];
for (const f of files) {
  const img = sharp(`${dir}/${f}`).resize({ width: CW, height: CH, fit: 'cover' }).png();
  const svg = Buffer.from(`<svg width="${CW}" height="${LAB}"><rect width="${CW}" height="${LAB}" fill="#111"/><text x="6" y="18" font-family="monospace" font-size="14" fill="#fff">${f.replace('.webp', '')}</text></svg>`);
  const cell = await sharp({ create: { width: CW, height: CH + LAB, channels: 3, background: '#222' } })
    .composite([{ input: await img.toBuffer(), top: 0, left: 0 }, { input: svg, top: CH, left: 0 }])
    .png().toBuffer();
  cells.push(cell);
}
const canvas = sharp({ create: { width: COLS * CW, height: rows * (CH + LAB), channels: 3, background: '#000' } });
canvas.composite(cells.map((b, i) => ({ input: b, left: (i % COLS) * CW, top: Math.floor(i / COLS) * (CH + LAB) })))
  .png().toFile('/tmp/nabz-sheet.png').then(() => console.log('sheet ok', files.length));
