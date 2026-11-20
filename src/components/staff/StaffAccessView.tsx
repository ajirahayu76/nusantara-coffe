import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  UserCheck,
  Plus,
  Key,
  Check,
  X,
  Lock,
  Smartphone,
  Mail,
  UserPlus,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { StaffUser, StaffRole } from '../../types';

export const StaffAccessView: React.FC = () => {
  const { staffUsers, currentStaffUser, setCurrentStaffUser, addStaffUser, updateStaffUser } = useStore();

  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('barista');
  const [pin, setPin] = useState('1234');

  const roleTitles: Record<StaffRole, string> = {
    owner: 'Pemilik Toko (Owner)',
    manager: 'Manajer Kedai',
    barista: 'Barista & Kasir',
    warehouse: 'Staf Gudang & Logistik',
  };

  const getRoleBadgeClass = (r: StaffRole) => {
    switch (r) {
      case 'owner':
        return 'bg-[#451A03] text-white';
      case 'manager':
        return 'bg-[#0284C7] text-white';
      case 'barista':
        return 'bg-[#C2410C] text-white';
      case 'warehouse':
        return 'bg-[#16A34A] text-white';
    }
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addStaffUser({
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@salamkopi.id`,
      phone: phone || '0812-0000-0000',
      role,
      pin: pin || '1234',
      status: 'active',
      lastLogin: 'Baru ditambahkan',
      permissions: {
        canAccessPos: role === 'owner' || role === 'manager' || role === 'barista',
        canAccessWarehouse: role === 'owner' || role === 'manager' || role === 'warehouse',
        canAdjustStock: role === 'owner' || role === 'manager' || role === 'warehouse',
        canAccessReports: role === 'owner' || role === 'manager',
        canAccessFinancials: role === 'owner' || role === 'manager',
        canManageStaff: role === 'owner',
        canManageSettings: role === 'owner',
      },
    });

    setIsAddStaffOpen(false);
    setName('');
    setEmail('');
    setPhone('');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FAF7F2] p-4 sm:p-6 text-[#292524] space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E7DFD5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-[#292524]">
              Hak Akses & Manajemen Staf Toko
            </h1>
            <span className="text-[10px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
              Role-Based Access Control (RBAC)
            </span>
          </div>
          <p className="text-xs text-[#78716C] mt-0.5">
            Atur kewenangan setiap karyawan: Kasir POS, Gudang Warehouse, Laporan Penjualan, dan Finansial.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddStaffOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#451A03] hover:bg-[#2A0E02] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-[#FDE68A]" />
          <span>Tambah Akun Staf Baru</span>
        </button>
      </div>

      {/* Active User Switcher / Simulator Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E7DFD5] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFEDD5] text-[#C2410C] flex items-center justify-center font-bold font-serif text-lg">
            {currentStaffUser.name.charAt(0)}
          </div>
          <div>
            <div className="text-[11px] uppercase font-bold text-[#78716C]">
              Sesi Login Aktif Sekarang:
            </div>
            <div className="font-bold text-sm text-[#292524] flex items-center gap-2">
              <span>{currentStaffUser.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getRoleBadgeClass(currentStaffUser.role)}`}>
                {roleTitles[currentStaffUser.role]}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Role Switcher Buttons for Testing */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] text-[#78716C] font-semibold mr-1">Ganti Sesi Cepat:</span>
          {staffUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => setCurrentStaffUser(user)}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                currentStaffUser.id === user.id
                  ? 'border-[#C2410C] bg-[#FFEDD5] text-[#451A03] font-bold shadow-2xs'
                  : 'border-[#D7C4B7] bg-[#FAF7F2] text-[#57534E] hover:border-[#C2410C]'
              }`}
            >
              {user.name.split(' ')[0]} ({user.role})
            </button>
          ))}
        </div>
      </div>

      {/* Staff User Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {staffUsers.map((user) => (
          <div
            key={user.id}
            className={`bg-white rounded-2xl border p-4 shadow-2xs space-y-3 flex flex-col justify-between ${
              currentStaffUser.id === user.id ? 'border-[#C2410C] ring-2 ring-[#C2410C]/20' : 'border-[#E7DFD5]'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getRoleBadgeClass(user.role)}`}>
                  {roleTitles[user.role]}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Aktif"></span>
              </div>

              <div>
                <h3 className="font-serif font-bold text-sm text-[#292524]">{user.name}</h3>
                <div className="text-[11px] text-[#78716C] flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 text-[#A8A29E]" />
                  <span>{user.email}</span>
                </div>
                <div className="text-[11px] text-[#78716C] flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-[#A8A29E]" />
                  <span>{user.phone}</span>
                </div>
              </div>

              {/* Permissions Checklist */}
              <div className="pt-2 border-t border-[#F5EFE6] space-y-1 text-[11px]">
                <div className="text-[10px] font-bold uppercase text-[#78716C] mb-1">Izin Akses Sistem:</div>
                <div className="flex items-center justify-between text-[#57534E]">
                  <span>Kasir (POS)</span>
                  {user.permissions.canAccessPos ? <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                </div>
                <div className="flex items-center justify-between text-[#57534E]">
                  <span>Gudang & Stok</span>
                  {user.permissions.canAccessWarehouse ? <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                </div>
                <div className="flex items-center justify-between text-[#57534E]">
                  <span>Laporan & Finansial</span>
                  {user.permissions.canAccessFinancials ? <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                </div>
                <div className="flex items-center justify-between text-[#57534E]">
                  <span>Kelola Akun Staf</span>
                  {user.permissions.canManageStaff ? <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#EFE8DD] flex items-center justify-between text-[11px] text-[#78716C]">
              <span>PIN Kasir: ••••</span>
              <button
                type="button"
                onClick={() => setCurrentStaffUser(user)}
                className="text-xs font-semibold text-[#C2410C] hover:underline"
              >
                Pilih Akun Ini
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white rounded-2xl border border-[#E7DFD5] p-5 shadow-xs space-y-3">
        <h3 className="font-serif font-bold text-base text-[#292524]">
          Matriks Kewenangan Pengguna (Security Access Matrix)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[#78716C] uppercase text-[10px] tracking-wider border-y border-[#E7DFD5]">
              <tr>
                <th className="py-2.5 px-3">Modul & Fitur</th>
                <th className="py-2.5 px-3 text-center">Pemilik Toko (Owner)</th>
                <th className="py-2.5 px-3 text-center">Manajer Kedai</th>
                <th className="py-2.5 px-3 text-center">Barista & Kasir</th>
                <th className="py-2.5 px-3 text-center">Staf Gudang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8DD]">
              <tr>
                <td className="py-2.5 px-3 font-medium">Buka Kasir POS & Transaksi</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Akses Penuh</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Akses Penuh</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Akses Utama</td>
                <td className="py-2.5 px-3 text-center text-slate-400">✗ Tidak Ada</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium">Lihat Stok Gudang (Warehouse)</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Akses Penuh</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Akses Penuh</td>
                <td className="py-2.5 px-3 text-center text-amber-600">Terbatas (Hanya Indikator POS)</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Akses Utama</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium">Restock & Penyesuaian Opname</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-slate-400">✗</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium">Laporan Penjualan & Ekspor Excel/PDF</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-slate-400">✗</td>
                <td className="py-2.5 px-3 text-center text-slate-400">✗</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium">Dasbor Finansial & Grafik Omzet Owner</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Khusus Owner</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓</td>
                <td className="py-2.5 px-3 text-center text-slate-400">✗</td>
                <td className="py-2.5 px-3 text-center text-slate-400">✗</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-[#D7C4B7] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DD]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#C2410C]" />
                <h3 className="font-serif font-bold text-base text-[#292524]">
                  Tambah Staf Kedai Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="text-[#78716C] hover:text-[#292524]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#57534E] mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Maya Anggraeni"
                  className="w-full p-2.5 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#57534E] mb-1">Peran / Jabatan (Role) *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  className="w-full p-2.5 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2] font-semibold"
                >
                  <option value="barista">Barista & Kasir</option>
                  <option value="warehouse">Staf Gudang & Logistik</option>
                  <option value="manager">Manajer Kedai</option>
                  <option value="owner">Pemilik Toko (Owner)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#57534E] mb-1">Nomor HP / WhatsApp</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full p-2 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#57534E] mb-1">PIN Kasir (4 Digit)</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="1234"
                    className="w-full p-2 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2] font-mono text-center font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFE8DD]">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D7C4B7] text-xs font-semibold hover:bg-[#FAF7F2]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#451A03] hover:bg-[#2A0E02] text-white text-xs font-semibold shadow-xs"
                >
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
