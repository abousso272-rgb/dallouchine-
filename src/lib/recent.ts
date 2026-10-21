/** Produits consultés récemment (stockés sur l'appareil, rien n'est envoyé au serveur). */
export interface RecentProduct {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  priceXOF: number;
}

const KEY = 'dallouchine_recent_v1';
const MAX = 12;

export function readRecent(): RecentProduct[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter(p => p && typeof p.id === 'string' && typeof p.slug === 'string') : [];
  } catch {
    return [];
  }
}

export function pushRecent(p: RecentProduct) {
  try {
    const next = [p, ...readRecent().filter(x => x.id !== p.id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* stockage indisponible (navigation privée) : fonction facultative */
  }
}

export function clearRecent() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
