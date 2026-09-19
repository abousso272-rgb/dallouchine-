import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Package,
  Ship,
  FileText,
  Lock,
  PlusCircle,
  LayoutGrid,
  CheckCircle2,
  Calendar,
  Compass,
  ArrowRight,
  Video,
  Download,
  MessageCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCheck,
  Anchor,
  SunMedium,
  Truck,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const ClientDashboardPage: React.FC = () => {
  const { currentUser, navigate, addToast } = useApp();

  const handleDownloadReport = () => {
    addToast({
      title: 'Téléchargement démarré',
      message: 'Rapport d\'inspection vidéo usine CMD-0048 (MP4 1080p - 48 Mo).',
      type: 'success'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 flex flex-col gap-8 pb-20">
      {/* 1. HEADER BIENVENUE & PROFIL */}
      <div className="relative overflow-hidden rounded-3xl bg-white/95 border border-slate-200/80 shadow-md p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#FF4500]/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 sm:gap-5 z-10">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#0B192C] to-[#1E3E62] p-1 shadow-md border border-[#FF4500]/30">
              <div className="w-full h-full rounded-[14px] bg-[#0B192C] flex items-center justify-center overflow-hidden text-white font-black text-xl sm:text-2xl font-mono">
                {currentUser.name
                  ? currentUser.name
                      .split(' ')
                      .map(w => w[0])
                      .slice(0, 2)
                      .join('')
                  : 'AD'}
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center text-white">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0B192C] tracking-tight">
                Bonjour, {currentUser.name || 'Amadou Diallo'}
              </h1>
              <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[#0B192C] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse" />
                Client Vérifié B2B
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Société Sahel Mobility SARL • Dakar, Sénégal
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-[#FF4500]" />
              <span>
                Sourceur Dédié : <strong className="text-[#0B192C] font-semibold">Jean-Marc Chen</strong> (Bureau Guangzhou)
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto z-10">
          <button
            onClick={() => navigate('/sourcing')}
            className="flex-1 sm:flex-none h-11 sm:h-12 px-5 sm:px-6 rounded-xl bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 hover:scale-[1.02] transition-transform cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouvelle demande de sourcing +</span>
          </button>

          <button
            onClick={() => navigate('/groupages')}
            className="flex-1 sm:flex-none h-11 sm:h-12 px-5 sm:px-6 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-[#0B192C] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-slate-200 transition-colors cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4 text-[#FF4500]" />
            <span>Catalogue groupages</span>
          </button>
        </div>
      </div>

      {/* 2. CARTES STATISTIQUES LIQUID GLASS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div
          onClick={() => navigate('/suivi')}
          className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-orange-200 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Commandes en cours</span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 group-hover:bg-[#FF4500] group-hover:text-white text-[#FF4500] flex items-center justify-center transition-colors">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="text-2xl font-black text-[#0B192C]">2 actives</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold">
                1 en mer
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold">
                1 usine
              </span>
            </div>
          </div>
        </div>

        {/* Stat 2 */}
        <div
          onClick={() => navigate('/groupages')}
          className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-orange-200 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Groupages rejoints</span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 group-hover:bg-[#FF4500] group-hover:text-white text-[#FF4500] flex items-center justify-center transition-colors">
              <Ship className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="text-2xl font-black text-[#0B192C]">1 conteneur</span>
            <p className="text-xs text-slate-500 mt-2 truncate font-medium">Moto Électrique 2000W</p>
          </div>
        </div>

        {/* Stat 3 */}
        <div
          onClick={() => navigate('/devis-documents')}
          className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-orange-200 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Devis en attente</span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 group-hover:bg-[#FF4500] group-hover:text-white text-[#FF4500] flex items-center justify-center transition-colors">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="text-2xl font-black text-[#0B192C]">1 cotation prête</span>
            <div className="flex items-center gap-1.5 mt-2 text-emerald-600 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ligne packaging 10k pcs</span>
            </div>
          </div>
        </div>

        {/* Stat 4 */}
        <div
          onClick={() => navigate('/paiements')}
          className="rounded-2xl bg-white p-5 sm:p-6 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Acomptes &amp; Séquestre</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white text-emerald-600 flex items-center justify-center transition-colors">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="text-2xl font-black text-[#0B192C]">1 250 000 FCFA</span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-700">Fonds sécurisés à 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BLOC CENTRAL : EXPÉDITION PHARE EN DIRECT */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-md p-6 sm:p-8 lg:p-10 flex flex-col gap-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#FF4500] text-[11px] uppercase tracking-wider font-bold">
                Expédition en direct
              </span>
              <span className="text-xs font-mono text-slate-500 font-semibold">Réf: CMD-2026-0048</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0B192C] mt-2 tracking-tight">
              Conteneur Dédié 40HQ — Ningbo vers Port de Dakar
            </h2>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-[#0B192C] flex items-center gap-2">
              <Ship className="w-4 h-4 text-[#FF4500]" />
              Navire: <strong>CMA CGM DAKAR EXPRESS</strong>
            </span>
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              ETA: 18 Août 2026
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Image & Détails Cargaison (5 cols) */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="w-full sm:w-40 h-32 rounded-xl overflow-hidden relative shrink-0 shadow-sm bg-slate-200">
              <img
                src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80"
                alt="Motos électriques en caisse conteneur"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#0B192C]/85 text-white text-[10px] font-bold">
                2 Unités
              </span>
            </div>

            <div className="flex flex-col gap-1 w-full">
              <span className="text-[10px] text-[#FF4500] font-black uppercase tracking-wider">
                Marchandise Certifiée
              </span>
              <h3 className="text-sm font-black text-[#0B192C]">
                Lot de 2x Moto Électrique 2000W LFP
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Inclus batteries LFP 72V 45Ah, chargeurs rapides, casques et pièces d'usure.
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] text-emerald-700 font-bold">
                  Inspection Qualité Validée (SGS)
                </span>
              </div>
            </div>
          </div>

          {/* Tracker Interactif (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF4500] animate-ping" />
                <span className="text-sm font-black text-[#0B192C]">En transit maritime</span>
              </div>
              <span className="text-xs font-bold text-[#FF4500]">Étape 5 sur 7 complétée</span>
            </div>

            {/* Progress gauge */}
            <div className="relative w-full py-1">
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-[#FF4500] to-amber-400 rounded-full shadow-xs"
                  style={{ width: '71%' }}
                />
              </div>

              {/* Steps row */}
              <div className="flex justify-between items-start mt-3 text-center text-[10px] sm:text-[11px]">
                <div className="flex flex-col items-center gap-1 w-1/5">
                  <CheckCheck className="w-4 h-4 text-[#FF4500]" />
                  <span className="text-[#0B192C] font-bold">Usine Ningbo</span>
                </div>
                <div className="flex flex-col items-center gap-1 w-1/5">
                  <CheckCheck className="w-4 h-4 text-[#FF4500]" />
                  <span className="text-[#0B192C] font-bold">Chargement</span>
                </div>
                <div className="flex flex-col items-center gap-1 w-1/5">
                  <CheckCheck className="w-4 h-4 text-[#FF4500]" />
                  <span className="text-[#0B192C] font-bold">Douane Chine</span>
                </div>
                <div className="flex flex-col items-center gap-1 w-1/5">
                  <div className="w-5 h-5 rounded-full bg-[#FF4500] text-white flex items-center justify-center shadow-xs">
                    <Ship className="w-3 h-3" />
                  </div>
                  <span className="text-[#FF4500] font-black">Atlantique Sud</span>
                </div>
                <div className="flex flex-col items-center gap-1 w-1/5 opacity-50">
                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                    <Anchor className="w-3 h-3" />
                  </div>
                  <span className="text-slate-500 font-semibold">Port de Dakar</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Position satellite actualisée il y a 42 min • Vitesse 18.4 nœuds</span>
              </div>

              <button
                onClick={() => navigate('/tracking?code=CMD-2026-0048')}
                className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B192C] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
              >
                <span>Suivre la cargaison (GPS &amp; Documents)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF4500]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. GRILLE INFÉRIEURE À 2 COLONNES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche : Mes Demandes Récentes (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-6 h-full">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-[#0B192C]">
                    Mes Demandes Récentes
                  </h3>
                  <p className="text-xs text-slate-500">Sourcing sur-mesure &amp; cotations industrielles</p>
                </div>
                <button
                  onClick={() => navigate('/sourcing')}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500"
                  title="Nouvelle demande"
                >
                  <PlusCircle className="w-4 h-4 text-[#FF4500]" />
                </button>
              </div>

              <div className="flex flex-col gap-3.5">
                {/* Demande 1 */}
                <div className="p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                      <SunMedium className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#FF4500]">#SRC-892</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full font-bold">
                          Devis disponible
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#0B192C] mt-1">
                        Panneaux solaires 580W TOPCon
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        3 usines de Wuxi auditées par notre équipe • Devis FOB Ningbo reçu
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/demande-devis?id=SRC-892')}
                    className="h-9 px-4 rounded-xl bg-[#0B192C] hover:bg-[#FF4500] text-white text-xs font-bold shrink-0 transition-colors cursor-pointer self-end sm:self-auto"
                  >
                    Consulter
                  </button>
                </div>

                {/* Demande 2 */}
                <div className="p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#FF4500]">#COT-412</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full font-bold">
                          En négociation
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#0B192C] mt-1">
                        Tricycles utilitaires à benne hydraulique
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Contrôle motorisation 250cc • Négociation tarifaire volume (10 unités)
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/demande-devis?id=COT-412')}
                    className="h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B192C] text-xs font-bold shrink-0 transition-colors cursor-pointer self-end sm:self-auto"
                  >
                    Détails
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Total: 4 dossiers actifs en 2026</span>
              <button
                onClick={() => navigate('/sourcing')}
                className="text-xs font-bold text-[#FF4500] hover:underline flex items-center gap-1"
              >
                <span>Voir toutes mes demandes</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Mon Bureau de Liaison Chine & Assistance (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-6 h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-black text-[#0B192C]">
                  Bureau de Liaison &amp; Support
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  En ligne
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Votre équipe bilingue coordonne directement vos commandes sur les fuseaux de Dakar (GMT) et Guangzhou (UTC+8).
              </p>

              {/* Contacts dédiés */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#0B192C] text-white flex items-center justify-center font-bold text-xs mb-2 shadow-2xs">
                    LW
                  </div>
                  <span className="text-xs font-bold text-[#0B192C]">Li Wei</span>
                  <span className="text-[10px] text-slate-500">Desk Guangzhou (Chine)</span>
                  <span className="text-[9px] font-bold text-emerald-600 mt-1">Audit Usines &amp; Lab</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#FF4500] text-white flex items-center justify-center font-bold text-xs mb-2 shadow-2xs">
                    MB
                  </div>
                  <span className="text-xs font-bold text-[#0B192C]">Mariama Ba</span>
                  <span className="text-[10px] text-slate-500">Desk Dakar (Almadies)</span>
                  <span className="text-[9px] font-bold text-emerald-600 mt-1">Douanes &amp; Logistique</span>
                </div>
              </div>

              {/* Rapport d'inspection vidéo téléchargeable */}
              <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/60 flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF4500] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#0B192C]">
                      Dernière inspection usine (CMD-0048)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Vidéo test banc batterie • MP4 1080p (48 Mo)
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleDownloadReport}
                  className="w-9 h-9 rounded-xl bg-white text-[#FF4500] hover:bg-[#FF4500] hover:text-white border border-orange-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                  title="Télécharger le rapport"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action WhatsApp 7j/7 */}
            <div className="flex flex-col gap-2">
              <a
                href="https://wa.me/221338000000?text=Bonjour%20Dallou%20Chine,%20je%20souhaite%20suivre%20mon%20dossier%20CMD-2026-0048."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Assistance directe WhatsApp (7j/7)</span>
              </a>
              <span className="text-[10px] text-center text-slate-400 font-medium">
                Temps de réponse moyen garanti : &lt; 15 minutes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
