interface Props {
  items: string[];
  label: string;
}

/**
 * نوار متحرک فناوری‌ها. ردیف تکراری کاملاً aria-hidden است تا صفحه‌خوان
 * هر نام را دو بار نخواند؛ خودِ گروه فقط یک برچسب فارسی دارد.
 */
export function Marquee({ items, label }: Props) {
  const track = [...items, ...items];
  return (
    <div className="marquee" role="group" aria-label={label}>
      <div className="marquee__track" aria-hidden="true">
        {track.map((item, index) => (
          <span className="marquee__item" key={`${item}-${index}`} dir="ltr">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
