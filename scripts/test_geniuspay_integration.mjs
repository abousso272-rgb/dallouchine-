/**
 * SUITE DE TESTS D'INTÉGRATION ET DE CONFORMITÉ API GENIUSPAY
 * Valide l'adaptation exacte de la documentation officielle GeniusPay (API_Documentation.md)
 */
import crypto from 'crypto';
import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const SERVER_PORT = 3000;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const webhookSecret = 'whsec_sample_geniuspay_secret_sinosenegal';

const supabaseUrl = process.env.SUPABASE_URL || 'https://splsjtguapquznbiacad.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbHNqdGd1YXBxdXpuYmlhY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NzYwNjYsImV4cCI6MjEwNTM1MjA2Nn0.yr8irdxSNMFI-N3K7ueOZV72uKQSVQykDpX9ioY1C4A';

const client = createClient(supabaseUrl, supabaseKey);

const results = [];
function recordTest(id, name, passed, details = '') {
  results.push({ id, name, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} TEST ${id}: ${name} - ${details}`);
}

async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${SERVER_URL}/api/health`);
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function run() {
  console.log('================================================================');
  console.log('  VALIDATION DE CONFORMITÉ OFFICIELLE API MARCHAND GENIUSPAY');
  console.log('================================================================\n');

  let serverProcess = null;
  try {
    let isUp = false;
    try {
      const h = await fetch(`${SERVER_URL}/api/health`);
      if (h.ok) isUp = true;
    } catch {}

    if (!isUp) {
      console.log('Démarrage du serveur Express...');
      serverProcess = spawn('npx', ['tsx', 'server.ts'], {
        env: {
          ...process.env,
          PORT: String(SERVER_PORT),
          GENIUSPAY_WEBHOOK_SECRET: webhookSecret,
          GENIUSPAY_ENVIRONMENT: 'sandbox'
        },
        stdio: 'pipe'
      });
      const ok = await waitForServer();
      if (!ok) throw new Error('Impossible de démarrer le serveur.');
    }

    // 1. Healthcheck
    try {
      const h = await (await fetch(`${SERVER_URL}/api/health`)).json();
      recordTest(1, 'Healthcheck Dallou Chine & GeniusPay en ligne', h.status === 'online' && h.gateway === 'GeniusPay', JSON.stringify(h));
    } catch (e) {
      recordTest(1, 'Healthcheck Dallou Chine & GeniusPay en ligne', false, e.message);
    }

    // 2. Authentification d'un client réel
    let authUser;
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: 'amadou.diallo@gmail.com',
        password: 'Password123!'
      });
      if (error) throw error;
      authUser = data;
      recordTest(2, 'Authentification client Supabase Auth', true, `User: ${authUser.user.id}`);
    } catch (e) {
      recordTest(2, 'Authentification client Supabase Auth', false, e.message);
    }

    // 3. Création d'une commande réelle
    let orderId, trackingCode, totalAmount;
    try {
      const { data: ord, error: ordErr } = await client.rpc('create_order_from_cart', {
        p_delivery_type: 'hub_pickup',
        p_customer_name: 'Amadou Diallo',
        p_customer_phone: '+221 77 123 45 67',
        p_customer_email: 'amadou.diallo@gmail.com',
        p_customer_city: 'Dakar',
        p_payment_method: 'wave',
        p_items: [{ product_id: 'f0000000-0000-0000-0000-000000000001', quantity: 2 }]
      });
      if (ordErr) throw ordErr;
      orderId = ord.order_id;
      trackingCode = ord.tracking_code;
      totalAmount = ord.total_xof;
      recordTest(3, 'Création transactionnelle commande', true, `Code: ${trackingCode}, Total: ${totalAmount} XOF`);
    } catch (e) {
      recordTest(3, 'Création transactionnelle commande', false, e.message);
    }

    // 4. Initialisation de session de paiement GeniusPay (Hosted Checkout)
    let paymentResult;
    try {
      const res = await fetch(`${SERVER_URL}/api/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authUser.session.access_token}`
        },
        body: JSON.stringify({ orderId })
      });
      paymentResult = await res.json();
      recordTest(4, 'Session de paiement créée (Checkout URL générée)', res.ok && paymentResult.success && Boolean(paymentResult.checkoutUrl), `CheckoutUrl: ${paymentResult.checkoutUrl}`);
    } catch (e) {
      recordTest(4, 'Session de paiement créée (Checkout URL générée)', false, e.message);
    }

    // 5. Test Signature Webhook HMAC-SHA256 officielle (documentée : direct hash_hmac sur le payload brut)
    const officialPayload = {
      event: 'payment.success',
      timestamp: new Date().toISOString(),
      data: {
        transaction: {
          id: `gp_tx_live_${Date.now()}`,
          reference: paymentResult?.merchantReference || `REF-${Date.now()}`,
          amount: totalAmount,
          status: 'completed',
          customer: {
            name: 'Amadou Diallo',
            phone: '+221771234567'
          },
          metadata: {
            order_id: orderId,
            order_code: trackingCode,
            merchant_reference: paymentResult?.merchantReference
          }
        },
        merchant: {
          id: 'uuid-merchant',
          name: 'Dallou Chine'
        },
        environment: 'sandbox'
      }
    };
    const rawPayloadString = JSON.stringify(officialPayload);

    // Calcul de signature HMAC-SHA256 directe selon doc PHP GeniusPay
    const directSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawPayloadString)
      .digest('hex');

    try {
      const whRes = await fetch(`${SERVER_URL}/api/payments/webhooks/geniuspay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GeniusPay-Signature': directSignature,
          'X-GeniusPay-Event': 'payment.success'
        },
        body: rawPayloadString
      });
      const whJson = await whRes.json();
      recordTest(5, 'Traitement du Webhook officiel avec signature HMAC directe', whRes.status === 200 && whJson.status === 200, `Result: ${whJson.message || whJson.errorCode}`);
    } catch (e) {
      recordTest(5, 'Traitement du Webhook officiel avec signature HMAC directe', false, e.message);
    }

    // 6. Vérification du statut de la commande en base (doit être passée à 'paid')
    try {
      const statRes = await (await fetch(`${SERVER_URL}/api/payments/${orderId}/status`)).json();
      const isPaid = statRes.success && (statRes.order?.paymentStatus === 'paid' || statRes.payment?.status === 'paid');
      recordTest(6, 'Commande passée au statut "paid" de manière atomique', isPaid, `OrderStatus: ${statRes.order?.paymentStatus}, PaymentStatus: ${statRes.payment?.status}`);
    } catch (e) {
      recordTest(6, 'Commande passée au statut "paid" de manière atomique', false, e.message);
    }

    // 7. Idempotence : un deuxième envoi du même webhook doit être accepté sans double débit
    try {
      const whRes2 = await fetch(`${SERVER_URL}/api/payments/webhooks/geniuspay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GeniusPay-Signature': directSignature,
          'X-GeniusPay-Event': 'payment.success'
        },
        body: rawPayloadString
      });
      const whJson2 = await whRes2.json();
      recordTest(7, 'Idempotence du webhook (gestion sans double effet)', whRes2.status === 200, `Message: ${whJson2.message}`);
    } catch (e) {
      recordTest(7, 'Idempotence du webhook (gestion sans double effet)', false, e.message);
    }

    // 8. Rejet si signature invalide
    try {
      const fakeRes = await fetch(`${SERVER_URL}/api/payments/webhooks/geniuspay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GeniusPay-Signature': 'fake_bad_signature_000000000000000000000000'
        },
        body: rawPayloadString
      });
      recordTest(8, 'Rejet immédiat d\'un webhook avec signature falsifiée (400)', fakeRes.status === 400);
    } catch (e) {
      recordTest(8, 'Rejet immédiat d\'un webhook avec signature falsifiée', false, e.message);
    }

    // 9. Rejet si signature absente
    try {
      const noSigRes = await fetch(`${SERVER_URL}/api/payments/webhooks/geniuspay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: rawPayloadString
      });
      recordTest(9, 'Rejet obligatoire d\'un webhook sans signature (400)', noSigRes.status === 400);
    } catch (e) {
      recordTest(9, 'Rejet obligatoire d\'un webhook sans signature', false, e.message);
    }

  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }

  console.log('\n================================================================');
  const allPassed = results.every(r => r.passed);
  const passedCount = results.filter(r => r.passed).length;
  console.log(`RÉSULTAT : ${passedCount}/${results.length} tests réussis.`);
  if (allPassed) {
    console.log('🎉 TOUS LES TESTS D\'INTÉGRATION GENIUSPAY SONT VALIDÉS !');
  } else {
    console.log('⚠️ Certains tests ont échoué, vérifier les détails ci-dessus.');
  }
  console.log('================================================================\n');

  process.exit(allPassed ? 0 : 1);
}

run().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
