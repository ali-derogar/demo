import { useEffect, useState } from 'react';
import { subscribeRaf } from '../lib/raf';

const items = [
  { id: 'top', label: 'خانه', path: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z' },
  { id: 'demos', label: 'نمونه‌ها', path: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z' },
  { id: 'about', label: 'درباره من', path: 'M12 11v6 M12 7h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0' },
  { id: 'contact', label: 'ارتباط', path: 'M4 5h16v12H8l-4 4z' },
];

const DETECT_LINE = 140;

export function MobileDock() {
  const [active, setActive] = useState('top');

  useEffect(() => {
    const update = () => {
      const current = items
        .filter(({ id }) => {
          const section = document.getElementById(id);
          return section && section.getBoundingClientRect().top <= DETECT_LINE;
        })
        .at(-1);
      setActive(current?.id ?? 'top');
    };
    let dirty = true;
    let last = -1;
    const unsubscribe = subscribeRaf((now) => {
      if (!dirty && now - last < 120) return;
      last = now;
      dirty = false;
      update();
    });
    const mark = () => {
      dirty = true;
    };
    window.addEventListener('scroll', mark, { passive: true });
    update();
    return () => {
      unsubscribe();
      window.removeEventListener('scroll', mark);
    };
  }, []);

  return (
    <nav className="mobile-dock" aria-label="دسترسی سریع موبایل">
      {items.map(({ id, label, path }) => (
        <a
          key={id}
          href={`#${id}`}
          className={active === id ? 'is-active' : undefined}
          aria-current={active === id ? 'location' : undefined}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={path} />
          </svg>
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
