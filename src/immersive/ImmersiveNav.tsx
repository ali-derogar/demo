import { useEffect, useRef, useState } from 'react';
import { BrandMark } from '../components/BrandMark';
import { useMediaQuery } from '../lib/useMedia';
import { NAV_ITEMS, type ViewId } from './types';
import { profile } from '../data/profile';

interface Props { view: ViewId; muted: boolean; onToggleAudio: () => void; }

export function ImmersiveNav({ view, muted, onToggleAudio }: Props) {
  const [open, setOpen] = useState(false);
  const compact = useMediaQuery('(max-width: 767px)');
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => { if (!compact) setOpen(false); }, [compact]);
  useEffect(() => {
    if (!open) return;
    navRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onOutside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onFocus = (event: FocusEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('focusin', onFocus);
    };
  }, [open]);

  return (
    <header className="im-nav" data-open={open} ref={headerRef}>
      <a className="im-nav__brand" href="#home" data-cursor="link" aria-label={profile.brand + ' — بازگشت به خانه'} onClick={() => setOpen(false)}>
        <BrandMark /><span dir="ltr">{profile.brand}<small>CRAFTING DIGITAL EXPERIENCES</small></span>
      </a>
      <nav id="im-navigation" className="im-nav__links" ref={navRef} aria-label="ناوبری اصلی" hidden={compact && !open}>
        {NAV_ITEMS.map((item, index) => (
          <a key={item.id} href={'#' + item.anchor} className="im-nav__item" aria-current={view === item.id ? 'location' : undefined} onClick={() => setOpen(false)} data-cursor="link">
            <span className="im-nav__index" aria-hidden="true">0{index + 1}</span>{item.label}<span className="im-nav__dot" aria-hidden="true" />
          </a>
        ))}
      </nav>
      <div className="im-nav__controls">
        <button type="button" className="im-nav__sound" onClick={onToggleAudio} aria-pressed={!muted} aria-label={muted ? 'روشن کردن صدا' : 'خاموش کردن صدا'} data-cursor="link">
          <span className="im-sound-bars" data-muted={muted} aria-hidden="true"><i /><i /><i /><i /></span><span>صدا <b>{muted ? 'خاموش' : 'روشن'}</b></span>
        </button>
        <button type="button" ref={toggleRef} className="im-nav__toggle" aria-controls="im-navigation" aria-expanded={open} aria-label={open ? 'بستن منو' : 'باز کردن منو'} onClick={() => setOpen(!open)} hidden={!compact}><span /><span /></button>
      </div>
    </header>
  );
}
