import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api.ts';
import { useRealtime } from '../context/RealtimeContext.tsx';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Boxes,
  AlertTriangle,
  Award,
  Calendar,
  ArrowUpRight,
  RefreshCw,
  Clock,
  User,
  Coffee,
} from 'lucide-react';

interface DashboardData {
  revenueToday: number;
  transactionsToday: number;
  revenueMonth: number;
  totalRevenue: number;
  totalProfit: number;
  totalProducts: number;
  lowStockCount: number;
  lowStockProducts: any[];
  recentSales: any[];
  recentActivities: any[];
  topItems: any[];
  dailyChart: { date: string; label: string; revenue: number; transactions: number }[];
  monthlyChart: { month: string; label: string; revenue: number }[];
}

export const DashboardView: React.FC<{ onNavigateToInventory: () => void }> = ({
  onNavigateToInventory,
}) => {
  const { lastEvent } = useRealtime();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<'daily' | 'monthly'>('daily');
  const [filterRange, setFilterRange] = useState<'all' | 'today' | '7days' | 'month'>('all');

  const fetchDashboard = async () => {
    try {
      const res = await apiFetch<DashboardData>('/reports/dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Auto-refresh when new transaction or stock update is broadcast via real-time SSE
  useEffect(() => {
    if (
      lastEvent?.type === 'TRANSACTION_CREATED' ||
      lastEvent?.type === 'TRANSACTION_CANCELLED' ||
      lastEvent?.type === 'STOCK_UPDATED' ||
      lastEvent?.type === 'PRODUCT_CREATED'
    ) {
      fetchDashboard();
    }
  }, [lastEvent]);

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-stone-400">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
          <p className="text-sm">Memuat Dasbor Finansial Kopi Nusantara...</p>
        </div>
      </div>
    );
  }

  const chartData = chartMode === 'daily' ? (data?.dailyChart || []) : (data?.monthlyChart || []);
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 100000);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Dasbor Finansial &amp; Performa Toko
          </h2>
          <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Ikhtisar pendapatan real-time, stok menipis, dan tren penjualan Kopi Nusantara
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700/60 transition shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Perbarui Data</span>
        </button>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Pendapatan Hari Ini */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Hari Ini</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg md:text-xl font-bold text-stone-900 dark:text-stone-100">
            Rp {(data?.revenueToday || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            {data?.transactionsToday || 0} transaksi
          </div>
        </div>

        {/* 2. Pendapatan Bulan Ini */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Bulan Ini</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg md:text-xl font-bold text-stone-900 dark:text-stone-100">
            Rp {(data?.revenueMonth || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span>Omset Berjalan</span>
          </div>
        </div>

        {/* 3. Total Keuntungan (Laba Bersih) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Keuntungan</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg md:text-xl font-bold text-indigo-600 dark:text-indigo-400">
            Rp {(data?.totalProfit || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Setelah dikurangi HPP
          </div>
        </div>

        {/* 4. Jumlah Transaksi */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Transaksi Hari Ini</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg md:text-xl font-bold text-stone-900 dark:text-stone-100">
            {data?.transactionsToday || 0}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Faktur selesai
          </div>
        </div>

        {/* 5. Total Produk */}
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Produk</span>
            <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg md:text-xl font-bold text-stone-900 dark:text-stone-100">
            {data?.totalProducts || 0}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            SKU terdaftar
          </div>
        </div>

        {/* 6. Stok Menipis Warning Card */}
        <div
          onClick={onNavigateToInventory}
          className={`p-4 rounded-2xl border shadow-xs cursor-pointer transition ${
            (data?.lowStockCount || 0) > 0
              ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider">Stok Menipis</span>
            <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg md:text-xl font-bold text-orange-600 dark:text-orange-400">
            {data?.lowStockCount || 0}
          </div>
          <div className="text-[11px] text-orange-700 dark:text-orange-400 font-medium mt-1 flex items-center gap-1">
            <span>Periksa Gudang</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Main Charts & Top Products Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart (2 cols) */}
        <div className="lg:col-span-2 p-5 md:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                Grafik Pendapatan Penjualan
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Data transaksi aktual yang tersimpan di PostgreSQL
              </p>
            </div>

            {/* Switch Daily / Monthly */}
            <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                onClick={() => setChartMode('daily')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  chartMode === 'daily'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                7 Hari Terakhir
              </button>
              <button
                onClick={() => setChartMode('monthly')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  chartMode === 'monthly'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                6 Bulan Terakhir
              </button>
            </div>
          </div>

          {/* SVG Bar Visualizer */}
          <div className="h-64 flex items-end gap-3 sm:gap-6 pt-6 border-b border-stone-100 dark:border-stone-800">
            {chartData.map((item: any, idx: number) => {
              const heightPercent = maxRevenue > 0 ? Math.min(100, Math.max(8, (item.revenue / maxRevenue) * 100)) : 8;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-stone-900 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap z-20">
                    Rp {Number(item.revenue).toLocaleString('id-ID')}
                    {item.transactions !== undefined ? ` (${item.transactions} trx)` : ''}
                  </div>

                  <div className="w-full max-w-[48px] bg-stone-100 dark:bg-stone-800 rounded-t-xl overflow-hidden h-full flex items-end">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-amber-700 to-amber-500 group-hover:from-amber-600 group-hover:to-amber-400 transition-all duration-500 rounded-t-lg"
                    />
                  </div>

                  <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 truncate max-w-[60px] text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-stone-400 pt-3">
            <span>Rp 0</span>
            <span className="text-stone-500 dark:text-stone-400">
              Puncak: Rp {maxRevenue.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Top Selling Products (1 col) */}
        <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">Produk Terlaris</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Paling banyak dipesan</p>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {(!data?.topItems || data.topItems.length === 0) ? (
              <div className="text-center py-12 text-stone-400 text-xs">
                Belum ada transaksi penjualan selesai.
              </div>
            ) : (
              data.topItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800/80"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-stone-900 dark:text-stone-100 line-clamp-1">
                        {item.productName}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        {item.totalQuantity} {item.unit} terjual
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xs text-stone-900 dark:text-stone-100">
                      Rp {Number(item.totalRevenue).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Transactions & Staff Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                Transaksi Kasir Terbaru
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">5 penjualan terakhir</p>
            </div>
            <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="space-y-2.5">
            {(!data?.recentSales || data.recentSales.length === 0) ? (
              <div className="text-center py-8 text-stone-400 text-xs">
                Belum ada transaksi tercatat.
              </div>
            ) : (
              data.recentSales.map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800/80 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {s.invoiceNumber}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        {s.paymentMethod}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Kasir: {s.cashierName} • {new Date(s.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      Rp {Number(s.totalAmount).toLocaleString('id-ID')}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-semibold uppercase">
                      {s.paymentStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Staff Activities Audit */}
        <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                Aktivitas Staf Terbaru
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Audit trail sistem operasional</p>
            </div>
            <Clock className="w-5 h-5 text-stone-400" />
          </div>

          <div className="space-y-3">
            {(!data?.recentActivities || data.recentActivities.length === 0) ? (
              <div className="text-center py-8 text-stone-400 text-xs">
                Belum ada aktivitas baru.
              </div>
            ) : (
              data.recentActivities.map((act: any) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 border-b border-stone-100 dark:border-stone-800/80 pb-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {act.userName}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(act.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
                      {act.details || act.action}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
