import { lazy, Suspense, useEffect, useRef } from 'react';
import { profile } from '../data/profile';
import { MaskLine } from './MaskReveal';

// صحنه‌ی WebGL (و three.js) جدا و موازی زیرِ پرلودر لود می‌شود تا باندلِ اصلی سبک بماند
const HeroStage = lazy(() => import('./HeroStage').then((m) => ({ default: m.HeroStage })));

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);

  // انیمیشنِ گرادیانِ تیتر فقط وقتی هیرو در دید است اجرا شود؛ وگرنه
  // background-position تا پایینِ صفحه هر فریم repaint می‌کرد.
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => el.classList.toggle('is-flow', entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="v2-hero" id="top" ref={heroRef} aria-labelledby="hero-title">
      <Suspense fallback={null}>
        <HeroStage />
      </Suspense>

      <div className="v2-hero__lockup shell">
        <p className="v2-kicker v2-hero__kicker">
          <span className="v2-kicker__pulse" aria-hidden="true" />
          <span className="v2-kicker__n" aria-hidden="true">
            ۰۱
          </span>
          {profile.name} · {profile.title}
        </p>

        <h1 className="v2-hero__title" id="hero-title">
          <MaskLine when="load">کدِ تمیز،</MaskLine>
          <MaskLine className="v2-hero__grad" delay={0.12} when="load">
            ظاهرِ زنده
          </MaskLine>
        </h1>

        <p className="v2-hero__lead">
          هر اسکرول، یک لایه از کار را باز می‌کند. از بک‌اند پایتون و مدل‌های یادگیری ماشین تا
          اپ موبایل و رابط‌هایی که کاربر لمس می‌کند.
        </p>

        <div className="v2-hero__actions">
          <a className="v2-btn v2-btn--primary" href="#demos" data-cursor="cta">
            دیدن کارها
            <span aria-hidden="true">←</span>
          </a>
          <a className="v2-btn v2-btn--ghost" href="#contact">
            ارتباط با من
          </a>
        </div>
      </div>

      <p className="v2-hero__cue">
        <span className="v2-hero__mouse" aria-hidden="true" />
        اسکرول کن
      </p>
    </section>
  );
}