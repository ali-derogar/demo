import { useEffect, useRef } from 'react';
import { acquireScrollLock } from '../lib/scrollLock';
import { AboutView } from './AboutView';
import { ContactView } from './ContactView';
import type { PanelId } from './types';

export function InfoPanel({ panel, onClose }: { panel: PanelId | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !panel) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const unlock = acquireScrollLock();
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      unlock();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [panel]);

  return (
    <dialog ref={dialogRef} className="im-info-panel" aria-modal="true" aria-labelledby={panel === 'about' ? 'im-about-title' : 'im-contact-title'}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const elements = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, summary, [tabindex="0"]')).filter((element) => element.getClientRects().length > 0);
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
      <div className="im-info-panel__sheet" data-lenis-prevent data-scroll-lock-allow>
        <button type="button" className="im-info-panel__close" ref={closeRef} onClick={onClose} aria-label="بستن پنل" data-cursor="link"><span>بستن</span><span aria-hidden="true">×</span></button>
        {panel === 'about' && <section id="about" tabIndex={0} aria-labelledby="im-about-title"><AboutView /></section>}
        {panel === 'contact' && <section id="contact" tabIndex={0} aria-labelledby="im-contact-title"><ContactView /></section>}
      </div>
    </dialog>
  );
}
