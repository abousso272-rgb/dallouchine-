/**
 * TEST DE CONCURRENCE RÉEL — CALCUL LOGISTIQUE
 * Vérifie que deux appels simultanés stricts à calculate_order_logistics
 * ne créent qu'un seul et unique snapshot dans logistics_costs.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://splsjtguapquznbiacad.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbHNqdGd1YXBxdXpuYmlhY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NzYwNjYsImV4cCI6MjEwNTM1MjA2Nn0.yr8irdxSNMFI-N3K7ueOZV72uKQSVQykDpX9ioY1C4A';

const adminClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } });
const client1 = createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function runConcurrencyTest() {
  console.log('====================================================');
  console.log('  TEST DE CONCURRENCE RÉEL SUR CALCUL LOGISTIQUE');
  console.log('====================================================\n');

  try {
    // 1. Connexion client 1
    const { data: auth1, error: err1 } = await client1.auth.signInWithPassword({
      email: 'amadou.diallo@gmail.com',
      password: 'Password123!'
    });
    if (err1) throw err1;

    // 2. Connexion admin
    await adminClient.auth.signInWithPassword({
      email: 'admin@sinosenegal.sn',
      password: 'Password123!'
    });

    // 3. Création d'une nouvelle commande dédiée pour le test
    const { data: orderCreate, error: ordErr } = await client1.rpc('create_order_from_cart', {
      p_delivery_type: 'home_delivery',
      p_customer_name: 'Amadou Diallo',
      p_idempotency_key: `concurrency_test_${Date.now()}`,
      p_items: [{ product_id: 'f0000000-0000-0000-0000-000000000001', quantity: 1 }]
    });
    if (ordErr) throw ordErr;

    const orderId = orderCreate.order_id;
    console.log(`Commande de test créée: ${orderId}`);

    // 4. Lancement de 2 appels RPC calculate_order_logistics strictement simultanés via Promise.all
    console.log('Lancement de 2 appels concurrents simultanés...');
    const startTime = Date.now();
    const [res1, res2] = await Promise.all([
      client1.rpc('calculate_order_logistics', { p_order_id: orderId, p_transport_mode: 'air' }),
      client1.rpc('calculate_order_logistics', { p_order_id: orderId, p_transport_mode: 'air' })
    ]);
    const duration = Date.now() - startTime;

    console.log(`Exécution terminée en ${duration}ms.`);
    console.log(`Résultat Appel 1 - Succès: ${!res1.error}, Frais: ${res1.data?.customer_shipping_fee}`);
    console.log(`Résultat Appel 2 - Succès: ${!res2.error}, Frais: ${res2.data?.customer_shipping_fee}`);

    // 5. Vérification du nombre de lignes dans logistics_costs
    const { data: rows, error: countErr } = await adminClient
      .from('logistics_costs')
      .select('id, transport_mode, customer_fee, created_at, updated_at')
      .eq('order_id', orderId)
      .eq('transport_mode', 'air');

    if (countErr) throw countErr;

    console.log(`\nNombre de snapshots trouvés en base : ${rows.length}`);
    rows.forEach((r, idx) => {
      console.log(`  [Snapshot ${idx + 1}] ID: ${r.id}, Frais: ${r.customer_fee} FCFA`);
    });

    const isSuccess = rows.length === 1 && !res1.error && !res2.error && res1.data?.customer_shipping_fee === res2.data?.customer_shipping_fee;

    if (isSuccess) {
      console.log('\n✅ TEST CONCURRENCE RÉUSSI : 1 seul snapshot créé, aucune duplication possible grâce au verrou FOR UPDATE et à la contrainte UNIQUE ON CONFLICT.');
    } else {
      console.error('\n❌ ÉCHEC DU TEST DE CONCURRENCE : Anomalie détectée.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Erreur test concurrence:', error);
    process.exit(1);
  }
}

runConcurrencyTest();
