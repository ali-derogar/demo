import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotionPreference } from '../lib/useMedia';
import { getLenis, scrollToSection } from '../lib/useSmoothScroll';
import type { PanelId } from './types';

export function panelFromHash(hash: string): PanelId | null {
  return hash === '#about' ? 'about' : hash === '#contact' ? 'contact' : null;
}

/** Hash routes retain the exact scroll position underneath modal panels. */
export function useSceneNavigation() {
  const [panel, setPanel] = useState<PanelId | null>(() => typeof window === 'undefined' ? null : panelFromHash(location.hash));
  const panelRef = useRef(panel);
  const initialized = useRef(false);
  const reduced = useReducedMotionPreference();

  useEffect(() => {
    let disposed = false;
    let restoreTimer = 0;
    const state = (): Record<string, unknown> => typeof history.state === 'object' && history.state ? history.state : {};
    const remember = () => history.replaceState({ ...state(), imScroll: window.scrollY }, '', location.href);
    const focus = (target: HTMLElement) => {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    const move = (hash: string, immediate: boolean, shouldFocus: boolean, savedY?: number) => {
      const target = document.getElementById(hash.slice(1) || 'home');
      const lenis = getLenis();
      lenis?.start();
      if (savedY !== undefined) {
        if (lenis) lenis.scrollTo(savedY, { immediate: true });
        else window.scrollTo({ top: savedY, behavior: 'instant' });
      } else if (target) {
        if (immediate || reduced) scrollToSection(target);
        else if (lenis) lenis.scrollTo(Math.max(0, target.getBoundingClientRect().top + window.scrollY), {
          duration: 1.15, onComplete: () => { if (shouldFocus) focus(target); },
        });
        else window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY), behavior: 'smooth' });
        if (shouldFocus && (immediate || reduced || !lenis)) focus(target);
      }
    };
    const synchronize = () => {
      const next = panelFromHash(location.hash);
      panelRef.current = next;
      setPanel(next);
      if (next) return;
      const snapshot = state().imScroll;
      const savedY = typeof snapshot === 'number' && Number.isFinite(snapshot) ? snapshot : undefined;
      window.clearTimeout(restoreTimer);
      const restore = () => move(location.hash || '#home', true, false, savedY);
      // popstate and hashchange may describe the same navigation. Coalesce them
      // after the dialog closes and after the browser handles its fragment.
      restoreTimer = window.setTimeout(restore, 0);
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
      const hash = anchor.getAttribute('href') ?? '';
      const next = panelFromHash(hash);
      if (!next && !document.getElementById(hash.slice(1))) return;
      event.preventDefault();
      const wasPanel = panelRef.current !== null;
      if (!wasPanel) remember();
      if (location.hash !== hash) history.pushState(next ? { imPanel: true } : {}, '', hash);
      panelRef.current = next;
      setPanel(next);
      if (!next) {
        window.clearTimeout(restoreTimer);
        const navigate = () => move(hash, !!reduced, true);
        if (wasPanel) restoreTimer = window.setTimeout(navigate, 0);
        else navigate();
      }
    };
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', synchronize);
    window.addEventListener('hashchange', synchronize);
    if (!initialized.current) {
      void document.fonts.ready.then(() => {
        if (!disposed && !initialized.current) {
          initialized.current = true;
          synchronize();
        }
      });
    }
    return () => {
      disposed = true;
      window.clearTimeout(restoreTimer);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', synchronize);
      window.removeEventListener('hashchange', synchronize);
      history.scrollRestoration = previousRestoration;
    };
  }, [reduced]);

  const closePanel = useCallback(() => {
    if (history.state?.imPanel) history.back();
    else {
      history.replaceState({ imScroll: 0 }, '', '#home');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, []);
  return { panel, closePanel };
}
