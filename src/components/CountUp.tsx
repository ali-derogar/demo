import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useMotionValue, useReducedMotion } from 'motion/react';
import { faCompact } from '../lib/fa';

interface Props {
  to: number;
  prefix?: string;
  /** متن کامل برای صفحه‌خوان (مثلاً «۹ نمونه‌کار») */
  srLabel: string;
}

/** شمارنده‌ای که در دید فعال می‌شود؛ گره‌ی زنده aria-hidden و مقدار نهایی برای sr-only */
export function CountUp({ to, prefix = '', srLabel }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(to);

  useEffect(() => {
    if (reduced) {
      setDisplay(to);
      return;
    }
    if (!inView) return;
    const controls = animate(mv, to, {
      duration: 1.4,
      ease: [0.22, 0.61, 0.36, 1],
      onUpdate: (value) => setDisplay(value),
    });
    return () => controls.stop();
  }, [inView, reduced, to, mv]);

  return (
    <>
      <span ref={ref} className="countup" aria-hidden="true">
        {prefix}
        {faCompact(display)}
      </span>
      <span className="sr-only">{srLabel}</span>
    </>
  );
}
