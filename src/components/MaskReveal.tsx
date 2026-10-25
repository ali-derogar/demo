import { useRef, type ReactNode } from 'react';
import { m, useInView, useReducedMotion } from 'motion/react';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** 'load' برای هیرو (بلافاصله) و 'view' برای بخش‌های پایین‌صفحه (با ورود به دید) */
  when?: 'load' | 'view';
}

/**
 * تیتر با پرده‌ی متحرک: متن از زیر پرده بیرون می‌آید.
 * روی «کاهش حرکت» متن بدون انیمیشن و کاملاً دیده می‌شود.
 */
export function MaskLine({ children, className, delay = 0, when = 'view' }: Props) {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLSpanElement>(null);
  // whileInView اینجا کار نمی‌کند: هدفِ ناظر همان spanِ جابه‌شده است که داخل
  // پرده‌ی overflow:hidden خودش کاملاً بریده می‌شود، پس هرگز «دیده» نمی‌شود.
  const inView = useInView(wrapRef, { once: true, amount: 0.6 });
  const classes = `v2-mask${className ? ` ${className}` : ''}`;
  if (reduced) return <span className={classes}>{children}</span>;

  const shown = when === 'load' || inView;

  return (
    <span className={classes} ref={when === 'load' ? undefined : wrapRef}>
      <m.span
        initial={{ y: '115%' }}
        animate={{ y: shown ? 0 : '115%' }}
        transition={{ duration: 1, delay, ease: [0.22, 0.61, 0.36, 1] }}
      >
        {children}
      </m.span>
    </span>
  );
}
