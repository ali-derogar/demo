import { contactLinks } from '../data/profile';
import { projects as demos } from '../data/projects';
import { faYear } from '../lib/fa';
import { BrandMark } from './BrandMark';
import { Reveal } from './Reveal';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <Reveal as="div" className="site-footer__brand">
          <a className="wordmark wordmark--footer" href="#top" aria-label="persianbotyar؛ بازگشت به بالا">
            <BrandMark />
            <span className="wordmark__text" dir="ltr">persianbotyar</span>
          </a>
          <p>
            نمونه‌های طراحی سایت و کارهای بک‌اند من. اگر دنبال ایده برای سایت یا سرویس
            پروژه‌تان می‌گردید، نگاهی بیندازید یا مستقیم در تماس باشید.
          </p>
        </Reveal>

        <Reveal
          as="nav"
          className="site-footer__nav site-footer__nav--demos"
          label="نمونه‌ها"
          delay={0.05}
          amount={0.1}
        >
          <h3>نمونه‌ها</h3>
          <ul role="list">
            {demos.map((project) => (
              <li key={project.id}>
                <a href={project.url}>{project.categoryLabel}</a>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="nav" className="site-footer__nav" label="بخش‌ها" delay={0.1} amount={0.1}>
          <h3>بخش‌ها</h3>
          <ul role="list">
            <li><a href="#top">صفحه اصلی</a></li>
            <li><a href="#caps">توانمندی</a></li>
            <li><a href="#demos">نمونه‌ها</a></li>
            <li><a href="#about">درباره من</a></li>
            <li><a href="#contact">ارتباط</a></li>
          </ul>
        </Reveal>

        <Reveal as="nav" className="site-footer__nav" label="راه‌های تماس" delay={0.15} amount={0.1}>
          <h3>تماس</h3>
          <ul role="list">
            {contactLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <Reveal as="div" className="shell site-footer__base" delay={0.1} amount={0.3}>
        <p>© {faYear()} <bdi dir="ltr">persianbotyar</bdi> — همهی حقوق محفوظ است.</p>
        <p className="site-footer__meta">طراحی رابط و توسعه‌ی بک‌اند</p>
      </Reveal>
    </footer>
  );
}
