import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  DollarSign,
  ShieldCheck,
  Users,
  Percent,
  Save,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { calcSettings, updateCalcSettings, showToast } = useApp();

  const [formData, setFormData] = useState({
    exchangeRateCNY_XOF: calcSettings.exchangeRateCNY_XOF,
    exchangeRateUSD_XOF: calcSettings.exchangeRateUSD_XOF,
    defaultSourcingFeePercent: calcSettings.defaultSourcingFeePercent,
    defaultInspectionFeeXOF: calcSettings.defaultInspectionFeeXOF,
    defaultConsolidationCbmFeeXOF: calcSettings.defaultConsolidationCbmFeeXOF,
    defaultConsolidationFixedFeeXOF: calcSettings.defaultConsolidationFixedFeeXOF,
    defaultCustomsClearancePercent: calcSettings.defaultCustomsClearancePercent,
    defaultCustomsFixedFeeXOF: calcSettings.defaultCustomsFixedFeeXOF,
    defaultSafetyBufferPercent: calcSettings.defaultSafetyBufferPercent,
    defaultTargetMarginPercent: calcSettings.defaultTargetMarginPercent,
    defaultMinMarginPercent: calcSettings.defaultMinMarginPercent
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCalcSettings(formData);
    showToast('success', 'Paramètres Mis à Jour', 'Les coefficients du moteur financier ont été enregistrés.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a183d] p-5 rounded-2xl border border-blue-900/50 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Paramètres du Moteur Financier & Rôles</h1>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Configuration Système
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Définissez les taux de change officiels, les barèmes de douane Gaindé et les marges minimales de sécurité.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Currencies Section */}
        <div className="bg-[#0a183d] p-5 rounded-2xl border border-blue-900/50 shadow-lg space-y-4">
          <h2 className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>1. Taux de Change Financiers (Chine & International)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Taux Yuan Chinois (1 CNY en FCFA) *
              </label>
              <input
                type="number"
                step={0.1}
                value={formData.exchangeRateCNY_XOF}
                onChange={e => setFormData({ ...formData, exchangeRateCNY_XOF: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold text-sm focus:outline-hidden"
              />
              <div className="text-[10px] text-slate-400 mt-0.5">Appliqué sur les prix usines 1688</div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Taux Dollar US (1 USD en FCFA) *
              </label>
              <input
                type="number"
                step={1}
                value={formData.exchangeRateUSD_XOF}
                onChange={e => setFormData({ ...formData, exchangeRateUSD_XOF: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-emerald-300 font-mono font-bold text-sm focus:outline-hidden"
              />
              <div className="text-[10px] text-slate-400 mt-0.5">Appliqué sur les tarifs des compagnies aériennes & maritimes</div>
            </div>
          </div>
        </div>

        {/* Customs & Sourcing Defaults */}
        <div className="bg-[#0a183d] p-5 rounded-2xl border border-blue-900/50 shadow-lg space-y-4">
          <h2 className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>2. Douane, Sourcing & Marges Cibles</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Commission Sourcing (%)</label>
              <input
                type="number"
                step={0.5}
                value={formData.defaultSourcingFeePercent}
                onChange={e => setFormData({ ...formData, defaultSourcingFeePercent: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Dédouanement Gaindé Dakar (%)</label>
              <input
                type="number"
                step={0.5}
                value={formData.defaultCustomsClearancePercent}
                onChange={e => setFormData({ ...formData, defaultCustomsClearancePercent: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Marge Cible Standard (%)</label>
              <input
                type="number"
                value={formData.defaultTargetMarginPercent}
                onChange={e => setFormData({ ...formData, defaultTargetMarginPercent: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#06102b] border border-emerald-500/40 rounded-xl px-3 py-2 text-emerald-300 font-mono font-bold focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les Paramètres Système</span>
          </button>
        </div>
      </form>
    </div>
  );
};
