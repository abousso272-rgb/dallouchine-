import React, { useState } from 'react';
import { CheckCircle2, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Quote } from '../../lib/types';
import { createOrderFromQuote, respondToQuote, listQuotePayments } from '../../services/requests';
import { startPayment } from '../../lib/api';
import { friendlyError } from '../../lib/db';
import { useAsync } from '../../lib/hooks';
import { formatDate, formatXOF } from '../../lib/format';
import { QUOTE_STATUS, PAYMENT_STATUS, TRANSPORT_LABEL } from '../../lib/status';
import { StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Textarea } from '../ui/Field';
import { InlineAlert } from '../ui/States';

/** Devis détaillé. Côté client : validation / refus puis paiement de l'acompte et du solde. */
export function QuoteCard({ quote, viewer, onChanged }: { quote: Quote; viewer: 'client' | 'staff'; onChanged: () => void }) {
  const { toast } = useApp();
  const payments = useAsync(() => (quote.status === 'accepted' ? listQuotePayments(quote.id) : Promise.resolve([])), [quote.id, quote.status]);
  const [busy, setBusy] = useState<'accept' | 'reject' | 'pay' | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const expired = new Date(quote.validUntil).getTime() < new Date().setHours(0, 0, 0, 0);
  const open = ['sent', 'viewed'].includes(quote.status);
  const paid = (payments.data || []).filter(p => p.paymentStatus === 'paid');
  const depositPaid = paid.some(p => p.kind === 'deposit' || p.kind === 'full');
  const fullyPaid = paid.some(p => p.kind === 'full' || p.kind === 'balance');
  const hasDeposit = quote.depositXOF > 0 && quote.depositXOF < quote.totalXOF;
  const nextAmount = !depositPaid ? (hasDeposit ? quote.depositXOF : quote.totalXOF) : quote.totalXOF - quote.depositXOF;
  const nextLabel = !depositPaid ? (hasDeposit ? `Payer l’acompte (${quote.depositPercent} %)` : 'Payer le devis') : 'Payer le solde';

  async function accept() {
    setBusy('accept');
    try {
      await respondToQuote(quote.id, true);
      toast('success', 'Devis accepté', 'Vous pouvez maintenant régler l’acompte pour lancer la commande.');
      onChanged();
    } catch (err) {
      toast('error', 'Action impossible', friendlyError(err));
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    setBusy('reject');
    try {
      await respondToQuote(quote.id, false, reason);
      toast('info', 'Devis refusé', 'Votre conseiller a été informé et peut vous faire une nouvelle proposition.');
      setRejectOpen(false);
      onChanged();
    } catch (err) {
      toast('error', 'Action impossible', friendlyError(err));
    } finally {
      setBusy(null);
    }
  }

  async function pay() {
    setBusy('pay');
    try {
      const res = await createOrderFromQuote(quote.id);
      await startPayment(res.order_id);
    } catch (err) {
      toast('error', 'Paiement non démarré', friendlyError(err));
      setBusy(null);
      payments.reload();
    }
  }

  const rows = [
    { label: 'Produits / prestations', value: quote.subtotalXOF },
    { label: 'Transport', value: quote.shippingXOF },
    { label: 'Douane & taxes', value: quote.customsXOF },
    { label: 'Frais de service', value: quote.feesXOF },
    { label: 'Remise', value: -quote.discountXOF }
  ].filter(r => r.value !== 0);

  return (
    <article className={`card overflow-hidden p-0 ${open && viewer === 'client' ? 'ring-2 ring-brand/30' : ''}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-line">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <p className="num text-sm font-semibold">
              Devis {quote.number}
              {quote.version > 1 && <span className="font-normal text-muted"> · v{quote.version}</span>}
            </p>
            <p className="text-[12px] text-muted">
              Émis le {formatDate(quote.sentAt || quote.createdAt)} · valable jusqu’au {formatDate(quote.validUntil)}
            </p>
          </div>
        </div>
        <StatusBadge map={QUOTE_STATUS} status={open && expired ? 'expired' : quote.status} />
      </header>

      <div className="px-5 py-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-[13.5px]">
            <thead>
              <tr className="text-left text-[11.5px] uppercase tracking-wide text-muted">
                <th className="pb-2 font-semibold">Désignation</th>
                <th className="pb-2 text-right font-semibold">Qté</th>
                <th className="pb-2 text-right font-semibold">P.U.</th>
                <th className="pb-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {quote.items.map(i => (
                <tr key={i.id}>
                  <td className="py-2 pr-3">{i.description}</td>
                  <td className="num py-2 text-right">{i.quantity}</td>
                  <td className="num py-2 text-right">{formatXOF(i.unitPriceXOF)}</td>
                  <td className="num py-2 text-right font-semibold">{formatXOF(i.subtotalXOF)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-[13.5px]">
          {rows.map(r => (
            <div key={r.label} className="flex justify-between">
              <dt className="text-muted">{r.label}</dt>
              <dd className="num font-medium">{formatXOF(r.value)}</dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between pt-2">
            <dt className="font-semibold">Total</dt>
            <dd className="num font-display text-xl font-semibold">{formatXOF(quote.totalXOF)}</dd>
          </div>
          {hasDeposit && (
            <div className="flex justify-between text-muted">
              <dt>
                Acompte {quote.depositPercent} % · solde à l’expédition
              </dt>
              <dd className="num">
                {formatXOF(quote.depositXOF)} + {formatXOF(quote.balanceXOF)}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-4 grid gap-2 text-[13px] text-muted sm:grid-cols-2">
          {quote.leadTime && (
            <p>
              <span className="font-semibold text-ink">Délai : </span>
              {quote.leadTime}
            </p>
          )}
          {quote.transportMode && (
            <p>
              <span className="font-semibold text-ink">Transport : </span>
              {TRANSPORT_LABEL[quote.transportMode] || quote.transportMode}
            </p>
          )}
        </div>
        {quote.conditions.length > 0 && (
          <ul className="mt-3 space-y-1 text-[13px] text-muted">
            {quote.conditions.map(c => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
        )}
        {quote.notes && <p className="mt-3 rounded-xl bg-paper p-3 text-[13px] text-muted">{quote.notes}</p>}
        {quote.status === 'rejected' && quote.rejectionReason && <p className="mt-3 text-[13px] text-muted">Motif du refus : {quote.rejectionReason}</p>}
      </div>

      {viewer === 'client' && open && !expired && (
        <footer className="flex flex-col-reverse gap-2 border-t border-line bg-paper/50 px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setRejectOpen(true)} disabled={busy !== null}>
            Refuser
          </Button>
          <Button onClick={accept} loading={busy === 'accept'} icon={<CheckCircle2 className="h-4 w-4" />}>
            Accepter le devis
          </Button>
        </footer>
      )}
      {viewer === 'client' && open && expired && (
        <footer className="border-t border-line px-5 py-4">
          <InlineAlert tone="warning">Ce devis a expiré. Écrivez à votre conseiller pour obtenir une version à jour.</InlineAlert>
        </footer>
      )}

      {quote.status === 'accepted' && (
        <footer className="space-y-3 border-t border-line bg-paper/50 px-5 py-4">
          {(payments.data || []).length > 0 && (
            <ul className="space-y-1.5 text-[13px]">
              {(payments.data || []).map(p => (
                <li key={p.id} className="flex items-center justify-between">
                  <span className="text-muted">{p.kind === 'deposit' ? 'Acompte' : p.kind === 'balance' ? 'Solde' : 'Règlement'} · {formatXOF(p.totalXOF)}</span>
                  <StatusBadge map={PAYMENT_STATUS} status={p.paymentStatus} />
                </li>
              ))}
            </ul>
          )}
          {fullyPaid ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-jade">
              <CheckCircle2 className="h-4 w-4" /> Devis entièrement réglé
            </p>
          ) : viewer === 'client' ? (
            <Button block onClick={pay} loading={busy === 'pay'}>
              {nextLabel} · {formatXOF(nextAmount)}
            </Button>
          ) : (
            <p className="text-[13px] text-muted">{depositPaid ? 'Acompte reçu — solde en attente.' : 'Accepté par le client — paiement en attente.'}</p>
          )}
        </footer>
      )}

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Refuser ce devis"
        description="Dites-nous ce qui ne convient pas : votre conseiller pourra ajuster la proposition."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Annuler
            </Button>
            <Button variant="dark" onClick={reject} loading={busy === 'reject'}>
              Confirmer le refus
            </Button>
          </>
        }
      >
        <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Prix, délai, spécifications…" rows={4} />
      </Modal>
    </article>
  );
}
