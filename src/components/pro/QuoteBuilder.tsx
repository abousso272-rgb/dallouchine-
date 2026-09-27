import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { createQuote } from '../../services/requests';
import { friendlyError } from '../../lib/db';
import { formatXOF, percent } from '../../lib/format';
import type { ClientRequest, Finding } from '../../lib/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Checkbox, Input, Select, Textarea } from '../ui/Field';
import { InlineAlert } from '../ui/States';

interface Line {
  description: string;
  quantity: string;
  unitPrice: string;
}

const DEFAULT_CONDITIONS = [
  'Acompte à la validation, solde avant expédition depuis la Chine',
  'Contrôle qualité avant expédition',
  'Délais indicatifs à compter de la réception de l’acompte'
];

/** Construction d'un devis client, avec rappel du coût d'achat pour piloter la marge. */
export function QuoteBuilder({
  open,
  onClose,
  request,
  findings,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  request: ClientRequest;
  findings: Finding[];
  onCreated: () => void;
}) {
  const { toast } = useApp();
  const selected = findings.find(f => f.isSelected) || findings[0];
  const [lines, setLines] = useState<Line[]>([
    { description: request.title, quantity: String(request.quantity || 1), unitPrice: '' }
  ]);
  const [shipping, setShipping] = useState('');
  const [customs, setCustoms] = useState('');
  const [fees, setFees] = useState('');
  const [discount, setDiscount] = useState('');
  const [deposit, setDeposit] = useState('50');
  const [validDays, setValidDays] = useState('15');
  const [leadTime, setLeadTime] = useState(selected?.leadTimeDays ? `${selected.leadTimeDays + 30} à ${selected.leadTimeDays + 45} jours` : '');
  const [transport, setTransport] = useState<'sea' | 'air' | 'express'>('sea');
  const [conditions, setConditions] = useState(DEFAULT_CONDITIONS.join('\n'));
  const [notes, setNotes] = useState('');
  const [send, setSend] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const n = (v: string) => Number(v.replace(/\s/g, '')) || 0;
  const subtotal = lines.reduce((s, l) => s + n(l.quantity) * n(l.unitPrice), 0);
  const total = Math.max(subtotal + n(shipping) + n(customs) + n(fees) - n(discount), 0);
  const depositAmount = Math.round((total * Math.min(Math.max(n(deposit), 0), 100)) / 100);
  const purchaseCost = useMemo(() => (selected?.unitPriceXOF ? selected.unitPriceXOF * (n(lines[0]?.quantity || '0') || request.quantity) : null), [selected, lines, request.quantity]);
  const margin = purchaseCost !== null ? subtotal + n(fees) - n(discount) - purchaseCost : null;

  function updateLine(i: number, patch: Partial<Line>) {
    setLines(prev => prev.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  }

  async function submit() {
    setError(null);
    const items = lines
      .filter(l => l.description.trim() && n(l.quantity) > 0)
      .map(l => ({ description: l.description.trim(), quantity: n(l.quantity), unit_price_xof: n(l.unitPrice) }));
    if (!items.length) return setError('Ajoutez au moins une ligne avec une quantité.');
    if (total <= 0) return setError('Le total du devis doit être positif.');
    setSaving(true);
    try {
      const res = await createQuote(request.type, request.id, {
        items,
        shippingXOF: n(shipping),
        customsXOF: n(customs),
        feesXOF: n(fees),
        discountXOF: n(discount),
        depositPercent: n(deposit),
        validDays: n(validDays) || 15,
        leadTime,
        transportMode: transport,
        conditions: conditions
          .split('\n')
          .map(c => c.trim())
          .filter(Boolean),
        notes,
        send
      });
      toast('success', send ? 'Devis envoyé au client' : 'Devis enregistré en brouillon', `${res.quote_number} · ${formatXOF(res.total_xof)}`);
      onCreated();
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
      size="xl"
      title={`Devis pour ${request.code}`}
      description={`${request.company || request.contactName} · ${request.title}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={submit} loading={saving}>
            {send ? `Envoyer le devis · ${formatXOF(total)}` : 'Enregistrer le brouillon'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-[13px] font-semibold">Lignes du devis</p>
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 rounded-2xl border border-line p-3 sm:grid-cols-[1fr_110px_150px_auto] sm:items-end">
              <Input label={i === 0 ? 'Désignation' : undefined} value={l.description} onChange={e => updateLine(i, { description: e.target.value })} placeholder="Produit, prestation…" aria-label="Désignation" />
              <Input label={i === 0 ? 'Quantité' : undefined} inputMode="numeric" value={l.quantity} onChange={e => updateLine(i, { quantity: e.target.value.replace(/\D/g, '') })} aria-label="Quantité" />
              <Input label={i === 0 ? 'Prix unitaire' : undefined} inputMode="numeric" value={l.unitPrice} onChange={e => updateLine(i, { unitPrice: e.target.value.replace(/\D/g, '') })} suffix="F" aria-label="Prix unitaire" />
              <button
                type="button"
                onClick={() => setLines(prev => prev.filter((_, k) => k !== i))}
                disabled={lines.length === 1}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-subtle hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                aria-label="Supprimer la ligne"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button variant="subtle" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setLines(prev => [...prev, { description: '', quantity: '1', unitPrice: '' }])}>
            Ajouter une ligne
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Input label="Transport" inputMode="numeric" value={shipping} onChange={e => setShipping(e.target.value.replace(/\D/g, ''))} suffix="F" />
          <Input label="Douane & taxes" inputMode="numeric" value={customs} onChange={e => setCustoms(e.target.value.replace(/\D/g, ''))} suffix="F" />
          <Input label="Frais de service" inputMode="numeric" value={fees} onChange={e => setFees(e.target.value.replace(/\D/g, ''))} suffix="F" />
          <Input label="Remise" inputMode="numeric" value={discount} onChange={e => setDiscount(e.target.value.replace(/\D/g, ''))} suffix="F" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Input label="Acompte" inputMode="numeric" value={deposit} onChange={e => setDeposit(e.target.value.replace(/\D/g, '').slice(0, 3))} suffix="%" />
          <Input label="Validité" inputMode="numeric" value={validDays} onChange={e => setValidDays(e.target.value.replace(/\D/g, '').slice(0, 3))} suffix="jours" />
          <Input label="Délai" value={leadTime} onChange={e => setLeadTime(e.target.value)} placeholder="45 à 60 jours" />
          <Select
            label="Transport"
            value={transport}
            onChange={e => setTransport(e.target.value as 'sea' | 'air' | 'express')}
            options={[
              { value: 'sea', label: 'Maritime' },
              { value: 'air', label: 'Aérien' },
              { value: 'express', label: 'Express' }
            ]}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Textarea label="Conditions (une par ligne)" value={conditions} onChange={e => setConditions(e.target.value)} rows={4} />
          <Textarea label="Message au client" value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Précisions sur la proposition, options, échantillon…" />
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-2xl bg-paper p-4 text-sm sm:grid-cols-2">
          <dl className="space-y-1.5">
            <div className="flex justify-between">
              <dt className="text-muted">Sous-total</dt>
              <dd className="num">{formatXOF(subtotal)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total client</dt>
              <dd className="num">{formatXOF(total)}</dd>
            </div>
            <div className="flex justify-between text-muted">
              <dt>Acompte / solde</dt>
              <dd className="num">
                {formatXOF(depositAmount)} / {formatXOF(total - depositAmount)}
              </dd>
            </div>
          </dl>
          <div className="rounded-xl bg-white p-3 ring-1 ring-line">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Pilotage interne</p>
            {purchaseCost !== null ? (
              <>
                <p className="mt-1 text-[13px]">
                  Coût d’achat ({selected?.supplierName}) : <span className="num font-semibold">{formatXOF(purchaseCost)}</span>
                </p>
                <p className={`mt-0.5 text-[13px] font-semibold ${margin! < 0 ? 'text-red-700' : 'text-jade'}`}>
                  Marge produit : {formatXOF(margin)} ({percent(Math.max(margin!, 0), subtotal || 1)} %)
                </p>
              </>
            ) : (
              <p className="mt-1 text-[13px] text-muted">Ajoutez un résultat fournisseur avec prix d’achat pour suivre la marge.</p>
            )}
          </div>
        </div>

        <Checkbox label="Envoyer immédiatement au client" description="Le client est notifié et peut accepter le devis en ligne. Les devis précédents encore ouverts sont remplacés." checked={send} onChange={setSend} />
        {error && <InlineAlert tone="danger">{error}</InlineAlert>}
      </div>
    </Modal>
  );
}
