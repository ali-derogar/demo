import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { capabilities } from '../data/profile';
import { subscribeRaf } from '../lib/raf';
import { useMediaQuery } from '../lib/useMedia';
import { Icon } from './icons';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * بخش «توانمندی» با اسکرول افقی پین‌شده: کارت‌ها در حین اسکرول عمودی، افقی جابه‌جا می‌شوند.
 * روی «کاهش حرکت» یا دستگاه لمسی، قفل اسکرول خاموش و کارت‌ها به‌صورت شبکه‌ای معمولی می‌چیند (در CSS).
 */
export function Capabilities() {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)');

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;

    const update = () => {
      const rect = root.getBoundingClientRect();
      const total = root.offsetHeight - window.innerHeight;
      const progress = clamp01(-rect.top / (total || 1));
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      track.style.transform = `translateX(${-progress * max}px)`;
    };

    update();
    return subscribeRaf(update);
  }, [reduced]);

  useEffect(() => {
    if (reduced || !fine) return;
    const root = rootRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-tilt]'));

    const onMove = (event: PointerEvent) => {
      const card = (event.target as Element | null)?.closest?.('[data-tilt]') as HTMLElement | null;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-4px)`;
    };
    const onLeave = (event: PointerEvent) => {
      const card = event.target as HTMLElement | null;
      if (card?.hasAttribute?.('data-tilt')) card.style.transform = '';
    };

    cards.forEach((card) => {
      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerleave', onLeave);
    });
    return () => {
      cards.forEach((card) => {
        card.removeEventListener('pointermove', onMove);
        card.removeEventListener('pointerleave', onLeave);
      });
    };
  }, [fine, reduced]);

  return (
    <section id="caps" className="v2-hscroll" ref={rootRef} aria-labelledby="caps-title">
      <div className="v2-hscroll__sticky">
        <div className="v2-hscroll__head shell">
          <p className="v2-kicker">توانمندی‌ها</p>
          <h2 id="caps-title" className="v2-h2">
            با اسکرول، افقی جابه‌جا شو
          </h2>
        </div>
        <div className="v2-hscroll__track" ref={trackRef}>
          {capabilities.map((cap) => (
            <article key={cap.id} className={`v2-cap v2-tone-${cap.tone}`} data-tilt data-cursor="link">
              <span className="v2-cap__n">{cap.n}</span>
              <span className="v2-cap__ic">
                <Icon name={cap.icon} />
              </span>
              <div className="v2-cap__body">
                <h3 className="v2-cap__title">{cap.title}</h3>
                <p className="v2-cap__text">{cap.text}</p>
                <ul className="v2-cap__tags" role="list">
                  {cap.tags.map((tag) => (
                    <li key={tag} dir="ltr">
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
