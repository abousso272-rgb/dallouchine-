import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { catalogService } from '../../services/catalogService';
import {
  Car,
  Ship,
  ShieldCheck,
  BatteryCharging,
  Zap,
  CheckCircle2,
  ArrowRight,
  Search,
  Check,
  Phone,
  Send,
  Building,
  Store,
  Wrench,
  Sparkles,
  Layers,
  FileText,
  Clock,
  ExternalLink,
  Info,
  X,
  Gauge,
  Cpu,
  Boxes
} from 'lucide-react';

interface VehicleCard {
  id: string;
  slug?: string;
  title: string;
  subtitle: string;
  category: string;
  moq: string;
  highlight: string;
  description: string;
  startingPrice?: string;
  priceTag?: string;
  priceNote?: string;
  image: string;
  actionText: string;
  specs: { label: string; value: string }[];
}

export const AutoMobilityPage: React.FC = () => {
  const { addToast, addSourcingPipelineRequest, currentUser, navigate } = useApp();

  // Sourcing Form State
  const [modelQuery, setModelQuery] = useState('');
  const [volume, setVolume] = useState('unitaire');
  const [factoryUrl, setFactoryUrl] = useState('');
  const [techRequirements, setTechRequirements] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('dakar-port');
  const [clientName, setClientName] = useState(currentUser.name || 'Amadou Diallo / Dakar Mobility SARL');
  const [phone, setPhone] = useState(currentUser.phone || '+221 77 450 12 34');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Technical Spec Modal State
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleCard | null>(null);
  const [dbVehicles, setDbVehicles] = useState<VehicleCard[]>([]);

  // Real Supabase Auto & Mobilité Fetch
  useEffect(() => {
    catalogService
      .getProducts({ isAutoMobility: true, limit: 12 })
      .then(res => {
        if (res.products && res.products.length > 0) {
          const mapped: VehicleCard[] = res.products.map(p => {
            const specsList: { label: string; value: string }[] = [];
            if (p.autoSpecs?.rangeKm) specsList.push({ label: 'Autonomie WLTP', value: `${p.autoSpecs.rangeKm} km` });
            if (p.autoSpecs?.batteryCapacityKwh) specsList.push({ label: 'Technologie Batterie', value: `LiFePO4 ${p.autoSpecs.batteryCapacityKwh} kWh` });
            if (p.autoSpecs?.motorPowerKw) specsList.push({ label: 'Puissance Moteur', value: `${p.autoSpecs.motorPowerKw} kW (${p.autoSpecs.motorPowerHp || ''} ch)` });
            if (p.autoSpecs?.topSpeedKmh) specsList.push({ label: 'Vitesse Max', value: `${p.autoSpecs.topSpeedKmh} km/h` });
            if (p.autoSpecs?.chargingTime) specsList.push({ label: 'Temps de Charge', value: p.autoSpecs.chargingTime });
            if (p.autoSpecs?.certification) specsList.push({ label: 'Homologation', value: p.autoSpecs.certification });
            if (specsList.length === 0) {
              specsList.push({ label: 'Poids à vide', value: `${p.unitWeightKg} kg` });
              specsList.push({ label: 'Transport', value: p.defaultTransportMode === 'air' ? 'Aérien Express' : 'Maritime Dakar' });
            }

            return {
              id: p.id,
              slug: p.slug,
              title: p.name,
              subtitle: p.autoSpecs?.brand ? `${p.autoSpecs.brand} • ${p.category}` : p.category,
              category: p.category,
              moq: `MOQ: ${p.moq} unité${p.moq > 1 ? 's' : ''}`,
              highlight: p.autoSpecs?.rangeKm ? `WLTP ${p.autoSpecs.rangeKm} km` : 'Certifié Usine',
              description: p.shortDescription || p.fullDescription || 'Véhicule électrique contrôlé en usine partenaire en Chine.',
              startingPrice: p.priceXOF.toLocaleString('fr-FR'),
              priceTag: 'Prix Rendu Dakar',
              image: p.images[0] || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800',
              actionText: 'Fiche technique & Cotation',
              specs: specsList
            };
          });
          setDbVehicles(mapped);
        }
      })
      .catch(err => {
        console.error('[AutoMobilityPage] Error loading auto mobility products:', err);
      });
  }, []);

  const vehicleCatalog: VehicleCard[] = [
    {
      id: 'car-ev',
      title: 'Voitures Électriques Urbaines',
      subtitle: 'SUV & Citadines Tropicalisés',
      category: 'Voitures Électriques',
      moq: 'MOQ: 1 unité',
      highlight: 'WLTP 420 km',
      description:
        'Modèles 5 places, packs batteries LFP (Lithium Fer Phosphate) ultra-résistantes à la chaleur sahélienne. Climatisation renforcée.',
      startingPrice: '8 500 000',
      priceTag: 'Prix Rendu Dakar',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAXVYZWjA8G2ojE7M0OxAlywrDYPKOu2wCsSz5IPYLErXLEcSHdl2WiUq6r8Hs0P-lFu6NAkLPwNi8LJ_gWJ-nVjG1Ocv2inNFOkQjkWjrII6Qru3uKKJh372O9xP5JuAQp6fjbHcG8f9zy9EUGtuzDobhxijasXXRnacrpbQYRfFbtaRWA1vMSY81JrjF0DPN44_ho7hiD8ybOY4-OAmTyyXo1x2jeMYfrVflTKEtzpFcNQHiIf7Pm7g',
      actionText: 'Fiche technique & Cotation',
      specs: [
        { label: 'Autonomie WLTP', value: '420 km' },
        { label: 'Technologie Batterie', value: 'LiFePO4 54 kWh' },
        { label: 'Temps de Charge Rapide', value: '30 min (20% - 80%)' },
        { label: 'Climatisation', value: 'Tropicalisée Heavy Duty' },
        { label: 'Dédouanement', value: 'Prise en charge GAINDE' }
      ]
    },
    {
      id: 'moto-ev',
      title: 'Motos Électriques Pro Dakar',
      subtitle: 'Flottes & Particuliers • 2000W à 4000W',
      category: 'Motos Électriques',
      moq: 'MOQ: 5 unités',
      highlight: 'Swap Batterie 60s',
      description:
        'Batteries amovibles 72V 35Ah LiFePO4, autonomie réelle 80-120 km par charge. Idéal coursiers, taxis-motos et livraison express.',
      startingPrice: '480 000',
      priceTag: 'FOB Chine / DDU Dakar',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDKhGG1BfL-D2v5OT2RtnJaHwXW6Ir1ORNWXzu8ErCPIC6777INonpUV6acfYlA_DmMNuETqGaAIH96-JVBcDbrYYZGz-ps81kRcB8kRMTjMMlxvTfl-f9U4WznO5_2w2Le2TtgdogUvFujegqfOxk6ki9-omhODI5-pTuY88ng339fvt3yKsspUIQEhJEWoh9YrGu5eUlrsz_0u2mV_qQ0dw4mASsUPwNwRjagPwHpVEpLNGtM4ctxnw',
      actionText: 'Configurer un lot',
      specs: [
        { label: 'Moteur Roue', value: 'Brushless 2000W - 4000W' },
        { label: 'Batteries', value: '2x 72V 35Ah LFP amovibles' },
        { label: 'Vitesse Max', value: '65 - 85 km/h' },
        { label: 'Charge Utile', value: '200 kg renforcée' },
        { label: 'Homologation', value: 'Conforme UEMOA & CE' }
      ]
    },
    {
      id: 'moto-fuel',
      title: 'Motos Thermiques Sahéliennes',
      subtitle: 'Robuste & Éprouvé • Châssis Renforcé',
      category: 'Motos Thermiques',
      moq: 'MOQ: 10 unités',
      highlight: '125cc à 250cc',
      description:
        'Conçues spécifiquement pour les routes mixtes et la chaleur. Refroidissement optimisé, suspensions surdimensionnées.',
      startingPrice: '390 000',
      priceTag: 'Empotage CKD / SKD',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCA2tJvdYu7ITngkbxx_6yG2_fGGrcAHpcN4D-uNFCF09hARp-tV1Q-2_XFcQrr9JFQgNojFpY-_x7YfARlkrw4aSFRtBiQ7sNIjJLlsXs48sJtFnjv9vGUxqKqGmALEApVOuuzkT8KpNZBEU2l-mkzyh9rSYhtawdblQ64KnX6alSoOS6sgo9WUtnGqZL1N8CFVYvQghTwGNzNy3QGYJhbh25kNeuHvNuo6TBhtPd7cRKV4ByqOin-KA',
      actionText: 'Demander les configurations',
      specs: [
        { label: 'Cylindrée', value: '125cc à 250cc 4-temps' },
        { label: 'Consommation', value: '2.1 L / 100 km' },
        { label: 'Amortisseurs', value: 'Doubles ressorts renforcés' },
        { label: 'Conditionnement', value: 'CKD (32 motos / conteneur 20HQ)' },
        { label: 'Disponibilité Pièces', value: 'Stock continu Dakar' }
      ]
    },
    {
      id: 'parts-oem',
      title: 'Pièces Détachées & Moteurs',
      subtitle: 'Maintenance & SAV • Standard Chine',
      category: 'Pièces Détachées',
      moq: 'Pièces OEM',
      highlight: 'Garantie 2 ans',
      description:
        'Moteurs brushless roue, contrôleurs sinusoïdaux programmables, amortisseurs hydrauliques, pneumatiques tubeless anti-crevaison.',
      priceNote: 'Groupage express Fret Aérien & Maritime • Colisage Sécurisé',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC5DR1wqadQhBm3VRE8l65OvudkqitwfVRaIVNYLUP0afEzP18niHvglLEvU25RQU8JuQoQDl9avkpKDN5tJ3ckRFCm4wchyt6x4GAjt5Jra32fAikFhSN-tbfE3AXlXz5eo4z2rPXYxuRax9mjg0YH84z3ODmgafqBGxGPyIFoBFGWFAwbgD5cLsFR2NMvpCn-pRSitQ5PMicuGKAGxpgTqbkGF6umk0AexFM7pHGmrDYHY0zegBOuAw',
      actionText: 'Accéder au catalogue pièces',
      specs: [
        { label: 'Contrôleurs', value: 'Onde sinusoïdale 72V 80A' },
        { label: 'Moteurs Hub', value: '1500W, 2000W, 3000W' },
        { label: 'Freinage', value: 'Disques hydrauliques CBS' },
        { label: 'Expédition', value: '7 à 10j Aérien / 35j Maritime' }
      ]
    },
    {
      id: 'swap-station',
      title: 'Stations Swap & Batteries LFP',
      subtitle: 'Infrastructures • Armoires 8 à 12 slots',
      category: 'Infrastructures Énergie',
      moq: 'Solutions Énergie',
      highlight: 'Solaire Compatible',
      description:
        'Stations connectées par carte SIM 4G locale. Échange de batterie en moins de 60 secondes pour flottes professionnelles à Dakar.',
      priceNote: 'Investissement amorti : −70% coût essence • Clé en main',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAudYWSiJygS9T4IfMtEf4dzkUpgmaAwVjkfug7-a-0-Ub1frIGuiVL91mkHtyL5DQlpOFhfp6MvEnlgWQ8syDIsIgWDy2eF9dtzR20L9zj-JRtnpvruewPNWQZxnA3eoGauWIyzYJs_UYdZmedNlsR69yLTRtOj8IiAVrGe4scTVR_fsmDJBJdmG2sSNpoIXBTUHzA9NY6ZPwdr6pAQ24sTvRUw4ndlvOPEnosb8c-NqhgMyzxM13sjQ',
      actionText: 'Dossier Station Swap Flotte',
      specs: [
        { label: 'Capacité Station', value: '8 à 12 modules batterie' },
        { label: 'Vitesse de Swap', value: '< 60 secondes' },
        { label: 'Connectivité', value: 'IoT 4G / Carte SIM Sonatel' },
        { label: 'Alimentation', value: 'Réseau 220V ou Solaire Hybride' },
        { label: 'Logiciel', value: 'Cloud ERP de gestion flotte inclus' }
      ]
    },
    {
      id: 'telematics',
      title: 'Accessoires & Trackers 4G',
      subtitle: 'Sécurité & Télématique • Antivol • Traçabilité',
      category: 'Équipement Pro',
      moq: 'Équipement Pro',
      highlight: 'SIM Sénégal Ready',
      description:
        'Top-boxes métalliques renforcées, coupe-circuit à distance par SMS/App, capteurs de charge et casques de sécurité homologués.',
      startingPrice: '18 500',
      priceTag: 'En gros / Détail',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBu8EKxdZNySvQdHrDyTGHkQ7RmpY4BGnNye_OLA67DlUFGJOVUROBjmCs4B_LMxUTev9W_nBmODqDKmbp5upLdD67KJeR3berPHq4mJJcpb8ryNbmgSEtOINFqc9_4BtSE_EusjVSndEoF7jBl2Lc-yaffBryNoLsBg3IwInlh_g6Fhqbkcm7BKqWHqk9fempzE_2FAXTYgbJkwoMJwhmA1oPrv9L0N8gXGEwyVBtndCqYRr_Jhj9uSQ',
      actionText: 'Commander des accessoires',
      specs: [
        { label: 'Balise GPS', value: 'Précision 2m • Coupure moteur SMS' },
        { label: 'Top-Box Flotte', value: 'Aluminium 65L étanche & scellé' },
        { label: 'Casques Livreur', value: 'Bluetooth & Intercom intégrés' },
        { label: 'Alimentation Tracker', value: 'Batterie interne 30j veille' }
      ]
    }
  ];

  const handleScrollTo = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePreFillSourcing = (vehicle: VehicleCard) => {
    setModelQuery(vehicle.title);
    setTechRequirements(`Exigences basées sur ${vehicle.title}: ${vehicle.specs.map(s => `${s.label}: ${s.value}`).join(' • ')}`);
    handleScrollTo('sourcing-form');
    addToast({
      title: 'Modèle sélectionné',
      message: `Le formulaire de sourcing a été pré-rempli pour : ${vehicle.title}.`,
      type: 'info'
    });
  };

  const handleSubmitSourcingForm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      addSourcingPipelineRequest({
        clientName,
        phone,
        productName: modelQuery || 'Véhicule / Mobilité Chine',
        category: 'auto-mobilite',
        targetPriceXOF: 1000000,
        estimatedVolume: volume,
        urgency: 'medium',
        assignedTo: 'Jean-Marc Chen (Desk Guangzhou)',
        sourceUrl: factoryUrl,
        notes: `Lieu de livraison: ${deliveryLocation}. Exigences: ${techRequirements}`
      });

      addToast({
        title: 'Demande de sourcing enregistrée !',
        message: 'Notre bureau de Guangzhou vérifie les usines et vous contactera sous 24h sur WhatsApp.',
        type: 'success'
      });

      // Reset form
      setModelQuery('');
      setFactoryUrl('');
      setTechRequirements('');
    }, 800);
  };

  return (
    <div className="flex flex-col w-full pb-20">
      {/* SECTION 1: HERO Auto & Mobilité Directe Chine-Sénégal */}
      <section className="relative w-full overflow-hidden pt-2 sm:pt-4 pb-12 sm:pb-16">
        <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-[#FF4500]/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-[32rem] h-[32rem] rounded-full bg-[#FF8A00]/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col gap-8 lg:gap-12">
          {/* Upper Header Content & Hierarchy */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/80 border border-slate-200 backdrop-blur-md w-fit shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-700 font-bold">
                  Filière Stratégique Majeure • Approvisionnement Direct Fabricants
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0B192C] font-heading tracking-tight leading-tight">
                Auto &amp; Mobilité <br className="hidden sm:inline" />
                <span className="text-[#FF4500]">directement depuis la Chine.</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                Voitures électriques, motos, scooters, pièces détachées et solutions professionnelles de flottes, inspectés en usine et livrés au Port Autonome de Dakar.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
              <button
                onClick={() => handleScrollTo('catalogue-mobilite')}
                className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-gradient-to-r from-[#FF4500] to-[#FF8A00] text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/25 hover:from-[#E03D00] hover:to-[#E67A00] hover:scale-[1.01] transition-all cursor-pointer"
              >
                <Car className="w-4 h-4 mr-2" />
                <span>Explorer les véhicules</span>
              </button>

              <button
                onClick={() => handleScrollTo('sourcing-form')}
                className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                <Search className="w-4 h-4 mr-2 text-[#FF4500]" />
                <span>Demander un sourcing véhicule</span>
              </button>
            </div>
          </div>

          {/* Hero Visual Frame with Image & Overlaid Liquid Glass Badges */}
          <div className="relative w-full rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-slate-900">
            <div className="relative w-full aspect-[16/9] md:aspect-[21/9] min-h-[360px] max-h-[560px]">
              <img
                src="https://lh3.googleusercontent.com/aida/AEtjO1WtShnJjlwjWN3drnsK0R_H09pO7c9QlS-_EJ8CcY6k5N_NBI2R080VnWVcIB9_Kfe9uGIksajaDY3icmKajVWybouYbuD54Qd_TlRy8fNaClnAubv3jHD_vkSzDp3D6AbzhllcLmqNzamoI_TxxFCi0RYMlEI0T7glRk6sL_OecANEQrJ_iBKIyvesUmqfKOZVIif1pzPvY1frwbN3skOpVQh2QOTEA1sVFj-mx54m_YdvdB0WrKwagYuK"
                alt="Véhicule électrique SUV et scooter urbain blanc disposés sur tarmac logistique portuaire"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C]/85 via-[#0B192C]/25 to-transparent" />

              {/* Bottom floating logistics telemetry bar */}
              <div className="absolute bottom-4 left-4 right-4 lg:bottom-6 lg:left-6 lg:right-6">
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-3.5 lg:p-4 shadow-xl border border-white/60 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF4500] shrink-0">
                      <Ship className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-900 leading-tight">35 Jours</span>
                      <span className="text-[11px] text-slate-500 truncate">Ningbo → Dakar direct</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-900 leading-tight">0% Surprise</span>
                      <span className="text-[11px] text-slate-500 truncate">Dédouanement GAINDE certifié</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF4500] shrink-0">
                      <BatteryCharging className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-900 leading-tight">100% Banc &amp; Cell</span>
                      <span className="text-[11px] text-slate-500 truncate">Contrôle batterie avant scellement</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-900 leading-tight">UEMOA &amp; CE</span>
                      <span className="text-[11px] text-slate-500 truncate">Dossier Carte Grise complet</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Catégories Clés Auto & Mobilité (Bento Showcase) */}
      <section className="w-full py-12 sm:py-16 bg-slate-50/60 border-y border-slate-200/80 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8" id="catalogue-mobilite">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-widest text-[#FF4500] font-bold">
                Catalogue Industriel Électrique &amp; Thermique
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0B192C] font-heading">
                Sélection directe usines certifiées
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md">
              Tarification transparente usine Chine ou formule clef-en-main livrée dédouanée au Port de Dakar avec assistance homologation.
            </p>
          </div>

          {/* Grid Cards (Strict 2 columns on mobile) */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
            {(dbVehicles.length > 0 ? dbVehicles : vehicleCatalog).map(vehicle => (
              <div
                key={vehicle.id}
                className="group bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="flex flex-col gap-2 sm:gap-4">
                  <div className="relative w-full aspect-square sm:aspect-[16/10] rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100">
                    <img
                      src={vehicle.image}
                      alt={vehicle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex flex-wrap gap-1">
                      <span className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#0B192C]/90 backdrop-blur-md text-white text-[8px] sm:text-[10px] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]" />
                        {vehicle.moq}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5 sm:gap-1.5">
                    <span className="text-[9px] sm:text-xs text-[#FF4500] uppercase tracking-wider font-bold truncate">
                      {vehicle.subtitle}
                    </span>
                    <h3 className="text-xs sm:text-lg font-black text-[#0B192C] font-heading truncate" title={vehicle.title}>
                      {vehicle.title}
                    </h3>
                    <p className="hidden sm:block text-xs text-slate-500 leading-relaxed line-clamp-2">{vehicle.description}</p>
                  </div>

                  {vehicle.startingPrice ? (
                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-2 sm:p-3 flex items-center justify-between border border-slate-100">
                      <div>
                        <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                          Dès
                        </span>
                        <div className="flex items-baseline gap-0.5 sm:gap-1">
                          <span className="text-xs sm:text-xl font-black text-[#FF4500] font-mono">
                            {vehicle.startingPrice}
                          </span>
                          <span className="text-[9px] sm:text-xs text-slate-400 font-bold">F</span>
                        </div>
                      </div>
                      <span className="hidden sm:flex px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold items-center gap-1 border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" />
                        {vehicle.priceTag}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-2 sm:p-3 flex items-center justify-between border border-slate-100">
                      <div>
                        <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                          Formule Pro
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-800">{vehicle.priceNote}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-2.5 sm:mt-5 pt-2 sm:pt-3 border-t border-slate-100 flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => handlePreFillSourcing(vehicle)}
                    className="flex-1 h-8 sm:h-11 rounded-xl sm:rounded-full bg-[#0B192C] sm:bg-slate-100 hover:bg-[#FF4500] text-white sm:text-slate-800 hover:text-white text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>{vehicle.actionText || 'Réserver'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  {vehicle.slug && (
                    <button
                      onClick={() => navigate(`/products/${vehicle.slug}`)}
                      className="hidden sm:flex px-3 h-11 rounded-full bg-slate-50 hover:bg-[#0B192C] hover:text-white text-slate-700 text-xs font-bold transition-all items-center justify-center gap-1 cursor-pointer border border-slate-200"
                      title="Voir sur le Marketplace"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedVehicle(vehicle)}
                    className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 shrink-0"
                    title="Voir spécifications"
                  >
                    <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: SOURCING SUR-MESURE VÉHICULE & FLOTTE (Formulaire Liquid Glass) */}
      <section className="w-full py-12 sm:py-16" id="sourcing-form">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 lg:p-12 shadow-xl overflow-hidden">
            <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-orange-100/40 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Presentation */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-6">
                <div className="flex flex-col gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 w-fit">
                    <Zap className="w-3.5 h-3.5 text-[#FF4500]" />
                    <span className="text-[11px] font-mono text-[#FF4500] uppercase font-bold">
                      Chine Direct Custom Sourcing
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-[#0B192C] font-heading leading-tight">
                    Vous avez un modèle ou une fiche usine en tête ?
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Notre bureau d'ingénieurs acheteurs basé à Guangzhou contacte directement le fabricant, vérifie la certification du pack batterie et négocie les prix sortie usine au meilleur barème.
                  </p>

                  <div className="flex flex-col gap-3.5 mt-2">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#FF4500] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        1
                      </div>
                      <p className="text-xs text-slate-700">
                        <strong className="font-bold text-slate-900">Lien ou cahier des charges :</strong> Renseignez l'URL Alibaba, 1688 ou les dimensions voulues.
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#FF4500] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        2
                      </div>
                      <p className="text-xs text-slate-700">
                        <strong className="font-bold text-slate-900">Inspection physique :</strong> Test du moteur sur banc, voltage réel et contrôle châssis.
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#FF4500] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        3
                      </div>
                      <p className="text-xs text-slate-700">
                        <strong className="font-bold text-slate-900">Livraison Port de Dakar :</strong> Dossier GAINDE préparé avec BESC et exonérations applicables.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF4500] flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Besoin d'un conseil immédiat par WhatsApp ?</span>
                    <span className="text-[11px] text-slate-500 font-mono">+221 77 000 00 00 • Réponse sous 30 min</span>
                  </div>
                </div>
              </div>

              {/* Right Sourcing Form */}
              <div className="lg:col-span-7 bg-slate-50/80 border border-slate-200/70 backdrop-blur-md rounded-2xl p-6 sm:p-8 flex flex-col gap-4">
                <h3 className="text-lg font-black text-[#0B192C]">Formulaire de cotation véhicule sur-mesure</h3>

                <form onSubmit={handleSubmitSourcingForm} className="flex flex-col gap-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">Modèle ou type recherché *</label>
                      <input
                        type="text"
                        required
                        value={modelQuery}
                        onChange={e => setModelQuery(e.target.value)}
                        placeholder="Ex: SUV Électrique 400km ou Scooter Cargo 3000W"
                        className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF4500]"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">Volume envisagé *</label>
                      <select
                        value={volume}
                        onChange={e => setVolume(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF4500]"
                      >
                        <option value="unitaire">Commande Unitaire (1 véhicule)</option>
                        <option value="flotte-petite">Petite flotte (3 à 9 unités)</option>
                        <option value="conteneur-20">Conteneur 20 pieds complet</option>
                        <option value="conteneur-40hq">Conteneur 40 HQ High Cube</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700">
                      Lien usine (Alibaba, 1688, Taobao) ou référence fabricant
                    </label>
                    <input
                      type="url"
                      value={factoryUrl}
                      onChange={e => setFactoryUrl(e.target.value)}
                      placeholder="https://french.alibaba.com/product-detail/..."
                      className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF4500]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">Exigences techniques clés</label>
                      <input
                        type="text"
                        value={techRequirements}
                        onChange={e => setTechRequirements(e.target.value)}
                        placeholder="Ex: Prise 220V/50Hz, batterie LFP amovible"
                        className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF4500]"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">Lieu de livraison final</label>
                      <select
                        value={deliveryLocation}
                        onChange={e => setDeliveryLocation(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF4500]"
                      >
                        <option value="dakar-port">Port Autonome de Dakar (DDU)</option>
                        <option value="dakar-entrepot">Entrepôt Dallou Chine Yoff Dakar</option>
                        <option value="thies">Thiès / Diamniadio</option>
                        <option value="fob-chine">FOB Ningbo / Guangzhou (Chine seule)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">Votre Nom / Société *</label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        placeholder="Amadou Diallo / Dakar Mobility SARL"
                        className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF4500]"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">Numéro WhatsApp Sénégal (+221) *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+221 7X XXX XX XX"
                        className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF4500]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 w-full h-12 rounded-full bg-gradient-to-r from-[#FF4500] to-[#FF8A00] hover:from-[#E03D00] hover:to-[#E67A00] text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Transmission en cours...' : 'Lancer le sourcing de mon véhicule sous 24h'}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: AUTO B2B & PROFESSIONNELS (Solutions Dédiées Flottes & Garages) */}
      <section className="w-full py-12 sm:py-16 bg-slate-50/50 border-t border-slate-200/80 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-widest text-[#FF4500] font-bold">
                Solutions B2B &amp; Partenariats Industriels
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0B192C] font-heading">
                Vous êtes revendeur ou gestionnaire de flotte ?
              </h2>
            </div>

            <button
              onClick={() => handleScrollTo('sourcing-form')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-xs hover:bg-[#FF4500] hover:text-white transition-all cursor-pointer"
            >
              <span>Demander un compte Pro Flotte</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* B2B 1: Concessionnaires */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF4500] mb-1">
                  <Store className="w-5 h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#0B192C]">Concessionnaires &amp; Revendeurs</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Conditions FOB Ningbo ou DDU Dakar, appui complet pour les dossiers d'homologation et certificats de conformité pour immatriculation rapide.
                </p>
              </div>
              <ul className="flex flex-col gap-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-[#FF4500]" />
                  <span>Tarifs usines négociés par volume</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-[#FF4500]" />
                  <span>Assurance maritime tous risques</span>
                </li>
              </ul>
            </div>

            {/* B2B 2: Flottes Livraison & Taxis */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF4500] mb-1">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#0B192C]">Flottes Livraison &amp; Taxis</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Solutions clés en main avec swap de batterie 60 secondes, boîtiers GPS intégrés et coût au kilomètre divisé par trois par rapport à l'essence.
                </p>
              </div>
              <ul className="flex flex-col gap-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-[#FF4500]" />
                  <span>Batteries LiFePO4 interchangeables</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-[#FF4500]" />
                  <span>Tableau de bord de suivi GPS flotte</span>
                </li>
              </ul>
            </div>

            {/* B2B 3: Garages & Ateliers SAV */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF4500] mb-1">
                  <Wrench className="w-5 h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#0B192C]">Garages &amp; Ateliers SAV</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Approvisionnement en pièces de rechange certifiées constructeurs. Stock tampon disponible ou réassort rapide sous 7 à 10 jours par fret aérien.
                </p>
              </div>
              <ul className="flex flex-col gap-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-[#FF4500]" />
                  <span>Moteurs, cellules et contrôleurs</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-[#FF4500]" />
                  <span>Outillage de diagnostic électronique</span>
                </li>
              </ul>
            </div>

            {/* B2B 4: Entreprises & Collectivités */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF4500] mb-1">
                  <Building className="w-5 h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#0B192C]">Entreprises &amp; Collectivités</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Déploiement de flottes de service décarbonées avec ombrières solaires de recharge autonomes pour vos sites industriels ou municipaux à Dakar.
                </p>
              </div>
              <ul className="flex flex-col gap-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-[#FF4500]" />
                  <span>Réduction drastique de l'empreinte RSE</span>
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-[#FF4500]" />
                  <span>Facturation en FCFA avec TVA déductible</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: PROTOCOLE LOGISTIQUE & RÉASSURANCE DE BOUT EN BOUT */}
      <section className="w-full py-12 sm:py-16">
        <div className="max-w-7xl mx-auto bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 lg:p-12 shadow-sm flex flex-col gap-8">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
            <span className="text-xs uppercase tracking-widest text-[#FF4500] font-bold">
              Standard d'Excellence Dallou Chine
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B192C] font-heading">
              Un protocole rigoureux en 4 jalons contrôlés
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              De l'inspection sur banc dynamique à Guangzhou jusqu'à la remise des clés au Port Autonome de Dakar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Step 1 */}
            <div className="flex flex-col gap-2.5 p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-[#FF4500] font-mono">01</span>
                <CheckCircle2 className="w-5 h-5 text-slate-400" />
              </div>
              <h4 className="text-sm font-bold text-[#0B192C]">Audit &amp; Banc Électronique</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Test de résistance de batterie sous forte température, calibrage des calculateurs et contrôle qualité avant acceptation du lot en usine.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col gap-2.5 p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-[#FF4500] font-mono">02</span>
                <Boxes className="w-5 h-5 text-slate-400" />
              </div>
              <h4 className="text-sm font-bold text-[#0B192C]">Empotage &amp; Calage Ningbo</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sangles haute résistance, cales métalliques certifiées pour conteneurs maritimes et protocoles matières dangereuses (UN3480 / UN3171).
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col gap-2.5 p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-[#FF4500] font-mono">03</span>
                <Ship className="w-5 h-5 text-slate-400" />
              </div>
              <h4 className="text-sm font-bold text-[#0B192C]">Transit Direct Maritime</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Liaison régulière 35 jours de mer sans transbordement à risque. Suivi satellite du conteneur en direct depuis votre espace client.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col gap-2.5 p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-[#FF4500] font-mono">04</span>
                <ShieldCheck className="w-5 h-5 text-slate-400" />
              </div>
              <h4 className="text-sm font-bold text-[#0B192C]">GAINDE &amp; Carte Grise</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Déclarations douanières prises en charge à Dakar, BESC validé, remise de l'ensemble des documents officiels pour immatriculation.
              </p>
            </div>
          </div>

          {/* Live Quote CTA Strip */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FF4500] text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-[#0B192C]">Prêt à importer votre prochain véhicule ou votre flotte ?</h4>
                <p className="text-xs text-slate-500">Recevez une étude tarifaire chiffrée avec détail du fret et des droits de douane sous 24 heures.</p>
              </div>
            </div>

            <button
              onClick={() => handleScrollTo('sourcing-form')}
              className="w-full md:w-auto inline-flex items-center justify-center h-12 px-6 rounded-full bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs sm:text-sm font-bold shadow-md transition-all whitespace-nowrap cursor-pointer"
            >
              <span>Demander mon devis chiffré</span>
            </button>
          </div>
        </div>
      </section>

      {/* MODAL SPÉCIFICATIONS TECHNIQUES */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 bg-[#0B192C]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#FF4500] flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-[#FF4500] font-bold uppercase">{selectedVehicle.category}</span>
                  <h3 className="text-lg font-black text-[#0B192C]">{selectedVehicle.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden aspect-[16/9] w-full bg-slate-100">
              <img src={selectedVehicle.image} alt={selectedVehicle.title} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fiche Technique Standard Usine</h4>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {selectedVehicle.specs.map((spec, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">{spec.label}</span>
                    <span className="font-bold text-slate-900">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="flex-1 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  handlePreFillSourcing(selectedVehicle);
                  setSelectedVehicle(null);
                }}
                className="flex-1 h-11 rounded-full bg-gradient-to-r from-[#FF4500] to-[#FF8A00] text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Configurer ce véhicule</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoMobilityPage;
