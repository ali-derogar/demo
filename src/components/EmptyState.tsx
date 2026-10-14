interface Props {
  query: string;
  categoryLabel: string;
  onReset: () => void;
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
            واژه‌ی دیگری امتحان کنید؛ مثلاً نام یک حوزه: مد، خودرو، تناسب اندام یا فروشگاه.
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
