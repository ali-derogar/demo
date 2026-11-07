import { MaskLine } from '../components/MaskReveal';
import { profile, experienceStat } from '../data/profile';
import { faDigit } from '../lib/fa';

export function HomeView() {
  return (
    <div className="im-home im-shell">
      <div className="im-home__edition" aria-hidden="true"><span dir="ltr">INDEPENDENT DEVELOPER</span><span>طراحی با فکر. ساختن با دقت.</span></div>
      <div className="im-home__lockup">
        <p className="im-kicker"><span className="im-status-dot" />{profile.name}<span className="im-kicker__divider" />{profile.title}</p>
        <h1 id="im-home-title" className="im-home__title">
          <MaskLine when="load" delay={0.1}>کدِ تمیز،</MaskLine>
          <MaskLine when="load" delay={0.23} className="im-home__accent">ظاهرِ زنده.</MaskLine>
        </h1>
        <p className="im-home__lead">از منطقِ پشتِ صحنه تا تجربه‌ای که می‌بینید؛<br />سرویس‌های دقیق می‌سازم و به رابط‌ها زندگی می‌دهم.</p>
        <a href="#demos" className="im-btn" data-cursor="cta"><span>دیدن کارها</span><span className="im-btn__arrow" aria-hidden="true">↙</span></a>
        <div className="im-home__meta"><span><b dir="ltr">{experienceStat.prefix}{faDigit(experienceStat.value)}</b> {experienceStat.label}</span><span>{profile.location}</span></div>
      </div>
      <div className="im-home__bottom">
        <a href="#demos" className="im-scroll-cue" data-cursor="link"><span className="im-scroll-cue__line" aria-hidden="true" /><span>برای کشف بیشتر، اسکرول کنید</span><span aria-hidden="true">↓</span></a>
        <span className="im-home__coordinates" dir="ltr" aria-hidden="true"><span>01 / 04</span><i /><span>CODE MEETS EXPERIENCE</span></span>
      </div>
      <div className="im-scene-caption" aria-hidden="true"><span className="im-scene-caption__cross">+</span><span dir="ltr">FORM / SPACE / LOGIC</span><span>منطق، شکل می‌گیرد.</span></div>
    </div>
  );
}
