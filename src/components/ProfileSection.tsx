import { languages, profile } from '../data/profile';
import { faDigit } from '../lib/fa';
import { ExperienceTimeline } from './ExperienceTimeline';
import { Reveal } from './Reveal';
import { SectionHead } from './SectionHead';
import { SkillsGrid } from './SkillsGrid';

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

export function ProfileSection() {
  return (
    <section className="profile" id="about" aria-labelledby="profile-title">
      <div className="shell">
        <SectionHead
          id="profile-title"
          eyebrow="درباره من"
          title={<>کسی که پشت این نمونه‌کارهاست</>}
          lead="هم رابط کاربری را می‌سازم و هم بک‌اندی که زیرش کار می‌کند."
        />

        <div className="profile__bio">
          <Reveal className="profile__card">
            <div className="profile__id">
              <span className="profile__avatar" aria-hidden="true">
                {profile.name.charAt(0)}
              </span>
              <div>
                <h3 className="profile__name">{profile.name}</h3>
                <p className="profile__title">{profile.title}</p>
                <p className="profile__tagline" dir="ltr">
                  {profile.tagline.join(' · ')}
                </p>
              </div>
            </div>
            {profile.summary.map((paragraph) => (
              <p className="profile__text" key={paragraph}>
                {paragraph}
              </p>
            ))}
            <div className="profile__meta">
              <span className="profile__loc">{profile.location}</span>
              <ul className="profile__langs" role="list">
                {languages.map((language) => (
                  <li key={language.name}>
                    {language.name} — {language.level}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <div className="profile__block">
          <h3 className="profile__block-title">مهارت‌ها</h3>
          <SkillsGrid />
        </div>

        <div className="profile__block">
          <h3 className="profile__block-title">تجربه و تحصیلات</h3>
          <ExperienceTimeline />
        </div>

        <div className="profile__block">
          <h3 className="profile__block-title">رویکرد من در طراحی</h3>
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
      </div>
    </section>
  );
}
