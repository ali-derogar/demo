import { type ReactNode } from 'react';
import { m, useReducedMotion } from 'motion/react';

const MAP = {
  div: m.div,
  li: m.li,
  section: m.section,
  span: m.span,
  p: m.p,
  h2: m.h2,
  nav: m.nav,
} as const;
type Tag = keyof typeof MAP;

type From = 'up' | 'side' | 'fade' | 'scale';

/** امضاهای ورود؛ 'up' همان فرمولِ همیشگی است و بقیه فقط زاویه‌ی ورود را عوض می‌کنند */
const OFFSETS: Record<From, (y: number) => { initial: Record<string, number>; animate: Record<string, number> }> = {
  up: (y) => ({ initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 } }),
  // در RTL از ابتدای خط (راست) می‌آید؛ هم‌جهتِ فلشِ ردیف‌ها
  side: () => ({ initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 } }),
  fade: () => ({ initial: { opacity: 0 }, animate: { opacity: 1 } }),
  scale: () => ({ initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 } }),
};

interface Props {
  children: ReactNode;
  as?: Tag;
  delay?: number;
  y?: number;
  amount?: number;
  className?: string;
  from?: From;
  label?: string;
}

/** تنها پری‌میتیو ریوال صفحه؛ روی «کاهش حرکت» بدون انیمیشن رندر می‌شود */
export function Reveal({ children, as = 'div', delay = 0, y = 26, amount = 0.2, className, from = 'up', label }: Props) {
  const reduced = useReducedMotion();

  if (reduced) {
    const Plain = as;
    return (
      <Plain className={className} aria-label={label}>
        {children}
      </Plain>
    );
  }

  const Comp = MAP[as];
  const { initial, animate } = OFFSETS[from](y);
  return (
    <Comp
      className={className}
      aria-label={label}
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.6, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}
