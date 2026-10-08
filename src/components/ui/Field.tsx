import React, { useId } from 'react';

const base =
  'w-full rounded-2xl border border-line-2 bg-white px-4 text-ink placeholder:text-subtle transition-[border-color,box-shadow] ' +
  'focus:border-brand/60 focus:outline-none focus:ring-4 focus:ring-brand/10 disabled:bg-paper disabled:text-muted';

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className = '',
  htmlFor
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="text-[13px] font-semibold text-ink">
          {label}
          {required && <span className="ml-0.5 text-brand">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="text-[12.5px] font-medium text-red-700">{error}</p> : hint ? <p className="text-[12.5px] text-muted">{hint}</p> : null}
    </div>
  );
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  wrapperClassName?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, prefix, suffix, wrapperClassName = '', className = '', id, required, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  const input = (
    <div className="relative flex items-center">
      {prefix && <span className="pointer-events-none absolute left-4 flex items-center text-muted">{prefix}</span>}
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`${base} h-12 ${prefix ? 'pl-11' : ''} ${suffix ? 'pr-16' : ''} ${error ? 'border-red-300' : ''} ${className}`}
        {...rest}
      />
      {suffix && <span className="pointer-events-none absolute right-3.5 text-[13px] font-medium text-muted">{suffix}</span>}
    </div>
  );
  if (!label && !hint && !error) return <div className={wrapperClassName}>{input}</div>;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={wrapperClassName}>
      {input}
    </Field>
  );
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  wrapperClassName?: string;
};

export function Textarea({ label, hint, error, wrapperClassName = '', className = '', id, required, rows = 4, ...rest }: TextareaProps) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={wrapperClassName}>
      <textarea
        id={inputId}
        rows={rows}
        required={required}
        className={`${base} resize-y py-3 leading-relaxed ${error ? 'border-red-300' : ''} ${className}`}
        {...rest}
      />
    </Field>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  options: { value: string; label: string }[];
  placeholder?: string;
  wrapperClassName?: string;
};

export function Select({ label, hint, error, options, placeholder, wrapperClassName = '', className = '', id, required, ...rest }: SelectProps) {
  const autoId = useId();
  const inputId = id || autoId;
  const select = (
    <select
      id={inputId}
      required={required}
      className={`${base} h-12 appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10 ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235d6675' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")"
      }}
      {...rest}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
  if (!label && !hint && !error) return <div className={wrapperClassName}>{select}</div>;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={wrapperClassName}>
      {select}
    </Field>
  );
}

export function Checkbox({
  label,
  description,
  checked,
  onChange,
  disabled
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 ${disabled ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded-[5px] accent-[#e2470d]"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
      />
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-ink">{label}</span>
        {description && <span className="text-[12.5px] text-muted">{description}</span>}
      </span>
    </label>
  );
}

/** Choix exclusifs sous forme de cartes (mode de livraison, type de demande…) */
export function ChoiceCards<const T extends string>({
  value,
  onChange,
  options,
  columns = 2
}: {
  value: T;
  onChange: (v: NoInfer<T>) => void;
  options: { value: NoInfer<T>; title: string; description?: string; icon?: React.ReactNode; aside?: React.ReactNode }[];
  columns?: 1 | 2 | 3;
}) {
  const grid = columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2';
  return (
    <div className={`grid gap-2.5 ${grid}`} role="radiogroup">
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
              active ? 'border-brand/60 bg-brand-50/60 ring-4 ring-brand/10' : 'border-line bg-white hover:border-brand/30'
            }`}
          >
            {o.icon && <span className={`mt-0.5 ${active ? 'text-brand' : 'text-muted'}`}>{o.icon}</span>}
            <span className="flex-1">
              <span className="block text-sm font-bold text-ink">{o.title}</span>
              {o.description && <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{o.description}</span>}
            </span>
            {o.aside && <span className="text-sm font-semibold text-ink">{o.aside}</span>}
            <span
              className={`mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full border-2 ${active ? 'border-[5px] border-brand' : 'border-line-2'}`}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}
