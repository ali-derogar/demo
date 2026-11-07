import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotionPreference } from '../lib/useMedia';
import { getLenis, scrollToSection } from '../lib/useSmoothScroll';
import type { PanelId } from './types';
import { navigationType } from './navigationStartup';

export function panelFromHash(hash: string): PanelId | null {
  return hash === '#about' ? 'about' : hash === '#contact' ? 'contact' : null;
}

/** Hash routes retain the exact scroll position underneath modal panels. */
export function useSceneNavigation() {
  const [panel, setPanel] = useState<PanelId | null>(() => typeof window === 'undefined' ? null : panelFromHash(location.hash));
  const panelRef = useRef(panel);
  const initialized = useRef(false);
  const reduced = useReducedMotionPreference();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  useLayoutEffect(() => {
    let restoreTimer = 0;
    let traversalUrl = '';
    const state = (): Record<string, unknown> => typeof history.state === 'object' && history.state ? history.state : {};
    const entryId = () => Math.random().toString(36).slice(2);
    const ensureEntry = () => {
      const snapshot = state();
      if (typeof snapshot.imEntry === 'string') return snapshot.imEntry;
      const id = entryId();
      history.replaceState({ ...snapshot, imEntry: id }, '', location.href);
      return id;
    };
    let currentEntry = ensureEntry();
    const positions = new Map<string, number>();
    const recordScroll = () => { positions.set(currentEntry, window.scrollY); };
    const remember = () => {
      recordScroll();
      history.replaceState({ ...state(), imScroll: window.scrollY }, '', location.href);
    };
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
        if (immediate || reducedRef.current) scrollToSection(target);
        else if (lenis) lenis.scrollTo(Math.max(0, target.getBoundingClientRect().top + window.scrollY), {
          duration: 1.15, onComplete: () => { if (shouldFocus) focus(target); },
        });
        else window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY), behavior: 'smooth' });
        if (shouldFocus && (immediate || reducedRef.current || !lenis)) focus(target);
      }
    };
    const synchronize = (restoreSnapshot: boolean, deferred = true) => {
      window.clearTimeout(restoreTimer);
      const next = panelFromHash(location.hash);
      panelRef.current = next;
      setPanel(next);
      if (next) return;
      const snapshot = restoreSnapshot ? positions.get(currentEntry) ?? state().imScroll : undefined;
      const savedY = typeof snapshot === 'number' && Number.isFinite(snapshot) ? snapshot : undefined;
      const restore = () => move(location.hash || '#home', true, false, savedY);
      // popstate and hashchange may describe the same navigation. Coalesce them
      // after the dialog closes and after the browser handles its fragment.
      if (deferred) restoreTimer = window.setTimeout(restore, 0);
      else restore();
    };
    const onPopState = () => { traversalUrl = location.href; currentEntry = ensureEntry(); synchronize(true); };
    const onHashChange = () => {
      if (traversalUrl === location.href) { traversalUrl = ''; return; }
      traversalUrl = '';
      currentEntry = ensureEntry();
      synchronize(false);
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) { currentEntry = ensureEntry(); synchronize(true); }
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
      const hash = anchor.getAttribute('href') ?? '';
      const next = panelFromHash(hash);
      if (!next && !document.getElementById(hash.slice(1))) return;
      event.preventDefault();
      traversalUrl = '';
      window.clearTimeout(restoreTimer);
      const wasPanel = panelRef.current !== null;
      if (!wasPanel) remember();
      if (location.hash !== hash) {
        currentEntry = entryId();
        history.pushState(next ? { imEntry: currentEntry, imPanel: true } : { imEntry: currentEntry }, '', hash);
      }
      panelRef.current = next;
      setPanel(next);
      if (!next) {
        window.clearTimeout(restoreTimer);
        const navigate = () => move(hash, reducedRef.current, true);
        if (wasPanel) restoreTimer = window.setTimeout(navigate, 0);
        else navigate();
      }
    };
    history.scrollRestoration = 'manual';
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState);
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('pagehide', remember);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('scroll', recordScroll, { passive: true });
    if (!initialized.current) {
      initialized.current = true;
      synchronize(navigationType() === 'back_forward', false);
    }
    recordScroll();
    return () => {
      window.clearTimeout(restoreTimer);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('pagehide', remember);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('scroll', recordScroll);
    };
  }, []);

  const closePanel = useCallback(() => {
    if (history.state?.imPanel) history.back();
    else {
      history.replaceState({ imScroll: 0 }, '', '#home');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, []);
  return { panel, closePanel };
}
