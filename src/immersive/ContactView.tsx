import type { ReactElement } from 'react';
import { MaskLine } from '../components/MaskReveal';
import { contactLinks, profile, type ContactKind } from '../data/profile';

const ICONS: Record<ContactKind, ReactElement> = {
  telegram: (
    <path d="M21.5 4.5 2.8 11.7c-1 .4-1 1.8.1 2.1l4.6 1.4 1.8 5.5c.3.8 1.3 1 1.9.4l2.5-2.4 4.7 3.4c.7.5 1.7.1 1.9-.7l3-15.2c.2-1-.8-1.9-1.8-1.5zM9.6 14.4l8.7-5.6-6.9 6.6-.3 3.2-1.5-4.2z" />
  ),
  github: (
    <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5a4 4 0 0 1 1-2.7c-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7a4 4 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .3.3.6.9.6 1.8v2.7c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
  ),
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  phone: (
    <path d="M6.6 3h3l1.5 4.5-2 1.5a12 12 0 0 0 5.9 5.9l1.5-2L21 14.4v3a2.6 2.6 0 0 1-2.8 2.6A16.5 16.5 0 0 1 4 5.8 2.6 2.6 0 0 1 6.6 3z" />
  ),
};

function ContactIcon({ kind }: { kind: ContactKind }) {
  const filled = kind === 'telegram' || kind === 'github';
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[kind]}
    </svg>
  );
}

/** نمای تماس: چهار راهِ ارتباطی به‌صورت کارت‌های درشتِ زنده. */
export function ContactView() {
  return (
    <div className="im-contact im-shell">
      <div className="im-contact__inner">
        <header className="im-contact__head">
          <p className="im-kicker"><span className="im-section-number">۰۴ /</span> تماس با من</p>
          <h2 id="im-contact-title" className="im-section-title im-contact__title">
            <MaskLine>بیایید</MaskLine><MaskLine className="im-contact__accent">حرف بزنیم.</MaskLine>
          </h2>
          <p className="im-contact__lead">
            برای سفارش سایت یا همکاری، در تلگرام پیام بدهید یا جزئیات پروژه را ایمیل کنید.
          </p>
        </header>

        <ul className="im-contact__grid">
          {contactLinks.map((link, i) => (
            <li key={link.id} style={{ ['--i' as string]: i }}>
              <a
                className="im-contact__card"
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                data-cursor="cta"
              >
                <span className="im-contact__icon">
                  <ContactIcon kind={link.id} />
                </span>
                <span className="im-contact__body">
                  <span className="im-contact__label">{link.label}</span>
                  <span className="im-contact__value" dir="ltr">
                    {link.value}
                  </span>
                  {link.note && <span className="im-contact__note">{link.note}</span>}
                </span>
                <svg className="im-contact__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </a>
            </li>
          ))}
        </ul>

        <footer className="im-contact__foot">
          <span>{profile.location}</span>
          <span className="im-contact__brand" dir="ltr">{profile.brand}</span>
          <a href="#home" className="im-back-top" data-cursor="link">بازگشت به بالا <span aria-hidden="true">↑</span></a>
        </footer>
      </div>
    </div>
  );
}
