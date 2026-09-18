import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GitCompare,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Filter,
  DollarSign
} from 'lucide-react';

export const AdminCostVariancePage: React.FC = () => {
  const { costVariances } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a183d] p-5 rounded-2xl border border-blue-900/50 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Analyse des Écarts : Prévu vs Réel</h1>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Contrôle de Gestion
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Comparez les coûts estimés au lancement des groupages avec les factures réelles des transitaires et usines pour affiner nos algorithmes.
          </p>
        </div>
      </div>

      {/* Variance KPI summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#0a183d] border border-blue-900/50 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Précision Moyenne du Moteur</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">96.8%</div>
          <div className="text-[10px] text-slate-400">Écart moyen de seulement 3.2%</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a183d] border border-blue-900/50 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Marge Réelle Moyenne</div>
          <div className="text-2xl font-black text-white font-mono">+31.4%</div>
          <div className="text-[10px] text-emerald-400">+1.2% au-dessus de l'objectif</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a183d] border border-blue-900/50 space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Écart Financier Net Cumulé</div>
          <div className="text-2xl font-black text-emerald-300 font-mono">+185 400 FCFA</div>
          <div className="text-[10px] text-slate-400">Sur les 20 derniers lots traités</div>
        </div>
      </div>

      {/* Variance Table */}
      <div className="bg-[#0a183d] rounded-2xl border border-blue-900/50 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#071330] border-b border-blue-900/60 text-[10px] uppercase tracking-wider text-amber-300 font-bold">
                <th className="py-3 px-4">Lot / Dossier</th>
                <th className="py-3 px-3">Produit</th>
                <th className="py-3 px-3">Poids Prévu vs Réel</th>
                <th className="py-3 px-3">Fret Prévu vs Réel</th>
                <th className="py-3 px-3">Coût Total Réel</th>
                <th className="py-3 px-3">Marge Prévue vs Réelle</th>
                <th className="py-3 px-3">Explication de l'Écart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/30">
              {costVariances.map(item => {
                const isPositive = item.varianceAmountXOF >= 0;

                return (
                  <tr key={item.id} className="hover:bg-blue-950/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-blue-300">
                      {item.orderOrGroupageCode}
                    </td>
                    <td className="py-3 px-3 text-white font-medium">
                      {item.productName}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono">
                      <span className="text-slate-400">{item.estimatedWeightKg} kg</span> ➔ <strong className="text-white">{item.actualWeightKg} kg</strong>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono">
                      <span className="text-slate-400">{(item.estimatedFreightCostXOF || 0).toLocaleString('fr-FR')}</span> ➔ <strong className="text-white">{(item.actualFreightCostXOF || 0).toLocaleString('fr-FR')} FCFA</strong>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-white">
                      {(item.actualTotalCostXOF || 0).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono">
                      <span className="text-slate-400">{item.estimatedMarginPercent}%</span> ➔ <strong className={`font-bold ${item.actualMarginPercent >= item.estimatedMarginPercent ? 'text-emerald-400' : 'text-amber-400'}`}>{item.actualMarginPercent}%</strong>
                    </td>
                    <td className="py-3 px-3 text-slate-300 max-w-xs text-[11px]">
                      {item.reasonNotes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
