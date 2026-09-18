import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.48.1";

// Types
type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "expired";

type InternalOrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "purchased_in_china"
  | "quality_control_passed"
  | "shipped_from_china"
  | "in_transit"
  | "arrived_in_senegal"
  | "customs_cleared"
  | "arrived_at_hub"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

// Helpers cryptographiques Web Crypto standard pour Deno / Supabase Edge Functions
async function verifyHmacSha256(
  secret: string,
  payload: string,
  providedSignature: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      messageData
    );

    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const computedSignatureHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison
    if (computedSignatureHex.length !== providedSignature.length) {
      return false;
    }

    let mismatch = 0;
    for (let i = 0; i < computedSignatureHex.length; i++) {
      mismatch |=
        computedSignatureHex.charCodeAt(i) ^ providedSignature.charCodeAt(i);
    }
    return mismatch === 0;
  } catch (err) {
    console.error("[geniuspay-webhook] HMAC calculation error:", err);
    return false;
  }
}

// Handler Deno Edge Function
Deno.serve(async (req: Request) => {
  // Seules les requêtes POST sont admises
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const webhookSecret = Deno.env.get("GENIUSPAY_WEBHOOK_SECRET") || "";
  const environment = Deno.env.get("GENIUSPAY_ENVIRONMENT") || "sandbox";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[geniuspay-webhook] Configuration error: Missing Supabase credentials.");
    return new Response(
      JSON.stringify({ error: "Server configuration missing" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  try {
    // 1. Extraction du corps brut de la requête (Raw Body)
    const rawBody = await req.text();

    // 2. Extraction des headers
    const signatureHeader =
      req.headers.get("x-geniuspay-signature") ||
      req.headers.get("x-signature") ||
      req.headers.get("genius-webhook-token") ||
      req.headers.get("signature") ||
      "";

    const timestampHeader =
      req.headers.get("x-geniuspay-timestamp") ||
      req.headers.get("x-timestamp") ||
      req.headers.get("timestamp") ||
      "";

    // 3. Vérification de l'anti-rejeu (Replay attack protection: 5 min / 300s)
    if (timestampHeader) {
      const parsedTime = parseInt(timestampHeader, 10);
      const nowSec = Math.floor(Date.now() / 1000);
      const delta = Math.abs(nowSec - parsedTime);

      if (isNaN(parsedTime) || delta > 300) {
        console.warn(`[geniuspay-webhook] Request rejected: Timestamp expired (delta: ${delta}s)`);
        return new Response(
          JSON.stringify({ error: "Webhook timestamp expired or out of tolerance" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 4. Vérification de la signature HMAC-SHA256
    if (webhookSecret) {
      if (!signatureHeader && environment === "production") {
        console.warn("[geniuspay-webhook] Missing signature header in production.");
        return new Response(
          JSON.stringify({ error: "Missing signature header" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (signatureHeader) {
        const payloadToVerify = timestampHeader
          ? `${timestampHeader}.${rawBody}`
          : rawBody;

        const isSignatureValid = await verifyHmacSha256(
          webhookSecret,
          payloadToVerify,
          signatureHeader
        );

        if (!isSignatureValid && environment === "production") {
          console.warn("[geniuspay-webhook] Invalid cryptographic signature.");
          return new Response(
            JSON.stringify({ error: "Invalid signature" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    // 5. Parse JSON
    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ error: "Malformed JSON payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 6. Extraction normalisée des données de l'événement GeniusPay
    const eventType: string = (
      parsedPayload.event ||
      parsedPayload.type ||
      parsedPayload.event_type ||
      "payment_intent.confirmed"
    ).toLowerCase();

    const eventId: string =
      parsedPayload.id ||
      parsedPayload.event_id ||
      `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const dataObj = parsedPayload.data || parsedPayload;
    const providerTransactionId =
      dataObj.transaction_id || dataObj.id || dataObj.payment_id || null;
    const providerReference =
      dataObj.reference || dataObj.provider_reference || null;
    const rawStatus = (dataObj.status || dataObj.payment_status || "").toLowerCase();
    const orderId = dataObj.metadata?.order_id || parsedPayload.order_id || null;
    const paymentId = dataObj.metadata?.payment_id || null;

    // 7. Idempotence : Vérifier si l'événement a déjà été traité
    const { data: existingLog } = await supabase
      .from("webhook_logs")
      .select("id, processed")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingLog && existingLog.processed) {
      console.log(`[geniuspay-webhook] Idempotency: Event ${eventId} already processed.`);
      return new Response(
        JSON.stringify({ success: true, message: "Event already processed" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 8. Mapping des événements et statuts
    let mappedPaymentStatus: PaymentStatus = "pending";
    let shouldUpdateOrderToPaid = false;

    if (
      eventType === "payment.success" ||
      eventType === "payment_success" ||
      eventType === "payment_intent.confirmed" ||
      eventType === "payment.completed" ||
      rawStatus === "completed" ||
      rawStatus === "paid" ||
      rawStatus === "success"
    ) {
      mappedPaymentStatus = "paid";
      shouldUpdateOrderToPaid = true;
    } else if (
      eventType === "payment.failed" ||
      eventType === "payment_failed" ||
      eventType === "payment.declined" ||
      rawStatus === "failed" ||
      rawStatus === "declined"
    ) {
      mappedPaymentStatus = "failed";
    } else if (
      eventType === "payment.cancelled" ||
      eventType === "payment_cancelled" ||
      rawStatus === "cancelled"
    ) {
      mappedPaymentStatus = "cancelled";
    } else if (
      eventType === "payment.expired" ||
      eventType === "payment_expired" ||
      eventType === "payment_intent.expired" ||
      rawStatus === "expired"
    ) {
      mappedPaymentStatus = "expired";
    } else if (
      eventType === "payment.refunded" ||
      eventType === "payment_refunded" ||
      rawStatus === "refunded"
    ) {
      mappedPaymentStatus = "refunded";
    } else if (
      eventType === "payment.initiated" ||
      eventType === "payment_initiated" ||
      rawStatus === "pending"
    ) {
      mappedPaymentStatus = "pending";
    }

    const nowIso = new Date().toISOString();

    // 9. Mise à jour de la table `payments`
    if (paymentId) {
      await supabase
        .from("payments")
        .update({
          status: mappedPaymentStatus,
          provider_transaction_id: providerTransactionId,
          provider_reference: providerReference,
          paid_at: mappedPaymentStatus === "paid" ? nowIso : null,
          updated_at: nowIso,
        })
        .eq("id", paymentId);
    } else if (providerTransactionId) {
      await supabase
        .from("payments")
        .update({
          status: mappedPaymentStatus,
          paid_at: mappedPaymentStatus === "paid" ? nowIso : null,
          updated_at: nowIso,
        })
        .eq("provider_transaction_id", providerTransactionId);
    }

    // 10. Mise à jour de la table `orders`
    if (orderId) {
      const orderUpdatePayload: any = {
        payment_status: mappedPaymentStatus,
        updated_at: nowIso,
      };

      if (shouldUpdateOrderToPaid) {
        orderUpdatePayload.order_status = "paid";
        orderUpdatePayload.paid_at = nowIso;
      }

      await supabase
        .from("orders")
        .update(orderUpdatePayload)
        .or(`id.eq.${orderId},tracking_code.eq.${orderId}`);
    }

    // 11. Journalisation idempotente dans `webhook_logs`
    await supabase.from("webhook_logs").upsert({
      id: `whlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      provider: "geniuspay",
      event_type: eventType,
      event_id: eventId,
      provider_transaction_id: providerTransactionId,
      signature_header: signatureHeader || null,
      payload: parsedPayload,
      processed: true,
      processed_at: nowIso,
    });

    console.log(`[geniuspay-webhook] Event ${eventType} processed for order: ${orderId}, tx: ${providerTransactionId}`);

    return new Response(
      JSON.stringify({
        success: true,
        event: eventType,
        status: mappedPaymentStatus,
        orderId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[geniuspay-webhook] Unhandled processing error:", err.message || err);

    return new Response(
      JSON.stringify({ error: "Internal processing error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
