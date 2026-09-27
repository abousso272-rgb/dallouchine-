import React from 'react';
import { Loader2 } from 'lucide-react';
import { Link } from './Link';

type Variant = 'primary' | 'dark' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-600 active:bg-brand-700 shadow-[0_1px_0_rgb(0_0_0/0.08),inset_0_1px_0_rgb(255_255_255/0.12)]',
  dark: 'bg-ink text-white hover:bg-ink-2 active:bg-ink-3',
  secondary: 'bg-white text-ink border border-line-2 hover:border-ink/40 hover:bg-paper',
  ghost: 'text-ink hover:bg-ink/5',
  subtle: 'bg-paper-2 text-ink hover:bg-line',
  danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-13 px-6 text-[15px] gap-2.5 rounded-2xl'
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  block?: boolean;
  to?: string;
}

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', block = false, extra = '') {
  return [
    'inline-flex items-center justify-center font-semibold whitespace-nowrap select-none transition-colors duration-150',
    'disabled:opacity-50 disabled:pointer-events-none',
    VARIANTS[variant],
    SIZES[size],
    block ? 'w-full' : '',
    extra
  ].join(' ');
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  iconRight,
  block,
  to,
  className = '',
  children,
  disabled,
  type,
  ...rest
}: ButtonProps) {
  const cls = buttonClasses(variant, size, block, className);
  const content = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
      {!loading && iconRight}
    </>
  );
  if (to && !disabled) {
    return (
      <Link to={to} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type || 'button'} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
}

export function IconButton({
  label,
  className = '',
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink transition-colors hover:bg-ink/5 disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
