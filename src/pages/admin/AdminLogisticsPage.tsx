import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
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
  AlertCircle,
  RefreshCw,
  PlusCircle,
  X,
  FileText,
  ShieldCheck,
  Building,
  Navigation
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

export const AdminLogisticsPage: React.FC = () => {
  const { orders, hubLocations, navigate } = useApp();

  const [shipments, setShipments] = useState<AdminShipmentItem[]>([]);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');

  // Transition modal state
  const [selectedShipment, setSelectedShipment] = useState<AdminShipmentItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [transitionLocation, setTransitionLocation] = useState('');
  const [transitionDescription, setTransitionDescription] = useState('');
  const [isSubmittingTransition, setIsSubmittingTransition] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [transitionSuccess, setTransitionSuccess] = useState<string | null>(null);

  // New Shipment modal state
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [newOrderId, setNewOrderId] = useState('');
  const [newMode, setNewMode] = useState<TransportMode>('air');
  const [newCarrierId, setNewCarrierId] = useState('');
  const [newHubId, setNewHubId] = useState('');
  const [newInternalCost, setNewInternalCost] = useState('45000');
  const [newNotes, setNewNotes] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Headers for operator identity
  const authHeaders = {
    'Content-Type': 'application/json',
    'x-user-id': 'admin_ops',
    'x-user-role': 'admin',
    'x-user-name': 'Directeur des Opérations Logistiques'
  };

  const fetchShipmentsAndRefData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resShipments, resCarriers, resHubs] = await Promise.all([
        fetch('/api/logistics/shipments', { headers: authHeaders }),
        fetch('/api/logistics/carriers', { headers: authHeaders }),
        fetch('/api/logistics/hubs', { headers: authHeaders })
      ]);

      const dataShipments = await resShipments.json();
      const dataCarriers = await resCarriers.json();
      const dataHubs = await resHubs.json();

      if (dataShipments.success) {
        setShipments(dataShipments.shipments || []);
      }
      if (dataCarriers.success) {
        setCarriers(dataCarriers.carriers || []);
        if (dataCarriers.carriers?.length > 0 && !newCarrierId) {
          setNewCarrierId(dataCarriers.carriers[0].id);
        }
      }
      if (dataHubs.success) {
        setHubs(dataHubs.hubs || []);
        if (dataHubs.hubs?.length > 0 && !newHubId) {
          setNewHubId(dataHubs.hubs[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error fetching logistics data:', err);
      setError('Impossible de charger les expéditions réelles depuis le serveur.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipmentsAndRefData();
  }, []);

  const openTransitionModal = async (shipment: AdminShipmentItem) => {
    setSelectedShipment(shipment);
    setTransitionError(null);
    setTransitionSuccess(null);
    const allowed = ALLOWED_TRANSITIONS[shipment.status] || [];
    setTargetStatus(allowed.length > 0 ? allowed[0] : '');

    // Default suggested location based on next status
    if (shipment.status === 'awaiting_supplier') {
      setTransitionLocation('Bureaux Dallou Chine Yiwu');
      setTransitionDescription('Confirmation formelle de l\'usine et validation proforma');
    } else if (shipment.status === 'supplier_confirmed') {
      setTransitionLocation('Usine partenaire (Guangdong)');
      setTransitionDescription('Lancement et contrôle de conformité packaging export');
    } else if (shipment.status === 'preparing_in_china') {
      setTransitionLocation('Hub Export Dallou Chine (Guangzhou)');
      setTransitionDescription('Inspection qualité réussie, empotage et scellé');
    } else if (shipment.status === 'ready_to_ship') {
      setTransitionLocation('Aéroport CAN Guangzhou / Port Ningbo');
      setTransitionDescription('Remise officielle au transporteur international');
    } else if (shipment.status === 'shipped_from_china') {
      setTransitionLocation('En vol cargo / En mer Atlantique');
      setTransitionDescription('Départ confirmé, manifeste transmis à Dakar');
    } else if (shipment.status === 'in_transit') {
      setTransitionLocation('AIBD Fret Dakar / Port Autonome de Dakar');
      setTransitionDescription('Arrivée sur le territoire sénégalais');
    } else if (shipment.status === 'arrived_senegal') {
      setTransitionLocation('Zone Douanière GAINDE Dakar');
      setTransitionDescription('Dépôt de la déclaration douane en détail');
    } else if (shipment.status === 'customs') {
      setTransitionLocation(shipment.hubName || 'Hub Dallou Dakar Ouest Foire');
      setTransitionDescription('Bon à enlever (BAE) accordé, déchargé au hub');
    } else if (shipment.status === 'at_hub') {
      setTransitionLocation('Région de Dakar / Livraison client');
      setTransitionDescription('Colis pris en charge par le livreur express');
    } else {
      setTransitionLocation('Destination finale');
      setTransitionDescription('Colis remis avec succès contre signature');
    }

    // Fetch full events if needed
    try {
      const res = await fetch(`/api/logistics/shipments/${shipment.id}`, { headers: authHeaders });
      const detail = await res.json();
      if (detail.success && detail.shipment?.events) {
        setSelectedShipment(prev => prev ? { ...prev, events: detail.shipment.events } : prev);
      }
    } catch {
      // Ignore detail error
    }
  };

  const handleExecuteTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || !targetStatus) return;

    try {
      setIsSubmittingTransition(true);
      setTransitionError(null);
      setTransitionSuccess(null);

      const res = await fetch(`/api/logistics/shipments/${selectedShipment.id}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          expectedCurrentStatus: selectedShipment.status,
          newStatus: targetStatus,
          location: transitionLocation,
          description: transitionDescription
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setTransitionError(data.errorMessage || 'Erreur lors de la transition d\'état.');
        return;
      }

      setTransitionSuccess(`Statut mis à jour avec succès : ${STATUS_CONFIG[targetStatus]?.label || targetStatus}`);
      await fetchShipmentsAndRefData();

      // Refresh modal shipment state
      if (data.shipment) {
        setSelectedShipment(prev => ({
          ...prev!,
          ...data.shipment,
          events: [data.event, ...(prev?.events || [])]
        }));
        const nextAllowed = ALLOWED_TRANSITIONS[data.shipment.status] || [];
        setTargetStatus(nextAllowed.length > 0 ? nextAllowed[0] : '');
      }
    } catch (err: any) {
      setTransitionError('Erreur réseau lors de la mise à jour.');
    } finally {
      setIsSubmittingTransition(false);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderId) {
      setCreateError('Veuillez sélectionner une commande payée.');
      return;
    }

    try {
      setIsSubmittingCreate(true);
      setCreateError(null);

      const res = await fetch('/api/logistics/shipments', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          orderId: newOrderId,
          transportMode: newMode,
          carrierId: newCarrierId,
          hubId: newHubId,
          internalCostEstimatedXOF: Number(newInternalCost) || 0,
          notes: newNotes
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setCreateError(data.errorMessage || 'Impossible de créer l\'expédition.');
        return;
      }

      setIsCreatingShipment(false);
      setNewNotes('');
      await fetchShipmentsAndRefData();
    } catch (err: any) {
      setCreateError('Erreur réseau lors de la création.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Filtered shipments
  const filteredShipments = shipments.filter(s => {
    const matchesSearch =
      s.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.carrierName && s.carrierName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesMode = modeFilter === 'all' || s.transportMode === modeFilter;

    return matchesSearch && matchesStatus && matchesMode;
  });

  // Calculate stats from live shipments
  const stats = {
    total: shipments.length,
    inChina: shipments.filter(s => ['awaiting_supplier', 'supplier_confirmed', 'preparing_in_china', 'ready_to_ship'].includes(s.status)).length,
    inTransit: shipments.filter(s => ['shipped_from_china', 'in_transit'].includes(s.status)).length,
    inCustoms: shipments.filter(s => ['arrived_senegal', 'customs'].includes(s.status)).length,
    atHub: shipments.filter(s => s.status === 'at_hub').length,
    delivered: shipments.filter(s => s.status === 'delivered').length
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a1945] p-5 rounded-3xl border border-blue-900/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">Supervision Logistique & Expéditions Réelles</h1>
            <span className="bg-[#FF4500]/20 text-orange-300 border border-[#FF4500]/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Étape 8 Validée
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Machine à états stricte, traçabilité Chine ➔ Sénégal, contrôle des jalons et registres d'audit immuables.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsCreatingShipment(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouvelle Expédition</span>
          </button>

          <button
            onClick={fetchShipmentsAndRefData}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-all cursor-pointer"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/admin/hub')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Warehouse className="w-4 h-4" />
            <span>Scanner Hub</span>
          </button>
        </div>
      </div>

      {/* 2. OPERATIONAL KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-[#0a1945] border border-blue-900/40 shadow-md">
          <span className="text-[11px] font-bold text-slate-400">Total Dossiers</span>
          <div className="text-2xl font-black text-white font-mono mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-1">Colis enregistrés</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a1945] border border-purple-900/40 shadow-md">
          <span className="text-[11px] font-bold text-purple-300">1. Hubs Chine</span>
          <div className="text-2xl font-black text-white font-mono mt-1">{stats.inChina}</div>
          <div className="text-[10px] text-slate-400 mt-1">Fournisseur & Export</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a1945] border border-orange-900/40 shadow-md">
          <span className="text-[11px] font-bold text-orange-300">2. Fret en Transit</span>
          <div className="text-2xl font-black text-white font-mono mt-1">{stats.inTransit}</div>
          <div className="text-[10px] text-slate-400 mt-1">Air Cargo & Mer</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a1945] border border-yellow-900/40 shadow-md">
          <span className="text-[11px] font-bold text-yellow-300">3. Douane GAINDE</span>
          <div className="text-2xl font-black text-white font-mono mt-1">{stats.inCustoms}</div>
          <div className="text-[10px] text-slate-400 mt-1">AIBD & Port Dakar</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a1945] border border-sky-900/40 shadow-md">
          <span className="text-[11px] font-bold text-sky-300">4. Hub Dakar HQ</span>
          <div className="text-2xl font-black text-white font-mono mt-1">{stats.atHub}</div>
          <div className="text-[10px] text-slate-400 mt-1">Prêt pour retrait/livr.</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a1945] border border-emerald-900/40 shadow-md">
          <span className="text-[11px] font-bold text-emerald-300">5. Livré Client</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{stats.delivered}</div>
          <div className="text-[10px] text-slate-400 mt-1">Clôturé & archivé</div>
        </div>
      </div>

      {/* 3. OPERATIONAL EXPEDITIONS TABLE & WORKFLOW CONTROLLER */}
      <div className="rounded-3xl bg-[#0a1945] border border-blue-900/40 p-5 sm:p-6 shadow-xl space-y-4">
        {/* Table Top bar & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-blue-900/40">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#FF4500]" />
              Registre des Expéditions Réelles
            </h2>
            <p className="text-xs text-slate-400">
              Chaque mise à jour applique la validation serveur et alimente l'audit trail immuable.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Réf, commande, transporteur..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/70 border border-blue-900/50 text-xs text-white placeholder:text-slate-500 focus:border-[#FF4500] outline-hidden"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/70 border border-blue-900/50 text-xs text-slate-300 focus:border-[#FF4500] outline-hidden cursor-pointer"
            >
              <option value="all">Tous statuts ({shipments.length})</option>
              <option value="awaiting_supplier">Attente Fournisseur</option>
              <option value="supplier_confirmed">Confirmé Usine</option>
              <option value="preparing_in_china">Préparation Chine</option>
              <option value="ready_to_ship">Prêt à Expédier</option>
              <option value="shipped_from_china">Expédié Chine</option>
              <option value="in_transit">Fret International</option>
              <option value="arrived_senegal">Arrivé Sénégal</option>
              <option value="customs">Douane Gaindé</option>
              <option value="at_hub">Disponible au Hub</option>
              <option value="out_for_delivery">En Livraison</option>
              <option value="delivered">Livré</option>
            </select>

            {/* Mode filter */}
            <select
              value={modeFilter}
              onChange={e => setModeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/70 border border-blue-900/50 text-xs text-slate-300 focus:border-[#FF4500] outline-hidden cursor-pointer"
            >
              <option value="all">Tous modes</option>
              <option value="air">Aérien Cargo</option>
              <option value="sea">Maritime Groupé</option>
              <option value="express">Express</option>
            </select>
          </div>
        </div>

        {/* Shipments List Table */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#FF4500]" />
            <span>Synchronisation du registre logistique en cours...</span>
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <Box className="w-8 h-8 text-slate-600 mx-auto" />
            <p>Aucune expédition ne correspond aux critères.</p>
            <button
              onClick={() => setIsCreatingShipment(true)}
              className="px-4 py-1.5 rounded-xl bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs hover:bg-blue-600/40 transition-colors"
            >
              Créer une première expédition
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-blue-900/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Bordereau / Suivi</th>
                  <th className="py-3 px-3">Commande</th>
                  <th className="py-3 px-3">Mode & Transporteur</th>
                  <th className="py-3 px-3">Statut Actuel</th>
                  <th className="py-3 px-3">Hub Arrivée</th>
                  <th className="py-3 px-3">Coût Interne (Confidentiel)</th>
                  <th className="py-3 px-3 text-right">Action Opérateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/30">
                {filteredShipments.map(s => {
                  const cfg = STATUS_CONFIG[s.status] || {
                    label: s.status,
                    color: 'text-slate-300',
                    bg: 'bg-slate-800',
                    border: 'border-slate-700'
                  };
                  const allowedNext = ALLOWED_TRANSITIONS[s.status] || [];

                  return (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      {/* Tracking Code */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                            {s.trackingCode}
                          </span>
                        </div>
                      </td>

                      {/* Order Code */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-medium text-slate-300">{s.orderCode}</span>
                      </td>

                      {/* Mode & Carrier */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                            {s.transportMode === 'air' ? (
                              <Plane className="w-3.5 h-3.5" />
                            ) : (
                              <Ship className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-200">{s.carrierName || 'Partenaire logistique'}</span>
                            <span className="text-[10px] text-slate-400 capitalize">{s.transportMode === 'air' ? 'Fret Aérien' : 'Fret Maritime'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Hub destination */}
                      <td className="py-3.5 px-3 text-slate-300">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.hubName || s.destination || 'Dakar'}</span>
                        </div>
                      </td>

                      {/* Internal cost - hidden from public */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-cyan-300">
                            {(s.internalCostEstimatedXOF || 0).toLocaleString('fr-FR')} XOF
                          </span>
                          <span className="text-[10px] text-slate-400">Coût d'achat brut</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => openTransitionModal(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-bold transition-all cursor-pointer"
                        >
                          <span>Gérer l'étape</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. HUBS CAPACITY OVERVIEW (ORIGINAL STEP 7 PRESERVED) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hubLocations.map(hub => {
          const capPercent = Math.min(100, Math.round((hub.activeParcelsCount / hub.maxCapacity) * 100));

          return (
            <div key={hub.id} className="p-5 rounded-3xl bg-[#0a1945] border border-blue-900/40 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">{hub.name}</h3>
                  <div className="text-[10px] text-slate-400">{hub.city} • {hub.address}</div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  Actif
                </span>
              </div>

              <div className="space-y-1.5 p-3 rounded-2xl bg-white/5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Responsable :</span>
                  <strong className="text-white">{hub.managerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Téléphone :</span>
                  <strong className="text-white font-mono">{hub.phone}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Colis en stock :</span>
                  <strong className="text-cyan-300 font-mono">{hub.activeParcelsCount} / {hub.maxCapacity}</strong>
                </div>
              </div>

              {/* Occupancy Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Taux d'occupation</span>
                  <strong className="text-white font-mono">{capPercent}%</strong>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      capPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${capPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. MODAL: TRANSITION SÉCURISÉE DE STATUT */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[#0a1945] border border-blue-900/60 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-[#FF4500] flex items-center justify-center">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Transition Opérationnelle de Statut
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>Bordereau : <strong className="text-orange-300">{selectedShipment.trackingCode}</strong></span>
                    <span>•</span>
                    <span>Commande : <strong className="text-slate-200">{selectedShipment.orderCode}</strong></span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedShipment(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current State Info */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-blue-900/40 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Statut Actuel Validé</span>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_CONFIG[selectedShipment.status]?.bg} ${STATUS_CONFIG[selectedShipment.status]?.color} ${STATUS_CONFIG[selectedShipment.status]?.border}`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    {STATUS_CONFIG[selectedShipment.status]?.label || selectedShipment.status}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Transporteur Associé</span>
                <div className="text-xs font-bold text-white mt-1">
                  {selectedShipment.carrierName || 'CMA CGM / Air France Cargo'}
                </div>
              </div>
            </div>

            {/* State Machine Transition Form */}
            <form onSubmit={handleExecuteTransition} className="space-y-4">
              {/* Allowed Next Transitions */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span>Prochaine Étape Autorisée par la Machine à États :</span>
                </label>

                {(() => {
                  const allowed = ALLOWED_TRANSITIONS[selectedShipment.status] || [];
                  if (allowed.length === 0) {
                    return (
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ce colis a atteint son état terminal ({selectedShipment.status}). Aucune transition supplémentaire autorisée.</span>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allowed.map(next => {
                        const isSelected = targetStatus === next;
                        const cfg = STATUS_CONFIG[next] || { label: next };

                        return (
                          <button
                            key={next}
                            type="button"
                            onClick={() => setTargetStatus(next)}
                            className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#FF4500]/20 border-[#FF4500] text-white ring-1 ring-[#FF4500]'
                                : 'bg-slate-900/50 border-blue-900/40 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-bold">{cfg.label}</span>
                              <span className="text-[10px] text-slate-400 font-mono">code: {next}</span>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#FF4500]" />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Location Input with quick buttons */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Localisation de l'événement (Location)
                </label>
                <input
                  type="text"
                  value={transitionLocation}
                  onChange={e => setTransitionLocation(e.target.value)}
                  placeholder="Ex: Hub Guangzhou, AIBD Dakar Fret..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-blue-900/50 text-xs text-white placeholder:text-slate-500 focus:border-[#FF4500] outline-hidden"
                  required
                />
                <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 pt-1">
                  <span>Suggestions :</span>
                  {['Hub Guangzhou', 'Entrepôt Yiwu', 'AIBD Dakar Cargo', 'Port Autonome de Dakar', 'Hub Ouest Foire'].map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setTransitionLocation(loc)}
                      className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Observation / Compte-rendu Opérationnel
                </label>
                <textarea
                  value={transitionDescription}
                  onChange={e => setTransitionDescription(e.target.value)}
                  placeholder="Détails du contrôle, référence LTA/BL ou PV de douane..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900/70 border border-blue-900/50 text-xs text-white placeholder:text-slate-500 focus:border-[#FF4500] outline-hidden"
                  required
                />
              </div>

              {/* Feedback messages */}
              {transitionError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{transitionError}</span>
                </div>
              )}

              {transitionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{transitionSuccess}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedShipment(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Fermer
                </button>

                {(ALLOWED_TRANSITIONS[selectedShipment.status] || []).length > 0 && (
                  <button
                    type="submit"
                    disabled={isSubmittingTransition || !targetStatus}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingTransition ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Validation en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirmer la transition ({STATUS_CONFIG[targetStatus]?.label || targetStatus})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Audit Trail Section */}
            {selectedShipment.events && selectedShipment.events.length > 0 && (
              <div className="pt-4 border-t border-blue-900/40 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#FF4500]" />
                  <span>Registre d'Audit Immuable ({selectedShipment.events.length} Jalons Certifiés)</span>
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedShipment.events.map((evt, index) => (
                    <div
                      key={evt.id || index}
                      className="p-3 rounded-xl bg-slate-900/40 border border-blue-900/30 text-xs flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-[10px] font-mono shrink-0">
                          {selectedShipment.events!.length - index}
                        </span>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{evt.description}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                              📍 {evt.location}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Transition : {evt.previousStatus || 'initial'} ➔ <strong className="text-orange-300">{evt.newStatus}</strong>
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {new Date(evt.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. MODAL: CRÉATION D'EXPÉDITION POUR COMMANDE PAYÉE */}
      {isCreatingShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0a1945] border border-blue-900/60 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Initialiser une Expédition Réelle</h3>
                  <p className="text-xs text-slate-400">Démarre le parcours logistique à l'état 'awaiting_supplier'</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingShipment(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-4 text-xs">
              {/* Commande payée */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Commande à expédier</label>
                <select
                  value={newOrderId}
                  onChange={e => setNewOrderId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/70 border border-blue-900/50 text-white focus:border-[#FF4500] outline-hidden cursor-pointer"
                  required
                >
                  <option value="">-- Sélectionner une commande --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.trackingCode || o.id} - {o.customer.fullName} ({o.totalPriceXOF.toLocaleString('fr-FR')} XOF)
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode de transport */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Mode de Fret</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMode('air')}
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                      newMode === 'air' ? 'bg-[#FF4500]/20 border-[#FF4500] text-white' : 'bg-slate-900/50 border-blue-900/40 text-slate-300'
                    }`}
                  >
                    <Plane className="w-4 h-4 text-[#FF4500]" />
                    <span className="font-bold">Fret Aérien Express</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMode('sea')}
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                      newMode === 'sea' ? 'bg-[#FF4500]/20 border-[#FF4500] text-white' : 'bg-slate-900/50 border-blue-900/40 text-slate-300'
                    }`}
                  >
                    <Ship className="w-4 h-4 text-[#FF4500]" />
                    <span className="font-bold">Fret Maritime LCL</span>
                  </button>
                </div>
              </div>

              {/* Carrier Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Transporteur International</label>
                <select
                  value={newCarrierId}
                  onChange={e => setNewCarrierId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/70 border border-blue-900/50 text-white focus:border-[#FF4500] outline-hidden cursor-pointer"
                >
                  {carriers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) - {c.mode === 'air' ? 'Aérien' : 'Maritime'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hub Destination */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Hub de Retrait / Destination</label>
                <select
                  value={newHubId}
                  onChange={e => setNewHubId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/70 border border-blue-900/50 text-white focus:border-[#FF4500] outline-hidden cursor-pointer"
                >
                  {hubs.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city}) - {h.address}
                    </option>
                  ))}
                </select>
              </div>

              {/* Internal Cost */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Coût Interne Estimé XOF (Confidentiel)</label>
                <input
                  type="number"
                  value={newInternalCost}
                  onChange={e => setNewInternalCost(e.target.value)}
                  placeholder="Ex: 45000"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900/70 border border-blue-900/50 text-white focus:border-[#FF4500] outline-hidden font-mono"
                />
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingShipment(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 text-slate-300 font-bold"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold transition-all disabled:opacity-50"
                >
                  {isSubmittingCreate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Générer le Bordereau & Suivi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
