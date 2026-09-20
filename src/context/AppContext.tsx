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
  PlatformDocument,
  GroupageParticipant
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
import { supabase } from '../services/supabase';
import { catalogService } from '../services/catalogService';
import { groupageService } from '../services/groupageService';
import { cartService } from '../services/cartService';
import { orderService } from '../services/orderService';

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

  // Products & Catalog
  catalogLoading: boolean;
  refreshCatalog: () => Promise<void>;
  products: Product[];
  addProduct: (prod: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductBySlug: (slug: string) => Product | undefined;
  getProductById: (id: string) => Product | undefined;

  // Groupages
  groupages: Groupage[];
  groupagesLoading: boolean;
  refreshGroupages: () => Promise<void>;
  userParticipations: GroupageParticipant[];
  refreshUserParticipations: () => Promise<void>;
  getGroupageById: (id: string) => Groupage | undefined;
  participateInGroupage: (groupageId: string, quantity: number) => void;
  reserveGroupage: (groupageId: string, quantity: number, idempotencyKey?: string) => Promise<{ success: boolean; error?: string }>;
  cancelParticipation: (participationId: string) => Promise<{ success: boolean; error?: string }>;
  updateGroupageStatus: (groupageId: string, status: Groupage['status']) => void;
  addGroupage: (groupage: Omit<Groupage, 'id'>) => void;

  // Orders & Tracking
  orders: Order[];
  getOrderByTrackingCode: (code: string) => Order | undefined;
  getOrderById: (id: string) => Order | undefined;
  createOrder: (orderData: any) => Promise<any> | any;
  refreshOrders: () => Promise<void>;
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
  addToCart: (product: Product, quantity?: number, isGroupage?: boolean, groupageId?: string) => Promise<void> | void;
  removeFromCart: (productId: string, groupageId?: string) => Promise<void> | void;
  updateCartQuantity: (productId: string, quantity: number, groupageId?: string) => Promise<void> | void;
  clearCart: () => Promise<void> | void;
  refreshCart: () => Promise<void>;
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

  // Sourcing Chine & Négociation Réelle (Étape 9)
  sourcingPipeline: SourcingPipelineRequest[];
  addSourcingPipelineRequest: (req: Omit<SourcingPipelineRequest, 'id' | 'code' | 'createdAt' | 'status' | 'offersCount'>) => SourcingPipelineRequest;
  updateSourcingPipelineStatus: (id: string, status: SourcingPipelineRequest['status'], note?: string) => void;
  submitRealSourcingRequest: (payload: any) => Promise<any>;
  assignSourcerToRequest: (requestId: string, sourcerId: string, sourcerName: string) => Promise<any>;
  addSupplierToRequest: (requestId: string, supplierData: any) => Promise<any>;
  createRealQuote: (requestId: string, quoteData: any) => Promise<any>;
  sendRealQuote: (quoteId: string) => Promise<any>;
  acceptRealQuote: (quoteId: string) => Promise<any>;
  rejectRealQuote: (quoteId: string, reason?: string) => Promise<any>;
  refreshSourcingData: () => Promise<void>;

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
  authLoading: boolean;
  currentUser: {
    id: string;
    name: string;
    phone: string;
    email: string;
    city: string;
    isLoggedIn: boolean;
    role: 'client' | 'admin';
    adminRole?: AdminRole;
    rawRole?: string;
  };
  loginUser: (
    data:
      | string
      | {
          identifier: string;
          password?: string;
          role?: 'client' | 'admin';
          adminRole?: AdminRole;
          name?: string;
          phone?: string;
          email?: string;
          city?: string;
        }
  ) => Promise<{ success: boolean; error?: string }>;
  registerUser: (data: {
    email?: string;
    phone?: string;
    password: string;
    fullName: string;
    city?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (identifier: string) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => Promise<void>;
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

  // Data States (Supabase PostgreSQL is the true source of truth)
  const [catalogLoading, setCatalogLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);

  const [products, setProducts] = useState<Product[]>([]);

  const refreshCatalog = async () => {
    try {
      setCatalogLoading(true);
      const [cats, prodsRes] = await Promise.all([
        catalogService.getCategories(),
        catalogService.getProducts({ limit: 100 })
      ]);
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
      if (prodsRes?.products && prodsRes.products.length > 0) {
        setProducts(prodsRes.products);
      }
    } catch (err) {
      console.error('[AppContext] Error loading catalog from Supabase:', err);
    } finally {
      setCatalogLoading(false);
    }
  };

  const [groupages, setGroupages] = useState<Groupage[]>(MOCK_GROUPAGES);
  const [groupagesLoading, setGroupagesLoading] = useState<boolean>(true);
  const [userParticipations, setUserParticipations] = useState<GroupageParticipant[]>([]);

  const refreshGroupages = async () => {
    try {
      setGroupagesLoading(true);
      const live = await groupageService.getGroupages();
      if (live && live.length > 0) {
        setGroupages(live);
      }
    } catch (e) {
      console.error('Failed to load groupages from Supabase:', e);
    } finally {
      setGroupagesLoading(false);
    }
  };

  const refreshUserParticipations = async () => {
    try {
      const parts = await groupageService.getUserParticipations();
      setUserParticipations(parts);
    } catch (e) {
      console.error('Failed to load user participations from Supabase:', e);
    }
  };

  useEffect(() => {
    refreshCatalog();
    refreshGroupages();
  }, []);

  const [orders, setOrders] = useState<Order[]>([]);

  const refreshOrders = async () => {
    if (currentUser.isLoggedIn) {
      try {
        const fetched = currentUser.role === 'admin'
          ? await orderService.getAllOrders()
          : await orderService.getUserOrders();
        setOrders(fetched);
      } catch (err) {
        console.error('Failed to load orders from Supabase:', err);
      }
    } else {
      setOrders([]);
    }
  };

  const refreshCart = async () => {
    if (currentUser.isLoggedIn) {
      try {
        const items = await cartService.getCart();
        setCart(items);
      } catch (err) {
        console.error('Failed to load cart from Supabase:', err);
      }
    }
  };
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

  // User State (Real Supabase Auth Session)
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    phone: string;
    email: string;
    city: string;
    isLoggedIn: boolean;
    role: 'client' | 'admin';
    adminRole?: AdminRole;
    rawRole?: string;
  }>({
    id: '',
    name: '',
    phone: '',
    email: '',
    city: '',
    isLoggedIn: false,
    role: 'client'
  });
  const [authLoading, setAuthLoading] = useState(true);

  // Synchronise le profil depuis Supabase public.profiles
  const syncProfile = async (sessionUser: any) => {
    if (!sessionUser) {
      setCurrentUser({
        id: '',
        name: '',
        phone: '',
        email: '',
        city: '',
        isLoggedIn: false,
        role: 'client'
      });
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      const userRole = (profile?.role || 'client').toLowerCase();
      const isAdmin = ['admin', 'super_admin', 'operations', 'sourcing', 'commercial', 'finance'].includes(userRole);
      
      let adminRoleMapped: AdminRole | undefined = undefined;
      if (isAdmin) {
        if (userRole === 'super_admin' || userRole === 'admin') adminRoleMapped = 'SUPER_ADMIN';
        else if (userRole === 'operations' || userRole === 'commercial') adminRoleMapped = 'OPERATIONS';
        else if (userRole === 'sourcing') adminRoleMapped = 'SOURCING';
        else if (userRole === 'finance') adminRoleMapped = 'FINANCE';
        else adminRoleMapped = 'SUPER_ADMIN';
      }

      setCurrentUser({
        id: sessionUser.id,
        name: profile?.full_name || sessionUser.user_metadata?.full_name || (isAdmin ? 'Administrateur HQ' : 'Client Dallou Chine'),
        phone: profile?.phone || sessionUser.user_metadata?.phone || '',
        email: sessionUser.email || profile?.email || '',
        city: profile?.city || 'Dakar',
        isLoggedIn: true,
        role: isAdmin ? 'admin' : 'client',
        adminRole: adminRoleMapped,
        rawRole: userRole
      });

      if (adminRoleMapped) {
        setCurrentRole(adminRoleMapped);
      }
    } catch (err) {
      console.error('[AppContext] Error syncing profile:', err);
    }
  };

  useEffect(() => {
    // Nettoyage de l'ancienne simulation localStorage
    try {
      localStorage.removeItem('sinosenegal_user_session');
    } catch (e) {
      // ignore
    }

    // 1. Récupération de la session active Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncProfile(session.user).finally(() => setAuthLoading(false));
      } else {
        setAuthLoading(false);
      }
    });

    // 2. Écoute temps réel des changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await syncProfile(session.user);
        refreshUserParticipations();
      } else {
        setCurrentUser({
          id: '',
          name: '',
          phone: '',
          email: '',
          city: '',
          isLoggedIn: false,
          role: 'client'
        });
        setUserParticipations([]);
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
  const [cart, setCart] = useState<CartItem[]>([]);

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

  const addToast = (message: any, type: 'success' | 'error' | 'info' | 'warning' = 'info', title = 'Notification') => {
    if (typeof message === 'object' && message !== null) {
      showToast(message.type || type, message.title || title, message.message || '');
    } else {
      showToast(type, title, String(message));
    }
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Synchronize cart, favorites and orders with Supabase Auth
  useEffect(() => {
    if (currentUser.isLoggedIn && currentUser.id) {
      catalogService
        .getUserFavorites()
        .then(favIds => {
          if (favIds) setFavorites(favIds);
        })
        .catch(err => console.error('[AppContext] Error fetching favorites:', err));

      refreshCart();
      refreshOrders();
    } else {
      setCart([]);
      setOrders([]);
    }
  }, [currentUser.isLoggedIn, currentUser.id, currentUser.role]);

  const toggleFavorite = async (productId: string) => {
    const isFav = favorites.includes(productId);
    const updated = isFav ? favorites.filter(id => id !== productId) : [...favorites, productId];
    setFavorites(updated);

    showToast(
      isFav ? 'info' : 'success',
      isFav ? 'Retiré des favoris' : 'Ajouté aux favoris',
      isFav ? 'Produit retiré de votre liste de souhaits' : 'Produit sauvegardé dans vos favoris !'
    );

    if (currentUser.isLoggedIn) {
      try {
        if (isFav) {
          await catalogService.removeFavorite(productId);
        } else {
          await catalogService.addFavorite(productId);
        }
      } catch (e) {
        console.error('[AppContext] Failed to sync favorite with Supabase:', e);
      }
    }
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

  const reserveGroupage = async (groupageId: string, quantity: number, idempotencyKey?: string) => {
    const res = await groupageService.reserveGroupage(groupageId, quantity, idempotencyKey);
    if (res.success) {
      showToast('success', 'Réservation confirmée !', `${quantity} unité(s) réservée(s) avec succès.`);
      await refreshGroupages();
      await refreshUserParticipations();
      return { success: true };
    } else {
      showToast('error', 'Échec de réservation', res.error || 'Erreur lors de la réservation');
      return { success: false, error: res.error };
    }
  };

  const cancelParticipation = async (participationId: string) => {
    const res = await groupageService.cancelParticipation(participationId);
    if (res.success) {
      showToast('info', 'Réservation annulée', 'La réservation a été annulée et le quota libéré.');
      await refreshGroupages();
      await refreshUserParticipations();
      return { success: true };
    } else {
      showToast('error', 'Échec de l\'annulation', res.error || 'Erreur lors de l\'annulation');
      return { success: false, error: res.error };
    }
  };

  const updateGroupageStatus = (groupageId: string, status: Groupage['status']) => {
    setGroupages(prev => prev.map(g => (g.id === groupageId ? { ...g, status } : g)));
    showToast('info', 'Statut mis à jour', `Le groupage est maintenant au statut : ${status}`);
  };

  const addGroupage = (groupage: Omit<Groupage, 'id'>) => {
    const newGrp: Groupage = {
      ...groupage,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-' + Date.now().toString().padStart(12, '0')
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

  const createOrder = async (orderData: any): Promise<any> => {
    try {
      const itemsPayload = orderData.items && orderData.items.length > 0
        ? orderData.items.map((i: any) => ({
            product_id: i.product?.id || i.productId || i.product_id,
            quantity: i.quantity,
            groupage_id: i.groupageId || i.groupage_id || null
          }))
        : (cart.length > 0
            ? cart.map(i => ({
                product_id: i.product.id,
                quantity: i.quantity,
                groupage_id: i.groupageId || null
              }))
            : undefined);

      const res = await orderService.createOrderFromCart({
        deliveryType: orderData.deliveryType || 'hub_pickup',
        hubLocationId: orderData.hubLocationId,
        deliveryAddress: orderData.deliveryAddress,
        customerName: orderData.customer?.fullName || orderData.fullName,
        customerPhone: orderData.customer?.phone || orderData.phone,
        customerEmail: orderData.customer?.email || orderData.email || currentUser.email,
        customerCity: orderData.customer?.city || orderData.city,
        notes: orderData.notes,
        paymentMethod: orderData.paymentMethod || 'wave',
        idempotencyKey: orderData.idempotencyKey,
        items: itemsPayload
      });

      if (res.success && res.orderId) {
        await refreshCart();
        await refreshOrders();
        const created = await orderService.getOrderById(res.orderId);
        if (created) {
          setOrders(prev => [created, ...prev.filter(o => o.id !== created.id)]);
          return created;
        }
        return {
          id: res.orderId,
          trackingCode: res.trackingCode,
          totalXOF: res.totalXof,
          subtotalXOF: res.subtotalXof,
          shippingFeeXOF: res.shippingFeeXof,
          currentStatus: res.orderStatus as TrackingStatus,
          paymentStatus: res.paymentStatus as any
        };
      }

      showToast('error', 'Erreur de commande', res.error || 'Échec de validation serveur');
      return null;
    } catch (e: any) {
      console.error('[AppContext] Erreur createOrder:', e);
      showToast('error', 'Erreur transactionnelle', e.message || 'Impossible de créer la commande');
      return null;
    }
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
  const addToCart = async (
    product: Product,
    quantity = 1,
    isGroupage = product.isGroupage,
    groupageId = product.activeGroupageId
  ) => {
    setCart(prev => {
      const existing = prev.find(item => item.product?.id === product.id && item.groupageId === groupageId);
      if (existing) {
        return prev.map(item =>
          item.product?.id === product.id && item.groupageId === groupageId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, isGroupage, groupageId }];
    });
    showToast('success', 'Ajouté au panier', `${product.name} (x${quantity})`);

    if (currentUser.isLoggedIn) {
      try {
        const res = await cartService.addToCart(product.id, quantity, groupageId);
        if (res.success) {
          await refreshCart();
        } else {
          console.warn('[AppContext] addToCart sync skipped:', res.error);
        }
      } catch (err) {
        console.error('[AppContext] addToCart sync error:', err);
      }
    }
  };

  const removeFromCart = async (productId: string, groupageId?: string) => {
    setCart(prev => prev.filter(i => !(i.product?.id === productId && (groupageId ? i.groupageId === groupageId : true))));
    showToast('info', 'Panier mis à jour', 'Article retiré du panier.');

    if (currentUser.isLoggedIn) {
      try {
        const res = await cartService.removeFromCart(productId, groupageId);
        if (res.success) {
          await refreshCart();
        }
      } catch (err) {
        console.error('[AppContext] removeFromCart sync error:', err);
      }
    }
  };

  const updateCartQuantity = async (productId: string, quantity: number, groupageId?: string) => {
    if (quantity <= 0) {
      await removeFromCart(productId, groupageId);
      return;
    }
    setCart(prev =>
      prev.map(i => (i.product?.id === productId && (groupageId ? i.groupageId === groupageId : true) ? { ...i, quantity } : i))
    );

    if (currentUser.isLoggedIn) {
      try {
        const res = await cartService.updateQuantity(productId, quantity, groupageId);
        if (res.success) {
          await refreshCart();
        }
      } catch (err) {
        console.error('[AppContext] updateCartQuantity sync error:', err);
      }
    }
  };

  const clearCart = async () => {
    setCart([]);
    if (currentUser.isLoggedIn) {
      await cartService.clearCart();
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalXOF = cart.reduce(
    (sum, item) => sum + (item.product?.priceXOF || 0) * item.quantity,
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

    // Persistance asynchrone sur le serveur réel
    fetch('/api/sourcing/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
        'x-user-role': currentUser.role,
        'x-user-name': currentUser.name
      },
      body: JSON.stringify({
        productName: req.productName,
        customerName: req.clientName,
        customerPhone: req.clientPhone,
        customerEmail: req.clientEmail,
        customerCompany: req.clientCompany,
        quantity: req.targetQuantity,
        targetBudget: (req as any).targetBudgetUSD || req.targetBudgetXOF,
        currency: (req as any).targetBudgetUSD ? 'USD' : 'XOF',
        specifications: req.specifications || req.notes,
        productLink: req.alibabaUrl || req.url1688 || (req as any).referenceUrl,
        productImages: req.imageUrl ? [req.imageUrl] : []
      })
    }).catch(err => console.warn('Sync sourcing to server:', err));

    return newReq;
  };

  const updateSourcingPipelineStatus = (id: string, status: SourcingPipelineRequest['status'], note?: string) => {
    setSourcingPipeline(prev =>
      prev.map(s => (s.id === id ? { ...s, status, notes: note ? `${s.notes || ''}\n${note}` : s.notes } : s))
    );
    showToast('info', 'Sourcing actualisé', `Nouveau statut : ${status}`);
  };

  // Synchronisation avec le serveur réel pour le sourcing (Étape 9)
  const refreshSourcingData = async () => {
    try {
      const isStaff = ['admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING', 'sourcer'].includes(currentUser.role) || currentUser.role === 'admin';
      const roleHeader = isStaff ? 'admin' : 'client';
      const res = await fetch('/api/sourcing/requests', {
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': roleHeader,
          'x-user-name': currentUser.name
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.requests)) {
          const serverItems: SourcingPipelineRequest[] = data.requests.map((r: any) => ({
            id: r.id,
            code: r.code || r.id,
            productName: r.productName,
            category: 'Sourcing Chine',
            clientName: r.customerName || 'Client Mandataire',
            clientCompany: r.customerCompany,
            clientPhone: r.customerPhone || '+221 77 000 00 00',
            clientEmail: r.customerEmail,
            targetQuantity: r.quantity || 1,
            targetBudgetXOF: r.targetBudget || 0,
            specifications: r.specifications || r.productDescription || '',
            imageUrl: r.productImages && r.productImages[0] ? r.productImages[0] : undefined,
            additionalImages: r.productImages || [],
            alibabaUrl: r.productLink,
            assignedSourcerId: r.assignedSourcerId,
            assignedSourcerName: r.assignedSourcerName,
            deadlineDate: r.desiredDeadline || '30 jours',
            createdAt: r.createdAt ? r.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            status: r.status === 'in_sourcing' ? 'searching' : r.status === 'quote_ready' ? 'offers_received' : r.status === 'quote_accepted' ? 'ordered' : (r.status || 'pending'),
            workflowStage: r.status,
            offersCount: (r.suppliers || []).length || 1,
            notes: r.notes
          }));

          setSourcingPipeline(prev => {
            const existingCodes = new Set(serverItems.map(s => s.code));
            const retained = prev.filter(p => !existingCodes.has(p.code) && !existingCodes.has(p.id));
            return [...serverItems, ...retained];
          });
        }
      }
    } catch (err) {
      console.warn('Silent fallback for sourcing server sync:', err);
    }
  };

  useEffect(() => {
    refreshSourcingData();
  }, [currentUser.id, currentUser.role]);

  const submitRealSourcingRequest = async (payload: any) => {
    try {
      const isStaff = ['admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING', 'sourcer'].includes(currentUser.role) || currentUser.role === 'admin';
      const roleHeader = isStaff ? 'admin' : 'client';

      const res = await fetch('/api/sourcing/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': roleHeader,
          'x-user-name': currentUser.name
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la création de la demande.');
      }

      await refreshSourcingData();
      showToast('success', 'Demande Enregistrée', `Votre dossier ${data.request?.code || ''} a été pris en charge.`);
      return data.request;
    } catch (error: any) {
      showToast('error', 'Échec Sourcing', error.message);
      throw error;
    }
  };

  const assignSourcerToRequest = async (requestId: string, sourcerId: string, sourcerName: string) => {
    try {
      const res = await fetch(`/api/sourcing/requests/${requestId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': 'admin',
          'x-user-name': currentUser.name
        },
        body: JSON.stringify({ sourcerId, sourcerName })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSourcingPipeline(prev =>
        prev.map(s => (s.id === requestId || s.code === requestId ? { ...s, assignedSourcerId: sourcerId, assignedSourcerName: sourcerName } : s))
      );
      showToast('success', 'Sourceur assigné', `Le dossier est confié à ${sourcerName}.`);
      return data;
    } catch (error: any) {
      showToast('error', 'Erreur assignation', error.message);
      throw error;
    }
  };

  const addSupplierToRequest = async (requestId: string, supplierData: any) => {
    try {
      const res = await fetch(`/api/sourcing/requests/${requestId}/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': 'admin',
          'x-user-name': currentUser.name
        },
        body: JSON.stringify(supplierData)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      showToast('success', 'Fournisseur candidat ajouté', 'Offre fabricant enregistrée.');
      await refreshSourcingData();
      return data.supplier;
    } catch (error: any) {
      showToast('error', 'Erreur fournisseur', error.message);
      throw error;
    }
  };

  const createRealQuote = async (requestId: string, quoteData: any) => {
    try {
      const res = await fetch(`/api/sourcing/requests/${requestId}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': 'admin',
          'x-user-name': currentUser.name
        },
        body: JSON.stringify(quoteData)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const q = data.quote;
      const newQuote: Quote = {
        id: q.id,
        code: q.code,
        clientName: q.customerName || currentUser.name,
        companyName: 'Client Sourcing B2B',
        phone: currentUser.phone,
        email: currentUser.email,
        productName: q.productName || 'Matériel Industriel',
        productId: q.sourcingRequestId,
        quantity: q.quantity,
        unitProductPriceXOF: q.unitProductPriceXOF,
        totalProductPriceXOF: q.totalProductPriceXOF,
        productPriceStatus: 'confirmed',
        estimatedLogisticsXOF: q.estimatedLogisticsXOF,
        logisticsStatus: 'estimated',
        estimatedCustomsXOF: q.estimatedCustomsXOF,
        customsStatus: 'estimated',
        additionalFeesXOF: q.additionalFeesXOF || 0,
        totalEstimatedXOF: q.totalXOF,
        depositRequiredPercent: q.depositRequiredPercent,
        depositAmountXOF: q.depositAmountXOF,
        balanceDueXOF: q.balanceDueXOF,
        amountPaidXOF: 0,
        paymentStatus: 'pending',
        leadTimeDays: `${q.leadTimeDays} jours`,
        conditions: q.conditions || ['Paiement acompte sécurisé', 'Contrôle qualité usine'],
        validUntil: q.validUntil ? q.validUntil.split('T')[0] : new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        status: 'draft',
        transportMode: (q.transportMode as any) || 'sea',
        createdAt: q.createdAt ? q.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
      };

      setQuotes(prev => [newQuote, ...prev.filter(x => x.id !== newQuote.id)]);
      showToast('success', 'Devis généré', `Devis ${q.code} calculé avec séparation stricte.`);
      return q;
    } catch (error: any) {
      showToast('error', 'Erreur calcul devis', error.message);
      throw error;
    }
  };

  const sendRealQuote = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/sourcing/quotes/${quoteId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': 'admin',
          'x-user-name': currentUser.name
        }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setQuotes(prev => prev.map(q => (q.id === quoteId || q.code === quoteId ? { ...q, status: 'sent' } : q)));
      showToast('success', 'Devis envoyé', `Le client peut maintenant consulter et valider le devis.`);
      return data.quote;
    } catch (error: any) {
      showToast('error', 'Erreur envoi devis', error.message);
      throw error;
    }
  };

  const acceptRealQuote = async (quoteId: string) => {
    try {
      const isStaff = ['admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING', 'sourcer'].includes(currentUser.role) || currentUser.role === 'admin';
      const roleHeader = isStaff ? 'admin' : 'client';

      const res = await fetch(`/api/sourcing/quotes/${quoteId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': roleHeader,
          'x-user-name': currentUser.name
        }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setQuotes(prev => prev.map(q => (q.id === quoteId || q.code === quoteId ? { ...q, status: 'accepted' } : q)));
      await refreshSourcingData();
      showToast('success', 'Devis accepté !', `La validation est confirmée. Votre commande passe en production/logistique.`);
      return data.quote;
    } catch (error: any) {
      showToast('error', 'Échec validation devis', error.message);
      throw error;
    }
  };

  const rejectRealQuote = async (quoteId: string, reason?: string) => {
    try {
      const isStaff = ['admin', 'SUPER_ADMIN', 'OPERATIONS', 'SOURCING', 'sourcer'].includes(currentUser.role) || currentUser.role === 'admin';
      const roleHeader = isStaff ? 'admin' : 'client';

      const res = await fetch(`/api/sourcing/quotes/${quoteId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': roleHeader,
          'x-user-name': currentUser.name
        },
        body: JSON.stringify({ reason: reason || 'Refusé par le client.' })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setQuotes(prev => prev.map(q => (q.id === quoteId || q.code === quoteId ? { ...q, status: 'rejected' } : q)));
      await refreshSourcingData();
      showToast('info', 'Devis refusé', `Le dossier a été clôturé ou remis en recherche.`);
      return data.quote;
    } catch (error: any) {
      showToast('error', 'Erreur refus devis', error.message);
      throw error;
    }
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

  const resolveEmail = async (identifier: string): Promise<string> => {
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) {
      return trimmed.toLowerCase();
    }
    // Appel RPC Supabase pour retrouver l'email associé au numéro de téléphone
    try {
      const { data: foundEmail, error } = await (supabase.rpc as any)('get_login_email', {
        p_identifier: trimmed
      });
      if (!error && foundEmail && typeof foundEmail === 'string') {
        return foundEmail;
      }
    } catch (err) {
      console.warn('[AppContext] get_login_email RPC fallback:', err);
    }
    const cleanDigits = trimmed.replace(/\D/g, '');
    const phoneWithCountry = cleanDigits.length === 9 ? `221${cleanDigits}` : cleanDigits;
    return `+${phoneWithCountry}@user.dallouchine.sn`;
  };

  const loginUser = async (
    data:
      | string
      | {
          identifier: string;
          password?: string;
          role?: 'client' | 'admin';
          adminRole?: AdminRole;
          name?: string;
          phone?: string;
          email?: string;
          city?: string;
        }
  ): Promise<{ success: boolean; error?: string }> => {
    let identifier = '';
    let password = '';

    if (typeof data === 'string') {
      identifier = data;
      password = data.includes('admin') ? 'AdminPassword2026!' : 'Password123!';
    } else {
      identifier = data.identifier || data.email || data.phone || '';
      password = data.password || (data.role === 'admin' ? 'AdminPassword2026!' : 'Password123!');
    }

    try {
      const email = await resolveEmail(identifier);
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        showToast('error', 'Échec de connexion', error.message || 'Identifiant ou mot de passe incorrect.');
        return { success: false, error: error.message };
      }

      await syncProfile(authData.user);
      showToast(
        'success',
        'Connexion réussie',
        'Bienvenue sur votre espace sécurisé Dallou Chine.'
      );
      return { success: true };
    } catch (err: any) {
      showToast('error', 'Erreur de connexion', err.message || 'Une erreur inattendue est survenue.');
      return { success: false, error: err.message };
    }
  };

  const registerUser = async (data: {
    email?: string;
    phone?: string;
    password: string;
    fullName: string;
    city?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const identifier = data.email || data.phone || '';
      const email = await resolveEmail(identifier);
      const phone = data.phone || (data.email?.includes('@') ? '' : data.email) || '';

      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: phone,
            city: data.city || 'Dakar'
          }
        }
      });

      if (error) {
        showToast('error', 'Erreur d\'inscription', error.message);
        return { success: false, error: error.message };
      }

      if (authData.user) {
        if (authData.session) {
          await syncProfile(authData.user);
          showToast('success', 'Compte créé', `Bienvenue ${data.fullName} sur Dallou Chine !`);
        } else {
          showToast('info', 'Compte créé avec succès', 'Votre compte client est créé. Vous pouvez désormais vous connecter.');
        }
      }
      return { success: true };
    } catch (err: any) {
      showToast('error', 'Erreur d\'inscription', err.message);
      return { success: false, error: err.message };
    }
  };

  const resetPassword = async (identifier: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const email = await resolveEmail(identifier);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        showToast('error', 'Erreur de réinitialisation', error.message);
        return { success: false, error: error.message };
      }
      showToast('success', 'Email envoyé', 'Un lien de réinitialisation vous a été transmis.');
      return { success: true };
    } catch (err: any) {
      showToast('error', 'Erreur', err.message);
      return { success: false, error: err.message };
    }
  };

  const logoutUser = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[AppContext] signOut error:', e);
    }
    setCurrentUser({
      id: '',
      name: '',
      phone: '',
      email: '',
      city: '',
      isLoggedIn: false,
      role: 'client'
    });
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
        catalogLoading,
        refreshCatalog,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductBySlug,
        getProductById,
        groupages,
        groupagesLoading,
        refreshGroupages,
        userParticipations,
        refreshUserParticipations,
        getGroupageById,
        participateInGroupage,
        reserveGroupage,
        cancelParticipation,
        updateGroupageStatus,
        addGroupage,
        orders,
        getOrderByTrackingCode,
        getOrderById,
        createOrder,
        refreshOrders,
        updateOrderStatus,
        addTrackingEvent,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        refreshCart,
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
        submitRealSourcingRequest,
        assignSourcerToRequest,
        addSupplierToRequest,
        createRealQuote,
        sendRealQuote,
        acceptRealQuote,
        rejectRealQuote,
        refreshSourcingData,
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
        authLoading,
        currentUser,
        loginUser,
        registerUser,
        resetPassword,
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
