import React, { useState } from 'react';
import { Banknote, Copy, Link2, MessageCircle, ReceiptText, Undo2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { createStaffPaymentLink, type StaffPaymentLink } from '../../lib/api';
import { friendlyError } from '../../lib/db';
import { getOrderPaymentInfo, recordManualPayment, type ManualPaymentMethod } from '../../services/orders';
import { formatDateTime, formatXOF } from '../../lib/format';
import { PAYMENT_METHOD_LABEL, PAYMENT_PROVIDER_LABEL } from '../../lib/status';
import { whatsappLink } from '../../lib/config';
import type { Order } from '../../lib/types';
import { Card, CardTitle, DefinitionList } from '../ui/Layout';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { InlineAlert } from '../ui/States';
import { RefundModal } from './RefundModal';

/**
 * Encaissement d'une commande côté équipe :
 *  - lien de paiement à envoyer au client (WhatsApp, SMS, email) ;
 *  - enregistrement d'un règlement reçu hors ligne (administration) ;
 *  - détail comptable du paiement reçu (frais, net perçu).
 */
export function OrderPaymentCard({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const { user, toast } = useApp();
  const isAdmin = user?.role === 'admin';
  const paid = order.paymentStatus === 'paid';
  const cancelled = order.orderStatus === 'cancelled';
  const info = useAsync(() => (isAdmin ? getOrderPaymentInfo(order.id) : Promise.resolve(null)), [order.id, order.paymentStatus, isAdmin]);

  const [link, setLink] = useState<StaffPaymentLink | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [method, setMethod] = useState<ManualPaymentMethod>('bank_transfer');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);

  async function generate() {
    setLinkBusy(true);
    try {
      setLink(await createStaffPaymentLink(order.id));
    } catch (err) {
      toast('error', 'Lien impossible', friendlyError(err));
    } finally {
      setLinkBusy(false);
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.checkoutUrl);
      toast('success', 'Lien copié');
    } catch {
      toast('error', 'Copie impossible', 'Sélectionnez le lien manuellement.');
    }
  }

  const waText = link
    ? `Bonjour ${order.customerName.split(' ')[0] || ''}, voici le lien sécurisé pour régler votre commande ${order.trackingCode} (${formatXOF(order.totalXOF)}) : ${link.checkoutUrl}`
    : '';
  const phone = order.customerPhone.replace(/\D/g, '');
  const waHref = phone ? `https://wa.me/${phone.length === 9 ? `221${phone}` : phone}?text=${encodeURIComponent(waText)}` : whatsappLink(waText);

  async function saveManual(e: React.FormEvent) {
    e.preventDefault();
    if (reference.trim().length < 3) return toast('error', 'Indiquez la référence du règlement');
    setSaving(true);
    try {
      await recordManualPayment(order.id, method, reference.trim(), note.trim());
      toast('success', 'Paiement enregistré', 'La commande est passée en « payée » et le client est notifié.');
      setManualOpen(false);
      setReference('');
      setNote('');
      onChanged();
    } catch (err) {
      toast('error', 'Enregistrement impossible', friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  const p = info.data;
  return (
    <Card>
      <CardTitle>Encaissement</CardTitle>
      {paid ? (
        p ? (
          <DefinitionList
            items={[
              { label: 'Montant', value: formatXOF(p.amountXOF) },
              { label: 'Canal', value: PAYMENT_PROVIDER_LABEL[p.provider] || p.provider },
              { label: 'Moyen', value: p.network || PAYMENT_METHOD_LABEL[p.method || ''] || p.method },
              { label: 'Frais de passerelle', value: p.feeXOF > 0 ? formatXOF(p.feeXOF) : null },
              { label: 'Net perçu', value: p.netXOF !== null ? formatXOF(p.netXOF) : null },
              { label: 'Référence', value: p.reference },
              { label: 'Payé le', value: p.paidAt ? formatDateTime(p.paidAt) : null }
            ]}
          />
        ) : (
          <p className="text-sm text-muted">Paiement confirmé le {order.paidAt ? formatDateTime(order.paidAt) : '—'}.</p>
        )
      ) : order.paymentStatus === 'refunded' ? (
        <InlineAlert tone="info">Commande remboursée.</InlineAlert>
      ) : cancelled ? (
        <InlineAlert tone="info">Commande annulée : aucun encaissement possible.</InlineAlert>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            En attente de <span className="num font-semibold text-ink">{formatXOF(order.totalXOF)}</span>. Envoyez un lien de paiement sécurisé au client ou enregistrez un règlement reçu hors ligne.
          </p>
          {link ? (
            <div className="rounded-2xl bg-paper p-3.5">
              <p className="break-all text-[12.5px] font-medium text-ink">{link.checkoutUrl}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={copy} icon={<Copy className="h-3.5 w-3.5" />}>
                  Copier
                </Button>
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#25d366]/40 bg-white px-4 text-[13px] font-semibold text-[#128c4a] hover:bg-[#effbf3]"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Envoyer sur WhatsApp
                </a>
              </div>
              <p className="mt-2 text-[11.5px] text-muted">Valable 48 h. La commande passe en « payée » automatiquement dès que le client a réglé.</p>
            </div>
          ) : (
            <Button size="sm" loading={linkBusy} onClick={generate} icon={<Link2 className="h-3.5 w-3.5" />}>
              Générer un lien de paiement
            </Button>
          )}
          {isAdmin && (
            <div className="border-t border-dashed border-line pt-4">
              <Button size="sm" variant="secondary" onClick={() => setManualOpen(true)} icon={<Banknote className="h-3.5 w-3.5" />}>
                Enregistrer un paiement reçu
              </Button>
              <p className="mt-2 text-[11.5px] text-muted">Virement, espèces, chèque : saisie tracée avec votre nom et une référence obligatoire.</p>
            </div>
          )}
        </div>
      )}

      {paid && isAdmin && (
        <div className="mt-4 border-t border-dashed border-line pt-4">
          <Button size="sm" variant="danger" onClick={() => setRefundOpen(true)} icon={<Undo2 className="h-3.5 w-3.5" />}>
            Rembourser le client…
          </Button>
        </div>
      )}
      <RefundModal
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        onDone={onChanged}
        orderId={order.id}
        amountXOF={order.totalXOF}
        customerName={order.customerName}
        customerPhone={order.customerPhone}
      />

      <Modal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Enregistrer un paiement reçu"
        description={`${order.trackingCode} · ${formatXOF(order.totalXOF)} (montant exact de la commande)`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setManualOpen(false)}>
              Retour
            </Button>
            <Button type="submit" form="manual-payment-form" loading={saving} icon={<ReceiptText className="h-4 w-4" />}>
              Confirmer le paiement
            </Button>
          </>
        }
      >
        <form id="manual-payment-form" onSubmit={saveManual} className="space-y-4">
          <Select
            label="Moyen de règlement"
            value={method}
            onChange={e => setMethod(e.target.value as ManualPaymentMethod)}
            options={(['bank_transfer', 'cash', 'cheque', 'mobile_money_manual'] as const).map(m => ({ value: m, label: PAYMENT_METHOD_LABEL[m] }))}
          />
          <Input label="Référence" required value={reference} onChange={e => setReference(e.target.value)} placeholder="N° de virement, reçu, chèque…" />
          <Textarea label="Note interne (optionnel)" value={note} onChange={e => setNote(e.target.value)} rows={2} />
          <InlineAlert tone="warning">La commande sera marquée payée et le client notifié. Cette action est journalisée.</InlineAlert>
        </form>
      </Modal>
    </Card>
  );
}
