import { useEffect, useState } from 'react';
import { m, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { useMediaQuery } from '../lib/useMedia';
import { getPointer, subscribeRaf } from '../lib/raf';

type Variant = 'default' | 'link' | 'cta' | 'text';

/**
 * نشانگر سفارشی: نقطه‌ی دنبال‌کننده + حلقه‌ی فنردار.
 * فقط روی دستگاه با pointer دقیق و hover فعال می‌شود؛ روی لمسی هیچ رندر نمی‌کند
 * و نشانگر بومی مخفی نمی‌شود.
 */
export function CustomCursor() {
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)');
  const reduced = useReducedMotion();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 320, damping: 28, mass: 0.4 });
  const ringY = useSpring(y, { stiffness: 320, damping: 28, mass: 0.4 });
  const [variant, setVariant] = useState<Variant>('default');

  useEffect(() => {
    if (!fine) return;
    document.documentElement.classList.add('has-custom-cursor');
    const unsubscribe = subscribeRaf(() => {
      const pointer = getPointer();
      x.set(pointer.x);
      y.set(pointer.y);
    });
    return () => {
      unsubscribe();
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, [fine, x, y]);

  useEffect(() => {
    if (!fine) return;
    const onOver = (event: PointerEvent) => {
      const el = (event.target as Element | null)?.closest?.('[data-cursor]');
      const value = (el?.getAttribute('data-cursor') as Variant | null) ?? 'default';
      setVariant(value);
    };
    window.addEventListener('pointerover', onOver, { passive: true });
    return () => window.removeEventListener('pointerover', onOver);
  }, [fine]);

  if (!fine) return null;

  return (
    <>
      <m.span className="cursor cursor--dot" style={{ x, y }} aria-hidden="true" />
      {!reduced && (
        <m.span
          className="cursor cursor--ring"
          data-variant={variant}
          style={{ x: ringX, y: ringY }}
          aria-hidden="true"
        />
      )}
    </>
  );
}
