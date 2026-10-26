import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { aboutTimeline, languages, profile } from '../data/profile';
import { faDigit } from '../lib/fa';
import { subscribeRaf } from '../lib/raf';
import { Reveal } from './Reveal';
import { SkillsGrid } from './SkillsGrid';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** چهار اصلِ کاری که جای «نکاتِ عمومیِ طراحی» را می‌گیرند */
const approach = [
  {
    title: 'مسئله، بعد ابزار',
    text: 'اول می‌فهمم کاربر در آخرِ کار چه کاری می‌خواهد انجام بدهد. انتخابِ فریمورک و دیتابیس بعد از این سؤال می‌آید، نه قبل از آن.',
  },
  {
    title: 'سادگی بر هوشمندی',
    text: 'بین راه‌حلِ باهوش و راه‌حلِ قابل‌فهم، دومی را انتخاب می‌کنم. کدی که شش ماه بعد کسی نفهمد، بدهی است؛ حتی اگر تمیز نوشته شده باشد.',
  },
  {
    title: 'سرعت، بخشی از طراحی است',
    text: 'روی گوشیِ معمولی و اینترنتِ واقعی نگاه می‌کنم، نه فقط روی لپ‌تاپِ خودم. صفحه‌ای که دیر بالا بیاید، درست طراحی نشده است.',
  },
  {
    title: 'تحویل، پایانِ کار نیست',
    text: 'تست، مستند و راهنمای استفاده را جزو خروجی می‌دانم. چیزی که فقط روی ماشینِ من کار می‌کند، آماده نیست.',
  },
];

/** تایم‌لاینی که خط آن با اسکرول پر می‌شود */
function useTimelineFill(ref: React.RefObject<HTMLElement>) {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const root = ref.current;
    if (!root) return;
    const fill = root.querySelector<HTMLElement>('.v2-tl__progress');
    if (!fill) return;
    const update = () => {
      const rect = root.getBoundingClientRect();
      const p = clamp01((window.innerHeight * 0.7 - rect.top) / rect.height);
      fill.style.transform = `scaleY(${p})`;
    };
    update();
    return subscribeRaf(update);
  }, [ref, reduced]);
}

export function ProfileSection() {
  const tlRef = useRef<HTMLDivElement>(null);
  useTimelineFill(tlRef);

  return (
    <section className="v2-about shell" id="about" aria-labelledby="about-title">
      <div className="v2-about__grid">
        <div className="v2-about__bio">
          <p className="v2-kicker">
            <span className="v2-kicker__pulse" aria-hidden="true" />
            <span className="v2-kicker__n" aria-hidden="true">
              ۰۵
            </span>
            درباره‌ی من
          </p>
          <h2 className="v2-h2" id="about-title">
            هم سرویس می‌سازم،
            <br />
            هم صفحه
          </h2>

          <div className="v2-avatars">
            <span className="v2-avatars__mark" aria-hidden="true">
              {profile.name.charAt(0)}
            </span>
            <span className="v2-avatars__who">
              <b>{profile.name}</b>
              <span>{profile.title}</span>
            </span>
          </div>

          <p className="v2-about__stack" dir="ltr">
            {profile.tagline.join(' · ')}
          </p>

          {profile.summary.map((paragraph) => (
            <Reveal as="p" className="v2-about__text" key={paragraph} from="fade">
              {paragraph}
            </Reveal>
          ))}

          <div className="v2-about__langs">
            {languages.map((language) => (
              <span key={language.name}>
                {language.name} — {language.level}
              </span>
            ))}
          </div>
        </div>

        <div className="v2-about__path">
          <h3 className="v2-about__block-title">مسیرِ کار</h3>
          <div className="v2-tl" ref={tlRef}>
            <span className="v2-tl__line" aria-hidden="true">
              <span className="v2-tl__progress" />
            </span>
            {aboutTimeline.map((node) => (
              <Reveal className="v2-tl__node" key={node.title}>
                <span className="v2-tl__dot" aria-hidden="true" />
                <h3 className="v2-tl__title">{node.title}</h3>
                <p className="v2-tl__meta">{node.meta}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      <div className="v2-about__block">
        <h3 className="v2-about__block-title">مهارت‌ها</h3>
        <SkillsGrid />
      </div>

      <div className="v2-about__block">
        <h3 className="v2-about__block-title">چطور کار می‌کنم</h3>
        <ul className="approach" role="list">
          {approach.map((note, index) => (
            <Reveal as="li" key={note.title} className="approach__item" delay={(index % 4) * 0.05}>
              <span className="approach__num">{faDigit(index + 1)}</span>
              <h4>{note.title}</h4>
              <p>{note.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
