import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { LazyMotion, domAnimation } from 'motion/react';
import { CustomCursor } from '../components/CustomCursor';
import { useSmoothScroll } from '../lib/useSmoothScroll';
import { subscribeRaf } from '../lib/raf';
import { ImmersiveNav } from './ImmersiveNav';
import { HomeView } from './HomeView';
import { WorkView } from './WorkView';
import { AboutView } from './AboutView';
import { ContactView } from './ContactView';
import { ambient } from './audio';
import { NAV_ITEMS, type SceneProgress, type ViewId } from './types';

const Stage = lazy(() => import('./Stage').then((mod) => ({ default: mod.Stage })));

function StageFallback() {
  return <div className="im-stage im-stage--flat" aria-hidden="true"><div className="im-portal-fallback" /></div>;
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <StageFallback /> : this.props.children; }
}

export function ImmersiveApp() {
  const [view, setView] = useState<ViewId>('home');
  const [muted, setMuted] = useState(true);
  const mainRef = useRef<HTMLElement>(null);
  const progressRef = useRef<SceneProgress>({ chapter: 'home', position: 0, progress: 0 });
  useSmoothScroll();

  useEffect(() => {
    document.documentElement.classList.add('im-root');
    return () => {
      document.documentElement.classList.remove('im-root');
      ambient.dispose();
    };
  }, []);

  useEffect(() => { ambient.setView(view); }, [view]);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    let bounds: number[] = [];
    let lastY = -1;
    let current: ViewId = 'home';
    const measure = () => {
      bounds = NAV_ITEMS.map(({ anchor }) => {
        const section = document.getElementById(anchor)!;
        return section.getBoundingClientRect().top + window.scrollY;
      });
      lastY = -1;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(main);
    window.addEventListener('resize', measure, { passive: true });
    const unsubscribe = subscribeRaf(() => {
      const y = Math.max(0, window.scrollY);
      if (y === lastY) return;
      lastY = y;
      let index = 0;
      while (index < bounds.length - 1 && y >= bounds[index + 1]) index++;
      const end = bounds[index + 1] ?? Math.max(bounds[index] + 1, main.scrollHeight - window.innerHeight);
      const local = Math.min(1, Math.max(0, (y - bounds[index]) / Math.max(1, end - bounds[index])));
      let active = 0;
      const marker = y + Math.min(window.innerHeight * 0.3, 240);
      while (active < bounds.length - 1 && marker >= bounds[active + 1]) active++;
      const chapter = NAV_ITEMS[active].id;
      progressRef.current = { chapter, position: Math.min(3, index + local), progress: local };
      if (current !== chapter) {
        current = chapter;
        setView(chapter);
      }
    });
    return () => {
      unsubscribe();
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const toggleAudio = useCallback(() => {
    const next = !muted;
    ambient.setMuted(next);
    setMuted(next);
  }, [muted]);

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="im-experience" data-chapter={view}>
        <CustomCursor />
        <SceneBoundary>
          <Suspense fallback={<StageFallback />}><Stage progressRef={progressRef} /></Suspense>
        </SceneBoundary>
        <a className="skip-link" href="#im-main">پرش به محتوا</a>
        <ImmersiveNav view={view} muted={muted} onToggleAudio={toggleAudio} />
        <main id="im-main" ref={mainRef} tabIndex={-1}>
          <section id="home" className="im-chapter" aria-labelledby="im-home-title"><HomeView /></section>
          <section id="demos" className="im-chapter im-chapter--work" aria-labelledby="im-work-title"><WorkView /></section>
          <section id="about" className="im-chapter im-chapter--about" aria-labelledby="im-about-title"><AboutView /></section>
          <section id="contact" className="im-chapter im-chapter--contact" aria-labelledby="im-contact-title"><ContactView /></section>
        </main>
        <div className="im-edge-note" aria-hidden="true"><span dir="ltr">DESIGNED & DEVELOPED WITH INTENT</span></div>
      </div>
    </LazyMotion>
  );
}
