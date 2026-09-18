import React from 'react';
import { useApp } from '../../context/AppContext';
import { Groupage } from '../../types';
import { ProgressBar } from '../common/ProgressBar';
import { Badge } from '../common/Badge';
import { Plane, Ship, Calendar, Users, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface GroupageCardProps {
  groupage: Groupage;
}

export const GroupageCard: React.FC<GroupageCardProps> = ({ groupage }) => {
  const { navigate, addToCart, products } = useApp();
  const product = groupage.product || products.find(p => p.id === groupage.productId);

  const statusBadges: Record<string, { label: string; variant: 'primary' | 'warning' | 'success' | 'neutral' }> = {
    open: { label: 'Groupage Ouvert', variant: 'primary' },
    closing_soon: { label: 'Clôture Proche', variant: 'warning' },
    closed: { label: 'Lot Complet', variant: 'success' },
    purchasing: { label: 'Achat Usine en cours', variant: 'neutral' },
    quality_check: { label: 'Contrôle Qualité', variant: 'neutral' },
    shipped: { label: 'En Transit Maritime/Aérien', variant: 'neutral' },
    arrived: { label: 'Arrivé à Dakar', variant: 'success' },
    completed: { label: 'Terminé & Livré', variant: 'success' }
  };

  const statusInfo = statusBadges[groupage.status] || { label: groupage.status, variant: 'neutral' };
  const imageUrl = product?.images[0] || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#2A6DFF]/50 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
      {/* Top Banner Image with Floating Meta */}
      <div
        className="relative aspect-16/9 bg-slate-100 overflow-hidden cursor-pointer"
        onClick={() => navigate(`/groupages/${groupage.id}`)}
      >
        <img
          src={imageUrl}
          alt={groupage.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Groupage Code Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="bg-[#0D2C7A] text-white font-extrabold text-xs px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            {groupage.code}
          </span>
          <Badge variant={statusInfo.variant} size="sm">
            {statusInfo.label}
          </Badge>
        </div>

        {/* Savings Badge */}
        {groupage.savingsPercent > 0 && (
          <div className="absolute top-3 right-3 bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg shadow-md">
            Économie -{groupage.savingsPercent}%
          </div>
        )}

        {/* Logistics mode pill */}
        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5">
          {groupage.transportMode === 'air' ? (
            <>
              <Plane className="w-3.5 h-3.5 text-blue-300" />
              <span>Fret Aérien Régulier</span>
            </>
          ) : (
            <>
              <Ship className="w-3.5 h-3.5 text-emerald-300" />
              <span>Fret Maritime Groupé</span>
            </>
          )}
        </div>
      </div>

      {/* Main Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3
            onClick={() => navigate(`/groupages/${groupage.id}`)}
            className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 hover:text-[#0D2C7A] cursor-pointer transition-colors leading-snug"
          >
            {groupage.title}
          </h3>

          {/* Pricing Row */}
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-xl sm:text-2xl font-black text-[#0D2C7A] tracking-tight">
              {groupage.unitPriceXOF.toLocaleString('fr-FR')}{' '}
              <span className="text-xs font-bold text-slate-600">FCFA</span>
            </span>
            <span className="text-xs text-slate-400 line-through">
              {groupage.originalPriceXOF.toLocaleString('fr-FR')} FCFA
            </span>
          </div>

          {/* Target Progress Bar */}
          <div className="mt-4 pt-2 border-t border-slate-100">
            <ProgressBar
              current={groupage.currentUnits}
              target={groupage.targetUnits}
              unitLabel="unités"
              colorScheme={groupage.status === 'closing_soon' ? 'amber' : 'blue'}
            />
          </div>

          {/* Meta Info: Closing & Estimated Delivery */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-[#2A6DFF] shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block leading-none">Clôture lot :</span>
                <span className="font-semibold text-slate-800">{groupage.closingDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block leading-none">Participants :</span>
                <span className="font-semibold text-slate-800">{groupage.participantsCount} personnes</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={() => navigate(`/groupages/${groupage.id}`)}
            className="flex-1 bg-gradient-to-r from-[#0D2C7A] to-[#2A6DFF] hover:opacity-95 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <span>Participer au groupage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
