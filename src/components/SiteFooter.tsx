import { projects } from '../data/projects';
import { faDigit, faYear } from '../lib/fa';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <div className="site-footer__brand">
          <a className="wordmark wordmark--footer" href="#top" aria-label="نمونه‌کده؛ بازگشت به بالا">
            <span className="wordmark__mark" aria-hidden="true">
              ن
            </span>
            <span className="wordmark__text">نمونه‌کده</span>
          </a>
          <p>
            گالری نمونه‌کارهای طراحی و توسعه‌ی وب؛ {faDigit(projects.length)} وب‌سایت کامل فارسی که
            می‌توانید با آن‌ها کار کنید.
          </p>
        </div>

        <nav className="site-footer__nav" aria-label="نمونه‌ها">
          <h3>نمونه‌ها</h3>
          <ul role="list">
            {projects.map((project) => (
              <li key={project.id}>
                <a href={project.url}>{project.categoryLabel}</a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="site-footer__nav" aria-label="بخش‌ها">
          <h3>بخش‌ها</h3>
          <ul role="list">
            <li>
              <a href="#top">صفحه اصلی</a>
            </li>
            <li>
              <a href="#demos">نمونه‌ها</a>
            </li>
            <li>
              <a href="#about">درباره ما</a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="shell site-footer__base">
        <p>© {faYear()} نمونه‌کده — همه‌ی حقوق محفوظ است.</p>
        <p className="site-footer__meta">طراحی‌شده برای کسب‌وکارهای ایرانی</p>
      </div>
    </footer>
  );
}
