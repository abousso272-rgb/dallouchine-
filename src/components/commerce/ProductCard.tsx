import React, { useState } from 'react';
import { Loader2, Plane, Plus, Ship } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Product } from '../../lib/types';
import { Link } from '../ui/Link';
import { Price } from '../ui/Price';

export function availabilityLabel(p: Pick<Product, 'availableQuantity' | 'moq'>): { label: string; tone: string } {
  if (p.availableQuantity <= 0) return { label: 'Sur commande', tone: 'text-muted' };
  if (p.availableQuantity <= 5) return { label: `Plus que ${p.availableQuantity}`, tone: 'text-amber-700' };
  return { label: 'Disponible', tone: 'text-jade' };
}

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useApp();
  const [adding, setAdding] = useState(false);
  const avail = availabilityLabel(product);
  const TransportIcon = product.transportMode === 'sea' ? Ship : Plane;
  const discount = product.compareAtPriceXOF && product.compareAtPriceXOF > product.priceXOF ? Math.round(((product.compareAtPriceXOF - product.priceXOF) / product.compareAtPriceXOF) * 100) : 0;

  async function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    await addToCart(product, Math.max(1, product.moq || 1));
    setAdding(false);
  }

  return (
    <Link to={`/produit/${product.slug}`} className="lift group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-[var(--shadow-soft)]">
      <div className="relative m-1.5 aspect-square overflow-hidden rounded-[18px] bg-paper-2">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
          {discount > 0 && <span className="rounded-full bg-brand-gradient px-2 py-0.5 text-[10.5px] font-bold text-white shadow-sm">−{discount}%</span>}
          {product.isGroupage && <span className="glass rounded-full px-2 py-0.5 text-[10.5px] font-bold text-ink">Groupage</span>}
        </div>
        <button
          type="button"
          onClick={quickAdd}
          className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-[0_8px_20px_-8px_rgb(11_22_32/0.45)] transition-all hover:bg-brand-gradient hover:text-white sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus:translate-y-0 sm:focus:opacity-100"
          aria-label={`Ajouter ${product.name} au panier`}
          title={product.moq > 1 ? `Ajouter ${product.moq} unités` : 'Ajouter au panier'}
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-[18px] w-[18px]" strokeWidth={2.4} />}
        </button>
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-1.5 sm:px-4 sm:pb-4">
        <p className="truncate text-[10.5px] font-bold uppercase tracking-[0.08em] text-brand-600/80">{product.categoryName}</p>
        <h3 className="mt-1 line-clamp-2 min-h-[2.6em] font-sans text-[13.5px] font-semibold leading-snug text-ink sm:text-[14.5px]">{product.name}</h3>
        <div className="mt-auto pt-3">
          <Price value={product.priceXOF} compareAt={product.compareAtPriceXOF} size="sm" />
          <div className="mt-2 flex items-center justify-between gap-2 text-[11.5px]">
            <span className={`inline-flex items-center gap-1 font-semibold ${avail.tone}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" /> {avail.label}
            </span>
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
      <div className="skeleton m-1.5 aspect-square rounded-[18px]" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton mt-3 h-5 w-1/2 rounded" />
      </div>
    </div>
  );
}
