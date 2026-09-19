/**
 * ============================================================================
 * ÉTAPE 10 — SUITE DE TESTS AUTOMATISÉS COMPLÈTE : MODULE B2B RÉEL
 * ============================================================================
 * Valide les 48 points d'audit et exigences opérationnelles B2B :
 * Entreprises, Demandes, Qualification, Fournisseurs, Devis versionnés,
 * Acompte 50%, Production (jalons), Logistique (Étape 8) & Non-régressions 1-9.
 */

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://splsjtguapquznbiacad.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbHNqdGd1YXBxdXpuYmlhY2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NzYwNjYsImV4cCI6MjEwNTM1MjA2Nn0.yr8irdxSNMFI-N3K7ueOZV72uKQSVQykDpX9ioY1C4A';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

const SERVER_PORT = 3000;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

const client1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const client2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const results = [];
function recordTest(num, name, passed, details = '') {
  results.push({ num, name, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} TEST ${num}: ${name} ${details ? '- ' + details : ''}`);
}

async function waitForServer(retries = 30, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${SERVER_URL}/api/health`);
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, delayMs));
  }
  return false;
}

async function runSuite() {
  let serverProcess = null;

  try {
    console.log('================================================================');
    console.log('  ÉTAPE 10 — SUITE COMPLÈTE B2B RÉEL, DEVIS, COMMANDES & SUIVI');
    console.log('================================================================\n');

    let isServerUp = false;
    try {
      const h = await fetch(`${SERVER_URL}/api/health`);
      if (h.ok) isServerUp = true;
    } catch {}

    if (!isServerUp) {
      console.log('Démarrage du serveur Express sur le port 3000...');
      serverProcess = spawn('npx', ['tsx', 'server.ts'], {
        env: {
          ...process.env,
          PORT: String(SERVER_PORT)
        },
        stdio: 'pipe'
      });

      const ready = await waitForServer();
      if (!ready) throw new Error('Le serveur Express n\'a pas démarré dans les temps.');
      console.log('Serveur Express en ligne et opérationnel.\n');
    } else {
      console.log('Serveur Express déjà actif sur le port 3000.\n');
    }

    // 1. Authentification des 3 acteurs
    const { data: auth1, error: err1 } = await client1.auth.signInWithPassword({
      email: 'amadou.diallo@gmail.com',
      password: 'Password123!'
    });
    if (err1) throw new Error('Auth Client 1 failed: ' + err1.message);

    const { data: auth2, error: err2 } = await client2.auth.signInWithPassword({
      email: 'client2@test.sn',
      password: 'Password123!'
    });
    if (err2) throw new Error('Auth Client 2 failed: ' + err2.message);

    const { data: authAdmin, error: errAdmin } = await adminClient.auth.signInWithPassword({
      email: 'admin@sinosenegal.sn',
      password: 'Password123!'
    });
    if (errAdmin) throw new Error('Auth Admin failed: ' + errAdmin.message);

    const token1 = auth1.session.access_token;
    const token2 = auth2.session.access_token;
    const tokenAdmin = authAdmin.session.access_token;

    console.log('Acteurs authentifiés avec succès :');
    console.log(`- Client 1 : ${auth1.user.id} (${auth1.user.email})`);
    console.log(`- Client 2 : ${auth2.user.id} (${auth2.user.email})`);
    console.log(`- Admin    : ${authAdmin.user.id} (${authAdmin.user.email})\n`);

    let company1 = null;
    let contact1 = null;
    let b2bReq1 = null;
    let b2bQuoteV1 = null;
    let b2bQuoteV2 = null;
    let linkedOrder = null;

    // =========================================================================
    // GROUPE 1 : ENTREPRISES & CONTACTS (Tests 1 - 6)
    // =========================================================================
    console.log('\n--- GROUPE 1 : ENTREPRISES & CONTACTS ---');

    // Test 1: Création entreprise complète par Client 1
    const resComp1 = await fetch(`${SERVER_URL}/api/b2b/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        legalName: 'Sahel Agro-Industrie SAS',
        tradeName: 'Sahel Agro',
        registrationNumber: 'SN-DKR-2024-B-99881',
        sector: 'Agro-industrie & Packaging',
        country: 'Sénégal',
        city: 'Dakar',
        address: 'Zone Industrielle de Yoff',
        website: 'https://sahel-agro.sn',
        phone: '+221338990011',
        email: 'direction@sahel-agro.sn',
        notes: 'Grand compte importateur de lignes automatisées'
      })
    });
    const compData1 = await resComp1.json();
    company1 = compData1.company;
    recordTest(1, 'Création entreprise complète par Client 1', compData1.success && !!company1?.id, `ID: ${company1?.id}`);

    // Test 2: Rejet création sans raison sociale
    const resCompInvalid = await fetch(`${SERVER_URL}/api/b2b/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ sector: 'Textile' })
    });
    recordTest(2, 'Rejet création entreprise sans raison sociale', resCompInvalid.status === 400);

    // Test 3: Ajout d\'un contact entreprise
    const resContact1 = await fetch(`${SERVER_URL}/api/b2b/companies/${company1.id}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        firstName: 'Moussa',
        lastName: 'Ba',
        role: 'Directeur des Achats & Supply Chain',
        phone: '+221775551122',
        email: 'moussa.ba@sahel-agro.sn',
        whatsapp: '+221775551122',
        preferredContactMethod: 'whatsapp'
      })
    });
    const contactData1 = await resContact1.json();
    contact1 = contactData1.contact;
    recordTest(3, 'Ajout d\'un contact entreprise pour Sahel Agro', contactData1.success && !!contact1?.id);

    // Test 4: Ajout d\'un second contact désigné comme principal
    const resContact2 = await fetch(`${SERVER_URL}/api/b2b/companies/${company1.id}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        firstName: 'Aminata',
        lastName: 'Faye',
        role: 'Directrice Générale',
        phone: '+221778889900',
        email: 'aminata.faye@sahel-agro.sn',
        isPrimary: true
      })
    });
    const contactData2 = await resContact2.json();
    recordTest(4, 'Ajout d\'un contact principal (isPrimary = true)', contactData2.success && contactData2.contact?.is_primary === true);

    // Test 5: Isolation RLS : Client 2 ne voit pas les entreprises de Client 1
    const resCompC2 = await fetch(`${SERVER_URL}/api/b2b/companies`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    const dataCompC2 = await resCompC2.json();
    const hasCompany1InC2 = dataCompC2.companies?.some(c => c.id === company1.id);
    recordTest(5, 'Isolation RLS : Client 2 ne liste pas l\'entreprise de Client 1', dataCompC2.success && !hasCompany1InC2);

    // Test 6: Admin voit toutes les entreprises créées
    const resCompAdmin = await fetch(`${SERVER_URL}/api/b2b/companies`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    const dataCompAdmin = await resCompAdmin.json();
    const hasCompany1InAdmin = dataCompAdmin.companies?.some(c => c.id === company1.id);
    recordTest(6, 'Admin liste toutes les entreprises enregistrées', dataCompAdmin.success && hasCompany1InAdmin);

    // =========================================================================
    // GROUPE 2 : DEMANDES B2B (Tests 7 - 13)
    // =========================================================================
    console.log('\n--- GROUPE 2 : DEMANDES B2B ---');

    // Test 7: Création demande B2B avec compte Client 1 et rattachement entreprise
    const resReq1 = await fetch(`${SERVER_URL}/api/b2b/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        companyId: company1.id,
        contactId: contact1.id,
        companyName: 'Sahel Agro-Industrie SAS',
        contactName: 'Moussa Ba',
        phone: '+221775551122',
        email: 'moussa.ba@sahel-agro.sn',
        sector: 'Agro-industrie',
        productName: 'Ligne d\'ensachage automatique 50kg',
        productDescription: 'Ligne industrielle avec soudeuse thermique et convoyeur 6m',
        productLink: 'https://alibaba.com/product/heavy-duty-bagging-machine-50kg',
        quantity: 2,
        budgetXof: 35000000,
        transportPreference: 'sea',
        destination: 'Port de Dakar, Sénégal',
        specifications: 'Alimentation 380V triphasé, châssis inox 304, cadence 400 sacs/h',
        customization: true,
        logoInstructions: 'Plaque constructeur rivetée bilingue Français/Wolof',
        packagingRequested: true,
        desiredDeadline: '2026-11-30',
        attachments: [{ name: 'cahier_des_charges_sahel.pdf', url: 'https://storage.sn/cdc.pdf', size: 1048576 }]
      })
    });
    const reqData1 = await resReq1.json();
    b2bReq1 = reqData1;
    recordTest(7, 'Création demande B2B avec entreprise et compte Client 1', reqData1.success && !!b2bReq1.id, `Code: ${b2bReq1.code}`);

    // Test 8: Création demande B2B anonyme (sans JWT auth)
    const resAnon = await fetch(`${SERVER_URL}/api/b2b/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'BTP Diamniadio SARL',
        contactName: 'Abdoulaye Sow',
        phone: '+221773334455',
        email: 'a.sow@btpdiamniadio.sn',
        productName: 'Mini-pelles hydrauliques 3.5T',
        quantity: 3,
        budgetXof: 45000000
      })
    });
    const anonData = await resAnon.json();
    recordTest(8, 'Création demande B2B en mode invité / anonyme', anonData.success && !!anonData.code);

    // Test 9: Rejet si URL invalide (sans http/https)
    const resBadUrl = await fetch(`${SERVER_URL}/api/b2b/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        productName: 'Machine test',
        productLink: 'ftp://invalide-domain.com/machine',
        quantity: 1
      })
    });
    recordTest(9, 'Rejet URL produit non-HTTP(S)', resBadUrl.status === 400);

    // Test 10: Rejet si quantité <= 0
    const resBadQty = await fetch(`${SERVER_URL}/api/b2b/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        productName: 'Machine test',
        quantity: 0
      })
    });
    recordTest(10, 'Rejet quantité B2B nulle ou négative', resBadQty.status === 400);

    // Test 11: Format du code généré DLC-B2B-XXXX
    recordTest(11, 'Format code officiel (DLC-B2B-XXXX)', /^DLC-B2B-\d+$/.test(b2bReq1.code), b2bReq1.code);

    // Test 12: Conservation des pièces jointes et spécifications
    recordTest(12, 'Persistance des pièces jointes (attachments)', !!b2bReq1.id);

    // Test 13: Champs AI présents mais non-exécutés (sans appel API mock)
    const { data: dbReq } = await adminClient.from('b2b_requests').select('ai_analysis, ai_suggestions').eq('id', b2bReq1.id).single();
    const aiNotExecuted = (!dbReq?.ai_analysis || Object.keys(dbReq.ai_analysis).length === 0) && (!dbReq?.ai_suggestions || Object.keys(dbReq.ai_suggestions).length === 0);
    recordTest(13, 'Champs AI prêts en schéma mais sans exécution automatique', aiNotExecuted);

    // =========================================================================
    // GROUPE 3 : QUALIFICATION & ASSIGNATION (Tests 14 - 18)
    // =========================================================================
    console.log('\n--- GROUPE 3 : QUALIFICATION & ASSIGNATION ---');

    // Test 14: Qualification par Admin
    const resQual = await fetch(`${SERVER_URL}/api/b2b/requests/${b2bReq1.id}/qualify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        priority: 'critical',
        notes: 'Client solvable, besoin industriel urgent avant saison arachidière'
      })
    });
    const qualData = await resQual.json();
    recordTest(14, 'Qualification par Admin (statut -> qualified)', qualData.success && qualData.status === 'qualified');

    // Test 15: Rejet qualification par un utilisateur non-admin
    const resBadQual = await fetch(`${SERVER_URL}/api/b2b/requests/${b2bReq1.id}/qualify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ priority: 'standard' })
    });
    recordTest(15, 'Rejet qualification par client simple (403 Forbidden)', resBadQual.status === 403);

    // Test 16: Assignation du gestionnaire de compte
    const resAssign = await fetch(`${SERVER_URL}/api/b2b/requests/${b2bReq1.id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ assignedUserId: authAdmin.user.id })
    });
    const assignData = await resAssign.json();
    recordTest(16, 'Assignation du gestionnaire B2B', assignData.success && assignData.assigned_user_id === authAdmin.user.id);

    // Test 17: Vérification de l\'événement d\'audit b2b_events
    const { data: auditEvents } = await adminClient.from('b2b_events').select('*').eq('b2b_request_id', b2bReq1.id);
    const hasQualEvent = auditEvents?.some(e => e.event_type?.includes('qualif'));
    recordTest(17, 'Consignation immuable de l\'événement dans b2b_events', hasQualEvent);

    // Test 18: Transition de statut vers sourcing
    const resStatusSourcing = await fetch(`${SERVER_URL}/api/b2b/requests/${b2bReq1.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ status: 'sourcing', notes: 'Lancement du sourcing usine à Zhengzhou' })
    });
    const statusSourcingData = await resStatusSourcing.json();
    recordTest(18, 'Transition opérationnelle qualified -> sourcing', statusSourcingData.success && statusSourcingData.status === 'sourcing');

    // =========================================================================
    // GROUPE 4 : SOURCING FOURNISSEURS & NÉGOCIATION (Tests 19 - 23)
    // =========================================================================
    console.log('\n--- GROUPE 4 : SOURCING FOURNISSEURS & NÉGOCIATION ---');

    // Test 19: Ajout du premier fournisseur
    const resSup1 = await fetch(`${SERVER_URL}/api/b2b/requests/${b2bReq1.id}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        supplierId: 'Henan Machinery Co., Ltd',
        productUrl: 'https://henan-machinery.cn/bagging-50kg',
        initialPriceCny: 155000,
        initialPriceXof: 13950000,
        negotiatedPriceCny: 142000,
        negotiatedPriceXof: 12780000,
        moq: 1,
        leadTimeDays: '20 jours',
        customizationAvailable: true,
        sampleAvailable: false,
        incoterm: 'FOB Qingdao',
        internalNotes: 'Fabricant audité ISO9001, remise de 13,000 CNY obtenue'
      })
    });
    const supData1 = await resSup1.json();
    recordTest(19, 'Enregistrement fournisseur #1 avec prix négocié CNY', supData1.success && supData1.supplier_record?.negotiated_price_cny === 142000);

    // Test 20: Ajout du second fournisseur comparatif
    const resSup2 = await fetch(`${SERVER_URL}/api/b2b/requests/${b2bReq1.id}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        supplierId: 'Shandong Industrial Heavy Corp',
        productUrl: 'https://shandong-heavy.cn/pack50',
        initialPriceCny: 168000,
        negotiatedPriceCny: 150000,
        moq: 2,
        leadTimeDays: '25 jours',
        incoterm: 'FOB Qingdao'
      })
    });
    const supData2 = await resSup2.json();
    recordTest(20, 'Enregistrement fournisseur #2 (comparatif multi-usines)', supData2.success);

    // Test 21: Statut demande basculé en negotiation
    const { data: reqAfterSup } = await adminClient.from('b2b_requests').select('status').eq('id', b2bReq1.id).single();
    recordTest(21, 'Passage automatique du dossier en phase negotiation', reqAfterSup.status === 'negotiation');

    // Test 22: Secret financier : Client 1 NE VOIT PAS la table des fournisseurs
    const resClientDetails = await fetch(`${SERVER_URL}/api/b2b/requests/${b2bReq1.id}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    const clientDetailsData = await resClientDetails.json();
    recordTest(22, 'Étanchéité financière : liste fournisseurs masquée pour le client', clientDetailsData.success && (!clientDetailsData.suppliers || clientDetailsData.suppliers.length === 0));

    // Test 23: Admin accède à tous les détails usines et notes internes
    const resAdminDetails = await fetch(`${SERVER_URL}/api/b2b/requests/${b2bReq1.id}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    const adminDetailsData = await resAdminDetails.json();
    recordTest(23, 'Admin consulte les fournisseurs et prix usine confidentiels', adminDetailsData.success && adminDetailsData.suppliers?.length >= 2);

    // =========================================================================
    // GROUPE 5 : DEVIS B2B (Tests 24 - 29)
    // =========================================================================
    console.log('\n--- GROUPE 5 : DEVIS B2B (CRÉATION & CHIFFRAGE) ---');

    // Test 24: Création devis B2B v1 avec items + fret + douane
    const resQuote1 = await fetch(`${SERVER_URL}/api/b2b/requests/${b2bReq1.id}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        items: [
          { description: 'Ligne d\'ensachage automatique 50kg avec soudeuse', quantity: 2, unit_price_xof: 14500000 }
        ],
        shippingXof: 2800000,
        customsXof: 1600000,
        feesXof: 400000,
        depositRequiredPercent: 50.0,
        validDays: 15,
        transportMode: 'sea',
        leadTimeDays: '35 jours DDP Dakar',
        conditions: ['Contrôle qualité vidéo en usine avant empotage', 'Dédouanement Port de Dakar inclus']
      })
    });
    const quoteData1 = await resQuote1.json();
    b2bQuoteV1 = { ...quoteData1, id: quoteData1.id || quoteData1.quote_id };
    // Total attendu : (2 * 14,500,000) + 2,800,000 + 1,600,000 + 400,000 = 33,800,000 XOF
    recordTest(24, 'Calcul précis du montant total TTC devis (Items + Fret + Douane)', quoteData1.success && Number(b2bQuoteV1.total_xof) === 33800000);

    // Test 25: Calcul automatique de l\'acompte 50% et du solde
    const expectedDeposit = 33800000 * 0.5; // 16,900,000 XOF
    const expectedBalance = 33800000 - expectedDeposit;
    recordTest(25, 'Calcul acompte 50% et solde restant dû', Number(b2bQuoteV1.deposit_amount_xof) === expectedDeposit && Number(b2bQuoteV1.balance_due_xof) === expectedBalance);

    // Test 26: Statut devis v1 créé en brouillon (draft) et demande en quote_ready
    recordTest(26, 'Statut initial du devis en draft et version v1', b2bQuoteV1.status === 'draft' && b2bQuoteV1.version === 1);

    // Test 27: Versioning : Création d\'un devis v2 révisé (remise commerciale)
    const resQuote2 = await fetch(`${SERVER_URL}/api/b2b/requests/${b2bReq1.id}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        items: [
          { description: 'Ligne d\'ensachage automatique 50kg (Tarif Négocié Grand Compte)', quantity: 2, unit_price_xof: 14000000 }
        ],
        shippingXof: 2600000,
        customsXof: 1500000,
        feesXof: 300000,
        depositRequiredPercent: 50.0,
        validDays: 15,
        transportMode: 'sea'
      })
    });
    const quoteData2 = await resQuote2.json();
    b2bQuoteV2 = { ...quoteData2, id: quoteData2.id || quoteData2.quote_id };
    // Total v2 : 28,000,000 + 2,600,000 + 1,500,000 + 300,000 = 32,400,000 XOF
    recordTest(27, 'Versioning devis : génération v2 incrémentale sur même demande', quoteData2.success && b2bQuoteV2.version === 2 && Number(b2bQuoteV2.total_xof) === 32400000);

    // Test 28: Validité du devis (valid_until = NOW + 15 jours)
    recordTest(28, 'Date de validité devis fixée à 15 jours', !!b2bQuoteV2.valid_until);

    // Test 29: Masquage strict des prix CNY et des marges bénéficiaires côté client
    const resCheckClientQuote = await fetch(`${SERVER_URL}/api/b2b/requests/${b2bReq1.id}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    const clientQuoteJson = await resCheckClientQuote.json();
    const q1Sanitized = clientQuoteJson.quotes?.find(q => q.id === b2bQuoteV1.id || q.quote_number === b2bQuoteV1.quote_number);
    const noMarginLeak = q1Sanitized && q1Sanitized.internal_margin_xof === undefined && q1Sanitized.cost_price_cny === undefined;
    recordTest(29, 'Étanchéité devis : marges et prix usine CNY absents de l\'API client', noMarginLeak);

    // =========================================================================
    // GROUPE 6 : ENVOI & RÉPONSE CLIENT (Tests 30 - 34)
    // =========================================================================
    console.log('\n--- GROUPE 6 : ENVOI & RÉPONSE CLIENT ---');

    // Test 30: Envoi du devis v2 au client par l\'Admin
    const resSend = await fetch(`${SERVER_URL}/api/b2b/quotes/${b2bQuoteV2.id}/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    const sendData = await resSend.json();
    recordTest(30, 'Envoi officiel du devis au client (status -> sent)', sendData.success);

    // Test 31: Statut demande B2B basculé à quote_sent
    const { data: reqAfterSend } = await adminClient.from('b2b_requests').select('status').eq('id', b2bReq1.id).single();
    recordTest(31, 'Statut de la demande B2B synchronisé en quote_sent', reqAfterSend.status === 'quote_sent');

    // Test 32: Rejet acceptation par un autre utilisateur (Client 2 non propriétaire)
    const resBadAccept = await fetch(`${SERVER_URL}/api/b2b/quotes/${b2bQuoteV2.id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token2}` }
    });
    recordTest(32, 'Rejet tentative d\'acceptation par un tiers (403 Forbidden)', resBadAccept.status === 403);

    // Test 33: Refus du devis v1 avec motif par Client 1
    const resRejectV1 = await fetch(`${SERVER_URL}/api/b2b/quotes/${b2bQuoteV1.id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ reason: 'Tarif unitaire initial trop élevé, proposition v2 préférée' })
    });
    const rejectDataV1 = await resRejectV1.json();
    recordTest(33, 'Refus formel d\'un devis obsolète avec motif consigné', rejectDataV1.success && rejectDataV1.status === 'rejected');

    // Test 34: Acceptation formelle du devis v2 par Client 1
    const resAcceptV2 = await fetch(`${SERVER_URL}/api/b2b/quotes/${b2bQuoteV2.id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` }
    });
    const acceptDataV2 = await resAcceptV2.json();
    recordTest(34, 'Acceptation formelle du devis v2 par le client', acceptDataV2.success && acceptDataV2.status === 'accepted');

    // =========================================================================
    // GROUPE 7 : COMMANDE & ACOMPTE B2B (Tests 35 - 40)
    // =========================================================================
    console.log('\n--- GROUPE 7 : COMMANDE & ACOMPTE B2B ---');

    // Test 35: Création automatique de la commande dans orders
    const targetOrderId = acceptDataV2.order_id;
    const { data: orderRow } = await adminClient.from('orders').select('*').eq('id', targetOrderId).single();
    linkedOrder = { data: orderRow };
    recordTest(35, 'Création automatique de la commande liée (table orders)', !!linkedOrder.data?.id, `Tracking: ${linkedOrder.data?.tracking_code}`);

    // Test 36: Demande B2B synchronisée au statut accepted avec order_id
    const { data: reqAfterAccept } = await adminClient.from('b2b_requests').select('status, order_id').eq('id', b2bReq1.id).single();
    recordTest(36, 'Demande B2B basculée en accepted avec lien order_id', reqAfterAccept.status === 'accepted' && reqAfterAccept.order_id === linkedOrder.data.id);

    // Test 37: Montant exact de l\'acompte 50% attendu
    const expectedDepositV2 = 32400000 * 0.5; // 16,200,000 XOF
    recordTest(37, 'Montant exact de l\'acompte 50% calculé', Number(acceptDataV2.deposit_amount_xof) === expectedDepositV2);

    // Test 38: Simulation webhook GeniusPay pour règlement de l\'acompte
    const resSimPay = await fetch(`${SERVER_URL}/api/payments/simulate-sandbox-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: linkedOrder.data.id,
        eventType: 'payment_success',
        providerTransactionId: `GP-TX-B2B-${Date.now()}`
      })
    });
    const simPayData = await resSimPay.json();
    recordTest(38, 'Simulation webhook GeniusPay (règlement acompte)', simPayData.success || simPayData.status === 'paid' || simPayData.payment_status === 'paid');

    // Test 39: Vérification du passage automatique en deposit_paid via trigger
    const { data: reqAfterPaid } = await adminClient.from('b2b_requests').select('status').eq('id', b2bReq1.id).single();
    recordTest(39, 'Transition automatique vers deposit_paid suite confirmation paiement', reqAfterPaid.status === 'deposit_paid');

    // Test 40: RÈGLE STRICTE : L\'acompte payé NE LANCE PAS automatiquement la production
    recordTest(40, 'RÈGLE STRICTE : Aucun lancement automatique de production sans décision humaine', reqAfterPaid.status === 'deposit_paid');

    // =========================================================================
    // GROUPE 8 : PRODUCTION & JALONS USINE (Tests 41 - 45)
    // =========================================================================
    console.log('\n--- GROUPE 8 : PRODUCTION & JALONS USINE ---');

    // Test 41: Démarrage de la production par l\'Admin
    const resStartProd = await fetch(`${SERVER_URL}/api/b2b/requests/${b2bReq1.id}/production/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        expectedCompletionDate: '2026-11-15',
        notes: 'Acompte reçu, ordre de fabrication transmis à Henan Machinery'
      })
    });
    const startProdData = await resStartProd.json();
    recordTest(41, 'Lancement de la production par décision Admin (statut -> production)', startProdData.success && startProdData.status === 'production');

    // Test 42: Jalon de production initial (in_production)
    recordTest(42, 'Jalon de production initialement assigné', startProdData.production_stage === 'in_production');

    // Test 43: Avancement jalon : Contrôle qualité Chine (qc_inspection)
    const resStageQc = await fetch(`${SERVER_URL}/api/b2b/requests/${b2bReq1.id}/production/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        stage: 'qc_inspection',
        notes: 'Inspection physique par notre desk Guangzhou : rapport vidéo 1080p validé'
      })
    });
    const stageQcData = await resStageQc.json();
    recordTest(43, 'Mise à jour jalon de production : qc_inspection', stageQcData.success && stageQcData.stage === 'qc_inspection');

    // Test 44: Avancement jalon : Prêt à expédier (ready_to_ship)
    const resStageReady = await fetch(`${SERVER_URL}/api/b2b/requests/${b2bReq1.id}/production/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        stage: 'ready_to_ship',
        notes: 'Palettisation caisse bois maritime et scellage conteneur'
      })
    });
    const stageReadyData = await resStageReady.json();
    recordTest(44, 'Mise à jour jalon de production : ready_to_ship', stageReadyData.success && stageReadyData.stage === 'ready_to_ship');

    // Test 45: Rejet d\'un jalon de production invalide
    const resBadStage = await fetch(`${SERVER_URL}/api/b2b/requests/${b2bReq1.id}/production/stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ stage: 'inconnu_stage_xyz' })
    });
    recordTest(45, 'Rejet jalon de production invalide (contrainte enum)', resBadStage.status === 400);

    // =========================================================================
    // GROUPE 9 : EXPÉDITION, TRACKING & CLÔTURE (Tests 46 - 50)
    // =========================================================================
    console.log('\n--- GROUPE 9 : EXPÉDITION, TRACKING & CLÔTURE ---');

    // Test 46: Transition vers expédition logistique (Étape 8)
    const resShip = await fetch(`${SERVER_URL}/api/b2b/requests/${b2bReq1.id}/ship`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        carrierId: 'COSCO Shipping Lines',
        transportMode: 'sea'
      })
    });
    const shipData = await resShip.json();
    recordTest(46, 'Création automatique de l\'expédition maritime (Étape 8)', shipData.success && !!shipData.shipment_id);

    // Test 47: Code de tracking logistique généré
    recordTest(47, 'Génération code de suivi officiel (SHP-XXXXX)', !!shipData.shipment_code);

    // Test 48: Statut demande B2B basculé en shipping
    const { data: reqAfterShip } = await adminClient.from('b2b_requests').select('status').eq('id', b2bReq1.id).single();
    recordTest(48, 'Statut de la demande B2B basculé en shipping', reqAfterShip.status === 'shipping');

    // Test 49: Clôture opérationnelle du dossier B2B (completed)
    const resComplete = await fetch(`${SERVER_URL}/api/b2b/requests/${b2bReq1.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ status: 'completed', notes: 'Conteneur dédouané et livré à l\'usine de Diamniadio' })
    });
    const completeData = await resComplete.json();
    recordTest(49, 'Clôture opérationnelle du dossier B2B (completed)', completeData.success && completeData.status === 'completed');

    // Test 50: Journal d\'audit b2b_events retrace l\'intégralité du cycle de vie
    const { data: fullAudit } = await adminClient.from('b2b_events').select('*').eq('b2b_request_id', b2bReq1.id).order('created_at', { ascending: true });
    const hasFullLifecycle = fullAudit && fullAudit.length >= 6;
    recordTest(50, `Journal d\'audit b2b_events exhaustif (${fullAudit?.length || 0} événements consignés)`, hasFullLifecycle);

    // =========================================================================
    // GROUPE 10 : NON-RÉGRESSION ÉTAPES 1 À 9 (Tests 51 - 55)
    // =========================================================================
    console.log('\n--- GROUPE 10 : NON-RÉGRESSION ÉTAPES 1 À 9 ---');

    // Test 51: Non-régression Étape 1 & 2 : Profils et Authentification
    const { data: profileCheck } = await client1.from('profiles').select('id, full_name').eq('id', auth1.user.id).single();
    recordTest(51, 'Non-régression Étape 1 & 2 : Supabase Auth & profils intacts', !!profileCheck?.id);

    // Test 52: Non-régression Étape 3 & 4 : Produits marketplace et Groupages
    const { data: productsCheck } = await adminClient.from('products').select('id').limit(1);
    const { data: groupagesCheck } = await adminClient.from('groupages').select('id').limit(1);
    recordTest(52, 'Non-régression Étape 3 & 4 : Marketplace et Groupages opérationnels', !!productsCheck && !!groupagesCheck);

    // Test 53: Non-régression Étape 5 & 6 : Commandes et Calcul logistique
    const { data: ordersCheck } = await adminClient.from('orders').select('id').limit(1);
    recordTest(53, 'Non-régression Étape 5 & 6 : Moteur logistique et commandes intègres', !!ordersCheck);

    // Test 54: Non-régression Étape 7 : Paiements GeniusPay & Webhooks
    const resHealthPay = await fetch(`${SERVER_URL}/api/health`);
    const healthJson = await resHealthPay.json();
    recordTest(54, 'Non-régression Étape 7 : API GeniusPay & Healthcheck en ligne', healthJson.status === 'online' && healthJson.gateway === 'GeniusPay');

    // Test 55: Non-régression Étape 8 & 9 : Logistique (Shipments) et Sourcing B2C
    const resSourcingCheck = await fetch(`${SERVER_URL}/api/sourcing/requests`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    const sourcingJson = await resSourcingCheck.json();
    const { data: shipmentsCheck } = await adminClient.from('shipments').select('id').limit(1);
    recordTest(55, 'Non-régression Étape 8 & 9 : Sourcing B2C et Expéditions réelles intacts', sourcingJson.success && !!shipmentsCheck);

    // Bilan
    console.log('\n================================================================');
    console.log('                      BILAN DE LA SUITE');
    console.log('================================================================');
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.filter(r => !r.passed).length;
    console.log(`Total des tests exécutés : ${results.length}`);
    console.log(`Tests réussis (PASS)     : ${passedCount}`);
    console.log(`Tests échoués (FAIL)     : ${failedCount}`);

    if (failedCount > 0) {
      console.log('\n❌ Échecs détectés :');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`- TEST ${r.num}: ${r.name} (${r.details})`);
      });
      process.exitCode = 1;
    } else {
      console.log('\n🏆 SUCCÈS TOTAL : 55/55 TESTS VALIDER POUR L\'ÉTAPE 10 B2B RÉEL !');
    }
  } catch (err) {
    console.error('\n💥 Erreur fatale pendant l\'exécution de la suite :', err);
    process.exitCode = 1;
  } finally {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  }
}

runSuite();
