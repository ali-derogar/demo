import { projects } from '../data/projects';
import { faDigit } from '../lib/fa';

const notes = [
  {
    title: 'ظاهر سایت مناسب کارتون باشه',
    text: 'ظاهر سایت رو با توجه به کار شما طراحی می‌کنم. برای یه کافه، عکس غذا و منو مهمه؛ برای فروشگاه، پیدا کردن محصول و خرید.',
  },
  {
    title: 'کار کردن با سایت راحت باشه',
    text: 'جست‌وجو، فرم‌ها و دکمه‌ها رو طوری می‌چینم که بازدیدکننده برای پیدا کردن چیزی که می‌خواد سردرگم نشه.',
  },
  {
    title: 'با گوشی هم راحت کار کنه',
    text: 'روی گوشی، اندازه‌ی متن و دکمه‌ها رو طوری تنظیم می‌کنم که خوندن و کار کردن با سایت راحت باشه.',
  },
  {
    title: 'اطلاعات مهم دم دست باشه',
    text: 'قیمت، ساعت کاری و راه تماس رو جایی می‌ذارم که راحت پیدا بشن. مشتری نباید برای یه سؤال ساده کل سایت رو بگرده.',
  },
];

export function AboutSection() {
  return (
    <section className="about" id="about" aria-labelledby="about-title">
      <div className="shell about__inner">
        <div className="about__head">
          <p className="eyebrow">درباره من</p>
          <h2 id="about-title">توی طراحی به چی توجه می‌کنم؟</h2>
          <p className="about__lead">
            وقتی یه سایت می‌سازم، به این فکر می‌کنم که کسی که واردش می‌شه دنبال چیه و چطور راحت‌تر
            پیداش کنه. این چند تا نکته برام مهمه:
          </p>
        </div>

        <ul className="about__grid" role="list">
          {notes.map((note, index) => (
            <li className="about__item" key={note.title}>
              <span className="about__num" aria-hidden="true">
                {faDigit(index + 1)}
              </span>
              <h3>{note.title}</h3>
              <p>{note.text}</p>
            </li>
          ))}
        </ul>

        <ul className="about__strip" role="list" aria-label="نمونه‌ها بر اساس حوزه‌ی کاری">
          {projects.map((project) => (
            <li key={project.id}>
              <a href={project.url}>
                <span className="dot" style={{ background: project.accent }} aria-hidden="true" />
                {project.categoryLabel}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
