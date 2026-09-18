import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'amber' | 'emerald' | 'rose' | 'glass' | 'navy';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  size = 'sm',
  className = '',
  icon
}) => {
  const variantStyles = {
    blue: 'bg-[#2A6DFF]/10 text-[#0D2C7A] border-[#2A6DFF]/25 font-semibold',
    amber: 'bg-amber-500/15 text-amber-900 border-amber-500/30 font-bold',
    emerald: 'bg-emerald-500/15 text-emerald-900 border-emerald-500/30 font-bold',
    rose: 'bg-rose-500/15 text-rose-900 border-rose-500/30 font-bold',
    glass: 'bg-white/70 backdrop-blur-md text-slate-800 border-white/80 shadow-xs font-medium',
    navy: 'bg-[#0D2C7A] text-white border-blue-900 font-semibold'
  };

  const sizeStyles = {
    xs: 'text-[10px] px-2 py-0.5 rounded-md gap-1',
    sm: 'text-xs px-2.5 py-1 rounded-lg gap-1.5',
    md: 'text-sm px-3.5 py-1.5 rounded-xl gap-2'
  };

  return (
    <span
      className={`inline-flex items-center border tracking-tight transition-all duration-200 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
