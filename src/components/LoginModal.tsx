import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Coffee, KeyRound, Sparkles, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { loginStaff, loginGoogle } = useAuth();
  const [username, setUsername] = useState('owner');
  const [password, setPassword] = useState('kopi123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginTab, setLoginTab] = useState<'staff' | 'google'>('staff');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginStaff(username, password);
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginGoogle();
    } catch (err: any) {
      setError(err.message || 'Login Google gagal. Pastikan popup tidak diblokir browser.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredential = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background coffee vibe ambient gradients */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-900/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-stone-100">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-800 mx-auto flex items-center justify-center text-white shadow-xl shadow-amber-900/30 mb-3">
            <Coffee className="w-7 h-7 text-amber-200" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Kopi Nusantara</h2>
          <p className="text-xs text-stone-400 mt-1">
            Sistem Inventaris Toko &amp; Kasir (Point of Sale)
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-stone-800/80 p-1 rounded-xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLoginTab('staff')}
            className={`flex-1 py-2 rounded-lg transition ${
              loginTab === 'staff'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Masuk Akun Staf
          </button>
          <button
            type="button"
            onClick={() => setLoginTab('google')}
            className={`flex-1 py-2 rounded-lg transition ${
              loginTab === 'google'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Google Sign-In
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {loginTab === 'staff' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Username Staf
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="contoh: owner, manajer, kasir1"
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Kata Sandi
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-sm shadow-lg shadow-amber-900/30 transition active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Memeriksa Kredensial...' : 'Masuk ke Sistem'}
            </button>

            {/* Quick Demo Selector */}
            <div className="pt-4 border-t border-stone-800 text-center">
              <p className="text-[11px] text-stone-400 uppercase tracking-wider mb-2 font-medium">
                Pilih Akun Demo Cepat:
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setDemoCredential('owner', 'kopi123')}
                  className={`p-2 rounded-xl border text-left transition ${
                    username === 'owner'
                      ? 'border-amber-500 bg-amber-950/40 text-amber-200'
                      : 'border-stone-800 bg-stone-800/40 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <p className="font-semibold text-[11px]">Owner</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">Semua Akses</p>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredential('manajer', 'kopi123')}
                  className={`p-2 rounded-xl border text-left transition ${
                    username === 'manajer'
                      ? 'border-blue-500 bg-blue-950/40 text-blue-200'
                      : 'border-stone-800 bg-stone-800/40 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <p className="font-semibold text-[11px]">Manajer</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">Stok &amp; Laporan</p>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredential('kasir1', 'kopi123')}
                  className={`p-2 rounded-xl border text-left transition ${
                    username === 'kasir1'
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                      : 'border-stone-800 bg-stone-800/40 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <p className="font-semibold text-[11px]">Kasir</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">POS &amp; Struk</p>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-4 py-3 text-center">
            <p className="text-xs text-stone-300 leading-relaxed">
              Gunakan akun Google Anda untuk masuk melalui Firebase Authentication yang terintegrasi langsung dengan database PostgreSQL Kopi Nusantara.
            </p>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-semibold text-sm flex items-center justify-center gap-3 shadow-lg transition active:scale-98 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Menghubungkan...' : 'Masuk dengan Akun Google'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
