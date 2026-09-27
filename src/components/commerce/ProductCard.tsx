import React from 'react';
import { Plane, Ship } from 'lucide-react';
import type { Product } from '../../lib/types';
import { Link } from '../ui/Link';
import { Price } from '../ui/Price';

export function availabilityLabel(p: Pick<Product, 'availableQuantity' | 'moq'>): { label: string; tone: string } {
  if (p.availableQuantity <= 0) return { label: 'Sur commande', tone: 'text-muted' };
  if (p.availableQuantity <= 5) return { label: `Plus que ${p.availableQuantity}`, tone: 'text-amber-700' };
  return { label: 'Disponible', tone: 'text-jade' };
}

export function ProductCard({ product }: { product: Product }) {
  const avail = availabilityLabel(product);
  const TransportIcon = product.transportMode === 'sea' ? Ship : Plane;
  return (
    <Link
      to={`/produit/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-square overflow-hidden bg-paper-2">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {product.compareAtPriceXOF && product.compareAtPriceXOF > product.priceXOF && (
            <span className="rounded-md bg-brand px-1.5 py-0.5 text-[10.5px] font-bold text-white">
              −{Math.round(((product.compareAtPriceXOF - product.priceXOF) / product.compareAtPriceXOF) * 100)}%
            </span>
          )}
          {product.isGroupage && <span className="rounded-md bg-ink px-1.5 py-0.5 text-[10.5px] font-bold text-white">Groupage</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-subtle">{product.categoryName}</p>
        <h3 className="mt-1 line-clamp-2 min-h-[2.6em] font-sans text-[13.5px] font-semibold leading-snug text-ink sm:text-[14.5px]">{product.name}</h3>
        <div className="mt-auto pt-3">
          <Price value={product.priceXOF} compareAt={product.compareAtPriceXOF} size="sm" />
          <div className="mt-2 flex items-center justify-between gap-2 text-[11.5px]">
            <span className={`font-semibold ${avail.tone}`}>{avail.label}</span>
            <span className="hidden items-center gap-1 text-muted sm:inline-flex">
              <TransportIcon className="h-3.5 w-3.5" />
              {product.deliveryDelay || (product.transportMode === 'sea' ? 'Maritime' : 'Aérien')}
            </span>
          </div>
          {product.moq > 1 && <p className="mt-1 text-[11px] text-muted">Min. {product.moq} unités</p>}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
      <div className="skeleton aspect-square" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton mt-3 h-5 w-1/2 rounded" />
      </div>
    </div>
  );
}
