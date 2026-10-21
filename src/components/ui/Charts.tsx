import React from 'react';
import { formatXOFCompact } from '../../lib/format';

const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
const monthLongFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

/** Histogramme mensuel : barres = chiffre d'affaires, point = marge. Accessible via un tableau masqué. */
export function MonthlyChart({ data }: { data: { month: string; revenue_xof: number; margin_xof: number }[] }) {
  const W = 640;
  const H = 230;
  const padL = 8;
  const padB = 28;
  const padT = 14;
  const max = Math.max(1, ...data.map(d => Math.max(d.revenue_xof, d.margin_xof)));
  const slot = (W - padL * 2) / Math.max(1, data.length);
  const barW = Math.min(46, slot * 0.56);
  const y = (v: number) => padT + (H - padT - padB) * (1 - Math.max(0, v) / max);
  const empty = data.every(d => d.revenue_xof === 0);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Chiffre d’affaires et marge par mois">
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={padL} x2={W - padL} y1={y(max * f)} y2={y(max * f)} stroke="var(--color-line)" strokeDasharray="3 4" />
        ))}
        <line x1={padL} x2={W - padL} y1={y(0)} y2={y(0)} stroke="var(--color-line-2)" />
        {data.map((d, i) => {
          const cx = padL + slot * i + slot / 2;
          const top = y(d.revenue_xof);
          return (
            <g key={d.month}>
              <title>{`${monthLongFmt.format(new Date(d.month))} : CA ${formatXOFCompact(d.revenue_xof)}, marge ${formatXOFCompact(d.margin_xof)}`}</title>
              <rect x={cx - barW / 2} y={top} width={barW} height={Math.max(0, y(0) - top)} rx={6} fill="var(--color-brand-100)" />
              {d.margin_xof > 0 && <rect x={cx - barW / 2} y={y(d.margin_xof)} width={barW} height={Math.max(0, y(0) - y(d.margin_xof))} rx={6} fill="var(--color-brand)" />}
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="12" fill="var(--color-muted)" style={{ textTransform: 'capitalize' }}>
                {monthFmt.format(new Date(d.month)).replace('.', '')}
              </text>
              {d.revenue_xof > 0 && (
                <text x={cx} y={Math.max(11, top - 5)} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-ink)">
                  {formatXOFCompact(d.revenue_xof).replace(' FCFA', '')}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {empty && <p className="-mt-2 text-center text-[13px] text-muted">Aucune vente encaissée sur la période.</p>}
      <div className="mt-2 flex flex-wrap items-center gap-4 text-[12px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-100" /> Chiffre d’affaires
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand" /> Marge
        </span>
      </div>
      <table className="sr-only">
        <caption>Chiffre d’affaires et marge par mois</caption>
        <thead>
          <tr>
            <th>Mois</th>
            <th>Chiffre d’affaires</th>
            <th>Marge</th>
          </tr>
        </thead>
        <tbody>
          {data.map(d => (
            <tr key={d.month}>
              <td>{monthLongFmt.format(new Date(d.month))}</td>
              <td>{formatXOFCompact(d.revenue_xof)}</td>
              <td>{formatXOFCompact(d.margin_xof)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Petite courbe de tendance (ex. inscriptions par jour). */
export function Sparkline({ values, label, height = 44 }: { values: number[]; label: string; height?: number }) {
  const W = 220;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? W / (values.length - 1) : W;
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(height - 4 - (v / max) * (height - 10)).toFixed(1)}`);
  const total = values.reduce((s, v) => s + v, 0);
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="h-11 w-full" role="img" aria-label={`${label} : ${total} sur ${values.length} jours`}>
      <polyline points={`0,${height} ${pts.join(' ')} ${W},${height}`} fill="var(--color-brand-50)" stroke="none" />
      <polyline points={pts.join(' ')} fill="none" stroke="var(--color-brand)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
