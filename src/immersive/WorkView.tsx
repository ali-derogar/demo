import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { AnimatePresence } from 'motion/react';
import { useMediaQuery, useReducedMotionPreference } from '../lib/useMedia';
import { faDigit } from '../lib/fa';
import { getLenis } from '../lib/useSmoothScroll';
import { subscribeRaf } from '../lib/raf';
import { projects, categories, type DemoCategory } from '../data/projects';
import { clampProject, projectFromScroll, releaseProject, scrollForProject, type OrbitMotion } from './orbit';
import { closeGalleryMenu, useGalleryMenus } from './useGalleryMenus';
import { ProjectPreview } from './ProjectPreview';
import '../styles/orbit.css';

export function WorkView({ motionRef }: { motionRef: MutableRefObject<OrbitMotion> }) {
  const [filter, setFilter] = useState<DemoCategory>('all');
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [failedPreview, setFailedPreview] = useState<string | null>(null);
  const reduced = useReducedMotionPreference();
  const desktop = useMediaQuery('(min-width: 1024px) and (min-height: 700px)');
  const shown = useMemo(() => filter === 'all' ? projects : projects.filter((project) => project.category === filter), [filter]);
  const trackRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDetailsElement>(null);
  const toolsRef = useRef<HTMLDetailsElement>(null);
  useGalleryMenus(trackRef);
  const linksRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const metricsRef = useRef({ start: 0, travel: 1 });
  const dragRef = useRef({ id: -1, x: 0, y: 0, start: 0, lastX: 0, lastTime: 0, speed: 0 });
  const selectedProject = selected === null ? null : shown[selected];

  useEffect(() => { if (filtersRef.current) filtersRef.current.open = desktop; }, [desktop]);

  const clearSelection = useCallback(() => {
    motionRef.current.selectedIndex = null;
    if (reduced) motionRef.current.selection = 0;
    setSelected(null);
  }, [motionRef, reduced]);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const sticky = stickyRef.current;
    if (!track || !sticky) return;
    metricsRef.current = {
      start: track.getBoundingClientRect().top + window.scrollY,
      travel: Math.max(1, track.offsetHeight - sticky.offsetHeight),
    };
  }, []);

  const go = useCallback((index: number, immediate = false, preserveSelection = false) => {
    if (!preserveSelection) clearSelection();
    const next = clampProject(index, shown.length);
    motionRef.current.target = next;
    setActive(Math.round(next));
    if (reduced) { motionRef.current.position = next; return; }
    measure();
    const { start, travel } = metricsRef.current;
    const top = scrollForProject(next, start, travel, shown.length);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(top, { immediate, duration: .85 });
    else window.scrollTo({ top, behavior: immediate ? 'instant' : 'smooth' });
  }, [clearSelection, measure, motionRef, reduced, shown.length]);

  useEffect(() => {
    const track = trackRef.current;
    const sticky = stickyRef.current;
    if (!track || !sticky) return;
    motionRef.current.items = shown;
    motionRef.current.ready = false;
    const region = stageRef.current;
    if (region) region.dataset.ready = 'false';
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    observer.observe(sticky);
    window.addEventListener('resize', measure, { passive: true });
    let lastY = -1;
    let current = 0;
    let wasReady = false;
    let hadLabels = false;
    const unsubscribe = reduced ? () => {} : subscribeRaf(() => {
      const state = motionRef.current;
      const y = window.scrollY;
      const { start, travel } = metricsRef.current;
      state.interactive = y >= start - window.innerHeight * .2 && y <= start + travel + window.innerHeight * .4;
      if (region && state.ready !== wasReady) { region.dataset.ready = String(state.ready); wasReady = state.ready; }
      if (region && !!state.labelsReady !== hadLabels) { region.dataset.labels = String(!!state.labelsReady); hadLabels = !!state.labelsReady; }
      if (y !== lastY && !state.dragging) {
        const { start, travel } = metricsRef.current;
        state.target = projectFromScroll(y, start, travel, shown.length);
        if (state.selectedIndex !== null && (!state.interactive || Math.abs(state.target - state.selectedIndex) > .12)) clearSelection();
        lastY = y;
      }
      const index = Math.round(clampProject(state.target, shown.length));
      if (index !== current) { current = index; setActive(index); }
    });
    return () => {
      unsubscribe();
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [clearSelection, measure, reduced, shown, motionRef]);

  useEffect(() => {
    const onWheel = () => {
      if (motionRef.current.selectedIndex !== null && !document.querySelector('dialog[open]')) clearSelection();
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || motionRef.current.selectedIndex === null || document.querySelector('dialog[open]')) return;
      event.preventDefault();
      clearSelection();
      stageRef.current?.focus({ preventScroll: true });
    };
    const onScroll = () => { if (reduced && motionRef.current.selectedIndex !== null) clearSelection(); };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('keydown', onEscape);
    return () => { window.removeEventListener('wheel', onWheel); window.removeEventListener('scroll', onScroll); document.removeEventListener('keydown', onEscape); };
  }, [clearSelection, motionRef, reduced]);

  const changeFilter = (value: DemoCategory) => {
    clearSelection();
    motionRef.current.target = 0;
    motionRef.current.position = 0;
    motionRef.current.dragging = false;
    setActive(0);
    measure();
    if (!reduced) {
      const top = metricsRef.current.start;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(top, { immediate: true });
      else window.scrollTo({ top, behavior: 'instant' });
    }
    setFilter(value);
    closeGalleryMenu(filtersRef.current, false);
    stageRef.current?.focus({ preventScroll: true });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || shown.length < 2 || reduced) return;
    dragRef.current = {
      id: event.pointerId, x: event.clientX, y: event.clientY,
      start: motionRef.current.target, lastX: event.clientX,
      lastTime: event.timeStamp, speed: 0,
    };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag.id !== event.pointerId) return;
    if (event.pointerType === 'mouse' && event.buttons !== 1) {
      drag.id = -1;
      motionRef.current.dragging = false;
      return;
    }
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    const state = motionRef.current;
    if (!state.dragging) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.1) { clearSelection(); drag.id = -1; return; }
      if (Math.abs(dx) < 7) return;
      state.dragging = true;
      clearSelection();
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    const width = Math.max(180, event.currentTarget.clientWidth * .48);
    const dt = Math.max(8, event.timeStamp - drag.lastTime) / 1000;
    drag.speed = (drag.lastX - event.clientX) / width / dt;
    drag.lastX = event.clientX;
    drag.lastTime = event.timeStamp;
    state.blockClickUntil = performance.now() + 350;
    go(drag.start - dx / width, true);
  };
  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    const drag = dragRef.current;
    if (drag.id !== event.pointerId) return;
    drag.id = -1;
    if (!motionRef.current.dragging) return;
    motionRef.current.dragging = false;
    motionRef.current.blockClickUntil = performance.now() + 350;
    const speed = event.timeStamp - drag.lastTime > 100 || cancelled ? 0 : drag.speed;
    go(releaseProject(motionRef.current.target, speed, shown.length));
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
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
    if (state.selectedIndex === index) return;
    event.preventDefault();
    closeGalleryMenu(filtersRef.current, false);
    closeGalleryMenu(toolsRef.current, false);
    state.selectedIndex = index;
    if (reduced) state.selection = 1;
    setSelected(index);
    // Pin the scroll coordinate immediately; the shared camera performs the transition.
    go(index, true, true);
  };
  const choose = (index: number) => {
    go(index);
    closeGalleryMenu(toolsRef.current, false);
    stageRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="im-work-track" ref={trackRef} data-selected={selected !== null} style={{ ['--orbit-steps' as string]: shown.length - 1 }}>
      <div className="im-work im-shell im-work--orbit" ref={stickyRef}>
        <header className="im-orbit__head"><h2 id="im-work-title">نمونه‌کارها</h2><span dir="ltr">SELECTED WORK / {String(shown.length).padStart(2, '0')}</span></header>
        <details className="im-orbit__filters" ref={filtersRef} hidden={selected !== null} data-persistent={desktop}>
          <summary data-cursor="link" tabIndex={desktop ? -1 : undefined} onClick={(event) => { if (desktop) event.preventDefault(); }}>چه کاری را می‌خواهید ببینید؟<span aria-hidden="true">+</span></summary>
          <div className="im-orbit__filter-options" role="group" aria-label="دسته‌بندی نمونه‌کارها">
            {categories.map((category) => <button key={category.value} type="button" className="im-filter" aria-pressed={filter === category.value} onClick={() => changeFilter(category.value)} data-cursor="link">{category.label}</button>)}
          </div>
        </details>
        {selected !== null && <button type="button" className="im-orbit__back" onClick={() => { clearSelection(); stageRef.current?.focus({ preventScroll: true }); }} data-cursor="link">بازگشت به گالری <span aria-hidden="true">↶</span></button>}
        <div className="im-orbit__stage" ref={stageRef} tabIndex={0} role="region" aria-roledescription="گالری چرخشی" aria-label="نمونه‌کارهای سه‌بعدی" aria-describedby="im-orbit-help" data-cursor={selected !== null ? 'cta' : 'drag'} data-ready="false"
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={(event) => finishDrag(event)} onPointerCancel={(event) => finishDrag(event, true)}
          onLostPointerCapture={(event) => finishDrag(event, true)}
          onClick={(event) => { if (performance.now() < motionRef.current.blockClickUntil) { event.preventDefault(); event.stopPropagation(); } }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') { event.preventDefault(); linksRef.current[Math.round(motionRef.current.target)]?.click(); return; }
            let next: number | undefined;
            if (event.key === 'ArrowLeft') next = Math.round(motionRef.current.target) + 1;
            if (event.key === 'ArrowRight') next = Math.round(motionRef.current.target) - 1;
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = shown.length - 1;
            if (next !== undefined) { event.preventDefault(); go(next); }
          }}>
          <div className="im-orbit__fallback" aria-hidden="true"><a href={shown[active]?.url} target="_blank" rel="noopener noreferrer" tabIndex={-1} draggable={false} onClick={(event) => activate(active, event)}>
            {failedPreview === shown[active]?.preview && <span className="im-orbit__image-error">پیش‌نمایش در دسترس نیست<span>ورود به تجربه ↖</span></span>}
            <img src={shown[active]?.preview} hidden={failedPreview === shown[active]?.preview} onError={() => setFailedPreview(shown[active]?.preview ?? null)} onLoad={() => setFailedPreview(null)} alt="" width="1200" height="800" decoding="async" loading="lazy" draggable={false} />
          </a></div>
          <span className="im-orbit__axis" aria-hidden="true">+</span>
        </div>
        <AnimatePresence>
          {selectedProject && <ProjectPreview key={selectedProject.id} project={selectedProject} reduced={reduced} onDismiss={() => { motionRef.current.blockClickUntil = performance.now() + 350; clearSelection(); }} />}
        </AnimatePresence>
        <ul className="im-orbit__captions">
          {shown.map((project, index) => (
            <li key={project.id} hidden={index !== active} role="group" aria-roledescription="اسلاید" aria-label={faDigit(index + 1) + ' از ' + faDigit(shown.length)}>
              <div className="im-orbit__project-meta"><span style={{ color: project.accent }}>{project.categoryLabel}</span><span dir="ltr">PROJECT / {String(projects.indexOf(project) + 1).padStart(2, '0')}</span></div>
              <a ref={(element) => { linksRef.current[index] = element; }} href={project.url} target="_blank" rel="noopener noreferrer" className="im-orbit__project-link" data-cursor="cta" onClick={(event) => activate(index, event)} aria-current={selected === index ? 'true' : undefined}><h3>{project.title.split('؛')[0]}</h3><span>{selected === index ? 'ورود به تجربه' : 'انتخاب پروژه'} <span aria-hidden="true">↖</span></span></a>
              <p>{project.tagline}</p>
              {selected === index && <ul className="im-orbit__detail-highlights">{project.highlights.slice(0, 2).map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>}
            </li>
          ))}
        </ul>
        <div className="im-orbit__controls">
          <p id="im-orbit-help" aria-live="polite">{selected !== null ? 'برای ورود، دوباره کلیک کنید' : 'اسکرول کنید یا بکشید'}<span className="im-sr-only">. پیکان‌ها برای جابه‌جایی، Enter برای انتخاب یا بازکردن، Escape برای بازگشت به گالری.</span></p>
          <span className="im-orbit__counter" aria-live="polite" aria-atomic="true"><b>{faDigit(String(active + 1).padStart(2, '0'))}</b><i>/</i>{faDigit(String(shown.length).padStart(2, '0'))}</span>
          <details className="im-orbit__tools" ref={toolsRef}>
            <summary data-cursor="link">انتخاب پروژه <span aria-hidden="true">↔</span></summary>
            <div className="im-orbit__tool-sheet">
              <div className="im-orbit__navigation">
                <button type="button" onClick={() => choose(Math.round(motionRef.current.target) - 1)} disabled={active === 0} aria-label="پروژهٔ قبلی" data-cursor="link">→</button>
                <button type="button" onClick={() => choose(Math.round(motionRef.current.target) + 1)} disabled={active === shown.length - 1} aria-label="پروژهٔ بعدی" data-cursor="link">←</button>
              </div>
              <label className="im-orbit__scrubber"><span className="im-sr-only">انتخاب پروژه</span><input type="range" min={0} max={Math.max(0, shown.length - 1)} step={1} value={active} disabled={shown.length === 1} aria-valuetext={shown[active]?.title} onChange={(event) => go(Number(event.target.value), true)} onPointerUp={() => closeGalleryMenu(toolsRef.current)} onKeyDown={(event) => { if (event.key === 'Enter') closeGalleryMenu(toolsRef.current); }} /></label>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
