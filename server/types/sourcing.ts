// ==============================================================================
// TYPES TYPESCRIPT POUR LE SOURCING RÉEL, FOURNISSEURS ET DEVIS (ÉTAPE 9)
// ==============================================================================

export type SourcingStatus =
  | 'new'
  | 'researching'
  | 'supplier_found'
  | 'negotiating'
  | 'quote_ready'
  | 'quote_sent'
  | 'accepted'
  | 'rejected'
  | 'ordered'
  | 'completed'
  | 'cancelled';

export type SourcingQuoteStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'superseded';

export interface SourcingActor {
  userId: string;
  role: 'client' | 'sourcer' | 'admin' | 'SUPER_ADMIN' | 'OPERATIONS' | 'SOURCING';
  name?: string;
}

export interface SourcingAttachmentRecord {
  id: string;
  sourcingRequestId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
  isInternal: boolean;
  uploadedBy?: string;
  createdAt: string;
}

export interface SupplierRecord {
  id: string;
  name: string;
  platform: '1688' | 'alibaba' | 'taobao' | 'direct_factory' | 'yiwu_market' | 'other';
  productUrl?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactWeChat?: string;
  contactEmail?: string;
  country: string;
  city: string;
  supplierCode: string;
  moq: number;
  supplierPriceCNY?: number;
  supplierPriceXOF?: number;
  currency: string;
  leadTimeDays: number;
  customizationAvailable: boolean;
  rating: number;
  verificationStatus: 'pending' | 'verified' | 'preferred' | 'suspended';
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SourcingRequestSupplierRecord {
  id: string;
  requestId: string;
  supplierId: string;
  supplierName?: string;
  supplierCode?: string;
  supplierPlatform?: string;
  initialPriceCNY?: number;
  negotiatedPriceCNY?: number;
  unitPriceXOF?: number;
  moq: number;
  leadTimeDays: number;
  sampleAvailable: boolean;
  sampleCostCNY?: number;
  customizationConfirmed: boolean;
  internalNotes?: string;
  clientVisibleNotes?: string;
  isSelected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SourcingQuoteItem {
  description: string;
  quantity: number;
  unitProductPriceXOF: number;
  totalProductPriceXOF: number;
}

export interface SourcingQuoteRecord {
  id: string;
  code: string; // e.g. DEV-2026-0048
  sourcingRequestId: string;
  customerId?: string;
  assignedSourcerId?: string;
  selectedSupplierId?: string;
  
  version: number;
  status: SourcingQuoteStatus;
  
  quantity: number;
  unitProductPriceXOF: number;
  totalProductPriceXOF: number;
  sourcingFeeXOF: number;
  inspectionFeeXOF: number;
  estimatedLogisticsXOF: number;
  estimatedCustomsXOF: number;
  additionalFeesXOF: number;
  
  totalClientXOF: number;
  currency: string;
  
  // Marges et notes internes STRICTEMENT masquées aux clients
  internalMarginXOF?: number;
  internalNotes?: string;
  
  depositRequiredPercent: number;
  depositAmountXOF: number;
  balanceDueXOF: number;
  
  leadTimeDays: string;
  transportMode: 'air' | 'sea' | 'express';
  conditions: string[];
  validUntil: string;
  
  sentAt?: string;
  acceptedAt?: string;
  acceptedBy?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  
  items: SourcingQuoteItem[];
  
  createdAt: string;
  updatedAt: string;
}

export interface SourcingEventRecord {
  id: string;
  sourcingRequestId: string;
  eventType: string;
  previousStatus?: string;
  newStatus?: string;
  description: string;
  actorUserId?: string;
  actorRole?: string;
  actorName?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SourcingRequestRecord {
  id: string;
  code: string; // e.g. SRC-2026-0089
  customerId?: string;
  customerName: string;
  customerCompany?: string;
  customerPhone: string;
  customerEmail?: string;
  
  productName: string;
  productDescription?: string;
  productLink?: string;
  productImages: string[];
  attachments?: SourcingAttachmentRecord[];
  
  quantity: number;
  targetBudget: number;
  currency: string;
  
  specifications?: string;
  customization?: string;
  desiredDeadline?: string;
  destination: string;
  notes?: string;
  
  status: SourcingStatus;
  
  assignedSourcerId?: string;
  assignedSourcerName?: string;
  assignedAt?: string;
  assignedBy?: string;
  
  // Structure prête pour IA future (isolée des données certifiées)
  aiMetadata?: {
    analysis?: any;
    suggestedSuppliers?: any;
    extractedAttributes?: any;
    searchKeywords?: string[];
    riskFlags?: string[];
  };
  
  createdAt: string;
  updatedAt: string;
}

// ==============================================================================
// DTOs POUR L'ISOLATION ET LA SÉCURITÉ DU CLIENT (MASQUAGE STRICT)
// ==============================================================================

export interface PublicSourcingRequestDTO {
  id: string;
  code: string;
  customerId?: string;
  customerName: string;
  customerCompany?: string;
  productName: string;
  productDescription?: string;
  productLink?: string;
  productImages: string[];
  quantity: number;
  targetBudget: number;
  currency: string;
  specifications?: string;
  customization?: string;
  desiredDeadline?: string;
  destination: string;
  notes?: string;
  status: SourcingStatus;
  statusLabel: string;
  assignedSourcerName?: string;
  assignedAt?: string;
  quotesCount: number;
  activeQuote?: PublicQuoteDTO | null;
  events?: SourcingEventRecord[];
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSizeBytes: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PublicQuoteDTO {
  id: string;
  code: string;
  sourcingRequestId: string;
  version: number;
  status: SourcingQuoteStatus;
  quantity: number;
  unitProductPriceXOF: number;
  totalProductPriceXOF: number;
  sourcingFeeXOF: number;
  inspectionFeeXOF: number;
  estimatedLogisticsXOF: number;
  estimatedCustomsXOF: number;
  additionalFeesXOF: number;
  totalClientXOF: number;
  currency: string;
  depositRequiredPercent: number;
  depositAmountXOF: number;
  balanceDueXOF: number;
  leadTimeDays: string;
  transportMode: 'air' | 'sea' | 'express';
  conditions: string[];
  validUntil: string;
  items: SourcingQuoteItem[];
  createdAt: string;
  sentAt?: string;
  acceptedAt?: string;
}

export interface PublicSupplierCandidateDTO {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierPlatform: string;
  moq: number;
  leadTimeDays: number;
  sampleAvailable: boolean;
  customizationConfirmed: boolean;
  clientVisibleNotes?: string;
  isSelected: boolean;
}
