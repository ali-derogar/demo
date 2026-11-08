import { profile } from '../data/profile';
import { projects } from '../data/projects';

export function HomeView() {
  return (
    <div className="im-home">
      <div className="im-home__intro">
        <p className="im-home__eyebrow"><span aria-hidden="true">✳</span> طراحی و توسعهٔ دیجیتال</p>
        <p className="im-home__headline">از یک ایده،<br /><span>تا یک تجربهٔ زنده.</span></p>
      </div>
      <div className="im-home__scene" aria-hidden="true">
        <div className="im-home__aura" />
        <svg className="im-home__orbits" viewBox="0 0 320 320" fill="none" focusable="false">
          <circle cx="160" cy="160" r="143" stroke="currentColor" strokeDasharray="1 12" />
          <circle cx="160" cy="160" r="124" stroke="currentColor" strokeDasharray="76 118 26 90" />
          <path d="M160 6v12m0 284v12M6 160h12m284 0h12" stroke="currentColor" />
          <circle cx="160" cy="36" r="3" fill="#bde8d1" stroke="none" />
          <circle cx="160" cy="284" r="2" fill="#b7acff" stroke="none" />
        </svg>
        <span className="im-home__scene-caption" dir="ltr">CODE · CREATE · CONNECT</span>
      </div>
      <p className="im-home__gesture" aria-hidden="true"><span>↔</span> برای چرخاندن نشان، افقی بکشید</p>
      <div className="im-home__identity">
        <h1 id="im-home-title" dir="ltr">{profile.brand}</h1>
        <p>{profile.name}<span aria-hidden="true"> / </span>{profile.title}</p>
        <p className="im-home__description">وب‌سایت، ربات و نرم‌افزار؛<br />با دقت در جزئیات، از ایده تا اجرا.</p>
        <div className="im-home__actions">
          <a href="#demos" className="im-home__primary" data-cursor="link">دیدن نمونه‌کارها <span aria-hidden="true">↙</span></a>
          <a href="#contact" className="im-home__contact" data-cursor="link">گفت‌وگو دربارهٔ پروژه <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      <a href="#demos" className="im-home__explore" data-cursor="link">
        <span>اسکرول کنید</span><span className="im-home__scroll-line" aria-hidden="true" /><span>دیدن نمونه‌کارها</span>
      </a>
      <span className="im-home__collection"><span aria-hidden="true" />{projects.length.toLocaleString('fa-IR')} تجربهٔ متفاوت، یک امضا</span>
    </div>
  );
}
