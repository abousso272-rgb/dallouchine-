import React from 'react';

interface ProgressBarProps {
  current: number;
  target: number;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'orange' | 'blue' | 'amber' | 'emerald';
  colorScheme?: 'orange' | 'blue' | 'amber' | 'emerald';
  unitLabel?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  target,
  showLabels = true,
  size = 'md',
  variant,
  colorScheme,
  unitLabel = 'commandes',
  className = ''
}) => {
  const percentage = Math.min(100, Math.round((current / target) * 100));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5'
  };

  const selectedVariant = colorScheme || variant || 'orange';

  const barColors: Record<string, string> = {
    orange: 'bg-gradient-to-r from-[#FF4500] via-orange-500 to-amber-400',
    blue: 'bg-gradient-to-r from-[#0B192C] via-[#FF4500] to-orange-400',
    amber: 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400',
    emerald: 'bg-gradient-to-r from-emerald-700 via-emerald-500 to-teal-400'
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {showLabels && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1">
            <strong className="text-[#0B192C] font-mono-numeric">{current}</strong>
            <span className="text-slate-400">/ {target} {unitLabel}</span>
          </span>
          <span className="font-mono-numeric text-[#FF4500] font-bold">
            {percentage}%
          </span>
        </div>
      )}

      <div className={`w-full bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/40 shadow-inner ${heightClasses[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out shadow-xs ${barColors[selectedVariant] || barColors.orange}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
