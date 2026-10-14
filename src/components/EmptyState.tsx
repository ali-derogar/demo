import { projects } from '../data/projects';

interface Props {
  query: string;
  categoryLabel: string;
  onReset: () => void;
}

/** سه نمونه از کلیدواژه‌های ثبت‌شده، تا راهنما با فهرست تازه بماند */
function hintList(): string {
  const picks = [
    projects[0]?.keywords[0],
    projects[Math.floor(projects.length / 2)]?.keywords[0],
    projects[projects.length - 1]?.keywords[0],
  ].filter((word, i, arr): word is string => Boolean(word) && arr.indexOf(word) === i);

  if (picks.length < 2) return picks.join('');
  return `${picks.slice(0, -1).join('، ')} یا ${picks[picks.length - 1]}`;
}

export function EmptyState({ query, categoryLabel, onReset }: Props) {
  const filtered = query.trim() && categoryLabel && categoryLabel !== 'همه‌ی نمونه‌ها';
  return (
    <div className="empty">
      <div className="empty__art" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <h3 className="empty__title">{query.trim() ? 'نمونه‌ای با این جست‌وجو پیدا نشد' : 'در این دسته نمونه‌ای نیست'}</h3>
      <p className="empty__text">
        {query.trim() ? (
          <>
            برای «<strong>{query.trim()}</strong>»
            {filtered ? <> در دسته‌ی «{categoryLabel}»</> : null} چیزی مطابق نیست. املا را وارسی کنید یا
            واژه‌ی دیگری امتحان کنید؛ مثلاً: {hintList()}.
          </>
        ) : (
          <>
            در دسته‌ی «{categoryLabel}» هنوز وب‌سایتی نداریم. دسته‌ی دیگری را انتخاب کنید یا فهرست را
            پاک کنید.
          </>
        )}
      </p>
      <button type="button" className="btn btn--primary" onClick={onReset}>
        نمایش همه‌ی نمونه‌ها
      </button>
    </div>
  );
}
