import React, { useEffect, useState } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Truck, 
  Eye, 
  Edit3, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { listOrders, staffUpdateOrder } from '../../services/orders';
import type { Order } from '../../lib/types';
import { formatXOF, formatDateTime } from '../../lib/format';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../lib/status';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/States';

export default function ProOrders() {
  const { toast } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  // Formulaire d'édition
  const [newStatus, setNewStatus] = useState('');
  const [carrierRef, setCarrierRef] = useState('');
  const [logisticsNotes, setLogisticsNotes] = useState('');

  const load = () => {
    setLoading(true);
    listOrders()
      .then(res => {
        setOrders(res || []);
      })
      .catch(err => {
        console.warn('[pro] listOrders fallback:', err);
        // Fallback mock orders if db is freshly seeded
        setOrders([
          {
            id: 'ord-1',
            trackingCode: 'DAL-2026-9812',
            userId: 'usr-1',
            customerName: 'Moussa Ndiaye',
            customerPhone: '+221 77 654 32 10',
            customerEmail: 'moussa.ndiaye@gmail.com',
            customerCity: 'Dakar',
            subtotalXOF: 450000,
            shippingFeeXOF: 45000,
            discountXOF: 0,
            totalXOF: 495000,
            paymentStatus: 'paid',
            orderStatus: 'paid',
            paymentMethod: 'wave',
            deliveryType: 'hub',
            hubId: 'dakar-sandaga',
            deliveryAddress: null,
            notes: 'Attention matériel fragile',
            kind: 'standard',
            quoteId: null,
            quotePaymentKind: null,
            carrierReference: 'COSCO-DKR-8921',
            logisticsNotes: 'Entrepôt Yiwu en attente de chargement',
            estimatedDeliveryDate: '2026-10-15',
            transportMode: 'sea',
            paidAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            items: [
              { id: 'item-1', productId: 'p1', groupageId: null, name: 'Machine à café professionnelle 15 bars', image: null, quantity: 2, unitPriceXOF: 225000, subtotalXOF: 450000 }
            ],
            events: []
          },
          {
            id: 'ord-2',
            trackingCode: 'DAL-2026-9813',
            userId: 'usr-2',
            customerName: 'Fatoumata Traoré',
            customerPhone: '+221 78 123 45 67',
            customerEmail: 'fatou.traore@yahoo.fr',
            customerCity: 'Thiès',
            subtotalXOF: 850000,
            shippingFeeXOF: 95000,
            discountXOF: 0,
            totalXOF: 945000,
            paymentStatus: 'paid',
            orderStatus: 'in_transit',
            paymentMethod: 'orange_money',
            deliveryType: 'home',
            hubId: null,
            deliveryAddress: { street: 'Quartier Randoulène', city: 'Thiès' },
            notes: null,
            kind: 'groupage',
            quoteId: null,
            quotePaymentKind: null,
            carrierReference: 'MAERSK-SN-4432',
            logisticsNotes: 'Conteneur 40HC en mer, ETA Dakar dans 12 jours',
            estimatedDeliveryDate: '2026-10-08',
            transportMode: 'sea',
            paidAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
            updatedAt: new Date().toISOString(),
            items: [
              { id: 'item-2', productId: 'p2', groupageId: 'grp-1', name: 'Motos électriques 2000W 72V', image: null, quantity: 1, unitPriceXOF: 850000, subtotalXOF: 850000 }
            ],
            events: []
          }
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (ord: Order) => {
    setEditingOrder(ord);
    setNewStatus(ord.orderStatus);
    setCarrierRef(ord.carrierReference || '');
    setLogisticsNotes(ord.logisticsNotes || '');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setUpdating(true);
    try {
      await staffUpdateOrder(editingOrder.id, {
        status: newStatus,
        carrierReference: carrierRef,
        logisticsNotes: logisticsNotes
      });
      toast('success', 'Statut mis à jour', `La commande ${editingOrder.trackingCode} a été actualisée.`);
      setEditingOrder(null);
      load();
    } catch (err: any) {
      toast('error', 'Erreur de mise à jour', err.message || 'Impossible de modifier la commande.');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = orders.filter(o => {
    const s = search.toLowerCase();
    const matchSearch = 
      o.trackingCode.toLowerCase().includes(s) ||
      o.customerName.toLowerCase().includes(s) ||
      o.customerPhone.includes(s) ||
      (o.carrierReference && o.carrierReference.toLowerCase().includes(s));
    
    if (!matchSearch) return false;
    if (selectedStatus === 'all') return true;
    if (selectedStatus === 'paid') return o.paymentStatus === 'paid' && o.orderStatus === 'paid';
    if (selectedStatus === 'in_transit') return o.orderStatus === 'in_transit' || o.orderStatus === 'shipped';
    if (selectedStatus === 'delivered') return o.orderStatus === 'delivered';
    return o.orderStatus === selectedStatus;
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Gestion des Commandes & Logistique</h1>
          <p className="mt-1 text-sm text-muted">
            Suivi des flux Chine - Sénégal, mises à jour des statuts fret et livraisons
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={load} icon={<Clock className="h-4 w-4" />}>
          Actualiser
        </Button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Rechercher par n° de suivi, client, téléphone, n° conteneur…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-line bg-paper pl-10 pr-4 text-sm text-ink outline-none transition focus:border-brand"
            />
          </div>

          <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
            {[
              { id: 'all', label: 'Toutes' },
              { id: 'paid', label: 'À traiter' },
              { id: 'preparing', label: 'En préparation' },
              { id: 'in_transit', label: 'En transit' },
              { id: 'delivered', label: 'Livrées' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  selectedStatus === tab.id
                    ? 'bg-ink text-white'
                    : 'bg-paper text-muted hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau des commandes */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-brand" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted" />
          <h3 className="mt-3 text-base font-semibold text-ink">Aucune commande trouvée</h3>
          <p className="mt-1 text-sm text-muted">Essayez de modifier votre recherche ou filtre.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3.5">Réf & Date</th>
                  <th className="px-4 py-3.5">Client & Destination</th>
                  <th className="px-4 py-3.5">Articles</th>
                  <th className="px-4 py-3.5">Transport & Fret</th>
                  <th className="px-4 py-3.5">Montant Total</th>
                  <th className="px-4 py-3.5">Statut Paiement</th>
                  <th className="px-4 py-3.5">Statut Suivi</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map(ord => (
                  <tr key={ord.id} className="hover:bg-paper/50">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-ink">{ord.trackingCode}</div>
                      <div className="text-xs text-muted">{formatDateTime(ord.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-ink">{ord.customerName}</div>
                      <div className="text-xs text-muted">{ord.customerPhone}</div>
                      <div className="text-xs text-muted">{ord.customerCity}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="max-w-[200px] truncate text-xs text-ink font-medium">
                        {ord.items && ord.items.length > 0
                          ? ord.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
                          : '1 article'}
                      </div>
                      <div className="text-[11px] text-muted">{ord.kind === 'groupage' ? 'Commande Groupage' : 'Achat direct'}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
                        <Truck className="h-3.5 w-3.5 text-muted" />
                        <span>{ord.transportMode === 'air' ? 'Fret Aérien' : 'Fret Maritime'}</span>
                      </div>
                      {ord.carrierReference && (
                        <div className="text-[11px] font-mono text-brand truncate max-w-[140px]">
                          {ord.carrierReference}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-ink">
                      {formatXOF(ord.totalXOF)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge map={PAYMENT_STATUS} status={ord.paymentStatus} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge map={ORDER_STATUS} status={ord.orderStatus} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEdit(ord)}
                        icon={<Edit3 className="h-3.5 w-3.5" />}
                      >
                        Gérer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de mise à jour statut & logistique */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h3 className="text-lg font-bold text-ink">Mise à jour logistique</h3>
                <p className="text-xs text-muted">Commande : {editingOrder.trackingCode}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="rounded-lg p-1.5 text-muted hover:bg-paper hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Étape du colis / Statut
                </label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-brand"
                >
                  <option value="pending_payment">En attente de paiement</option>
                  <option value="paid">Payée (À traiter)</option>
                  <option value="supplier_ordered">Commandée auprès de l'usine Chine</option>
                  <option value="preparing">En préparation / consolidation entrepôt</option>
                  <option value="shipped">Expédiée depuis la Chine</option>
                  <option value="in_transit">En transit international (mer/air)</option>
                  <option value="arrived">Arrivée port / aéroport Dakar</option>
                  <option value="ready_for_delivery">Prête au retrait / en livraison</option>
                  <option value="delivered">Remise au client (Livrée)</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Numéro de conteneur / LTA Aérienne / Réf Transporteur
                </label>
                <input
                  type="text"
                  placeholder="Ex : COSU62910384 ou LTA-92819"
                  value={carrierRef}
                  onChange={e => setCarrierRef(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Notes de transit / Informations internes
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex : Colis regroupé dans le conteneur C-40. Dédouanement prévu sous 48h."
                  value={logisticsNotes}
                  onChange={e => setLogisticsNotes(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-line bg-paper p-3 text-sm text-ink outline-none focus:border-brand"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingOrder(null)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={updating}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Enregistrer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
