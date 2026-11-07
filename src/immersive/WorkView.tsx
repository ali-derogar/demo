import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useReducedMotion } from 'motion/react';
import { faDigit } from '../lib/fa';
import { getLenis } from '../lib/useSmoothScroll';
import { subscribeRaf } from '../lib/raf';
import { projects, categories, type DemoCategory } from '../data/projects';
import { clampProject, projectFromScroll, releaseProject, scrollForProject, type OrbitMotion } from './orbit';
import '../styles/orbit.css';

const WorkOrbit = lazy(() => import('./WorkOrbit').then((module) => ({ default: module.WorkOrbit })));

export function WorkView() {
  const [filter, setFilter] = useState<DemoCategory>('all');
  const [active, setActive] = useState(0);
  const [near, setNear] = useState(false);
  const reduced = useReducedMotion();
  const shown = useMemo(() => filter === 'all' ? projects : projects.filter((project) => project.category === filter), [filter]);
  const trackRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const motionRef = useRef<OrbitMotion>({ target: 0, position: 0, dragging: false, blockClickUntil: 0 });
  const metricsRef = useRef({ start: 0, travel: 1 });
  const dragRef = useRef({ id: -1, x: 0, y: 0, start: 0, lastX: 0, lastTime: 0, speed: 0 });

  const measure = useCallback(() => {
    const track = trackRef.current;
    const sticky = stickyRef.current;
    if (!track || !sticky) return;
    metricsRef.current = {
      start: track.getBoundingClientRect().top + window.scrollY,
      travel: Math.max(1, track.offsetHeight - sticky.offsetHeight),
    };
  }, []);

  const go = useCallback((index: number, immediate = false) => {
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
  }, [measure, reduced, shown.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setNear(true); }, { rootMargin: '600px' });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const sticky = stickyRef.current;
    if (!track || !sticky) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    observer.observe(sticky);
    window.addEventListener('resize', measure, { passive: true });
    let lastY = -1;
    let current = 0;
    const unsubscribe = reduced ? () => {} : subscribeRaf(() => {
      const state = motionRef.current;
      const y = window.scrollY;
      if (y !== lastY && !state.dragging) {
        const { start, travel } = metricsRef.current;
        state.target = projectFromScroll(y, start, travel, shown.length);
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
  }, [measure, reduced, shown]);

  const changeFilter = (value: DemoCategory) => {
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
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.1) { drag.id = -1; return; }
      if (Math.abs(dx) < 7) return;
      state.dragging = true;
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
  const onPick = (index: number) => {
    if (index === active && Math.abs(motionRef.current.position - index) < .3) linksRef.current[index]?.click();
    else go(index);
  };

  return (
    <div className="im-work-track" ref={trackRef} style={{ ['--orbit-steps' as string]: shown.length - 1 }}>
      <div className="im-work im-shell im-work--orbit" ref={stickyRef}>
        <header className="im-orbit__head">
          <div><p className="im-kicker"><span className="im-section-number">۰۲ /</span> منتخب تجربه‌ها</p><h2 id="im-work-title">جهان‌های ساخته‌شده.</h2></div>
          <span className="im-orbit__edition" dir="ltr" aria-hidden="true">SELECTED WORK / EXPLORE THE ORBIT</span>
        </header>
        <div className="im-orbit__filters" role="group" aria-label="دسته‌بندی نمونه‌کارها">
          <div className="im-orbit__filter-buttons">{categories.map((category) => <button key={category.value} type="button" className="im-filter" aria-pressed={filter === category.value} onClick={() => changeFilter(category.value)} data-cursor="link">{category.label}</button>)}</div>
          <label className="im-orbit__select"><span>دسته‌بندی</span><select value={filter} onChange={(event) => changeFilter(event.target.value)}>{categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label>
          <span className="im-work__count">{faDigit(shown.length)} تجربه</span>
        </div>
        <div className="im-orbit__stage" tabIndex={0} role="region" aria-roledescription="گالری چرخشی" aria-label="نمونه‌کارهای سه‌بعدی" aria-describedby="im-orbit-help" data-cursor="drag"
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={(event) => finishDrag(event)} onPointerCancel={(event) => finishDrag(event, true)}
          onLostPointerCapture={(event) => finishDrag(event, true)}
          onKeyDown={(event) => {
            let next: number | undefined;
            if (event.key === 'ArrowLeft') next = Math.round(motionRef.current.target) + 1;
            if (event.key === 'ArrowRight') next = Math.round(motionRef.current.target) - 1;
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = shown.length - 1;
            if (next !== undefined) { event.preventDefault(); go(next); }
          }}>
          <div className="im-orbit__fallback" aria-hidden="true"><img src={shown[active]?.preview} alt="" width="1200" height="800" decoding="async" loading="lazy" /></div>
          <Suspense fallback={null}>{near && !reduced && <WorkOrbit items={shown} motionRef={motionRef} onPick={onPick} />}</Suspense>
          <span className="im-orbit__axis" aria-hidden="true">+</span>
        </div>
        <ul className="im-orbit__captions">
          {shown.map((project, index) => (
            <li key={project.id} hidden={index !== active} role="group" aria-roledescription="اسلاید" aria-label={faDigit(index + 1) + ' از ' + faDigit(shown.length)}>
              <div className="im-orbit__project-meta"><span style={{ color: project.accent }}>{project.categoryLabel}</span><span dir="ltr">PROJECT / {String(projects.indexOf(project) + 1).padStart(2, '0')}</span></div>
              <a ref={(element) => { linksRef.current[index] = element; }} href={project.url} target="_blank" rel="noopener noreferrer" className="im-orbit__project-link" data-cursor="cta"><h3>{project.title.split('؛')[0]}</h3><span>ورود به تجربه <span aria-hidden="true">↖</span></span></a>
              <p>{project.tagline}</p>
            </li>
          ))}
        </ul>
        <div className="im-orbit__controls">
          <p id="im-orbit-help"><span aria-hidden="true">↔</span> اسکرول کنید یا تصویرها را بکشید<span className="im-sr-only">. برای انتخاب با کیبورد، از کلیدهای پیکان چپ و راست استفاده کنید.</span></p>
          <div className="im-orbit__navigation">
            <button type="button" onClick={() => go(Math.round(motionRef.current.target) - 1)} disabled={active === 0} aria-label="پروژهٔ قبلی" data-cursor="link">→</button>
            <span className="im-orbit__counter" aria-live="polite" aria-atomic="true"><b>{faDigit(String(active + 1).padStart(2, '0'))}</b><i>/</i>{faDigit(String(shown.length).padStart(2, '0'))}</span>
            <button type="button" onClick={() => go(Math.round(motionRef.current.target) + 1)} disabled={active === shown.length - 1} aria-label="پروژهٔ بعدی" data-cursor="link">←</button>
          </div>
          <label className="im-orbit__scrubber"><span className="im-sr-only">انتخاب پروژه</span><input type="range" min={0} max={Math.max(0, shown.length - 1)} step={1} value={active} disabled={shown.length === 1} aria-valuetext={shown[active]?.title} onChange={(event) => go(Number(event.target.value), true)} /></label>
        </div>
        <a href="#about" className="im-orbit__continue" data-cursor="link">پشتِ این تجربه‌ها <span aria-hidden="true">↓</span></a>
      </div>
    </div>
  );
}
