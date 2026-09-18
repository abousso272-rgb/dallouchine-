import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Groupage, GroupageStatus, TransportMode } from '../../types';
import {
  Layers,
  Search,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Plane,
  Ship,
  X,
  Calendar,
  Users,
  Eye,
  Percent,
  DollarSign,
  TrendingUp,
  ChevronRight,
  PackageCheck
} from 'lucide-react';

export const AdminGroupagesPage: React.FC = () => {
  const {
    groupages,
    products,
    orders,
    updateGroupageStatus,
    addGroupage,
    navigate,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'to_close' | 'transit' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [selectedGroupage, setSelectedGroupage] = useState<Groupage | null>(null);
  const [detailTab, setDetailTab] = useState<'summary' | 'orders' | 'costs' | 'logistics' | 'actions'>('summary');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Groupage Form State
  const [newGroupageData, setNewGroupageData] = useState({
    productId: products[0]?.id || '',
    code: `GRP-0${Math.floor(28 + Math.random() * 70)}`,
    title: '',
    targetUnits: 50,
    unitPriceXOF: 24500,
    originalPriceXOF: 38000,
    closingDays: 14,
    transportMode: 'air' as TransportMode,
    logisticsRoute: 'Guangzhou Hub ➔ Hub Dakar'
  });

  const filteredGroupages = groupages.filter(grp => {
    const searchLower = (search || '').toLowerCase();
    const matchSearch =
      (grp?.code || '').toLowerCase().includes(searchLower) ||
      (grp?.title || '').toLowerCase().includes(searchLower);

    if (!matchSearch) return false;
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return grp.status === 'open' || grp.status === 'closing_soon';
    if (activeTab === 'to_close') return (grp.currentUnits / grp.targetUnits) >= 0.8 || grp.status === 'closing_soon';
    if (activeTab === 'transit') return grp.status === 'shipped' || grp.status === 'purchasing' || grp.status === 'quality_check';
    if (activeTab === 'completed') return grp.status === 'arrived' || grp.status === 'completed';
    return true;
  });

  const getProductForGroupage = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  const handleCreateGroupage = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === newGroupageData.productId);
    if (!prod) return;

    const savingsPercent = Math.round(((newGroupageData.originalPriceXOF - newGroupageData.unitPriceXOF) / newGroupageData.originalPriceXOF) * 100);

    addGroupage({
      code: newGroupageData.code,
      title: newGroupageData.title || `Groupage : ${prod.name}`,
      productId: prod.id,
      unitPriceXOF: Number(newGroupageData.unitPriceXOF),
      originalPriceXOF: Number(newGroupageData.originalPriceXOF),
      targetUnits: Number(newGroupageData.targetUnits),
      currentUnits: 1,
      participantsCount: 1,
      startDate: new Date().toISOString().split('T')[0],
      closingDate: new Date(Date.now() + newGroupageData.closingDays * 86400000).toISOString().split('T')[0],
      estimatedDepartureDate: new Date(Date.now() + (newGroupageData.closingDays + 4) * 86400000).toISOString().split('T')[0],
      estimatedArrivalDate: new Date(Date.now() + (newGroupageData.closingDays + 20) * 86400000).toISOString().split('T')[0],
      transportMode: newGroupageData.transportMode,
      status: 'open',
      minOrderPerUser: 1,
      maxOrderPerUser: 10,
      savingsPercent: Math.max(10, savingsPercent),
      logisticsRoute: newGroupageData.logisticsRoute,
      guaranteeNote: 'Remboursement immédiat Wave/OM si le quota minimum n\'est pas atteint.',
      keyBenefits: ['Tarif négocié usine Chine', 'Contrôle qualité systématique', 'Transport et dédouanement inclus']
    });

    showToast('success', 'Groupage créé', `Campagne ${newGroupageData.code} publiée.`);
    setIsCreateModalOpen(false);
  };

  const handleStatusChange = (grpId: string, nextStatus: GroupageStatus) => {
    updateGroupageStatus(grpId, nextStatus);
    if (selectedGroupage && selectedGroupage.id === grpId) {
      setSelectedGroupage(prev => prev ? { ...prev, status: nextStatus } : null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER: Single primary action & count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a1945] p-5 rounded-3xl border border-blue-900/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">Groupages & Achats Groupés</h1>
            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {groupages.length} lots
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gérez les campagnes de commandes groupées, les seuils de remplissage et les achats usine.
          </p>
        </div>

        {/* PRIMARY ACTION */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 transition-all self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau groupage</span>
        </button>
      </div>

      {/* 2. SEARCH & FILTER TABS (TOUS, ACTIFS, À CLÔTURER, EN TRANSIT, TERMINÉS) */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-[#0a1945] p-3 rounded-2xl border border-blue-900/40">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par code ou titre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {[
            { id: 'all', label: 'Tous', count: groupages.length },
            { id: 'active', label: 'Actifs', count: groupages.filter(g => g.status === 'open' || g.status === 'closing_soon').length },
            { id: 'to_close', label: 'À clôturer', count: groupages.filter(g => (g.currentUnits / g.targetUnits) >= 0.8).length },
            { id: 'transit', label: 'En transit', count: groupages.filter(g => g.status === 'shipped' || g.status === 'purchasing' || g.status === 'quality_check').length },
            { id: 'completed', label: 'Terminés', count: groupages.filter(g => g.status === 'arrived' || g.status === 'completed').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-75">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. GROUPAGES CARDS / LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroupages.map(grp => {
          const prod = getProductForGroupage(grp.productId);
          const percent = Math.min(100, Math.round((grp.currentUnits / grp.targetUnits) * 100));

          return (
            <div
              key={grp.id}
              onClick={() => {
                setSelectedGroupage(grp);
                setDetailTab('summary');
              }}
              className="bg-[#0a1945] rounded-3xl border border-blue-900/40 hover:border-cyan-500/50 p-5 shadow-lg flex flex-col justify-between gap-4 cursor-pointer transition-all hover:scale-[1.01] group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/50">
                    {grp.code}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    grp.status === 'open'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : grp.status === 'closing_soon'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : grp.status === 'shipped'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                  }`}>
                    {grp.status === 'open' ? 'Ouvert' : grp.status === 'closing_soon' ? 'Clôture proche' : grp.status === 'shipped' ? 'En transit' : 'Terminé'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={grp.image || prod?.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                    alt=""
                    className="w-14 h-14 rounded-2xl object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs text-white truncate group-hover:text-cyan-300 transition-colors">
                      {grp.title}
                    </h3>
                    <div className="text-xs font-mono font-black text-emerald-300 mt-0.5">
                      {(grp.unitPriceXOF || 0).toLocaleString('fr-FR')} FCFA{' '}
                      <span className="text-[10px] line-through text-slate-500 font-normal">
                        {(grp.originalPriceXOF || 0).toLocaleString('fr-FR')} F
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>{grp.currentUnits} / {grp.targetUnits} unités</span>
                    <strong className="text-cyan-400 font-mono">{percent}%</strong>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom metadata */}
              <div className="pt-3 border-t border-blue-900/40 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Clôture : {grp.deadline || grp.closingDate}</span>
                </span>
                <span className="text-cyan-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  <span>Détails</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. GROUPAGE DETAIL DRAWER / MODAL (HIERARCHY: TOP SUMMARY + 5 TABS) */}
      {selectedGroupage && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-[#0a1945] h-full shadow-2xl border-l border-blue-900/50 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-5">
              {/* Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {selectedGroupage.code}
                  </span>
                  <h2 className="text-base font-black text-white truncate max-w-sm">
                    {selectedGroupage.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedGroupage(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress & Status Header */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">
                    Objectif : <strong>{selectedGroupage.currentUnits}</strong> sur <strong>{selectedGroupage.targetUnits}</strong> unités
                  </span>
                  <span className="font-mono font-bold text-cyan-400">
                    {Math.min(100, Math.round((selectedGroupage.currentUnits / selectedGroupage.targetUnits) * 100))}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((selectedGroupage.currentUnits / selectedGroupage.targetUnits) * 100))}%` }}
                  />
                </div>
              </div>

              {/* 5 TABS NAVIGATION (RÉSUMÉ, COMMANDES, COÛTS, LOGISTIQUE, ACTIONS) */}
              <div className="flex items-center gap-1 border-b border-blue-900/40 pb-2">
                {[
                  { id: 'summary', label: 'Résumé' },
                  { id: 'orders', label: 'Commandes' },
                  { id: 'costs', label: 'Coûts & Marges' },
                  { id: 'logistics', label: 'Logistique' },
                  { id: 'actions', label: 'Actions' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setDetailTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      detailTab === t.id
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: SUMMARY */}
              {detailTab === 'summary' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-slate-400 text-[10px] block">Prix Groupage Unitaire</span>
                      <strong className="text-base font-black text-emerald-300 font-mono">
                        {(selectedGroupage?.unitPriceXOF || 0).toLocaleString('fr-FR')} FCFA
                      </strong>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-slate-400 text-[10px] block">Économie Client</span>
                      <strong className="text-base font-black text-cyan-300 font-mono">
                        -{selectedGroupage.savingsPercent}%
                      </strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider block">Avantages du Lot</span>
                    <ul className="space-y-1.5 text-slate-300">
                      {selectedGroupage.keyBenefits?.map((b, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 2: COMMANDES */}
              {detailTab === 'orders' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Commandes clientes associées</span>
                    <span>{selectedGroupage.currentUnits} unités réservées</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-slate-300 space-y-2">
                    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                      <div>
                        <strong>Amadou Diallo</strong> (Dakar)
                        <div className="text-[10px] text-slate-400">Paiement Wave Validé</div>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">x2 pcs</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <div>
                        <strong>Fatou Sow</strong> (Thiès)
                        <div className="text-[10px] text-slate-400">Paiement Orange Money Validé</div>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">x1 pc</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: COÛTS & MARGES */}
              {detailTab === 'costs' && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white/5">
                      <span className="text-slate-400 text-[10px] block">Coût Achat Usine Global</span>
                      <strong className="text-white font-mono">
                        {(((selectedGroupage?.currentUnits || 0) * (selectedGroupage?.unitPriceXOF || 0) * 0.65) || 0).toLocaleString('fr-FR')} FCFA
                      </strong>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/5">
                      <span className="text-slate-400 text-[10px] block">Marge Estimée SinoSenegal</span>
                      <strong className="text-emerald-400 font-mono">
                        {(((selectedGroupage?.currentUnits || 0) * (selectedGroupage?.unitPriceXOF || 0) * 0.35) || 0).toLocaleString('fr-FR')} FCFA
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LOGISTIQUE */}
              {detailTab === 'logistics' && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Mode d'acheminement</span>
                      <span className="font-bold text-white uppercase">{selectedGroupage.transportMode === 'air' ? 'Fret Aérien' : 'Fret Maritime'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Itinéraire</span>
                      <span className="font-bold text-white">{selectedGroupage.logisticsRoute}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Arrivée estimée Dakar</span>
                      <span className="font-mono text-cyan-300 font-bold">{selectedGroupage.estimatedArrivalDate || 'En cours'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ACTIONS */}
              {detailTab === 'actions' && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                    <span className="text-slate-300 font-bold block">Faire évoluer le statut du lot :</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleStatusChange(selectedGroupage.id, 'purchasing')}
                        className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                      >
                        Lancer l'achat usine
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedGroupage.id, 'quality_check')}
                        className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                      >
                        Validation Qualité (QC)
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedGroupage.id, 'shipped')}
                        className="py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                      >
                        Expédier vers Sénégal
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedGroupage.id, 'arrived')}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      >
                        Arrivé au Hub Dakar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Close */}
            <div className="pt-4 border-t border-blue-900/40">
              <button
                onClick={() => setSelectedGroupage(null)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs"
              >
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE NEW GROUPAGE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0a1945] rounded-3xl border border-blue-900/50 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
              <h3 className="text-base font-black text-white">Nouveau Groupage</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroupage} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Produit de base</label>
                <select
                  value={newGroupageData.productId}
                  onChange={e => {
                    const p = products.find(prod => prod.id === e.target.value);
                    setNewGroupageData({
                      ...newGroupageData,
                      productId: e.target.value,
                      originalPriceXOF: p ? p.priceXOF : 35000,
                      unitPriceXOF: p ? Math.round(p.priceXOF * 0.72) : 25000
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#050e26] border border-white/10 text-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({(p.priceXOF || 0).toLocaleString('fr-FR')} F)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Prix Promo Groupage (FCFA)</label>
                  <input
                    type="number"
                    value={newGroupageData.unitPriceXOF}
                    onChange={e => setNewGroupageData({ ...newGroupageData, unitPriceXOF: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Quota Cible (Unités)</label>
                  <input
                    type="number"
                    value={newGroupageData.targetUnits}
                    onChange={e => setNewGroupageData({ ...newGroupageData, targetUnits: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Délai de réservation (Jours)</label>
                <input
                  type="number"
                  value={newGroupageData.closingDays}
                  onChange={e => setNewGroupageData({ ...newGroupageData, closingDays: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div className="pt-3 border-t border-blue-900/40 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md"
                >
                  Lancer la campagne
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
