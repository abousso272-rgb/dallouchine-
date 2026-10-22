import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { getFinanceContext } from '../../services/finance';
import type { TransportMode } from '../../lib/pricing';
import { PageHeader, Card, CardTitle } from '../../components/ui/Layout';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { ErrorState, Skeleton } from '../../components/ui/States';
import { EMPTY_ECO, GroupageProfitability, type EcoState } from '../../components/pro/GroupageProfitability';

export const GROUPAGE_DRAFT_KEY = 'dallouchine_groupage_draft_v1';

/** Tester un groupage avant de le créer : prix, quantités, coûts. Utile au gestionnaire, au transitaire et à l'admin. */
export default function GroupageSimulatorPage() {
  const { user, navigate } = useApp();
  const ctx = useAsync(() => getFinanceContext(), [], { cacheKey: 'finance:context', maxAge: 60000 });
  const [eco, setEco] = useState<EcoState>(EMPTY_ECO);
  const [p, setP] = useState({ name: '', price: '', original: '', moq: '50', target: '80', mode: 'sea' as TransportMode });
  const canCreate = user?.role === 'admin' || user?.role === 'groupage_manager';
  const int = (v: string) => Number(v.replace(/\D/g, '')) || 0;

  function createFromSimulation() {
    try {
      sessionStorage.setItem(GROUPAGE_DRAFT_KEY, JSON.stringify({ ...p, eco }));
    } catch {
      /* sans stockage, on ouvre simplement le formulaire */
    }
    navigate('/espace-pro/groupages/nouveau?simulation=1');
  }

  return (
    <>
      <PageHeader
        eyebrow="Groupages"
        title="Simulateur de groupage"
        description="Testez un groupage avant de le lancer : à partir de combien de participants il devient rentable, quel prix fixer, quel bénéfice attendre."
        actions={
          canCreate ? (
            <Button onClick={createFromSimulation} icon={<ArrowRight className="h-4 w-4" />}>
              Créer ce groupage
            </Button>
          ) : undefined
        }
      />
      <div className="space-y-5">
        <Card>
          <CardTitle>La campagne</CardTitle>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <div className="col-span-2">
              <Input label="Produit (pour mémoire)" value={p.name} onChange={e => setP(x => ({ ...x, name: e.target.value }))} placeholder="Ex. Ventilateur solaire 16 pouces" />
            </div>
            <Input label="Prix groupage / unité" inputMode="numeric" value={p.price} onChange={e => setP(x => ({ ...x, price: e.target.value.replace(/\D/g, '') }))} suffix="F" />
            <Input label="Prix hors groupage" inputMode="numeric" value={p.original} onChange={e => setP(x => ({ ...x, original: e.target.value.replace(/\D/g, '') }))} suffix="F" hint="Prix du marché local" />
            <Input label="Minimum fournisseur" inputMode="numeric" value={p.moq} onChange={e => setP(x => ({ ...x, moq: e.target.value.replace(/\D/g, '') }))} />
            <Input label="Objectif (unités)" inputMode="numeric" value={p.target} onChange={e => setP(x => ({ ...x, target: e.target.value.replace(/\D/g, '') }))} />
            <Select
              label="Transport"
              value={p.mode}
              onChange={e => setP(x => ({ ...x, mode: e.target.value as TransportMode }))}
              options={[
                { value: 'sea', label: 'Bateau' },
                { value: 'air', label: 'Avion' },
                { value: 'express', label: 'Express' }
              ]}
            />
          </div>
        </Card>
        {ctx.loading && !ctx.data ? (
          <Skeleton className="h-80" />
        ) : ctx.error || !ctx.data ? (
          <ErrorState message={ctx.error || 'Tarifs indisponibles.'} onRetry={ctx.reload} />
        ) : (
          <GroupageProfitability
            eco={eco}
            onEco={patch => setEco(e => ({ ...e, ...patch }))}
            params={{ unitPriceXOF: int(p.price), originalPriceXOF: int(p.original), supplierMoq: int(p.moq) || 1, targetQuantity: int(p.target) || 1, mode: p.mode }}
            context={ctx.data}
            onApplyPrice={price => setP(x => ({ ...x, price: String(price) }))}
          />
        )}
      </div>
    </>
  );
}
