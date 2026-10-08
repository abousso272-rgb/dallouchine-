import React, { useState } from 'react';
import { CreditCard, PackageCheck, Target, Users } from 'lucide-react';
import { useAsync, usePolling } from '../../lib/hooks';
import { listPublicGroupages, isJoinable } from '../../services/groupages';
import { GroupageCard } from '../../components/commerce/GroupageCard';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState, ErrorState } from '../../components/ui/States';
import { Button } from '../../components/ui/Button';

export default function GroupagesPage() {
  const { data, loading, error, reload } = useAsync(() => listPublicGroupages(), [], { cacheKey: 'groupages:public' });
  usePolling(reload, 60000);
  const [tab, setTab] = useState<'open' | 'progress'>('open');
  const open = (data || []).filter(isJoinable);
  const inProgress = (data || []).filter(g => !isJoinable(g));
  const list = tab === 'open' ? open : inProgress;

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
        <div>
          <p className="eyebrow">Achats groupés</p>
          <h1 className="mt-2 text-[30px] font-bold leading-tight sm:text-[42px]">Le prix usine, à plusieurs.</h1>
          <p className="mt-3 max-w-xl text-[15.5px] leading-relaxed text-muted">
            Les fournisseurs chinois imposent des quantités minimales. En regroupant les commandes, chacun accède au prix de gros — même pour une seule unité.
          </p>
        </div>
        <ol className="grid grid-cols-2 gap-2.5">
          {[
            { icon: Users, t: 'Rejoignez', d: 'Choisissez votre quantité' },
            { icon: CreditCard, t: 'Payez votre part', d: 'Paiement en ligne sécurisé' },
            { icon: Target, t: 'Objectif atteint', d: 'Commande lancée à l’usine' },
            { icon: PackageCheck, t: 'Récupérez', d: 'Au hub ou en livraison' }
          ].map((s, i) => (
            <li key={s.t} className="rounded-2xl border border-line bg-white p-3.5">
              <div className="flex items-center gap-2">
                <span className="num flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">{i + 1}</span>
                <s.icon className="h-4 w-4 text-brand" />
              </div>
              <p className="mt-2.5 text-[13.5px] font-semibold">{s.t}</p>
              <p className="text-[12px] text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'open', label: 'Ouverts aux participations', count: open.length },
            { value: 'progress', label: 'En cours d’acheminement', count: inProgress.length }
          ]}
        />
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="skeleton h-[400px] rounded-[var(--radius-card)]" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title={tab === 'open' ? 'Aucun groupage ouvert actuellement' : 'Aucun groupage en cours d’acheminement'}
              description="De nouvelles campagnes ouvrent régulièrement. En attendant, parcourez le catalogue ou demandez un sourcing."
              action={
                <div className="flex gap-2">
                  <Button to="/catalogue" variant="secondary">
                    Catalogue
                  </Button>
                  <Button to="/sourcing">Demander un sourcing</Button>
                </div>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map(g => (
              <GroupageCard key={g.id} groupage={g} />
            ))}
          </div>
        )}
      </div>

      <section className="mt-14 grid grid-cols-1 gap-4 rounded-[var(--radius-card)] border border-line bg-white p-6 sm:grid-cols-3 sm:p-8">
        <div>
          <h2 className="text-lg font-semibold">Bon à savoir</h2>
          <p className="mt-1.5 text-sm text-muted">Tout est visible dans votre espace client, à chaque étape.</p>
        </div>
        <div className="text-[14px] leading-relaxed text-muted">
          <p className="font-semibold text-ink">Votre participation est confirmée au paiement.</p>
          Sans paiement, la réservation reste modifiable et peut être annulée depuis votre espace tant que le groupage n’est pas lancé.
        </div>
        <div className="text-[14px] leading-relaxed text-muted">
          <p className="font-semibold text-ink">Conditions propres à chaque campagne.</p>
          Délais, mode de transport et conditions en cas d’objectif non atteint sont précisés sur la fiche de chaque groupage.
        </div>
      </section>
    </div>
  );
}
