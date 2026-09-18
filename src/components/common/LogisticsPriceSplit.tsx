import React from 'react';
import { ShieldCheck, Info, Plane, Ship, AlertCircle } from 'lucide-react';
import { AmountStatus } from '../../types';

interface LogisticsPriceSplitProps {
  productPriceXOF: number;
  logisticsPriceXOF: number;
  totalPriceXOF: number;
  productStatus?: AmountStatus;
  logisticsStatus?: AmountStatus;
  transportMode?: 'air' | 'sea' | 'express';
  weightKg?: number;
  cbm?: number;
  compact?: boolean;
  showDisclaimer?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<{ status: AmountStatus; label?: string }> = ({
  status,
  label
}) => {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
        <span>{label || 'Confirmé'}</span>
      </span>
    );
  }

  if (status === 'estimated') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        <span>{label || 'Estimatif'}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
      <span>{label || 'À confirmer'}</span>
    </span>
  );
};

export const LogisticsPriceSplit: React.FC<LogisticsPriceSplitProps> = ({
  productPriceXOF,
  logisticsPriceXOF,
  totalPriceXOF,
  productStatus = 'confirmed',
  logisticsStatus = 'estimated',
  transportMode = 'air',
  weightKg,
  cbm,
  compact = false,
  showDisclaimer = true,
  className = ''
}) => {
  const isAir = transportMode === 'air' || transportMode === 'express';

  if (compact) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span>Prix Produit :</span>
            <StatusBadge status={productStatus} />
          </div>
          <span className="font-mono-numeric font-bold text-[#0D2C7A]">
            {productPriceXOF.toLocaleString('fr-FR')} FCFA
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span>Transport :</span>
            <StatusBadge status={logisticsStatus} />
          </div>
          <span className="font-mono-numeric font-bold text-amber-700">
            ~{logisticsPriceXOF.toLocaleString('fr-FR')} FCFA
          </span>
        </div>

        <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs font-black text-[#0D2C7A]">
          <span>Total Estimé :</span>
          <span className="font-mono-numeric text-sm text-[#0D2C7A]">
            {totalPriceXOF.toLocaleString('fr-FR')} FCFA
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-[#F8F6F2] border border-slate-200/90 p-4 space-y-3.5 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
        <div className="flex items-center gap-2">
          {isAir ? (
            <Plane className="w-4 h-4 text-[#2A6DFF]" />
          ) : (
            <Ship className="w-4 h-4 text-cyan-600" />
          )}
          <span className="text-xs font-bold text-[#0D2C7A] uppercase tracking-wide">
            Décomposition Prix & Acheminement Chine ➔ Sénégal
          </span>
        </div>
        <span className="text-[10px] font-semibold text-slate-500">Transparence DDP</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Colonne 1: Prix Produit */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">1. Prix Marchandise</span>
            <StatusBadge status={productStatus} label="CONFIRMÉ" />
          </div>
          <div className="text-lg font-black text-[#0D2C7A] font-mono-numeric">
            {productPriceXOF.toLocaleString('fr-FR')}{' '}
            <span className="text-xs font-bold text-slate-500">FCFA</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Tarif usine négocié en Chine avec contrôle qualité pré-expédition.
          </p>
        </div>

        {/* Colonne 2: Coût Logistique */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">2. Fret & Transit</span>
            <StatusBadge status={logisticsStatus} label="ESTIMATIF" />
          </div>
          <div className="text-lg font-black text-amber-700 font-mono-numeric">
            ~{logisticsPriceXOF.toLocaleString('fr-FR')}{' '}
            <span className="text-xs font-bold text-slate-500">FCFA</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Fret {isAir ? 'aérien (12-18j)' : 'maritime (30-45j)'} + dédouanement Gaindé inclus.
            {weightKg && ` Base: ${weightKg} kg`}
            {cbm && ` | ${cbm} CBM`}
          </p>
        </div>
      </div>

      {/* Ligne Total */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
        <div>
          <span className="text-xs font-black text-[#0D2C7A] block">
            Total Estimatif Rendu Dakar :
          </span>
          <span className="text-[10px] text-slate-500">
            Dédouanement tout inclus, retrait hub ou livraison
          </span>
        </div>
        <div className="text-right">
          <span className="text-xl font-black text-[#0D2C7A] font-mono-numeric">
            {totalPriceXOF.toLocaleString('fr-FR')}{' '}
            <span className="text-xs font-bold text-[#2A6DFF]">FCFA</span>
          </span>
        </div>
      </div>

      {/* Mention de transparence obligatoire */}
      {showDisclaimer && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 text-[11px] text-amber-900 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Note importante :</strong> Le prix marchandise est confirmé. Le montant logistique est une estimation fiable basée sur les barèmes actuels ; le montant définitif est validé à la pesée et au cubage lors de l'enregistrement au hub de départ en Chine.
          </span>
        </div>
      )}
    </div>
  );
};
