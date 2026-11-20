import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  QrCode,
  Banknote,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShoppingBag,
  User,
  Coffee,
  Printer,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Eye,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../../context/StoreContext';
import { MenuItem, MenuCategory, OrderType, PaymentMethod, TransactionItem } from '../../types';
import { MENU_ITEMS } from '../../data/menuData';
import { downloadReceiptPDF, downloadReceiptExcel } from '../../utils/receiptExport';

interface PosCartLine {
  cartLineId: string;
  menuItem: MenuItem;
  quantity: number;
  temperature: 'iced' | 'hot';
  sugarLevel: 'normal' | '50%' | '25%' | '0%';
  size: 'reguler' | 'large';
  unitPrice: number;
  totalPrice: number;
  customizationSummary: string;
}

export const PosTerminal: React.FC = () => {
  const {
    warehouseItems,
    recordTransaction,
    currentStaffUser,
    lowStockItems,
    lastCompletedTransaction,
    storeSettings,
    openReceiptModal,
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartLines, setCartLines] = useState<PosCartLine[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [tableNumber, setTableNumber] = useState('01');
  const [customerName, setCustomerName] = useState('Pelanggan Walk-In');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Map menu item to its linked warehouse item stock
  const getStockForMenuItem = (menuItemId: string) => {
    const wh = warehouseItems.find((w) => w.linkedMenuItemId === menuItemId);
    if (!wh) return { currentStock: 99, minStock: 10, isLow: false };
    return {
      currentStock: wh.currentStock,
      minStock: wh.minStockThreshold,
      isLow: wh.currentStock <= wh.minStockThreshold,
    };
  };

  const categories: { id: MenuCategory; label: string; icon?: string }[] = [
    { id: 'all', label: 'Semua' },
    { id: 'signature', label: 'Signature Susu', icon: '✨' },
    { id: 'manual-brew', label: 'Manual Brew', icon: '☕' },
    { id: 'espresso', label: 'Espresso', icon: '⚡' },
    { id: 'non-coffee', label: 'Non-Coffee', icon: '🍵' },
    { id: 'food', label: 'Makanan', icon: '🥐' },
    { id: 'beans', label: 'Biji Sangrai', icon: '📦' },
  ];

  const filteredMenuItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.origin?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const handleAddItemToPos = (item: MenuItem, temp?: 'iced' | 'hot') => {
    const stockInfo = getStockForMenuItem(item.id);
    if (stockInfo.currentStock <= 0) {
      alert(`Maaf, stok ${item.name} di gudang telah habis! Silakan lakukan restock.`);
      return;
    }

    const defaultTemp = temp || item.defaultTemp || (item.isIcedAvailable ? 'iced' : 'hot');
    const defaultSugar = 'normal';
    const defaultSize = 'reguler';
    const unitPrice = item.price;
    const cartLineId = `${item.id}-${defaultTemp}-${defaultSugar}-${defaultSize}`;

    setCartLines((prev) => {
      const idx = prev.findIndex((l) => l.cartLineId === cartLineId);
      if (idx > -1) {
        const nextQty = prev[idx].quantity + 1;
        if (nextQty > stockInfo.currentStock) {
          alert(`Stok hanya tersisa ${stockInfo.currentStock}!`);
          return prev;
        }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: nextQty,
          totalPrice: nextQty * updated[idx].unitPrice,
        };
        return updated;
      } else {
        const newLine: PosCartLine = {
          cartLineId,
          menuItem: item,
          quantity: 1,
          temperature: defaultTemp,
          sugarLevel: defaultSugar,
          size: defaultSize,
          unitPrice,
          totalPrice: unitPrice,
          customizationSummary: `${defaultSize} · ${defaultTemp === 'iced' ? 'Dingin' : 'Hangat'}`,
        };
        return [...prev, newLine];
      }
    });
  };

  const handleUpdateLineQty = (lineId: string, newQty: number) => {
    if (newQty <= 0) {
      setCartLines((prev) => prev.filter((l) => l.cartLineId !== lineId));
      return;
    }
    setCartLines((prev) =>
      prev.map((l) => {
        if (l.cartLineId === lineId) {
          const stock = getStockForMenuItem(l.menuItem.id).currentStock;
          if (newQty > stock) {
            alert(`Maksimal stok tersedia: ${stock}`);
            return l;
          }
          return {
            ...l,
            quantity: newQty,
            totalPrice: newQty * l.unitPrice,
          };
        }
        return l;
      })
    );
  };

  const handleRemoveLine = (lineId: string) => {
    setCartLines((prev) => prev.filter((l) => l.cartLineId !== lineId));
  };

  const rawSubtotal = cartLines.reduce((acc, l) => acc + l.totalPrice, 0);
  const finalTotal = Math.max(0, rawSubtotal - discountAmount);
  const cashChange = paymentMethod === 'cash' && cashGiven > finalTotal ? cashGiven - finalTotal : 0;

  const handleProcessCheckout = () => {
    if (cartLines.length === 0) {
      alert('Pilih minimal 1 menu untuk transaksi kasir.');
      return;
    }

    if (paymentMethod === 'cash' && cashGiven < finalTotal) {
      alert(`Nominal uang tunai kurang! Total bayar: Rp ${finalTotal.toLocaleString('id-ID')}`);
      return;
    }

    // Build transaction items
    const txItems: TransactionItem[] = cartLines.map((line) => {
      const whItem = warehouseItems.find((w) => w.linkedMenuItemId === line.menuItem.id);
      return {
        itemId: whItem ? whItem.id : `item-${line.menuItem.id}`,
        menuItemId: line.menuItem.id,
        name: line.menuItem.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        totalPrice: line.totalPrice,
        costPrice: whItem ? whItem.costPrice : Math.round(line.unitPrice * 0.4),
        customizationSummary: line.customizationSummary,
      };
    });

    // Record transaction -> reduces warehouse stock & logs transaction
    recordTransaction({
      customerName,
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
      items: txItems,
      subtotal: rawSubtotal,
      discount: discountAmount,
      tax: 0,
      totalAmount: finalTotal,
      paymentMethod,
      cashGiven: paymentMethod === 'cash' ? cashGiven : undefined,
      cashChange: paymentMethod === 'cash' ? cashChange : undefined,
      notes,
    });

    // Confetti celebration
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.5 },
      });
    } catch { /* safe */ }

    // Reset POS cart
    setCartLines([]);
    setDiscountAmount(0);
    setCashGiven(0);
    setNotes('');
    setCustomerName('Pelanggan Walk-In');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FAF7F2] p-3 sm:p-6 text-[#292524]">
      {/* Top POS Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#E7DFD5]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-[#292524]">
              Kasir Point of Sale (POS)
            </h1>
            <span className="text-[11px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
              Kasir Aktif: {currentStaffUser.name}
            </span>
          </div>
          <p className="text-xs text-[#78716C] mt-0.5">
            Setiap transaksi akan memotong stok gudang otomatis & memperbarui grafik finansial seketika.
          </p>
        </div>

        {/* Right Header Pills: Last Receipt Quick Export + Low Stock Warning */}
        <div className="flex flex-wrap items-center gap-2">
          {lastCompletedTransaction && (
            <div className="flex items-center gap-1.5 bg-white border border-[#D7C4B7] px-2.5 py-1.5 rounded-xl text-[11px] shadow-2xs">
              <span className="font-mono font-bold text-[#451A03] hidden sm:inline">
                {lastCompletedTransaction.invoiceNumber}
              </span>
              <button
                type="button"
                onClick={() => openReceiptModal(lastCompletedTransaction)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FAF7F2] hover:bg-[#EFE8DD] border border-[#D7C4B7] text-[#292524] font-semibold cursor-pointer"
                title="Lihat & Cetak Struk Terakhir"
              >
                <Eye className="w-3 h-3" />
                <span>Struk</span>
              </button>
              <button
                type="button"
                onClick={() => downloadReceiptPDF(lastCompletedTransaction, storeSettings)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white font-semibold cursor-pointer"
                title="Download Struk Terakhir (PDF)"
              >
                <FileText className="w-3 h-3" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={() => downloadReceiptExcel(lastCompletedTransaction, storeSettings)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold cursor-pointer"
                title="Download Struk Terakhir (Excel)"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Excel</span>
              </button>
            </div>
          )}

          {lowStockItems.length > 0 && (
            <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FCA5A5] px-3 py-1.5 rounded-xl text-xs text-[#DC2626]">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>{lowStockItems.length} Bahan/Menu</strong> mencapai batas stok minimum!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main POS Layout: Grid 12 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Side: Product Catalog (7 or 8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Search & Categories */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#E7DFD5] shadow-2xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu POS cepat (Kopi Susu, V60, Croissant, Espresso)..."
                className="w-full pl-10 pr-4 py-2 bg-[#FAF7F2] border border-[#D7C4B7] rounded-xl text-xs sm:text-sm text-[#292524] focus:outline-hidden focus:border-[#C2410C]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#78716C]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-[#451A03] text-white shadow-xs'
                      : 'bg-[#FAF7F2] border border-[#E7DFD5] text-[#57534E] hover:border-[#D7C4B7]'
                  }`}
                >
                  {c.icon && <span className="mr-1">{c.icon}</span>}
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[650px] overflow-y-auto p-1">
            {filteredMenuItems.map((item) => {
              const stock = getStockForMenuItem(item.id);
              const isOutOfStock = stock.currentStock <= 0;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border p-2.5 flex flex-col justify-between transition-all select-none ${
                    isOutOfStock
                      ? 'opacity-50 border-red-300 bg-red-50/30'
                      : 'border-[#E7DFD5] hover:border-[#C2410C] hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="relative h-24 w-full rounded-lg overflow-hidden bg-[#EFE8DD]">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Live Stock Badge */}
                      <span
                        className={`absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs ${
                          isOutOfStock
                            ? 'bg-red-600 text-white'
                            : stock.isLow
                            ? 'bg-amber-500 text-white animate-pulse'
                            : 'bg-black/70 text-white'
                        }`}
                      >
                        {isOutOfStock ? 'HABIS' : `Stok: ${stock.currentStock}`}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-[#292524] line-clamp-1 leading-snug">
                      {item.name}
                    </h4>
                    <div className="font-mono text-xs font-bold text-[#C2410C]">
                      Rp {item.price.toLocaleString('id-ID')}
                    </div>
                  </div>

                  {/* Add action */}
                  <div className="pt-2 mt-1 border-t border-[#F5EFE6] flex items-center gap-1">
                    {item.isIcedAvailable && (
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleAddItemToPos(item, 'iced')}
                        className="flex-1 py-1 rounded bg-[#EFE8DD] hover:bg-[#D7C4B7] text-[10px] font-semibold text-[#451A03] transition-colors disabled:opacity-30 cursor-pointer"
                        title="Tambah varian Es Dingin"
                      >
                        ❄️ Es
                      </button>
                    )}
                    {item.isHotAvailable && (
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleAddItemToPos(item, 'hot')}
                        className="flex-1 py-1 rounded bg-[#EFE8DD] hover:bg-[#D7C4B7] text-[10px] font-semibold text-[#451A03] transition-colors disabled:opacity-30 cursor-pointer"
                        title="Tambah varian Hangat"
                      >
                        ☕ Hangat
                      </button>
                    )}
                    {!item.isIcedAvailable && !item.isHotAvailable && (
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleAddItemToPos(item)}
                        className="w-full py-1 rounded bg-[#451A03] text-white text-[10px] font-semibold hover:bg-[#2A0E02] transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        + Tambah
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Side: POS Transaction Bill / Cart (5 or 4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-[#E7DFD5] shadow-md p-4 sm:p-5 flex flex-col justify-between min-h-[650px]">
          
          <div className="space-y-3.5">
            {/* Header: Customer & Order Type */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E7DFD5]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#C2410C]" />
                <span className="font-serif font-bold text-base text-[#292524]">
                  Keranjang Kasir
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[#78716C] bg-[#FAF7F2] px-2 py-0.5 rounded">
                {cartLines.length} Item
              </span>
            </div>

            {/* Order Type & Table */}
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#EFE8DD] rounded-xl font-medium">
                <button
                  type="button"
                  onClick={() => setOrderType('dine-in')}
                  className={`py-1.5 rounded-lg text-center transition-colors ${
                    orderType === 'dine-in' ? 'bg-[#451A03] text-white font-bold' : 'text-[#57534E]'
                  }`}
                >
                  Dine-In
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('pickup')}
                  className={`py-1.5 rounded-lg text-center transition-colors ${
                    orderType === 'pickup' ? 'bg-[#451A03] text-white font-bold' : 'text-[#57534E]'
                  }`}
                >
                  Pick-Up
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`py-1.5 rounded-lg text-center transition-colors ${
                    orderType === 'delivery' ? 'bg-[#451A03] text-white font-bold' : 'text-[#57534E]'
                  }`}
                >
                  Delivery
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#78716C]">Pelanggan</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-1.5 text-xs rounded-lg border border-[#D7C4B7] bg-[#FAF7F2]"
                  />
                </div>
                {orderType === 'dine-in' && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#78716C]">No. Meja</label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="Meja 01"
                      className="w-full p-1.5 text-xs rounded-lg border border-[#D7C4B7] bg-[#FAF7F2]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {cartLines.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#A8A29E] border border-dashed border-[#D7C4B7] rounded-xl">
                  Klik menu di samping untuk menambahkan pesanan
                </div>
              ) : (
                cartLines.map((line) => (
                  <div
                    key={line.cartLineId}
                    className="p-2.5 rounded-xl border border-[#E7DFD5] bg-[#FAF7F2] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#292524] truncate">
                        {line.menuItem.name}
                      </div>
                      <div className="text-[10px] text-[#78716C]">
                        {line.customizationSummary} · Rp {line.unitPrice.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center border border-[#D7C4B7] rounded-lg bg-white">
                        <button
                          type="button"
                          onClick={() => handleUpdateLineQty(line.cartLineId, line.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center text-[#78716C]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-mono font-bold text-xs">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateLineQty(line.cartLineId, line.quantity + 1)}
                          className="w-5 h-5 flex items-center justify-center text-[#78716C]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-mono font-bold text-[#451A03] w-16 text-right">
                        Rp {line.totalPrice.toLocaleString('id-ID')}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.cartLineId)}
                        className="text-[#A8A29E] hover:text-[#DC2626] p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Discount selector (Tumbler / Promo) */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[#78716C]">Diskon Promo:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDiscountAmount(discountAmount === 3000 ? 0 : 3000)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    discountAmount === 3000
                      ? 'bg-[#16A34A] text-white border-[#16A34A]'
                      : 'border-[#D7C4B7] text-[#57534E]'
                  }`}
                >
                  Tumbler (-3k)
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountAmount(discountAmount === 5000 ? 0 : 5000)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    discountAmount === 5000
                      ? 'bg-[#16A34A] text-white border-[#16A34A]'
                      : 'border-[#D7C4B7] text-[#57534E]'
                  }`}
                >
                  Voucher (-5k)
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Payment Processing */}
          <div className="pt-3 border-t border-[#E7DFD5] space-y-3">
            
            {/* Calculation rows */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[#78716C]">
                <span>Subtotal ({cartLines.length} item)</span>
                <span className="font-mono">Rp {rawSubtotal.toLocaleString('id-ID')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#16A34A]">
                  <span>Potongan Diskon</span>
                  <span className="font-mono">-Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#292524] pt-1 border-t border-[#EFE8DD]">
                <span>Total Tagihan:</span>
                <span className="font-mono text-[#C2410C]">
                  Rp {finalTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'qris'
                    ? 'border-[#C2410C] bg-[#FFEDD5] text-[#451A03] font-bold shadow-2xs'
                    : 'border-[#E7DFD5] bg-white text-[#57534E]'
                }`}
              >
                <QrCode className="w-4 h-4 text-[#C2410C]" />
                <span>QRIS Instan</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('cash');
                  setCashGiven(finalTotal);
                }}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-[#C2410C] bg-[#FFEDD5] text-[#451A03] font-bold shadow-2xs'
                    : 'border-[#E7DFD5] bg-white text-[#57534E]'
                }`}
              >
                <Banknote className="w-4 h-4 text-[#16A34A]" />
                <span>Tunai / Cash</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (paymentMethod !== 'bca' && paymentMethod !== 'mandiri') {
                    setPaymentMethod('bca');
                  }
                }}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  paymentMethod === 'bca' || paymentMethod === 'mandiri'
                    ? 'border-[#C2410C] bg-[#FFEDD5] text-[#451A03] font-bold shadow-2xs'
                    : 'border-[#E7DFD5] bg-white text-[#57534E]'
                }`}
              >
                <Building2 className="w-4 h-4 text-[#0284C7]" />
                <span>Transfer Bank</span>
              </button>
            </div>

            {/* Fast Cash Given Input */}
            {paymentMethod === 'cash' && (
              <div className="space-y-1.5 p-2.5 bg-[#FAF7F2] rounded-xl border border-[#D7C4B7]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#78716C]">Uang Tunai Diterima:</span>
                  <input
                    type="number"
                    value={cashGiven || ''}
                    onChange={(e) => setCashGiven(Number(e.target.value))}
                    className="w-28 p-1 text-right font-mono font-bold text-xs bg-white border border-[#D7C4B7] rounded"
                  />
                </div>
                {/* Fast presets */}
                <div className="flex items-center justify-end gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setCashGiven(finalTotal)}
                    className="px-1.5 py-0.5 bg-white border rounded hover:bg-[#EFE8DD]"
                  >
                    Uang Pas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashGiven(50000)}
                    className="px-1.5 py-0.5 bg-white border rounded hover:bg-[#EFE8DD]"
                  >
                    50k
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashGiven(100000)}
                    className="px-1.5 py-0.5 bg-white border rounded hover:bg-[#EFE8DD]"
                  >
                    100k
                  </button>
                </div>
                {cashGiven >= finalTotal && (
                  <div className="flex justify-between text-xs font-bold text-[#16A34A] pt-1 border-t border-[#EFE8DD]">
                    <span>Kembalian:</span>
                    <span className="font-mono">Rp {cashChange.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Fast QRIS Preview */}
            {paymentMethod === 'qris' && (
              <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#D7C4B7] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white border p-1 rounded flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-[#C2410C]" />
                  </div>
                  <div>
                    <div className="font-bold text-[11px] text-[#292524]">QRIS Dinamis Siap Scan</div>
                    <div className="text-[10px] text-[#78716C]">NMID: {storeSettings.qrisNmid || 'ID102008892182'}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded">
                  Auto-Verified
                </span>
              </div>
            )}

            {/* Fast Transfer Bank Preview */}
            {(paymentMethod === 'bca' || paymentMethod === 'mandiri') && (
              <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#D7C4B7] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white border p-1 rounded flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-[#0284C7]" />
                    </div>
                    <div>
                      <div className="font-bold text-[11px] text-[#292524]">
                        {paymentMethod === 'mandiri'
                          ? 'Bank Mandiri · 123-00-9988-7766'
                          : 'Bank BCA · 800-1122-3344'}
                      </div>
                      <div className="text-[10px] text-[#78716C]">a/n PT Salam Kopi Indonesia</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded">
                    Struk Siap
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bca')}
                    className={`flex-1 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                      paymentMethod === 'bca'
                        ? 'bg-[#0284C7] text-white border-[#0284C7]'
                        : 'bg-white text-[#57534E] border-[#D7C4B7]'
                    }`}
                  >
                    Bank BCA
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mandiri')}
                    className={`flex-1 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                      paymentMethod === 'mandiri'
                        ? 'bg-[#0284C7] text-white border-[#0284C7]'
                        : 'bg-white text-[#57534E] border-[#D7C4B7]'
                    }`}
                  >
                    Bank Mandiri
                  </button>
                </div>
              </div>
            )}

            {/* Complete Transaction Button */}
            <button
              type="button"
              disabled={cartLines.length === 0}
              onClick={handleProcessCheckout}
              className="w-full py-3.5 px-4 rounded-xl bg-[#451A03] hover:bg-[#2A0E02] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center justify-between shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-[#FDE68A]" />
                <span>Bayar & Cetak Struk Otomatis</span>
              </div>
              <span className="font-mono font-bold text-[#FDE68A]">
                Rp {finalTotal.toLocaleString('id-ID')}
              </span>
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
