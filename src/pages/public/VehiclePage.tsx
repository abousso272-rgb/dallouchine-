import React, { useEffect, useState } from 'react';
import { Car, ChevronRight } from 'lucide-react';
import { useAsync } from '../../lib/hooks';
import { getVehicle } from '../../services/vehicles';
import { Link } from '../../components/ui/Link';
import { StatusBadge } from '../../components/ui/Badge';
import { DefinitionList } from '../../components/ui/Layout';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, PageLoader } from '../../components/ui/States';
import { VehicleRequestForm } from '../../components/commerce/VehicleRequestForm';
import { vehiclePriceLabel } from '../../components/commerce/VehicleCard';
import { CONDITION_LABEL, FUEL_LABEL, TRANSMISSION_LABEL, VEHICLE_STATUS, VEHICLE_TYPE_LABEL } from '../../lib/status';
import { formatNumber } from '../../lib/format';
import { PLACEHOLDER_IMAGE } from '../../services/catalog';

export default function VehiclePage({ slug }: { slug: string }) {
  const { data: v, loading, error, reload } = useAsync(() => getVehicle(slug), [slug], { cacheKey: `vehicle:${slug}` });
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (v) document.title = `${v.title} — Dallou Chine Automobile`;
  }, [v]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!v || !v.isPublished) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={<Car className="h-5 w-5" />} title="Véhicule introuvable" description="Ce véhicule n’est plus en ligne." action={<Button to="/automobile">Voir les véhicules</Button>} />
      </div>
    );
  }

  const images = v.images.length ? v.images : [PLACEHOLDER_IMAGE];

  return (
    <div className="container-page pb-10 pt-6 sm:pt-8">
      <nav className="mb-5 flex items-center gap-1.5 text-[12.5px] font-medium text-muted" aria-label="Fil d’Ariane">
        <Link to="/automobile" className="hover:text-ink">
          Automobile & motos
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate text-ink">{v.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        <div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-[24px] bg-ink-3">
            <img src={images[imageIndex]} alt={v.title} className="h-full w-full object-cover" />
            <div className="absolute left-4 top-4">
              <StatusBadge map={VEHICLE_STATUS} status={v.status} className="bg-white/95" />
            </div>
          </div>
          {images.length > 1 && (
            <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button key={img} type="button" onClick={() => setImageIndex(i)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 ${i === imageIndex ? 'border-ink' : 'border-transparent ring-1 ring-line'}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-8">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-subtle">
              {VEHICLE_TYPE_LABEL[v.vehicleType]} · {CONDITION_LABEL[v.condition]}
            </p>
            <h1 className="mt-2 text-[26px] font-bold leading-tight sm:text-[34px]">{v.title}</h1>
            <p className="num mt-3 font-display text-[28px] font-semibold">{vehiclePriceLabel(v)}</p>
            {!v.priceOnRequest && v.priceXOF ? <p className="text-[13px] text-muted">Prix indicatif hors transport et dédouanement — confirmé par devis.</p> : null}
          </div>

          <section className="card mt-6 p-5 sm:p-6">
            <h2 className="mb-4 text-base font-semibold">Caractéristiques</h2>
            <DefinitionList
              columns={2}
              items={[
                { label: 'Marque', value: v.brand },
                { label: 'Modèle', value: v.model },
                { label: 'Année', value: v.year },
                { label: 'État', value: CONDITION_LABEL[v.condition] },
                { label: 'Kilométrage', value: v.mileageKm !== null ? `${formatNumber(v.mileageKm)} km` : null },
                { label: 'Carburant', value: v.fuel ? FUEL_LABEL[v.fuel] : null },
                { label: 'Boîte', value: v.transmission ? TRANSMISSION_LABEL[v.transmission] : null },
                { label: 'Moteur', value: v.engine },
                { label: 'Puissance', value: v.powerHp ? `${v.powerHp} ch` : null },
                { label: 'Places', value: v.seats },
                { label: 'Couleur', value: v.color },
                { label: 'Localisation', value: v.location },
                { label: 'Délai de livraison', value: v.leadTime }
              ]}
            />
          </section>

          {(v.description || v.features.length > 0) && (
            <section className="card mt-4 p-5 sm:p-6">
              {v.description && <p className="whitespace-pre-line text-[15px] leading-relaxed text-muted">{v.description}</p>}
              {v.features.length > 0 && (
                <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {v.features.map(f => (
                    <li key={f} className="flex gap-2.5 text-[14px]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> {f}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Demander un devis</h2>
            <p className="mb-5 mt-1 text-[13.5px] text-muted">Prix ferme, transport et délais détaillés. Réponse d’un conseiller automobile.</p>
            {v.status === 'sold' ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">Ce véhicule est vendu. Nous pouvons en sourcer un équivalent.</p>
                <Button to="/automobile#recherche" block>
                  Recherche personnalisée
                </Button>
              </div>
            ) : (
              <VehicleRequestForm vehicle={v} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
