import { useEffect, useRef, type CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';
import type { DemoProject } from '../data/projects';
import { subscribeRaf } from '../lib/raf';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

interface Props {
  projects: DemoProject[];
}

/**
 * کارت‌های نمونه‌کار به‌صورت انباشته: هر کارت sticky است و با اسکرول، بعدی روی قبلی می‌آید
 * و قبلی کمی کوچک و تیره می‌شود. روی «کاهش حرکت» فقط چیدمان استیکی می‌ماند و افکت خاموش است.
 */
export function WorkStack({ projects }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.v2-stack__card'));

    const update = () => {
      for (const card of cards) {
        const item = card.parentElement;
        if (!item) continue;
        const rect = item.getBoundingClientRect();
        const passed = clamp01(-rect.top / rect.height);
        card.style.transform = `scale(${1 - passed * 0.12}) translateY(${passed * -8}px)`;
        card.style.filter = `brightness(${1 - passed * 0.4})`;
        const img = card.querySelector<HTMLElement>('.v2-shot img');
        if (img) img.style.transform = `scale(1.08) translateY(${passed * 24}px)`;
      }
    };

    update();
    return subscribeRaf(update);
  }, [projects, reduced]);

  return (
    <div ref={rootRef} className="v2-stack">
      {projects.map((project, index) => (
        <div className="v2-stack__item" key={project.id}>
          <article className="v2-stack__card" style={{ '--t': project.accent } as CSSProperties}>
            <div className="v2-shot">
              <div className="v2-chrome" aria-hidden="true">
                <i />
                <i />
                <i />
                <span dir="ltr">{`persianbotyar.dev${project.url}`}</span>
              </div>
              <img
                src={project.preview}
                alt={project.previewAlt}
                loading={index < 2 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </div>
            <div className="v2-meta">
              <span className="v2-meta__cat">{project.categoryLabel}</span>
              <h3 className="v2-meta__title">{project.title.split('؛')[0]}</h3>
              <p className="v2-meta__tag">{project.tagline}</p>
              <ul className="v2-meta__hl" role="list">
                {project.highlights.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <a className="v2-meta__open" href={project.url} data-cursor="link">
                باز کردن سایت
                <span aria-hidden="true">←</span>
              </a>
            </div>
          </article>
        </div>
      ))}
    </div>
  );
}
