import React from 'react';
import { Car, Plus } from 'lucide-react';
import { useAsync } from '../../lib/hooks';
import { listVehicles } from '../../services/vehicles';
import { VEHICLE_STATUS, VEHICLE_TYPE_LABEL } from '../../lib/status';
import { PageHeader } from '../../components/ui/Layout';
import { Button } from '../../components/ui/Button';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState, ErrorState, InlineAlert, Skeleton } from '../../components/ui/States';
import { vehiclePriceLabel } from '../../components/commerce/VehicleCard';
import { PLACEHOLDER_IMAGE } from '../../services/catalog';
import type { Vehicle } from '../../lib/types';

export default function StaffVehiclesPage() {
  const { data, loading, error, reload } = useAsync(() => listVehicles({ includeUnpublished: true }), []);
  return (
    <div>
      <PageHeader
        title="Automobile & motos"
        description="Fiches véhicules publiées sur le site. Les demandes clients se traitent dans « Demandes & devis »."
        actions={
          <div className="flex gap-2">
            <Button to="/espace-pro/demandes?type=vehicle" variant="secondary">
              Demandes auto
            </Button>
            <Button to="/espace-pro/vehicules/nouveau" icon={<Plus className="h-4 w-4" />}>
              Ajouter un véhicule
            </Button>
          </div>
        }
      />
      {data?.unavailable && <InlineAlert tone="warning" title="Module automobile non activé">La migration de base de données Dallou Chine doit être appliquée pour gérer les véhicules.</InlineAlert>}
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <Skeleton className="h-64" />
      ) : !data?.items.length ? (
        <div className="card">
          <EmptyState icon={<Car className="h-5 w-5" />} title="Aucun véhicule" description="Ajoutez vos premières fiches : elles apparaîtront dans la section Automobile & motos." action={<Button to="/espace-pro/vehicules/nouveau">Ajouter un véhicule</Button>} />
        </div>
      ) : (
        <DataTable<Vehicle>
          rows={data.items}
          rowKey={v => v.id}
          rowHref={v => `/espace-pro/vehicules/${v.id}`}
          columns={[
            {
              key: 'v',
              header: 'Véhicule',
              cell: v => (
                <div className="flex items-center gap-3">
                  <img src={v.images[0] || PLACEHOLDER_IMAGE} alt="" className="h-10 w-14 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="max-w-[280px] truncate font-semibold">{v.title}</p>
                    <p className="text-[12px] text-muted">
                      {VEHICLE_TYPE_LABEL[v.vehicleType]} · {v.brand} {v.model} {v.year || ''}
                    </p>
                  </div>
                </div>
              )
            },
            { key: 'price', header: 'Prix', align: 'right', cell: v => <span className="num font-semibold">{vehiclePriceLabel(v)}</span> },
            { key: 'status', header: 'Disponibilité', cell: v => <StatusBadge map={VEHICLE_STATUS} status={v.status} /> },
            { key: 'pub', header: 'En ligne', cell: v => (v.isPublished ? <Badge tone="success" dot>Publié</Badge> : <Badge dot>Brouillon</Badge>) }
          ]}
          mobile={v => (
            <div className="flex items-center gap-3">
              <img src={v.images[0] || PLACEHOLDER_IMAGE} alt="" className="h-12 w-16 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{v.title}</p>
                <p className="text-[12.5px] text-muted">{vehiclePriceLabel(v)}</p>
              </div>
              {v.isPublished ? <Badge tone="success">Publié</Badge> : <Badge>Brouillon</Badge>}
            </div>
          )}
        />
      )}
    </div>
  );
}
