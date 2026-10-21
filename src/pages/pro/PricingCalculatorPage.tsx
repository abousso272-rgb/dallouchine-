import React from 'react';
import { useAsync } from '../../lib/hooks';
import { getFinanceContext } from '../../services/finance';
import { PageHeader, Card } from '../../components/ui/Layout';
import { ErrorState, Skeleton } from '../../components/ui/States';
import { PricingPanel } from '../../components/pro/PricingPanel';

/** Estimation rapide d'un prix livré (réponse à un client, négociation fournisseur) sans créer de devis. */
export default function PricingCalculatorPage() {
  const ctx = useAsync(() => getFinanceContext(), [], { cacheKey: 'finance:context', maxAge: 60000 });

  return (
    <>
      <PageHeader
        eyebrow="Outils"
        title="Calculateur de prix"
        description="Du prix d’achat en yuans au prix de vente livré à Dakar : change, fret, douane et marge, avec la marge réelle affichée avant d’envoyer un devis."
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
    </>
  );
}
