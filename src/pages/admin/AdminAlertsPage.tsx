import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminAlert } from '../../types';
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  ArrowRight,
  ShieldCheck,
  Info,
  DollarSign,
  Truck,
  Package,
  Layers
} from 'lucide-react';

export const AdminAlertsPage: React.FC = () => {
  const { alerts, markAlertAsRead, navigate } = useApp();
  const [filterType, setFilterType] = useState('all');

  const filtered = alerts.filter(a => {
    if (filterType === 'all') return true;
    return a.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a183d] p-5 rounded-2xl border border-blue-900/50 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Centre d'Alertes & Gestion des Risques</h1>
            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {alerts.filter(a => !a.isRead).length} non traitées
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Détection proactive des retards de fret, des écarts de coût fournisseur, des surpoids colis et des clôtures de quotas.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['all', 'danger', 'warning', 'info'].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              filterType === t
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-[#0a183d] text-slate-400 hover:text-white border border-blue-900/40'
            }`}
          >
            {t === 'all' ? 'Toutes les alertes' : t === 'danger' ? 'Critiques (Rouge)' : t === 'warning' ? 'Avertissements (Orange)' : 'Informations'}
          </button>
        ))}
      </div>

      {/* List of Alerts */}
      <div className="space-y-3">
        {filtered.map(alert => (
          <div
            key={alert.id}
            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              alert.type === 'danger'
                ? 'bg-rose-950/30 border-rose-800/40'
                : alert.type === 'warning'
                ? 'bg-amber-950/30 border-amber-800/40'
                : 'bg-blue-950/30 border-blue-800/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                alert.type === 'danger' ? 'bg-rose-500/20 text-rose-400' :
                alert.type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">{alert.title}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">{alert.timestamp}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {alert.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {!alert.isRead && (
                <button
                  onClick={() => markAlertAsRead(alert.id)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Marquer traitée
                </button>
              )}
              <button
                onClick={() => {
                  markAlertAsRead(alert.id);
                  navigate(alert.linkTo);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <span>Résoudre</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
