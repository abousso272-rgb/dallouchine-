import type { AppRole } from './types';

/**
 * Guide de l'espace professionnel : un parcours par rôle, module par module.
 * Chaque module = à quoi il sert, les étapes, les bons réflexes, et un lien direct vers l'écran.
 */

export type StaffRole = Exclude<AppRole, 'client'>;

export interface GuideModule {
  id: string;
  title: string;
  /** Une phrase : à quoi sert ce module. */
  purpose: string;
  steps: string[];
  tips?: string[];
  link?: { to: string; label: string };
  roles: StaffRole[];
}

export const ROLE_INTRO: Record<StaffRole, { title: string; text: string }> = {
  admin: {
    title: 'Administrateur',
    text: 'Vous pilotez l’activité : chiffres, équipe, catalogue, paiements et réglages. Vous voyez tout ce que voient le transitaire et le gestionnaire de groupages.'
  },
  transitaire: {
    title: 'Transitaire / Sourceur',
    text: 'Vous trouvez les produits en Chine, chiffrez les devis, ajoutez les produits au catalogue et suivez l’acheminement des commandes jusqu’à Dakar.'
  },
  groupage_manager: {
    title: 'Gestionnaire de groupages',
    text: 'Vous créez des groupages rentables, les faites remplir, relancez les participants et suivez chaque campagne jusqu’à la livraison.'
  }
};

const ALL: StaffRole[] = ['admin', 'transitaire', 'groupage_manager'];

export const GUIDE_MODULES: GuideModule[] = [
  // -------------------------------------------------------------------- Commun
  {
    id: 'demarrer',
    title: 'Bien démarrer',
    purpose: 'Votre tableau de bord résume ce qui demande votre attention aujourd’hui.',
    steps: [
      'Ouvrez « Tableau de bord » : les cartes chiffrées sont cliquables et mènent à la liste correspondante.',
      'Le bloc « Actions rapides » donne accès en un clic aux tâches les plus courantes de votre rôle.',
      'Les chiffres se mettent à jour automatiquement (indicateur « En direct »).',
      'Le bouton « Guide de mon espace », en haut du menu, ramène à cette page à tout moment.'
    ],
    tips: ['Commencez chaque journée par le tableau de bord : il liste les urgences avant tout le reste.'],
    link: { to: '/espace-pro', label: 'Ouvrir le tableau de bord' },
    roles: ALL
  },
  {
    id: 'categories',
    title: 'Catégories',
    purpose: 'Les catégories rangent le catalogue et le menu du site (méga-menu, accueil).',
    steps: [
      'Menu « Catégories » : la liste complète, avec image et ordre d’affichage.',
      'Bouton « Nouvelle catégorie » : nom, description courte, image.',
      'Vous pouvez aussi créer une catégorie sans quitter l’écran en cours : lien « Nouvelle catégorie » sous chaque choix de catégorie (fiche produit, tableur, nouveau produit de groupage).',
      'Une catégorie « masquée » reste dans l’espace pro mais disparaît du site.'
    ],
    tips: ['Préférez des catégories larges (« Énergie solaire ») à des catégories trop fines : le client s’y retrouve mieux.', 'Seul l’administrateur peut supprimer une catégorie.'],
    link: { to: '/espace-pro/categories', label: 'Gérer les catégories' },
    roles: ALL
  },

  // -------------------------------------------------------------------- Produits & coûts
  {
    id: 'produits',
    title: 'Ajouter un produit (fiche complète)',
    purpose: 'Une fiche produit = ce que voit le client : photos, description, prix, caractéristiques.',
    steps: [
      'Menu « Produits » puis « Nouveau produit » (ou Actions rapides > Ajouter un produit).',
      'Renseignez le nom, la catégorie (ou créez-en une), les photos (la première est l’image principale), la description et les points forts.',
      'Prix de vente, quantité minimum, poids, mode de transport et délai.',
      'Partie « Coûts » (visible par l’équipe seulement) : prix d’achat, coûts logistiques, fournisseur. La marge s’affiche en direct.',
      'Enregistrez : le produit reste en brouillon tant qu’il n’est pas publié.'
    ],
    tips: ['Publier un produit ou changer le prix d’un produit en ligne demande les permissions « Publier » et « Fixer les prix » (profil Autonome).', 'Le poids et le volume rendent le calcul du transport juste dans le panier du client.'],
    link: { to: '/espace-pro/produits/nouveau', label: 'Ajouter un produit' },
    roles: ['admin', 'transitaire']
  },
  {
    id: 'tableur',
    title: 'Tableur produits (comme Excel)',
    purpose: 'Saisir ou mettre à jour beaucoup de produits d’un coup, avec le coût livré et la marge calculés automatiquement.',
    steps: [
      'Menu « Tableur produits ». Une ligne = un produit.',
      'Remplissez : nom, catégorie, prix négocié (¥), quantité minimum, poids, volume, transport, prix de vente. Le cargo peut rester vide : il est estimé avec la grille de fret.',
      'Colonne « Résultat » : coût livré par unité, marge (vert = bonne, orange = faible, rouge = à perte) et prix conseillé (cliquez pour l’appliquer).',
      'Pour aller vite : copiez des cellules depuis Excel et collez-les dans une case, ou « Importer » un fichier Excel/CSV. Le bouton « Modèle Excel » donne un fichier prêt à remplir.',
      '« Enregistrer le tableau » : chaque ligne est enregistrée séparément ; les lignes en erreur sont expliquées en rouge.',
      'Les nouveaux produits sont créés en brouillon : ouvrez leur fiche (icône flèche) pour ajouter photos et description, puis publiez.'
    ],
    tips: [
      '« Plus de colonnes » affiche référence, fournisseur, prix affiché avant négociation, délai et notes.',
      'Une ligne avec la même référence qu’un produit existant met ce produit à jour au lieu d’en créer un nouveau.',
      'Les nombres peuvent s’écrire avec une virgule : 12,5 ou 0,002.'
    ],
    link: { to: '/espace-pro/tableur', label: 'Ouvrir le tableur' },
    roles: ALL
  },
  {
    id: 'taux',
    title: 'Taux de change',
    purpose: 'Le taux yuan → FCFA sert à tous les calculs de coût (tableur, devis, groupages).',
    steps: [
      'Actions rapides > « Taux de change », ou « Modifier le taux » dans le tableur et le calculateur.',
      'Saisissez la valeur de 1 ¥ en FCFA (et du dollar si besoin), puis enregistrez.',
      'Chaque changement est conservé dans l’historique avec son auteur.'
    ],
    tips: ['Une variation de plus de 30 % d’un coup est refusée pour éviter une faute de frappe.', 'Les calculs ajoutent automatiquement un petit tampon de change pour vous protéger d’une hausse du yuan.'],
    roles: ['admin', 'transitaire']
  },

  // -------------------------------------------------------------------- Transitaire
  {
    id: 'demandes',
    title: 'Demandes de sourcing et devis',
    purpose: 'Transformer une demande client (photo, lien 1688, description) en devis clair et payable en ligne.',
    steps: [
      'Menu « Demandes & devis » : les nouvelles demandes sont en tête. Le tableau de bord indique celles qui attendent depuis plus de 24 h.',
      'Ouvrez une demande, attribuez-la-vous et passez le statut à « Recherche fournisseurs ».',
      'Ajoutez les fournisseurs trouvés (lien, prix en ¥, minimum, délai) et retenez le meilleur.',
      'Cliquez « Créer un devis » : la section « Calculer le prix à partir du coût réel » remplit les lignes, le transport, la douane et les frais à partir du prix en ¥.',
      'Vérifiez la « Marge réelle » puis envoyez : le client est notifié et peut accepter et payer l’acompte en ligne.',
      'Échangez avec le client dans le fil de messages en bas de la demande.'
    ],
    tips: ['Un devis vendu à perte ne part qu’après une confirmation explicite.', 'Répondre vite fait gagner des ventes : visez un premier devis en moins de 24 h.'],
    link: { to: '/espace-pro/demandes', label: 'Voir les demandes' },
    roles: ['admin', 'transitaire']
  },
  {
    id: 'calculateur',
    title: 'Calculateur de prix',
    purpose: 'Répondre en une minute à « combien ça coûte livré à Dakar ? », sans créer de devis.',
    steps: [
      'Menu « Calculateur de prix ».',
      'Quantité, prix unitaire en ¥, poids et volume d’une unité, transport, marge visée.',
      'Lisez le prix de vente conseillé, le coût livré par unité, le détail (marchandise, fret, douane, contrôle) et la marge.'
    ],
    tips: ['Le volume compte autant que le poids : un colis léger mais encombrant coûte cher en avion.'],
    link: { to: '/espace-pro/calculateur', label: 'Ouvrir le calculateur' },
    roles: ['admin', 'transitaire']
  },
  {
    id: 'commandes',
    title: 'Commandes et acheminement',
    purpose: 'Faire avancer une commande payée jusqu’à la livraison et enregistrer ce qu’elle a coûté.',
    steps: [
      'Menu « Commandes » : filtrez « À traiter » pour les commandes payées.',
      'Dans la commande, changez l’étape (Commandée en Chine, En préparation, Expédiée…) avec un lieu et un message : le client est notifié à chaque étape.',
      'Renseignez le mode de transport, la référence transporteur et la date de livraison estimée.',
      'Bloc « Coûts & marge » : ajoutez le coût « Achat fournisseur », le transport, la douane… La marge réelle de la commande se met à jour.'
    ],
    tips: ['Une commande non payée ne peut pas passer aux étapes logistiques.', 'Sans coût « Achat fournisseur », la marge de la commande reste « à chiffrer » dans la page Finance.'],
    link: { to: '/espace-pro/commandes', label: 'Voir les commandes' },
    roles: ['admin', 'transitaire']
  },

  // -------------------------------------------------------------------- Groupages
  {
    id: 'groupage-creer',
    title: 'Créer un groupage rentable',
    purpose: 'Lancer une commande collective dont vous connaissez le bénéfice avant même de la publier.',
    steps: [
      '« Nouveau groupage » (tableau de bord ou menu Groupages).',
      'Produit : choisissez-le dans le catalogue, ou « Nouveau produit (pas encore dans le catalogue) » pour le créer sur place avec sa photo et ses coûts.',
      'Prix & objectif : prix groupage par unité, prix hors groupage (prix du marché local), objectif, minimum fournisseur, minimum et maximum par participant.',
      'Bloc « Rentabilité du groupage » : prix d’achat (¥), poids, volume, cargo (optionnel), frais fixes de la campagne (dédouanement groupé, livraison locale, publicité).',
      'Lisez le seuil de rentabilité (unités à vendre pour ne rien perdre), le bénéfice à l’objectif et le prix conseillé. Les alertes rouges ou orange disent quoi corriger.',
      'Calendrier : date limite, départ et arrivée estimés, délai pour payer une réservation. Puis « Créer le groupage (brouillon) ».',
      'Quand tout est prêt, passez l’étape à « Ouvert » : les clients peuvent participer.'
    ],
    tips: [
      'Règle d’or : le seuil de rentabilité doit être inférieur au minimum fournisseur. Sinon, vous perdez de l’argent si la campagne s’arrête au minimum.',
      'Une économie client de 15 à 30 % par rapport au prix du marché attire bien plus de participants.',
      'Le « Simulateur de groupage » permet de tester un prix avant de créer quoi que ce soit.'
    ],
    link: { to: '/espace-pro/groupages/nouveau', label: 'Créer un groupage' },
    roles: ['admin', 'groupage_manager']
  },
  {
    id: 'simulateur',
    title: 'Simulateur de groupage',
    purpose: 'Tester une idée de groupage (prix, quantités, coûts) en deux minutes, sans rien publier.',
    steps: [
      'Menu « Simulateur de groupage ».',
      'Renseignez la campagne (prix, prix hors groupage, minimum fournisseur, objectif, transport) puis les coûts.',
      'Comparez les scénarios : minimum fournisseur, intermédiaire, objectif, au-delà.',
      'Satisfait ? « Créer ce groupage » ouvre le formulaire déjà rempli avec vos chiffres.'
    ],
    tips: ['Le transitaire peut l’utiliser pour proposer une campagne chiffrée au gestionnaire ou à l’administrateur.'],
    link: { to: '/espace-pro/simulateur-groupage', label: 'Ouvrir le simulateur' },
    roles: ALL
  },
  {
    id: 'groupage-piloter',
    title: 'Piloter un groupage en cours (cockpit)',
    purpose: 'Savoir si la campagne atteindra son minimum à temps, et agir avant qu’il ne soit trop tard.',
    steps: [
      'Ouvrez le groupage : le cockpit indique « Sur la bonne voie », « À risque » ou « Critique », avec la date prévue d’atteinte du minimum.',
      'Rythme actuel, prévision, inscriptions des 14 derniers jours, argent encaissé et à verser au fournisseur.',
      '« Partager sur WhatsApp » : message prêt à envoyer dans vos groupes, avec le lien du groupage.',
      '« Réservations qui expirent dans moins de 24 h » : relancez en un clic par notification, ou un par un sur WhatsApp.',
      'Publiez une actualité (photos de production, date de départ) : les participants sont notifiés.'
    ],
    tips: ['Si le cockpit passe en « Critique » : prolongez la date limite, baissez le prix (si vous en avez le droit) ou préparez l’annulation.'],
    link: { to: '/espace-pro/groupages', label: 'Voir mes groupages' },
    roles: ['admin', 'groupage_manager']
  },
  {
    id: 'groupage-etapes',
    title: 'Étapes, participants et remboursements',
    purpose: 'Faire avancer la campagne jusqu’à la livraison et gérer chaque participant.',
    steps: [
      'Bloc « Étape du groupage » : Ouvert → Validé → Commandé à l’usine → En préparation → Expédié → Arrivé. Chaque passage notifie les participants.',
      '« Valider » annule les réservations non payées : seuls les participants qui ont payé continuent.',
      'Liste des participants : téléphone, WhatsApp, statut de paiement. « Retirer » un participant demande un motif, envoyé au client.',
      'Un participant qui avait payé passe en « remboursement à faire » : enregistrez le remboursement avec sa référence.',
      'Exportez la liste en CSV (Excel) pour la distribution.',
      '« Relancer » (en haut du groupage) recrée la même campagne avec un nouveau code et une nouvelle date limite.'
    ],
    tips: ['Un groupage qui n’atteint pas son objectif est annulé et tous les participants sont remboursés : c’est la promesse faite au client.'],
    roles: ['admin', 'groupage_manager']
  },

  // -------------------------------------------------------------------- Admin
  {
    id: 'finance',
    title: 'Finance : marges, trésorerie, prévisions',
    purpose: 'Savoir ce que vous gagnez vraiment, ce qui doit rentrer et ce qui doit sortir.',
    steps: [
      'Menu « Finance ».',
      'Chiffre d’affaires encaissé, marge nette (après achat, transport, douane et frais de paiement), frais de paiement, montant attendu sous 30 jours.',
      'Courbe sur 6 mois, résultats par canal (catalogue, groupages, sourcing…), répartition des coûts.',
      'Trésorerie : en attente de paiement, commandes abandonnées à relancer, remboursements à effectuer.',
      'Listes d’action : commandes sous le seuil de marge, commandes sans coût d’achat (à compléter).',
      '« Taux et objectifs » : taux de change, marge minimale et cible, hypothèses de prévision.'
    ],
    tips: ['Si un bandeau indique que la marge ne porte que sur une partie du chiffre d’affaires, saisissez les coûts manquants : la marge devient exacte.'],
    link: { to: '/espace-pro/finance', label: 'Ouvrir la Finance' },
    roles: ['admin']
  },
  {
    id: 'audience',
    title: 'Audience du site',
    purpose: 'Combien de visiteurs, d’où ils viennent (Google, WhatsApp, Facebook…), de quel pays, et combien deviennent clients.',
    steps: [
      'Menu « Audience du site », période 7, 30 ou 90 jours.',
      'Visites par jour, provenance, pays, appareils, pages les plus vues, pages d’arrivée.',
      '« Du visiteur au client » : visites → demandes de devis → comptes → commandes → paiements.',
      'Bloc Google : liens vers Search Console et Google Analytics, et l’adresse du plan du site à déclarer.'
    ],
    tips: ['Pour mesurer une publicité, ajoutez à son lien : ?utm_source=facebook&utm_campaign=nom-de-la-campagne.'],
    link: { to: '/espace-pro/audience', label: 'Ouvrir l’audience' },
    roles: ['admin']
  },
  {
    id: 'equipe',
    title: 'Équipe, rôles et permissions',
    purpose: 'Inviter vos collaborateurs et décider de leur autonomie.',
    steps: [
      'Menu « Équipe », bloc « Inviter un collaborateur » : email, nom, rôle (Transitaire ou Gestionnaire de groupages), puis « Créer l’invitation ».',
      'Profil « Autonome » (recommandé) : la personne travaille sans vous attendre (publier des produits, fixer les prix, gérer ses produits, voir la rentabilité). « Encadré » : vous validez publication et prix.',
      'Envoyez le lien d’invitation (email ou WhatsApp). Le rôle s’active quand la personne ouvre le lien connectée avec cette adresse email.',
      'Pour un membre existant : « Modifier » change son rôle, ses permissions, ou suspend son compte.'
    ],
    tips: ['Un gestionnaire de groupages crée toujours ses groupages en brouillon ; c’est l’ouverture qui les rend visibles aux clients.'],
    link: { to: '/espace-pro/equipe', label: 'Gérer l’équipe' },
    roles: ['admin']
  },
  {
    id: 'paiements',
    title: 'Paiements, encaissements et remboursements',
    purpose: 'Suivre l’argent reçu et régler les cas particuliers.',
    steps: [
      'Menu « Paiements » : tous les paiements en ligne (Wave, Orange Money, carte) avec leurs frais.',
      'Dans une commande en attente : « Générer un lien de paiement » à envoyer au client (WhatsApp, SMS, email), ou enregistrer un règlement reçu hors ligne (virement, espèces, chèque).',
      'Les remboursements se déclenchent depuis la commande ou depuis le participant du groupage.'
    ],
    link: { to: '/espace-pro/paiements', label: 'Voir les paiements' },
    roles: ['admin']
  },
  {
    id: 'clients',
    title: 'Clients',
    purpose: 'Retrouver un client, ses commandes et ses coordonnées.',
    steps: ['Menu « Clients » : recherche par nom, téléphone ou email.', 'Ouvrez une commande du client pour voir son historique et lui écrire.'],
    link: { to: '/espace-pro/clients', label: 'Voir les clients' },
    roles: ['admin']
  }
];

export function modulesFor(role: StaffRole): GuideModule[] {
  return GUIDE_MODULES.filter(m => m.roles.includes(role));
}
