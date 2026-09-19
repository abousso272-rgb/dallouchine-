import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { PublicShipmentDTO } from '../../types';
import {
  Search,
  Package,
  Ship,
  Plane,
  Truck,
  MapPin,
  Clock,
  Compass,
  CheckCircle2,
  Calendar,
  CheckCheck,
  Anchor,
  FileText,
  Video,
  Download,
  MessageCircle,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  BatteryCharging,
  Zap,
  Boxes,
  ArrowRight,
  ExternalLink,
  Navigation,
  AlertTriangle
} from 'lucide-react';

interface Milestone {
  id: string;
  num: string;
  title: string;
  desc: string;
  date: string;
  status: 'completed' | 'active' | 'future';
  tag: string;
  coordinates?: string;
}

export const TrackingPage: React.FC = () => {
  const { currentPath, addToast } = useApp();
  const [trackingInput, setTrackingInput] = useState('AWP-10482');
  const [activeCode, setActiveCode] = useState('AWP-10482');
  const [isSearching, setIsSearching] = useState(false);
  const [serverShipment, setServerShipment] = useState<PublicShipmentDTO | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchRealTracking = useCallback(async (codeToFetch: string) => {
    if (!codeToFetch.trim()) return;
    setIsSearching(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(codeToFetch.trim())}`);
      const data = await res.json();
      if (data.success && data.shipment) {
        setServerShipment(data.shipment);
      } else {
        setServerShipment(null);
        if (codeToFetch !== 'CMD-2026-0048') {
          setFetchError(data.errorMessage || 'Bordereau non encore indexé sur les serveurs logistiques.');
        }
      }
    } catch {
      setServerShipment(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Check URL query parameter if available
  useEffect(() => {
    if (currentPath.includes('code=')) {
      const paramCode = currentPath.split('code=')[1]?.split('&')[0];
      if (paramCode) {
        const clean = decodeURIComponent(paramCode).trim();
        setTrackingInput(clean);
        setActiveCode(clean);
      }
    }
  }, [currentPath]);

  // Fetch when activeCode changes
  useEffect(() => {
    if (activeCode) {
      fetchRealTracking(activeCode);
    }
  }, [activeCode, fetchRealTracking]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    const clean = trackingInput.trim().toUpperCase();
    setActiveCode(clean);
    fetchRealTracking(clean);
    addToast({
      title: 'Recherche de fret',
      message: `Interrogation des bases logistiques pour ${clean}...`,
      type: 'info'
    });
  };

  const setQuery = (code: string) => {
    setTrackingInput(code);
    setActiveCode(code);
    fetchRealTracking(code);
    addToast({
      title: 'Dossier chargé',
      message: `Affichage des jalons logistiques pour ${code}.`,
      type: 'info'
    });
  };

  const handleDownloadDoc = (docName: string) => {
    addToast({
      title: 'Téléchargement sécurisé',
      message: `${docName} certifié par Dallou Chine Logistics.`,
      type: 'success'
    });
  };

  const milestones: Milestone[] = [
    {
      id: 'm1',
      num: '01',
      title: 'Demande reçue & validée par le Desk Dakar',
      desc: 'Dossier technique validé, spécifications moteur 2000W et conformité routière sénégalaise.',
      date: '10 Juin 2026 · 11:20 GMT',
      status: 'completed',
      tag: 'Validé'
    },
    {
      id: 'm2',
      num: '02',
      title: 'Audit & Contrat usine signé (Ningbo / Jinhua)',
      desc: 'Vérification de l\'accréditation ISO9001 du fabricant partenaire et des cellules de batterie LiFePO4.',
      date: '15 Juin 2026 · 14:05 UTC+8',
      status: 'completed',
      tag: 'Validé'
    },
    {
      id: 'm3',
      num: '03',
      title: 'Acompte 30% sécurisé via compte séquestre OHADA',
      desc: 'Règlement garanti par lettre de crédit bancaire, déblocage des matières premières en usine.',
      date: '18 Juin 2026 · 09:30 GMT',
      status: 'completed',
      tag: 'Validé'
    },
    {
      id: 'm4',
      num: '04',
      title: 'Production usine terminée & Test de banc moteur',
      desc: 'Cycle d\'assemblage terminé : vitesse max 65 km/h testée, autonomie 110 km vérifiée sur banc.',
      date: '02 Juillet 2026 · 17:40 UTC+8',
      status: 'completed',
      tag: 'Validé'
    },
    {
      id: 'm5',
      num: '05',
      title: 'Inspection physique SGS & Pesée volumétrique',
      desc: 'Rapport de conformité SGS n° CN-90234 : 0 défaut cosmétique, emballage maritime renforcé.',
      date: '05 Juillet 2026 · 10:15 UTC+8',
      status: 'completed',
      tag: 'Validé'
    },
    {
      id: 'm6',
      num: '06',
      title: 'Empotage LCL & Pose des scellés de haute sécurité',
      desc: 'Chargement en conteneur 40HQ avec sangles d\'arrimage antichoc au Hub logistique de Ningbo.',
      date: '09 Juillet 2026 · 16:00 UTC+8',
      status: 'completed',
      tag: 'Validé'
    },
    {
      id: 'm7',
      num: '07',
      title: 'Départ navire · Port de Ningbo-Zhoushan',
      desc: 'Sortie des eaux territoriales chinoises, cap vers le canal de Suez et le détroit de Gibraltar.',
      date: '14 Juillet 2026 · 06:45 UTC+8',
      status: 'completed',
      tag: 'Validé'
    },
    {
      id: 'm8',
      num: '08',
      title: 'En mer · Transit transatlantique vers Dakar',
      desc: 'Navire CMA CGM TANGIER. Vitesse de croisière : 18.2 nœuds. Mer calme, navigation conforme aux prévisions d\'ETA.',
      date: 'En cours · ETA 18 Août',
      status: 'active',
      tag: 'JALON ACTIF',
      coordinates: '04°12\'N / 14°48\'W'
    },
    {
      id: 'm9',
      num: '09',
      title: 'Accostage Port de Dakar & Formalités GAINDE',
      desc: 'Prise en charge par nos commissionnaires agréés en douane, déclaration en douane et mainlevée.',
      date: 'Prévu le 18 Août 2026',
      status: 'future',
      tag: 'À venir'
    },
    {
      id: 'm10',
      num: '10',
      title: 'Mise à disposition Hub Almadies ou Livraison Site',
      desc: 'Dépottage final, contrôle de réception contradictoire, remise de la facture finale acquittée.',
      date: 'Prévu le 22 Août 2026',
      status: 'future',
      tag: 'À venir'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 flex flex-col gap-10 pb-20 relative">
      {/* Background Ambience */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#FF4500]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-80 -right-24 w-80 h-80 bg-[#0B192C]/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. SEARCH & TRACKING QUERY BAR */}
      <section className="flex flex-col items-center text-center gap-4 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse" />
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Ligne Maritime Directe Asie · Afrique de l'Ouest
          </span>
        </div>

        <div className="flex flex-col gap-2 max-w-2xl">
          <h1 className="text-2xl sm:text-4xl font-black text-[#0B192C] tracking-tight">
            Suivi de Cargaison &amp; Traçabilité Transcontinentale
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Suivez chaque jalon de votre marchandise depuis la sortie d'usine en Chine jusqu'à la remise sécurisée à Dakar.
          </p>
        </div>

        {/* Search Capsule */}
        <div className="w-full max-w-3xl mt-2">
          <form
            onSubmit={handleSearch}
            className="p-2 rounded-2xl bg-white border border-slate-200 shadow-xl flex flex-col sm:flex-row items-center gap-2 focus-within:border-[#FF4500]"
          >
            <div className="flex items-center gap-3 pl-3 sm:pl-4 flex-1 w-full">
              <Package className="w-5 h-5 text-[#FF4500] shrink-0" />
              <input
                type="text"
                value={trackingInput}
                onChange={e => setTrackingInput(e.target.value)}
                placeholder="Ex: CMD-2026-0048 ou B/L..."
                className="w-full bg-transparent text-sm sm:text-base font-bold text-[#0B192C] font-mono outline-hidden placeholder:text-slate-400 uppercase"
              />
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full sm:w-auto h-11 sm:h-12 px-6 rounded-xl bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shrink-0"
            >
              <span>{isSearching ? 'Recherche...' : 'Rechercher la cargaison'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Chips */}
          <div className="flex items-center justify-center gap-2 flex-wrap mt-3 text-xs">
            <span className="text-slate-400 font-medium">Bordereaux vérifiés :</span>
            <button
              type="button"
              onClick={() => setQuery('AWP-10482')}
              className="px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#FF4500] font-bold text-[11px] hover:bg-orange-100 transition-colors cursor-pointer"
            >
              AWP-10482 (Fret Réel)
            </button>
            <button
              type="button"
              onClick={() => setQuery('CMD-2026-0048')}
              className="px-3 py-1 rounded-full bg-white border border-slate-200 text-[#0B192C] font-bold text-[11px] hover:border-[#FF4500] transition-colors cursor-pointer"
            >
              CMD-2026-0048 (Démo)
            </button>
            <button
              type="button"
              onClick={() => setQuery('GRP-2026-MOTO')}
              className="px-3 py-1 rounded-full bg-white border border-slate-200 text-[#0B192C] font-bold text-[11px] hover:border-[#FF4500] transition-colors cursor-pointer"
            >
              GRP-2026-MOTO
            </button>
          </div>

          {fetchError && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 justify-center">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{fetchError}</span>
            </div>
          )}
        </div>
      </section>

      {/* 2. SHIPMENT PRIMARY IDENTITY PANEL */}
      <section className="rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-8 lg:p-10 flex flex-col gap-6">
        {/* Header row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-[#0B192C] uppercase tracking-wider">
                {serverShipment ? (
                  serverShipment.transportMode === 'air' ? 'Fret Aérien Express' :
                  serverShipment.transportMode === 'sea' ? 'Fret Maritime LCL Groupé' : 'Fret Express Port-à-Port'
                ) : 'Fret Maritime LCL Groupé'}
              </span>
              <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-orange-50 text-[#FF4500] border border-orange-200">
                Commande : {serverShipment ? serverShipment.orderCode : activeCode}
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-1 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-[#0B192C] tracking-tight font-mono">
                {serverShipment ? serverShipment.trackingCode : activeCode}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#FF4500] flex items-center gap-1">
                {serverShipment?.transportMode === 'air' ? (
                  <Plane className="w-4 h-4" />
                ) : (
                  <Ship className="w-4 h-4" />
                )}
                Transporteur : {serverShipment?.carrier ? `${serverShipment.carrier.name} (${serverShipment.carrier.code})` : 'CMA CGM TANGIER (IMO 9436214)'}
              </span>
            </div>
          </div>

          {/* Critical status badge */}
          <div className="flex flex-col sm:items-end gap-1">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#FF4500] text-white shadow-md shadow-orange-500/25">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span className="text-xs font-black tracking-wide uppercase">
                {serverShipment ? serverShipment.statusLabel : 'En transit maritime — ETA Dakar: 18 Août 2026'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {serverShipment?.isEtaEstimated
                ? "Date d'arrivée indicative non contractuelle (formalités Gaindé)"
                : "Position et statut vérifiés par les équipes logistiques"}
            </span>
          </div>
        </div>

        {/* Route Visual & Metrics Bento Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Origin */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Origine Départ
              </span>
              <Anchor className="w-4 h-4 text-[#FF4500]" />
            </div>
            <span className="text-base font-black text-[#0B192C]">
              {serverShipment ? serverShipment.origin : 'Ningbo-Zhoushan (CN)'}
            </span>
            <p className="text-xs text-slate-500">
              {serverShipment?.actualDeparture ? `Départ effectif le ${new Date(serverShipment.actualDeparture).toLocaleDateString('fr-FR')}` : 'Hub de consolidation Chine'}
            </p>
          </div>

          {/* Destination */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Destination Finale
              </span>
              <MapPin className="w-4 h-4 text-[#FF4500]" />
            </div>
            <span className="text-base font-black text-[#0B192C]">
              {serverShipment?.hub ? `${serverShipment.hub.name} (${serverShipment.hub.city})` : (serverShipment ? serverShipment.destination : 'Port Autonome de Dakar (SN)')}
            </span>
            <p className="text-xs text-slate-500">
              {serverShipment?.hub ? serverShipment.hub.address : 'Dakar Terminal Conteneurs'}
            </p>
          </div>

          {/* Transit clock */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Temps & Jalons
              </span>
              <Clock className="w-4 h-4 text-[#FF4500]" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-[#FF4500]">
                {serverShipment ? `${serverShipment.events?.length || 1} Événements` : '12 jours'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {serverShipment?.estimatedArrival ? `ETA estimée : ${new Date(serverShipment.estimatedArrival).toLocaleDateString('fr-FR')}` : 'Cycle d\'acheminement sécurisé'}
            </p>
          </div>

          {/* Container Spec */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Mode de Fret
              </span>
              <Boxes className="w-4 h-4 text-slate-500" />
            </div>
            <span className="text-base font-black text-[#0B192C]">
              {serverShipment ? (
                serverShipment.transportMode === 'air' ? 'Aérien Cargo' :
                serverShipment.transportMode === 'sea' ? 'Maritime FCL/LCL' : 'Express Routier/Air'
              ) : 'Conteneur 40\' High Cube'}
            </span>
            <p className="text-xs text-slate-500">
              Traçabilité certifiée Dallou Chine
            </p>
          </div>
        </div>

        {/* Global Multi-segment Journey Gauge */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-3 mt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Progression logistique : <strong className="text-[#0B192C]">
                {serverShipment?.status === 'delivered' ? '100% Livré au destinataire' :
                 serverShipment?.status === 'out_for_delivery' ? '90% En cours de livraison' :
                 serverShipment?.status === 'at_hub' ? '80% Arrivé au Hub Dakar' :
                 serverShipment?.status === 'customs' ? '70% Dédouanement Gaindé en cours' :
                 serverShipment?.status === 'arrived_senegal' ? '65% Arrivé au Sénégal' :
                 serverShipment?.status === 'in_transit' ? '50% En vol / En mer' :
                 serverShipment?.status === 'shipped_from_china' ? '40% Expédié de Chine' :
                 serverShipment?.status === 'ready_to_ship' ? '30% Prêt à expédier' :
                 serverShipment?.status === 'preparing_in_china' ? '20% Préparation Chine' :
                 serverShipment?.status === 'supplier_confirmed' ? '15% Fournisseur Confirmé' :
                 '10% Attente validation usine'}
              </strong>
            </span>
            <span className="text-[#FF4500] font-bold">
              {serverShipment ? serverShipment.statusLabel : 'Étape 8 / 10 active'}
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF4500] via-orange-500 to-amber-400 transition-all duration-1000"
              style={{
                width: serverShipment?.status === 'delivered' ? '100%' :
                       serverShipment?.status === 'out_for_delivery' ? '90%' :
                       serverShipment?.status === 'at_hub' ? '80%' :
                       serverShipment?.status === 'customs' ? '70%' :
                       serverShipment?.status === 'arrived_senegal' ? '65%' :
                       serverShipment?.status === 'in_transit' ? '50%' :
                       serverShipment?.status === 'shipped_from_china' ? '40%' :
                       serverShipment?.status === 'ready_to_ship' ? '30%' :
                       serverShipment?.status === 'preparing_in_china' ? '20%' :
                       serverShipment?.status === 'supplier_confirmed' ? '15%' : '10%'
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold flex-wrap gap-1">
            <span>1. Fournisseur</span>
            <span>2. Préparation Chine</span>
            <span>3. Fret International</span>
            <span>4. Gaindé Douane</span>
            <span>5. Hub Dakar</span>
          </div>
        </div>
      </section>

      {/* 3. COMPLETE 10-MILESTONE GRANULAR INTERACTIVE TIMELINE */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#FF4500] uppercase tracking-wider">
              Audit Chaîne d'Approvisionnement
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#0B192C] mt-0.5">
              Traçabilité Totale en 10 Jalons
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Chaque étape validée est certifiée et horodatée par nos bureaux
          </span>
        </div>

        {/* Milestones List */}
        <div className="flex flex-col gap-3">
          {milestones.map(m => {
            if (m.status === 'active') {
              return (
                <div
                  key={m.id}
                  className="p-5 sm:p-6 rounded-2xl bg-white border-2 border-[#FF4500] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden"
                >
                  <div className="flex items-start md:items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-[#FF4500] text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/25 animate-pulse">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-[#FF4500] text-white uppercase tracking-wider">
                          {m.tag}
                        </span>
                        <span className="text-sm sm:text-base font-black text-[#0B192C]">
                          {m.title}
                        </span>
                      </div>
                      <span className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {m.desc}
                      </span>
                      {m.coordinates && (
                        <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-[#FF4500]">
                          <span className="flex items-center gap-1">
                            <Compass className="w-3.5 h-3.5" />
                            Balise AIS active
                          </span>
                          <span>Coordonnées : {m.coordinates}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1 shrink-0">
                    <span className="text-xs font-black text-[#FF4500] uppercase">
                      En cours d'exécution
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Arrivée estimée dans 12 jours
                    </span>
                  </div>
                </div>
              );
            }

            const isCompleted = m.status === 'completed';

            return (
              <div
                key={m.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  isCompleted
                    ? 'bg-white border-slate-200/80 hover:shadow-sm'
                    : 'bg-slate-50/70 border-slate-100 opacity-70'
                }`}
              >
                <div className="flex items-start md:items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isCompleted
                        ? 'bg-orange-50 text-[#FF4500]'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {m.num}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#0B192C]">
                        {m.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">{m.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto shrink-0 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">{m.date}</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {m.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. CARGO MANIFEST & VERIFIABLE DOCUMENTS SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloc A: Contenu du lot scellé */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-md flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF4500] flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0B192C]">Contenu du Lot Scellé</h3>
                <span className="text-xs text-slate-500">Détail conforme au connaissement B/L</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-[#0B192C]">
              2 Colis Palettisés
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <img
                src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80"
                alt="Moto électrique"
                className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-200"
              />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs sm:text-sm font-bold text-[#0B192C] truncate">
                  2x Moto Électrique Urbaine 2000W
                </span>
                <span className="text-[11px] text-slate-500">
                  Châssis tubulaire renforcé, Homologation CE / UEMOA
                </span>
                <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-[#FF4500]">
                  <span>Moteur Brushless 72V</span>
                  <span>•</span>
                  <span>Freinage CBS</span>
                </div>
              </div>
            </div>

            {/* Accessories List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B192C]">
                  <BatteryCharging className="w-4 h-4 text-[#FF4500]" />
                  <span>Batteries LiFePO4</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  4x Packs 72V 35Ah interchangeables à chaud
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B192C]">
                  <Zap className="w-4 h-4 text-[#FF4500]" />
                  <span>Chargeurs 220V</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  2x Bornes rapides 15A (Recharge en 2h30)
                </span>
              </div>
            </div>

            {/* Metric summary banner */}
            <div className="flex items-center justify-around p-4 rounded-2xl bg-slate-100/80 border border-slate-200/80 text-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Volume Réel</span>
                <span className="text-base font-black text-[#0B192C]">2.40 CBM</span>
              </div>
              <div className="w-px h-8 bg-slate-300" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Poids Brut (Gross)</span>
                <span className="text-base font-black text-[#0B192C]">380.00 kg</span>
              </div>
              <div className="w-px h-8 bg-slate-300" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Type Palette</span>
                <span className="text-base font-black text-[#0B192C]">Bois NIMP15</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bloc B: Documents officiels & Assistance Hub */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-md flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF4500] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0B192C]">Documents Officiels Vérifiés</h3>
                  <span className="text-xs text-slate-500">Archivage numérique sécurisé Dallou Chine</span>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {serverShipment ? `${serverShipment.documents.length} Fichier(s)` : '4 Fichiers'}
              </span>
            </div>

            {/* Documents downloads list */}
            <div className="flex flex-col gap-2.5">
              {serverShipment && serverShipment.documents.length > 0 ? (
                serverShipment.documents.map(doc => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleDownloadDoc(doc.title)}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-100 transition-all flex items-center justify-between group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0B192C] group-hover:text-[#FF4500]">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#0B192C] group-hover:text-[#FF4500] transition-colors">
                          {doc.title}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Format: {doc.docType.toUpperCase()} · Certifié public
                        </span>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-[#FF4500] transition-colors" />
                  </button>
                ))
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleDownloadDoc('Rapport vidéo inspection')}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-100 transition-all flex items-center justify-between group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0B192C] group-hover:text-[#FF4500]">
                        <Video className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#0B192C] group-hover:text-[#FF4500] transition-colors">
                          Rapport d'inspection vidéo HD (Guangzhou)
                        </span>
                        <span className="text-[10px] text-slate-500">
                          MP4 · 42 MB · Test d'accélération &amp; étanchéité
                        </span>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-[#FF4500] transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadDoc('Certificat d\'Origine Form E')}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-100 transition-all flex items-center justify-between group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0B192C] group-hover:text-[#FF4500]">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#0B192C] group-hover:text-[#FF4500] transition-colors">
                          Certificat d'Origine Form E &amp; Fiche CE
                        </span>
                        <span className="text-[10px] text-slate-500">
                          PDF certifié · 2.1 MB · Tampon chambre de commerce
                        </span>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-[#FF4500] transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadDoc('Connaissement Maritime B/L')}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-100 transition-all flex items-center justify-between group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0B192C] group-hover:text-[#FF4500]">
                        <Ship className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#0B192C] group-hover:text-[#FF4500] transition-colors">
                          Connaissement Maritime (Bill of Lading LCL)
                        </span>
                        <span className="text-[10px] text-slate-500">
                          PDF original · 1.4 MB · Maersk / Line Partner
                        </span>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-[#FF4500] transition-colors" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => handleDownloadDoc('Quittance d\'acompte OHADA')}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-100 transition-all flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0B192C] group-hover:text-[#FF4500]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#0B192C] group-hover:text-[#FF4500] transition-colors">
                      Quittance d'acompte &amp; Enregistrement OHADA
                    </span>
                    <span className="text-[10px] text-slate-500">
                      PDF · 890 KB · Reçu fiscal notifié
                    </span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-[#FF4500] transition-colors" />
              </button>
            </div>
          </div>

          {/* Desk Logistique Action */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-[#0B192C] text-white flex items-center justify-center font-bold text-xs font-mono">
                  MN
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#FF4500] ring-2 ring-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#0B192C]">Desk Logistique Dakar</span>
                <span className="text-[11px] text-slate-500">
                  Mamadou Ndiaye · Responsable Transit Maritime
                </span>
              </div>
            </div>

            <a
              href="https://wa.me/221770000000?text=Bonjour%20Mamadou,%20je%20vous%20contacte%20concernant%20mon%20suivi%20CMD-2026-0048."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto h-10 px-5 rounded-xl bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Direct</span>
            </a>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE FAQ / QUICK INFO DRAWER */}
      <section className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-md flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#FF4500]" />
          <h4 className="text-base sm:text-lg font-black text-[#0B192C]">
            Questions Fréquentes sur le Dédouanement à Dakar (GAINDE)
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-[#0B192C] block mb-1">
              Qui gère les droits de douane ?
            </span>
            Dallou Chine prend en charge la liquidation douanière complète via son agrément commissionnaire en douane au Port de Dakar. Aucun frais imprévu.
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-[#0B192C] block mb-1">
              Comment suis-je prévenu à l'arrivée ?
            </span>
            Un SMS prioritaire ainsi qu'un message WhatsApp vous sont envoyés dès que le navire franchit la passe d'entrée du Port Autonome de Dakar.
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="font-bold text-[#0B192C] block mb-1">
              Option de livraison en région ?
            </span>
            Nous assurons le transport sécurisé depuis notre Hub Almadies vers Thiès, Mbour, Saint-Louis, Touba et l'ensemble des capitales régionales.
          </div>
        </div>
      </section>
    </div>
  );
};
