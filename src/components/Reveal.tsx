import { type ReactNode } from 'react';
import { m, useReducedMotion } from 'motion/react';

const MAP = { div: m.div, li: m.li, section: m.section, span: m.span, p: m.p, h2: m.h2 } as const;
type Tag = keyof typeof MAP;

interface Props {
  children: ReactNode;
  as?: Tag;
  delay?: number;
  y?: number;
  amount?: number;
  className?: string;
}

/** تنها پری‌میتیو ریوال صفحه؛ روی «کاهش حرکت» بدون انیمیشن رندر می‌شود */
export function Reveal({ children, as = 'div', delay = 0, y = 26, amount = 0.2, className }: Props) {
  const reduced = useReducedMotion();

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  const Comp = MAP[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.6, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}
