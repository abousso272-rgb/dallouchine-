import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SourcingPipelineRequest } from '../../types';
import {
  Compass,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  DollarSign,
  User,
  Send,
  X,
  ChevronRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

export const AdminSourcingPage: React.FC = () => {
  const {
    sourcingPipeline,
    addSourcingPipelineRequest,
    updateSourcingPipelineStatus,
    sourcers,
    showToast,
    addQuote,
    openDocumentModal
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'sourcing_in_progress' | 'quotes_received' | 'sample_ordered' | 'validated' | 'closed'>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SourcingPipelineRequest | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    productName: '',
    category: 'Électronique & High-Tech',
    targetQuantity: 100,
    targetBudgetUSD: 1500,
    targetBudgetCNY: 10800,
    clientName: 'Diallo Import SARL',
    clientPhone: '+221 77 540 22 11',
    assignedSourcerId: sourcers[0]?.id || '',
    referenceUrl: 'https://detail.1688.com/offer/654129.html',
    notes: 'Priorité contrôle conformité électrique et packaging francophone.'
  });

  const filtered = sourcingPipeline.filter(s => {
    const searchLower = (search || '').toLowerCase();
    const matchSearch =
      (s?.code || '').toLowerCase().includes(searchLower) ||
      (s?.productName || '').toLowerCase().includes(searchLower) ||
      (s?.clientName || '').toLowerCase().includes(searchLower);

    if (!matchSearch) return false;
    if (activeTab === 'all') return true;
    return s.status === activeTab;
  });

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName.trim()) return;

    addSourcingPipelineRequest({
      productName: formData.productName,
      category: formData.category,
      targetQuantity: Number(formData.targetQuantity),
      targetBudgetUSD: Number(formData.targetBudgetUSD),
      targetBudgetCNY: Number(formData.targetBudgetCNY),
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      assignedSourcerId: formData.assignedSourcerId,
      referenceUrl: formData.referenceUrl,
      notes: formData.notes
    });

    setIsModalOpen(false);
    setFormData({
      productName: '',
      category: 'Électronique & High-Tech',
      targetQuantity: 100,
      targetBudgetUSD: 1500,
      targetBudgetCNY: 10800,
      clientName: 'Client Pro',
      clientPhone: '+221 77 ...',
      assignedSourcerId: sourcers[0]?.id || '',
      referenceUrl: '',
      notes: ''
    });
    showToast('success', 'Demande enregistrée', 'Assignée à l\'agent en Chine.');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Validé</span>;
      case 'quotes_received':
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Devis Reçu</span>;
      case 'sample_ordered':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Échantillon</span>;
      case 'sourcing_in_progress':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">En Recherche</span>;
      default:
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">En Attente</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a1945] p-5 rounded-3xl border border-blue-900/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">Sourcing & Chasse Usines Chine</h1>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {sourcingPipeline.length} missions
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pilotage des recherches produits, négociations directes et validation des échantillons usine.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle recherche</span>
        </button>
      </div>

      {/* 2. SEARCH & FILTER TABS */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-[#0a1945] p-3 rounded-2xl border border-blue-900/40">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher code, produit, client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF4500]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'pending', label: 'En Attente' },
            { id: 'sourcing_in_progress', label: 'En Cours' },
            { id: 'quotes_received', label: 'Devis Reçus' },
            { id: 'sample_ordered', label: 'Échantillons' },
            { id: 'validated', label: 'Validés' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#FF4500] text-white shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. SOURCING REQUESTS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(req => {
          const sourcer = sourcers.find(s => s.id === req.assignedSourcerId);

          return (
            <div
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className="p-5 rounded-3xl bg-[#0a1945] border border-blue-900/40 hover:border-blue-500/50 transition-all shadow-lg space-y-3.5 flex flex-col justify-between cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-blue-300 text-xs bg-blue-950/70 px-2 py-0.5 rounded border border-blue-800">
                      {req.code}
                    </span>
                    <h3 className="font-bold text-sm text-white mt-1.5 group-hover:text-blue-300 transition-colors">
                      {req.productName}
                    </h3>
                  </div>
                  {getStatusBadge(req.status)}
                </div>

                <div className="space-y-1 text-xs text-slate-300 p-3 rounded-2xl bg-white/5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Client :</span>
                    <strong className="text-white">{req.clientName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quantité :</span>
                    <strong className="text-white font-mono">{req.targetQuantity} pcs</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Agent en Chine :</span>
                    <strong className="text-blue-300">{sourcer ? sourcer.name : 'Guangzhou Hub'}</strong>
                  </div>
                </div>

                {req.notes && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                    &ldquo;{req.notes}&rdquo;
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-blue-900/40 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400 font-mono">{req.createdAt}</span>
                <span className="text-blue-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  <span>Détails</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. DETAIL DRAWER */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-[#0a1945] h-full shadow-2xl border-l border-blue-900/50 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                    {selectedRequest.code}
                  </span>
                  <h2 className="text-base font-black text-white">{selectedRequest.productName}</h2>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Client Mandataire</span>
                  <strong className="text-white">{selectedRequest.clientName} ({selectedRequest.clientPhone})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantité Cible</span>
                  <strong className="text-white font-mono">{selectedRequest.targetQuantity} unités</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Budget Maximum</span>
                  <strong className="text-emerald-300 font-mono">{selectedRequest.targetBudgetUSD} USD (~{selectedRequest.targetBudgetCNY} RMB)</strong>
                </div>
              </div>

              {selectedRequest.referenceUrl && (
                <a
                  href={selectedRequest.referenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-blue-400 flex items-center justify-between transition-colors"
                >
                  <span className="truncate">Lien fiche 1688 / Taobao</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
              )}

              {/* Status advancement buttons */}
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/50 space-y-3 text-xs">
                <span className="text-blue-300 font-bold block">Faire progresser la mission :</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      updateSourcingPipelineStatus(selectedRequest.id, 'sourcing_in_progress');
                      setSelectedRequest(null);
                    }}
                    className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                  >
                    En Recherche Usine
                  </button>
                  <button
                    onClick={() => {
                      updateSourcingPipelineStatus(selectedRequest.id, 'quotes_received');
                      setSelectedRequest(null);
                    }}
                    className="py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                  >
                    Devis Usine Reçu
                  </button>
                  <button
                    onClick={() => {
                      updateSourcingPipelineStatus(selectedRequest.id, 'sample_ordered');
                      setSelectedRequest(null);
                    }}
                    className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                  >
                    Échantillon Commandé
                  </button>
                  <button
                    onClick={() => {
                      updateSourcingPipelineStatus(selectedRequest.id, 'validated');
                      setSelectedRequest(null);
                    }}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    Conforme & Validé
                  </button>
                </div>

                <div className="pt-2 border-t border-blue-900/50">
                  <button
                    onClick={() => {
                      const qty = selectedRequest.targetQuantity || 50;
                      const unitProd = 12500;
                      const unitFreight = 3500;
                      const unitCustoms = 1200;
                      const prodTot = qty * unitProd;
                      const logTot = qty * unitFreight;
                      const custTot = qty * unitCustoms;
                      const grandTot = prodTot + logTot + custTot;
                      const depAmt = Math.round(grandTot * 0.4);

                      const q = addQuote({
                        clientName: selectedRequest.clientName,
                        companyName: 'Importateur Mandataire',
                        phone: selectedRequest.clientPhone,
                        email: 'sourcing@client.sn',
                        productName: selectedRequest.productName,
                        quantity: qty,
                        unitProductPriceXOF: unitProd,
                        totalProductPriceXOF: prodTot,
                        productPriceStatus: 'confirmed',
                        estimatedLogisticsXOF: logTot,
                        logisticsStatus: 'estimated',
                        estimatedCustomsXOF: custTot,
                        customsStatus: 'estimated',
                        additionalFeesXOF: 0,
                        totalEstimatedXOF: grandTot,
                        depositRequiredPercent: 40,
                        depositAmountXOF: depAmt,
                        balanceDueXOF: grandTot - depAmt,
                        amountPaidXOF: 0,
                        paymentStatus: 'pending',
                        leadTimeDays: '15-20 jours',
                        conditions: [
                          'Tarif usine certifié vérifié sur site (Guangzhou/Yiwu)',
                          'Assurance maritime et inspection avant conteneurisation',
                          'Dédouanement Gaindé Dakar inclus'
                        ],
                        validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
                        status: 'sent',
                        transportMode: 'sea',
                        notes: `Mission sourcing ${selectedRequest.code}. Référence usine : ${selectedRequest.referenceUrl || 'Audit usine direct'}`
                      });

                      updateSourcingPipelineStatus(selectedRequest.id, 'quotes_received', `Devis ${q.code} généré avec transparence totale.`);
                      setSelectedRequest(null);
                      openDocumentModal('quote', { quote: q });
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold flex items-center justify-center gap-2 shadow-md text-xs"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Générer Devis Séparé (Prix Usine + Fret Séparé)</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-blue-900/40">
              <button
                onClick={() => setSelectedRequest(null)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0a1945] rounded-3xl border border-blue-900/50 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
              <h3 className="text-base font-black text-white">Nouvelle Mission Sourcing</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Produit Recherché *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Panneaux solaires portables 100W"
                  value={formData.productName}
                  onChange={e => setFormData({ ...formData, productName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Quantité Cible</label>
                  <input
                    type="number"
                    value={formData.targetQuantity}
                    onChange={e => setFormData({ ...formData, targetQuantity: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Budget ($ USD)</label>
                  <input
                    type="number"
                    value={formData.targetBudgetUSD}
                    onChange={e => setFormData({ ...formData, targetBudgetUSD: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-emerald-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Nom du Client</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={formData.clientPhone}
                    onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Lien fiche 1688 / Taobao (Optionnel)</label>
                <input
                  type="text"
                  placeholder="https://detail.1688.com/..."
                  value={formData.referenceUrl}
                  onChange={e => setFormData({ ...formData, referenceUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div className="pt-3 border-t border-blue-900/40 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold shadow-md"
                >
                  Créer la mission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
