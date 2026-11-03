import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { RealtimeProvider } from './context/RealtimeContext.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { PosView } from './views/PosView.tsx';
import { InventoryView } from './views/InventoryView.tsx';
import { ReportsView } from './views/ReportsView.tsx';
import { StaffView } from './views/StaffView.tsx';
import { SettingsView } from './views/SettingsView.tsx';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);

  // Set default active tab based on user role
  useEffect(() => {
    if (user) {
      if (user.role === 'cashier') {
        setActiveTab('pos');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-stone-400 text-xs tracking-wider uppercase font-semibold">
            Memuat Sistem Kopi Nusantara...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginModal />;
  }

  // View router
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigateToInventory={() => setActiveTab('inventory')} />;
      case 'pos':
        return <PosView />;
      case 'inventory':
        return <InventoryView />;
      case 'reports':
        return <ReportsView />;
      case 'staff':
        return <StaffView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigateToInventory={() => setActiveTab('inventory')} />;
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200">
      <Header
        activeTab={activeTab}
        onToggleSidebar={() => setSidebarOpenMobile(!sidebarOpenMobile)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={sidebarOpenMobile}
          onCloseMobile={() => setSidebarOpenMobile(false)}
        />

        <main className="flex-1 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RealtimeProvider>
          <MainApp />
        </RealtimeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
