import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import {
  PaymentItem,
  PaymentAttempt,
  WebhookLogRecord,
  PaymentStatus,
  InternalOrderStatus
} from '../types/payment';
import {
  CarrierRecord,
  HubRecord,
  ShipmentRecord,
  ShipmentEventRecord,
  ShipmentDocumentRecord,
  InAppNotificationRecord
} from '../types/logistics';
import {
  SourcingRequestRecord,
  SupplierRecord,
  SourcingRequestSupplierRecord,
  SourcingQuoteRecord,
  SourcingAttachmentRecord,
  SourcingEventRecord
} from '../types/sourcing';

export interface OrderRecord {
  id: string;
  trackingCode: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerCity: string;
  subtotalXOF: number;
  shippingFeeXOF: number;
  discountAmountXOF: number;
  totalXOF: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  orderStatus: InternalOrderStatus;
  deliveryType: string;
  hubLocationId?: string;
  deliveryAddress?: any;
  items: Array<{
    productId: string;
    productName: string;
    productImage?: string;
    quantity: number;
    unitPriceXOF: number;
    totalPriceXOF: number;
    isGroupage?: boolean;
    groupageId?: string;
  }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

class StorageManager {
  private supabase: SupabaseClient | null = null;
  private supabaseHealthy: boolean = true;
  private memoryOrders: Map<string, OrderRecord> = new Map();
  private memoryPayments: Map<string, PaymentItem> = new Map();
  private memoryAttempts: PaymentAttempt[] = [];
  private memoryWebhookLogs: Map<string, WebhookLogRecord> = new Map();
  private memoryCarriers: Map<string, CarrierRecord> = new Map();
  private memoryHubs: Map<string, HubRecord> = new Map();
  private memoryShipments: Map<string, ShipmentRecord> = new Map();
  private memoryShipmentEvents: Map<string, ShipmentEventRecord[]> = new Map();
  private memoryDocuments: Map<string, ShipmentDocumentRecord[]> = new Map();
  private memoryNotifications: Map<string, InAppNotificationRecord[]> = new Map();
  private memorySourcingRequests: Map<string, SourcingRequestRecord> = new Map();
  private memorySuppliers: Map<string, SupplierRecord> = new Map();
  private memoryRequestSuppliers: Map<string, SourcingRequestSupplierRecord[]> = new Map();
  private memorySourcingQuotes: Map<string, SourcingQuoteRecord> = new Map();
  private memorySourcingAttachments: Map<string, SourcingAttachmentRecord[]> = new Map();
  private memorySourcingEvents: Map<string, SourcingEventRecord[]> = new Map();

  private async safeDbCall<T>(fn: () => Promise<T>): Promise<T | null> {
    if (!this.supabase || !this.supabaseHealthy) return null;
    let timer: any;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Supabase network timeout')), 300);
      });
      const res = await Promise.race([fn(), timeout]);
      clearTimeout(timer);
      return res;
    } catch {
      clearTimeout(timer);
      this.supabaseHealthy = false;
      return null;
    }
  }

  constructor() {
    if (config.supabaseUrl && config.supabaseServiceRoleKey) {
      try {
        this.supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        });
        console.log('[StorageManager] Supabase client initialized.');
      } catch (err) {
        console.warn('[StorageManager] Failed to init Supabase client, using resilient local storage:', err);
      }
    } else {
      console.log('[StorageManager] No Supabase credentials provided, running with resilient local store.');
    }

    this.seedInitialData();
  }

  private seedInitialData() {
    // Exemples d'ordres initiaux
    const sampleOrder: OrderRecord = {
      id: 'ord-10482',
      trackingCode: 'AWP-10482',
      userId: 'cust-01',
      customerName: 'Amadou Diallo',
      customerPhone: '+221 77 540 22 11',
      customerEmail: 'amadou.diallo@gmail.com',
      customerCity: 'Dakar',
      subtotalXOF: 135000,
      shippingFeeXOF: 2000,
      discountAmountXOF: 0,
      totalXOF: 137000,
      paymentMethod: 'wave',
      paymentStatus: 'paid',
      orderStatus: 'purchased_in_china',
      deliveryType: 'home_delivery',
      items: [
        {
          productId: 'prod-01',
          productName: 'Machine à Café Espresso Professionnelle 15 Bars',
          quantity: 1,
          unitPriceXOF: 135000,
          totalPriceXOF: 135000
        }
      ],
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      paidAt: new Date(Date.now() - 3 * 86400000).toISOString()
    };

    this.memoryOrders.set(sampleOrder.id, sampleOrder);
    this.memoryOrders.set(sampleOrder.trackingCode, sampleOrder);

    const samplePayment: PaymentItem = {
      id: 'pay-001',
      orderId: 'ord-10482',
      orderCode: 'AWP-10482',
      userId: 'cust-01',
      provider: 'geniuspay',
      providerTransactionId: 'gp_tx_10482_sample',
      providerReference: 'GP-REF-89412',
      amount: 137000,
      currency: 'XOF',
      status: 'paid',
      paymentMethod: 'wave',
      customerName: 'Amadou Diallo',
      customerEmail: 'amadou.diallo@gmail.com',
      customerPhone: '+221 77 540 22 11',
      paidAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString()
    };

    this.memoryPayments.set(samplePayment.id, samplePayment);

    // Seeding des transporteurs réels
    const initialCarriers: CarrierRecord[] = [
      {
        id: 'car-01',
        name: 'Air Cargo Express Ningbo',
        code: 'AC-NGB',
        contact: '+86 574 8700 1234 / operations@ac-ningbo.com',
        active: true,
        mode: 'air',
        ratePerKgXOF: 6500,
        minChargeXOF: 25000,
        volumetricFactor: 6000,
        baseTransitDaysMin: 5,
        baseTransitDaysMax: 8,
        notes: 'Spécialiste vols directs cargo Guangzhou/Ningbo vers Dakar AIBD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'car-02',
        name: 'CMA CGM Direct West Africa',
        code: 'CMA-WA',
        contact: '+221 33 849 55 00 / dkr.logistics@cma-cgm.com',
        active: true,
        mode: 'sea',
        ratePerCbmXOF: 185000,
        minChargeXOF: 50000,
        volumetricFactor: 1000,
        baseTransitDaysMin: 30,
        baseTransitDaysMax: 38,
        notes: 'Groupage maritime conteneurs scellés LCL & FCL Port de Dakar',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'car-03',
        name: 'DHL Global Express Asia',
        code: 'DHL-ASIA',
        contact: '+221 33 869 30 30 / express@dhl.sn',
        active: true,
        mode: 'express',
        ratePerKgXOF: 12000,
        minChargeXOF: 35000,
        volumetricFactor: 5000,
        baseTransitDaysMin: 3,
        baseTransitDaysMax: 5,
        notes: 'Courrier express échantillons et pièces détachées urgentes',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    for (const c of initialCarriers) {
      this.memoryCarriers.set(c.id, c);
    }

    // Seeding des hubs logistiques
    const initialHubs: HubRecord[] = [
      {
        id: 'hub-01',
        name: 'Hub Central Almadies HQ',
        code: 'HUB-ALM',
        city: 'Dakar',
        address: 'Route des Almadies, Zone Ambassades, Dakar',
        phone: '+221 33 820 45 10',
        active: true,
        managerName: 'Babacar Faye',
        maxCapacity: 500,
        activeParcelsCount: 42,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'hub-02',
        name: 'Hub Plateforme Fret Ouest Foire',
        code: 'HUB-OF',
        city: 'Dakar',
        address: 'Voie de Dégagement Nord, En face CICES, Dakar',
        phone: '+221 33 867 12 34',
        active: true,
        managerName: 'Moussa Ndiaye',
        maxCapacity: 800,
        activeParcelsCount: 118,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'hub-03',
        name: 'Hub Régional Thiès / Mbour',
        code: 'HUB-THS',
        city: 'Thiès',
        address: 'Avenue Léopold Sédar Senghor, Thiès',
        phone: '+221 33 951 88 90',
        active: true,
        managerName: 'Aminata Sow',
        maxCapacity: 350,
        activeParcelsCount: 19,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    for (const h of initialHubs) {
      this.memoryHubs.set(h.id, h);
    }

    // Seeding de l'expédition initiale liée à la commande ord-10482
    const sampleShipment: ShipmentRecord = {
      id: 'shp-10482',
      orderId: 'ord-10482',
      orderCode: 'CMD-2026-0048',
      userId: 'cust-01',
      trackingCode: 'DLC-AIR-10482',
      carrierId: 'car-01',
      carrierName: 'Air Cargo Express Ningbo',
      carrierCode: 'AC-NGB',
      origin: 'Ningbo Lishe Air Hub, Chine',
      destination: 'Hub Central Almadies HQ, Dakar',
      transportMode: 'air',
      status: 'in_transit',
      estimatedDeparture: new Date(Date.now() - 4 * 86400000).toISOString(),
      actualDeparture: new Date(Date.now() - 2 * 86400000).toISOString(),
      estimatedArrival: new Date(Date.now() + 3 * 86400000).toISOString(),
      hubId: 'hub-01',
      hubName: 'Hub Central Almadies HQ',
      notes: 'Colis groupage contenant pièces mécaniques et matériel médical.',
      internalCostEstimatedXOF: 45000,
      internalCostConfirmedXOF: 43500,
      internalCostActualXOF: 0,
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
    };
    this.memoryShipments.set(sampleShipment.id, sampleShipment);

    // Événements immuables associés à sampleShipment
    const sampleEvents: ShipmentEventRecord[] = [
      {
        id: 'evt-01',
        shipmentId: 'shp-10482',
        eventType: 'shipment_created',
        previousStatus: 'none',
        newStatus: 'awaiting_supplier',
        location: 'Bureau Central Dallou Chine Dakar',
        description: 'Bordereau créé après validation commerciale et confirmation paiement.',
        actorUserId: 'admin-01',
        actorRole: 'LOGISTICS',
        actorName: 'Ousmane Fall',
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
      },
      {
        id: 'evt-02',
        shipmentId: 'shp-10482',
        eventType: 'supplier_confirmed',
        previousStatus: 'awaiting_supplier',
        newStatus: 'supplier_confirmed',
        location: 'Fournisseur Jinhua Machinery, Zhejiang',
        description: 'Fournisseur a validé la commande et confirmé le lot prêt pour emballage.',
        actorUserId: 'agent-cn-01',
        actorRole: 'OPERATIONS',
        actorName: 'Chen Wei (Agent Chine)',
        createdAt: new Date(Date.now() - 3.5 * 86400000).toISOString()
      },
      {
        id: 'evt-03',
        shipmentId: 'shp-10482',
        eventType: 'preparing_in_china',
        previousStatus: 'supplier_confirmed',
        newStatus: 'preparing_in_china',
        location: 'Entrepôt Consolidation Guangzhou',
        description: 'Emballage renforcé antichoc et étiquetage code-barres Dallou Chine.',
        actorUserId: 'agent-cn-01',
        actorRole: 'OPERATIONS',
        actorName: 'Chen Wei',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
      },
      {
        id: 'evt-04',
        shipmentId: 'shp-10482',
        eventType: 'ready_to_ship',
        previousStatus: 'preparing_in_china',
        newStatus: 'ready_to_ship',
        location: 'Plateforme Fret Ningbo-Zhoushan',
        description: 'Pesée volumétrique certifiée (8.4 kg). Prêt pour chargement sur vol cargo.',
        actorUserId: 'agent-cn-02',
        actorRole: 'LOGISTICS',
        actorName: 'Li Na',
        createdAt: new Date(Date.now() - 2.5 * 86400000).toISOString()
      },
      {
        id: 'evt-05',
        shipmentId: 'shp-10482',
        eventType: 'shipped_from_china',
        previousStatus: 'ready_to_ship',
        newStatus: 'shipped_from_china',
        location: 'Aéroport International Ningbo Lishe',
        description: 'Départ confirmé sur vol cargo AC-9912 à destination de Dakar AIBD.',
        actorUserId: 'car-01',
        actorRole: 'LOGISTICS',
        actorName: 'Air Cargo Express',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: 'evt-06',
        shipmentId: 'shp-10482',
        eventType: 'in_transit',
        previousStatus: 'shipped_from_china',
        newStatus: 'in_transit',
        location: 'Espace Aérien International (Escale Technique Addis-Abeba)',
        description: 'Transit international en cours. ETA estimée non contractuelle vers Dakar.',
        actorUserId: 'car-01',
        actorRole: 'LOGISTICS',
        actorName: 'Contrôle Trafic Aérien',
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
      }
    ];
    this.memoryShipmentEvents.set(sampleShipment.id, sampleEvents);

    // Initialisation Sourcing (Étape 9)
    const sup1: SupplierRecord = {
      id: 'sup-01',
      name: 'Ningbo Lishe Industrial Components Co.',
      platform: '1688',
      productUrl: 'https://detail.1688.com/offer/654129881.html',
      contactPerson: 'Zhang Wei',
      contactPhone: '+86 574 8700 1122',
      contactWeChat: 'wx_ningbo_ind',
      contactEmail: 'export@ningbo-industrial.cn',
      country: 'Chine',
      city: 'Ningbo',
      supplierCode: 'SUP-NGB-01',
      moq: 50,
      supplierPriceCNY: 1550,
      supplierPriceXOF: 135000,
      currency: 'CNY',
      leadTimeDays: 14,
      customizationAvailable: true,
      rating: 4.9,
      verificationStatus: 'verified',
      internalNotes: 'Fournisseur de rang A audité en juin 2026. Marge brute négociée à 12%.',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
    };
    const sup2: SupplierRecord = {
      id: 'sup-02',
      name: 'Guangzhou Yuehai Electronic Technology',
      platform: '1688',
      productUrl: 'https://detail.1688.com/offer/712390882.html',
      contactPerson: 'Chen Min',
      contactPhone: '+86 20 3800 5544',
      contactWeChat: 'wx_yuehai_tech',
      contactEmail: 'sales@yuehai-elec.cn',
      country: 'Chine',
      city: 'Guangzhou',
      supplierCode: 'SUP-CAN-02',
      moq: 20,
      supplierPriceCNY: 1620,
      supplierPriceXOF: 141000,
      currency: 'CNY',
      leadTimeDays: 10,
      customizationAvailable: true,
      rating: 4.8,
      verificationStatus: 'verified',
      internalNotes: 'Spécialiste contrôleurs et onduleurs. Négociateur direct Chen Wei.',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString()
    };
    const sup3: SupplierRecord = {
      id: 'sup-03',
      name: 'Yiwu International Commodities Direct Ltd',
      platform: 'yiwu_market',
      productUrl: 'https://chinagoods.com/shop/99812',
      contactPerson: 'Wang Fang',
      contactPhone: '+86 579 8500 9988',
      contactWeChat: 'wx_yiwu_direct',
      country: 'Chine',
      city: 'Yiwu',
      supplierCode: 'SUP-YIW-03',
      moq: 10,
      supplierPriceCNY: 980,
      supplierPriceXOF: 85000,
      currency: 'CNY',
      leadTimeDays: 7,
      customizationAvailable: false,
      rating: 4.7,
      verificationStatus: 'verified',
      internalNotes: 'Grossiste physique marché District 2 Yiwu.',
      createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString()
    };

    this.memorySuppliers.set(sup1.id, sup1);
    this.memorySuppliers.set(sup2.id, sup2);
    this.memorySuppliers.set(sup3.id, sup3);

    const sampleSrc: SourcingRequestRecord = {
      id: 'src-1001',
      code: 'SRC-2026-0048',
      customerId: 'cust-01',
      customerName: 'Amadou Diallo',
      customerCompany: 'Diallo Import SARL',
      customerPhone: '+221 77 540 22 11',
      customerEmail: 'amadou.diallo@gmail.com',
      productName: 'Générateurs Solaires Hybrides 5kVA',
      productDescription: 'Générateurs solaires avec batteries LiFePO4 intégrées, sortie sinusoïdale pure 220V/50Hz pour usage commercial et résidentiel.',
      productLink: 'https://detail.1688.com/offer/654129881.html',
      productImages: ['https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800'],
      quantity: 10,
      targetBudget: 1800000,
      currency: 'XOF',
      specifications: 'Sortie 230V 50Hz, prises conformes normes sénégalaises, onduleur pur sinus.',
      customization: 'Logo sérigraphié Diallo Solar Pro + caisse bois renforcée.',
      desiredDeadline: new Date(Date.now() + 30 * 86400000).toISOString(),
      destination: 'Dakar, Sénégal',
      notes: 'Priorité conformité électrique climat tropical chaud.',
      status: 'quote_sent',
      assignedSourcerId: 'srcr-01',
      assignedSourcerName: 'Chen Wei (Guangzhou Hub)',
      assignedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      assignedBy: 'admin-01',
      aiMetadata: {
        analysis: 'Générateur lourd, certification CE, batterie LiFePO4 classe 9 transport maritime.',
        searchKeywords: ['solar generator 5000w', 'lifepo4 off-grid inverter'],
        riskFlags: ['Transport maritime conteneur scellé requis pour batteries']
      },
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
    };
    this.memorySourcingRequests.set(sampleSrc.id, sampleSrc);

    // Multi-fournisseurs associés à la demande
    const reqSup1: SourcingRequestSupplierRecord = {
      id: 'req-sup-01',
      requestId: sampleSrc.id,
      supplierId: sup1.id,
      supplierName: sup1.name,
      supplierCode: sup1.supplierCode,
      supplierPlatform: sup1.platform,
      initialPriceCNY: 1650,
      negotiatedPriceCNY: 1550,
      unitPriceXOF: 135000,
      moq: 10,
      leadTimeDays: 14,
      sampleAvailable: true,
      sampleCostCNY: 1800,
      customizationConfirmed: true,
      internalNotes: 'Marge SinoSenegal préservée à 12.5%. Usine sérieuse.',
      clientVisibleNotes: 'Fabricant audité ISO9001 à Ningbo, cellules LiFePO4 grade A neuves.',
      isSelected: true,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
    };
    const reqSup2: SourcingRequestSupplierRecord = {
      id: 'req-sup-02',
      requestId: sampleSrc.id,
      supplierId: sup2.id,
      supplierName: sup2.name,
      supplierCode: sup2.supplierCode,
      supplierPlatform: sup2.platform,
      initialPriceCNY: 1700,
      negotiatedPriceCNY: 1620,
      unitPriceXOF: 141000,
      moq: 20,
      leadTimeDays: 10,
      sampleAvailable: true,
      sampleCostCNY: 1900,
      customizationConfirmed: true,
      internalNotes: 'Prix un peu plus élevé mais expédition sous 10 jours.',
      clientVisibleNotes: 'Option plus rapide sous 10 jours ouvrés.',
      isSelected: false,
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
    };
    this.memoryRequestSuppliers.set(sampleSrc.id, [reqSup1, reqSup2]);

    // Devis réel v1
    const sampleQuote: SourcingQuoteRecord = {
      id: 'quo-1001',
      code: 'DEV-2026-0048',
      sourcingRequestId: sampleSrc.id,
      customerId: 'cust-01',
      assignedSourcerId: 'srcr-01',
      selectedSupplierId: sup1.id,
      version: 1,
      status: 'sent',
      quantity: 10,
      unitProductPriceXOF: 135000,
      totalProductPriceXOF: 1350000,
      sourcingFeeXOF: 65000,
      inspectionFeeXOF: 45000,
      estimatedLogisticsXOF: 180000,
      estimatedCustomsXOF: 160000,
      additionalFeesXOF: 0,
      totalClientXOF: 1800000,
      currency: 'XOF',
      internalMarginXOF: 195000,
      internalNotes: 'Fournisseur accorde 5% de remise si acompte viré sous 48h.',
      depositRequiredPercent: 40,
      depositAmountXOF: 720000,
      balanceDueXOF: 1080000,
      leadTimeDays: '20-25 jours',
      transportMode: 'sea',
      conditions: [
        'Tarif usine certifié avec contrôle technique avant départ',
        'Inspection pré-embarquement SGS à Ningbo',
        'Assurance maritime conteneur scellé incluse',
        'Dédouanement Gaindé Port Autonome de Dakar inclus'
      ],
      validUntil: new Date(Date.now() + 14 * 86400000).toISOString(),
      sentAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      items: [
        {
          description: 'Générateur Solaire Hybride 5kVA LiFePO4 48V',
          quantity: 10,
          unitProductPriceXOF: 135000,
          totalProductPriceXOF: 1350000
        }
      ],
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString()
    };
    this.memorySourcingQuotes.set(sampleQuote.id, sampleQuote);

    // Événements audit trail
    const sampleSrcEvents: SourcingEventRecord[] = [
      {
        id: 'evt-src-01',
        sourcingRequestId: sampleSrc.id,
        eventType: 'request_submitted',
        newStatus: 'new',
        description: 'Demande de sourcing enregistrée par le client Amadou Diallo.',
        actorUserId: 'cust-01',
        actorRole: 'client',
        actorName: 'Amadou Diallo',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
      },
      {
        id: 'evt-src-02',
        sourcingRequestId: sampleSrc.id,
        eventType: 'assigned_to_sourcer',
        previousStatus: 'new',
        newStatus: 'researching',
        description: 'Dossier assigné au sourceur Chen Wei à Guangzhou.',
        actorUserId: 'admin-01',
        actorRole: 'admin',
        actorName: 'Desk Sourcing Dakar',
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
      },
      {
        id: 'evt-src-03',
        sourcingRequestId: sampleSrc.id,
        eventType: 'supplier_found',
        previousStatus: 'researching',
        newStatus: 'supplier_found',
        description: '2 usines qualifiées identifiées à Ningbo et Guangzhou.',
        actorUserId: 'srcr-01',
        actorRole: 'sourcer',
        actorName: 'Chen Wei',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
      },
      {
        id: 'evt-src-04',
        sourcingRequestId: sampleSrc.id,
        eventType: 'negotiation_completed',
        previousStatus: 'supplier_found',
        newStatus: 'quote_ready',
        description: 'Négociation usine terminée. Remise de 100 RMB/pièce obtenue.',
        actorUserId: 'srcr-01',
        actorRole: 'sourcer',
        actorName: 'Chen Wei',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: 'evt-src-05',
        sourcingRequestId: sampleSrc.id,
        eventType: 'quote_sent',
        previousStatus: 'quote_ready',
        newStatus: 'quote_sent',
        description: 'Devis officiel DEV-2026-0048 transmis au client avec transparence totale.',
        actorUserId: 'admin-01',
        actorRole: 'admin',
        actorName: 'Desk Sourcing Dakar',
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
      }
    ];
    this.memorySourcingEvents.set(sampleSrc.id, sampleSrcEvents);
  }

  // --- ORDERS ---

  async getOrder(orderIdOrCode: string): Promise<OrderRecord | null> {
    const mem = this.memoryOrders.get(orderIdOrCode);
    if (mem) return mem;

    const res = await this.safeDbCall(async () => {
      return await this.supabase!
        .from('orders')
        .select('*')
        .or(`id.eq.${orderIdOrCode},tracking_code.eq.${orderIdOrCode}`)
        .single();
    });

    if (res?.data && !res.error) {
      const data = res.data;
      const loaded: OrderRecord = {
        id: data.id,
        trackingCode: data.tracking_code,
        userId: data.user_id,
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        customerEmail: data.customer_email,
        customerCity: data.customer_city,
        subtotalXOF: Number(data.subtotal_xof),
        shippingFeeXOF: Number(data.shipping_fee_xof),
        discountAmountXOF: Number(data.discount_amount_xof || 0),
        totalXOF: Number(data.total_xof),
        paymentMethod: data.payment_method,
        paymentStatus: data.payment_status,
        orderStatus: data.order_status,
        deliveryType: data.delivery_type,
        hubLocationId: data.hub_location_id,
        deliveryAddress: data.delivery_address,
        items: data.items || [],
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        paidAt: data.paid_at
      };
      this.memoryOrders.set(loaded.id, loaded);
      this.memoryOrders.set(loaded.trackingCode, loaded);
      return loaded;
    }

    return null;
  }

  async saveOrder(order: OrderRecord): Promise<OrderRecord> {
    this.memoryOrders.set(order.id, order);
    this.memoryOrders.set(order.trackingCode, order);

    if (this.supabase) {
      try {
        await this.supabase.from('orders').upsert({
          id: order.id,
          tracking_code: order.trackingCode,
          user_id: order.userId || null,
          customer_name: order.customerName,
          customer_phone: order.customerPhone,
          customer_email: order.customerEmail,
          customer_city: order.customerCity,
          subtotal_xof: order.subtotalXOF,
          shipping_fee_xof: order.shippingFeeXOF,
          discount_amount_xof: order.discountAmountXOF,
          total_xof: order.totalXOF,
          payment_method: order.paymentMethod,
          payment_status: order.paymentStatus,
          order_status: order.orderStatus,
          delivery_type: order.deliveryType,
          hub_location_id: order.hubLocationId || null,
          delivery_address: order.deliveryAddress || null,
          items: order.items,
          notes: order.notes || null,
          paid_at: order.paidAt || null,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[StorageManager] Supabase saveOrder fallback:', err);
      }
    }

    return order;
  }

  async updateOrderStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    orderStatus?: InternalOrderStatus,
    paidAt?: string
  ): Promise<boolean> {
    const order = await this.getOrder(orderId);
    if (!order) return false;

    order.paymentStatus = paymentStatus;
    if (orderStatus) {
      order.orderStatus = orderStatus;
    }
    if (paidAt) {
      order.paidAt = paidAt;
    }
    order.updatedAt = new Date().toISOString();

    await this.saveOrder(order);
    return true;
  }

  // --- PAYMENTS ---

  async getPaymentById(paymentId: string): Promise<PaymentItem | null> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .single();

        if (data && !error) {
          return {
            id: data.id,
            orderId: data.order_id,
            orderCode: data.metadata?.order_code || 'AWP-N/A',
            userId: data.user_id,
            provider: data.provider,
            providerTransactionId: data.provider_transaction_id,
            providerReference: data.provider_reference,
            amount: Number(data.amount),
            currency: data.currency,
            status: data.status,
            paymentMethod: data.payment_method,
            checkoutUrl: data.checkout_url,
            customerName: data.customer_name || data.metadata?.customer_name || '',
            customerEmail: data.customer_email || '',
            customerPhone: data.customer_phone || '',
            metadata: data.metadata,
            expiresAt: data.expires_at,
            paidAt: data.paid_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (err) {
        console.warn('[StorageManager] Supabase getPaymentById fallback to memory:', err);
      }
    }

    return this.memoryPayments.get(paymentId) || null;
  }

  async getPaymentByOrderId(orderId: string): Promise<PaymentItem | null> {
    for (const p of this.memoryPayments.values()) {
      if (p.orderId === orderId) return p;
    }

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('payments')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data && !error) {
          return {
            id: data.id,
            orderId: data.order_id,
            orderCode: data.metadata?.order_code || 'AWP-N/A',
            userId: data.user_id,
            provider: data.provider,
            providerTransactionId: data.provider_transaction_id,
            providerReference: data.provider_reference,
            amount: Number(data.amount),
            currency: data.currency,
            status: data.status,
            paymentMethod: data.payment_method,
            checkoutUrl: data.checkout_url,
            customerName: data.customer_name || data.metadata?.customer_name || '',
            customerEmail: data.customer_email || '',
            customerPhone: data.customer_phone || '',
            metadata: data.metadata,
            expiresAt: data.expires_at,
            paidAt: data.paid_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (err) {
        console.warn('[StorageManager] Supabase getPaymentByOrderId error:', err);
      }
    }

    return null;
  }

  async getPaymentByProviderTxId(txId: string): Promise<PaymentItem | null> {
    for (const p of this.memoryPayments.values()) {
      if (p.providerTransactionId === txId) return p;
    }

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('payments')
          .select('*')
          .eq('provider_transaction_id', txId)
          .single();

        if (data && !error) {
          return {
            id: data.id,
            orderId: data.order_id,
            orderCode: data.metadata?.order_code || 'AWP-N/A',
            userId: data.user_id,
            provider: data.provider,
            providerTransactionId: data.provider_transaction_id,
            providerReference: data.provider_reference,
            amount: Number(data.amount),
            currency: data.currency,
            status: data.status,
            paymentMethod: data.payment_method,
            checkoutUrl: data.checkout_url,
            customerName: data.customer_name || data.metadata?.customer_name || '',
            customerEmail: data.customer_email || '',
            customerPhone: data.customer_phone || '',
            metadata: data.metadata,
            expiresAt: data.expires_at,
            paidAt: data.paid_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
        }
      } catch (err) {
        console.warn('[StorageManager] Supabase getPaymentByProviderTxId error:', err);
      }
    }

    return null;
  }

  async savePayment(payment: PaymentItem): Promise<PaymentItem> {
    this.memoryPayments.set(payment.id, payment);

    if (this.supabase) {
      try {
        await this.supabase.from('payments').upsert({
          id: payment.id,
          order_id: payment.orderId,
          user_id: payment.userId || null,
          provider: payment.provider,
          provider_transaction_id: payment.providerTransactionId || null,
          provider_reference: payment.providerReference || null,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          payment_method: payment.paymentMethod || null,
          checkout_url: payment.checkoutUrl || null,
          customer_name: payment.customerName,
          customer_email: payment.customerEmail,
          customer_phone: payment.customerPhone,
          metadata: payment.metadata || {},
          expires_at: payment.expiresAt || null,
          paid_at: payment.paidAt || null,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[StorageManager] Supabase savePayment fallback:', err);
      }
    }

    return payment;
  }

  async getAllPayments(): Promise<PaymentItem[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && !error) {
          return data.map((d: any) => ({
            id: d.id,
            orderId: d.order_id,
            orderCode: d.metadata?.order_code || 'AWP-N/A',
            userId: d.user_id,
            provider: d.provider,
            providerTransactionId: d.provider_transaction_id,
            providerReference: d.provider_reference,
            amount: Number(d.amount),
            currency: d.currency,
            status: d.status,
            paymentMethod: d.payment_method,
            checkoutUrl: d.checkout_url,
            customerName: d.customer_name || d.metadata?.customer_name || '',
            customerEmail: d.customer_email || '',
            customerPhone: d.customer_phone || '',
            metadata: d.metadata,
            expiresAt: d.expires_at,
            paidAt: d.paid_at,
            createdAt: d.created_at,
            updatedAt: d.updated_at
          }));
        }
      } catch (err) {
        console.warn('[StorageManager] Supabase getAllPayments error:', err);
      }
    }

    return Array.from(this.memoryPayments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // --- PAYMENT ATTEMPTS ---

  async recordPaymentAttempt(attempt: PaymentAttempt): Promise<void> {
    this.memoryAttempts.push(attempt);

    if (this.supabase) {
      try {
        await this.supabase.from('payment_attempts').insert({
          id: attempt.id,
          payment_id: attempt.paymentId,
          order_id: attempt.orderId,
          attempt_number: attempt.attemptNumber,
          status: attempt.status,
          provider_transaction_id: attempt.providerTransactionId || null,
          error_details: attempt.errorDetails || null,
          ip_address: attempt.ipAddress || null,
          user_agent: attempt.userAgent || null
        });
      } catch (err) {
        console.warn('[StorageManager] Supabase recordPaymentAttempt error:', err);
      }
    }
  }

  // --- WEBHOOK LOGS & IDEMPOTENCE ---

  async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    const existing = this.memoryWebhookLogs.get(eventId);
    if (existing && existing.processed) return true;

    if (this.supabase) {
      try {
        const { data } = await this.supabase
          .from('webhook_events')
          .select('processed')
          .or(`event_id.eq.${eventId},provider_event_id.eq.${eventId}`)
          .maybeSingle();

        if (data && data.processed) return true;
      } catch {
        // Not found or error
      }
    }

    return false;
  }

  async recordWebhookLog(log: WebhookLogRecord): Promise<void> {
    this.memoryWebhookLogs.set(log.id, log);
    if (log.eventId) {
      this.memoryWebhookLogs.set(log.eventId, log);
    }

    if (this.supabase) {
      try {
        await this.supabase.from('webhook_events').upsert({
          id: log.id.startsWith('whlog_') ? undefined : log.id,
          provider: log.provider,
          event_type: log.eventType,
          event_id: log.eventId || null,
          provider_event_id: log.eventId || null,
          payload: log.payload,
          signature_valid: true,
          signature_verified: true,
          processed: log.processed,
          processing_error: log.processingError || null,
          error: log.processingError || null,
          processed_at: log.processedAt || null
        });
      } catch (err) {
        console.warn('[StorageManager] Supabase recordWebhookLog error:', err);
      }
    }
  }

  // --- LOGISTIQUE & EXPÉDITIONS (ÉTAPE 8) ---

  // 1. CARRIERS
  async getCarriers(): Promise<CarrierRecord[]> {
    const memList = Array.from(this.memoryCarriers.values());
    if (memList.length > 0) return memList;

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('carriers')
          .select('*')
          .order('name', { ascending: true });
        if (!error && data && data.length > 0) {
          const list = data.map(d => ({
            id: d.id,
            name: d.name,
            code: d.code,
            contact: d.contact,
            active: d.active,
            mode: d.mode,
            ratePerKgXOF: Number(d.rate_per_kg_xof) || undefined,
            ratePerCbmXOF: Number(d.rate_per_cbm_xof) || undefined,
            minChargeXOF: Number(d.min_charge_xof) || undefined,
            volumetricFactor: Number(d.volumetric_factor) || undefined,
            baseTransitDaysMin: d.base_transit_days_min,
            baseTransitDaysMax: d.base_transit_days_max,
            notes: d.notes,
            createdAt: d.created_at,
            updatedAt: d.updated_at
          }));
          for (const c of list) this.memoryCarriers.set(c.id, c);
          return list;
        }
      } catch (err) {
        console.warn('[StorageManager] Supabase getCarriers error:', err);
      }
    }
    return memList;
  }

  async getCarrierById(id: string): Promise<CarrierRecord | null> {
    const mem = this.memoryCarriers.get(id);
    if (mem) return mem;

    const res = await this.safeDbCall(async () => {
      return await this.supabase!
        .from('carriers')
        .select('*')
        .eq('id', id)
        .single();
    });

    if (res?.data && !res.error) {
      const data = res.data;
      const loaded: CarrierRecord = {
        id: data.id,
        name: data.name,
        code: data.code,
        contact: data.contact,
        active: data.active,
        mode: data.mode,
        ratePerKgXOF: Number(data.rate_per_kg_xof) || undefined,
        ratePerCbmXOF: Number(data.rate_per_cbm_xof) || undefined,
        minChargeXOF: Number(data.min_charge_xof) || undefined,
        volumetricFactor: Number(data.volumetric_factor) || undefined,
        baseTransitDaysMin: data.base_transit_days_min,
        baseTransitDaysMax: data.base_transit_days_max,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      this.memoryCarriers.set(loaded.id, loaded);
      return loaded;
    }
    return null;
  }

  async saveCarrier(carrier: CarrierRecord): Promise<void> {
    this.memoryCarriers.set(carrier.id, carrier);
    if (this.supabase && this.supabaseHealthy) {
      this.supabase.from('carriers').upsert({
        id: carrier.id,
        name: carrier.name,
        code: carrier.code,
        contact: carrier.contact,
        active: carrier.active,
        mode: carrier.mode,
        rate_per_kg_xof: carrier.ratePerKgXOF,
        rate_per_cbm_xof: carrier.ratePerCbmXOF,
        min_charge_xof: carrier.minChargeXOF,
        volumetric_factor: carrier.volumetricFactor,
        base_transit_days_min: carrier.baseTransitDaysMin,
        base_transit_days_max: carrier.baseTransitDaysMax,
        notes: carrier.notes,
        updated_at: new Date().toISOString()
      }).then(() => {}, err => console.warn('[StorageManager] Supabase saveCarrier error:', err));
    }
  }

  // 2. HUBS
  async getHubs(): Promise<HubRecord[]> {
    const memList = Array.from(this.memoryHubs.values());
    if (memList.length > 0) return memList;

    const res = await this.safeDbCall(async () => {
      return await this.supabase!
        .from('hubs')
        .select('*')
        .order('name', { ascending: true });
    });

    if (res?.data && !res.error && res.data.length > 0) {
      const list = res.data.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code,
        city: d.city,
        address: d.address,
        phone: d.phone,
        active: d.active,
        managerName: d.manager_name,
        maxCapacity: d.max_capacity,
        activeParcelsCount: d.active_parcels_count,
        createdAt: d.created_at,
        updatedAt: d.updated_at
      }));
      for (const h of list) this.memoryHubs.set(h.id, h);
      return list;
    }
    return memList;
  }

  async getHubById(id: string): Promise<HubRecord | null> {
    const mem = this.memoryHubs.get(id);
    if (mem) return mem;

    const res = await this.safeDbCall(async () => {
      return await this.supabase!
        .from('hubs')
        .select('*')
        .eq('id', id)
        .single();
    });

    if (res?.data && !res.error) {
      const data = res.data;
      const loaded: HubRecord = {
        id: data.id,
        name: data.name,
        code: data.code,
        city: data.city,
        address: data.address,
        phone: data.phone,
        active: data.active,
        managerName: data.manager_name,
        maxCapacity: data.max_capacity,
        activeParcelsCount: data.active_parcels_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      this.memoryHubs.set(loaded.id, loaded);
      return loaded;
    }
    return null;
  }

  async saveHub(hub: HubRecord): Promise<void> {
    this.memoryHubs.set(hub.id, hub);
    if (this.supabase && this.supabaseHealthy) {
      this.supabase.from('hubs').upsert({
        id: hub.id,
        name: hub.name,
        code: hub.code,
        city: hub.city,
        address: hub.address,
        phone: hub.phone,
        active: hub.active,
        manager_name: hub.managerName,
        max_capacity: hub.maxCapacity,
        active_parcels_count: hub.activeParcelsCount,
        updated_at: new Date().toISOString()
      }).then(() => {}, err => console.warn('[StorageManager] Supabase saveHub error:', err));
    }
  }

  // 3. SHIPMENTS
  async getAllShipments(): Promise<ShipmentRecord[]> {
    const memList = Array.from(this.memoryShipments.values());
    if (memList.length > 0) {
      return memList.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    const res = await this.safeDbCall(async () => {
      return await this.supabase!
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false });
    });

    if (res?.data && !res.error && res.data.length > 0) {
      const list = res.data.map(this.mapShipmentFromDb);
      for (const s of list) this.memoryShipments.set(s.id, s);
      return list;
    }
    return memList;
  }

  async getShipmentById(id: string): Promise<ShipmentRecord | null> {
    const mem = this.memoryShipments.get(id);
    if (mem) return mem;

    const res = await this.safeDbCall(async () => {
      return await this.supabase!
        .from('shipments')
        .select('*')
        .eq('id', id)
        .single();
    });

    if (res?.data && !res.error) {
      const loaded = this.mapShipmentFromDb(res.data);
      this.memoryShipments.set(loaded.id, loaded);
      return loaded;
    }
    return null;
  }

  async getShipmentByTrackingCode(code: string): Promise<ShipmentRecord | null> {
    const cleanCode = code.trim().toUpperCase();
    for (const shp of this.memoryShipments.values()) {
      if (shp.trackingCode.toUpperCase() === cleanCode) {
        return shp;
      }
    }

    const res = await this.safeDbCall(async () => {
      return await this.supabase!
        .from('shipments')
        .select('*')
        .ilike('tracking_code', cleanCode)
        .single();
    });

    if (res?.data && !res.error) {
      const loaded = this.mapShipmentFromDb(res.data);
      this.memoryShipments.set(loaded.id, loaded);
      return loaded;
    }
    return null;
  }

  async getShipmentsByOrderId(orderId: string): Promise<ShipmentRecord[]> {
    const mem = Array.from(this.memoryShipments.values()).filter(s => s.orderId === orderId);
    if (mem.length > 0) return mem;

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('shipments')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map(this.mapShipmentFromDb);
        }
      } catch (err) {
        console.warn('[StorageManager] Supabase getShipmentsByOrderId error:', err);
      }
    }
    return mem;
  }

  async getShipmentsByUserId(userId: string): Promise<ShipmentRecord[]> {
    const mem = Array.from(this.memoryShipments.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (mem.length > 0) return mem;

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('shipments')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map(this.mapShipmentFromDb);
        }
      } catch (err) {
        console.warn('[StorageManager] Supabase getShipmentsByUserId error:', err);
      }
    }
    return mem;
  }

  async saveShipment(shipment: ShipmentRecord): Promise<void> {
    this.memoryShipments.set(shipment.id, shipment);
    if (this.supabase) {
      this.supabase.from('shipments').upsert({
        id: shipment.id,
        order_id: shipment.orderId,
        order_code: shipment.orderCode,
        user_id: shipment.userId || null,
        tracking_code: shipment.trackingCode,
        carrier_id: shipment.carrierId || null,
        hub_id: shipment.hubId || null,
        origin: shipment.origin,
        destination: shipment.destination,
        transport_mode: shipment.transportMode,
        status: shipment.status,
        estimated_departure: shipment.estimatedDeparture || null,
        actual_departure: shipment.actualDeparture || null,
        estimated_arrival: shipment.estimatedArrival || null,
        actual_arrival: shipment.actualArrival || null,
        notes: shipment.notes || null,
        internal_cost_estimated_xof: shipment.internalCostEstimatedXOF || 0,
        internal_cost_confirmed_xof: shipment.internalCostConfirmedXOF || 0,
        internal_cost_actual_xof: shipment.internalCostActualXOF || 0,
        updated_at: new Date().toISOString()
      }).then(() => {}, err => console.warn('[StorageManager] Supabase saveShipment error:', err));
    }
  }

  private mapShipmentFromDb(d: any): ShipmentRecord {
    return {
      id: d.id,
      orderId: d.order_id,
      orderCode: d.order_code,
      userId: d.user_id,
      trackingCode: d.tracking_code,
      carrierId: d.carrier_id,
      carrierName: d.carrier_name,
      carrierCode: d.carrier_code,
      origin: d.origin,
      destination: d.destination,
      transportMode: d.transport_mode,
      status: d.status,
      estimatedDeparture: d.estimated_departure,
      actualDeparture: d.actual_departure,
      estimatedArrival: d.estimated_arrival,
      actualArrival: d.actual_arrival,
      hubId: d.hub_id,
      hubName: d.hub_name,
      notes: d.notes,
      internalCostEstimatedXOF: Number(d.internal_cost_estimated_xof) || 0,
      internalCostConfirmedXOF: Number(d.internal_cost_confirmed_xof) || 0,
      internalCostActualXOF: Number(d.internal_cost_actual_xof) || 0,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    };
  }

  // 4. SHIPMENT EVENTS (Immuable)
  async appendShipmentEvent(event: ShipmentEventRecord): Promise<void> {
    const list = this.memoryShipmentEvents.get(event.shipmentId) || [];
    list.push(event);
    this.memoryShipmentEvents.set(event.shipmentId, list);

    if (this.supabase) {
      this.supabase.from('shipment_events').insert({
        id: event.id,
        shipment_id: event.shipmentId,
        event_type: event.eventType,
        previous_status: event.previousStatus,
        new_status: event.newStatus,
        location: event.location,
        description: event.description,
        metadata: event.metadata || {},
        actor_user_id: event.actorUserId || null,
        actor_role: event.actorRole || null,
        actor_name: event.actorName || null,
        created_at: event.createdAt
      }).then(() => {}, err => console.warn('[StorageManager] Supabase appendShipmentEvent error:', err));
    }
  }

  async getShipmentEvents(shipmentId: string): Promise<ShipmentEventRecord[]> {
    const mem = this.memoryShipmentEvents.get(shipmentId);
    if (mem && mem.length > 0) return mem;

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('shipment_events')
          .select('*')
          .eq('shipment_id', shipmentId)
          .order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          const list = data.map(d => ({
            id: d.id,
            shipmentId: d.shipment_id,
            eventType: d.event_type,
            previousStatus: d.previous_status,
            newStatus: d.new_status,
            location: d.location,
            description: d.description,
            metadata: d.metadata,
            actorUserId: d.actor_user_id,
            actorRole: d.actor_role,
            actorName: d.actor_name,
            createdAt: d.created_at
          }));
          this.memoryShipmentEvents.set(shipmentId, list);
          return list;
        }
      } catch (err) {
        console.warn('[StorageManager] Supabase getShipmentEvents error:', err);
      }
    }
    return mem || [];
  }

  // 5. SHIPMENT DOCUMENTS
  async appendShipmentDocument(doc: ShipmentDocumentRecord): Promise<void> {
    const list = this.memoryDocuments.get(doc.shipmentId) || [];
    list.push(doc);
    this.memoryDocuments.set(doc.shipmentId, list);

    if (this.supabase) {
      this.supabase.from('shipment_documents').insert({
        id: doc.id,
        shipment_id: doc.shipmentId,
        title: doc.title,
        doc_type: doc.docType,
        file_url: doc.fileUrl,
        is_internal: doc.isInternal,
        uploaded_by: doc.uploadedBy || null,
        created_at: doc.createdAt
      }).then(() => {}, err => console.warn('[StorageManager] Supabase appendShipmentDocument error:', err));
    }
  }

  async getShipmentDocuments(shipmentId: string): Promise<ShipmentDocumentRecord[]> {
    const mem = this.memoryDocuments.get(shipmentId);
    if (mem && mem.length > 0) return mem;

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('shipment_documents')
          .select('*')
          .eq('shipment_id', shipmentId)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const list = data.map(d => ({
            id: d.id,
            shipmentId: d.shipment_id,
            title: d.title,
            docType: d.doc_type,
            fileUrl: d.file_url,
            isInternal: d.is_internal,
            uploadedBy: d.uploaded_by,
            createdAt: d.created_at
          }));
          this.memoryDocuments.set(shipmentId, list);
          return list;
        }
      } catch (err) {
        console.warn('[StorageManager] Supabase getShipmentDocuments error:', err);
      }
    }
    return mem || [];
  }

  // 6. IN-APP NOTIFICATIONS
  async createInAppNotification(notif: InAppNotificationRecord): Promise<void> {
    const list = this.memoryNotifications.get(notif.userId) || [];
    list.unshift(notif);
    this.memoryNotifications.set(notif.userId, list);

    if (this.supabase) {
      this.supabase.from('in_app_notifications').insert({
        id: notif.id,
        user_id: notif.userId,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        shipment_id: notif.shipmentId || null,
        tracking_code: notif.trackingCode || null,
        is_read: notif.isRead,
        created_at: notif.createdAt
      }).then(() => {}, err => console.warn('[StorageManager] Supabase createInAppNotification error:', err));
    }
  }

  async getUserNotifications(userId: string): Promise<InAppNotificationRecord[]> {
    const mem = this.memoryNotifications.get(userId);
    if (mem && mem.length > 0) return mem;

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('in_app_notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const list = data.map(d => ({
            id: d.id,
            userId: d.user_id,
            title: d.title,
            message: d.message,
            type: d.type,
            shipmentId: d.shipment_id,
            trackingCode: d.tracking_code,
            isRead: d.is_read,
            createdAt: d.created_at
          }));
          this.memoryNotifications.set(userId, list);
          return list;
        }
      } catch (err) {
        console.warn('[StorageManager] Supabase getUserNotifications error:', err);
      }
    }
    return mem || [];
  }

  async markNotificationAsRead(id: string): Promise<void> {
    for (const [uid, list] of this.memoryNotifications.entries()) {
      const updated = list.map(n => n.id === id ? { ...n, isRead: true } : n);
      this.memoryNotifications.set(uid, updated);
    }
    if (this.supabase) {
      this.supabase.from('in_app_notifications').update({ is_read: true }).eq('id', id)
        .then(() => {}, err => console.warn('[StorageManager] Supabase markNotificationAsRead error:', err));
    }
  }

  // ==============================================================================
  // SOURCING (ÉTAPE 9) : REQUÊTES, FOURNISSEURS, DEVIS, AUDIT
  // ==============================================================================

  // --- 1. SOURCING REQUESTS ---

  async saveSourcingRequest(req: SourcingRequestRecord): Promise<void> {
    this.memorySourcingRequests.set(req.id, req);
    if (this.supabase) {
      this.supabase.from('sourcing_requests').upsert({
        id: req.id,
        code: req.code,
        customer_id: req.customerId || null,
        customer_name: req.customerName,
        customer_company: req.customerCompany || null,
        customer_phone: req.customerPhone,
        customer_email: req.customerEmail || null,
        product_name: req.productName,
        product_description: req.productDescription || null,
        product_link: req.productLink || null,
        product_images: req.productImages || [],
        quantity: req.quantity,
        target_budget: req.targetBudget,
        currency: req.currency,
        specifications: req.specifications || null,
        customization: req.customization || null,
        desired_deadline: req.desiredDeadline || null,
        destination: req.destination,
        notes: req.notes || null,
        status: req.status,
        assigned_sourcer_id: req.assignedSourcerId || null,
        assigned_sourcer_name: req.assignedSourcerName || null,
        assigned_at: req.assignedAt || null,
        assigned_by: req.assignedBy || null,
        ai_metadata: req.aiMetadata || {},
        created_at: req.createdAt,
        updated_at: req.updatedAt
      }).then(() => {}, err => console.warn('[StorageManager] Supabase saveSourcingRequest error:', err));
    }
  }

  async getSourcingRequestById(id: string): Promise<SourcingRequestRecord | null> {
    const mem = this.memorySourcingRequests.get(id);
    if (mem) return mem;

    const res = await this.safeDbCall(async () => {
      return await this.supabase!
        .from('sourcing_requests')
        .select('*')
        .eq('id', id)
        .single();
    });

    if (res?.data && !res.error) {
      const d = res.data;
      const loaded: SourcingRequestRecord = {
        id: d.id,
        code: d.code,
        customerId: d.customer_id,
        customerName: d.customer_name,
        customerCompany: d.customer_company,
        customerPhone: d.customer_phone,
        customerEmail: d.customer_email,
        productName: d.product_name,
        productDescription: d.product_description,
        productLink: d.product_link,
        productImages: d.product_images || [],
        quantity: d.quantity,
        targetBudget: Number(d.target_budget || 0),
        currency: d.currency || 'XOF',
        specifications: d.specifications,
        customization: d.customization,
        desiredDeadline: d.desired_deadline,
        destination: d.destination || 'Dakar, Sénégal',
        notes: d.notes,
        status: d.status,
        assignedSourcerId: d.assigned_sourcer_id,
        assignedSourcerName: d.assigned_sourcer_name,
        assignedAt: d.assigned_at,
        assignedBy: d.assigned_by,
        aiMetadata: d.ai_metadata,
        createdAt: d.created_at,
        updatedAt: d.updated_at
      };
      this.memorySourcingRequests.set(loaded.id, loaded);
      return loaded;
    }
    return null;
  }

  async getSourcingRequestByCode(code: string): Promise<SourcingRequestRecord | null> {
    for (const r of this.memorySourcingRequests.values()) {
      if (r.code.toLowerCase() === code.toLowerCase().trim()) return r;
    }

    const res = await this.safeDbCall(async () => {
      return await this.supabase!
        .from('sourcing_requests')
        .select('*')
        .ilike('code', code.trim())
        .single();
    });

    if (res?.data && !res.error) {
      const d = res.data;
      const loaded: SourcingRequestRecord = {
        id: d.id,
        code: d.code,
        customerId: d.customer_id,
        customerName: d.customer_name,
        customerCompany: d.customer_company,
        customerPhone: d.customer_phone,
        customerEmail: d.customer_email,
        productName: d.product_name,
        productDescription: d.product_description,
        productLink: d.product_link,
        productImages: d.product_images || [],
        quantity: d.quantity,
        targetBudget: Number(d.target_budget || 0),
        currency: d.currency || 'XOF',
        specifications: d.specifications,
        customization: d.customization,
        desiredDeadline: d.desired_deadline,
        destination: d.destination || 'Dakar, Sénégal',
        notes: d.notes,
        status: d.status,
        assignedSourcerId: d.assigned_sourcer_id,
        assignedSourcerName: d.assigned_sourcer_name,
        assignedAt: d.assigned_at,
        assignedBy: d.assigned_by,
        aiMetadata: d.ai_metadata,
        createdAt: d.created_at,
        updatedAt: d.updated_at
      };
      this.memorySourcingRequests.set(loaded.id, loaded);
      return loaded;
    }
    return null;
  }

  async getSourcingRequestsByCustomerId(customerId: string): Promise<SourcingRequestRecord[]> {
    const list: SourcingRequestRecord[] = [];
    for (const r of this.memorySourcingRequests.values()) {
      if (r.customerId === customerId) list.push(r);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllSourcingRequests(): Promise<SourcingRequestRecord[]> {
    const list = Array.from(this.memorySourcingRequests.values());
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- 2. FOURNISSEURS (SUPPLIERS) ---

  async saveSupplier(supplier: SupplierRecord): Promise<void> {
    this.memorySuppliers.set(supplier.id, supplier);
    if (this.supabase) {
      this.supabase.from('suppliers').upsert({
        id: supplier.id,
        name: supplier.name,
        platform: supplier.platform,
        product_url: supplier.productUrl || null,
        contact_person: supplier.contactPerson || null,
        contact_phone: supplier.contactPhone || null,
        contact_wechat: supplier.contactWeChat || null,
        contact_email: supplier.contactEmail || null,
        country: supplier.country,
        city: supplier.city,
        supplier_code: supplier.supplierCode,
        moq: supplier.moq,
        supplier_price_cny: supplier.supplierPriceCNY || null,
        supplier_price_xof: supplier.supplierPriceXOF || null,
        currency: supplier.currency,
        lead_time_days: supplier.leadTimeDays,
        customization_available: supplier.customizationAvailable,
        rating: supplier.rating,
        verification_status: supplier.verificationStatus,
        internal_notes: supplier.internalNotes || null,
        created_at: supplier.createdAt,
        updated_at: supplier.updatedAt
      }).then(() => {}, err => console.warn('[StorageManager] Supabase saveSupplier error:', err));
    }
  }

  async getSupplierById(id: string): Promise<SupplierRecord | null> {
    return this.memorySuppliers.get(id) || null;
  }

  async getAllSuppliers(): Promise<SupplierRecord[]> {
    return Array.from(this.memorySuppliers.values());
  }

  // --- 3. MULTI-FOURNISSEURS PAR DEMANDE ---

  async saveSourcingRequestSupplier(item: SourcingRequestSupplierRecord): Promise<void> {
    const list = this.memoryRequestSuppliers.get(item.requestId) || [];
    const idx = list.findIndex(l => l.id === item.id);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    this.memoryRequestSuppliers.set(item.requestId, list);
  }

  async getSuppliersByRequestId(requestId: string): Promise<SourcingRequestSupplierRecord[]> {
    return this.memoryRequestSuppliers.get(requestId) || [];
  }

  async deleteSourcingRequestSupplier(id: string): Promise<void> {
    for (const [reqId, list] of this.memoryRequestSuppliers.entries()) {
      const filtered = list.filter(item => item.id !== id);
      this.memoryRequestSuppliers.set(reqId, filtered);
    }
  }

  // --- 4. DEVIS (SOURCING QUOTES) ---

  async saveSourcingQuote(quote: SourcingQuoteRecord): Promise<void> {
    this.memorySourcingQuotes.set(quote.id, quote);
    if (this.supabase) {
      this.supabase.from('sourcing_quotes').upsert({
        id: quote.id,
        code: quote.code,
        sourcing_request_id: quote.sourcingRequestId,
        customer_id: quote.customerId || null,
        assigned_sourcer_id: quote.assignedSourcerId || null,
        selected_supplier_id: quote.selectedSupplierId || null,
        version: quote.version,
        status: quote.status,
        quantity: quote.quantity,
        unit_product_price_xof: quote.unitProductPriceXOF,
        total_product_price_xof: quote.totalProductPriceXOF,
        sourcing_fee_xof: quote.sourcingFeeXOF,
        inspection_fee_xof: quote.inspectionFeeXOF,
        estimated_logistics_xof: quote.estimatedLogisticsXOF,
        estimated_customs_xof: quote.estimatedCustomsXOF,
        additional_fees_xof: quote.additionalFeesXOF,
        total_client_xof: quote.totalClientXOF,
        currency: quote.currency,
        internal_margin_xof: quote.internalMarginXOF || 0,
        internal_notes: quote.internalNotes || null,
        deposit_required_percent: quote.depositRequiredPercent,
        deposit_amount_xof: quote.depositAmountXOF,
        balance_due_xof: quote.balanceDueXOF,
        lead_time_days: quote.leadTimeDays,
        transport_mode: quote.transportMode,
        conditions: quote.conditions || [],
        valid_until: quote.validUntil,
        sent_at: quote.sentAt || null,
        accepted_at: quote.acceptedAt || null,
        accepted_by: quote.acceptedBy || null,
        rejected_at: quote.rejectedAt || null,
        rejected_reason: quote.rejectedReason || null,
        items: quote.items || [],
        created_at: quote.createdAt,
        updated_at: quote.updatedAt
      }).then(() => {}, err => console.warn('[StorageManager] Supabase saveSourcingQuote error:', err));
    }
  }

  async getSourcingQuoteById(id: string): Promise<SourcingQuoteRecord | null> {
    return this.memorySourcingQuotes.get(id) || null;
  }

  async getSourcingQuoteByCode(code: string): Promise<SourcingQuoteRecord | null> {
    for (const q of this.memorySourcingQuotes.values()) {
      if (q.code.toLowerCase() === code.toLowerCase().trim()) return q;
    }
    return null;
  }

  async getQuotesByRequestId(requestId: string): Promise<SourcingQuoteRecord[]> {
    const list: SourcingQuoteRecord[] = [];
    for (const q of this.memorySourcingQuotes.values()) {
      if (q.sourcingRequestId === requestId) list.push(q);
    }
    return list.sort((a, b) => b.version - a.version);
  }

  // --- 5. PIÈCES JOINTES ET DOCUMENTS ---

  async saveSourcingAttachment(att: SourcingAttachmentRecord): Promise<void> {
    const list = this.memorySourcingAttachments.get(att.sourcingRequestId) || [];
    list.push(att);
    this.memorySourcingAttachments.set(att.sourcingRequestId, list);
    if (this.supabase) {
      this.supabase.from('sourcing_attachments').insert({
        id: att.id,
        sourcing_request_id: att.sourcingRequestId,
        file_name: att.fileName,
        file_url: att.fileUrl,
        file_type: att.fileType,
        file_size_bytes: att.fileSizeBytes,
        is_internal: att.isInternal,
        uploaded_by: att.uploadedBy || null,
        created_at: att.createdAt
      }).then(() => {}, err => console.warn('[StorageManager] Supabase saveSourcingAttachment error:', err));
    }
  }

  async getSourcingAttachments(requestId: string): Promise<SourcingAttachmentRecord[]> {
    return this.memorySourcingAttachments.get(requestId) || [];
  }

  // --- 6. ÉVÉNEMENTS D'AUDIT IMMUABLES (SOURCING_EVENTS) ---

  async appendSourcingEvent(event: SourcingEventRecord): Promise<void> {
    const list = this.memorySourcingEvents.get(event.sourcingRequestId) || [];
    list.push(event);
    this.memorySourcingEvents.set(event.sourcingRequestId, list);
    if (this.supabase) {
      this.supabase.from('sourcing_events').insert({
        id: event.id,
        sourcing_request_id: event.sourcingRequestId,
        event_type: event.eventType,
        previous_status: event.previousStatus || null,
        new_status: event.newStatus || null,
        description: event.description,
        actor_user_id: event.actorUserId || null,
        actor_role: event.actorRole || null,
        actor_name: event.actorName || null,
        metadata: event.metadata || {},
        created_at: event.createdAt
      }).then(() => {}, err => console.warn('[StorageManager] Supabase appendSourcingEvent error:', err));
    }
  }

  async getSourcingEvents(requestId: string): Promise<SourcingEventRecord[]> {
    const list = this.memorySourcingEvents.get(requestId) || [];
    return [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

export const storage = new StorageManager();
