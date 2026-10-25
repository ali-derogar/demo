import { useEffect, useRef } from 'react';
import { subscribeRaf } from '../lib/raf';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const sections = [
  { id: 'top', label: 'خانه' },
  { id: 'caps', label: 'توانمندی' },
  { id: 'demos', label: 'نمونه‌کارها' },
  { id: 'about', label: 'درباره' },
  { id: 'contact', label: 'تماس' },
];

/**
 * ریل پیشرفت بالای صفحه + نقاط کناری. با همان حلقه‌ی rAF مشترک به‌روز می‌شود
 * و نقطه‌ی فعال را از موقعیت سکشن‌ها تشخیص می‌دهد.
 */
export function ScrollChrome() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const fill = root.querySelector<HTMLElement>('.v2-rail__fill');
    const dots = Array.from(root.querySelectorAll<HTMLAnchorElement>('.v2-dot'));

    const update = () => {
      const vh = window.innerHeight;
      const dh = document.documentElement.scrollHeight - vh;
      const progress = dh > 0 ? clamp01(window.scrollY / dh) : 0;
      if (fill) fill.style.width = `${progress * 100}%`;

      let active = 0;
      sections.forEach((section, index) => {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= vh * 0.4) active = index;
      });
      dots.forEach((dot, index) => dot.classList.toggle('is-on', index === active));
    };

    update();
    const unsubscribe = subscribeRaf(update);
    return () => unsubscribe();
  }, []);

  return (
    <div ref={rootRef} className="v2-chrome-root">
      <div className="v2-rail" aria-hidden="true">
        <div className="v2-rail__fill" />
      </div>
      <nav className="v2-dots" aria-label="پیشرفت صفحه">
        {sections.map((section, index) => (
          <a
            key={section.id}
            className={`v2-dot${index === 0 ? ' is-on' : ''}`}
            href={`#${section.id}`}
            data-cursor="link"
          >
            <span className="sr-only">{section.label}</span>
            <span className="v2-dot__label" aria-hidden="true">
              {section.label}
            </span>
          </a>
        ))}
      </nav>
    </div>
  );
}
