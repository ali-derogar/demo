import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
await build({ entryPoints: [fileURLToPath(new URL('src/demos/vector/scene.ts', root))], outfile: fileURLToPath(new URL('public/demos/vector/scene.js', root)), bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none' });
