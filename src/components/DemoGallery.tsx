import { useMemo, useRef, useState } from 'react';
import { categories, projects, type DemoCategory } from '../data/projects';
import { faDigit, matchesFa } from '../lib/fa';
import { EmptyState } from './EmptyState';
import { Reveal } from './Reveal';
import { WorkStack } from './WorkStack';

export function DemoGallery() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<DemoCategory>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(
    () =>
      projects.filter((project) => {
        const inCategory = category === 'all' || project.category === category;
        if (!inCategory) return false;
        return matchesFa(query, [
          project.title,
          project.tagline,
          project.description,
          project.categoryLabel,
          ...project.keywords,
          ...project.highlights,
          ...project.technologies,
        ]);
      }),
    [query, category],
  );

  const resetFilters = () => {
    setQuery('');
    setCategory('all');
    inputRef.current?.focus();
  };

  return (
    <section className="gallery" id="demos" aria-labelledby="gallery-title">
      <div className="shell">
        <div className="gallery__head">
          <Reveal>
            <p className="v2-kicker">
              <span className="v2-kicker__pulse" aria-hidden="true" />
              <span className="v2-kicker__n" aria-hidden="true">
                ۰۳
              </span>
              نمونه‌کارها
            </p>
            <h2 id="gallery-title">کارهایی که از صفر ساخته‌ام</h2>
            <p className="gallery__intro">
              با هر اسکرول، پروژه‌ی بعدی با اسکرین‌شات واقعی روی قبلی می‌آید. برای پیدا کردن یک
              کار خاص از جست‌وجو یا دسته‌بندی‌ها کمک بگیرید.
            </p>
          </Reveal>
          <p className="gallery__count" role="status" aria-live="polite">
            {visible.length === projects.length
              ? `${faDigit(projects.length)} نمونه‌کار`
              : `${faDigit(visible.length)} نمونه از ${faDigit(projects.length)}`}
          </p>
        </div>

        <div className="gallery__tools">
          <div className="search">
            <label className="search__label" htmlFor="demo-search">
              جست‌وجو در نمونه‌کارها
            </label>
            <div className="search__field">
              <svg className="search__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path d="m15.6 15.6 4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                id="demo-search"
                ref={inputRef}
                className="search__input"
                type="search"
                inputMode="search"
                autoComplete="off"
                placeholder="مثلاً: فروشگاه، خودرو، استایل…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <button type="button" className="search__clear" onClick={() => setQuery('')}>
                  <span className="sr-only">پاک کردن جست‌وجو</span>
                  <span aria-hidden="true">×</span>
                </button>
              )}
            </div>
          </div>

          <div className="filters" role="group" aria-label="فیلتر دسته‌بندی">
            {categories.map((item) => {
              const active = item.value === category;
              return (
                <button
                  key={item.value}
                  type="button"
                  className={`chip${active ? ' is-active' : ''}`}
                  aria-pressed={active}
                  onClick={(event) => {
                    setCategory(item.value);
                    event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {visible.length > 0 ? (
          <WorkStack projects={visible} />
        ) : (
          <EmptyState query={query} categoryLabel={categories.find((c) => c.value === category)?.label ?? ''} onReset={resetFilters} />
        )}
      </div>
    </section>
  );
}
