import { MaskLine } from '../components/MaskReveal';
import { profile, skillGroups, aboutTimeline, experienceStat, education, languages } from '../data/profile';
import { faDigit } from '../lib/fa';

export function AboutView() {
  return (
    <div className="im-about im-shell">
      <header className="im-section-head">
        <div><p className="im-kicker"><span className="im-section-number">۰۳ /</span> پشتِ این تجربه</p><h2 id="im-about-title" className="im-section-title"><MaskLine>منطقِ روشن،</MaskLine><MaskLine className="im-outline-text">جزئیاتِ دقیق.</MaskLine></h2></div>
        <div className="im-about__signature"><span>{profile.name}</span><span>{profile.title} / {profile.location}</span></div>
      </header>
      <div className="im-about__cols">
        <div className="im-about__narrative">
          {profile.summary.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <div className="im-about__stats">
            <div className="im-stat"><b dir="ltr">{experienceStat.prefix}{faDigit(experienceStat.value)}</b><span>{experienceStat.label}</span></div>
            {education.map((item) => <div className="im-stat im-stat--education" key={item.field}><b>{item.degree} {item.field}</b><span>{item.org}</span></div>)}
          </div>
          <div className="im-about__langs">{languages.map((language) => <span key={language.name}>{language.name}<i aria-hidden="true"> / </i>{language.level}</span>)}</div>
        </div>
        <aside className="im-about__side" aria-labelledby="im-path">
          <h3 id="im-path" className="im-small-title">مسیرِ ساختن</h3>
          <ol className="im-timeline">{aboutTimeline.map((item, index) => <li key={item.title}><span className="im-timeline__index" aria-hidden="true">{faDigit(String(index + 1).padStart(2, '0'))}</span><div><h4>{item.title}</h4><p dir="auto">{item.meta}</p></div></li>)}</ol>
        </aside>
      </div>
      <section className="im-about__skills" aria-labelledby="im-skills">
        <div className="im-about__skills-head"><h3 id="im-skills" className="im-small-title">ابزارهایی برای تبدیل ایده به واقعیت</h3><span dir="ltr" aria-hidden="true">THE TOOLKIT /</span></div>
        <div className="im-skills">{skillGroups.map((group, index) => <div className="im-skillgroup" key={group.id}><span className="im-skillgroup__index" aria-hidden="true">{faDigit(String(index + 1).padStart(2, '0'))}</span><h4>{group.title}</h4><ul>{group.items.map((item) => <li key={item} dir="ltr">{item}</li>)}</ul></div>)}</div>
      </section>
    </div>
  );
}
