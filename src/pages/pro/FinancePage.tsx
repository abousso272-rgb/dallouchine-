import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, Banknote, CircleDollarSign, Landmark, RefreshCw, Settings2, TrendingUp, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { friendlyError } from '../../lib/db';
import { getFinanceOverview, setExchangeRate, updateFinanceTargets, type FinanceOverview } from '../../services/finance';
import { formatDateTime, formatNumber, formatXOF, formatXOFCompact } from '../../lib/format';
import { PageHeader, Stat, Card, CardTitle } from '../../components/ui/Layout';
import { Button } from '../../components/ui/Button';
import { Link } from '../../components/ui/Link';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Field';
import { ErrorState, InlineAlert, Skeleton } from '../../components/ui/States';
import { MonthlyChart } from '../../components/ui/Charts';
import { GroupageRiskBadge } from '../../components/pro/GroupageCockpit';

const KIND_LABEL: Record<string, string> = { catalog: 'Catalogue', groupage: 'Groupages', quote: 'Sourcing sur devis', b2b: 'B2B', vehicle: 'Automobile' };

const TARGET_FIELDS: { key: string; label: string; suffix: string; hint: string }[] = [
  { key: 'min_margin_pct', label: 'Marge minimale', suffix: '%', hint: 'Sous ce seuil, la commande est signalée.' },
  { key: 'target_margin_pct', label: 'Marge cible', suffix: '%', hint: 'Marge proposée par défaut dans le calculateur de devis.' },
  { key: 'quote_conversion_pct', label: 'Devis acceptés (hypothèse)', suffix: '%', hint: 'Utilisée tant que moins de 5 devis sont conclus.' },
  { key: 'payment_rate_pct', label: 'Commandes payées (hypothèse)', suffix: '%', hint: 'Utilisée tant que moins de 10 commandes ont été créées en 30 jours.' },
  { key: 'abandon_hours', label: 'Commande abandonnée après', suffix: 'h', hint: 'Délai sans paiement avant de la considérer abandonnée.' }
];

export default function FinancePage() {
  const { toast } = useApp();
  const overview = useAsync(() => getFinanceOverview(6), [], { cacheKey: 'finance:overview', maxAge: 30000 });
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (overview.loading && !overview.data) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }
  if (overview.error || !overview.data) return <ErrorState message={overview.error || 'Données indisponibles.'} onRetry={overview.reload} />;
  const o = overview.data;

  return (
    <>
      <PageHeader guide="finance"
        eyebrow="Pilotage"
        title="Finance"
        description="Ce que vous encaissez, ce que ça vous coûte vraiment, ce qui reste, et ce qui devrait rentrer dans les 30 prochains jours."
        actions={
          <>
            <Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={overview.reload} loading={overview.loading}>
              Actualiser
            </Button>
            <Button variant="dark" icon={<Settings2 className="h-4 w-4" />} onClick={() => setSettingsOpen(true)}>
              Taux et objectifs
            </Button>
          </>
        }
      />

      {o.orders_missing_costs > 0 && (
        <div className="mb-6">
          <InlineAlert
            tone="warning"
            title={`La marge est calculée sur ${formatNumber(o.coverage_pct)} % du chiffre d’affaires`}
            action={
              <Button size="sm" variant="secondary" to="/espace-pro/commandes?paiement=paid">
                Saisir les coûts manquants
              </Button>
            }
          >
            {o.orders_missing_costs} commande(s) payée(s) n’ont aucun coût d’achat connu (ni saisi, ni dans la fiche produit) : leur marge n’est pas comptée plutôt que d’être surestimée.
          </InlineAlert>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat tone="brand" label="Chiffre d’affaires encaissé" value={formatXOFCompact(o.revenue_xof)} hint={`${formatNumber(o.orders_paid)} commande(s) payée(s)`} icon={<Wallet className="h-4 w-4" />} />
        <Stat
          tone="dark"
          label="Marge nette"
          value={formatXOFCompact(o.margin_xof)}
          hint={o.margin_pct !== null ? `${o.margin_pct} % sur les commandes chiffrées` : 'Aucune commande chiffrée'}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <Stat label="Frais de paiement" value={formatXOFCompact(o.payment_fees_xof)} hint={o.revenue_xof > 0 ? `${((o.payment_fees_xof / o.revenue_xof) * 100).toFixed(1)} % du chiffre d’affaires` : undefined} icon={<Landmark className="h-4 w-4" />} />
        <Stat label="Attendu sous 30 jours" value={formatXOFCompact(o.forecast.expected_total_xof)} hint="Estimation, détail ci-dessous" icon={<CircleDollarSign className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardTitle>Chiffre d’affaires et marge, 6 derniers mois</CardTitle>
          <MonthlyChart data={o.monthly} />
        </Card>
        <Card>
          <CardTitle>Où va l’argent</CardTitle>
          <CostBreakdown o={o} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Par canal de vente</CardTitle>
          {o.channels.length === 0 ? (
            <p className="text-sm text-muted">Aucune vente encaissée pour le moment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[12px] font-semibold uppercase tracking-wide text-muted">
                    <th className="pb-2 pr-3">Canal</th>
                    <th className="pb-2 pr-3 text-right">Ventes</th>
                    <th className="pb-2 pr-3 text-right">CA</th>
                    <th className="pb-2 text-right">Marge</th>
                  </tr>
                </thead>
                <tbody>
                  {o.channels.map(c => (
                    <tr key={c.kind} className="border-t border-line">
                      <td className="py-2.5 pr-3 font-semibold">{KIND_LABEL[c.kind] || c.kind}</td>
                      <td className="num py-2.5 pr-3 text-right">{c.orders}</td>
                      <td className="num py-2.5 pr-3 text-right">{formatXOFCompact(c.revenue_xof)}</td>
                      <td className="num py-2.5 text-right font-semibold">
                        {c.margin_pct === null ? <span className="font-normal text-muted">à chiffrer</span> : `${formatXOFCompact(c.margin_xof)} · ${c.margin_pct} %`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Trésorerie</CardTitle>
          <dl className="space-y-3 text-sm">
            <Row label="Encaissé ce mois-ci" value={formatXOF(o.cash.collected_month_xof)} strong />
            <Row label={`En attente de paiement (moins de ${o.cash.abandon_hours} h)`} value={`${formatXOF(o.cash.pending_xof)} · ${o.cash.pending_count} commande(s)`} />
            <Row
              label={`Abandonnées (plus de ${o.cash.abandon_hours} h sans paiement)`}
              value={`${formatXOF(o.cash.abandoned_xof)} · ${o.cash.abandoned_count} commande(s)`}
              tone={o.cash.abandoned_count > 0 ? 'warning' : undefined}
            />
            <Row
              label="Remboursements à effectuer"
              value={`${formatXOF(o.cash.refunds_pending_xof)} · ${o.cash.refunds_pending_count} participation(s)`}
              tone={o.cash.refunds_pending_count > 0 ? 'danger' : undefined}
            />
            <Row label="Déjà remboursé" value={formatXOF(o.cash.refunded_xof)} />
            <Row
              label="Commandes payées (30 jours)"
              value={`${o.cash.orders_paid_30d} sur ${o.cash.orders_created_30d} · ${o.cash.payment_rate_pct} %`}
              hint={o.cash.payment_rate_source}
            />
          </dl>
          {o.cash.abandoned_count > 0 && (
            <p className="mt-4 rounded-xl bg-paper p-3 text-[13px] text-muted">
              <strong className="text-ink">{o.cash.abandoned_count} client(s) ont commencé un achat sans payer.</strong> Une relance par message sur ces commandes est le moyen le plus rapide de récupérer du chiffre d’affaires.{' '}
              <Link to="/espace-pro/commandes?paiement=pending" className="font-semibold text-brand-600">
                Voir les commandes
              </Link>
            </p>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardTitle>Prévision sur 30 jours</CardTitle>
          <ForecastBlock o={o} />
        </Card>
        <Card>
          <CardTitle action={<Link to="/espace-pro/groupages" className="text-[13px] font-semibold text-brand-600">Tous les groupages</Link>}>Groupages à surveiller</CardTitle>
          {o.forecast.groupages_at_risk.length === 0 ? (
            <p className="text-sm text-muted">Aucun groupage ouvert n’est en difficulté.</p>
          ) : (
            <ul className="space-y-3">
              {o.forecast.groupages_at_risk.map(g => (
                <li key={g.id}>
                  <Link to={`/espace-pro/groupages/${g.id}`} className="lift block rounded-2xl border border-line p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-semibold">{g.title}</p>
                      <GroupageRiskBadge risk={g.risk} />
                    </div>
                    <p className="mt-1 text-[12.5px] text-muted">
                      {g.active_quantity} / {g.supplier_moq} unités minimum · {Math.ceil(g.days_left)} j restants · prévu {g.projected_quantity}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Marges sous le seuil de {o.min_margin_pct} %</CardTitle>
          {o.low_margin_orders.length === 0 ? (
            <p className="text-sm text-muted">Aucune commande chiffrée sous le seuil.</p>
          ) : (
            <ul className="divide-y divide-line">
              {o.low_margin_orders.map(r => (
                <li key={r.order_id}>
                  <Link to={`/espace-pro/commandes/${r.order_id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-brand-600">
                    <span className="min-w-0 truncate">
                      <span className="num font-semibold">{r.tracking_code}</span> <span className="text-muted">{r.customer_name}</span>
                    </span>
                    <span className={`num shrink-0 font-semibold ${(r.margin_xof ?? 0) < 0 ? 'text-red-700' : 'text-ochre'}`}>
                      {r.margin_pct} % · {formatXOFCompact(r.margin_xof)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardTitle>Commandes sans coût d’achat</CardTitle>
          {o.missing_cost_orders.length === 0 ? (
            <p className="text-sm text-muted">Toutes les commandes payées ont un coût connu.</p>
          ) : (
            <>
              <ul className="divide-y divide-line">
                {o.missing_cost_orders.map(r => (
                  <li key={r.order_id}>
                    <Link to={`/espace-pro/commandes/${r.order_id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-brand-600">
                      <span className="min-w-0 truncate">
                        <span className="num font-semibold">{r.tracking_code}</span> <span className="text-muted">{r.customer_name}</span>
                      </span>
                      <span className="num inline-flex shrink-0 items-center gap-1.5">
                        {formatXOFCompact(r.revenue_xof)} <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12.5px] text-muted">Ouvrez la commande et ajoutez le coût « Achat fournisseur » : la marge se met à jour aussitôt.</p>
            </>
          )}
        </Card>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        o={o}
        onSaved={() => {
          toast('success', 'Réglages enregistrés');
          overview.reload();
        }}
      />
    </>
  );
}

function Row({ label, value, hint, strong, tone }: { label: string; value: React.ReactNode; hint?: string; strong?: boolean; tone?: 'warning' | 'danger' }) {
  const color = tone === 'danger' ? 'text-red-700' : tone === 'warning' ? 'text-ochre' : 'text-ink';
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-line pb-2.5 last:border-0 last:pb-0">
      <dt className="text-muted">
        {label}
        {hint && <span className="block text-[11.5px] text-subtle">{hint}</span>}
      </dt>
      <dd className={`num text-right ${strong ? 'text-base font-bold' : 'font-semibold'} ${color}`}>{value}</dd>
    </div>
  );
}

function CostBreakdown({ o }: { o: FinanceOverview }) {
  const rows = [
    { label: 'Achat marchandise', value: o.purchase_xof, color: 'bg-ink' },
    { label: 'Transport et douane', value: o.logistics_xof, color: 'bg-brand' },
    { label: 'Frais de paiement', value: o.payment_fees_xof, color: 'bg-brand-400' },
    { label: 'Autres coûts', value: o.other_costs_xof, color: 'bg-line-2' }
  ];
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (total <= 0) return <p className="text-sm text-muted">Aucun coût enregistré pour le moment.</p>;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-paper-2" role="img" aria-label="Répartition des coûts">
        {rows.map(r => (
          <div key={r.label} className={r.color} style={{ width: `${(r.value / total) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {rows.map(r => (
          <li key={r.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-sm ${r.color}`} /> {r.label}
            </span>
            <span className="num font-semibold">
              {formatXOFCompact(r.value)} <span className="font-normal text-muted">· {Math.round((r.value / total) * 100)} %</span>
            </span>
          </li>
        ))}
      </ul>
      {o.orders_partial_costs > 0 && (
        <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-[12.5px] text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {o.orders_partial_costs} commande(s) n’ont pas de coût de transport connu : leur marge est légèrement surestimée.
        </p>
      )}
    </div>
  );
}

function ForecastBlock({ o }: { o: FinanceOverview }) {
  const f = o.forecast;
  const rows = [
    { label: 'Devis en cours', detail: `${f.quotes_open_count} devis · ${formatXOFCompact(f.quotes_open_xof)} × ${f.quote_conversion_pct} %`, value: f.quotes_expected_xof },
    { label: 'Commandes à payer', detail: `${formatXOFCompact(f.pending_orders_xof)} × ${o.cash.payment_rate_pct} %`, value: f.pending_expected_xof },
    { label: 'Groupages : demande à venir', detail: 'rythme actuel × probabilité d’atteindre la quantité minimale', value: f.groupages_expected_xof }
  ];
  return (
    <div>
      <p className="num font-display text-[34px] font-bold leading-none">{formatXOFCompact(f.expected_total_xof)}</p>
      <p className="mt-1 text-[13px] text-muted">à encaisser d’ici 30 jours, en plus de ce qui est déjà payé</p>
      <ul className="mt-5 space-y-3">
        {rows.map(r => (
          <li key={r.label} className="flex items-start justify-between gap-4 border-t border-line pt-3 text-sm">
            <span>
              <span className="font-semibold">{r.label}</span>
              <span className="block text-[12.5px] text-muted">{r.detail}</span>
            </span>
            <span className="num shrink-0 font-semibold">{formatXOFCompact(r.value)}</span>
          </li>
        ))}
      </ul>
      <details className="mt-4 text-[12.5px] text-muted">
        <summary className="cursor-pointer font-semibold text-ink">Comment c’est calculé</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {f.assumptions.map(a => (
            <li key={a}>{a}</li>
          ))}
          <li>C’est une estimation : elle s’affine à mesure que l’historique grandit.</li>
        </ul>
      </details>
    </div>
  );
}

function SettingsModal({ open, onClose, o, onSaved }: { open: boolean; onClose: () => void; o: FinanceOverview; onSaved: () => void }) {
  const [cny, setCny] = useState('');
  const [usd, setUsd] = useState('');
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setCny(String(o.fx.cny_to_xof ?? ''));
    setUsd(String(o.fx.usd_to_xof ?? ''));
    setTargets(Object.fromEntries(TARGET_FIELDS.map(f => [f.key, String(o.targets[f.key] ?? '')])));
    setError(null);
  }, [open, o]);

  const num = (v: string) => Number(v.replace(',', '.'));

  async function save() {
    setError(null);
    const rate = num(cny);
    if (!(rate > 0)) return setError('Le taux yuan → FCFA doit être positif.');
    setSaving(true);
    try {
      if (rate !== o.fx.cny_to_xof || (usd && num(usd) !== o.fx.usd_to_xof)) await setExchangeRate(rate, usd ? num(usd) : null);
      const changed: Record<string, number> = {};
      for (const f of TARGET_FIELDS) {
        const v = num(targets[f.key] ?? '');
        if (Number.isFinite(v) && targets[f.key] !== '' && v !== o.targets[f.key]) changed[f.key] = v;
      }
      if (Object.keys(changed).length) await updateFinanceTargets(changed);
      onSaved();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Taux de change et objectifs"
      description="Le taux alimente les calculs de prix des devis. Chaque changement est conservé dans l’historique."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={save} loading={saving} icon={<Banknote className="h-4 w-4" />}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <p className="mb-3 text-[13px] font-semibold">Taux de change</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="1 yuan (CNY) vaut" inputMode="decimal" value={cny} onChange={e => setCny(e.target.value)} suffix="FCFA" />
            <Input label="1 dollar (USD) vaut" inputMode="decimal" value={usd} onChange={e => setUsd(e.target.value)} suffix="FCFA" />
          </div>
          {o.fx_history.length > 0 && (
            <p className="mt-3 text-[12.5px] text-muted">
              Historique du yuan :{' '}
              {o.fx_history
                .slice(0, 5)
                .map(h => `${h.cny_to_xof} (${formatDateTime(h.at)})`)
                .join(' · ')}
            </p>
          )}
        </div>
        <div>
          <p className="mb-3 text-[13px] font-semibold">Objectifs et hypothèses</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {TARGET_FIELDS.map(f => (
              <div key={f.key}>
                <Input label={f.label} inputMode="decimal" value={targets[f.key] ?? ''} onChange={e => setTargets(t => ({ ...t, [f.key]: e.target.value }))} suffix={f.suffix} />
                <p className="mt-1 text-[11.5px] text-subtle">{f.hint}</p>
              </div>
            ))}
          </div>
        </div>
        {error && <InlineAlert tone="danger">{error}</InlineAlert>}
      </div>
    </Modal>
  );
}
