import React from 'react';
import { Groupage, Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { PriceDisplay } from './PriceDisplay';
import { ProgressBar } from './ProgressBar';
import { Flame, Clock, Plane, Ship, ArrowRight, Users2 } from 'lucide-react';

interface GroupBuyCardProps {
  groupage: Groupage;
  className?: string;
}

export const GroupBuyCard: React.FC<GroupBuyCardProps> = ({ groupage, className = '' }) => {
  const { products, navigate, addToCart } = useApp();

  const product = groupage.product || products.find(p => p.id === groupage.productId) || products[0];

  const handleCardClick = () => {
    navigate(`/groupages/${groupage.id}`);
  };

  const handleParticipate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product) {
      addToCart(product, 1, true, groupage.id);
    }
  };

  const isAir = groupage.transportMode === 'air';

  // Format closing date e.g. "30 août 2026"
  const formattedClosingDate = new Date(groupage.closingDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  });

  return (
    <div
      onClick={handleCardClick}
      className={`glass-panel glass-card-hover group relative rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer border border-white/95 bg-white/85 shadow-sm flex flex-col justify-between transition-all duration-300 ${className}`}
    >
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] to-[#1E3E62] text-white px-3 sm:px-4 py-2 flex items-center justify-between text-xs font-bold gap-2">
        <div className="flex items-center gap-1 font-mono-numeric shrink-0">
          <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse fill-amber-300 shrink-0" />
          <span className="text-[11px] sm:text-xs">LOT {groupage.code}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-blue-100 truncate">
          <Clock className="w-3 h-3 shrink-0" />
          <span>Clôture : {formattedClosingDate}</span>
        </div>
      </div>

      {/* Main Container: Image + Details */}
      <div className="p-3.5 sm:p-5 flex flex-col sm:flex-row gap-3.5 sm:gap-4 items-center sm:items-start flex-1">
        {/* Product Image */}
        <div className="relative w-full sm:w-32 md:w-36 h-40 sm:h-36 shrink-0 rounded-2xl overflow-hidden bg-slate-100 p-2">
          <img
            src={product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
            alt={groupage?.title || 'Groupage'}
            className="w-full h-full object-cover rounded-xl transform group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 bg-[#0B192C]/85 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
            -{groupage.savingsPercent}% Éco
          </div>
        </div>

        {/* Info Column */}
        <div className="flex-1 w-full space-y-2.5 sm:space-y-3">
          <div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#FF4500] uppercase tracking-wider block">
              Achat Groupé Négocié
            </span>
            <h3 className="text-sm sm:text-base font-black text-[#0B192C] group-hover:text-[#FF4500] transition-colors leading-snug line-clamp-2">
              {groupage.title}
            </h3>
          </div>

          {/* Pricing */}
          <div className="space-y-1.5">
            <PriceDisplay
              priceXOF={groupage.unitPriceXOF}
              previousPriceXOF={groupage.originalPriceXOF}
              size="sm"
            />

            {/* Décomposition Prix Produit vs Fret */}
            <div className="rounded-xl bg-slate-50 p-2 border border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[10px] text-slate-500 block">Produit Usine</span>
                <span className="font-mono-numeric font-bold text-[#0B192C]">
                  {(groupage.productPriceXOF || Math.round(groupage.unitPriceXOF * 0.65)).toLocaleString('fr-FR')} F
                </span>
                <span className="text-[9px] font-bold text-emerald-700 block">✓ Confirmé</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Fret Estimé</span>
                <span className="font-mono-numeric font-bold text-amber-700">
                  ~{(groupage.estimatedLogisticsXOF || Math.round(groupage.unitPriceXOF * 0.35)).toLocaleString('fr-FR')} F
                </span>
                <span className="text-[9px] font-bold text-amber-700 block">~ Estimatif</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="pt-0.5">
            <ProgressBar
              current={groupage.currentUnits}
              target={groupage.targetUnits}
              size="sm"
              variant={groupage.currentUnits >= groupage.targetUnits * 0.8 ? 'amber' : 'orange'}
            />
          </div>

          {/* Transport & Logistics info */}
          <div className="bg-slate-50/90 rounded-xl p-2 border border-slate-200/70 text-xs flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium text-[11px]">
              {isAir ? <Plane className="w-3 h-3 text-[#FF4500] shrink-0" /> : <Ship className="w-3 h-3 text-cyan-600 shrink-0" />}
              <span>{isAir ? 'Aérien Express (12-18j)' : 'Maritime Groupé (30-45j)'}</span>
            </div>
            <div className="flex items-center gap-1 text-[#0B192C] font-bold text-[10px] sm:text-[11px] font-mono-numeric">
              <Users2 className="w-3 h-3 text-[#FF4500] shrink-0" />
              <span>{groupage.participantsCount} participants</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-3 sm:p-4 bg-gradient-to-b from-transparent to-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden sm:block">
          Dakar Hub ou Livraison locale
        </div>

        <button
          onClick={handleParticipate}
          className="w-full sm:w-auto bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95 sm:ml-auto"
        >
          <span>Participer au groupage</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
