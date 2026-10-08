import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { friendlyError, AppError } from '../lib/db';
import type { AppRole, AppUser, CartLine, Category, Product } from '../lib/types';
import * as cartApi from '../services/cart';
import { listCategories } from '../services/catalog';
import { countUnreadNotifications } from '../services/account';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastType = 'success' | 'error' | 'info';
export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

export interface AuthPrompt {
  mode: 'login' | 'register';
  reason?: string;
  onSuccess?: () => void;
}

interface AppContextValue {
  // Navigation
  path: string;
  query: URLSearchParams;
  navigate: (to: string, opts?: { replace?: boolean; keepScroll?: boolean }) => void;

  // Session
  user: AppUser | null;
  authLoading: boolean;
  isStaff: boolean;
  signIn: (identifier: string, password: string) => Promise<AppUser>;
  signUp: (p: { fullName: string; phone: string; email?: string; password: string; city?: string }) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  authPrompt: AuthPrompt | null;
  requireAuth: (prompt: Omit<AuthPrompt, 'mode'> & { mode?: AuthPrompt['mode'] }) => boolean;
  closeAuthPrompt: () => void;

  // Panier
  cart: CartLine[];
  cartCount: number;
  cartTotal: number;
  cartLoading: boolean;
  addToCart: (product: Product, quantity: number) => Promise<void>;
  setCartQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  reloadCart: () => Promise<void>;

  // Données partagées
  categories: Category[];
  unreadCount: number;
  refreshUnread: () => void;

  // Notifications visuelles
  toasts: Toast[];
  toast: (type: ToastType, title: string, message?: string) => void;
  dismissToast: (id: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const ADMIN_ROLES = ['admin', 'super_admin', 'operations', 'commercial', 'finance'];
const TRANSITAIRE_ROLES = ['transitaire', 'sourcing', 'sourcer'];

export function toAppRole(role?: string | null, roles?: string[] | null): AppRole {
  const all = [String(role || '').toLowerCase(), ...(roles || []).map(r => String(r).toLowerCase())];
  if (all.some(r => ADMIN_ROLES.includes(r))) return 'admin';
  if (all.some(r => TRANSITAIRE_ROLES.includes(r))) return 'transitaire';
  if (all.includes('groupage_manager')) return 'groupage_manager';
  return 'client';
}

function isSyntheticEmail(email?: string | null) {
  return Boolean(email && /@user\.dallouchine\.sn$/i.test(email));
}

function phoneToAuthEmail(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const intl = digits.length === 9 ? `221${digits}` : digits;
  return `+${intl}@user.dallouchine.sn`;
}

async function loadProfile(authUser: User): Promise<AppUser> {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
  const meta = (authUser.user_metadata || {}) as Record<string, string>;
  const rawRole = String(profile?.role || 'client');
  return {
    id: authUser.id,
    email: isSyntheticEmail(authUser.email) ? '' : authUser.email || profile?.email || '',
    fullName: profile?.full_name || meta.full_name || '',
    phone: profile?.phone || meta.phone || '',
    city: profile?.city || meta.city || '',
    address: profile?.address || '',
    companyName: profile?.company_name || '',
    role: profile?.status === 'suspended' ? 'client' : toAppRole(rawRole, profile?.roles),
    rawRole,
    permissions: profile?.permissions || [],
    status: profile?.status || 'active'
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState(() => ({ path: window.location.pathname, search: window.location.search }));
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authPrompt, setAuthPrompt] = useState<AuthPrompt | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const userRef = useRef<AppUser | null>(null);
  userRef.current = user;

  // ---- Toasts
  const dismissToast = useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), []);
  const toast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = ++toastId.current;
      setToasts(t => [...t.slice(-3), { id, type, title, message }]);
      window.setTimeout(() => dismissToast(id), type === 'error' ? 6500 : 4200);
    },
    [dismissToast]
  );

  // ---- Navigation
  const navigate = useCallback((to: string, opts: { replace?: boolean; keepScroll?: boolean } = {}) => {
    const url = new URL(to, window.location.origin);
    if (url.origin !== window.location.origin) {
      window.location.assign(to);
      return;
    }
    if (opts.replace) window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    else window.history.pushState({}, '', url.pathname + url.search + url.hash);
    setLocation({ path: url.pathname, search: url.search });
    if (url.hash) {
      window.setTimeout(() => document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    } else if (!opts.keepScroll) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    const onPop = () => setLocation({ path: window.location.pathname, search: window.location.search });
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

  // ---- Panier
  const reloadCart = useCallback(async () => {
    const current = userRef.current;
    setCartLoading(true);
    try {
      if (current) setCart(await cartApi.fetchCart(current.id));
      else setCart(await cartApi.hydrateGuestCart(cartApi.readGuestCart()));
    } catch (err) {
      console.warn('[cart] reload:', err);
    } finally {
      setCartLoading(false);
    }
  }, []);

  const mergeGuestCart = useCallback(async (u: AppUser) => {
    const guest = cartApi.readGuestCart();
    if (!guest.length) return;
    try {
      const existing = await cartApi.fetchCart(u.id);
      for (const entry of guest) {
        const line = existing.find(l => l.productId === entry.productId);
        await cartApi.setCartQuantity(u.id, entry.productId, (line?.quantity || 0) + entry.quantity);
      }
      cartApi.writeGuestCart([]);
    } catch (err) {
      console.warn('[cart] merge guest cart:', err);
    }
  }, []);

  // ---- Session
  const applySession = useCallback(
    async (session: Session | null) => {
      if (!session?.user) {
        setUser(null);
        userRef.current = null;
        setUnreadCount(0);
        setCart(await cartApi.hydrateGuestCart(cartApi.readGuestCart()).catch(() => []));
        return;
      }
      const profile = await loadProfile(session.user);
      setUser(profile);
      userRef.current = profile;
      await mergeGuestCart(profile);
      setCart(await cartApi.fetchCart(profile.id).catch(() => []));
      countUnreadNotifications(profile.id).then(setUnreadCount).catch(() => undefined);
    },
    [mergeGuestCart]
  );

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      await applySession(data.session).catch(err => console.warn('[auth] init:', err));
      if (active) setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      if (event === 'TOKEN_REFRESHED' && userRef.current?.id === session?.user?.id) return;
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/mot-de-passe?mode=update', { replace: true });
      }
      // Différé pour ne pas bloquer le callback d'authentification de supabase-js
      window.setTimeout(() => {
        applySession(session).catch(err => console.warn('[auth] change:', err));
      }, 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [applySession, navigate]);

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await applySession(data.session);
  }, [applySession]);

  const signIn = useCallback(async (identifier: string, password: string) => {
    const id = identifier.trim();
    let email = id.toLowerCase();
    if (!id.includes('@')) {
      // Connexion par téléphone : retrouve l'email de connexion associé
      const { data } = await supabase.rpc('get_login_email', { p_identifier: id });
      email = typeof data === 'string' && data ? data : phoneToAuthEmail(id);
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new AppError(friendlyError(error || new Error('Connexion impossible')));
    const profile = await loadProfile(data.user);
    if (profile.status === 'suspended') {
      await supabase.auth.signOut();
      throw new AppError('Ce compte est suspendu. Contactez le support Dallou Chine.');
    }
    return profile;
  }, []);

  const signUp = useCallback(
    async (p: { fullName: string; phone: string; email?: string; password: string; city?: string }) => {
      const email = p.email?.trim().toLowerCase() || phoneToAuthEmail(p.phone);
      const { data, error } = await supabase.auth.signUp({
        email,
        password: p.password,
        options: {
          data: { full_name: p.fullName.trim(), phone: p.phone.trim(), city: p.city?.trim() || 'Dakar' },
          emailRedirectTo: `${window.location.origin}/compte`
        }
      });
      if (error) throw new AppError(friendlyError(error));
      if (data.user && data.session) {
        // Complète le profil créé par le déclencheur d'inscription (téléphone, ville)
        await supabase
          .from('profiles')
          .update({ full_name: p.fullName.trim(), phone: p.phone.trim(), city: p.city?.trim() || 'Dakar' })
          .eq('id', data.user.id);
        return { needsConfirmation: false };
      }
      return { needsConfirmation: true };
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut().catch(() => undefined);
    setUser(null);
    userRef.current = null;
    setCart([]);
    toast('info', 'Vous êtes déconnecté');
    navigate('/');
  }, [navigate, toast]);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/mot-de-passe?mode=update`
    });
    if (error) throw new AppError(friendlyError(error));
  }, []);

  const requireAuth = useCallback((prompt: Omit<AuthPrompt, 'mode'> & { mode?: AuthPrompt['mode'] }) => {
    if (userRef.current) return true;
    setAuthPrompt({ mode: prompt.mode || 'login', reason: prompt.reason, onSuccess: prompt.onSuccess });
    return false;
  }, []);

  const closeAuthPrompt = useCallback(() => setAuthPrompt(null), []);

  // ---- Actions panier
  const addToCart = useCallback(
    async (product: Product, quantity: number) => {
      const current = userRef.current;
      const existing = cart.find(l => l.productId === product.id);
      const next = (existing?.quantity || 0) + quantity;
      try {
        if (current) {
          await cartApi.setCartQuantity(current.id, product.id, next);
          setCart(await cartApi.fetchCart(current.id));
        } else {
          const guest = cartApi.readGuestCart().filter(e => e.productId !== product.id);
          guest.push({ productId: product.id, quantity: next });
          cartApi.writeGuestCart(guest);
          setCart(await cartApi.hydrateGuestCart(guest));
        }
        toast('success', 'Ajouté au panier', `${product.name} × ${quantity}`);
      } catch (err) {
        toast('error', 'Ajout impossible', friendlyError(err));
      }
    },
    [cart, toast]
  );

  const setCartQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const current = userRef.current;
      setCart(prev => (quantity <= 0 ? prev.filter(l => l.productId !== productId) : prev.map(l => (l.productId === productId ? { ...l, quantity } : l))));
      try {
        if (current) {
          await cartApi.setCartQuantity(current.id, productId, quantity);
        } else {
          const guest = cartApi.readGuestCart().filter(e => e.productId !== productId);
          if (quantity > 0) guest.push({ productId, quantity });
          cartApi.writeGuestCart(guest);
        }
      } catch (err) {
        toast('error', 'Panier non mis à jour', friendlyError(err));
        await reloadCart();
      }
    },
    [reloadCart, toast]
  );

  const removeFromCart = useCallback((productId: string) => setCartQuantity(productId, 0), [setCartQuantity]);

  const clearCart = useCallback(async () => {
    const current = userRef.current;
    setCart([]);
    if (current) await cartApi.clearCart(current.id).catch(() => undefined);
    else cartApi.writeGuestCart([]);
  }, []);

  // ---- Catégories (partagées par l'en-tête, le catalogue et l'accueil)
  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // ---- Notifications non lues : rafraîchies à la navigation et toutes les 60 s
  const refreshUnread = useCallback(() => {
    const current = userRef.current;
    if (!current) return;
    countUnreadNotifications(current.id).then(setUnreadCount).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshUnread();
    const t = window.setInterval(refreshUnread, 60000);
    return () => window.clearInterval(t);
  }, [user, refreshUnread, location.path]);

  const cartCount = cart.reduce((s, l) => s + l.quantity, 0);
  const cartTotal = cart.reduce((s, l) => s + l.quantity * l.unitPriceXOF, 0);

  const value: AppContextValue = {
    path: location.path,
    query,
    navigate,
    user,
    authLoading,
    isStaff: Boolean(user && user.role !== 'client'),
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshUser,
    authPrompt,
    requireAuth,
    closeAuthPrompt,
    cart,
    cartCount,
    cartTotal,
    cartLoading,
    addToCart,
    setCartQuantity,
    removeFromCart,
    clearCart,
    reloadCart,
    categories,
    unreadCount,
    refreshUnread,
    toasts,
    toast,
    dismissToast
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp doit être utilisé dans AppProvider');
  return ctx;
}
