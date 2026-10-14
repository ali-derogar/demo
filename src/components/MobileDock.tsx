import { useEffect, useState } from 'react';

const items = [
  { id: 'top', label: 'خانه', path: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z' },
  { id: 'demos', label: 'نمونه‌ها', path: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z' },
  { id: 'about', label: 'درباره من', path: 'M12 11v6 M12 7h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0' },
];

export function MobileDock() {
  const [active, setActive] = useState('top');

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const current = items.filter(({ id }) => {
        const section = document.getElementById(id);
        return section && section.getBoundingClientRect().top <= 140;
      }).at(-1);
      setActive(current?.id ?? 'top');
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <nav className="mobile-dock" aria-label="دسترسی سریع موبایل">
      {items.map(({ id, label, path }) => (
        <a key={id} href={`#${id}`} className={active === id ? 'is-active' : undefined} aria-current={active === id ? 'location' : undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={path} />
          </svg>
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
