import { projects } from '../data/projects';
import { faCount, faDigit } from '../lib/fa';

const fields = projects.map((project) => project.categoryLabel);
const fieldList =
  fields.length < 2
    ? fields.join('')
    : `${fields.slice(0, -1).join('، ')} و ${fields[fields.length - 1]}`;

const notes = [
  {
    title: 'هر کسب‌وکار، زبان تصویری خودش',
    text: 'برای خانه‌ی مد فضای روشن و تصویرمحور؛ برای باشگاه زمینه‌ی تیره و ریتم تند؛ برای نمایشگاه خودرو چیدمانی دقیق و فنی؛ و برای فروشگاه، ساده و سریع تا مشتری در چند لحظه به سبد خرید برسد.',
  },
  {
    title: 'با سایت کار کنید، نه تماشای آن',
    text: 'محصول را به سبد اضافه کنید، دو خودرو را کنار هم مقایسه کنید، جای کلاس هفتگی را انتخاب کنید و برای دریافت خبرها ثبت‌نام کنید. همه‌ی این‌ها در نمونه‌ها واقعاً کار می‌کنند.',
  },
  {
    title: 'فارسی، از راست به چپ',
    text: 'متن، منو، فرم و پیام‌ها از همان اول فارسی نوشته و چیده شده‌اند؛ نه ترجمه‌ی یک قالب انگلیسی. روی گوشی هم هر بخش سر جایش می‌ایستد.',
  },
  {
    title: 'آنچه مشتری پیش از تصمیم لازم دارد',
    text: 'قیمت به تومان، ساعت کلاس‌ها، مشخصات هر خودرو، جمع لحظه‌ای سبد خرید و راه تماس. هرچه مشتری برای تصمیم گرفتن لازم دارد، خوانا و در دسترس است.',
  },
];

export function AboutSection() {
  return (
    <section className="about" id="about" aria-labelledby="about-title">
      <div className="shell about__inner">
        <div className="about__head">
          <p className="eyebrow">درباره ما</p>
          <h2 id="about-title">نتیجه را پیش از سفارش ببینید</h2>
          <p className="about__lead">
            نمونه‌کده مجموعه‌ای از {faCount(projects.length)} وب‌سایت کامل است؛ هر کدام برای یک حوزه‌ی
            کاری: {fieldList}. هر نمونه را باز کنید و مثل یک مشتری واقعی با آن کار کنید.
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
