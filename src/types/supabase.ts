// Auto-generated Supabase Database Types for Dallou Chine
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_requests: {
        Row: {
          assigned_user_id: string | null
          attachments: string[] | null
          budget_xof: number | null
          code: string
          company_name: string
          contact_name: string
          created_at: string
          currency: string
          customization: boolean | null
          destination: string | null
          email: string
          id: string
          logo_instructions: string | null
          notes: string | null
          packaging_requested: boolean | null
          phone: string
          product_description: string
          quantity: number
          sector: string | null
          status: string
          transport_preference: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_user_id?: string | null
          attachments?: string[] | null
          budget_xof?: number | null
          code: string
          company_name: string
          contact_name: string
          created_at?: string
          currency?: string
          customization?: boolean | null
          destination?: string | null
          email: string
          id?: string
          logo_instructions?: string | null
          notes?: string | null
          packaging_requested?: boolean | null
          phone: string
          product_description: string
          quantity: number
          sector?: string | null
          status?: string
          transport_preference?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_user_id?: string | null
          attachments?: string[] | null
          budget_xof?: number | null
          code?: string
          company_name?: string
          contact_name?: string
          created_at?: string
          currency?: string
          customization?: boolean | null
          destination?: string | null
          email?: string
          id?: string
          logo_instructions?: string | null
          notes?: string | null
          packaging_requested?: boolean | null
          phone?: string
          product_description?: string
          quantity?: number
          sector?: string | null
          status?: string
          transport_preference?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_requests_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      carriers: {
        Row: {
          base_transit_days_max: number
          base_transit_days_min: number
          contact_name: string | null
          created_at: string
          departure_frequency: string | null
          email: string | null
          id: string
          min_charge_xof: number
          mode: string
          name: string
          notes: string | null
          phone: string | null
          rate_per_cbm_xof: number
          rate_per_kg_xof: number
          reliability_score: number | null
          status: string
          updated_at: string
          volumetric_factor: number
        }
        Insert: {
          base_transit_days_max?: number
          base_transit_days_min?: number
          contact_name?: string | null
          created_at?: string
          departure_frequency?: string | null
          email?: string | null
          id?: string
          min_charge_xof?: number
          mode: string
          name: string
          notes?: string | null
          phone?: string | null
          rate_per_cbm_xof?: number
          rate_per_kg_xof?: number
          reliability_score?: number | null
          status?: string
          updated_at?: string
          volumetric_factor?: number
        }
        Update: {
          base_transit_days_max?: number
          base_transit_days_min?: number
          contact_name?: string | null
          created_at?: string
          departure_frequency?: string | null
          email?: string | null
          id?: string
          min_charge_xof?: number
          mode?: string
          name?: string
          notes?: string | null
          phone?: string | null
          rate_per_cbm_xof?: number
          rate_per_kg_xof?: number
          reliability_score?: number | null
          status?: string
          updated_at?: string
          volumetric_factor?: number
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          groupage_id: string | null
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          groupage_id?: string | null
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          groupage_id?: string | null
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_groupage_id_fkey"
            columns: ["groupage_id"]
            isOneToOne: false
            referencedRelation: "groupages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          amount_xof: number | null
          b2b_request_id: string | null
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          order_id: string | null
          quote_id: string | null
          reference: string
          sourcing_request_id: string | null
          status: string
          title: string
          user_id: string | null
          visibility: string
        }
        Insert: {
          amount_xof?: number | null
          b2b_request_id?: string | null
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          order_id?: string | null
          quote_id?: string | null
          reference: string
          sourcing_request_id?: string | null
          status?: string
          title: string
          user_id?: string | null
          visibility?: string
        }
        Update: {
          amount_xof?: number | null
          b2b_request_id?: string | null
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          order_id?: string | null
          quote_id?: string | null
          reference?: string
          sourcing_request_id?: string | null
          status?: string
          title?: string
          user_id?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_b2b_request_id_fkey"
            columns: ["b2b_request_id"]
            isOneToOne: false
            referencedRelation: "b2b_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_sourcing_request_id_fkey"
            columns: ["sourcing_request_id"]
            isOneToOne: false
            referencedRelation: "sourcing_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groupage_participants: {
        Row: {
          created_at: string
          groupage_id: string
          id: string
          quantity: number
          status: string
          total_xof: number
          unit_price_xof: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          groupage_id: string
          id?: string
          quantity: number
          status?: string
          total_xof: number
          unit_price_xof: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          groupage_id?: string
          id?: string
          quantity?: number
          status?: string
          total_xof?: number
          unit_price_xof?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groupage_participants_groupage_id_fkey"
            columns: ["groupage_id"]
            isOneToOne: false
            referencedRelation: "groupages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groupage_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groupages: {
        Row: {
          arrival_country: string | null
          code: string
          created_at: string
          currency: string
          deadline: string
          departure_country: string | null
          description: string | null
          estimated_arrival_date: string | null
          estimated_departure_date: string | null
          guarantee_note: string | null
          id: string
          logistics_route: string | null
          max_order_per_user: number
          min_order_per_user: number
          original_price_xof: number
          participants_count: number
          product_id: string
          reserved_quantity: number
          start_date: string
          status: string
          status_note: string | null
          supplier_moq: number
          target_quantity: number
          title: string
          transport_mode: string
          unit_price_xof: number
          updated_at: string
        }
        Insert: {
          arrival_country?: string | null
          code: string
          created_at?: string
          currency?: string
          deadline: string
          departure_country?: string | null
          description?: string | null
          estimated_arrival_date?: string | null
          estimated_departure_date?: string | null
          guarantee_note?: string | null
          id?: string
          logistics_route?: string | null
          max_order_per_user?: number
          min_order_per_user?: number
          original_price_xof: number
          participants_count?: number
          product_id: string
          reserved_quantity?: number
          start_date?: string
          status?: string
          status_note?: string | null
          supplier_moq: number
          target_quantity: number
          title: string
          transport_mode?: string
          unit_price_xof: number
          updated_at?: string
        }
        Update: {
          arrival_country?: string | null
          code?: string
          created_at?: string
          currency?: string
          deadline?: string
          departure_country?: string | null
          description?: string | null
          estimated_arrival_date?: string | null
          estimated_departure_date?: string | null
          guarantee_note?: string | null
          id?: string
          logistics_route?: string | null
          max_order_per_user?: number
          min_order_per_user?: number
          original_price_xof?: number
          participants_count?: number
          product_id?: string
          reserved_quantity?: number
          start_date?: string
          status?: string
          status_note?: string | null
          supplier_moq?: number
          target_quantity?: number
          title?: string
          transport_mode?: string
          unit_price_xof?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groupages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      hubs: {
        Row: {
          active_parcels_count: number
          address: string
          capacity_limit: number
          city: string
          country: string
          created_at: string
          district: string | null
          id: string
          manager_name: string | null
          manager_phone: string | null
          name: string
          opening_hours: string | null
          status: string
          updated_at: string
        }
        Insert: {
          active_parcels_count?: number
          address: string
          capacity_limit?: number
          city?: string
          country?: string
          created_at?: string
          district?: string | null
          id?: string
          manager_name?: string | null
          manager_phone?: string | null
          name: string
          opening_hours?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          active_parcels_count?: number
          address?: string
          capacity_limit?: number
          city?: string
          country?: string
          created_at?: string
          district?: string | null
          id?: string
          manager_name?: string | null
          manager_phone?: string | null
          name?: string
          opening_hours?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_costs: {
        Row: {
          amount_xof: number
          cost_type: string
          created_at: string
          currency: string
          description: string | null
          id: string
          order_id: string
        }
        Insert: {
          amount_xof: number
          cost_type: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          order_id: string
        }
        Update: {
          amount_xof?: number
          cost_type?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_costs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          groupage_id: string | null
          id: string
          image_url_snapshot: string | null
          order_id: string
          product_id: string | null
          product_name_snapshot: string
          quantity: number
          sku_snapshot: string | null
          subtotal_xof: number
          transport_mode_snapshot: string | null
          unit_price_xof: number
        }
        Insert: {
          created_at?: string
          groupage_id?: string | null
          id?: string
          image_url_snapshot?: string | null
          order_id: string
          product_id?: string | null
          product_name_snapshot: string
          quantity: number
          sku_snapshot?: string | null
          subtotal_xof: number
          transport_mode_snapshot?: string | null
          unit_price_xof: number
        }
        Update: {
          created_at?: string
          groupage_id?: string | null
          id?: string
          image_url_snapshot?: string | null
          order_id?: string
          product_id?: string | null
          product_name_snapshot?: string
          quantity?: number
          sku_snapshot?: string | null
          subtotal_xof?: number
          transport_mode_snapshot?: string | null
          unit_price_xof?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_groupage_id_fkey"
            columns: ["groupage_id"]
            isOneToOne: false
            referencedRelation: "groupages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          actor_id: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          new_status: string
          old_status: string | null
          order_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          new_status: string
          old_status?: string | null
          order_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          new_status?: string
          old_status?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_city: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_address: Json | null
          delivery_type: string
          discount_amount_xof: number
          hub_location_id: string | null
          id: string
          notes: string | null
          order_status: string
          paid_at: string | null
          payment_method: string
          payment_status: string
          shipping_fee_xof: number
          subtotal_xof: number
          total_xof: number
          tracking_code: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_city?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          delivery_address?: Json | null
          delivery_type?: string
          discount_amount_xof?: number
          hub_location_id?: string | null
          id?: string
          notes?: string | null
          order_status?: string
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          shipping_fee_xof?: number
          subtotal_xof: number
          total_xof: number
          tracking_code: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          customer_city?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: Json | null
          delivery_type?: string
          discount_amount_xof?: number
          hub_location_id?: string | null
          id?: string
          notes?: string | null
          order_status?: string
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          shipping_fee_xof?: number
          subtotal_xof?: number
          total_xof?: number
          tracking_code?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_hub_location_id_fkey"
            columns: ["hub_location_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_attempts: {
        Row: {
          amount_xof: number
          attempt_number: number
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          order_id: string
          payment_id: string
          provider_reference: string | null
          status: string
          user_agent: string | null
        }
        Insert: {
          amount_xof: number
          attempt_number?: number
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          order_id: string
          payment_id: string
          provider_reference?: string | null
          status?: string
          user_agent?: string | null
        }
        Update: {
          amount_xof?: number
          attempt_number?: number
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          order_id?: string
          payment_id?: string
          provider_reference?: string | null
          status?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_attempts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_xof: number
          checkout_url: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          error_code: string | null
          error_message: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          order_id: string
          paid_at: string | null
          payment_method: string
          provider: string
          provider_payment_id: string | null
          provider_reference: string | null
          raw_provider_response: Json | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_xof: number
          checkout_url?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          error_code?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          order_id: string
          paid_at?: string | null
          payment_method?: string
          provider?: string
          provider_payment_id?: string | null
          provider_reference?: string | null
          raw_provider_response?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_xof?: number
          checkout_url?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          error_code?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string
          paid_at?: string | null
          payment_method?: string
          provider?: string
          provider_payment_id?: string | null
          provider_reference?: string | null
          raw_provider_response?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_revenues: {
        Row: {
          amount_xof: number
          created_at: string
          currency: string
          description: string | null
          id: string
          order_id: string
          revenue_type: string
        }
        Insert: {
          amount_xof: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          order_id: string
          revenue_type: string
        }
        Update: {
          amount_xof?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          order_id?: string
          revenue_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_revenues_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      product_auto_specs: {
        Row: {
          battery_capacity_kwh: number | null
          brand: string | null
          certification: string | null
          charging_time: string | null
          created_at: string
          dimensions: string | null
          model: string | null
          model_year: number | null
          motor_power_hp: number | null
          motor_power_kw: number | null
          product_id: string
          range_km: number | null
          top_speed_kmh: number | null
          updated_at: string
          vehicle_type: string
          weight_kg: number | null
        }
        Insert: {
          battery_capacity_kwh?: number | null
          brand?: string | null
          certification?: string | null
          charging_time?: string | null
          created_at?: string
          dimensions?: string | null
          model?: string | null
          model_year?: number | null
          motor_power_hp?: number | null
          motor_power_kw?: number | null
          product_id: string
          range_km?: number | null
          top_speed_kmh?: number | null
          updated_at?: string
          vehicle_type: string
          weight_kg?: number | null
        }
        Update: {
          battery_capacity_kwh?: number | null
          brand?: string | null
          certification?: string | null
          charging_time?: string | null
          created_at?: string
          dimensions?: string | null
          model?: string | null
          model_year?: number | null
          motor_power_hp?: number | null
          motor_power_kw?: number | null
          product_id?: string
          range_km?: number | null
          top_speed_kmh?: number | null
          updated_at?: string
          vehicle_type?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_auto_specs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          is_primary: boolean
          product_id: string
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          cbm: number
          compare_at_price_xof: number | null
          created_at: string
          currency: string
          customization_details: Json | null
          default_transport_mode: string
          description: string | null
          estimated_delivery_days: string | null
          features: string[] | null
          height_cm: number
          id: string
          is_active: boolean
          is_auto_mobility: boolean
          is_customizable: boolean
          is_featured: boolean
          is_groupage: boolean
          length_cm: number
          moq: number
          name: string
          price_xof: number
          rating: number | null
          reserved_quantity: number
          reviews_count: number | null
          short_description: string | null
          sku: string | null
          slug: string
          sourcer_id: string | null
          specifications: Json | null
          stock_quantity: number
          supplier_id: string | null
          tags: string[] | null
          updated_at: string
          weight_kg: number
          width_cm: number
        }
        Insert: {
          category_id?: string | null
          cbm?: number
          compare_at_price_xof?: number | null
          created_at?: string
          currency?: string
          customization_details?: Json | null
          default_transport_mode?: string
          description?: string | null
          estimated_delivery_days?: string | null
          features?: string[] | null
          height_cm?: number
          id?: string
          is_active?: boolean
          is_auto_mobility?: boolean
          is_customizable?: boolean
          is_featured?: boolean
          is_groupage?: boolean
          length_cm?: number
          moq?: number
          name: string
          price_xof: number
          rating?: number | null
          reserved_quantity?: number
          reviews_count?: number | null
          short_description?: string | null
          sku?: string | null
          slug: string
          sourcer_id?: string | null
          specifications?: Json | null
          stock_quantity?: number
          supplier_id?: string | null
          tags?: string[] | null
          updated_at?: string
          weight_kg?: number
          width_cm?: number
        }
        Update: {
          category_id?: string | null
          cbm?: number
          compare_at_price_xof?: number | null
          created_at?: string
          currency?: string
          customization_details?: Json | null
          default_transport_mode?: string
          description?: string | null
          estimated_delivery_days?: string | null
          features?: string[] | null
          height_cm?: number
          id?: string
          is_active?: boolean
          is_auto_mobility?: boolean
          is_customizable?: boolean
          is_featured?: boolean
          is_groupage?: boolean
          length_cm?: number
          moq?: number
          name?: string
          price_xof?: number
          rating?: number | null
          reserved_quantity?: number
          reviews_count?: number | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          sourcer_id?: string | null
          specifications?: Json | null
          stock_quantity?: number
          supplier_id?: string | null
          tags?: string[] | null
          updated_at?: string
          weight_kg?: number
          width_cm?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_sourcer_id_fkey"
            columns: ["sourcer_id"]
            isOneToOne: false
            referencedRelation: "sourcers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          created_at: string
          description: string
          id: string
          product_id: string | null
          quantity: number
          quote_id: string
          subtotal_xof: number
          unit_price_xof: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          product_id?: string | null
          quantity: number
          quote_id: string
          subtotal_xof: number
          unit_price_xof: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          product_id?: string | null
          quantity?: number
          quote_id?: string
          subtotal_xof?: number
          unit_price_xof?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          b2b_request_id: string | null
          balance_due_xof: number
          client_name: string
          company_name: string | null
          conditions: string[] | null
          created_at: string
          currency: string
          customs_xof: number
          deposit_amount_xof: number
          deposit_required_percent: number | null
          discount_xof: number
          email: string | null
          fees_xof: number
          id: string
          lead_time_days: string | null
          notes: string | null
          phone: string
          quote_number: string
          shipping_xof: number
          sourcing_request_id: string | null
          status: string
          subtotal_xof: number
          total_xof: number
          transport_mode: string | null
          updated_at: string
          user_id: string | null
          valid_until: string
          version: number
        }
        Insert: {
          b2b_request_id?: string | null
          balance_due_xof?: number
          client_name: string
          company_name?: string | null
          conditions?: string[] | null
          created_at?: string
          currency?: string
          customs_xof?: number
          deposit_amount_xof?: number
          deposit_required_percent?: number | null
          discount_xof?: number
          email?: string | null
          fees_xof?: number
          id?: string
          lead_time_days?: string | null
          notes?: string | null
          phone: string
          quote_number: string
          shipping_xof?: number
          sourcing_request_id?: string | null
          status?: string
          subtotal_xof: number
          total_xof: number
          transport_mode?: string | null
          updated_at?: string
          user_id?: string | null
          valid_until: string
          version?: number
        }
        Update: {
          b2b_request_id?: string | null
          balance_due_xof?: number
          client_name?: string
          company_name?: string | null
          conditions?: string[] | null
          created_at?: string
          currency?: string
          customs_xof?: number
          deposit_amount_xof?: number
          deposit_required_percent?: number | null
          discount_xof?: number
          email?: string | null
          fees_xof?: number
          id?: string
          lead_time_days?: string | null
          notes?: string | null
          phone?: string
          quote_number?: string
          shipping_xof?: number
          sourcing_request_id?: string | null
          status?: string
          subtotal_xof?: number
          total_xof?: number
          transport_mode?: string | null
          updated_at?: string
          user_id?: string | null
          valid_until?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_b2b_request_id_fkey"
            columns: ["b2b_request_id"]
            isOneToOne: false
            referencedRelation: "b2b_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_sourcing_request_id_fkey"
            columns: ["sourcing_request_id"]
            isOneToOne: false
            referencedRelation: "sourcing_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_events: {
        Row: {
          actor_id: string | null
          created_at: string
          description: string
          id: string
          location: string
          shipment_id: string
          status: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          description: string
          id?: string
          location: string
          shipment_id: string
          status: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          description?: string
          id?: string
          location?: string
          shipment_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_orders: {
        Row: {
          order_id: string
          shipment_id: string
        }
        Insert: {
          order_id: string
          shipment_id: string
        }
        Update: {
          order_id?: string
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_orders_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          actual_arrival: string | null
          actual_departure: string | null
          carrier_id: string | null
          container_number: string | null
          created_at: string
          destination: string
          estimated_arrival: string | null
          estimated_departure: string | null
          id: string
          origin: string
          status: string
          tracking_code: string
          transport_mode: string
          updated_at: string
          vessel_or_flight_number: string | null
        }
        Insert: {
          actual_arrival?: string | null
          actual_departure?: string | null
          carrier_id?: string | null
          container_number?: string | null
          created_at?: string
          destination?: string
          estimated_arrival?: string | null
          estimated_departure?: string | null
          id?: string
          origin?: string
          status?: string
          tracking_code: string
          transport_mode?: string
          updated_at?: string
          vessel_or_flight_number?: string | null
        }
        Update: {
          actual_arrival?: string | null
          actual_departure?: string | null
          carrier_id?: string | null
          container_number?: string | null
          created_at?: string
          destination?: string
          estimated_arrival?: string | null
          estimated_departure?: string | null
          id?: string
          origin?: string
          status?: string
          tracking_code?: string
          transport_mode?: string
          updated_at?: string
          vessel_or_flight_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      sourcers: {
        Row: {
          commission_rate_percent: number | null
          created_at: string
          email: string | null
          id: string
          location_city: string | null
          name: string
          phone: string | null
          profile_id: string | null
          rating: number | null
          specialization: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          commission_rate_percent?: number | null
          created_at?: string
          email?: string | null
          id?: string
          location_city?: string | null
          name: string
          phone?: string | null
          profile_id?: string | null
          rating?: number | null
          specialization?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          commission_rate_percent?: number | null
          created_at?: string
          email?: string | null
          id?: string
          location_city?: string | null
          name?: string
          phone?: string | null
          profile_id?: string | null
          rating?: number | null
          specialization?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sourcers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sourcing_messages: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          message: string
          request_id: string
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          message: string
          request_id: string
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          message?: string
          request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sourcing_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "sourcing_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sourcing_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sourcing_requests: {
        Row: {
          additional_images: string[] | null
          alibaba_url: string | null
          assigned_sourcer_id: string | null
          budget_xof: number | null
          category: string | null
          client_company: string | null
          client_email: string | null
          client_name: string
          client_phone: string
          code: string
          created_at: string
          currency: string
          customization: boolean | null
          customization_details: string | null
          description: string
          id: string
          image_url: string | null
          notes: string | null
          product_url: string | null
          quantity: number
          status: string
          title: string
          updated_at: string
          url_1688: string | null
          user_id: string | null
        }
        Insert: {
          additional_images?: string[] | null
          alibaba_url?: string | null
          assigned_sourcer_id?: string | null
          budget_xof?: number | null
          category?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name: string
          client_phone: string
          code: string
          created_at?: string
          currency?: string
          customization?: boolean | null
          customization_details?: string | null
          description: string
          id?: string
          image_url?: string | null
          notes?: string | null
          product_url?: string | null
          quantity: number
          status?: string
          title: string
          updated_at?: string
          url_1688?: string | null
          user_id?: string | null
        }
        Update: {
          additional_images?: string[] | null
          alibaba_url?: string | null
          assigned_sourcer_id?: string | null
          budget_xof?: number | null
          category?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string
          code?: string
          created_at?: string
          currency?: string
          customization?: boolean | null
          customization_details?: string | null
          description?: string
          id?: string
          image_url?: string | null
          notes?: string | null
          product_url?: string | null
          quantity?: number
          status?: string
          title?: string
          updated_at?: string
          url_1688?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sourcing_requests_assigned_sourcer_id_fkey"
            columns: ["assigned_sourcer_id"]
            isOneToOne: false
            referencedRelation: "sourcers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sourcing_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          contact_name: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          platform: string | null
          rating: number | null
          status: string
          supplier_url: string | null
          updated_at: string
          wechat: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          platform?: string | null
          rating?: number | null
          status?: string
          supplier_url?: string | null
          updated_at?: string
          wechat?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          platform?: string | null
          rating?: number | null
          status?: string
          supplier_url?: string | null
          updated_at?: string
          wechat?: string | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          event_id: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          processing_error: string | null
          provider: string
          signature_valid: boolean
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          event_type: string
          id?: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          provider?: string
          signature_valid?: boolean
        }
        Update: {
          created_at?: string
          event_id?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          provider?: string
          signature_valid?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
