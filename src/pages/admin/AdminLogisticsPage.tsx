import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { shipmentClientService, ShipmentItem } from '../../services/shipmentService';
import { supabase } from '../../services/supabase';
import {
  Truck,
  Plane,
  Ship,
  Warehouse,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  Search,
  Box,
  Layers,
  ChevronRight,
  Plus,
  RefreshCw,
  AlertCircle,
  Filter,
  X
} from 'lucide-react';
import { TransportMode } from '../../types';

export interface AdminShipmentItem {
  id: string;
  orderId: string;
  orderCode: string;
  trackingCode: string;
  carrierId: string;
  carrierName?: string;
  carrierCode?: string;
  origin: string;
  destination: string;
  transportMode: TransportMode;
  status: string;
  estimatedDeparture?: string;
  actualDeparture?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  hubId?: string;
  hubName?: string;
  notes?: string;
  internalCostEstimatedXOF?: number;
  internalCostConfirmedXOF?: number;
  internalCostActualXOF?: number;
  createdAt: string;
  updatedAt: string;
  carrier?: {
    id: string;
    name: string;
    code: string;
  };
  hub?: {
    id: string;
    name: string;
    city: string;
  };
  events?: Array<{
    id: string;
    eventType: string;
    previousStatus: string;
    newStatus: string;
    location: string;
    description: string;
    createdAt: string;
  }>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  awaiting_supplier: { label: 'Attente Fournisseur', color: 'text-amber-300', bg: 'bg-amber-950/60', border: 'border-amber-700/50' },
  supplier_confirmed: { label: 'Confirmé Usine Chine', color: 'text-blue-300', bg: 'bg-blue-950/60', border: 'border-blue-700/50' },
  preparing_in_china: { label: 'Préparation Chine', color: 'text-purple-300', bg: 'bg-purple-950/60', border: 'border-purple-700/50' },
  ready_to_ship: { label: 'Prêt à Expédier', color: 'text-indigo-300', bg: 'bg-indigo-950/60', border: 'border-indigo-700/50' },
  shipped_from_china: { label: 'Expédié Chine', color: 'text-cyan-300', bg: 'bg-cyan-950/60', border: 'border-cyan-700/50' },
  in_transit: { label: 'Fret en Transit', color: 'text-orange-300', bg: 'bg-orange-950/60', border: 'border-orange-700/50' },
  arrived_senegal: { label: 'Arrivé Sénégal (Port/AIBD)', color: 'text-teal-300', bg: 'bg-teal-950/60', border: 'border-teal-700/50' },
  customs: { label: 'Douane Gaindé Dakar', color: 'text-yellow-300', bg: 'bg-yellow-950/60', border: 'border-yellow-700/50' },
  at_hub: { label: 'Réceptionné au Hub', color: 'text-sky-300', bg: 'bg-sky-950/60', border: 'border-sky-700/50' },
  out_for_delivery: { label: 'En Livraison Finale', color: 'text-emerald-300', bg: 'bg-emerald-950/60', border: 'border-emerald-700/50' },
  delivered: { label: 'Livré au Client', color: 'text-emerald-400', bg: 'bg-emerald-900/60', border: 'border-emerald-600/50' },
  cancelled: { label: 'Annulé', color: 'text-rose-400', bg: 'bg-rose-950/60', border: 'border-rose-700/50' }
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  awaiting_supplier: ['supplier_confirmed', 'cancelled'],
  supplier_confirmed: ['preparing_in_china', 'cancelled'],
  preparing_in_china: ['ready_to_ship', 'cancelled'],
  ready_to_ship: ['shipped_from_china', 'cancelled'],
  shipped_from_china: ['in_transit', 'cancelled'],
  in_transit: ['arrived_senegal'],
  arrived_senegal: ['customs'],
  customs: ['at_hub'],
  at_hub: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: []
};

const ALLOWED_NEXT_STATUSES: Record<string, string[]> = {
  awaiting_supplier: ['supplier_confirmed', 'cancelled'],
  supplier_confirmed: ['preparing_in_china', 'cancelled'],
  preparing_in_china: ['ready_to_ship', 'cancelled'],
  ready_to_ship: ['shipped_from_china', 'cancelled'],
  shipped_from_china: ['in_transit'],
  in_transit: ['arrived_senegal'],
  arrived_senegal: ['customs'],
  customs: ['at_hub'],
  at_hub: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: []
};

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  awaiting_supplier: { label: 'Attente Fournisseur', bg: 'bg-amber-500/20', text: 'text-amber-300' },
  supplier_confirmed: { label: 'Confirmé Usine', bg: 'bg-blue-500/20', text: 'text-blue-300' },
  preparing_in_china: { label: 'Préparation Chine', bg: 'bg-indigo-500/20', text: 'text-indigo-300' },
  ready_to_ship: { label: 'Prêt à Expédier', bg: 'bg-purple-500/20', text: 'text-purple-300' },
  shipped_from_china: { label: 'Départ Chine', bg: 'bg-sky-500/20', text: 'text-sky-300' },
  in_transit: { label: 'En Transit', bg: 'bg-cyan-500/20', text: 'text-cyan-300' },
  arrived_senegal: { label: 'Arrivé Sénégal', bg: 'bg-teal-500/20', text: 'text-teal-300' },
  customs: { label: 'Douane Gaindé', bg: 'bg-orange-500/20', text: 'text-orange-300' },
  at_hub: { label: 'Au Hub Dakar', bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  out_for_delivery: { label: 'En Livraison', bg: 'bg-green-500/20', text: 'text-green-300' },
  delivered: { label: 'Livré Client', bg: 'bg-emerald-600/30', text: 'text-emerald-200' },
  cancelled: { label: 'Annulé', bg: 'bg-rose-500/20', text: 'text-rose-300' }
};

export const AdminLogisticsPage: React.FC = () => {
  const { hubLocations, navigate, addToast } = useApp();

  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal Transition de Statut
  const [selectedShipment, setSelectedShipment] = useState<ShipmentItem | null>(null);
  const [nextStatus, setNextStatus] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal Création d'Expédition
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [paidOrders, setPaidOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [activeCarriers, setActiveCarriers] = useState<any[]>([]);
  const [selectedCarrierId, setSelectedCarrierId] = useState('');
  const [selectedHubId, setSelectedHubId] = useState('');
  const [creationNotes, setCreationNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await shipmentClientService.getShipments({ limit: 100 });
      setShipments(res.shipments || []);

      // Charger les transporteurs actifs
      const { data: carriersData } = await (supabase as any)
        .from('carriers')
        .select('*')
        .eq('status', 'active');
      setActiveCarriers(carriersData || []);

      // Charger les commandes payées sans expédition ou éligibles
      const { data: ordersData } = await (supabase as any)
        .from('orders')
        .select('id, tracking_code, customer_name, total_xof, transport_mode, order_status, payment_status')
        .in('payment_status', ['paid', 'processing', 'pending'])
        .order('created_at', { ascending: false })
        .limit(30);
      setPaidOrders(ordersData || []);
    } catch (err: any) {
      console.error('Erreur chargement données logistiques:', err);
      addToast({
        title: 'Erreur',
        message: 'Impossible de synchroniser les flux logistiques.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calcul dynamique des statistiques
  const counts = {
    china: shipments.filter(s => ['awaiting_supplier', 'supplier_confirmed', 'preparing_in_china'].includes(s.status)).length,
    consolidation: shipments.filter(s => s.status === 'ready_to_ship').length,
    transit: shipments.filter(s => ['shipped_from_china', 'in_transit'].includes(s.status)).length,
    customs: shipments.filter(s => ['arrived_senegal', 'customs'].includes(s.status)).length,
    hub: shipments.filter(s => ['at_hub', 'out_for_delivery'].includes(s.status)).length,
    delivered: shipments.filter(s => s.status === 'delivered').length
  };

  const stages = [
    { id: 'china', label: '1. Hubs Chine', count: counts.china, location: 'Guangzhou / Yiwu' },
    { id: 'consolidation', label: '2. Empotage Export', count: counts.consolidation, location: 'Entrepôt Transit' },
    { id: 'transit', label: '3. Fret en Transit', count: counts.transit, location: 'En Vol / En Mer' },
    { id: 'customs', label: '4. Douane Gaindé', count: counts.customs, location: 'Port Autonome / AIBD' },
    { id: 'hub', label: '5. Hubs Dakar', count: counts.hub, location: 'Almadies & Colobane' },
    { id: 'delivered', label: '6. Livré Client', count: counts.delivered, location: 'Sénégal Complet' }
  ];

  const filteredShipments = shipments.filter(s => {
    const matchesSearch = searchFilter
      ? s.tracking_code.toLowerCase().includes(searchFilter.toLowerCase()) ||
        s.order?.tracking_code?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        s.order?.customer_name?.toLowerCase().includes(searchFilter.toLowerCase())
      : true;
    const matchesStatus = statusFilter ? s.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handleOpenStatusModal = (shipment: ShipmentItem) => {
    setSelectedShipment(shipment);
    const allowed = ALLOWED_NEXT_STATUSES[shipment.status] || [];
    setNextStatus(allowed[0] || '');
    setLocationInput('');
    setDescriptionInput('');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || !nextStatus) return;

    setIsUpdating(true);
    try {
      await shipmentClientService.updateStatus({
        shipmentId: selectedShipment.id,
        status: nextStatus,
        location: locationInput.trim() || undefined,
        description: descriptionInput.trim() || undefined
      });

      addToast({
        title: 'Statut mis à jour',
        message: `L'expédition ${selectedShipment.tracking_code} est maintenant : ${STATUS_LABELS[nextStatus]?.label || nextStatus}.`,
        type: 'success'
      });

      setSelectedShipment(null);
      loadData();
    } catch (err: any) {
      console.error('Erreur mise à jour statut:', err);
      addToast({
        title: 'Erreur',
        message: err.message || 'Transition non autorisée.',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      addToast({ title: 'Attention', message: 'Veuillez sélectionner une commande.', type: 'warning' });
      return;
    }

    setIsCreating(true);
    try {
      const created = await shipmentClientService.createShipment({
        orderId: selectedOrderId,
        carrierId: selectedCarrierId || undefined,
        hubId: selectedHubId || undefined,
        notes: creationNotes.trim() || undefined
      });

      addToast({
        title: 'Expédition créée',
        message: `Expédition ${created.tracking_code} créée avec succès.`,
        type: 'success'
      });

      setShowCreateModal(false);
      setSelectedOrderId('');
      setCreationNotes('');
      loadData();
    } catch (err: any) {
      console.error('Erreur création expédition:', err);
      addToast({
        title: 'Erreur',
        message: err.message || 'Échec de la création de l\'expédition.',
        type: 'error'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a1945] p-5 rounded-3xl border border-blue-900/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">Supervision Logistique & Expéditions</h1>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Corridor Chine ➔ Sénégal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestion des flux de fret, jalons d'expédition, dédouanement GAINDE et transferts vers les hubs de Dakar.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF4500] to-orange-600 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Expédition</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer"
            title="Rafraîchir les flux"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. SIX PIPELINE STAGES OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stages.map(stage => (
          <div
            key={stage.id}
            className="p-4 rounded-2xl bg-[#0a1945] border border-blue-900/40 shadow-md flex flex-col justify-between space-y-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouvelle Expédition</span>
          </button>

            <div className="my-1">
              <div className="text-2xl font-black text-white font-mono">{stage.count}</div>
              <div className="text-[10px] text-slate-400">expéditions actives</div>
            </div>

          <button
            onClick={() => navigate('/admin/hub')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Warehouse className="w-4 h-4" />
            <span>Scanner Hub</span>
          </button>
        </div>
      </div>

      {/* 3. TABLEAU DE BORD EXPÉDITIONS */}
      <div className="p-6 rounded-3xl bg-[#0a1945] border border-blue-900/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white">Expéditions Internationales Réelles</h2>
            <p className="text-xs text-slate-400">Suivi transactionnel avec jalons immuables et notifications</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="N° Expédition, Commande..."
                className="pl-9 pr-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-400 outline-hidden focus:border-[#FF4500]"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#06102b] border border-white/10 text-xs text-white outline-hidden"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table list */}
        {filteredShipments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {loading ? 'Chargement des flux logistiques...' : 'Aucune expédition trouvée pour ces filtres.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-semibold">
                  <th className="pb-3 px-2">Expédition</th>
                  <th className="pb-3 px-2">Commande</th>
                  <th className="pb-3 px-2">Client</th>
                  <th className="pb-3 px-2">Mode &amp; Ligne</th>
                  <th className="pb-3 px-2">Hub Destination</th>
                  <th className="pb-3 px-2">Statut Actuel</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredShipments.map(s => {
                  const st = STATUS_LABELS[s.status] || { label: s.status, bg: 'bg-slate-500/20', text: 'text-slate-300' };
                  const allowed = ALLOWED_NEXT_STATUSES[s.status] || [];

                  return (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-white">
                        {s.tracking_code}
                      </td>
                      <td className="py-3 px-2 font-mono text-cyan-300">
                        {s.order?.tracking_code || 'N/A'}
                      </td>
                      <td className="py-3 px-2 text-slate-300">
                        {s.order?.customer_name || 'Client Dallou'}
                      </td>
                      <td className="py-3 px-2 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          {s.transport_mode === 'air' ? (
                            <Plane className="w-3.5 h-3.5 text-sky-400" />
                          ) : (
                            <Ship className="w-3.5 h-3.5 text-cyan-400" />
                          )}
                          <span>{s.carrier?.name ? s.carrier.name.split('(')[0] : s.transport_mode.toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-slate-300">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>{s.hub?.name || 'Hub Dakar HQ'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border border-current/20 ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {allowed.length > 0 ? (
                          <button
                            onClick={() => handleOpenStatusModal(s)}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#FF4500] text-white text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Faire avancer</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium">Clôturé</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODAL TRANSITION DE STATUT (STATE MACHINE) */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-[#0a1945] border border-blue-900/60 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-bold text-base">Transition de Statut Opérationnelle</h3>
                <span className="text-xs text-slate-400 font-mono">Bordereau : {selectedShipment.tracking_code}</span>
              </div>
              <button
                onClick={() => setSelectedShipment(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-slate-400">Statut actuel :</span>
                <div className="font-bold text-sm text-cyan-300">
                  {STATUS_LABELS[selectedShipment.status]?.label || selectedShipment.status}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Prochain statut autorisé (State Machine) :
                </label>
                <select
                  value={nextStatus}
                  onChange={e => setNextStatus(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl bg-[#06102b] border border-white/20 text-white font-bold outline-hidden focus:border-[#FF4500]"
                >
                  {(ALLOWED_NEXT_STATUSES[selectedShipment.status] || []).map(st => (
                    <option key={st} value={st}>
                      ➔ {STATUS_LABELS[st]?.label || st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Localisation actuelle :
                </label>
                <input
                  type="text"
                  value={locationInput}
                  onChange={e => setLocationInput(e.target.value)}
                  placeholder="Ex: Entrepôt Ningbo, En mer, Port de Dakar..."
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-hidden focus:border-[#FF4500]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Description / Observation de l'événement :
                </label>
                <textarea
                  rows={2}
                  value={descriptionInput}
                  onChange={e => setDescriptionInput(e.target.value)}
                  placeholder="Ex: Déclaration en douane effectuée, conteneur dépoté..."
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-hidden focus:border-[#FF4500]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedShipment(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !nextStatus}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF4500] to-orange-600 text-white font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? 'Enregistrement...' : 'Valider la transition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL NOUVELLE EXPÉDITION */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-[#0a1945] border border-blue-900/60 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-bold text-base">Créer une Expédition Opérationnelle</h3>
                <span className="text-xs text-slate-400">Génère un tracking code unique serveur</span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Sélectionner la commande :
                </label>
                <select
                  value={selectedOrderId}
                  onChange={e => setSelectedOrderId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl bg-[#06102b] border border-white/20 text-white font-bold outline-hidden focus:border-[#FF4500]"
                >
                  <option value="">-- Choisir une commande --</option>
                  {paidOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.tracking_code} • {o.customer_name || 'Client'} • {o.total_xof?.toLocaleString()} FCFA ({o.transport_mode?.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Transporteur Partenaire :
                </label>
                <select
                  value={selectedCarrierId}
                  onChange={e => setSelectedCarrierId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#06102b] border border-white/20 text-white outline-hidden focus:border-[#FF4500]"
                >
                  <option value="">Automatique selon mode de transport</option>
                  {activeCarriers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.mode?.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Hub Relais Dakar :
                </label>
                <select
                  value={selectedHubId}
                  onChange={e => setSelectedHubId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#06102b] border border-white/20 text-white outline-hidden focus:border-[#FF4500]"
                >
                  <option value="">Hub par défaut (Almadies HQ)</option>
                  {hubLocations.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Instructions &amp; Notes d'expédition :
                </label>
                <textarea
                  rows={2}
                  value={creationNotes}
                  onChange={e => setCreationNotes(e.target.value)}
                  placeholder="Ex: Emballage sous palette renforcée, étiquetage express..."
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-hidden focus:border-[#FF4500]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !selectedOrderId}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF4500] to-orange-600 text-white font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {isCreating ? 'Initialisation...' : 'Créer l\'expédition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
