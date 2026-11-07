export type NavigationType = 'navigate' | 'reload' | 'back_forward';

export function navigationType(win: Window = window): NavigationType {
  const entry = win.performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (entry?.type === 'reload' || entry?.type === 'back_forward') return entry.type;
  if (entry?.type === 'navigate') return 'navigate';
  const legacy = (win.performance as Performance & { navigation?: { type: number } }).navigation?.type;
  return legacy === 1 ? 'reload' : legacy === 2 ? 'back_forward' : 'navigate';
}

/** Runs before React mounts; refresh is deliberately different from history traversal. */
export function prepareNavigation(win: Window = window) {
  win.history.scrollRestoration = 'manual';
  if (navigationType(win) !== 'reload') return;
  const state = win.history.state;
  const next = state && typeof state === 'object' ? { ...state } : {};
  delete next.imScroll;
  delete next.imPanel;
  const url = new URL(win.location.href);
  url.hash = 'home';
  win.history.replaceState(next, '', url);
  win.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}
