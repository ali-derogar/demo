import { useEffect } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from 'motion/react';
import { subscribeRaf } from './raf';

let instance: Lenis | null = null;
export function getLenis(): Lenis | null { return instance; }

function absoluteTop(element: HTMLElement): number {
  const size = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-size')) || 84;
  return Math.max(0, element.getBoundingClientRect().top + window.scrollY - size - 16);
}

export function scrollToSection(element: HTMLElement): void {
  const top = absoluteTop(element);
  if (instance) instance.scrollTo(top, { immediate: true });
  else window.scrollTo({ top, behavior: 'instant' });
}

/** Native touch scrolling; wheel smoothing and anchors share the scene's RAF. */
export function useSmoothScroll(): void {
  const reduced = useReducedMotion();
  useEffect(() => {
    const smoothWheel = !reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const lenis = smoothWheel ? new Lenis({ autoRaf: false, duration: 1.05, smoothWheel: true, syncTouch: false }) : null;
    instance = lenis;
    const unsubscribe = lenis ? subscribeRaf((time) => lenis.raf(time)) : () => {};
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';

    const focusTarget = (element: HTMLElement) => {
      if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '-1');
      element.focus({ preventScroll: true });
    };
    const navigate = (element: HTMLElement, immediate: boolean, focus: boolean) => {
      const top = absoluteTop(element);
      if (lenis) {
        lenis.scrollTo(top, {
          immediate, duration: 1.1,
          onComplete: () => { if (focus) focusTarget(element); },
        });
      } else {
        window.scrollTo({ top, behavior: immediate ? 'instant' : 'smooth' });
        if (focus) focusTarget(element);
      }
    };
    const fromLocation = () => {
      const id = window.location.hash.slice(1) || 'home';
      const element = document.getElementById(id);
      if (element) navigate(element, true, false);
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
      const href = anchor.getAttribute('href') ?? '';
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      event.preventDefault();
      if (location.hash !== href) history.pushState(null, '', href);
      navigate(target, !!reduced, true);
    };
    document.addEventListener('click', onClick);
    window.addEventListener('popstate', fromLocation);
    window.addEventListener('hashchange', fromLocation);

    // Reserve image dimensions in markup and wait for font metrics before
    // resolving an initial deep link. A disposed StrictMode effect does nothing.
    let disposed = false;
    const initialHash = window.location.hash;
    void document.fonts.ready.then(() => {
      if (!disposed && initialHash && window.location.hash === initialHash) fromLocation();
    });
    return () => {
      disposed = true;
      document.removeEventListener('click', onClick);
      window.removeEventListener('popstate', fromLocation);
      window.removeEventListener('hashchange', fromLocation);
      history.scrollRestoration = previousRestoration;
      unsubscribe();
      lenis?.destroy();
      instance = null;
    };
  }, [reduced]);
}
