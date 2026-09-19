import React from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { Badge } from '../common/Badge';
import { Plane, Ship, Zap, ShoppingBag, ArrowRight, Eye, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigate, addToCart } = useApp();

  const savings = product.previousPriceXOF
    ? Math.round(((product.previousPriceXOF - product.priceXOF) / product.previousPriceXOF) * 100)
    : 0;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-[#FF4500]/40 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image container */}
      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => navigate(`/products/${product.slug}`)}>
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.isGroupage ? (
            <span className="bg-[#0B192C] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Groupage Actif
            </span>
          ) : (
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
              Achat Direct
            </span>
          )}

          {savings > 0 && (
            <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
              -{savings}% d'économie
            </span>
          )}
        </div>

        {/* Transport Type indicator */}
        <div className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-slate-700 flex items-center gap-1 shadow-xs">
          {product.defaultTransportMode === 'air' ? (
            <>
              <Plane className="w-3 h-3 text-[#FF4500]" />
              <span>Fret Aérien ({product.estimatedDeliveryDays})</span>
            </>
          ) : (
            <>
              <Ship className="w-3 h-3 text-emerald-600" />
              <span>Fret Maritime ({product.estimatedDeliveryDays})</span>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-semibold text-[#FF4500] uppercase tracking-wider mb-1">
            {product.category}
          </div>
          <h3
            onClick={() => navigate(`/products/${product.slug}`)}
            className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 hover:text-[#FF4500] cursor-pointer transition-colors leading-snug"
          >
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
          <div>
            <div className="text-base sm:text-lg font-black text-[#0B192C] tracking-tight">
              {product.priceXOF.toLocaleString('fr-FR')}{' '}
              <span className="text-xs font-bold text-slate-500">FCFA</span>
            </div>
            {product.previousPriceXOF && (
              <div className="text-[11px] text-slate-400 line-through">
                {product.previousPriceXOF.toLocaleString('fr-FR')} FCFA
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate(`/products/${product.slug}`)}
              className="p-2 text-slate-500 hover:text-[#FF4500] hover:bg-slate-100 rounded-xl transition-colors"
              title="Voir la fiche détaillée"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => addToCart(product, 1)}
              className="bg-[#FF4500] hover:bg-[#E03D00] active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Commander</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
