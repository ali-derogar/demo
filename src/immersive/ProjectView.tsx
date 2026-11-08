import { useLayoutEffect, useRef, useState, type MutableRefObject } from 'react';
import type { DemoProject } from '../data/projects';
import { subscribeRaf } from '../lib/raf';
import type { OrbitMotion } from './orbit';
import { projectFrame } from './projectPresentation';
import '../styles/project.css';

/** Accessible controls over the shared GPU presentation; the poster is a real fallback. */
export function ProjectView({ project, motionRef, onClose }: { project: DemoProject; motionRef: MutableRefObject<OrbitMotion>; onClose: () => void }) {
  const rootRef = useRef<HTMLElement>(null);
  const entryRef = useRef<HTMLAnchorElement>(null);
  const [failed, setFailed] = useState(false);
  useLayoutEffect(() => {
    setFailed(false);
    const root = rootRef.current!;
    const sticky = document.querySelector<HTMLElement>('.im-work--orbit');
    let previous = '', ready: boolean | undefined, phase = '', surface = '', progress = -1;
    const frame = () => {
      const state = motionRef.current.presentation!;
      const bounds = state.bounds ?? projectFrame(document.documentElement.clientWidth || window.innerWidth, window.innerHeight, sticky?.offsetHeight || window.innerHeight);
      const key = [bounds.left, bounds.top, bounds.width, bounds.height].map((value) => value.toFixed(2)).join(':');
      if (key !== previous) {
        previous = key;
        root.style.setProperty('--project-left', `${bounds.left}px`); root.style.setProperty('--project-top', `${bounds.top}px`);
        root.style.setProperty('--project-width', `${bounds.width}px`); root.style.setProperty('--project-height', `${bounds.height}px`);
      }
      if (ready !== state.ready) { root.dataset.ready = String(state.ready); ready = state.ready; }
      if (surface !== state.surface) { root.dataset.surface = state.surface; surface = state.surface; }
      if (phase !== state.phase) { root.dataset.phase = state.phase; phase = state.phase; }
      if (progress !== state.progress) { root.style.setProperty('--project-progress', String(state.progress)); progress = state.progress; }
    };
    frame();
    motionRef.current.onFrame?.();
    motionRef.current.presentation!.onFrame = frame;
    const unsubscribe = subscribeRaf(frame);
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog[open]')) return;
      event.preventDefault(); onClose();
    };
    document.addEventListener('keydown', escape);
    return () => { motionRef.current.presentation!.onFrame = undefined; unsubscribe(); document.removeEventListener('keydown', escape); };
  }, [motionRef, onClose, project.id]);

  return <section ref={rootRef} className="im-project" role="region" aria-labelledby="im-project-title" data-project={project.id} data-ready="false" data-surface="pending" style={{ ['--project-accent' as string]: project.accent, ['--project-surface' as string]: project.visual.surface }}>
    <a ref={entryRef} className="im-project__hitarea" href={project.url} target="_blank" rel="noopener noreferrer" aria-label={`دیدن سایت ${project.title.split('؛')[0]}`} onClick={(event) => { if (motionRef.current.dragging || performance.now() < motionRef.current.blockClickUntil || motionRef.current.presentation!.progress < .95) event.preventDefault(); }}>
      <div className="im-project__poster" aria-hidden="true">
        {failed ? <span className="im-project__image-error">تصویر بارگذاری نشد<span>دیدن سایت ↖</span></span> : <img key={project.preview} src={project.preview} alt="" width="1200" height="800" onError={() => setFailed(true)} draggable={false} />}
      </div>
    </a>
    <div className="im-project__info" data-lenis-prevent data-scroll-lock-allow>
      <p className="im-project__category">{project.categoryLabel}</p>
      <h2 id="im-project-title">{project.title.split('؛')[0]}</h2>
      <p className="im-project__description">{project.description}</p>
      <div className="im-project__actions">
        <a href={project.url} target="_blank" rel="noopener noreferrer">دیدن سایت <span aria-hidden="true">↗</span></a>
        <button type="button" onClick={onClose}>بازگشت به گالری <span aria-hidden="true">↶</span></button>
      </div>
      <span className="im-sr-only">با Escape به گالری برگردید. لینک «دیدن سایت» نمونه‌کار را در تب جدید باز می‌کند.</span>
    </div>
  </section>;
}
