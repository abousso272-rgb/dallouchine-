import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier } from '../../types';
import {
  Factory,
  Search,
  Plus,
  Star,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Phone,
  MessageSquare,
  X,
  CheckCircle2
} from 'lucide-react';

export const AdminSuppliersPage: React.FC = () => {
  const { suppliers, addSupplier, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    platform: '1688' as Supplier['platform'],
    platformStoreUrl: '',
    contactPerson: '',
    wechatId: '',
    phone: '',
    city: 'Guangzhou',
    province: 'Guangdong',
    productCategories: ['Électronique'],
    qualityScore: 4.8,
    priceScore: 4.9,
    reliabilityScore: 4.7,
    speedScore: 4.6
  });

  const filtered = suppliers.filter(s => {
    const q = (search || '').toLowerCase();
    return (
      (s?.name || '').toLowerCase().includes(q) ||
      (s?.city || '').toLowerCase().includes(q) ||
      (s?.contactPerson || '').toLowerCase().includes(q) ||
      (s?.productCategories || []).some(c => (c || '').toLowerCase().includes(q))
    );
  });

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addSupplier({
      name: formData.name,
      platform: formData.platform,
      platformStoreUrl: formData.platformStoreUrl || 'https://1688.com',
      contactPerson: formData.contactPerson || 'Direct Factory Manager',
      wechatId: formData.wechatId || 'wx_direct_supplier',
      phone: formData.phone || '+86 20 8899 0011',
      city: formData.city,
      province: formData.province,
      productCategories: formData.productCategories,
      qualityScore: Number(formData.qualityScore),
      priceScore: Number(formData.priceScore),
      reliabilityScore: Number(formData.reliabilityScore),
      speedScore: Number(formData.speedScore),
      totalOrdersFulfilled: 0,
      activeDisputesCount: 0,
      isVerified: true
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a183d] p-5 rounded-2xl border border-blue-900/50 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Fournisseurs & Usines Partenaires Chine</h1>
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {suppliers.length} usines vérifiées
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Évaluation multi-critères (Qualité, Prix, Fiabilité, Délai) et contacts directs WeChat des fabricants 1688 et Taobao.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une Usine</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, ville (Guangzhou, Yiwu...), contact..."
          className="w-full pl-9 pr-3 py-2 bg-[#06102b] border border-blue-900/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-purple-500"
        />
      </div>

      {/* Grid of Suppliers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(sup => {
          const overallScore = ((sup.qualityScore + sup.priceScore + sup.reliabilityScore + sup.speedScore) / 4).toFixed(1);

          return (
            <div
              key={sup.id}
              className="p-5 rounded-2xl bg-[#0a183d] border border-blue-900/50 hover:border-purple-500/50 transition-all shadow-md space-y-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white">{sup.name}</span>
                      {sup.isVerified && (
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" title="Usine Auditée" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-purple-400" />
                      <span>{sup.city}, {sup.province} • Plateforme {sup.platform}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-amber-400 font-black text-sm font-mono">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{overallScore}</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Score Global</span>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {(sup.productCategories || []).map((c, i) => (
                    <span key={i} className="text-[9px] bg-white/5 text-purple-300 px-2 py-0.5 rounded border border-white/5 font-semibold">
                      {c}
                    </span>
                  ))}
                </div>

                {/* Score breakdown metrics */}
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-blue-900/40 text-center text-xs">
                  <div className="p-1.5 rounded-lg bg-[#06102b]">
                    <div className="text-[9px] text-slate-400">Qualité</div>
                    <div className="font-bold text-white font-mono">{sup.qualityScore}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#06102b]">
                    <div className="text-[9px] text-slate-400">Prix</div>
                    <div className="font-bold text-emerald-400 font-mono">{sup.priceScore}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#06102b]">
                    <div className="text-[9px] text-slate-400">Fiabilité</div>
                    <div className="font-bold text-blue-300 font-mono">{sup.reliabilityScore}</div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#06102b]">
                    <div className="text-[9px] text-slate-400">Délai</div>
                    <div className="font-bold text-amber-300 font-mono">{sup.speedScore}</div>
                  </div>
                </div>
              </div>

              {/* Direct Contacts & Actions */}
              <div className="pt-2 border-t border-blue-900/40 flex items-center justify-between text-[11px]">
                <div className="text-slate-300 font-mono">
                  WeChat : <span className="text-emerald-400 font-bold">{sup.wechatId}</span>
                </div>
                <a
                  href={sup.platformStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-300 hover:text-white flex items-center gap-1 font-semibold"
                >
                  <span>Boutique 1688</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0a183d] border border-purple-700/50 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-blue-900/50 pb-3">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Factory className="w-4 h-4 text-purple-400" />
                <span>Ajouter une Usine / Fabricant</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nom de l'Entreprise / Usine *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Shenzhen Smart Tech Co., Ltd."
                  className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plateforme</label>
                  <select
                    value={formData.platform}
                    onChange={e => setFormData({ ...formData, platform: e.target.value as any })}
                    className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                  >
                    <option value="1688">1688 (Alibaba Chine)</option>
                    <option value="alibaba_intl">Alibaba International</option>
                    <option value="direct_factory">Usine Directe Hors-Ligne</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ville / Province</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Guangzhou"
                    className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ID WeChat *</label>
                  <input
                    type="text"
                    value={formData.wechatId}
                    onChange={e => setFormData({ ...formData, wechatId: e.target.value })}
                    placeholder="wx_supplier_888"
                    className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-emerald-300 font-mono focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Responsable Commercial</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Mr. Chen Li"
                    className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">URL Boutique / Fiche 1688</label>
                <input
                  type="url"
                  value={formData.platformStoreUrl}
                  onChange={e => setFormData({ ...formData, platformStoreUrl: e.target.value })}
                  placeholder="https://shop.1688.com/..."
                  className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-white focus:outline-hidden font-mono"
                />
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
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md"
                >
                  Enregistrer l'Usine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
