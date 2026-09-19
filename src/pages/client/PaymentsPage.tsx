import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  CreditCard,
  Lock,
  ArrowRight,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Smartphone,
  Building,
  Hourglass,
  Plus,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Shield,
  Video,
  RotateCcw,
  Sparkles,
  Search,
  Wallet
} from 'lucide-react';
import { WaveLogo, OrangeMoneyLogo } from '../../components/common/PaymentOperatorLogos';

interface Transaction {
  id: string;
  ref: string;
  date: string;
  orderId: string;
  description: string;
  subDescription: string;
  method: 'wave' | 'orange_money' | 'bank';
  methodLabel: string;
  amount: number;
  status: 'released' | 'paid_port' | 'escrowed' | 'closed';
  statusLabel: string;
  type: 'acompte' | 'solde' | 'fret';
}

export const PaymentsPage: React.FC = () => {
  const { addToast, navigate, currentUser } = useApp();

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | 'acompte' | 'solde' | 'fret'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Payment Confirmation Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'wave' | 'om' | 'bank'>('wave');
  const [confirmationPhone, setConfirmationPhone] = useState(currentUser.phone || '+221 77 450 12 34');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Add Payment Method Modal State
  const [isAddMethodModalOpen, setIsAddMethodModalOpen] = useState(false);
  const [newMethodType, setNewMethodType] = useState<'wave' | 'om' | 'bank'>('wave');
  const [newMethodPhone, setNewMethodPhone] = useState('');

  // Mock Transactions Data
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'tx-1',
      ref: 'PAY-9821',
      date: '18 Juin 2026 • 14:32',
      orderId: 'CMD-2026-0048',
      description: 'Acompte usine 30%',
      subDescription: 'Lot 2x Motos Électriques Ningbo',
      method: 'wave',
      methodLabel: 'Wave (+221)',
      amount: 304800,
      status: 'released',
      statusLabel: 'Sécurisé & Débloqué usine',
      type: 'acompte'
    },
    {
      id: 'tx-2',
      ref: 'PAY-8742',
      date: '02 Juin 2026 • 09:15',
      orderId: 'CMD-2026-0031',
      description: 'Solde Fret Maritime LCL 40HQ',
      subDescription: 'Transit Guangzhou → Port Autonome Dakar',
      method: 'orange_money',
      methodLabel: 'Orange Money',
      amount: 185000,
      status: 'paid_port',
      statusLabel: 'Payé Port Dakar',
      type: 'fret'
    },
    {
      id: 'tx-3',
      ref: 'PAY-7619',
      date: '14 Mai 2026 • 11:20',
      orderId: 'CMD-2026-0024',
      description: 'Acompte ligne solaire TOPCon',
      subDescription: 'Sous séquestre compte bancaire tiers',
      method: 'bank',
      methodLabel: 'Virement CBAO',
      amount: 1450000,
      status: 'escrowed',
      statusLabel: 'Validé & Séquestré',
      type: 'acompte'
    },
    {
      id: 'tx-4',
      ref: 'PAY-6502',
      date: '27 Avril 2026 • 16:45',
      orderId: 'CMD-2026-0012',
      description: 'Frais inspection SGS Guangzhou',
      subDescription: 'Audit pré-embarquement machines industrielles',
      method: 'wave',
      methodLabel: 'Wave (+221)',
      amount: 75000,
      status: 'closed',
      statusLabel: 'Réglé & Clôturé',
      type: 'solde'
    }
  ]);

  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = activeFilter === 'all' || tx.type === activeFilter;
    const matchesSearch =
      tx.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.subDescription.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDownloadReceipt = (tx: Transaction) => {
    addToast({
      title: 'Reçu Fiscal Téléchargé',
      message: `Quittance officielle ${tx.ref} timbrée OHADA générée en PDF.`,
      type: 'success'
    });
  };

  const handleConfirmSoldePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPayment(true);

    setTimeout(() => {
      setIsSubmittingPayment(false);
      setIsPaymentModalOpen(false);

      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        ref: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
        date: "À l'instant",
        orderId: 'CMD-2026-0048',
        description: 'Solde usine 70% libéré',
        subDescription: 'Scellage conteneur Ningbo déclenché',
        method: selectedChannel === 'om' ? 'orange_money' : selectedChannel === 'bank' ? 'bank' : 'wave',
        methodLabel: selectedChannel === 'om' ? 'Orange Money' : selectedChannel === 'bank' ? 'Virement CBAO' : 'Wave Sénégal',
        amount: 711200,
        status: 'released',
        statusLabel: 'Solde Débloqué usine',
        type: 'solde'
      };

      setTransactions(prev => [newTx, ...prev]);

      addToast({
        title: 'Ordre de paiement transmis',
        message: 'Débit de 711 200 FCFA validé. Le conteneur Ningbo est désormais scellé pour chargement.',
        type: 'success'
      });
    }, 1200);
  };

  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddMethodModalOpen(false);
    addToast({
      title: 'Moyen de paiement ajouté',
      message: `${newMethodType === 'wave' ? 'Wave Sénégal' : newMethodType === 'om' ? 'Orange Money' : 'Compte bancaire CBAO'} certifié avec succès.`,
      type: 'success'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 flex flex-col gap-8 pb-20">
      {/* 1. Header Section with Breadcrumb & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[#FF4500] font-bold">
              Portail Financier Sécurisé
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF4500]" />
              Conformité OHADA & Séquestre Tiers
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0B192C] tracking-tight font-heading">
            Paiements & Sécurité Financière
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Gérez vos acomptes sous compte séquestre OHADA, soldes de fabrication et factures de transit maritime vers Dakar.
          </p>
        </div>

        {/* Quick Action Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/devis-documents')}
            className="h-10 sm:h-11 px-4 sm:px-5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Tous les reçus fiscaux</span>
          </button>
          <button
            onClick={() => setIsAddMethodModalOpen(true)}
            className="h-10 sm:h-11 px-4 sm:px-5 rounded-full bg-[#0B192C] hover:bg-[#1E3E62] text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FF8A00]" />
            <span>Ajouter un compte</span>
          </button>
        </div>
      </div>

      {/* 2. Top Financial KPI Summary Cards (Liquid Glass Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Regle */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-orange-100/50 blur-xl group-hover:scale-125 transition-transform pointer-events-none" />
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Réglé (2026)</span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF4500]">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-[#0B192C] tracking-tight font-mono">
              5 450 000 <span className="text-xs font-semibold text-slate-400">FCFA</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fonds engagés & validés</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Acomptes sous Sequestre */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-amber-100/50 blur-xl group-hover:scale-125 transition-transform pointer-events-none" />
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500">Acomptes sous Séquestre</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-[#FF8A00]">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-[#FF4500] tracking-tight font-mono">
              1 250 000 <span className="text-xs font-semibold text-slate-400">FCFA</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-ping" />
              <span>Protégés jusqu'à inspection vidéo</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Soldes a Liberer */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-blue-100/50 blur-xl group-hover:scale-125 transition-transform pointer-events-none" />
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500">Soldes à Libérer (15j)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Hourglass className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-[#0B192C] tracking-tight font-mono">
              711 200 <span className="text-xs font-semibold text-slate-400">FCFA</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
              <span className="px-2 py-0.5 rounded-full bg-blue-50 font-bold text-blue-700 font-mono text-[10px]">
                CMD-2026-0048
              </span>
              <span>Motos 2000W</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Moyens Enregistres */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500">Moyens Enregistrés</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00A3FF]" />
                Wave Sénégal
              </span>
              <span className="text-slate-400 font-mono text-[11px]">+221 77 450 •• ••</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF6600]" />
                Orange Money
              </span>
              <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.2 rounded">
                Principal
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                CBAO Pro Dakar
              </span>
              <span className="text-slate-500 text-[10px]">RIB Validé</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Pending Payment Action Card (Urgent / High Priority) */}
      <div className="relative overflow-hidden rounded-3xl bg-white border-2 border-orange-200 shadow-lg p-6 sm:p-8 flex flex-col lg:flex-row items-stretch gap-8">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-orange-100/40 blur-3xl pointer-events-none" />

        {/* Left Column: Order Context & Timeline */}
        <div className="flex-1 flex flex-col justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#FF4500] text-xs font-bold mb-3">
              <AlertCircle className="w-4 h-4" />
              <span>Paiement en attente de libération — Étape clé de fabrication</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-[#0B192C] font-heading">
                Commande CMD-2026-0048
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                2x Motos Électriques 2000W
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-2.5 max-w-xl leading-relaxed">
              L'inspection vidéo de fin d'assemblage à l'usine de Ningbo a été validée avec succès par nos inspecteurs Dallou Chine. Débloquez le solde restant (70%) pour sceller le conteneur et déclencher le chargement maritime à destination du Port Autonome de Dakar.
            </p>
          </div>

          {/* Milestones Graphic Timeline */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            <div className="flex flex-col gap-1">
              <div className="h-2 w-full rounded-full bg-emerald-500" />
              <span className="text-[11px] text-emerald-700 font-bold">Acompte 30%</span>
              <span className="text-[10px] text-slate-400">Encaissé Ningbo</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-2 w-full rounded-full bg-emerald-500" />
              <span className="text-[11px] text-emerald-700 font-bold">Inspection SGS</span>
              <span className="text-[10px] text-slate-400">Conforme 100%</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-2 w-full rounded-full bg-[#FF4500] animate-pulse" />
              <span className="text-[11px] text-[#FF4500] font-bold">Solde 70%</span>
              <span className="text-[10px] text-[#FF4500] font-semibold">En attente</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="h-2 w-full rounded-full bg-slate-200" />
              <span className="text-[11px] text-slate-400 font-medium">Fret Maritime</span>
              <span className="text-[10px] text-slate-400">Transit Dakar 35j</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                Date limite sans frais additionnels : <strong className="text-slate-900 font-bold">24 Juillet 2026</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#FF4500] font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Séquestre garanti jusqu'à l'émission du Connaissement (B/L)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Fast Payment Box */}
        <div className="w-full lg:w-96 rounded-2xl bg-slate-50 border border-slate-200/80 p-5 sm:p-6 flex flex-col justify-between relative z-10">
          <div>
            <span className="text-xs font-medium text-slate-500">Montant du solde à transférer</span>
            <div className="text-2xl sm:text-3xl font-black text-[#0B192C] tracking-tight mt-1 flex items-baseline gap-1.5 font-mono">
              711 200 <span className="text-base font-bold text-[#FF4500]">FCFA</span>
            </div>
            <span className="text-xs text-slate-400 block mt-0.5">≈ 8 673 RMB • Zéro frais de change</span>

            {/* Quick Payment Selector */}
            <div className="mt-4 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-700">Sélectionner le mode de débit :</span>

              <label
                onClick={() => setSelectedChannel('wave')}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                  selectedChannel === 'wave'
                    ? 'bg-white border-[#00A3FF] shadow-xs'
                    : 'bg-white/70 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="payment_channel"
                    checked={selectedChannel === 'wave'}
                    onChange={() => setSelectedChannel('wave')}
                    className="w-4 h-4 text-[#00A3FF] focus:ring-[#00A3FF]"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">Wave Sénégal</span>
                    <span className="text-[11px] text-slate-500 font-mono">+221 77 450 12 34 (Instantané)</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold">
                  0% Frais
                </span>
              </label>

              <label
                onClick={() => setSelectedChannel('om')}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                  selectedChannel === 'om'
                    ? 'bg-white border-[#FF6600] shadow-xs'
                    : 'bg-white/70 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="payment_channel"
                    checked={selectedChannel === 'om'}
                    onChange={() => setSelectedChannel('om')}
                    className="w-4 h-4 text-[#FF6600] focus:ring-[#FF6600]"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">Orange Money Pro</span>
                    <span className="text-[11px] text-slate-500">Confirmation OTP SMS</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-bold">
                  Instantané
                </span>
              </label>

              <label
                onClick={() => setSelectedChannel('bank')}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                  selectedChannel === 'bank'
                    ? 'bg-white border-slate-900 shadow-xs'
                    : 'bg-white/70 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="payment_channel"
                    checked={selectedChannel === 'bank'}
                    onChange={() => setSelectedChannel('bank')}
                    className="w-4 h-4 text-slate-900 focus:ring-slate-900"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">Virement CBAO / BOA</span>
                    <span className="text-[11px] text-slate-500">Guichet ou e-banking Dakar</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                  1-2h
                </span>
              </label>
            </div>
          </div>

          <div className="pt-5 flex flex-col gap-2">
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full h-12 rounded-full bg-gradient-to-r from-[#FF4500] to-[#FF8A00] hover:from-[#E03D00] hover:to-[#E67A00] text-white text-sm font-bold transition-all shadow-md shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Effectuer le paiement sécurisé</span>
            </button>
            <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Transactions auditées par la Commission Bancaire UMOA</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Detailed Transactions History Table */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
        {/* Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h2 className="text-xl sm:text-2xl font-black text-[#0B192C] font-heading">
              Historique des Transactions
            </h2>
            <span className="text-xs text-slate-500">
              Suivi en temps réel des encaissements, séquestres et quittances portuaires.
            </span>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-9 pl-9 pr-3 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-full bg-slate-100 overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-[#FF4500] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tous les flux
              </button>
              <button
                onClick={() => setActiveFilter('acompte')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === 'acompte'
                    ? 'bg-[#FF4500] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Acomptes séquestre
              </button>
              <button
                onClick={() => setActiveFilter('solde')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === 'solde'
                    ? 'bg-[#FF4500] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Soldes usines
              </button>
              <button
                onClick={() => setActiveFilter('fret')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === 'fret'
                    ? 'bg-[#FF4500] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fret & Douane Dakar
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 rounded-l-xl">Référence & Date</th>
                <th className="py-3 px-4">Commande</th>
                <th className="py-3 px-4">Description & Étape</th>
                <th className="py-3 px-4">Moyen de règlement</th>
                <th className="py-3 px-4">Montant</th>
                <th className="py-3 px-4">Statut Séquestre</th>
                <th className="py-3 px-4 rounded-r-xl text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 font-mono">{tx.ref}</span>
                      <span className="text-[11px] text-slate-400">{tx.date}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-800">
                      {tx.orderId}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col max-w-xs">
                      <span className="font-semibold text-slate-900 truncate">{tx.description}</span>
                      <span className="text-xs text-slate-500 truncate">{tx.subDescription}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                      {tx.method === 'wave' ? (
                        <span className="w-2 h-2 rounded-full bg-[#00A3FF]" />
                      ) : tx.method === 'orange_money' ? (
                        <span className="w-2 h-2 rounded-full bg-[#FF6600]" />
                      ) : (
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>{tx.methodLabel}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-black text-slate-900 font-mono">
                      {tx.amount.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">FCFA</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        tx.status === 'released'
                          ? 'bg-emerald-50 text-emerald-800'
                          : tx.status === 'paid_port'
                          ? 'bg-blue-50 text-blue-800'
                          : tx.status === 'escrowed'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{tx.statusLabel}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDownloadReceipt(tx)}
                      className="inline-flex items-center gap-1 text-[#FF4500] hover:text-[#E03D00] font-bold text-xs py-1.5 px-3 rounded-full hover:bg-orange-50 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Reçu PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footnote / Pagination Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Affichage de {filteredTransactions.length} transaction(s)</span>
            <span>•</span>
            <span>Devise de référence : Franc CFA (BCEAO)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-700 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-slate-900 font-bold text-xs">1 / 1</span>
            <button className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-700 cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Security & Reassurance Block (Bento Layout) */}
      <div className="rounded-3xl bg-slate-50 border border-slate-200/80 p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-orange-100/30 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wider text-[#FF4500] font-bold">
              Garantie & Séquestre Financier
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0B192C] font-heading tracking-tight">
              Comment fonctionne la protection de vos fonds avec Dallou Chine ?
            </h2>
            <p className="text-sm text-slate-600 max-w-3xl">
              Importez de Chine sans crainte de perte de capital. Nous appliquons les standards de cautionnement juridique les plus stricts de la zone OHADA et de l'UMOA.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-900 text-xs font-bold shadow-xs border border-slate-200 shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#FF4500]" />
            <span>Séquestre certifié BCEAO</span>
          </div>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          {/* Pillar 1 */}
          <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group">
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF4500] group-hover:bg-[#FF4500] group-hover:text-white transition-all">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0B192C]">Compte séquestre tiers agréé</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Vos acomptes ne sont jamais versés directement au fournisseur chinois sans garantie. Ils sont immobilisés sur un compte de cantonnement institutionnel à Dakar régi par le droit OHADA.
              </p>
            </div>
            <div className="text-xs text-[#FF4500] font-bold flex items-center gap-1">
              <span>Fonds protégés à 100%</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group">
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF4500] group-hover:bg-[#FF4500] group-hover:text-white transition-all">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0B192C]">Déblocage conditionné aux vidéos</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Le paiement du solde de fabrication (70%) n'est rendu accessible à l'usine qu'après validation complète du rapport vidéo 4K et de l'audit de métrologie effectués par nos équipes à Guangzhou ou Ningbo.
              </p>
            </div>
            <div className="text-xs text-[#FF4500] font-bold flex items-center gap-1">
              <span>Audit usine préalable obligatoire</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group">
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF4500] group-hover:bg-[#FF4500] group-hover:text-white transition-all">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0B192C]">Remboursement intégral garanti</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                En cas de défaillance avérée de l'usine chinoise, retard contractuel excessif ou non-conformité critique du matériel avant chargement maritime, vos fonds vous sont immédiatement restitués sans pénalités.
              </p>
            </div>
            <div className="text-xs text-[#FF4500] font-bold flex items-center gap-1">
              <span>Clause contractuelle résolutoire</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Trust Badges Row */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-slate-500 text-xs border-t border-slate-200/60">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#FF4500]" />
            <span>Protocole d'échange sécurisé SSL 256-bits</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#FF4500]" />
            <span>Accord-cadre Chambre de Commerce Sino-Africaine</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-[#FF4500]" />
            <span>Cellule litiges financiers Dakar : +221 33 800 00 00</span>
          </div>
        </div>
      </div>

      {/* MODAL 1: Confirmation de Paiement du Solde */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B192C]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#FF4500] flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0B192C]">Confirmer le Déblocage</h3>
                  <span className="text-xs text-slate-500">Autorisation pour CMD-2026-0048</span>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-4 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Bénéficiaire :</span>
                <span className="font-bold text-slate-900">Compte Séquestre Dallou Chine • Ningbo</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Solde usine 70% :</span>
                <span className="font-black text-slate-900 font-mono">711 200 FCFA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Frais de transfert :</span>
                <span className="font-bold text-emerald-600">0 FCFA (Inclus)</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                <span className="text-slate-500">Mode sélectionné :</span>
                <span className="font-bold text-[#FF4500]">
                  {selectedChannel === 'om' ? 'Orange Money' : selectedChannel === 'bank' ? 'Virement CBAO' : 'Wave Sénégal'}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmSoldePayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Numéro de confirmation mobile money (+221) :
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={confirmationPhone}
                    onChange={e => setConfirmationPhone(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF4500]"
                  />
                  <ShieldCheck className="w-5 h-5 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-orange-50 text-[11px] text-slate-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#FF4500] shrink-0 mt-0.5" />
                <span>
                  Une requête de débit va être envoyée sur votre téléphone. Votre conteneur sera scellé dès acceptation de la transaction.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="flex-1 h-11 rounded-full bg-gradient-to-r from-[#FF4500] to-[#FF8A00] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPayment ? (
                    <span>Traitement...</span>
                  ) : (
                    <>
                      <span>Confirmer 711 200 F</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Ajouter un moyen de paiement */}
      {isAddMethodModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B192C]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF4500] flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#0B192C]">Ajouter un Moyen de Paiement</h3>
              </div>
              <button
                onClick={() => setIsAddMethodModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPaymentMethod} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Type de compte :</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMethodType('wave')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      newMethodType === 'wave'
                        ? 'border-[#00A3FF] bg-sky-50 text-[#00A3FF]'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <span>Wave</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMethodType('om')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      newMethodType === 'om'
                        ? 'border-[#FF6600] bg-orange-50 text-[#FF6600]'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <span>Orange Money</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMethodType('bank')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      newMethodType === 'bank'
                        ? 'border-slate-900 bg-slate-100 text-slate-900'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <span>CBAO / BOA</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {newMethodType === 'bank' ? 'Numéro de compte / IBAN Dakar :' : 'Numéro de téléphone (+221) :'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={newMethodType === 'bank' ? 'SN08 SN12 3456 7890 1234 56' : '+221 7X XXX XX XX'}
                  value={newMethodPhone}
                  onChange={e => setNewMethodPhone(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF4500]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMethodModalOpen(false)}
                  className="flex-1 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-full bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
