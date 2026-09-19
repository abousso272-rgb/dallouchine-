import React from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { PriceDisplay } from './PriceDisplay';
import { Heart, ShoppingBag, Star, Plane, Ship, CheckCircle2, Flame, ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  className?: string;
  variant?: 'standard' | 'compact' | 'featured';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className = '',
  variant = 'standard'
}) => {
  const { navigate, addToCart, isFavorite, toggleFavorite } = useApp();
  const fav = isFavorite(product.id);

  const handleCardClick = () => {
    navigate(`/products/${product.slug || product.id}`);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  const isAir = product.defaultTransportMode === 'air';

  return (
    <div
      onClick={handleCardClick}
      className={`glass-panel glass-card-hover group relative rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer border border-white/90 bg-white/80 shadow-xs flex flex-col justify-between transition-all duration-300 ${className}`}
    >
      {/* Top Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100/60 p-1.5 sm:p-2.5">
        <img
          src={product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
          alt={product?.name || 'Produit'}
          className="w-full h-full object-cover rounded-xl sm:rounded-2xl transform group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Top Badges & Favorite Container (Prevents Any Overlap on Mobile/Tablet/Desktop) */}
        <div className="absolute top-2 sm:top-3 inset-x-2 sm:inset-x-3 flex items-start justify-between gap-1.5 z-10 pointer-events-none">
          {/* Badges Column */}
          <div className="flex flex-col gap-1 max-w-[calc(100%-36px)] pointer-events-auto">
            {product.isGroupage && (
              <span className="glass-panel text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/95 text-white shadow-xs flex items-center gap-1 backdrop-blur-md shrink-0 w-fit">
                <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-200 fill-yellow-200 shrink-0" />
                <span className="truncate">Groupage</span>
              </span>
            )}

            <span className="glass-panel text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/95 text-[#0B192C] shadow-xs flex items-center gap-1 backdrop-blur-md shrink-0 w-fit">
              {isAir ? (
                <Plane className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FF4500] shrink-0" />
              ) : (
                <Ship className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-600 shrink-0" />
              )}
              <span className="truncate">{isAir ? 'Aérien 12-18j' : 'Maritime 30-45j'}</span>
            </span>
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            aria-label="Ajouter aux favoris"
            className={`pointer-events-auto shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full glass-panel flex items-center justify-center transition-all duration-200 shadow-xs ${
              fav
                ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm scale-105'
                : 'bg-white/90 text-slate-500 hover:text-rose-500 hover:bg-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${fav ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Quick Add overlay button (desktop hover) */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block z-10">
          <button
            onClick={handleQuickAdd}
            className="w-full bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Ajouter au panier</span>
          </button>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 space-y-2 sm:space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 gap-1">
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#FF4500] uppercase tracking-wider truncate">
              {product.category}
            </span>
            <div className="flex items-center gap-0.5 font-mono-numeric font-bold text-amber-600 shrink-0 text-[10px] sm:text-xs">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating}</span>
            </div>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-[#0B192C] group-hover:text-[#FF4500] transition-colors line-clamp-2 leading-snug min-h-[2rem] sm:min-h-[2.5rem]">
            {product.name}
          </h3>
        </div>

        <div className="space-y-1.5 pt-1 border-t border-slate-100">
          <PriceDisplay
            priceXOF={product.priceXOF}
            previousPriceXOF={product.previousPriceXOF}
            size="sm"
          />

          {/* Décomposition Produit vs Transport */}
          <div className="rounded-lg bg-slate-50 p-1.5 border border-slate-200/60 space-y-0.5 text-[10px]">
            <div className="flex items-center justify-between text-slate-600">
              <span className="truncate">Produit Usine :</span>
              <span className="font-mono-numeric font-bold text-[#0B192C]">
                {(product.productPriceXOF || Math.round(product.priceXOF * 0.65)).toLocaleString('fr-FR')} F
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="truncate">Fret estimé :</span>
              <span className="font-mono-numeric font-semibold text-amber-700">
                ~{(product.estimatedLogisticsXOF || Math.round(product.priceXOF * 0.35)).toLocaleString('fr-FR')} F
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 pt-0.5">
            <span className="font-mono-numeric text-slate-600 font-medium truncate">
              MOQ: <strong>{product.moq} pc</strong>
            </span>
            <span className="text-emerald-700 font-semibold flex items-center gap-0.5 shrink-0 text-[10px]">
              <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
              <span>Contrôle Chine</span>
            </span>
          </div>
        </div>

        {/* Mobile Quick Action Bar */}
        <div className="pt-1 sm:hidden border-t border-slate-100">
          <button
            onClick={handleQuickAdd}
            className="w-full bg-[#FF4500] active:bg-[#E03D00] text-white font-bold text-xs py-1.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
          >
            <ShoppingBag className="w-3 h-3" />
            <span>Commander</span>
          </button>
        </div>
      </div>
    </div>
  );
};
