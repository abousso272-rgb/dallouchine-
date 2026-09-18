import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, TrackingStatus } from '../../types';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Plane,
  Ship,
  CreditCard,
  User,
  Phone,
  MapPin,
  X,
  Send,
  Printer,
  ChevronRight,
  Package,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    showToast
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailTab, setOrderDetailTab] = useState<'summary' | 'items' | 'logistics' | 'client' | 'status'>('summary');

  // Status update form inside drawer
  const [newStatus, setNewStatus] = useState<TrackingStatus>('in_transit');
  const [newStatusLocation, setNewStatusLocation] = useState('Hub Transit Guangzhou / Aéroport');
  const [newStatusNote, setNewStatusNote] = useState('');

  const statusLabels: Record<TrackingStatus, { label: string; color: string }> = {
    order_confirmed: { label: 'Commande Confirmée', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    payment_received: { label: 'Paiement Validé', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    groupage_consolidated: { label: 'Groupage Consolidé', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    purchased_in_china: { label: 'Acheté Usine Chine', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    quality_control_passed: { label: 'QC & Inspection Conforme', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
    shipped_from_china: { label: 'Fret International Parti', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    in_transit: { label: 'En Vol / Mer', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    arrived_in_senegal: { label: 'Arrivé au Sénégal (Douane)', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
    customs_cleared: { label: 'Dédouanement Terminé', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    arrived_at_hub: { label: 'Reçu Hub Dakar HQ', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
    ready_for_pickup: { label: 'Prêt pour Retrait Hub', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    out_for_delivery: { label: 'En Cours de Livraison', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    delivered: { label: 'Colis Livré Client', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
  };

  // 8 visual timeline milestones for the step timeline
  const timelineSteps: { key: TrackingStatus; label: string }[] = [
    { key: 'order_confirmed', label: 'Commande' },
    { key: 'payment_received', label: 'Paiement' },
    { key: 'purchased_in_china', label: 'Achat Chine' },
    { key: 'quality_control_passed', label: 'Contrôle' },
    { key: 'shipped_from_china', label: 'Expédition' },
    { key: 'arrived_in_senegal', label: 'Sénégal' },
    { key: 'ready_for_pickup', label: 'Hub Dakar' },
    { key: 'delivered', label: 'Livrée' }
  ];

  const getStepIndex = (status: TrackingStatus) => {
    const keys = timelineSteps.map(s => s.key);
    const idx = keys.indexOf(status);
    if (idx !== -1) return idx;
    if (status === 'in_transit') return 4;
    if (status === 'customs_cleared' || status === 'arrived_at_hub') return 5;
    if (status === 'out_for_delivery') return 6;
    return 0;
  };

  const filteredOrders = orders.filter(order => {
    const q = (search || '').toLowerCase();
    const matchSearch =
      (order?.trackingCode || '').toLowerCase().includes(q) ||
      (order?.customer?.fullName || '').toLowerCase().includes(q) ||
      (order?.customer?.phone || '').includes(q) ||
      (order?.customer?.city || '').toLowerCase().includes(q) ||
      (order?.items || []).some(i => (i?.productName || (i as any)?.product?.name || '').toLowerCase().includes(q));

    const matchStatus = statusFilter === 'all' || order.currentStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleUpdateStatus = () => {
    if (!selectedOrder) return;
    updateOrderStatus(
      selectedOrder.id,
      newStatus,
      newStatusLocation,
      newStatusNote || `Mise à jour statut : ${statusLabels[newStatus]?.label || newStatus}`
    );
    const updated = orders.find(o => o.id === selectedOrder.id);
    if (updated) {
      setSelectedOrder(updated);
    }
    showToast('success', 'Statut mis à jour', `Commande ${selectedOrder.trackingCode} passée à ${statusLabels[newStatus]?.label}`);
    setNewStatusNote('');
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a1945] p-5 rounded-3xl border border-blue-900/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">Commandes & Suivi Logistique</h1>
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {orders.length} commandes
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gérez le statut d'acheminement de chaque colis de l'usine chinoise jusqu'au client sénégalais.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
        >
          <Printer className="w-4 h-4 text-blue-400" />
          <span>Imprimer bordereaux</span>
        </button>
      </div>

      {/* 2. SEARCH & STATUS FILTER TABS */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-[#0a1945] p-3 rounded-2xl border border-blue-900/40">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher code AWP, client, téléphone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#2A6DFF]"
          />
        </div>

        {/* Quick status filter pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {[
            { id: 'all', label: 'Toutes', count: orders.length },
            { id: 'payment_received', label: 'Payées', count: orders.filter(o => o.currentStatus === 'payment_received').length },
            { id: 'purchased_in_china', label: 'En Achat Chine', count: orders.filter(o => o.currentStatus === 'purchased_in_china').length },
            { id: 'in_transit', label: 'En Transit', count: orders.filter(o => o.currentStatus === 'in_transit' || o.currentStatus === 'shipped_from_china').length },
            { id: 'arrived_in_senegal', label: 'Arrivées Sénégal', count: orders.filter(o => o.currentStatus === 'arrived_in_senegal' || o.currentStatus === 'arrived_at_hub').length },
            { id: 'ready_for_pickup', label: 'Prêtes Hub', count: orders.filter(o => o.currentStatus === 'ready_for_pickup').length },
            { id: 'delivered', label: 'Livrées', count: orders.filter(o => o.currentStatus === 'delivered').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-[#2A6DFF] text-white shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-75">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. ORDERS TABLE (LEVEL 1: ID, Client, Articles, Montant, Statut) */}
      <div className="bg-[#0a1945] rounded-3xl border border-blue-900/40 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-blue-900/50 bg-[#071330] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Tracking AWP</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Articles</th>
                <th className="py-3 px-4">Total Payé</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/30 text-slate-200">
              {filteredOrders.map(order => (
                <tr
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setOrderDetailTab('summary');
                    setNewStatus(order.currentStatus);
                  }}
                  className="hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  {/* Tracking Code & Mode */}
                  <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="group-hover:text-blue-300 transition-colors">{order.trackingCode}</span>
                      {order.transportMode === 'air' ? (
                        <Plane className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <Ship className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                    </div>
                  </td>

                  {/* Client */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-bold text-white">{order.customer.fullName}</div>
                    <div className="text-[10px] text-slate-400">{order.customer.city} • {order.customer.phone}</div>
                  </td>

                  {/* Articles */}
                  <td className="py-3 px-4">
                    <div className="text-slate-300 font-medium truncate max-w-[240px]">
                      {(order?.items || []).map(i => `${i.productName || 'Article'} (x${i.quantity})`).join(', ')}
                    </div>
                  </td>

                  {/* Total */}
                  <td className="py-3 px-4 font-mono-numeric font-bold text-emerald-300 whitespace-nowrap">
                    {(order.totalXOF || 0).toLocaleString('fr-FR')} FCFA
                  </td>

                  {/* Statut */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${statusLabels[order.currentStatus]?.color || 'bg-slate-500/20 text-slate-300'}`}>
                      {statusLabels[order.currentStatus]?.label || order.currentStatus}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className="text-blue-400 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Voir</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. ORDER DETAIL DRAWER (TIMELINE + STRUCTURED TABS) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-[#0a1945] h-full shadow-2xl border-l border-blue-900/50 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-5">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-white">{selectedOrder.trackingCode}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusLabels[selectedOrder.currentStatus]?.color}`}>
                    {statusLabels[selectedOrder.currentStatus]?.label}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* VISUAL STEP TIMELINE (8 MILESTONES) */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Progression Logistique</span>
                <div className="grid grid-cols-8 gap-1 items-center text-center">
                  {timelineSteps.map((step, idx) => {
                    const currentIdx = getStepIndex(selectedOrder.currentStatus);
                    const isCompleted = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div key={step.key} className="flex flex-col items-center gap-1">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                            isCurrent
                              ? 'bg-[#2A6DFF] text-white ring-2 ring-blue-400 shadow-md'
                              : isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <span className={`text-[9px] truncate w-full ${isCurrent ? 'font-bold text-blue-300' : isCompleted ? 'text-slate-300' : 'text-slate-600'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TABS NAVIGATION (RÉSUMÉ, PAIEMENT, PRODUITS, LOGISTIQUE, HISTORIQUE) */}
              <div className="flex items-center gap-1 border-b border-blue-900/40 pb-2">
                {[
                  { id: 'summary', label: 'Résumé' },
                  { id: 'items', label: 'Articles' },
                  { id: 'client', label: 'Client & Paiement' },
                  { id: 'logistics', label: 'Logistique' },
                  { id: 'status', label: 'Changer Statut' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setOrderDetailTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      orderDetailTab === t.id
                        ? 'bg-[#2A6DFF] text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: SUMMARY */}
              {orderDetailTab === 'summary' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white/5">
                      <span className="text-slate-400 text-[10px] block">Montant Total</span>
                      <strong className="text-base font-black text-emerald-300 font-mono">
                        {(selectedOrder?.totalXOF || 0).toLocaleString('fr-FR')} FCFA
                      </strong>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/5">
                      <span className="text-slate-400 text-[10px] block">Mode de Règlement</span>
                      <strong className="text-white uppercase font-bold">
                        {selectedOrder.paymentMethod.replace('_', ' ')}
                      </strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 space-y-2">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Destinataire</span>
                    <div className="text-white font-bold">{selectedOrder.customer.fullName}</div>
                    <div className="text-slate-300">{selectedOrder.customer.phone} • {selectedOrder.customer.deliveryAddress}, {selectedOrder.customer.city}</div>
                  </div>
                </div>
              )}

              {/* TAB 2: ARTICLES */}
              {orderDetailTab === 'items' && (
                <div className="space-y-2 text-xs">
                  {(selectedOrder?.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.productImage || (item as any).product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div>
                          <div className="font-bold text-white">{item.productName || 'Article'}</div>
                          <div className="text-[10px] text-slate-400">Quantité : x{item.quantity} • {item.isGroupage ? 'Tarif Groupage' : 'Tarif Standard'}</div>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-white">
                        {(item.totalPriceXOF || (item.unitPriceXOF ? item.unitPriceXOF * item.quantity : 0)).toLocaleString('fr-FR')} FCFA
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: CLIENT & PAIEMENT */}
              {orderDetailTab === 'client' && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-white/5 space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Coordonnées Client</span>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Nom Complet :</span>
                      <strong className="text-white">{selectedOrder.customer?.fullName || 'N/A'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Téléphone :</span>
                      <strong className="text-white font-mono">{selectedOrder.customer?.phone || 'N/A'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Email :</span>
                      <strong className="text-white">{selectedOrder.customer?.email || 'client@sinosenegal.com'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Ville :</span>
                      <strong className="text-white">{selectedOrder.customer?.city || 'Dakar'}</strong>
                    </div>
                  </div>

                  {/* Payment Details Section */}
                  <div className="p-4 rounded-2xl bg-white/5 space-y-2.5 border border-blue-900/30">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Détails du Paiement</span>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Montant Facturé :</span>
                      <strong className="text-emerald-300 font-mono font-bold">
                        {(selectedOrder?.totalXOF || 0).toLocaleString('fr-FR')} FCFA
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Statut du Paiement :</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        selectedOrder.paymentStatus === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : selectedOrder.paymentStatus === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {selectedOrder.paymentStatus === 'paid' ? '✓ Payé' : selectedOrder.paymentStatus === 'pending' ? '⏳ En attente' : selectedOrder.paymentStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Passerelle / Fournisseur :</span>
                      <span className="font-bold text-blue-300">GeniusPay Checkout</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Méthode de Règlement :</span>
                      <span className="text-white uppercase font-mono font-bold">
                        {(selectedOrder.paymentMethod || 'wave').replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Référence Transaction :</span>
                      <span className="font-mono text-slate-300 text-[11px]">
                        GP-REF-{selectedOrder.trackingCode}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Date d'enregistrement :</span>
                      <span className="text-slate-300">{new Date(selectedOrder.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LOGISTIQUE */}
              {orderDetailTab === 'logistics' && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-2xl bg-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Mode d'Expédition</span>
                      <strong className="text-white uppercase">{selectedOrder.transportMode === 'air' ? 'Fret Aérien Express' : 'Fret Maritime'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Hub d'Arrivée</span>
                      <strong className="text-white">Hub Principal Dakar HQ</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Arrivée estimée</span>
                      <strong className="text-cyan-300 font-mono">{selectedOrder.estimatedArrivalDate || '12-18 jours'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: CHANGER LE STATUT LOGISTIQUE */}
              {orderDetailTab === 'status' && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
                  <span className="text-slate-300 font-bold block">Sélectionnez le nouveau statut :</span>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as TrackingStatus)}
                    className="w-full p-2.5 rounded-xl bg-[#050e26] border border-white/10 text-white"
                  >
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>

                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">Localisation de l'étape</label>
                    <input
                      type="text"
                      value={newStatusLocation}
                      onChange={e => setNewStatusLocation(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">Note explicative (optionnelle)</label>
                    <input
                      type="text"
                      placeholder="Ex: Dédouanement validé, colis en cours de tri..."
                      value={newStatusNote}
                      onChange={e => setNewStatusNote(e.target.value)}
                      className="w-full p-2 rounded-xl bg-white/5 border border-white/10 text-white"
                    />
                  </div>

                  <button
                    onClick={handleUpdateStatus}
                    className="w-full py-2.5 rounded-xl bg-[#2A6DFF] hover:bg-blue-500 text-white font-bold shadow-md transition-all flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enregistrer la mise à jour</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-blue-900/40">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs"
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
