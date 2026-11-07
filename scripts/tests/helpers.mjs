import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';
import { fileURLToPath } from 'node:url';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { rmSync } from 'node:fs';

let serial = 0;
const cacheRoot = new URL('../.cache/', import.meta.url);
await mkdir(cacheRoot, { recursive: true });
const cache = await mkdtemp(fileURLToPath(new URL('test-', cacheRoot)));
process.once('exit', () => rmSync(cache, { recursive: true, force: true }));
export async function source(path, overrides = {}) {
  const result = await build({
    entryPoints: [fileURLToPath(new URL(`../../${path}`, import.meta.url))],
    bundle: true, write: false, format: 'esm', platform: 'node', jsx: 'automatic',
    loader: { '.css': 'empty' },
    plugins: [{ name: 'external-packages', setup(builder) {
      builder.onResolve({ filter: /^[^./]/ }, (args) => ({ path: overrides[args.path] ?? import.meta.resolve(args.path), external: true }));
    } }],
  });
  const file = `${cache}/${++serial}.mjs`;
  await writeFile(file, result.outputFiles[0].text);
  return import(file);
}

/** Simulated layout, not a browser or a visual/FPS test. React handlers are real. */
export async function environment({ hash = '#home', type = 'navigate', width = 390, height = 844, reduced = false, saved = {}, scroll = 0 } = {}) {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (error) => errors.push(error));
  const dom = new JSDOM('<!doctype html><html lang="fa" dir="rtl"><body><div id="root"></div></body></html>', {
    url: `http://localhost:5173/portfolio/?lang=fa${hash}`, pretendToBeVisual: true, virtualConsole, runScripts: 'outside-only',
  });
  const w = dom.window;
  const originals = new Map();
  function expose(key, value) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  for (const key of ['window', 'document', 'navigator', 'location', 'history', 'HTMLElement', 'HTMLDialogElement', 'HTMLCanvasElement', 'Element', 'SVGElement', 'Node', 'MouseEvent', 'Event', 'KeyboardEvent', 'PopStateEvent', 'CustomEvent']) expose(key, key === 'window' ? w : w[key]);
  expose('self', w);
  expose('IS_REACT_ACT_ENVIRONMENT', true);
  expose('getComputedStyle', w.getComputedStyle.bind(w));
  const frames = new Map();
  let frameId = 0;
  let time = performance.now();
  const raf = (callback) => { frames.set(++frameId, callback); return frameId; };
  const cancel = (id) => frames.delete(id);
  w.requestAnimationFrame = raf; w.cancelAnimationFrame = cancel;
  expose('requestAnimationFrame', raf); expose('cancelAnimationFrame', cancel);
  Object.defineProperties(w, {
    innerHeight: { value: height, configurable: true }, innerWidth: { value: width, configurable: true },
    scrollY: { get: () => scroll }, pageYOffset: { get: () => scroll },
  });
  w.scrollTo = (options, y) => { scroll = typeof options === 'number' ? (y ?? 0) : options.top ?? scroll; w.dispatchEvent(new w.Event('scroll')); };
  w.performance.getEntriesByType = () => [{ type }];
  w.history.replaceState(saved, '', w.location.href);
  const index = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
  const earlyScript = index.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (earlyScript) w.eval(earlyScript);
  const media = new Set();
  w.matchMedia = (query) => ({
    get matches() { return query.includes('prefers-reduced-motion') ? reduced : query.includes('max-width') && width < 768; },
    media: query, addEventListener(_, callback) { if (query.includes('prefers-reduced-motion')) media.add(callback); },
    removeEventListener(_, callback) { media.delete(callback); }, addListener() {}, removeListener() {},
  });
  class ResizeObserver { observe() {} unobserve() {} disconnect() {} }
  class IntersectionObserver { constructor(callback) { this.callback = callback; } observe(target) { this.callback([{ target, isIntersecting: true, intersectionRatio: 1 }]); } disconnect() {} unobserve() {} }
  for (const [key, value] of Object.entries({ ResizeObserver, IntersectionObserver })) { w[key] = value; expose(key, value); }
  let resolveFonts;
  Object.defineProperty(w.document, 'fonts', { value: { ready: new Promise((resolve) => { resolveFonts = resolve; }) } });
  w.HTMLCanvasElement.prototype.getContext = () => null;
  w.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  w.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  w.HTMLElement.prototype.setPointerCapture = function (id) { this.captureId = id; };
  w.HTMLElement.prototype.hasPointerCapture = function (id) { return this.captureId === id; };
  w.HTMLElement.prototype.releasePointerCapture = function () { this.captureId = -1; };
  const workTop = height * 1.65;
  Object.defineProperty(w.HTMLElement.prototype, 'clientWidth', { get() { return width; } });
  Object.defineProperty(w.HTMLElement.prototype, 'clientHeight', { get() { return height; } });
  Object.defineProperty(w.HTMLElement.prototype, 'offsetHeight', { get() {
    if (this.classList.contains('im-work-track')) return height + Number(this.style.getPropertyValue('--orbit-steps')) * height * .52;
    if (this.classList.contains('im-work--orbit')) return height;
    return 400;
  } });
  w.HTMLElement.prototype.getBoundingClientRect = function () {
    const top = this.id === 'demos' || this.classList.contains('im-work-track') ? workTop - scroll : this.id === 'home' || this.id === 'im-main' ? -scroll : 100;
    return { x: 0, y: top, top, left: 0, right: width, bottom: top + this.offsetHeight, width, height: this.offsetHeight };
  };
  w.HTMLElement.prototype.getClientRects = function () { return this.closest('[hidden]') ? [] : [this.getBoundingClientRect()]; };
  const previousError = console.error;
  console.error = (...args) => { if (!String(args[0]).includes('Error creating WebGL context')) previousError(...args); };
  return {
    w, errors, frames, workTop, q: (selector) => w.document.querySelector(selector),
    get scroll() { return scroll; },
    resolveFonts,
    setReduced(value) { reduced = value; media.forEach((callback) => callback({ matches: value })); },
    async settle() {
      await new Promise((resolve) => setTimeout(resolve, 25));
      for (let i = 0; i < 3; i++) { const batch = [...frames.values()]; frames.clear(); time = Math.max(time + 16, performance.now()); batch.forEach((callback) => callback(time)); }
    },
    cleanup() {
      console.error = previousError;
      dom.window.close();
      originals.forEach((descriptor, key) => descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]);
    },
  };
}
