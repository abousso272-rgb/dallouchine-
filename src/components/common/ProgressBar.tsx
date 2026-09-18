import React from 'react';

interface ProgressBarProps {
  current: number;
  target: number;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'blue' | 'amber' | 'emerald';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  target,
  showLabels = true,
  size = 'md',
  variant = 'blue',
  className = ''
}) => {
  const percentage = Math.min(100, Math.round((current / target) * 100));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5'
  };

  const barColors = {
    blue: 'bg-gradient-to-r from-[#0D2C7A] via-[#2A6DFF] to-blue-400',
    amber: 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-400',
    emerald: 'bg-gradient-to-r from-emerald-700 via-emerald-500 to-teal-400'
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {showLabels && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1">
            <strong className="text-[#0D2C7A] font-mono-numeric">{current}</strong>
            <span className="text-slate-400">/ {target} commandes</span>
          </span>
          <span className="font-mono-numeric text-[#2A6DFF] font-bold">
            {percentage}%
          </span>
        </div>
      )}

      <div className={`w-full bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/40 shadow-inner ${heightClasses[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out shadow-xs ${barColors[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
