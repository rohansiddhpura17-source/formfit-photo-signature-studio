import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
  compact = false,
}: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`empty-state ${compact ? 'empty-state--compact' : ''}`}>
      <div className="empty-state__icon" aria-hidden>
        <Icon size={compact ? 20 : 24} strokeWidth={1.5} />
      </div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__desc">{description}</p>
      {actions && <div className="empty-state__actions">{actions}</div>}
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="page-intro">
      <div className="page-intro__main">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-desc">{description}</p>}
      </div>
      {(actions || meta) && (
        <div className="page-intro__aside">
          {meta}
          {actions && <div className="page-intro__actions">{actions}</div>}
        </div>
      )}
    </header>
  );
}

export function SectionHead({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="section-title">{title}</h2>
        {description && <p className="section-desc">{description}</p>}
      </div>
      {action}
    </div>
  );
}
