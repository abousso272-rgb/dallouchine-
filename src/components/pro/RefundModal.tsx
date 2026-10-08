import React, { useEffect, useState } from 'react';
import { Copy, ExternalLink, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { listPaymentNetworks, refundByPayout, type PayoutNetwork } from '../../lib/api';
import { friendlyError } from '../../lib/db';
import { rpc } from '../../lib/db';
import { formatXOF } from '../../lib/format';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Field';
import { InlineAlert } from '../ui/States';

/**
 * Remboursement (administration) :
 *  1. automatique — envoi SasPay vers le mobile money du client, enregistré aussitôt ;
 *  2. assisté — si l'envoi automatique n'est pas possible (IP non autorisée, solde…), l'admin envoie
 *     depuis le tableau de bord SasPay avec les informations prêtes à copier, puis saisit la référence.
 */
export function RefundModal({
  open,
  onClose,
  onDone,
  orderId,
  participantId,
  amountXOF,
  customerName,
  customerPhone
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  orderId: string;
  participantId?: string;
  amountXOF: number;
  customerName: string;
  customerPhone: string;
}) {
  const { toast } = useApp();
  const [networks, setNetworks] = useState<PayoutNetwork[]>([]);
  const [network, setNetwork] = useState('');
  const [phone, setPhone] = useState(customerPhone.replace(/\D/g, '').replace(/^221(?=\d{9}$)/, ''));
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState<string | null>(null);
  const [reference, setReference] = useState('');

  useEffect(() => {
    if (!open) return;
    setManual(null);
    setReference('');
    listPaymentNetworks()
      .then(n => {
        const out = n.filter(x => x.payout);
        setNetworks(out);
        if (out.length && !network) setNetwork((out.find(x => /wave/i.test(x.name)) || out[0]).code);
        if (!out.length) setManual('Aucun réseau d’envoi disponible sur le compte SasPay pour le moment.');
      })
      .catch(() => setManual('La liste des réseaux SasPay est indisponible.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function auto() {
    if (!/^\d{9}$/.test(phone)) return toast('error', 'Numéro invalide', '9 chiffres, sans indicatif.');
    setBusy(true);
    try {
      const r = await refundByPayout({ orderId, participantId, networkCode: network, msisdn: phone });
      toast('success', 'Remboursement envoyé', r.warning || `Envoi SasPay ${r.payoutId} — le client est notifié.`);
      onDone();
      onClose();
    } catch (err) {
      setManual(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirmManual() {
    if (reference.trim().length < 3) return toast('error', 'Indiquez la référence du remboursement');
    setBusy(true);
    try {
      if (participantId) await rpc('admin_mark_participant_refunded', { p_participant_id: participantId, p_reference: reference.trim() });
      else await rpc('admin_mark_order_refunded', { p_order_id: orderId, p_reference: reference.trim(), p_note: null });
      toast('success', 'Remboursement enregistré', 'Le client est notifié.');
      onDone();
      onClose();
    } catch (err) {
      toast('error', 'Enregistrement impossible', friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  const copy = (v: string) => navigator.clipboard?.writeText(v).then(() => toast('success', 'Copié'), () => undefined);

  return (
    <Modal open={open} onClose={onClose} title="Rembourser le client" description={`${customerName} · ${formatXOF(amountXOF)}`}>
      {!manual ? (
        <div className="space-y-4">
          <Select label="Réseau du client" value={network} onChange={e => setNetwork(e.target.value)} options={networks.map(n => ({ value: n.code, label: n.name }))} placeholder={networks.length ? undefined : 'Chargement…'} />
          <Input label="Numéro mobile money" inputMode="numeric" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} prefix={<span className="text-[13px]">+221</span>} />
          <InlineAlert tone="info">L’argent est envoyé depuis votre solde SasPay vers ce numéro, puis la commande passe en « remboursée ».</InlineAlert>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setManual('Remboursement manuel choisi.')}>
              Rembourser manuellement
            </Button>
            <Button loading={busy} disabled={!network} onClick={auto} icon={<Send className="h-4 w-4" />}>
              Envoyer {formatXOF(amountXOF)}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <InlineAlert tone="warning" title="Remboursement assisté">
            {manual} Envoyez le montant depuis votre tableau de bord SasPay (ou votre application mobile money), puis saisissez la référence ci-dessous.
          </InlineAlert>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => copy(phone)} className="flex items-center justify-between rounded-xl bg-paper px-3.5 py-2.5 text-left text-[13.5px]">
              <span>
                <span className="block text-[11.5px] text-muted">Numéro</span>
                <span className="num font-semibold">+221 {phone}</span>
              </span>
              <Copy className="h-4 w-4 text-muted" />
            </button>
            <button type="button" onClick={() => copy(String(Math.round(amountXOF)))} className="flex items-center justify-between rounded-xl bg-paper px-3.5 py-2.5 text-left text-[13.5px]">
              <span>
                <span className="block text-[11.5px] text-muted">Montant</span>
                <span className="num font-semibold">{formatXOF(amountXOF)}</span>
              </span>
              <Copy className="h-4 w-4 text-muted" />
            </button>
          </div>
          <a href="https://app.saspay.me" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:underline">
            Ouvrir le tableau de bord SasPay <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <Input label="Référence du remboursement" value={reference} onChange={e => setReference(e.target.value)} placeholder="ID de transaction Wave / Orange Money / SasPay" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Fermer
            </Button>
            <Button loading={busy} onClick={confirmManual}>
              Enregistrer le remboursement
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
