import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { B2BRequest } from '../../types';
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
  ChevronRight
} from 'lucide-react';

export const AdminB2BPage: React.FC = () => {
  const { b2bRequests, updateB2BStatus, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReq, setSelectedReq] = useState<B2BRequest | null>(null);

  const filtered = b2bRequests.filter(req => {
    const q = (search || '').toLowerCase();
    const matchSearch =
      (req?.code || '').toLowerCase().includes(q) ||
      (req?.productName || '').toLowerCase().includes(q) ||
      (req?.contactName || '').toLowerCase().includes(q) ||
      (req?.companyName || '').toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a1945] p-5 rounded-3xl border border-blue-900/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">Demandes B2B & Projets sur-mesure</h1>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {b2bRequests.length} dossiers
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gérez les demandes de cotation gros volume pour commerçants, revendeurs et entreprises.
          </p>
        </div>
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
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#2A6DFF]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {[
            { id: 'all', label: 'Toutes' },
            { id: 'under_review', label: 'En Analyse' },
            { id: 'quote_sent', label: 'Devis Envoyé' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-[#2A6DFF] text-white shadow-md'
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
            onClick={() => setSelectedReq(req)}
            className="p-5 rounded-3xl bg-[#0a1945] border border-blue-900/40 hover:border-blue-500/50 transition-all shadow-lg space-y-4 flex flex-col justify-between cursor-pointer group"
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
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  req.status === 'quote_sent'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {req.status === 'quote_sent' ? 'Devis Envoyé' : 'En Analyse'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 p-3 rounded-2xl bg-white/5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Entreprise :</span>
                  <strong className="text-white">{req.companyName || 'Particulier Pro'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantité :</span>
                  <strong className="text-white font-mono">{req.targetQuantity} pcs</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Budget Cible :</span>
                  <strong className="text-emerald-300 font-mono">{req.budgetUSD} $</strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 line-clamp-2 italic">
                &ldquo;{req.description}&rdquo;
              </p>
            </div>

            <div className="pt-3 border-t border-blue-900/40 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400 font-mono">{req.createdAt}</span>
              <span className="text-blue-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                <span>Traiter</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Drawer */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-[#0a1945] h-full shadow-2xl border-l border-blue-900/50 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                    {selectedReq.code}
                  </span>
                  <h2 className="text-base font-black text-white">{selectedReq.productName}</h2>
                </div>
                <button
                  onClick={() => setSelectedReq(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Client Contact</span>
                  <strong className="text-white">{selectedReq.contactName} ({selectedReq.phone})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Société</span>
                  <strong className="text-white">{selectedReq.companyName || 'Non spécifié'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Volume Demandé</span>
                  <strong className="text-white font-mono">{selectedReq.targetQuantity} unités</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Budget Estimé</span>
                  <strong className="text-emerald-300 font-mono">{selectedReq.budgetUSD} USD</strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 space-y-2 text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Cahier des charges</span>
                <p className="text-slate-200 leading-relaxed">{selectedReq.description}</p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/50 space-y-3 text-xs">
                <span className="text-blue-300 font-bold block">Actions Commerciales</span>
                <button
                  onClick={() => {
                    updateB2BStatus(selectedReq.id, 'quote_sent');
                    showToast('success', 'Devis Envoyé', `Devis pour ${selectedReq.productName} transmis.`);
                    setSelectedReq(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#2A6DFF] hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>Marquer le devis comme envoyé</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-blue-900/40">
              <button
                onClick={() => setSelectedReq(null)}
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
