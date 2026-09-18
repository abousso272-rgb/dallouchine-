import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GroupBuyCard } from '../../components/common/GroupBuyCard';
import { SectionHeader } from '../../components/common/SectionHeader';
import {
  Flame,
  Clock,
  Plane,
  Ship,
  Users2,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Layers
} from 'lucide-react';

export const GroupagesPage: React.FC = () => {
  const { groupages, navigate } = useApp();
  const [filterMode, setFilterMode] = useState<'all' | 'air' | 'sea'>('all');

  const filteredGroupages = groupages.filter(g => {
    if (filterMode === 'air') return g.transportMode === 'air';
    if (filterMode === 'sea') return g.transportMode === 'sea';
    return true;
  });

  return (
    <div className="space-y-12 pb-16">
      {/* Top Hero Banner */}
      <div className="glass-panel-dark rounded-3xl p-8 sm:p-12 text-white border border-white/10 relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 fill-amber-300" />
            <span>Achats Groupés Négociés Chine ➔ Sénégal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Mutualisez vos commandes,{' '}
            <span className="text-amber-400">économisez jusqu'à 45%.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            En regroupant les achats de plusieurs clients sur un même conteneur ou vol cargo, nous obtenons les tarifs de gros des usines 1688 et divisons les frais de fret international.
          </p>
        </div>

        {/* Live Groupage Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10 relative z-10">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <span className="text-slate-400 text-xs block">Groupages Actifs</span>
            <strong className="text-2xl font-black text-white font-mono-numeric">
              {groupages.length} lots
            </strong>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <span className="text-slate-400 text-xs block">Économie Moyenne</span>
            <strong className="text-2xl font-black text-amber-400 font-mono-numeric">
              -35% à -45%
            </strong>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <span className="text-slate-400 text-xs block">Participants ce mois</span>
            <strong className="text-2xl font-black text-emerald-400 font-mono-numeric">
              420+ acheteurs
            </strong>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <span className="text-slate-400 text-xs block">Prochains départs</span>
            <strong className="text-2xl font-black text-blue-400 font-mono-numeric">
              Chaque Mardi & Jeudi
            </strong>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel bg-white/70 p-3.5 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              filterMode === 'all'
                ? 'bg-[#0D2C7A] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tous les groupages ({groupages.length})
          </button>

          <button
            onClick={() => setFilterMode('air')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              filterMode === 'air'
                ? 'bg-[#0D2C7A] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Plane className="w-3.5 h-3.5 text-[#2A6DFF]" />
            <span>Fret Aérien (12-18j)</span>
          </button>

          <button
            onClick={() => setFilterMode('sea')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              filterMode === 'sea'
                ? 'bg-[#0D2C7A] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Ship className="w-3.5 h-3.5 text-cyan-600" />
            <span>Maritime Volumineux (30-45j)</span>
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Dédouanement Gaindé Dakar inclus
        </span>
      </div>

      {/* Active Groupages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGroupages.map(grp => (
          <GroupBuyCard key={grp.id} groupage={grp} />
        ))}
      </div>

      {/* How Groupages Work */}
      <div className="glass-panel bg-white/80 rounded-3xl p-8 border border-white shadow-sm space-y-6">
        <SectionHeader
          badge="Fonctionnement Garanti"
          title="Comment fonctionne un achat groupé SinoSenegal ?"
          subtitle="Simple, sans risque et transparent de l'inscription à la livraison."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="w-8 h-8 rounded-full bg-[#0D2C7A] text-white font-bold flex items-center justify-center">
              1
            </span>
            <strong className="text-base text-[#0D2C7A] block font-bold">Vous réservez vos unités</strong>
            <p className="text-slate-600">
              Sélectionnez la quantité désirée et effectuez votre paiement sécurisé (Wave, OM, Carte). Votre place dans le lot est garantie.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="w-8 h-8 rounded-full bg-[#0D2C7A] text-white font-bold flex items-center justify-center">
              2
            </span>
            <strong className="text-base text-[#0D2C7A] block font-bold">Consolidation & Départ Usine</strong>
            <p className="text-slate-600">
              Dès que l'objectif du groupage est atteint ou à la date de clôture, notre équipe en Chine lance l'inspection et expédie le lot complet.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
              3
            </span>
            <strong className="text-base text-emerald-800 block font-bold">Réception au Hub Dakar</strong>
            <p className="text-slate-600">
              Vous êtes notifié dès l'arrivée du lot à Dakar pour un retrait gratuit dans le Hub de votre choix ou une livraison à domicile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
