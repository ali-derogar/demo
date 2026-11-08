import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject, type MouseEvent as ReactMouseEvent } from 'react';
import { useMediaQuery, useReducedMotionPreference } from '../lib/useMedia';
import { faDigit } from '../lib/fa';
import { getLenis } from '../lib/useSmoothScroll';
import { isScrollLocked } from '../lib/scrollLock';
import { subscribeRaf } from '../lib/raf';
import { projects, categories, type DemoCategory } from '../data/projects';
import { clampProject, galleryFrame, galleryMetrics, scrollForProject, type OrbitMotion } from './orbit';
import { galleryCardFrame, projectFrame, smoothRange } from './projectPresentation';
import { closeGalleryMenu, useGalleryMenus } from './useGalleryMenus';
import '../styles/orbit.css';

function scrollTo(top: number, immediate = true) {
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(top, { immediate, duration: .65 });
  else window.scrollTo({ top, behavior: immediate ? 'instant' : 'smooth' });
}

export function WorkView({ motionRef, onSelect, onClose }: { motionRef: MutableRefObject<OrbitMotion>; onSelect: (id: string) => void; onClose: () => void }) {
  const [filter, setFilter] = useState<DemoCategory>('all');
  const [active, setActive] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [failedPreview, setFailedPreview] = useState<string | null>(null);
  const reduced = useReducedMotionPreference();
  const desktop = useMediaQuery('(min-width: 1024px) and (min-height: 700px)');
  const shown = useMemo(() => filter === 'all' ? projects : projects.filter((project) => project.category === filter), [filter]);
  const trackRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDetailsElement>(null);
  const toolsRef = useRef<HTMLDetailsElement>(null);
  const measuredWidth = useRef(0);
  const linksRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const metricsRef = useRef(galleryMetrics(0, 1, shown.length));
  useGalleryMenus(trackRef);
  useEffect(() => { if (filtersRef.current) filtersRef.current.open = desktop; }, [desktop]);

  const measure = useCallback(() => {
    const track = trackRef.current, sticky = stickyRef.current;
    if (!track || !sticky) return;
    const previous = metricsRef.current;
    const next = galleryMetrics(track.getBoundingClientRect().top + window.scrollY, sticky.offsetHeight, motionRef.current.items.length);
    track.style.height = `${next.height}px`;
    metricsRef.current = next;
    // Browser toolbar changes keep svh stable. A real orientation/width change
    // preserves the same timeline coordinate, rather than the old pixel offset.
    if (measuredWidth.current && measuredWidth.current !== window.innerWidth && window.scrollY >= previous.start && window.scrollY <= previous.start + previous.travel) {
      scrollTo(next.start + (window.scrollY - previous.start) / previous.viewport * next.viewport);
    }
    measuredWidth.current = window.innerWidth;
  }, [motionRef]);

  const syncFrame = useCallback(() => {
    const state = motionRef.current, region = stageRef.current;
    if (!region) return;
    const presentation = state.presentation!;
    region.dataset.ready = String(state.ready);
    region.dataset.labels = String(!!state.labelsReady);
    region.dataset.presenting = String(!!presentation.projectId && document.querySelector('.im-project')?.getAttribute('data-project') === presentation.projectId);
    region.dataset.inRange = String(window.scrollY >= metricsRef.current.start - metricsRef.current.viewport * .08);
    const entry = Math.max(0, Math.min(1, (window.scrollY - metricsRef.current.start) / (metricsRef.current.viewport * .08) + 1));
    region.style.setProperty('--card-opacity', String(presentation.surface === 'webgl' ? state.reveal ?? entry : entry));
    const bounds = state.bounds;
    if (bounds) {
      region.style.setProperty('--card-left', `${bounds.left}px`);
      region.style.setProperty('--card-top', `${bounds.top}px`);
      region.style.setProperty('--card-width', `${bounds.width}px`);
      region.style.setProperty('--card-height', `${bounds.height}px`);
    }
    trackRef.current?.style.setProperty('--presentation-progress', String(presentation.progress));
    trackRef.current?.setAttribute('data-presenting', String(!!presentation.projectId));
  }, [motionRef]);

  const sample = useCallback(() => {
    const state = motionRef.current;
    if (isScrollLocked()) return;
    const frame = galleryFrame(window.scrollY, metricsRef.current);
    state.scrollDriven = true;
    state.target = state.position = frame.position;
    const index = Math.round(clampProject(frame.position, state.items.length));
    setActive((previous) => previous === index ? previous : index);
    const presentation = state.presentation!;
    // Native scrolling rounds fractional sticky boundaries to CSS pixels.
    const rawProgress = frame.progress <= .75 / Math.min(metricsRef.current.opening, metricsRef.current.closing) ? 0 : frame.progress;
    const progress = reduced ? (rawProgress >= .5 ? 1 : 0) : rawProgress;
    const id = progress > .00001 ? state.items[frame.index]?.id ?? null : null;
    setPresenting((previous) => previous === !!id ? previous : !!id);
    const duration = index === state.items.length - 1 ? metricsRef.current.opening + metricsRef.current.hold + metricsRef.current.closing : metricsRef.current.step;
    const stepProgress = Math.max(0, Math.min(1, (window.scrollY - metricsRef.current.start - index * metricsRef.current.step) / duration));
    trackRef.current?.style.setProperty('--step-progress', String(stepProgress));
    const changed = presentation.projectId !== id;
    if (changed) {
      presentation.ready = false;
      presentation.bounds = null;
      presentation.projectId = id;
    }
    presentation.progress = progress;
    presentation.phase = progress === 0 ? 'closed' : progress === 1 ? 'open' : frame.phase;
    state.selectedIndex = id ? frame.index : null;
    state.selection = progress;
    state.interactive = window.scrollY >= metricsRef.current.start - metricsRef.current.viewport * .2 && window.scrollY <= metricsRef.current.start + metricsRef.current.travel;
    if (presentation.surface !== 'webgl') {
      const width = document.documentElement.clientWidth || window.innerWidth;
      const rest = galleryCardFrame(width, metricsRef.current.viewport);
      const expanded = projectFrame(width, window.innerHeight, metricsRef.current.viewport);
      const mix = smoothRange(progress, .2, 1);
      state.bounds = { left: rest.left + (expanded.left - rest.left) * mix, top: rest.top + (expanded.top - rest.top) * mix,
        width: rest.width + (expanded.width - rest.width) * mix, height: rest.height + (expanded.height - rest.height) * mix };
      if (id) presentation.bounds = state.bounds;
    }
    syncFrame();
    if (changed) state.onProjectChange?.(id);
  }, [motionRef, reduced, syncFrame]);

  const go = useCallback((index: number, immediate = false) => {
    measure();
    scrollTo(scrollForProject(clampProject(index, shown.length), metricsRef.current), immediate || reduced);
    if (immediate || reduced) sample();
  }, [measure, reduced, sample, shown.length]);

  useLayoutEffect(() => {
    const state = motionRef.current;
    state.items = shown;
    state.onFrame = syncFrame;
    measure();
    sample();
    const restore = (snapshot: ReturnType<NonNullable<OrbitMotion['gallery']>['capture']>) => {
      const next = snapshot.filter === 'all' ? projects : projects.filter((project) => project.category === snapshot.filter);
      state.items = next.length ? next : projects;
      setFilter(next.length ? snapshot.filter : 'all');
      state.dragging = false;
      measure();
      const oldViewport = snapshot.viewport;
      const y = oldViewport && snapshot.start !== undefined && snapshot.scrollY >= snapshot.start
        ? metricsRef.current.start + (snapshot.scrollY - snapshot.start) / oldViewport * metricsRef.current.viewport : snapshot.scrollY;
      scrollTo(y);
      sample();
    };
    state.gallery = {
      capture: () => ({ filter, target: state.target, position: state.position, scrollY: window.scrollY, viewport: metricsRef.current.viewport, start: metricsRef.current.start }),
      restore,
      forProject: (id) => {
        const included = shown.some((project) => project.id === id);
        const items = included ? shown : projects;
        const index = Math.max(0, items.findIndex((project) => project.id === id));
        const metrics = galleryMetrics(metricsRef.current.start, metricsRef.current.viewport, items.length);
        return { filter: included ? filter : 'all', target: index, position: index, scrollY: scrollForProject(index, metrics), viewport: metrics.viewport, start: metrics.start };
      },
      open: (id, immediate = true) => {
        if (!state.items.some((project) => project.id === id)) { state.items = projects; setFilter('all'); }
        measure();
        const index = Math.max(0, state.items.findIndex((project) => project.id === id));
        scrollTo(scrollForProject(index, metricsRef.current, true), immediate || reduced);
        if (immediate || reduced) sample();
      },
      collapse: () => { scrollTo(scrollForProject(Math.round(state.target), metricsRef.current)); sample(); },
    };
    const observer = new ResizeObserver(measure);
    observer.observe(trackRef.current!); observer.observe(stickyRef.current!);
    window.addEventListener('resize', measure, { passive: true });
    const unsubscribe = subscribeRaf(sample);
    return () => { state.gallery = undefined; state.onFrame = undefined; observer.disconnect(); unsubscribe(); window.removeEventListener('resize', measure); };
  }, [filter, measure, motionRef, reduced, sample, shown, syncFrame]);

  useEffect(() => {
    const state = motionRef.current;
    let drag: { id: number; x: number; y: number; start: number; target: Element; horizontal: boolean } | null = null;
    let wheelAxis = '', wheelUntil = 0;
    const down = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (event.button !== 0 || isScrollLocked() || !target?.closest('.im-orbit__stage,.im-orbit__captions,.im-project')) return;
      if (target.closest('button,input,textarea,select,summary,.im-project__actions a,.im-orbit__visit')) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, start: window.scrollY, target, horizontal: false };
    };
    const move = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      if (event.pointerType === 'mouse' && event.buttons !== 1) { drag = null; state.dragging = false; return; }
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (!drag.horizontal) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
        if (Math.abs(dx) < 10) return;
        drag.horizontal = state.dragging = true;
        drag.target.setPointerCapture?.(event.pointerId);
      }
      event.preventDefault();
      state.blockClickUntil = performance.now() + 350;
      const metrics = metricsRef.current;
      scrollTo(Math.max(metrics.start, Math.min(metrics.start + metrics.travel, drag.start + dx / Math.max(180, window.innerWidth) * metrics.viewport)));
      sample();
    };
    const end = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      if (drag.horizontal) {
        state.blockClickUntil = performance.now() + 350;
        if (drag.target.hasPointerCapture?.(event.pointerId)) drag.target.releasePointerCapture(event.pointerId);
      }
      drag = null; state.dragging = false;
    };
    const wheel = (event: WheelEvent) => {
      if (isScrollLocked() || event.ctrlKey || (event.target as Element | null)?.closest('input,textarea,select')) return;
      const metrics = metricsRef.current;
      if (window.scrollY < metrics.start || window.scrollY > metrics.start + metrics.travel) return;
      if (event.timeStamp > wheelUntil) wheelAxis = Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.1 ? 'x' : 'y';
      wheelUntil = event.timeStamp + 160;
      if (wheelAxis !== 'x') return;
      event.preventDefault();
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? metrics.viewport : 1;
      scrollTo(Math.max(metrics.start, Math.min(metrics.start + metrics.travel, window.scrollY + event.deltaX * scale)));
      sample();
    };
    document.addEventListener('pointerdown', down);
    document.addEventListener('pointermove', move, { passive: false });
    document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
    document.addEventListener('lostpointercapture', end);
    document.addEventListener('wheel', wheel, { passive: false });
    return () => {
      state.dragging = false;
      document.removeEventListener('pointerdown', down); document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', end); document.removeEventListener('pointercancel', end);
      document.removeEventListener('lostpointercapture', end); document.removeEventListener('wheel', wheel);
    };
  }, [motionRef, sample]);

  const changeFilter = (value: DemoCategory) => {
    scrollTo(metricsRef.current.start);
    setFilter(value);
    closeGalleryMenu(filtersRef.current, false);
    stageRef.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    motionRef.current.onPick = (index: number) => linksRef.current[index]?.click();
    return () => { motionRef.current.onPick = undefined; };
  }, [motionRef, shown]);
  const activate = (index: number, event: ReactMouseEvent<HTMLAnchorElement>) => {
    const state = motionRef.current;
    if (state.dragging || performance.now() < state.blockClickUntil) { event.preventDefault(); return; }
    // Modified links retain the browser's explicit open-in-new-tab behavior.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    closeGalleryMenu(filtersRef.current, false);
    closeGalleryMenu(toolsRef.current, false);
    onSelect(shown[index].id);
  };
  const choose = (index: number) => {
    go(index);
    closeGalleryMenu(toolsRef.current, false);
    stageRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="im-work-track" ref={trackRef} data-selected="false" style={{ ['--orbit-count' as string]: shown.length, ['--orbit-accent' as string]: shown[active]?.accent ?? shown[0]?.accent }}>
      <div className="im-work im-shell im-work--orbit" ref={stickyRef}>
        <div className="im-orbit__ambience" aria-hidden="true" />
        <header className="im-orbit__head"><h2 id="im-work-title">نمونه‌کارها</h2><span dir="ltr">SELECTED WORK / {String(shown.length).padStart(2, '0')}</span><p className="im-orbit__subtitle">هر پروژه، یک تجربهٔ تازه</p></header>
        <details className="im-orbit__filters" ref={filtersRef} data-persistent={desktop}>
          <summary data-cursor="link" tabIndex={desktop ? -1 : undefined} onClick={(event) => { if (desktop) event.preventDefault(); }}>دسته‌بندی نمونه‌کارها<span aria-hidden="true">+</span></summary>
          <div className="im-orbit__filter-options" role="group" aria-label="دسته‌بندی نمونه‌کارها">
            {categories.map((category) => <button key={category.value} type="button" className="im-filter" aria-pressed={filter === category.value} onClick={() => changeFilter(category.value)} data-cursor="link">{category.label}</button>)}
          </div>
        </details>

        <div className="im-orbit__stage" ref={stageRef} tabIndex={0} role="region" aria-roledescription="گالری چرخشی" aria-label="نمونه‌کارهای سه‌بعدی" aria-describedby="im-orbit-help" data-cursor="drag" data-ready="false"
          onClick={(event) => { if (performance.now() < motionRef.current.blockClickUntil) { event.preventDefault(); event.stopPropagation(); } }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') { event.preventDefault(); linksRef.current[Math.round(motionRef.current.target)]?.click(); return; }
            let next: number | undefined;
            if (event.key === 'ArrowLeft') next = Math.round(motionRef.current.target) - 1;
            if (event.key === 'ArrowRight') next = Math.round(motionRef.current.target) + 1;
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = shown.length - 1;
            if (next !== undefined) { event.preventDefault(); go(next); }
          }}>
          <div className="im-orbit__fallback" aria-hidden="true"><a href={shown[active]?.url} target="_blank" rel="noopener noreferrer" tabIndex={-1} draggable={false} onClick={(event) => activate(active, event)}>
            {failedPreview === shown[active]?.preview && <span className="im-orbit__image-error">تصویر بارگذاری نشد<span>دیدن سایت ↖</span></span>}
            <img src={shown[active]?.preview} hidden={failedPreview === shown[active]?.preview} onError={() => setFailedPreview(shown[active]?.preview ?? null)} onLoad={() => setFailedPreview(null)} alt="" width="1200" height="800" decoding="async" loading="eager" draggable={false} />
          </a></div>
          <span className="im-orbit__axis" aria-hidden="true">+</span>
        </div>
        <ul className="im-orbit__captions">
          {shown.map((project, index) => (
            <li key={project.id} hidden={index !== active} role="group" aria-roledescription="اسلاید" aria-label={faDigit(index + 1) + ' از ' + faDigit(shown.length)}>
              <div className="im-orbit__project-meta"><span style={{ ['--category-accent' as string]: project.accent }}>{project.categoryLabel}</span><span dir="ltr">PROJECT / {String(projects.indexOf(project) + 1).padStart(2, '0')}</span></div>
              <a id={`project-link-${project.id}`} ref={(element) => { linksRef.current[index] = element; }} href={project.url} target="_blank" rel="noopener noreferrer" className="im-orbit__project-link" data-cursor="cta" onClick={(event) => activate(index, event)}><h3>{project.title.split('؛')[0]}</h3><span>معرفی سایت <span aria-hidden="true">↖</span></span></a>
              <p>{project.tagline}</p>
              <div className="im-orbit__mobile-actions">
                <a className="im-orbit__visit" href={project.url} target="_blank" rel="noopener noreferrer">دیدن سایت <span aria-hidden="true">↗</span></a>
                <button type="button" onClick={onClose} hidden={!presenting}>بازگشت به گالری <span aria-hidden="true">↶</span></button>
                <span className="im-orbit__preview-note" hidden={presenting}>آمادهٔ کشف<span aria-hidden="true">✳</span></span>
              </div>
            </li>
          ))}
        </ul>
        <nav className="im-orbit__mobile-nav" aria-label="مرور نمونه‌کارها">
          <button type="button" onClick={() => choose(Math.round(motionRef.current.target) - 1)} disabled={active === 0} aria-label="نمونه‌کار قبلی"><span aria-hidden="true">←</span></button>
          <div className="im-orbit__journey">
            <div className="im-orbit__journey-label"><span>بکشید یا اسکرول کنید</span><span className="im-orbit__mobile-counter" aria-live="polite" aria-atomic="true"><b>{faDigit(String(active + 1).padStart(2, '0'))}</b><i>/</i>{faDigit(String(shown.length).padStart(2, '0'))}</span></div>
            <div className="im-orbit__steps" aria-hidden="true">{shown.map((project, index) => <span key={project.id} data-state={index < active ? 'complete' : index === active ? 'current' : 'next'}><i /></span>)}</div>
          </div>
          <button type="button" onClick={() => choose(Math.round(motionRef.current.target) + 1)} disabled={active === shown.length - 1} aria-label="نمونه‌کار بعدی"><span aria-hidden="true">→</span></button>
        </nav>
        <div className="im-orbit__controls">
          <p id="im-orbit-help" aria-live="polite">اسکرول کنید یا بکشید<span className="im-sr-only">. با کلیدهای پیکان جابه‌جا شوید و با Enter معرفی سایت را باز کنید.</span></p>
          <span className="im-orbit__counter" aria-live="polite" aria-atomic="true"><b>{faDigit(String(active + 1).padStart(2, '0'))}</b><i>/</i>{faDigit(String(shown.length).padStart(2, '0'))}</span>
          <details className="im-orbit__tools" ref={toolsRef}>
            <summary data-cursor="link">معرفی سایت <span aria-hidden="true">↔</span></summary>
            <div className="im-orbit__tool-sheet">
              <div className="im-orbit__navigation">
                <button type="button" onClick={() => choose(Math.round(motionRef.current.target) - 1)} disabled={active === 0} aria-label="پروژهٔ قبلی" data-cursor="link">←</button>
                <button type="button" onClick={() => choose(Math.round(motionRef.current.target) + 1)} disabled={active === shown.length - 1} aria-label="پروژهٔ بعدی" data-cursor="link">→</button>
              </div>
              <label className="im-orbit__scrubber"><span className="im-sr-only">انتخاب پروژه</span><input type="range" min={0} max={Math.max(0, shown.length - 1)} step={1} value={active} disabled={shown.length === 1} aria-valuetext={shown[active]?.title} onChange={(event) => go(Number(event.target.value), true)} onPointerUp={() => closeGalleryMenu(toolsRef.current)} onKeyDown={(event) => { if (event.key === 'Enter') closeGalleryMenu(toolsRef.current); }} /></label>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
