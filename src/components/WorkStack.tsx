import { useEffect, useRef, type CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';
import type { DemoProject } from '../data/projects';
import { faDigit } from '../lib/fa';
import { onResize, subscribeRaf } from '../lib/raf';

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
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.v2-stack__item')).map((item) => ({
      item,
      card: item.querySelector<HTMLElement>('.v2-stack__card'),
      scrim: item.querySelector<HTMLElement>('.v2-stack__scrim'),
      img: item.querySelector<HTMLElement>('.v2-shot img'),
      top: 0,
      height: 1,
    }));

    // offsetها یک‌بار در mount و هنگام resize اندازه‌گیری می‌شود؛ خواندن
    // getBoundingClientRectِ ۸ کارت در هر فریم، reflow اجباری می‌ساخت.
    const measure = () => {
      const scrollY = window.scrollY;
      for (const c of cards) {
        const rect = c.item.getBoundingClientRect();
        c.top = rect.top + scrollY;
        c.height = rect.height || 1;
      }
    };
    measure();
    const offResize = onResize(measure);

    const update = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      for (const c of cards) {
        // کارت‌های خارج از دید (با حاشیه) هیچ خواندن/نوشتنی ندارند
        if (c.top > scrollY + vh * 1.2 || c.top + c.height < scrollY - vh * 0.2) continue;
        const passed = clamp01((scrollY - c.top) / c.height);
        if (c.card) {
          c.card.style.transform = `scale(${1 - passed * 0.12}) translateY(${passed * -8}px)`;
        }
        // scrim با opacity (کامپوزیت) به‌جای filter: brightness روی هر فریم
        if (c.scrim) c.scrim.style.opacity = String(passed * 0.4);
        if (c.img) c.img.style.transform = `scale(1.08) translateY(${passed * 24}px)`;
      }
    };

    update();
    const offRaf = subscribeRaf(update);
    return () => {
      offRaf();
      offResize();
    };
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
                width={1200}
                height={800}
                loading={index < 2 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </div>
            <div className="v2-meta">
              <span className="v2-meta__no" aria-hidden="true">
                {faDigit(String(index + 1).padStart(2, '0'))}
              </span>
              <span className="v2-meta__cat">{project.categoryLabel}</span>
              <h3 className="v2-meta__title">{project.title.split('؛')[0]}</h3>
              <p className="v2-meta__tag">{project.tagline}</p>
              <p className="v2-meta__desc">{project.description}</p>
              <ul className="v2-meta__hl" role="list">
                {project.highlights.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="v2-meta__tech" dir="ltr">
                {project.technologies.join(' · ')}
              </p>
              <a className="v2-meta__open" href={project.url} data-cursor="link">
                باز کردن سایت
                <span aria-hidden="true">←</span>
              </a>
            </div>
            <span className="v2-stack__scrim" aria-hidden="true" />
          </article>
        </div>
      ))}
    </div>
  );
}
