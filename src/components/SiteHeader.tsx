import { useEffect, useRef, useState } from 'react';

const links = [
  { href: '#top', label: 'صفحه اصلی' },
  { href: '#demos', label: 'نمونه‌ها' },
  { href: '#about', label: 'درباره من' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 721px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const background = Array.from(document.querySelectorAll<HTMLElement>('#main, .site-footer, .mobile-dock'));
    const previousInert = background.map((element) => element.inert);
    background.forEach((element) => { element.inert = true; });
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (event.key === 'Tab' && headerRef.current) {
        const focusable = Array.from(headerRef.current.querySelectorAll<HTMLElement>('a[href], button')).filter((element) => element.getClientRects().length);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const onOutside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onOutside);
    return () => {
      document.body.style.overflow = previousOverflow;
      background.forEach((element, index) => { element.inert = previousInert[index]; });
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onOutside);
    };
  }, [open]);

  return (
    <>
      <header ref={headerRef} className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="shell site-header__inner">
          <a className="wordmark" href="#top" aria-label="نمونه‌کده؛ صفحه اصلی" onClick={() => setOpen(false)}>
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
                  دیدن کارها
                </a>
              </li>
            </ul>
          </nav>

          <button
            type="button"
            ref={toggleRef}
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
      <button
        className="nav-backdrop"
        type="button"
        hidden={!open}
        tabIndex={-1}
        aria-label="بستن منو"
        onClick={() => setOpen(false)}
      />
    </>
  );
}
