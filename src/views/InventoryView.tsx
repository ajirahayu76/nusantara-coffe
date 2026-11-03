import React, { useState, useEffect } from 'react';
import { Product, Category, StockMovement, PurchaseRecord } from '../types/index.ts';
import { apiFetch } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useRealtime } from '../context/RealtimeContext.tsx';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  History,
  Truck,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  PackagePlus,
  PackageMinus,
  RefreshCw,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { lastEvent, showToast } = useRealtime();

  const [activeTab, setActiveTab] = useState<'products' | 'adjustment' | 'movements' | 'purchases'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Product Form Modal (Add / Edit)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    categoryId: '',
    costPrice: '',
    sellPrice: '',
    stock: '',
    unit: 'pcs',
    imageUrl: '',
    minStock: '5',
    location: 'Gudang Utama',
  });

  // Stock Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Purchase / Restock PO Modal
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseSupplier, setPurchaseSupplier] = useState('');
  const [purchaseItemsList, setPurchaseItemsList] = useState<{ productId: number; quantity: number; costPrice: number }[]>([]);
  const [purchaseNotes, setPurchaseNotes] = useState('');

  const loadData = async () => {
    try {
      const [p, c, m, po] = await Promise.all([
        apiFetch<Product[]>('/products'),
        apiFetch<Category[]>('/categories'),
        apiFetch<StockMovement[]>('/inventory/movements'),
        apiFetch<PurchaseRecord[]>('/inventory/purchases'),
      ]);
      setProducts(p);
      setCategories(c);
      setMovements(m);
      setPurchases(po);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    if (
      lastEvent?.type === 'STOCK_UPDATED' ||
      lastEvent?.type === 'PRODUCT_CREATED' ||
      lastEvent?.type === 'PRODUCT_UPDATED' ||
      lastEvent?.type === 'TRANSACTION_CREATED' ||
      lastEvent?.type === 'TRANSACTION_CANCELLED' ||
      lastEvent?.type === 'PURCHASE_CREATED'
    ) {
      loadData();
    }
  }, [lastEvent]);

  // Handle open add product modal
  const openAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      sku: `KN-${Date.now().toString().slice(-4)}`,
      barcode: '',
      name: '',
      categoryId: categories[0]?.id ? String(categories[0].id) : '',
      costPrice: '',
      sellPrice: '',
      stock: '10',
      unit: 'cup',
      imageUrl: '',
      minStock: '5',
      location: 'Gudang Utama',
    });
    setShowProductModal(true);
  };

  // Handle open edit product modal
  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      sku: prod.sku,
      barcode: prod.barcode || '',
      name: prod.name,
      categoryId: prod.categoryId ? String(prod.categoryId) : '',
      costPrice: String(prod.costPrice),
      sellPrice: String(prod.sellPrice),
      stock: String(prod.stock),
      unit: prod.unit,
      imageUrl: prod.imageUrl || '',
      minStock: String(prod.minStock),
      location: prod.location || 'Gudang Utama',
    });
    setShowProductModal(true);
  };

  // Submit Product Add/Edit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await apiFetch(`/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        showToast('success', 'Produk Diperbarui', `Data produk [${formData.name}] berhasil diubah.`);
      } else {
        await apiFetch('/products', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        showToast('success', 'Produk Ditambahkan', `Produk [${formData.name}] berhasil disimpan ke katalog.`);
      }
      setShowProductModal(false);
      loadData();
    } catch (err: any) {
      showToast('error', 'Gagal Menyimpan', err.message);
    }
  };

  // Toggle active/inactive product
  const handleToggleActive = async (prod: Product) => {
    try {
      await apiFetch(`/products/${prod.id}`, {
        method: 'DELETE',
      });
      showToast('info', 'Status Produk Diubah', `Produk [${prod.name}] dinonaktifkan.`);
      loadData();
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    }
  };

  // Submit Stock Adjustment
  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjust) return;

    try {
      await apiFetch('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedProductForAdjust.id,
          movementType: adjustType,
          quantity: Number(adjustQty),
          notes: adjustNotes,
        }),
      });
      showToast('success', 'Penyesuaian Stok Berhasil', `Stok ${selectedProductForAdjust.name} telah disesuaikan.`);
      setShowAdjustModal(false);
      setSelectedProductForAdjust(null);
      setAdjustQty('');
      setAdjustNotes('');
      loadData();
    } catch (err: any) {
      showToast('error', 'Gagal Penyesuaian', err.message);
    }
  };

  // Submit Restock Purchase PO
  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseSupplier.trim() || purchaseItemsList.length === 0) {
      showToast('error', 'Form Belum Lengkap', 'Tentukan nama supplier dan minimal satu barang restock.');
      return;
    }

    try {
      await apiFetch('/inventory/purchases', {
        method: 'POST',
        body: JSON.stringify({
          supplierName: purchaseSupplier,
          items: purchaseItemsList,
          notes: purchaseNotes,
        }),
      });
      showToast('success', 'Pembelian Tersimpan', 'Stok gudang telah bertambah sesuai nota pembelian supplier.');
      setShowPurchaseModal(false);
      setPurchaseSupplier('');
      setPurchaseItemsList([]);
      setPurchaseNotes('');
      loadData();
    } catch (err: any) {
      showToast('error', 'Gagal', err.message);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'all' && p.categoryId !== Number(selectedCategory)) {
      return false;
    }
    if (lowStockOnly && p.stock > p.minStock) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Stok &amp; Manajemen Gudang
          </h2>
          <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Kelola katalog produk, stok masuk/keluar, stok opname, dan riwayat mutasi
          </p>
        </div>

        {hasRole('owner', 'manager') && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition"
            >
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span>Restock Supplier</span>
            </button>
            <button
              onClick={openAddProduct}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md shadow-amber-900/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 transition relative flex items-center gap-2 ${
            activeTab === 'products'
              ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600'
              : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Daftar Produk ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-3 transition relative flex items-center gap-2 ${
            activeTab === 'movements'
              ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600'
              : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Mutasi Stok</span>
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`pb-3 transition relative flex items-center gap-2 ${
            activeTab === 'purchases'
              ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600'
              : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Pembelian Supplier ({purchases.length})</span>
        </button>
      </div>

      {/* TAB 1: PRODUCTS LIST */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama, SKU, atau barcode..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 sm:pb-0">
              {/* Category filter dropdown */}
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 font-medium focus:outline-hidden"
              >
                <option value="all">Semua Kategori</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Low stock toggle button */}
              <button
                onClick={() => setLowStockOnly(!lowStockOnly)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                  lowStockOnly
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Stok Menipis Saja</span>
              </button>
            </div>
          </div>

          {/* Table Products */}
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Produk &amp; SKU</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4 text-right">Harga Modal</th>
                    <th className="py-3.5 px-4 text-right">Harga Jual</th>
                    <th className="py-3.5 px-4 text-center">Stok</th>
                    <th className="py-3.5 px-4">Lokasi</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-stone-400">
                        Tidak ada produk yang sesuai kriteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(prod => {
                      const isLowStock = prod.stock <= prod.minStock;
                      const isOutOfStock = prod.stock <= 0;

                      return (
                        <tr
                          key={prod.id}
                          className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700">
                                {prod.imageUrl ? (
                                  <img
                                    src={prod.imageUrl}
                                    alt={prod.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                                    <Boxes className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="font-semibold text-stone-900 dark:text-stone-100">
                                  {prod.name}
                                </span>
                                <div className="text-[11px] text-stone-400 font-mono flex items-center gap-2">
                                  <span>{prod.sku}</span>
                                  {prod.barcode && <span>• Barcode: {prod.barcode}</span>}
                                  {prod.isDemo && (
                                    <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1 rounded">
                                      Demo
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-[11px] font-medium text-stone-700 dark:text-stone-300">
                              {prod.categoryName || 'Tanpa Kategori'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-medium">
                            Rp {Number(prod.costPrice).toLocaleString('id-ID')}
                          </td>

                          <td className="py-3 px-4 text-right font-bold text-stone-900 dark:text-stone-100">
                            Rp {Number(prod.sellPrice).toLocaleString('id-ID')}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isOutOfStock
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                                  : isLowStock
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                              }`}
                            >
                              {prod.stock} {prod.unit}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-stone-500 text-[11px]">
                            {prod.location || 'Gudang'}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                prod.isActive
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              {prod.isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Adjust Button */}
                              <button
                                onClick={() => {
                                  setSelectedProductForAdjust(prod);
                                  setShowAdjustModal(true);
                                }}
                                title="Sesuaikan Stok"
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 hover:bg-amber-600 hover:text-white transition"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                              </button>

                              {hasRole('owner', 'manager') && (
                                <button
                                  onClick={() => openEditProduct(prod)}
                                  title="Edit Produk"
                                  className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {hasRole('owner') && (
                                <button
                                  onClick={() => handleToggleActive(prod)}
                                  title={prod.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                  className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 hover:bg-red-600 hover:text-white transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* TAB 2: STOCK MOVEMENTS AUDIT LOG */}
      {activeTab === 'movements' && (
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              Riwayat Pergerakan Stok (Audit Trail)
            </h3>
            <span className="text-xs text-stone-400">100 aktivitas terakhir</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-4 text-center">Tipe Mutasi</th>
                  <th className="py-3 px-4 text-right">Perubahan Qty</th>
                  <th className="py-3 px-4 text-right">Stok Akhir</th>
                  <th className="py-3 px-4">Referensi / No Faktur</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-400">
                      Belum ada catatan mutasi stok.
                    </td>
                  </tr>
                ) : (
                  movements.map(m => {
                    const isPositive = m.quantity > 0;
                    return (
                      <tr key={m.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                        <td className="py-2.5 px-4 text-stone-500 whitespace-nowrap">
                          {new Date(m.createdAt).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-stone-900 dark:text-stone-100">
                          {m.productName || `ID #${m.productId}`}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              m.movementType === 'IN'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : m.movementType === 'OUT' || m.movementType === 'SALE'
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                                : m.movementType === 'SALE_CANCEL'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            }`}
                          >
                            {m.movementType}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-4 text-right font-bold ${
                            isPositive ? 'text-emerald-600' : 'text-red-500'
                          }`}
                        >
                          {isPositive ? `+${m.quantity}` : m.quantity} {m.unit || 'pcs'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-medium">
                          {m.currentStock}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-stone-500">
                          {m.referenceId || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-stone-600 dark:text-stone-400">
                          {m.notes || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-stone-500 text-[11px]">
                          {m.createdBy}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PURCHASES / RESTOCK SUPPLIER */}
      {activeTab === 'purchases' && (
        <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                Faktur Pembelian &amp; Restock Barang dari Supplier
              </h3>
              <p className="text-xs text-stone-400">Riwayat barang masuk gudang</p>
            </div>
            {hasRole('owner', 'manager') && (
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat Pembelian Baru</span>
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">No Pembelian</th>
                  <th className="py-3 px-4">Nama Supplier</th>
                  <th className="py-3 px-4 text-right">Total Biaya</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-4">Petugas</th>
                  <th className="py-3 px-4">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400">
                      Belum ada data pembelian barang dari supplier.
                    </td>
                  </tr>
                ) : (
                  purchases.map(po => (
                    <tr key={po.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                      <td className="py-3 px-4 font-bold font-mono text-stone-900 dark:text-stone-100">
                        {po.purchaseNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold">{po.supplierName}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-700 dark:text-amber-400">
                        Rp {Number(po.totalAmount).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-500">{po.notes || '-'}</td>
                      <td className="py-3 px-4 text-stone-500">{po.createdBy}</td>
                      <td className="py-3 px-4 text-stone-400">
                        {new Date(po.createdAt).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT PRODUCT */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-8">
            <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                {editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="contoh: Kopi Arabika Lintong"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Kode Produk (SKU) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="KN-KOP-009"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Barcode (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="899100..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Harga Modal (HPP) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.costPrice}
                    onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="8000"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Harga Jual *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.sellPrice}
                    onChange={e => setFormData({ ...formData, sellPrice: e.target.value })}
                    placeholder="18000"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>

                {!editingProduct && (
                  <div>
                    <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Jumlah Stok Awal
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="10"
                      className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Satuan Barang
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="cup, pack, kg, botol, pcs"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Batas Minimum Stok (Alert)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStock}
                    onChange={e => setFormData({ ...formData, minStock: e.target.value })}
                    placeholder="5"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Lokasi Rak / Penyimpanan
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Bar Depan, Gudang Rak A-1"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  URL Foto Produk
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md shadow-amber-900/20"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK STOCK ADJUSTMENT (IN, OUT, OPNAME) */}
      {showAdjustModal && selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Penyesuaian Stok Gudang
                </h3>
                <p className="text-xs text-stone-500">{selectedProductForAdjust.name}</p>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 text-xs flex justify-between items-center">
              <span className="text-stone-600 dark:text-stone-400">Stok Saat Ini:</span>
              <span className="font-bold text-base text-stone-900 dark:text-stone-100">
                {selectedProductForAdjust.stock} {selectedProductForAdjust.unit}
              </span>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Jenis Penyesuaian
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('IN')}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 font-semibold transition ${
                      adjustType === 'IN'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <PackagePlus className="w-4 h-4" />
                    <span>Barang Masuk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('OUT')}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 font-semibold transition ${
                      adjustType === 'OUT'
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <PackageMinus className="w-4 h-4" />
                    <span>Barang Keluar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('ADJUSTMENT')}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center gap-1 font-semibold transition ${
                      adjustType === 'ADJUSTMENT'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Stok Opname</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  {adjustType === 'ADJUSTMENT'
                    ? 'Jumlah Stok Sebenarnya (Hasil Opname)'
                    : 'Jumlah Barang'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjustQty}
                  onChange={e => setAdjustQty(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Alasan / Keterangan
                </label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={e => setAdjustNotes(e.target.value)}
                  placeholder="contoh: Rusak, Kadaluarsa, Penyesuaian fisik opname"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-500 hover:bg-stone-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  Terapkan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SUPPLIER PURCHASE / RESTOCK PO */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                Penerimaan Barang Restock Supplier
              </h3>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Nama Supplier / Distributor *
                </label>
                <input
                  type="text"
                  required
                  value={purchaseSupplier}
                  onChange={e => setPurchaseSupplier(e.target.value)}
                  placeholder="contoh: CV Gayo Mandiri Roastery, PT Danone Indonesia"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              {/* Add item to PO list */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Pilih Produk yang Diterima
                </label>
                <div className="flex gap-2">
                  <select
                    id="po-select-product"
                    className="flex-1 px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stok: {p.stock})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    id="po-item-qty"
                    placeholder="Qty"
                    defaultValue="10"
                    min="1"
                    className="w-20 px-2 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white text-center"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const sel = document.getElementById('po-select-product') as HTMLSelectElement;
                      const qInput = document.getElementById('po-item-qty') as HTMLInputElement;
                      const pId = Number(sel.value);
                      const q = Number(qInput.value);
                      const prod = products.find(p => p.id === pId);
                      if (prod && q > 0) {
                        setPurchaseItemsList(prev => [
                          ...prev.filter(i => i.productId !== pId),
                          { productId: pId, quantity: q, costPrice: Number(prod.costPrice) },
                        ]);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-stone-800 dark:bg-stone-700 text-white font-semibold"
                  >
                    + Masukkan
                  </button>
                </div>
              </div>

              {/* PO Items List */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {purchaseItemsList.map((item, idx) => {
                  const prod = products.find(p => p.id === item.productId);
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-stone-800 dark:text-stone-200">
                          {prod?.name}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {item.quantity} x Rp {item.costPrice.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPurchaseItemsList(prev => prev.filter(i => i.productId !== item.productId))
                        }
                        className="text-red-500 hover:text-red-700 text-[11px]"
                      >
                        Hapus
                      </button>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Catatan PO
                </label>
                <input
                  type="text"
                  value={purchaseNotes}
                  onChange={e => setPurchaseNotes(e.target.value)}
                  placeholder="No faktur supplier atau jatuh tempo..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-500 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  Simpan Pembelian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
