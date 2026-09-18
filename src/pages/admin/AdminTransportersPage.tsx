import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Carrier } from '../../types';
import {
  Truck,
  Plane,
  Ship,
  Search,
  Plus,
  DollarSign,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const AdminTransportersPage: React.FC = () => {
  const { carriers, updateCarrier, showToast } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a183d] p-5 rounded-2xl border border-blue-900/50 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Lignes Transporteurs & Transitaires</h1>
            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {carriers.length} transporteurs sous contrat
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gérez les grilles tarifaires au kilo (aérien) et au mètre cube CBM (maritime) utilisées dans les calculs automatiques de marge.
          </p>
        </div>
      </div>

      {/* Grid of Carriers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {carriers.map(c => (
          <div
            key={c.id}
            className="p-5 rounded-2xl bg-[#0a183d] border border-blue-900/50 hover:border-cyan-500/50 transition-all shadow-md space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {c.type === 'air' ? <Plane className="w-5 h-5" /> : <Ship className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{c.name}</h3>
                    <span className="text-[10px] text-slate-400 font-semibold">{c.route}</span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                  Actif
                </span>
              </div>

              {/* Rates Breakdown */}
              <div className="mt-4 p-3.5 rounded-xl bg-[#06102b] border border-blue-900/40 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Tarif Contractuel :</span>
                  <strong className="text-emerald-300 font-mono text-sm">
                    {c.type === 'air' ? `${c.ratePerKgUSD} $ / kg` : `${c.ratePerCBM_USD} $ / CBM`}
                  </strong>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>Délai Moyen Constaté :</span>
                  <strong className="text-white font-mono">{c.estimatedDays}</strong>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>Poids / Volume Minimum :</span>
                  <strong className="text-slate-200 font-mono">{c.minWeightKg || c.minCBM || 1} {c.type === 'air' ? 'kg' : 'CBM'}</strong>
                </div>
              </div>
            </div>

            {/* Contacts */}
            <div className="pt-2 border-t border-blue-900/40 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Contact : {c.contactPhone}</span>
              <span className="text-blue-300 font-semibold">Taux à jour</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
