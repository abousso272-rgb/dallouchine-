import React from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Car,
  CreditCard,
  Factory,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingBag,
  Ship,
  Truck,
  Users
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { listFeaturedProducts } from '../../services/catalog';
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
import { whatsappLink } from '../../lib/config';
import type { Groupage } from '../../lib/types';

export function HomePage() {
  const products = useAsync(() => listFeaturedProducts(8), []);
  const groupages = useAsync(() => listPublicGroupages(), []);
  const vehicles = useAsync(() => listVehicles({ limit: 3, featuredFirst: true }), []);

  const openGroupages = (groupages.data || []).filter(isJoinable);
  const heroGroupage = [...openGroupages].sort((a, b) => percent(b.reservedQuantity, b.targetQuantity) - percent(a.reservedQuantity, a.targetQuantity))[0];

  return (
    <>
      <Hero groupage={heroGroupage} openCount={openGroupages.length} />
      <Services />

      {/* Groupages en cours */}
      <section className="container-page mt-20 sm:mt-24" aria-labelledby="home-groupages">
        <SectionHead
          eyebrow="Achats groupés"
          id="home-groupages"
          title="Groupages en cours"
          text="Rejoignez une commande collective : le prix usine devient accessible dès une unité. Vous ne payez que votre part."
          link={{ to: '/groupages', label: 'Tous les groupages' }}
        />
        {groupages.loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="skeleton h-[380px] rounded-[var(--radius-card)]" />
            ))}
          </div>
        ) : openGroupages.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {openGroupages.slice(0, 3).map(g => (
              <GroupageCard key={g.id} groupage={g} />
            ))}
          </div>
        ) : (
          <EmptyBand
            icon={<Users className="h-5 w-5" />}
            title="Aucun groupage ouvert pour le moment"
            text="Les prochaines campagnes sont en préparation. Créez votre compte pour être informé de leur ouverture."
            action={<Button to="/inscription" variant="secondary">Créer mon compte</Button>}
          />
        )}
      </section>

      {/* Produits */}
      <section className="container-page mt-20 sm:mt-24" aria-labelledby="home-products">
        <SectionHead
          eyebrow="Catalogue"
          id="home-products"
          title="Produits sélectionnés en Chine"
          text="Des références vérifiées, prix affichés en FCFA, livrées à Dakar."
          link={{ to: '/catalogue', label: 'Voir le catalogue' }}
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {products.loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : (products.data || []).slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <SourcingBand />

      <AutomobileSection vehicles={vehicles.data?.items || []} loading={vehicles.loading} />

      <HowItWorks />

      <TrustAndTracking />

      <FinalCta />
    </>
  );
}

// ---------------------------------------------------------------------------

function Hero({ groupage, openCount }: { groupage?: Groupage; openCount: number }) {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="route-line pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden />
      <div className="container-page relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:py-20">
        <div className="animate-fade-in-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Chine → Afrique de l’Ouest, de l’usine à votre porte
          </p>
          <h1 className="mt-5 text-[38px] font-semibold leading-[1.05] sm:text-5xl lg:text-[58px]">
            Votre passerelle entre la <span className="text-brand">Chine</span> et l’<span className="text-brand">Afrique</span>.
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted sm:text-lg">
            Achetez des produits sélectionnés, rejoignez des commandes groupées, confiez-nous la recherche de vos fournisseurs et importez véhicules et motos. Nous gérons l’achat, le contrôle et le transport — vous suivez chaque étape.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button to="/catalogue" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
              Explorer le catalogue
            </Button>
            <Button to="/sourcing" size="lg" variant="secondary" icon={<Search className="h-4 w-4" />}>
              Demander un sourcing
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] font-medium text-muted">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-jade" /> Paiement sécurisé
            </span>
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-jade" /> Contrôle avant expédition
            </span>
            <span className="inline-flex items-center gap-2">
              <PackageSearch className="h-4 w-4 text-jade" /> Suivi en temps réel
            </span>
          </div>
        </div>

        <RouteCard groupage={groupage} openCount={openCount} />
      </div>
    </section>
  );
}

/** Visuel du parcours Chine → Dakar, alimenté par le groupage réel le plus avancé. */
function RouteCard({ groupage, openCount }: { groupage?: Groupage; openCount: number }) {
  const steps = [
    { icon: Factory, label: 'Achat usine', place: 'Guangzhou · Yiwu' },
    { icon: BadgeCheck, label: 'Contrôle', place: 'Entrepôt DALUCHE' },
    { icon: Ship, label: 'Transport', place: 'Aérien ou maritime' },
    { icon: Truck, label: 'Livraison', place: 'Hub Dakar ou domicile' }
  ];
  return (
    <div className="animate-fade-in-up relative">
      <div className="rounded-[28px] bg-ink p-5 text-white shadow-[var(--shadow-lift)] sm:p-7">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Le trajet de votre commande</p>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">CN → SN</span>
        </div>
        <ol className="mt-6 grid grid-cols-4 gap-2">
          {steps.map((s, i) => (
            <li key={s.label} className="relative flex flex-col items-center text-center">
              {i > 0 && <span className="absolute right-1/2 top-5 h-px w-full border-t border-dashed border-white/25" aria-hidden />}
              <span className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl ${i === 0 ? 'bg-brand' : 'bg-white/10'}`}>
                <s.icon className="h-[18px] w-[18px]" />
              </span>
              <span className="mt-2.5 text-[12px] font-semibold leading-tight">{s.label}</span>
              <span className="mt-0.5 hidden text-[10.5px] leading-tight text-white/45 sm:block">{s.place}</span>
            </li>
          ))}
        </ol>

        {groupage ? (
          <Link to={`/groupages/${groupage.id}`} className="mt-7 block rounded-2xl bg-white p-4 text-ink transition-transform hover:-translate-y-0.5">
            <div className="flex items-center gap-3.5">
              {groupage.image && <img src={groupage.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-brand">Groupage ouvert</p>
                <p className="truncate text-[14px] font-semibold">{groupage.product?.name || groupage.title}</p>
                <p className="num text-[12.5px] text-muted">{formatXOF(groupage.unitPriceXOF)} / unité</p>
              </div>
            </div>
            <div className="mt-3.5 flex items-center gap-3">
              <div className="flex-1">
                <ProgressBar value={groupage.reservedQuantity} max={groupage.targetQuantity} size="sm" />
              </div>
              <span className="num text-[12.5px] font-bold">
                {formatNumber(groupage.reservedQuantity)}/{formatNumber(groupage.targetQuantity)}
              </span>
            </div>
          </Link>
        ) : (
          <div className="mt-7 rounded-2xl bg-white/5 p-4 text-[13px] text-white/70">
            Paiement par Wave, Orange Money, MTN ou carte bancaire. Vos fonds sont engagés uniquement pour votre commande.
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 text-[12.5px]">
          <div className="rounded-2xl bg-white/5 p-3.5">
            <p className="num font-display text-xl font-semibold">{openCount}</p>
            <p className="text-white/55">groupage{openCount > 1 ? 's' : ''} ouvert{openCount > 1 ? 's' : ''}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-3.5">
            <p className="font-display text-xl font-semibold">XOF</p>
            <p className="text-white/55">prix affichés en FCFA</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Services() {
  const items = [
    {
      to: '/catalogue',
      icon: ShoppingBag,
      title: 'Catalogue',
      text: 'Produits sélectionnés, prix en FCFA, achat en ligne immédiat.',
      cta: 'Acheter'
    },
    {
      to: '/groupages',
      icon: Users,
      title: 'Groupages',
      text: 'Commandes collectives au prix usine, paiement de votre seule part.',
      cta: 'Participer'
    },
    {
      to: '/sourcing',
      icon: Search,
      title: 'Sourcing sur mesure',
      text: 'Une photo ou un lien suffit : nous trouvons le fournisseur et vous envoyons un devis.',
      cta: 'Envoyer une demande'
    },
    {
      to: '/pro',
      icon: Boxes,
      title: 'Professionnels (B2B)',
      text: 'Grosses quantités, produits personnalisés, conteneurs : devis dédié.',
      cta: 'Demander un devis'
    }
  ];
  return (
    <section className="container-page mt-14 sm:mt-20" aria-label="Nos services">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,1fr)_1.15fr]">
        {items.map(it => (
          <Link key={it.to} to={it.to} className="group flex flex-col rounded-[var(--radius-card)] border border-line bg-white p-5 transition-shadow hover:shadow-[var(--shadow-soft)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper-2 text-ink">
              <it.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-[17px] font-semibold">{it.title}</h2>
            <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-muted">{it.text}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink group-hover:text-brand">
              {it.cta} <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
        <Link to="/automobile" className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-ink p-5 text-white sm:col-span-2 lg:col-span-1">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand">
            <Car className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-[17px] font-semibold text-white">Automobile & motos</h2>
          <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-white/65">Voitures, motos, utilitaires et camions importés sur devis, dédouanement inclus sur demande.</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white">
            Voir les véhicules <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </section>
  );
}

function SourcingBand() {
  const steps = ['Vous envoyez une photo ou un lien', 'Nous cherchons et comparons les usines', 'Vous validez un devis clair', 'Nous achetons, contrôlons, expédions'];
  return (
    <section className="container-page mt-20 sm:mt-24">
      <div className="overflow-hidden rounded-[28px] border border-line bg-white">
        <div className="grid lg:grid-cols-[1fr_1.1fr]">
          <div className="p-6 sm:p-10">
            <p className="eyebrow">Sourcing personnalisé</p>
            <h2 className="mt-3 text-[28px] font-semibold leading-tight sm:text-4xl">Vous ne trouvez pas votre produit ? Nous le trouvons pour vous.</h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              Machines, pièces, textile, emballages, électronique… Décrivez votre besoin : notre équipe en Chine vous revient avec une proposition chiffrée, sans engagement.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button to="/sourcing" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                Envoyer une demande
              </Button>
              <Button to="/pro" size="lg" variant="secondary">
                Besoin professionnel ?
              </Button>
            </div>
          </div>
          <ol className="grid gap-px bg-line sm:grid-cols-2">
            {steps.map((s, i) => (
              <li key={s} className="flex flex-col justify-between gap-6 bg-paper p-6 sm:p-7">
                <span className="num font-display text-[34px] font-semibold leading-none text-brand">0{i + 1}</span>
                <p className="text-[15px] font-semibold leading-snug">{s}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function AutomobileSection({ vehicles, loading }: { vehicles: import('../../lib/types').Vehicle[]; loading: boolean }) {
  const types = ['Voitures', 'SUV & 4x4', 'Pick-up', 'Motos & scooters', 'Utilitaires', 'Camions'];
  return (
    <section className="mt-20 bg-ink py-16 text-white sm:mt-24 sm:py-20" aria-labelledby="home-auto">
      <div className="container-page">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">Automobile & motos</p>
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
            <Button to="/automobile#recherche" size="lg" className="bg-white/10 text-white hover:bg-white/15" variant="ghost">
              Recherche personnalisée
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {types.map(t => (
            <span key={t} className="rounded-full border border-white/15 px-3.5 py-1.5 text-[12.5px] font-semibold text-white/75">
              {t}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-[340px] animate-pulse rounded-[var(--radius-card)] bg-white/5" />
            ))}
          </div>
        ) : vehicles.length ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map(v => (
              <VehicleCard key={v.id} vehicle={v} dark />
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
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: ShoppingBag, title: 'Choisissez', text: 'Un produit du catalogue, une place dans un groupage, ou une demande sur mesure.' },
    { icon: CreditCard, title: 'Payez en sécurité', text: 'Wave, Orange Money, MTN ou carte. Sur devis, un acompte suffit pour lancer.' },
    { icon: Factory, title: 'Nous achetons et contrôlons', text: 'Achat auprès du fournisseur, contrôle qualité et consolidation en Chine.' },
    { icon: Truck, title: 'Suivez et récupérez', text: 'Chaque étape est visible dans votre espace, jusqu’au retrait ou à la livraison.' }
  ];
  return (
    <section id="fonctionnement" className="container-page scroll-mt-24 pt-20 sm:pt-24" aria-labelledby="home-how">
      <SectionHead eyebrow="Fonctionnement" id="home-how" title="Comment ça marche" text="Un seul interlocuteur, de la commande à la livraison." />
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="relative rounded-[var(--radius-card)] border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand">
                <s.icon className="h-5 w-5" />
              </span>
              <span className="num font-display text-sm font-semibold text-subtle">Étape {i + 1}</span>
            </div>
            <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
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
    <section className="container-page mt-20 grid gap-4 sm:mt-24 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2">
        {perks.map(p => (
          <div key={p.title} className="bg-white p-5 sm:p-6">
            <p.icon className="h-5 w-5 text-brand" />
            <h3 className="mt-3 text-[15px] font-semibold">{p.title}</h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{p.text}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col justify-between rounded-[var(--radius-card)] bg-paper-2 p-6 sm:p-7">
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
            className="num h-12 min-w-0 flex-1 rounded-xl border border-line-2 bg-white px-4 font-semibold tracking-wide focus:border-ink focus:outline-none"
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
      <div className="flex flex-col items-start gap-6 rounded-[28px] bg-brand p-7 text-white sm:p-10 lg:flex-row lg:items-center lg:justify-between">
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
            className="inline-flex h-13 items-center justify-center rounded-2xl bg-white/15 px-6 text-[15px] font-semibold text-white hover:bg-white/20"
          >
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
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className="mt-2 text-[26px] font-semibold leading-tight sm:text-[34px]">
          {title}
        </h2>
        {text && <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{text}</p>}
      </div>
      {link && (
        <Link to={link.to} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink hover:text-brand">
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
