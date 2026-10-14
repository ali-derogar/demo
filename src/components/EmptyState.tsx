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
      <h3 className="empty__title">{query.trim() ? 'چیزی پیدا نشد' : 'اینجا هنوز نمونه‌ای ندارم'}</h3>
      <p className="empty__text">
        {query.trim() ? (
          <>
            برای «<strong>{query.trim()}</strong>»
            {filtered ? <> در دسته‌ی «{categoryLabel}»</> : null} نمونه‌ای پیدا نشد. یه کلمه‌ی دیگه
            امتحان کنید؛ مثلاً {hintList()}.
          </>
        ) : (
          <>
            برای «{categoryLabel}» هنوز نمونه‌ای نذاشتم. می‌تونید بقیه‌ی کارهام رو ببینید.
          </>
        )}
      </p>
      <button type="button" className="btn btn--primary" onClick={onReset}>
        دیدن همه‌ی کارها
      </button>
    </div>
  );
}
