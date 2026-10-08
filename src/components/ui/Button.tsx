import React from 'react';
import { Loader2 } from 'lucide-react';
import { Link } from './Link';

type Variant = 'primary' | 'dark' | 'secondary' | 'ghost' | 'danger' | 'subtle' | 'whatsapp' | 'light';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[linear-gradient(120deg,#ff8a14_0%,#f2560f_55%,#dd2a0b_100%)] text-white shadow-[0_10px_24px_-12px_rgb(232_72_13/0.75),inset_0_1px_0_rgb(255_255_255/0.25)] hover:shadow-[0_14px_30px_-12px_rgb(232_72_13/0.85),inset_0_1px_0_rgb(255_255_255/0.25)] hover:brightness-[1.04] active:brightness-95',
  dark: 'bg-ink text-white hover:bg-ink-2 active:bg-ink-3 shadow-[0_10px_24px_-14px_rgb(11_22_32/0.7)]',
  secondary: 'bg-white text-ink border border-line-2 hover:border-brand/40 hover:text-brand-600 shadow-[0_6px_18px_-14px_rgb(120_60_20/0.45)]',
  ghost: 'text-ink hover:bg-ink/5',
  subtle: 'bg-paper-2 text-ink hover:bg-line',
  danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50',
  whatsapp: 'bg-white text-[#128c4a] border border-[#25d366]/40 hover:bg-[#effbf3] shadow-[0_6px_18px_-14px_rgb(18_140_74/0.6)]',
  light: 'bg-white/12 text-white border border-white/20 hover:bg-white/20'
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13px] gap-1.5 rounded-full',
  md: 'h-11 px-5 text-sm gap-2 rounded-full',
  lg: 'h-[52px] px-7 text-[15px] gap-2.5 rounded-full'
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
    'inline-flex items-center justify-center font-semibold whitespace-nowrap select-none transition-[color,background-color,border-color,box-shadow,filter,transform] duration-200 active:scale-[0.98]',
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
