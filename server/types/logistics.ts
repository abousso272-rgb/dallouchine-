import { TransportMode } from '../../src/types';

export type ShipmentStatus =
  | 'awaiting_supplier'
  | 'supplier_confirmed'
  | 'preparing_in_china'
  | 'ready_to_ship'
  | 'shipped_from_china'
  | 'in_transit'
  | 'arrived_senegal'
  | 'customs'
  | 'at_hub'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export const ALLOWED_SHIPMENT_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  awaiting_supplier: ['supplier_confirmed', 'cancelled'],
  supplier_confirmed: ['preparing_in_china', 'cancelled'],
  preparing_in_china: ['ready_to_ship', 'cancelled'],
  ready_to_ship: ['shipped_from_china', 'cancelled'],
  shipped_from_china: ['in_transit', 'cancelled'],
  in_transit: ['arrived_senegal'],
  arrived_senegal: ['customs'],
  customs: ['at_hub'],
  at_hub: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: []
};

export interface CarrierRecord {
  id: string;
  name: string;
  code: string;
  contact?: string;
  active: boolean;
  mode: TransportMode;
  ratePerKgXOF?: number;
  ratePerCbmXOF?: number;
  minChargeXOF?: number;
  volumetricFactor?: number;
  baseTransitDaysMin?: number;
  baseTransitDaysMax?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HubRecord {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  phone?: string;
  active: boolean;
  managerName?: string;
  maxCapacity?: number;
  activeParcelsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentRecord {
  id: string;
  orderId: string;
  orderCode: string;
  userId?: string;
  trackingCode: string;
  carrierId: string;
  carrierName?: string;
  carrierCode?: string;
  origin: string;
  destination: string;
  transportMode: TransportMode;
  status: ShipmentStatus;
  estimatedDeparture?: string;
  actualDeparture?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  hubId?: string;
  hubName?: string;
  notes?: string;
  // Internal costs strictly hidden from client
  internalCostEstimatedXOF?: number;
  internalCostConfirmedXOF?: number;
  internalCostActualXOF?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentEventRecord {
  id: string;
  shipmentId: string;
  eventType: string;
  previousStatus: ShipmentStatus | string;
  newStatus: ShipmentStatus | string;
  location: string;
  description: string;
  metadata?: Record<string, any>;
  actorUserId?: string;
  actorRole?: string;
  actorName?: string;
  createdAt: string;
}

export interface ShipmentDocumentRecord {
  id: string;
  shipmentId: string;
  title: string;
  docType: 'packing_list' | 'commercial_invoice' | 'bill_of_lading' | 'airway_bill' | 'customs_declaration' | 'inspection_certificate';
  fileUrl: string;
  isInternal: boolean; // MUST NEVER be sent to client if true
  uploadedBy?: string;
  createdAt: string;
}

export interface InAppNotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'logistics' | 'payment' | 'system';
  shipmentId?: string;
  trackingCode?: string;
  isRead: boolean;
  createdAt: string;
}

// Sanitized version for client consumption (zero internal/confidential data)
export interface PublicShipmentDTO {
  id: string;
  orderId: string;
  orderCode: string;
  trackingCode: string;
  carrier: {
    id: string;
    name: string;
    code: string;
    mode: TransportMode;
  } | null;
  origin: string;
  destination: string;
  transportMode: TransportMode;
  status: ShipmentStatus;
  statusLabel: string;
  estimatedDeparture?: string;
  actualDeparture?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  isEtaEstimated: boolean;
  hub: {
    id: string;
    name: string;
    city: string;
    address: string;
  } | null;
  notes?: string;
  events: Array<{
    id: string;
    eventType: string;
    previousStatus: string;
    newStatus: string;
    location: string;
    description: string;
    createdAt: string;
  }>;
  documents: Array<{
    id: string;
    title: string;
    docType: string;
    fileUrl: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
