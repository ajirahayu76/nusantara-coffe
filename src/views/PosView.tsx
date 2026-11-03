import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, CartItem, Sale, StoreSettings } from '../types/index.ts';
import { apiFetch } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useRealtime } from '../context/RealtimeContext.tsx';
import { ReceiptModal } from '../components/ReceiptModal.tsx';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  QrCode,
  Banknote,
  Building,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShoppingBag,
  ArrowRight,
  X,
  CreditCard,
  Sparkles,
} from 'lucide-react';

export const PosView: React.FC = () => {
  const { user } = useAuth();
  const { lastEvent, showToast } = useRealtime();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<'nominal' | 'percentage'>('nominal');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'TUNAI' | 'QRIS' | 'TRANSFER'>('TUNAI');
  const [customCash, setCustomCash] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Mobile cart drawer state
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // QRIS Payment Modal State
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [qrisData, setQrisData] = useState<{
    orderId: string;
    amount: number;
    qrImageUrl: string;
    status: string;
    merchantName: string;
    nmid: string;
  } | null>(null);
  const [qrisChecking, setQrisChecking] = useState(false);

  // Success Receipt Modal State
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [completedItems, setCompletedItems] = useState<any[]>([]);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load products, categories, settings
  const loadData = async () => {
    try {
      const [prods, cats, sets] = await Promise.all([
        apiFetch<Product[]>('/products?activeOnly=true'),
        apiFetch<Category[]>('/categories'),
        apiFetch<StoreSettings>('/settings'),
      ]);
      setProducts(prods);
      setCategories(cats);
      setSettings(sets);
    } catch (err) {
      console.error('Failed to load POS data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update product catalog when stock changes or new product is created via real-time
  useEffect(() => {
    if (
      lastEvent?.type === 'STOCK_UPDATED' ||
      lastEvent?.type === 'PRODUCT_CREATED' ||
      lastEvent?.type === 'PRODUCT_UPDATED' ||
      lastEvent?.type === 'TRANSACTION_CANCELLED'
    ) {
      loadData();
    }
  }, [lastEvent]);

  // Handle QRIS Real-time Webhook status change
  useEffect(() => {
    if (lastEvent?.type === 'PAYMENT_STATUS_CHANGED' && qrisData) {
      if (lastEvent.data.orderId === qrisData.orderId) {
        setQrisData(prev => (prev ? { ...prev, status: lastEvent.data.status } : null));
        if (lastEvent.data.status === 'SUCCESS') {
          finalizeCheckout('QRIS', qrisData.amount, qrisData.orderId);
        }
      }
    }
  }, [lastEvent, qrisData]);

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const discountAmount =
    discountType === 'percentage'
      ? (subtotal * Number(discountValue || 0)) / 100
      : Number(discountValue || 0);

  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const taxPercentage = Number(settings?.taxPercentage || '0');
  const taxAmount = (taxableSubtotal * taxPercentage) / 100;
  const grandTotal = Math.round(taxableSubtotal + taxAmount);

  // Cash received: if customCash is set, use it; otherwise automatically default to grandTotal (Uang Pas)
  const cashReceived = customCash !== null ? customCash : grandTotal;
  const changeAmount = cashReceived >= grandTotal ? cashReceived - grandTotal : 0;
  const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      showToast('error', 'Stok Habis', `Produk [${product.name}] saat ini tidak memiliki stok.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast('warning', 'Batas Stok', `Maksimal stok tersedia hanya ${product.stock} ${product.unit}.`);
          return prev;
        }
        showToast('success', 'Jumlah Bertambah', `${product.name} (${existing.quantity + 1} ${product.unit})`);
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * Number(product.sellPrice) }
            : item
        );
      }
      showToast('success', 'Ditambahkan ke Keranjang', `${product.name} (1 ${product.unit})`);
      return [
        ...prev,
        {
          product,
          quantity: 1,
          subtotal: Number(product.sellPrice),
        },
      ];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              showToast('warning', 'Batas Stok', `Maksimal stok tersedia hanya ${item.product.stock} ${item.product.unit}`);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * Number(item.product.sellPrice),
            };
          }
          return item;
        })
        .filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setCustomCash(null);
    setNotes('');
  };

  // Handle barcode scanner input
  const handleBarcodeSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const code = searchQuery.trim();
      if (!code) return;

      const matched = products.find(
        p => (p.barcode && p.barcode === code) || p.sku.toLowerCase() === code.toLowerCase()
      );

      if (matched) {
        addToCart(matched);
        setSearchQuery('');
      } else {
        showToast('warning', 'Produk Tidak Ditemukan', `Barcode/SKU ${code} tidak terdaftar.`);
      }
    }
  };

  // Process Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('error', 'Keranjang Kosong', 'Pilih minimal satu menu untuk transaksi.');
      return;
    }

    if (paymentMethod === 'TUNAI' && cashReceived < grandTotal) {
      showToast(
        'error',
        'Uang Diterima Kurang',
        `Uang diterima (Rp ${cashReceived.toLocaleString('id-ID')}) kurang dari total tagihan (Rp ${grandTotal.toLocaleString('id-ID')}).`
      );
      return;
    }

    if (paymentMethod === 'QRIS') {
      try {
        setLoading(true);
        const res = await apiFetch<{
          orderId: string;
          amount: number;
          qrImageUrl: string;
          status: string;
          merchantName: string;
          nmid: string;
        }>('/payments/qris/create', {
          method: 'POST',
          body: JSON.stringify({
            amount: grandTotal,
            invoiceNumber: `KN-${Date.now().toString().slice(-6)}`,
          }),
        });
        setQrisData(res);
        setShowQrisModal(true);
      } catch (err: any) {
        showToast('error', 'Gagal Membuat Tagihan QRIS', err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Direct checkout for TUNAI & TRANSFER
    await finalizeCheckout(paymentMethod, cashReceived);
  };

  const finalizeCheckout = async (method: string, paidAmount: number, paymentRef?: string) => {
    setLoading(true);
    try {
      const payload = {
        items: cart.map(i => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        discountType,
        discountValue,
        paymentMethod: method,
        amountPaid: paidAmount,
        notes: notes.trim() || undefined,
        paymentRef: paymentRef || undefined,
      };

      const result = await apiFetch<{ sale: Sale; items: any[] }>('/pos/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setShowQrisModal(false);
      setQrisData(null);
      setIsMobileCartOpen(false);
      setCompletedSale(result.sale);
      setCompletedItems(result.items);
      clearCart();
    } catch (err: any) {
      showToast('error', 'Gagal Memproses Transaksi', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Simulate payment gateway webhook callback
  const handleSimulateWebhook = async () => {
    if (!qrisData) return;
    setQrisChecking(true);
    try {
      await apiFetch('/payments/simulate-callback', {
        method: 'POST',
        body: JSON.stringify({
          orderId: qrisData.orderId,
          status: 'SUCCESS',
        }),
      });
      showToast('success', 'Webhook Gateway Terverifikasi', 'Status pembayaran QRIS berhasil.');
    } catch (err: any) {
      showToast('error', 'Verifikasi Gagal', err.message);
    } finally {
      setQrisChecking(false);
    }
  };

  // Filter products by category & search
  const filteredProducts = products.filter(p => {
    if (!p.isActive) return false;
    if (selectedCategory !== 'all' && p.categoryId !== Number(selectedCategory)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Reusable Cart Content Component (used both in desktop side panel & mobile drawer)
  const renderCartContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">
      {/* Cart Header */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ShoppingBag className="w-4.5 h-4.5 text-amber-600" />
            <span>Keranjang Kasir</span>
            <span className="text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
              {totalItemCount}
            </span>
          </h3>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            Kasir: <strong className="text-stone-700 dark:text-stone-200">{user?.fullName || 'Kasir'}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          {isMobileCartOpen && (
            <button
              onClick={() => setIsMobileCartOpen(false)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 p-6 min-h-[180px]">
            <ShoppingBag className="w-12 h-12 stroke-1 text-stone-300 dark:text-stone-700 mb-2" />
            <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
              Keranjang masih kosong
            </p>
            <p className="text-xs text-stone-400 mt-1 max-w-[220px]">
              Klik tombol <strong className="text-amber-600 dark:text-amber-400">+ Tambah</strong> pada menu pilihan Anda untuk memulai pesanan.
            </p>
          </div>
        ) : (
          cart.map(item => (
            <div
              key={item.product.id}
              className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-stone-900 dark:text-stone-100 truncate">
                  {item.product.name}
                </h5>
                <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  Rp {Number(item.product.sellPrice).toLocaleString('id-ID')} / {item.product.unit}
                </div>
              </div>

              {/* Counter controls */}
              <div className="flex items-center gap-1 bg-white dark:bg-stone-900 p-1 rounded-xl border border-stone-200 dark:border-stone-700 shrink-0">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.product.id, -1)}
                  className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  title="Kurangi 1"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center font-bold text-stone-900 dark:text-white">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.product.id, 1)}
                  className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  title="Tambah 1"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="text-right shrink-0">
                <div className="font-bold text-stone-900 dark:text-stone-100">
                  Rp {item.subtotal.toLocaleString('id-ID')}
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-[11px] text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium mt-0.5"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Payment Form */}
      {cart.length > 0 && (
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/90 space-y-3">
          {/* Discount & Order Notes */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1.5 bg-white dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700">
              <span className="text-[11px] text-stone-500 shrink-0">Diskon:</span>
              <input
                type="number"
                min="0"
                value={discountValue || ''}
                onChange={e => setDiscountValue(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-16 text-xs font-semibold text-stone-900 dark:text-white bg-transparent focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setDiscountType(prev => (prev === 'nominal' ? 'percentage' : 'nominal'))}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300 uppercase shrink-0"
              >
                {discountType === 'percentage' ? '%' : 'Rp'}
              </button>
            </div>

            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Catatan pesanan..."
              className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden"
            />
          </div>

          {/* Breakdown Totals */}
          <div className="space-y-1 text-xs text-stone-600 dark:text-stone-400">
            <div className="flex justify-between">
              <span>Subtotal ({totalItemCount} item)</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-600 dark:text-red-400 font-medium">
                <span>Diskon Promo</span>
                <span>-Rp {Math.round(discountAmount).toLocaleString('id-ID')}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between">
                <span>Pajak PPN ({taxPercentage}%)</span>
                <span>Rp {Math.round(taxAmount).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-stone-950 dark:text-white pt-1.5 border-t border-stone-200 dark:border-stone-800">
              <span>TOTAL PEMBAYARAN</span>
              <span className="text-amber-700 dark:text-amber-400 text-lg">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
              Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('TUNAI');
                  setCustomCash(null); // Defaults to Uang Pas!
                }}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition ${
                  paymentMethod === 'TUNAI'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Tunai</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('QRIS')}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition ${
                  paymentMethod === 'QRIS'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition ${
                  paymentMethod === 'TRANSFER'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Transfer</span>
              </button>
            </div>
          </div>

          {/* Tunai Quick Suggestion Buttons & Input */}
          {paymentMethod === 'TUNAI' && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-stone-600 dark:text-stone-400">Uang Diterima:</span>
                <div className="flex items-center gap-1">
                  <span className="text-stone-400">Rp</span>
                  <input
                    type="number"
                    value={cashReceived || ''}
                    onChange={e => {
                      const val = e.target.value === '' ? null : Number(e.target.value);
                      setCustomCash(val);
                    }}
                    placeholder={String(grandTotal)}
                    className="w-28 text-right font-bold text-sm bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg px-2 py-1 text-stone-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div className="grid grid-cols-4 gap-1 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setCustomCash(grandTotal)}
                  className={`py-1 rounded-lg transition ${
                    customCash === grandTotal || customCash === null
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300'
                  }`}
                >
                  Uang Pas
                </button>
                <button
                  type="button"
                  onClick={() => setCustomCash(50000)}
                  className={`py-1 rounded-lg transition ${
                    customCash === 50000
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300'
                  }`}
                >
                  50.000
                </button>
                <button
                  type="button"
                  onClick={() => setCustomCash(100000)}
                  className={`py-1 rounded-lg transition ${
                    customCash === 100000
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300'
                  }`}
                >
                  100.000
                </button>
                <button
                  type="button"
                  onClick={() => setCustomCash(200000)}
                  className={`py-1 rounded-lg transition ${
                    customCash === 200000
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300'
                  }`}
                >
                  200.000
                </button>
              </div>

              {/* Kembalian Feedback */}
              <div className="flex justify-between items-center p-2 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/20 text-xs">
                <span className="font-semibold text-stone-700 dark:text-stone-300">Kembalian:</span>
                <span className="font-bold text-sm text-amber-700 dark:text-amber-400">
                  Rp {changeAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {/* Transfer Bank Information */}
          {paymentMethod === 'TRANSFER' && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs space-y-1">
              <div className="font-semibold text-blue-900 dark:text-blue-300">
                {settings?.bankName || 'BCA'} - {settings?.bankAccountNumber || '883019283341'}
              </div>
              <div className="text-[11px] text-blue-700 dark:text-blue-400">
                a.n {settings?.bankAccountHolder || 'PT Kopi Nusantara Jaya'}
              </div>
            </div>
          )}

          {/* Checkout Submit Button */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm shadow-xl shadow-amber-900/30 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>
              {loading
                ? 'Memproses Transaksi...'
                : paymentMethod === 'QRIS'
                ? `Buat QRIS (Rp ${grandTotal.toLocaleString('id-ID')})`
                : `Bayar Sekarang • Rp ${grandTotal.toLocaleString('id-ID')}`}
            </span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 relative">
      {/* LEFT SECTION: Catalog, Search & Categories */}
      <div className="flex-1 flex flex-col h-full border-r border-stone-200 dark:border-stone-800 overflow-hidden">
        {/* Top Search & Barcode Scanner */}
        <div className="p-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 space-y-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleBarcodeSearch}
                placeholder="Cari menu kopi, makanan, SKU, atau scan barcode..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              Semua Menu ({products.filter(p => p.isActive).length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(String(cat.id))}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === String(cat.id)
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 pb-24 lg:pb-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-stone-400 text-xs">
              Tidak ada produk yang cocok dengan pencarian atau kategori ini.
            </div>
          ) : (
            filteredProducts.map(product => {
              const inCart = cart.find(c => c.product.id === product.id);
              const isLowStock = product.stock <= product.minStock;
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  className={`group rounded-2xl bg-white dark:bg-stone-900 border transition-all duration-200 overflow-hidden flex flex-col justify-between p-3 ${
                    isOutOfStock
                      ? 'opacity-50 cursor-not-allowed border-stone-200 dark:border-stone-800'
                      : inCart
                      ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20'
                      : 'border-stone-200 dark:border-stone-800 hover:border-amber-400 hover:shadow-md'
                  }`}
                >
                  <div
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className="cursor-pointer"
                  >
                    {/* Product Image */}
                    <div className="h-28 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 mb-2.5 relative">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          <ShoppingBag className="w-8 h-8 opacity-40" />
                        </div>
                      )}

                      {/* Stock badge overlay */}
                      <span
                        className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs ${
                          isOutOfStock
                            ? 'bg-red-600 text-white'
                            : isLowStock
                            ? 'bg-orange-500 text-white'
                            : 'bg-emerald-600/90 text-white'
                        }`}
                      >
                        {isOutOfStock ? 'Habis' : `Stok: ${product.stock} ${product.unit}`}
                      </span>

                      {/* In-cart count badge */}
                      {inCart && (
                        <span className="absolute bottom-2 left-2 bg-amber-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-lg shadow-md flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" />
                          <span>{inCart.quantity} di keranjang</span>
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 line-clamp-1 leading-tight">
                      {product.name}
                    </h4>
                    <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                      {product.sku}
                    </p>
                  </div>

                  {/* Card Bottom: Price & Quick Action */}
                  <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-amber-700 dark:text-amber-400">
                        Rp {Number(product.sellPrice).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {inCart ? (
                      /* Quick Stepper on card if already in cart */
                      <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg border border-stone-200 dark:border-stone-700">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            updateQuantity(product.id, -1);
                          }}
                          className="p-1 rounded text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-bold text-xs text-stone-900 dark:text-white">
                          {inCart.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            updateQuantity(product.id, 1);
                          }}
                          className="p-1 rounded text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      /* Add button */
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={e => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white text-xs font-bold transition disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Cart Register (Desktop side panel 380px) */}
      <div className="hidden lg:flex w-[400px] bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 flex-col h-full shadow-lg shrink-0">
        {renderCartContent()}
      </div>

      {/* MOBILE / TABLET FLOATING CART BUTTON (when cart has items on < lg screens) */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-sm shadow-2xl shadow-amber-900/50 flex items-center justify-between animate-slide-up"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                {totalItemCount}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-amber-100">Keranjang Kasir</p>
                <p className="text-sm font-bold">Rp {grandTotal.toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <span>Buka &amp; Bayar</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* MOBILE DRAWER MODAL */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white dark:bg-stone-900 rounded-t-3xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {renderCartContent()}
          </div>
        </div>
      )}

      {/* QRIS DYNAMIC NATIONAL CODE MODAL */}
      {showQrisModal && qrisData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full p-6 text-center border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">Pembayaran QRIS</h3>
              </div>
              <button
                onClick={() => setShowQrisModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="font-bold text-base text-stone-900 dark:text-stone-100">
                {qrisData.merchantName}
              </p>
              <p className="text-[11px] text-stone-500 font-mono">NMID: {qrisData.nmid}</p>
            </div>

            {/* Rendered QRIS Image */}
            <div className="p-3 bg-white rounded-2xl inline-block shadow-inner border border-stone-200">
              <img
                src={qrisData.qrImageUrl}
                alt="QRIS Code Kopi Nusantara"
                className="w-56 h-56 mx-auto object-contain"
              />
            </div>

            <div>
              <p className="text-xs text-stone-500">Total Nominal Pembayaran</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                Rp {qrisData.amount.toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-stone-400 mt-1 font-mono">
                Order ID: {qrisData.orderId}
              </p>
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 py-2 rounded-xl border border-amber-200 dark:border-amber-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <span>Menunggu Pembayaran Pelanggan...</span>
            </div>

            {/* Gateway Webhook Simulation Trigger */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={handleSimulateWebhook}
                disabled={qrisChecking}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {qrisChecking
                    ? 'Memverifikasi Callback...'
                    : 'Simulasi Callback / Verifikasi Gateway'}
                </span>
              </button>
              <p className="text-[10px] text-stone-400 mt-1">
                Memanggil endpoint webhook resmi untuk verifikasi pembayaran otomatis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED TRANSACTION THERMAL RECEIPT MODAL */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          items={completedItems}
          settings={settings}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
};
