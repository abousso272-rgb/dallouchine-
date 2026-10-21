import React, { useState } from 'react';
import { useAsync } from '../../lib/hooks';
import { getFinanceContext } from '../../services/finance';
import { PageHeader, Card } from '../../components/ui/Layout';
import { ErrorState, Skeleton } from '../../components/ui/States';
import { PricingPanel } from '../../components/pro/PricingPanel';
import { ExchangeRateDialog } from '../../components/pro/ExchangeRateDialog';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/ui/Button';

/** Estimation rapide d'un prix livré (réponse à un client, négociation fournisseur) sans créer de devis. */
export default function PricingCalculatorPage() {
  const ctx = useAsync(() => getFinanceContext(), [], { cacheKey: 'finance:context', maxAge: 60000 });
  const { user } = useApp();
  const canFx = user?.role === 'admin' || user?.role === 'transitaire';
  const [fxOpen, setFxOpen] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow="Outils"
        title="Calculateur de prix"
        description="Du prix d’achat en yuans au prix de vente livré à Dakar : change, fret, douane et marge, avec la marge réelle affichée avant d’envoyer un devis."
        actions={
          canFx && ctx.data ? (
            <Button variant="secondary" onClick={() => setFxOpen(true)}>
              Taux : 1 ¥ = {(ctx.data.fx.cny_to_xof ?? 0).toLocaleString('fr-FR')} FCFA
            </Button>
          ) : undefined
        }
      />
      {ctx.loading && !ctx.data ? (
        <Skeleton className="h-96 w-full" />
      ) : ctx.error || !ctx.data ? (
        <ErrorState message={ctx.error || 'Grille de prix indisponible.'} onRetry={ctx.reload} />
      ) : (
        <Card>
          <PricingPanel context={ctx.data} />
        </Card>
      )}
      {canFx && ctx.data && <ExchangeRateDialog open={fxOpen} onClose={() => setFxOpen(false)} context={ctx.data} onSaved={ctx.reload} />}
    </>
  );
}
