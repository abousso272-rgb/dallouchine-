import React from 'react';

interface TrustCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  className?: string;
}

export const TrustCard: React.FC<TrustCardProps> = ({
  icon,
  title,
  description,
  badge,
  className = ''
}) => {
  return (
    <div
      className={`glass-panel glass-card-hover rounded-3xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between group border border-white/80 bg-white/70 shadow-sm ${className}`}
    >
      {/* Subtle glow circle on top right */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#FF4500]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#FF4500]/20 transition-all" />

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B192C]/10 to-[#FF4500]/15 text-[#0B192C] flex items-center justify-center border border-[#FF4500]/20 shadow-xs group-hover:scale-105 group-hover:bg-[#FF4500] group-hover:text-white transition-all duration-300">
            {icon}
          </div>

          {badge && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {badge}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-black text-[#0B192C] tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-[#FF4500] opacity-0 group-hover:opacity-100 transition-opacity">
        <span>En savoir plus</span>
        <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
      </div>
    </div>
  );
};
