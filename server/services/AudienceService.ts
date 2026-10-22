import { hasServiceRole } from '../config';
import { getSupabaseServerClient } from '../middleware/auth';

/**
 * Statistiques de visite maison : page vue -> une ligne en base, sans donnée personnelle.
 * Le pays vient de l'en-tête ajouté par l'hébergeur (Vercel) ; l'adresse IP n'est jamais enregistrée.
 */

export interface TrackInput {
  sid: string;
  event: string;
  path: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  lang: string;
  newSession: boolean;
}

const SEARCH = ['google', 'bing', 'yahoo', 'duckduckgo', 'ecosia', 'qwant', 'yandex', 'baidu'];
const SOCIAL: [RegExp, string][] = [
  [/(^|\.)whatsapp\.(com|net)$|(^|\.)wa\.me$/, 'whatsapp'],
  [/(^|\.)(facebook|fb)\.(com|me)$|(^|\.)fbcdn\.net$/, 'facebook'],
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)tiktok\.com$/, 'tiktok'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, 'x'],
  [/(^|\.)linkedin\.com$|(^|\.)lnkd\.in$/, 'linkedin'],
  [/(^|\.)snapchat\.com$/, 'snapchat'],
  [/(^|\.)telegram\.(org|me)$|(^|\.)t\.me$/, 'telegram']
];

/** Source de la visite : paramètre utm_source, sinon site d'origine, sinon « direct ». */
export function classifySource(referrer: string, utmSource: string, ownHost: string): { source: string; medium: string | null; host: string | null } {
  const utm = utmSource.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40);
  let host: string | null = null;
  try {
    host = referrer ? new URL(referrer).hostname.toLowerCase().replace(/^www\./, '') : null;
  } catch {
    host = null;
  }
  if (host && ownHost && (host === ownHost || host.endsWith('.' + ownHost))) host = null;
  if (utm) {
    const alias: Record<string, string> = { wa: 'whatsapp', ig: 'instagram', fb: 'facebook', tt: 'tiktok' };
    return { source: alias[utm] || utm, medium: null, host };
  }
  if (!host) return { source: 'direct', medium: null, host: null };
  const engine = SEARCH.find(e => host!.split('.').includes(e));
  if (engine) return { source: engine, medium: 'organic', host };
  for (const [re, name] of SOCIAL) if (re.test(host)) return { source: name, medium: 'social', host };
  return { source: host.slice(0, 60), medium: 'referral', host };
}

export function classifyDevice(ua: string): string {
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) return 'tablette';
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'ordinateur';
}

export const isBot = (ua: string) => !ua || /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|lighthouse|headless|pingdom|uptime|curl|wget|python-requests|axios/i.test(ua);

const ALLOWED_EVENTS = new Set(['page_view', 'add_to_cart', 'begin_checkout', 'sign_up', 'login', 'request_quote', 'join_groupage', 'search', 'assistant_question', 'whatsapp_click']);

const hits = new Map<string, number[]>();
function rateLimited(key: string): boolean {
  const now = Date.now();
  const list = (hits.get(key) || []).filter(t => now - t < 60_000);
  if (list.length >= 60) return true;
  list.push(now);
  hits.set(key, list);
  if (hits.size > 10_000) for (const [k, v] of hits) if (!v.some(t => now - t < 60_000)) hits.delete(k);
  return false;
}

export async function recordEvent(input: TrackInput, meta: { ip: string; ua: string; country: string | null; ownHost: string; userId: string | null }): Promise<'ok' | 'skipped'> {
  if (!hasServiceRole || isBot(meta.ua) || rateLimited(meta.ip)) return 'skipped';
  if (!/^[a-z0-9-]{8,64}$/i.test(input.sid)) return 'skipped';
  const event = ALLOWED_EVENTS.has(input.event) ? input.event : null;
  if (!event) return 'skipped';
  const path = (input.path || '/').split('?')[0].split('#')[0].slice(0, 200) || '/';
  // Pages privées : on compte la visite sans enregistrer le détail des espaces client et pro
  const safePath = /^\/(compte|espace-pro|commande|paiement|bienvenue|invitation|mot-de-passe)/.test(path) ? `/${path.split('/')[1]}` : path;
  const { source, medium, host } = classifySource(input.referrer, input.utmSource, meta.ownHost);
  const country = meta.country && /^[A-Z]{2}$/.test(meta.country) ? meta.country : null;
  const { error } = await getSupabaseServerClient()
    .from('analytics_events')
    .insert({
      session_id: input.sid,
      event,
      path: safePath,
      source,
      medium: input.utmMedium.slice(0, 40) || medium,
      campaign: input.utmCampaign.slice(0, 80) || null,
      referrer_host: host,
      country,
      device: classifyDevice(meta.ua),
      lang: input.lang.slice(0, 8) || null,
      is_new_session: Boolean(input.newSession),
      user_id: meta.userId
    });
  if (error) {
    // Table absente (migration non appliquée) ou autre : la navigation ne doit jamais en souffrir
    if (error.code !== '42P01' && error.code !== 'PGRST205') console.warn('[audience]', error.message);
    return 'skipped';
  }
  return 'ok';
}
