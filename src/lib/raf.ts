/**
 * One frame loop for scroll, the scene and cursor. Visible animations run at
 * display cadence; hidden documents suspend the loop entirely.
 */
type RafCb = (time: number, delta: number) => void;
type ResizeCb = () => void;
const rafSubs = new Set<RafCb>();
const resizeSubs = new Set<ResizeCb>();
let rafId = 0;
let running = false;
let lastTime = 0;

export interface PointerState {
  x: number; y: number; nx: number; ny: number; active: boolean;
}
const pointer: PointerState = { x: 0, y: 0, nx: 0, ny: 0, active: false };

function loop(time: number) {
  if (!running) return;
  const delta = Math.min(time - lastTime, 64);
  lastTime = time;
  rafSubs.forEach((cb) => cb(time, delta));
  if (running) rafId = requestAnimationFrame(loop);
}
function start() {
  if (running || rafSubs.size === 0 || document.hidden) return;
  running = true;
  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);
}
function stop() {
  running = false;
  cancelAnimationFrame(rafId);
  rafId = 0;
}
export function subscribeRaf(cb: RafCb): () => void {
  rafSubs.add(cb);
  start();
  return () => {
    rafSubs.delete(cb);
    if (rafSubs.size === 0) stop();
  };
}
export function onResize(cb: ResizeCb): () => void {
  resizeSubs.add(cb);
  return () => { resizeSubs.delete(cb); };
}
export function getPointer(): PointerState { return pointer; }

if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (event: PointerEvent) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.nx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ny = -((event.clientY / window.innerHeight) * 2 - 1);
    pointer.active = event.pointerType !== 'touch';
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointer.active = false; });
  document.addEventListener('visibilitychange', () => {
    pointer.active = false;
    if (document.hidden) stop();
    else start();
  });
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => resizeSubs.forEach((cb) => cb()), 150);
  }, { passive: true });
}
