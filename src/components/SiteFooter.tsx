import { contactLinks } from '../data/profile';
import { projects as demos } from '../data/projects';
import { faYear } from '../lib/fa';
import { BrandMark } from './BrandMark';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <div className="site-footer__brand">
          <a className="wordmark wordmark--footer" href="#top" aria-label="persianbotyar؛ بازگشت به بالا">
            <BrandMark />
            <span className="wordmark__text" dir="ltr">persianbotyar</span>
          </a>
          <p>
            نمونه‌های طراحی سایت و کارهای بک‌اند من. اگر دنبال ایده برای سایت یا سرویس
            پروژه‌تان می‌گردید، نگاهی بیندازید یا مستقیم در تماس باشید.
          </p>
        </div>

        <nav className="site-footer__nav" aria-label="نمونه‌ها">
          <h3>نمونه‌ها</h3>
          <ul role="list">
            {demos.map((project) => (
              <li key={project.id}>
                <a href={project.url}>{project.categoryLabel}</a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="site-footer__nav" aria-label="بخش‌ها">
          <h3>بخش‌ها</h3>
          <ul role="list">
            <li><a href="#top">صفحه اصلی</a></li>
            <li><a href="#demos">نمونه‌ها</a></li>
            <li><a href="#about">درباره من</a></li>
            <li><a href="#contact">ارتباط</a></li>
          </ul>
        </nav>

        <nav className="site-footer__nav" aria-label="راه‌های تماس">
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
        </nav>
      </div>

      <div className="shell site-footer__base">
        <p>© {faYear()} <bdi dir="ltr">persianbotyar</bdi> — همهی حقوق محفوظ است.</p>
        <p className="site-footer__meta">طراحی رابط و توسعه‌ی بک‌اند</p>
      </div>
    </footer>
  );
}
