import { supabase } from './supabase';

export interface CompanyData {
  id?: string;
  user_id?: string;
  legal_name: string;
  trade_name?: string;
  registration_number?: string;
  sector?: string;
  country?: string;
  city?: string;
  address?: string;
  website?: string;
  phone?: string;
  email?: string;
  notes?: string;
  status?: string;
  created_at?: string;
}

export interface CompanyContactData {
  id?: string;
  company_id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  role?: string;
  email?: string;
  phone: string;
  whatsapp?: string;
  preferred_contact_method?: 'whatsapp' | 'email' | 'phone';
  is_primary?: boolean;
}

export interface B2BRequestData {
  id?: string;
  code?: string;
  user_id?: string;
  company_id?: string;
  contact_id?: string;
  company_name?: string;
  companyName?: string;
  contact_name?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  sector?: string;
  product_name?: string;
  productName?: string;
  product_description?: string;
  productDescription?: string;
  product_link?: string;
  productLink?: string;
  product_images?: Array<string | { url: string; name?: string }>;
  productImages?: Array<string | { url: string; name?: string }>;
  attachments?: Array<{ name: string; url: string; size?: number; mimeType?: string }>;
  quantity: number;
  budget_xof?: number;
  budgetXof?: number;
  currency?: string;
  transport_preference?: string;
  transportPreference?: string;
  destination?: string;
  specifications?: string;
  customization?: boolean;
  logo_instructions?: string;
  logoInstructions?: string;
  packaging_requested?: boolean;
  packagingRequested?: boolean;
  desired_deadline?: string;
  desiredDeadline?: string;
  status?: string;
  business_priority?: string;
  businessPriority?: string;
  production_stage?: string;
  productionStage?: string;
  production_started_at?: string;
  expected_completion_date?: string;
  actual_completion_date?: string;
  order_id?: string;
  orderId?: string;
  company?: CompanyData;
  contact?: CompanyContactData;
  assigned_to?: { id: string; full_name: string; email: string };
  quotes?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface B2BQuoteCreatePayload {
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

class B2BClientService {
  private async getAuthHeader(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
    return {};
  }

  // --- ENTREPRISES & CONTACTS ---

  async createCompany(payload: Partial<CompanyData>): Promise<{ success: boolean; company?: CompanyData; error?: string }> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch('/api/b2b/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async getCompanies(): Promise<{ success: boolean; companies: CompanyData[] }> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch('/api/b2b/companies', {
      headers: { ...authHeaders }
    });
    return res.json();
  }

  async addCompanyContact(companyId: string, payload: Partial<CompanyContactData>): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/b2b/companies/${companyId}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async getCompanyContacts(companyId: string): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/b2b/companies/${companyId}/contacts`, {
      headers: { ...authHeaders }
    });
    return res.json();
  }

  // --- DEMANDES B2B ---

  async createRequest(payload: Partial<B2BRequestData>): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const body = {
      ...payload,
      companyName: payload.companyName || payload.company_name,
      contactName: payload.contactName || payload.contact_name,
      productName: payload.productName || payload.product_name,
      productDescription: payload.productDescription || payload.product_description,
      productLink: payload.productLink || payload.product_link,
      productImages: payload.productImages || payload.product_images,
      budgetXof: payload.budgetXof !== undefined ? payload.budgetXof : payload.budget_xof,
      transportPreference: payload.transportPreference || payload.transport_preference,
      logoInstructions: payload.logoInstructions || payload.logo_instructions,
      packagingRequested: payload.packagingRequested !== undefined ? payload.packagingRequested : payload.packaging_requested,
      desiredDeadline: payload.desiredDeadline || payload.desired_deadline
    };
    const res = await fetch('/api/b2b/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(body)
    });
    return res.json();
  }

  async getRequests(filters?: { status?: string; search?: string }): Promise<{ success: boolean; requests: B2BRequestData[] }> {
    const authHeaders = await this.getAuthHeader();
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/b2b/requests${qs}`, {
      headers: { ...authHeaders }
    });
    return res.json();
  }

  async getRequestDetails(requestId: string): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/b2b/requests/${requestId}`, {
      headers: { ...authHeaders }
    });
    return res.json();
  }

  // --- ACTIONS OPÉRATIONNELLES (ADMIN) ---

  async qualifyRequest(requestId: string, payload: { notes?: string; priority?: string }): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/b2b/requests/${requestId}/qualify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async assignRequest(requestId: string, assignedUserId: string): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/b2b/requests/${requestId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ assignedUserId })
    });
    return res.json();
  }

  async addSupplier(requestId: string, payload: any): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/b2b/requests/${requestId}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async createQuote(requestId: string, payload: B2BQuoteCreatePayload): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/b2b/requests/${requestId}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async sendQuote(quoteId: string): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/b2b/quotes/${quoteId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders }
    });
    return res.json();
  }

  // --- ACTIONS CLIENTS ---

  async acceptQuote(quoteId: string): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/b2b/quotes/${quoteId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders }
    });
    return res.json();
  }

  async rejectQuote(quoteId: string, reason?: string): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/b2b/quotes/${quoteId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ reason })
    });
    return res.json();
  }

  // --- PRODUCTION & EXPÉDITION ---

  async updateStatus(requestId: string, status: string, notes?: string): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/b2b/requests/${requestId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ status, notes })
    });
    return res.json();
  }

  async startProduction(requestId: string, payload: { expectedCompletionDate?: string; notes?: string }): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/b2b/requests/${requestId}/production/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async updateProductionStage(requestId: string, stage: string, notes?: string): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/b2b/requests/${requestId}/production/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ stage, notes })
    });
    return res.json();
  }

  async transitionToShipment(requestId: string, payload: { carrierId: string; transportMode?: string; hubId?: string }): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    const res = await fetch(`/api/b2b/requests/${requestId}/ship`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  // --- UPLOAD FICHIERS ---

  async uploadFile(file: File, bucket: 'b2b-images' | 'b2b-attachments' = 'b2b-images'): Promise<any> {
    const authHeaders = await this.getAuthHeader();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Content = (reader.result as string).split(',')[1];
          const res = await fetch('/api/b2b/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              fileBase64: base64Content,
              bucket
            })
          });
          const data = await res.json();
          resolve(data);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}

export const b2bService = new B2BClientService();
