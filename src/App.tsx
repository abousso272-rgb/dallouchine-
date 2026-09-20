import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { Footer } from './components/layout/Footer';
import { AdminLayout } from './components/layout/AdminLayout';
import { ToastContainer } from './components/common/ToastContainer';
import { ClientAIAssistant } from './components/common/ClientAIAssistant';
import { AuthModal } from './components/auth/AuthModal';
import { UnifiedAuthForm } from './components/auth/UnifiedAuthForm';
import { ShieldAlert, Lock } from 'lucide-react';

// Client Pages
import { HomePage } from './pages/client/HomePage';
import { CatalogPage } from './pages/client/CatalogPage';
import { ProductDetailPage } from './pages/client/ProductDetailPage';
import { GroupagesPage } from './pages/client/GroupagesPage';
import { GroupageDetailPage } from './pages/client/GroupageDetailPage';
import { B2BPage } from './pages/client/B2BPage';
import { SourcingRequestPage } from './pages/client/SourcingRequestPage';
import { QuoteRequestPage } from './pages/client/QuoteRequestPage';
import { HowItWorksPage } from './pages/client/HowItWorksPage';
import { TrackingPage } from './pages/client/TrackingPage';
import { TransitPage } from './pages/client/TransitPage';
import { AboutPage } from './pages/client/AboutPage';
import { CartPage } from './pages/client/CartPage';
import { CheckoutPage } from './pages/client/CheckoutPage';
import { OrderSuccessPage } from './pages/client/OrderSuccessPage';
import { AccountPage } from './pages/client/AccountPage';
import { ClientDashboardPage } from './pages/client/ClientDashboardPage';
import { AuthPage } from './pages/client/AuthPage';
import { PaymentStatusPage } from './pages/client/PaymentStatusPage';
import { PaymentHostedSimulatorPage } from './pages/client/PaymentHostedSimulatorPage';
import { PaymentsPage } from './pages/client/PaymentsPage';
import { DocumentsPage } from './pages/client/DocumentsPage';
import { AutoMobilityPage } from './pages/client/AutoMobilityPage';
import { CollaboratorDashboardPage } from './pages/collaborator/CollaboratorDashboardPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminGroupagesPage } from './pages/admin/AdminGroupagesPage';
import { AdminCalculatorPage } from './pages/admin/AdminCalculatorPage';
import { AdminCostVariancePage } from './pages/admin/AdminCostVariancePage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminSourcingPage } from './pages/admin/AdminSourcingPage';
import { AdminB2BPage } from './pages/admin/AdminB2BPage';
import { AdminLogisticsPage } from './pages/admin/AdminLogisticsPage';
import { AdminTransportersPage } from './pages/admin/AdminTransportersPage';
import { AdminHubPage } from './pages/admin/AdminHubPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminPromotionsPage } from './pages/admin/AdminPromotionsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminAlertsPage } from './pages/admin/AdminAlertsPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { AdminSuppliersPage } from './pages/admin/AdminSuppliersPage';
import { AdminSourcersPage } from './pages/admin/AdminSourcersPage';
import { AdminAIAssistantPage } from './pages/admin/AdminAIAssistantPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

const AppRouter: React.FC = () => {
  const { currentPath, isAuthModalOpen, closeAuthModal, authModalDefaultTab, currentUser, authLoading } = useApp();

  // ADMIN ROUTING
  if (currentPath.startsWith('/admin')) {
    // 1. Attente de la validation du token Supabase Auth
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B192C] text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-400">Vérification de sécurité Supabase...</span>
          </div>
        </div>
      );
    }

    // 2. Protection stricte : rôle administrateur certifié requis
    if (!currentUser.isLoggedIn || currentUser.role !== 'admin') {
      return (
        <div className="min-h-screen flex flex-col bg-[#0B192C] text-white selection:bg-[#FF4500] selection:text-white">
          <Navbar />
          <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex flex-col items-center justify-center">
            <div className="w-full max-w-xl space-y-6">
              <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-center space-y-1.5">
                <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-300">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Zone d'Administration Restreinte</span>
                </div>
                <p className="text-xs text-slate-300">
                  {currentUser.isLoggedIn
                    ? `Votre compte (${currentUser.email}) possède le profil "${currentUser.role}". L'accès au panneau opérationnel HQ est réservé aux administrateurs autorisés.`
                    : 'Veuillez vous authentifier avec votre compte superviseur pour accéder à cette zone.'}
                </p>
              </div>
              <UnifiedAuthForm defaultTab="admin" redirectTo={currentPath} />
            </div>
          </main>
          <Footer />
        </div>
      );
    }

    let adminContent: React.ReactNode = <AdminDashboardPage />;

    if (currentPath === '/admin/products') {
      adminContent = <AdminProductsPage />;
    } else if (currentPath === '/admin/groupages') {
      adminContent = <AdminGroupagesPage />;
    } else if (currentPath === '/admin/calculator') {
      adminContent = <AdminCalculatorPage />;
    } else if (currentPath === '/admin/cost-variance') {
      adminContent = <AdminCostVariancePage />;
    } else if (currentPath === '/admin/orders') {
      adminContent = <AdminOrdersPage />;
    } else if (currentPath === '/admin/sourcing') {
      adminContent = <AdminSourcingPage />;
    } else if (currentPath === '/admin/b2b') {
      adminContent = <AdminB2BPage />;
    } else if (currentPath === '/admin/logistics') {
      adminContent = <AdminLogisticsPage />;
    } else if (currentPath === '/admin/transporters') {
      adminContent = <AdminTransportersPage />;
    } else if (currentPath === '/admin/hub') {
      adminContent = <AdminHubPage />;
    } else if (currentPath === '/admin/customers') {
      adminContent = <AdminCustomersPage />;
    } else if (currentPath === '/admin/payments') {
      adminContent = <AdminPaymentsPage />;
    } else if (currentPath === '/admin/promotions') {
      adminContent = <AdminPromotionsPage />;
    } else if (currentPath === '/admin/analytics') {
      adminContent = <AdminAnalyticsPage />;
    } else if (currentPath === '/admin/alerts') {
      adminContent = <AdminAlertsPage />;
    } else if (currentPath === '/admin/notifications') {
      adminContent = <AdminNotificationsPage />;
    } else if (currentPath === '/admin/suppliers') {
      adminContent = <AdminSuppliersPage />;
    } else if (currentPath === '/admin/sourcers') {
      adminContent = <AdminSourcersPage />;
    } else if (currentPath === '/admin/ai-assistant') {
      adminContent = <AdminAIAssistantPage />;
    } else if (currentPath === '/admin/settings') {
      adminContent = <AdminSettingsPage />;
    }

    return (
      <AdminLayout>
        {adminContent}
        <ToastContainer />
      </AdminLayout>
    );
  }

  // PAYMENT HOSTED SIMULATOR / REDIRECT ROUTING
  if (
    currentPath.startsWith('/payment/hosted-checkout') ||
    currentPath.startsWith('/payment/checkout-simulator')
  ) {
    return <PaymentHostedSimulatorPage />;
  }

  // PUBLIC CLIENT ROUTING
  let clientContent: React.ReactNode = <HomePage />;

  if (
    currentPath === '/auto-mobilite' ||
    currentPath.startsWith('/auto-mobilite?') ||
    currentPath === '/vehicules' ||
    currentPath === '/auto'
  ) {
    clientContent = <AutoMobilityPage />;
  } else if (
    currentPath === '/products' ||
    currentPath.startsWith('/products?') ||
    currentPath === '/produits'
  ) {
    clientContent = <CatalogPage />;
  } else if (currentPath.startsWith('/products/') || currentPath.startsWith('/product/')) {
    const slug = currentPath.replace('/products/', '').replace('/product/', '');
    clientContent = <ProductDetailPage slug={slug} />;
  } else if (currentPath === '/groupages' || currentPath === '/group-buys' || currentPath === '/groupage') {
    clientContent = <GroupagesPage />;
  } else if (currentPath.startsWith('/groupages/') || currentPath.startsWith('/groupage/')) {
    const id = currentPath.replace('/groupages/', '').replace('/groupage/', '');
    clientContent = <GroupageDetailPage id={id} />;
  } else if (currentPath === '/b2b' || currentPath === '/espace-b2b') {
    clientContent = <B2BPage />;
  } else if (
    currentPath === '/request' ||
    currentPath === '/sourcing' ||
    currentPath === '/sourcing-personnalise' ||
    currentPath.startsWith('/sourcing?')
  ) {
    clientContent = <SourcingRequestPage />;
  } else if (
    currentPath === '/demande-devis' ||
    currentPath === '/demander-un-devis' ||
    currentPath === '/devis' ||
    currentPath === '/quote' ||
    currentPath.startsWith('/demande-devis?') ||
    currentPath.startsWith('/devis?')
  ) {
    clientContent = <QuoteRequestPage />;
  } else if (currentPath === '/how-it-works') {
    clientContent = <HowItWorksPage />;
  } else if (
    currentPath === '/transit' ||
    currentPath === '/fret' ||
    currentPath === '/tarifs' ||
    currentPath === '/entrepots' ||
    currentPath === '/logistics'
  ) {
    clientContent = <TransitPage />;
  } else if (currentPath === '/about' || currentPath === '/a-propos') {
    clientContent = <AboutPage />;
  } else if (
    currentPath === '/tracking' ||
    currentPath.startsWith('/tracking?') ||
    currentPath === '/suivi' ||
    currentPath.startsWith('/suivi?')
  ) {
    clientContent = <TrackingPage />;
  } else if (
    currentPath === '/dashboard' ||
    currentPath.startsWith('/dashboard?') ||
    currentPath === '/mon-espace' ||
    currentPath.startsWith('/mon-espace?') ||
    currentPath === '/tableau-de-bord' ||
    currentPath === '/client' ||
    currentPath.startsWith('/client?')
  ) {
    clientContent = <ClientDashboardPage />;
  } else if (
    currentPath === '/collaborateur' ||
    currentPath.startsWith('/collaborateur?') ||
    currentPath === '/espace-collaborateur'
  ) {
    clientContent = <CollaboratorDashboardPage />;
  } else if (currentPath === '/cart' || currentPath === '/panier') {
    clientContent = <CartPage />;
  } else if (currentPath === '/checkout' || currentPath === '/validation-commande') {
    clientContent = <CheckoutPage />;
  } else if (currentPath.startsWith('/order-success') || currentPath.startsWith('/commande-succes')) {
    clientContent = <OrderSuccessPage />;
  } else if (
    currentPath.startsWith('/payment/success') ||
    currentPath.startsWith('/payment/status') ||
    currentPath.startsWith('/payment/pending') ||
    currentPath.startsWith('/payment/error') ||
    currentPath.startsWith('/payment/failed') ||
    currentPath.startsWith('/payment/cancelled')
  ) {
    clientContent = <PaymentStatusPage />;
  } else if (
    currentPath === '/login' ||
    currentPath.startsWith('/login?') ||
    currentPath === '/connexion' ||
    currentPath.startsWith('/connexion?') ||
    currentPath === '/auth' ||
    currentPath.startsWith('/auth?') ||
    currentPath === '/signin' ||
    currentPath === '/register'
  ) {
    clientContent = <AuthPage />;
  } else if (
    currentPath === '/paiements' ||
    currentPath.startsWith('/paiements?') ||
    currentPath === '/transactions' ||
    currentPath.startsWith('/transactions?') ||
    currentPath === '/finances'
  ) {
    clientContent = <PaymentsPage />;
  } else if (
    currentPath === '/devis-documents' ||
    currentPath.startsWith('/devis-documents?') ||
    currentPath === '/documents' ||
    currentPath.startsWith('/documents?') ||
    currentPath === '/certificats'
  ) {
    clientContent = <DocumentsPage />;
  } else if (currentPath === '/account' || currentPath.startsWith('/account?')) {
    clientContent = <AccountPage />;
  }

  // Protection des routes privées client : authentification requise
  const isPrivateClientRoute = 
    currentPath === '/account' ||
    currentPath.startsWith('/account?') ||
    currentPath === '/dashboard' ||
    currentPath.startsWith('/dashboard?') ||
    currentPath === '/mon-espace' ||
    currentPath.startsWith('/mon-espace?') ||
    currentPath === '/tableau-de-bord' ||
    currentPath === '/paiements' ||
    currentPath.startsWith('/paiements?') ||
    currentPath === '/transactions' ||
    currentPath.startsWith('/transactions?') ||
    currentPath === '/devis-documents' ||
    currentPath.startsWith('/devis-documents?') ||
    currentPath === '/documents';

  if (isPrivateClientRoute && !authLoading && !currentUser.isLoggedIn) {
    clientContent = (
      <div className="w-full max-w-xl mx-auto py-8 space-y-6 animate-in fade-in">
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-800">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Connexion Requise</span>
          </div>
          <p className="text-xs text-slate-600">
            Veuillez vous connecter à votre compte client pour accéder à vos expéditions, vos factures et vos documents.
          </p>
        </div>
        <UnifiedAuthForm defaultTab="client" redirectTo={currentPath} />
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen flex flex-col bg-[#F8F6F2] text-slate-900 selection:bg-[#FF4500] selection:text-white">
      <Navbar />
      <main className="app-content flex-1 min-w-0 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {clientContent}
      </main>
      <Footer />
      <MobileBottomNav />
      <ClientAIAssistant />
      <ToastContainer />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        defaultTab={authModalDefaultTab}
      />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

export default App;
