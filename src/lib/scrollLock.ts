import { getLenis } from './useSmoothScroll';

const owners = new Set<symbol>();
let releaseLast: (() => void) | undefined;
export const isScrollLocked = () => owners.size > 0;

/** Shared ownership prevents closing an info panel from unlocking a project behind it. */
export function acquireScrollLock() {
  const token = Symbol('scroll-lock');
  if (!owners.size) {
    const body = document.body.style.overflow;
    const root = document.documentElement.style.overflow;
    document.body.style.overflow = document.documentElement.style.overflow = 'hidden';
    getLenis()?.stop();
    const allowed = (target: EventTarget | null) => !!(target as Element | null)?.closest?.('[data-scroll-lock-allow]');
    const prevent = (event: Event) => { if (!allowed(event.target)) event.preventDefault(); };
    const key = (event: KeyboardEvent) => {
      if ((event.target as Element | null)?.closest?.('input,textarea,select,button,[contenteditable="true"]') || allowed(event.target)) return;
      if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) event.preventDefault();
    };
    document.addEventListener('wheel', prevent, { passive: false });
    document.addEventListener('touchmove', prevent, { passive: false });
    document.addEventListener('keydown', key);
    releaseLast = () => {
      document.body.style.overflow = body; document.documentElement.style.overflow = root;
      document.removeEventListener('wheel', prevent); document.removeEventListener('touchmove', prevent); document.removeEventListener('keydown', key);
      getLenis()?.start();
    };
  }
  owners.add(token);
  return () => { if (!owners.delete(token)) return; if (!owners.size) { releaseLast?.(); releaseLast = undefined; } };
}
