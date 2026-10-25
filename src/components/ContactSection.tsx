import { contactLinks, profile, type ContactKind } from '../data/profile';
import { Reveal } from './Reveal';
import { SectionHead } from './SectionHead';

function ContactIcon({ kind }: { kind: ContactKind }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };
  switch (kind) {
    case 'telegram':
      return (
        <svg {...common}>
          <path d="m21 4-2.6 15.5a1 1 0 0 1-1.5.7L12 17l-2.2 2.2a.6.6 0 0 1-1-.4l-.3-4.4L18 6.5 6.6 13 2.7 11.6a.7.7 0 0 1 0-1.3L21 4Z" />
        </svg>
      );
    case 'github':
      return (
        <svg {...common}>
          <path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
        </svg>
      );
    case 'email':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...common}>
          <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2Z" />
        </svg>
      );
  }
}

export function ContactSection() {
  return (
    <section className="contact" id="contact" aria-labelledby="contact-title">
      <div className="shell">
        <SectionHead
          id="contact-title"
          eyebrow="ارتباط"
          title="بیا پروژه‌ی بعدی را بسازیم"
          lead={`برای گفت‌وگو، پیشنهاد همکاری یا پرسیدن هر سؤال در ${profile.title.toLowerCase()} و طراحی رابط، از هر یک از این راه‌ها در تماس باشید.`}
        />

        <ul className="contact__grid" role="list">
          {contactLinks.map((link, index) => (
            <Reveal as="li" key={link.id} delay={(index % 4) * 0.06}>
              <a
                className="contact-card"
                href={link.href}
                data-cursor="link"
                {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                <span className="contact-card__icon">
                  <ContactIcon kind={link.id} />
                </span>
                <span className="contact-card__body">
                  <span className="contact-card__label">{link.label}</span>
                  <span className="contact-card__value" dir="ltr">
                    {link.value}
                  </span>
                  {link.note && <span className="contact-card__note">{link.note}</span>}
                </span>
                <span className="sr-only">؛ باز کردن {link.label}</span>
              </a>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
