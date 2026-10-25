import type { CSSProperties } from 'react';
import { domains, experienceStat } from '../data/profile';
import { faDigit } from '../lib/fa';
import { Reveal } from './Reveal';

/**
 * «طیف حوزه‌ها» جای آمارِ شمارشی را گرفته است: هر حوزه یک ردیف است با همان
 * رنگِ دموی خودش، و ردیف مستقیماً به همان نمونه‌کار می‌رود. تنها عددِ باقی‌مانده
 * سال‌های تجربه است، چون بقیه‌ی رقم‌ها همه به یک عدد می‌رسیدند.
 */
export function DomainSpectrum() {
  return (
    <section className="v2-spectrum" aria-labelledby="spectrum-title">
      <div className="shell v2-spectrum__grid">
        <div className="v2-spectrum__head">
          <p className="v2-kicker">
            <span className="v2-kicker__pulse" aria-hidden="true" />
            طیفِ حوزه‌ها
          </p>
          <h2 id="spectrum-title" className="v2-h2">
            به‌جای عدد،
            <br />
            رنگ‌ها را بشمار
          </h2>
          <p className="v2-spectrum__lead">
            هر ردیف یک صنف است و همان رنگِ دموی خودش را دارد. از مد و خودرو تا مالی و رویداد؛ روی
            هر ردیف بروی، مستقیم به همان نمونه‌کار می‌رسی.
          </p>
          <p className="v2-spectrum__years">
            <span className="v2-spectrum__years-num">
              {experienceStat.prefix}
              {faDigit(experienceStat.value)}
            </span>
            <span className="v2-spectrum__years-cap">{experienceStat.label}</span>
          </p>
        </div>

        <ul className="v2-spectrum__rows">
          {domains.map((item, index) => (
            <Reveal as="li" className="v2-row" key={item.id} delay={(index % 3) * 0.05} amount={0.4}>
              <a
                className="v2-row__link"
                href={item.url}
                style={{ '--t': item.accent } as CSSProperties}
                data-cursor="link"
              >
                <span className="v2-row__dot" aria-hidden="true" />
                <span className="v2-row__domain">{item.domain}</span>
                <span className="v2-row__leader" aria-hidden="true" />
                <span className="v2-row__demo">{item.demoTitle}</span>
                <svg className="ic v2-row__go" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17 7 7 17M7 8v9h9" />
                </svg>
              </a>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
