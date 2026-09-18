import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { Footer } from './components/layout/Footer';
import { AdminLayout } from './components/layout/AdminLayout';
import { ToastContainer } from './components/common/ToastContainer';
import { ClientAIAssistant } from './components/common/ClientAIAssistant';
import { AuthModal } from './components/auth/AuthModal';

// Client Pages
import { HomePage } from './pages/client/HomePage';
import { CatalogPage } from './pages/client/CatalogPage';
import { ProductDetailPage } from './pages/client/ProductDetailPage';
import { GroupagesPage } from './pages/client/GroupagesPage';
import { GroupageDetailPage } from './pages/client/GroupageDetailPage';
import { B2BPage } from './pages/client/B2BPage';
import { SourcingRequestPage } from './pages/client/SourcingRequestPage';
import { HowItWorksPage } from './pages/client/HowItWorksPage';
import { TrackingPage } from './pages/client/TrackingPage';
import { CartPage } from './pages/client/CartPage';
import { CheckoutPage } from './pages/client/CheckoutPage';
import { AccountPage } from './pages/client/AccountPage';
import { PaymentStatusPage } from './pages/client/PaymentStatusPage';
import { PaymentHostedSimulatorPage } from './pages/client/PaymentHostedSimulatorPage';

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
  const { currentPath, isAuthModalOpen, closeAuthModal, authModalDefaultTab } = useApp();

  // ADMIN ROUTING
  if (currentPath.startsWith('/admin')) {
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

  if (currentPath === '/products' || currentPath.startsWith('/products?')) {
    clientContent = <CatalogPage />;
  } else if (currentPath.startsWith('/products/')) {
    const slug = currentPath.replace('/products/', '');
    clientContent = <ProductDetailPage slug={slug} />;
  } else if (currentPath === '/groupages' || currentPath === '/group-buys') {
    clientContent = <GroupagesPage />;
  } else if (currentPath.startsWith('/groupages/')) {
    const id = currentPath.replace('/groupages/', '');
    clientContent = <GroupageDetailPage id={id} />;
  } else if (currentPath === '/b2b') {
    clientContent = <B2BPage />;
  } else if (currentPath === '/request') {
    clientContent = <SourcingRequestPage />;
  } else if (currentPath === '/how-it-works') {
    clientContent = <HowItWorksPage />;
  } else if (currentPath === '/tracking' || currentPath.startsWith('/tracking?')) {
    clientContent = <TrackingPage />;
  } else if (currentPath === '/cart') {
    clientContent = <CartPage />;
  } else if (currentPath === '/checkout') {
    clientContent = <CheckoutPage />;
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
    currentPath === '/account' ||
    currentPath.startsWith('/account?') ||
    currentPath === '/login' ||
    currentPath.startsWith('/login?') ||
    currentPath === '/connexion' ||
    currentPath === '/auth' ||
    currentPath === '/signin'
  ) {
    clientContent = <AccountPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F2] text-slate-900 selection:bg-[#2A6DFF] selection:text-white">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
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
