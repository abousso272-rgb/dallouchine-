// server/app.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// server/api/shipmentsRouter.ts
import { Router } from "express";

// server/middleware/auth.ts
import { createClient } from "@supabase/supabase-js";

// server/config.ts
import "dotenv/config";
var PUBLIC_SUPABASE_URL = "https://splsjtguapquznbiacad.supabase.co";
var PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbHNqdGd1YXBxdXpuYmlhY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NzYwNjYsImV4cCI6MjEwNTM1MjA2Nn0.yr8irdxSNMFI-N3K7ueOZV72uKQSVQykDpX9ioY1C4A";
var config = {
  geniusPayApiKey: process.env.GENIUSPAY_API_KEY || "",
  geniusPayApiSecret: process.env.GENIUSPAY_API_SECRET || "",
  geniusPayWebhookSecret: process.env.GENIUSPAY_WEBHOOK_SECRET || "",
  geniusPayBaseUrl: (process.env.GENIUSPAY_BASE_URL || "https://geniuspay.ci/api/v1/merchant").replace(/^http:\/\//i, "https://").replace(/\/+$/, ""),
  geniusPayEnvironment: process.env.GENIUSPAY_ENVIRONMENT === "production" ? "production" : "sandbox",
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  appUrl: (process.env.APP_URL || "https://dallouchine.vercel.app").replace(/\/+$/, ""),
  port: parseInt(process.env.PORT || "3000", 10)
};
var hasServiceRole = Boolean(config.supabaseServiceRoleKey);
var hasGeniusPayCredentials = Boolean(config.geniusPayApiKey && config.geniusPayApiSecret);

// server/middleware/auth.ts
var ADMIN_ROLES = ["admin", "super_admin", "operations", "commercial", "finance"];
var TRANSITAIRE_ROLES = ["transitaire", "sourcing", "sourcer"];
function toAppRole(rawRole, roles) {
  const all = [String(rawRole || "").toLowerCase(), ...(roles || []).map((r) => String(r).toLowerCase())];
  if (all.some((r) => ADMIN_ROLES.includes(r))) return "admin";
  if (all.some((r) => TRANSITAIRE_ROLES.includes(r))) return "transitaire";
  if (all.includes("groupage_manager")) return "groupage_manager";
  return "client";
}
var serviceClient = null;
function getSupabaseServerClient() {
  if (!serviceClient) {
    serviceClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey || config.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return serviceClient;
}
function getUserClient(accessToken) {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
function readBearer(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.substring(7).trim();
  return token || null;
}
async function resolveUser(req) {
  const token = readBearer(req);
  if (!token) return null;
  const userClient = getUserClient(token);
  const {
    data: { user },
    error
  } = await userClient.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await userClient.from("profiles").select("role, roles, full_name, phone, status").eq("id", user.id).maybeSingle();
  if (profile?.status === "suspended") return null;
  const role = toAppRole(profile?.role, profile?.roles);
  req.accessToken = token;
  req.db = userClient;
  return {
    id: user.id,
    email: user.email,
    phone: profile?.phone || user.phone || void 0,
    fullName: profile?.full_name || user.user_metadata?.full_name,
    role,
    rawRole: String(profile?.role || "client"),
    isAdmin: role === "admin",
    isStaff: role !== "client"
  };
}
function unauthorized(res, message = "Session invalide ou expir\xE9e. Veuillez vous reconnecter.") {
  res.status(401).json({ success: false, code: "UNAUTHORIZED", error: message, errorMessage: message });
}
async function requireAuth(req, res, next) {
  try {
    const user = await resolveUser(req);
    if (!user) return unauthorized(res);
    req.user = user;
    next();
  } catch (err) {
    console.error("[auth] requireAuth error:", err?.message || err);
    res.status(500).json({ success: false, error: "Erreur lors de la v\xE9rification de la session." });
  }
}
function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const user = await resolveUser(req);
      if (!user) return unauthorized(res);
      if (!roles.includes(user.role)) {
        res.status(403).json({ success: false, code: "FORBIDDEN", error: "Acc\xE8s non autoris\xE9 pour votre r\xF4le." });
        return;
      }
      req.user = user;
      next();
    } catch (err) {
      console.error("[auth] requireRole error:", err?.message || err);
      res.status(500).json({ success: false, error: "Erreur lors de la v\xE9rification des permissions." });
    }
  };
}
var requireAdmin = requireRole("admin");

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

// server/api/paymentsRouter.ts
import { Router as Router2 } from "express";

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
      description: params.description || `Commande ${params.orderCode} - DALUCHE`,
      customer: {
        name: params.customer.name || "Client DALUCHE",
        ...params.customer.email ? { email: params.customer.email } : {},
        phone: params.customer.phone || ""
      },
      success_url: params.returnUrl,
      error_url: params.cancelUrl,
      metadata: {
        order_id: params.orderId,
        order_code: params.orderCode,
        merchant_reference: params.merchantReference,
        user_id: params.userId || null,
        platform: "daluche",
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
      const json = await response.json().catch(() => ({}));
      const data = json?.data || json;
      const checkoutUrl = data?.checkout_url || data?.payment_url || json?.checkout_url || json?.payment_url;
      if (!response.ok || !checkoutUrl) {
        console.warn(`[GeniusPayProvider] Gateway error HTTP ${response.status}:`, JSON.stringify(json).slice(0, 500));
        return {
          success: false,
          paymentId: params.orderId,
          checkoutUrl: "",
          errorMessage: json?.message || json?.error || `La passerelle de paiement a refus\xE9 la demande (HTTP ${response.status}).`
        };
      }
      return {
        success: true,
        paymentId: params.orderId,
        checkoutUrl,
        providerTransactionId: String(data.id || json.id || ""),
        providerReference: data.reference || json.reference || params.merchantReference,
        expiresAt: data.expires_at || new Date(Date.now() + 30 * 60 * 1e3).toISOString()
      };
    } catch (err) {
      console.error("[GeniusPayProvider] Gateway unreachable:", err?.message || err);
      return {
        success: false,
        paymentId: params.orderId,
        checkoutUrl: "",
        errorMessage: "La passerelle de paiement est momentan\xE9ment inaccessible. R\xE9essayez dans quelques instants."
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
    if (!this.webhookSecret) {
      return {
        isValid: false,
        reason: "GENIUSPAY_WEBHOOK_SECRET non configur\xE9 sur le serveur."
      };
    }
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
    if (!hasGeniusPayCredentials) {
      return {
        success: false,
        errorCode: "PROVIDER_NOT_CONFIGURED",
        errorMessage: "Le paiement en ligne n'est pas encore configur\xE9. Contactez DALUCHE pour finaliser votre commande."
      };
    }
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
    const defaultAppUrl = config.appUrl && !config.appUrl.includes("localhost") ? config.appUrl.replace(/\/+$/, "") : "https://dallouchine.vercel.app";
    const returnUrl = params.returnUrl || `${defaultAppUrl}/paiement/retour?orderId=${attemptResult.order_id}`;
    const cancelUrl = params.cancelUrl || `${defaultAppUrl}/paiement/retour?orderId=${attemptResult.order_id}&cancelled=1`;
    const sessionResult = await this.provider.createPaymentSession({
      orderId: attemptResult.order_id,
      orderCode: attemptResult.tracking_code,
      userId: params.userId,
      merchantReference: attemptResult.merchant_reference,
      amount: attemptResult.amount_xof,
      currency: attemptResult.currency || "XOF",
      paymentMethod: params.paymentMethod,
      description: `Commande ${attemptResult.tracking_code} - DALUCHE`,
      customer: {
        name: attemptResult.customer_name || "Client DALUCHE",
        email: attemptResult.customer_email || "",
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
    const { error: paymentUpdateError } = await supabase.from("payments").update({
      checkout_url: sessionResult.checkoutUrl,
      provider_payment_id: sessionResult.providerTransactionId || null,
      provider_reference: sessionResult.providerReference || attemptResult.merchant_reference,
      updated_at: nowIso
    }).eq("id", attemptResult.payment_id);
    if (paymentUpdateError) {
      console.warn("[PaymentService] payments update:", paymentUpdateError.message);
    }
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
    if (data.order && data.order.payment_status !== "paid" && (data.payment?.provider_reference || data.payment?.provider_transaction_id)) {
      try {
        const ref = data.payment.provider_reference || data.payment.provider_transaction_id;
        const provStatus = await this.provider.getPaymentStatus(ref);
        if (provStatus && provStatus.status === "paid") {
          console.log(`[PaymentService] Auto-sync: GeniusPay payment ${ref} is confirmed paid. Syncing order ${data.order.id}...`);
          await supabase.rpc("process_geniuspay_webhook", {
            p_event_id: `sync_${ref}_${Date.now()}`,
            p_event_type: "payment.success",
            p_provider_payment_id: provStatus.providerTransactionId || data.payment.provider_transaction_id || ref,
            p_merchant_reference: ref,
            p_order_id: data.order.id,
            p_status: "paid",
            p_amount_xof: Number(data.order.total_xof),
            p_currency: "XOF",
            p_payload: provStatus.rawResponse || {},
            p_signature_verified: true
          });
          data.order.payment_status = "paid";
          if (data.payment) {
            data.payment.status = "paid";
            data.payment.paid_at = provStatus.paidAt || (/* @__PURE__ */ new Date()).toISOString();
          }
        }
      } catch (syncErr) {
        console.warn("[PaymentService] Auto-sync verification note:", syncErr.message || syncErr);
      }
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
  async getAdminPayments(db) {
    const { data, error } = await db.from("payments").select("*, orders(tracking_code, customer_name, customer_email, total_xof)").order("created_at", { ascending: false });
    if (error || !data) {
      return [];
    }
    return data.map((d) => ({
      id: d.id,
      orderId: d.order_id,
      orderCode: d.orders?.tracking_code || d.metadata?.order_code || "AWP-N/A",
      userId: d.user_id,
      provider: d.provider,
      providerTransactionId: d.provider_payment_id || d.provider_transaction_id,
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
};
var paymentService = new PaymentService();

// server/api/paymentsRouter.ts
var paymentsRouter = Router2();
function appBaseUrl(req) {
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  if (!host || host.includes("localhost") || host.startsWith("127.")) return config.appUrl;
  return `https://${host}`;
}
paymentsRouter.post("/create", requireAuth, async (req, res) => {
  try {
    const orderId = req.body.orderId || req.body.order_id;
    if (!orderId || typeof orderId !== "string") {
      res.status(400).json({ success: false, errorCode: "MISSING_ORDER_ID", errorMessage: "Identifiant de commande manquant." });
      return;
    }
    const { data: order } = await req.db.from("orders").select("id, user_id").eq("id", orderId).maybeSingle();
    if (!order || order.user_id !== req.user.id) {
      res.status(404).json({ success: false, errorCode: "ORDER_NOT_FOUND", errorMessage: "Commande introuvable." });
      return;
    }
    const base = appBaseUrl(req);
    const result = await paymentService.createPaymentForOrder({
      orderId,
      userId: req.user.id,
      clientIp: req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      returnUrl: `${base}/paiement/retour?orderId=${encodeURIComponent(orderId)}`,
      cancelUrl: `${base}/paiement/retour?orderId=${encodeURIComponent(orderId)}&cancelled=1`,
      paymentMethod: typeof req.body.paymentMethod === "string" ? req.body.paymentMethod : void 0
    });
    if (!result.success) {
      const code = result.errorCode;
      const status = code === "FORBIDDEN" ? 403 : code === "ORDER_NOT_FOUND" ? 404 : code === "ALREADY_PAID" || code === "ORDER_CANCELLED" ? 409 : code === "PROVIDER_NOT_CONFIGURED" ? 503 : 400;
      res.status(status).json(result);
      return;
    }
    res.json(result);
  } catch (error) {
    console.error("[payments] create:", error?.message || error);
    res.status(500).json({ success: false, errorCode: "INTERNAL_ERROR", errorMessage: "Erreur interne lors de l'initialisation du paiement." });
  }
});
async function handleStatus(req, res) {
  try {
    const id = req.params.orderId || req.params.id;
    const statusData = await paymentService.getPaymentStatus(id);
    if (!statusData.found || !statusData.order) {
      res.status(404).json({ success: false, errorMessage: "Paiement ou commande introuvable." });
      return;
    }
    if (statusData.order.userId !== req.user.id && !req.user.isAdmin) {
      res.status(404).json({ success: false, errorMessage: "Paiement ou commande introuvable." });
      return;
    }
    res.json({ success: true, payment: statusData.payment, order: statusData.order });
  } catch (error) {
    console.error("[payments] status:", error?.message || error);
    res.status(500).json({ success: false, errorMessage: "Erreur lors de la r\xE9cup\xE9ration du statut de paiement." });
  }
}
paymentsRouter.get("/order/:orderId", requireAuth, handleStatus);
paymentsRouter.get("/:id/status", requireAuth, handleStatus);
var handleGeniusPayWebhookRoute = async (req, res) => {
  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const result = await paymentService.handleWebhook(rawBody, req.headers);
    res.status(result.status).json(result);
  } catch (error) {
    console.error("[payments] webhook:", error?.message || error);
    res.status(500).json({ status: 500, message: "Erreur interne lors du traitement du webhook." });
  }
};
paymentsRouter.post("/webhooks/geniuspay", handleGeniusPayWebhookRoute);
paymentsRouter.get("/admin/list", requireAdmin, async (req, res) => {
  try {
    const payments = await paymentService.getAdminPayments(req.db);
    res.json({ success: true, payments });
  } catch (error) {
    console.error("[payments] admin list:", error?.message || error);
    res.status(500).json({ success: false, errorMessage: "Erreur lors du chargement des paiements." });
  }
});
paymentsRouter.get("/admin/geniuspay/balance", requireAdmin, async (_req, res) => {
  res.json(await paymentService.getGeniusPayBalance());
});
paymentsRouter.get("/admin/geniuspay/account", requireAdmin, async (_req, res) => {
  res.json(await paymentService.getGeniusPayAccount());
});

// server/api/teamRouter.ts
import { Router as Router3 } from "express";
var teamRouter = Router3();
var ROLES = ["admin", "transitaire", "groupage_manager"];
teamRouter.post("/invite", requireAdmin, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const role = String(req.body.role || "");
    const fullName = typeof req.body.fullName === "string" ? req.body.fullName.trim() : null;
    const permissions = Array.isArray(req.body.permissions) ? req.body.permissions.map(String) : [];
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      res.status(400).json({ success: false, error: "Adresse email invalide." });
      return;
    }
    if (!ROLES.includes(role)) {
      res.status(400).json({ success: false, error: "R\xF4le invalide." });
      return;
    }
    const { data, error } = await req.db.rpc("invite_team_member", {
      p_email: email,
      p_role: role,
      p_full_name: fullName,
      p_permissions: permissions
    });
    if (error || !data) {
      res.status(400).json({ success: false, error: error?.message || "Invitation impossible." });
      return;
    }
    const inviteUrl = `${config.appUrl}/invitation?token=${data.token}`;
    let emailSent = false;
    let emailError;
    if (hasServiceRole && !data.account_exists) {
      const { error: mailError } = await getSupabaseServerClient().auth.admin.inviteUserByEmail(email, {
        redirectTo: inviteUrl,
        data: { full_name: fullName || void 0 }
      });
      if (mailError) emailError = mailError.message;
      else emailSent = true;
    }
    res.json({
      success: true,
      invitationId: data.invitation_id,
      inviteUrl,
      accountExists: Boolean(data.account_exists),
      emailSent,
      emailError
    });
  } catch (err) {
    console.error("[team] invite:", err?.message || err);
    res.status(500).json({ success: false, error: "Erreur interne lors de l'invitation." });
  }
});

// server/app.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
function createApiApp() {
  const api = express();
  api.use(
    express.json({
      limit: "1mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf.toString("utf8");
      }
    })
  );
  api.use(express.urlencoded({ extended: true }));
  api.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  api.get("/api/health", (_req, res) => {
    res.json({
      status: "online",
      service: "DALUCHE API",
      gateway: "GeniusPay",
      paymentsConfigured: hasGeniusPayCredentials,
      paymentsEnvironment: config.geniusPayEnvironment,
      serviceRoleConfigured: hasServiceRole,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  api.use("/api/payments", paymentsRouter);
  api.use("/api", paymentsRouter);
  api.use("/api/shipments", shipmentsRouter);
  api.use("/api/team", teamRouter);
  api.use("/api", (_req, res) => {
    res.status(404).json({ success: false, error: "Route API inconnue." });
  });
  return api;
}
var app = express();
app.use(createApiApp());
if (!process.env.VERCEL) {
  const distPath = path.resolve(__dirname, "..", "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"), (err) => {
      if (err) res.status(404).send("Application non construite. Ex\xE9cutez npm run build.");
    });
  });
}
var app_default = app;
export {
  app,
  createApiApp,
  app_default as default
};
