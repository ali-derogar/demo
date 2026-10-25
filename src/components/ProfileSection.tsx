import { useEffect, useRef } from 'react';
import { aboutTimeline, languages, profile } from '../data/profile';
import { faDigit } from '../lib/fa';
import { subscribeRaf } from '../lib/raf';
import { Reveal } from './Reveal';
import { SkillsGrid } from './SkillsGrid';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** چهار نکته‌ی رویکرد طراحی که از بخش «درباره من» قبلی حفظ شده‌اند */
const approach = [
  {
    title: 'ظاهر سایت مناسب کارتون باشه',
    text: 'برای یه کافه عکس غذا و منو مهمه؛ برای فروشگاه، پیدا کردن محصول و خرید.',
  },
  {
    title: 'کار کردن با سایت راحت باشه',
    text: 'جست‌وجو، فرم‌ها و دکمه‌ها را طوری می‌چینم که بازدیدکننده سردرگم نشه.',
  },
  {
    title: 'با گوشی هم راحت کار کنه',
    text: 'اندازه‌ی متن و دکمه‌ها روی گوشی برای خوندن و کار کردن تنظیم می‌شه.',
  },
  {
    title: 'اطلاعات مهم دم دست باشه',
    text: 'قیمت، ساعت کاری و راه تماس جایی هستند که راحت پیدا بشن.',
  },
];

/** تایم‌لاینی که خط آن با اسکرول پر می‌شود */
function useTimelineFill(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
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
  }, [ref]);
}

export function ProfileSection() {
  const tlRef = useRef<HTMLDivElement>(null);
  useTimelineFill(tlRef);

  return (
    <section className="v2-about shell" id="about" aria-labelledby="about-title">
      <div className="v2-about__grid">
        <div className="v2-about__bio">
          <p className="v2-kicker">درباره من</p>
          <h2 className="v2-h2" id="about-title">
            کسی که پشت این کارهاست
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

          {profile.summary.map((paragraph) => (
            <Reveal as="p" className="v2-about__text" key={paragraph}>
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

      <div className="v2-about__block">
        <h3 className="v2-about__block-title">مهارت‌ها</h3>
        <SkillsGrid />
      </div>

      <div className="v2-about__block">
        <h3 className="v2-about__block-title">رویکرد من در طراحی</h3>
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
