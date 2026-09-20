// server/app.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// server/api/shipmentsRouter.ts
import { Router } from "express";

// server/middleware/auth.ts
import { createClient } from "@supabase/supabase-js";

// server/config.ts
var config = {
  geniusPayApiKey: process.env.GENIUSPAY_API_KEY || "pk_sandbox_sample_key_sinosenegal",
  geniusPayApiSecret: process.env.GENIUSPAY_API_SECRET || "sk_sandbox_sample_secret_sinosenegal",
  geniusPayWebhookSecret: process.env.GENIUSPAY_WEBHOOK_SECRET || "whsec_sample_geniuspay_secret_sinosenegal",
  geniusPayBaseUrl: (process.env.GENIUSPAY_BASE_URL || "https://geniuspay.ci/api/v1/merchant").replace(/\/+$/, ""),
  geniusPayEnvironment: process.env.GENIUSPAY_ENVIRONMENT || "sandbox",
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "",
  appUrl: process.env.APP_URL || "http://localhost:3000",
  port: parseInt(process.env.PORT || "3000", 10)
};

// server/middleware/auth.ts
var serverSupabase = null;
function getSupabaseServerClient() {
  if (!serverSupabase) {
    const url = config.supabaseUrl || "https://splsjtguapquznbiacad.supabase.co";
    const key = config.supabaseServiceRoleKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbHNqdGd1YXBxdXpuYmlhY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NzYwNjYsImV4cCI6MjEwNTM1MjA2Nn0.yr8irdxSNMFI-N3K7ueOZV72uKQSVQykDpX9ioY1C4A";
    serverSupabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  return serverSupabase;
}
async function extractUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  if (!token) {
    return null;
  }
  const supabase = getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return null;
  }
  const url = config.supabaseUrl || "https://splsjtguapquznbiacad.supabase.co";
  const key = config.supabaseServiceRoleKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbHNqdGd1YXBxdXpuYmlhY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NzYwNjYsImV4cCI6MjEwNTM1MjA2Nn0.yr8irdxSNMFI-N3K7ueOZV72uKQSVQykDpX9ioY1C4A";
  const tokenClient = createClient(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  const { data: profile } = await tokenClient.from("profiles").select("role, full_name, phone, status").eq("id", user.id).single();
  const userRole = (profile?.role || "client").toLowerCase();
  const adminRoles = ["admin", "super_admin", "operations", "sourcing", "commercial", "finance"];
  return {
    id: user.id,
    email: user.email,
    phone: profile?.phone || user.phone || user.user_metadata?.phone,
    fullName: profile?.full_name || user.user_metadata?.full_name,
    role: userRole,
    isAdmin: adminRoles.includes(userRole)
  };
}
async function requireAuth(req, res, next) {
  try {
    const user = await extractUserFromToken(req);
    if (!user) {
      res.status(401).json({
        success: false,
        error: "Acc\xE8s non autoris\xE9: Session invalide ou expir\xE9e.",
        code: "UNAUTHORIZED"
      });
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("[AuthMiddleware] Error during authentication:", err);
    res.status(500).json({
      success: false,
      error: "Erreur interne lors de la v\xE9rification de s\xE9curit\xE9."
    });
  }
}
async function optionalAuth(req, _res, next) {
  try {
    const user = await extractUserFromToken(req);
    if (user) {
      req.user = user;
    }
    next();
  } catch (err) {
    console.warn("[AuthMiddleware] Optional auth warning:", err.message);
    next();
  }
}
async function requireAdmin(req, res, next) {
  try {
    const user = await extractUserFromToken(req);
    if (!user) {
      res.status(401).json({
        success: false,
        error: "Acc\xE8s non autoris\xE9: Veuillez vous connecter avec un compte administrateur.",
        code: "UNAUTHORIZED"
      });
      return;
    }
    if (!user.isAdmin) {
      res.status(403).json({
        success: false,
        error: "Acc\xE8s interdit: Droits d'administration insuffisants.",
        code: "FORBIDDEN"
      });
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("[AuthMiddleware] Error checking admin role:", err);
    res.status(500).json({
      success: false,
      error: "Erreur interne lors de la v\xE9rification des permissions."
    });
  }
}

// server/services/ShipmentService.ts
import { createClient as createClient2 } from "@supabase/supabase-js";
var ShipmentService = class {
  getClient(token) {
    if (token) {
      const url = config.supabaseUrl || "https://splsjtguapquznbiacad.supabase.co";
      const key = config.supabaseServiceRoleKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbHNqdGd1YXBxdXpuYmlhY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NzYwNjYsImV4cCI6MjEwNTM1MjA2Nn0.yr8irdxSNMFI-N3K7ueOZV72uKQSVQykDpX9ioY1C4A";
      return createClient2(url, key, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false }
      });
    }
    return getSupabaseServerClient();
  }
  /**
   * Création d'une expédition pour une commande payée (Admin & Operations uniquement)
   */
  async createShipment(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("create_shipment_for_order", {
      p_order_id: params.orderId,
      p_carrier_id: params.carrierId || null,
      p_hub_id: params.hubId || null,
      p_origin: params.origin || "Chine (Yiwu/Guangzhou)",
      p_destination: params.destination || "S\xE9n\xE9gal (Dakar)",
      p_notes: params.notes || null
    });
    if (error || !data?.success) {
      console.warn("[ShipmentService] Cr\xE9ation exp\xE9dition rejet\xE9e:", error || data);
      return {
        success: false,
        errorCode: data?.errorCode || "SHIPMENT_CREATION_FAILED",
        errorMessage: data?.errorMessage || error?.message || "Impossible de cr\xE9er l'exp\xE9dition."
      };
    }
    return {
      success: true,
      shipment: data
    };
  }
  /**
   * Transition d'état atomique d'une expédition via State Machine (Admin & Operations uniquement)
   */
  async updateStatus(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("update_shipment_status", {
      p_shipment_id: params.shipmentId,
      p_new_status: params.newStatus,
      p_location: params.location || null,
      p_description: params.description || null,
      p_metadata: params.metadata || {}
    });
    if (error || !data?.success) {
      console.warn("[ShipmentService] Transition statut rejet\xE9e:", error || data);
      const errMsg = error?.message || data?.errorMessage || "";
      let code = data?.errorCode || "STATUS_UPDATE_FAILED";
      if (errMsg.includes("TERMINAL_STATE")) code = "TERMINAL_STATE";
      else if (errMsg.includes("INVALID_TRANSITION")) code = "INVALID_TRANSITION";
      else if (errMsg.includes("SHIPMENT_NOT_FOUND")) code = "SHIPMENT_NOT_FOUND";
      else if (errMsg.includes("PERMISSION_DENIED")) code = "PERMISSION_DENIED";
      return {
        success: false,
        errorCode: code,
        errorMessage: errMsg || "Transition de statut non autoris\xE9e."
      };
    }
    return {
      success: true,
      result: data
    };
  }
  /**
   * Récupération publique du suivi logistique d'une expédition (zéro fuite de coût)
   */
  async getPublicTracking(trackingCode) {
    const serverClient = getSupabaseServerClient();
    const { data, error } = await serverClient.rpc("get_public_shipment_tracking", {
      p_tracking_code: trackingCode
    });
    if (error || !data?.found) {
      return { found: false };
    }
    return {
      found: true,
      data
    };
  }
  /**
   * Récupération d'une expédition détaillée (sécurisée par RLS ou rôle)
   */
  async getShipmentById(shipmentId, token, user) {
    const client = this.getClient(token);
    const { data: shipment, error: sErr } = await client.from("shipments").select(`
        *,
        carrier:carriers(id, name, mode, base_transit_days_min, base_transit_days_max, departure_frequency, status),
        hub:hubs(id, name, city, district, address, opening_hours, manager_name, manager_phone, status),
        order:orders(id, tracking_code, total_xof, order_status, payment_status, customer_name, customer_email, customer_phone, user_id)
      `).eq("id", shipmentId).single();
    if (sErr || !shipment) {
      return { success: false, error: "Exp\xE9dition introuvable ou acc\xE8s non autoris\xE9." };
    }
    const { data: events } = await client.from("shipment_events").select("*").eq("shipment_id", shipmentId).order("created_at", { ascending: true });
    let docQuery = client.from("documents").select("id, reference, title, document_type, file_path, file_name, mime_type, file_size, visibility, created_at").eq("shipment_id", shipmentId);
    if (!user?.isAdmin) {
      docQuery = docQuery.neq("visibility", "internal");
    }
    const { data: documents } = await docQuery;
    return {
      success: true,
      shipment,
      events: events || [],
      documents: documents || []
    };
  }
  /**
   * Liste des expéditions (avec filtres statut, transporteur, hub, recherche)
   */
  async listShipments(filters, token, user) {
    const client = this.getClient(token);
    let query = client.from("shipments").select(`
        *,
        carrier:carriers(id, name, mode),
        hub:hubs(id, name, city),
        order:orders(id, tracking_code, customer_name, user_id)
      `, { count: "exact" });
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.carrierId) {
      query = query.eq("carrier_id", filters.carrierId);
    }
    if (filters.hubId) {
      query = query.eq("hub_id", filters.hubId);
    }
    if (filters.orderId) {
      query = query.eq("order_id", filters.orderId);
    }
    if (filters.search) {
      query = query.ilike("tracking_code", `%${filters.search.trim()}%`);
    }
    query = query.order("created_at", { ascending: false });
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }
    const { data, error, count } = await query;
    if (error) {
      console.error("[ShipmentService] Erreur liste exp\xE9ditions:", error);
      return { success: false, shipments: [], total: 0 };
    }
    return {
      success: true,
      shipments: data || [],
      total: count || 0
    };
  }
  /**
   * Ajout d'un événement opérationnel manuel (ex: inspection, retard météo)
   */
  async addEvent(params) {
    const client = this.getClient(params.token);
    const { data: shipment, error: sErr } = await client.from("shipments").select("id, status").eq("id", params.shipmentId).single();
    if (sErr || !shipment) {
      return { success: false, error: "Exp\xE9dition introuvable." };
    }
    const currentStatus = params.status || shipment.status;
    const { data: event, error: eErr } = await client.from("shipment_events").insert({
      shipment_id: params.shipmentId,
      status: currentStatus,
      event_type: params.eventType,
      previous_status: shipment.status,
      new_status: currentStatus,
      location: params.location,
      description: params.description,
      metadata: params.metadata || {}
    }).select().single();
    if (eErr) {
      return { success: false, error: eErr.message };
    }
    return { success: true, event };
  }
};

// server/api/shipmentsRouter.ts
var shipmentsRouter = Router();
var shipmentService = new ShipmentService();
shipmentsRouter.get("/tracking/:trackingCode", async (req, res) => {
  try {
    const { trackingCode } = req.params;
    if (!trackingCode || !trackingCode.trim()) {
      res.status(400).json({
        success: false,
        error: "Le num\xE9ro de suivi est obligatoire."
      });
      return;
    }
    const result = await shipmentService.getPublicTracking(trackingCode.trim());
    if (!result.found) {
      res.status(404).json({
        success: false,
        error: "Aucune exp\xE9dition trouv\xE9e pour ce num\xE9ro de suivi."
      });
      return;
    }
    res.json({
      success: true,
      data: result.data
    });
  } catch (err) {
    console.error("[shipmentsRouter] Erreur tracking:", err);
    res.status(500).json({
      success: false,
      error: "Erreur interne lors de la consultation du suivi."
    });
  }
});
shipmentsRouter.post("/", requireAdmin, async (req, res) => {
  try {
    const { orderId, carrierId, hubId, origin, destination, notes } = req.body;
    const token = req.headers.authorization?.substring(7);
    if (!orderId) {
      res.status(400).json({
        success: false,
        error: "L'identifiant de commande (orderId) est obligatoire."
      });
      return;
    }
    const result = await shipmentService.createShipment({
      orderId,
      carrierId,
      hubId,
      origin,
      destination,
      notes,
      token
    });
    if (!result.success) {
      res.status(result.errorCode === "ORDER_NOT_FOUND" ? 404 : 400).json({
        success: false,
        errorCode: result.errorCode,
        error: result.errorMessage
      });
      return;
    }
    res.status(201).json({
      success: true,
      shipment: result.shipment
    });
  } catch (err) {
    console.error("[shipmentsRouter] Erreur cr\xE9ation exp\xE9dition:", err);
    res.status(500).json({
      success: false,
      error: "Erreur serveur lors de la cr\xE9ation de l'exp\xE9dition."
    });
  }
});
shipmentsRouter.get("/", requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    const user = req.user;
    const { status, carrierId, hubId, orderId, search, limit, offset } = req.query;
    const result = await shipmentService.listShipments({
      status,
      carrierId,
      hubId,
      orderId,
      search,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    }, token, user);
    res.json(result);
  } catch (err) {
    console.error("[shipmentsRouter] Erreur liste exp\xE9ditions:", err);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la r\xE9cup\xE9ration des exp\xE9ditions."
    });
  }
});
shipmentsRouter.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.substring(7);
    const user = req.user;
    const result = await shipmentService.getShipmentById(id, token, user);
    if (!result.success) {
      res.status(404).json({
        success: false,
        error: result.error || "Exp\xE9dition introuvable."
      });
      return;
    }
    res.json({
      success: true,
      shipment: result.shipment,
      events: result.events,
      documents: result.documents
    });
  } catch (err) {
    console.error("[shipmentsRouter] Erreur d\xE9tails exp\xE9dition:", err);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la r\xE9cup\xE9ration de l'exp\xE9dition."
    });
  }
});
shipmentsRouter.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location, description, metadata } = req.body;
    const token = req.headers.authorization?.substring(7);
    if (!status) {
      res.status(400).json({
        success: false,
        error: "Le statut cible est obligatoire."
      });
      return;
    }
    const result = await shipmentService.updateStatus({
      shipmentId: id,
      newStatus: status,
      location,
      description,
      metadata,
      token
    });
    if (!result.success) {
      const isNotFound = result.errorCode === "SHIPMENT_NOT_FOUND";
      const isTerminal = result.errorCode === "TERMINAL_STATE";
      const isInvalid = result.errorCode === "INVALID_TRANSITION";
      res.status(isNotFound ? 404 : isTerminal ? 409 : isInvalid ? 422 : 400).json({
        success: false,
        errorCode: result.errorCode,
        error: result.errorMessage
      });
      return;
    }
    res.json({
      success: true,
      result: result.result
    });
  } catch (err) {
    console.error("[shipmentsRouter] Erreur mise \xE0 jour statut:", err);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise \xE0 jour du statut."
    });
  }
});
shipmentsRouter.post("/:id/events", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { eventType, status, location, description, metadata } = req.body;
    const token = req.headers.authorization?.substring(7);
    if (!eventType || !location || !description) {
      res.status(400).json({
        success: false,
        error: "eventType, location et description sont obligatoires."
      });
      return;
    }
    const result = await shipmentService.addEvent({
      shipmentId: id,
      eventType,
      status,
      location,
      description,
      metadata,
      token
    });
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error
      });
      return;
    }
    res.status(201).json({
      success: true,
      event: result.event
    });
  } catch (err) {
    console.error("[shipmentsRouter] Erreur ajout \xE9v\xE9nement:", err);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'ajout de l'\xE9v\xE9nement."
    });
  }
});

// server/api/sourcingRouter.ts
import { Router as Router2 } from "express";

// server/services/SourcingService.ts
import { createClient as createClient3 } from "@supabase/supabase-js";
var SourcingService = class {
  getClient(token) {
    if (token) {
      const url = config.supabaseUrl || "https://splsjtguapquznbiacad.supabase.co";
      const key = config.supabaseServiceRoleKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbHNqdGd1YXBxdXpuYmlhY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NzYwNjYsImV4cCI6MjEwNTM1MjA2Nn0.yr8irdxSNMFI-N3K7ueOZV72uKQSVQykDpX9ioY1C4A";
      return createClient3(url, key, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false }
      });
    }
    return getSupabaseServerClient();
  }
  /**
   * Création d'une demande de sourcing
   */
  async createRequest(params) {
    if (!params.title || params.title.trim().length === 0) {
      return { success: false, errorCode: "INVALID_TITLE", errorMessage: "Le titre du produit est obligatoire." };
    }
    if (!params.quantity || params.quantity <= 0) {
      return { success: false, errorCode: "INVALID_QUANTITY", errorMessage: "La quantit\xE9 doit \xEAtre sup\xE9rieure \xE0 0." };
    }
    if (params.productUrl && params.productUrl.trim().length > 0) {
      try {
        const parsed = new URL(params.productUrl.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return { success: false, errorCode: "INVALID_URL", errorMessage: "Le lien produit doit d\xE9buter par http:// ou https://." };
        }
      } catch {
        return { success: false, errorCode: "INVALID_URL", errorMessage: "Format d'URL produit invalide." };
      }
    }
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("create_sourcing_request", {
      p_title: params.title.trim(),
      p_description: params.description || "",
      p_product_url: params.productUrl?.trim() || null,
      p_image_url: params.imageUrl || null,
      p_additional_images: params.additionalImages || [],
      p_category: params.category || "G\xE9n\xE9ral",
      p_quantity: params.quantity,
      p_budget_xof: params.budgetXof || null,
      p_currency: params.currency || "XOF",
      p_customization: params.customization || false,
      p_customization_details: params.customizationDetails || null,
      p_specifications: params.specifications || null,
      p_desired_deadline: params.desiredDeadline || null,
      p_destination: params.destination || "Dakar, S\xE9n\xE9gal",
      p_attachments: params.attachments || [],
      p_client_name: params.clientName || "",
      p_client_phone: params.clientPhone || "",
      p_client_email: params.clientEmail || null,
      p_client_company: params.clientCompany || null,
      p_user_id: params.userId || null
    });
    if (error || !data?.success) {
      console.warn("[SourcingService] Erreur cr\xE9ation demande:", error || data);
      return {
        success: false,
        errorCode: "CREATION_FAILED",
        errorMessage: error?.message || data?.errorMessage || "Erreur lors de la cr\xE9ation de la demande."
      };
    }
    return {
      success: true,
      request: data
    };
  }
  /**
   * Récupération des demandes (filtrées selon le rôle)
   */
  async getRequests(params) {
    const client = this.getClient(params.token);
    let query = client.from("sourcing_requests").select(`
        *,
        assigned_sourcer:sourcers!sourcing_requests_assigned_sourcer_id_fkey(id, name, location_city),
        quotes:quotes(id, quote_number, version, total_xof, status, valid_until)
      `).order("created_at", { ascending: false });
    if (!params.isAdmin) {
      if (!params.userId) {
        return { success: true, requests: [] };
      }
      query = query.eq("user_id", params.userId);
    }
    const { data, error } = await query;
    if (error) {
      console.error("[SourcingService] Erreur r\xE9cup\xE9ration demandes:", error);
      return { success: false, requests: [] };
    }
    return {
      success: true,
      requests: data || []
    };
  }
  /**
   * Détail complet d'une demande de sourcing
   */
  async getRequestDetails(params) {
    const client = this.getClient(params.token);
    const { data: req, error: reqErr } = await client.from("sourcing_requests").select(`
        *,
        assigned_sourcer:sourcers!sourcing_requests_assigned_sourcer_id_fkey(id, name, location_city, phone, email)
      `).eq("id", params.requestId).single();
    if (reqErr || !req) {
      return { success: false, errorCode: "NOT_FOUND", errorMessage: "Demande de sourcing introuvable." };
    }
    if (!params.isAdmin && req.user_id !== params.userId) {
      return { success: false, errorCode: "FORBIDDEN", errorMessage: "Acc\xE8s interdit \xE0 cette demande." };
    }
    let eventsQuery = client.from("sourcing_events").select("*").eq("sourcing_request_id", params.requestId).order("created_at", { ascending: true });
    if (!params.isAdmin) {
      eventsQuery = eventsQuery.or("metadata->>visibility.is.null,metadata->>visibility.neq.internal");
    }
    const { data: events } = await eventsQuery;
    let quotesQuery = client.from("quotes").select(`
        *,
        items:quote_items(*)
      `).eq("sourcing_request_id", params.requestId).order("version", { ascending: false });
    if (!params.isAdmin) {
      quotesQuery = quotesQuery.neq("status", "draft");
    }
    const { data: quotes } = await quotesQuery;
    let suppliers = [];
    if (params.isAdmin) {
      const { data: sups } = await client.from("sourcing_request_suppliers").select(`
          *,
          supplier:suppliers(*)
        `).eq("sourcing_request_id", params.requestId);
      suppliers = sups || [];
    }
    return {
      success: true,
      request: req,
      events: events || [],
      quotes: quotes || [],
      suppliers
    };
  }
  /**
   * Transition de statut d'une demande
   */
  async updateStatus(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("update_sourcing_status", {
      p_request_id: params.requestId,
      p_new_status: params.newStatus,
      p_notes: params.notes || null,
      p_actor_id: params.actorId || null,
      p_actor_role: params.actorRole || "admin"
    });
    if (error || !data?.success) {
      const msg = error?.message || data?.errorMessage || "";
      let code = "STATUS_UPDATE_FAILED";
      if (msg.includes("TERMINAL_STATE")) code = "TERMINAL_STATE";
      else if (msg.includes("INVALID_TRANSITION")) code = "INVALID_TRANSITION";
      else if (msg.includes("REQUEST_NOT_FOUND")) code = "REQUEST_NOT_FOUND";
      return {
        success: false,
        errorCode: code,
        errorMessage: msg || "Transition de statut refus\xE9e."
      };
    }
    return {
      success: true,
      result: data
    };
  }
  /**
   * Assignation d'un sourceur à une demande
   */
  async assignSourcer(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("assign_sourcing_request", {
      p_request_id: params.requestId,
      p_sourcer_id: params.sourcerId,
      p_assigned_by: params.assignedBy || null
    });
    if (error || !data?.success) {
      return {
        success: false,
        errorCode: "ASSIGNMENT_FAILED",
        errorMessage: error?.message || "Erreur lors de l'assignation du sourceur."
      };
    }
    return {
      success: true,
      result: data
    };
  }
  /**
   * Enregistrement d'un fournisseur pour une demande
   */
  async addSupplier(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("add_supplier_to_request", {
      p_sourcing_request_id: params.requestId,
      p_supplier_id: params.supplierId,
      p_product_url: params.productUrl || null,
      p_initial_price_cny: params.initialPriceCny || null,
      p_initial_price_xof: params.initialPriceXof || null,
      p_negotiated_price_cny: params.negotiatedPriceCny || null,
      p_negotiated_price_xof: params.negotiatedPriceXof || null,
      p_moq: params.moq || 1,
      p_lead_time_days: params.leadTimeDays || "10-15 jours",
      p_customization_available: params.customizationAvailable || false,
      p_sample_available: params.sampleAvailable || false,
      p_sample_cost_xof: params.sampleCostXof || 0,
      p_internal_notes: params.internalNotes || null,
      p_actor_id: params.actorId || null
    });
    if (error || !data?.success) {
      return {
        success: false,
        errorCode: "ADD_SUPPLIER_FAILED",
        errorMessage: error?.message || "Erreur lors de l'enregistrement du fournisseur."
      };
    }
    return {
      success: true,
      result: data
    };
  }
  /**
   * Création d'un devis client avec recalcul serveur
   */
  async createQuote(params) {
    if (!params.items || params.items.length === 0) {
      return { success: false, errorCode: "ITEMS_REQUIRED", errorMessage: "Au moins un article de devis est requis." };
    }
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("create_sourcing_quote", {
      p_sourcing_request_id: params.sourcingRequestId,
      p_items: params.items,
      p_shipping_xof: params.shippingXof || 0,
      p_customs_xof: params.customsXof || 0,
      p_fees_xof: params.feesXof || 0,
      p_discount_xof: params.discountXof || 0,
      p_deposit_required_percent: params.depositRequiredPercent || 50,
      p_valid_days: params.validDays || 15,
      p_transport_mode: params.transportMode || "air",
      p_lead_time_days: params.leadTimeDays || "15-20 jours",
      p_conditions: params.conditions || [],
      p_notes: params.notes || null,
      p_supplier_id: params.supplierId || null,
      p_sourcer_id: params.sourcerId || null,
      p_created_by: params.createdBy || null
    });
    if (error || !data?.success) {
      return {
        success: false,
        errorCode: "QUOTE_CREATION_FAILED",
        errorMessage: error?.message || "Erreur lors de la cr\xE9ation du devis."
      };
    }
    return {
      success: true,
      quote: data
    };
  }
  /**
   * Envoi du devis au client (status draft -> sent)
   */
  async sendQuote(params) {
    const client = this.getClient(params.token);
    const { data: quote, error: qErr } = await client.from("quotes").select("*, sourcing_requests(id, code, user_id)").eq("id", params.quoteId).single();
    if (qErr || !quote) {
      return { success: false, errorCode: "QUOTE_NOT_FOUND", errorMessage: "Devis introuvable." };
    }
    const { error: updErr } = await client.from("quotes").update({ status: "sent", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", params.quoteId);
    if (updErr) {
      return { success: false, errorCode: "UPDATE_FAILED", errorMessage: updErr.message };
    }
    if (quote.sourcing_request_id) {
      await client.from("sourcing_requests").update({ status: "quote_sent", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", quote.sourcing_request_id);
      await client.from("sourcing_events").insert({
        sourcing_request_id: quote.sourcing_request_id,
        event_type: "quote_sent",
        actor_user_id: params.actorId || null,
        actor_role: "admin",
        title: "Devis officiel transmis au client",
        description: `Le devis ${quote.quote_number} de ${quote.total_xof} XOF a \xE9t\xE9 \xE9mis au client.`,
        metadata: { quote_id: params.quoteId, version: quote.version }
      });
      if (quote.user_id) {
        await client.from("notifications").insert({
          user_id: quote.user_id,
          title: "Devis de sourcing disponible !",
          message: `Le devis officiel pour votre dossier ${quote.quote_number} est pr\xEAt. Montant total : ${quote.total_xof} XOF.`,
          type: "sourcing_quote_sent",
          is_read: false,
          data: {
            quote_id: params.quoteId,
            quote_number: quote.quote_number,
            sourcing_request_id: quote.sourcing_request_id
          }
        });
      }
    }
    return {
      success: true,
      quote: { ...quote, status: "sent" }
    };
  }
  /**
   * Acceptation d'un devis par le client
   */
  async acceptQuote(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("accept_sourcing_quote", {
      p_quote_id: params.quoteId,
      p_user_id: params.userId
    });
    if (error || !data?.success) {
      const code = data?.code || (error?.message?.includes("PERMISSION_DENIED") ? "PERMISSION_DENIED" : "ACCEPT_FAILED");
      return {
        success: false,
        errorCode: code,
        errorMessage: data?.error || error?.message || "Impossible d'accepter ce devis."
      };
    }
    return {
      success: true,
      result: data
    };
  }
  /**
   * Refus d'un devis par le client
   */
  async rejectQuote(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("reject_sourcing_quote", {
      p_quote_id: params.quoteId,
      p_user_id: params.userId,
      p_reason: params.reason || null
    });
    if (error || !data?.success) {
      return {
        success: false,
        errorCode: data?.code || "REJECT_FAILED",
        errorMessage: data?.error || error?.message || "Erreur lors du refus du devis."
      };
    }
    return {
      success: true,
      result: data
    };
  }
  /**
   * Consultation d'un devis spécifique
   */
  async getQuote(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.from("quotes").select("*, items:quote_items(*)").eq("id", params.quoteId).single();
    if (error || !data) {
      return { success: false, errorCode: "NOT_FOUND", errorMessage: "Devis introuvable." };
    }
    if (!params.isAdmin && data.user_id !== params.userId) {
      return { success: false, errorCode: "FORBIDDEN", errorMessage: "Acc\xE8s interdit \xE0 ce devis." };
    }
    return {
      success: true,
      quote: data
    };
  }
};

// server/api/sourcingRouter.ts
var sourcingRouter = Router2();
var sourcingService = new SourcingService();
sourcingRouter.post("/requests", optionalAuth, async (req, res) => {
  try {
    const {
      title,
      productName,
      description,
      productDescription,
      productUrl,
      productLink,
      imageUrl,
      additionalImages,
      category,
      quantity,
      budgetXof,
      targetBudget,
      currency,
      customization,
      customizationDetails,
      specifications,
      desiredDeadline,
      destination,
      attachments,
      clientName,
      clientPhone,
      clientEmail,
      clientCompany
    } = req.body;
    const finalTitle = title || productName;
    const finalDescription = description || productDescription;
    const finalUrl = productUrl || productLink;
    const finalBudget = budgetXof !== void 0 ? budgetXof : targetBudget;
    const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.substring(7) : void 0;
    const result = await sourcingService.createRequest({
      title: finalTitle,
      description: finalDescription,
      productUrl: finalUrl,
      imageUrl,
      additionalImages,
      category,
      quantity: Number(quantity) || 1,
      budgetXof: finalBudget ? Number(finalBudget) : void 0,
      currency: currency || "XOF",
      customization: Boolean(customization),
      customizationDetails,
      specifications,
      desiredDeadline,
      destination,
      attachments,
      clientName,
      clientPhone,
      clientEmail,
      clientCompany,
      userId: req.user?.id,
      token
    });
    if (!result.success) {
      const status = result.errorCode === "INVALID_URL" || result.errorCode === "INVALID_TITLE" || result.errorCode === "INVALID_QUANTITY" ? 400 : 422;
      res.status(status).json(result);
      return;
    }
    res.status(201).json(result);
  } catch (err) {
    console.error("[sourcingRouter] Erreur cr\xE9ation demande:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
sourcingRouter.get("/requests", requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.getRequests({
      userId: req.user?.id,
      isAdmin: req.user?.isAdmin || false,
      token
    });
    res.json(result);
  } catch (err) {
    console.error("[sourcingRouter] Erreur liste demandes:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
sourcingRouter.get("/requests/:id", requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.getRequestDetails({
      requestId: req.params.id,
      userId: req.user?.id,
      isAdmin: req.user?.isAdmin || false,
      token
    });
    if (!result.success) {
      const status = result.errorCode === "NOT_FOUND" ? 404 : result.errorCode === "FORBIDDEN" ? 403 : 400;
      res.status(status).json(result);
      return;
    }
    res.json(result);
  } catch (err) {
    console.error("[sourcingRouter] Erreur d\xE9tail demande:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
sourcingRouter.patch("/requests/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!status) {
      res.status(400).json({ success: false, error: "Le champ status est requis." });
      return;
    }
    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.updateStatus({
      requestId: req.params.id,
      newStatus: status,
      notes,
      actorId: req.user?.id,
      actorRole: req.user?.role || "admin",
      token
    });
    if (!result.success) {
      let code = 400;
      if (result.errorCode === "TERMINAL_STATE") code = 409;
      else if (result.errorCode === "INVALID_TRANSITION") code = 422;
      else if (result.errorCode === "REQUEST_NOT_FOUND") code = 404;
      res.status(code).json(result);
      return;
    }
    res.json(result);
  } catch (err) {
    console.error("[sourcingRouter] Erreur transition statut:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
sourcingRouter.post("/requests/:id/assign", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { sourcerId } = req.body;
    if (!sourcerId) {
      res.status(400).json({ success: false, error: "Le champ sourcerId est requis." });
      return;
    }
    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.assignSourcer({
      requestId: req.params.id,
      sourcerId,
      assignedBy: req.user?.id,
      token
    });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json({ ...result, ...result.result });
  } catch (err) {
    console.error("[sourcingRouter] Erreur assignation sourceur:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
sourcingRouter.post("/requests/:id/suppliers", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      supplierId,
      productUrl,
      initialPriceCny,
      initialPriceXof,
      negotiatedPriceCny,
      negotiatedPriceXof,
      moq,
      leadTimeDays,
      customizationAvailable,
      sampleAvailable,
      sampleCostXof,
      internalNotes
    } = req.body;
    if (!supplierId) {
      res.status(400).json({ success: false, error: "Le champ supplierId est requis." });
      return;
    }
    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.addSupplier({
      requestId: req.params.id,
      supplierId,
      productUrl,
      initialPriceCny,
      initialPriceXof,
      negotiatedPriceCny,
      negotiatedPriceXof,
      moq,
      leadTimeDays,
      customizationAvailable,
      sampleAvailable,
      sampleCostXof,
      internalNotes,
      actorId: req.user?.id,
      token
    });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.status(201).json({ ...result, ...result.result });
  } catch (err) {
    console.error("[sourcingRouter] Erreur ajout fournisseur:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
sourcingRouter.get("/requests/:id/suppliers", requireAuth, requireAdmin, async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    const client = getSupabaseServerClient();
    const { data, error } = await client.from("sourcing_request_suppliers").select("*, supplier:suppliers(*)").eq("sourcing_request_id", req.params.id);
    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }
    res.json({ success: true, suppliers: data || [] });
  } catch (err) {
    console.error("[sourcingRouter] Erreur r\xE9cup\xE9ration fournisseurs:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
sourcingRouter.post("/requests/:id/quotes", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      items,
      shippingXof,
      customsXof,
      feesXof,
      discountXof,
      depositRequiredPercent,
      validDays,
      transportMode,
      leadTimeDays,
      conditions,
      notes,
      supplierId,
      sourcerId
    } = req.body;
    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.createQuote({
      sourcingRequestId: req.params.id,
      items,
      shippingXof: Number(shippingXof) || 0,
      customsXof: Number(customsXof) || 0,
      feesXof: Number(feesXof) || 0,
      discountXof: Number(discountXof) || 0,
      depositRequiredPercent: depositRequiredPercent !== void 0 ? Number(depositRequiredPercent) : 50,
      validDays: Number(validDays) || 15,
      transportMode,
      leadTimeDays,
      conditions,
      notes,
      supplierId,
      sourcerId,
      createdBy: req.user?.id,
      token
    });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.status(201).json(result);
  } catch (err) {
    console.error("[sourcingRouter] Erreur cr\xE9ation devis:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
sourcingRouter.post("/quotes/:id/send", requireAuth, requireAdmin, async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.sendQuote({
      quoteId: req.params.id,
      actorId: req.user?.id,
      token
    });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (err) {
    console.error("[sourcingRouter] Erreur envoi devis:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
sourcingRouter.get("/quotes/:id", requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.getQuote({
      quoteId: req.params.id,
      userId: req.user?.id,
      isAdmin: req.user?.isAdmin || false,
      token
    });
    if (!result.success) {
      const status = result.errorCode === "NOT_FOUND" ? 404 : result.errorCode === "FORBIDDEN" ? 403 : 400;
      res.status(status).json(result);
      return;
    }
    res.json(result);
  } catch (err) {
    console.error("[sourcingRouter] Erreur consultation devis:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
sourcingRouter.post("/quotes/:id/accept", requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.acceptQuote({
      quoteId: req.params.id,
      userId: req.user.id,
      token
    });
    if (!result.success) {
      let status = 400;
      if (result.errorCode === "PERMISSION_DENIED") status = 403;
      else if (result.errorCode === "QUOTE_EXPIRED" || result.errorCode === "INVALID_QUOTE_STATUS") status = 422;
      res.status(status).json(result);
      return;
    }
    res.json({ ...result, ...result.result });
  } catch (err) {
    console.error("[sourcingRouter] Erreur acceptation devis:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
sourcingRouter.post("/quotes/:id/reject", requireAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const token = req.headers.authorization?.substring(7);
    const result = await sourcingService.rejectQuote({
      quoteId: req.params.id,
      userId: req.user.id,
      reason,
      token
    });
    if (!result.success) {
      const status = result.errorCode === "PERMISSION_DENIED" ? 403 : 400;
      res.status(status).json(result);
      return;
    }
    res.json({ ...result, ...result.result });
  } catch (err) {
    console.error("[sourcingRouter] Erreur refus devis:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
sourcingRouter.post("/upload", requireAuth, async (req, res) => {
  try {
    const { fileName, fileType, fileSize, fileBase64, bucket } = req.body;
    if (!fileName || !fileType || !fileBase64) {
      res.status(400).json({ success: false, error: "fileName, fileType et fileBase64 sont requis." });
      return;
    }
    const MAX_SIZE = 10 * 1024 * 1024;
    if (fileSize && Number(fileSize) > MAX_SIZE) {
      res.status(400).json({ success: false, error: "Fichier trop volumineux. La limite maximale est de 10 Mo." });
      return;
    }
    const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp"];
    const ALLOWED_DOCS = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    const ALL_ALLOWED = [...ALLOWED_IMAGES, ...ALLOWED_DOCS];
    if (!ALL_ALLOWED.includes(fileType.toLowerCase())) {
      res.status(400).json({
        success: false,
        error: `Type de fichier non autoris\xE9 (${fileType}). Formats autoris\xE9s : JPG, PNG, WEBP, PDF, DOC, XLS.`
      });
      return;
    }
    const targetBucket = bucket === "sourcing-attachments" ? "sourcing-attachments" : "sourcing-images";
    const client = getSupabaseServerClient();
    const buffer = Buffer.from(fileBase64, "base64");
    if (buffer.length > MAX_SIZE) {
      res.status(400).json({ success: false, error: "Taille du fichier d\xE9cod\xE9 sup\xE9rieure \xE0 10 Mo." });
      return;
    }
    const fileExt = fileName.split(".").pop() || "bin";
    const filePath = `${req.user?.id || "anon"}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const { data: uploadData, error: uploadErr } = await client.storage.from(targetBucket).upload(filePath, buffer, {
      contentType: fileType,
      upsert: true
    });
    if (uploadErr) {
      console.error("[sourcingRouter] Erreur upload Supabase:", uploadErr);
      res.status(500).json({ success: false, error: uploadErr.message });
      return;
    }
    let fileUrl = "";
    if (targetBucket === "sourcing-images") {
      const { data: publicData } = client.storage.from(targetBucket).getPublicUrl(filePath);
      fileUrl = publicData.publicUrl;
    } else {
      const { data: signedData } = await client.storage.from(targetBucket).createSignedUrl(filePath, 86400);
      fileUrl = signedData?.signedUrl || filePath;
    }
    res.json({
      success: true,
      path: filePath,
      url: fileUrl,
      bucket: targetBucket,
      fileName,
      mimeType: fileType,
      size: buffer.length
    });
  } catch (err) {
    console.error("[sourcingRouter] Erreur upload:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});

// server/api/b2bRouter.ts
import { Router as Router3 } from "express";

// server/services/B2BService.ts
import { createClient as createClient4 } from "@supabase/supabase-js";
var B2BService = class {
  getClient(token) {
    const url = config.supabaseUrl || process.env.VITE_SUPABASE_URL || "";
    const anonKey = config.supabaseServiceRoleKey || process.env.VITE_SUPABASE_ANON_KEY || "";
    if (token) {
      return createClient4(url, anonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    }
    return createClient4(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }
  // ==========================================
  // 1. GESTION DES ENTREPRISES & CONTACTS
  // ==========================================
  async createCompany(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.from("companies").insert({
      user_id: params.userId || null,
      legal_name: params.legalName,
      trade_name: params.tradeName || null,
      registration_number: params.registrationNumber || null,
      sector: params.sector || null,
      country: params.country || "S\xE9n\xE9gal",
      city: params.city || "Dakar",
      address: params.address || null,
      website: params.website || null,
      phone: params.phone || null,
      email: params.email || null,
      notes: params.notes || null
    }).select().single();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, company: data };
  }
  async getCompanies(params) {
    const client = this.getClient(params.token);
    let query = client.from("companies").select("*");
    if (!params.isAdmin && params.userId) {
      query = query.eq("user_id", params.userId);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, companies: data || [] };
  }
  async addCompanyContact(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.from("company_contacts").insert({
      company_id: params.companyId,
      user_id: params.userId || null,
      first_name: params.firstName,
      last_name: params.lastName,
      role: params.role || null,
      email: params.email || null,
      phone: params.phone,
      whatsapp: params.whatsapp || null,
      preferred_contact_method: params.preferredContactMethod || "whatsapp",
      is_primary: params.isPrimary || false
    }).select().single();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, contact: data };
  }
  async getCompanyContacts(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.from("company_contacts").select("*").eq("company_id", params.companyId).order("is_primary", { ascending: false });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, contacts: data || [] };
  }
  // ==========================================
  // 2. DEMANDES B2B
  // ==========================================
  async createB2BRequest(params) {
    const client = this.getClient(params.token);
    if (params.productLink && !/^https?:\/\//i.test(params.productLink.trim())) {
      return {
        success: false,
        errorCode: "INVALID_URL",
        errorMessage: "Le lien produit doit commencer par http:// ou https://"
      };
    }
    const { data, error } = await client.rpc("create_b2b_request", {
      p_user_id: params.userId || null,
      p_company_id: params.companyId || null,
      p_contact_id: params.contactId || null,
      p_company_name: params.companyName || null,
      p_contact_name: params.contactName || null,
      p_phone: params.phone || null,
      p_email: params.email || null,
      p_sector: params.sector || null,
      p_product_name: params.productName || null,
      p_product_description: params.productDescription || null,
      p_product_link: params.productLink || null,
      p_product_images: params.productImages || [],
      p_attachments: params.attachments || [],
      p_quantity: params.quantity || 1,
      p_budget_xof: params.budgetXof || null,
      p_currency: params.currency || "XOF",
      p_transport_preference: params.transportPreference || "recommended",
      p_destination: params.destination || "Dakar, S\xE9n\xE9gal",
      p_specifications: params.specifications || null,
      p_customization: params.customization || false,
      p_logo_instructions: params.logoInstructions || null,
      p_packaging_requested: params.packagingRequested || false,
      p_desired_deadline: params.desiredDeadline || null,
      p_notes: params.notes || null
    });
    if (error || !data?.success) {
      return {
        success: false,
        errorCode: "CREATION_FAILED",
        errorMessage: error?.message || "Erreur lors de la cr\xE9ation de la demande B2B."
      };
    }
    return {
      success: true,
      request: data
    };
  }
  async getRequests(params) {
    const client = this.getClient(params.token);
    let query = client.from("b2b_requests").select(`
        *,
        company:companies(id, legal_name, trade_name, registration_number, phone, email),
        contact:company_contacts(id, first_name, last_name, role, phone, email, whatsapp),
        assigned_to:profiles!b2b_requests_assigned_user_id_fkey(id, full_name, email, role),
        quotes:quotes(id, quote_number, version, status, total_xof, deposit_amount_xof, balance_due_xof, valid_until, created_at)
      `);
    if (!params.isAdmin && params.userId) {
      query = query.eq("user_id", params.userId);
    }
    if (params.status && params.status !== "all") {
      query = query.eq("status", params.status);
    }
    if (params.search) {
      query = query.or(`code.ilike.%${params.search}%,company_name.ilike.%${params.search}%,contact_name.ilike.%${params.search}%,product_name.ilike.%${params.search}%`);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      return { success: false, error: error.message };
    }
    const sanitized = data?.map((req) => {
      if (!params.isAdmin) {
        return this.sanitizeRequestForClient(req);
      }
      return req;
    });
    return { success: true, requests: sanitized || [] };
  }
  async getRequestDetails(params) {
    const client = this.getClient(params.token);
    const { data: request, error: reqErr } = await client.from("b2b_requests").select(`
        *,
        company:companies(*),
        contact:company_contacts(*),
        assigned_to:profiles!b2b_requests_assigned_user_id_fkey(id, full_name, email, role)
      `).eq("id", params.requestId).single();
    if (reqErr || !request) {
      return {
        success: false,
        errorCode: "NOT_FOUND",
        errorMessage: "Demande B2B introuvable."
      };
    }
    if (!params.isAdmin && request.user_id !== params.userId) {
      return {
        success: false,
        errorCode: "FORBIDDEN",
        errorMessage: "Acc\xE8s non autoris\xE9 \xE0 cette demande."
      };
    }
    const { data: quotes } = await client.from("quotes").select("*, items:quote_items(*)").eq("b2b_request_id", params.requestId).order("version", { ascending: false });
    const { data: events } = await client.from("b2b_events").select("*").eq("b2b_request_id", params.requestId).order("created_at", { ascending: false });
    let suppliers = [];
    if (params.isAdmin) {
      const { data: sups } = await client.from("b2b_request_suppliers").select("*, supplier:suppliers(*)").eq("b2b_request_id", params.requestId);
      suppliers = sups || [];
    }
    const sanitizedQuotes = (quotes || []).map((q) => {
      return params.isAdmin ? q : this.sanitizeQuoteForClient(q);
    });
    return {
      success: true,
      request: params.isAdmin ? request : this.sanitizeRequestForClient(request),
      quotes: sanitizedQuotes,
      suppliers: params.isAdmin ? suppliers : [],
      events: events || []
    };
  }
  // ==========================================
  // 3. QUALIFICATION & ASSIGNATION
  // ==========================================
  async qualifyRequest(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("qualify_b2b_request", {
      p_request_id: params.requestId,
      p_qualified_by: params.qualifiedBy,
      p_qualification_notes: params.notes || null,
      p_business_priority: params.priority || "standard"
    });
    if (error || !data?.success) {
      return {
        success: false,
        errorCode: "QUALIFY_FAILED",
        errorMessage: error?.message || "\xC9chec de la qualification."
      };
    }
    return { success: true, result: data };
  }
  async assignRequest(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("assign_b2b_request", {
      p_request_id: params.requestId,
      p_assigned_user_id: params.assignedUserId,
      p_assigned_by: params.assignedBy || null
    });
    if (error || !data?.success) {
      return {
        success: false,
        errorCode: "ASSIGNMENT_FAILED",
        errorMessage: error?.message || "\xC9chec de l'assignation."
      };
    }
    return { success: true, result: data };
  }
  // ==========================================
  // 4. FOURNISSEURS & NÉGOCIATION
  // ==========================================
  async addSupplier(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("add_supplier_to_b2b_request", {
      p_b2b_request_id: params.requestId,
      p_supplier_id: params.supplierId,
      p_product_url: params.productUrl || null,
      p_initial_price_cny: params.initialPriceCny || null,
      p_initial_price_xof: params.initialPriceXof || null,
      p_negotiated_price_cny: params.negotiatedPriceCny || null,
      p_negotiated_price_xof: params.negotiatedPriceXof || null,
      p_moq: params.moq || 1,
      p_lead_time_days: params.leadTimeDays || "10-15 jours",
      p_customization_available: params.customizationAvailable || false,
      p_sample_available: params.sampleAvailable || false,
      p_sample_cost_xof: params.sampleCostXof || 0,
      p_incoterm: params.incoterm || "FOB",
      p_internal_notes: params.internalNotes || null,
      p_actor_id: params.actorId || null
    });
    if (error || !data?.success) {
      return {
        success: false,
        errorCode: "ADD_SUPPLIER_FAILED",
        errorMessage: error?.message || "Erreur lors de l'enregistrement du fournisseur."
      };
    }
    return { success: true, result: data };
  }
  // ==========================================
  // 5. DEVIS B2B (Création, Envoi, Acceptation, Refus)
  // ==========================================
  async createQuote(params) {
    const client = this.getClient(params.token);
    if (!params.items || !Array.isArray(params.items) || params.items.length === 0) {
      return {
        success: false,
        errorCode: "INVALID_ITEMS",
        errorMessage: "Le devis doit comporter au moins une ligne d'article valide."
      };
    }
    const { data, error } = await client.rpc("create_b2b_quote", {
      p_b2b_request_id: params.b2bRequestId,
      p_items: params.items,
      p_shipping_xof: params.shippingXof || 0,
      p_customs_xof: params.customsXof || 0,
      p_fees_xof: params.feesXof || 0,
      p_discount_xof: params.discountXof || 0,
      p_deposit_required_percent: params.depositRequiredPercent !== void 0 ? params.depositRequiredPercent : 50,
      p_valid_days: params.validDays || 15,
      p_transport_mode: params.transportMode || "air",
      p_lead_time_days: params.leadTimeDays || "15-20 jours",
      p_conditions: params.conditions || [],
      p_notes: params.notes || null,
      p_supplier_id: params.supplierId || null,
      p_sourcer_id: params.sourcerId || null,
      p_created_by: params.createdBy || null
    });
    if (error || !data?.success) {
      return {
        success: false,
        errorCode: "CREATE_QUOTE_FAILED",
        errorMessage: error?.message || "Erreur lors du calcul et de la cr\xE9ation du devis."
      };
    }
    return {
      success: true,
      quote: data
    };
  }
  async sendQuote(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("send_b2b_quote", {
      p_quote_id: params.quoteId,
      p_actor_id: params.actorId || null
    });
    if (error || !data?.success) {
      return {
        success: false,
        errorCode: "SEND_FAILED",
        errorMessage: error?.message || "Erreur lors de l'envoi du devis."
      };
    }
    return { success: true };
  }
  async acceptQuote(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("accept_b2b_quote", {
      p_quote_id: params.quoteId,
      p_user_id: params.userId
    });
    if (error || !data?.success) {
      const code = data?.code || (error?.message?.includes("PERMISSION_DENIED") ? "PERMISSION_DENIED" : "ACCEPT_FAILED");
      return {
        success: false,
        errorCode: code,
        errorMessage: data?.error || error?.message || "Impossible d'accepter ce devis."
      };
    }
    return {
      success: true,
      result: data
    };
  }
  async rejectQuote(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("reject_b2b_quote", {
      p_quote_id: params.quoteId,
      p_user_id: params.userId,
      p_reason: params.reason || null
    });
    if (error || !data?.success) {
      return {
        success: false,
        errorCode: data?.code || "REJECT_FAILED",
        errorMessage: data?.error || error?.message || "Erreur lors du refus du devis."
      };
    }
    return {
      success: true,
      result: data
    };
  }
  // ==========================================
  // 6. STATUT & TRANSITIONS
  // ==========================================
  async updateStatus(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("update_b2b_status", {
      p_request_id: params.requestId,
      p_new_status: params.newStatus,
      p_actor_id: params.actorId || null,
      p_notes: params.notes || null
    });
    if (error || !data?.success) {
      return {
        success: false,
        errorCode: "TRANSITION_FAILED",
        errorMessage: error?.message || "Transition de statut invalide."
      };
    }
    return {
      success: true,
      result: data
    };
  }
  // ==========================================
  // 7. PRODUCTION & EXPÉDITION
  // ==========================================
  async startProduction(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("start_b2b_production", {
      p_request_id: params.requestId,
      p_expected_completion_date: params.expectedCompletionDate || null,
      p_notes: params.notes || null,
      p_actor_id: params.actorId || null
    });
    if (error || !data?.success) {
      return {
        success: false,
        errorCode: "PRODUCTION_START_FAILED",
        errorMessage: error?.message || "Impossible de lancer la production."
      };
    }
    return { success: true, result: data };
  }
  async updateProductionStage(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("update_b2b_production_stage", {
      p_request_id: params.requestId,
      p_stage: params.stage,
      p_notes: params.notes || null,
      p_actor_id: params.actorId || null
    });
    if (error || !data?.success) {
      return {
        success: false,
        errorCode: "PRODUCTION_STAGE_FAILED",
        errorMessage: error?.message || "Impossible de mettre \xE0 jour le jalon de production."
      };
    }
    return { success: true, result: data };
  }
  async transitionToShipment(params) {
    const client = this.getClient(params.token);
    const { data, error } = await client.rpc("transition_b2b_to_shipment", {
      p_request_id: params.requestId,
      p_carrier_id: params.carrierId,
      p_transport_mode: params.transportMode || "sea",
      p_hub_id: params.hubId || null,
      p_actor_id: params.actorId || null
    });
    if (error || !data?.success) {
      return {
        success: false,
        errorCode: "SHIPMENT_CREATION_FAILED",
        errorMessage: error?.message || "Erreur lors de la cr\xE9ation de l'exp\xE9dition B2B."
      };
    }
    return { success: true, result: data };
  }
  // ==========================================
  // SANITISATION (Étanchéité financière)
  // ==========================================
  sanitizeRequestForClient(request) {
    if (!request) return request;
    const {
      internal_notes,
      ...safe
    } = request;
    return safe;
  }
  sanitizeQuoteForClient(quote) {
    if (!quote) return quote;
    const {
      supplier_id,
      sourcer_id,
      internal_margin_xof,
      internal_margin_percent,
      cost_price_cny,
      ...safe
    } = quote;
    return safe;
  }
};

// server/api/b2bRouter.ts
var b2bRouter = Router3();
var b2bService = new B2BService();
b2bRouter.post("/companies", requireAuth, async (req, res) => {
  try {
    const {
      legalName,
      tradeName,
      registrationNumber,
      sector,
      country,
      city,
      address,
      website,
      phone,
      email,
      notes
    } = req.body;
    if (!legalName || !legalName.trim()) {
      res.status(400).json({ success: false, error: "La raison sociale est requise." });
      return;
    }
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.createCompany({
      userId: req.user?.id,
      legalName: legalName.trim(),
      tradeName: tradeName?.trim(),
      registrationNumber: registrationNumber?.trim(),
      sector: sector?.trim(),
      country: country?.trim() || "S\xE9n\xE9gal",
      city: city?.trim() || "Dakar",
      address: address?.trim(),
      website: website?.trim(),
      phone: phone?.trim(),
      email: email?.trim(),
      notes: notes?.trim(),
      token
    });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.status(201).json(result);
  } catch (err) {
    console.error("[b2bRouter] Erreur cr\xE9ation entreprise:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.get("/companies", requireAuth, async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.getCompanies({
      userId: req.user?.id,
      isAdmin: req.user?.isAdmin || false,
      token
    });
    res.json(result);
  } catch (err) {
    console.error("[b2bRouter] Erreur liste entreprises:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.post("/companies/:id/contacts", requireAuth, async (req, res) => {
  try {
    const companyId = req.params.id;
    const {
      firstName,
      lastName,
      role,
      email,
      phone,
      whatsapp,
      preferredContactMethod,
      isPrimary
    } = req.body;
    if (!firstName || !lastName || !phone) {
      res.status(400).json({
        success: false,
        error: "Le pr\xE9nom, le nom et le num\xE9ro de t\xE9l\xE9phone sont requis."
      });
      return;
    }
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.addCompanyContact({
      companyId,
      userId: req.user?.id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: role?.trim(),
      email: email?.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp?.trim(),
      preferredContactMethod: preferredContactMethod || "whatsapp",
      isPrimary: Boolean(isPrimary),
      token
    });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.status(201).json(result);
  } catch (err) {
    console.error("[b2bRouter] Erreur ajout contact entreprise:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.get("/companies/:id/contacts", requireAuth, async (req, res) => {
  try {
    const companyId = req.params.id;
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.getCompanyContacts({ companyId, token });
    res.json(result);
  } catch (err) {
    console.error("[b2bRouter] Erreur liste contacts entreprise:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.post("/requests", optionalAuth, async (req, res) => {
  try {
    const {
      companyId,
      contactId,
      companyName,
      contactName,
      phone,
      email,
      sector,
      productName,
      productDescription,
      productLink,
      productImages,
      attachments,
      quantity,
      budgetXof,
      currency,
      transportPreference,
      destination,
      specifications,
      customization,
      logoInstructions,
      packagingRequested,
      desiredDeadline,
      notes
    } = req.body;
    if (!productName && !productDescription) {
      res.status(400).json({
        success: false,
        errorCode: "INVALID_PRODUCT",
        error: "Le nom ou la description du produit est requis."
      });
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      res.status(400).json({
        success: false,
        errorCode: "INVALID_QUANTITY",
        error: "La quantit\xE9 demand\xE9e doit \xEAtre sup\xE9rieure \xE0 0."
      });
      return;
    }
    const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.substring(7) : void 0;
    const result = await b2bService.createB2BRequest({
      userId: req.user?.id,
      companyId,
      contactId,
      companyName: companyName?.trim(),
      contactName: contactName?.trim(),
      phone: phone?.trim(),
      email: email?.trim(),
      sector: sector?.trim(),
      productName: productName?.trim(),
      productDescription: productDescription?.trim(),
      productLink: productLink?.trim(),
      productImages,
      attachments,
      quantity: Number(quantity),
      budgetXof: budgetXof ? Number(budgetXof) : void 0,
      currency: currency || "XOF",
      transportPreference: transportPreference || "recommended",
      destination: destination?.trim() || "Dakar, S\xE9n\xE9gal",
      specifications: specifications?.trim(),
      customization: Boolean(customization),
      logoInstructions: logoInstructions?.trim(),
      packagingRequested: Boolean(packagingRequested),
      desiredDeadline,
      notes: notes?.trim(),
      token
    });
    if (!result.success) {
      const status = result.errorCode === "INVALID_URL" ? 400 : 422;
      res.status(status).json(result);
      return;
    }
    res.status(201).json({ ...result, ...result.request });
  } catch (err) {
    console.error("[b2bRouter] Erreur cr\xE9ation demande B2B:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.get("/requests", requireAuth, async (req, res) => {
  try {
    const { status, search } = req.query;
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.getRequests({
      userId: req.user?.id,
      isAdmin: req.user?.isAdmin || false,
      status: typeof status === "string" ? status : void 0,
      search: typeof search === "string" ? search : void 0,
      token
    });
    res.json(result);
  } catch (err) {
    console.error("[b2bRouter] Erreur liste demandes B2B:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.get("/requests/:id", requireAuth, async (req, res) => {
  try {
    const requestId = req.params.id;
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.getRequestDetails({
      requestId,
      userId: req.user?.id,
      isAdmin: req.user?.isAdmin || false,
      token
    });
    if (!result.success) {
      const status = result.errorCode === "NOT_FOUND" ? 404 : result.errorCode === "FORBIDDEN" ? 403 : 400;
      res.status(status).json(result);
      return;
    }
    res.json(result);
  } catch (err) {
    console.error("[b2bRouter] Erreur d\xE9tails demande B2B:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.post("/requests/:id/qualify", requireAdmin, async (req, res) => {
  try {
    const requestId = req.params.id;
    const { notes, priority } = req.body;
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.qualifyRequest({
      requestId,
      qualifiedBy: req.user.id,
      notes,
      priority,
      token
    });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json({ ...result, ...result.result });
  } catch (err) {
    console.error("[b2bRouter] Erreur qualification demande B2B:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.post("/requests/:id/assign", requireAdmin, async (req, res) => {
  try {
    const requestId = req.params.id;
    const { assignedUserId } = req.body;
    if (!assignedUserId) {
      res.status(400).json({ success: false, error: "assignedUserId est requis." });
      return;
    }
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.assignRequest({
      requestId,
      assignedUserId,
      assignedBy: req.user.id,
      token
    });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json({ ...result, ...result.result });
  } catch (err) {
    console.error("[b2bRouter] Erreur assignation demande B2B:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.post("/requests/:id/suppliers", requireAdmin, async (req, res) => {
  try {
    const requestId = req.params.id;
    const {
      supplierId,
      productUrl,
      initialPriceCny,
      initialPriceXof,
      negotiatedPriceCny,
      negotiatedPriceXof,
      moq,
      leadTimeDays,
      customizationAvailable,
      sampleAvailable,
      sampleCostXof,
      incoterm,
      internalNotes
    } = req.body;
    if (!supplierId) {
      res.status(400).json({ success: false, error: "supplierId est requis." });
      return;
    }
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.addSupplier({
      requestId,
      supplierId,
      productUrl,
      initialPriceCny: initialPriceCny !== void 0 ? Number(initialPriceCny) : void 0,
      initialPriceXof: initialPriceXof !== void 0 ? Number(initialPriceXof) : void 0,
      negotiatedPriceCny: negotiatedPriceCny !== void 0 ? Number(negotiatedPriceCny) : void 0,
      negotiatedPriceXof: negotiatedPriceXof !== void 0 ? Number(negotiatedPriceXof) : void 0,
      moq: moq !== void 0 ? Number(moq) : 1,
      leadTimeDays,
      customizationAvailable: Boolean(customizationAvailable),
      sampleAvailable: Boolean(sampleAvailable),
      sampleCostXof: sampleCostXof !== void 0 ? Number(sampleCostXof) : 0,
      incoterm,
      internalNotes,
      actorId: req.user.id,
      token
    });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.status(201).json({ ...result, ...result.result });
  } catch (err) {
    console.error("[b2bRouter] Erreur ajout fournisseur B2B:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.post("/requests/:id/quotes", requireAdmin, async (req, res) => {
  try {
    const b2bRequestId = req.params.id;
    const {
      items,
      shippingXof,
      customsXof,
      feesXof,
      discountXof,
      depositRequiredPercent,
      validDays,
      transportMode,
      leadTimeDays,
      conditions,
      notes,
      supplierId,
      sourcerId
    } = req.body;
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.createQuote({
      b2bRequestId,
      items,
      shippingXof: shippingXof !== void 0 ? Number(shippingXof) : 0,
      customsXof: customsXof !== void 0 ? Number(customsXof) : 0,
      feesXof: feesXof !== void 0 ? Number(feesXof) : 0,
      discountXof: discountXof !== void 0 ? Number(discountXof) : 0,
      depositRequiredPercent: depositRequiredPercent !== void 0 ? Number(depositRequiredPercent) : 50,
      validDays: validDays !== void 0 ? Number(validDays) : 15,
      transportMode,
      leadTimeDays,
      conditions,
      notes,
      supplierId,
      sourcerId,
      createdBy: req.user.id,
      token
    });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.status(201).json({
      ...result,
      ...result.quote,
      id: result.quote?.id || result.quote?.quote_id
    });
  } catch (err) {
    console.error("[b2bRouter] Erreur cr\xE9ation devis B2B:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.post("/quotes/:id/send", requireAdmin, async (req, res) => {
  try {
    const quoteId = req.params.id;
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.sendQuote({
      quoteId,
      actorId: req.user.id,
      token
    });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (err) {
    console.error("[b2bRouter] Erreur envoi devis B2B:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.post("/quotes/:id/accept", requireAuth, async (req, res) => {
  try {
    const quoteId = req.params.id;
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.acceptQuote({
      quoteId,
      userId: req.user.id,
      token
    });
    if (!result.success) {
      const status = result.errorCode === "PERMISSION_DENIED" ? 403 : 400;
      res.status(status).json(result);
      return;
    }
    res.json({ ...result, ...result.result });
  } catch (err) {
    console.error("[b2bRouter] Erreur acceptation devis B2B:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.post("/quotes/:id/reject", requireAuth, async (req, res) => {
  try {
    const quoteId = req.params.id;
    const { reason } = req.body;
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.rejectQuote({
      quoteId,
      userId: req.user.id,
      reason,
      token
    });
    if (!result.success) {
      const status = result.errorCode === "PERMISSION_DENIED" ? 403 : 400;
      res.status(status).json(result);
      return;
    }
    res.json({ ...result, ...result.result });
  } catch (err) {
    console.error("[b2bRouter] Erreur refus devis B2B:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.post("/requests/:id/status", requireAdmin, async (req, res) => {
  try {
    const requestId = req.params.id;
    const { status, notes } = req.body;
    if (!status) {
      res.status(400).json({ success: false, error: "status est requis." });
      return;
    }
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.updateStatus({
      requestId,
      newStatus: status,
      actorId: req.user.id,
      notes,
      token
    });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json({ ...result, ...result.result });
  } catch (err) {
    console.error("[b2bRouter] Erreur mise \xE0 jour statut B2B:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.post("/requests/:id/production/start", requireAdmin, async (req, res) => {
  try {
    const requestId = req.params.id;
    const { expectedCompletionDate, notes } = req.body;
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.startProduction({
      requestId,
      expectedCompletionDate,
      notes,
      actorId: req.user.id,
      token
    });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json({
      ...result,
      ...result.result,
      production_stage: result.result?.production_stage || "in_production",
      stage: result.result?.stage || result.result?.production_stage || "in_production"
    });
  } catch (err) {
    console.error("[b2bRouter] Erreur lancement production B2B:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.post("/requests/:id/production/stage", requireAdmin, async (req, res) => {
  try {
    const requestId = req.params.id;
    const { stage, notes } = req.body;
    const ALLOWED_STAGES = [
      "in_production",
      "production_started",
      "sample_ready",
      "sample_approved",
      "qc_inspection",
      "ready_to_ship",
      "production_completed",
      "completed"
    ];
    if (!stage || !ALLOWED_STAGES.includes(stage)) {
      res.status(400).json({
        success: false,
        errorCode: "INVALID_STAGE",
        errorMessage: `Jalon de production invalide : ${stage || "vide"}. Valeurs accept\xE9es: ${ALLOWED_STAGES.join(", ")}`
      });
      return;
    }
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.updateProductionStage({
      requestId,
      stage,
      notes,
      actorId: req.user.id,
      token
    });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json({
      ...result,
      ...result.result,
      stage: result.result?.stage || result.result?.production_stage || stage,
      production_stage: result.result?.production_stage || stage
    });
  } catch (err) {
    console.error("[b2bRouter] Erreur mise \xE0 jour \xE9tape production B2B:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.post("/requests/:id/ship", requireAdmin, async (req, res) => {
  try {
    const requestId = req.params.id;
    const { carrierId, transportMode, hubId } = req.body;
    if (!carrierId) {
      res.status(400).json({ success: false, error: "carrierId est requis pour cr\xE9er l'exp\xE9dition." });
      return;
    }
    const token = req.headers.authorization?.substring(7);
    const result = await b2bService.transitionToShipment({
      requestId,
      carrierId,
      transportMode: transportMode || "sea",
      hubId,
      actorId: req.user.id,
      token
    });
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json({ ...result, ...result.result });
  } catch (err) {
    console.error("[b2bRouter] Erreur transition vers exp\xE9dition B2B:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});
b2bRouter.post("/upload", requireAuth, async (req, res) => {
  try {
    const { fileName, fileType, fileSize, fileBase64, bucket } = req.body;
    if (!fileName || !fileType || !fileBase64) {
      res.status(400).json({ success: false, error: "fileName, fileType et fileBase64 sont requis." });
      return;
    }
    const MAX_SIZE = 10 * 1024 * 1024;
    if (fileSize && Number(fileSize) > MAX_SIZE) {
      res.status(400).json({ success: false, error: "Fichier trop volumineux (max 10 Mo)." });
      return;
    }
    const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp"];
    const ALLOWED_DOCS = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    const ALL_ALLOWED = [...ALLOWED_IMAGES, ...ALLOWED_DOCS];
    if (!ALL_ALLOWED.includes(fileType.toLowerCase())) {
      res.status(400).json({
        success: false,
        error: `Format de fichier (${fileType}) non autoris\xE9. Formats accept\xE9s : JPG, PNG, WEBP, PDF, DOC, XLS.`
      });
      return;
    }
    const targetBucket = bucket === "b2b-attachments" ? "b2b-attachments" : "b2b-images";
    const client = getSupabaseServerClient();
    const buffer = Buffer.from(fileBase64, "base64");
    if (buffer.length > MAX_SIZE) {
      res.status(400).json({ success: false, error: "Taille du fichier sup\xE9rieure \xE0 10 Mo." });
      return;
    }
    const fileExt = fileName.split(".").pop() || "bin";
    const filePath = `${req.user?.id || "anon"}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const { error: uploadErr } = await client.storage.from(targetBucket).upload(filePath, buffer, {
      contentType: fileType,
      upsert: true
    });
    if (uploadErr) {
      console.error("[b2bRouter] Erreur upload Supabase:", uploadErr);
      res.status(500).json({ success: false, error: uploadErr.message });
      return;
    }
    let fileUrl = "";
    if (targetBucket === "b2b-images") {
      const { data: publicData } = client.storage.from(targetBucket).getPublicUrl(filePath);
      fileUrl = publicData.publicUrl;
    } else {
      const { data: signedData } = await client.storage.from(targetBucket).createSignedUrl(filePath, 86400);
      fileUrl = signedData?.signedUrl || filePath;
    }
    res.json({
      success: true,
      path: filePath,
      url: fileUrl,
      bucket: targetBucket,
      fileName,
      mimeType: fileType,
      size: buffer.length
    });
  } catch (err) {
    console.error("[b2bRouter] Erreur upload B2B:", err);
    res.status(500).json({ success: false, error: err.message || "Erreur serveur." });
  }
});

// server/api/paymentsRouter.ts
import { Router as Router4 } from "express";
import crypto2 from "crypto";

// server/providers/GeniusPayProvider.ts
import crypto from "crypto";
var GeniusPayProvider = class {
  constructor(customConfig) {
    this.name = "geniuspay";
    this.apiKey = customConfig?.apiKey || config.geniusPayApiKey;
    this.apiSecret = customConfig?.apiSecret || config.geniusPayApiSecret;
    this.webhookSecret = customConfig?.webhookSecret || config.geniusPayWebhookSecret;
    this.baseUrl = (customConfig?.baseUrl || config.geniusPayBaseUrl).replace(/\/+$/, "");
    this.environment = customConfig?.environment || config.geniusPayEnvironment;
  }
  /**
   * En-têtes HTTP requis par l'API GeniusPay
   * X-API-Key : Clé publique (pk_sandbox_... ou pk_live_...)
   * X-API-Secret : Clé secrète (sk_sandbox_... ou sk_live_...)
   */
  getHeaders() {
    return {
      "X-API-Key": this.apiKey,
      "X-API-Secret": this.apiSecret,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
  }
  /**
   * 1. POST /payments - Initier un paiement
   * Documentation : Crée une transaction et retourne checkout_url (mode Hosted Checkout)
   * ou payment_url (mode direct si payment_method est spécifié).
   */
  async createPaymentSession(params) {
    const endpoint = `${this.baseUrl}/payments`;
    const payload = {
      amount: Math.round(params.amount),
      currency: params.currency || "XOF",
      description: params.description || `Commande ${params.orderCode} - Dallou Chine`,
      customer: {
        name: params.customer.name || "Client Dallou Chine",
        email: params.customer.email || "client@dallouchine.sn",
        phone: params.customer.phone || ""
      },
      success_url: params.returnUrl,
      error_url: params.cancelUrl,
      metadata: {
        order_id: params.orderId,
        order_code: params.orderCode,
        merchant_reference: params.merchantReference,
        user_id: params.userId || null,
        platform: "dallou_chine",
        ...params.metadata || {}
      }
    };
    if (params.paymentMethod && ["wave", "orange_money", "mtn_money", "card", "paystack"].includes(params.paymentMethod)) {
      payload.payment_method = params.paymentMethod;
    }
    console.log("[GeniusPayProvider] Initiating payment request to GeniusPay:", {
      endpoint,
      amount: payload.amount,
      currency: payload.currency,
      paymentMethod: payload.payment_method || "hosted_checkout",
      orderId: params.orderId,
      merchantReference: params.merchantReference
    });
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const json = await response.json();
        const data = json.data || json;
        const checkoutUrl = data.checkout_url || data.payment_url || json.checkout_url || json.payment_url;
        const providerTransactionId = String(data.id || json.id || `gp_tx_${Date.now()}`);
        const providerReference = data.reference || json.reference || params.merchantReference || `GP-REF-${Date.now()}`;
        return {
          success: true,
          paymentId: params.orderId,
          checkoutUrl: checkoutUrl || `/payment/hosted-checkout?tx=${providerTransactionId}&orderId=${params.orderId}&code=${params.orderCode}&amount=${params.amount}&ref=${encodeURIComponent(params.merchantReference || "")}`,
          providerTransactionId,
          providerReference,
          expiresAt: data.expires_at || new Date(Date.now() + 30 * 60 * 1e3).toISOString()
        };
      } else {
        const errText = await response.text();
        console.warn(`[GeniusPayProvider] Gateway response error HTTP ${response.status}:`, errText);
        if (this.environment === "production") {
          return {
            success: false,
            paymentId: params.orderId,
            checkoutUrl: "",
            errorMessage: `La passerelle de paiement a retourn\xE9 une erreur (HTTP ${response.status}).`
          };
        }
        console.warn("[GeniusPayProvider] Activating sandbox simulator fallback for development.");
        const mockTxId = `gp_tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const mockRef = params.merchantReference || `GP-REF-${Math.floor(1e5 + Math.random() * 9e5)}`;
        return {
          success: true,
          paymentId: params.orderId,
          checkoutUrl: `/payment/hosted-checkout?tx=${mockTxId}&orderId=${params.orderId}&code=${params.orderCode}&amount=${params.amount}&ref=${encodeURIComponent(mockRef)}`,
          providerTransactionId: mockTxId,
          providerReference: mockRef,
          expiresAt: new Date(Date.now() + 30 * 60 * 1e3).toISOString()
        };
      }
    } catch (err) {
      if (this.environment === "production") {
        console.error("[GeniusPayProvider] Production live gateway unreachable:", err.message || err);
        return {
          success: false,
          paymentId: params.orderId,
          checkoutUrl: "",
          errorMessage: "La passerelle de paiement GeniusPay est temporairement inaccessible."
        };
      }
      console.warn("[GeniusPayProvider] Remote API unreachable in sandbox, activating simulator:", err.message || err);
      const mockTxId = `gp_tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const mockRef = params.merchantReference || `GP-REF-${Math.floor(1e5 + Math.random() * 9e5)}`;
      return {
        success: true,
        paymentId: params.orderId,
        checkoutUrl: `/payment/hosted-checkout?tx=${mockTxId}&orderId=${params.orderId}&code=${params.orderCode}&amount=${params.amount}&ref=${encodeURIComponent(mockRef)}`,
        providerTransactionId: mockTxId,
        providerReference: mockRef,
        expiresAt: new Date(Date.now() + 30 * 60 * 1e3).toISOString()
      };
    }
  }
  /**
   * 2. Vérification cryptographique de la signature HMAC-SHA256 du Webhook
   * Supporte :
   * - hash_hmac('sha256', payload, secret) (Standard officiel GeniusPay documenté)
   * - hash_hmac('sha256', `${timestamp}.${payload}`, secret) (Avec horodatage anti-rejeu)
   */
  async verifyWebhook(rawBody, headers) {
    const rawString = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    const signatureHeader = headers["x-webhook-signature"] || headers["X-Webhook-Signature"] || headers["x-geniuspay-signature"] || headers["X-GeniusPay-Signature"] || headers["x-signature"] || headers["genius-webhook-token"] || headers["signature"];
    const timestampHeader = headers["x-webhook-timestamp"] || headers["X-Webhook-Timestamp"] || headers["x-geniuspay-timestamp"] || headers["X-GeniusPay-Timestamp"] || headers["x-timestamp"] || headers["timestamp"];
    const eventHeader = headers["x-webhook-event"] || headers["X-Webhook-Event"] || headers["x-geniuspay-event"] || headers["X-GeniusPay-Event"] || headers["event"];
    if (!signatureHeader) {
      return {
        isValid: false,
        reason: "En-t\xEAte de signature manquant dans la requ\xEAte webhook."
      };
    }
    if (timestampHeader) {
      const parsedTimestamp = parseInt(timestampHeader, 10);
      const currentTimeSeconds = Math.floor(Date.now() / 1e3);
      const diff = Math.abs(currentTimeSeconds - parsedTimestamp);
      if (isNaN(parsedTimestamp) || diff > 300) {
        return {
          isValid: false,
          reason: `Timestamp webhook expir\xE9 ou hors fen\xEAtre de tol\xE9rance (${diff}s).`
        };
      }
    }
    const expectedDirectSignature = crypto.createHmac("sha256", this.webhookSecret).update(rawString).digest("hex");
    const expectedTimestampedSignature = timestampHeader ? crypto.createHmac("sha256", this.webhookSecret).update(`${timestampHeader}.${rawString}`).digest("hex") : "";
    const isValidSignature = this.timingSafeEqual(expectedDirectSignature, signatureHeader) || Boolean(expectedTimestampedSignature) && this.timingSafeEqual(expectedTimestampedSignature, signatureHeader);
    if (!isValidSignature) {
      return {
        isValid: false,
        reason: "Signature cryptographique invalide."
      };
    }
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(rawString);
    } catch {
      return {
        isValid: false,
        reason: "Payload JSON malform\xE9."
      };
    }
    const eventType = (parsedPayload.event || eventHeader || parsedPayload.type || "payment.success").toString();
    const tx = parsedPayload.data?.transaction || parsedPayload.data || parsedPayload;
    const providerTransactionId = (tx.id || tx.transaction_id || tx.payment_id || `gp_tx_${Date.now()}`).toString();
    const providerReference = tx.reference || tx.merchant_reference || tx.provider_reference || "";
    const rawStatus = (tx.status || tx.payment_status || "").toLowerCase();
    const mappedStatus = this.mapProviderStatus(rawStatus, eventType);
    const amount = Number(tx.amount !== void 0 ? tx.amount : tx.total_amount !== void 0 ? tx.total_amount : 0);
    const currency = tx.currency || "XOF";
    const metadata = tx.metadata || parsedPayload.metadata || {};
    const orderId = metadata.order_id || tx.order_id || parsedPayload.order_id;
    const paymentId = metadata.payment_id || tx.payment_id;
    const eventId = parsedPayload.id || parsedPayload.event_id || `evt_${providerTransactionId}_${Date.now()}`;
    return {
      isValid: true,
      eventType,
      eventId,
      providerTransactionId,
      providerReference,
      status: mappedStatus,
      amount,
      currency,
      orderId,
      paymentId,
      rawPayload: parsedPayload
    };
  }
  /**
   * 3. GET /payments/{reference} - Récupérer un paiement certifié
   */
  async getPaymentStatus(referenceOrId) {
    const endpoint = `${this.baseUrl}/payments/${encodeURIComponent(referenceOrId)}`;
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: this.getHeaders()
      });
      if (response.ok) {
        const json = await response.json();
        const tx = json.data || json;
        const mappedStatus = this.mapProviderStatus(tx.status);
        return {
          providerTransactionId: String(tx.id || referenceOrId),
          status: mappedStatus,
          amount: Number(tx.amount || 0),
          currency: tx.currency || "XOF",
          paymentMethod: tx.payment_method,
          paidAt: tx.completed_at || tx.paid_at || (mappedStatus === "paid" ? (/* @__PURE__ */ new Date()).toISOString() : void 0),
          rawResponse: json
        };
      }
    } catch (err) {
      console.warn("[GeniusPayProvider] Failed to fetch payment status from API:", err.message || err);
    }
    return {
      providerTransactionId: referenceOrId,
      status: "pending",
      amount: 0,
      currency: "XOF"
    };
  }
  /**
   * 4. GET /payments - Lister les transactions GeniusPay
   */
  async listPayments(params) {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.from) query.append("from", params.from);
    if (params?.to) query.append("to", params.to);
    if (params?.per_page) query.append("per_page", String(params.per_page));
    const endpoint = `${this.baseUrl}/payments${query.toString() ? `?${query.toString()}` : ""}`;
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: this.getHeaders()
      });
      if (response.ok) {
        const json = await response.json();
        return {
          success: true,
          data: json.data || [],
          meta: json.meta
        };
      }
    } catch (err) {
      console.warn("[GeniusPayProvider] Failed to list payments:", err.message || err);
    }
    return { success: false, data: [] };
  }
  /**
   * 5. GET /account - Récupérer les informations du compte marchand
   */
  async getAccountInfo() {
    const endpoint = `${this.baseUrl}/account`;
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: this.getHeaders()
      });
      if (response.ok) {
        const json = await response.json();
        return {
          success: true,
          account: json.data || json
        };
      }
      return { success: false, error: `Erreur API compte marchand HTTP ${response.status}` };
    } catch (err) {
      return { success: false, error: err.message || "Passerelle GeniusPay inaccessible" };
    }
  }
  /**
   * 6. GET /account/balance - Récupérer le solde du compte marchand
   */
  async getAccountBalance() {
    const endpoint = `${this.baseUrl}/account/balance`;
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: this.getHeaders()
      });
      if (response.ok) {
        const json = await response.json();
        return {
          success: true,
          balance: json.data || json
        };
      }
      return { success: false, error: `Erreur API solde marchand HTTP ${response.status}` };
    } catch (err) {
      return { success: false, error: err.message || "Passerelle GeniusPay inaccessible" };
    }
  }
  /**
   * Mapping des statuts documentés de GeniusPay vers les statuts internes de l'application
   */
  mapProviderStatus(rawStatus, eventType) {
    const status = (rawStatus || "").toLowerCase();
    const event = (eventType || "").toLowerCase();
    if (status === "completed" || status === "paid" || status === "success" || status === "successful" || event === "payment.success" || event === "payment_success" || event === "payment_intent.confirmed" || event === "payment.completed") {
      return "paid";
    }
    if (status === "failed" || status === "declined" || status === "rejected" || event === "payment.failed" || event === "payment_failed" || event === "payment.declined") {
      return "failed";
    }
    if (status === "cancelled" || status === "canceled" || event === "payment.cancelled" || event === "payment_cancelled") {
      return "cancelled";
    }
    if (status === "expired" || event === "payment.expired" || event === "payment_expired") {
      return "expired";
    }
    if (status === "refunded" || status === "partially_refunded" || event === "payment.refunded" || event === "payment_refunded") {
      return "refunded";
    }
    return "pending";
  }
  /**
   * Comparaison en temps constant pour éviter les attaques temporelles (Timing Attacks)
   */
  timingSafeEqual(a, b) {
    if (!a || !b) return false;
    try {
      const bufA = Buffer.from(a);
      const bufB = Buffer.from(b);
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return a === b;
    }
  }
};

// server/services/PaymentService.ts
var PaymentService = class {
  constructor(customProvider) {
    this.provider = customProvider || new GeniusPayProvider();
  }
  /**
   * 1. Initialise une tentative de paiement certifiée et sécurisée
   * Exécute les 10 vérifications strictes via la fonction PostgreSQL atomique create_payment_attempt.
   * Le montant serveur fait foi ; aucun montant client n'est accepté.
   */
  async createPaymentForOrder(params) {
    const supabase = getSupabaseServerClient();
    const { data: attemptResult, error: attemptError } = await supabase.rpc("create_payment_attempt", {
      p_order_id: params.orderId,
      p_user_id: params.userId || null,
      p_ip: params.clientIp || null,
      p_user_agent: params.userAgent || null
    });
    if (attemptError || !attemptResult?.success) {
      console.warn("[PaymentService] Payment attempt creation rejected:", attemptError || attemptResult);
      return {
        success: false,
        errorCode: attemptResult?.error_code || "ATTEMPT_CREATION_FAILED",
        errorMessage: attemptResult?.error_message || attemptError?.message || "Impossible d'initialiser la tentative de paiement."
      };
    }
    console.log("[PaymentService] Payment attempt initiated in Supabase:", {
      orderId: attemptResult.order_id,
      trackingCode: attemptResult.tracking_code,
      merchantReference: attemptResult.merchant_reference,
      amount: attemptResult.amount_xof
    });
    const returnUrl = params.returnUrl || `${config.appUrl}/payment/success?orderId=${attemptResult.order_id}&paymentId=${attemptResult.payment_id}`;
    const cancelUrl = params.cancelUrl || `${config.appUrl}/payment/cancelled?orderId=${attemptResult.order_id}`;
    const sessionResult = await this.provider.createPaymentSession({
      orderId: attemptResult.order_id,
      orderCode: attemptResult.tracking_code,
      userId: params.userId,
      merchantReference: attemptResult.merchant_reference,
      amount: attemptResult.amount_xof,
      currency: attemptResult.currency || "XOF",
      paymentMethod: params.paymentMethod,
      description: `Commande ${attemptResult.tracking_code} - Dallou Chine`,
      customer: {
        name: attemptResult.customer_name || "Client Dallou Chine",
        email: attemptResult.customer_email || "client@dallouchine.sn",
        phone: attemptResult.customer_phone || ""
      },
      returnUrl,
      cancelUrl,
      metadata: {
        payment_id: attemptResult.payment_id,
        attempt_id: attemptResult.attempt_id,
        merchant_reference: attemptResult.merchant_reference
      }
    });
    if (!sessionResult.success || !sessionResult.checkoutUrl) {
      console.error("[PaymentService] Provider session creation failed:", sessionResult.errorMessage);
      return {
        success: false,
        errorCode: "PROVIDER_SESSION_FAILED",
        errorMessage: sessionResult.errorMessage || "Le paiement n'a pas pu \xEAtre initialis\xE9 aupr\xE8s de la passerelle GeniusPay."
      };
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    await supabase.from("payments").update({
      checkout_url: sessionResult.checkoutUrl,
      provider_transaction_id: sessionResult.providerTransactionId || null,
      provider_reference: sessionResult.providerReference || attemptResult.merchant_reference,
      updated_at: nowIso
    }).eq("id", attemptResult.payment_id);
    await supabase.from("payment_attempts").update({
      provider_payment_id: sessionResult.providerTransactionId || null,
      provider_reference: sessionResult.providerReference || attemptResult.merchant_reference,
      updated_at: nowIso
    }).eq("id", attemptResult.attempt_id);
    return {
      success: true,
      checkoutUrl: sessionResult.checkoutUrl,
      paymentId: attemptResult.payment_id,
      attemptId: attemptResult.attempt_id,
      merchantReference: attemptResult.merchant_reference,
      providerTransactionId: sessionResult.providerTransactionId,
      amount: attemptResult.amount_xof,
      currency: "XOF"
    };
  }
  /**
   * 2. Traitement sécurisé, transactionnel et idempotent des Webhooks GeniusPay
   * Valide la signature cryptographique sur le payload brut, compare les montants au centime près,
   * garantit l'idempotence et applique les transitions d'état en une seule transaction PostgreSQL.
   */
  async handleWebhook(rawBody, headers) {
    console.log("[PaymentService] Processing incoming webhook...");
    const supabase = getSupabaseServerClient();
    const verification = await this.provider.verifyWebhook(rawBody, headers);
    if (!verification.isValid) {
      console.warn("[PaymentService] Webhook rejected (invalid signature):", verification.reason);
      try {
        await supabase.rpc("process_geniuspay_webhook", {
          p_event_id: verification.eventId || `evt_invalid_${Date.now()}`,
          p_event_type: verification.eventType || "webhook.signature_failed",
          p_provider_payment_id: verification.providerTransactionId || null,
          p_merchant_reference: verification.providerReference || null,
          p_order_id: verification.orderId || null,
          p_status: "failed",
          p_amount_xof: verification.amount || 0,
          p_currency: verification.currency || "XOF",
          p_payload: verification.rawPayload || {},
          p_signature_verified: false
        });
      } catch (err) {
        console.warn("[PaymentService] Failed to record invalid signature event:", err.message);
      }
      return {
        status: 400,
        errorCode: "INVALID_SIGNATURE",
        message: verification.reason || "Signature de webhook invalide."
      };
    }
    const { data: rpcResult, error: rpcError } = await supabase.rpc("process_geniuspay_webhook", {
      p_event_id: verification.eventId || null,
      p_event_type: verification.eventType || "payment_intent.confirmed",
      p_provider_payment_id: verification.providerTransactionId || null,
      p_merchant_reference: verification.providerReference || null,
      p_order_id: verification.orderId || null,
      p_status: verification.status || "paid",
      p_amount_xof: verification.amount,
      p_currency: verification.currency || "XOF",
      p_payload: verification.rawPayload || {},
      p_signature_verified: true
    });
    if (rpcError) {
      console.error("[PaymentService] PostgreSQL transaction error during webhook processing:", rpcError);
      return {
        status: 500,
        message: "Erreur interne de base de donn\xE9es lors du traitement du webhook."
      };
    }
    if (rpcResult.already_processed) {
      console.log(`[PaymentService] [Idempotence] Event ${verification.eventId} was already processed.`);
      return {
        status: 200,
        message: "\xC9v\xE9nement d\xE9j\xE0 trait\xE9 avec succ\xE8s (idempotence).",
        data: rpcResult
      };
    }
    if (!rpcResult.success) {
      const code = rpcResult.error_code;
      console.warn("[PaymentService] [Security Rejection] Webhook validation failed in database:", {
        errorCode: code,
        errorMessage: rpcResult.error_message
      });
      let statusCode = 400;
      if (code === "AMOUNT_MISMATCH" || code === "REFERENCE_MISMATCH" || code === "CURRENCY_MISMATCH") {
        statusCode = 422;
      } else if (code === "PAYMENT_ATTEMPT_NOT_FOUND" || code === "ORDER_NOT_FOUND") {
        statusCode = 404;
      } else if (code === "ORDER_CANCELLED") {
        statusCode = 409;
      }
      return {
        status: statusCode,
        errorCode: code,
        message: rpcResult.error_message || "\xC9chec de traitement du webhook.",
        data: rpcResult
      };
    }
    console.log(`[PaymentService] [payment_confirmed] Order ${rpcResult.tracking_code} payment status updated to: ${rpcResult.payment_status}`);
    return {
      status: 200,
      message: "Webhook trait\xE9 avec succ\xE8s.",
      data: rpcResult
    };
  }
  /**
   * 3. Récupération et synchronisation certifiée du statut d'un paiement
   * La source de vérité est la base de données PostgreSQL certifiée.
   */
  async getPaymentStatus(paymentIdOrOrderId) {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_order_payment_details", {
      p_order_id: paymentIdOrOrderId
    });
    if (error || !data || !data.found) {
      return { found: false };
    }
    return {
      found: true,
      payment: data.payment ? {
        id: data.payment.id,
        orderId: data.payment.order_id,
        orderCode: data.order?.tracking_code || "AWP-N/A",
        amount: Number(data.payment.amount),
        currency: data.payment.currency,
        status: data.payment.status,
        paymentMethod: data.payment.payment_method,
        provider: data.payment.provider,
        providerTransactionId: data.payment.provider_transaction_id,
        providerReference: data.payment.provider_reference,
        paidAt: data.payment.paid_at,
        createdAt: data.payment.created_at,
        updatedAt: data.payment.updated_at
      } : void 0,
      order: data.order ? {
        id: data.order.id,
        trackingCode: data.order.tracking_code,
        userId: data.order.user_id,
        customerName: data.order.customer_name,
        paymentStatus: data.order.payment_status,
        orderStatus: data.order.order_status,
        totalXOF: Number(data.order.total_xof),
        shippingFeeXOF: Number(data.order.shipping_fee_xof),
        paidAt: data.order.paid_at
      } : void 0
    };
  }
  /**
   * 4. Journal des paiements pour l'administration
   */
  async getAdminPayments() {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from("payments").select("*, orders(tracking_code, customer_name, customer_email, total_xof)").order("created_at", { ascending: false });
    if (error || !data) {
      return [];
    }
    return data.map((d) => ({
      id: d.id,
      orderId: d.order_id,
      orderCode: d.orders?.tracking_code || d.metadata?.order_code || "AWP-N/A",
      userId: d.user_id,
      provider: d.provider,
      providerTransactionId: d.provider_transaction_id,
      providerReference: d.provider_reference,
      amount: Number(d.amount_xof),
      currency: d.currency,
      status: d.status,
      paymentMethod: d.payment_method,
      checkoutUrl: d.checkout_url,
      customerName: d.customer_name || d.orders?.customer_name || "",
      customerEmail: d.customer_email || d.orders?.customer_email || "",
      customerPhone: d.customer_phone || "",
      paidAt: d.paid_at,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));
  }
  /**
   * 5. Consultation du solde marchand GeniusPay (GET /account/balance)
   */
  async getGeniusPayBalance() {
    if (this.provider instanceof GeniusPayProvider) {
      return await this.provider.getAccountBalance();
    }
    return { success: false, error: "Fournisseur GeniusPay non actif" };
  }
  /**
   * 6. Consultation des informations du compte marchand GeniusPay (GET /account)
   */
  async getGeniusPayAccount() {
    if (this.provider instanceof GeniusPayProvider) {
      return await this.provider.getAccountInfo();
    }
    return { success: false, error: "Fournisseur GeniusPay non actif" };
  }
  /**
   * 7. Consultation des transactions en direct sur la passerelle GeniusPay (GET /payments)
   */
  async getGeniusPayLiveTransactions(params) {
    if (this.provider instanceof GeniusPayProvider) {
      return await this.provider.listPayments(params);
    }
    return { success: false, data: [] };
  }
};
var paymentService = new PaymentService();

// server/api/paymentsRouter.ts
var paymentsRouter = Router4();
paymentsRouter.post("/create", requireAuth, async (req, res) => {
  try {
    const orderId = req.body.orderId || req.body.order_id;
    const { returnUrl, cancelUrl, paymentMethod } = req.body;
    if (!orderId) {
      res.status(400).json({
        success: false,
        errorCode: "MISSING_ORDER_ID",
        errorMessage: "Identifiant de commande manquant."
      });
      return;
    }
    const userId = req.user.id;
    const clientIp = req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];
    const result = await paymentService.createPaymentForOrder({
      orderId,
      userId,
      clientIp,
      userAgent,
      returnUrl,
      cancelUrl,
      paymentMethod
    });
    if (!result.success) {
      let statusCode = 400;
      if (result.errorCode === "FORBIDDEN") statusCode = 403;
      else if (result.errorCode === "ORDER_NOT_FOUND") statusCode = 404;
      else if (result.errorCode === "ALREADY_PAID" || result.errorCode === "ORDER_CANCELLED") statusCode = 409;
      res.status(statusCode).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    console.error("[Payments API] Error in /api/payments/create:", error.message || error);
    res.status(500).json({
      success: false,
      errorCode: "INTERNAL_ERROR",
      errorMessage: "Erreur interne lors de l'initialisation du paiement."
    });
  }
});
paymentsRouter.get("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const statusData = await paymentService.getPaymentStatus(id);
    if (!statusData.found) {
      res.status(404).json({
        success: false,
        errorMessage: "Paiement ou commande introuvable."
      });
      return;
    }
    res.json({
      success: true,
      payment: statusData.payment,
      order: statusData.order
    });
  } catch (error) {
    console.error("[Payments API] Error in /api/payments/:id/status:", error.message || error);
    res.status(500).json({
      success: false,
      errorMessage: "Erreur lors de la r\xE9cup\xE9ration du statut de paiement."
    });
  }
});
paymentsRouter.get("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const statusData = await paymentService.getPaymentStatus(orderId);
    if (!statusData.found) {
      res.status(404).json({
        success: false,
        errorMessage: "Aucun paiement associ\xE9 \xE0 cette commande."
      });
      return;
    }
    res.json({
      success: true,
      payment: statusData.payment,
      order: statusData.order
    });
  } catch (error) {
    console.error("[Payments API] Error in /api/payments/order/:orderId:", error.message || error);
    res.status(500).json({
      success: false,
      errorMessage: "Erreur lors de la r\xE9cup\xE9ration du paiement de la commande."
    });
  }
});
var handleGeniusPayWebhookRoute = async (req, res) => {
  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const headers = req.headers;
    const result = await paymentService.handleWebhook(rawBody, headers);
    res.status(result.status).json(result);
  } catch (error) {
    console.error("[Payments API] Webhook processing exception:", error.message || error);
    res.status(500).json({
      status: 500,
      message: "Erreur interne du serveur lors du traitement du webhook."
    });
  }
};
paymentsRouter.post("/webhooks/geniuspay", handleGeniusPayWebhookRoute);
paymentsRouter.get("/admin/list", requireAdmin, async (_req, res) => {
  try {
    const payments = await paymentService.getAdminPayments();
    res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error("[Payments API] Error in /api/admin/payments:", error.message || error);
    res.status(500).json({
      success: false,
      errorMessage: "Erreur lors du chargement des paiements."
    });
  }
});
paymentsRouter.get("/admin/geniuspay/balance", requireAdmin, async (_req, res) => {
  try {
    const result = await paymentService.getGeniusPayBalance();
    res.json(result);
  } catch (error) {
    console.error("[Payments API] Error in /admin/geniuspay/balance:", error.message || error);
    res.status(500).json({
      success: false,
      errorMessage: "Impossible de r\xE9cup\xE9rer le solde marchand GeniusPay."
    });
  }
});
paymentsRouter.get("/admin/geniuspay/account", requireAdmin, async (_req, res) => {
  try {
    const result = await paymentService.getGeniusPayAccount();
    res.json(result);
  } catch (error) {
    console.error("[Payments API] Error in /admin/geniuspay/account:", error.message || error);
    res.status(500).json({
      success: false,
      errorMessage: "Impossible de r\xE9cup\xE9rer les informations du compte GeniusPay."
    });
  }
});
paymentsRouter.get("/admin/geniuspay/live-payments", requireAdmin, async (req, res) => {
  try {
    const { status, from, to, per_page } = req.query;
    const result = await paymentService.getGeniusPayLiveTransactions({
      status,
      from,
      to,
      per_page: per_page ? parseInt(per_page, 10) : void 0
    });
    res.json(result);
  } catch (error) {
    console.error("[Payments API] Error in /admin/geniuspay/live-payments:", error.message || error);
    res.status(500).json({
      success: false,
      errorMessage: "Impossible de r\xE9cup\xE9rer la liste des paiements en direct."
    });
  }
});
paymentsRouter.post("/simulate-sandbox-webhook", async (req, res) => {
  try {
    if (config.geniusPayEnvironment === "production") {
      res.status(403).json({
        success: false,
        errorMessage: "Acc\xE8s interdit : La simulation sandbox est d\xE9sactiv\xE9e lorsque GENIUSPAY_ENVIRONMENT=production."
      });
      return;
    }
    const { orderId, providerTransactionId, eventType = "payment_success" } = req.body;
    if (!orderId) {
      res.status(400).json({
        success: false,
        errorMessage: "Identifiant de commande requis pour la simulation."
      });
      return;
    }
    const supabase = getSupabaseServerClient();
    const { data: details } = await supabase.rpc("get_order_payment_details", {
      p_order_id: orderId
    });
    if (!details || !details.found || !details.order) {
      res.status(404).json({
        success: false,
        errorMessage: "Commande cibl\xE9e introuvable en base de donn\xE9es."
      });
      return;
    }
    const order = details.order;
    let attempt = details.attempt;
    const realAmount = attempt ? Number(attempt.amount_xof) : Number(order.total_xof);
    const merchantReference = attempt?.merchant_reference || `DALLOU-SIM-${Date.now()}`;
    const txId = providerTransactionId || attempt?.provider_payment_id || `gp_tx_sim_${Date.now()}`;
    if (!attempt) {
      await supabase.from("payment_attempts").insert({
        order_id: order.id,
        attempt_number: 1,
        merchant_reference: merchantReference,
        provider_payment_id: txId,
        amount_xof: realAmount,
        currency: "XOF",
        status: "pending"
      });
    }
    const payloadStatus = eventType === "payment_success" ? "completed" : eventType === "payment_failed" ? "failed" : "cancelled";
    const officialEvent = eventType === "payment_success" ? "payment.success" : eventType === "payment_failed" ? "payment.failed" : "payment.cancelled";
    const mockPayload = {
      event: officialEvent,
      id: `evt_sim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      created_at: Math.floor(Date.now() / 1e3),
      data: {
        // Objet transaction documenté
        transaction: {
          id: txId,
          reference: merchantReference,
          merchant_reference: merchantReference,
          status: payloadStatus,
          amount: realAmount,
          currency: "XOF",
          customer: {
            name: order.customer_name,
            phone: order.customer_phone,
            email: order.customer_email
          },
          metadata: {
            order_id: order.id,
            order_code: order.tracking_code,
            merchant_reference: merchantReference
          }
        },
        // Rétrocompatibilité avec les tests qui lisent directement data.*
        transaction_id: txId,
        reference: merchantReference,
        merchant_reference: merchantReference,
        status: payloadStatus,
        amount: realAmount,
        currency: "XOF",
        metadata: {
          order_id: order.id,
          order_code: order.tracking_code,
          merchant_reference: merchantReference
        },
        merchant: {
          id: "uuid-merchant-dallou",
          name: "Dallou Chine"
        },
        environment: "sandbox"
      }
    };
    const rawString = JSON.stringify(mockPayload);
    const timestamp = Math.floor(Date.now() / 1e3).toString();
    const signature = crypto2.createHmac("sha256", config.geniusPayWebhookSecret).update(`${timestamp}.${rawString}`).digest("hex");
    const result = await paymentService.handleWebhook(rawString, {
      "x-geniuspay-signature": signature,
      "x-geniuspay-timestamp": timestamp,
      "x-geniuspay-event": officialEvent,
      "content-type": "application/json"
    });
    res.json({
      success: result.status === 200,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errorMessage: error.message || "Erreur lors de la simulation sandbox."
    });
  }
});

// server/app.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    }
  })
);
app.use(express.urlencoded({ extended: true }));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});
app.get("/api/health", (_req, res) => {
  res.json({
    status: "online",
    service: "Dallou Chine API & Logistics Engine",
    gateway: "GeniusPay",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.use("/api/payments", paymentsRouter);
app.use("/api", paymentsRouter);
app.use("/api/shipments", shipmentsRouter);
app.use("/api/sourcing", sourcingRouter);
app.use("/api/b2b", b2bRouter);
if (!process.env.VERCEL) {
  const distPath = path.resolve(__dirname, "..", "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }
    const indexPath = path.join(distPath, "index.html");
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(404).send("Application non construite. Ex\xE9cutez npm run build d'abord.");
      }
    });
  });
}
var app_default = app;
export {
  app,
  app_default as default
};
