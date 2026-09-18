import React, { useState } from 'react';
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
  ChevronRight
} from 'lucide-react';

export const AdminLogisticsPage: React.FC = () => {
  const { orders, groupages, hubLocations, navigate } = useApp();

  const stages = [
    { id: 'china_hub', label: '1. Hubs Chine', count: 18, location: 'Guangzhou / Yiwu' },
    { id: 'consolidation', label: '2. Empotage Export', count: 12, location: 'Entrepôt Transit' },
    { id: 'freight_departed', label: '3. Fret en Transit', count: 32, location: 'En Vol / Port' },
    { id: 'customs', label: '4. Douane Gaindé', count: 9, location: 'Port Autonome / AIBD' },
    { id: 'hub_dakar', label: '5. Hub Dakar HQ', count: 24, location: 'Dakar Ouest Foire' },
    { id: 'delivered', label: '6. Livré Client', count: 188, location: 'Sénégal Complet' }
  ];

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a1945] p-5 rounded-3xl border border-blue-900/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">Supervision Logistique & Hubs</h1>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Corridor Chine ➔ Sénégal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Suivi des flux de fret international, dédouanement et capacité de stockage des entrepôts.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/hub')}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2A6DFF] hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <Warehouse className="w-4 h-4" />
          <span>Scanner & Réception Hub</span>
        </button>
      </div>

      {/* 2. SIX PIPELINE STAGES (LEVEL 1 OVERVIEW) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stages.map(stage => (
          <div
            key={stage.id}
            className="p-4 rounded-2xl bg-[#0a1945] border border-blue-900/40 shadow-md flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-300 truncate">{stage.label}</span>
              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
            </div>

            <div className="my-1">
              <div className="text-2xl font-black text-white font-mono">{stage.count}</div>
              <div className="text-[10px] text-slate-400">colis & lots</div>
            </div>

            <div className="text-[10px] text-slate-400 border-t border-blue-900/40 pt-1.5 truncate">
              📍 {stage.location}
            </div>
          </div>
        ))}
      </div>

      {/* 3. HUBS CAPACITY & PERFORMANCE */}
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
    </div>
  );
};
