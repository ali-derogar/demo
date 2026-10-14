import { projects } from '../data/projects';
import { faDigit } from '../lib/fa';

const notes = [
  {
    title: 'ظاهر سایت به کارتون بیاد',
    text: 'ظاهر سایت رو با توجه به کار شما طراحی می‌کنم. برای یه کافه، عکس غذا و منو مهمه؛ برای فروشگاه، پیدا کردن محصول و خرید.',
  },
  {
    title: 'کار کردن با سایت راحت باشه',
    text: 'جست‌وجو، فرم‌ها و دکمه‌ها رو طوری می‌چینم که بازدیدکننده برای پیدا کردن چیزی که می‌خواد سردرگم نشه.',
  },
  {
    title: 'روی گوشی هم راحت استفاده بشه',
    text: 'متن‌ها باید خوانا باشن و دکمه‌ها راحت لمس بشن. موقع طراحی، صفحه‌های کوچک رو هم در نظر می‌گیرم.',
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
            من سایت‌هایی طراحی می‌کنم که هم ظاهر خوبی داشته باشن، هم کار کردن باهاشون راحت باشه.
            توی این نمونه‌ها می‌تونید ببینید برای هر کار چه طراحی‌ای انتخاب کردم.
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
