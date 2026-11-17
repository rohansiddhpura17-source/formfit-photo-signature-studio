import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface FieldProps {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, hint, error, optional, children, className = '' }: FieldProps) {
  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
          {optional && <span className="field__optional">Optional</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="field__hint">{hint}</p>
      )}
    </div>
  );
}

export function TextInput({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input ${className}`} {...rest} />;
}

interface NumberInputProps extends InputHTMLAttributes<HTMLInputElement> {
  suffix?: string;
}

export function NumberInput({ suffix, className = '', ...rest }: NumberInputProps) {
  return (
    <div className={`input-wrap ${className}`}>
      <input type="number" className="input input--number" {...rest} />
      {suffix && <span className="input__suffix">{suffix}</span>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export function Select({ options, className = '', ...rest }: SelectProps) {
  return (
    <div className={`select-wrap ${className}`}>
      <select className="select" {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={15} className="select__chevron" aria-hidden />
    </div>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}) {
  return (
    <label className="checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="checkbox__box" aria-hidden>
        <svg viewBox="0 0 12 12" width="11" height="11">
          <path d="M2 6.2 4.6 8.8 10 3.4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="checkbox__text">
        <span>{label}</span>
        {description && <span className="checkbox__desc">{description}</span>}
      </span>
    </label>
  );
}
