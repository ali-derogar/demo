import { useEffect } from 'react';
import { m, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { projects } from '../data/projects';
import { heroStats, profile } from '../data/profile';
import { faDigit } from '../lib/fa';
import { getPointer, subscribeRaf } from '../lib/raf';
import { useMediaQuery } from '../lib/useMedia';
import { CountUp } from './CountUp';
import { Reveal } from './Reveal';

/** جابه‌جایی نرم کلاژ با اشاره‌گر؛ روی لمسی و «کاهش حرکت» غیرفعال */
function usePointerParallax(strength: number) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 55, damping: 18, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 55, damping: 18, mass: 0.5 });
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)');
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!fine || reduced) return;
    return subscribeRaf(() => {
      const pointer = getPointer();
      x.set(pointer.nx * strength);
      y.set(pointer.ny * strength);
    });
  }, [fine, reduced, strength, x, y]);

  return { x: springX, y: springY };
}

export function HeroSection() {
  const parallax = usePointerParallax(16);

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="shell hero__inner">
        <div className="hero__copy">
          <Reveal as="p" className="eyebrow">
            <span className="eyebrow__pulse" aria-hidden="true" />
            طراح رابط فارسی و {profile.title}
          </Reveal>

          <h1 id="hero-title">
            <span className="hero__line">کدِ تمیز،</span>
            <span className="hero__line">
              <span className="hero__accent">ظاهرِ زنده</span>
            </span>
          </h1>

          <p className="hero__badges" dir="ltr" aria-label={profile.tagline.join('، ')}>
            {profile.tagline.map((item) => (
              <span className="hero__badge" key={item}>
                {item}
              </span>
            ))}
          </p>

          <Reveal as="p" className="hero__lead" delay={0.05}>
            سایت‌های این گالری را خودم طراحی و پیاده کرده‌ام؛ و در سمت دیگر، سرویس‌های
            FastAPI و Django با صف‌های تسک توزیع‌شده می‌سازم. چیزی که کاربر لمس می‌کند باید
            به‌اندازه‌ی پشت‌صحنه دقیق باشد.
          </Reveal>

          <div className="hero__actions">
            <a className="btn btn--primary" href="#demos" data-cursor="cta">
              دیدن کارها
              <span className="btn__arrow" aria-hidden="true">
                ←
              </span>
            </a>
            <a className="btn btn--ghost" href="#contact" data-cursor="cta">
              ارتباط با من
            </a>
          </div>

          <dl className="hero__stats">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>
                  <CountUp
                    to={stat.value}
                    prefix={stat.prefix}
                    srLabel={`${stat.prefix ?? ''}${faDigit(stat.value)} ${stat.label}`}
                  />
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <m.div className="hero__collage" style={{ x: parallax.x, y: parallax.y }} aria-hidden="true">
          {projects.slice(0, 6).map((project, index) => (
            <figure className="collage-card" key={project.id}>
              <img src={project.preview} alt="" loading={index < 3 ? 'eager' : 'lazy'} width={1200} height={800} />
              <figcaption>{project.categoryLabel}</figcaption>
            </figure>
          ))}
          <p className="collage-note">پایین‌تر می‌توانید هرکدام را باز کنید.</p>
        </m.div>
      </div>
    </section>
  );
}
