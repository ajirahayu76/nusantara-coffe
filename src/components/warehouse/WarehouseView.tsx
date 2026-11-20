import React, { useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  History,
  RotateCcw,
  CheckCircle2,
  X,
  Sliders,
  DollarSign,
  TrendingDown,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { WarehouseItem, WarehouseCategory } from '../../types';

export const WarehouseView: React.FC = () => {
  const {
    warehouseItems,
    stockMovements,
    lowStockItems,
    restockWarehouseItem,
    adjustWarehouseStock,
    addWarehouseItem,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements'>('inventory');

  // Modals state
  const [restockModalItem, setRestockModalItem] = useState<WarehouseItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockNote, setRestockNote] = useState('');

  const [adjustModalItem, setAdjustModalItem] = useState<WarehouseItem | null>(null);
  const [adjustNewStock, setAdjustNewStock] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Stock Opname Rutin');

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<WarehouseCategory>('biji-kopi');
  const [newItemUnit, setNewItemUnit] = useState('Porsi / Cup');
  const [newItemStock, setNewItemStock] = useState(20);
  const [newItemMinThreshold, setNewItemMinThreshold] = useState(10);
  const [newItemCost, setNewItemCost] = useState(10000);
  const [newItemSelling, setNewItemSelling] = useState(25000);

  const categories = [
    { id: 'all', label: 'Semua Kategori' },
    { id: 'biji-kopi', label: 'Biji Kopi' },
    { id: 'susu-sirup', label: 'Susu & Sirup' },
    { id: 'makanan-pastry', label: 'Makanan & Pastry' },
    { id: 'kemasan-cup', label: 'Kemasan & Cup' },
    { id: 'produk-retail', label: 'Produk Retail' },
  ];

  // Filtering
  const filteredWarehouseItems = useMemo(() => {
    return warehouseItems.filter((item) => {
      if (onlyLowStock && item.currentStock > item.minStockThreshold) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.supplier?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [warehouseItems, selectedCategory, onlyLowStock, searchQuery]);

  // Overall Inventory Stats
  const totalStockItemsCount = warehouseItems.length;
  const totalAssetValue = warehouseItems.reduce((acc, i) => acc + i.currentStock * i.costPrice, 0);

  const handleConfirmRestock = () => {
    if (!restockModalItem || restockQty <= 0) return;
    restockWarehouseItem(restockModalItem.id, restockQty, restockNote);
    setRestockModalItem(null);
    setRestockQty(10);
    setRestockNote('');
  };

  const handleConfirmAdjust = () => {
    if (!adjustModalItem) return;
    adjustWarehouseStock(adjustModalItem.id, adjustNewStock, adjustReason);
    setAdjustModalItem(null);
  };

  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    addWarehouseItem({
      sku: newItemSku || `SKU-${Date.now().toString().slice(-4)}`,
      name: newItemName,
      category: newItemCategory,
      unit: newItemUnit,
      currentStock: Number(newItemStock),
      minStockThreshold: Number(newItemMinThreshold),
      costPrice: Number(newItemCost),
      sellingPrice: Number(newItemSelling),
      supplier: 'Supplier Terdaftar',
      lastRestocked: new Date().toISOString().split('T')[0],
    });

    setIsAddItemOpen(false);
    setNewItemName('');
    setNewItemSku('');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FAF7F2] p-4 sm:p-6 text-[#292524] space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E7DFD5]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#451A03] text-white flex items-center justify-center">
              <Package className="w-5 h-5 text-[#FDE68A]" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#292524]">
                Inventaris & Gudang (Warehouse)
              </h1>
              <p className="text-xs text-[#78716C]">
                Pantau stok bahan baku, opname fisik, peringatan stok menipis, dan riwayat mutasi otomatis.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddItemOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#451A03] hover:bg-[#2A0E02] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FDE68A]" />
            <span>Tambah Barang Baru</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#991B1B]">
                Perhatian: {lowStockItems.length} Bahan / Produk Mencapai Batas Minimum!
              </h4>
              <p className="text-xs text-[#B91C1C] mt-0.5">
                {lowStockItems.map((i) => i.name).slice(0, 3).join(', ')}
                {lowStockItems.length > 3 ? ` dan ${lowStockItems.length - 3} lainnya` : ''} segera butuh restock.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className="px-3.5 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold shadow-2xs whitespace-nowrap cursor-pointer"
          >
            {onlyLowStock ? 'Tampilkan Semua Barang' : 'Filter Barang Menipis Saja'}
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E7DFD5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-[#78716C] tracking-wider block">Total Jenis SKU</span>
          <div className="font-mono text-2xl font-bold text-[#292524] mt-1">
            {totalStockItemsCount} <span className="text-xs font-normal text-[#78716C]">Barang</span>
          </div>
          <div className="text-[11px] text-[#16A34A] mt-1">Tersinkronisasi dengan POS</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E7DFD5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-[#78716C] tracking-wider block">Total Nilai Aset Gudang (HPP)</span>
          <div className="font-mono text-2xl font-bold text-[#451A03] mt-1">
            Rp {totalAssetValue.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-[#78716C] mt-1">Valuasi stok saat ini</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E7DFD5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-[#78716C] tracking-wider block">Status Stok Kritis</span>
          <div className={`font-mono text-2xl font-bold mt-1 ${lowStockItems.length > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
            {lowStockItems.length} <span className="text-xs font-normal text-[#78716C]">Barang</span>
          </div>
          <div className="text-[11px] text-[#78716C] mt-1">
            {lowStockItems.length > 0 ? 'Perlu order supplier' : 'Semua persediaan aman'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E7DFD5] shadow-2xs">
          <span className="text-[11px] font-bold uppercase text-[#78716C] tracking-wider block">Total Mutasi Tercatat</span>
          <div className="font-mono text-2xl font-bold text-[#0284C7] mt-1">
            {stockMovements.length} <span className="text-xs font-normal text-[#78716C]">Aktivitas</span>
          </div>
          <div className="text-[11px] text-[#78716C] mt-1">Otomatis dari kasir & restock</div>
        </div>
      </div>

      {/* Main Tabs (Daftar Stok vs Riwayat Mutasi) */}
      <div className="flex items-center gap-2 border-b border-[#E7DFD5] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-[#451A03] text-white shadow-xs'
              : 'bg-white border border-[#E7DFD5] text-[#57534E] hover:border-[#D7C4B7]'
          }`}
        >
          Daftar Persediaan Gudang ({filteredWarehouseItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'movements'
              ? 'bg-[#451A03] text-white shadow-xs'
              : 'bg-white border border-[#E7DFD5] text-[#57534E] hover:border-[#D7C4B7]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Log Mutasi Stok Real-Time ({stockMovements.length})</span>
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <div className="bg-white rounded-2xl border border-[#E7DFD5] shadow-xs overflow-hidden space-y-4 p-4">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari SKU, nama bahan, kategori..."
                className="w-full pl-10 pr-4 py-2 bg-[#FAF7F2] border border-[#D7C4B7] rounded-xl text-xs text-[#292524] focus:outline-hidden focus:border-[#C2410C]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-[#FAF7F2] border border-[#D7C4B7] rounded-xl text-xs font-medium text-[#292524] focus:outline-hidden"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setOnlyLowStock(!onlyLowStock)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer ${
                  onlyLowStock
                    ? 'bg-[#DC2626] text-white border-[#DC2626]'
                    : 'bg-[#FAF7F2] border-[#D7C4B7] text-[#57534E]'
                }`}
              >
                ⚠️ Stok Menipis ({lowStockItems.length})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#78716C] uppercase text-[10px] tracking-wider border-y border-[#E7DFD5]">
                <tr>
                  <th className="py-3 px-3">SKU & Nama Barang</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Stok Saat Ini</th>
                  <th className="py-3 px-3">Batas Minimum</th>
                  <th className="py-3 px-3">HPP (Modal)</th>
                  <th className="py-3 px-3">Harga Jual</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE8DD]">
                {filteredWarehouseItems.map((item) => {
                  const isLow = item.currentStock <= item.minStockThreshold;
                  const isOutOfStock = item.currentStock <= 0;

                  return (
                    <tr key={item.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#292524]">{item.name}</div>
                        <div className="font-mono text-[10px] text-[#A8A29E]">{item.sku} · {item.unit}</div>
                      </td>
                      <td className="py-3 px-3 text-[#57534E] capitalize">
                        {item.category.replace('-', ' ')}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-sm">
                        <span className={isOutOfStock ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-[#292524]'}>
                          {item.currentStock}
                        </span>
                        <span className="text-[10px] font-normal text-[#78716C] ml-1">{item.unit}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#78716C]">
                        {item.minStockThreshold} {item.unit}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#57534E]">
                        Rp {item.costPrice.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#451A03]">
                        {item.sellingPrice > 0 ? `Rp ${item.sellingPrice.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="py-3 px-3">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">
                            Habis
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                            Menipis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Aman
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setRestockModalItem(item);
                              setRestockQty(10);
                            }}
                            className="px-2.5 py-1 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-[11px] rounded-lg shadow-2xs cursor-pointer"
                          >
                            + Restock
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustModalItem(item);
                              setAdjustNewStock(item.currentStock);
                            }}
                            className="px-2.5 py-1 border border-[#D7C4B7] hover:border-[#C2410C] text-[#57534E] text-[11px] font-semibold rounded-lg bg-white cursor-pointer"
                          >
                            Opname
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      ) : (
        /* Stock Movements Tab */
        <div className="bg-white rounded-2xl border border-[#E7DFD5] shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DD]">
            <div>
              <h3 className="font-serif font-bold text-base text-[#292524]">
                Log Mutasi Stok Real-Time
              </h3>
              <p className="text-xs text-[#78716C]">
                Pencatatan otomatis setiap ada penjualan kasir, restock barang masuk, atau penyesuaian opname.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#451A03]">
              {stockMovements.length} Catatan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#78716C] uppercase text-[10px] tracking-wider border-y border-[#E7DFD5]">
                <tr>
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Nama Barang</th>
                  <th className="py-2.5 px-3">Tipe Mutasi</th>
                  <th className="py-2.5 px-3">Perubahan</th>
                  <th className="py-2.5 px-3">Sebelum → Sesudah</th>
                  <th className="py-2.5 px-3">Staf Pelaksana</th>
                  <th className="py-2.5 px-3">Keterangan / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE8DD]">
                {stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[#A8A29E]">
                      Belum ada mutasi stok tercatat hari ini. Transaksi kasir akan otomatis muncul di sini.
                    </td>
                  </tr>
                ) : (
                  stockMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-[#FAF7F2]/60">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#78716C]">
                        {mov.timestamp}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#292524]">
                        {mov.itemName}
                      </td>
                      <td className="py-2.5 px-3">
                        {mov.type === 'sale' ? (
                          <span className="text-[10px] font-bold text-[#DC2626] bg-red-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <ArrowDownRight className="w-3 h-3" /> Penjualan
                          </span>
                        ) : mov.type === 'restock' ? (
                          <span className="text-[10px] font-bold text-[#16A34A] bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" /> Restock
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#0284C7] bg-sky-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Sliders className="w-3 h-3" /> Opname
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <span className={mov.quantity > 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                          {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#57534E]">
                        {mov.beforeStock} → <strong className="text-[#292524]">{mov.afterStock}</strong>
                      </td>
                      <td className="py-2.5 px-3 text-[#57534E]">
                        {mov.staffName}
                      </td>
                      <td className="py-2.5 px-3 text-[#78716C] text-[11px]">
                        {mov.note} {mov.referenceId && `(${mov.referenceId})`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-[#D7C4B7] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DD]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#16A34A]" />
                <h3 className="font-serif font-bold text-base text-[#292524]">
                  Restock Barang Masuk
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRestockModalItem(null)}
                className="text-[#78716C] hover:text-[#292524]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E7DFD5] text-xs space-y-1">
              <div className="font-bold text-[#292524]">{restockModalItem.name}</div>
              <div className="text-[#78716C]">Stok sekarang: <strong className="text-[#451A03]">{restockModalItem.currentStock} {restockModalItem.unit}</strong></div>
              <div className="text-[#78716C]">Batas minimum: {restockModalItem.minStockThreshold} {restockModalItem.unit}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57534E] mb-1">
                Jumlah Stok Masuk ({restockModalItem.unit}):
              </label>
              <input
                type="number"
                min="1"
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-[#D7C4B7] text-sm font-mono font-bold bg-[#FAF7F2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57534E] mb-1">
                Catatan Supplier / No. Surat Jalan (Opsional):
              </label>
              <input
                type="text"
                value={restockNote}
                onChange={(e) => setRestockNote(e.target.value)}
                placeholder="Contoh: Kiriman mingguan dari Roastery"
                className="w-full p-2.5 rounded-xl border border-[#D7C4B7] text-xs bg-[#FAF7F2]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestockModalItem(null)}
                className="px-4 py-2 rounded-xl border border-[#D7C4B7] text-xs font-semibold hover:bg-[#FAF7F2]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRestock}
                className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold shadow-xs"
              >
                Konfirmasi Restock Masuk (+{restockQty})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Opname Modal */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-[#D7C4B7] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DD]">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#0284C7]" />
                <h3 className="font-serif font-bold text-base text-[#292524]">
                  Penyesuaian Fisik (Stock Opname)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAdjustModalItem(null)}
                className="text-[#78716C] hover:text-[#292524]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E7DFD5] text-xs space-y-1">
              <div className="font-bold text-[#292524]">{adjustModalItem.name}</div>
              <div className="text-[#78716C]">Stok di sistem saat ini: <strong className="text-[#451A03]">{adjustModalItem.currentStock} {adjustModalItem.unit}</strong></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57534E] mb-1">
                Stok Fisik Sebenarnya di Lapangan:
              </label>
              <input
                type="number"
                min="0"
                value={adjustNewStock}
                onChange={(e) => setAdjustNewStock(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-[#D7C4B7] text-sm font-mono font-bold bg-[#FAF7F2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57534E] mb-1">
                Alasan Penyesuaian:
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#D7C4B7] text-xs bg-[#FAF7F2]"
              >
                <option value="Stock Opname Rutin">Stock Opname Rutin</option>
                <option value="Barang Rusak / Basi (Waste)">Barang Rusak / Basi (Waste)</option>
                <option value="Bahan Uji Coba Racikan Barista">Bahan Uji Coba Racikan Barista</option>
                <option value="Koreksi Input Kasir">Koreksi Input Kasir</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustModalItem(null)}
                className="px-4 py-2 rounded-xl border border-[#D7C4B7] text-xs font-semibold hover:bg-[#FAF7F2]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAdjust}
                className="px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold shadow-xs"
              >
                Simpan Stok Baru ({adjustNewStock})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-[#D7C4B7] shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DD]">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#C2410C]" />
                <h3 className="font-serif font-bold text-base text-[#292524]">
                  Tambah Barang / Bahan Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddItemOpen(false)}
                className="text-[#78716C] hover:text-[#292524]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#57534E] mb-1">Nama Barang *</label>
                  <input
                    type="text"
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Contoh: Biji Kopi Wamena Papua"
                    className="w-full p-2 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#57534E] mb-1">Kode SKU</label>
                  <input
                    type="text"
                    value={newItemSku}
                    onChange={(e) => setNewItemSku(e.target.value)}
                    placeholder="Contoh: SKU-RAW-009"
                    className="w-full p-2 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#57534E] mb-1">Kategori</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2]"
                  >
                    <option value="biji-kopi">Biji Kopi</option>
                    <option value="susu-sirup">Susu & Sirup</option>
                    <option value="makanan-pastry">Makanan & Pastry</option>
                    <option value="kemasan-cup">Kemasan Cup</option>
                    <option value="produk-retail">Produk Retail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#57534E] mb-1">Satuan Unit</label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="Porsi, Liter, Kg, Pack, Pcs"
                    className="w-full p-2 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#57534E] mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#57534E] mb-1">Batas Minimum Peringatan</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemMinThreshold}
                    onChange={(e) => setNewItemMinThreshold(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#57534E] mb-1">Harga Beli / HPP (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#57534E] mb-1">Harga Jual Kasir (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemSelling}
                    onChange={(e) => setNewItemSelling(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-[#D7C4B7] bg-[#FAF7F2] font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFE8DD]">
                <button
                  type="button"
                  onClick={() => setIsAddItemOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D7C4B7] text-xs font-semibold hover:bg-[#FAF7F2]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#451A03] hover:bg-[#2A0E02] text-white text-xs font-semibold shadow-xs"
                >
                  Simpan Barang Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
