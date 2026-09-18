import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PromotionItem } from '../../types';
import {
  Tag,
  Search,
  Plus,
  Percent,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';

export const AdminPromotionsPage: React.FC = () => {
  const { promotions, addPromotion, togglePromotionStatus, showToast } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as PromotionItem['discountType'],
    discountValue: 10,
    minOrderAmountXOF: 50000,
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    maxUsages: 100
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) return;

    addPromotion({
      code: formData.code.toUpperCase(),
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minOrderAmountXOF: Number(formData.minOrderAmountXOF),
      validUntil: formData.validUntil,
      status: 'active',
      maxUsages: Number(formData.maxUsages)
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a183d] p-5 rounded-2xl border border-blue-900/50 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Promotions & Codes Réduction</h1>
            <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {promotions.length} codes configurés
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Générez des coupons de réduction pourcentage ou montant fixe appliqués aux paniers et groupages.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un Code Promo</span>
        </button>
      </div>

      {/* Grid of Promotions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {promotions.map(promo => (
          <div
            key={promo.id}
            className="p-5 rounded-2xl bg-[#0a183d] border border-blue-900/50 hover:border-pink-500/50 transition-all shadow-md space-y-3.5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-pink-300 text-sm bg-pink-950 px-2.5 py-1 rounded-lg border border-pink-800">
                  {promo.code}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  promo.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'
                }`}>
                  {promo.status === 'active' ? 'Actif' : 'Expiré'}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-300">
                <div>
                  Réduction : <strong className="text-white font-mono text-sm">
                    {promo.discountType === 'percentage' ? `-${promo.discountValue}%` : `-${(promo.discountValue || 0).toLocaleString('fr-FR')} FCFA`}
                  </strong>
                </div>
                <div>Min. Commande : <strong className="text-slate-200 font-mono">{(promo.minOrderAmountXOF || 0).toLocaleString('fr-FR')} FCFA</strong></div>
                <div>Utilisations : <strong className="text-white font-mono">{promo.usageCount} / {promo.maxUsages}</strong></div>
                <div>Date de fin : <strong className="text-slate-400 font-mono">{promo.validUntil}</strong></div>
              </div>
            </div>

            <div className="pt-2 border-t border-blue-900/40 flex items-center justify-between">
              <button
                onClick={() => togglePromotionStatus(promo.id)}
                className="text-xs text-blue-300 hover:text-white font-bold"
              >
                {promo.status === 'active' ? 'Désactiver' : 'Réactiver'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a183d] border border-pink-700/50 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-blue-900/50 pb-3">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-pink-400" />
                <span>Nouveau Code Promotion</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Code Promo (ex: DAKAR10) *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-pink-300 font-mono font-bold focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Type Réduction</label>
                  <select
                    value={formData.discountType}
                    onChange={e => setFormData({ ...formData, discountType: e.target.value as any })}
                    className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed_amount">Montant Fixe (FCFA)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Valeur</label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={e => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold shadow-md"
                >
                  Activer le Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
