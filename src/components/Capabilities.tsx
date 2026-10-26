import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { capabilities } from '../data/profile';
import { onResize, subscribeRaf } from '../lib/raf';
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
  /* همان شرطِ CSS که ردیف را به اسکرولِ بومی تبدیل می‌کند. */
  const nativeStrip = useMediaQuery('(hover: none), (max-width: 900px)');
  const stripMode = Boolean(reduced) || !fine || nativeStrip;

  useEffect(() => {
    // روی لمسی پین خاموش می‌ماند (JS نمی‌نویسد) و CSS کارت‌ها را به
    // ردیفِ افقیِ scroll-snap تبدیل می‌کند؛ وگرنه سوایپ عمودی با حرکت
    // افقی کارت‌ها رقابت می‌کرد.
    if (stripMode) return;
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;
    const bar = root.querySelector<HTMLElement>('.v2-hscroll__bar i');

    // اندازه‌ها یک‌بار در mount و هنگام resize؛ خواندن scrollWidth/offsetHeight
    // در هر فریم reflow اجباری می‌ساخت.
    let total = 1;
    let max = 0;
    const measure = () => {
      total = root.offsetHeight - window.innerHeight;
      max = Math.max(0, track.scrollWidth - track.clientWidth);
    };
    measure();
    const offResize = onResize(measure);

    const update = () => {
      const rect = root.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const progress = clamp01(-rect.top / total);
      track.style.transform = `translateX(${-progress * max}px)`;
      // ردیلِ پیشرفت: ۳۶۰vh اسکرولِ پین‌شده بدون نشانی، صفحه را «گیر‌کرده»
      // به‌نظر می‌رساند.
      if (bar) bar.style.transform = `scaleX(${progress})`;
    };

    update();
    const offRaf = subscribeRaf(update);
    return () => {
      offRaf();
      offResize();
    };
  }, [stripMode]);

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
          <p className="v2-kicker">
            <span className="v2-kicker__pulse" aria-hidden="true" />
            <span className="v2-kicker__n" aria-hidden="true">
              ۰۲
            </span>
            توانمندی‌ها
          </p>
          <h2 id="caps-title" className="v2-h2">
            با اسکرول، افقی جابه‌جا شو
          </h2>
          <div className="v2-hscroll__bar" aria-hidden="true">
            <i />
          </div>
        </div>
        {/* در حالتِ ردیفِ بومی (لمسی/پنجره‌ی باریک/کاهش حرکت) اسکرول‌بار
            پنهان است و کارت‌ها لینک ندارند؛ بدون focusable بودن، این
            فهرست با کیبورد قابلِ پیمایش نبود. */}
        <div
          className="v2-hscroll__track"
          ref={trackRef}
          role="group"
          aria-label="فهرست توانمندی‌ها"
          tabIndex={stripMode ? 0 : -1}
        >
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
