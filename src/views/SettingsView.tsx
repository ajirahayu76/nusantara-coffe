import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../types/index.ts';
import { apiFetch } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { useRealtime } from '../context/RealtimeContext.tsx';
import {
  Settings,
  Store,
  Printer,
  CreditCard,
  Percent,
  CheckCircle2,
  Save,
  Sun,
  Moon,
  Coffee,
  Building,
  QrCode,
  Shield,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useRealtime();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'Kopi Nusantara',
    storeTagline: 'Cita Rasa Asli Kopi Indonesia',
    storeAddress: 'Jl. Malioboro No. 45, Danurejan, Yogyakarta 55213',
    storePhone: '+62 812-8899-7700',
    storeEmail: 'kontak@kopinusantara.id',
    taxPercentage: '0',
    invoicePrefix: 'KN-',
    minStockAlertDefault: 5,
    receiptHeader: 'KOPI NUSANTARA INDONESIA\nSpecialty Coffee & Roastery',
    receiptFooter: 'Terima kasih atas kunjungan Anda!\nKritik & saran: @kopinusantara.id',
    printerWidth: '80mm',
    enableQris: true,
    enableCash: true,
    enableTransfer: true,
    bankName: 'Bank Central Asia (BCA)',
    bankAccountNumber: '8830-1928-3341',
    bankAccountHolder: 'PT Kopi Nusantara Jaya',
    qrisMerchantName: 'KOPI NUSANTARA INDONESIA',
    qrisNmid: 'ID1020039482019',
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<StoreSettings>('/settings');
      if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRole('owner')) {
      showToast('error', 'Akses Ditolak', 'Hanya Owner/Admin yang dapat mengubah pengaturan toko.');
      return;
    }

    setSaving(true);
    try {
      const updated = await apiFetch<StoreSettings>('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSettings(updated);
      showToast('success', 'Pengaturan Disimpan', 'Konfigurasi toko dan printer berhasil diperbarui.');
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-stone-400 text-sm">
        Memuat konfigurasi toko...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Pengaturan Toko &amp; Sistem
          </h2>
          <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Konfigurasi profil toko, printer struk, pajak, QRIS, dan metode pembayaran
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md shadow-amber-900/20 transition active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Section 1: Profil Toko */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100 dark:border-stone-800">
            <Store className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Identitas &amp; Informasi Toko
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Nama Toko *
              </label>
              <input
                type="text"
                required
                value={settings.storeName}
                onChange={e => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Slogan / Tagline
              </label>
              <input
                type="text"
                value={settings.storeTagline || ''}
                onChange={e => setSettings({ ...settings, storeTagline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Alamat Lengkap Toko
              </label>
              <input
                type="text"
                value={settings.storeAddress || ''}
                onChange={e => setSettings({ ...settings, storeAddress: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Nomor Telepon
              </label>
              <input
                type="text"
                value={settings.storePhone || ''}
                onChange={e => setSettings({ ...settings, storePhone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Email Toko
              </label>
              <input
                type="email"
                value={settings.storeEmail || ''}
                onChange={e => setSettings({ ...settings, storeEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pajak, Faktur & Stok Minimum */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100 dark:border-stone-800">
            <Percent className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Pajak, Penomoran Faktur &amp; Peringatan Stok
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Pajak PPN (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.taxPercentage}
                onChange={e => setSettings({ ...settings, taxPercentage: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
              />
              <p className="text-[10px] text-stone-400 mt-0.5">Isi 0 jika tidak mengenakan PPN</p>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Prefix Nomor Faktur
              </label>
              <input
                type="text"
                value={settings.invoicePrefix}
                onChange={e => setSettings({ ...settings, invoicePrefix: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-mono"
              />
              <p className="text-[10px] text-stone-400 mt-0.5">contoh: KN- (KN-20261103-0001)</p>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Batas Minimum Stok Default
              </label>
              <input
                type="number"
                min="1"
                value={settings.minStockAlertDefault}
                onChange={e =>
                  setSettings({ ...settings, minStockAlertDefault: Number(e.target.value) || 5 })
                }
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
              />
              <p className="text-[10px] text-stone-400 mt-0.5">Trigger notifikasi stok menipis</p>
            </div>
          </div>
        </div>

        {/* Section 3: Pengaturan Printer Thermal & Struk */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100 dark:border-stone-800">
            <Printer className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Format Struk &amp; Printer Thermal
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Lebar Kertas Printer Thermal
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, printerWidth: '58mm' })}
                  className={`flex-1 py-2 px-3 rounded-xl border text-center font-semibold transition ${
                    settings.printerWidth === '58mm'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  58mm (Kecil / Mobile POS)
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, printerWidth: '80mm' })}
                  className={`flex-1 py-2 px-3 rounded-xl border text-center font-semibold transition ${
                    settings.printerWidth === '80mm'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  80mm (Standar Desktop Kasir)
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Header Struk
              </label>
              <textarea
                rows={2}
                value={settings.receiptHeader || ''}
                onChange={e => setSettings({ ...settings, receiptHeader: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Footer Ucapan Terima Kasih pada Struk
              </label>
              <textarea
                rows={2}
                value={settings.receiptFooter || ''}
                onChange={e => setSettings({ ...settings, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Metode Pembayaran (Tunai, QRIS & Transfer Bank) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100 dark:border-stone-800">
            <CreditCard className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Konfigurasi Pembayaran &amp; QRIS
            </h3>
          </div>

          <div className="space-y-4">
            {/* Toggles */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableCash}
                  onChange={e => setSettings({ ...settings, enableCash: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-semibold text-stone-700 dark:text-stone-300">Aktifkan Tunai</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableQris}
                  onChange={e => setSettings({ ...settings, enableQris: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-semibold text-stone-700 dark:text-stone-300">Aktifkan QRIS</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableTransfer}
                  onChange={e => setSettings({ ...settings, enableTransfer: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-semibold text-stone-700 dark:text-stone-300">Aktifkan Transfer Bank</span>
              </label>
            </div>

            {/* QRIS Merchant & NMID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nama Merchant QRIS (National Standard)
                </label>
                <input
                  type="text"
                  value={settings.qrisMerchantName || ''}
                  onChange={e => setSettings({ ...settings, qrisMerchantName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  NMID QRIS
                </label>
                <input
                  type="text"
                  value={settings.qrisNmid || ''}
                  onChange={e => setSettings({ ...settings, qrisNmid: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-mono"
                />
              </div>

              {/* Bank Account Details */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nama Bank
                </label>
                <input
                  type="text"
                  value={settings.bankName || ''}
                  onChange={e => setSettings({ ...settings, bankName: e.target.value })}
                  placeholder="BCA / Mandiri / BNI"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  value={settings.bankAccountNumber || ''}
                  onChange={e => setSettings({ ...settings, bankAccountNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Atas Nama Pemilik Rekening
                </label>
                <input
                  type="text"
                  value={settings.bankAccountHolder || ''}
                  onChange={e => setSettings({ ...settings, bankAccountHolder: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Tampilan Tema */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Tema Tampilan Aplikasi
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Pilihan tema tersimpan secara otomatis di peramban pengguna.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-200"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Mode Gelap (Aktif)</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-stone-600" />
                <span>Mode Terang (Aktif)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
