import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { contactLinks, type ContactKind, type IconKey } from '../data/profile';
import { useMediaQuery } from '../lib/useMedia';
import { Icon } from './icons';
import { MaskLine } from './MaskReveal';

const ICONS: Record<ContactKind, IconKey> = {
  telegram: 'telegram',
  email: 'mail',
  phone: 'call',
  github: 'github',
};

/** دکمه‌ی فراخوان مغناطیسی؛ با نزدیک‌شدن نشانگر کمی به سمت آن کشیده می‌شود */
function useMagnetic<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)');

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !fine) return;
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate(${dx * 0.25}px, ${dy * 0.4}px)`;
    };
    const onLeave = () => {
      el.style.transform = '';
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [fine, reduced]);

  return ref;
}

export function ContactSection() {
  const telegram = contactLinks.find((link) => link.id === 'telegram');
  const ctaRef = useMagnetic<HTMLAnchorElement>();

  return (
    <section className="v2-contact shell" id="contact" aria-labelledby="contact-title">
      <h2 className="v2-contact__title" id="contact-title">
        <MaskLine>بیا پروژه‌ی بعدی را</MaskLine>{' '}
        <MaskLine className="v2-contact__grad">بسازیم</MaskLine>
      </h2>

      {telegram && (
        <a
          ref={ctaRef}
          className="v2-cta"
          href={telegram.href}
          target={telegram.external ? '_blank' : undefined}
          rel={telegram.external ? 'noreferrer' : undefined}
          data-cursor="cta"
        >
          ارتباط با من
          <span aria-hidden="true">←</span>
        </a>
      )}

      <ul className="v2-ccards" role="list">
        {contactLinks.map((link) => (
          <li key={link.id}>
            <a
              className="v2-ccard"
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noreferrer' : undefined}
              data-cursor="link"
            >
              <span className="v2-ccard__icon">
                <Icon name={ICONS[link.id]} />
              </span>
              <span className="v2-ccard__label">{link.label}</span>
              <span className="v2-ccard__value" dir="ltr">
                {link.value}
              </span>
              <span className="sr-only">؛ باز کردن {link.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
