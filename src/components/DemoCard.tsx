import { type PointerEvent } from 'react';
import { m, useReducedMotion } from 'motion/react';
import type { DemoProject } from '../data/projects';

interface Props {
  project: DemoProject;
  priority?: boolean;
  revealDelay?: number;
}

export function DemoCard({ project, priority = false, revealDelay = 0 }: Props) {
  const reduced = useReducedMotion();

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
  };

  const shared = {
    className: 'card',
    onPointerMove,
    style: { ['--card-accent' as string]: project.accent },
  };

  const body = (
    <article className="card__body">
      <a className="card__media" href={project.url} tabIndex={-1} aria-hidden="true">
        <img
          src={project.preview}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          width={1200}
          height={800}
        />
        <span className="card__media-tint" />
      </a>

      <div className="card__content">
        <p className="card__category">{project.categoryLabel}</p>
        <span className="card__live"><span aria-hidden="true" />پیش‌نمایش</span>
        <h3 className="card__title">
          <a className="card__link" href={project.url} data-cursor="link">
            {project.title}
            <span className="sr-only">؛ باز کردن وب‌سایت</span>
          </a>
        </h3>
        <p className="card__tagline">{project.tagline}</p>
        <p className="card__desc">{project.description}</p>

        <ul className="card__tags" role="list" aria-label="امکانات این نمونه">
          {project.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="card__foot">
          <p className="card__tech">{project.technologies.join(' • ')}</p>
          <a className="card__action" href={project.url}>
            باز کردن سایت
            <span aria-hidden="true">
              {' '}
              ←
            </span>
          </a>
        </div>
      </div>
    </article>
  );

  if (reduced) {
    return <li {...shared}>{body}</li>;
  }

  return (
    <m.li
      {...shared}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay: revealDelay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {body}
    </m.li>
  );
}
