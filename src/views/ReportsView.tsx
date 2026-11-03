import React, { useState, useEffect } from 'react';
import { Sale, StoreSettings } from '../types/index.ts';
import { apiFetch } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useRealtime } from '../context/RealtimeContext.tsx';
import { ReceiptModal } from '../components/ReceiptModal.tsx';
import * as XLSX from 'xlsx';
import {
  FileBarChart2,
  Calendar,
  Download,
  Printer,
  Search,
  Filter,
  Eye,
  RotateCcw,
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  Building,
  Banknote,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { lastEvent, showToast } = useRealtime();

  const [dateRange, setDateRange] = useState<'today' | '7days' | 'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [sales, setSales] = useState<Sale[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Selected sale for viewing receipt
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  // Refund / Cancel sale prompt
  const [refundingSaleId, setRefundingSaleId] = useState<number | null>(null);
  const [refundReason, setRefundReason] = useState('');

  const loadReports = async () => {
    try {
      setLoading(true);
      let queryParams = `?range=${dateRange}`;
      if (dateRange === 'custom' && startDate && endDate) {
        queryParams += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const [salesData, analyticsData, settingsData] = await Promise.all([
        apiFetch<Sale[]>(`/pos/sales${queryParams}`),
        apiFetch<any>(`/reports/analytics${queryParams}`),
        apiFetch<StoreSettings>('/settings'),
      ]);

      setSales(salesData);
      setAnalytics(analyticsData);
      setSettings(settingsData);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [dateRange, startDate, endDate]);

  // Real-time synchronization
  useEffect(() => {
    if (
      lastEvent?.type === 'TRANSACTION_CREATED' ||
      lastEvent?.type === 'TRANSACTION_CANCELLED'
    ) {
      loadReports();
    }
  }, [lastEvent]);

  // Filter sales
  const filteredSales = sales.filter(s => {
    if (selectedMethod !== 'all' && s.paymentMethod !== selectedMethod) return false;
    if (selectedStatus !== 'all' && s.paymentStatus !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.cashierName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Export to Excel (.xlsx) using xlsx library
  const handleExportExcel = () => {
    if (filteredSales.length === 0) {
      showToast('warning', 'Data Kosong', 'Tidak ada data transaksi untuk diekspor.');
      return;
    }

    const rows = filteredSales.map((s, idx) => ({
      No: idx + 1,
      'No Faktur': s.invoiceNumber,
      Tanggal: new Date(s.createdAt).toLocaleString('id-ID'),
      Kasir: s.cashierName,
      'Subtotal (Rp)': Number(s.subtotal),
      'Diskon (Rp)': Number(s.discountAmount),
      'PPN (Rp)': Number(s.taxAmount),
      'Total Akhir (Rp)': Number(s.totalAmount),
      'Total HPP (Rp)': Number(s.totalCostPrice),
      'Keuntungan Bersih (Rp)': Number(s.totalAmount) - Number(s.totalCostPrice),
      'Metode Bayar': s.paymentMethod,
      Status: s.paymentStatus,
      Catatan: s.notes || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Penjualan');

    // Auto-fit column widths
    const max_width = rows.reduce((w, r) => Math.max(w, r['No Faktur'].length), 10);
    worksheet['!cols'] = [{ wch: 6 }, { wch: max_width + 4 }, { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 25 }];

    const filename = `Laporan_Penjualan_Kopi_Nusantara_${dateRange}_${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, filename);
    showToast('success', 'Excel Berhasil Diunduh', filename);
  };

  // Printable Financial Report
  const handlePrintReport = () => {
    window.print();
  };

  // Handle Cancel / Refund transaction
  const handleConfirmRefund = async () => {
    if (!refundingSaleId) return;
    try {
      await apiFetch(`/pos/cancel/${refundingSaleId}`, {
        method: 'POST',
        body: JSON.stringify({ reason: refundReason }),
      });
      showToast('success', 'Transaksi Dibatalkan', 'Stok barang telah otomatis dikembalikan ke inventaris.');
      setRefundingSaleId(null);
      setRefundReason('');
      loadReports();
    } catch (err: any) {
      showToast('error', 'Gagal Membatalkan', err.message);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Print styling for executive report */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report-area, #printable-report-area * {
            visibility: visible;
          }
          #printable-report-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            padding: 10mm !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header & Export actions */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Laporan Finansial &amp; Penjualan
          </h2>
          <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Analisis laba bersih, metode pembayaran, kasir, dan ekspor data resmi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
            <span>Cetak / PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-900/20 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <div className="no-print p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 mr-1">
            Periode:
          </span>
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: '7days', label: '7 Hari' },
            { id: 'month', label: 'Bulan Ini' },
            { id: 'year', label: 'Tahun Ini' },
            { id: 'custom', label: 'Kustom' },
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setDateRange(r.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                dateRange === r.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {dateRange === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
            />
            <span className="text-stone-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* Area to print */}
      <div id="printable-report-area" className="space-y-6">
        {/* Printable Letterhead (shown in print) */}
        <div className="hidden print:block border-b-2 border-stone-800 pb-4 mb-4 text-center">
          <h2 className="text-xl font-bold uppercase tracking-wider">{settings?.storeName || 'Kopi Nusantara'}</h2>
          <p className="text-xs">{settings?.storeAddress}</p>
          <p className="text-xs">Telp: {settings?.storePhone} • Email: {settings?.storeEmail}</p>
          <h3 className="text-sm font-bold mt-2 uppercase tracking-wide">
            LAPORAN PENJUALAN &amp; LABA BERSIH
          </h3>
          <p className="text-xs text-stone-600">Periode: {dateRange.toUpperCase()}</p>
        </div>

        {/* 4 Financial Key Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Total Omset</span>
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Rp {(analytics?.totalRevenue || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Pendapatan kotor</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Total Modal (HPP)</span>
              <TrendingUp className="w-4 h-4 text-stone-500" />
            </div>
            <div className="text-xl font-bold text-stone-700 dark:text-stone-300">
              Rp {(analytics?.totalCost || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Biaya pokok produk</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Laba Bersih</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              Rp {(analytics?.totalProfit || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-[11px] text-emerald-600/80 font-medium mt-1">Keuntungan bersih</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Volume Transaksi</span>
              <Receipt className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {analytics?.transactionCount || 0}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Transaksi sukses</p>
          </div>
        </div>

        {/* Payment Methods & Cashier Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Methods Breakdown */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 mb-3">
              Distribusi Metode Pembayaran
            </h4>
            <div className="space-y-2 text-xs">
              {analytics?.methodBreakdown &&
                Object.entries(analytics.methodBreakdown).map(([m, val]: [string, any]) => (
                  <div
                    key={m}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-800 dark:text-stone-200">{m}</span>
                      <span className="text-[10px] text-stone-400">({val.count} trx)</span>
                    </div>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      Rp {Number(val.total).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Cashier Breakdown */}
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 mb-3">
              Performa Transaksi per Kasir
            </h4>
            <div className="space-y-2 text-xs">
              {(!analytics?.cashierBreakdown || Object.keys(analytics.cashierBreakdown).length === 0) ? (
                <div className="text-stone-400 py-3 text-center">Belum ada data kasir.</div>
              ) : (
                Object.entries(analytics.cashierBreakdown).map(([cName, val]: [string, any]) => (
                  <div
                    key={cName}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-800 dark:text-stone-200">{cName}</span>
                      <span className="text-[10px] text-stone-400">({val.count} transaksi)</span>
                    </div>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      Rp {Number(val.total).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Detailed Transactions Table */}
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="no-print p-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari faktur atau kasir..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedMethod}
                onChange={e => setSelectedMethod(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300"
              >
                <option value="all">Semua Metode</option>
                <option value="TUNAI">Tunai</option>
                <option value="QRIS">QRIS</option>
                <option value="TRANSFER">Transfer</option>
              </select>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300"
              >
                <option value="all">Semua Status</option>
                <option value="PAID">Selesai (Paid)</option>
                <option value="CANCELLED">Dibatalkan (Refund)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">No Faktur</th>
                  <th className="py-3 px-4">Tanggal &amp; Waktu</th>
                  <th className="py-3 px-4">Kasir</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Diskon</th>
                  <th className="py-3 px-4 text-right">Total Akhir</th>
                  <th className="py-3 px-4 text-center">Metode</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-stone-400">
                      Tidak ada transaksi yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map(s => {
                    const isCancelled = s.paymentStatus === 'CANCELLED';
                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-stone-50 dark:hover:bg-stone-800/40 transition ${
                          isCancelled ? 'opacity-60 bg-red-50/20 dark:bg-red-950/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-bold font-mono text-stone-900 dark:text-stone-100">
                          {s.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                          {new Date(s.createdAt).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3 px-4 font-medium">{s.cashierName}</td>
                        <td className="py-3 px-4 text-right">
                          Rp {Number(s.subtotal).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right text-red-500">
                          {Number(s.discountAmount) > 0
                            ? `-Rp ${Number(s.discountAmount).toLocaleString('id-ID')}`
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-stone-900 dark:text-stone-100">
                          Rp {Number(s.totalAmount).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                            {s.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isCancelled
                                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {s.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right no-print">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View & Print receipt */}
                            <button
                              onClick={async () => {
                                const details = await apiFetch<Sale>(`/pos/sales/${s.id}`);
                                setViewingSale(details);
                              }}
                              title="Lihat / Cetak Struk"
                              className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Cancel / Refund transaction (Owner & Manager only) */}
                            {!isCancelled && hasRole('owner', 'manager') && (
                              <button
                                onClick={() => {
                                  setRefundingSaleId(s.id);
                                  setRefundReason('');
                                }}
                                title="Batalkan / Refund Transaksi"
                                className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 hover:bg-red-600 hover:text-white transition"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* VIEW RECEIPT MODAL */}
      {viewingSale && (
        <ReceiptModal
          sale={viewingSale}
          items={viewingSale.items}
          settings={settings}
          onClose={() => setViewingSale(null)}
        />
      )}

      {/* REFUND MODAL */}
      {refundingSaleId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                Batalkan &amp; Refund Transaksi?
              </h3>
            </div>
            <p className="text-stone-500 leading-relaxed">
              Transaksi ini akan ditandai sebagai <strong>CANCELLED</strong> dan seluruh stok barang
              akan dikembalikan secara otomatis ke gudang Kopi Nusantara.
            </p>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Alasan Pembatalan:
              </label>
              <input
                type="text"
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                placeholder="contoh: Pelanggan salah pesan, pesanan batal"
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setRefundingSaleId(null)}
                className="px-4 py-2 rounded-xl text-stone-500 font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmRefund}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md shadow-red-900/30"
              >
                Konfirmasi Pembatalan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
