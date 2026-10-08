import React from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Building2,
  Camera,
  Car,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Factory,
  FileText,
  Handshake,
  Home as HomeIcon,
  Link2,
  MessageCircle,
  Package,
  PackageSearch,
  Palette,
  PartyPopper,
  Search,
  Shirt,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Ship,
  Smartphone,
  Sparkles,
  Store,
  Truck,
  Users,
  UtensilsCrossed,
  Wrench,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { listFeaturedProducts, listProducts } from '../../services/catalog';
import { listPublicGroupages, isJoinable } from '../../services/groupages';
import { listVehicles } from '../../services/vehicles';
import { Button } from '../../components/ui/Button';
import { Link } from '../../components/ui/Link';
import { ProductCard, ProductCardSkeleton } from '../../components/commerce/ProductCard';
import { GroupageCard } from '../../components/commerce/GroupageCard';
import { VehicleCard } from '../../components/commerce/VehicleCard';
import { PaymentLogos } from '../../components/commerce/PaymentLogos';
import { ProgressBar } from '../../components/ui/Progress';
import { formatNumber, formatXOF, percent } from '../../lib/format';
import { whatsappLink, PHOTOS, photoSrcSet } from '../../lib/config';
import { FlagCN, FlagSN } from '../../components/ui/Flags';
import { Reveal } from '../../components/ui/Reveal';
import type { Groupage } from '../../lib/types';

export function HomePage() {
  const products = useAsync(() => listFeaturedProducts(8), [], { cacheKey: 'home:products', maxAge: 60000 });
  const groupages = useAsync(() => listPublicGroupages(), [], { cacheKey: 'groupages:public' });
  const vehicles = useAsync(() => listVehicles({ limit: 3, featuredFirst: true }), [], { cacheKey: 'home:vehicles', maxAge: 60000 });
  const autoProducts = useAsync(() => listProducts({ autoMobilityOnly: true, pageSize: 3 }).then(r => r.items), [], { cacheKey: 'home:auto', maxAge: 60000 });

  const openGroupages = (groupages.data || []).filter(isJoinable);
  const showcase = [...openGroupages, ...(groupages.data || []).filter(g => !isJoinable(g))].slice(0, 3);
  const heroGroupage = [...openGroupages].sort((a, b) => percent(b.reservedQuantity, b.targetQuantity) - percent(a.reservedQuantity, a.targetQuantity))[0];

  return (
    <>
      <Hero groupage={heroGroupage} openCount={openGroupages.length} />
      <ServiceStrip />
      <Reveal>
        <Journey />
      </Reveal>

      {/* Groupages en cours */}
      <Reveal>
        <section className="container-page mt-16 sm:mt-24" aria-labelledby="home-groupages">
          <div className="surface grid grid-cols-1 gap-6 p-5 sm:p-7 lg:grid-cols-[300px_1fr] lg:gap-8 lg:p-8">
            <div className="flex flex-col">
              <p className="eyebrow flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-brand-gradient" /> Groupages
              </p>
              <h2 id="home-groupages" className="mt-3 text-[26px] font-bold leading-[1.1] sm:text-[32px]">
                Commandez ensemble.
                <span className="block text-brand-gradient">Atteignez les MOQ.</span>
                Optimisez vos coûts.
              </h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
                Rejoignez d’autres acheteurs pour atteindre les quantités minimales des usines et payer le prix de gros, transport mutualisé compris.
              </p>
              <Button to="/groupages" className="mt-6 self-start" iconRight={<ArrowRight className="h-4 w-4" />}>
                Voir tous les groupages
              </Button>
              <div className="mt-auto hidden pt-8 lg:block">
                <div className="rounded-2xl bg-paper p-4 text-[12.5px] leading-relaxed text-muted">
                  <p className="font-semibold text-ink">Vous ne payez que votre part.</p>
                  Réservation à régler sous 48 h, remboursement si le groupage est annulé.
                </div>
              </div>
            </div>
            {groupages.loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="skeleton h-[420px] rounded-[var(--radius-card)]" />
                ))}
              </div>
            ) : showcase.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {showcase.map(g => (
                  <GroupageCard key={g.id} groupage={g} />
                ))}
                {showcase.length < 3 && <ProposeGroupageCard />}
              </div>
            ) : (
              <EmptyBand
                icon={<Users className="h-5 w-5" />}
                title="Aucun groupage ouvert pour le moment"
                text="Les prochaines campagnes sont en préparation. Créez votre compte pour être informé de leur ouverture."
                action={<Button to="/inscription" variant="secondary">Créer mon compte</Button>}
              />
            )}
          </div>
        </section>
      </Reveal>

      <MarketplaceBand />

      {/* Produits */}
      <section className="container-page mt-14 sm:mt-16" aria-labelledby="home-products">
        <SectionHead
          eyebrow="Marketplace"
          id="home-products"
          title="Sélection du moment"
          text="Des références vérifiées, prix affichés en FCFA, livrées à Dakar. Ajoutez au panier en un geste."
          link={{ to: '/catalogue', label: 'Tout le catalogue' }}
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {products.loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : (products.data || []).slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <Reveal>
        <AiBand />
      </Reveal>

      <AutomobileSection vehicles={vehicles.data?.items || []} products={autoProducts.data || []} loading={vehicles.loading || autoProducts.loading} />

      <Reveal>
        <LogisticsBand />
      </Reveal>

      <Reveal>
        <TrustAndTracking />
      </Reveal>

      <Reveal>
        <FinalCta />
      </Reveal>
    </>
  );
}

// ---------------------------------------------------------------------------

function Hero({ groupage, openCount }: { groupage?: Groupage; openCount: number }) {
  return (
    <section className="relative -mt-[76px] overflow-hidden pt-[76px] sm:-mt-[80px] sm:pt-[80px]">
      {/* halos chauds */}
      <div className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-brand-400/25 blur-[90px]" aria-hidden />
      <div className="pointer-events-none absolute -right-32 -top-20 h-[520px] w-[520px] rounded-full bg-brand/20 blur-[110px]" aria-hidden />
      <div className="route-line pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" aria-hidden />

      <div className="container-page relative grid grid-cols-1 items-center gap-10 pb-6 pt-8 sm:pb-12 sm:pt-12 lg:grid-cols-[1.02fr_1fr] lg:gap-12 lg:pb-14 lg:pt-14">
        <div className="animate-fade-in-up">
          <p className="inline-flex items-center gap-2.5 rounded-full border border-brand/20 bg-white/80 py-1.5 pl-2 pr-3.5 text-[13px] font-semibold text-ink shadow-sm backdrop-blur">
            <FlagCN className="h-4 w-6" /> Chine <ArrowRight className="h-3.5 w-3.5 text-brand" /> Sénégal <FlagSN className="h-4 w-6" />
          </p>
          <h1 className="mt-5 text-[40px] font-bold leading-[1.02] tracking-[-0.03em] sm:text-[54px] lg:text-[64px]">
            Votre passerelle entre <span className="text-brand-gradient">la Chine et l’Afrique</span>
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted sm:text-[18px]">
            Nous vous aidons à trouver, acheter et faire acheminer vos produits de Chine vers le Sénégal, simplement et en toute transparence.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button to="/catalogue" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
              Explorer les produits
            </Button>
            <Button to="/pro" size="lg" variant="secondary" icon={<FileText className="h-4 w-4" />}>
              Demander un devis
            </Button>
            <Button
              size="lg"
              variant="whatsapp"
              icon={<MessageCircle className="h-4 w-4" />}
              onClick={() => window.open(whatsappLink('Bonjour DALUCHE, je souhaite importer un produit de Chine.'), '_blank', 'noopener')}
            >
              Parler sur WhatsApp
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[13px] font-semibold text-ink/70">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-jade" /> Paiement sécurisé
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-jade" /> Contrôle avant expédition
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PackageSearch className="h-4 w-4 text-jade" /> Suivi en temps réel
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-[32px] shadow-[0_30px_80px_-30px_rgb(200_80_20/0.55)] [clip-path:inset(0_round_32px)] lg:rounded-[40px]">
            <img
              src={PHOTOS.port}
              srcSet={photoSrcSet(PHOTOS.port)}
              sizes="(min-width: 1024px) 600px, 100vw"
              alt="Port à conteneurs : départ des marchandises de Chine"
              fetchPriority="high"
              decoding="async"
              className="aspect-[5/4] w-full object-cover sm:aspect-[16/11]"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-brand/35 via-transparent to-transparent mix-blend-multiply" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink/60 to-transparent" aria-hidden />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">Départs réguliers</p>
                <p className="text-[15px] font-semibold">Guangzhou · Yiwu → Dakar</p>
              </div>
              <span className="glass rounded-full px-3 py-1 text-[11.5px] font-bold text-ink">Maritime & aérien</span>
            </div>
          </div>

          {/* Cartes flottantes */}
          <div className="glass absolute -left-3 top-6 hidden items-center gap-3 rounded-2xl px-3.5 py-3 shadow-[var(--shadow-warm)] sm:flex lg:-left-10">
            <span className="icon-bubble h-10 w-10">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-[13px] font-bold">Paiement protégé</p>
              <p className="text-[11.5px] text-muted">Wave · Orange Money · Carte</p>
            </div>
          </div>

          <div className="relative -mt-14 px-3 sm:absolute sm:-bottom-10 sm:right-4 sm:mt-0 sm:w-[340px] sm:px-0 lg:-right-4">
            {groupage ? (
              <Link to={`/groupages/${groupage.id}`} className="glass lift block rounded-3xl p-4 shadow-[var(--shadow-warm)]">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/60 motion-reduce:hidden" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Groupage en cours · {openCount} ouvert{openCount > 1 ? 's' : ''}</p>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  {groupage.image && <img src={groupage.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold">{groupage.product?.name || groupage.title}</p>
                    <p className="num text-[12.5px] text-muted">
                      <span className="font-bold text-brand-600">{formatXOF(groupage.unitPriceXOF)}</span> / unité
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar value={groupage.reservedQuantity} max={groupage.targetQuantity} size="sm" />
                  </div>
                  <span className="num text-[12px] font-bold">
                    {formatNumber(groupage.reservedQuantity)}/{formatNumber(groupage.targetQuantity)}
                  </span>
                </div>
              </Link>
            ) : (
              <RouteMini />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProposeGroupageCard() {
  return (
    <Link
      to="/sourcing"
      className="lift group relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[var(--radius-card)] border border-dashed border-brand/30 bg-brand-soft p-6"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-400/30 blur-2xl" aria-hidden />
      <div className="relative">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-white shadow-[var(--shadow-glow)]">
          <Users className="h-5 w-5" />
        </span>
        <h3 className="mt-5 text-[19px] font-bold leading-snug">Un produit en tête pour un groupage ?</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          Proposez-le : si d’autres acheteurs sont intéressés, nous ouvrons une campagne et négocions le prix de gros avec l’usine.
        </p>
      </div>
      <span className="relative mt-6 inline-flex items-center gap-1.5 text-[14px] font-bold text-brand-600">
        Proposer un produit <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function RouteMini() {
  const steps = [
    { icon: Factory, label: 'Usine' },
    { icon: ClipboardCheck, label: 'Contrôle' },
    { icon: Ship, label: 'Transport' },
    { icon: Truck, label: 'Livraison' }
  ];
  return (
    <div className="glass rounded-3xl p-4 shadow-[var(--shadow-warm)]">
      <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Le trajet de votre commande</p>
      <ol className="mt-3 grid grid-cols-4 gap-1">
        {steps.map((st, i) => (
          <li key={st.label} className="flex flex-col items-center gap-1 text-center text-[11px] font-semibold">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${i === 0 ? 'bg-brand-gradient text-white' : 'icon-bubble'}`}>
              <st.icon className="h-4 w-4" />
            </span>
            {st.label}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ServiceStrip() {
  const items = [
    { to: '/catalogue', icon: ShoppingCart, title: 'Marketplace', text: 'Trouvez les produits dont vous avez besoin.' },
    { to: '/groupages', icon: Users, title: 'Groupages', text: 'Regroupez vos commandes et optimisez vos coûts.' },
    { to: '/sourcing', icon: Search, title: 'Sourcing personnalisé', text: 'Une photo ou un lien : nous trouvons le fournisseur.' },
    { to: '/pro', icon: Building2, title: 'B2B', text: 'Approvisionnement et devis dédiés aux entreprises.' }
  ];
  return (
    <section className="container-page relative z-10 mt-8 sm:mt-14" aria-label="Nos services">
      <div className="surface grid grid-cols-1 divide-y divide-line overflow-hidden sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {items.map(it => (
          <Link key={it.to} to={it.to} className="group flex items-start gap-4 p-5 transition-colors hover:bg-brand-50/50 sm:p-6">
            <span className="icon-bubble h-12 w-12 transition-transform group-hover:scale-105">
              <it.icon className="h-[22px] w-[22px]" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1 text-[16px] font-bold text-ink">
                {it.title} <ChevronRight className="h-4 w-4 text-brand opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-muted">{it.text}</span>
            </span>
          </Link>
        ))}
      </div>
      <Link to="/automobile" className="group mt-3 flex items-center justify-between gap-4 rounded-2xl bg-ink px-5 py-4 text-white sm:px-6">
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient">
            <Car className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-[15px] font-semibold">Automobile & motos</span>
            <span className="block text-[12.5px] text-white/60">Voitures, motos, utilitaires et camions importés sur devis</span>
          </span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
      </Link>
    </section>
  );
}

function Journey() {
  const steps = [
    { icon: Search, title: 'Vous trouvez', sub: 'un produit' },
    { icon: Handshake, title: 'Nous recherchons', sub: 'et négocions' },
    { icon: FileText, title: 'Vous validez', sub: 'votre commande' },
    { icon: Package, title: 'Nous achetons', sub: 'et préparons' },
    { icon: Ship, title: 'Transport', sub: 'et suivi' },
    { icon: Truck, title: 'Vous recevez', sub: 'au Sénégal' }
  ];
  return (
    <section id="fonctionnement" className="container-page scroll-mt-28 mt-16 sm:mt-24" aria-labelledby="home-how">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[280px_1fr]">
        <div className="relative pl-5">
          <span className="absolute left-0 top-1 h-[calc(100%-8px)] w-1 rounded-full bg-brand-gradient" aria-hidden />
          <h2 id="home-how" className="text-[26px] font-bold leading-tight sm:text-[30px]">
            Comment ça marche ?
          </h2>
          <p className="mt-2 text-[14.5px] text-muted">Un processus simple, de la Chine jusqu’à vous.</p>
        </div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <FlagCN className="hidden h-6 w-9 shrink-0 sm:block" />
            <ol className="scrollbar-none -mx-4 flex flex-1 snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
              {steps.map((st, i) => (
                <li key={st.title} className="relative flex w-[140px] shrink-0 snap-start flex-col items-center text-center sm:w-auto">
                  {i > 0 && <span className="absolute -left-2 top-8 hidden text-brand/60 lg:block" aria-hidden><ChevronRight className="h-4 w-4" /></span>}
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[var(--shadow-warm)] ring-1 ring-line">
                    <span className="icon-bubble h-12 w-12">
                      <st.icon className="h-[22px] w-[22px]" />
                    </span>
                    <span className="num absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-gradient text-[11px] font-bold text-white ring-2 ring-white">{i + 1}</span>
                  </span>
                  <span className="mt-3 text-[13.5px] font-bold leading-tight">{st.title}</span>
                  <span className="text-[12.5px] text-muted">{st.sub}</span>
                </li>
              ))}
            </ol>
            <FlagSN className="hidden h-6 w-9 shrink-0 sm:block" />
          </div>
        </div>
      </div>
    </section>
  );
}

const CATEGORY_ICONS: [RegExp, React.ElementType][] = [
  [/mode|textile|vêtement|habit/i, Shirt],
  [/maison|meuble|déco/i, HomeIcon],
  [/électro|high-tech|téléphone|informatique/i, Smartphone],
  [/beauté|cosm|santé/i, Sparkles],
  [/restaur|cuisine|aliment/i, UtensilsCrossed],
  [/commerce|boutique|emballage/i, Store],
  [/équipement|machine|outil|industri|pro/i, Wrench],
  [/événement|fête|déco/i, PartyPopper],
  [/personnalis|logo|impression/i, Palette],
  [/énergie|solaire|batter/i, Zap],
  [/auto|moto|véhicule|voiture|scooter/i, Car]
];
function categoryIcon(name: string) {
  return CATEGORY_ICONS.find(([re]) => re.test(name))?.[1] || Boxes;
}

function MarketplaceBand() {
  const { categories, navigate } = useApp();
  const [q, setQ] = React.useState('');
  const top = categories.filter(c => c.isActive !== false && !c.parentId).slice(0, 9);
  return (
    <section className="container-page mt-14 sm:mt-20" aria-label="Rechercher dans la marketplace">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,330px)_minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-ink p-6 text-white">
          <img src={PHOTOS.containers} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/80 to-brand/40" aria-hidden />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-400">Marketplace</p>
            <p className="mt-2 font-display text-[22px] font-bold leading-tight">Des milliers de produits venus de Chine</p>
            <p className="mt-2 text-[13px] text-white/65">Prix en FCFA, livraison au hub de Dakar ou à domicile.</p>
          </div>
        </div>
        <div className="surface flex flex-col justify-center gap-4 p-4 sm:p-5">
          <form
            onSubmit={e => {
              e.preventDefault();
              navigate(q.trim() ? `/catalogue?q=${encodeURIComponent(q.trim())}` : '/catalogue');
            }}
            className="flex gap-2"
            role="search"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Que recherchez-vous ?"
                aria-label="Rechercher un produit"
                className="h-12 w-full rounded-full border border-line bg-paper pl-11 pr-4 focus:border-brand/50 focus:bg-white focus:outline-none"
                enterKeyHint="search"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-5 sm:px-7">
              Rechercher
            </Button>
          </form>
          {top.length > 0 && (
            <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {top.map(c => {
                const Icon = categoryIcon(c.name);
                return (
                  <Link
                    key={c.id}
                    to={`/catalogue?categorie=${c.slug}`}
                    className="group flex w-[88px] shrink-0 flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-center text-[11.5px] font-semibold text-ink/80 hover:bg-brand-50"
                  >
                    <span className="icon-bubble h-11 w-11 transition-transform group-hover:-translate-y-0.5">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="line-clamp-2 leading-tight">{c.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AutomobileSection({
  vehicles,
  products,
  loading
}: {
  vehicles: import('../../lib/types').Vehicle[];
  products: import('../../lib/types').Product[];
  loading: boolean;
}) {
  const types = ['Voitures', 'SUV & 4x4', 'Pick-up', 'Motos & scooters', 'Utilitaires', 'Camions'];
  return (
    <section className="container-page mt-16 sm:mt-24" aria-labelledby="home-auto">
      <div className="relative overflow-hidden rounded-[32px] bg-ink px-5 py-10 text-white sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-brand/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-brand-400/15 blur-3xl" aria-hidden />
        <div className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-400">Automobile & motos</p>
            <h2 id="home-auto" className="mt-3 text-[28px] font-semibold leading-tight text-white sm:text-4xl">
              Importez votre véhicule en toute confiance.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/65">
              Neufs ou d’occasion, particuliers ou professionnels : nous vérifions le véhicule, organisons le transport et vous accompagnons jusqu’à la remise des clés. Prix ferme sur devis.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button to="/automobile" variant="primary" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
              Voir les véhicules
            </Button>
            <Button to="/automobile#recherche" size="lg" variant="light">
              Recherche personnalisée
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {types.map(t => (
            <span key={t} className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12.5px] font-semibold text-white/80">
              {t}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-[340px] animate-pulse rounded-[var(--radius-card)] bg-white/5" />
            ))}
          </div>
        ) : vehicles.length ? (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map(v => (
              <VehicleCard key={v.id} vehicle={v} dark />
            ))}
          </div>
        ) : products.length ? (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-white/15 p-8 text-center">
            <p className="font-display text-lg font-semibold text-white">Dites-nous quel véhicule vous cherchez</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/60">Marque, modèle, budget : nos conseillers sourcent le véhicule en Chine et vous envoient une offre détaillée.</p>
            <Button to="/automobile#recherche" className="mt-5" iconRight={<ArrowRight className="h-4 w-4" />}>
              Lancer ma recherche
            </Button>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}

function LogisticsBand() {
  const items = [
    { img: PHOTOS.ship, title: 'Fret maritime', text: 'Groupage ou conteneur complet, environ 30 à 45 jours : le meilleur coût pour le volume.' },
    { img: PHOTOS.plane, title: 'Fret aérien', text: 'Environ 12 à 18 jours, idéal pour les colis légers ou urgents.' },
    { img: PHOTOS.warehouse, title: 'Entrepôt & contrôle', text: 'Réception, vérification et consolidation de vos achats avant le départ.' }
  ];
  return (
    <section className="container-page mt-20 sm:mt-24" aria-labelledby="home-logistics">
      <SectionHead
        eyebrow="Logistique"
        id="home-logistics"
        title="Votre marchandise, suivie de l’usine à Dakar"
        text="Nous choisissons avec vous le mode de transport adapté à votre budget et à vos délais."
        link={{ to: '/suivi', label: 'Suivre une commande' }}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {items.map(it => (
          <article key={it.title} className="lift group relative overflow-hidden rounded-[var(--radius-card)] bg-ink">
            <img src={it.img} alt="" loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.04]" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h3 className="text-lg font-semibold text-white">{it.title}</h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-white/75">{it.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrustAndTracking() {
  const { navigate } = useApp();
  const [code, setCode] = React.useState('');
  const perks = [
    { icon: Factory, title: 'Prix usine', text: 'Achat direct fournisseur, sans intermédiaires superflus.' },
    { icon: ShieldCheck, title: 'Paiement protégé', text: 'Passerelle GeniusPay, confirmation instantanée.' },
    { icon: BadgeCheck, title: 'Qualité vérifiée', text: 'Contrôle avant expédition, photos sur demande.' },
    { icon: PackageSearch, title: 'Suivi transparent', text: 'Statuts, historique et échanges au même endroit.' }
  ];
  return (
    <section className="container-page mt-20 grid grid-cols-1 gap-4 sm:mt-24 lg:grid-cols-[1.4fr_1fr]">
      <div className="surface grid grid-cols-1 gap-px overflow-hidden bg-line sm:grid-cols-2">
        {perks.map(p => (
          <div key={p.title} className="bg-white p-5 sm:p-6">
            <span className="icon-bubble h-10 w-10">
              <p.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-[15px] font-semibold">{p.title}</h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{p.text}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col justify-between rounded-[var(--radius-card)] bg-brand-soft p-6 sm:p-7">
        <div>
          <p className="eyebrow">Suivi</p>
          <h2 className="mt-2 text-2xl font-semibold">Où en est ma commande ?</h2>
          <p className="mt-2 text-sm text-muted">Saisissez votre numéro de suivi (ex. AWP-…) pour voir son avancement.</p>
        </div>
        <form
          className="mt-6 flex gap-2"
          onSubmit={e => {
            e.preventDefault();
            navigate(`/suivi${code.trim() ? `?code=${encodeURIComponent(code.trim())}` : ''}`);
          }}
        >
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="AWP-XXXXXXXX"
            className="num h-[52px] min-w-0 flex-1 rounded-full border border-line-2 bg-white px-5 font-semibold tracking-wide focus:border-brand/50 focus:outline-none"
            aria-label="Numéro de suivi"
          />
          <Button type="submit" variant="dark" size="lg">
            Suivre
          </Button>
        </form>
        <PaymentLogos className="mt-6" />
      </div>
    </section>
  );
}

function FinalCta() {
  const { user } = useApp();
  return (
    <section className="container-page mt-20 sm:mt-24">
      <div className="relative flex flex-col items-start gap-6 overflow-hidden rounded-[32px] bg-brand-gradient p-7 text-white shadow-[0_30px_70px_-30px_rgb(232_72_13/0.7)] sm:p-12 lg:flex-row lg:items-center lg:justify-between">
        <img src="/brand/mark-256.png" alt="" className="pointer-events-none absolute -right-6 -top-8 h-56 w-56 opacity-15 mix-blend-overlay" aria-hidden />
        <div>
          <h2 className="text-[26px] font-semibold leading-tight text-white sm:text-3xl">Prêt à importer depuis la Chine ?</h2>
          <p className="mt-2 max-w-xl text-[15px] text-white/80">Créez votre compte gratuitement et suivez vos commandes, groupages et devis en un seul endroit.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button to={user ? '/compte' : '/inscription'} variant="dark" size="lg">
            {user ? 'Mon espace client' : 'Créer mon compte'}
          </Button>
          <a
            href={whatsappLink('Bonjour DALUCHE, je souhaite importer un produit.')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full border border-white/40 bg-white/15 px-7 text-[15px] font-semibold text-white backdrop-blur hover:bg-white/25"
          >
            <MessageCircle className="h-4 w-4" />
            Parler à un conseiller
          </a>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

export function SectionHead({
  eyebrow,
  title,
  text,
  link,
  id
}: {
  eyebrow: string;
  title: string;
  text?: string;
  link?: { to: string; label: string };
  id?: string;
}) {
  return (
    <div className="mb-7 flex flex-col gap-3 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow flex items-center gap-2">
          <span className="h-1.5 w-6 rounded-full bg-brand-gradient" /> {eyebrow}
        </p>
        <h2 id={id} className="mt-2 text-[26px] font-bold leading-tight sm:text-[36px]">
          {title}
        </h2>
        {text && <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{text}</p>}
      </div>
      {link && (
        <Link to={link.to} className="inline-flex h-10 shrink-0 items-center gap-1.5 self-start rounded-full border border-line-2 bg-white px-4 text-sm font-semibold text-ink hover:border-brand/40 hover:text-brand-600 sm:self-auto">
          {link.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function EmptyBand({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-[var(--radius-card)] border border-dashed border-line-2 bg-white p-6 sm:flex-row sm:items-center">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-paper-2 text-muted">{icon}</span>
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{text}</p>
      </div>
      {action}
    </div>
  );
}

function AiBand() {
  return (
    <section className="container-page mt-12 sm:mt-16" aria-labelledby="home-ai">
      <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-brand-50/60 p-6 shadow-[var(--shadow-soft)] sm:p-9">
        <div className="pointer-events-none absolute -right-10 -top-14 h-56 w-56 rounded-full bg-brand-400/25 blur-3xl" aria-hidden />
        <div className="relative grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="eyebrow flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Nouveau · Reconnaissance par IA
            </p>
            <h2 id="home-ai" className="mt-2 text-[26px] font-semibold leading-tight sm:text-[34px]">
              Une photo ou un lien Alibaba, et on identifie le produit.
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
              L’IA reconnaît l’article, lit ses caractéristiques, le prix et la commande minimale affichés sur la page, puis prépare la recherche de fournisseurs. Vous validez, notre équipe vérifie et vous envoie un devis.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button to="/sourcing#analyse" size="lg" icon={<Camera className="h-4 w-4" />}>
                Analyser une photo
              </Button>
              <Button to="/sourcing#analyse" size="lg" variant="secondary" icon={<Link2 className="h-4 w-4" />}>
                Coller un lien
              </Button>
            </div>
          </div>
          <ol className="space-y-3 text-[14px]">
            {['Envoyez une photo ou un lien', 'L’IA extrait produit, specs, MOQ, mots-clés', 'Notre équipe valide et négocie le fournisseur'].map((t, i) => (
              <li key={t} className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-[12px] font-bold text-white">{i + 1}</span>
                <span className="font-semibold">{t}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
