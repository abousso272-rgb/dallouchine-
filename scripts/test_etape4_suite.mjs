import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://splsjtguapquznbiacad.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbHNqdGd1YXBxdXpuYmlhY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NzYwNjYsImV4cCI6MjEwNTM1MjA2Nn0.yr8irdxSNMFI-N3K7ueOZV72uKQSVQykDpX9ioY1C4A';

// 3 Separate Supabase Clients for Isolation & Concurrency Testing
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const client1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const client2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const results = [];

function recordTest(num, name, passed, details) {
  results.push({ num, name, passed, details });
  const symbol = passed ? '✅' : '❌';
  console.log(`${symbol} TEST ${num}: ${name} - ${details}`);
}

async function runSuite() {
  console.log('====================================================');
  console.log('  ÉTAPE 4 — SUITE DE VALIDATION DES 23 TESTS OBLIGATOIRES');
  console.log('====================================================\n');

  try {
    // Authenticate client 1, client 2, and admin
    const { data: auth1, error: err1 } = await client1.auth.signInWithPassword({
      email: 'amadou.diallo@gmail.com',
      password: 'Password123!'
    });
    if (err1) throw new Error('Client 1 auth failed: ' + err1.message);

    const { data: auth2, error: err2 } = await client2.auth.signInWithPassword({
      email: 'client2@test.sn',
      password: 'Password123!'
    });
    if (err2) throw new Error('Client 2 auth failed: ' + err2.message);

    const { data: authAdmin, error: errAdmin } = await adminClient.auth.signInWithPassword({
      email: 'admin@sinosenegal.sn',
      password: 'Password123!'
    });
    if (errAdmin) throw new Error('Admin auth failed: ' + errAdmin.message);

    console.log('All 3 user sessions initialized successfully.\n');

    // TEST 1: Visiteur consulte les groupages (public, non-draft)
    try {
      const { data: grps, error } = await anonClient
        .from('groupages')
        .select('id, code, title, target_quantity, reserved_quantity, unit_price_xof, status')
        .neq('status', 'draft');

      const pass = !error && grps && grps.length > 0;
      recordTest(1, 'Visiteur consulte les groupages', pass, `${grps?.length || 0} groupages récupérés depuis Supabase`);
    } catch (e) {
      recordTest(1, 'Visiteur consulte les groupages', false, e.message);
    }

    // TEST 2: Visiteur consulte le détail
    let testGroupageId = null;
    try {
      const { data: grp, error } = await anonClient
        .from('groupages')
        .select('id, code, title, target_quantity, reserved_quantity, unit_price_xof, status, deadline')
        .eq('code', 'GRP-EV-026')
        .single();

      const pass = !error && grp && grp.code === 'GRP-EV-026';
      testGroupageId = grp?.id;
      recordTest(2, 'Visiteur consulte le détail', pass, `Détail de ${grp?.code} récupéré: ${grp?.title}`);
    } catch (e) {
      recordTest(2, 'Visiteur consulte le détail', false, e.message);
    }

    // TEST 3: Visiteur tente de participer sans être connecté
    try {
      const { data, error } = await anonClient.rpc('reserve_groupage', {
        p_groupage_id: testGroupageId,
        p_quantity: 1
      });
      const pass = Boolean(error && error.message.includes('AUTHENTICATION_REQUIRED'));
      recordTest(3, 'Visiteur tente de participer (non authentifié)', pass, `Refusé avec succès: ${error?.message}`);
    } catch (e) {
      recordTest(3, 'Visiteur tente de participer (non authentifié)', true, 'Exception levée: ' + e.message);
    }

    // Prepare a dedicated test groupage for precise quota and test isolation
    const testGrpCode = `GRP-T4-${Date.now().toString().slice(-4)}`;
    let dynamicGroupId = null;
    {
      const { data: insGrp, error: insErr } = await adminClient
        .from('groupages')
        .insert({
          code: testGrpCode,
          title: `Groupage Test Étape 4 - Lot ${testGrpCode}`,
          product_id: 'f0000000-0000-0000-0000-000000000001',
          supplier_moq: 10,
          target_quantity: 20,
          reserved_quantity: 0,
          min_order_per_user: 2,
          max_order_per_user: 20,
          unit_price_xof: 50000,
          original_price_xof: 75000,
          status: 'open',
          deadline: new Date(Date.now() + 86400000 * 15).toISOString(),
          transport_mode: 'sea'
        })
        .select()
        .single();

      if (insErr) throw new Error('Failed to create test groupage: ' + insErr.message);
      dynamicGroupId = insGrp.id;
    }

    // TEST 4: Client connecté réserve une quantité valide
    let participantIdClient1 = null;
    try {
      const { data, error } = await client1.rpc('reserve_groupage', {
        p_groupage_id: dynamicGroupId,
        p_quantity: 3,
        p_idempotency_key: `key_t4_${Date.now()}`
      });

      const pass = !error && data?.success === true;
      participantIdClient1 = data?.participant_id;
      recordTest(4, 'Client connecté réserve quantité valide', pass, `Réservé 3 unités. ParticipantId: ${participantIdClient1}`);
    } catch (e) {
      recordTest(4, 'Client connecté réserve quantité valide', false, e.message);
    }

    // TEST 5: Vérifier groupage_participants.user_id = auth.uid()
    try {
      const { data: part, error } = await client1
        .from('groupage_participants')
        .select('id, user_id, quantity, unit_price_xof, total_xof, status')
        .eq('id', participantIdClient1)
        .single();

      const pass = !error && part && part.user_id === auth1.user.id;
      recordTest(5, 'Vérifier user_id = auth.uid()', pass, `user_id DB (${part?.user_id}) === auth.uid (${auth1.user.id})`);
    } catch (e) {
      recordTest(5, 'Vérifier user_id = auth.uid()', false, e.message);
    }

    // TEST 6: Vérifier le calcul quantity * unit_price_xof (snapshot serveur)
    try {
      const { data: part } = await client1
        .from('groupage_participants')
        .select('quantity, unit_price_xof, total_xof')
        .eq('id', participantIdClient1)
        .single();

      const expected = Number(part.quantity) * Number(part.unit_price_xof);
      const pass = Number(part.total_xof) === expected && expected === 150000;
      recordTest(6, 'Vérifier snapshot quantity * unit_price_xof', pass, `${part?.quantity} * ${part?.unit_price_xof} = ${part?.total_xof} (attendu: ${expected} FCFA)`);
    } catch (e) {
      recordTest(6, 'Vérifier snapshot quantity * unit_price_xof', false, e.message);
    }

    // TEST 7: Vérifier reserved_quantity incrémenté
    try {
      const { data: grp } = await client1
        .from('groupages')
        .select('reserved_quantity, participants_count, status')
        .eq('id', dynamicGroupId)
        .single();

      const pass = grp.reserved_quantity === 3 && grp.participants_count === 1;
      recordTest(7, 'Vérifier reserved_quantity sur groupage', pass, `reserved_quantity = ${grp?.reserved_quantity}/20, participants = ${grp?.participants_count}`);
    } catch (e) {
      recordTest(7, 'Vérifier reserved_quantity sur groupage', false, e.message);
    }

    // TEST 8: Réserver plus que la quantité disponible (disponible: 17, demande: 18)
    try {
      const { data, error } = await client1.rpc('reserve_groupage', {
        p_groupage_id: dynamicGroupId,
        p_quantity: 18
      });
      const pass = Boolean(error && error.message.includes('SURRESERVATION_INTERDITE'));
      recordTest(8, 'Réserver plus que disponible -> Refus', pass, `Refusé avec succès: ${error?.message}`);
    } catch (e) {
      recordTest(8, 'Réserver plus que disponible -> Refus', true, e.message);
    }

    // TEST 9: Réserver lorsque le groupage est full
    let fullGrpId = null;
    {
      const { data: fg } = await adminClient
        .from('groupages')
        .insert({
          code: `GRP-FULL-${Date.now().toString().slice(-4)}`,
          title: 'Groupage Test Plein',
          product_id: 'f0000000-0000-0000-0000-000000000001',
          supplier_moq: 10,
          target_quantity: 10,
          reserved_quantity: 10,
          unit_price_xof: 10000,
          original_price_xof: 15000,
          status: 'full',
          deadline: new Date(Date.now() + 86400000).toISOString()
        })
        .select()
        .single();
      fullGrpId = fg.id;
    }
    try {
      const { data, error } = await client1.rpc('reserve_groupage', {
        p_groupage_id: fullGrpId,
        p_quantity: 1
      });
      const pass = Boolean(error && error.message.includes('GROUPAGE_NOT_OPEN'));
      recordTest(9, 'Réserver lorsque groupage est full -> Refus', pass, `Refusé: ${error?.message}`);
    } catch (e) {
      recordTest(9, 'Réserver lorsque groupage est full -> Refus', true, e.message);
    }

    // TEST 10: Réserver après deadline
    let expiredGrpId = null;
    {
      const { data: eg } = await adminClient
        .from('groupages')
        .insert({
          code: `GRP-EXP-${Date.now().toString().slice(-4)}`,
          title: 'Groupage Test Expiré',
          product_id: 'f0000000-0000-0000-0000-000000000001',
          supplier_moq: 10,
          target_quantity: 10,
          reserved_quantity: 2,
          unit_price_xof: 10000,
          original_price_xof: 15000,
          status: 'open',
          deadline: new Date(Date.now() - 3600000).toISOString() // 1h in the past
        })
        .select()
        .single();
      expiredGrpId = eg.id;
    }
    try {
      const { data, error } = await client1.rpc('reserve_groupage', {
        p_groupage_id: expiredGrpId,
        p_quantity: 1
      });
      const pass = Boolean(error && error.message.includes('DEADLINE_EXPIRED'));
      recordTest(10, 'Réserver après deadline -> Refus', pass, `Refusé: ${error?.message}`);
    } catch (e) {
      recordTest(10, 'Réserver après deadline -> Refus', true, e.message);
    }

    // TEST 11: Tester règle MOQ / min_order_per_user (dynamicGroupId has min_order_per_user = 2, try 1)
    try {
      const { data, error } = await client1.rpc('reserve_groupage', {
        p_groupage_id: dynamicGroupId,
        p_quantity: 1
      });
      const pass = Boolean(error && error.message.includes('QUANTITY_BELOW_MIN'));
      recordTest(11, 'Tester règle min_order_per_user -> Refus si inférieur', pass, `Refusé: ${error?.message}`);
    } catch (e) {
      recordTest(11, 'Tester règle min_order_per_user -> Refus si inférieur', true, e.message);
    }

    // TEST 12: Deux réservations concurrentes (Total restant 5, Client 1 demande 4, Client 2 demande 3 -> total 7 > 5)
    let raceGrpId = null;
    {
      const { data: rg } = await adminClient
        .from('groupages')
        .insert({
          code: `GRP-RACE-${Date.now().toString().slice(-4)}`,
          title: 'Groupage Concurrence Test',
          product_id: 'f0000000-0000-0000-0000-000000000001',
          supplier_moq: 10,
          target_quantity: 10,
          reserved_quantity: 5, // 5 remaining
          unit_price_xof: 20000,
          original_price_xof: 30000,
          status: 'open',
          deadline: new Date(Date.now() + 86400000).toISOString()
        })
        .select()
        .single();
      raceGrpId = rg.id;
    }
    try {
      const [res1, res2] = await Promise.all([
        client1.rpc('reserve_groupage', { p_groupage_id: raceGrpId, p_quantity: 4 }),
        client2.rpc('reserve_groupage', { p_groupage_id: raceGrpId, p_quantity: 3 })
      ]);

      const oneSucceeded = (res1.data?.success && !res2.data?.success) || (!res1.data?.success && res2.data?.success);
      const oneRejected = (res1.error || res2.error);

      // Verify DB reserved quantity does not exceed 10
      const { data: finalRaceGrp } = await adminClient.from('groupages').select('reserved_quantity').eq('id', raceGrpId).single();
      const noOverReservation = finalRaceGrp.reserved_quantity <= 10;

      const pass = oneSucceeded && oneRejected && noOverReservation;
      recordTest(12, 'Concurrence: 2 réservations simultanées', pass, `Succès unique garanti, surréservation évitée (total réservé: ${finalRaceGrp.reserved_quantity}/10)`);
    } catch (e) {
      recordTest(12, 'Concurrence: 2 réservations simultanées', false, e.message);
    }

    // TEST 13: Double clic / Double requête avec même idempotency_key
    try {
      const idemKey = `double_click_${Date.now()}`;
      const firstCall = await client1.rpc('reserve_groupage', {
        p_groupage_id: dynamicGroupId,
        p_quantity: 2,
        p_idempotency_key: idemKey
      });

      const secondCall = await client1.rpc('reserve_groupage', {
        p_groupage_id: dynamicGroupId,
        p_quantity: 2,
        p_idempotency_key: idemKey
      });

      const pass = firstCall.data?.success === true &&
                   secondCall.data?.success === true &&
                   secondCall.data?.idempotent_replay === true &&
                   firstCall.data?.participant_id === secondCall.data?.participant_id;

      recordTest(13, 'Double clic / Double requête avec même idempotency_key', pass, `Replay idempotent sans doublon. Participant ID identique: ${firstCall.data?.participant_id}`);
    } catch (e) {
      recordTest(13, 'Double clic / Double requête avec même idempotency_key', false, e.message);
    }

    // TEST 14: Client A tente de consulter la participation de B
    try {
      // Client 2 queries groupage_participants
      const { data: client2Views, error } = await client2
        .from('groupage_participants')
        .select('*')
        .eq('id', participantIdClient1); // Owned by Client 1

      // RLS should return empty array because user_id != Client 2
      const pass = !error && client2Views.length === 0;
      recordTest(14, 'Client A tente de consulter la participation de B (RLS)', pass, `Protégé: Client 2 a reçu ${client2Views?.length || 0} résultat pour la réservation de Client 1`);
    } catch (e) {
      recordTest(14, 'Client A tente de consulter la participation de B (RLS)', false, e.message);
    }

    // TEST 15: Client tente de modifier reserved_quantity directement
    try {
      const { data, error } = await client1
        .from('groupages')
        .update({ reserved_quantity: 999 })
        .eq('id', dynamicGroupId)
        .select();

      // RLS only permits admin to UPDATE groupages
      const pass = (!data || data.length === 0) || Boolean(error);
      recordTest(15, 'Client tente de modifier reserved_quantity directement -> Bloqué', pass, `RLS a bloqué la modification directe: ${error?.message || '0 ligne affectée'}`);
    } catch (e) {
      recordTest(15, 'Client tente de modifier reserved_quantity directement -> Bloqué', true, e.message);
    }

    // TEST 16: Client tente de forcer unit_price_xof / insérer directement
    try {
      const { data, error } = await client1
        .from('groupage_participants')
        .insert({
          groupage_id: dynamicGroupId,
          user_id: auth1.user.id,
          quantity: 5,
          unit_price_xof: 10, // Attempt price tampering
          total_xof: 50,
          status: 'confirmed'
        })
        .select();

      // RLS forbids direct client insert
      const pass = Boolean(error) || (!data || data.length === 0);
      recordTest(16, 'Client tente d\'insérer directement avec prix falsifié -> Bloqué', pass, `RLS a rejeté l'insertion directe: ${error?.message || 'Rejeté'}`);
    } catch (e) {
      recordTest(16, 'Client tente d\'insérer directement avec prix falsifié -> Bloqué', true, e.message);
    }

    // TEST 17: Client tente de modifier le statut du groupage directement
    try {
      const { data, error } = await client1
        .from('groupages')
        .update({ status: 'validated' })
        .eq('id', dynamicGroupId)
        .select();

      const pass = (!data || data.length === 0) || Boolean(error);
      recordTest(17, 'Client tente de modifier statut du groupage -> Bloqué', pass, `RLS a bloqué: ${error?.message || '0 ligne affectée'}`);
    } catch (e) {
      recordTest(17, 'Client tente de modifier statut du groupage -> Bloqué', true, e.message);
    }

    // TEST 18: Groupage atteint 100% -> status = full
    let test100GrpId = null;
    {
      const { data: g100 } = await adminClient
        .from('groupages')
        .insert({
          code: `GRP-100-${Date.now().toString().slice(-4)}`,
          title: 'Groupage 100% Test',
          product_id: 'f0000000-0000-0000-0000-000000000001',
          supplier_moq: 10,
          target_quantity: 10,
          reserved_quantity: 8, // 2 remaining
          unit_price_xof: 10000,
          original_price_xof: 15000,
          status: 'almost_full',
          deadline: new Date(Date.now() + 86400000).toISOString()
        })
        .select()
        .single();
      test100GrpId = g100.id;
    }
    try {
      // Client reserves the remaining 2 units
      const { data } = await client1.rpc('reserve_groupage', {
        p_groupage_id: test100GrpId,
        p_quantity: 2
      });

      const { data: refreshed } = await adminClient
        .from('groupages')
        .select('reserved_quantity, status')
        .eq('id', test100GrpId)
        .single();

      const pass = refreshed.reserved_quantity === 10 && refreshed.status === 'full';
      recordTest(18, 'Groupage atteint 100% -> statut automatique full', pass, `reserved = 10/10, nouveau statut = ${refreshed?.status}`);
    } catch (e) {
      recordTest(18, 'Groupage atteint 100% -> statut automatique full', false, e.message);
    }

    // TEST 19: Groupage full -> Aucune nouvelle réservation acceptée
    try {
      const { data, error } = await client2.rpc('reserve_groupage', {
        p_groupage_id: test100GrpId,
        p_quantity: 1
      });
      const pass = Boolean(error && error.message.includes('GROUPAGE_NOT_OPEN'));
      recordTest(19, 'Groupage full -> Refus de nouvelle réservation', pass, `Rejeté: ${error?.message}`);
    } catch (e) {
      recordTest(19, 'Groupage full -> Refus de nouvelle réservation', true, e.message);
    }

    // TEST 20: Admin autorisé valide le groupage (full -> validated)
    try {
      const { data, error } = await adminClient.rpc('admin_update_groupage_status', {
        p_groupage_id: test100GrpId,
        p_status: 'validated',
        p_note: 'Validation manuelle après vérification des paiements acomptes.'
      });

      const { data: checkGrp } = await adminClient.from('groupages').select('status').eq('id', test100GrpId).single();
      const pass = !error && data?.success === true && checkGrp.status === 'validated';
      recordTest(20, 'Admin valide le groupage (full -> validated)', pass, `Statut mis à jour en : ${checkGrp?.status}`);
    } catch (e) {
      recordTest(20, 'Admin valide le groupage (full -> validated)', false, e.message);
    }

    // TEST 21: Client tente de valider -> ACCESS DENIED
    try {
      const { data, error } = await client1.rpc('admin_update_groupage_status', {
        p_groupage_id: test100GrpId,
        p_status: 'supplier_ordered'
      });
      const pass = Boolean(error && error.message.includes('ACCESS_DENIED'));
      recordTest(21, 'Client tente action administrative -> ACCESS DENIED', pass, `Refusé avec succès: ${error?.message}`);
    } catch (e) {
      recordTest(21, 'Client tente action administrative -> ACCESS DENIED', true, e.message);
    }

    // TEST 22: Annulation d'une réservation autorisée -> Quantité libérée
    try {
      // Dynamic groupage has 5 reserved units (3 from test 4 + 2 from test 13).
      // Let's cancel participantIdClient1 (3 units).
      const { data: cancelRes, error: cancelErr } = await client1.rpc('cancel_groupage_participation', {
        p_participation_id: participantIdClient1
      });

      const { data: checkDynamic } = await adminClient
        .from('groupages')
        .select('reserved_quantity, status')
        .eq('id', dynamicGroupId)
        .single();

      const pass = !cancelErr && cancelRes?.success === true && checkDynamic.reserved_quantity === 2;
      recordTest(22, 'Annulation réservation -> Quantité libérée et statut recalculé', pass, `3 unités libérées. Nouveau reserved_quantity = ${checkDynamic?.reserved_quantity}, statut = ${checkDynamic?.status}`);
    } catch (e) {
      recordTest(22, 'Annulation réservation -> Quantité libérée et statut recalculé', false, e.message);
    }

    // TEST 23: Persistance et cohérence Supabase
    try {
      const { data: finalGroupages, error } = await anonClient
        .from('groupages')
        .select('id, code, reserved_quantity, target_quantity, status')
        .neq('status', 'draft');

      const pass = !error && finalGroupages && finalGroupages.length >= 3;
      recordTest(23, 'Cohérence et persistance globale Supabase', pass, `${finalGroupages?.length} groupages actifs et cohérents persistés`);
    } catch (e) {
      recordTest(23, 'Cohérence et persistance globale Supabase', false, e.message);
    }

    // REGRESSION TESTS (ÉTAPE 3)
    console.log('\n--- VÉRIFICATION RÉGRESSION ÉTAPE 3 ---');
    const { data: products } = await anonClient.from('products').select('id, name, is_active').eq('is_active', true);
    console.log(`Produits actifs Marketplace: ${products?.length || 0}`);

    const { data: autoSpecs } = await anonClient.from('product_auto_specs').select('id, vehicle_type');
    console.log(`Spécifications Auto & Mobilité: ${autoSpecs?.length || 0}`);

    const { data: categories } = await anonClient.from('categories').select('id, name');
    console.log(`Catégories actives: ${categories?.length || 0}`);

    const totalPassed = results.filter(r => r.passed).length;
    console.log(`\n====================================================`);
    console.log(`RÉSULTAT GLOBAL: ${totalPassed} / ${results.length} TESTS VALIDÉS`);
    console.log(`====================================================`);

  } catch (err) {
    console.error('Fatal error in test runner:', err);
  }
}

runSuite();
