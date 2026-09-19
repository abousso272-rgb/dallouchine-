import { supabase } from './supabase';

export interface SourcingRequestData {
  id?: string;
  code?: string;
  title: string;
  description?: string;
  productUrl?: string;
  imageUrl?: string;
  additionalImages?: string[];
  category?: string;
  quantity: number;
  budgetXof?: number;
  currency?: string;
  customization?: boolean;
  customizationDetails?: string;
  specifications?: string;
  desiredDeadline?: string;
  destination?: string;
  attachments?: Array<{ name: string; url: string; size?: number; mimeType?: string }>;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientCompany?: string;
  status?: string;
  assigned_sourcer_id?: string;
  assigned_sourcer?: { id: string; name: string; location_city: string; phone?: string; email?: string };
  quotes?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface QuoteCreateData {
  items: Array<{ description: string; quantity: number; unit_price_xof: number }>;
  shippingXof?: number;
  customsXof?: number;
  feesXof?: number;
  discountXof?: number;
  depositRequiredPercent?: number;
  validDays?: number;
  transportMode?: string;
  leadTimeDays?: string;
  conditions?: string[];
  notes?: string;
  supplierId?: string;
  sourcerId?: string;
}

class SourcingService {
  private async getAuthHeader(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
    return {};
  }

  /**
   * Créer une demande de sourcing (Client connecté ou anonyme)
   */
  async createRequest(payload: Partial<SourcingRequestData>): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch('/api/sourcing/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  /**
   * Récupérer les demandes de sourcing (Mes demandes si client, toutes si admin)
   */
  async getRequests(): Promise<{ success: boolean; requests: SourcingRequestData[] }> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch('/api/sourcing/requests', {
      headers: { ...authHeaders }
    });
    return res.json();
  }

  /**
   * Récupérer les détails d'une demande avec timeline, devis et fournisseurs
   */
  async getRequestDetails(requestId: string): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/sourcing/requests/${requestId}`, {
      headers: { ...authHeaders }
    });
    return res.json();
  }

  /**
   * Transition de statut de la demande (Admin)
   */
  async updateStatus(requestId: string, status: string, notes?: string): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/sourcing/requests/${requestId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify({ status, notes })
    });
    return res.json();
  }

  /**
   * Assigner un sourceur à une demande (Admin)
   */
  async assignSourcer(requestId: string, sourcerId: string): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/sourcing/requests/${requestId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify({ sourcerId })
    });
    return res.json();
  }

  /**
   * Ajouter / comparer un fournisseur pour la demande (Admin)
   */
  async addSupplier(requestId: string, supplierData: any): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/sourcing/requests/${requestId}/suppliers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify(supplierData)
    });
    return res.json();
  }

  /**
   * Récupérer les fournisseurs comparés pour une demande (Admin)
   */
  async getSuppliers(requestId: string): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/sourcing/requests/${requestId}/suppliers`, {
      headers: { ...authHeaders }
    });
    return res.json();
  }

  /**
   * Créer un devis pour la demande avec calculs serveur (Admin)
   */
  async createQuote(requestId: string, quoteData: QuoteCreateData): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/sourcing/requests/${requestId}/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify(quoteData)
    });
    return res.json();
  }

  /**
   * Envoyer le devis au client (Admin)
   */
  async sendQuote(quoteId: string): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/sourcing/quotes/${quoteId}/send`, {
      method: 'POST',
      headers: { ...authHeaders }
    });
    return res.json();
  }

  /**
   * Consulter un devis spécifique
   */
  async getQuote(quoteId: string): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/sourcing/quotes/${quoteId}`, {
      headers: { ...authHeaders }
    });
    return res.json();
  }

  /**
   * Accepter un devis (Client)
   */
  async acceptQuote(quoteId: string): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/sourcing/quotes/${quoteId}/accept`, {
      method: 'POST',
      headers: { ...authHeaders }
    });
    return res.json();
  }

  /**
   * Refuser un devis (Client)
   */
  async rejectQuote(quoteId: string, reason?: string): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/sourcing/quotes/${quoteId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify({ reason })
    });
    return res.json();
  }

  /**
   * Upload de fichier (image ou document)
   */
  async uploadFile(fileData: {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileBase64: string;
    bucket?: 'sourcing-images' | 'sourcing-attachments';
  }): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch('/api/sourcing/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify(fileData)
    });
    return res.json();
  }
}

export const sourcingClient = new SourcingService();
