import {
  Carrier,
  CostCalculationInput,
  CostCalculationResult,
  VolumeSimulationStep,
  TransportMode,
  CalculationSettings
} from '../types';

export const DEFAULT_CALCULATION_SETTINGS: CalculationSettings = {
  exchangeRateCNY_XOF: 88.5,
  exchangeRateUSD_XOF: 615.0,
  defaultAirRatePerKgXOF: 7500,
  defaultSeaRatePerCbmXOF: 185000,
  defaultExpressRatePerKgXOF: 12500,
  defaultSourcingFeePercent: 4.5,
  defaultInspectionFeeXOF: 15000,
  defaultConsolidationCbmFeeXOF: 12000,
  defaultConsolidationFixedFeeXOF: 10000,
  defaultCustomsClearancePercent: 6.0,
  defaultCustomsFixedFeeXOF: 25000,
  defaultSafetyBufferPercent: 5.0,
  defaultTargetMarginPercent: 35.0,
  defaultMinMarginPercent: 20.0,
  roundingPrecisionXOF: 100
};

export function roundToPrecision(amount: number, precision: number = 100): number {
  return Math.ceil(amount / precision) * precision;
}

export function computeCostAndProfitability(
  input: CostCalculationInput,
  carrier?: Carrier
): CostCalculationResult {
  const qty = Math.max(1, input.quantity);
  
  // 1. Base Product Cost
  let unitBaseCostXOF = 0;
  if (input.productPriceCNY && input.productPriceCNY > 0) {
    unitBaseCostXOF = input.productPriceCNY * input.exchangeRateCNY_XOF;
  } else if (input.productPriceUSD && input.productPriceUSD > 0) {
    unitBaseCostXOF = input.productPriceUSD * input.exchangeRateUSD_XOF;
  }
  const totalBaseCostXOF = unitBaseCostXOF * qty;

  // 2. Dimensions & Weight Metrics
  const unitCbm = (input.lengthCm * input.widthCm * input.heightCm) / 1_000_000;
  const totalCbm = unitCbm * qty;

  const actualTotalWeightKg = input.weightKgPerUnit * qty;
  
  const volumetricFactor = carrier?.volumetricFactor || 6000;
  const volumetricWeightKgPerUnit = (input.lengthCm * input.widthCm * input.heightCm) / volumetricFactor;
  const totalVolumetricWeightKg = volumetricWeightKgPerUnit * qty;

  const mode = carrier?.mode || 'air';
  let chargeableWeightKg = actualTotalWeightKg;
  if (mode === 'air' || mode === 'express') {
    chargeableWeightKg = Math.max(actualTotalWeightKg, totalVolumetricWeightKg);
  }

  // 3. Transport Costs
  let totalTransportCostXOF = 0;
  if (carrier) {
    if (carrier.mode === 'sea') {
      const cbmCost = totalCbm * carrier.ratePerCbmXOF;
      totalTransportCostXOF = Math.max(cbmCost, carrier.minChargeXOF);
    } else {
      const weightCost = chargeableWeightKg * carrier.ratePerKgXOF;
      totalTransportCostXOF = Math.max(weightCost, carrier.minChargeXOF);
    }
  } else {
    // Fallback default air estimation
    totalTransportCostXOF = Math.max(chargeableWeightKg * 7500, 15000);
  }
  const unitTransportCostXOF = totalTransportCostXOF / qty;

  // 4. Sourcing & Inspection Fees
  const totalSourcingCostXOF = 
    (totalBaseCostXOF * (input.sourcingFeePercent / 100)) + 
    input.sourcerInspectionFixedXOF;
  const unitSourcingCostXOF = totalSourcingCostXOF / qty;

  // 5. Consolidation & China Warehouse Handling
  const totalConsolidationCostXOF = 
    (totalCbm * input.consolidationFeePerCbmXOF) + 
    input.consolidationHandlingFixedXOF;
  const unitConsolidationCostXOF = totalConsolidationCostXOF / qty;

  // 6. Customs & Senegal Port/Airport Clearance
  const totalCustomsCostXOF = 
    (totalBaseCostXOF * (input.customsClearanceRatePercent / 100)) + 
    input.customsFixedPerShipmentXOF;
  const unitCustomsCostXOF = totalCustomsCostXOF / qty;

  // 7. Subtotal before safety buffer
  const subtotalShipmentCostXOF = 
    totalBaseCostXOF + 
    totalTransportCostXOF + 
    totalSourcingCostXOF + 
    totalConsolidationCostXOF + 
    totalCustomsCostXOF;

  // 8. Safety Buffer / Fluctuation Reserve
  const totalSafetyBufferXOF = subtotalShipmentCostXOF * (input.safetyBufferPercent / 100);
  const unitSafetyBufferXOF = totalSafetyBufferXOF / qty;

  // 9. Total Unit & Shipment Landed Cost
  const grandTotalCostXOF = subtotalShipmentCostXOF + totalSafetyBufferXOF;
  const totalUnitCostXOF = grandTotalCostXOF / qty;

  // 10. Suggested Selling Price based on target gross margin %
  // Price = LandedCost / (1 - targetMargin)
  const targetMarginFactor = 1 - (input.targetMarginPercent / 100);
  const rawSuggestedPrice = targetMarginFactor > 0.05 ? totalUnitCostXOF / targetMarginFactor : totalUnitCostXOF * 1.5;
  const suggestedUnitPriceXOF = roundToPrecision(rawSuggestedPrice, 100);

  const minMarginFactor = 1 - (input.minMarginPercent / 100);
  const minAllowedUnitPriceXOF = roundToPrecision(
    minMarginFactor > 0.05 ? totalUnitCostXOF / minMarginFactor : totalUnitCostXOF * 1.2,
    100
  );

  const unitMarginXOF = suggestedUnitPriceXOF - totalUnitCostXOF;
  const actualMarginPercent = suggestedUnitPriceXOF > 0 ? (unitMarginXOF / suggestedUnitPriceXOF) * 100 : 0;

  const totalRevenueXOF = suggestedUnitPriceXOF * qty;
  const totalGrossProfitXOF = totalRevenueXOF - grandTotalCostXOF;
  const roiPercent = grandTotalCostXOF > 0 ? (totalGrossProfitXOF / grandTotalCostXOF) * 100 : 0;

  // Break even units (how many units need to be sold at suggested price to cover fixed + variable costs)
  const breakEvenUnits = unitMarginXOF > 0 ? Math.ceil(grandTotalCostXOF / suggestedUnitPriceXOF) : qty;

  const unitBaseProductCostXOF = unitBaseCostXOF;
  const totalBaseProductCostXOF = totalBaseCostXOF;

  return {
    unitBaseProductCostXOF,
    unitSourcingCostXOF,
    unitConsolidationCostXOF,
    unitTransportCostXOF,
    unitCustomsCostXOF,
    unitSafetyBufferXOF,
    totalUnitCostXOF,

    totalBaseProductCostXOF,
    totalSourcingCostXOF,
    totalConsolidationCostXOF,
    totalTransportCostXOF,
    totalCustomsCostXOF,
    totalSafetyBufferXOF,
    grandTotalCostXOF,

    actualTotalWeightKg,
    volumetricWeightKgPerUnit,
    totalVolumetricWeightKg,
    chargeableWeightKg,
    unitCbm,
    totalCbm,

    suggestedUnitPriceXOF,
    unitMarginXOF,
    actualMarginPercent,
    minAllowedUnitPriceXOF,
    totalRevenueXOF,
    totalGrossProfitXOF,
    roiPercent,
    breakEvenUnits
  };
}

export function simulateVolumeScale(
  baseInput: CostCalculationInput,
  carrier?: Carrier,
  volumeSteps: number[] = [10, 25, 50, 100, 250, 500]
): VolumeSimulationStep[] {
  // Baseline unit cost for comparison
  const baseline = computeCostAndProfitability({ ...baseInput, quantity: volumeSteps[0] || 10 }, carrier);
  const baselineCost = baseline.totalUnitCostXOF;

  return volumeSteps.map((vol) => {
    // Volume tiered supplier discount approximation
    let supplierDiscountPercent = 0;
    if (vol >= 500) supplierDiscountPercent = 14;
    else if (vol >= 250) supplierDiscountPercent = 10;
    else if (vol >= 100) supplierDiscountPercent = 7;
    else if (vol >= 50) supplierDiscountPercent = 4;
    else if (vol >= 25) supplierDiscountPercent = 2;

    const discountedCNY = baseInput.productPriceCNY * (1 - supplierDiscountPercent / 100);

    const stepInput: CostCalculationInput = {
      ...baseInput,
      productPriceCNY: discountedCNY,
      quantity: vol
    };

    const res = computeCostAndProfitability(stepInput, carrier);
    const savingsVsSmallVolumePercent = baselineCost > 0 
      ? Math.max(0, ((baselineCost - res.totalUnitCostXOF) / baselineCost) * 100)
      : 0;

    return {
      volume: vol,
      unitSupplierPriceCNY: discountedCNY,
      unitSupplierCostXOF: res.unitBaseProductCostXOF,
      unitTransportCostXOF: res.unitTransportCostXOF,
      unitConsolidationCostXOF: res.unitConsolidationCostXOF,
      unitTotalCostXOF: res.totalUnitCostXOF,
      suggestedUnitPriceXOF: res.suggestedUnitPriceXOF,
      unitMarginXOF: res.unitMarginXOF,
      marginPercent: res.actualMarginPercent,
      totalProfitXOF: res.totalGrossProfitXOF,
      savingsVsSmallVolumePercent
    };
  });
}

export interface TransportComparisonOption {
  mode: TransportMode;
  carrierName: string;
  carrierId: string;
  transitTimeLabel: string;
  unitTransportCostXOF: number;
  totalTransportCostXOF: number;
  totalUnitCostXOF: number;
  suggestedPriceXOF: number;
  marginPercent: number;
  isRecommended: boolean;
  recommendationReason: string;
}

export function compareTransportModes(
  input: CostCalculationInput,
  carriers: Carrier[]
): TransportComparisonOption[] {
  const options: TransportComparisonOption[] = [];

  const airCarrier = carriers.find(c => c.mode === 'air') || carriers[0];
  const seaCarrier = carriers.find(c => c.mode === 'sea');
  const expressCarrier = carriers.find(c => c.mode === 'express');

  const evaluatedModes = [airCarrier, seaCarrier, expressCarrier].filter(Boolean) as Carrier[];

  evaluatedModes.forEach((carrier) => {
    const res = computeCostAndProfitability(input, carrier);
    const transitTimeLabel = `${carrier.baseTransitDaysMin}–${carrier.baseTransitDaysMax} jours`;
    
    options.push({
      mode: carrier.mode,
      carrierName: carrier.name,
      carrierId: carrier.id,
      transitTimeLabel,
      unitTransportCostXOF: res.unitTransportCostXOF,
      totalTransportCostXOF: res.totalTransportCostXOF,
      totalUnitCostXOF: res.totalUnitCostXOF,
      suggestedPriceXOF: res.suggestedUnitPriceXOF,
      marginPercent: res.actualMarginPercent,
      isRecommended: false,
      recommendationReason: ''
    });
  });

  // Recommendation logic based on density, urgency, and unit cost share
  const totalWeight = input.weightKgPerUnit * input.quantity;
  const totalCbm = (input.lengthCm * input.widthCm * input.heightCm * input.quantity) / 1_000_000;

  if (totalWeight > 200 || totalCbm > 1.2) {
    const sea = options.find(o => o.mode === 'sea');
    if (sea) {
      sea.isRecommended = true;
      sea.recommendationReason = 'Recommandé : Volume lourd/volumineux permettant une économie d\'échelle massive via fret maritime.';
    }
  } else if (input.productPriceCNY > 200 && totalWeight < 20) {
    const air = options.find(o => o.mode === 'air');
    if (air) {
      air.isRecommended = true;
      air.recommendationReason = 'Recommandé : Produit à haute valeur ajoutée et faible poids. Fret aérien optimal pour rotation rapide.';
    }
  } else {
    const air = options.find(o => o.mode === 'air');
    if (air) {
      air.isRecommended = true;
      air.recommendationReason = 'Recommandé : Meilleur équilibre délai (12-18j) / coût pour un groupage standard Chine-Sénégal.';
    }
  }

  return options;
}
