import React from 'react';

interface PriceDisplayProps {
  priceXOF: number;
  previousPriceXOF?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSavingsBadge?: boolean;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  priceXOF,
  previousPriceXOF,
  size = 'md',
  showSavingsBadge = true,
  className = ''
}) => {
  const savingsPercent =
    previousPriceXOF && previousPriceXOF > priceXOF
      ? Math.round(((previousPriceXOF - priceXOF) / previousPriceXOF) * 100)
      : null;

  const sizeClasses = {
    sm: {
      price: 'text-sm font-bold',
      currency: 'text-[11px] font-semibold',
      prev: 'text-xs',
      badge: 'text-[10px] px-1.5 py-0.5'
    },
    md: {
      price: 'text-lg sm:text-xl font-black',
      currency: 'text-xs sm:text-sm font-bold',
      prev: 'text-xs sm:text-sm',
      badge: 'text-xs px-2 py-0.5'
    },
    lg: {
      price: 'text-2xl sm:text-3xl font-black',
      currency: 'text-sm sm:text-base font-bold',
      prev: 'text-sm sm:text-base',
      badge: 'text-xs px-2.5 py-1'
    },
    xl: {
      price: 'text-3xl sm:text-4xl lg:text-5xl font-black',
      currency: 'text-base sm:text-xl font-bold',
      prev: 'text-base sm:text-lg',
      badge: 'text-sm px-3 py-1 font-bold'
    }
  };

  const s = sizeClasses[size];

  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`}>
      <div className="flex items-baseline gap-1 text-[#0D2C7A]">
        <span className={`font-mono-numeric tracking-tight ${s.price}`}>
          {priceXOF.toLocaleString('fr-FR')}
        </span>
        <span className={`text-[#2A6DFF] ${s.currency}`}>FCFA</span>
      </div>

      {previousPriceXOF && previousPriceXOF > priceXOF && (
        <span className={`line-through text-slate-400 font-mono-numeric ${s.prev}`}>
          {previousPriceXOF.toLocaleString('fr-FR')} F
        </span>
      )}

      {showSavingsBadge && savingsPercent && (
        <span
          className={`bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-bold rounded-md ${s.badge}`}
        >
          -{savingsPercent}%
        </span>
      )}
    </div>
  );
};
