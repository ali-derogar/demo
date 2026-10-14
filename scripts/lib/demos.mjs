/**
 * فهرست دموها را از ثبت پروژه‌ها (`src/data/projects.ts`) می‌خواند،
 * تا افزودن دموی تازه سه اسکریپت بررسی را ویرایشی نکند.
 */
import { readFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export async function demoIds(root = ROOT) {
  const text = await readFile(join(root, 'src', 'data', 'projects.ts'), 'utf8');
  return [...text.matchAll(/^\s+id:\s*'([^']+)'/gm)].map((m) => m[1]);
}
