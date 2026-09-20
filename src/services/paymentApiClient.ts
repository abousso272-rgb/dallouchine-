import { supabase } from './supabase';

export interface ClientPaymentResponse {
  success: boolean;
  checkoutUrl?: string;
  paymentId?: string;
  providerTransactionId?: string;
  amount?: number;
  currency?: string;
  errorMessage?: string;
}

export interface ClientPaymentStatusResponse {
  success: boolean;
  payment?: {
    id: string;
    orderId: string;
    orderCode: string;
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'expired';
    paymentMethod?: string;
    provider: string;
    providerTransactionId?: string;
    providerReference?: string;
    paidAt?: string;
    createdAt: string;
  };
  order?: {
    id: string;
    trackingCode: string;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'expired';
    orderStatus: string;
    totalXOF: number;
    customerName: string;
  };
  errorMessage?: string;
}

export class PaymentApiClient {
  /**
   * Initialise un paiement sécurisé côté serveur
   */
  static async createPayment(params: {
    orderId: string;
    userId?: string;
    orderData?: any;
    returnUrl?: string;
    cancelUrl?: string;
    paymentMethod?: string;
  }): Promise<ClientPaymentResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers,
        body: JSON.stringify(params)
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('[PaymentApiClient] Network error during payment creation:', error);
      return {
        success: false,
        errorMessage: 'Impossible de contacter le serveur de paiement. Veuillez vérifier votre connexion.'
      };
    }
  }

  /**
   * Vérifie le statut certifié d'un paiement ou d'une commande auprès du backend
   */
  static async getPaymentStatus(idOrOrderId: string): Promise<ClientPaymentStatusResponse> {
    try {
      const response = await fetch(`/api/payments/${encodeURIComponent(idOrOrderId)}/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        // Fallback avec /order/:orderId
        const orderResponse = await fetch(`/api/payments/order/${encodeURIComponent(idOrOrderId)}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (orderResponse.ok) {
          return await orderResponse.json();
        }
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('[PaymentApiClient] Error checking payment status:', error);
      return {
        success: false,
        errorMessage: 'Impossible de vérifier le statut du paiement pour le moment.'
      };
    }
  }

  /**
   * Récupère la liste des paiements pour le panneau d'administration
   */
  static async getAdminPayments(): Promise<{ success: boolean; payments: any[] }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/payments/admin/list', { headers });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('[PaymentApiClient] Could not load admin payments:', error);
    }
    return { success: false, payments: [] };
  }

  /**
   * Récupère le solde marchand GeniusPay (Admin)
   */
  static async getGeniusPayBalance(): Promise<{
    success: boolean;
    balance?: { available: number; pending: number; total: number; currency: string };
    error?: string;
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/payments/admin/geniuspay/balance', { headers });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('[PaymentApiClient] Failed to load GeniusPay balance:', error);
    }
    return { success: false, error: 'Impossible de récupérer le solde marchand GeniusPay.' };
  }

  /**
   * Récupère les détails du compte marchand GeniusPay (Admin)
   */
  static async getGeniusPayAccount(): Promise<{
    success: boolean;
    account?: { id: string; name: string; email: string; status: string };
    error?: string;
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/payments/admin/geniuspay/account', { headers });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('[PaymentApiClient] Failed to load GeniusPay account:', error);
    }
    return { success: false, error: 'Impossible de récupérer les informations du compte.' };
  }

  /**
   * Outil de simulation sandbox pour les tests de webhook
   */
  static async simulateSandboxWebhook(orderId: string, eventType: string = 'payment_success'): Promise<any> {
    try {
      const response = await fetch('/api/payments/simulate-sandbox-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, eventType })
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
