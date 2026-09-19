import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { b2bService, B2BRequestData } from '../../services/b2bService';
import {
  Briefcase,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  FileText,
  DollarSign,
  User,
  Send,
  X,
  Building,
  ChevronRight,
  Eye,
  FileCheck,
  Factory,
  Truck,
  AlertTriangle,
  History,
  ShieldCheck,
  Plus
} from 'lucide-react';

export const AdminB2BPage: React.FC = () => {
  const { showToast, openDocumentModal, currentUser } = useApp();
  const [requests, setRequests] = useState<B2BRequestData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReq, setSelectedReq] = useState<B2BRequestData | null>(null);
  const [selectedReqDetails, setSelectedReqDetails] = useState<any | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'suppliers' | 'quote' | 'production' | 'audit'>('overview');

  // Form states for modal actions
  const [qualifyPriority, setQualifyPriority] = useState('standard');
  const [qualifyNotes, setQualifyNotes] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Supplier form
  const [supSupplierId, setSupSupplierId] = useState('');
  const [supUrl, setSupUrl] = useState('');
  const [supInitialCny, setSupInitialCny] = useState('');
  const [supNegotiatedCny, setSupNegotiatedCny] = useState('');
  const [supMoq, setSupMoq] = useState('100');
  const [supLeadTime, setSupLeadTime] = useState('15 jours');
  const [supNotes, setSupNotes] = useState('');

  // Quote form
  const [quoteItemDesc, setQuoteItemDesc] = useState('');
  const [quoteItemQty, setQuoteItemQty] = useState(50);
  const [quoteItemUnitPrice, setQuoteItemUnitPrice] = useState(15000);
  const [quoteShipping, setQuoteShipping] = useState(250000);
  const [quoteCustoms, setQuoteCustoms] = useState(150000);
  const [quoteDepositPercent, setQuoteDepositPercent] = useState(50);

  // Production form
  const [prodExpectedDate, setProdExpectedDate] = useState('');
  const [prodNotes, setProdNotes] = useState('');
  const [prodStage, setProdStage] = useState('in_production');

  // Shipment form
  const [shipCarrierId, setShipCarrierId] = useState('COSCO Shipping Lines');
  const [shipTransportMode, setShipTransportMode] = useState('sea');

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const res = await b2bService.getRequests();
      if (res.success) {
        setRequests(res.requests);
      }
    } catch (err) {
      console.error('Erreur chargement demandes B2B:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const loadDetails = async (reqId: string) => {
    try {
      const res = await b2bService.getRequestDetails(reqId);
      if (res.success) {
        setSelectedReqDetails(res);
      }
    } catch (err) {
      console.error('Erreur chargement détails B2B:', err);
    }
  };

  const handleSelectReq = (req: B2BRequestData) => {
    setSelectedReq(req);
    setSelectedReqDetails(null);
    setActiveDrawerTab('overview');
    if (req.id) {
      loadDetails(req.id);
    }
  };

  const handleQualify = async () => {
    if (!selectedReq?.id) return;
    setIsSubmittingAction(true);
    try {
      const res = await b2bService.qualifyRequest(selectedReq.id, {
        priority: qualifyPriority,
        notes: qualifyNotes
      });
      if (res.success) {
        showToast('success', 'Dossier Qualifié', 'La demande B2B a été qualifiée avec succès.');
        await loadRequests();
        await loadDetails(selectedReq.id);
      } else {
        showToast('error', 'Erreur', res.errorMessage || 'Échec de qualification');
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleAddSupplier = async () => {
    if (!selectedReq?.id || !supSupplierId) {
      alert('Veuillez renseigner le nom ou l\'identifiant du fournisseur');
      return;
    }
    setIsSubmittingAction(true);
    try {
      const res = await b2bService.addSupplier(selectedReq.id, {
        supplierId: supSupplierId,
        productUrl: supUrl || undefined,
        initialPriceCny: supInitialCny ? Number(supInitialCny) : undefined,
        negotiatedPriceCny: supNegotiatedCny ? Number(supNegotiatedCny) : undefined,
        moq: Number(supMoq) || 1,
        leadTimeDays: supLeadTime,
        internalNotes: supNotes || undefined
      });
      if (res.success) {
        showToast('success', 'Fournisseur Enregistré', 'Fournisseur et prix négociés ajoutés au comparatif.');
        setSupSupplierId('');
        setSupUrl('');
        setSupInitialCny('');
        setSupNegotiatedCny('');
        setSupNotes('');
        await loadDetails(selectedReq.id);
      } else {
        showToast('error', 'Erreur', res.errorMessage || 'Échec enregistrement fournisseur');
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCreateQuote = async () => {
    if (!selectedReq?.id) return;
    setIsSubmittingAction(true);
    try {
      const res = await b2bService.createQuote(selectedReq.id, {
        items: [
          {
            description: quoteItemDesc || selectedReq.product_name || 'Commande B2B',
            quantity: Number(quoteItemQty) || selectedReq.quantity || 1,
            unit_price_xof: Number(quoteItemUnitPrice) || 15000
          }
        ],
        shippingXof: Number(quoteShipping) || 0,
        customsXof: Number(quoteCustoms) || 0,
        depositRequiredPercent: Number(quoteDepositPercent) || 50,
        transportMode: selectedReq.transport_preference || 'sea'
      });

      if (res.success) {
        showToast('success', 'Devis Formel Créé', `Devis ${res.quote_number || ''} généré avec succès.`);
        await loadRequests();
        await loadDetails(selectedReq.id);
      } else {
        showToast('error', 'Erreur', res.errorMessage || 'Échec création devis');
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleSendQuote = async (quoteId: string) => {
    setIsSubmittingAction(true);
    try {
      const res = await b2bService.sendQuote(quoteId);
      if (res.success) {
        showToast('success', 'Devis Envoyé', 'Le devis officiel a été transmis au client.');
        await loadRequests();
        if (selectedReq?.id) await loadDetails(selectedReq.id);
      } else {
        showToast('error', 'Erreur', res.errorMessage || 'Échec envoi devis');
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleStartProduction = async () => {
    if (!selectedReq?.id) return;
    setIsSubmittingAction(true);
    try {
      const res = await b2bService.startProduction(selectedReq.id, {
        expectedCompletionDate: prodExpectedDate || undefined,
        notes: prodNotes || undefined
      });
      if (res.success) {
        showToast('success', 'Production Lancée', 'La commande usine est officiellement passée en production.');
        await loadRequests();
        await loadDetails(selectedReq.id);
      } else {
        showToast('error', 'Erreur', res.errorMessage || 'Échec démarrage production');
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleUpdateProductionStage = async () => {
    if (!selectedReq?.id) return;
    setIsSubmittingAction(true);
    try {
      const res = await b2bService.updateProductionStage(selectedReq.id, prodStage, prodNotes || undefined);
      if (res.success) {
        showToast('success', 'Jalon Actualisé', `Étape de fabrication mise à jour : ${prodStage}.`);
        await loadRequests();
        await loadDetails(selectedReq.id);
      } else {
        showToast('error', 'Erreur', res.errorMessage || 'Échec mise à jour jalon');
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleTransitionToShipment = async () => {
    if (!selectedReq?.id) return;
    setIsSubmittingAction(true);
    try {
      const res = await b2bService.transitionToShipment(selectedReq.id, {
        carrierId: shipCarrierId,
        transportMode: shipTransportMode
      });
      if (res.success) {
        showToast('success', 'Expédition Créée', `Bordereau logistique ${res.shipment_code || ''} généré dans le module Étape 8.`);
        await loadRequests();
        await loadDetails(selectedReq.id);
      } else {
        showToast('error', 'Erreur', res.errorMessage || 'Échec expédition');
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedReq?.id) return;
    setIsSubmittingAction(true);
    try {
      const res = await b2bService.updateStatus(selectedReq.id, newStatus, 'Transition manuelle administrateur');
      if (res.success) {
        showToast('success', 'Statut Mis à Jour', `Statut basculé en : ${newStatus}`);
        await loadRequests();
        await loadDetails(selectedReq.id);
      } else {
        showToast('error', 'Erreur', res.errorMessage || 'Échec transition');
      }
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const filtered = requests.filter(req => {
    const q = (search || '').toLowerCase();
    const matchSearch =
      (req.code || '').toLowerCase().includes(q) ||
      (req.product_name || '').toLowerCase().includes(q) ||
      (req.contact_name || '').toLowerCase().includes(q) ||
      (req.company_name || '').toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'new':
        return <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Nouveau</span>;
      case 'qualified':
        return <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Qualifié</span>;
      case 'sourcing':
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Sourcing</span>;
      case 'negotiation':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Négociation</span>;
      case 'quote_ready':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Devis Prêt</span>;
      case 'quote_sent':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Devis Envoyé</span>;
      case 'accepted':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Accepté</span>;
      case 'deposit_paid':
        return <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Acompte Réglé</span>;
      case 'production':
        return <span className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">En Production</span>;
      case 'shipping':
        return <span className="bg-blue-600/30 text-blue-200 border border-blue-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">Expédié / Mer</span>;
      case 'completed':
        return <span className="bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">Terminé</span>;
      case 'rejected':
      case 'cancelled':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Annulé</span>;
      default:
        return <span className="bg-slate-500/20 text-slate-300 border border-slate-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">{status || 'Inconnu'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a1945] p-5 rounded-3xl border border-blue-900/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">Module B2B & Grands Comptes</h1>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {requests.length} dossiers
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Qualification, sourcing multi-fournisseurs, devis versionnés avec acompte 50%, pilotage de production usine et logistique Port de Dakar.
          </p>
        </div>

        <button
          onClick={loadRequests}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 flex items-center gap-2"
        >
          <Clock className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-[#0a1945] p-3 rounded-2xl border border-blue-900/40">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher code, entreprise, contact..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FF4500]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'new', label: 'Nouvelles' },
            { id: 'qualified', label: 'Qualifiées' },
            { id: 'quote_sent', label: 'Devis Envoyé' },
            { id: 'accepted', label: 'Acceptées' },
            { id: 'deposit_paid', label: 'Acompte Réglé' },
            { id: 'production', label: 'Production' },
            { id: 'shipping', label: 'Expédition' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-[#FF4500] text-white shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of B2B Requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(req => (
          <div
            key={req.id}
            onClick={() => handleSelectReq(req)}
            className="p-5 rounded-3xl bg-[#0a1945] border border-blue-900/40 hover:border-blue-500/50 transition-all shadow-lg space-y-4 flex flex-col justify-between cursor-pointer group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-blue-300 text-xs bg-blue-950/70 px-2 py-0.5 rounded border border-blue-800">
                    {req.code}
                  </span>
                  <h3 className="font-bold text-sm text-white mt-1.5 group-hover:text-blue-300 transition-colors line-clamp-1">
                    {req.product_name || 'Demande B2B'}
                  </h3>
                </div>
                {getStatusBadge(req.status)}
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 p-3 rounded-2xl bg-white/5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Entreprise :</span>
                  <strong className="text-white truncate max-w-[160px]">{req.company_name || req.company?.legal_name || 'Particulier Pro'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contact :</span>
                  <span className="text-slate-200">{req.contact_name || req.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantité :</span>
                  <strong className="text-white font-mono">{req.quantity} unités</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Budget Cible :</span>
                  <strong className="text-emerald-300 font-mono">{(req.budget_xof || 0).toLocaleString('fr-FR')} F</strong>
                </div>
              </div>

              {req.specifications && (
                <p className="text-[11px] text-slate-300 line-clamp-2 italic">
                  &ldquo;{req.specifications}&rdquo;
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-blue-900/40 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400 font-mono">{req.created_at ? new Date(req.created_at).toLocaleDateString('fr-FR') : ''}</span>
              <span className="text-blue-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                <span>Gérer le dossier</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Drawer */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end">
          <div className="w-full max-w-2xl bg-[#0a1945] h-full shadow-2xl border-l border-blue-900/50 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                      {selectedReq.code}
                    </span>
                    {getStatusBadge(selectedReq.status)}
                  </div>
                  <h2 className="text-lg font-black text-white">{selectedReq.product_name || 'Demande B2B'}</h2>
                </div>
                <button
                  onClick={() => setSelectedReq(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs in Drawer */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-blue-900/40 custom-scrollbar">
                {[
                  { id: 'overview', label: 'Vue d\'ensemble' },
                  { id: 'suppliers', label: 'Fournisseurs' },
                  { id: 'quote', label: 'Devis Formel' },
                  { id: 'production', label: 'Production' },
                  { id: 'audit', label: 'Historique' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveDrawerTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      activeDrawerTab === t.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: OVERVIEW & QUALIFICATION */}
              {activeDrawerTab === 'overview' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-white/5 space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Entreprise :</span>
                      <strong className="text-white">{selectedReq.company_name || 'Non renseigné'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contact :</span>
                      <strong className="text-white">{selectedReq.contact_name} ({selectedReq.phone})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email :</span>
                      <span className="text-slate-300">{selectedReq.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Quantité Demandée :</span>
                      <strong className="text-white font-mono">{selectedReq.quantity} unités</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Budget Cible :</span>
                      <strong className="text-emerald-300 font-mono">{(selectedReq.budget_xof || 0).toLocaleString('fr-FR')} FCFA</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Transport Souhaité :</span>
                      <span className="text-white font-semibold">{selectedReq.transport_preference === 'sea' ? 'Maritime Conteneurisé' : 'Aérien'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Destination :</span>
                      <span className="text-white font-semibold">{selectedReq.destination || 'Dakar, Sénégal'}</span>
                    </div>
                  </div>

                  {selectedReq.specifications && (
                    <div className="p-4 rounded-2xl bg-white/5 space-y-1.5">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Cahier des charges</span>
                      <p className="text-slate-200 leading-relaxed whitespace-pre-line">{selectedReq.specifications}</p>
                    </div>
                  )}

                  {/* Qualification Form */}
                  <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      <span className="text-indigo-200 font-bold">Qualification du dossier B2B</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Priorité Affaire</label>
                        <select
                          value={qualifyPriority}
                          onChange={e => setQualifyPriority(e.target.value)}
                          className="w-full h-9 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                        >
                          <option value="standard">Standard</option>
                          <option value="urgent">Urgente</option>
                          <option value="critical">Critique (Grand Compte)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Statut Manuel</label>
                        <select
                          onChange={e => handleUpdateStatus(e.target.value)}
                          defaultValue={selectedReq.status}
                          className="w-full h-9 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                        >
                          <option value="new">Nouveau</option>
                          <option value="qualified">Qualifié</option>
                          <option value="sourcing">En Sourcing</option>
                          <option value="negotiation">Négociation Usine</option>
                          <option value="quote_ready">Devis Prêt</option>
                          <option value="deposit_paid">Acompte Réglé</option>
                          <option value="production">En Production</option>
                          <option value="completed">Clôturé</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Notes internes de qualification</label>
                      <textarea
                        rows={2}
                        value={qualifyNotes}
                        onChange={e => setQualifyNotes(e.target.value)}
                        placeholder="Analyse solvabilité client, volumétrie FCL, contraintes portuaires..."
                        className="w-full p-2.5 bg-white/10 rounded-xl text-xs text-white border border-white/10 resize-none"
                      />
                    </div>
                    <button
                      onClick={handleQualify}
                      disabled={isSubmittingAction}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valider la qualification</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: SUPPLIERS & NEGOTIATION */}
              {activeDrawerTab === 'suppliers' && (
                <div className="space-y-4 text-xs">
                  {/* List of current evaluated suppliers */}
                  {selectedReqDetails?.suppliers && selectedReqDetails.suppliers.length > 0 ? (
                    <div className="space-y-3">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Fournisseurs Évalués ({selectedReqDetails.suppliers.length})</span>
                      {selectedReqDetails.suppliers.map((s: any) => (
                        <div key={s.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                          <div className="flex justify-between items-center">
                            <strong className="text-white text-sm">{s.supplier?.name || s.supplier_id}</strong>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded">
                              MOQ: {s.moq} pcs
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                            <div>Prix Initial CNY: <span className="font-mono text-white">{s.initial_price_cny || 'N/A'} ¥</span></div>
                            <div>Prix Négocié CNY: <span className="font-mono text-emerald-300 font-bold">{s.negotiated_price_cny || 'N/A'} ¥</span></div>
                            <div>Délai Fab.: <span className="text-white">{s.lead_time_days || 'N/A'}</span></div>
                            <div>Incoterm: <span className="text-white">{s.incoterm || 'FOB'}</span></div>
                          </div>
                          {s.internal_notes && (
                            <p className="text-[11px] text-slate-400 italic bg-black/20 p-2 rounded-lg">
                              Note: {s.internal_notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/5 text-center text-slate-400">
                      Aucun fournisseur enregistré pour cette cotation.
                    </div>
                  )}

                  {/* Add supplier form */}
                  <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/50 space-y-3">
                    <span className="text-blue-300 font-bold block">Ajouter / Évaluer un Fournisseur</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Nom / ID Usine *</label>
                        <input
                          type="text"
                          value={supSupplierId}
                          onChange={e => setSupSupplierId(e.target.value)}
                          placeholder="ex: Foshan Machinery Ltd"
                          className="w-full h-8 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Lien Produit / 1688</label>
                        <input
                          type="url"
                          value={supUrl}
                          onChange={e => setSupUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full h-8 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Prix Initial (CNY)</label>
                        <input
                          type="number"
                          value={supInitialCny}
                          onChange={e => setSupInitialCny(e.target.value)}
                          placeholder="ex: 180"
                          className="w-full h-8 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Prix Négocié (CNY)</label>
                        <input
                          type="number"
                          value={supNegotiatedCny}
                          onChange={e => setSupNegotiatedCny(e.target.value)}
                          placeholder="ex: 155"
                          className="w-full h-8 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">MOQ (Pièces)</label>
                        <input
                          type="number"
                          value={supMoq}
                          onChange={e => setSupMoq(e.target.value)}
                          className="w-full h-8 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Délai Fabrication</label>
                        <input
                          type="text"
                          value={supLeadTime}
                          onChange={e => setSupLeadTime(e.target.value)}
                          placeholder="15-20 jours"
                          className="w-full h-8 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Notes de négociation (Confidentielles)</label>
                      <input
                        type="text"
                        value={supNotes}
                        onChange={e => setSupNotes(e.target.value)}
                        placeholder="Remise volume accordée, moule d'injection offert..."
                        className="w-full h-8 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                      />
                    </div>
                    <button
                      onClick={handleAddSupplier}
                      disabled={isSubmittingAction}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Enregistrer ce Fournisseur</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: FORMAL B2B QUOTE */}
              {activeDrawerTab === 'quote' && (
                <div className="space-y-4 text-xs">
                  {/* Existing Quotes */}
                  {selectedReqDetails?.quotes && selectedReqDetails.quotes.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Devis Émis ({selectedReqDetails.quotes.length})</span>
                      {selectedReqDetails.quotes.map((q: any) => (
                        <div key={q.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                          <div className="flex justify-between items-center">
                            <div>
                              <strong className="text-white font-mono text-sm">{q.quote_number}</strong>
                              <span className="text-[10px] text-slate-400 ml-2">v{q.version}</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {q.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-slate-300">
                            <div>Total Net: <strong className="text-white font-mono">{Number(q.total_xof).toLocaleString('fr-FR')} F</strong></div>
                            <div>Acompte (50%): <strong className="text-amber-300 font-mono">{Number(q.deposit_amount_xof).toLocaleString('fr-FR')} F</strong></div>
                            <div>Solde restant: <strong className="text-emerald-300 font-mono">{Number(q.balance_due_xof).toLocaleString('fr-FR')} F</strong></div>
                            <div>Validité: <span className="text-slate-300">{q.valid_until}</span></div>
                          </div>
                          {q.status === 'draft' && (
                            <button
                              onClick={() => handleSendQuote(q.id)}
                              disabled={isSubmittingAction}
                              className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center gap-1.5 shadow-md"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Transmettre ce devis au client</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Create New Quote Form */}
                  <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/50 space-y-3">
                    <span className="text-blue-300 font-bold block">Créer un Nouveau Devis Formel</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block mb-1">Désignation Ligne Produit</label>
                        <input
                          type="text"
                          value={quoteItemDesc}
                          onChange={e => setQuoteItemDesc(e.target.value)}
                          placeholder={selectedReq.product_name || 'Équipement industriel'}
                          className="w-full h-8 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Quantité (Unités)</label>
                        <input
                          type="number"
                          value={quoteItemQty}
                          onChange={e => setQuoteItemQty(Number(e.target.value))}
                          className="w-full h-8 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Prix Unitaire Vente (FCFA)</label>
                        <input
                          type="number"
                          value={quoteItemUnitPrice}
                          onChange={e => setQuoteItemUnitPrice(Number(e.target.value))}
                          className="w-full h-8 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Fret Maritime / Aérien (FCFA)</label>
                        <input
                          type="number"
                          value={quoteShipping}
                          onChange={e => setQuoteShipping(Number(e.target.value))}
                          className="w-full h-8 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Douane Gaindé DDP (FCFA)</label>
                        <input
                          type="number"
                          value={quoteCustoms}
                          onChange={e => setQuoteCustoms(Number(e.target.value))}
                          className="w-full h-8 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Acompte Exigé (%)</label>
                        <input
                          type="number"
                          value={quoteDepositPercent}
                          onChange={e => setQuoteDepositPercent(Number(e.target.value))}
                          className="w-full h-8 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleCreateQuote}
                      disabled={isSubmittingAction}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-md"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Calculer & Émettre Devis</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: PRODUCTION & EXPÉDITION */}
              {activeDrawerTab === 'production' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-white/5 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Statut Commande :</span>
                      <strong className="text-white">{selectedReq.status}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Jalon de Production :</span>
                      <strong className="text-amber-300 font-mono">{selectedReq.production_stage || 'Non démarrée'}</strong>
                    </div>
                    {selectedReq.expected_completion_date && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Date Fin Prévue :</span>
                        <strong className="text-white">{selectedReq.expected_completion_date}</strong>
                      </div>
                    )}
                  </div>

                  {/* Start Production */}
                  <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <Factory className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-200 font-bold">Lancement de la Fabrication</span>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Date prévisionnelle de fin d'assemblage</label>
                      <input
                        type="date"
                        value={prodExpectedDate}
                        onChange={e => setProdExpectedDate(e.target.value)}
                        className="w-full h-8 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Consignes usine</label>
                      <input
                        type="text"
                        value={prodNotes}
                        onChange={e => setProdNotes(e.target.value)}
                        placeholder="Contrôle qualité spécifique, marquage carton..."
                        className="w-full h-8 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                      />
                    </div>
                    <button
                      onClick={handleStartProduction}
                      disabled={isSubmittingAction}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center justify-center gap-2 shadow-md"
                    >
                      <Factory className="w-4 h-4" />
                      <span>Démarrer la Production</span>
                    </button>
                  </div>

                  {/* Advance Stage */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <span className="text-white font-bold block">Faire Avancer le Jalon de Production</span>
                    <select
                      value={prodStage}
                      onChange={e => setProdStage(e.target.value)}
                      className="w-full h-9 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                    >
                      <option value="sampling">Échantillonnage & Validation</option>
                      <option value="raw_materials">Approvisionnement Matières Premières</option>
                      <option value="in_production">Usinage & Assemblage</option>
                      <option value="qc_inspection">Contrôle Qualité & Test Vidéo</option>
                      <option value="factory_packing">Conditionnement & Palettisation</option>
                      <option value="ready_to_ship">Prêt à Expédier (Sortie Usine)</option>
                    </select>
                    <button
                      onClick={handleUpdateProductionStage}
                      disabled={isSubmittingAction}
                      className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Actualiser le Jalon</span>
                    </button>
                  </div>

                  {/* Transition to Shipment */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-500/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-300" />
                      <span className="text-white font-bold">Transfert Logistique Maritime (Étape 8)</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Générez l'expédition conteneurisée officielle avec code de tracking en temps réel vers le Port de Dakar.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Compagnie Maritime / Cargo</label>
                        <input
                          type="text"
                          value={shipCarrierId}
                          onChange={e => setShipCarrierId(e.target.value)}
                          className="w-full h-8 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Mode de Transport</label>
                        <select
                          value={shipTransportMode}
                          onChange={e => setShipTransportMode(e.target.value)}
                          className="w-full h-8 px-3 bg-white/10 rounded-xl text-xs text-white border border-white/10"
                        >
                          <option value="sea">Maritime (FCL/LCL)</option>
                          <option value="air">Aérien (Cargo express)</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleTransitionToShipment}
                      disabled={isSubmittingAction}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-md"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Créer l'Expédition Logistique</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: AUDIT LOG */}
              {activeDrawerTab === 'audit' && (
                <div className="space-y-3 text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Journal d'Audit Immuable</span>
                  {selectedReqDetails?.events && selectedReqDetails.events.length > 0 ? (
                    <div className="space-y-2">
                      {selectedReqDetails.events.map((ev: any) => (
                        <div key={ev.id} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-blue-300">{ev.event_type}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{new Date(ev.created_at).toLocaleString('fr-FR')}</span>
                          </div>
                          {ev.notes && <p className="text-slate-300 text-[11px]">{ev.notes}</p>}
                          {ev.from_status && ev.to_status && (
                            <div className="text-[10px] text-slate-400">
                              Transition : <span className="text-slate-200">{ev.from_status}</span> → <span className="text-emerald-300 font-semibold">{ev.to_status}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white/5 text-center text-slate-400">
                      Aucun événement consigné pour le moment.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-blue-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Gestionnaire : <strong>{currentUser.name || 'Admin'}</strong>
              </span>
              <button
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
