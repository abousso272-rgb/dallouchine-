import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sourcer } from '../../types';
import {
  Users2,
  Search,
  Star,
  MapPin,
  MessageSquare,
  DollarSign,
  Award,
  CheckCircle2,
  Briefcase
} from 'lucide-react';

export const AdminSourcersPage: React.FC = () => {
  const { sourcers } = useApp();
  const [search, setSearch] = useState('');

  const filtered = sourcers.filter(s => {
    const q = (search || '').toLowerCase();
    return (
      (s?.name || '').toLowerCase().includes(q) ||
      (s?.city || '').toLowerCase().includes(q) ||
      (s?.specialties || []).some(sp => (sp || '').toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a183d] p-5 rounded-2xl border border-blue-900/50 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Sourceurs & Auditeurs Locaux en Chine</h1>
            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {sourcers.length} agents sur le terrain
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Agents basés à Guangzhou, Yiwu et Shenzhen chargés de visiter les usines, inspecter les lots et négocier les meilleurs tarifs.
          </p>
        </div>
      </div>

      {/* Grid of Sourcers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(src => (
          <div
            key={src.id}
            className="p-5 rounded-2xl bg-[#0a183d] border border-blue-900/50 hover:border-cyan-500/50 transition-all shadow-md space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={src.avatarUrl}
                    alt={src.name}
                    className="w-12 h-12 rounded-xl object-cover border border-cyan-500/40 shrink-0"
                  />
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{src.name}</span>
                      {src.status === 'active' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>{src.city} (Marchés locaux)</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-400 font-black text-sm font-mono">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{src.rating}</span>
                  </div>
                  <span className="text-[9px] text-slate-400">Note Qualité</span>
                </div>
              </div>

              {/* Specialties */}
              <div className="mt-3">
                <div className="text-[10px] text-slate-400 font-semibold mb-1">Spécialités Produits :</div>
                <div className="flex flex-wrap gap-1">
                  {(src.specialties || []).map((sp, idx) => (
                    <span key={idx} className="text-[9px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-semibold">
                      {sp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-blue-900/40 text-center text-xs">
                <div className="p-2 rounded-xl bg-[#06102b]">
                  <div className="text-[9px] text-slate-400">Lots Traités</div>
                  <div className="font-black text-white font-mono">{src.ordersHandled}</div>
                </div>
                <div className="p-2 rounded-xl bg-[#06102b]">
                  <div className="text-[9px] text-slate-400">Conformité</div>
                  <div className="font-black text-emerald-400 font-mono">{src.qualityRate}%</div>
                </div>
                <div className="p-2 rounded-xl bg-[#06102b]">
                  <div className="text-[9px] text-slate-400">Com. Négociée</div>
                  <div className="font-black text-blue-300 font-mono">{src.commissionRatePercent}%</div>
                </div>
              </div>
            </div>

            {/* WeChat & Direct Contact */}
            <div className="pt-2 border-t border-blue-900/40 flex items-center justify-between text-[11px]">
              <div className="text-slate-300 font-mono">
                WeChat : <span className="text-emerald-400 font-bold">{src.wechatId}</span>
              </div>
              <span className="text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 rounded border border-white/5 font-semibold">
                Depuis {src.joinedDate}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
