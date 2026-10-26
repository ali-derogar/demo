import { useEffect } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from 'motion/react';
import { subscribeRaf } from './raf';

let instance: Lenis | null = null;

/** دسترسی به نمونه‌ی Lenis برای کامپوننت‌هایی مثل منوی موبایل (stop/start) */
export function getLenis(): Lenis | null {
  return instance;
}

function headerOffset(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-size');
  const size = Number.parseInt(raw, 10);
  return (Number.isFinite(size) ? size : 76) + 16;
}

/* هدف عددی داده می‌شود، نه المان: اگر المان بدهیم Lenis آفستِ هدر را دوبار
   کم می‌کند و سکشن ۹۲px پایین‌تر از جای خود می‌نشیند. */
function absoluteTop(el: HTMLElement): number {
  return Math.max(0, el.getBoundingClientRect().top + window.scrollY - headerOffset());
}

/** پرشِ فوری به یک سکشن با همان آفستِ هدر؛ برای «کاهش حرکت» به اسکرولِ بومی می‌افتد */
export function scrollToSection(el: HTMLElement): void {
  if (!instance) {
    el.scrollIntoView({ block: 'start' });
    return;
  }
  instance.scrollTo(absoluteTop(el), { immediate: true });
}

/**
 * اسکرول نرم با Lenis روی همان حلقه‌ی rAF مشترک.
 * روی «کاهش حرکت» اصلاً نصب نمی‌شود؛ پیمایش پیش‌فرض مرورگر + scroll-padding کافی است.
 */
export function useSmoothScroll(): void {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      autoRaf: false,
      duration: 1.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });
    instance = lenis;

    const unsubscribe = subscribeRaf((time) => lenis.raf(time));

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href') ?? '';
      if (href.length < 2) return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;

      event.preventDefault();
      lenis.start();
      lenis.scrollTo(absoluteTop(target), { duration: 1.2 });
      history.replaceState(null, '', href);
      // فرود دادن فوکوس روی سکشن برای کاربر کیبورد/صفحه‌خوان
      target.setAttribute('tabindex', '-1');
      window.setTimeout(() => target.focus({ preventScroll: true }), 450);
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      unsubscribe();
      lenis.destroy();
      instance = null;
    };
  }, [reduced]);
}
