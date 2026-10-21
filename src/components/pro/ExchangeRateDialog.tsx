import React, { useEffect, useState } from 'react';
import { Banknote } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { friendlyError } from '../../lib/db';
import { setExchangeRate } from '../../services/finance';
import { formatDateTime } from '../../lib/format';
import type { FinanceContext } from '../../lib/pricing';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Field';
import { InlineAlert } from '../ui/States';

/** Change le taux yuan / dollar → FCFA. Utilisé par l'admin et le transitaire ; chaque changement est conservé avec son auteur. */
export function ExchangeRateDialog({ open, onClose, context, onSaved }: { open: boolean; onClose: () => void; context: FinanceContext; onSaved: () => void }) {
  const { toast } = useApp();
  const [cny, setCny] = useState('');
  const [usd, setUsd] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCny(String(context.fx.cny_to_xof ?? ''));
    setUsd(String(context.fx.usd_to_xof ?? ''));
    setError(null);
  }, [open, context]);

  const num = (v: string) => Number(v.replace(',', '.'));

  async function save() {
    setError(null);
    const rate = num(cny);
    if (!(rate > 0)) return setError('Indiquez un taux positif, par exemple 88,5.');
    setSaving(true);
    try {
      await setExchangeRate(rate, usd.trim() ? num(usd) : null);
      toast('success', 'Taux de change mis à jour', `1 ¥ = ${rate} FCFA`);
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
      title="Taux de change"
      description="Il sert à calculer le coût en FCFA de tous vos produits et devis. Vous pouvez l’ajuster dès que le yuan bouge."
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
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="1 yuan (¥) vaut" inputMode="decimal" value={cny} onChange={e => setCny(e.target.value)} suffix="FCFA" />
          <Input label="1 dollar ($) vaut" inputMode="decimal" value={usd} onChange={e => setUsd(e.target.value)} suffix="FCFA" />
        </div>
        <p className="text-[12.5px] text-muted">Pour éviter une faute de frappe, une variation de plus de 30 % d’un coup est refusée.</p>
        {context.fx_history.length > 0 && (
          <div className="rounded-2xl bg-paper p-3.5 text-[12.5px]">
            <p className="mb-1.5 font-semibold text-ink">Derniers taux du yuan</p>
            <ul className="space-y-1 text-muted">
              {context.fx_history.slice(0, 5).map(h => (
                <li key={h.at} className="flex justify-between">
                  <span className="num">{h.cny_to_xof} FCFA</span>
                  <span>{formatDateTime(h.at)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {error && <InlineAlert tone="danger">{error}</InlineAlert>}
      </div>
    </Modal>
  );
}
