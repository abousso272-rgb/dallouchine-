import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentApiClient } from '../../services/paymentApiClient';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  Filter,
  DollarSign,
  AlertCircle,
  XCircle,
  RotateCw,
  Eye,
  ShieldCheck,
  Building,
  Smartphone,
  ExternalLink,
  Send
} from 'lucide-react';

export const AdminPaymentsPage: React.FC = () => {
  const { payments: contextPayments, showToast } = useApp();

  const [backendPayments, setBackendPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'expired'>('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);

  const fetchBackendPayments = async () => {
    setLoading(true);
    try {
      const res = await PaymentApiClient.getAdminPayments();
      if (res.success && res.payments) {
        setBackendPayments(res.payments);
      }
    } catch (err) {
      console.warn('Failed to load live backend payments:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBackendPayments();
  }, []);

  // Fusionner les paiements du backend et les données mock contextuelles
  const allPayments = [
    ...backendPayments,
    ...contextPayments.map(p => ({
      id: p.id,
      orderId: p.orderId,
      orderCode: p.orderCode || (p as any).orderOrGroupageCode || 'AWP-N/A',
      customerName: p.customerName || (p as any).clientName || 'Client',
      customerPhone: p.customerPhone || '+221 77 000 00 00',
      customerEmail: (p as any).customerEmail || 'client@sinosenegal.com',
      amount: p.amountXOF || (p as any).amount || 0,
      currency: 'XOF',
      provider: 'GeniusPay',
      providerTransactionId: (p as any).providerTransactionId || (p as any).transactionRef || `gp_tx_${p.id}`,
      providerReference: p.reference || `GP-REF-${p.id}`,
      method: p.method || 'wave',
      status: p.status === 'received' || p.status === 'confirmed' ? 'paid' : p.status,
      createdAt: p.date ? `${p.date}T${p.time || '12:00:00'}Z` : new Date().toISOString()
    }))
  ];

  // Dédoublonnage par ID / providerTransactionId
  const uniquePaymentsMap = new Map<string, any>();
  for (const p of allPayments) {
    const key = p.providerTransactionId || p.id;
    if (!uniquePaymentsMap.has(key)) {
      uniquePaymentsMap.set(key, p);
    }
  }
  const paymentsList = Array.from(uniquePaymentsMap.values());

  const filtered = paymentsList.filter(p => {
    const q = (search || '').toLowerCase();
    const matchSearch =
      (p?.orderCode || '').toLowerCase().includes(q) ||
      (p?.customerName || '').toLowerCase().includes(q) ||
      (p?.customerPhone || '').toLowerCase().includes(q) ||
      (p?.providerTransactionId || '').toLowerCase().includes(q) ||
      (p?.providerReference || '').toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchMethod = methodFilter === 'all' || p.method === methodFilter;

    return matchSearch && matchStatus && matchMethod;
  });

  const totalPaid = paymentsList
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const countPaid = paymentsList.filter(p => p.status === 'paid').length;
  const countPending = paymentsList.filter(p => p.status === 'pending').length;
  const countFailed = paymentsList.filter(p => p.status === 'failed' || p.status === 'cancelled').length;

  const handleSimulateWebhook = async (orderId: string, eventType: string) => {
    setIsSimulatingWebhook(true);
    try {
      const res = await PaymentApiClient.simulateSandboxWebhook(orderId, eventType);
      if (res.success) {
        showToast('success', 'Webhook Simulé', `Événement ${eventType} envoyé avec signature HMAC.`);
        await fetchBackendPayments();
        if (selectedPayment) {
          setSelectedPayment((prev: any) => ({
            ...prev,
            status: eventType === 'payment_success' ? 'paid' : 'failed'
          }));
        }
      } else {
        showToast('error', 'Erreur Webhook', res.errorMessage || 'Échec de simulation');
      }
    } catch {
      showToast('error', 'Erreur Webhook', 'Erreur de communication');
    }
    setIsSimulatingWebhook(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a183d] p-5 rounded-2xl border border-blue-900/50 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Gestion des Paiements GeniusPay</h1>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Encaissé : {(totalPaid || 0).toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Passerelle de paiement unifiée • Rapprochement automatique Wave, Orange Money, Free Money & Cartes Bancaires.
          </p>
        </div>

        <button
          onClick={fetchBackendPayments}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser les paiements</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#0a183d] border border-blue-900/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Encaissé Certifié</span>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            {(totalPaid || 0).toLocaleString('fr-FR')} FCFA
          </div>
          <span className="text-[10px] text-slate-500">{countPaid} transactions réussies</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a183d] border border-amber-900/50">
          <span className="text-[10px] font-bold text-amber-300 uppercase">En Attente de Règlement</span>
          <div className="text-xl font-black text-amber-400 font-mono mt-1">{countPending}</div>
          <span className="text-[10px] text-slate-500">Sessions ouvertes</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a183d] border border-rose-900/50">
          <span className="text-[10px] font-bold text-rose-300 uppercase">Échecs / Annulations</span>
          <div className="text-xl font-black text-rose-400 font-mono mt-1">{countFailed}</div>
          <span className="text-[10px] text-slate-500">Paiements non finalisés</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a183d] border border-indigo-900/50">
          <span className="text-[10px] font-bold text-indigo-300 uppercase">Passerelle Active</span>
          <div className="text-sm font-black text-white font-mono mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>GeniusPay Checkout</span>
          </div>
          <span className="text-[10px] text-slate-400">HMAC-SHA256 Webhooks activés</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a183d] p-3 rounded-2xl border border-blue-900/50">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'all', label: 'Tous' },
              { id: 'paid', label: 'Payés' },
              { id: 'pending', label: 'En attente' },
              { id: 'failed', label: 'Échoués' },
              { id: 'cancelled', label: 'Annulés' },
              { id: 'refunded', label: 'Remboursés' },
              { id: 'expired', label: 'Expirés' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-[#FF4500] text-white shadow-md'
                  : 'bg-blue-950/60 text-slate-300 hover:bg-blue-900/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher commande, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#071330] border border-blue-900/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-hidden focus:border-[#FF4500]"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-[#0a183d] rounded-2xl border border-blue-900/50 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#071330] border-b border-blue-900/60 text-[10px] uppercase tracking-wider text-slate-300 font-bold">
                <th className="py-3.5 px-4">Commande</th>
                <th className="py-3.5 px-3">Client</th>
                <th className="py-3.5 px-3">Montant</th>
                <th className="py-3.5 px-3">Fournisseur</th>
                <th className="py-3.5 px-3">Méthode</th>
                <th className="py-3.5 px-3">Réf. GeniusPay</th>
                <th className="py-3.5 px-3">Statut</th>
                <th className="py-3.5 px-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/30">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Aucune transaction trouvée pour ces critères.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-950/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-[#FF4500]">
                      {p.orderCode}
                    </td>
                    <td className="py-3.5 px-3 text-slate-200">
                      <div className="font-bold">{p.customerName}</div>
                      <div className="text-[10px] text-slate-400">{p.customerPhone}</div>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-black text-emerald-300 whitespace-nowrap">
                      {(p.amount || 0).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">
                      <span className="bg-blue-950/80 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded text-[10px] font-bold">
                        {p.provider || 'GeniusPay'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-slate-800 text-slate-200 border border-white/10">
                        {(p.method || 'wave').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                      {p.providerReference || p.providerTransactionId || 'N/A'}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                          p.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : p.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : p.status === 'failed'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : p.status === 'cancelled'
                            ? 'bg-slate-700 text-slate-300 border border-slate-600'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {p.status === 'paid' ? '✓ Payé' : p.status === 'pending' ? '⏳ En attente' : p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="bg-blue-900/60 hover:bg-blue-800 text-blue-200 p-1.5 rounded-lg transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Détail de la Transaction Financière</h3>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg"
              >
                ✕ Fermer
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Commande</span>
                  <strong className="text-blue-400 font-mono text-sm">{selectedPayment.orderCode}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Montant Encaissé</span>
                  <strong className="text-emerald-400 font-mono text-sm">
                    {(selectedPayment.amount || 0).toLocaleString('fr-FR')} FCFA
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Statut Paiement</span>
                  <span className="font-bold text-emerald-300 capitalize">{selectedPayment.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Méthode</span>
                  <span className="font-bold text-slate-200 uppercase">{selectedPayment.method}</span>
                </div>
              </div>

              <div className="space-y-2 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/40">
                <div className="flex justify-between">
                  <span className="text-slate-400">Client :</span>
                  <span className="font-bold">{selectedPayment.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Téléphone :</span>
                  <span className="font-mono">{selectedPayment.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fournisseur :</span>
                  <span className="font-bold text-blue-300">{selectedPayment.provider || 'GeniusPay'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction ID GeniusPay :</span>
                  <span className="font-mono text-[11px] text-slate-300">{selectedPayment.providerTransactionId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Référence Marchand :</span>
                  <span className="font-mono text-[11px] text-slate-300">{selectedPayment.providerReference || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date d'enregistrement :</span>
                  <span className="text-slate-300">{new Date(selectedPayment.createdAt).toLocaleString('fr-FR')}</span>
                </div>
              </div>

              {/* Sandbox Simulation Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block">
                  Outils de Test Sandbox (Simulation Webhook HMAC) :
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={isSimulatingWebhook}
                    onClick={() => handleSimulateWebhook(selectedPayment.orderId || selectedPayment.id, 'payment_success')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Simuler Webhook Succès</span>
                  </button>

                  <button
                    disabled={isSimulatingWebhook}
                    onClick={() => handleSimulateWebhook(selectedPayment.orderId || selectedPayment.id, 'payment_failed')}
                    className="bg-rose-700 hover:bg-rose-600 text-white font-bold text-[11px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Simuler Webhook Échec</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
