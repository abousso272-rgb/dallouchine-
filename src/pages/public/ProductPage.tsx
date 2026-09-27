import React, { useEffect, useState } from 'react';
import { BadgeCheck, ChevronRight, PackageSearch, Plane, ShieldCheck, Ship, ShoppingBag, Users, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { getProduct, listRelatedProducts } from '../../services/catalog';
import { listPublicGroupages, isJoinable } from '../../services/groupages';
import { Link } from '../../components/ui/Link';
import { Button } from '../../components/ui/Button';
import { Price } from '../../components/ui/Price';
import { PageLoader, EmptyState, ErrorState } from '../../components/ui/States';
import { QuantityInput } from '../../components/commerce/QuantityInput';
import { ProductCard, availabilityLabel } from '../../components/commerce/ProductCard';
import { PaymentLogos } from '../../components/commerce/PaymentLogos';
import { formatXOF } from '../../lib/format';
import { TRANSPORT_LABEL } from '../../lib/status';

export default function ProductPage({ slug }: { slug: string }) {
  const { addToCart, navigate } = useApp();
  const { data: product, loading, error, reload } = useAsync(() => getProduct(slug), [slug]);
  const related = useAsync(async () => (product ? listRelatedProducts(product, 4) : []), [product?.id]);
  const groupage = useAsync(async () => {
    if (!product) return null;
    const all = await listPublicGroupages();
    return all.find(g => g.productId === product.id && isJoinable(g)) || null;
  }, [product?.id]);

  const [imageIndex, setImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState<'cart' | 'buy' | null>(null);

  useEffect(() => {
    if (product) {
      setQty(product.moq);
      setImageIndex(0);
      document.title = `${product.name} — DALUCHE`;
    }
  }, [product]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!product || !product.isActive) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={<ShoppingBag className="h-5 w-5" />}
          title="Produit introuvable"
          description="Ce produit n’est plus disponible ou le lien est incorrect."
          action={<Button to="/catalogue">Retour au catalogue</Button>}
        />
      </div>
    );
  }

  const avail = availabilityLabel(product);
  const TransportIcon = product.transportMode === 'sea' ? Ship : Plane;
  const specs = Object.entries(product.specifications);

  async function add(mode: 'cart' | 'buy') {
    setAdding(mode);
    await addToCart(product!, qty);
    setAdding(null);
    if (mode === 'buy') navigate('/panier');
  }

  return (
    <div className="container-page pb-28 pt-6 sm:pt-8 lg:pb-10">
      <nav className="mb-5 flex items-center gap-1.5 overflow-hidden text-[12.5px] font-medium text-muted" aria-label="Fil d’Ariane">
        <Link to="/catalogue" className="shrink-0 hover:text-ink">
          Catalogue
        </Link>
        {product.categorySlug && (
          <>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <Link to={`/catalogue?categorie=${product.categorySlug}`} className="shrink-0 hover:text-ink">
              {product.categoryName}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate text-ink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        {/* Galerie */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-[24px] border border-line bg-white">
            <img src={product.images[imageIndex]} alt={product.name} className="h-full w-full object-contain p-2" />
            {product.compareAtPriceXOF && product.compareAtPriceXOF > product.priceXOF && (
              <span className="absolute left-4 top-4 rounded-lg bg-brand px-2 py-1 text-xs font-bold text-white">Promotion</span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={img + i}
                  type="button"
                  onClick={() => setImageIndex(i)}
                  className={`h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border-2 bg-white ${i === imageIndex ? 'border-ink' : 'border-transparent ring-1 ring-line'}`}
                  aria-label={`Image ${i + 1}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informations d'achat */}
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-subtle">{product.categoryName}</p>
          <h1 className="mt-2 text-[26px] font-semibold leading-tight sm:text-[32px]">{product.name}</h1>
          {product.shortDescription && <p className="mt-3 text-[15px] leading-relaxed text-muted">{product.shortDescription}</p>}

          <div className="mt-6">
            <Price value={product.priceXOF} compareAt={product.compareAtPriceXOF} size="xl" />
            <p className="mt-2 text-[13px] text-muted">Prix unitaire TTC, hors frais de transport calculés à la commande.</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2.5 text-[13px]">
            <InfoTile label="Disponibilité" value={<span className={avail.tone}>{avail.label}</span>} />
            <InfoTile
              label="Transport"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <TransportIcon className="h-4 w-4" /> {TRANSPORT_LABEL[product.transportMode]}
                </span>
              }
            />
            <InfoTile label="Délai estimé" value={product.deliveryDelay || 'Communiqué à la commande'} />
            <InfoTile label="Quantité minimum" value={`${product.moq} unité${product.moq > 1 ? 's' : ''}`} />
          </div>

          {groupage.data && (
            <Link
              to={`/groupages/${groupage.data.id}`}
              className="mt-5 flex items-center gap-3 rounded-2xl border border-ochre/30 bg-ochre-50 p-4 transition-colors hover:border-ochre/60"
            >
              <Users className="h-5 w-5 shrink-0 text-ochre" />
              <div className="flex-1 text-[13.5px]">
                <p className="font-semibold text-ink">Disponible en groupage à {formatXOF(groupage.data.unitPriceXOF)}</p>
                <p className="text-muted">
                  {groupage.data.reservedQuantity}/{groupage.data.targetQuantity} commandes — rejoignez la commande collective.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          )}

          <div className="mt-6 hidden flex-col gap-3 sm:flex-row lg:flex">
            <QuantityInput value={qty} onChange={setQty} min={product.moq} max={product.availableQuantity > 0 ? undefined : undefined} />
            <Button variant="secondary" size="md" className="flex-1" loading={adding === 'cart'} icon={<ShoppingBag className="h-4 w-4" />} onClick={() => add('cart')}>
              Ajouter au panier
            </Button>
            <Button size="md" className="flex-1" loading={adding === 'buy'} icon={<Zap className="h-4 w-4" />} onClick={() => add('buy')}>
              Acheter
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-between gap-3 lg:hidden">
            <span className="text-sm font-semibold">Quantité</span>
            <QuantityInput value={qty} onChange={setQty} min={product.moq} />
          </div>

          <ul className="mt-6 space-y-2.5 rounded-2xl bg-paper-2 p-4 text-[13.5px]">
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-jade" /> Paiement sécurisé : Wave, Orange Money, MTN, carte
            </li>
            <li className="flex items-center gap-2.5">
              <BadgeCheck className="h-4 w-4 text-jade" /> Contrôle qualité avant expédition
            </li>
            <li className="flex items-center gap-2.5">
              <PackageSearch className="h-4 w-4 text-jade" /> Suivi de commande dans votre espace client
            </li>
          </ul>
          <PaymentLogos className="mt-4" />
        </div>
      </div>

      {/* Détails */}
      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Description</h2>
          <div className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted">{product.description || product.shortDescription || 'Description à venir.'}</div>
          {product.features.length > 0 && (
            <>
              <h3 className="mt-7 text-base font-semibold">Points forts</h3>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {product.features.map(f => (
                  <li key={f} className="flex gap-2.5 text-[14px] text-ink">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" /> {f}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        <section className="card p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Caractéristiques</h2>
          <dl className="mt-3 divide-y divide-line text-[14px]">
            {product.sku && <SpecRow label="Référence" value={product.sku} />}
            {product.weightKg > 0 && <SpecRow label="Poids unitaire" value={`${product.weightKg.toLocaleString('fr-FR')} kg`} />}
            {specs.map(([k, v]) => (
              <SpecRow key={k} label={k} value={v} />
            ))}
            {!product.sku && specs.length === 0 && product.weightKg <= 0 && <p className="py-3 text-muted">Fiche technique disponible sur demande.</p>}
          </dl>
        </section>
      </div>

      {related.data && related.data.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-semibold">Dans la même catégorie</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.data.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Barre d'achat mobile */}
      <div className="fixed inset-x-0 bottom-[62px] z-30 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="num truncate font-display text-lg font-semibold leading-tight">{formatXOF(product.priceXOF * qty)}</p>
            <p className="text-[11.5px] text-muted">{qty} × {formatXOF(product.priceXOF)}</p>
          </div>
          <Button variant="secondary" loading={adding === 'cart'} onClick={() => add('cart')} aria-label="Ajouter au panier" icon={<ShoppingBag className="h-4 w-4" />}>
            <span className="sr-only sm:not-sr-only">Panier</span>
          </Button>
          <Button loading={adding === 'buy'} onClick={() => add('buy')}>
            Acheter
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-white px-3.5 py-3">
      <p className="text-[11.5px] font-medium text-muted">{label}</p>
      <p className="mt-0.5 font-semibold text-ink">{value}</p>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}
