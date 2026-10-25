import { type ReactNode } from 'react';

interface Props {
  id: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  pulse?: boolean;
}

/** سربرگ مشترک بخش‌ها: eyebrow + h2 + lead */
export function SectionHead({ id, eyebrow, title, lead, pulse }: Props) {
  return (
    <div className="section-head">
      <p className="eyebrow">
        {pulse && <span className="eyebrow__pulse" aria-hidden="true" />}
        {eyebrow}
      </p>
      <h2 id={id}>{title}</h2>
      {lead && <p className="section-head__lead">{lead}</p>}
    </div>
  );
}
