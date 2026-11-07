import { useState } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { MaskLine } from '../components/MaskReveal';
import { faDigit } from '../lib/fa';
import { projects, categories, type DemoCategory } from '../data/projects';

export function WorkView() {
  const [filter, setFilter] = useState<DemoCategory>('all');
  const reduced = useReducedMotion();
  const shown = filter === 'all' ? projects : projects.filter((project) => project.category === filter);

  return (
    <div className="im-work im-shell">
      <header className="im-section-head">
        <div><p className="im-kicker"><span className="im-section-number">۰۲ /</span> منتخب تجربه‌ها</p><h2 id="im-work-title" className="im-section-title"><MaskLine>هر ایده،</MaskLine><MaskLine className="im-outline-text">یک جهانِ تازه.</MaskLine></h2></div>
        <p className="im-section-intro">از یک ویترین ساده تا تجربه‌ای تعاملی.<br />هرکدام را باز کنید؛ یک سایت کامل<br />پیش روی شماست.</p>
      </header>
      <div className="im-work__toolbar">
        <div className="im-work__filters" role="group" aria-label="فیلتر دسته‌بندی نمونه‌کارها">
          {categories.map((category) => <button key={category.value} type="button" className="im-filter" aria-pressed={filter === category.value} onClick={() => setFilter(category.value)} data-cursor="link">{category.label}</button>)}
        </div>
        <span className="im-work__count" role="status" aria-live="polite" aria-atomic="true">{faDigit(shown.length)} تجربه</span>
      </div>
      <ul className="im-work__grid">
        {shown.map((project) => {
          const index = projects.indexOf(project);
          const [brand, subtitle] = project.title.split('؛');
          return (
            <m.li key={project.id} className="im-work__item" initial={reduced ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.65, ease: [0.22, 0.61, 0.36, 1] }}>
              <a href={project.url} className="im-project" target="_blank" rel="noopener noreferrer" data-cursor="cta" style={{ ['--project-accent' as string]: project.accent }}>
                <div className="im-project__image"><img src={project.preview} alt={project.previewAlt} width="1200" height="800" loading="lazy" decoding="async" /><span className="im-project__visit">ورود به تجربه <span aria-hidden="true">↖</span></span><span className="im-project__serial" aria-hidden="true" dir="ltr">PROJECT / {String(index + 1).padStart(2, '0')}</span></div>
                <div className="im-project__caption"><span className="im-project__number">{faDigit(String(index + 1).padStart(2, '0'))}</span><div><h3>{brand}<span>{subtitle?.trim()}</span></h3><p>{project.tagline}</p></div><span className="im-project__arrow" aria-hidden="true">↖</span></div>
                <span className="im-project__category">{project.categoryLabel}</span>
              </a>
            </m.li>
          );
        })}
      </ul>
      <div className="im-work__outro"><span>هر پروژه با یک گفت‌وگو شروع می‌شود.</span><a href="#contact" data-cursor="link">دربارهٔ ایدهٔ شما حرف بزنیم <span aria-hidden="true">↖</span></a></div>
    </div>
  );
}
