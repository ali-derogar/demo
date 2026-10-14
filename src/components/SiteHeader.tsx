import { useEffect, useState } from 'react';

const links = [
  { href: '#top', label: 'صفحه اصلی' },
  { href: '#demos', label: 'نمونه‌ها' },
  { href: '#about', label: 'درباره ما' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`} id="top">
      <div className="shell site-header__inner">
        <a className="wordmark" href="#top" aria-label="نمونه‌کده؛ صفحه اصلی">
          <span className="wordmark__mark" aria-hidden="true">
            ن
          </span>
          <span className="wordmark__text">
            نمونه‌کده
            <span className="wordmark__dot" aria-hidden="true">
              .
            </span>
          </span>
        </a>

        <nav id="site-nav" className={`site-nav${open ? ' is-open' : ''}`} aria-label="ناوبری اصلی">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
            <li className="site-nav__cta">
              <a href="#demos" onClick={() => setOpen(false)}>
                مشاهده‌ی نمونه‌ها
              </a>
            </li>
          </ul>
        </nav>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? 'بستن منو' : 'باز کردن منو'}</span>
          <span className="nav-toggle__bar" aria-hidden="true" />
          <span className="nav-toggle__bar" aria-hidden="true" />
          <span className="nav-toggle__bar" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
