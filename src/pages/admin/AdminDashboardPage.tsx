import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Layers,
  ArrowUpRight,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Package,
  Truck,
  ArrowRight,
  X,
  ExternalLink,
  Filter,
  Copy,
  Check,
  Eye,
  Warehouse,
  FileText
} from 'lucide-react';
import { Order } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const {
    navigate,
    orders = [],
    groupages = [],
    currentUser,
    b2bRequests = [],
    sourcingPipeline = []
  } = useApp();

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '3m' | '12m'>('30d');
  const [selectedOrderForPreview, setSelectedOrderForPreview] = useState<Order | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Dynamic "À faire" actionable tasks list with dismissal capability
  const [todoTasks, setTodoTasks] = useState([
    {
      id: 'task-orders-hub',
      title: '3 commandes à affecter au Hub',
      subtitle: 'Colis arrivés à Dakar nécessitant scan et mise en casier',
      badge: 'Urgent',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      type: 'orders',
      path: '/admin/hub'
    },
    {
      id: 'task-groupage-close',
      title: '2 groupages prêts à être commandés',
      subtitle: 'Objectif de volume atteint à 100% sur Shenzhen Tech',
      badge: 'Action',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      type: 'groupage',
      path: '/admin/groupages'
    },
    {
      id: 'task-b2b-quote',
      title: '1 demande de devis B2B en attente',
      subtitle: 'Conteneur 20ft Matériel Électrique à chiffrer sous 24h',
      badge: 'B2B',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      type: 'b2b',
      path: '/admin/b2b'
    },
    {
      id: 'task-sourcing-sample',
      title: 'Échantillon fournisseur à valider',
      subtitle: 'Rapport d’inspection reçu pour les Panneaux Solaires 450W',
      badge: 'Sourcing',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      type: 'sourcing',
      path: '/admin/sourcing'
    }
  ]);

  const dismissTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTodoTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Metrics based on timeframe
  const timeMultipliers = {
    '7d': { factor: 0.28, vs: '+12.1%', label: '7 derniers jours' },
    '30d': { factor: 1.0, vs: '+18.4%', label: '30 derniers jours' },
    '3m': { factor: 2.8, vs: '+24.6%', label: '3 derniers mois' },
    '12m': { factor: 9.8, vs: '+45.2%', label: '12 derniers mois' }
  };

  const curr = timeMultipliers[timeframe];
  const baseCA = 4850000;
  const baseMargin = 1420000;
  const activeGroupages = groupages.filter(g => g.status === 'open' || g.status === 'closing_soon');

  const totalCA = Math.round(baseCA * curr.factor);
  const totalMargin = Math.round(baseMargin * curr.factor);
  const totalOrdersCount = orders.length > 0 ? orders.length : 286;
  const marginPercent = ((totalMargin / totalCA) * 100).toFixed(1);

  // Single Main Consolidated Chart Data
  const chartPoints = [
    { label: timeframe === '7d' ? 'Lun-Mar' : timeframe === '12m' ? 'T1' : 'Semaine 1', ca: Math.round(totalCA * 0.18), margin: Math.round(totalMargin * 0.18), orders: 42 },
    { label: timeframe === '7d' ? 'Mer-Jeu' : timeframe === '12m' ? 'T2' : 'Semaine 2', ca: Math.round(totalCA * 0.24), margin: Math.round(totalMargin * 0.23), orders: 58 },
    { label: timeframe === '7d' ? 'Ven-Sam' : timeframe === '12m' ? 'T3' : 'Semaine 3', ca: Math.round(totalCA * 0.27), margin: Math.round(totalMargin * 0.28), orders: 69 },
    { label: timeframe === '7d' ? 'Dimanche' : timeframe === '12m' ? 'T4' : 'Semaine 4', ca: Math.round(totalCA * 0.31), margin: Math.round(totalMargin * 0.31), orders: 84 }
  ];
  const maxCA = Math.max(...chartPoints.map(p => p.ca));

  // Exactly 5 Recent Orders with optional status filtering
  const filteredRecentOrders = (orders || [])
    .filter(order => {
      if (orderStatusFilter === 'all') return true;
      if (orderStatusFilter === 'in_transit') return order.currentStatus === 'in_transit' || order.currentStatus === 'shipped_from_china';
      if (orderStatusFilter === 'delivered') return order.currentStatus === 'delivered';
      if (orderStatusFilter === 'processing') return order.currentStatus === 'received_in_china_hub' || order.currentStatus === 'customs_cleared';
      return true;
    })
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return { label: 'Livré', style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'in_transit':
      case 'shipped_from_china':
        return { label: 'En Transit', style: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'arrived_in_dakar_hub':
      case 'ready_for_pickup':
        return { label: 'Au Hub Dakar', style: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      default:
        return { label: 'En Traitement', style: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & OPERATIONAL STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a1945] p-5 rounded-3xl border border-blue-900/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Bonjour, {currentUser?.name?.split(' ')[0] || 'Amadou'}
            </h1>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Centre de Contrôle Opérationnel
            </span>
          </div>
          <p className="text-xs text-blue-200/80 mt-1">
            Pilotage des flux logistiques Chine → Sénégal • Taux : <strong className="text-white font-mono">1 CNY = 88.5 FCFA</strong>
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-[#050e26] p-1 rounded-2xl border border-blue-900/60 shrink-0 self-start sm:self-auto">
          {(['7d', '30d', '3m', '12m'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === tf
                  ? 'bg-[#FF4500] text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf === '7d' ? '7j' : tf === '30d' ? '30 jours' : tf === '3m' ? '3 mois' : '12 mois'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. EXACTLY 4 KEY KPIs AT TOP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Chiffre d'Affaires */}
        <div className="p-5 rounded-3xl bg-[#0a1945] border border-blue-900/40 shadow-md flex flex-col justify-between hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chiffre d'Affaires</span>
            <div className="p-2.5 rounded-2xl bg-orange-500/10 text-[#FF4500] border border-orange-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono-numeric tracking-tight">
              {(totalCA || 0).toLocaleString('fr-FR')} <span className="text-xs font-bold text-blue-400">FCFA</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs font-bold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{curr.vs}</span>
              <span className="text-[10px] text-slate-400 font-normal">vs période préc.</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Marge Nette */}
        <div className="p-5 rounded-3xl bg-[#0a1945] border border-emerald-900/40 shadow-md flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Marge Nette</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-300 font-mono-numeric tracking-tight">
              {(totalMargin || 0).toLocaleString('fr-FR')} <span className="text-xs font-bold text-emerald-400">FCFA</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs font-bold text-emerald-400">
              <span className="bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                {marginPercent}% de rentabilité
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Commandes en cours */}
        <div
          onClick={() => navigate('/admin/orders')}
          className="p-5 rounded-3xl bg-[#0a1945] border border-purple-900/40 shadow-md flex flex-col justify-between cursor-pointer hover:border-purple-500/50 hover:bg-[#0c1e52] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Commandes</span>
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono-numeric tracking-tight">
              {totalOrdersCount} <span className="text-xs font-normal text-slate-400">total</span>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs font-semibold text-purple-300">
              <span>98.5% livrées sans litige</span>
              <span className="text-[10px] text-purple-400 flex items-center font-bold">
                Gérer <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Groupages Actifs */}
        <div
          onClick={() => navigate('/admin/groupages')}
          className="p-5 rounded-3xl bg-[#0a1945] border border-cyan-900/40 shadow-md flex flex-col justify-between cursor-pointer hover:border-cyan-500/50 hover:bg-[#0c1e52] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Groupages Actifs</span>
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono-numeric tracking-tight">
              {activeGroupages.length} <span className="text-xs font-semibold text-cyan-300">lots ouverts</span>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs font-bold text-cyan-300">
              <span>Remplissage moy. 78%</span>
              <span className="text-[10px] text-cyan-400 flex items-center font-bold">
                Gérer <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECTION 'À FAIRE' DYNAMIQUE (TÂCHES PRIORITAIRES) */}
      <div className="bg-[#0a1945] rounded-3xl border border-blue-900/50 p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>À faire</span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2 py-0.5 rounded-full font-bold">
                {todoTasks.length}
              </span>
            </h2>
            <span className="text-xs text-slate-400 font-normal hidden md:inline">
              • Tâches prioritaires nécessitant une intervention administrative immédiate
            </span>
          </div>

          {todoTasks.length === 0 ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" /> Toutes les tâches prioritaires ont été traitées !
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              Cliquez sur une tâche pour la traiter directement
            </span>
          )}
        </div>

        {todoTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {todoTasks.map(task => (
              <div
                key={task.id}
                onClick={() => navigate(task.path)}
                className="p-4 rounded-2xl bg-[#050e26]/80 hover:bg-blue-950/60 border border-blue-900/40 hover:border-blue-500/50 cursor-pointer transition-all flex flex-col justify-between gap-3 group relative shadow-inner"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider font-mono shrink-0 ${task.badgeColor}">
                      {task.badge}
                    </span>
                    <button
                      onClick={(e) => dismissTask(task.id, e)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Marquer comme traité"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="text-xs font-black text-white group-hover:text-blue-300 transition-colors mt-2 leading-tight">
                    {task.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    {task.subtitle}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                  <span className="text-slate-400 text-[10px]">Action requise</span>
                  <span className="text-[#FF4500] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Traiter</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-[#050e26]/50 rounded-2xl border border-blue-900/30 space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-white">Aucune tâche urgente en attente</div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Tous les colis, clôtures de groupages et devis B2B sont à jour.
            </p>
          </div>
        )}
      </div>

      {/* 4. UNIQUE MAIN CONSOLIDATED CHART */}
      <div className="bg-[#0a1945] rounded-3xl border border-blue-900/50 p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-900/40">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#FF4500]" />
              <span>Aperçu Consolidé des Flux Financiers</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rapprochement Chiffre d'Affaires & Marge Nette ({curr.label})
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-[#FF4500]" />
              <span className="text-slate-300 font-medium">CA Brut</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-300 font-medium">Marge Nette</span>
            </div>
            <button
              onClick={() => navigate('/admin/analytics')}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 ml-auto sm:ml-2 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
            >
              <span>Analytics Détaillés</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* High-fidelity interactive consolidated bar chart */}
        <div className="bg-[#050e26] p-5 rounded-2xl border border-blue-900/30 space-y-4">
          <div className="grid grid-cols-4 gap-4 sm:gap-8 h-56 items-end pt-6 pb-2">
            {chartPoints.map((pt, idx) => {
              const heightCA = Math.max(15, Math.round((pt.ca / maxCA) * 100));
              const heightMargin = Math.max(10, Math.round((pt.margin / maxCA) * 100));

              return (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-4 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10 bg-slate-900/95 border border-blue-800 p-2.5 rounded-xl shadow-xl text-center whitespace-nowrap">
                    <div className="text-[11px] font-bold text-white">{pt.label}</div>
                    <div className="text-[10px] text-blue-300 font-mono mt-0.5">
                      CA : {(pt.ca || 0).toLocaleString('fr-FR')} FCFA
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono font-bold">
                      Marge : {(pt.margin || 0).toLocaleString('fr-FR')} FCFA ({pt.ca ? ((pt.margin / pt.ca) * 100).toFixed(0) : 0}%)
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {pt.orders || 0} commandes traitées
                    </div>
                  </div>

                  {/* Dual Bar Representation */}
                  <div className="w-full max-w-[80px] flex items-end justify-center gap-2 h-full">
                    <div
                      className="w-1/2 rounded-t-xl bg-[#FF4500] transition-all duration-300 group-hover:brightness-125 shadow-sm shadow-orange-500/20 relative"
                      style={{ height: `${heightCA}%` }}
                    >
                      <span className="sr-only">CA {pt.ca}</span>
                    </div>
                    <div
                      className="w-1/2 rounded-t-xl bg-emerald-500 transition-all duration-300 group-hover:brightness-125 shadow-sm shadow-emerald-500/20 relative"
                      style={{ height: `${heightMargin}%` }}
                    >
                      <span className="sr-only">Marge {pt.margin}</span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
                    {pt.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick Metrics Bar at bottom of chart */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-blue-900/30 text-xs">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Panier Moyen</span>
              <span className="font-mono font-bold text-white">48 500 FCFA</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Délai Moyen Chine→DKR</span>
              <span className="font-mono font-bold text-cyan-300">10 jours</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 col-span-2 sm:col-span-1 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Taux de Rapprochement</span>
              <span className="font-mono font-bold text-emerald-400">99.2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. RECENT ORDERS (EXACTLY 5) WITH FULL ACCESS OPTIONS */}
      <div className="bg-[#0a1945] rounded-3xl border border-blue-900/50 p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>5 Dernières Commandes</span>
                <span className="text-xs text-slate-400 font-normal">
                  (sur {orders.length} au total)
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Status Filter Pills */}
            <div className="flex items-center gap-1 bg-[#050e26] p-1 rounded-xl border border-blue-900/50 text-[11px]">
              <button
                onClick={() => setOrderStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  orderStatusFilter === 'all' ? 'bg-[#FF4500] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setOrderStatusFilter('in_transit')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  orderStatusFilter === 'in_transit' ? 'bg-blue-500/30 text-blue-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                En Transit
              </button>
              <button
                onClick={() => setOrderStatusFilter('delivered')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  orderStatusFilter === 'delivered' ? 'bg-emerald-500/30 text-emerald-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Livrées
              </button>
            </div>

            {/* Complete Access Button */}
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-xs font-bold text-white bg-[#FF4500] hover:bg-[#E03D00] px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/20 ml-auto sm:ml-2"
            >
              <span>Voir toutes les commandes ({orders.length})</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5 Orders Table / List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-blue-900/40 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-3">Code Suivi</th>
                <th className="pb-3 px-3">Client & Destination</th>
                <th className="pb-3 px-3">Articles & Détails</th>
                <th className="pb-3 px-3">Montant</th>
                <th className="pb-3 px-3">Statut</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/30">
              {filteredRecentOrders.map(order => {
                const badge = getStatusBadge(order.currentStatus);
                const itemsCount = (order?.items || []).reduce((acc, item) => acc + (item.quantity || 1), 0);

                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderForPreview(order)}
                    className="hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    {/* Tracking Code */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white group-hover:text-blue-300 transition-colors">
                          {order.trackingCode}
                        </span>
                        <button
                          onClick={(e) => copyToClipboard(order.trackingCode, e)}
                          className="text-slate-500 hover:text-white p-1 rounded transition-colors"
                          title="Copier le code de suivi"
                        >
                          {copiedCode === order.trackingCode ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {order.createdAt || 'Aujourd\'hui'}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{order?.customer?.fullName || 'Client Anonyme'}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>{order?.customer?.city || 'Dakar'}</span>
                        <span>•</span>
                        <span>{order?.customer?.phone}</span>
                      </div>
                    </td>

                    {/* Items */}
                    <td className="py-3 px-3 max-w-[240px]">
                      <div className="text-slate-300 truncate font-medium">
                        {(order?.items || []).map(i => `${i.productName || 'Article'} (x${i.quantity})`).join(', ')}
                      </div>
                      <div className="text-[10px] text-blue-300 mt-0.5">
                        {itemsCount} unité(s) • {order.deliveryType === 'home_delivery' ? 'À Domicile' : 'Retrait Hub'}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3">
                      <div className="font-mono-numeric font-black text-white text-sm">
                        {(order.totalXOF || 0).toLocaleString('fr-FR')} <span className="text-[10px] text-blue-400 font-normal">F</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-medium">
                        Payé via {order.paymentMethod === 'wave' ? 'Wave' : order.paymentMethod === 'orange_money' ? 'Orange Money' : 'Carte'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border inline-flex items-center gap-1 ${badge.style}`}>
                        {badge.label}
                      </span>
                    </td>

                    {/* Quick Access Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderForPreview(order);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-600/20 text-slate-300 hover:text-blue-300 border border-white/5 transition-colors"
                          title="Aperçu rapide"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/admin/orders');
                          }}
                          className="p-1.5 rounded-lg bg-[#FF4500]/10 hover:bg-[#FF4500] text-[#FF4500] hover:text-white border border-[#FF4500]/20 transition-all"
                          title="Gérer dans le module Commandes"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer with quick action links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-blue-900/40 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            <span>Raccourcis rapides :</span>
            <button
              onClick={() => navigate('/admin/hub')}
              className="text-cyan-300 hover:underline flex items-center gap-1 font-semibold"
            >
              <Warehouse className="w-3 h-3" />
              Scanner au Hub
            </button>
            <span>•</span>
            <button
              onClick={() => navigate('/admin/b2b')}
              className="text-blue-300 hover:underline flex items-center gap-1 font-semibold"
            >
              <FileText className="w-3 h-3" />
              Devis B2B ({b2bRequests.length})
            </button>
          </div>

          <button
            onClick={() => navigate('/admin/orders')}
            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 group"
          >
            <span>Accéder au tableau complet des commandes</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* QUICK PREVIEW MODAL FOR SELECTED ORDER */}
      {selectedOrderForPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1945] rounded-3xl border border-blue-900/60 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Commande {selectedOrderForPreview.trackingCode}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Passée le {selectedOrderForPreview.createdAt || '15/08/2026'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForPreview(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer & Delivery Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-[#050e26] p-3.5 rounded-2xl border border-blue-900/40">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Client</div>
                <div className="font-bold text-white mt-0.5">{selectedOrderForPreview.customer.fullName}</div>
                <div className="text-slate-400 text-[11px]">{selectedOrderForPreview.customer.phone}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Destination & Mode</div>
                <div className="font-bold text-white mt-0.5">{selectedOrderForPreview.customer.city}</div>
                <div className="text-blue-300 text-[11px]">
                  {selectedOrderForPreview.deliveryType === 'home_delivery' ? 'Livraison Domicile' : 'Retrait Hub Dakar'}
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Articles commandés ({(selectedOrderForPreview.items || []).length})
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {(selectedOrderForPreview.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}
                        alt=""
                        className="w-8 h-8 rounded-lg object-cover border border-white/10"
                      />
                      <div>
                        <div className="font-bold text-white truncate max-w-[200px]">
                          {item.productName || 'Produit'}
                        </div>
                        <div className="text-[10px] text-slate-400">Qté: {item.quantity} pcs</div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-white">
                      {(((item.unitPriceXOF || 0) * (item.quantity || 1)) || 0).toLocaleString('fr-FR')} F
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Amount & Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-blue-900/40">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Total Facturé</div>
                <div className="text-lg font-black text-white font-mono-numeric">
                  {(selectedOrderForPreview?.totalXOF || 0).toLocaleString('fr-FR')} FCFA
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedOrderForPreview(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setSelectedOrderForPreview(null);
                    navigate('/admin/orders');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20"
                >
                  <span>Gérer la commande</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
