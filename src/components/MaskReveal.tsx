import { type ReactNode } from 'react';
import { m, useReducedMotion } from 'motion/react';

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
  const classes = `v2-mask${className ? ` ${className}` : ''}`;
  if (reduced) return <span className={classes}>{children}</span>;

  const motionProps =
    when === 'load'
      ? { initial: { y: '115%' }, animate: { y: 0 } }
      : { initial: { y: '115%' }, whileInView: { y: 0 }, viewport: { once: true, amount: 0.6 } };

  return (
    <span className={classes}>
      <m.span {...motionProps} transition={{ duration: 1, delay, ease: [0.22, 0.61, 0.36, 1] }}>
        {children}
      </m.span>
    </span>
  );
}
