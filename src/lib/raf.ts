/**
 * یک حلقه‌ی requestAnimationFrame مشترک برای کل صفحه + تک‌منبع وضعیت pointer/scroll.
 * همه‌ی افکت‌ها (پس‌زمینه، ذرات، نشانگر، پارالاکس) فقط از همین‌جا subscribe می‌کنند
 * تا صفحه یک rAF و یک سری listener داشته باشد.
 */

type RafCb = (time: number, delta: number) => void;
type ResizeCb = () => void;

const rafSubs = new Set<RafCb>();
const resizeSubs = new Set<ResizeCb>();

let rafId = 0;
let running = false;
let lastTime = 0;
let lastActivity = 0;

const IDLE_MS = 2000;
const IDLE_INTERVAL = 1000 / 20;

export interface PointerState {
  x: number;
  y: number;
  /** مختصات نرمال‌شده‌ی [-1, 1] با محور Y رو به بالا؛ برای شیدر */
  nx: number;
  ny: number;
  active: boolean;
}

const pointer: PointerState = { x: 0, y: 0, nx: 0, ny: 0, active: false };

function markActivity() {
  lastActivity = performance.now();
  if (!running) start();
}

function loop(time: number) {
  if (!running) return;
  const delta = time - lastTime;
  const idle = time - lastActivity > IDLE_MS;
  if (idle && delta < IDLE_INTERVAL) {
    rafId = requestAnimationFrame(loop);
    return;
  }
  lastTime = time;
  rafSubs.forEach((cb) => cb(time, delta));
  rafId = requestAnimationFrame(loop);
}

function start() {
  if (running || rafSubs.size === 0) return;
  running = true;
  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);
}

function stop() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
}

/** عضویت در حلقه؛ تابع برگشتی برای لغو عضویت */
export function subscribeRaf(cb: RafCb): () => void {
  rafSubs.add(cb);
  markActivity();
  start();
  return () => {
    rafSubs.delete(cb);
    if (rafSubs.size === 0) stop();
  };
}

/** عضویت در رویداد resize (debounce شده) */
export function onResize(cb: ResizeCb): () => void {
  resizeSubs.add(cb);
  return () => {
    resizeSubs.delete(cb);
  };
}

export function getPointer(): PointerState {
  return pointer;
}

if (typeof window !== 'undefined') {
  const onPointerMove = (event: PointerEvent) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.nx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ny = -((event.clientY / window.innerHeight) * 2 - 1);
    pointer.active = true;
    markActivity();
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', markActivity, { passive: true });
  window.addEventListener('scroll', markActivity, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (rafSubs.size) start();
  });

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    markActivity();
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => resizeSubs.forEach((cb) => cb()), 150);
  });
}
