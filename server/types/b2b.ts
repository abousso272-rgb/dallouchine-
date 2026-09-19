// ==============================================================================
// TYPES TYPESCRIPT POUR LE MODULE B2B RÉEL (ÉTAPE 10)
// ==============================================================================

export type B2BStatus =
  | 'new'
  | 'qualified'
  | 'sourcing'
  | 'negotiation'
  | 'quote_ready'
  | 'quote_sent'
  | 'accepted'
  | 'rejected'
  | 'deposit_paid'
  | 'production'
  | 'shipping'
  | 'completed'
  | 'cancelled';

export type B2BProductionStage =
  | 'not_started'
  | 'production_started'
  | 'sample_ready'
  | 'sample_approved'
  | 'production_in_progress'
  | 'production_completed';

export interface CompanyRecord {
  id: string;
  user_id?: string | null;
  legal_name: string;
  trade_name?: string | null;
  registration_number?: string | null;
  sector?: string | null;
  country?: string;
  city?: string;
  address?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface CompanyContactRecord {
  id: string;
  company_id: string;
  user_id?: string | null;
  first_name: string;
  last_name: string;
  role?: string | null;
  email?: string | null;
  phone: string;
  whatsapp?: string | null;
  preferred_contact_method: 'whatsapp' | 'email' | 'phone';
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface B2BRequestRecord {
  id: string;
  code: string;
  user_id?: string | null;
  company_id?: string | null;
  contact_id?: string | null;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  sector?: string | null;
  product_name: string;
  product_description: string;
  product_link?: string | null;
  product_images: Array<string | { url: string; name?: string }>;
  attachments?: Array<{ name: string; url: string; size?: number; mimeType?: string }>;
  quantity: number;
  budget_xof?: number | null;
  currency: string;
  transport_preference?: string | null;
  destination: string;
  specifications?: string | null;
  customization?: boolean;
  logo_instructions?: string | null;
  packaging_requested?: boolean;
  desired_deadline?: string | null;
  notes?: string | null;
  status: B2BStatus;
  business_priority?: string;
  qualified_at?: string | null;
  qualified_by?: string | null;
  qualification_notes?: string | null;
  assigned_user_id?: string | null;
  assigned_at?: string | null;
  assigned_by?: string | null;
  production_started_at?: string | null;
  expected_completion_date?: string | null;
  actual_completion_date?: string | null;
  production_notes?: string | null;
  production_stage?: B2BProductionStage;
  order_id?: string | null;
  ai_analysis?: Record<string, any>;
  ai_suggestions?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface B2BRequestSupplierRecord {
  id: string;
  b2b_request_id: string;
  supplier_id: string;
  product_url?: string | null;
  initial_price_cny?: number | null;
  initial_price_xof?: number | null;
  negotiated_price_cny?: number | null;
  negotiated_price_xof?: number | null;
  moq: number;
  lead_time_days?: string | null;
  customization_available?: boolean;
  sample_available?: boolean;
  sample_cost_xof?: number | null;
  incoterm?: string | null;
  internal_notes?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    name: string;
    city?: string;
    platform?: string;
    verification_status?: string;
    rating?: number;
  };
}

export interface B2BEventRecord {
  id: string;
  b2b_request_id: string;
  event_type: string;
  actor_user_id?: string | null;
  actor_role?: string;
  previous_status?: string | null;
  new_status?: string | null;
  title: string;
  description?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}
