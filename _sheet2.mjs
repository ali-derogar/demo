import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
const dir = process.argv[2];
const out = process.argv[3] ?? '/tmp/sheet.png';
const cols = Number(process.argv[4] ?? 3);
const tileW = Number(process.argv[5] ?? 390);
const files = (await readdir(dir)).filter((f) => f.endsWith('.png')).sort();
const tiles = [];
for (const f of files) {
  const img = sharp(`${dir}/${f}`);
  const m = await img.metadata();
  const h = Math.round(m.height * (tileW / m.width));
  tiles.push({ f, buf: await img.resize(tileW, h, { fit: 'fill' }).png().toBuffer(), h });
}
const rows = Math.ceil(tiles.length / cols);
const rowH = Math.max(...tiles.map((t) => t.h));
const canvas = sharp({ create: { width: cols * tileW, height: rows * rowH, channels: 3, background: '#cccccc' } });
const comp = tiles.map((t, i) => ({ input: t.buf, left: (i % cols) * tileW, top: Math.floor(i / cols) * rowH }));
const img = canvas.composite(comp).jpeg({ quality: 84 });
await img.clone().toFile(out);
await img.clone().resize({ width: 1560, withoutEnlargement: false }).toFile(out.replace(/\.png$/, '-fit.jpg'));
console.log(JSON.stringify({ tiles: tiles.length, cols, rows, tileW, out }));
