/**
 * UyirThunai — A Helping Hand for Every Life
 * 
 * Integrated Healthcare Operations Platform
 * 1. Emergency Blood Requirement and Donor Coordination System
 * 2. Pharmacy Prescription Fulfilment and Medicine Delivery System
 */

import React, { useState, useEffect } from 'react';
import { I18nProvider, useI18n } from './i18n.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Logo } from './components/Logo.tsx';

// Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { BloodRequestsPage } from './pages/BloodRequestsPage.tsx';
import { BloodRequestDetailPage } from './pages/BloodRequestDetailPage.tsx';
import { DonorDirectoryPage } from './pages/DonorDirectoryPage.tsx';
import { DonorRegistrationPage } from './pages/DonorRegistrationPage.tsx';
import { MedicinesCataloguePage } from './pages/MedicinesCataloguePage.tsx';
import { MedicineDetailPage } from './pages/MedicineDetailPage.tsx';
import { PrescriptionUploadPage } from './pages/PrescriptionUploadPage.tsx';
import { PrescriptionReviewQueuePage } from './pages/PrescriptionReviewQueuePage.tsx';
import { CartAndCheckoutPage } from './pages/CartAndCheckoutPage.tsx';
import { OrdersPage } from './pages/OrdersPage.tsx';
import { OrderDetailPage } from './pages/OrderDetailPage.tsx';
import { PharmacyInventoryPage } from './pages/PharmacyInventoryPage.tsx';
import { CourierDashboardPage } from './pages/CourierDashboardPage.tsx';
import { UserManagementPage } from './pages/UserManagementPage.tsx';
import { AuditLogsPage } from './pages/AuditLogsPage.tsx';
import { NotificationsPage } from './pages/NotificationsPage.tsx';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage.tsx';
import { AccessDenied } from './pages/AccessDenied.tsx';
import { AdmissionTrackingPage } from './pages/AdmissionTrackingPage.tsx';
import { UyirBotChat } from './components/UyirBotChat.tsx';
import { NotificationAlertSound } from './components/NotificationAlertSound.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';

function MainApp() {
  const { user, loading } = useAuth();
  const { t } = useI18n();

  // Navigation state using URL hash or internal state
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    return hash || 'home';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      setCurrentRoute(hash || 'home');
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (page: string) => {
    window.location.hash = `#/${page}`;
    setCurrentRoute(page);
    window.scrollTo(0, 0);
  };

  // Render current view
  const renderPage = () => {
    if (loading) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-xs text-slate-500">
          <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
          <span>Initializing UyirThunai System...</span>
        </div>
      );
    }

    const route = currentRoute;

    // Parameterized routes
    if (route.startsWith('blood-requests/')) {
      const id = route.replace('blood-requests/', '');
      return <BloodRequestDetailPage requestId={id} onNavigate={navigate} />;
    }
    if (route.startsWith('medicines/')) {
      const id = route.replace('medicines/', '');
      return <MedicineDetailPage medicineId={id} onNavigate={navigate} />;
    }
    if (route.startsWith('orders/')) {
      const id = route.replace('orders/', '');
      return <OrderDetailPage orderId={id} onNavigate={navigate} />;
    }

    // Role guards
    const isPharmaOrAdmin = user?.role === 'pharmacy_staff' || user?.role === 'admin';
    const isAdmin = user?.role === 'admin';
    const isCourierOrPharma = user?.role === 'courier' || user?.role === 'pharmacy_staff' || user?.role === 'admin';

    switch (route) {
      case 'home':
        return <LandingPage onNavigate={navigate} />;
      case 'login':
        return <LoginPage onNavigate={navigate} />;
      case 'register':
        return <RegisterPage onNavigate={navigate} />;
      case 'dashboard':
        return <DashboardPage onNavigate={navigate} />;
      case 'blood-requests':
        return <BloodRequestsPage onNavigate={navigate} />;
      case 'donor-directory':
        return <DonorDirectoryPage onNavigate={navigate} />;
      case 'donor-profile':
        return <DonorRegistrationPage onNavigate={navigate} />;
      case 'medicines':
        return <MedicinesCataloguePage onNavigate={navigate} />;
      case 'prescriptions':
        return <PrescriptionUploadPage onNavigate={navigate} />;
      case 'pharmacy-review':
        if (!isPharmaOrAdmin) return <AccessDenied requiredRole="Licensed Pharmacy Staff" onNavigate={navigate} />;
        return <PrescriptionReviewQueuePage onNavigate={navigate} />;
      case 'pharmacy-inventory':
        if (!isPharmaOrAdmin) return <AccessDenied requiredRole="Licensed Pharmacy Staff" onNavigate={navigate} />;
        return <PharmacyInventoryPage onNavigate={navigate} />;
      case 'cart':
        return <CartAndCheckoutPage onNavigate={navigate} />;
      case 'orders':
        return <OrdersPage onNavigate={navigate} />;
      case 'admission-tracking':
        return <AdmissionTrackingPage onNavigate={navigate} />;
      case 'courier':
        if (!isCourierOrPharma) return <AccessDenied requiredRole="Delivery Courier Partner" onNavigate={navigate} />;
        return <CourierDashboardPage onNavigate={navigate} />;
      case 'users':
        if (!isAdmin) return <AccessDenied requiredRole="Administrator" onNavigate={navigate} />;
        return <UserManagementPage onNavigate={navigate} />;
      case 'audit-logs':
        if (!isAdmin) return <AccessDenied requiredRole="Administrator" onNavigate={navigate} />;
        return <AuditLogsPage onNavigate={navigate} />;
      case 'notifications':
        return <NotificationsPage onNavigate={navigate} />;
      case 'settings':
        return <ProfileSettingsPage onNavigate={navigate} />;
      default:
        return (
          <div className="py-16 text-center space-y-4">
            <h2 className="text-3xl font-black text-slate-800">404 - Page Not Found</h2>
            <p className="text-xs text-slate-500">The requested section does not exist.</p>
            <button
              onClick={() => navigate('home')}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Return Home
            </button>
          </div>
        );
    }
  };

  const isLanding = currentRoute === 'home' || currentRoute === '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-xs">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentPage={currentRoute}
        onNavigate={navigate}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar only shown when authenticated or not on pure landing */}
        {!isLanding && (
          <Sidebar
            currentPage={currentRoute.split('/')[0]}
            onNavigate={navigate}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 min-w-0 ${isLanding ? 'w-full' : ''}`}>
          {renderPage()}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 px-4 text-xs mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" light showTagline={false} />
            <span className="text-[11px] text-slate-500">
              © 2026 UyirThunai • Integrated Healthcare Operations Platform
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>24/7 Emergency Dispatch</span>
            <span>•</span>
            <span>Blood Bank Coordination</span>
            <span>•</span>
            <span>Prescription Fulfilment Network</span>
          </div>
        </div>
      </footer>

      {/* 24/7 Intelligent Medical Assistant */}
      <UyirBotChat onNavigate={navigate} />
      <NotificationAlertSound onNavigate={navigate} />
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
