import { supabase } from './supabase';
import { AppError } from './db';

/** Appel authentifié à l'API Dallou Chine (Express) avec le jeton de session Supabase. */
export async function apiFetch<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method || 'GET',
      headers: {
        Accept: 'application/json',
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined
    });
  } catch {
    throw new AppError('Connexion au serveur impossible. Vérifiez votre réseau et réessayez.');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new AppError(json?.errorMessage || json?.error || json?.message || `Erreur serveur (${res.status}).`, json?.errorCode || json?.code);
  }
  return json as T;
}

/** Écran plein page « connexion sécurisée » affiché instantanément pendant la préparation du paiement. */
export function showPaymentOverlay(message = 'Connexion sécurisée au paiement…') {
  if (typeof document === 'undefined') return () => undefined;
  document.getElementById('payment-overlay')?.remove();
  const el = document.createElement('div');
  el.id = 'payment-overlay';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(251,247,242,.94);';
  el.innerHTML = `
    <div style="text-align:center;font-family:Manrope,system-ui,sans-serif;color:#0b1620;padding:24px">
      <div style="width:56px;height:56px;margin:0 auto 18px;border-radius:50%;border:4px solid #fde0cc;border-top-color:#f2560f;animation:payspin .8s linear infinite"></div>
      <p style="font-size:17px;font-weight:700;margin:0">${message}</p>
      <p style="font-size:13.5px;color:#5b6573;margin:6px 0 0">Wave · Orange Money · Carte bancaire — ne fermez pas cette page.</p>
    </div>
    <style>@keyframes payspin{to{transform:rotate(360deg)}}</style>`;
  document.body.appendChild(el);
  return () => el.remove();
}

/** Réveille la fonction serveur (évite l'attente au moment de payer). */
export function warmupPayments() {
  fetch('/api/payments/warmup', { cache: 'no-store' }).catch(() => undefined);
}

/**
 * Démarre le paiement d'une commande existante et redirige vers la page de paiement sécurisée.
 * Le montant est fixé par le serveur à partir de la commande en base.
 */
export async function startPayment(orderId: string): Promise<void> {
  const hide = showPaymentOverlay();
  try {
    const res = await apiFetch<{ checkoutUrl?: string }>('/api/payments/create', { method: 'POST', body: { orderId } });
    if (!res.checkoutUrl) throw new AppError('La passerelle de paiement n’a pas renvoyé de lien de paiement.');
    window.location.assign(res.checkoutUrl);
  } catch (err) {
    hide();
    throw err;
  }
}

export interface CheckoutPayload {
  items: { product_id: string; quantity: number }[];
  deliveryType: 'hub_pickup' | 'home_delivery';
  hubId: string | null;
  address: { street: string; district: string; city: string; instructions?: string } | null;
  name: string;
  phone: string;
  email: string;
  city: string;
  notes: string;
  transportMode: 'air' | 'sea';
  idempotencyKey: string;
}

/**
 * Commande + paiement en un seul appel serveur. Redirige vers SasPay si la session est prête ;
 * sinon renvoie l'identifiant de commande (paiement relançable depuis « Mes commandes »).
 */
export async function checkoutAndPay(p: CheckoutPayload): Promise<{ orderId: string; paymentError?: string }> {
  const hide = showPaymentOverlay('Création de votre commande…');
  try {
    const res = await apiFetch<{ orderId: string; checkoutUrl: string | null; paymentError?: string }>('/api/payments/checkout', { method: 'POST', body: p });
    if (res.checkoutUrl) {
      showPaymentOverlay('Redirection vers le paiement sécurisé…');
      window.location.assign(res.checkoutUrl);
      return { orderId: res.orderId };
    }
    hide();
    return { orderId: res.orderId, paymentError: res.paymentError || 'Le paiement n’a pas pu démarrer.' };
  } catch (err) {
    hide();
    throw err;
  }
}

export interface PaymentStatusResponse {
  success: boolean;
  payment?: { id: string; status: string; amount: number; paidAt?: string; paymentMethod?: string };
  order?: { id: string; trackingCode: string; paymentStatus: string; orderStatus: string; totalXOF: number };
}

export function getPaymentStatus(orderId: string) {
  return apiFetch<PaymentStatusResponse>(`/api/payments/order/${encodeURIComponent(orderId)}`);
}

export interface StaffPaymentLink {
  checkoutUrl: string;
  amount: number;
  orderCode: string;
  customerName?: string;
  customerPhone?: string;
  provider: string;
}

/** Équipe : génère un lien de paiement pour la commande d'un client (à envoyer par WhatsApp, SMS, email). */
export async function createStaffPaymentLink(orderId: string): Promise<StaffPaymentLink> {
  const res = await apiFetch<StaffPaymentLink>('/api/payments/staff-link', { method: 'POST', body: { orderId } });
  if (!res.checkoutUrl) throw new AppError('Le lien de paiement n’a pas pu être créé.');
  return res;
}

export interface PayoutNetwork {
  code: string;
  name: string;
  payin: boolean;
  payout: boolean;
}

export async function listPaymentNetworks(): Promise<PayoutNetwork[]> {
  const res = await apiFetch<{ networks: PayoutNetwork[] }>('/api/payments/networks');
  return res.networks || [];
}

/** Administration : remboursement automatique par envoi mobile money (SasPay). */
export function refundByPayout(input: { orderId: string; participantId?: string; networkCode: string; msisdn: string }) {
  return apiFetch<{ success: boolean; payoutId?: string; warning?: string }>('/api/payments/refund', { method: 'POST', body: input });
}
