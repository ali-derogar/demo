import { useEffect, useRef } from 'react';
import { useMediaQuery, useReducedMotionPreference } from '../lib/useMedia';
import { getPointer, subscribeRaf } from '../lib/raf';

/** Pointer decoration uses the same frame loop as Lenis and the scene. */
export function CustomCursor() {
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)');
  const reduced = useReducedMotionPreference();
  const enabled = fine && !reduced;
  const dotRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!enabled || !dot || !ring) return;
    let x = 0;
    let y = 0;
    let visible = false;
    const unsubscribe = subscribeRaf((_time, delta) => {
      const pointer = getPointer();
      if (visible !== pointer.active) {
        visible = pointer.active;
        document.documentElement.classList.toggle('has-custom-cursor', visible);
        dot.style.opacity = ring.style.opacity = visible ? '1' : '0';
        x = pointer.x;
        y = pointer.y;
      }
      if (!visible) return;
      const easing = 1 - Math.exp(-delta / 70);
      x += (pointer.x - x) * easing;
      y += (pointer.y - y) * easing;
      dot.style.transform = 'translate3d(' + pointer.x + 'px,' + pointer.y + 'px,0)';
      ring.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    });
    const onOver = (event: PointerEvent) => {
      const element = (event.target as Element | null)?.closest?.('[data-cursor]');
      ring.dataset.variant = element?.getAttribute('data-cursor') ?? 'default';
    };
    window.addEventListener('pointerover', onOver, { passive: true });
    return () => {
      unsubscribe();
      window.removeEventListener('pointerover', onOver);
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <span ref={dotRef} className="cursor cursor--dot" style={{ opacity: 0 }} aria-hidden="true" />
      <span ref={ringRef} className="cursor cursor--ring" data-variant="default" style={{ opacity: 0 }} aria-hidden="true" />
    </>
  );
}
