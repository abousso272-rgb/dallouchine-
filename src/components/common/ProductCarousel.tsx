import React, { useRef, useState, useEffect } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductCarouselProps {
  products: Product[];
  className?: string;
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({ products = [], className = '' }) => {
  const { navigate } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll effect
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
        }
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const safeProducts = products || [];

  return (
    <div
      className={`relative w-full ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Navigation Arrows (Desktop / Tablet) */}
      <button
        onClick={() => handleScroll('left')}
        aria-label="Précédent"
        className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full glass-panel bg-white/90 text-[#0D2C7A] hover:bg-[#2A6DFF] hover:text-white items-center justify-center shadow-lg transition-all active:scale-90"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={() => handleScroll('right')}
        aria-label="Suivant"
        className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full glass-panel bg-white/90 text-[#0D2C7A] hover:bg-[#2A6DFF] hover:text-white items-center justify-center shadow-lg transition-all active:scale-90"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 px-1 sm:px-2 no-scrollbar scroll-smooth snap-x snap-mandatory"
      >
        {safeProducts.map((prod, idx) => (
          <div
            key={prod.id || idx}
            onClick={() => navigate(`/products/${prod.slug || prod.id}`)}
            className="glass-panel glass-card-hover snap-start shrink-0 w-[200px] sm:w-[240px] rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 bg-white/85 border border-white/90 shadow-xs cursor-pointer flex flex-col justify-between group"
          >
            {/* Top image with badges container */}
            <div className="relative aspect-4/3 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100/80 mb-2.5">
              <img
                src={prod?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
                alt={prod?.name || 'Produit'}
                className="w-full h-full object-cover transform group-hover:scale-106 transition-transform duration-500"
                loading="lazy"
              />

              {/* Badges Container Top Row */}
              <div className="absolute top-2 inset-x-2 flex items-center justify-between gap-1 z-10 pointer-events-none">
                <div className="bg-[#0D2C7A]/90 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  <span>Tendance</span>
                </div>

                {prod.previousPriceXOF && (
                  <div className="bg-emerald-600/90 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0">
                    -{Math.round(((prod.previousPriceXOF - prod.priceXOF) / prod.previousPriceXOF) * 100)}%
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1.5">
              <span className="text-[9px] sm:text-[10px] font-semibold text-[#2A6DFF] uppercase tracking-wider block truncate">
                {prod.category}
              </span>

              <h4 className="text-xs sm:text-sm font-bold text-[#0D2C7A] group-hover:text-[#2A6DFF] transition-colors line-clamp-1">
                {prod.name}
              </h4>

              <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                <div className="flex items-baseline gap-1 text-[#0D2C7A] font-mono-numeric">
                  <strong className="text-sm sm:text-base font-black">
                    {prod.priceXOF.toLocaleString('fr-FR')}
                  </strong>
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#2A6DFF]">FCFA</span>
                </div>

                <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono-numeric font-medium truncate">
                  {prod.moq * 5 + 12} cmds
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
