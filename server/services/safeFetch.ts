import dns from 'dns/promises';
import net from 'net';

/** Refuse les adresses privées, locales ou réservées (protection SSRF). */
export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return isPrivateAddress(v6.slice(7));
  return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe8') || v6.startsWith('fe9') || v6.startsWith('fea') || v6.startsWith('feb');
}

export class UnsafeUrlError extends Error {}

export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError('Lien invalide.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new UnsafeUrlError('Seuls les liens http(s) sont acceptés.');
  if (url.username || url.password) throw new UnsafeUrlError('Lien invalide.');
  if (url.port && !['80', '443'].includes(url.port)) throw new UnsafeUrlError('Port non autorisé.');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new UnsafeUrlError('Adresse non autorisée.');
  const addresses = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true }).catch(() => []);
  if (!addresses.length) throw new UnsafeUrlError('Ce site est introuvable.');
  if (addresses.some(a => isPrivateAddress(a.address))) throw new UnsafeUrlError('Adresse non autorisée.');
  return url;
}

export interface FetchedPage {
  finalUrl: string;
  status: number;
  contentType: string;
  body: string;
}

/**
 * Télécharge une page publique : redirections suivies manuellement (chacune revalidée),
 * délai court, taille plafonnée.
 */
export async function fetchPublicPage(raw: string, opts: { maxBytes?: number; timeoutMs?: number } = {}): Promise<FetchedPage> {
  const maxBytes = opts.maxBytes ?? 1_500_000;
  const timeoutMs = opts.timeoutMs ?? 10_000;
  let current = raw;
  for (let hop = 0; hop < 4; hop++) {
    const url = await assertPublicUrl(current);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        redirect: 'manual',
        signal: ctrl.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DalucheBot/1.0; +https://daluche.com)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'fr,en;q=0.8,zh;q=0.6'
        }
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        current = new URL(res.headers.get('location')!, url).toString();
        continue;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!/text\/html|application\/xhtml|text\/plain/i.test(contentType)) {
        return { finalUrl: url.toString(), status: res.status, contentType, body: '' };
      }
      const reader = res.body?.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        chunks.push(value);
        if (total >= maxBytes) {
          await reader.cancel();
          break;
        }
      }
      return { finalUrl: url.toString(), status: res.status, contentType, body: Buffer.concat(chunks).toString('utf8') };
    } finally {
      clearTimeout(timer);
    }
  }
  throw new UnsafeUrlError('Trop de redirections.');
}
