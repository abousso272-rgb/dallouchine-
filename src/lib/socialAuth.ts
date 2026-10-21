import { supabase } from './supabase';

export type SocialProvider = 'google' | 'facebook' | 'linkedin_oidc';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://splsjtguapquznbiacad.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let cache: Promise<SocialProvider[]> | null = null;

/**
 * Fournisseurs de connexion réellement activés dans Supabase (réglage public).
 * Un bouton n'est affiché que si le fournisseur est actif : aucun bouton ne mène à une erreur.
 */
export function getEnabledProviders(): Promise<SocialProvider[]> {
  if (!cache) {
    cache = fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: SUPABASE_ANON_KEY ? { apikey: SUPABASE_ANON_KEY } : {} })
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        const ext = (json?.external || {}) as Record<string, boolean>;
        const out: SocialProvider[] = [];
        if (ext.google) out.push('google');
        if (ext.facebook) out.push('facebook');
        if (ext.linkedin_oidc || ext.linkedin) out.push('linkedin_oidc');
        return out;
      })
      .catch(() => []);
  }
  return cache;
}

export async function signInWithProvider(provider: SocialProvider): Promise<void> {
  const next = new URLSearchParams(window.location.search).get('next');
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}${next && next.startsWith('/') ? next : '/'}` }
  });
  if (error) throw error;
}
