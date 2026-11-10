import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { mkdir, copyFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const decoder = new URL('public/demos/vector/assets/reference/draco/', root);
await mkdir(decoder, { recursive: true });
for (const file of ['draco_decoder.js', 'draco_decoder.wasm', 'draco_wasm_wrapper.js']) await copyFile(new URL('node_modules/three/examples/jsm/libs/draco/gltf/' + file, root), new URL(file, decoder));
await build({ entryPoints: [fileURLToPath(new URL('src/demos/vector/scene.ts', root))], outfile: fileURLToPath(new URL('public/demos/vector/scene.js', root)), bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none' });
