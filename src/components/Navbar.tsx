import React, { useState, useEffect } from 'react';
import {
  Coffee,
  ShoppingBag,
  Menu as MenuIcon,
  X,
  Sparkles,
  BarChart3,
  CreditCard,
  Package,
  FileSpreadsheet,
  Users,
  Settings,
  AlertTriangle,
  ChevronDown,
  Store,
  Sun,
  Moon,
} from 'lucide-react';
import { OrderType, AppActiveView } from '../types';
import { useStore } from '../context/StoreContext';

interface NavbarProps {
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  orderType: OrderType;
  onChangeOrderType: (type: OrderType) => void;
  tableNumber: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  cartTotal,
  onOpenCart,
  orderType,
  onChangeOrderType,
  tableNumber,
}) => {
  const { activeView, setActiveView, lowStockItems, currentStaffUser, theme, toggleTheme } = useStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemDropdownOpen, setSystemDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const systemModules: { id: AppActiveView; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dasbor Finansial', icon: <BarChart3 className="w-4 h-4 text-[#C2410C]" /> },
    { id: 'pos', label: 'Kasir (POS)', icon: <CreditCard className="w-4 h-4 text-[#16A34A]" /> },
    {
      id: 'warehouse',
      label: 'Stok & Gudang',
      icon: <Package className="w-4 h-4 text-[#0284C7]" />,
      badge: lowStockItems.length > 0 ? `${lowStockItems.length} Menipis` : undefined,
    },
    { id: 'sales-report', label: 'Laporan Penjualan', icon: <FileSpreadsheet className="w-4 h-4 text-[#854D0E]" /> },
    { id: 'staff-access', label: 'Hak Akses Staf', icon: <Users className="w-4 h-4 text-[#4338CA]" /> },
    { id: 'settings', label: 'Pengaturan Toko', icon: <Settings className="w-4 h-4 text-[#78716C]" /> },
  ];

  const handleSelectView = (view: AppActiveView) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    setSystemDropdownOpen(false);
    if (view === 'customer-menu') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#FAF7F2]/95 backdrop-blur-md shadow-sm border-b border-[#E7DFD5] py-2.5'
          : 'bg-[#FAF7F2] py-3.5 border-b border-[#EFE8DD]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo & Brand */}
          <button
            type="button"
            onClick={() => handleSelectView('customer-menu')}
            className="flex items-center gap-2.5 sm:gap-3 group text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#451A03] text-[#FAF7F2] flex items-center justify-center shadow-sm group-hover:bg-[#C2410C] transition-colors">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-[#292524]">
                  Salam Kopi
                </span>
                <span className="text-[10px] font-semibold text-[#C2410C] uppercase tracking-widest hidden sm:inline-block">
                  Kedai & POS
                </span>
              </div>
              <p className="text-[11px] text-[#78716C] -mt-0.5 hidden sm:block">
                Kopi Nusantara & Sistem Toko Terpadu
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2">
            
            {/* Customer Storefront / Menu */}
            <button
              type="button"
              onClick={() => handleSelectView('customer-menu')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeView === 'customer-menu'
                  ? 'bg-[#451A03] text-white shadow-xs'
                  : 'text-[#57534E] hover:text-[#C2410C] hover:bg-[#EFE8DD]'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Menu Kopi</span>
            </button>

            {/* Required 6 Integrated Modules */}
            {systemModules.map((mod) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => handleSelectView(mod.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeView === mod.id
                    ? 'bg-[#451A03] text-white shadow-xs'
                    : 'text-[#57534E] hover:text-[#C2410C] hover:bg-[#EFE8DD]'
                }`}
              >
                {mod.icon}
                <span>{mod.label}</span>
                {mod.badge && (
                  <span className="text-[9px] font-bold bg-[#DC2626] text-white px-1.5 py-0.2 rounded-full animate-pulse">
                    {mod.badge}
                  </span>
                )}
              </button>
            ))}

          </nav>

          {/* Right Action: Low Stock Alert + Active Staff + Cart */}
          <div className="flex items-center gap-2">
            
            {/* Low stock alert badge button */}
            {lowStockItems.length > 0 && (
              <button
                type="button"
                onClick={() => handleSelectView('warehouse')}
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 text-[11px] font-bold border border-red-300 transition-colors cursor-pointer"
                title={`${lowStockItems.length} stok menipis`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-bounce" />
                <span>{lowStockItems.length} Stok Menipis</span>
              </button>
            )}

            {/* Current Staff Badge */}
            <button
              type="button"
              onClick={() => handleSelectView('staff-access')}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#EFE8DD] hover:bg-[#E7DFD5] rounded-xl text-xs text-[#44403C] transition-colors cursor-pointer"
              title="Ganti Sesi Staf"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold truncate max-w-[90px]">{currentStaffUser.name.split(' ')[0]}</span>
              <span className="text-[10px] text-[#78716C]">({currentStaffUser.role})</span>
            </button>

            {/* Theme Toggle Button (Dark / Light) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-[#EFE8DD] dark:bg-[#2A1910] hover:bg-[#E7DFD5] dark:hover:bg-[#382216] text-[#44403C] dark:text-[#FAF7F2] border border-[#D7C4B7] dark:border-[#382216] transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
              title={theme === 'dark' ? 'Beralih ke Mode Terang (Siang)' : 'Beralih ke Mode Gelap (Malam)'}
              aria-label="Ganti Mode Gelap/Terang"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden xl:inline text-xs font-bold text-[#FAF7F2]">Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#78716C]" />
                  <span className="hidden xl:inline text-xs font-bold text-[#44403C]">Gelap</span>
                </>
              )}
            </button>

            {/* Cart Button (for Customer view) */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 bg-[#451A03] hover:bg-[#290E02] text-white px-3 py-2 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
              aria-label={`Keranjang belanja, ${cartCount} item`}
            >
              <ShoppingBag className="w-4 h-4 text-[#FDE68A]" />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold leading-tight">
                  {cartCount > 0 ? `${cartCount} Item` : 'Keranjang'}
                </span>
                {cartTotal > 0 && (
                  <span className="text-[10px] text-[#FDE68A] font-mono leading-none">
                    Rp {cartTotal.toLocaleString('id-ID')}
                  </span>
                )}
              </div>
              {cartCount > 0 && (
                <span className="sm:hidden w-5 h-5 bg-[#C2410C] text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#57534E] hover:bg-[#EFE8DD] transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>

          </div>

        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-[#E7DFD5] pb-2 space-y-2">
            
            {/* Mobile Theme Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#EFE8DD] dark:bg-[#2A1910] border border-[#D7C4B7] dark:border-[#382216]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#44403C] dark:text-[#EFE8DD]">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-[#FDE68A]" /> : <Sun className="w-4 h-4 text-amber-600" />}
                <span>Mode: {theme === 'dark' ? 'Gelap (Malam)' : 'Terang (Siang)'}</span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-lg bg-[#451A03] dark:bg-[#3D2418] text-[#FAF7F2] text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ganti Terang</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[#FDE68A]" />
                    <span>Ganti Gelap</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSelectView('customer-menu')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                activeView === 'customer-menu' ? 'bg-[#451A03] text-white' : 'text-[#44403C] hover:bg-[#EFE8DD]'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Menu Kopi (Katalog Pelanggan)</span>
            </button>

            {systemModules.map((mod) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => handleSelectView(mod.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                  activeView === mod.id ? 'bg-[#451A03] text-white' : 'text-[#44403C] hover:bg-[#EFE8DD]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {mod.icon}
                  <span>{mod.label}</span>
                </div>
                {mod.badge && (
                  <span className="text-[10px] font-bold bg-[#DC2626] text-white px-2 py-0.5 rounded-full">
                    {mod.badge}
                  </span>
                )}
              </button>
            ))}

          </div>
        )}

      </div>
    </header>
  );
};
