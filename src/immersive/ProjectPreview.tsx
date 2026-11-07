import { useRef } from 'react';
import { m, useIsPresent } from 'motion/react';
import type { DemoProject } from '../data/projects';

export function ProjectPreview({ project, reduced, onDismiss }: { project: DemoProject; reduced: boolean; onDismiss: () => void }) {
  const present = useIsPresent();
  const touch = useRef<number | null>(null);
  return (
    <m.div className="im-orbit__detail" aria-hidden={!present} style={{ pointerEvents: present ? 'auto' : 'none' }}
      initial={reduced ? false : { opacity: 0, scale: .94, clipPath: 'inset(10% 12% round 22px)' }}
      animate={{ opacity: 1, scale: 1, clipPath: 'inset(0% 0% round 0px)' }}
      exit={{ opacity: 0, scale: reduced ? 1 : .98, transition: { duration: reduced ? 0 : .55 } }}
      transition={{ duration: reduced ? 0 : 1.35, ease: [.29, .05, .06, .92] }}
      onPointerDown={(event) => { if (event.pointerType === 'touch') touch.current = event.clientY; }}
      onPointerMove={(event) => {
        if (touch.current !== null && Math.abs(event.clientY - touch.current) > 12) { touch.current = null; onDismiss(); }
      }} onPointerUp={() => { touch.current = null; }} onPointerCancel={() => { touch.current = null; }}>
      <div className="im-orbit__detail-haze" style={{ backgroundImage: `url(${project.preview})` }} aria-hidden="true" />
      <a className="im-orbit__detail-image" href={project.url} target="_blank" rel="noopener noreferrer" tabIndex={-1} data-cursor="cta" aria-label={'باز کردن دموی ' + project.title}>
        <img src={project.preview} alt={project.previewAlt} width="1200" height="800" draggable={false} decoding="async" />
      </a>
    </m.div>
  );
}
