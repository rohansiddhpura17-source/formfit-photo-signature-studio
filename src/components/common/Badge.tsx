import type { ReactNode } from 'react';
import { BadgeCheck, CircleAlert, CircleHelp, TriangleAlert } from 'lucide-react';

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'error' | 'outline';

export function Badge({
  tone = 'neutral',
  children,
  dot = false,
  icon: Icon,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  icon?: typeof BadgeCheck;
}) {
  return (
    <span className={`badge badge--${tone}`}>
      {dot && <span className="badge__dot" aria-hidden />}
      {Icon && <Icon size={12} strokeWidth={2} aria-hidden />}
      {children}
    </span>
  );
}

export function VerificationBadge({ status }: { status: 'verified' | 'unverified' | 'custom' }) {
  if (status === 'verified') {
    return (
      <Badge tone="success" icon={BadgeCheck}>
        Verified
      </Badge>
    );
  }
  if (status === 'unverified') {
    return (
      <Badge tone="warning" icon={TriangleAlert}>
        Unverified
      </Badge>
    );
  }
  return (
    <Badge tone="outline" icon={CircleHelp}>
      User preset
    </Badge>
  );
}

export function SpecBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="spec-badge">
      <span className="spec-badge__label">{label}</span>
      <span className="spec-badge__value">{value}</span>
    </div>
  );
}

export function Notice({
  tone = 'neutral',
  title,
  children,
  icon: Icon,
}: {
  tone?: 'neutral' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
  icon?: typeof CircleAlert;
}) {
  const Fallback = tone === 'error' ? CircleAlert : tone === 'warning' ? TriangleAlert : CircleHelp;
  const Chosen = Icon ?? Fallback;
  return (
    <div className={`notice notice--${tone}`}>
      <Chosen size={17} strokeWidth={1.8} aria-hidden className="notice__icon" />
      <div>
        {title && <p className="notice__title">{title}</p>}
        <div className="notice__body">{children}</div>
      </div>
    </div>
  );
}
