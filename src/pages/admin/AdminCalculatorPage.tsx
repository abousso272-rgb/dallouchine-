import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  computeCostAndProfitability,
  simulateVolumeScale,
  compareTransportModes
} from '../../services/calculationEngine';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Truck,
  Plane,
  Ship,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Percent,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Layers,
  Info
} from 'lucide-react';

export const AdminCalculatorPage: React.FC = () => {
  const { calcSettings, updateCalcSettings, carriers, showToast } = useApp();

  // Basic Calculation Inputs (Level 1)
  const [productName, setProductName] = useState('Écouteurs TWS Pro');
  const [productPriceCNY, setProductPriceCNY] = useState(85);
  const [quantity, setQuantity] = useState(50);
  const [weightKgPerUnit, setWeightKgPerUnit] = useState(0.85);
  const [lengthCm, setLengthCm] = useState(22);
  const [widthCm, setWidthCm] = useState(16);
  const [heightCm, setHeightCm] = useState(12);
  const [transportMode, setTransportMode] = useState<'air' | 'sea'>('air');
  const [targetMarginPercent, setTargetMarginPercent] = useState(35);

  // Advanced Mode Toggle (Level 3)
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [exchangeRateCNY, setExchangeRateCNY] = useState(calcSettings.exchangeRateCNY_XOF || 88.5);
  const [customsRatePercent, setCustomsRatePercent] = useState(calcSettings.defaultCustomsClearancePercent || 15);
  const [sourcingFeePercent, setSourcingFeePercent] = useState(calcSettings.defaultSourcingFeePercent || 5);
  const [safetyBufferPercent, setSafetyBufferPercent] = useState(calcSettings.defaultSafetyBufferPercent || 3);
  const [inspectionFeeXOF, setInspectionFeeXOF] = useState(calcSettings.defaultInspectionFeeXOF || 15000);

  const selectedCarrier = carriers.find(c => (transportMode === 'air' ? c.mode === 'air' : c.mode === 'sea')) || carriers[0];

  // Perform Calculation
  const result = computeCostAndProfitability(
    {
      productPriceCNY,
      quantity,
      weightKgPerUnit,
      lengthCm,
      widthCm,
      heightCm,
      exchangeRateCNY_XOF: exchangeRateCNY,
      exchangeRateUSD_XOF: calcSettings.exchangeRateUSD_XOF || 610,
      sourcingFeePercent,
      sourcerInspectionFixedXOF: inspectionFeeXOF,
      consolidationFeePerCbmXOF: calcSettings.defaultConsolidationCbmFeeXOF,
      consolidationHandlingFixedXOF: calcSettings.defaultConsolidationFixedFeeXOF,
      selectedCarrierId: selectedCarrier.id,
      customsClearanceRatePercent: customsRatePercent,
      customsFixedPerShipmentXOF: calcSettings.defaultCustomsFixedFeeXOF,
      safetyBufferPercent,
      targetMarginPercent,
      minMarginPercent: calcSettings.defaultMinMarginPercent
    },
    selectedCarrier
  );

  const volumeSimulation = simulateVolumeScale(
    {
      productPriceCNY,
      quantity,
      weightKgPerUnit,
      lengthCm,
      widthCm,
      heightCm,
      exchangeRateCNY_XOF: exchangeRateCNY,
      exchangeRateUSD_XOF: calcSettings.exchangeRateUSD_XOF,
      sourcingFeePercent,
      sourcerInspectionFixedXOF: inspectionFeeXOF,
      consolidationFeePerCbmXOF: calcSettings.defaultConsolidationCbmFeeXOF,
      consolidationHandlingFixedXOF: calcSettings.defaultConsolidationFixedFeeXOF,
      selectedCarrierId: selectedCarrier.id,
      customsClearanceRatePercent: customsRatePercent,
      customsFixedPerShipmentXOF: calcSettings.defaultCustomsFixedFeeXOF,
      safetyBufferPercent,
      targetMarginPercent,
      minMarginPercent: calcSettings.defaultMinMarginPercent
    },
    selectedCarrier,
    [10, 25, 50, 100, 250]
  );

  const resetDefaults = () => {
    setProductPriceCNY(85);
    setQuantity(50);
    setWeightKgPerUnit(0.85);
    setLengthCm(22);
    setWidthCm(16);
    setHeightCm(12);
    setTargetMarginPercent(35);
    setExchangeRateCNY(88.5);
    setCustomsRatePercent(15);
    setSourcingFeePercent(5);
    setSafetyBufferPercent(3);
    showToast('info', 'Réinitialisé', 'Valeurs par défaut restaurées.');
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & ADVANCED MODE SWITCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a1945] p-5 rounded-3xl border border-blue-900/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">Calculateur de Coût & Marge</h1>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Simulation Temps Réel
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Estimez avec précision le coût de revient rendu Sénégal et votre prix de vente conseillé.
          </p>
        </div>

        {/* Toggle Mode Avancé & Reset */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border ${
              isAdvancedMode
                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                : 'bg-white/5 text-slate-300 hover:text-white border-white/10'
            }`}
          >
            <Sliders className="w-4 h-4 text-blue-300" />
            <span>Mode Avancé</span>
            <span className={`w-2 h-2 rounded-full ${isAdvancedMode ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          </button>

          <button
            onClick={resetDefaults}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
            title="Réinitialiser les valeurs"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN LAYOUT: SIMPLE INPUTS VS RESULTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 7 COLS: STEP-BY-STEP INPUTS */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0a1945] rounded-3xl border border-blue-900/40 p-5 shadow-lg space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-blue-900/40">
              Paramètres du Produit & Expédition
            </h2>

            {/* Step 1: Produit & Prix RMB */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nom / Référence</label>
                <input
                  type="text"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4500]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Prix Achat Usine (RMB / CNY)</label>
                <input
                  type="number"
                  value={productPriceCNY}
                  onChange={e => setProductPriceCNY(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#FF4500]"
                />
              </div>
            </div>

            {/* Step 2: Quantité & Poids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Quantité (pièces)</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Poids unitaire (kg)</label>
                <input
                  type="number"
                  step="0.05"
                  value={weightKgPerUnit}
                  onChange={e => setWeightKgPerUnit(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Step 3: Dimensions Carton */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Dimensions carton unitaire (cm)</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="Longueur"
                  value={lengthCm}
                  onChange={e => setLengthCm(Number(e.target.value))}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono text-center"
                />
                <input
                  type="number"
                  placeholder="Largeur"
                  value={widthCm}
                  onChange={e => setWidthCm(Number(e.target.value))}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono text-center"
                />
                <input
                  type="number"
                  placeholder="Hauteur"
                  value={heightCm}
                  onChange={e => setHeightCm(Number(e.target.value))}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-mono text-center"
                />
              </div>
            </div>

            {/* Step 4: Mode de Transport */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Mode de Transport Chine ➔ Sénégal</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTransportMode('air')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    transportMode === 'air'
                      ? 'bg-blue-600/30 border-blue-500 text-white shadow-md'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  <Plane className="w-4 h-4 text-blue-400" />
                  <span>Fret Aérien (12-18j)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTransportMode('sea')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    transportMode === 'sea'
                      ? 'bg-cyan-600/30 border-cyan-500 text-white shadow-md'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  <Ship className="w-4 h-4 text-cyan-400" />
                  <span>Fret Maritime (35-45j)</span>
                </button>
              </div>
            </div>

            {/* Step 5: Marge Souhaitée */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1">
                <span>Marge Nette Souhaitée</span>
                <span className="text-emerald-400 font-mono font-black">{targetMarginPercent}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="70"
                value={targetMarginPercent}
                onChange={e => setTargetMarginPercent(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FF4500]"
              />
            </div>
          </div>

          {/* ADVANCED MODE SECTION (LEVEL 3) */}
          {isAdvancedMode && (
            <div className="bg-[#0a1945] rounded-3xl border border-blue-500/40 p-5 shadow-lg space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 pb-2 border-b border-blue-900/40">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Paramètres Avancés & Moteur</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Taux de Change CNY / FCFA</label>
                  <input
                    type="number"
                    step="0.1"
                    value={exchangeRateCNY}
                    onChange={e => setExchangeRateCNY(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Taux Dédouanement Gaindé (%)</label>
                  <input
                    type="number"
                    value={customsRatePercent}
                    onChange={e => setCustomsRatePercent(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Commission Sourcing (%)</label>
                  <input
                    type="number"
                    value={sourcingFeePercent}
                    onChange={e => setSourcingFeePercent(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Réserve Imprévus (%)</label>
                  <input
                    type="number"
                    value={safetyBufferPercent}
                    onChange={e => setSafetyBufferPercent(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT 5 COLS: RÉSULTATS VISUELS */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Results Card */}
          <div className="bg-[#0a1945] rounded-3xl border border-emerald-900/50 p-6 shadow-xl space-y-5">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-blue-900/40">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Résultat de Rentabilité</span>
            </h2>

            {/* Coût de revient & Prix conseillé */}
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase font-bold">Coût Total Unitaire</span>
                  <div className="text-lg font-black text-white font-mono">
                    {(result.totalUnitCostXOF || 0).toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">FCFA</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Achat + Fret + Douane</span>
                  <span className="text-[10px] text-blue-300 font-mono">100% Rendu Dakar</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 text-[10px] block uppercase font-bold">Prix Conseillé Client</span>
                  <div className="text-2xl font-black text-emerald-300 font-mono">
                    {(result.suggestedUnitPriceXOF || 0).toLocaleString('fr-FR')} <span className="text-xs font-normal text-emerald-400">FCFA</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    +{result.actualMarginPercent}% marge
                  </span>
                </div>
              </div>
            </div>

            {/* Benefice Net */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/5">
                <span className="text-slate-400 text-[10px] block">Bénéfice Net Unitaire</span>
                <strong className="text-sm font-bold text-white font-mono">
                  {(result.unitMarginXOF || 0).toLocaleString('fr-FR')} FCFA
                </strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5">
                <span className="text-slate-400 text-[10px] block">Bénéfice Total Lot ({quantity} pcs)</span>
                <strong className="text-sm font-bold text-emerald-400 font-mono">
                  {(((result.unitMarginXOF || 0) * quantity) || 0).toLocaleString('fr-FR')} FCFA
                </strong>
              </div>
            </div>

            {/* Detail Breakdown */}
            <div className="p-3.5 rounded-2xl bg-white/5 text-[11px] space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>1. Prix Usine ({productPriceCNY} CNY) :</span>
                <span className="font-mono">{(result.unitBaseProductCostXOF || 0).toLocaleString('fr-FR')} F</span>
              </div>
              <div className="flex justify-between">
                <span>2. Fret {transportMode === 'air' ? 'Aérien' : 'Maritime'} :</span>
                <span className="font-mono">{(result.unitTransportCostXOF || 0).toLocaleString('fr-FR')} F</span>
              </div>
              <div className="flex justify-between">
                <span>3. Douane & Dédouanement :</span>
                <span className="font-mono">{(result.unitCustomsCostXOF || 0).toLocaleString('fr-FR')} F</span>
              </div>
              <div className="flex justify-between">
                <span>4. Sourcing & Contrôle Qualité :</span>
                <span className="font-mono">{(((result.unitSourcingCostXOF || 0) + (result.unitConsolidationCostXOF || 0)) || 0).toLocaleString('fr-FR')} F</span>
              </div>
            </div>
          </div>

          {/* Volume Simulation Curve */}
          <div className="bg-[#0a1945] rounded-3xl border border-blue-900/40 p-4 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Effet d'Échelle & Groupage</span>
            </h3>
            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
              {volumeSimulation.map((sim, i) => (
                <div key={i} className="p-2 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="text-slate-400 font-bold">{sim.volume} pcs</div>
                  <div className="text-emerald-400 font-mono font-bold">{(sim.suggestedUnitPriceXOF || 0).toLocaleString('fr-FR')} F</div>
                  <div className="text-[9px] text-cyan-300">-{Math.round(sim.savingsVsSmallVolumePercent)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
