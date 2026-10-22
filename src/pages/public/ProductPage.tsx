import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ChevronRight, Heart, MessageCircle, PackageSearch, Plane, ShieldCheck, Ship, ShoppingBag, Truck, Users, Undo2, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePrefs } from '../../context/PrefsContext';
import { useAsync } from '../../lib/hooks';
import { getProduct, listRelatedProducts } from '../../services/catalog';
import { listPublicGroupages, isJoinable } from '../../services/groupages';
import { estimateShipping, type ShippingEstimate } from '../../services/orders';
import { addFavorite, listFavoriteIds, removeFavorite } from '../../services/favorites';
import { pushRecent } from '../../lib/recent';
import { applySeo, productJsonLd } from '../../lib/seo';
import { whatsappLink } from '../../lib/config';
import { Link } from '../../components/ui/Link';
import { Button } from '../../components/ui/Button';
import { Price } from '../../components/ui/Price';
import { PageLoader, EmptyState, ErrorState } from '../../components/ui/States';
import { QuantityInput } from '../../components/commerce/QuantityInput';
import { ProductCard, availabilityLabel } from '../../components/commerce/ProductCard';
import { PaymentLogos } from '../../components/commerce/PaymentLogos';

const dayFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const dayFmtEn = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

/** « 12–18 jours » → fenêtre de dates à partir d'aujourd'hui. */
function deliveryWindow(text: string | undefined, lang: 'fr' | 'en'): { a: string; b: string } | null {
  const m = (text || '').match(/(\d+)\D+(\d+)/);
  if (!m) return null;
  const fmt = lang === 'en' ? dayFmtEn : dayFmt;
  const day = 86400000;
  return { a: fmt.format(new Date(Date.now() + Number(m[1]) * day)), b: fmt.format(new Date(Date.now() + Number(m[2]) * day)) };
}

export default function ProductPage({ slug }: { slug: string }) {
  const { addToCart, navigate, user, requireAuth, toast } = useApp();
  const { t, money, lang } = usePrefs();
  const { data: product, loading, error, reload } = useAsync(() => getProduct(slug), [slug], { cacheKey: `product:${slug}` });
  const related = useAsync(async () => (product ? listRelatedProducts(product, 4) : []), [product?.id]);
  const groupage = useAsync(async () => {
    if (!product) return null;
    const all = await listPublicGroupages();
    return all.find(g => g.productId === product.id && isJoinable(g)) || null;
  }, [product?.id]);
  const favorites = useAsync(() => (user ? listFavoriteIds(user.id) : Promise.resolve([] as string[])), [user?.id]);

  const [imageIndex, setImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState<'cart' | 'buy' | null>(null);
  const [ship, setShip] = useState<{ loading: boolean; data: ShippingEstimate | null }>({ loading: false, data: null });

  useEffect(() => {
    if (product) {
      setQty(product.moq);
      setImageIndex(0);
      applySeo({
        title: `${product.name} — ${product.priceXOF.toLocaleString('fr-FR')} FCFA`,
        description: `${product.shortDescription || product.name}. Livraison à Dakar, paiement Wave, Orange Money ou carte.`,
        path: `/produit/${product.slug}`,
        image: product.images[0],
        type: 'product',
        jsonLd: productJsonLd({
          name: product.name,
          description: product.description || product.shortDescription || product.name,
          images: product.images,
          sku: product.sku,
          priceXOF: product.priceXOF,
          inStock: product.availableQuantity > 0,
          category: product.categoryName,
          url: `${window.location.origin}/produit/${product.slug}`
        })
      });
      pushRecent({ id: product.id, slug: product.slug, name: product.name, image: product.images[0] || null, priceXOF: product.priceXOF });
    }
  }, [product]);

  // Transport estimé pour la quantité choisie (même calcul que le panier)
  const shipMode: 'air' | 'sea' = product?.transportMode === 'sea' ? 'sea' : 'air';
  useEffect(() => {
    if (!product) return;
    let alive = true;
    setShip(s => ({ ...s, loading: true }));
    const id = window.setTimeout(async () => {
      const data = await estimateShipping([{ product_id: product.id, quantity: Math.max(qty, 1) }], shipMode, 'hub_pickup');
      if (alive) setShip({ loading: false, data });
    }, 350);
    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, [product?.id, qty, shipMode]);

  const isFav = Boolean(product && favorites.data?.includes(product.id));
  const window_ = useMemo(() => deliveryWindow(ship.data?.estimated_delivery_days || product?.deliveryDelay, lang), [ship.data, product?.deliveryDelay, lang]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!product || !product.isActive) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={<ShoppingBag className="h-5 w-5" />} title="Produit introuvable" description="Ce produit n’est plus disponible ou le lien est incorrect." action={<Button to="/catalogue">Retour au catalogue</Button>} />
      </div>
    );
  }

  const availRaw = availabilityLabel(product);
  const avail = {
    tone: availRaw.tone,
    label: product.availableQuantity <= 0 ? t('product.availOrder') : product.availableQuantity <= 5 ? t('product.availLow', { n: product.availableQuantity }) : t('product.availOk')
  };
  const modeLabel = (m: 'air' | 'sea' | 'express') => t(`product.mode.${m}` as const);
  const TransportIcon = product.transportMode === 'sea' ? Ship : Plane;
  const specs = Object.entries(product.specifications);
  const keySpecs = [
    ...(product.sku ? ([[t('product.specRef'), product.sku]] as [string, string][]) : []),
    ...(product.weightKg > 0 ? ([[t('product.specWeight'), `${product.weightKg.toLocaleString('fr-FR')} kg`]] as [string, string][]) : []),
    ...specs
  ].slice(0, 6);
  const chatText = `Bonjour Dallou Chine, je suis intéressé par « ${product.name} » (${qty} unité${qty > 1 ? 's' : ''}). ${window.location.origin}/produit/${product.slug}`;

  async function add(mode: 'cart' | 'buy') {
    setAdding(mode);
    await addToCart(product!, qty);
    setAdding(null);
    if (mode === 'buy') navigate('/panier');
  }

  async function toggleFav() {
    if (!user) {
      requireAuth({ reason: t('product.fav') });
      return;
    }
    try {
      if (isFav) await removeFavorite(user.id, product!.id);
      else await addFavorite(user.id, product!.id);
      favorites.reload();
      toast('success', isFav ? t('product.favRemove') : t('product.fav'));
    } catch {
      toast('error', 'Action impossible', 'Réessayez dans un instant.');
    }
  }

  return (
    <div className="container-page pb-28 pt-6 sm:pt-8 lg:pb-10">
      <nav className="mb-5 flex items-center gap-1.5 overflow-hidden text-[12.5px] font-medium text-muted" aria-label="Fil d’Ariane">
        <Link to="/catalogue" className="shrink-0 hover:text-ink">
          {t('nav.catalog')}
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_340px] xl:gap-10">
        {/* Galerie : vignettes à gauche sur grand écran */}
        <div className="flex flex-col gap-3 md:flex-row-reverse">
          <div className="relative aspect-square min-w-0 flex-1 overflow-hidden rounded-[24px] border border-line bg-paper-2">
            <img src={product.images[imageIndex]} alt={product.name} className="h-full w-full object-cover" />
            {product.compareAtPriceXOF && product.compareAtPriceXOF > product.priceXOF && (
              <span className="absolute left-4 top-4 rounded-lg bg-brand px-2 py-1 text-xs font-bold text-white">Promotion</span>
            )}
            <button
              type="button"
              onClick={toggleFav}
              aria-pressed={isFav}
              aria-label={isFav ? t('product.favRemove') : t('product.fav')}
              title={isFav ? t('product.favRemove') : t('product.fav')}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-[0_8px_20px_-8px_rgb(11_22_32/0.4)] transition-transform hover:scale-105"
            >
              <Heart className={`h-5 w-5 ${isFav ? 'fill-brand text-brand' : 'text-ink'}`} />
            </button>
          </div>
          {product.images.length > 1 && (
            <div className="scrollbar-none flex gap-2 overflow-x-auto md:max-h-[560px] md:flex-col md:overflow-y-auto md:overflow-x-hidden">
              {product.images.map((img, i) => (
                <button
                  key={img + i}
                  type="button"
                  onClick={() => setImageIndex(i)}
                  onMouseEnter={() => setImageIndex(i)}
                  className={`h-[64px] w-[64px] shrink-0 overflow-hidden rounded-xl border-2 bg-white ${i === imageIndex ? 'border-ink' : 'border-transparent ring-1 ring-line'}`}
                  aria-label={`Image ${i + 1}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informations produit */}
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-subtle">{product.categoryName}</p>
          <h1 className="mt-2 text-[24px] font-bold leading-tight sm:text-[30px]">{product.name}</h1>
          {product.shortDescription && <p className="mt-3 text-[15px] leading-relaxed text-muted">{product.shortDescription}</p>}

          <div className="mt-5 rounded-2xl bg-paper-2 p-4">
            <Price value={product.priceXOF} compareAt={product.compareAtPriceXOF} size="xl" />
            <p className="mt-2 text-[12.5px] text-muted">{t('product.priceNote')}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5 text-[13px]">
            <InfoTile label={t('product.availability')} value={<span className={avail.tone}>{avail.label}</span>} />
            <InfoTile
              label={t('product.transport')}
              value={
                <span className="inline-flex items-center gap-1.5">
                  <TransportIcon className="h-4 w-4" /> {modeLabel(product.transportMode)}
                </span>
              }
            />
            <InfoTile label={t('product.delay')} value={(product.deliveryDelay || '—').replace(/jours?/i, t('product.days'))} />
            <InfoTile label={t('product.moq')} value={`${product.moq} ${t('product.units')}`} />
          </div>

          {keySpecs.length > 0 && (
            <div className="mt-6">
              <h2 className="text-[15px] font-bold">{t('product.specs')}</h2>
              <dl className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {keySpecs.map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-line bg-white p-3.5">
                    <dt className="text-[11.5px] font-medium text-muted">{k}</dt>
                    <dd className="mt-0.5 break-words text-[13.5px] font-semibold text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {groupage.data && (
            <Link to={`/groupages/${groupage.data.id}`} className="mt-5 flex items-center gap-3 rounded-2xl border border-ochre/30 bg-ochre-50 p-4 transition-colors hover:border-ochre/60">
              <Users className="h-5 w-5 shrink-0 text-ochre" />
              <div className="flex-1 text-[13.5px]">
                <p className="font-semibold text-ink">{t('product.groupageBanner', { price: money(groupage.data.unitPriceXOF) })}</p>
                <p className="text-muted">
                  {groupage.data.reservedQuantity}/{groupage.data.targetQuantity}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          )}

          <div className="mt-5 flex gap-3 rounded-2xl border border-line bg-white p-4">
            <span className="icon-bubble h-10 w-10 shrink-0">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <div className="text-[13.5px]">
              <p className="font-semibold">{t('product.verifiedTitle')}</p>
              <p className="mt-0.5 text-muted">{t('product.verifiedText')}</p>
            </div>
          </div>
        </div>

        {/* Colonne d'achat : quantité, transport estimé, protection */}
        <aside className="lg:col-span-2 xl:col-span-1" aria-label={t('product.buy')}>
          <div className="space-y-4 rounded-[24px] border border-line bg-white p-5 shadow-[var(--shadow-soft)] xl:sticky xl:top-28">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">{t('product.quantity')}</span>
              <QuantityInput value={qty} onChange={setQty} min={product.moq} />
            </div>
            <div>
              <Price value={product.priceXOF * qty} size="lg" />
              <p className="num text-[12px] text-muted">
                {qty} × {money(product.priceXOF)}
              </p>
            </div>

            <div className="rounded-2xl bg-paper p-3.5 text-[13px]">
              <p className="flex items-center gap-2 font-bold">
                <Truck className="h-4 w-4 text-brand-600" /> {t('product.shipTitle')}
              </p>
              {ship.loading && !ship.data ? (
                <p className="mt-1.5 text-muted">{t('product.shipCalculating')}</p>
              ) : ship.data ? (
                <>
                  <p className="mt-1.5 text-muted">{t('product.shipEstimate', { n: qty })}</p>
                  <p className="num mt-0.5 font-display text-[18px] font-bold">{money(ship.data.customer_shipping_fee)}</p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {t('product.shipMode')} : {modeLabel(shipMode)}
                  </p>
                </>
              ) : (
                <p className="mt-1.5 text-muted">{t('product.shipUnavailable')}</p>
              )}
              {window_ && <p className="mt-2 font-semibold text-jade">{t('product.shipDelivery', window_)}</p>}
            </div>

            <div className="flex flex-col gap-2.5">
              <Button size="lg" block loading={adding === 'buy'} icon={<Zap className="h-4 w-4" />} onClick={() => add('buy')}>
                {t('product.buy')}
              </Button>
              <div className="grid grid-cols-2 gap-2.5">
                <Button variant="secondary" loading={adding === 'cart'} icon={<ShoppingBag className="h-4 w-4" />} onClick={() => add('cart')}>
                  {t('product.addCart')}
                </Button>
                <Button variant="whatsapp" to={whatsappLink(chatText)} icon={<MessageCircle className="h-4 w-4" />}>
                  {t('product.chat')}
                </Button>
              </div>
            </div>

            <div className="border-t border-line pt-4">
              <p className="mb-3 text-[13px] font-bold">{t('product.protectTitle')}</p>
              <ul className="space-y-3 text-[13px]">
                <Protect icon={<ShieldCheck className="h-[18px] w-[18px]" />} title={t('product.protectPay')} text={t('product.protectPayText')} />
                <Protect icon={<PackageSearch className="h-[18px] w-[18px]" />} title={t('product.protectQc')} text={t('product.protectQcText')} />
                <Protect icon={<Undo2 className="h-[18px] w-[18px]" />} title={t('product.protectRefund')} text={t('product.protectRefundText')} />
              </ul>
              <PaymentLogos className="mt-4" />
            </div>
          </div>
        </aside>
      </div>

      {/* Détails */}
      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5 sm:p-7">
          <h2 className="text-lg font-semibold">{t('product.description')}</h2>
          <div className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted">{product.description || product.shortDescription || '—'}</div>
          {product.features.length > 0 && (
            <>
              <h3 className="mt-7 text-base font-semibold">{t('product.highlights')}</h3>
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
          <h2 className="text-lg font-semibold">{t('product.specs')}</h2>
          <dl className="mt-3 divide-y divide-line text-[14px]">
            {product.sku && <SpecRow label={t('product.specRef')} value={product.sku} />}
            {product.weightKg > 0 && <SpecRow label={t('product.specWeight')} value={`${product.weightKg.toLocaleString('fr-FR')} kg`} />}
            {specs.map(([k, v]) => (
              <SpecRow key={k} label={k} value={v} />
            ))}
            {!product.sku && specs.length === 0 && product.weightKg <= 0 && <p className="py-3 text-muted">—</p>}
          </dl>
        </section>
      </div>

      <section className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[24px] bg-ink p-6 text-white sm:p-8">
        <div className="min-w-[240px] flex-1">
          <p className="text-[18px] font-semibold">{t('product.customTitle')}</p>
          <p className="mt-1 text-[14px] text-white/70">{t('product.helpText')}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button to="/pro">{t('product.customCta')}</Button>
          <Button variant="light" to={whatsappLink(chatText)}>
            {t('product.helpCta')}
          </Button>
        </div>
      </section>

      {related.data && related.data.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-semibold">{t('product.related')}</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.data.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Barre d'achat mobile */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 px-2 pb-2 lg:hidden">
        <div className="glass flex items-center gap-2.5 rounded-[22px] p-2.5 pl-4 shadow-[0_-4px_30px_-12px_rgb(120_60_20/0.4)]">
          <div className="min-w-0 flex-1">
            <p className="num truncate font-display text-lg font-semibold leading-tight">{money(product.priceXOF * qty)}</p>
            <p className="text-[11.5px] text-muted">
              {qty} × {money(product.priceXOF)}
            </p>
          </div>
          <Button variant="secondary" loading={adding === 'cart'} onClick={() => add('cart')} aria-label={t('product.addCart')} icon={<ShoppingBag className="h-4 w-4" />}>
            <span className="sr-only sm:not-sr-only">{t('product.cartShort')}</span>
          </Button>
          <Button loading={adding === 'buy'} onClick={() => add('buy')}>
            {t('product.buy')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Protect({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 text-jade">{icon}</span>
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block text-[12.5px] leading-snug text-muted">{text}</span>
      </span>
    </li>
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
