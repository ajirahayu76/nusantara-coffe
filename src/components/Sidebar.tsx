import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  FileBarChart2,
  Users2,
  Settings,
  Coffee,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dasbor Finansial',
      icon: LayoutDashboard,
      description: 'Ringkasan omset & grafik',
      roles: ['owner', 'manager'],
    },
    {
      id: 'pos',
      label: 'Kasir (POS)',
      icon: ShoppingCart,
      description: 'Transaksi & struk pembayaran',
      roles: ['owner', 'manager', 'cashier'],
    },
    {
      id: 'inventory',
      label: 'Stok & Gudang',
      icon: Boxes,
      description: 'Manajemen produk & opname',
      roles: ['owner', 'manager'],
    },
    {
      id: 'reports',
      label: 'Laporan Penjualan',
      icon: FileBarChart2,
      description: 'Laba rugi, Excel & PDF',
      roles: ['owner', 'manager', 'cashier'],
    },
    {
      id: 'staff',
      label: 'Hak Akses Staf',
      icon: Users2,
      description: 'Kelola kasir & log audit',
      roles: ['owner'],
    },
    {
      id: 'settings',
      label: 'Pengaturan Toko',
      icon: Settings,
      description: 'Profil, pajak, printer, QRIS',
      roles: ['owner'],
    },
  ];

  const filteredItems = menuItems.filter(item => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const handleSelect = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 md:top-16 z-40 md:z-20 h-full md:h-[calc(100vh-4rem)] w-64 bg-stone-900 text-stone-100 flex flex-col justify-between border-r border-stone-800 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Brand header on mobile sidebar */}
          <div className="md:hidden flex items-center justify-between border-b border-stone-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-amber-50">
                <Coffee className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-wide text-white">Kopi Nusantara</span>
            </div>
            <button
              onClick={onCloseMobile}
              className="text-stone-400 hover:text-white text-sm p-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold tracking-wider uppercase text-amber-400/80">
              Menu Utama
            </p>
            <nav className="space-y-1.5 mt-2">
              {filteredItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition group ${
                      isActive
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40 font-semibold'
                        : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-5 h-5 transition ${
                          isActive ? 'text-white' : 'text-amber-500/70 group-hover:text-amber-400'
                        }`}
                      />
                      <div>
                        <div className="text-sm leading-tight">{item.label}</div>
                        <div
                          className={`text-[10px] leading-tight mt-0.5 ${
                            isActive ? 'text-amber-100/90' : 'text-stone-500 group-hover:text-stone-400'
                          }`}
                        >
                          {item.description}
                        </div>
                      </div>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar footer with quick role info */}
        <div className="p-4 border-t border-stone-800/80 bg-stone-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user?.fullName?.charAt(0) || 'K'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-stone-200 truncate">{user?.fullName}</p>
              <p className="text-[10px] text-amber-400 uppercase tracking-wider font-medium">
                {user?.role === 'owner' ? 'Owner / Admin' : user?.role === 'manager' ? 'Manajer' : 'Kasir POS'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
