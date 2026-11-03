import React, { useState, useEffect } from 'react';
import { User, ActivityLog } from '../types/index.ts';
import { apiFetch } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useRealtime } from '../context/RealtimeContext.tsx';
import {
  Users2,
  UserPlus,
  Shield,
  ShieldCheck,
  Edit2,
  Power,
  KeyRound,
  History,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Search,
} from 'lucide-react';

export const StaffView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useRealtime();

  const [staffList, setStaffList] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<'staff' | 'logs'>('staff');
  const [loading, setLoading] = useState(true);

  // Modal Add / Edit Staff
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'cashier',
    email: '',
    phone: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, logsData] = await Promise.all([
        apiFetch<User[]>('/staff'),
        apiFetch<ActivityLog[]>('/activity-logs'),
      ]);
      setStaffList(usersData);
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to load staff data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setEditingStaff(null);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      role: 'cashier',
      email: '',
      phone: '',
    });
    setShowModal(true);
  };

  const openEdit = (s: User) => {
    setEditingStaff(s);
    setFormData({
      username: s.username,
      password: '', // leave empty to not change
      fullName: s.fullName,
      role: s.role,
      email: s.email || '',
      phone: s.phone || '',
    });
    setShowModal(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await apiFetch(`/staff/${editingStaff.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        showToast('success', 'Staf Diperbarui', `Data staf [${formData.fullName}] berhasil disimpan.`);
      } else {
        await apiFetch('/staff', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        showToast('success', 'Staf Ditambahkan', `Akun staf [${formData.fullName}] berhasil dibuat dengan password terenkripsi.`);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    }
  };

  const handleToggleActive = async (s: User) => {
    try {
      await apiFetch(`/staff/${s.id}/toggle`, {
        method: 'PUT',
      });
      showToast('info', 'Status Akun Diubah', `Akun [${s.fullName}] telah ${s.isActive ? 'dinonaktifkan' : 'diaktifkan kembali'}.`);
      loadData();
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return { label: 'Owner / Admin', desc: 'Akses penuh ke seluruh menu & sistem', bg: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300' };
      case 'manager':
        return { label: 'Manajer Operasional', desc: 'Akses dasbor, stok gudang & laporan', bg: 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300' };
      case 'cashier':
        return { label: 'Kasir POS', desc: 'Akses kasir POS & riwayat struk penjualan', bg: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300' };
      default:
        return { label: role, desc: 'Staf Toko', bg: 'bg-stone-100 text-stone-800' };
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Hak Akses Staf &amp; Audit Pengguna
          </h2>
          <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Manajemen akun Owner, Manajer, Kasir, dan jejak audit aktivitas sistem
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md shadow-amber-900/20 transition active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Staf Baru</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 transition flex items-center gap-2 ${
            activeTab === 'staff'
              ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600'
              : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>Daftar Staf ({staffList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 transition flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600'
              : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Jejak Audit Aktivitas ({logs.length})</span>
        </button>
      </div>

      {/* TAB 1: STAFF LIST */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map(s => {
            const roleInfo = getRoleBadge(s.role);
            const isMe = currentUser?.id === s.id;

            return (
              <div
                key={s.id}
                className={`p-5 rounded-3xl bg-white dark:bg-stone-900 border transition shadow-xs flex flex-col justify-between ${
                  !s.isActive
                    ? 'opacity-60 border-stone-200 dark:border-stone-800'
                    : 'border-stone-200 dark:border-stone-800 hover:border-amber-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-800 text-amber-100 font-bold text-base flex items-center justify-center shrink-0 shadow-sm">
                        {s.fullName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                          <span>{s.fullName}</span>
                          {isMe && (
                            <span className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-1.5 py-0.2 rounded font-medium">
                              (Anda)
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-stone-400 font-mono">@{s.username}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        s.isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {s.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-lg ${roleInfo.bg}`}>
                      {roleInfo.label}
                    </span>
                    <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                      {roleInfo.desc}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-stone-600 dark:text-stone-400 pt-3 border-t border-stone-100 dark:border-stone-800">
                    {s.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        <span className="truncate">{s.email}</span>
                      </div>
                    )}
                    {s.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        <span>{s.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs font-semibold">
                  <button
                    onClick={() => openEdit(s)}
                    className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 hover:text-amber-600 py-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Ubah Profil</span>
                  </button>

                  {!isMe && (
                    <button
                      onClick={() => handleToggleActive(s)}
                      className={`flex items-center gap-1 py-1 px-2 rounded-lg transition ${
                        s.isActive
                          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                          : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{s.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-200 dark:border-stone-800">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Audit Trail Sistem Operasional Kopi Nusantara
            </h3>
            <p className="text-xs text-stone-500">Mencatat setiap aksi staf secara kronologis</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Nama Staf</th>
                  <th className="py-3 px-4 text-center">Tipe Aksi</th>
                  <th className="py-3 px-4">Rincian Perubahan</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-stone-400">
                      Belum ada catatan aktivitas.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                      <td className="py-2.5 px-4 text-stone-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('id-ID', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-stone-900 dark:text-stone-100">
                        {log.userName}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-stone-700 dark:text-stone-300">
                        {log.details || '-'}
                      </td>
                      <td className="py-2.5 px-4 text-stone-400 font-mono text-[11px]">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT USER */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                {editingStaff ? 'Ubah Akun Staf' : 'Tambah Staf Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="contoh: Rina Melati"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingStaff}
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  placeholder="rina_kasir"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  {editingStaff ? 'Kata Sandi Baru (Kosongkan jika tidak diubah)' : 'Kata Sandi *'}
                </label>
                <input
                  type="password"
                  required={!editingStaff}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                />
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Tersimpan dalam bentuk hash Bcrypt aman di database.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Role / Tingkat Akses
                </label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-medium"
                >
                  <option value="cashier">Kasir POS (Hanya POS &amp; Cetak Struk)</option>
                  <option value="manager">Manajer (Dasbor, Stok Gudang, Laporan Penjualan)</option>
                  <option value="owner">Owner / Admin (Seluruh Akses &amp; Pengaturan)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@kopinusantara.id"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    No Telepon
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-500 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold"
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
