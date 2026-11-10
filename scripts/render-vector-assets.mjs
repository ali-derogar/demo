/** Prepare supplied clothing, export browser GLBs and render matching posters. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { compressGarmentGLB } from './lib/compress-vector-glb.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = join(root, 'public/demos/vector/assets'), output = join(base, 'collection');
const cache = join(root, 'scripts/.cache/vector-imports'), renders = join(cache, 'renders');
await mkdir(output, { recursive: true });
if (!process.argv.includes('--convert-only')) {
  const extraction = spawnSync('python3', ['-c', `
from pathlib import Path
from zipfile import ZipFile
from shutil import copyfileobj
root=Path(${JSON.stringify(root)})
cache=root/'scripts/.cache/vector-imports'
sources={
 'Blender.zip':('hoodie', ['Blender/DG100024.blend','Blender/Read_Me.txt']),
 'OBJ.zip':('hoodie', ['OBJ/OBJ Multiple Objects/DG100024_diffuse_1001.png','OBJ/OBJ Multiple Objects/DG100024_normal_1001.png']),
 'Jacket+70_obj.zip':('jacket',None),
}
for archive,(folder,names) in sources.items():
 with ZipFile(root/'models'/archive) as z:
  for name in names or z.namelist():
   if name.endswith('/'): continue
   target=(cache/folder/Path(name).name).resolve()
   if not target.is_relative_to((cache/folder).resolve()): raise ValueError('Unsafe source path')
   target.parent.mkdir(parents=True,exist_ok=True)
   if not target.exists() or target.stat().st_size != z.getinfo(name).file_size:
    with z.open(name) as src,target.open('wb') as dst: copyfileobj(src,dst)
`], { cwd: root, encoding: 'utf8' });
  if (extraction.status !== 0) throw new Error('Supplied model archives could not be extracted: ' + extraction.stderr);
  const textures = join(cache, 'textures'); await mkdir(textures, { recursive: true });
  const { data, info } = await sharp(join(cache, 'hoodie/DG100024_diffuse_1001.png')).resize(2048, 2048).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const [theme, body, rib, ink] of [
    ['core', [214, 205, 185], [191, 181, 160], '#343b34'],
    ['drift', [79, 28, 44], [59, 20, 34], '#d8cdb6'],
  ]) {
    const pixels = Buffer.from(data);
    for (let i = 0; i < pixels.length; i += 3) {
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const color = b > r * 1.3 && b > g * 1.1 ? body : r > b * 1.5 && g > b * 1.3 ? rib : null;
      if (color) {
        const shade = color === body ? Math.min(1.12, Math.max(.65, b / 123)) : Math.min(1.12, Math.max(.65, r / 211));
        for (let c = 0; c < 3; c++) pixels[i + c] = Math.min(255, Math.round(color[c] * shade));
      }
    }
    const print = Buffer.from(`<svg width="2048" height="2048"><text x="612" y="1370" text-anchor="middle" fill="${ink}" font-family="sans-serif" font-weight="700" font-size="34" letter-spacing="5">VECTOR</text></svg>`);
    await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 3 } }).composite([{ input: print }]).jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toFile(join(textures, `hoodie-${theme}-color.jpg`));
  }
  await sharp(join(cache, 'hoodie/DG100024_normal_1001.png')).resize(4096, 4096).removeAlpha().jpeg({ quality: 96, chromaSubsampling: '4:4:4' }).toFile(join(textures, 'hoodie-normal.jpg'));
  for (const [source, target, size] of [
    ['uniformDiffuse.png', 'jacket-color.jpg', 2048], ['uniformNormal.png', 'jacket-normal.jpg', 4096],
    ['uniformRoughness.png', 'jacket-roughness.jpg', 2048], ['uniformMetal.png', 'jacket-metal.jpg', 1024],
  ]) await sharp(join(cache, 'jacket', source)).resize(size, size).removeAlpha().jpeg({ quality: 96, chromaSubsampling: '4:4:4' }).toFile(join(textures, target));
  const blender = process.env.VECTOR_BLENDER_BIN || join(root, 'scripts/.cache/blender-4.5.9-linux-x64/blender');
  const result = spawnSync(blender, ['--background', '--threads', '6', '--python-exit-code', '1', '--python', join(root, 'scripts/prepare-vector-models.py'), ...(process.argv.includes('--draft') ? ['--', '--draft'] : [])], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Supplied clothing preparation failed: ' + (result.error?.message || result.status));
  if (process.argv.includes('--draft')) process.exit(0);
}
await compressGarmentGLB(join(output, 'collection.glb'));
await compressGarmentGLB(join(output, 'lettering.glb'));
const images = {
  'hoodie-03': 'core-product', 'hoodie-01': 'drift-product', 'jacket-01': 'shell-product',
  'hero-01': 'hero-01', campaign: 'campaign',
  ...Object.fromEntries(['core', 'drift', 'shell'].flatMap((theme) => ['room', 'detail', 'film'].map((phase) => [phase + '-' + theme, phase + '-' + theme]))),
  ...Object.fromEntries(['core', 'drift', 'shell'].map((theme) => [theme + '-closeup', theme + '-closeup'])),
};
const records = [];
for (const [name, source] of Object.entries(images)) {
  await sharp(join(renders, source + '.png')).webp({ quality: 93, effort: 5 }).toFile(join(base, 'img', name + '.webp'));
  records.push({ file: 'img/' + name + '.webp', title: 'VECTOR collection / ' + name, artist: 'VECTOR art direction; user-supplied clothing models', origin: 'rendered', generator: 'scripts/prepare-vector-models.py', method: 'Cycles render of the same supplied garment meshes and PBR textures used by the live showroom', derivedFrom: ['collection/collection.glb'], sources: ['models/Blender.zip', 'models/OBJ.zip', 'models/Jacket+70_obj.zip'] });
}
const previous = JSON.parse(await readFile(join(base, 'ATTRIBUTION.json'), 'utf8'));
const current = previous.filter((row) => !records.some((r) => r.file === row.file) && !/^img\/(room|detail|film)-(white|sport|gray)\.webp$/.test(row.file));
await writeFile(join(base, 'ATTRIBUTION.json'), JSON.stringify([...current, ...records], null, 2) + '\n');
const files = [];
for (const file of ['collection.glb', 'lettering.glb']) {
  const bytes = await readFile(join(output, file));
  files.push({ file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
const sources = [];
for (const archive of ['Blender.zip', 'OBJ.zip', 'Jacket+70_obj.zip']) {
  const bytes = await readFile(join(root, 'models', archive));
  sources.push({ file: 'models/' + archive, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
await writeFile(join(output, 'ATTRIBUTION.json'), JSON.stringify({ title: 'VECTOR / CORE, DRIFT, SHELL', origin: 'user-supplied', generator: 'scripts/prepare-vector-models.py', nativeSource: 'design/vector/vector-collection.blend', license: 'Source archives supplied by the project owner; no additional redistribution license is asserted.', sources, designs: [{ node: 'CORE', source: 'DG100024', author: 'Digital Fashionwear (supplied Read_Me.txt)', colorway: 'bone' }, { node: 'DRIFT', source: 'DG100024', author: 'Digital Fashionwear (supplied Read_Me.txt)', colorway: 'oxblood' }, { node: 'SHELL', source: 'W-Jacket 70', author: 'Not named in supplied archive', colorway: 'charcoal fleece' }], files }, null, 2) + '\n');
console.log('Saved', records.length, 'matching collection renders and supplied model provenance.');
