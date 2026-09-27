import React from 'react';
import { Fuel, Gauge, Settings2 } from 'lucide-react';
import type { Vehicle } from '../../lib/types';
import { Link } from '../ui/Link';
import { StatusBadge } from '../ui/Badge';
import { CONDITION_LABEL, FUEL_LABEL, TRANSMISSION_LABEL, VEHICLE_STATUS, VEHICLE_TYPE_LABEL } from '../../lib/status';
import { formatNumber, formatXOF } from '../../lib/format';
import { PLACEHOLDER_IMAGE } from '../../services/catalog';

export function vehiclePriceLabel(v: Pick<Vehicle, 'priceXOF' | 'priceOnRequest'>) {
  return v.priceOnRequest || !v.priceXOF ? 'Prix sur devis' : formatXOF(v.priceXOF);
}

export function VehicleCard({ vehicle, dark }: { vehicle: Vehicle; dark?: boolean }) {
  return (
    <Link
      to={`/automobile/${vehicle.slug}`}
      className={`group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border transition-shadow duration-200 hover:shadow-[var(--shadow-lift)] ${
        dark ? 'border-white/10 bg-ink-2 text-white' : 'border-line bg-white'
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-3">
        <img src={vehicle.images[0] || PLACEHOLDER_IMAGE} alt={vehicle.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <StatusBadge map={VEHICLE_STATUS} status={vehicle.status} className="bg-white/95" />
        </div>
        <span className="absolute bottom-3 left-3 rounded-lg bg-ink/80 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
          {VEHICLE_TYPE_LABEL[vehicle.vehicleType] || 'Véhicule'} · {CONDITION_LABEL[vehicle.condition] || ''}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className={`text-[11.5px] font-semibold uppercase tracking-wide ${dark ? 'text-white/50' : 'text-subtle'}`}>
          {vehicle.brand}
          {vehicle.year ? ` · ${vehicle.year}` : ''}
        </p>
        <h3 className={`mt-1 line-clamp-2 font-sans text-[15.5px] font-semibold leading-snug ${dark ? 'text-white' : ''}`}>{vehicle.title}</h3>
        <div className={`mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] ${dark ? 'text-white/65' : 'text-muted'}`}>
          {vehicle.fuel && (
            <span className="inline-flex items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5" /> {FUEL_LABEL[vehicle.fuel]}
            </span>
          )}
          {vehicle.transmission && (
            <span className="inline-flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5" /> {TRANSMISSION_LABEL[vehicle.transmission]}
            </span>
          )}
          {vehicle.mileageKm !== null && (
            <span className="inline-flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5" /> {formatNumber(vehicle.mileageKm)} km
            </span>
          )}
        </div>
        <div className={`mt-auto flex items-center justify-between pt-4 ${dark ? '' : ''}`}>
          <p className={`num font-display text-lg font-semibold ${dark ? 'text-white' : ''}`}>{vehiclePriceLabel(vehicle)}</p>
          <span className={`text-[12.5px] font-semibold ${dark ? 'text-white/80 group-hover:text-white' : 'text-brand'}`}>Voir la fiche →</span>
        </div>
      </div>
    </Link>
  );
}
