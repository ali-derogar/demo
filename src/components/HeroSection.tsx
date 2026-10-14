import { projects } from '../data/projects';
import { faCount, faDigit } from '../lib/fa';

export function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__glow" aria-hidden="true" />
      <div className="shell hero__inner">
        <div className="hero__copy">
          <p className="eyebrow">
            <span className="eyebrow__pulse" aria-hidden="true" />
            نمونه‌کارهای طراحی و راه‌اندازی وب
          </p>
          <h1 id="hero-title">
            {faCount(projects.length)} وب‌سایت،
            <br />
            <span className="hero__accent">{faCount(projects.length)} هویت بصری</span>
            <br />
            کاملاً فارسی
          </h1>
          <p className="hero__lead">
            هر نمونه برای یک کسب‌وکار تازه ساخته شده و دکمه‌هایش واقعاً کار می‌کنند. باز کنید و همان‌طور
            که یک مشتری انجام می‌دهد با آن کار کنید؛ خرید، ثبت‌نام، مقایسه و جست‌وجو — نه تماشای تصویر.
          </p>

          <div className="hero__actions">
            <a className="btn btn--primary" href="#demos">
              دیدن نمونه‌ها
              <span className="btn__arrow" aria-hidden="true">
                ←
              </span>
            </a>
            <a className="btn btn--ghost" href="#about">
              درباره‌ی این مجموعه
            </a>
          </div>

          <dl className="hero__stats">
            <div>
              <dt>وب‌سایت نمونه</dt>
              <dd>{faDigit(projects.length)}</dd>
            </div>
            <div>
              <dt>حوزه‌ی کاری</dt>
              <dd>{faDigit(new Set(projects.map((p) => p.category)).size)}</dd>
            </div>
            <div>
              <dt>قابل تجربه</dt>
              <dd>زنده</dd>
            </div>
          </dl>
        </div>

        <div className="hero__collage" aria-hidden="true">
          {projects.map((project, index) => (
            <figure className={`collage-card collage-card--${index + 1}`} key={project.id}>
              <img src={project.preview} alt="" loading={index === 0 ? 'eager' : 'lazy'} />
              <figcaption>{project.categoryLabel}</figcaption>
            </figure>
          ))}
          <p className="collage-note">
            {faDigit(projects.length)} وب‌سایت آماده؛ کمی پایین‌تر، هر کدام را باز کنید
          </p>
        </div>
      </div>
    </section>
  );
}
