import { useCallback, useLayoutEffect, useRef, useState, type MutableRefObject } from 'react';
import { useReducedMotionPreference } from '../lib/useMedia';
import { getLenis, scrollToSection } from '../lib/useSmoothScroll';
import { isScrollLocked } from '../lib/scrollLock';
import { subscribeRaf } from '../lib/raf';
import { projects } from '../data/projects';
import type { PanelId } from './types';
import type { GallerySnapshot, OrbitMotion } from './orbit';
import { createPresentation } from './projectPresentation';
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

/** Routes remember navigation intent; the visible project comes from the scroll timeline. */
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
    const work = workRef.current;
    const presentation = work.presentation ?? (work.presentation = createPresentation());
    let restoreTimer = 0, traversalUrl = '', routeProject: string | null = null;
    let returnTo: GallerySnapshot | undefined, requestedClose = false, focusOnArrival = false;
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
      const snapshot = routeProject ? returnTo : work.gallery?.capture();
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
        else if (lenis) lenis.scrollTo(Math.max(0, target.getBoundingClientRect().top + window.scrollY), { duration: .65, onComplete: () => { if (shouldFocus) focus(target); } });
        else window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY), behavior: 'smooth' });
        if (shouldFocus && (immediate || reducedRef.current || !lenis)) focus(target);
      }
    };
    const showProject = (id: string, snapshot?: GallerySnapshot, immediate = true) => {
      routeProject = id; requestedClose = false;
      returnTo = snapshot ?? work.gallery?.forProject(id);
      if (snapshot && work.gallery?.capture().filter !== snapshot.filter) work.gallery?.restore(snapshot);
      presentation.source = 'navigation';
      work.gallery?.open(id, immediate);
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
        routeProject = id;
        return;
      }
      const navigate = () => {
        if (id) { showProject(id, gallerySnapshot(state().imGallery)); return; }
        routeProject = null; focusOnArrival = false; presentation.source = 'scroll';
        const snapshot = restoreSnapshot ? positions.get(currentEntry) ?? state().imScroll : undefined;
        const savedY = typeof snapshot === 'number' && Number.isFinite(snapshot) ? snapshot : undefined;
        const savedGallery = restoreSnapshot ? gallerySnapshot(state().imGallery) : undefined;
        if (savedGallery) work.gallery?.restore(savedGallery);
        else move(location.hash || '#home', true, false, savedY);
      };
      if (deferred) restoreTimer = window.setTimeout(navigate, 0); else navigate();
    };
    const onPopState = () => { traversalUrl = location.href; currentEntry = ensureEntry(); synchronize(true); };
    const onHashChange = () => {
      if (traversalUrl === location.href) { traversalUrl = ''; return; }
      traversalUrl = ''; currentEntry = ensureEntry(); synchronize(false);
    };
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) { currentEntry = ensureEntry(); synchronize(true); } };
    actions.current.open = (id) => {
      if (!projects.some((p) => p.id === id) || panelRef.current) return;
      if (routeProject === id && presentation.phase === 'open') return;
      const snapshot = work.gallery?.capture();
      focusRef.current = document.activeElement as HTMLElement | null;
      remember(); currentEntry = entryId();
      history.pushState({ imEntry: currentEntry, imProject: id, imProjectEntry: true, imGallery: snapshot, imScroll: window.scrollY }, '', `#work/${id}`);
      showProject(id, snapshot, false);
      focusOnArrival = true;
    };
    actions.current.close = () => {
      if (requestedClose || panelRef.current || !presentation.projectId) return;
      focusOnArrival = false;
      if (!routeProject) { work.gallery?.collapse(); return; }
      requestedClose = true;
      if (state().imProjectEntry) history.back();
      else {
        const snapshot = returnTo ?? work.gallery?.forProject(routeProject);
        history.replaceState({ imEntry: entryId(), imGallery: snapshot, imScroll: snapshot?.scrollY }, '', '#demos');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };
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
      if (id) { actions.current.open(id); return; }
      const wasPanel = panelRef.current !== null;
      remember();
      if (location.hash !== hash) {
        currentEntry = entryId();
        history.pushState({ imEntry: currentEntry, ...(next ? { imPanel: true, imProject: routeProject, imGallery: returnTo, imScroll: window.scrollY } : {}) }, '', hash);
      }
      panelRef.current = next; setPanel(next);
      if (!next) {
        routeProject = null; focusOnArrival = false; presentation.source = 'scroll';
        const navigate = () => move(hash, reducedRef.current, true);
        if (wasPanel) restoreTimer = window.setTimeout(navigate, 0); else navigate();
      }
    };
    const unsubscribe = subscribeRaf(() => {
      const id = presentation.projectId;
      setProjectId((previous) => previous === id ? previous : id);
      if (focusOnArrival && id === routeProject && presentation.phase === 'open') {
        const entry = document.querySelector<HTMLElement>('.im-project__hitarea');
        if (entry) { entry.focus({ preventScroll: true }); focusOnArrival = false; }
      }
    });
    history.scrollRestoration = 'manual';
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState); window.addEventListener('hashchange', onHashChange);
    window.addEventListener('pagehide', remember); window.addEventListener('pageshow', onPageShow);
    window.addEventListener('scroll', recordScroll, { passive: true });
    if (!initialized.current) { initialized.current = true; synchronize(navigationType() === 'back_forward', false); }
    else routeProject = projectFromHash(location.hash);
    recordScroll();
    return () => {
      window.clearTimeout(restoreTimer); unsubscribe();
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState); window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('pagehide', remember); window.removeEventListener('pageshow', onPageShow); window.removeEventListener('scroll', recordScroll);
    };
  }, [workRef]);

  useLayoutEffect(() => {
    if (projectId === null && focusRef.current?.isConnected && document.activeElement?.closest('.im-project') === null) {
      focusRef.current.focus({ preventScroll: true }); focusRef.current = null;
    }
  }, [projectId]);
  const closePanel = useCallback(() => {
    if (history.state?.imPanel) history.back();
    else { history.replaceState({ imScroll: 0 }, '', '#home'); window.dispatchEvent(new PopStateEvent('popstate')); }
  }, []);
  return { panel, closePanel, projectId, openProject: useCallback((id: string) => actions.current.open(id), []), closeProject: useCallback(() => actions.current.close(), []) };
}
