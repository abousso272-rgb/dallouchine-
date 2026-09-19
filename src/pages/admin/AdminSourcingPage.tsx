import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../services/supabase';
import { sourcingClient, SourcingRequestData } from '../../services/sourcingService';
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
  FileCheck,
  Building,
  Tag,
  FileText,
  AlertCircle,
  Truck
} from 'lucide-react';

export const AdminSourcingPage: React.FC = () => {
  const { showToast } = useApp();

  const [requests, setRequests] = useState<SourcingRequestData[]>([]);
  const [sourcersList, setSourcersList] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SourcingRequestData | null>(null);
  const [requestDetails, setRequestDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form State Creation
  const [formData, setFormData] = useState({
    title: '',
    category: 'Électronique & High-Tech',
    quantity: 100,
    budgetXof: 1000000,
    clientName: 'Diallo Import SARL',
    clientPhone: '+221 77 540 22 11',
    productUrl: '',
    destination: 'Dakar, Sénégal',
    description: 'Priorité contrôle conformité électrique et packaging francophone.'
  });

  // Form State Add Supplier
  const [supplierForm, setSupplierForm] = useState({
    supplierId: '',
    productUrl: '',
    initialPriceCny: '',
    negotiatedPriceCny: '',
    moq: '100',
    leadTimeDays: '15-20 jours',
    internalNotes: ''
  });

  // Form State Create Quote
  const [quoteForm, setQuoteForm] = useState({
    itemDescription: '',
    itemQuantity: 100,
    itemUnitPriceXof: 15000,
    shippingXof: 250000,
    customsXof: 120000,
    feesXof: 50000,
    depositPercent: 50,
    validDays: 15,
    transportMode: 'air',
    leadTimeDays: '15-20 jours',
    notes: 'Tarif officiel usine vérifié, transport aérien et douane Gaindé inclus.'
  });

  // Chargement des données réelles
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reqRes, sourcersDb, suppliersDb] = await Promise.all([
        sourcingClient.getRequests(),
        supabase.from('sourcers').select('*'),
        supabase.from('suppliers').select('*')
      ]);

      if (reqRes.success) setRequests(reqRes.requests);
      if (sourcersDb.data) setSourcersList(sourcersDb.data);
      if (suppliersDb.data) setSuppliersList(suppliersDb.data);
    } catch (e) {
      console.error('Erreur chargement sourcing:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDetails = async (req: SourcingRequestData) => {
    setSelectedRequest(req);
    setLoadingDetails(true);
    try {
      const details = await sourcingClient.getRequestDetails(req.id!);
      if (details.success) {
        setRequestDetails(details);
        setQuoteForm(prev => ({
          ...prev,
          itemDescription: req.title,
          itemQuantity: req.quantity
        }));
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const res = await sourcingClient.createRequest({
      title: formData.title,
      category: formData.category,
      quantity: Number(formData.quantity),
      budgetXof: Number(formData.budgetXof),
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      productUrl: formData.productUrl || undefined,
      destination: formData.destination,
      description: formData.description
    });

    if (res.success) {
      showToast('success', 'Demande enregistrée', `Dossier ${res.request?.code || ''} créé.`);
      setIsModalOpen(false);
      loadData();
    } else {
      showToast('error', 'Erreur', res.errorMessage || 'Impossible de créer la demande.');
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedRequest?.id) return;
    const res = await sourcingClient.updateStatus(selectedRequest.id, newStatus);
    if (res.success) {
      showToast('success', 'Statut mis à jour', `Nouveau statut : ${newStatus}`);
      openDetails(selectedRequest);
      loadData();
    } else {
      showToast('error', 'Erreur transition', res.errorMessage || 'Transition illégale.');
    }
  };

  const handleAssignSourcer = async (sourcerId: string) => {
    if (!selectedRequest?.id) return;
    const res = await sourcingClient.assignSourcer(selectedRequest.id, sourcerId);
    if (res.success) {
      showToast('success', 'Sourceur assigné', `Dossier confié à l'agent.`);
      openDetails(selectedRequest);
      loadData();
    } else {
      showToast('error', 'Erreur', res.errorMessage || 'Assignation impossible.');
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest?.id || !supplierForm.supplierId) return;

    const res = await sourcingClient.addSupplier(selectedRequest.id, {
      supplierId: supplierForm.supplierId,
      productUrl: supplierForm.productUrl || undefined,
      initialPriceCny: supplierForm.initialPriceCny ? Number(supplierForm.initialPriceCny) : undefined,
      negotiatedPriceCny: supplierForm.negotiatedPriceCny ? Number(supplierForm.negotiatedPriceCny) : undefined,
      moq: Number(supplierForm.moq) || 1,
      leadTimeDays: supplierForm.leadTimeDays,
      internalNotes: supplierForm.internalNotes
    });

    if (res.success) {
      showToast('success', 'Fournisseur ajouté', 'Option usine et négociation enregistrées.');
      setSupplierForm({
        supplierId: '',
        productUrl: '',
        initialPriceCny: '',
        negotiatedPriceCny: '',
        moq: '100',
        leadTimeDays: '15-20 jours',
        internalNotes: ''
      });
      openDetails(selectedRequest);
      loadData();
    } else {
      showToast('error', 'Erreur', res.errorMessage || 'Impossible d\'ajouter le fournisseur.');
    }
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest?.id) return;

    const res = await sourcingClient.createQuote(selectedRequest.id, {
      items: [
        {
          description: quoteForm.itemDescription || selectedRequest.title,
          quantity: Number(quoteForm.itemQuantity),
          unit_price_xof: Number(quoteForm.itemUnitPriceXof)
        }
      ],
      shippingXof: Number(quoteForm.shippingXof),
      customsXof: Number(quoteForm.customsXof),
      feesXof: Number(quoteForm.feesXof),
      depositRequiredPercent: Number(quoteForm.depositPercent),
      validDays: Number(quoteForm.validDays),
      transportMode: quoteForm.transportMode,
      leadTimeDays: quoteForm.leadTimeDays,
      notes: quoteForm.notes
    });

    if (res.success) {
      showToast('success', 'Devis créé avec succès', `Devis ${res.quote?.quote_number || ''} version ${res.quote?.version || 1}.`);
      openDetails(selectedRequest);
      loadData();
    } else {
      showToast('error', 'Erreur création devis', res.errorMessage || 'Impossible de créer le devis.');
    }
  };

  const handleSendQuote = async (quoteId: string) => {
    const res = await sourcingClient.sendQuote(quoteId);
    if (res.success) {
      showToast('success', 'Devis envoyé au client', 'Notification transmise sur l\'espace client.');
      if (selectedRequest) openDetails(selectedRequest);
      loadData();
    } else {
      showToast('error', 'Erreur', res.errorMessage || 'Impossible d\'envoyer le devis.');
    }
  };

  const filtered = requests.filter(s => {
    const searchLower = (search || '').toLowerCase();
    const matchSearch =
      (s?.code || '').toLowerCase().includes(searchLower) ||
      (s?.title || '').toLowerCase().includes(searchLower) ||
      (s?.clientName || '').toLowerCase().includes(searchLower);

    if (!matchSearch) return false;
    if (activeTab === 'all') return true;
    return s.status === activeTab;
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'new':
        return <span className="bg-slate-500/20 text-slate-300 border border-slate-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Nouveau</span>;
      case 'researching':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Recherche</span>;
      case 'supplier_found':
        return <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Fournisseur Trouvé</span>;
      case 'negotiating':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Négociation</span>;
      case 'quote_ready':
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Devis Prêt</span>;
      case 'quote_sent':
        return <span className="bg-cyan-500/30 text-cyan-200 border border-cyan-400 text-[10px] px-2 py-0.5 rounded-full font-bold">Devis Envoyé</span>;
      case 'accepted':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Devis Accepté</span>;
      case 'rejected':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Devis Refusé</span>;
      case 'completed':
        return <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">Clôturé</span>;
      case 'cancelled':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Annulé</span>;
      default:
        return <span className="bg-slate-500/20 text-slate-300 text-[10px] px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a1945] p-6 rounded-3xl border border-blue-900/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Sourcing Chine Direct & Devis</h1>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                Hub Négociation Guangzhou & Yiwu
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pilotage des recherches usines, comparateur multi-fournisseurs, négociation confidentielle et devis certifiés.
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
            { id: 'new', label: 'Nouveau' },
            { id: 'researching', label: 'En Recherche' },
            { id: 'supplier_found', label: 'Usine Trouvée' },
            { id: 'negotiating', label: 'Négociation' },
            { id: 'quote_ready', label: 'Devis Prêt' },
            { id: 'quote_sent', label: 'Devis Envoyé' },
            { id: 'accepted', label: 'Acceptés' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Clock className="w-5 h-5 animate-spin text-cyan-400" />
          <span>Chargement des dossiers de sourcing...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-[#0a1945] rounded-3xl border border-blue-900/40">
          Aucun dossier de sourcing ne correspond à vos filtres.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(req => {
            const sourcer = sourcersList.find(s => s.id === req.assigned_sourcer_id);

            return (
              <div
                key={req.id}
                onClick={() => openDetails(req)}
                className="p-5 rounded-3xl bg-[#0a1945] border border-blue-900/40 hover:border-blue-500/50 transition-all shadow-lg space-y-3.5 flex flex-col justify-between cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-blue-300 text-xs bg-blue-950/70 px-2 py-0.5 rounded border border-blue-800">
                        {req.code}
                      </span>
                      <h3 className="font-bold text-sm text-white mt-1.5 group-hover:text-blue-300 transition-colors line-clamp-1">
                        {req.title}
                      </h3>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>

                  <div className="space-y-1 text-xs text-slate-300 p-3 rounded-2xl bg-white/5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Client :</span>
                      <strong className="text-white">{req.clientName || 'Particulier'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Quantité :</span>
                      <strong className="text-white font-mono">{req.quantity} pcs</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sourceur :</span>
                      <strong className="text-blue-300">{sourcer ? sourcer.name : 'Non assigné'}</strong>
                    </div>
                    {req.budgetXof && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Budget max :</span>
                        <strong className="text-emerald-300 font-mono">{(req.budgetXof).toLocaleString('fr-FR')} FCFA</strong>
                      </div>
                    )}
                  </div>

                  {req.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                      &ldquo;{req.description}&rdquo;
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-blue-900/40 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {req.created_at ? new Date(req.created_at).toLocaleDateString('fr-FR') : ''}
                  </span>
                  <span className="text-blue-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>Gérer le dossier</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. DETAIL & MANAGEMENT DRAWER */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-[#0a1945] h-full shadow-2xl border-l border-blue-900/50 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                    {selectedRequest.code}
                  </span>
                  <h2 className="text-base font-black text-white line-clamp-1">{selectedRequest.title}</h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setRequestDetails(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingDetails ? (
                <div className="p-8 text-center text-slate-400 text-xs">Chargement des détails...</div>
              ) : (
                <>
                  {/* Fiche d'identification client & produit */}
                  <div className="p-4 rounded-2xl bg-white/5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Client Mandataire :</span>
                      <strong className="text-white">{selectedRequest.clientName} ({selectedRequest.clientPhone})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Quantité Cible :</span>
                      <strong className="text-white font-mono">{selectedRequest.quantity} unités</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Destination :</span>
                      <strong className="text-white">{selectedRequest.destination}</strong>
                    </div>
                    {selectedRequest.productUrl && (
                      <a
                        href={selectedRequest.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1 pt-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="truncate">Ouvrir le lien source (1688 / Taobao / Fournisseur)</span>
                      </a>
                    )}
                  </div>

                  {/* Assignation Sourceur */}
                  <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/40 space-y-2 text-xs">
                    <span className="text-blue-300 font-bold block">Agent en Chine (Guangzhou / Yiwu) :</span>
                    <div className="flex gap-2 items-center">
                      <select
                        value={requestDetails?.request?.assigned_sourcer_id || ''}
                        onChange={e => handleAssignSourcer(e.target.value)}
                        className="flex-1 p-2 rounded-xl bg-white/10 border border-white/10 text-white text-xs"
                      >
                        <option value="">Sélectionner un sourceur...</option>
                        {sourcersList.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.location_city})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Machine d'état - Progression du Statut */}
                  <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/40 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-300 font-bold">Statut Actuel :</span>
                      {getStatusBadge(requestDetails?.request?.status)}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                      <button
                        onClick={() => handleUpdateStatus('researching')}
                        className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px]"
                      >
                        Recherche Usine
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('supplier_found')}
                        className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px]"
                      >
                        Usine Trouvée
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('negotiating')}
                        className="p-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px]"
                      >
                        En Négociation
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('quote_ready')}
                        className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px]"
                      >
                        Devis Prêt
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('completed')}
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                      >
                        Clôturer
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('cancelled')}
                        className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px]"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>

                  {/* Comparateur Multi-Fournisseurs (CONFIDENTIEL SOURCER/ADMIN) */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-cyan-400" />
                        <span>Fournisseurs comparés (Confidentiel Interne)</span>
                      </span>
                      <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded">
                        Zéro fuite client
                      </span>
                    </div>

                    {requestDetails?.suppliers?.length > 0 ? (
                      <div className="space-y-2">
                        {requestDetails.suppliers.map((sup: any) => (
                          <div key={sup.id} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                            <div className="flex justify-between text-white font-bold">
                              <span>{sup.supplier?.name}</span>
                              <span className="text-cyan-300">{sup.supplier?.city} ({sup.supplier?.platform})</span>
                            </div>
                            <div className="grid grid-cols-2 text-[11px] text-slate-300">
                              <span>Prix initial : {sup.initial_price_cny ? `${sup.initial_price_cny} ¥` : 'Non renseigné'}</span>
                              <span className="text-emerald-300 font-bold">Négocié : {sup.negotiated_price_cny ? `${sup.negotiated_price_cny} ¥` : 'En cours'}</span>
                              <span>MOQ : {sup.moq} pcs</span>
                              <span>Délai : {sup.lead_time_days}</span>
                            </div>
                            {sup.internal_notes && (
                              <p className="text-[10px] text-slate-400 italic">Notes: {sup.internal_notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-[11px]">Aucun fournisseur encore associé à cette recherche.</p>
                    )}

                    {/* Formulaire ajout fournisseur */}
                    <form onSubmit={handleAddSupplier} className="pt-2 border-t border-white/5 space-y-2">
                      <span className="text-[11px] text-cyan-300 font-bold block">Associer une nouvelle usine :</span>
                      <select
                        required
                        value={supplierForm.supplierId}
                        onChange={e => setSupplierForm({ ...supplierForm, supplierId: e.target.value })}
                        className="w-full p-2 rounded-xl bg-white/10 border border-white/10 text-white text-xs"
                      >
                        <option value="">Sélectionner une usine partenaire...</option>
                        {suppliersList.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.city}, {s.platform})
                          </option>
                        ))}
                      </select>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Prix brut initial (¥)"
                          value={supplierForm.initialPriceCny}
                          onChange={e => setSupplierForm({ ...supplierForm, initialPriceCny: e.target.value })}
                          className="p-2 rounded-xl bg-white/10 border border-white/10 text-white text-xs"
                        />
                        <input
                          type="number"
                          placeholder="Prix négocié (¥)"
                          value={supplierForm.negotiatedPriceCny}
                          onChange={e => setSupplierForm({ ...supplierForm, negotiatedPriceCny: e.target.value })}
                          className="p-2 rounded-xl bg-white/10 border border-white/10 text-emerald-300 text-xs font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="MOQ usine"
                          value={supplierForm.moq}
                          onChange={e => setSupplierForm({ ...supplierForm, moq: e.target.value })}
                          className="p-2 rounded-xl bg-white/10 border border-white/10 text-white text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Délai usine (ex: 15j)"
                          value={supplierForm.leadTimeDays}
                          onChange={e => setSupplierForm({ ...supplierForm, leadTimeDays: e.target.value })}
                          className="p-2 rounded-xl bg-white/10 border border-white/10 text-white text-xs"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Notes internes confidentielles..."
                        value={supplierForm.internalNotes}
                        onChange={e => setSupplierForm({ ...supplierForm, internalNotes: e.target.value })}
                        className="w-full p-2 rounded-xl bg-white/10 border border-white/10 text-white text-xs"
                      />

                      <button
                        type="submit"
                        className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                      >
                        Enregistrer l'option usine
                      </button>
                    </form>
                  </div>

                  {/* Générateur & Historique des Devis (Recalcul Serveur) */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3 text-xs">
                    <span className="text-white font-bold flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#FF4500]" />
                      <span>Devis Commerciaux (Calculs Serveur)</span>
                    </span>

                    {requestDetails?.quotes?.length > 0 && (
                      <div className="space-y-2">
                        {requestDetails.quotes.map((q: any) => (
                          <div key={q.id} className="p-3 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-white font-bold">{q.quote_number}</span>
                                <span className="text-[10px] text-cyan-300">v{q.version}</span>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                  q.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-300' :
                                  q.status === 'sent' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-500/20 text-slate-300'
                                }`}>
                                  {q.status}
                                </span>
                              </div>
                              <p className="text-xs text-emerald-300 font-mono font-bold mt-1">
                                {(q.total_xof || 0).toLocaleString('fr-FR')} FCFA (Acompte : {(q.deposit_amount_xof || 0).toLocaleString('fr-FR')} F)
                              </p>
                            </div>

                            {q.status === 'draft' && (
                              <button
                                onClick={() => handleSendQuote(q.id)}
                                className="px-3 py-1.5 rounded-lg bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                              >
                                <Send className="w-3 h-3" />
                                <span>Émettre au client</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulaire nouveau devis */}
                    <form onSubmit={handleCreateQuote} className="pt-2 border-t border-white/5 space-y-2.5">
                      <span className="text-[11px] text-[#FF4500] font-bold block">Générer une proposition de devis :</span>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 block mb-1">Prix unitaire produit (XOF)</label>
                          <input
                            type="number"
                            required
                            value={quoteForm.itemUnitPriceXof}
                            onChange={e => setQuoteForm({ ...quoteForm, itemUnitPriceXof: Number(e.target.value) })}
                            className="w-full p-2 rounded-xl bg-white/10 border border-white/10 text-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Quantité chiffrée</label>
                          <input
                            type="number"
                            required
                            value={quoteForm.itemQuantity}
                            onChange={e => setQuoteForm({ ...quoteForm, itemQuantity: Number(e.target.value) })}
                            className="w-full p-2 rounded-xl bg-white/10 border border-white/10 text-white font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-slate-400 block mb-1">Fret estimé (XOF)</label>
                          <input
                            type="number"
                            value={quoteForm.shippingXof}
                            onChange={e => setQuoteForm({ ...quoteForm, shippingXof: Number(e.target.value) })}
                            className="w-full p-2 rounded-xl bg-white/10 border border-white/10 text-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Douane Gaindé (XOF)</label>
                          <input
                            type="number"
                            value={quoteForm.customsXof}
                            onChange={e => setQuoteForm({ ...quoteForm, customsXof: Number(e.target.value) })}
                            className="w-full p-2 rounded-xl bg-white/10 border border-white/10 text-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Frais plateforme (XOF)</label>
                          <input
                            type="number"
                            value={quoteForm.feesXof}
                            onChange={e => setQuoteForm({ ...quoteForm, feesXof: Number(e.target.value) })}
                            className="w-full p-2 rounded-xl bg-white/10 border border-white/10 text-white font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 block mb-1">Acompte exigé (%)</label>
                          <input
                            type="number"
                            value={quoteForm.depositPercent}
                            onChange={e => setQuoteForm({ ...quoteForm, depositPercent: Number(e.target.value) })}
                            className="w-full p-2 rounded-xl bg-white/10 border border-white/10 text-white font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Mode de transport</label>
                          <select
                            value={quoteForm.transportMode}
                            onChange={e => setQuoteForm({ ...quoteForm, transportMode: e.target.value })}
                            className="w-full p-2 rounded-xl bg-white/10 border border-white/10 text-white text-xs"
                          >
                            <option value="air">Aérien (Air)</option>
                            <option value="sea">Maritime (Sea)</option>
                            <option value="express">Express</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs shadow-md mt-1"
                      >
                        Calculer et générer le devis officiel
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL CREATION DEMANDE ADMIN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0a1945] rounded-3xl shadow-2xl border border-blue-900/50 p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
              <h2 className="text-base font-black text-white">Nouvelle mission de sourcing</h2>
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
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Quantité Cible</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Budget Max (FCFA)</label>
                  <input
                    type="number"
                    value={formData.budgetXof}
                    onChange={e => setFormData({ ...formData, budgetXof: Number(e.target.value) })}
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
                  <label className="text-slate-300 font-bold block mb-1">Téléphone Client</label>
                  <input
                    type="text"
                    value={formData.clientPhone}
                    onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Lien 1688 / Alibaba / Taobao</label>
                <input
                  type="text"
                  placeholder="https://detail.1688.com/..."
                  value={formData.productUrl}
                  onChange={e => setFormData({ ...formData, productUrl: e.target.value })}
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
