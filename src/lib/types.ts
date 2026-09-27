import type { RequestType } from './status';

export type AppRole = 'admin' | 'transitaire' | 'groupage_manager' | 'client';

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  companyName: string;
  role: AppRole;
  rawRole: string;
  permissions: string[];
  status: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  parentId?: string | null;
}

export interface ProductImage {
  id?: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  sku?: string | null;
  shortDescription: string;
  description: string;
  categoryId: string | null;
  categoryName: string;
  categorySlug: string;
  priceXOF: number;
  compareAtPriceXOF: number | null;
  moq: number;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  weightKg: number;
  transportMode: 'air' | 'sea' | 'express';
  deliveryDelay: string;
  features: string[];
  specifications: Record<string, string>;
  tags: string[];
  images: string[];
  imageRecords: ProductImage[];
  isActive: boolean;
  isFeatured: boolean;
  isGroupage: boolean;
  isAutoMobility: boolean;
  createdAt: string;
}

export interface Groupage {
  id: string;
  code: string;
  title: string;
  description: string;
  productId: string;
  product?: Pick<Product, 'id' | 'slug' | 'name' | 'images' | 'priceXOF' | 'categoryName' | 'shortDescription'> | null;
  image: string | null;
  targetQuantity: number;
  reservedQuantity: number;
  participantsCount: number;
  minPerUser: number;
  maxPerUser: number;
  unitPriceXOF: number;
  originalPriceXOF: number;
  supplierMoq: number;
  transportMode: 'air' | 'sea' | 'express';
  route: string;
  startDate: string | null;
  deadline: string | null;
  estimatedDeparture: string | null;
  estimatedArrival: string | null;
  status: string;
  statusNote: string | null;
  guaranteeNote: string | null;
  highlights: string[];
  assignedManagerId: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CartLine {
  key: string;
  productId: string;
  groupageId: string | null;
  quantity: number;
  product: Pick<Product, 'id' | 'slug' | 'name' | 'images' | 'priceXOF' | 'moq' | 'availableQuantity' | 'transportMode'>;
  unitPriceXOF: number;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  groupageId: string | null;
  name: string;
  image: string | null;
  quantity: number;
  unitPriceXOF: number;
  subtotalXOF: number;
}

export interface OrderEvent {
  id: string;
  oldStatus: string | null;
  status: string;
  location: string | null;
  description: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  trackingCode: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerCity: string;
  subtotalXOF: number;
  shippingFeeXOF: number;
  discountXOF: number;
  totalXOF: number;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string;
  deliveryType: string;
  hubId: string | null;
  deliveryAddress: Record<string, string> | null;
  notes: string | null;
  kind: string;
  quoteId: string | null;
  quotePaymentKind: string | null;
  carrierReference: string | null;
  logisticsNotes: string | null;
  estimatedDeliveryDate: string | null;
  transportMode: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  events: OrderEvent[];
}

export interface Quote {
  id: string;
  number: string;
  title: string | null;
  requestType: RequestType | null;
  requestId: string | null;
  subtotalXOF: number;
  shippingXOF: number;
  customsXOF: number;
  feesXOF: number;
  discountXOF: number;
  totalXOF: number;
  depositPercent: number;
  depositXOF: number;
  balanceXOF: number;
  validUntil: string;
  leadTime: string | null;
  transportMode: string | null;
  conditions: string[];
  version: number;
  status: string;
  notes: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  items: { id: string; description: string; quantity: number; unitPriceXOF: number; subtotalXOF: number }[];
}

export interface ClientRequest {
  id: string;
  type: RequestType;
  code: string;
  title: string;
  description: string;
  status: string;
  quantity: number;
  budgetXOF: number | null;
  userId: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  company: string | null;
  images: string[];
  links: string[];
  category: string | null;
  notes: string | null;
  internalNotes: string | null;
  assignedTo: string | null;
  extra: Record<string, string | number | boolean | null>;
  createdAt: string;
  updatedAt: string;
}

export interface Finding {
  id: string;
  supplierName: string;
  supplierUrl: string | null;
  unitPriceCNY: number | null;
  unitPriceXOF: number | null;
  moq: number | null;
  leadTimeDays: number | null;
  notes: string | null;
  photos: string[];
  isSelected: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string | null;
  senderRole: 'client' | 'staff';
  senderName: string | null;
  body: string;
  attachmentUrl: string | null;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  slug: string;
  title: string;
  vehicleType: string;
  brand: string;
  model: string;
  year: number | null;
  condition: string;
  mileageKm: number | null;
  fuel: string | null;
  transmission: string | null;
  engine: string | null;
  powerHp: number | null;
  seats: number | null;
  color: string | null;
  priceXOF: number | null;
  priceOnRequest: boolean;
  status: string;
  isPublished: boolean;
  isFeatured: boolean;
  description: string;
  features: string[];
  images: string[];
  location: string | null;
  leadTime: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Hub {
  id: string;
  name: string;
  district: string | null;
  city: string;
  address: string;
  openingHours: string | null;
}

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  permissions: string[];
  status: string;
  createdAt: string;
}
