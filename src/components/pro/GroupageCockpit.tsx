import React, { useState } from 'react';
import { AlertTriangle, BellRing, CheckCircle2, Clock, MessageCircle, Share2, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { friendlyError } from '../../lib/db';
import { getGroupageCockpit, remindGroupageReservations, type GroupageCockpit as Cockpit, type GroupageRisk } from '../../services/finance';
import { formatDate, formatNumber, formatXOF, formatXOFCompact } from '../../lib/format';
import type { Tone } from '../../lib/status';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardTitle } from '../ui/Layout';
import { ErrorState, InlineAlert, Skeleton } from '../ui/States';
import { Sparkline } from '../ui/Charts';

const RISK: Record<GroupageRisk, { label: string; tone: Tone }> = {
  confirmed: { label: 'Confirmé', tone: 'success' },
  reached: { label: 'Quantité atteinte', tone: 'success' },
  on_track: { label: 'Sur la bonne voie', tone: 'info' },
  at_risk: { label: 'À risque', tone: 'warning' },
  critical: { label: 'Critique', tone: 'danger' },
  failed: { label: 'Échec', tone: 'danger' },
  inactive: { label: 'Inactif', tone: 'neutral' }
};

export function GroupageRiskBadge({ risk }: { risk: GroupageRisk }) {
  const r = RISK[risk] || RISK.inactive;
  return (
    <Badge tone={r.tone} dot>
      {r.label}
    </Badge>
  );
}

function phoneDigits(phone: string | null) {
  return (phone || '').replace(/\D/g, '').replace(/^00/, '').replace(/^(\d{9})$/, '221$1');
}

/** Message de situation : dit au gestionnaire où il en est et quoi faire, en une phrase. */
export function riskMessage(c: Pick<Cockpit, 'risk' | 'velocity_per_day' | 'days_to_moq' | 'projected_quantity' | 'supplier_moq' | 'active_quantity' | 'days_left'>) {
  const date = c.days_to_moq !== null ? formatDate(new Date(Date.now() + c.days_to_moq * 86400000)) : null;
  switch (c.risk) {
    case 'confirmed':
      return { tone: 'success' as const, text: 'Groupage confirmé : la phase de collecte est terminée.' };
    case 'reached':
      return { tone: 'success' as const, text: `Quantité minimale atteinte (${c.active_quantity} / ${c.supplier_moq}). Vous pouvez valider le groupage quand vous le souhaitez.` };
    case 'on_track':
      return {
        tone: 'info' as const,
        text: `Au rythme actuel (${c.velocity_per_day} unité(s) par jour), la quantité minimale sera atteinte vers le ${date ?? 'bientôt'}, avant la date limite.`
      };
    case 'at_risk':
      return {
        tone: 'warning' as const,
        text: `À ce rythme vous atteindrez environ ${formatNumber(c.projected_quantity)} unités sur ${c.supplier_moq} nécessaires. Il faut accélérer : relancez les réservations et partagez le groupage.`
      };
    case 'critical':
      return {
        tone: 'danger' as const,
        text: `Au rythme actuel, environ ${formatNumber(c.projected_quantity)} unités sur ${c.supplier_moq} nécessaires : la quantité minimale ne sera pas atteinte. Prolongez la date limite, baissez le prix ou préparez l’annulation.`
      };
    case 'failed':
      return { tone: 'danger' as const, text: 'La date limite est dépassée sans atteindre la quantité minimale : prolongez la date limite, ou annulez et remboursez les participants.' };
    default:
      return { tone: 'info' as const, text: 'Ce groupage n’est pas encore ouvert à la collecte.' };
  }
}

export function GroupageCockpit({ groupageId, onChanged }: { groupageId: string; onChanged?: () => void }) {
  const { toast } = useApp();
  const cockpit = useAsync(() => getGroupageCockpit(groupageId), [groupageId], { cacheKey: `cockpit:${groupageId}`, maxAge: 20000 });
  const [reminding, setReminding] = useState(false);

  if (cockpit.loading && !cockpit.data) return <Skeleton className="h-64 w-full" />;
  if (cockpit.error) return <ErrorState message={cockpit.error} onRetry={cockpit.reload} />;
  const c = cockpit.data;
  if (!c) return null;

  const msg = riskMessage(c);
  const open = c.risk !== 'inactive' && c.risk !== 'confirmed';
  const remaining = Math.max(0, c.supplier_moq - c.active_quantity);
  const shareText = `Rejoignez le groupage « ${c.title} » : ${formatXOF(c.unit_price_xof)} l’unité. ${remaining > 0 ? `Il manque ${remaining} unité(s) pour lancer la commande. ` : ''}Réservez avant le ${formatDate(c.deadline)} : ${window.location.origin}/groupages/${c.id}`;
  const coverage = c.supplier_due_estimate_xof !== null ? c.collected_xof - c.supplier_due_estimate_xof : null;

  async function remind() {
    setReminding(true);
    try {
      const res = await remindGroupageReservations(groupageId);
      toast('success', res.notified ? `${res.notified} participant(s) relancé(s)` : 'Personne à relancer', res.notified ? 'Ils ont reçu une notification.' : 'Tous ont déjà été relancés récemment.');
      cockpit.reload();
      onChanged?.();
    } catch (err) {
      toast('error', 'Relance impossible', friendlyError(err));
    } finally {
      setReminding(false);
    }
  }

  return (
    <div className="space-y-5">
      <InlineAlert
        tone={msg.tone === 'danger' ? 'danger' : msg.tone === 'warning' ? 'warning' : msg.tone === 'success' ? 'success' : 'info'}
        title={
          <span className="inline-flex items-center gap-2">
            {msg.tone === 'success' ? <CheckCircle2 className="h-4 w-4" /> : msg.tone === 'info' ? <TrendingUp className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <GroupageRiskBadge risk={c.risk} />
          </span>
        }
        action={
          open ? (
            <Button size="sm" variant="whatsapp" icon={<Share2 className="h-3.5 w-3.5" />} to={`https://wa.me/?text=${encodeURIComponent(shareText)}`}>
              Partager sur WhatsApp
            </Button>
          ) : undefined
        }
      >
        {msg.text}
      </InlineAlert>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Unités réservées ou payées" value={`${c.active_quantity}`} hint={`dont ${c.paid_quantity} payées`} />
        <Metric label="Quantité minimale fournisseur" value={`${c.progress_moq_pct} %`} hint={`${c.active_quantity} / ${c.supplier_moq}`} />
        <Metric label="Rythme actuel" value={`${c.velocity_per_day} / jour`} hint="moyenne des 7 derniers jours" />
        <Metric
          label="Date limite"
          value={c.days_left >= 1 ? `${Math.ceil(c.days_left)} j` : c.days_left > 0 ? 'Aujourd’hui' : 'Dépassée'}
          hint={`${formatDate(c.deadline)} · prévu ${formatNumber(c.projected_quantity)} unités`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle>Inscriptions des 14 derniers jours</CardTitle>
          <Sparkline values={c.daily_joins.map(d => d.quantity)} label="Unités réservées par jour" height={64} />
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-muted">
            {Object.entries(c.participants_by_status).map(([k, n]) => (
              <span key={k}>
                {{ paid: 'Payés', reserved: 'Réservés', cancelled: 'Annulés', refunded: 'Remboursés' }[k] || k} : <strong className="text-ink">{n}</strong>
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Argent du groupage</CardTitle>
          <dl className="space-y-2.5 text-sm">
            <Line label="Encaissé" value={formatXOF(c.collected_xof)} strong />
            <Line label="Réservé, pas encore payé" value={formatXOF(c.pending_xof)} />
            {c.supplier_due_estimate_xof !== null ? (
              <>
                <Line label="À verser au fournisseur (estimation)" value={formatXOF(c.supplier_due_estimate_xof)} hint={`${formatXOF(c.unit_cost_xof)} par unité, achat et logistique`} />
                <Line label={coverage! >= 0 ? 'Reste après le fournisseur' : 'Il manque pour payer le fournisseur'} value={formatXOF(Math.abs(coverage!))} tone={coverage! >= 0 ? undefined : 'danger'} />
              </>
            ) : (
              <p className="rounded-xl bg-paper p-3 text-[12.5px] text-muted">Le coût d’achat de ce produit n’est pas renseigné : demandez à l’équipe de le saisir (fiche produit, coûts) pour voir ce que doit couvrir l’encaissement.</p>
            )}
            {c.margin_visible && c.unit_margin_xof !== undefined && (
              <>
                <Line label="Marge par unité" value={`${formatXOF(c.unit_margin_xof)}${c.unit_margin_pct != null ? ` · ${c.unit_margin_pct} %` : ''}`} tone={c.unit_margin_xof < 0 ? 'danger' : undefined} />
                <Line label="Marge déjà sécurisée" value={formatXOFCompact(c.margin_collected_xof)} />
                <Line label="Marge si l’objectif est atteint" value={formatXOFCompact(c.margin_if_target_xof)} />
              </>
            )}
            {c.refunds_pending > 0 && <Line label="Remboursements à effectuer" value={`${c.refunds_pending} participation(s)`} tone="danger" />}
          </dl>
        </Card>
      </div>

      {open && (
        <Card>
          <CardTitle
            action={
              c.expiring_count > 0 ? (
                <Button size="sm" variant="secondary" icon={<BellRing className="h-3.5 w-3.5" />} loading={reminding} onClick={remind}>
                  Relancer par notification
                </Button>
              ) : undefined
            }
          >
            Réservations qui expirent dans moins de 24 h
          </CardTitle>
          {c.expiring_count === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Clock className="h-4 w-4" /> Aucune réservation n’expire bientôt.
            </p>
          ) : (
            <>
              <p className="mb-3 text-[13px] text-muted">
                {c.expiring_quantity} unité(s), soit <strong className="text-ink">{formatXOF(c.expiring_xof)}</strong> à risque. Les places libérées reviennent au groupage.
              </p>
              <ul className="divide-y divide-line">
                {(c.expiring || []).map(p => (
                  <li key={p.participant_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name || 'Client'}</p>
                      <p className="text-[12.5px] text-muted">
                        {p.quantity} unité(s) · {formatXOF(p.total_xof)} · expire dans <strong className="text-ink">{Math.max(0, Math.round(p.hours_left))} h</strong>
                      </p>
                    </div>
                    {p.phone && (
                      <Button
                        size="sm"
                        variant="whatsapp"
                        icon={<MessageCircle className="h-3.5 w-3.5" />}
                        to={`https://wa.me/${phoneDigits(p.phone)}?text=${encodeURIComponent(`Bonjour ${p.name || ''}, votre place dans « ${c.title} » expire dans ${Math.max(1, Math.round(p.hours_left))} h. Réglez ici pour la garder : ${window.location.origin}/compte/commandes`)}`}
                      >
                        WhatsApp
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-white p-4 shadow-[var(--shadow-soft)]">
      <p className="text-[12px] font-semibold text-muted">{label}</p>
      <p className="num mt-2 font-display text-[24px] font-bold leading-none">{value}</p>
      {hint && <p className="mt-1.5 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

function Line({ label, value, hint, strong, tone }: { label: string; value: React.ReactNode; hint?: string; strong?: boolean; tone?: 'danger' }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-line pb-2.5 last:border-0 last:pb-0">
      <dt className="text-muted">
        {label}
        {hint && <span className="block text-[11.5px] text-subtle">{hint}</span>}
      </dt>
      <dd className={`num text-right ${strong ? 'text-base font-bold' : 'font-semibold'} ${tone === 'danger' ? 'text-red-700' : 'text-ink'}`}>{value}</dd>
    </div>
  );
}
