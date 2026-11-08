export * from 'three';
export const requests = [];

/** Hold texture completion explicitly to test slow loading and the first rendered frame. */
export class TextureLoader {
  load(url, resolve, _progress, reject) { requests.push({ url, resolve, reject }); }
}
