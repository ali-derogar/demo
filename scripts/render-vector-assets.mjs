/** Asset renderer, not a browser screenshot. Uses original geometry, UVs and baked maps. */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { PerspectiveCamera, Texture, Vector4, DoubleSide } from 'three';
import { source } from './tests/helpers.mjs';
import { decodeReference } from './lib/vector-assets.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), base = join(root, 'public/demos/vector/assets'), ref = join(base, 'reference');
const { buildOverview, buildRoom, buildDetail } = await source('src/demos/vector/scene.ts');
const { overviewMaps, roomMaps, detailMaps, capsules } = await source('src/demos/vector/studio.ts');
const images = new Map();
async function mapsFor(paths) {
  const result = {};
  for (const [key, path] of Object.entries(paths)) {
    const file = join(ref, path), texture = new Texture(); texture.name = path; texture.flipY = false;
    if (!images.has(path)) images.set(path, await sharp(file).resize({ width: 2048, withoutEnlargement: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true }));
    result[key] = texture;
  }
  return result;
}
async function render(world, camera, width, height, bg) {
  const output = Buffer.alloc(width * height * 4), zbuffer = new Float32Array(width * height).fill(Infinity);
  for (let i = 0; i < width * height; i++) { output[i * 4] = bg[0]; output[i * 4 + 1] = bg[1]; output[i * 4 + 2] = bg[2]; output[i * 4 + 3] = 255; }
  camera.aspect = width / height; camera.updateProjectionMatrix(); camera.updateMatrixWorld(); world.updateMatrixWorld(true);
  world.traverse((object) => {
    if (!object.isMesh || !object.visible) return;
    const geometry = object.geometry, positions = geometry.attributes.position, uv = geometry.attributes.uv, index = geometry.index;
    const map = images.get(object.material.map?.name); if (!map || !uv) return;
    const projected = Array.from({ length: positions.count }, (_, i) => {
      const p = new Vector4(positions.getX(i), positions.getY(i), positions.getZ(i), 1).applyMatrix4(object.matrixWorld).applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);
      return { x: (p.x / p.w * .5 + .5) * width, y: (.5 - p.y / p.w * .5) * height, z: p.z / p.w, w: 1 / p.w, u: uv.getX(i), v: uv.getY(i) };
    });
    for (let i = 0; i < (index?.count ?? positions.count); i += 3) {
      const [a, b, c] = [0, 1, 2].map((n) => projected[index ? index.getX(i + n) : i + n]);
      if (a.w <= 0 || b.w <= 0 || c.w <= 0) continue;
      const area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (Math.abs(area) < .000001 || (object.material.side !== DoubleSide && area > 0)) continue;
      const left = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x))), right = Math.min(width - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
      const top = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y))), bottom = Math.min(height - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
      for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
        const px = x + .5, py = y + .5;
        const wa = ((b.x - px) * (c.y - py) - (b.y - py) * (c.x - px)) / area;
        const wb = ((c.x - px) * (a.y - py) - (c.y - py) * (a.x - px)) / area, wc = 1 - wa - wb;
        if (wa < 0 || wb < 0 || wc < 0) continue;
        const z = wa * a.z + wb * b.z + wc * c.z, out = y * width + x; if (z >= zbuffer[out] || z < -1 || z > 1) continue;
        const sum = wa * a.w + wb * b.w + wc * c.w;
        const u = Math.max(0, Math.min(.999999, (wa * a.u * a.w + wb * b.u * b.w + wc * c.u * c.w) / sum));
        const v = Math.max(0, Math.min(.999999, (wa * a.v * a.w + wb * b.v * b.w + wc * c.v * c.w) / sum));
        const source = (Math.floor(v * map.info.height) * map.info.width + Math.floor(u * map.info.width)) * 4;
        output[out * 4] = map.data[source]; output[out * 4 + 1] = map.data[source + 1]; output[out * 4 + 2] = map.data[source + 2]; zbuffer[out] = z;
      }
    }
  });
  return sharp(output, { raw: { width, height, channels: 4 } }).webp({ quality: 88 }).toBuffer();
}
const nodes = await decodeReference(join(ref, 'models/main/MainStudio.glb')), textures = await mapsFor(overviewMaps), overview = buildOverview(nodes, textures);
const camera = new PerspectiveCamera(30, 1.5, .01, 100); camera.position.set(0, .7, 3); camera.lookAt(0, .7, 0);
const records = [];
async function save(name, data, sources) {
  await writeFile(join(base, 'img', name + '.webp'), data);
  records.push({ file: 'img/' + name + '.webp', title: 'VECTOR reference studio: ' + name, artist: 'Ali Sanati / referenced Adidas experience; software asset render by VECTOR', license: 'Source rights not specified by publisher; reference study', source: 'https://github.com/Ali-Sanati/awwwards-adidas', derivedFrom: sources, generator: 'scripts/render-vector-assets.mjs' });
}
await save('hero-01', await render(overview.world, camera, 1536, 1024, [60, 60, 60]), ['models/main/MainStudio.glb', ...Object.values(overviewMaps)]);
for (const [index, capsule] of capsules.entries()) {
  overview.shirts.forEach((shirt, n) => { shirt.visible = index === n; }); overview.environment.visible = false;
  const shirt = overview.shirts[index]; shirt.position.set(0, .7, 0); shirt.rotation.y = .18;
  camera.position.set(0, .75, 1.8); camera.lookAt(0, .75, 0);
  await save(capsule.product, await render(overview.world, camera, 900, 900, [232, 230, 224]), ['models/main/MainStudio.glb', overviewMaps[capsule.theme + 'Shirt']]);
}
const detailNodes = await decodeReference(join(ref, 'models/ShirtScrolling.glb'));
for (const theme of ['white', 'sport', 'gray']) {
  const filename = theme[0].toUpperCase() + theme.slice(1), roomNodes = await decodeReference(join(ref, `models/${theme}/${filename}Studio.glb`));
  const room = buildRoom(theme, roomNodes, await mapsFor(roomMaps[theme]));
  camera.position.set(0, .7, 3); camera.lookAt(0, .7, 0);
  await save('room-' + theme, await render(room.world, camera, 1440, 960, [50, 50, 50]), [`models/${theme}/${filename}Studio.glb`, ...Object.values(roomMaps[theme])]);
  const detail = buildDetail(theme, detailNodes, await mapsFor(detailMaps[theme])); detail.world.position.y = .7; detail.world.rotation.y = -Math.PI / 6;
  await save('detail-' + theme, await render(detail.world, camera, 1440, 960, [50, 50, 50]), ['models/ShirtScrolling.glb', ...Object.values(detailMaps[theme])]);
  const ffmpeg = process.env.VECTOR_FFMPEG_BIN || 'ffmpeg';
  const result = spawnSync(ffmpeg, ['-v', 'error', '-ss', '0.5', '-i', join(ref, `textures/${theme}/third/adidas.mp4`), '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], { maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0) throw new Error('Film poster needs ffmpeg: ' + (result.error?.message || result.stderr?.toString()));
  await save('film-' + theme, await sharp(result.stdout).resize(1200).webp({ quality: 85 }).toBuffer(), [`textures/${theme}/third/adidas.mp4`]);
}
const previous = JSON.parse(await readFile(join(base, 'ATTRIBUTION.json'), 'utf8')), updated = previous.filter((row) => !records.some((r) => r.file === row.file));
await writeFile(join(base, 'ATTRIBUTION.json'), JSON.stringify([...updated, ...records], null, 2) + '\n');
console.log('Rendered', records.length, 'real asset previews; not browser screenshots.');
