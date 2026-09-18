export type AdminRole = 
  | 'SUPER_ADMIN' 
  | 'OPERATIONS' 
  | 'SOURCING' 
  | 'LOGISTICS' 
  | 'FINANCE' 
  | 'CUSTOMER_SUPPORT';

export type TransportMode = 'air' | 'sea' | 'express';

export type GroupageStatus = 
  | 'draft' 
  | 'open' 
  | 'closing_soon' 
  | 'closed' 
  | 'purchasing' 
  | 'quality_check' 
  | 'shipped' 
  | 'arrived' 
  | 'completed' 
  | 'cancelled';

export type TrackingStatus = 
  | 'order_confirmed'
  | 'payment_received'
  | 'groupage_consolidated'
  | 'purchased_in_china'
  | 'quality_control_passed'
  | 'shipped_from_china'
  | 'in_transit'
  | 'arrived_in_senegal'
  | 'customs_cleared'
  | 'arrived_at_hub'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered';

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  images: string[];
  shortDescription: string;
  fullDescription: string;
  specifications: Record<string, string>;
  features: string[];
  unitWeightKg: number;
  dimensionsCm: {
    length: number;
    width: number;
    height: number;
  };
  cbm: number;
  moq: number;
  basePriceCNY: number;
  basePriceUSD: number;
  priceXOF: number;
  previousPriceXOF?: number;
  isGroupage: boolean;
  activeGroupageId?: string;
  supplierId: string;
  sourcerId?: string;
  defaultTransportMode: TransportMode;
  estimatedDeliveryDays: string;
  stockStatus: 'in_stock' | 'groupage_only' | 'on_demand' | 'low_stock';
  targetMarginPercent: number;
  rating: number;
  reviewsCount: number;
  tags: string[];
  createdAt: string;
}

export interface Groupage {
  id: string;
  code: string; // e.g. GRP-024
  title: string;
  productId: string;
  product?: Product;
  unitPriceXOF: number;
  originalPriceXOF: number;
  targetUnits: number;
  currentUnits: number;
  participantsCount: number;
  startDate: string;
  closingDate: string;
  estimatedDepartureDate: string;
  estimatedArrivalDate: string;
  transportMode: TransportMode;
  status: GroupageStatus;
  minOrderPerUser: number;
  maxOrderPerUser: number;
  savingsPercent: number;
  logisticsRoute: string; // e.g. "Yiwu Hub -> Dakar Port/Airport"
  guaranteeNote: string;
  keyBenefits: string[];
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  address?: string;
  customerType?: 'b2c' | 'b2b';
  avatar?: string;
  totalOrdersCount: number;
  totalSpentXOF?: number;
  lastOrderDate?: string;
  isVerified?: boolean;
}

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  altPhone?: string;
  region: string;
  city: string;
  district: string;
  landmark?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPriceXOF: number;
  totalPriceXOF: number;
  isGroupage: boolean;
  groupageId?: string;
  transportMode: TransportMode;
}

export interface CartItem {
  product: Product;
  quantity: number;
  isGroupage?: boolean;
  groupageId?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
  description: string;
  popularSearchTerms: string[];
  featuredTag?: string;
}

export interface TrackingEvent {
  id: string;
  status: TrackingStatus;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
}

export interface Order {
  id: string;
  trackingCode: string; // e.g. AWP-10482
  customer: Customer;
  items: OrderItem[];
  subtotalXOF: number;
  shippingFeeXOF: number;
  totalXOF: number;
  paymentMethod: 'wave' | 'orange_money' | 'free_money' | 'card' | 'hub_cash';
  paymentStatus: 'pending' | 'paid' | 'partially_paid' | 'refunded';
  currentStatus: TrackingStatus;
  deliveryType: 'hub_pickup' | 'home_delivery';
  hubLocationId?: string;
  deliveryAddress?: DeliveryAddress;
  createdAt: string;
  estimatedDeliveryDate: string;
  trackingTimeline: TrackingEvent[];
  notes?: string;
}

export interface HubLocation {
  id: string;
  name: string;
  district: string;
  city: string;
  address: string;
  openingHours: string;
  managerName: string;
  managerPhone: string;
  currentCapacityPercent: number;
  activeParcelsCount: number;
}

export interface Supplier {
  id: string;
  name: string;
  platform: '1688' | 'direct_factory' | 'made_in_china' | 'yiwu_market';
  location: string;
  city: string;
  rating: number;
  averageLeadTimeDays: number;
  status: 'pending' | 'verified' | 'preferred' | 'suspended';
  contactPerson: string;
  phone: string;
  weChat: string;
  productsCount: number;
  notes: string;
  verifiedSince: string;
}

export interface Sourcer {
  id: string;
  name: string;
  locationCity: 'Guangzhou' | 'Yiwu' | 'Shenzhen' | 'Hangzhou';
  specialties: string[];
  commissionRatePercent: number;
  rating: number;
  activeTasksCount: number;
  completedOrdersCount: number;
  phone: string;
  email: string;
  avatar: string;
}

export interface Carrier {
  id: string;
  name: string;
  mode: TransportMode;
  ratePerKgXOF: number;
  ratePerCbmXOF: number;
  minChargeXOF: number;
  volumetricFactor: number; // 6000 for air, 5000 for express, CBM for sea
  baseTransitDaysMin: number;
  baseTransitDaysMax: number;
  reliabilityScore: number;
  departureFrequency: string;
  notes: string;
}

export interface B2BQuote {
  id: string;
  unitCostSupplierCNY: number;
  freightEstimatedXOF: number;
  customsEstimatedXOF: number;
  totalPerUnitXOF: number;
  suggestedSellingPriceXOF: number;
  leadTimeDays: number;
  recommendedTransport: TransportMode;
  validUntil: string;
  notes: string;
}

export interface B2BRequest {
  id: string;
  code: string; // e.g. B2B-8921
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  productType: string;
  quantity: number;
  targetBudgetXOF: number;
  transportPreference: 'air' | 'sea' | 'express' | 'recommended';
  specifications: string;
  attachments?: string[];
  status: 'draft' | 'submitted' | 'sourcing_in_progress' | 'quote_ready' | 'negotiation' | 'approved' | 'in_production' | 'shipped' | 'delivered';
  quote?: B2BQuote;
  createdAt: string;
}

export interface CostCalculationInput {
  productPriceCNY: number;
  productPriceUSD?: number;
  quantity: number;
  weightKgPerUnit: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  exchangeRateCNY_XOF: number; // e.g. 88.5
  exchangeRateUSD_XOF: number; // e.g. 610.0
  sourcingFeePercent: number; // e.g. 5%
  sourcerInspectionFixedXOF: number; // e.g. 15,000 XOF
  consolidationFeePerCbmXOF: number; // e.g. 12,000 XOF
  consolidationHandlingFixedXOF: number; // e.g. 8,000 XOF
  selectedCarrierId: string;
  customsClearanceRatePercent: number; // e.g. 8%
  customsFixedPerShipmentXOF: number; // e.g. 25,000 XOF
  safetyBufferPercent: number; // e.g. 5%
  targetMarginPercent: number; // e.g. 35%
  minMarginPercent: number; // e.g. 20%
}

export interface CostCalculationResult {
  // Unit values
  unitBaseProductCostXOF: number;
  unitSourcingCostXOF: number;
  unitConsolidationCostXOF: number;
  unitTransportCostXOF: number;
  unitCustomsCostXOF: number;
  unitSafetyBufferXOF: number;
  totalUnitCostXOF: number;
  
  // Total shipment values
  totalBaseProductCostXOF: number;
  totalSourcingCostXOF: number;
  totalConsolidationCostXOF: number;
  totalTransportCostXOF: number;
  totalCustomsCostXOF: number;
  totalSafetyBufferXOF: number;
  grandTotalCostXOF: number;

  // Weight & Volume metrics
  actualTotalWeightKg: number;
  volumetricWeightKgPerUnit: number;
  totalVolumetricWeightKg: number;
  chargeableWeightKg: number;
  unitCbm: number;
  totalCbm: number;

  // Pricing & Margins
  suggestedUnitPriceXOF: number;
  unitMarginXOF: number;
  actualMarginPercent: number;
  minAllowedUnitPriceXOF: number;
  totalRevenueXOF: number;
  totalGrossProfitXOF: number;
  roiPercent: number;
  breakEvenUnits: number;
}

export interface VolumeSimulationStep {
  volume: number;
  unitSupplierPriceCNY: number;
  unitSupplierCostXOF: number;
  unitTransportCostXOF: number;
  unitConsolidationCostXOF: number;
  unitTotalCostXOF: number;
  suggestedUnitPriceXOF: number;
  unitMarginXOF: number;
  marginPercent: number;
  totalProfitXOF: number;
  savingsVsSmallVolumePercent: number;
}

export interface CostVarianceItem {
  id: string;
  groupageCode: string;
  productName: string;
  date: string;
  estimatedWeightKg: number;
  actualWeightKg: number;
  weightVarianceKg: number;
  estimatedFreightXOF: number;
  actualFreightXOF: number;
  freightVarianceXOF: number;
  freightVariancePercent: number;
  estimatedCustomsXOF: number;
  actualCustomsXOF: number;
  estimatedMarginPercent: number;
  actualMarginPercent: number;
  marginImpactPercent: number;
  causeNote: string;
}

export interface AdminAlert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  category?: 'financial' | 'logistics' | 'product' | 'supplier' | 'order' | 'system';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  linkTo: string;
  timestamp: string;
  isRead: boolean;
  actionLabel?: string;
}

export interface AdminActivityLog {
  id: string;
  timestamp: string;
  time: string;
  actor: string;
  actorRole: string;
  action: string;
  targetType: 'order' | 'groupage' | 'product' | 'payment' | 'sourcing' | 'supplier' | 'hub';
  targetId: string;
  targetLabel: string;
  statusBadge?: string;
}

export interface SourcingPipelineRequest {
  id: string;
  code: string; // e.g. SRC-2041
  productName: string;
  category: string;
  clientName: string;
  clientPhone: string;
  targetQuantity: number;
  targetBudgetXOF: number;
  specifications: string;
  imageUrl?: string;
  platformSource?: '1688' | 'taobao' | 'direct_factory' | 'yiwu';
  assignedSourcerId?: string;
  assignedSourcerName?: string;
  deadlineDate: string;
  createdAt: string;
  status: 'pending' | 'searching' | 'offers_received' | 'validation' | 'ordered' | 'completed' | 'cancelled';
  offersCount: number;
  bestOfferSupplierCNY?: number;
  bestOfferTotalXOF?: number;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderCode: string; // e.g. AWP-10482
  customerName: string;
  customerPhone: string;
  amountXOF: number;
  method: 'wave' | 'orange_money' | 'free_money' | 'card' | 'hub_cash';
  status: 'received' | 'pending' | 'failed' | 'refunded';
  reference: string;
  date: string;
  time: string;
  operatorFeeXOF: number;
  netReceivedXOF: number;
  verifiedBy?: string;
}

export interface PromotionItem {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number; // e.g. 15 for 15% or 5000 for 5000 XOF
  minOrderAmountXOF: number;
  usageCount: number;
  maxUsageLimit: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'scheduled' | 'active' | 'expired';
  isFeatured: boolean;
  applicableCategory?: string;
}

export interface NotificationTemplate {
  id: string;
  title: string;
  eventTrigger: 'order_confirmed' | 'payment_received' | 'groupage_closed' | 'shipped_china' | 'arrived_senegal' | 'hub_ready' | 'custom_broadcast';
  channels: ('email' | 'whatsapp' | 'sms' | 'push')[];
  subject: string;
  bodyTemplate: string;
  variables: string[];
  isActive: boolean;
  lastSentAt?: string;
  totalSentCount: number;
}

export interface CalculationSettings {
  exchangeRateCNY_XOF: number;
  exchangeRateUSD_XOF: number;
  defaultAirRatePerKgXOF: number;
  defaultSeaRatePerCbmXOF: number;
  defaultExpressRatePerKgXOF: number;
  defaultSourcingFeePercent: number;
  defaultInspectionFeeXOF: number;
  defaultConsolidationCbmFeeXOF: number;
  defaultConsolidationFixedFeeXOF: number;
  defaultCustomsClearancePercent: number;
  defaultCustomsFixedFeeXOF: number;
  defaultSafetyBufferPercent: number;
  defaultTargetMarginPercent: number;
  defaultMinMarginPercent: number;
  roundingPrecisionXOF: number; // e.g. round to nearest 100 or 500
}

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  isLoggedIn: boolean;
  role: 'client' | 'admin';
  adminRole?: AdminRole;
}

