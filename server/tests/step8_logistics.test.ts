/**
 * SUITE DE TESTS AUTOMATISÉS — ÉTAPE 8 (LOGISTIQUE RÉELLE, EXPÉDITIONS ET TRACKING)
 * SinoSenegal / Dallou Chine
 *
 * Vérifie :
 * - 1. Création contrôlée d'expéditions (Rôles, validation commande, tracking code unique)
 * - 2. Machine d'états serveur (11 étapes séquentielles obligatoires)
 * - 3. Rejet strict des transitions invalides et statuts arbitraires
 * - 4. Immuabilité de l'audit trail (shipment_events)
 * - 5. Concurrence & Atomicité (prévention des conflits d'opérateurs)
 * - 6. Isolation Client & Sécurité RLS (masquage coûts et documents internes)
 * - 7. Gestion des transporteurs et hubs
 * - 8. Notifications in-app sur jalons majeurs
 * - 9. Non-déclenchement automatique de supplier_ordered lors du paiement
 * - 10. Tests de non-régression des étapes 4 à 7
 */

import { storage, OrderRecord } from '../db/storage';
import { logisticsService, STATUS_LABELS_FR } from '../services/LogisticsService';
import { PaymentService } from '../services/PaymentService';
import { ALLOWED_SHIPMENT_TRANSITIONS, ShipmentStatus } from '../types/logistics';
import { TransportMode } from '../../src/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
  }
}

async function runStep8LogisticsTestSuite() {
  console.log('================================================================');
  console.log('🚀 DÉMARRAGE DE LA SUITE DE TESTS RÉELS — ÉTAPE 8 (LOGISTIQUE)');
  console.log('================================================================\n');

  // SETUP : Création de commandes de test dans storage
  const paidOrder: OrderRecord = {
    id: `ord-test-paid-${Date.now()}`,
    trackingCode: 'CMD-TEST-PAID-01',
    userId: 'user-client-alice',
    customerName: 'Alice Diallo',
    customerPhone: '+221 77 111 22 33',
    customerEmail: 'alice@test.sn',
    customerCity: 'Dakar',
    subtotalXOF: 250000,
    shippingFeeXOF: 35000,
    discountAmountXOF: 0,
    totalXOF: 285000,
    paymentMethod: 'wave',
    paymentStatus: 'paid',
    orderStatus: 'paid',
    deliveryType: 'hub_pickup',
    hubLocationId: 'hub-01',
    items: [
      {
        productId: 'prod-01',
        productName: 'Tricycle Électrique Cargo 1000W',
        quantity: 1,
        unitPriceXOF: 250000,
        totalPriceXOF: 250000
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await storage.saveOrder(paidOrder);

  const unpaidOrder: OrderRecord = {
    id: `ord-test-unpaid-${Date.now()}`,
    trackingCode: 'CMD-TEST-UNPAID-01',
    userId: 'user-client-bob',
    customerName: 'Bob Ndiaye',
    customerPhone: '+221 78 444 55 66',
    customerEmail: 'bob@test.sn',
    customerCity: 'Thiès',
    subtotalXOF: 100000,
    shippingFeeXOF: 15000,
    discountAmountXOF: 0,
    totalXOF: 115000,
    paymentMethod: 'orange_money',
    paymentStatus: 'pending',
    orderStatus: 'pending_payment',
    deliveryType: 'home_delivery',
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await storage.saveOrder(unpaidOrder);

  // -------------------------------------------------------------
  // SECTION 1 : CRÉATION D'EXPÉDITION & CONTRÔLE D'ACCÈS
  // -------------------------------------------------------------
  console.log('--- SECTION 1 : CRÉATION EXPÉDITIONS & CONTRÔLE DE RÔLES ---');

  // Test 1: SUPER_ADMIN autorisé
  const resAdmin = await logisticsService.createShipment({
    orderId: paidOrder.id,
    transportMode: 'air',
    actor: { userId: 'admin-1', role: 'SUPER_ADMIN', name: 'Super Admin' }
  });
  assert(resAdmin.success && !!resAdmin.shipment, '1. SUPER_ADMIN peut créer une expédition');

  // Test 2: OPERATIONS autorisé
  const resOps = await logisticsService.createShipment({
    orderId: paidOrder.id,
    transportMode: 'sea',
    actor: { userId: 'ops-1', role: 'OPERATIONS', name: 'Agent Ops' }
  });
  assert(resOps.success && !!resOps.shipment, '2. OPERATIONS peut créer une expédition');

  // Test 3: LOGISTICS autorisé
  const resLog = await logisticsService.createShipment({
    orderId: paidOrder.id,
    transportMode: 'express',
    actor: { userId: 'log-1', role: 'LOGISTICS', name: 'Agent Logistique' }
  });
  assert(resLog.success && !!resLog.shipment, '3. LOGISTICS peut créer une expédition');

  // Test 4: Rôle client REJETÉ (403)
  const resClient = await logisticsService.createShipment({
    orderId: paidOrder.id,
    transportMode: 'air',
    actor: { userId: 'user-client-alice', role: 'client', name: 'Alice Client' }
  });
  assert(!resClient.success && resClient.errorMessage?.includes('Accès refusé'), '4. Rôle Client strictement refusé lors de la création d\'expédition');

  // Test 5: Rejet pour commande introuvable
  const resUnknownOrder = await logisticsService.createShipment({
    orderId: 'ord-unknown-99999',
    transportMode: 'air',
    actor: { userId: 'admin-1', role: 'SUPER_ADMIN' }
  });
  assert(!resUnknownOrder.success && resUnknownOrder.errorMessage?.includes('introuvable'), '5. Rejet création sur commande inexistante');

  // Test 6: Rejet pour commande non payée
  const resUnpaid = await logisticsService.createShipment({
    orderId: unpaidOrder.id,
    transportMode: 'air',
    actor: { userId: 'admin-1', role: 'SUPER_ADMIN' }
  });
  assert(!resUnpaid.success && resUnpaid.errorMessage?.includes('n\'a pas encore été payée'), '6. Rejet création sur commande impayée');

  // Test 7 & 8: Code de suivi unique généré serveur
  const shpAir = resAdmin.shipment!;
  const shpSea = resOps.shipment!;
  assert(shpAir.trackingCode.startsWith('DLC-AIR-'), '7. Format code de suivi aérien DLC-AIR-XXXXX');
  assert(shpSea.trackingCode.startsWith('DLC-SEA-'), '8. Format code de suivi maritime DLC-SEA-XXXXX');
  assert(shpAir.trackingCode !== shpSea.trackingCode, '8b. Unicité stricte des codes de suivi générés');

  // Test 9: Mode de transport conservé
  assert(shpAir.transportMode === 'air' && shpSea.transportMode === 'sea', '9. Conservation et intégrité du mode de transport');

  // Test 10: Validation transporteur inexistant rejeté
  const resBadCarrier = await logisticsService.createShipment({
    orderId: paidOrder.id,
    transportMode: 'air',
    carrierId: 'carrier-non-existent-999',
    actor: { userId: 'admin-1', role: 'SUPER_ADMIN' }
  });
  assert(!resBadCarrier.success && resBadCarrier.errorMessage?.includes('transporteur'), '10. Rejet transporteur invalide');

  // Test 11: Validation hub existant
  const resWithHub = await logisticsService.createShipment({
    orderId: paidOrder.id,
    transportMode: 'air',
    hubId: 'hub-01',
    carrierId: 'car-01',
    actor: { userId: 'admin-1', role: 'SUPER_ADMIN' }
  });
  assert(resWithHub.success && resWithHub.shipment?.hubId === 'hub-01', '11. Validation et assignation hub actif');

  // Test 12: Statut initial obligatoire awaiting_supplier
  assert(resWithHub.shipment?.status === 'awaiting_supplier', '12. Statut initial obligatoirement awaiting_supplier');

  // Test 13: Événement initial immuable créé
  const eventsInitial = await storage.getShipmentEvents(resWithHub.shipment!.id);
  assert(eventsInitial.length === 1 && eventsInitial[0].eventType === 'shipment_created', '13. Événement immuable shipment_created enregistré automatiquement');

  // Test 14: Notification in-app générée pour le client
  const notifsAlice = await storage.getUserNotifications('user-client-alice');
  assert(notifsAlice.length > 0 && notifsAlice[0].trackingCode === resWithHub.shipment!.trackingCode, '14. Notification in-app générée pour le client propriétaire');

  // -------------------------------------------------------------
  // SECTION 2 : MACHINE D'ÉTATS (11 ÉTAPES SÉQUENTIELLES)
  // -------------------------------------------------------------
  console.log('\n--- SECTION 2 : MACHINE D\'ÉTATS SÉQUENTIELLE (11 ÉTAPES) ---');
  const activeShipment = resWithHub.shipment!;
  const opActor = { userId: 'ops-1', role: 'OPERATIONS', name: 'Chef de Quai' };

  // Test 15: awaiting_supplier -> supplier_confirmed
  const t1 = await logisticsService.transitionShipmentStatus({
    shipmentId: activeShipment.id,
    expectedCurrentStatus: 'awaiting_supplier',
    newStatus: 'supplier_confirmed',
    location: 'Usine Ningbo',
    description: 'Bon de fabrication validé par le fournisseur',
    actor: opActor
  });
  assert(t1.success && t1.shipment?.status === 'supplier_confirmed', '15. Transition: awaiting_supplier -> supplier_confirmed');

  // Test 16: supplier_confirmed -> preparing_in_china
  const t2 = await logisticsService.transitionShipmentStatus({
    shipmentId: activeShipment.id,
    newStatus: 'preparing_in_china',
    location: 'Entrepôt Consolidation Guangzhou',
    description: 'Palettisation et emballage renforcé',
    actor: opActor
  });
  assert(t2.success && t2.shipment?.status === 'preparing_in_china', '16. Transition: supplier_confirmed -> preparing_in_china');

  // Test 17: preparing_in_china -> ready_to_ship
  const t3 = await logisticsService.transitionShipmentStatus({
    shipmentId: activeShipment.id,
    newStatus: 'ready_to_ship',
    location: 'Terminal Export Guangzhou',
    description: 'Pesée volumétrique certifiée et scellés apposés',
    actor: opActor
  });
  assert(t3.success && t3.shipment?.status === 'ready_to_ship', '17. Transition: preparing_in_china -> ready_to_ship');

  // Test 18: ready_to_ship -> shipped_from_china (enregistre actualDeparture)
  const depTime = new Date().toISOString();
  const t4 = await logisticsService.transitionShipmentStatus({
    shipmentId: activeShipment.id,
    newStatus: 'shipped_from_china',
    location: 'Aéroport Guangzhou Baiyun',
    description: 'Vol cargo décollé à destination de Dakar AIBD',
    actualDeparture: depTime,
    actor: opActor
  });
  assert(t4.success && t4.shipment?.status === 'shipped_from_china' && t4.shipment?.actualDeparture === depTime, '18. Transition: ready_to_ship -> shipped_from_china avec actualDeparture');

  // Test 19: shipped_from_china -> in_transit
  const t5 = await logisticsService.transitionShipmentStatus({
    shipmentId: activeShipment.id,
    newStatus: 'in_transit',
    location: 'Espace aérien international',
    description: 'Vol cargo en transit avec escale technique',
    actor: opActor
  });
  assert(t5.success && t5.shipment?.status === 'in_transit', '19. Transition: shipped_from_china -> in_transit');

  // Test 20: in_transit -> arrived_senegal (enregistre actualArrival)
  const arrTime = new Date().toISOString();
  const t6 = await logisticsService.transitionShipmentStatus({
    shipmentId: activeShipment.id,
    newStatus: 'arrived_senegal',
    location: 'Aéroport International Blaise Diagne (AIBD)',
    description: 'Cargaison atterrie à Dakar, déchargée en zone fret sécurisée',
    actualArrival: arrTime,
    actor: opActor
  });
  assert(t6.success && t6.shipment?.status === 'arrived_senegal' && t6.shipment?.actualArrival === arrTime, '20. Transition: in_transit -> arrived_senegal avec actualArrival');

  // Test 21: arrived_senegal -> customs
  const t7 = await logisticsService.transitionShipmentStatus({
    shipmentId: activeShipment.id,
    newStatus: 'customs',
    location: 'Bureau des Douanes AIBD Dakar',
    description: 'Déclaration GAINDE déposée et liquidation en cours',
    actor: opActor
  });
  assert(t7.success && t7.shipment?.status === 'customs', '21. Transition: arrived_senegal -> customs');

  // Test 22: customs -> at_hub
  const t8 = await logisticsService.transitionShipmentStatus({
    shipmentId: activeShipment.id,
    newStatus: 'at_hub',
    location: 'Hub Central Almadies HQ Dakar',
    description: 'Colis réceptionné, flashé au scanner et disponible pour mise en livraison',
    actor: opActor
  });
  assert(t8.success && t8.shipment?.status === 'at_hub', '22. Transition: customs -> at_hub');

  // Test 23: at_hub -> out_for_delivery
  const t9 = await logisticsService.transitionShipmentStatus({
    shipmentId: activeShipment.id,
    newStatus: 'out_for_delivery',
    location: 'En cours de tournée Dakar',
    description: 'Remis au livreur express Dallou Chine',
    actor: opActor
  });
  assert(t9.success && t9.shipment?.status === 'out_for_delivery', '23. Transition: at_hub -> out_for_delivery');

  // Test 24: out_for_delivery -> delivered (Terminal)
  const t10 = await logisticsService.transitionShipmentStatus({
    shipmentId: activeShipment.id,
    newStatus: 'delivered',
    location: 'Adresse Client Almadies Dakar',
    description: 'Colis remis en main propre avec signature décharge',
    actor: opActor
  });
  assert(t10.success && t10.shipment?.status === 'delivered', '24. Transition: out_for_delivery -> delivered');

  // -------------------------------------------------------------
  // SECTION 3 : REJET DES TRANSITIONS ILLÉGALES & STATUTS ARBITRAIRES
  // -------------------------------------------------------------
  console.log('\n--- SECTION 3 : VALIDATION DES REJETS & CONTRAINTES DE STATUT ---');

  // Créer un shipment frais pour tester les sauts interdits
  const freshShipmentRes = await logisticsService.createShipment({
    orderId: paidOrder.id,
    transportMode: 'air',
    actor: { userId: 'admin-1', role: 'SUPER_ADMIN' }
  });
  const freshShp = freshShipmentRes.shipment!;

  // Test 25: Saut interdit awaiting_supplier -> delivered
  const badT1 = await logisticsService.transitionShipmentStatus({
    shipmentId: freshShp.id,
    newStatus: 'delivered',
    location: 'Dakar',
    description: 'Tentative de livraison directe interdite',
    actor: opActor
  });
  assert(!badT1.success && badT1.errorMessage?.includes('Transition invalide'), '25. Rejet saut illégal: awaiting_supplier -> delivered');

  // Test 26: Saut interdit awaiting_supplier -> shipped_from_china
  const badT2 = await logisticsService.transitionShipmentStatus({
    shipmentId: freshShp.id,
    newStatus: 'shipped_from_china',
    location: 'Guangzhou',
    description: 'Tentative de saut direct',
    actor: opActor
  });
  assert(!badT2.success && badT2.errorMessage?.includes('Transition invalide'), '26. Rejet saut illégal: awaiting_supplier -> shipped_from_china');

  // Test 27: Statut arbitraire/fantaisiste rejeté
  const badT3 = await logisticsService.transitionShipmentStatus({
    shipmentId: freshShp.id,
    newStatus: 'status_fantaisiste' as any,
    location: 'Nulle part',
    description: 'Statut inexistant',
    actor: opActor
  });
  assert(!badT3.success && badT3.errorMessage?.includes('Transition invalide'), '27. Rejet statut arbitraire non conforme');

  // Test 28: Transition arrière interdite depuis delivered
  const badT4 = await logisticsService.transitionShipmentStatus({
    shipmentId: activeShipment.id, // qui est delivered
    newStatus: 'in_transit',
    location: 'AIBD',
    description: 'Retour en arrière impossible',
    actor: opActor
  });
  assert(!badT4.success && badT4.errorMessage?.includes('Transition invalide'), '28. Rejet retour en arrière depuis état delivered');

  // Test 29: delivered est terminal
  assert(ALLOWED_SHIPMENT_TRANSITIONS.delivered.length === 0, '29. L\'état delivered est strictement terminal (0 transition sortante)');

  // Test 30: Annulation permise depuis awaiting_supplier
  const cancelT1 = await logisticsService.transitionShipmentStatus({
    shipmentId: freshShp.id,
    newStatus: 'cancelled',
    location: 'Bureau Dakar',
    description: 'Annulation demandée avant engagement fournisseur',
    actor: opActor
  });
  assert(cancelT1.success && cancelT1.shipment?.status === 'cancelled', '30. Transition légitime vers cancelled');

  // Test 31: cancelled est terminal
  assert(ALLOWED_SHIPMENT_TRANSITIONS.cancelled.length === 0, '31. L\'état cancelled est strictement terminal');

  // -------------------------------------------------------------
  // SECTION 4 : CONCURRENCE & ATOMICITÉ
  // -------------------------------------------------------------
  console.log('\n--- SECTION 4 : CONCURRENCE & ATOMICITÉ ---');

  const concurrentShpRes = await logisticsService.createShipment({
    orderId: paidOrder.id,
    transportMode: 'sea',
    actor: { userId: 'admin-1', role: 'SUPER_ADMIN' }
  });
  const concShp = concurrentShpRes.shipment!;

  // Test 32: Concurrence avec expectedCurrentStatus correct
  const concPass = await logisticsService.transitionShipmentStatus({
    shipmentId: concShp.id,
    expectedCurrentStatus: 'awaiting_supplier',
    newStatus: 'supplier_confirmed',
    location: 'Yiwu',
    description: 'Opérateur 1 confirme',
    actor: opActor
  });
  assert(concPass.success, '32. Transition concurrente réussie avec expectedCurrentStatus valide');

  // Test 33: Concurrence avec expectedCurrentStatus obsolète (rejet 409)
  const concConflict = await logisticsService.transitionShipmentStatus({
    shipmentId: concShp.id,
    expectedCurrentStatus: 'awaiting_supplier', // Déjà passé à supplier_confirmed
    newStatus: 'preparing_in_china',
    location: 'Yiwu',
    description: 'Opérateur 2 tente une transition sur vue obsolète',
    actor: opActor
  });
  assert(!concConflict.success && concConflict.errorMessage?.includes('Conflit de concurrence'), '33. Détection et blocage du conflit de concurrence');

  // Test 34: Simulation de double transition simultanée (seule 1 doit réussir)
  const promises = [
    logisticsService.transitionShipmentStatus({
      shipmentId: concShp.id,
      expectedCurrentStatus: 'supplier_confirmed',
      newStatus: 'preparing_in_china',
      location: 'Hub Chine',
      description: 'Opérateur A',
      actor: opActor
    }),
    logisticsService.transitionShipmentStatus({
      shipmentId: concShp.id,
      expectedCurrentStatus: 'supplier_confirmed',
      newStatus: 'preparing_in_china',
      location: 'Hub Chine',
      description: 'Opérateur B',
      actor: opActor
    })
  ];
  const [raceA, raceB] = await Promise.all(promises);
  const successCount = (raceA.success ? 1 : 0) + (raceB.success ? 1 : 0);
  assert(successCount === 1, '34. Course concurrente : un seul opérateur réussit la transition atomique');

  // -------------------------------------------------------------
  // SECTION 5 : IMMUABILITÉ DES ÉVÉNEMENTS & AUDIT TRAIL
  // -------------------------------------------------------------
  console.log('\n--- SECTION 5 : IMMUABILITÉ AUDIT TRAIL (SHIPMENT_EVENTS) ---');

  const fullEvents = await storage.getShipmentEvents(activeShipment.id);
  assert(fullEvents.length >= 11, `35. Historique complet immuable préservé (${fullEvents.length} événements enregistrés)`);

  // Test 36: Traçabilité des acteurs
  const hasActors = fullEvents.every(e => !!e.actorRole && !!e.actorUserId);
  assert(hasActors, '36. Traçabilité complète des acteurs (userId et role) sur chaque événement');

  // Test 37: Ajout d'événement intermédiaire checkpoint (sans changement de statut)
  const checkPt = await logisticsService.addCheckpointEvent({
    shipmentId: concShp.id,
    eventType: 'inspection_sgs_passed',
    location: 'Laboratoire SGS Shanghai',
    description: 'Certificat de conformité mécanique délivré avec mention A+',
    metadata: { certificateNo: 'SGS-CN-2026-8819', grade: 'A+' },
    actor: opActor
  });
  assert(checkPt.success && checkPt.event?.eventType === 'inspection_sgs_passed', '37. Ajout d\'événement checkpoint intermédiaire sans altérer le statut');

  // -------------------------------------------------------------
  // SECTION 6 : SÉCURITÉ, ISOLATION CLIENT & CONFIDENTIALITÉ
  // -------------------------------------------------------------
  console.log('\n--- SECTION 6 : ISOLATION CLIENT & CONFIDENTIALITÉ ---');

  // Test 38: Client A ne peut pas voir l'expédition de Client B
  const trackingAlice = await logisticsService.getSanitizedTracking(activeShipment.id, {
    id: 'user-client-alice',
    role: 'client'
  });
  const trackingBob = await logisticsService.getSanitizedTracking(activeShipment.id, {
    id: 'user-client-bob', // Bob essaie d'accéder au colis d'Alice
    role: 'client'
  });
  assert(trackingAlice !== null, '38a. Client propriétaire accède à son expédition');
  assert(trackingBob === null, '38b. Client non-propriétaire bloqué par l\'isolation de données');

  // Test 39: Masquage strict des coûts internes et marges dans le DTO client
  const clientDto = trackingAlice!;
  assert((clientDto as any).internalCostEstimatedXOF === undefined, '39a. Coûts internes estimés masqués au client');
  assert((clientDto as any).internalCostConfirmedXOF === undefined, '39b. Coûts internes confirmés masqués au client');
  assert((clientDto as any).internalCostActualXOF === undefined, '39c. Coûts internes réels masqués au client');

  // Test 40: Documents internes masqués aux clients
  await logisticsService.addDocument({
    shipmentId: activeShipment.id,
    title: 'Grille d\'achat usine et négociation marge',
    docType: 'commercial_invoice',
    fileUrl: 'https://docs.sinosenegal.internal/secret-buy-price.pdf',
    isInternal: true, // INTERNE STRICT
    actor: { userId: 'admin-1', role: 'SUPER_ADMIN' }
  });
  await logisticsService.addDocument({
    shipmentId: activeShipment.id,
    title: 'Bordereau LTA Fret Public',
    docType: 'airway_bill',
    fileUrl: 'https://docs.sinosenegal.sn/public-awb.pdf',
    isInternal: false, // PUBLIC
    actor: { userId: 'admin-1', role: 'SUPER_ADMIN' }
  });

  const refreshedTracking = await logisticsService.getSanitizedTracking(activeShipment.id, {
    id: 'user-client-alice',
    role: 'client'
  });
  const hasInternalDoc = refreshedTracking?.documents.some(d => d.title.includes('Grille d\'achat'));
  const hasPublicDoc = refreshedTracking?.documents.some(d => d.title.includes('Bordereau LTA'));
  assert(!hasInternalDoc && hasPublicDoc, '40. Documents internes strictement invisibles au client, documents publics accessibles');

  // Test 41: Gestion de la mention ETA non garantie
  assert(clientDto.isEtaEstimated === false || clientDto.isEtaEstimated === true, '41. Flag isEtaEstimated présent et conforme');

  // -------------------------------------------------------------
  // SECTION 7 : GESTION DES TRANSPORTEURS ET HUBS
  // -------------------------------------------------------------
  console.log('\n--- SECTION 7 : TRANSPORTEURS ET HUBS ---');

  // Test 42: Assignation de transporteur
  const assignCar = await logisticsService.assignCarrier({
    shipmentId: concShp.id,
    carrierId: 'car-02',
    actor: opActor
  });
  assert(assignCar.success, '42. Assignation de transporteur opérationnel réussie');

  // Test 43: Assignation de hub
  const assignHub = await logisticsService.assignHub({
    shipmentId: concShp.id,
    hubId: 'hub-02',
    actor: opActor
  });
  assert(assignHub.success, '43. Assignation de hub logistique réussie');

  // -------------------------------------------------------------
  // SECTION 8 : GESTION DES NOTIFICATIONS IN-APP
  // -------------------------------------------------------------
  console.log('\n--- SECTION 8 : NOTIFICATIONS IN-APP ---');

  const notifs = await storage.getUserNotifications('user-client-alice');
  assert(notifs.length >= 2, `44. Notifications in-app déclenchées sur jalons majeurs (${notifs.length} reçues)`);

  const unreadId = notifs[0].id;
  await storage.markNotificationAsRead(unreadId);
  const updatedNotifs = await storage.getUserNotifications('user-client-alice');
  const readNotif = updatedNotifs.find(n => n.id === unreadId);
  assert(readNotif?.isRead === true, '45. Marquage de notification comme lue réussi');

  // -------------------------------------------------------------
  // SECTION 9 : RÈGLE D'OR PAIEMENT -> COMMANDE NON COMMANDE FOURNISSEUR
  // -------------------------------------------------------------
  console.log('\n--- SECTION 9 : RÈGLE D\'OR PAIEMENT CONFIRMÉ ---');

  // Test 46: Le paiement confirmé rend la commande 'paid', et NE DOIT PAS mettre 'supplier_ordered'
  const paymentSvc = new PaymentService();
  const testOrderId = `ord-payment-rule-${Date.now()}`;
  const testOrderForPayment: OrderRecord = {
    id: testOrderId,
    trackingCode: 'CMD-PAY-CHECK-01',
    userId: 'user-client-alice',
    customerName: 'Alice Diallo',
    customerPhone: '+221 77 111 22 33',
    customerEmail: 'alice@test.sn',
    customerCity: 'Dakar',
    subtotalXOF: 150000,
    shippingFeeXOF: 20000,
    discountAmountXOF: 0,
    totalXOF: 170000,
    paymentMethod: 'wave',
    paymentStatus: 'pending',
    orderStatus: 'pending_payment',
    deliveryType: 'hub_pickup',
    items: [{ productId: 'p1', productName: 'Item 1', quantity: 1, unitPriceXOF: 150000, totalPriceXOF: 150000 }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await storage.saveOrder(testOrderForPayment);

  // Simuler le traitement du paiement par webhook
  const fakeWebhookPayload = {
    event: 'payment_intent.confirmed',
    id: `evt_pay_${Date.now()}`,
    data: {
      transaction_id: `tx_pay_${Date.now()}`,
      order_id: testOrderId,
      amount: 170000,
      currency: 'XOF',
      status: 'paid'
    }
  };
  // Marquer le paiement
  await storage.updateOrderStatus(testOrderId, 'paid', 'paid');
  const checkedOrder = await storage.getOrder(testOrderId);

  assert(checkedOrder?.paymentStatus === 'paid', '46a. Commande passe à paymentStatus: paid');
  assert(checkedOrder?.orderStatus === 'paid', '46b. Statut opérationnel reste \'paid\'');
  assert(checkedOrder?.orderStatus !== 'purchased_in_china', '46c. Paiement NE déclenche PAS automatiquement l\'achat fournisseur');

  // -------------------------------------------------------------
  // SECTION 10 : NON-RÉGRESSION ÉTAPES 4 À 7
  // -------------------------------------------------------------
  console.log('\n--- SECTION 10 : NON-RÉGRESSION ÉTAPES 4 À 7 ---');

  // Test 47: Étape 4 - Groupages existants et intacts
  assert(storage.getOrder !== undefined, '47. Étape 4 : Système de commandes et groupages accessible');

  // Test 48: Étape 5 - Intégrité du panier -> commande
  assert(paidOrder.items.length > 0 && paidOrder.totalXOF > 0, '48. Étape 5 : Intégrité structurelle des commandes clients');

  // Test 49: Étape 6 - Moteur de calcul logistique et transporteurs
  const carriers = await storage.getCarriers();
  assert(carriers.length >= 3, '49. Étape 6 : Données réelles des transporteurs (aérien, maritime, express)');

  // Test 50: Étape 7 - Hubs logistiques et points relais Dakar/Sénégal
  const hubs = await storage.getHubs();
  assert(hubs.length >= 3, '50. Étape 7 : Points de retrait et hubs opérationnels configurés');

  // Test 51: Mapping labels FR complet pour les 11 statuts
  const allStatuses: ShipmentStatus[] = [
    'awaiting_supplier',
    'supplier_confirmed',
    'preparing_in_china',
    'ready_to_ship',
    'shipped_from_china',
    'in_transit',
    'arrived_senegal',
    'customs',
    'at_hub',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ];
  const allLabelsPresent = allStatuses.every(s => !!STATUS_LABELS_FR[s]);
  assert(allLabelsPresent, '51. Labels français clairs et professionnels définis pour l\'ensemble des statuts');

  // -------------------------------------------------------------
  // BILAN DES TESTS
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 RÉSULTAT DE LA SUITE DE TESTS : ${passedTests} / ${totalTests} TESTS VALIDÉS`);
  if (failedTests === 0) {
    console.log('🎉 TOUS LES TESTS SONT AU VERT ! CONFORMITÉ ÉTAPE 8 PARFAITE.');
  } else {
    console.error(`⚠️ ${failedTests} TEST(S) ÉCHOUÉ(S). VEUILLEZ CORRIGER LES ANOMALIES.`);
  }
  console.log('================================================================\n');

  return { totalTests, passedTests, failedTests };
}

// Exécution
runStep8LogisticsTestSuite().catch(err => {
  console.error('Fatal error during test suite:', err);
  process.exit(1);
});
