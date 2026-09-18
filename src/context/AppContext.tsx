import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Groupage,
  Order,
  Carrier,
  Supplier,
  Sourcer,
  HubLocation,
  B2BRequest,
  CostVarianceItem,
  AdminAlert,
  AdminRole,
  CalculationSettings,
  TrackingStatus,
  DeliveryAddress,
  CategoryItem,
  CartItem,
  Customer,
  AdminActivityLog,
  SourcingPipelineRequest,
  PaymentRecord,
  PromotionItem,
  NotificationTemplate,
  Quote,
  PlatformDocument
} from '../types';
import {
  MOCK_PRODUCTS,
  MOCK_GROUPAGES,
  MOCK_ORDERS,
  MOCK_CARRIERS,
  MOCK_SUPPLIERS,
  MOCK_SOURCERS,
  MOCK_HUB_LOCATIONS,
  MOCK_B2B_REQUESTS,
  MOCK_COST_VARIANCES,
  MOCK_ADMIN_ALERTS,
  MOCK_CATEGORIES,
  MOCK_CUSTOMERS,
  MOCK_ACTIVITY_LOGS,
  MOCK_SOURCING_PIPELINE,
  MOCK_PAYMENTS,
  MOCK_PROMOTIONS,
  MOCK_NOTIFICATION_TEMPLATES,
  MOCK_QUOTES,
  MOCK_DOCUMENTS
} from '../data/mockData';
import { CommercialDocumentModal } from '../components/documents/CommercialDocumentModal';
import { DEFAULT_CALCULATION_SETTINGS } from '../services/calculationEngine';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AppContextType {
  // Navigation
  currentPath: string;
  navigate: (path: string) => void;

  // Categories
  categories: CategoryItem[];
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;

  // Global Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Favorites
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;

  // Products
  products: Product[];
  addProduct: (prod: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductBySlug: (slug: string) => Product | undefined;
  getProductById: (id: string) => Product | undefined;

  // Groupages
  groupages: Groupage[];
  getGroupageById: (id: string) => Groupage | undefined;
  participateInGroupage: (groupageId: string, quantity: number) => void;
  updateGroupageStatus: (groupageId: string, status: Groupage['status']) => void;
  addGroupage: (groupage: Omit<Groupage, 'id'>) => void;

  // Orders & Tracking
  orders: Order[];
  getOrderByTrackingCode: (code: string) => Order | undefined;
  getOrderById: (id: string) => Order | undefined;
  createOrder: (orderData: {
    items: { product: Product; quantity: number; isGroupage?: boolean; groupageId?: string }[];
    customer: { fullName: string; phone: string; email: string; city: string };
    deliveryType: 'hub_pickup' | 'home_delivery';
    hubLocationId?: string;
    deliveryAddress?: DeliveryAddress;
    paymentMethod: 'wave' | 'orange_money' | 'free_money' | 'card' | 'hub_cash';
  }) => Order;
  updateOrderStatus: (orderId: string, newStatus: TrackingStatus, note?: string, location?: string) => void;
  addTrackingEvent: (orderId: string, event: {
    status: TrackingStatus;
    title: string;
    description: string;
    location: string;
    completed: boolean;
    current: boolean;
  }) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, isGroupage?: boolean, groupageId?: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotalCount: number;
  cartTotalXOF: number;
  cartSubtotalXOF: number;

  // B2B Requests
  b2bRequests: B2BRequest[];
  submitB2BRequest: (req: Omit<B2BRequest, 'id' | 'code' | 'createdAt' | 'status'>) => B2BRequest;
  updateB2BStatus: (id: string, status: B2BRequest['status']) => void;

  // Admin Entities
  carriers: Carrier[];
  updateCarrier: (id: string, updates: Partial<Carrier>) => void;
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'verifiedSince'>) => void;
  sourcers: Sourcer[];
  hubLocations: HubLocation[];
  updateHubParcelCount: (hubId: string, delta: number) => void;
  costVariances: CostVarianceItem[];
  addCostVariance: (variance: Omit<CostVarianceItem, 'id'>) => void;
  alerts: AdminAlert[];
  markAlertAsRead: (id: string) => void;

  // Customers, Activities & CRM
  customers: Customer[];
  addCustomer: (cust: Omit<Customer, 'id'>) => void;
  activityLogs: AdminActivityLog[];
  addActivityLog: (log: Omit<AdminActivityLog, 'id' | 'timestamp' | 'time'>) => void;

  // Sourcing Chine
  sourcingPipeline: SourcingPipelineRequest[];
  addSourcingPipelineRequest: (req: Omit<SourcingPipelineRequest, 'id' | 'code' | 'createdAt' | 'status' | 'offersCount'>) => SourcingPipelineRequest;
  updateSourcingPipelineStatus: (id: string, status: SourcingPipelineRequest['status'], note?: string) => void;

  // Quotes & Commercial Documents
  quotes: Quote[];
  addQuote: (quote: Omit<Quote, 'id' | 'code' | 'createdAt'>) => Quote;
  updateQuoteStatus: (id: string, status: Quote['status']) => void;
  getQuoteById: (id: string) => Quote | undefined;
  getQuoteByCode: (code: string) => Quote | undefined;
  documents: PlatformDocument[];
  addDocument: (doc: Omit<PlatformDocument, 'id'>) => PlatformDocument;
  openDocumentModal: (type: 'quote' | 'invoice' | 'receipt' | 'awp_waybill', payload: { quote?: Quote; order?: Order; doc?: PlatformDocument }) => void;
  closeDocumentModal: () => void;

  // Payments & Ledger
  payments: PaymentRecord[];
  addPayment: (payment: Omit<PaymentRecord, 'id' | 'date' | 'time'>) => void;
  updatePaymentStatus: (id: string, status: PaymentRecord['status']) => void;

  // Promotions & Marketing
  promotions: PromotionItem[];
  addPromotion: (promo: Omit<PromotionItem, 'id' | 'usageCount'>) => void;
  togglePromotionStatus: (id: string) => void;

  // Automated Notifications
  notificationTemplates: NotificationTemplate[];
  updateNotificationTemplate: (id: string, updates: Partial<NotificationTemplate>) => void;
  sendTestNotification: (id: string) => void;

  // Settings & Roles
  calcSettings: CalculationSettings;
  calculationSettings: CalculationSettings;
  updateCalcSettings: (settings: Partial<CalculationSettings>) => void;
  updateCalculationSettings: (settings: Partial<CalculationSettings>) => void;
  systemSettings: {
    exchangeRateCNYtoXOF: number;
    exchangeRateUSDtoXOF: number;
    defaultAirFreightRateUSDPerKg: number;
    defaultSeaFreightRateUSDPerCBM: number;
    defaultTargetMarginPercent: number;
  };
  updateSystemSettings: (settings: any) => void;
  currentRole: AdminRole;
  setCurrentRole: (role: AdminRole) => void;

  // User & Auth
  currentUser: {
    id: string;
    name: string;
    phone: string;
    email: string;
    city: string;
    isLoggedIn: boolean;
    role: 'client' | 'admin';
    adminRole?: AdminRole;
  };
  loginUser: (
    data:
      | string
      | {
          identifier: string;
          role?: 'client' | 'admin';
          adminRole?: AdminRole;
          name?: string;
          phone?: string;
          email?: string;
          city?: string;
        }
  ) => void;
  logoutUser: () => void;
  isAuthModalOpen: boolean;
  authModalDefaultTab: 'client' | 'admin';
  openAuthModal: (tab?: 'client' | 'admin') => void;
  closeAuthModal: () => void;

  // Toast
  toasts: ToastNotification[];
  showToast: (type: ToastNotification['type'], title: string, message: string) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
  dismissToast: (id: string) => void;

  // Quick Client AI modal / drawer
  isClientChatOpen: boolean;
  setClientChatOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State (custom lightweight router with browser history sync)
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const navigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Data States
  const [categories] = useState<CategoryItem[]>(MOCK_CATEGORIES);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sinosenegal_favs');
      return saved ? JSON.parse(saved) : ['prod-01', 'prod-03'];
    } catch {
      return ['prod-01', 'prod-03'];
    }
  });

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [groupages, setGroupages] = useState<Groupage[]>(MOCK_GROUPAGES);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [carriers, setCarriers] = useState<Carrier[]>(MOCK_CARRIERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [sourcers, setSourcers] = useState<Sourcer[]>(MOCK_SOURCERS);
  const [hubLocations, setHubLocations] = useState<HubLocation[]>(MOCK_HUB_LOCATIONS);
  const [b2bRequests, setB2BRequests] = useState<B2BRequest[]>(MOCK_B2B_REQUESTS);
  const [costVariances, setCostVariances] = useState<CostVarianceItem[]>(MOCK_COST_VARIANCES);
  const [alerts, setAlerts] = useState<AdminAlert[]>(MOCK_ADMIN_ALERTS);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>(MOCK_ACTIVITY_LOGS);
  const [sourcingPipeline, setSourcingPipeline] = useState<SourcingPipelineRequest[]>(MOCK_SOURCING_PIPELINE);
  const [payments, setPayments] = useState<PaymentRecord[]>(MOCK_PAYMENTS);
  const [promotions, setPromotions] = useState<PromotionItem[]>(MOCK_PROMOTIONS);
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>(MOCK_NOTIFICATION_TEMPLATES);
  const [calcSettings, setCalcSettings] = useState<CalculationSettings>(DEFAULT_CALCULATION_SETTINGS);
  const [currentRole, setCurrentRole] = useState<AdminRole>('SUPER_ADMIN');

  // Quotes & Commercial Documents State
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    try {
      const saved = localStorage.getItem('sinosenegal_quotes');
      return saved ? JSON.parse(saved) : MOCK_QUOTES;
    } catch {
      return MOCK_QUOTES;
    }
  });

  const [documents, setDocuments] = useState<PlatformDocument[]>(() => {
    try {
      const saved = localStorage.getItem('sinosenegal_documents');
      return saved ? JSON.parse(saved) : MOCK_DOCUMENTS;
    } catch {
      return MOCK_DOCUMENTS;
    }
  });

  const [documentModal, setDocumentModal] = useState<{
    isOpen: boolean;
    type: 'quote' | 'invoice' | 'receipt' | 'awp_waybill';
    quote?: Quote;
    order?: Order;
    doc?: PlatformDocument;
  }>({
    isOpen: false,
    type: 'quote'
  });

  const addQuote = (quoteData: Omit<Quote, 'id' | 'code' | 'createdAt'>): Quote => {
    const code = `DEV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newQuote: Quote = {
      ...quoteData,
      id: `quote-${Date.now()}`,
      code,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newQuote, ...quotes];
    setQuotes(updated);
    try {
      localStorage.setItem('sinosenegal_quotes', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    const newDoc: PlatformDocument = {
      id: `doc-${Date.now()}`,
      type: 'quote',
      reference: code,
      title: `Devis Commercial — ${quoteData.productName}`,
      clientName: quoteData.clientName,
      amountXOF: quoteData.totalEstimatedXOF,
      date: newQuote.createdAt,
      status: 'valid',
      quoteId: newQuote.id,
      pdfDownloadName: `Devis_${code}_SinoSenegal.pdf`
    };
    setDocuments(prev => [newDoc, ...prev]);
    showToast('success', 'Devis émis avec succès', `Le devis ${code} a été généré avec séparation stricte prix/logistique.`);
    return newQuote;
  };

  const updateQuoteStatus = (id: string, status: Quote['status']) => {
    setQuotes(prev => {
      const updated = prev.map(q => (q.id === id ? { ...q, status } : q));
      try {
        localStorage.setItem('sinosenegal_quotes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast('info', 'Statut du devis mis à jour', `Le statut du devis est désormais : ${status}.`);
  };

  const getQuoteById = (id: string) => quotes.find(q => q.id === id);
  const getQuoteByCode = (code: string) =>
    quotes.find(q => q.code.toUpperCase() === code.toUpperCase().trim());

  const addDocument = (docData: Omit<PlatformDocument, 'id'>): PlatformDocument => {
    const newDoc: PlatformDocument = {
      ...docData,
      id: `doc-${Date.now()}`
    };
    setDocuments(prev => [newDoc, ...prev]);
    return newDoc;
  };

  const openDocumentModal = (
    type: 'quote' | 'invoice' | 'receipt' | 'awp_waybill',
    payload: { quote?: Quote; order?: Order; doc?: PlatformDocument }
  ) => {
    setDocumentModal({
      isOpen: true,
      type,
      quote: payload.quote,
      order: payload.order,
      doc: payload.doc
    });
  };

  const closeDocumentModal = () => {
    setDocumentModal(prev => ({ ...prev, isOpen: false }));
  };

  // User State (Persisted in localStorage if available)
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    phone: string;
    email: string;
    city: string;
    isLoggedIn: boolean;
    role: 'client' | 'admin';
    adminRole?: AdminRole;
  }>(() => {
    try {
      const saved = localStorage.getItem('sinosenegal_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            id: parsed.id || 'cust-01',
            name: parsed.name || (parsed.role === 'admin' ? 'Amadou Diallo (Admin HQ)' : 'Amadou Diallo'),
            phone: parsed.phone || '+221 77 540 22 11',
            email: parsed.email || 'amadou.diallo@gmail.com',
            city: parsed.city || 'Dakar',
            isLoggedIn: typeof parsed.isLoggedIn === 'boolean' ? parsed.isLoggedIn : true,
            role: parsed.role === 'admin' ? 'admin' : 'client',
            adminRole: parsed.adminRole
          };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return {
      id: 'cust-01',
      name: 'Amadou Diallo',
      phone: '+221 77 540 22 11',
      email: 'amadou.diallo@gmail.com',
      city: 'Dakar',
      isLoggedIn: true,
      role: 'client'
    };
  });

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalDefaultTab, setAuthModalDefaultTab] = useState<'client' | 'admin'>('client');

  const openAuthModal = (tab: 'client' | 'admin' = 'client') => {
    setAuthModalDefaultTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([
    {
      product: MOCK_PRODUCTS[0],
      quantity: 1,
      isGroupage: true,
      groupageId: 'grp-01'
    }
  ]);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isClientChatOpen, setClientChatOpen] = useState(false);

  const showToast = (type: ToastNotification['type'], title: string, message: string) => {
    const id = 'toast-' + Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', title = 'Notification') => {
    showToast(type, title, message);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Favorites
  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const isFav = prev.includes(productId);
      const updated = isFav ? prev.filter(id => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem('sinosenegal_favs', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      showToast(
        isFav ? 'info' : 'success',
        isFav ? 'Retiré des favoris' : 'Ajouté aux favoris',
        isFav ? 'Produit retiré de votre liste de souhaits' : 'Produit sauvegardé dans vos favoris !'
      );
      return updated;
    });
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  // Product Actions
  const addProduct = (prod: Omit<Product, 'id' | 'createdAt'>) => {
    const newProd: Product = {
      ...prod,
      id: 'prod-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setProducts(prev => [newProd, ...prev]);
    showToast('success', 'Produit créé', `${newProd.name} a été ajouté au catalogue.`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    showToast('info', 'Mise à jour', 'Le produit a été actualisé.');
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('warning', 'Produit supprimé', 'Le produit a été retiré du catalogue.');
  };

  const getProductBySlug = (slug: string) => {
    return products.find(p => p.slug === slug || p.id === slug);
  };

  const getProductById = (id: string) => {
    return products.find(p => p.id === id || p.slug === id);
  };

  // Groupage Actions
  const getGroupageById = (id: string) => {
    if (!id) return undefined;
    const safeId = (id || '').toLowerCase();
    const grp = groupages.find(g => g.id === id || (g.code && g.code.toLowerCase() === safeId));
    if (grp && !grp.product) {
      grp.product = products.find(p => p.id === grp.productId);
    }
    return grp;
  };

  const participateInGroupage = (groupageId: string, quantity: number) => {
    setGroupages(prev =>
      prev.map(g => {
        if (g.id === groupageId) {
          const newUnits = g.currentUnits + quantity;
          const isFull = newUnits >= g.targetUnits;
          return {
            ...g,
            currentUnits: newUnits,
            participantsCount: g.participantsCount + 1,
            status: isFull ? 'closed' : newUnits >= g.targetUnits * 0.8 ? 'closing_soon' : g.status
          };
        }
        return g;
      })
    );
    showToast('success', 'Participation validée', `${quantity} unité(s) réservée(s) sur le groupage !`);
  };

  const updateGroupageStatus = (groupageId: string, status: Groupage['status']) => {
    setGroupages(prev => prev.map(g => (g.id === groupageId ? { ...g, status } : g)));
    showToast('info', 'Statut mis à jour', `Le groupage est maintenant au statut : ${status}`);
  };

  const addGroupage = (groupage: Omit<Groupage, 'id'>) => {
    const newGrp: Groupage = {
      ...groupage,
      id: 'grp-' + Date.now()
    };
    setGroupages(prev => [newGrp, ...prev]);
    showToast('success', 'Campagne lancée', `Le groupage ${newGrp.code} est désormais actif.`);
  };

  // Order Actions
  const getOrderByTrackingCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    return orders.find(o => o.trackingCode.toUpperCase() === clean || o.id.toUpperCase() === clean);
  };

  const getOrderById = (id: string) => {
    return orders.find(o => o.id === id || o.trackingCode === id);
  };

  const createOrder = (orderData: {
    items: { product: Product; quantity: number; isGroupage?: boolean; groupageId?: string }[];
    customer: { fullName: string; phone: string; email: string; city: string };
    deliveryType: 'hub_pickup' | 'home_delivery';
    hubLocationId?: string;
    deliveryAddress?: DeliveryAddress;
    paymentMethod: 'wave' | 'orange_money' | 'free_money' | 'card' | 'hub_cash';
  }): Order => {
    const randomNum = Math.floor(10485 + Math.random() * 8000);
    const trackingCode = `AWP-${randomNum}`;
    const subtotal = orderData.items.reduce(
      (acc, item) => acc + item.product.priceXOF * item.quantity,
      0
    );
    const shippingFee = orderData.deliveryType === 'home_delivery' ? 2000 : 0;
    const total = subtotal + shippingFee;

    const newOrder: Order = {
      id: `ord-${randomNum}`,
      trackingCode,
      customer: {
        id: 'cust-' + Date.now(),
        fullName: orderData.customer.fullName,
        phone: orderData.customer.phone,
        email: orderData.customer.email,
        city: orderData.customer.city,
        totalOrdersCount: 1
      },
      items: orderData.items.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        productImage: i.product.images[0] || '',
        quantity: i.quantity,
        unitPriceXOF: i.product.priceXOF,
        totalPriceXOF: i.product.priceXOF * i.quantity,
        isGroupage: !!i.isGroupage,
        groupageId: i.groupageId,
        transportMode: i.product.defaultTransportMode
      })),
      subtotalXOF: subtotal,
      shippingFeeXOF: shippingFee,
      totalXOF: total,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: 'paid',
      currentStatus: 'order_confirmed',
      deliveryType: orderData.deliveryType,
      hubLocationId: orderData.hubLocationId,
      deliveryAddress: orderData.deliveryAddress,
      createdAt: new Date().toISOString(),
      estimatedDeliveryDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      trackingTimeline: [
        {
          id: 'tl-' + Date.now(),
          status: 'order_confirmed',
          title: 'Commande confirmée',
          description: `Votre commande a été validée avec succès via ${orderData.paymentMethod.toUpperCase()}.`,
          location: 'Plateforme SinoSenegal Dakar',
          timestamp: new Date().toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          completed: true,
          current: true
        }
      ]
    };

    setOrders(prev => [newOrder, ...prev]);

    // Update groupages if applicable
    orderData.items.forEach(item => {
      if (item.isGroupage && item.groupageId) {
        participateInGroupage(item.groupageId, item.quantity);
      }
    });

    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (
    orderId: string,
    newStatus: TrackingStatus,
    note?: string,
    location?: string
  ) => {
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id === orderId || ord.trackingCode === orderId) {
          const updatedTimeline = ord.trackingTimeline.map(tl => ({ ...tl, current: false }));
          const statusLabels: Record<TrackingStatus, string> = {
            order_confirmed: 'Commande confirmée',
            payment_received: 'Paiement reçu',
            groupage_consolidated: 'Groupage consolidé',
            purchased_in_china: 'Achat usine Chine',
            quality_control_passed: 'Contrôle qualité réussi',
            shipped_from_china: 'Expédié depuis la Chine',
            in_transit: 'En cours de transit international',
            arrived_in_senegal: 'Arrivé au Sénégal',
            customs_cleared: 'Dédouanement terminé',
            arrived_at_hub: 'Arrivé au Hub Sénégal',
            ready_for_pickup: 'Disponible au retrait',
            out_for_delivery: 'En cours de livraison finale',
            delivered: 'Colis livré avec succès'
          };

          updatedTimeline.push({
            id: 'tl-' + Date.now(),
            status: newStatus,
            title: statusLabels[newStatus] || newStatus,
            description: note || `Étape mise à jour : ${statusLabels[newStatus]}`,
            location: location || 'Hub SinoSenegal Dakar',
            timestamp: new Date().toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            completed: true,
            current: true
          });

          return {
            ...ord,
            currentStatus: newStatus,
            trackingTimeline: updatedTimeline
          };
        }
        return ord;
      })
    );
    showToast('info', 'Suivi mis à jour', `Le colis a passé l'étape : ${newStatus}`);
  };

  const addTrackingEvent = (
    orderId: string,
    event: {
      status: TrackingStatus;
      title: string;
      description: string;
      location: string;
      completed: boolean;
      current: boolean;
    }
  ) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId || o.trackingCode === orderId) {
          const updated = o.trackingTimeline.map(t => ({ ...t, current: false }));
          updated.push({
            id: 'ev-' + Date.now(),
            status: event.status,
            title: event.title,
            description: event.description,
            location: event.location,
            timestamp: new Date().toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            completed: event.completed,
            current: event.current
          });
          return {
            ...o,
            currentStatus: event.status,
            trackingTimeline: updated
          };
        }
        return o;
      })
    );
  };

  // Cart Actions
  const addToCart = (
    product: Product,
    quantity = 1,
    isGroupage = product.isGroupage,
    groupageId = product.activeGroupageId
  ) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, isGroupage, groupageId }];
    });
    showToast('success', 'Ajouté au panier', `${product.name} (x${quantity})`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
    showToast('info', 'Panier mis à jour', 'Article retiré du panier.');
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(i => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalXOF = cart.reduce(
    (sum, item) => sum + item.product.priceXOF * item.quantity,
    0
  );

  // B2B Actions
  const submitB2BRequest = (
    req: Omit<B2BRequest, 'id' | 'code' | 'createdAt' | 'status'>
  ): B2BRequest => {
    const code = `B2B-${Math.floor(8900 + Math.random() * 1000)}`;
    const newReq: B2BRequest = {
      ...req,
      id: 'b2b-' + Date.now(),
      code,
      status: 'submitted',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setB2BRequests(prev => [newReq, ...prev]);
    showToast(
      'success',
      'Demande B2B enregistrée',
      `Référence ${code}. Notre équipe en Chine analyse votre demande sous 24-48h.`
    );
    return newReq;
  };

  const updateB2BStatus = (id: string, status: B2BRequest['status']) => {
    setB2BRequests(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
    showToast('info', 'Demande B2B mise à jour', `Nouveau statut : ${status}`);
  };

  // Other Entities
  const updateCarrier = (id: string, updates: Partial<Carrier>) => {
    setCarriers(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    showToast('info', 'Transporteur actualisé', 'Paramètres de fret mis à jour.');
  };

  const addSupplier = (supplier: Omit<Supplier, 'id' | 'verifiedSince'>) => {
    const newSup: Supplier = {
      ...supplier,
      id: 'sup-' + Date.now(),
      verifiedSince: new Date().toISOString().split('T')[0]
    };
    setSuppliers(prev => [newSup, ...prev]);
    showToast('success', 'Fournisseur ajouté', `${newSup.name} enregistré.`);
  };

  const updateHubParcelCount = (hubId: string, delta: number) => {
    setHubLocations(prev =>
      prev.map(h =>
        h.id === hubId
          ? {
              ...h,
              activeParcelsCount: Math.max(0, h.activeParcelsCount + delta)
            }
          : h
      )
    );
  };

  const addCostVariance = (variance: Omit<CostVarianceItem, 'id'>) => {
    const newVar: CostVarianceItem = {
      ...variance,
      id: 'var-' + Date.now()
    };
    setCostVariances(prev => [newVar, ...prev]);
  };

  const markAlertAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, isRead: true } : a)));
  };

  // Customers & CRM
  const addCustomer = (cust: Omit<Customer, 'id'>) => {
    const newCust: Customer = {
      ...cust,
      id: 'cust-' + Date.now()
    };
    setCustomers(prev => [newCust, ...prev]);
    showToast('success', 'Client créé', `${newCust.fullName} ajouté à la base client.`);
  };

  // Activity Logs
  const addActivityLog = (log: Omit<AdminActivityLog, 'id' | 'timestamp' | 'time'>) => {
    const now = new Date();
    const newLog: AdminActivityLog = {
      ...log,
      id: 'act-' + Date.now(),
      timestamp: now.toISOString().replace('T', ' ').substring(0, 16),
      time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Sourcing Pipeline
  const addSourcingPipelineRequest = (req: Omit<SourcingPipelineRequest, 'id' | 'code' | 'createdAt' | 'status' | 'offersCount'>): SourcingPipelineRequest => {
    const code = `SRC-${Math.floor(2000 + Math.random() * 9000)}`;
    const newReq: SourcingPipelineRequest = {
      ...req,
      id: 'src-' + Date.now(),
      code,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'pending',
      offersCount: 0
    };
    setSourcingPipeline(prev => [newReq, ...prev]);
    showToast('success', 'Demande Sourcing créée', `Dossier ${code} assigné à l'équipe en Chine.`);
    return newReq;
  };

  const updateSourcingPipelineStatus = (id: string, status: SourcingPipelineRequest['status'], note?: string) => {
    setSourcingPipeline(prev =>
      prev.map(s => (s.id === id ? { ...s, status, notes: note ? `${s.notes || ''}\n${note}` : s.notes } : s))
    );
    showToast('info', 'Sourcing actualisé', `Nouveau statut : ${status}`);
  };

  // Payments Ledger
  const addPayment = (payment: Omit<PaymentRecord, 'id' | 'date' | 'time'>) => {
    const now = new Date();
    const newPay: PaymentRecord = {
      ...payment,
      id: 'pay-' + Date.now(),
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
    setPayments(prev => [newPay, ...prev]);
    showToast('success', 'Paiement enregistré', `Montant ${payment.amountXOF.toLocaleString('fr-FR')} FCFA validé.`);
  };

  const updatePaymentStatus = (id: string, status: PaymentRecord['status']) => {
    setPayments(prev => prev.map(p => (p.id === id ? { ...p, status } : p)));
    showToast('info', 'Paiement mis à jour', `Statut transaction : ${status}`);
  };

  // Promotions & Marketing
  const addPromotion = (promo: Omit<PromotionItem, 'id' | 'usageCount'>) => {
    const newPromo: PromotionItem = {
      ...promo,
      id: 'prm-' + Date.now(),
      usageCount: 0
    };
    setPromotions(prev => [newPromo, ...prev]);
    showToast('success', 'Promotion activée', `Code promo ${newPromo.code} créé.`);
  };

  const togglePromotionStatus = (id: string) => {
    setPromotions(prev =>
      prev.map(p => {
        if (p.id === id) {
          const nextStatus: PromotionItem['status'] = p.status === 'active' ? 'expired' : 'active';
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
    showToast('info', 'Statut promotion modifié', 'La visibilité du coupon a été mise à jour.');
  };

  // Notifications
  const updateNotificationTemplate = (id: string, updates: Partial<NotificationTemplate>) => {
    setNotificationTemplates(prev => prev.map(n => (n.id === id ? { ...n, ...updates } : n)));
    showToast('success', 'Modèle de notification mis à jour', 'Modifications enregistrées.');
  };

  const sendTestNotification = (id: string) => {
    const tmpl = notificationTemplates.find(n => n.id === id);
    if (tmpl) {
      showToast('success', 'Notification de test envoyée', `Canal: ${tmpl.channels.join(', ')} vers +221 77 540 22 11`);
    }
  };

  const updateCalcSettings = (settings: Partial<CalculationSettings>) => {
    setCalcSettings(prev => ({ ...prev, ...settings }));
    showToast('success', 'Paramètres enregistrés', 'Formules et taux actualisés.');
  };

  const loginUser = (
    data:
      | string
      | {
          identifier: string;
          role?: 'client' | 'admin';
          adminRole?: AdminRole;
          name?: string;
          phone?: string;
          email?: string;
          city?: string;
        }
  ) => {
    let userObj: {
      id: string;
      name: string;
      phone: string;
      email: string;
      city: string;
      isLoggedIn: boolean;
      role: 'client' | 'admin';
      adminRole?: AdminRole;
    };

    if (typeof data === 'string') {
      const isMail = data.includes('@');
      userObj = {
        id: 'cust-01',
        name: isMail ? 'Utilisateur SinoSenegal' : 'Amadou Diallo',
        phone: isMail ? '+221 77 540 22 11' : data,
        email: isMail ? data : 'amadou.diallo@gmail.com',
        city: 'Dakar',
        isLoggedIn: true,
        role: 'client'
      };
    } else {
      const role = data.role || 'client';
      if (role === 'admin') {
        const aRole = data.adminRole || 'SUPER_ADMIN';
        setCurrentRole(aRole);
        userObj = {
          id: 'admin-01',
          name: data.name || 'Amadou Diallo (Admin HQ)',
          phone: data.phone || '+221 77 420 18 19',
          email: data.email || data.identifier || 'admin@sinosenegal.sn',
          city: data.city || 'Dakar HQ',
          isLoggedIn: true,
          role: 'admin',
          adminRole: aRole
        };
      } else {
        userObj = {
          id: 'cust-' + Date.now().toString().slice(-4),
          name: data.name || (data.identifier.includes('77 540') ? 'Amadou Diallo' : 'Client SinoSenegal'),
          phone: data.phone || (data.identifier.includes('@') ? '+221 77 540 22 11' : data.identifier),
          email: data.email || (data.identifier.includes('@') ? data.identifier : 'client@sinosenegal.sn'),
          city: data.city || 'Dakar',
          isLoggedIn: true,
          role: 'client'
        };
      }
    }

    setCurrentUser(userObj);
    try {
      localStorage.setItem('sinosenegal_user_session', JSON.stringify(userObj));
    } catch (e) {
      console.error(e);
    }

    showToast(
      'success',
      userObj.role === 'admin' ? 'Espace Administrateur Connecté' : 'Connexion réussie',
      userObj.role === 'admin'
        ? `Bienvenue sur le centre de contrôle HQ (${userObj.adminRole || 'SUPER_ADMIN'})`
        : `Bienvenue sur votre espace ${userObj.name}`
    );
  };

  const logoutUser = () => {
    const loggedOutUser = {
      id: '',
      name: '',
      phone: '',
      email: '',
      city: '',
      isLoggedIn: false,
      role: 'client' as const
    };
    setCurrentUser(loggedOutUser);
    try {
      localStorage.removeItem('sinosenegal_user_session');
    } catch (e) {
      console.error(e);
    }
    showToast('info', 'Déconnexion effectuée', 'Vous avez été déconnecté de votre espace.');
  };

  // Compatibility aliases
  const systemSettings = {
    exchangeRateCNYtoXOF: calcSettings.exchangeRateCNY_XOF,
    exchangeRateUSDtoXOF: calcSettings.exchangeRateUSD_XOF,
    defaultAirFreightRateUSDPerKg: calcSettings.defaultAirRatePerKgXOF / calcSettings.exchangeRateUSD_XOF,
    defaultSeaFreightRateUSDPerCBM: calcSettings.defaultSeaRatePerCbmXOF / calcSettings.exchangeRateUSD_XOF,
    defaultTargetMarginPercent: calcSettings.defaultTargetMarginPercent
  };

  const updateSystemSettings = (s: any) => {
    setCalcSettings(prev => ({
      ...prev,
      exchangeRateCNY_XOF: s.exchangeRateCNYtoXOF || prev.exchangeRateCNY_XOF,
      exchangeRateUSD_XOF: s.exchangeRateUSDtoXOF || prev.exchangeRateUSD_XOF,
      defaultTargetMarginPercent: s.defaultTargetMarginPercent || prev.defaultTargetMarginPercent
    }));
  };

  return (
    <AppContext.Provider
      value={{
        currentPath,
        navigate,
        categories,
        selectedCategorySlug,
        setSelectedCategorySlug,
        searchQuery,
        setSearchQuery,
        favorites,
        toggleFavorite,
        isFavorite,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductBySlug,
        getProductById,
        groupages,
        getGroupageById,
        participateInGroupage,
        updateGroupageStatus,
        addGroupage,
        orders,
        getOrderByTrackingCode,
        getOrderById,
        createOrder,
        updateOrderStatus,
        addTrackingEvent,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartTotalCount: cartCount,
        cartTotalXOF,
        cartSubtotalXOF: cartTotalXOF,
        b2bRequests,
        submitB2BRequest,
        updateB2BStatus,
        carriers,
        updateCarrier,
        suppliers,
        addSupplier,
        sourcers,
        hubLocations,
        updateHubParcelCount,
        costVariances,
        addCostVariance,
        alerts,
        markAlertAsRead,
        customers,
        addCustomer,
        activityLogs,
        addActivityLog,
        sourcingPipeline,
        addSourcingPipelineRequest,
        updateSourcingPipelineStatus,
        quotes,
        addQuote,
        updateQuoteStatus,
        getQuoteById,
        getQuoteByCode,
        documents,
        addDocument,
        openDocumentModal,
        closeDocumentModal,
        payments,
        addPayment,
        updatePaymentStatus,
        promotions,
        addPromotion,
        togglePromotionStatus,
        notificationTemplates,
        updateNotificationTemplate,
        sendTestNotification,
        calcSettings,
        calculationSettings: calcSettings,
        updateCalcSettings,
        updateCalculationSettings: updateCalcSettings,
        systemSettings,
        updateSystemSettings,
        currentRole,
        setCurrentRole,
        currentUser,
        loginUser,
        logoutUser,
        isAuthModalOpen,
        authModalDefaultTab,
        openAuthModal,
        closeAuthModal,
        toasts,
        showToast,
        addToast,
        dismissToast,
        isClientChatOpen,
        setClientChatOpen
      }}
    >
      {children}
      <CommercialDocumentModal
        isOpen={documentModal.isOpen}
        onClose={closeDocumentModal}
        documentType={documentModal.type}
        quote={documentModal.quote}
        order={documentModal.order}
        documentData={documentModal.doc}
      />
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
