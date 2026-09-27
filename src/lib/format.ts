const numberFmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit'
});

export function formatNumber(n: number | string | null | undefined): string {
  const v = Number(n);
  if (n === null || n === undefined || Number.isNaN(v)) return '—';
  return numberFmt.format(Math.round(v));
}

export function formatXOF(n: number | string | null | undefined): string {
  const v = Number(n);
  if (n === null || n === undefined || Number.isNaN(v)) return '—';
  return `${numberFmt.format(Math.round(v))} FCFA`;
}

/** Format compact pour les tableaux de bord : 12,4 M FCFA */
export function formatXOFCompact(n: number | string | null | undefined): string {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Md FCFA`;
  if (abs >= 1_000_000) return `${(v / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M FCFA`;
  if (abs >= 10_000) return `${(v / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} k FCFA`;
  return formatXOF(v);
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return Number.isNaN(date.getTime()) ? '—' : dateFmt.format(date);
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFmt.format(date);
}

export function timeAgo(d: string | Date | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'à l’instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
  return formatDate(date);
}

/** Nombre de jours restants avant une date (négatif si dépassée). */
export function daysUntil(d: string | Date | null | undefined): number | null {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

export function plural(n: number, one: string, many: string): string {
  return `${formatNumber(n)} ${Math.abs(n) > 1 ? many : one}`;
}

export function initials(name?: string | null): string {
  if (!name) return 'D';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p.charAt(0).toUpperCase())
    .join('');
}

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function percent(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}
