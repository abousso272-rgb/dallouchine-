import { supabase } from './supabase';
import { AppError } from './db';

/** Appel authentifié à l'API DALUCHE (Express) avec le jeton de session Supabase. */
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

/**
 * Démarre le paiement GeniusPay d'une commande et redirige vers la page de paiement sécurisée.
 * Le montant est fixé par le serveur à partir de la commande en base.
 */
export async function startPayment(orderId: string): Promise<void> {
  const res = await apiFetch<{ checkoutUrl?: string }>('/api/payments/create', {
    method: 'POST',
    body: { orderId }
  });
  if (!res.checkoutUrl) throw new AppError('La passerelle de paiement n’a pas renvoyé de lien de paiement.');
  window.location.assign(res.checkoutUrl);
}

export interface PaymentStatusResponse {
  success: boolean;
  payment?: { id: string; status: string; amount: number; paidAt?: string; paymentMethod?: string };
  order?: { id: string; trackingCode: string; paymentStatus: string; orderStatus: string; totalXOF: number };
}

export function getPaymentStatus(orderId: string) {
  return apiFetch<PaymentStatusResponse>(`/api/payments/order/${encodeURIComponent(orderId)}`);
}
