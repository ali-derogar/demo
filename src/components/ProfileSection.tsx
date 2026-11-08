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
    title: 'شناخت نیاز پروژه',
    text: 'قبل از شروع، دربارهٔ کاربرها و نیازهای پروژه صحبت می‌کنیم و ابزار مناسب را انتخاب می‌کنم.',
  },
  {
    title: 'کد قابل‌فهم',
    text: 'کد را طوری می‌نویسم که تغییر دادن و ادامه دادن آن برای برنامه‌نویس بعدی راحت باشد.',
  },
  {
    title: 'سرعت و نمایش در موبایل',
    text: 'سرعت بارگذاری و کار کردن با سایت در موبایل را هنگام ساخت بررسی می‌کنم.',
  },
  {
    title: 'تست و راهنمای استفاده',
    text: 'همراه پروژه، تست‌ها و توضیح لازم برای اجرا و نگهداری آن را آماده می‌کنم.',
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
