import React, { useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  QrCode,
  ArrowUpRight,
  PieChart,
  Calendar,
  Sparkles,
  Award,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const FinancialDashboard: React.FC = () => {
  const { monthlyFinancials, transactions } = useStore();

  // Financial aggregates
  const totalRevenueAllTime = useMemo(() => {
    return monthlyFinancials.reduce((acc, m) => acc + m.revenue, 0);
  }, [monthlyFinancials]);

  const totalProfitAllTime = useMemo(() => {
    return monthlyFinancials.reduce((acc, m) => acc + m.profit, 0);
  }, [monthlyFinancials]);

  const currentMonthData = monthlyFinancials[monthlyFinancials.length - 1];
  const previousMonthData = monthlyFinancials[monthlyFinancials.length - 2];

  const monthGrowthPct = previousMonthData
    ? (((currentMonthData.revenue - previousMonthData.revenue) / previousMonthData.revenue) * 100).toFixed(1)
    : '0';

  const averageOrderValue = currentMonthData.transactions > 0
    ? Math.round(currentMonthData.revenue / currentMonthData.transactions)
    : 0;

  // Max revenue for SVG bar chart normalization
  const maxRevenueInChart = Math.max(...monthlyFinancials.map((m) => m.revenue));

  // Payment methods breakdown from recent transactions
  const paymentBreakdown = useMemo(() => {
    let qris = 0;
    let cash = 0;
    let bca = 0;

    transactions.forEach((t) => {
      if (t.paymentMethod === 'qris') qris += t.totalAmount;
      else if (t.paymentMethod === 'cash') cash += t.totalAmount;
      else bca += t.totalAmount;
    });

    const total = qris + cash + bca || 1;
    return {
      qris,
      cash,
      bca,
      qrisPct: Math.round((qris / total) * 100),
      cashPct: Math.round((cash / total) * 100),
      bcaPct: Math.round((bca / total) * 100),
    };
  }, [transactions]);

  // Top selling products calculated dynamically from transactions
  const topSellingProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    transactions.forEach((tx) => {
      tx.items.forEach((item) => {
        const existing = map.get(item.name) || { name: item.name, qty: 0, revenue: 0 };
        existing.qty += item.quantity;
        existing.revenue += item.totalPrice;
        map.set(item.name, existing);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FAF7F2] p-4 sm:p-6 text-[#292524] space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#E7DFD5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-[#292524]">
              Dasbor Finansial & Pendapatan Toko
            </h1>
            <span className="text-[10px] font-bold text-[#C2410C] bg-[#FFEDD5] px-2.5 py-0.5 rounded-full">
              Live Owner Metrics
            </span>
          </div>
          <p className="text-xs text-[#78716C] mt-0.5">
            Analisis arus kas pendapatan, keuntungan bersih, grafik bulanan, dan performa penjualan real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#78716C] bg-white px-3 py-1.5 rounded-xl border border-[#D7C4B7]">
          <Calendar className="w-3.5 h-3.5 text-[#C2410C]" />
          <span>Periode: <strong>Bulan Berjalan (Oktober 2026)</strong></span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Omzet / Pendapatan Kotor Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7DFD5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
              Pendapatan Kotor (Bulan Ini)
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FFEDD5] text-[#C2410C] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#451A03]">
            Rp {currentMonthData.revenue.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#16A34A] font-semibold">
            <ArrowUpRight className="w-4 h-4" />
            <span>+{monthGrowthPct}% dibanding bulan lalu</span>
          </div>
        </div>

        {/* Card 2: Laba Bersih Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7DFD5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
              Laba Bersih / Gross Profit
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#16A34A]">
            Rp {currentMonthData.profit.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-[#78716C]">
            Margin Keuntungan: <strong className="text-[#292524]">{Math.round((currentMonthData.profit / currentMonthData.revenue) * 100)}%</strong>
          </div>
        </div>

        {/* Card 3: Total Transaksi Penjualan */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7DFD5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
              Volume Transaksi
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#0284C7]">
            {currentMonthData.transactions.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-[#78716C]">
            Cup & Kudapan terjual di kasir
          </div>
        </div>

        {/* Card 4: Rata-Rata Nilai Struk (AOV) */}
        <div className="bg-white p-5 rounded-2xl border border-[#E7DFD5] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
              Rata-Rata per Transaksi (AOV)
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] text-[#78350F] flex items-center justify-center border border-[#D7C4B7]">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-bold text-[#292524]">
            Rp {averageOrderValue.toLocaleString('id-ID')}
          </div>
          <div className="text-xs text-[#78716C]">
            Per struk belanja pelanggan
          </div>
        </div>

      </div>

      {/* Interactive Monthly Revenue Chart Section */}
      <div className="bg-white rounded-3xl border border-[#E7DFD5] p-5 sm:p-7 shadow-xs space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#EFE8DD]">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#292524]">
              Grafik Tren Pendapatan & Profit Bulanan (2026)
            </h3>
            <p className="text-xs text-[#78716C]">
              Dihitung otomatis dan terupdate setiap ada transaksi kasir yang selesai.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#451A03]"></span>
              <span>Omzet (Revenue)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#16A34A]"></span>
              <span>Profit Bersih</span>
            </div>
          </div>
        </div>

        {/* Responsive SVG Bar Chart */}
        <div className="pt-2">
          <div className="grid grid-cols-6 gap-2 sm:gap-4 h-64 items-end pb-6 pt-4 border-b border-[#E7DFD5]">
            {monthlyFinancials.map((item, idx) => {
              const revenueHeightPct = Math.round((item.revenue / maxRevenueInChart) * 100);
              const profitHeightPct = Math.round((item.profit / maxRevenueInChart) * 100);

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                  
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-[#292524] text-white text-[10px] py-1 px-2 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                    <div>{item.month}</div>
                    <div className="text-[#FDE68A]">Omzet: Rp {item.revenue.toLocaleString('id-ID')}</div>
                    <div className="text-[#86EFAC]">Profit: Rp {item.profit.toLocaleString('id-ID')}</div>
                  </div>

                  {/* Dual Bar Cluster */}
                  <div className="flex items-end gap-1 sm:gap-2 w-full justify-center max-w-[50px] sm:max-w-[70px]">
                    {/* Revenue Bar */}
                    <div
                      className="w-full bg-[#451A03] hover:bg-[#2A0E02] rounded-t-md transition-all duration-500 relative cursor-pointer"
                      style={{ height: `${revenueHeightPct}%` }}
                    />
                    {/* Profit Bar */}
                    <div
                      className="w-full bg-[#16A34A] hover:bg-[#15803D] rounded-t-md transition-all duration-500 relative cursor-pointer"
                      style={{ height: `${profitHeightPct}%` }}
                    />
                  </div>

                  {/* Month Label */}
                  <span className="text-[10px] sm:text-xs font-semibold text-[#57534E] mt-2 truncate w-full text-center">
                    {item.month.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Monthly Table Details */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] uppercase text-[#78716C] bg-[#FAF7F2] border-y border-[#E7DFD5]">
              <tr>
                <th className="py-2.5 px-3">Bulan</th>
                <th className="py-2.5 px-3">Pendapatan (Omzet)</th>
                <th className="py-2.5 px-3">Beban Pokok (HPP)</th>
                <th className="py-2.5 px-3">Keuntungan Bersih</th>
                <th className="py-2.5 px-3">Total Struk</th>
                <th className="py-2.5 px-3">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8DD]">
              {monthlyFinancials.map((row, i) => (
                <tr key={i} className="hover:bg-[#FAF7F2]/50">
                  <td className="py-2.5 px-3 font-bold text-[#292524]">{row.month}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#451A03]">
                    Rp {row.revenue.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#78716C]">
                    Rp {row.cost.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-[#16A34A]">
                    Rp {row.profit.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#57534E]">
                    {row.transactions.toLocaleString('id-ID')} struk
                  </td>
                  <td className="py-2.5 px-3 text-[#57534E]">
                    {Math.round((row.profit / row.revenue) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Two Columns: Payment Breakdown & Top Selling Menu */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Payment Methods Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E7DFD5] p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DD]">
            <h3 className="font-serif font-bold text-base text-[#292524]">
              Metode Pembayaran Kasir
            </h3>
            <span className="text-xs text-[#78716C]">Distribusi Omzet</span>
          </div>

          <div className="space-y-3 pt-1">
            {/* QRIS */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-[#C2410C]">
                  <QrCode className="w-3.5 h-3.5" />
                  QRIS Dinamis
                </span>
                <span className="font-mono">{paymentBreakdown.qrisPct}% (Rp {paymentBreakdown.qris.toLocaleString('id-ID')})</span>
              </div>
              <div className="w-full h-2.5 bg-[#EFE8DD] rounded-full overflow-hidden">
                <div className="h-full bg-[#C2410C] rounded-full" style={{ width: `${paymentBreakdown.qrisPct}%` }} />
              </div>
            </div>

            {/* Cash */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-[#16A34A]">
                  <DollarSign className="w-3.5 h-3.5" />
                  Tunai di Kasir
                </span>
                <span className="font-mono">{paymentBreakdown.cashPct}% (Rp {paymentBreakdown.cash.toLocaleString('id-ID')})</span>
              </div>
              <div className="w-full h-2.5 bg-[#EFE8DD] rounded-full overflow-hidden">
                <div className="h-full bg-[#16A34A] rounded-full" style={{ width: `${paymentBreakdown.cashPct}%` }} />
              </div>
            </div>

            {/* Transfer BCA */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-[#0284C7]">
                  <CreditCard className="w-3.5 h-3.5" />
                  Transfer Bank BCA
                </span>
                <span className="font-mono">{paymentBreakdown.bcaPct}% (Rp {paymentBreakdown.bca.toLocaleString('id-ID')})</span>
              </div>
              <div className="w-full h-2.5 bg-[#EFE8DD] rounded-full overflow-hidden">
                <div className="h-full bg-[#0284C7] rounded-full" style={{ width: `${paymentBreakdown.bcaPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Best Selling Menu Items (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E7DFD5] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DD]">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#C2410C]" />
              <h3 className="font-serif font-bold text-base text-[#292524]">
                5 Menu Paling Laris (Best Seller)
              </h3>
            </div>
            <span className="text-xs text-[#78716C]">Berdasarkan Transaksi Riil</span>
          </div>

          <div className="divide-y divide-[#EFE8DD]">
            {topSellingProducts.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#A8A29E]">Belum ada riwayat penjualan</div>
            ) : (
              topSellingProducts.map((p, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#D7C4B7] font-mono font-bold text-[11px] text-[#451A03] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-[#292524]">{p.name}</div>
                      <div className="text-[10px] text-[#78716C]">{p.qty} porsi terjual</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-[#451A03]">
                    Rp {p.revenue.toLocaleString('id-ID')}
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
