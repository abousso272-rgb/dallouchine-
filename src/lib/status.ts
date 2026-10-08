export type Tone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'ochre';

export interface StatusMeta {
  label: string;
  tone: Tone;
  /** Explication courte destinée au client */
  hint?: string;
}

type StatusMap = Record<string, StatusMeta>;

export const ORDER_STATUS: StatusMap = {
  pending_payment: { label: 'En attente de paiement', tone: 'warning', hint: 'Finalisez le paiement pour lancer la commande.' },
  paid: { label: 'Payée', tone: 'info', hint: 'Paiement reçu, nous lançons l’achat en Chine.' },
  supplier_ordered: { label: 'Commandée en Chine', tone: 'info', hint: 'Votre commande est passée auprès du fournisseur.' },
  preparing: { label: 'En préparation', tone: 'info', hint: 'Contrôle et préparation dans notre entrepôt en Chine.' },
  shipped: { label: 'Expédiée', tone: 'info', hint: 'Votre colis a quitté la Chine.' },
  in_transit: { label: 'En transit', tone: 'info', hint: 'Transport international en cours.' },
  arrived: { label: 'Arrivée', tone: 'info', hint: 'Arrivée à destination, dédouanement en cours.' },
  ready_for_delivery: { label: 'Prête au retrait', tone: 'success', hint: 'Disponible au point de retrait ou en livraison.' },
  delivered: { label: 'Livrée', tone: 'success', hint: 'Commande remise. Merci de votre confiance !' },
  cancelled: { label: 'Annulée', tone: 'neutral' }
};

export const ORDER_STEPS = [
  { key: 'payment', label: 'Paiement', statuses: ['pending_payment'] },
  { key: 'purchase', label: 'Achat en Chine', statuses: ['paid', 'supplier_ordered', 'preparing'] },
  { key: 'shipping', label: 'Expédition', statuses: ['shipped', 'in_transit'] },
  { key: 'arrival', label: 'Arrivée', statuses: ['arrived', 'ready_for_delivery'] },
  { key: 'delivered', label: 'Livrée', statuses: ['delivered'] }
];

export const ORDER_STATUS_FLOW = [
  'pending_payment',
  'paid',
  'supplier_ordered',
  'preparing',
  'shipped',
  'in_transit',
  'arrived',
  'ready_for_delivery',
  'delivered'
];

export const PAYMENT_STATUS: StatusMap = {
  pending: { label: 'En attente', tone: 'warning' },
  processing: { label: 'En cours', tone: 'info' },
  paid: { label: 'Payé', tone: 'success' },
  failed: { label: 'Échoué', tone: 'danger' },
  cancelled: { label: 'Annulé', tone: 'neutral' },
  refunded: { label: 'Remboursé', tone: 'neutral' },
  expired: { label: 'Expiré', tone: 'neutral' }
};

export const GROUPAGE_STATUS: StatusMap = {
  draft: { label: 'Brouillon', tone: 'neutral' },
  open: { label: 'Ouvert', tone: 'success', hint: 'Les participations sont ouvertes.' },
  almost_full: { label: 'Presque complet', tone: 'ochre', hint: 'Plus que quelques places.' },
  full: { label: 'Objectif atteint', tone: 'info', hint: 'Le quota est atteint, la commande usine va être lancée.' },
  validated: { label: 'Validé', tone: 'info', hint: 'Le groupage est confirmé.' },
  supplier_ordered: { label: 'Commandé à l’usine', tone: 'info', hint: 'Production / achat en cours en Chine.' },
  preparing: { label: 'En préparation', tone: 'info', hint: 'Consolidation dans notre entrepôt.' },
  shipped: { label: 'Expédié', tone: 'info', hint: 'Le conteneur a quitté la Chine.' },
  arrived: { label: 'Arrivé', tone: 'success', hint: 'Marchandise arrivée, distribution en cours.' },
  completed: { label: 'Terminé', tone: 'success' },
  cancelled: { label: 'Annulé', tone: 'neutral' }
};

export const GROUPAGE_STEPS = [
  { key: 'open', label: 'Collecte', statuses: ['open', 'almost_full'] },
  { key: 'full', label: 'Objectif atteint', statuses: ['full', 'validated'] },
  { key: 'order', label: 'Commande usine', statuses: ['supplier_ordered', 'preparing'] },
  { key: 'ship', label: 'Expédition', statuses: ['shipped'] },
  { key: 'arrived', label: 'Distribution', statuses: ['arrived', 'completed'] }
];

/** Transitions autorisées (identiques aux règles appliquées en base). */
export const GROUPAGE_NEXT: Record<string, string[]> = {
  draft: ['open'],
  open: ['validated'],
  almost_full: ['validated'],
  full: ['validated'],
  validated: ['supplier_ordered'],
  supplier_ordered: ['preparing', 'shipped'],
  preparing: ['shipped'],
  shipped: ['arrived'],
  arrived: ['completed'],
  completed: [],
  cancelled: []
};

export const GROUPAGE_STATUS_FLOW = [
  'draft',
  'open',
  'almost_full',
  'full',
  'validated',
  'supplier_ordered',
  'preparing',
  'shipped',
  'arrived',
  'completed'
];

export const PARTICIPANT_STATUS: StatusMap = {
  reserved: { label: 'À payer', tone: 'warning' },
  confirmed: { label: 'Confirmée', tone: 'info' },
  paid: { label: 'Payée', tone: 'success' },
  cancelled: { label: 'Annulée', tone: 'neutral' },
  refunded: { label: 'Remboursée', tone: 'neutral' }
};

export type RequestType = 'sourcing' | 'b2b' | 'vehicle';

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  sourcing: 'Sourcing',
  b2b: 'Professionnel (B2B)',
  vehicle: 'Automobile'
};

export const SOURCING_STATUS: StatusMap = {
  new: { label: 'Reçue', tone: 'brand', hint: 'Votre demande est en file d’analyse.' },
  researching: { label: 'Recherche fournisseurs', tone: 'info', hint: 'Nous interrogeons nos fournisseurs en Chine.' },
  supplier_found: { label: 'Fournisseur identifié', tone: 'info', hint: 'Nous vérifions qualité, prix et délais.' },
  negotiating: { label: 'Négociation', tone: 'info', hint: 'Nous négocions les meilleures conditions.' },
  quote_ready: { label: 'Devis en préparation', tone: 'info', hint: 'Votre proposition arrive très vite.' },
  quote_sent: { label: 'Devis à valider', tone: 'warning', hint: 'Consultez et validez votre devis.' },
  accepted: { label: 'Devis accepté', tone: 'success', hint: 'Réglez l’acompte pour lancer la commande.' },
  rejected: { label: 'Refusée', tone: 'neutral' },
  ordered: { label: 'Commandée', tone: 'success', hint: 'La commande est lancée auprès du fournisseur.' },
  completed: { label: 'Terminée', tone: 'success' },
  cancelled: { label: 'Annulée', tone: 'neutral' }
};

export const SOURCING_STEPS = [
  { key: 'request', label: 'Demande', statuses: [] as string[] },
  { key: 'analysis', label: 'Analyse', statuses: ['new'] },
  { key: 'search', label: 'Recherche fournisseur', statuses: ['researching', 'supplier_found'] },
  { key: 'quote', label: 'Proposition / devis', statuses: ['negotiating', 'quote_ready'] },
  { key: 'validation', label: 'Validation', statuses: ['quote_sent'] },
  { key: 'order', label: 'Commande', statuses: ['accepted'] },
  { key: 'tracking', label: 'Suivi', statuses: ['ordered'] }
];

export const B2B_STATUS: StatusMap = {
  new: { label: 'Reçue', tone: 'brand', hint: 'Un conseiller étudie votre besoin.' },
  qualified: { label: 'Qualifiée', tone: 'info', hint: 'Besoin validé, recherche en cours.' },
  sourcing: { label: 'Sourcing en cours', tone: 'info', hint: 'Nous consultons plusieurs usines.' },
  negotiation: { label: 'Négociation', tone: 'info', hint: 'Nous négocions prix, MOQ et délais.' },
  quote_ready: { label: 'Devis en préparation', tone: 'info' },
  quote_sent: { label: 'Devis à valider', tone: 'warning', hint: 'Votre offre est disponible.' },
  accepted: { label: 'Devis accepté', tone: 'success', hint: 'Réglez l’acompte pour lancer la production.' },
  rejected: { label: 'Refusée', tone: 'neutral' },
  deposit_paid: { label: 'Acompte reçu', tone: 'success', hint: 'Production en cours de lancement.' },
  production: { label: 'En production', tone: 'info' },
  shipping: { label: 'Expédition', tone: 'info' },
  completed: { label: 'Livrée', tone: 'success' },
  cancelled: { label: 'Annulée', tone: 'neutral' }
};

export const B2B_STEPS = [
  { key: 'request', label: 'Demande', statuses: [] as string[] },
  { key: 'qualification', label: 'Qualification', statuses: ['new'] },
  { key: 'sourcing', label: 'Sourcing', statuses: ['qualified', 'sourcing', 'negotiation', 'quote_ready'] },
  { key: 'quote', label: 'Devis', statuses: ['quote_sent'] },
  { key: 'deposit', label: 'Acompte', statuses: ['accepted'] },
  { key: 'production', label: 'Production', statuses: ['deposit_paid', 'production'] },
  { key: 'shipping', label: 'Expédition', statuses: ['shipping'] }
];

export const VEHICLE_REQUEST_STATUS: StatusMap = {
  new: { label: 'Reçue', tone: 'brand', hint: 'Un conseiller automobile vous recontacte.' },
  in_review: { label: 'En étude', tone: 'info', hint: 'Vérification disponibilité, prix et transport.' },
  quote_sent: { label: 'Devis à valider', tone: 'warning', hint: 'Votre offre est disponible.' },
  accepted: { label: 'Devis accepté', tone: 'success', hint: 'Réglez l’acompte pour réserver le véhicule.' },
  deposit_paid: { label: 'Acompte reçu', tone: 'success' },
  ordered: { label: 'Commandé', tone: 'info' },
  shipped: { label: 'Expédié', tone: 'info' },
  delivered: { label: 'Livré', tone: 'success' },
  cancelled: { label: 'Annulée', tone: 'neutral' }
};

export const VEHICLE_REQUEST_STEPS = [
  { key: 'request', label: 'Demande', statuses: [] as string[] },
  { key: 'review', label: 'Étude', statuses: ['new', 'in_review'] },
  { key: 'quote', label: 'Devis', statuses: ['quote_sent'] },
  { key: 'deposit', label: 'Acompte', statuses: ['accepted'] },
  { key: 'order', label: 'Commande', statuses: ['deposit_paid', 'ordered'] },
  { key: 'shipping', label: 'Expédition', statuses: ['shipped'] },
  { key: 'delivery', label: 'Livraison', statuses: [] as string[] }
];

export const QUOTE_STATUS: StatusMap = {
  draft: { label: 'Brouillon', tone: 'neutral' },
  sent: { label: 'À valider', tone: 'warning' },
  viewed: { label: 'À valider', tone: 'warning' },
  accepted: { label: 'Accepté', tone: 'success' },
  rejected: { label: 'Refusé', tone: 'neutral' },
  expired: { label: 'Expiré', tone: 'neutral' },
  cancelled: { label: 'Remplacé', tone: 'neutral' },
  superseded: { label: 'Remplacé', tone: 'neutral' }
};

export const VEHICLE_STATUS: StatusMap = {
  available: { label: 'Disponible', tone: 'success' },
  on_order: { label: 'Sur commande', tone: 'info' },
  reserved: { label: 'Réservé', tone: 'ochre' },
  sold: { label: 'Vendu', tone: 'neutral' }
};

export const REQUEST_STATUS: Record<RequestType, StatusMap> = {
  sourcing: SOURCING_STATUS,
  b2b: B2B_STATUS,
  vehicle: VEHICLE_REQUEST_STATUS
};

export const REQUEST_STEPS: Record<RequestType, { key: string; label: string; statuses: string[] }[]> = {
  sourcing: SOURCING_STEPS,
  b2b: B2B_STEPS,
  vehicle: VEHICLE_REQUEST_STEPS
};

export const REQUEST_FINAL_STATUSES: Record<RequestType, string[]> = {
  sourcing: ['completed'],
  b2b: ['completed'],
  vehicle: ['delivered']
};

export const REQUEST_CLOSED_STATUSES = ['cancelled', 'rejected'];

export function statusMeta(map: StatusMap, status?: string | null): StatusMeta {
  if (!status) return { label: '—', tone: 'neutral' };
  return map[status] || { label: status.replace(/_/g, ' '), tone: 'neutral' };
}

/**
 * Index de l'étape courante d'un parcours (les étapes précédentes sont terminées).
 * Retourne steps.length si le parcours est entièrement terminé.
 */
export function currentStepIndex(
  steps: { statuses: string[] }[],
  status: string | null | undefined,
  finalStatuses: string[] = []
): number {
  if (!status) return 0;
  if (finalStatuses.includes(status)) return steps.length;
  const idx = steps.findIndex(s => s.statuses.includes(status));
  return idx === -1 ? 0 : idx;
}

export const VEHICLE_TYPE_LABEL: Record<string, string> = {
  car: 'Voiture',
  suv: 'SUV / 4x4',
  pickup: 'Pick-up',
  van: 'Minibus / Van',
  truck: 'Camion',
  bus: 'Bus',
  motorcycle: 'Moto',
  scooter: 'Scooter',
  tricycle: 'Tricycle',
  machinery: 'Engin',
  other: 'Autre'
};

export const FUEL_LABEL: Record<string, string> = {
  petrol: 'Essence',
  diesel: 'Diesel',
  electric: 'Électrique',
  hybrid: 'Hybride',
  lpg: 'GPL',
  other: 'Autre'
};

export const TRANSMISSION_LABEL: Record<string, string> = {
  manual: 'Manuelle',
  automatic: 'Automatique'
};

export const CONDITION_LABEL: Record<string, string> = {
  new: 'Neuf',
  used: 'Occasion',
  refurbished: 'Reconditionné'
};

export const TRANSPORT_LABEL: Record<string, string> = {
  air: 'Fret aérien',
  sea: 'Fret maritime',
  express: 'Express'
};

export const COST_TYPE_LABEL: Record<string, string> = {
  supplier: 'Achat fournisseur',
  sourcing: 'Sourcing',
  inspection: 'Contrôle qualité',
  consolidation: 'Consolidation',
  transport: 'Transport',
  customs: 'Douane',
  payment_fee: 'Frais de paiement',
  other: 'Autre'
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bank_transfer: 'Virement bancaire',
  cash: 'Espèces',
  cheque: 'Chèque',
  mobile_money_manual: 'Mobile money (hors passerelle)',
  wave: 'Wave',
  orange_money: 'Orange Money',
  mtn_money: 'MTN MoMo',
  card: 'Carte bancaire'
};

export const PAYMENT_PROVIDER_LABEL: Record<string, string> = { saspay: 'SasPay', geniuspay: 'GeniusPay', manual: 'Encaissement manuel' };

export const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrateur général',
  transitaire: 'Transitaire / Sourceur',
  groupage_manager: 'Gestionnaire groupages',
  client: 'Client'
};
