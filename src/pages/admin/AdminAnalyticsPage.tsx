import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Layers,
  Truck,
  ArrowUpRight,
  Filter,
  PieChart,
  Calendar
} from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const { products, orders, groupages } = useApp();
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | '1y'>('30d');

  const categoriesShare = [
    { label: 'Électronique & High-Tech', share: 42, color: '#3B82F6', totalXOF: 2037000 },
    { label: 'Maison & Électroménager', share: 26, color: '#10B981', totalXOF: 1261000 },
    { label: 'Mode, Beauté & Montres', share: 18, color: '#8B5CF6', totalXOF: 873000 },
    { label: 'Outillage & Énergie Solaire', share: 14, color: '#F59E0B', totalXOF: 679000 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a183d] p-5 rounded-2xl border border-blue-900/50 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Analytics Avancés & Intelligence d'Affaires</h1>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Business Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Indicateurs financiers clés, ventilation du chiffre d'affaires par catégorie et ratios de rentabilité logistique.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#050e26] p-1 rounded-xl border border-blue-900/60 shrink-0 self-start sm:self-auto">
          {(['30d', '90d', '1y'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                timeframe === tf ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf === '30d' ? '30 jours' : tf === '90d' ? '90 jours' : '1 an'}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0a183d] border border-blue-900/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Panier Moyen Client</span>
          <div className="text-xl font-black text-white font-mono mt-1">68 500 FCFA</div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span>+8.4% vs mois dernier</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a183d] border border-emerald-900/50">
          <span className="text-[10px] font-bold text-emerald-300 uppercase">Part de Fret dans le Prix</span>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">18.2%</div>
          <div className="text-[10px] text-slate-400">Optimisé par le groupage</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a183d] border border-cyan-900/50">
          <span className="text-[10px] font-bold text-cyan-300 uppercase">Taux de Remplissage Lots</span>
          <div className="text-xl font-black text-cyan-400 font-mono mt-1">84.5%</div>
          <div className="text-[10px] text-slate-400">Objectif 80% atteint</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0a183d] border border-purple-900/50">
          <span className="text-[10px] font-bold text-purple-300 uppercase">Taux de Réachat Client</span>
          <div className="text-xl font-black text-purple-400 font-mono mt-1">46.8%</div>
          <div className="text-[10px] text-emerald-400">Fidélisation élevée</div>
        </div>
      </div>

      {/* Category Breakdown & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-[#0a183d] border border-blue-900/50 shadow-lg space-y-4">
          <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-400" />
            <span>Répartition du Chiffre d'Affaires par Secteur</span>
          </h2>

          <div className="space-y-3 pt-2">
            {categoriesShare.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>{cat.label}</span>
                  <span className="font-mono text-white">{(cat.totalXOF || 0).toLocaleString('fr-FR')} FCFA ({cat.share}%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${cat.share}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0a183d] border border-blue-900/50 shadow-lg space-y-4">
          <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Top 5 Produits les Plus Rentables</span>
          </h2>

          <div className="divide-y divide-blue-900/40 text-xs">
            {products.slice(0, 5).map(p => (
              <div key={p.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img src={p.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  <div>
                    <div className="font-bold text-white truncate max-w-[200px]">{p.name}</div>
                    <div className="text-[10px] text-slate-400">{p.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-300">+{p.targetMarginPercent}% marge</div>
                  <div className="text-[10px] text-slate-400 font-mono">{(p.priceXOF || 0).toLocaleString('fr-FR')} FCFA</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
