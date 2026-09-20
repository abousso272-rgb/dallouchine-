import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Ship,
  Plane,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  Users,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Building2,
  PhoneCall,
  Camera,
  RefreshCw,
  Warehouse,
  Anchor,
  Truck
} from 'lucide-react';

export const CollaboratorDashboardPage: React.FC = () => {
  const { navigate, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'china_hub' | 'dakar_hub' | 'inspections'>('china_hub');
  const [searchTracking, setSearchTracking] = useState('');

  // Données de terrain collaborateur (Chine & Dakar)
  const chinaHubPackages = [
    {
      id: 'PKG-GZ-9941',
      supplier: 'Yongkang Electric Vehicles Co., Ltd',
      clientCode: 'CLT-DKR-401',
      description: '2x Motos Électriques 2000W + Batteries LiFePO4',
      hubLocation: 'Guangzhou Baiyun Warehouse (Allée C-12)',
      status: 'inspected',
      inspectionNote: 'Conformité certifiée SGS Chine (100% OK)',
      date: '20 Sep 2026'
    },
    {
      id: 'PKG-YW-2180',
      supplier: 'Shenzhen TechSolar Industrial',
      clientCode: 'CLT-DKR-388',
      description: '10x Projecteurs Solaires 300W IP67',
      hubLocation: 'Yiwu International Cargo Hub',
      status: 'received',
      inspectionNote: 'En attente de test photométrique',
      date: '19 Sep 2026'
    },
    {
      id: 'PKG-NB-5501',
      supplier: 'Ningbo Machinery & Tools Corp',
      clientCode: 'CLT-DKR-412',
      description: 'Lot 50x Compresseurs d’air industriels',
      hubLocation: 'Ningbo-Zhoushan Terminal 3',
      status: 'stuffed',
      inspectionNote: 'Empoté dans Conteneur LCL-DKR-884',
      date: '18 Sep 2026'
    }
  ];

  const dakarPadShipments = [
    {
      containerId: 'MEDU-902148-1',
      groupageCode: 'GRP-LCL-884',
      vessel: 'MSC ILONA (Voyage 2608S)',
      eta: '25 Sep 2026 (Port Autonome de Dakar)',
      manifesteGainde: 'DECL-DKR-2026-08992',
      customsStatus: 'gainde_declared',
      step: 'Formalités douanières PAD en cours'
    },
    {
      containerId: 'CMAU-481902-5',
      groupageCode: 'GRP-AIR-102',
      vessel: 'Air Cargo AIBD - Ethiopian Flight ET908',
      eta: '22 Sep 2026 (Fret Aérien AIBD)',
      manifesteGainde: 'LTA-AIR-7710293',
      customsStatus: 'ready_pickup',
      step: 'Prêt pour dépotage Hub Almadies'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Header Portail Collaborateur */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#0B192C] text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF4500]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FF4500] text-white uppercase tracking-wider">
                Espace Opérations Terrain
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Hubs Connectés 🇨🇳 Guangzhou &amp; 🇸🇳 Dakar
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Portail Collaborateurs &amp; Logisticiens
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Interface dédiée aux agents sourceurs en Chine (Guangzhou / Yiwu) et aux transitaires agréés au Port Autonome de Dakar (PAD).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/suivi')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Rechercher AWP</span>
            </button>
            <button
              onClick={() => navigate('/admin/logistics')}
              className="px-4 py-2.5 rounded-xl bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Console Centrale Admin</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-slate-400 block text-[11px]">Colis reçus en Chine</span>
            <strong className="text-base font-black text-white font-mono-numeric">148 réceptions</strong>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-slate-400 block text-[11px]">Inspections SGS validées</span>
            <strong className="text-base font-black text-emerald-400 font-mono-numeric">98.4% conformes</strong>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-slate-400 block text-[11px]">Conteneurs en mer</span>
            <strong className="text-base font-black text-cyan-300 font-mono-numeric">3 navires actifs</strong>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-slate-400 block text-[11px]">Gaindé Port de Dakar</span>
            <strong className="text-base font-black text-amber-300 font-mono-numeric">Dédouanement 48h</strong>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('china_hub')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'china_hub'
              ? 'bg-[#0B192C] text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>🇨🇳 Hubs Chine (Guangzhou / Yiwu)</span>
        </button>

        <button
          onClick={() => setActiveTab('dakar_hub')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'dakar_hub'
              ? 'bg-[#0B192C] text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Anchor className="w-4 h-4" />
          <span>🇸🇳 Transit Port Dakar (PAD &amp; AIBD)</span>
        </button>

        <button
          onClick={() => setActiveTab('inspections')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'inspections'
              ? 'bg-[#0B192C] text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>📋 Rapports Contrôle Qualité SGS</span>
        </button>
      </div>

      {/* Tab 1: Hubs Chine */}
      {activeTab === 'china_hub' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[#0B192C]">
              Lots usines réceptionnés aux entrepôts de consolidation en Chine
            </h2>
            <span className="text-xs text-slate-500 font-medium">3 récents</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {chinaHubPackages.map((pkg) => (
              <div key={pkg.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-[#FF4500]">{pkg.id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                      {pkg.clientCode}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#0B192C]">{pkg.description}</h3>
                  <p className="text-xs text-slate-500">Usine : <strong>{pkg.supplier}</strong></p>
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{pkg.hubLocation}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {pkg.inspectionNote}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{pkg.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Dakar PAD */}
      {activeTab === 'dakar_hub' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-[#0B192C]">
              Suivi douanier Gaindé &amp; Navires en approche Port Autonome de Dakar
            </h2>
          </div>

          <div className="space-y-4">
            {dakarPadShipments.map((ship) => (
              <div key={ship.containerId} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-xs font-black font-mono">
                      {ship.containerId}
                    </span>
                    <span className="text-xs font-bold text-[#FF4500] font-mono">
                      {ship.groupageCode}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#0B192C] flex items-center gap-2">
                    <Ship className="w-4 h-4 text-[#FF4500]" />
                    <span>{ship.vessel}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    ETA : <strong>{ship.eta}</strong> • Gaindé : <span className="font-mono text-slate-700 font-bold">{ship.manifesteGainde}</span>
                  </p>
                </div>

                <div className="flex flex-col md:items-end gap-2 shrink-0">
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                    {ship.step}
                  </span>
                  <button
                    onClick={() => navigate('/admin/logistics')}
                    className="text-xs font-bold text-[#FF4500] hover:underline flex items-center gap-1"
                  >
                    <span>Mettre à jour statut douane</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Inspections SGS */}
      {activeTab === 'inspections' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-6 h-6 text-[#FF4500]" />
            <div>
              <h2 className="text-base font-black text-[#0B192C]">Protocole de Contrôle SGS Chine Avant Expédition</h2>
              <p className="text-xs text-slate-500">Obligation contractuelle Dallou Chine : aucun conteneur n'est scellé sans rapport d'inspection 100% conforme.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-xs font-bold text-[#0B192C] block">1. Audit Visuel &amp; Châssis</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Vérification des soudures, numéros de série usine gravés, conformité des peintures et absence d'éclats.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-xs font-bold text-[#0B192C] block">2. Banc d'Essai Électrique</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Test de charge de batterie LiFePO4, contrôleur de puissance moteur et étanchéité IP67 des faisceaux.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-xs font-bold text-[#0B192C] block">3. Emballage Renforcé Caisse Bois</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Protection film étanche, caisses traitées fumigation norme NIMP 15 et cerclage métallique d'arrimage.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
