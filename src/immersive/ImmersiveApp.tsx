import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { LazyMotion, domAnimation } from 'motion/react';
import { CustomCursor } from '../components/CustomCursor';
import { BrandMark } from '../components/BrandMark';
import { useSmoothScroll } from '../lib/useSmoothScroll';
import { subscribeRaf } from '../lib/raf';
import { projects } from '../data/projects';
import { ImmersiveNav } from './ImmersiveNav';
import { HomeView } from './HomeView';
import { WorkView } from './WorkView';
import { InfoPanel } from './InfoPanel';
import { useSceneNavigation } from './useSceneNavigation';
import { ambient } from './audio';
import type { SceneProgress, ViewId } from './types';
import type { OrbitMotion } from './orbit';

const Stage = lazy(() => import('./Stage').then((module) => ({ default: module.Stage })));
function StageFallback() {
  return <div className="im-stage im-stage--flat" aria-hidden="true"><div className="im-brand-fallback"><BrandMark /></div></div>;
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
  const progressRef = useRef<SceneProgress>({ chapter: 'home', position: 0, progress: 0, workBlend: 0, overlay: null });
  const workRef = useRef<OrbitMotion>({ items: projects, target: 0, position: 0, dragging: false, blockClickUntil: 0, ready: false, interactive: false });
  useSmoothScroll(false);
  const { panel, closePanel } = useSceneNavigation();

  useEffect(() => {
    document.documentElement.classList.add('im-root');
    return () => { document.documentElement.classList.remove('im-root'); ambient.dispose(); };
  }, []);
  useEffect(() => {
    progressRef.current.overlay = panel;
    ambient.setView(panel ?? view);
  }, [panel, view]);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const hero = main.querySelector<HTMLElement>('.im-home');
    let workTop = 1;
    let lastY = -1;
    let current: ViewId = 'home';
    const measure = () => {
      workTop = document.getElementById('demos')!.getBoundingClientRect().top + window.scrollY;
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
      const transitionStart = workTop - window.innerHeight * .8;
      const blend = Math.min(1, Math.max(0, (y - transitionStart) / Math.max(1, window.innerHeight * .8)));
      const phase = Math.min(1, Math.max(0, y / Math.max(1, workTop)));
      hero?.style.setProperty('--home-exit', Math.min(1, blend * 1.5).toFixed(4));
      progressRef.current.workBlend = blend;
      progressRef.current.position = blend;
      progressRef.current.progress = phase;
      const chapter = blend > .55 ? 'work' : 'home';
      progressRef.current.chapter = chapter;
      if (current !== chapter) { current = chapter; setView(chapter); }
    });
    return () => { unsubscribe(); observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  const toggleAudio = useCallback(() => {
    const next = !muted;
    ambient.setMuted(next);
    setMuted(next);
  }, [muted]);

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="im-experience" data-chapter={panel ?? view}>
        <CustomCursor />
        <SceneBoundary><Suspense fallback={<StageFallback />}><Stage progressRef={progressRef} workRef={workRef} /></Suspense></SceneBoundary>
        <a className="skip-link" href="#im-main">پرش به محتوا</a>
        <ImmersiveNav view={panel ?? view} muted={muted} onToggleAudio={toggleAudio} />
        <main id="im-main" ref={mainRef} tabIndex={-1}>
          <section id="home" className="im-chapter" aria-labelledby="im-home-title"><HomeView /></section>
          <section id="demos" className="im-chapter im-chapter--work" aria-labelledby="im-work-title"><WorkView motionRef={workRef} /></section>
        </main>
        <InfoPanel panel={panel} onClose={closePanel} />
      </div>
    </LazyMotion>
  );
}
