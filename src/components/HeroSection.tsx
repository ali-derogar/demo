import { projects } from '../data/projects';
import { faDigit } from '../lib/fa';

export function HeroSection() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__glow" aria-hidden="true" />
      <div className="shell hero__inner">
        <div className="hero__copy">
          <p className="eyebrow">
            <span className="eyebrow__pulse" aria-hidden="true" />
            طراحی سایت
          </p>
          <h1 id="hero-title">
            چند تا از
            <br />
            <span className="hero__accent">کارهای من</span>
          </h1>
          <p className="hero__lead">
            چند تا نمونه از سایت‌هایی که طراحی کردم رو اینجا گذاشتم. می‌تونید هر کدوم رو باز کنید
            و با بخش‌های مختلفش کار کنید.
          </p>

          <div className="hero__actions">
            <a className="btn btn--primary" href="#demos">
              دیدن کارها
              <span className="btn__arrow" aria-hidden="true">
                ←
              </span>
            </a>
            <a className="btn btn--ghost" href="#about">
              درباره من
            </a>
          </div>

          <dl className="hero__stats">
            <div>
              <dt>نمونه‌کار</dt>
              <dd>{faDigit(projects.length)}</dd>
            </div>
            <div>
              <dt>موضوع متفاوت</dt>
              <dd>{faDigit(new Set(projects.map((p) => p.category)).size)}</dd>
            </div>
            <div>
              <dt>زبان سایت‌ها</dt>
              <dd>فارسی</dd>
            </div>
          </dl>
        </div>

        <div className="hero__collage" aria-hidden="true">
          {projects.map((project, index) => (
            <figure className="collage-card" key={project.id}>
              <img src={project.preview} alt="" loading={index < 3 ? 'eager' : 'lazy'} width={1200} height={800} />
              <figcaption>{project.categoryLabel}</figcaption>
            </figure>
          ))}
          <p className="collage-note">
            پایین صفحه می‌تونید هر کدوم رو باز کنید.
          </p>
        </div>
      </div>
    </section>
  );
}
