import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Search,
  Eye,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  downloadReceiptPDF,
  downloadReceiptExcel,
  downloadSalesReportExcel,
  DownloadResult,
} from '../../utils/receiptExport';

export const SalesReportView: React.FC = () => {
  const { transactions, storeSettings, openReceiptModal } = useStore();

  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | 'month'>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastDownload, setLastDownload] = useState<(DownloadResult & { kind: 'pdf' | 'excel' }) | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (dateFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (!t.timestamp.startsWith(todayStr)) return false;
      } else if (dateFilter === 'month') {
        if (!t.timestamp.startsWith('2026-10')) return false;
      }

      if (paymentFilter !== 'all' && t.paymentMethod !== paymentFilter) return false;
      if (orderTypeFilter !== 'all' && t.orderType !== orderTypeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesInvoice = t.invoiceNumber.toLowerCase().includes(q);
        const matchesCustomer = t.customerName.toLowerCase().includes(q);
        const matchesCashier = t.cashierStaffName.toLowerCase().includes(q);
        const matchesItems = t.items.some((i) => i.name.toLowerCase().includes(q));
        if (!matchesInvoice && !matchesCustomer && !matchesCashier && !matchesItems) return false;
      }

      return true;
    });
  }, [transactions, dateFilter, paymentFilter, orderTypeFilter, searchQuery]);

  const totalRevenue = filteredTransactions.reduce((acc, t) => acc + t.totalAmount, 0);
  const totalCost = filteredTransactions.reduce((acc, t) => acc + t.totalCost, 0);
  const totalProfit = filteredTransactions.reduce((acc, t) => acc + t.grossProfit, 0);
  const totalDiscount = filteredTransactions.reduce((acc, t) => acc + t.discount, 0);

  const handleExportExcel = () => {
    const res = downloadSalesReportExcel(filteredTransactions);
    setLastDownload({ ...res, kind: 'excel' });
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleDownloadRowPDF = (tx: typeof transactions[number]) => {
    const res = downloadReceiptPDF(tx, storeSettings);
    setLastDownload({ ...res, kind: 'pdf' });
  };

  const handleDownloadRowExcel = (tx: typeof transactions[number]) => {
    const res = downloadReceiptExcel(tx, storeSettings);
    setLastDownload({ ...res, kind: 'excel' });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FAF7F2] p-4 sm:p-6 text-[#292524] space-y-6">
      
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E7DFD5]">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#292524]">
            Laporan Penjualan & Transaksi
          </h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Daftar audit transaksi kasir (QRIS, Transfer Bank, Tunai) dengan unduhan struk PDF & Excel per transaksi.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 no-print">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Semua (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#451A03] hover:bg-[#2A0E02] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#FDE68A]" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Download readiness banner with direct fallback link */}
      {lastDownload && (
        <div className="bg-white p-3 rounded-2xl border border-[#D7C4B7] flex flex-wrap items-center justify-between gap-2 text-xs no-print shadow-2xs">
          <div className="flex items-center gap-2 text-[#451A03]">
            <Download className="w-4 h-4 text-[#16A34A]" />
            <span>Struk berhasil dibuat:</span>
            <a
              href={lastDownload.url}
              download={lastDownload.filename}
              className="font-mono font-bold underline text-[#C2410C]"
            >
              {lastDownload.filename}
            </a>
            {lastDownload.kind === 'pdf' && (
              <a
                href={lastDownload.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline text-[#0284C7]"
              >
                (Buka Tab PDF)
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => setLastDownload(null)}
            className="text-[11px] text-[#78716C] hover:text-[#292524] cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* KPI Stats for current filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E7DFD5] shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-[#78716C] tracking-wider block">Total Omzet Penjualan</span>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#451A03] mt-1">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-[#78716C] mt-0.5">{filteredTransactions.length} Transaksi Ditemukan</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E7DFD5] shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-[#78716C] tracking-wider block">Total Beban Pokok (HPP)</span>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#78716C] mt-1">
            Rp {totalCost.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-[#78716C] mt-0.5">Biaya bahan baku gudang</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E7DFD5] shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-[#78716C] tracking-wider block">Laba Kotor Bersih</span>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#16A34A] mt-1">
            Rp {totalProfit.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-[#16A34A] mt-0.5">
            Margin: {totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E7DFD5] shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-[#78716C] tracking-wider block">Diskon Diberikan</span>
          <div className="font-mono text-xl sm:text-2xl font-bold text-[#C2410C] mt-1">
            Rp {totalDiscount.toLocaleString('id-ID')}
          </div>
          <div className="text-[10px] text-[#78716C] mt-0.5">Tumbler & promo voucher</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7DFD5] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 no-print">
        
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor invoice, nama kasir, pelanggan..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF7F2] border border-[#D7C4B7] rounded-xl text-xs text-[#292524] focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | '7days' | 'month')}
            className="px-3 py-1.5 bg-[#FAF7F2] border border-[#D7C4B7] rounded-xl font-medium"
          >
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="month">Bulan Ini (Oktober)</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF7F2] border border-[#D7C4B7] rounded-xl font-medium"
          >
            <option value="all">Semua Metode</option>
            <option value="qris">QRIS</option>
            <option value="cash">Tunai</option>
            <option value="bca">Transfer BCA</option>
            <option value="mandiri">Transfer Mandiri</option>
          </select>

          <select
            value={orderTypeFilter}
            onChange={(e) => setOrderTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#FAF7F2] border border-[#D7C4B7] rounded-xl font-medium"
          >
            <option value="all">Semua Tipe</option>
            <option value="dine-in">Dine-In</option>
            <option value="pickup">Pick-Up</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>

      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-[#E7DFD5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[#78716C] uppercase text-[10px] tracking-wider border-b border-[#E7DFD5]">
              <tr>
                <th className="py-3 px-3">No. Invoice & Waktu</th>
                <th className="py-3 px-3">Pelanggan</th>
                <th className="py-3 px-3">Tipe</th>
                <th className="py-3 px-3">Rincian Menu</th>
                <th className="py-3 px-3 font-mono">Metode</th>
                <th className="py-3 px-3 font-mono text-right">Total Bayar</th>
                <th className="py-3 px-3 font-mono text-right">Laba Kotor</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center no-print">Struk Pembayaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8DD]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-[#A8A29E]">
                    Tidak ada data transaksi yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-[#292524]">{tx.invoiceNumber}</div>
                      <div className="text-[10px] text-[#78716C]">{tx.timestamp} · Kasir: {tx.cashierStaffName}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-[#292524]">
                      {tx.customerName}
                    </td>
                    <td className="py-3 px-3">
                      <span className="uppercase font-semibold text-[10px] text-[#57534E] bg-[#EFE8DD] px-2 py-0.5 rounded">
                        {tx.orderType} {tx.tableNumber ? `(${tx.tableNumber})` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <div className="text-[11px] text-[#292524] line-clamp-1">
                        {tx.items.map((i) => `${i.name} (${i.quantity}x)`).join(', ')}
                      </div>
                      <div className="text-[10px] text-[#78716C]">
                        {tx.items.reduce((acc, i) => acc + i.quantity, 0)} total item
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded ${
                          tx.paymentMethod === 'qris'
                            ? 'text-[#9A3412] bg-[#FFEDD5]'
                            : tx.paymentMethod === 'cash'
                            ? 'text-[#166534] bg-[#DCFCE7]'
                            : 'text-[#075985] bg-[#E0F2FE]'
                        }`}
                      >
                        {tx.paymentMethod === 'bca'
                          ? 'Transfer BCA'
                          : tx.paymentMethod === 'mandiri'
                          ? 'Transfer Mandiri'
                          : tx.paymentMethod === 'cash'
                          ? 'Tunai'
                          : 'QRIS'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#451A03] text-right">
                      Rp {tx.totalAmount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#16A34A] text-right">
                      +Rp {tx.grossProfit.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Berhasil
                      </span>
                    </td>
                    <td className="py-3 px-3 no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openReceiptModal(tx)}
                          className="p-1.5 rounded-lg border border-[#D7C4B7] hover:border-[#451A03] text-[#451A03] bg-[#FAF7F2] hover:bg-[#EFE8DD] transition-colors cursor-pointer"
                          title="Lihat & Cetak Struk"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadRowPDF(tx)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-[10px] font-bold transition-colors cursor-pointer"
                          title="Download Struk PDF"
                        >
                          <FileText className="w-3 h-3" />
                          <span>PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadRowExcel(tx)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-[10px] font-bold transition-colors cursor-pointer"
                          title="Download Struk Excel (.xlsx)"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          <span>Excel</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
