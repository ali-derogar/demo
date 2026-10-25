import { useEffect, useRef, useState } from 'react';
import { getLenis } from '../lib/useSmoothScroll';
import { BrandMark } from './BrandMark';

const links = [
  { href: '#top', label: 'صفحه اصلی' },
  { href: '#demos', label: 'نمونه‌ها' },
  { href: '#about', label: 'درباره من' },
  { href: '#contact', label: 'ارتباط' },
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
    getLenis()?.stop();
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
      getLenis()?.start();
      background.forEach((element, index) => { element.inert = previousInert[index]; });
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onOutside);
    };
  }, [open]);

  return (
    <>
      <header ref={headerRef} className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="shell site-header__inner">
          <a className="wordmark" href="#top" aria-label="persianbotyar؛ صفحه اصلی" onClick={() => setOpen(false)}>
            <BrandMark />
            <span className="wordmark__text" dir="ltr">
              persianbotyar
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

          <a
            className="header-gh"
            href="https://github.com/ali-derogar"
            target="_blank"
            rel="noreferrer"
            dir="ltr"
            data-cursor="link"
            aria-label="گیت‌هاب من"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
            </svg>
          </a>

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
