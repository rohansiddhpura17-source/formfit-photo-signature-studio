import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, CircleAlert, CircleMinus, Info, TriangleAlert, X } from 'lucide-react';
import type { ValidationReport } from '../../types';
import { useApp } from '../../app/AppContext';

export function ProgressBar({
  value,
  tone = 'accent',
  label,
  indeterminate = false,
}: {
  value: number;
  tone?: 'accent' | 'success' | 'warning' | 'error';
  label?: string;
  indeterminate?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div
      className={`progress ${indeterminate ? 'progress--indeterminate' : ''}`}
      role="progressbar"
      aria-label={label ?? 'Progress'}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : pct}
    >
      <div className={`progress__fill progress__fill--${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ValidationList({ report, compact = false }: { report: ValidationReport; compact?: boolean }) {
  return (
    <ul className={`validation-list ${compact ? 'validation-list--compact' : ''}`}>
      {report.checks.map((check) => (
        <li key={check.id} className={`validation-item validation-item--${check.status}`}>
          <span className="validation-item__icon" aria-hidden>
            {check.status === 'pass' ? (
              <Check size={13} strokeWidth={2.4} />
            ) : check.status === 'fail' ? (
              <X size={13} strokeWidth={2.4} />
            ) : check.status === 'warn' ? (
              <TriangleAlert size={13} strokeWidth={2.2} />
            ) : (
              <CircleMinus size={13} strokeWidth={2.2} />
            )}
          </span>
          <span className="validation-item__text">
            <span className="validation-item__label">
              {check.label}
              <span className="sr-only">
                {check.status === 'pass'
                  ? ': passed'
                  : check.status === 'fail'
                    ? ': failed'
                    : check.status === 'warn'
                      ? ': warning'
                      : ': not applicable'}
              </span>
            </span>
            {(!compact || check.status === 'fail' || check.status === 'warn') && (
              <span className="validation-item__detail">{check.detail}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ToastViewport() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone}`} role="status">
          <span className="toast__icon" aria-hidden>
            {toast.tone === 'success' ? (
              <Check size={15} strokeWidth={2.4} />
            ) : toast.tone === 'error' ? (
              <CircleAlert size={15} strokeWidth={2.2} />
            ) : (
              <Info size={15} strokeWidth={2.2} />
            )}
          </span>
          <div className="toast__body">
            <p className="toast__title">{toast.title}</p>
            {toast.message && <p className="toast__message">{toast.message}</p>}
          </div>
          <button className="toast__close" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  hint,
  disabled = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  hint?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={`slider ${disabled ? 'slider--disabled' : ''}`}>
      <div className="slider__head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="slider__value">
          {formatValue ? formatValue(value) : value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{
          backgroundSize: `${((value - min) / (max - min)) * 100}% 100%`,
        }}
      />
      {hint && <p className="slider__hint">{hint}</p>}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
}: {
  options: Array<{ value: T; label: string; icon?: ReactNode }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={`segmented segmented--${size}`} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`segmented__item ${value === option.value ? 'is-active' : ''}`}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`switch-row ${disabled ? 'is-disabled' : ''}`}>
      <span className="switch-row__text">
        <span className="switch-row__label">{label}</span>
        {description && <span className="switch-row__desc">{description}</span>}
      </span>
      <span className="switch">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="switch__track" aria-hidden>
          <span className="switch__thumb" />
        </span>
      </span>
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusables?.[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'Tab' && focusables && focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = originalOverflow;
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        className="modal"
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        ref={panelRef}
      >
        <div className="modal__head">
          <div>
            <h2 id={titleId} className="modal__title">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="modal__description">
                {description}
              </p>
            )}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={17} />
          </button>
        </div>
        {children && <div className="modal__body">{children}</div>}
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
