import { useEffect } from 'react';
import { m, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { projects } from '../data/projects';
import { profile } from '../data/profile';
import { getPointer, subscribeRaf } from '../lib/raf';
import { useMediaQuery } from '../lib/useMedia';
import { MaskLine } from './MaskReveal';

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

const collageIds = ['nabz', 'cars', 'sekke'];

export function HeroSection() {
  const parallax = usePointerParallax(16);
  const collage = collageIds
    .map((id) => projects.find((project) => project.id === id))
    .filter((project): project is (typeof projects)[number] => Boolean(project));

  return (
    <section className="v2-hero shell" id="top" aria-labelledby="hero-title">
      <div className="v2-hero__copy">
        <p className="v2-kicker">
          <span className="v2-kicker__pulse" aria-hidden="true" />
          طراح رابط فارسی و {profile.title}
        </p>

        <h1 className="v2-hero__title" id="hero-title">
          <MaskLine when="load">کدِ تمیز،</MaskLine>
          <MaskLine className="v2-hero__grad" delay={0.1} when="load">
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

        <p className="v2-hero__cue">
          <span className="v2-hero__mouse" aria-hidden="true" />
          اسکرول کن
        </p>
      </div>

      <m.div
        className="v2-collage"
        style={{ x: parallax.x, y: parallax.y }}
        aria-hidden="true"
      >
        {collage.map((project, index) => (
          <figure className={`v2-collage__item v2-collage__item--${index + 1}`} key={project.id}>
            <img
              src={project.preview}
              alt=""
              loading={index < 2 ? 'eager' : 'lazy'}
              width={1200}
              height={800}
            />
          </figure>
        ))}
      </m.div>
    </section>
  );
}
