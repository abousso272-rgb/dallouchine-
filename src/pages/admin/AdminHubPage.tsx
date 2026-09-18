import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Warehouse,
  QrCode,
  Search,
  CheckCircle2,
  Package,
  MapPin,
  Send,
  AlertCircle,
  Truck,
  ArrowRight
} from 'lucide-react';

export const AdminHubPage: React.FC = () => {
  const { orders, updateOrderStatus, hubLocations, showToast } = useApp();
  const [scanCode, setScanCode] = useState('');
  const [shelfLocation, setShelfLocation] = useState('Rayon A-12');
  const [scannedOrder, setScannedOrder] = useState<any | null>(null);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanCode.trim()) return;

    const ord = orders.find(
      o => (o?.trackingCode || '').toLowerCase() === (scanCode || '').toLowerCase().trim()
    );

    if (ord) {
      setScannedOrder(ord);
      showToast('success', 'Colis Identifié', `${ord.trackingCode} - ${ord.customer.fullName}`);
    } else {
      showToast('error', 'Code Inconnu', `Aucun colis trouvé pour le code ${scanCode}`);
      setScannedOrder(null);
    }
  };

  const handleMarkReceived = () => {
    if (!scannedOrder) return;
    updateOrderStatus(
      scannedOrder.id,
      'hub_dakar_received',
      `Hub Dakar HQ (Emplacement ${shelfLocation})`,
      `Colis réceptionné au Hub Dakar et rangé en ${shelfLocation}.`
    );
    showToast('success', 'Emplacement Enregistré', `Colis assigné à ${shelfLocation}`);
  };

  const handleMarkReadyPickup = () => {
    if (!scannedOrder) return;
    updateOrderStatus(
      scannedOrder.id,
      'ready_for_pickup',
      'Hub Dakar HQ (Comptoir Retrait)',
      'Votre colis est prêt pour retrait. Présentez votre code AWP.'
    );
    showToast('success', 'Client Notifié', 'SMS et notification WhatsApp de retrait envoyés.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a183d] p-5 rounded-2xl border border-blue-900/50 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Hub Sénégal : Réception, Scan & Retraits</h1>
            <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Hub Dakar Ouest Foire
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Scannez les colis arrivant du fret, assignez un rayon physique et déclenchez automatiquement les avis de retrait aux clients.
          </p>
        </div>
      </div>

      {/* Scanner Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scan Input & Action (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0a183d] p-5 rounded-2xl border border-blue-900/50 shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-blue-900/40 text-xs font-black text-teal-300 uppercase tracking-wider">
            <QrCode className="w-4 h-4" />
            <span>Scanner un Code AWP ou Code-Barres Colis</span>
          </div>

          <form onSubmit={handleScan} className="flex gap-2">
            <input
              type="text"
              value={scanCode}
              onChange={e => setScanCode(e.target.value)}
              placeholder="Ex: AWP-10482 ou scannez au pistolet laser..."
              className="flex-1 bg-[#06102b] border border-blue-900/60 rounded-xl px-4 py-3 text-sm text-white font-mono font-bold placeholder-slate-500 focus:outline-hidden focus:border-teal-500"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Valider Scan</span>
            </button>
          </form>

          {/* Scanned Order Details */}
          {scannedOrder && (
            <div className="p-4 rounded-xl bg-[#06102b] border border-teal-500/40 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-teal-300 text-sm">{scannedOrder.trackingCode}</span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{scannedOrder.customer.fullName}</h3>
                  <div className="text-xs text-slate-400 font-mono">{scannedOrder.customer.phone}</div>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold border border-emerald-500/30">
                  {scannedOrder.currentStatus}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white/5 text-xs text-slate-300">
                Articles : {scannedOrder.items.map((i: any) => `${i.productName || i.product?.name || 'Article'} (x${i.quantity})`).join(', ')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">Affecter Rayon / Étagère</label>
                  <input
                    type="text"
                    value={shelfLocation}
                    onChange={e => setShelfLocation(e.target.value)}
                    className="w-full bg-[#0a183d] border border-blue-900/60 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-hidden text-xs"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={handleMarkReceived}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
                  >
                    1. Réceptionner au Rayon
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkReadyPickup}
                    className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all"
                  >
                    2. Déclarer Prêt au Retrait
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hub Jauges (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0a183d] p-5 rounded-2xl border border-blue-900/50 shadow-lg space-y-4">
          <div className="text-xs font-black text-white uppercase tracking-wider pb-2 border-b border-blue-900/40 flex items-center gap-1.5">
            <Warehouse className="w-4 h-4 text-blue-400" />
            <span>Capacité des Hubs Régionaux</span>
          </div>

          <div className="space-y-3">
            {hubLocations.map(hub => {
              const pct = Math.round((hub.activeParcelsCount / hub.maxCapacity) * 100);

              return (
                <div key={hub.id} className="p-3.5 rounded-xl bg-[#06102b] border border-blue-900/40 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{hub.name}</span>
                    <span className="font-mono text-teal-300 font-bold">{pct}% occupé</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{hub.address}</span>
                    <span className="font-mono">{hub.activeParcelsCount} / {hub.maxCapacity} colis</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
