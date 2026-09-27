import React, { useState } from 'react';
import { Car, Search } from 'lucide-react';
import { useAsync, useDebounced } from '../../lib/hooks';
import { listVehicles } from '../../services/vehicles';
import { VehicleCard } from '../../components/commerce/VehicleCard';
import { VehicleRequestForm } from '../../components/commerce/VehicleRequestForm';
import { ProductCard } from '../../components/commerce/ProductCard';
import { listProducts } from '../../services/catalog';
import { EmptyState, ErrorState } from '../../components/ui/States';
import { VEHICLE_TYPE_LABEL } from '../../lib/status';

const TYPE_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'car', label: 'Voitures' },
  { value: 'suv', label: 'SUV & 4x4' },
  { value: 'pickup', label: 'Pick-up' },
  { value: 'motorcycle', label: 'Motos' },
  { value: 'scooter', label: 'Scooters' },
  { value: 'van', label: 'Minibus' },
  { value: 'truck', label: 'Camions' }
];

export default function VehiclesPage() {
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const q = useDebounced(search, 350);
  const { data, loading, error, reload } = useAsync(() => listVehicles({ type: type || null, search: q, featuredFirst: true }), [type, q]);
  const items = data?.items || [];
  const autoProducts = useAsync(() => listProducts({ autoMobilityOnly: true, pageSize: 8 }).then(r => r.items), []);

  return (
    <div>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="container-page relative py-12 sm:py-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">Automobile & motos</p>
          <h1 className="mt-3 max-w-3xl text-[30px] font-semibold leading-tight text-white sm:text-[46px]">Voitures, motos et véhicules professionnels, importés sur devis.</h1>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-white/65">
            Choisissez un véhicule de notre sélection ou décrivez celui que vous cherchez. Vérification, transport maritime et accompagnement jusqu’à la remise des clés.
          </p>
          <div className="mt-8 flex max-w-xl gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Marque, modèle…"
                className="h-12 w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-3 text-white placeholder:text-white/45 focus:border-white/40 focus:outline-none"
                aria-label="Rechercher un véhicule"
              />
            </div>
          </div>
          <div className="scrollbar-none -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {TYPE_FILTERS.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors ${type === t.value ? 'bg-white text-ink' : 'border border-white/15 text-white/75 hover:text-white'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container-page py-10">
        {error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="skeleton h-[360px] rounded-[var(--radius-card)]" />
            ))}
          </div>
        ) : items.length ? (
          <>
            <p className="mb-4 text-[13px] font-medium text-muted">
              {items.length} véhicule{items.length > 1 ? 's' : ''}
              {type ? ` · ${VEHICLE_TYPE_LABEL[type]}` : ''}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(v => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </>
        ) : (
          <div className="card">
            <EmptyState
              icon={<Car className="h-5 w-5" />}
              title={q || type ? 'Aucun véhicule ne correspond' : 'Notre sélection arrive bientôt'}
              description="Pas de souci : décrivez le véhicule recherché ci-dessous, nous le sourçons pour vous."
            />
          </div>
        )}

        {(autoProducts.data || []).length > 0 && (
          <section className="mt-12">
            <div className="mb-5 flex flex-col gap-1">
              <p className="eyebrow">Disponibles à l’achat</p>
              <h2 className="text-[24px] font-semibold sm:text-3xl">Deux-roues & mobilité électrique</h2>
              <p className="text-[15px] text-muted">Commandez en ligne ces modèles du catalogue, paiement sécurisé et livraison à Dakar.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {(autoProducts.data || []).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        <section id="recherche" className="mt-12 grid grid-cols-1 scroll-mt-24 gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Recherche personnalisée</p>
            <h2 className="mt-2 text-[26px] font-semibold leading-tight sm:text-3xl">Vous cherchez un véhicule précis ?</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Donnez-nous la marque, le modèle, l’année et votre budget. Nous vérifions la disponibilité chez nos partenaires en Chine et vous envoyons une offre détaillée : prix, transport, délais et formalités.
            </p>
            <ul className="mt-6 space-y-3 text-[14px]">
              {['Neuf ou occasion récente, inspecté avant départ', 'Transport maritime conteneur ou roulier', 'Accompagnement dédouanement sur demande', 'Paiement par acompte puis solde'].map(t => (
                <li key={t} className="flex gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5 sm:p-7">
            <VehicleRequestForm />
          </div>
        </section>
      </div>
    </div>
  );
}
