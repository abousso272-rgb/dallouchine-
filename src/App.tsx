import React, { Suspense, lazy, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SiteHeader } from './components/layout/SiteHeader';
import { SiteFooter } from './components/layout/SiteFooter';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { Toasts } from './components/ui/Toasts';
import { AuthModal } from './components/auth/AuthModal';
import { PageLoader } from './components/ui/States';
import type { AppRole } from './lib/types';
import { matchPattern, type Params } from './lib/router';

// Pages publiques
import { HomePage } from './pages/public/HomePage';
const CatalogPage = lazy(() => import('./pages/public/CatalogPage'));
const ProductPage = lazy(() => import('./pages/public/ProductPage'));
const GroupagesPage = lazy(() => import('./pages/public/GroupagesPage'));
const GroupagePage = lazy(() => import('./pages/public/GroupagePage'));
const SourcingPage = lazy(() => import('./pages/public/SourcingPage'));
const ProPage = lazy(() => import('./pages/public/ProPage'));
const VehiclesPage = lazy(() => import('./pages/public/VehiclesPage'));
const VehiclePage = lazy(() => import('./pages/public/VehiclePage'));
const TrackingPage = lazy(() => import('./pages/public/TrackingPage'));
const CartPage = lazy(() => import('./pages/public/CartPage'));
const CheckoutPage = lazy(() => import('./pages/public/CheckoutPage'));
const PaymentReturnPage = lazy(() => import('./pages/public/PaymentReturnPage'));
const AuthPage = lazy(() => import('./pages/public/AuthPage'));
const PasswordPage = lazy(() => import('./pages/public/PasswordPage'));
const InvitationPage = lazy(() => import('./pages/public/InvitationPage'));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage'));

// Espace client
const AccountRoutes = lazy(() => import('./pages/account/AccountRoutes'));
// Espace professionnel
const ProRoutes = lazy(() => import('./pages/pro/ProRoutes'));


interface Route {
  pattern: string;
  render: (p: Params) => React.ReactNode;
}

const PUBLIC_ROUTES: Route[] = [
  { pattern: '/', render: () => <HomePage /> },
  { pattern: '/catalogue', render: () => <CatalogPage /> },
  { pattern: '/produit/:slug', render: p => <ProductPage slug={p.slug} /> },
  { pattern: '/groupages', render: () => <GroupagesPage /> },
  { pattern: '/groupages/:id', render: p => <GroupagePage id={p.id} /> },
  { pattern: '/sourcing', render: () => <SourcingPage /> },
  { pattern: '/pro', render: () => <ProPage /> },
  { pattern: '/automobile', render: () => <VehiclesPage /> },
  { pattern: '/automobile/:slug', render: p => <VehiclePage slug={p.slug} /> },
  { pattern: '/suivi', render: () => <TrackingPage /> },
  { pattern: '/panier', render: () => <CartPage /> },
  { pattern: '/commande', render: () => <CheckoutPage /> },
  { pattern: '/paiement/retour', render: () => <PaymentReturnPage /> },
  { pattern: '/connexion', render: () => <AuthPage mode="login" /> },
  { pattern: '/inscription', render: () => <AuthPage mode="register" /> },
  { pattern: '/mot-de-passe', render: () => <PasswordPage /> },
  { pattern: '/invitation', render: () => <InvitationPage /> }
];

// Anciennes adresses du site : redirigées vers la nouvelle structure
const LEGACY_REDIRECTS: [RegExp, (m: RegExpMatchArray, search: string) => string][] = [
  [/^\/(products|produits)\/?$/, (_m, s) => `/catalogue${s}`],
  [/^\/(products|product)\/(.+)$/, m => `/produit/${m[2]}`],
  [/^\/(group-buys|groupage)\/?$/, () => '/groupages'],
  [/^\/groupage\/(.+)$/, m => `/groupages/${m[1]}`],
  [/^\/(request|sourcing-personnalise)\/?$/, () => '/sourcing'],
  [/^\/(professionnels|b2b|espace-b2b|demande-devis|demander-un-devis|devis|quote)\/?$/, () => '/pro'],
  [/^\/(auto-mobilite|vehicules|auto)\/?$/, () => '/automobile'],
  [/^\/(tracking)\/?$/, (_m, s) => `/suivi${s}`],
  [/^\/(cart)\/?$/, () => '/panier'],
  [/^\/(checkout|validation-commande)\/?$/, () => '/commande'],
  [/^\/payment\/(success|status|pending|error|failed|cancelled)\/?$/, (m, s) => `/paiement/retour${s}${m[1] === 'cancelled' ? (s ? '&' : '?') + 'cancelled=1' : ''}`],
  [/^\/(login|auth|signin)\/?$/, () => '/connexion'],
  [/^\/register\/?$/, () => '/inscription'],
  [/^\/(dashboard|mon-espace|tableau-de-bord|client|account)\/?$/, () => '/compte'],
  [/^\/(paiements|transactions|finances)\/?$/, () => '/compte/paiements'],
  [/^\/admin(\/.*)?$/, () => '/espace-pro'],
  [/^\/(transitaire|collaborateur|espace-transitaire|sourceur|gestionnaire-groupages|groupages-admin|espace-groupages)\/?$/, () => '/espace-pro']
];

function Router() {
  const { path, navigate, query, authLoading, user } = useApp();
  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path;

  // Redirections héritées
  useEffect(() => {
    const search = window.location.search;
    for (const [re, to] of LEGACY_REDIRECTS) {
      const m = normalized.match(re);
      if (m) {
        navigate(to(m, search), { replace: true });
        return;
      }
    }
  }, [normalized, navigate]);

  // Titre de page
  useEffect(() => {
    if (normalized.startsWith('/espace-pro')) document.title = 'Espace pro — DALUCHE';
    else if (normalized.startsWith('/compte')) document.title = 'Mon espace — DALUCHE';
  }, [normalized]);

  // Un utilisateur déjà connecté qui ouvre /connexion est renvoyé vers son espace (ou ?next=)
  useEffect(() => {
    if (!authLoading && user && (normalized === '/connexion' || normalized === '/inscription')) {
      navigate(query.get('next') || (user.role === 'client' ? '/compte' : '/espace-pro'), { replace: true });
    }
  }, [authLoading, user, normalized, navigate, query]);

  if (normalized.startsWith('/espace-pro')) {
    if (authLoading) return <PageLoader label="Vérification de votre session…" />;
    return (
      <Suspense fallback={<PageLoader />}>
        <ProRoutes path={normalized} />
      </Suspense>
    );
  }

  let content: React.ReactNode = null;
  if (normalized.startsWith('/compte')) {
    content = authLoading ? <PageLoader label="Vérification de votre session…" /> : <AccountRoutes path={normalized} />;
  } else {
    for (const r of PUBLIC_ROUTES) {
      const params = matchPattern(r.pattern, normalized);
      if (params) {
        content = r.render(params);
        break;
      }
    }
    if (!content && !LEGACY_REDIRECTS.some(([re]) => re.test(normalized))) content = <NotFoundPage />;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
        Aller au contenu
      </a>
      <SiteHeader />
      <main id="contenu" className="flex-1 pb-24 lg:pb-0">
        <Suspense fallback={<PageLoader />}>{content}</Suspense>
      </main>
      <SiteFooter />
      <MobileTabBar />
    </div>
  );
}

export function hasRole(role: AppRole | undefined, allowed: AppRole[]) {
  return Boolean(role && allowed.includes(role));
}

// Préchargement discret des pages les plus visitées quand le navigateur est inactif :
// la navigation suivante s'affiche sans attendre le téléchargement du code.
function usePrefetchRoutes() {
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const idle = (cb: () => void) =>
      'requestIdleCallback' in window ? (window as Window & { requestIdleCallback: (c: () => void) => number }).requestIdleCallback(cb) : setTimeout(cb, 1500);
    const t = window.setTimeout(
      () =>
        idle(() => {
          import('./pages/public/CatalogPage');
          import('./pages/public/ProductPage');
          import('./pages/public/GroupagesPage');
          import('./pages/public/GroupagePage');
          import('./pages/public/CartPage');
          import('./pages/public/SourcingPage');
        }),
      2500
    );
    return () => window.clearTimeout(t);
  }, []);
}

export default function App() {
  usePrefetchRoutes();
  return (
    <AppProvider>
      <Router />
      <AuthModal />
      <Toasts />
    </AppProvider>
  );
}
