import { supabase } from './supabase';

export { supabase };

export class AppError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

const CODE_MESSAGES: Record<string, string> = {
  AUTHENTICATION_REQUIRED: 'Connectez-vous pour continuer.',
  PERMISSION_DENIED: 'Vous n’avez pas les droits nécessaires pour cette action.',
  NOT_FOUND: 'Élément introuvable.',
  INVALID_INPUT: 'Certaines informations sont invalides.',
  INVALID_STATUS: 'Statut non autorisé.',
  INVALID_STATE: 'Cette action n’est plus possible à ce stade.',
  INVALID_TYPE: 'Type de demande invalide.',
  INVALID_ROLE: 'Rôle invalide.',
  PAYMENT_REQUIRED: 'La commande doit être payée avant cette étape.',
  ALREADY_PAID: 'Ce montant est déjà réglé.',
  QUOTE_EXPIRED: 'Ce devis a expiré.',
  GROUPAGE_CLOSED: 'Ce groupage n’accepte plus de participations.',
  GROUPAGE_EXPIRED: 'La date limite de ce groupage est dépassée.',
  NOT_CANCELLABLE: 'Cette participation ne peut plus être annulée en ligne.',
  EMAIL_MISMATCH: 'Connectez-vous avec l’adresse email invitée.',
  EXPIRED: 'Ce lien a expiré.'
};

const MIGRATION_MESSAGE =
  'Cette fonctionnalité nécessite la mise à jour de la base de données Dallou Chine (migration à appliquer par l’administrateur).';

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Transforme une erreur Supabase / réseau / métier en message lisible par un client. */
export function friendlyError(err: unknown): string {
  if (!err) return 'Une erreur inattendue est survenue.';
  const e = err as { message?: string; code?: string; error_description?: string };
  const msg = String(e.message || e.error_description || err);
  const code = e.code;

  if (code === 'PGRST202' || code === 'PGRST205' || /Could not find the (function|table)/i.test(msg)) {
    return MIGRATION_MESSAGE;
  }
  if (/column .* does not exist/i.test(msg) && code === '42703') return MIGRATION_MESSAGE;

  const prefixed = msg.match(/^([A-Z_]{4,}):\s*([\s\S]+)$/);
  if (prefixed) return capitalize(prefixed[2].trim());
  const bare = msg.match(/^([A-Z_]{4,})$/);
  if (bare) return CODE_MESSAGES[bare[1]] || 'Action impossible.';

  if (code === '42501' || /permission denied|row-level security/i.test(msg)) return CODE_MESSAGES.PERMISSION_DENIED;
  if (code === '23505' || /duplicate key/i.test(msg)) return 'Cet élément existe déjà (identifiant ou lien déjà utilisé).';
  if (/Failed to fetch|NetworkError|Load failed|network/i.test(msg)) return 'Connexion impossible. Vérifiez votre réseau et réessayez.';
  if (/Invalid login credentials/i.test(msg)) return 'Identifiant ou mot de passe incorrect.';
  if (/User already registered|already been registered/i.test(msg)) return 'Un compte existe déjà avec cet identifiant. Connectez-vous.';
  if (/Password should be at least/i.test(msg)) return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (/Email not confirmed/i.test(msg)) return 'Confirmez votre adresse email via le lien reçu avant de vous connecter.';
  if (/rate limit|too many requests/i.test(msg)) return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
  if (/JWT|token is expired|invalid claim/i.test(msg)) return 'Votre session a expiré. Reconnectez-vous.';
  return msg;
}

export function isMigrationError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return e?.code === 'PGRST202' || e?.code === 'PGRST205' || /Could not find the (function|table)/i.test(String(e?.message || ''));
}

/** Appel d'une fonction Postgres (RPC) avec erreurs normalisées. */
export async function rpc<T = unknown>(fn: string, params?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) throw new AppError(friendlyError(error), error.code);
  return data as T;
}

/** Lève une AppError lisible si la requête a échoué. */
export function unwrap<T>(res: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (res.error) throw new AppError(friendlyError(res.error), res.error.code);
  return res.data as T;
}
