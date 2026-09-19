import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Calculator,
  MapPin,
  Plane,
  Ship,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Package,
  Clock,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  PhoneCall
} from 'lucide-react';

export const HeroTools: React.FC = () => {
  const { orders, navigate } = useApp();
  const [activeTab, setActiveTab] = useState<'tracking' | 'calculator' | 'warehouse'>('calculator');

  // Tracking state
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingResult, setTrackingResult] = useState<any | null>(null);
  const [trackingError, setTrackingError] = useState('');

  // Calculator state
  const [calcMode, setCalcMode] = useState<'air' | 'sea'>('air');
  const [weightKg, setWeightKg] = useState<number>(8);
  const [calcCategory, setCalcCategory] = useState<'standard' | 'electronics' | 'cosmetics'>('standard');
  const [seaCbm, setSeaCbm] = useState<number>(0.8);
  const [seaDimensions, setSeaDimensions] = useState({ length: 80, width: 60, height: 50 }); // in cm
  const [isUsingDimensions, setIsUsingDimensions] = useState(false);

  // Warehouse state
  const [selectedWarehouse, setSelectedWarehouse] = useState<'guangzhou' | 'yiwu'>('guangzhou');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Tracking Handler
  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingError('');
    setTrackingResult(null);

    const cleanCode = trackingInput.trim().toUpperCase();
    if (!cleanCode) {
      setTrackingError('Veuillez entrer votre numéro de colis ou AWP.');
      return;
    }

    const found = orders.find(
      o => (o.trackingCode || '').toUpperCase() === cleanCode || (o.id || '').toUpperCase() === cleanCode
    );

    if (found) {
      setTrackingResult(found);
    } else {
      // Create a simulated live Dallou tracking preview if code is custom
      setTrackingResult({
        trackingCode: cleanCode,
        status: 'in_transit_air',
        estimatedDeliveryDate: 'Sous 4 à 6 jours ouvrés',
        deliveryType: 'hub_pickup',
        customer: { fullName: 'Client Dallou Chine', phone: '+221 77 000 00 00' },
        currentStage: 'En vol cargo - Départ Guangzhou Baiyun (CAN) vers Dakar AIBD',
        weight: '4.8 kg',
        carrier: 'Dallou Air Cargo Express',
        items: [{ productName: 'Marchandises diverses groupées', quantity: 1, transportMode: 'air' }]
      });
    }
  };

  // Quick Demo Code Filler
  const fillDemoCode = (code: string) => {
    setTrackingInput(code);
    const found = orders.find(o => o.trackingCode === code);
    if (found) {
      setTrackingResult(found);
    } else {
      setTrackingResult({
        trackingCode: code,
        status: 'in_transit_air',
        estimatedDeliveryDate: 'Sous 5 jours ouvrés',
        deliveryType: 'hub_pickup',
        customer: { fullName: 'Moussa Diop', phone: '+221 77 420 18 19' },
        currentStage: 'Vol cargo en cours d’acheminement vers Dakar',
        weight: '6.5 kg',
        carrier: 'Dallou Air Express CAN-DSS'
      });
    }
  };

  // Calculator logic
  const calculateAirCost = () => {
    let ratePerKg = 9500;
    if (calcCategory === 'electronics') ratePerKg = 12500;
    if (calcCategory === 'cosmetics') ratePerKg = 11000;
    const total = weightKg * ratePerKg;
    return { ratePerKg, total, duration: '5 à 7 jours' };
  };

  const calculateSeaCost = () => {
    let cbm = seaCbm;
    if (isUsingDimensions) {
      cbm = Number(((seaDimensions.length * seaDimensions.width * seaDimensions.height) / 1000000).toFixed(2));
      if (cbm < 0.1) cbm = 0.1;
    }
    const ratePerCbm = 300000; // 300,000 FCFA / m3
    const total = Math.round(cbm * ratePerCbm);
    return { cbm, ratePerCbm, total, duration: '35 à 45 jours' };
  };

  const airResult = calculateAirCost();
  const seaResult = calculateSeaCost();

  // Copy helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Warehouse Data
  const warehouses = {
    guangzhou: {
      city: 'Guangzhou (Canton)',
      district: 'District de Baiyun',
      type: 'Fret Aérien Express & Groupage Maritime',
      chineseAddress: '广东省广州市白云区石井街道大冈东街36号达路物流仓',
      pinyinAddress: 'Guangdong Sheng, Guangzhou Shi, Baiyun Qu, Shijing Jiedao, Dagang Dongjie 36 Hao',
      contactPhone: '+86 138 2608 9912',
      receiverChinese: clientName
        ? `达路物流 (${clientName} / ${clientPhone || 'Dakar'})`
        : '达路物流 [Votre Nom + Téléphone]',
      markingInstruction: clientName
        ? `DC-DKR / ${clientName} / ${clientPhone || '+221...'}`
        : 'DC-DKR / [VOTRE NOM] / [VOTRE TEL SÉNÉGAL]',
      workingHours: 'Lundi au Samedi : 09h00 - 21h00 (Heure de Pékin)'
    },
    yiwu: {
      city: 'Yiwu (Zhejiang)',
      district: 'Marché International de Yiwu',
      type: 'Spécialisé Groupage Maritime & Marchandises Gros',
      chineseAddress: '浙江省金华市义乌市江东街道青口工业区通达路18号达路国际仓',
      pinyinAddress: 'Zhejiang Sheng, Jinhua Shi, Yiwu Shi, Jiangdong Jiedao, Tongda Lu 18 Hao',
      contactPhone: '+86 186 5792 6631',
      receiverChinese: clientName
        ? `达路义乌仓 (${clientName} / ${clientPhone || 'Dakar'})`
        : '达路义乌仓 [Votre Nom + Téléphone]',
      markingInstruction: clientName
        ? `DC-YIWU / ${clientName} / ${clientPhone || '+221...'}`
        : 'DC-YIWU / [VOTRE NOM] / [VOTRE TEL SÉNÉGAL]',
      workingHours: 'Lundi au Dimanche : 08h30 - 22h00 (Heure de Pékin)'
    }
  };

  const currentWh = warehouses[selectedWarehouse];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden text-left">
      {/* Tab Switcher */}
      <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/80 p-1.5 sm:p-2.5 gap-1.5 sm:gap-2">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2.5 py-3 sm:py-3.5 px-2 sm:px-4 rounded-2xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'calculator'
              ? 'bg-[#FF4500] text-white shadow-md shadow-[#FF4500]/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Calculator className="w-4 h-4 shrink-0" />
          <span className="truncate">Calculateur de Tarif</span>
        </button>

        <button
          onClick={() => setActiveTab('tracking')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2.5 py-3 sm:py-3.5 px-2 sm:px-4 rounded-2xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'tracking'
              ? 'bg-[#0B192C] text-white shadow-md shadow-[#0B192C]/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <Search className="w-4 h-4 shrink-0 text-[#FF4500]" />
          <span className="truncate">Suivi Colis en Direct</span>
        </button>

        <button
          onClick={() => setActiveTab('warehouse')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2.5 py-3 sm:py-3.5 px-2 sm:px-4 rounded-2xl text-xs sm:text-sm font-black transition-all ${
            activeTab === 'warehouse'
              ? 'bg-[#0B192C] text-white shadow-md shadow-[#0B192C]/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
          }`}
        >
          <MapPin className="w-4 h-4 shrink-0 text-[#FF4500]" />
          <span className="truncate">Adresses en Chine</span>
        </button>
      </div>

      {/* Tab 1: CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="p-4 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#0B192C]">
                Estimez le coût de transport Chine 🇨🇳 ➔ Sénégal 🇸🇳
              </h3>
              <p className="text-xs text-slate-500">
                Tarifs tout compris : réception Chine, fret international et dédouanement officiel Dakar.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setCalcMode('air')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  calcMode === 'air'
                    ? 'bg-[#FF4500] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plane className="w-3.5 h-3.5" />
                <span>Aérien Express</span>
              </button>
              <button
                onClick={() => setCalcMode('sea')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  calcMode === 'sea'
                    ? 'bg-[#0B192C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Ship className="w-3.5 h-3.5" />
                <span>Maritime Groupage</span>
              </button>
            </div>
          </div>

          {calcMode === 'air' ? (
            /* AIR CALCULATOR */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                    <span>Poids estimé du colis :</span>
                    <span className="text-base font-black text-[#FF4500] font-mono">{weightKg} kg</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="0.5"
                    value={weightKg}
                    onChange={e => setWeightKg(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#FF4500]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>1 kg (échantillon)</span>
                    <span>25 kg</span>
                    <span>50 kg</span>
                    <span>100 kg (lot grossiste)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nature des marchandises :
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCalcCategory('standard')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        calcCategory === 'standard'
                          ? 'border-[#FF4500] bg-[#FF4500]/5 text-[#0B192C]'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold block">Standard</span>
                      <span className="text-[10px] text-slate-500">Vêtements, sacs, pièces</span>
                      <span className="text-[10px] font-black text-[#FF4500] block mt-1">9 500 F/kg</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCalcCategory('electronics')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        calcCategory === 'electronics'
                          ? 'border-[#FF4500] bg-[#FF4500]/5 text-[#0B192C]'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold block">High-Tech & Accu</span>
                      <span className="text-[10px] text-slate-500">Téléphones, montres, LED</span>
                      <span className="text-[10px] font-black text-[#FF4500] block mt-1">12 500 F/kg</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCalcCategory('cosmetics')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        calcCategory === 'cosmetics'
                          ? 'border-[#FF4500] bg-[#FF4500]/5 text-[#0B192C]'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs font-bold block">Cosmétiques</span>
                      <span className="text-[10px] text-slate-500">Crèmes autorisées, gels</span>
                      <span className="text-[10px] font-black text-[#FF4500] block mt-1">11 000 F/kg</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <Clock className="w-4 h-4 text-[#FF4500] shrink-0" />
                  <span>
                    <strong>Départs Aériens :</strong> Mardi & Vendredi depuis Guangzhou. Arrivée à Dakar en 5 à 7 jours ouvrés.
                  </span>
                </div>
              </div>

              {/* Air Result Box */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white p-5 sm:p-6 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-white/10">
                  <span>Estimation Aérien Express</span>
                  <span className="bg-[#FF4500] text-white font-black text-[10px] px-2 py-0.5 rounded">
                    5 - 7 Jours
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-300 block">Total TTC Rendu Dakar :</span>
                  <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                    {airResult.total.toLocaleString('fr-FR')}{' '}
                    <span className="text-sm font-bold text-[#FF4500]">FCFA</span>
                  </div>
                  <span className="text-[11px] text-slate-300">
                    Calculé sur {weightKg} kg × {airResult.ratePerKg.toLocaleString('fr-FR')} FCFA/kg
                  </span>
                </div>

                <ul className="text-[11px] text-slate-200 space-y-1.5 pt-2 border-t border-white/10">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Dédouanement Gaindé Dakar inclus</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Réception & pesée vidéo à Guangzhou</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Retrait sans frais à l'agence Dallou Dakar</span>
                  </li>
                </ul>

                <button
                  onClick={() => navigate('/b2b')}
                  className="w-full bg-[#FF4500] hover:bg-[#E03D00] text-white font-black text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Confier ce colis à Dallou Chine</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* SEA CALCULATOR */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Méthode de calcul du volume :</span>
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setIsUsingDimensions(false)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                        !isUsingDimensions ? 'bg-[#0B192C] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Volume CBM direct
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsUsingDimensions(true)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                        isUsingDimensions ? 'bg-[#0B192C] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Dimensions (L × l × H)
                    </button>
                  </div>
                </div>

                {!isUsingDimensions ? (
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>Volume estimé (CBM / m³) :</span>
                      <span className="text-base font-black text-[#0B192C] font-mono">{seaCbm} CBM</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.05"
                      value={seaCbm}
                      onChange={e => setSeaCbm(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0B192C]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                      <span>0.1 CBM (petit carton)</span>
                      <span>1 CBM (1 m³)</span>
                      <span>5 CBM</span>
                      <span>10 CBM (gros lot)</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Dimensions du carton (en cm) :</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block">Longueur (cm)</label>
                        <input
                          type="number"
                          value={seaDimensions.length}
                          onChange={e =>
                            setSeaDimensions({ ...seaDimensions, length: Math.max(1, Number(e.target.value)) })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block">Largeur (cm)</label>
                        <input
                          type="number"
                          value={seaDimensions.width}
                          onChange={e =>
                            setSeaDimensions({ ...seaDimensions, width: Math.max(1, Number(e.target.value)) })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-semibold block">Hauteur (cm)</label>
                        <input
                          type="number"
                          value={seaDimensions.height}
                          onChange={e =>
                            setSeaDimensions({ ...seaDimensions, height: Math.max(1, Number(e.target.value)) })
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold font-mono"
                        />
                      </div>
                    </div>
                    <span className="text-[11px] text-[#0B192C] font-bold block">
                      Volume calculé : {seaResult.cbm} CBM (soit {Math.round(seaResult.cbm * 1000)} Litres)
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <Ship className="w-4 h-4 text-[#0B192C] shrink-0" />
                  <span>
                    <strong>Groupage Maritime LCL :</strong> Départs bimensuels. Tarif fixe à 300 000 FCFA / CBM. Idéal pour mobilier, électroménager, machines et gros volumes.
                  </span>
                </div>
              </div>

              {/* Sea Result Box */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white p-5 sm:p-6 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-white/10">
                  <span>Groupage Maritime LCL</span>
                  <span className="bg-emerald-500 text-white font-black text-[10px] px-2 py-0.5 rounded">
                    Le + Économique
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-300 block">Total TTC Rendu Port / Dakar :</span>
                  <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                    {seaResult.total.toLocaleString('fr-FR')}{' '}
                    <span className="text-sm font-bold text-amber-400">FCFA</span>
                  </div>
                  <span className="text-[11px] text-slate-300">
                    Volume : {seaResult.cbm} CBM (300 000 FCFA / CBM tout compris)
                  </span>
                </div>

                <ul className="text-[11px] text-slate-200 space-y-1.5 pt-2 border-t border-white/10">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Dédouanement Gaindé inclus sans frais surprise</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Empotage sécurisé en conteneurs étanches</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Déchargement & stockage au Hub Dakar</span>
                  </li>
                </ul>

                <button
                  onClick={() => navigate('/b2b')}
                  className="w-full bg-[#FF4500] hover:bg-[#E03D00] text-white font-black text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Réserver un espace groupage maritime</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: TRACKING */}
      {activeTab === 'tracking' && (
        <div className="p-4 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-black text-[#0B192C]">
              Suivez votre colis ou bordereau AWP en direct
            </h3>
            <p className="text-xs text-slate-500">
              Entrez votre code de suivi attribué par Dallou Chine lors du dépôt de votre colis.
            </p>
          </div>

          <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={trackingInput}
                onChange={e => setTrackingInput(e.target.value)}
                placeholder="Exemple: DC-8849-SN ou AWP-7721"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-[#0B192C] placeholder:normal-case placeholder:font-sans placeholder:font-normal focus:bg-white focus:border-[#FF4500] outline-hidden"
              />
            </div>
            <button
              type="submit"
              className="bg-[#0B192C] hover:bg-[#FF4500] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5"
            >
              <span>Vérifier le statut</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Codes for instant testing */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-[11px]">Codes de démonstration en cours :</span>
            <button
              type="button"
              onClick={() => fillDemoCode('DC-8849-SN')}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 font-mono text-[10px] font-bold text-[#0B192C]"
            >
              DC-8849-SN (En vol CAN-DSS)
            </button>
            <button
              type="button"
              onClick={() => fillDemoCode('DC-7842-SN')}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 font-mono text-[10px] font-bold text-[#0B192C]"
            >
              DC-7842-SN (Dédouanement Gaindé)
            </button>
            <button
              type="button"
              onClick={() => fillDemoCode('DC-9214-SN')}
              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 font-mono text-[10px] font-bold text-[#0B192C]"
            >
              DC-9214-SN (Prêt au Hub Dakar)
            </button>
          </div>

          {trackingError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{trackingError}</span>
            </div>
          )}

          {/* Live Tracking Result Preview */}
          {trackingResult && (
            <div className="p-4 sm:p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Bordereau Logistique
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-[#0B192C]">
                      {trackingResult.trackingCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Actif en temps réel
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Arrivée estimée</span>
                  <span className="text-xs font-bold text-[#FF4500]">
                    {trackingResult.estimatedDeliveryDate || 'Sous 4 à 6 jours'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Étape actuelle :</span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {trackingResult.currentStage || 'En cours de transit cargo'}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Mode d'acheminement :</span>
                  <span className="font-bold text-slate-800 block mt-0.5 flex items-center gap-1">
                    <Plane className="w-3.5 h-3.5 text-[#FF4500]" />
                    <span>Fret Aérien Express (CAN ➔ DSS)</span>
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold">Lieu de retrait :</span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    Hub Principal Sacré-Cœur, Dakar
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-slate-500">
                  Besoin de voir l'historique complet d'acheminement étape par étape ?
                </span>
                <button
                  onClick={() => navigate(`/tracking?code=${trackingResult.trackingCode}`)}
                  className="w-full sm:w-auto bg-[#0B192C] hover:bg-[#FF4500] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Voir la chronologie détaillée</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: WAREHOUSES */}
      {activeTab === 'warehouse' && (
        <div className="p-4 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-[#0B192C]">
              Adresses officielles de nos entrepôts en Chine
            </h3>
            <p className="text-xs text-slate-500">
              Collez ces informations directement dans vos comptes <strong>1688, Taobao, Alibaba</strong> ou transmettez-les à votre fournisseur WeChat.
            </p>
          </div>

          {/* Warehouse Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedWarehouse('guangzhou')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                selectedWarehouse === 'guangzhou'
                  ? 'bg-[#0B192C] text-white border-[#0B192C] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Entrepôt Guangzhou (广州)
              <span className="block text-[10px] font-normal opacity-80">Aérien & Maritime Express</span>
            </button>

            <button
              onClick={() => setSelectedWarehouse('yiwu')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                selectedWarehouse === 'yiwu'
                  ? 'bg-[#0B192C] text-white border-[#0B192C] shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Entrepôt Yiwu (义乌)
              <span className="block text-[10px] font-normal opacity-80">Marché du Monde & Groupage</span>
            </button>
          </div>

          {/* Client Label Customizer */}
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 sm:p-4 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF4500]" />
              <span>Personnalisez votre marquage colis pour éviter toute perte :</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Votre Nom & Prénom (ex: Fatou Diagne)"
                className="bg-white border border-amber-300/60 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-hidden font-medium"
              />
              <input
                type="text"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                placeholder="Votre Téléphone Sénégal (ex: 77 123 45 67)"
                className="bg-white border border-amber-300/60 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Address Cards with Copy Buttons */}
          <div className="space-y-3">
            {/* 1. Chinese Address (For 1688 / Taobao) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 relative group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  1. Adresse en Chinois (中文地址) — À coller sur 1688 / Taobao
                </span>
                <button
                  onClick={() => copyToClipboard(currentWh.chineseAddress, 'ch-addr')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#FF4500] hover:text-[#E03D00] bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
                >
                  {copiedKey === 'ch-addr' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm font-bold text-[#0B192C] font-mono leading-relaxed select-all">
                {currentWh.chineseAddress}
              </p>
            </div>

            {/* 2. Receiver Name */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 relative group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  2. Nom du destinataire (收件人)
                </span>
                <button
                  onClick={() => copyToClipboard(currentWh.receiverChinese, 'receiver')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#FF4500] hover:text-[#E03D00] bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
                >
                  {copiedKey === 'receiver' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm font-bold text-[#0B192C] font-mono select-all">
                {currentWh.receiverChinese}
              </p>
            </div>

            {/* 3. Chinese Phone */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 relative group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  3. Téléphone entrepôt Chine (电话)
                </span>
                <button
                  onClick={() => copyToClipboard(currentWh.contactPhone, 'phone')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#FF4500] hover:text-[#E03D00] bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
                >
                  {copiedKey === 'phone' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm font-bold text-[#0B192C] font-mono select-all">
                {currentWh.contactPhone}
              </p>
            </div>

            {/* 4. Marking Code */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 relative group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  4. Marquage extérieur sur le carton (唛头 / Shipping Mark)
                </span>
                <button
                  onClick={() => copyToClipboard(currentWh.markingInstruction, 'marking')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#FF4500] hover:text-[#E03D00] bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
                >
                  {copiedKey === 'marking' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm font-black text-[#FF4500] font-mono select-all">
                {currentWh.markingInstruction}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
