import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { useRealtime } from '../context/RealtimeContext.tsx';
import {
  Coffee,
  Bell,
  Sun,
  Moon,
  User as UserIcon,
  LogOut,
  Radio,
  CheckCircle2,
  Menu,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, activeTab }) => {
  const { user, logout, switchDemoUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    isConnected,
    unreadNotificationsCount,
    notifications,
    markAsRead,
    markAllAsRead,
  } = useRealtime();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner':
        return { label: 'Owner / Admin', bg: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700' };
      case 'manager':
        return { label: 'Manajer Toko', bg: 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700' };
      case 'cashier':
        return { label: 'Kasir POS', bg: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' };
      default:
        return { label: role || 'Staf', bg: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300 border-stone-300' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <header className="h-16 border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-700 to-amber-950 flex items-center justify-center text-amber-100 shadow-md shadow-amber-900/20">
            <Coffee className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-stone-900 dark:text-stone-100 leading-tight flex items-center gap-1.5">
              <span>Kopi Nusantara</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800">
                POS &amp; INV
              </span>
            </h1>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 hidden sm:block">
              Sistem Terintegrasi Toko &amp; Gudang Kopi
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Realtime status indicator */}
        <div
          title={isConnected ? 'Sinkronisasi Real-time Aktif' : 'Menghubungkan ke Server Real-time...'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
            isConnected
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 animate-pulse'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="hidden md:inline">{isConnected ? 'Live Sync' : 'Menyambung...'}</span>
        </div>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent hover:border-stone-200 dark:hover:border-stone-700 transition"
          title={`Beralih ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowUserDropdown(false);
            }}
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent hover:border-stone-200 dark:hover:border-stone-700 transition relative"
            title="Notifikasi Sistem"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-sm text-stone-900 dark:text-stone-100">Notifikasi</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-medium">
                      {unreadNotificationsCount} baru
                    </span>
                  )}
                </div>
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-medium"
                  >
                    Tandai semua dibaca
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-stone-100 dark:divide-stone-800">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-stone-400 text-xs">
                    Belum ada notifikasi baru.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`pt-2 pb-2 px-2.5 rounded-xl cursor-pointer transition text-left ${
                        notif.isRead
                          ? 'opacity-70 hover:opacity-100 hover:bg-stone-50 dark:hover:bg-stone-800/50'
                          : 'bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-xs text-stone-800 dark:text-stone-200">
                          {notif.title}
                        </span>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-stone-400 mt-1 block">
                        {new Date(notif.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown with fast role switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotifDropdown(false);
            }}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 transition"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-800 text-amber-100 font-semibold text-xs flex items-center justify-center">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 leading-tight">
                {user?.fullName || 'Pengguna'}
              </p>
              <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium inline-block mt-0.5 ${roleInfo.bg}`}>
                {roleInfo.label}
              </span>
            </div>
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl p-4 z-50">
              <div className="border-b border-stone-100 dark:border-stone-800 pb-3 mb-3">
                <p className="font-semibold text-sm text-stone-900 dark:text-stone-100">{user?.fullName}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">@{user?.username} ({roleInfo.label})</p>
              </div>

              {/* Quick Staff Switcher for testing all 3 roles seamlessly */}
              <div className="mb-3">
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  Ganti Hak Akses (Demo)
                </p>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <button
                    onClick={() => {
                      switchDemoUser('owner');
                      setShowUserDropdown(false);
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-center font-medium transition ${
                      user?.role === 'owner'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    Owner
                  </button>
                  <button
                    onClick={() => {
                      switchDemoUser('manager');
                      setShowUserDropdown(false);
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-center font-medium transition ${
                      user?.role === 'manager'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    Manajer
                  </button>
                  <button
                    onClick={() => {
                      switchDemoUser('cashier');
                      setShowUserDropdown(false);
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-center font-medium transition ${
                      user?.role === 'cashier'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    Kasir
                  </button>
                </div>
              </div>

              <div className="border-t border-stone-100 dark:border-stone-800 pt-3">
                <button
                  onClick={() => {
                    logout();
                    setShowUserDropdown(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar dari Sistem</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
