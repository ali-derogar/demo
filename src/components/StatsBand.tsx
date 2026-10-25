import { heroStats } from '../data/profile';
import { faDigit } from '../lib/fa';
import { CountUp } from './CountUp';
import { Reveal } from './Reveal';

/** نوار آمار مشتق‌شده از داده‌ها؛ شمارنده‌ها با ورود به دید فعال می‌شوند. */
export function StatsBand() {
  return (
    <section className="v2-stats" aria-label="آمار سریع">
      <div className="shell v2-stats__grid">
        {heroStats.map((stat, index) => (
          <Reveal className="v2-stat" key={stat.label} delay={(index % 4) * 0.06}>
            <span className="v2-stat__value">
              <CountUp
                to={stat.value}
                prefix={stat.prefix}
                srLabel={`${stat.prefix ?? ''}${faDigit(stat.value)} ${stat.label}`}
              />
            </span>
            <span className="v2-stat__label">{stat.label}</span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
