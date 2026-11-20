import React, { useState } from 'react';
import {
  Settings,
  Printer,
  Building,
  QrCode,
  Bell,
  CheckCircle2,
  RotateCcw,
  Save,
  Shield,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const StoreSettingsView: React.FC = () => {
  const { storeSettings, updateStoreSettings, resetToDefaultData } = useStore();

  const [formState, setFormState] = useState(storeSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings(formState);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin mereset seluruh data sistem (stok gudang, transaksi, dan akun) ke bawaan awal?')) {
      resetToDefaultData();
      alert('Data sistem berhasil direset ke bawaan awal.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FAF7F2] p-4 sm:p-6 text-[#292524] space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E7DFD5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-[#292524]">
              Pengaturan Toko & Konfigurasi Sistem
            </h1>
            <span className="text-[10px] font-bold text-[#451A03] bg-[#FFEDD5] px-2.5 py-0.5 rounded-full">
              Store Configuration
            </span>
          </div>
          <p className="text-xs text-[#78716C] mt-0.5">
            Konfigurasi identitas kedai, printer struk kasir thermal, QRIS merchant, dan parameter stok minimum.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 px-3.5 py-1.5 rounded-xl animate-fade-in shadow-2xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Pengaturan Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        
        {/* Section 1: Identitas Kedai */}
        <div className="bg-white rounded-2xl border border-[#E7DFD5] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#EFE8DD]">
            <Building className="w-5 h-5 text-[#C2410C]" />
            <h3 className="font-serif font-bold text-base text-[#292524]">
              Profil & Identitas Kedai
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[#57534E] mb-1">
                Nama Kedai / Bisnis
              </label>
              <input
                type="text"
                value={formState.storeName}
                onChange={(e) => setFormState({ ...formState, storeName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2] font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#57534E] mb-1">
                Tagline / Slogan
              </label>
              <input
                type="text"
                value={formState.tagline}
                onChange={(e) => setFormState({ ...formState, tagline: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-[#57534E] mb-1">
                Alamat Lengkap Toko (Dicetak pada Struk)
              </label>
              <input
                type="text"
                value={formState.address}
                onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#57534E] mb-1">
                Nomor Telepon / WhatsApp Kasir
              </label>
              <input
                type="text"
                value={formState.phone}
                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#57534E] mb-1">
                Email Operasional
              </label>
              <input
                type="email"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Struk Kasir & Printer Thermal */}
        <div className="bg-white rounded-2xl border border-[#E7DFD5] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#EFE8DD]">
            <Printer className="w-5 h-5 text-[#451A03]" />
            <h3 className="font-serif font-bold text-base text-[#292524]">
              Format Struk Belanja & Cetak Thermal
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#57534E] mb-1">
                  Lebar Kertas Printer Thermal
                </label>
                <select
                  value={formState.printerPaperWidth}
                  onChange={(e) => setFormState({ ...formState, printerPaperWidth: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2] font-semibold"
                >
                  <option value="58mm">58 mm (Printer Kasir Bluetooth Portable)</option>
                  <option value="80mm">80 mm (Printer Desktop POS Standar)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2]">
                <div>
                  <span className="font-bold text-[#292524] block">Cetak Struk Otomatis</span>
                  <span className="text-[10px] text-[#78716C]">Buka dialog struk otomatis setelah bayar</span>
                </div>
                <input
                  type="checkbox"
                  checked={formState.autoPrintReceipt}
                  onChange={(e) => setFormState({ ...formState, autoPrintReceipt: e.target.checked })}
                  className="w-4 h-4 accent-[#C2410C] cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#57534E] mb-1">
                Pesan Footer / Catatan Bawah Struk
              </label>
              <textarea
                rows={3}
                value={formState.receiptFooter}
                onChange={(e) => setFormState({ ...formState, receiptFooter: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2] text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Integrasi QRIS & Keamanan */}
        <div className="bg-white rounded-2xl border border-[#E7DFD5] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#EFE8DD]">
            <QrCode className="w-5 h-5 text-[#16A34A]" />
            <h3 className="font-serif font-bold text-base text-[#292524]">
              Integrasi Pembayaran QRIS Dinamis
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-[#57534E] mb-1">
                Merchant NMID QRIS Bank Indonesia
              </label>
              <input
                type="text"
                value={formState.qrisNmid}
                onChange={(e) => setFormState({ ...formState, qrisNmid: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2] font-mono font-bold"
              />
              <span className="text-[10px] text-[#78716C] mt-1 block">
                Kode identitas merchant resmi yang dipasang pada QR dinamis
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2]">
              <div>
                <span className="font-bold text-[#292524] block">Notifikasi Suara Stok Rendah</span>
                <span className="text-[10px] text-[#78716C]">Peringatan visual & audio saat persediaan kritis</span>
              </div>
              <input
                type="checkbox"
                checked={formState.lowStockAlertSound}
                onChange={(e) => setFormState({ ...formState, lowStockAlertSound: e.target.checked })}
                className="w-4 h-4 accent-[#C2410C] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-300 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Seluruh Data Toko ke Bawaan</span>
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#451A03] hover:bg-[#2A0E02] text-white text-xs sm:text-sm font-semibold shadow-md active:scale-98 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#FDE68A]" />
            <span>Simpan Perubahan Pengaturan</span>
          </button>
        </div>

      </form>

    </div>
  );
};
