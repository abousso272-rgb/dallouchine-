import React from 'react';

interface SectionHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
  align?: 'left' | 'center';
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  badge,
  title,
  subtitle,
  actionText,
  onAction,
  align = 'left',
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10 ${
        align === 'center' ? 'text-center md:text-center items-center' : ''
      } ${className}`}
    >
      <div className={`space-y-2 max-w-2xl ${align === 'center' ? 'mx-auto' : ''}`}>
        {badge && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF4500]/10 text-[#FF4500] border border-[#FF4500]/20 text-xs font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-pulse" />
            {badge}
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0B192C] tracking-tight leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="group inline-flex items-center gap-2 text-sm font-bold text-[#FF4500] hover:text-[#0B192C] transition-colors shrink-0 self-start md:self-auto"
        >
          <span>{actionText}</span>
          <span className="transform group-hover:translate-x-1 transition-transform">→</span>
        </button>
      )}
    </div>
  );
};
