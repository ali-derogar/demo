import { useCallback, useLayoutEffect, useRef, useState, type MutableRefObject } from 'react';
import { useReducedMotionPreference } from '../lib/useMedia';
import { getLenis, scrollToSection } from '../lib/useSmoothScroll';
import { isScrollLocked } from '../lib/scrollLock';
import { subscribeRaf } from '../lib/raf';
import { projects } from '../data/projects';
import type { PanelId } from './types';
import type { GallerySnapshot, OrbitMotion } from './orbit';
import { advancePresentation, createPresentation } from './projectPresentation';
import { navigationType } from './navigationStartup';

export function panelFromHash(hash: string): PanelId | null {
  return hash === '#about' ? 'about' : hash === '#contact' ? 'contact' : null;
}
export function projectFromHash(hash: string): string | null {
  const id = hash.startsWith('#work/') ? hash.slice(6) : null;
  return projects.some((project) => project.id === id) ? id : null;
}
function gallerySnapshot(value: unknown): GallerySnapshot | undefined {
  if (!value || typeof value !== 'object') return;
  const v = value as GallerySnapshot;
  if (typeof v.filter === 'string' && [v.target, v.position, v.scrollY].every(Number.isFinite)) return v;
}

/** One history owner for gallery, project presentations and nested information panels. */
export function useSceneNavigation(workRef: MutableRefObject<OrbitMotion>) {
  const [panel, setPanel] = useState<PanelId | null>(() => panelFromHash(location.hash));
  const [projectId, setProjectId] = useState<string | null>(null);
  const panelRef = useRef(panel);
  const focusRef = useRef<HTMLElement | null>(null);
  const initialized = useRef(false);
  const reduced = useReducedMotionPreference();
  const reducedRef = useRef(reduced); reducedRef.current = reduced;
  const actions = useRef({ open: (_id: string) => {}, close: () => {} });

  useLayoutEffect(() => {
    let restoreTimer = 0, traversalUrl = '';
    let afterClose: (() => void) | undefined;
    let requestedClose = false;
    let returnTo: GallerySnapshot | undefined;
    const work = workRef.current;
    const presentation = work.presentation ?? (work.presentation = createPresentation());
    const state = (): Record<string, unknown> => typeof history.state === 'object' && history.state ? history.state : {};
    const entryId = () => Math.random().toString(36).slice(2);
    const ensureEntry = () => {
      const snapshot = state();
      if (typeof snapshot.imEntry === 'string') return snapshot.imEntry;
      const id = entryId(); history.replaceState({ ...snapshot, imEntry: id }, '', location.href); return id;
    };
    let currentEntry = ensureEntry();
    const positions = new Map<string, number>();
    const recordScroll = () => { positions.set(currentEntry, window.scrollY); };
    const remember = () => {
      recordScroll();
      const snapshot = presentation.projectId ? returnTo : work.gallery?.capture();
      history.replaceState({ ...state(), imScroll: window.scrollY, ...(snapshot ? { imGallery: snapshot } : {}) }, '', location.href);
    };
    const focus = (target: HTMLElement) => {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    const move = (hash: string, immediate: boolean, shouldFocus: boolean, savedY?: number) => {
      const target = document.getElementById(hash.slice(1) || 'home');
      const lenis = getLenis();
      if (!isScrollLocked()) lenis?.start();
      if (savedY !== undefined) {
        if (lenis) lenis.scrollTo(savedY, { immediate: true, force: true });
        else window.scrollTo({ top: savedY, behavior: 'instant' });
      } else if (target) {
        if (immediate || reducedRef.current) scrollToSection(target);
        else if (lenis) lenis.scrollTo(Math.max(0, target.getBoundingClientRect().top + window.scrollY), { duration: 1.15, onComplete: () => { if (shouldFocus) focus(target); } });
        else window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY), behavior: 'smooth' });
        if (shouldFocus && (immediate || reducedRef.current || !lenis)) focus(target);
      }
    };
    const showProject = (id: string, snapshot?: GallerySnapshot) => {
      afterClose = undefined;
      if (!presentation.projectId) focusRef.current = document.activeElement as HTMLElement | null;
      returnTo = snapshot ?? work.gallery?.forProject(id);
      if (snapshot && work.gallery?.capture().filter !== snapshot.filter) work.gallery?.restore(snapshot);
      if (!work.items.some((project) => project.id === id) || !snapshot) {
        const direct = work.gallery?.forProject(id);
        if (direct) work.gallery?.restore(direct);
      }
      work.selectedIndex = work.items.findIndex((project) => project.id === id);
      work.target = Math.max(0, work.selectedIndex); work.dragging = false;
      if (presentation.projectId !== id || presentation.phase === 'closed') {
        presentation.projectId = id; presentation.progress = 0; presentation.ready = work.ready && work.selectedIndex === Math.round(work.position); presentation.bounds = null;
      }
      if (presentation.phase !== 'open') presentation.phase = 'opening';
      advancePresentation(presentation, 0, reducedRef.current);
      setProjectId(id);
    };
    const hideProject = (restore: () => void) => {
      if (!presentation.projectId) { restore(); return; }
      afterClose = restore;
      presentation.phase = 'closing';
      if (returnTo) work.target = returnTo.target;
      work.selectedIndex = null;
    };
    const synchronize = (restoreSnapshot: boolean, deferred = true) => {
      requestedClose = false;
      window.clearTimeout(restoreTimer);
      let id = projectFromHash(location.hash);
      if (location.hash.startsWith('#work/') && !id) history.replaceState({ ...state(), imProject: undefined }, '', '#demos');
      const next = panelFromHash(location.hash);
      panelRef.current = next; setPanel(next);
      if (next) {
        const inherited = state().imProject;
        if (typeof inherited === 'string' && projects.some((p) => p.id === inherited)) id = inherited;
        if (id) showProject(id, gallerySnapshot(state().imGallery));
        else hideProject(() => {});
        return;
      }
      if (id) { showProject(id, gallerySnapshot(state().imGallery)); return; }
      const snapshot = restoreSnapshot ? positions.get(currentEntry) ?? state().imScroll : undefined;
      const savedY = typeof snapshot === 'number' && Number.isFinite(snapshot) ? snapshot : undefined;
      const savedGallery = restoreSnapshot ? gallerySnapshot(state().imGallery) : undefined;
      const hash = location.hash || '#home';
      const restore = () => {
        if (savedGallery && hash === '#demos') work.gallery?.restore(savedGallery);
        else move(hash, true, false, savedY);
      };
      const navigate = () => hideProject(restore);
      if (deferred) restoreTimer = window.setTimeout(navigate, 0); else navigate();
    };
    const onPopState = () => { traversalUrl = location.href; currentEntry = ensureEntry(); synchronize(true); };
    const onHashChange = () => {
      if (traversalUrl === location.href) { traversalUrl = ''; return; }
      traversalUrl = ''; currentEntry = ensureEntry(); synchronize(false);
    };
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) { currentEntry = ensureEntry(); synchronize(true); } };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
      const hash = anchor.getAttribute('href') ?? '', next = panelFromHash(hash), id = projectFromHash(hash);
      if (anchor.classList.contains('skip-link')) {
        const target = document.getElementById(hash.slice(1));
        if (target) { event.preventDefault(); focus(target); }
        return;
      }
      if (!next && !id && !document.getElementById(hash.slice(1))) return;
      event.preventDefault(); traversalUrl = ''; window.clearTimeout(restoreTimer);
      const wasPanel = panelRef.current !== null;
      remember();
      if (location.hash !== hash) {
        currentEntry = entryId();
        history.pushState({ imEntry: currentEntry, ...(next ? { imPanel: true, imProject: presentation.projectId, imGallery: returnTo } : {}) }, '', hash);
      }
      panelRef.current = next; setPanel(next);
      if (id) showProject(id);
      else if (!next) {
        const navigate = () => hideProject(() => move(hash, reducedRef.current, true));
        if (wasPanel) restoreTimer = window.setTimeout(navigate, 0); else navigate();
      }
    };
    actions.current.open = (id) => {
      if (!projects.some((p) => p.id === id) || panelRef.current) return;
      if (presentation.projectId === id && presentation.phase !== 'closing') return;
      const snapshot = work.gallery?.capture();
      requestedClose = false;
      remember(); currentEntry = entryId();
      history.pushState({ imEntry: currentEntry, imProject: id, imProjectEntry: true, imGallery: snapshot, imScroll: window.scrollY }, '', `#work/${id}`);
      showProject(id, snapshot);
    };
    actions.current.close = () => {
      if (requestedClose || presentation.phase === 'closing' || panelRef.current || !presentation.projectId) return;
      requestedClose = true;
      if (state().imProjectEntry) history.back();
      else {
        const snapshot = returnTo ?? work.gallery?.forProject(presentation.projectId);
        history.replaceState({ imEntry: entryId(), imGallery: snapshot, imScroll: snapshot?.scrollY }, '', '#demos');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };
    const unsubscribe = subscribeRaf((_time, delta) => {
      const closing = presentation.phase === 'closing';
      advancePresentation(presentation, Math.min(delta / 1000, .064), reducedRef.current);
      if (closing && presentation.phase === 'closed') {
        work.selectedIndex = null; work.selection = 0; setProjectId(null);
        const restore = afterClose; afterClose = undefined;
        restoreTimer = window.setTimeout(() => restore?.(), 0);
      }
    });
    history.scrollRestoration = 'manual';
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState); window.addEventListener('hashchange', onHashChange);
    window.addEventListener('pagehide', remember); window.addEventListener('pageshow', onPageShow);
    window.addEventListener('scroll', recordScroll, { passive: true });
    if (!initialized.current) { initialized.current = true; synchronize(navigationType() === 'back_forward', false); }
    recordScroll();
    return () => {
      window.clearTimeout(restoreTimer); unsubscribe();
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState); window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('pagehide', remember); window.removeEventListener('pageshow', onPageShow); window.removeEventListener('scroll', recordScroll);
    };
  }, [workRef]);

  useLayoutEffect(() => { if (projectId === null && focusRef.current?.isConnected) focusRef.current.focus({ preventScroll: true }); }, [projectId]);
  const closePanel = useCallback(() => {
    if (history.state?.imPanel) history.back();
    else { history.replaceState({ imScroll: 0 }, '', '#home'); window.dispatchEvent(new PopStateEvent('popstate')); }
  }, []);
  return { panel, closePanel, projectId, openProject: useCallback((id: string) => actions.current.open(id), []), closeProject: useCallback(() => actions.current.close(), []) };
}
