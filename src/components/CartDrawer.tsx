import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Coffee } from 'lucide-react';
import { CartItem, OrderType } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  orderType: OrderType;
  onChangeOrderType: (type: OrderType) => void;
  tableNumber: string;
  onChangeTableNumber: (table: string) => void;
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  bringTumbler: boolean;
  onToggleTumbler: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  orderType,
  onChangeOrderType,
  tableNumber,
  onChangeTableNumber,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  bringTumbler,
  onToggleTumbler,
}) => {
  if (!isOpen) return null;

  const rawSubtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const tumblerDiscount = bringTumbler && rawSubtotal > 0 ? 3000 : 0;
  const finalTotal = Math.max(0, rawSubtotal - tumblerDiscount);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl flex flex-col z-10 border-l border-[#E7DFD5]">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E7DFD5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#451A03] text-white flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-[#FDE68A]" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-[#292524]">
                Pesanan Kamu
              </h2>
              <p className="text-[11px] text-[#78716C]">
                {cartItems.length} menu dipilih
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="text-[11px] text-[#DC2626] hover:underline cursor-pointer"
              >
                Kosongkan
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#78716C] hover:bg-[#EFE8DD] transition-colors cursor-pointer"
              aria-label="Tutup keranjang"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Order Mode Switcher */}
        <div className="p-4 bg-white/60 border-b border-[#E7DFD5] space-y-2.5">
          <div className="flex items-center bg-[#EFE8DD] p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => onChangeOrderType('dine-in')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-colors cursor-pointer ${
                orderType === 'dine-in' ? 'bg-[#451A03] text-white shadow-xs' : 'text-[#57534E]'
              }`}
            >
              🍽️ Dine-In
            </button>
            <button
              type="button"
              onClick={() => onChangeOrderType('pickup')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-colors cursor-pointer ${
                orderType === 'pickup' ? 'bg-[#451A03] text-white shadow-xs' : 'text-[#57534E]'
              }`}
            >
              🛍️ Pick-Up
            </button>
            <button
              type="button"
              onClick={() => onChangeOrderType('delivery')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-colors cursor-pointer ${
                orderType === 'delivery' ? 'bg-[#451A03] text-white shadow-xs' : 'text-[#57534E]'
              }`}
            >
              🛵 Delivery
            </button>
          </div>

          {orderType === 'dine-in' && (
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#D7C4B7]">
              <span className="text-xs font-medium text-[#78716C] whitespace-nowrap">Nomor Meja:</span>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => onChangeTableNumber(e.target.value)}
                placeholder="Contoh: Meja 05"
                className="w-full text-xs font-bold text-[#292524] bg-transparent focus:outline-hidden"
              />
            </div>
          )}

          {orderType === 'pickup' && (
            <p className="text-[11px] text-[#78716C] italic px-1">
              *Pesanan akan disiapkan dalam 10-15 menit untuk diambil di kasir bar.
            </p>
          )}

          {orderType === 'delivery' && (
            <p className="text-[11px] text-[#78716C] italic px-1">
              *Pengantaran kurir instan kedai radius s/d 7 KM.
            </p>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Coffee className="w-12 h-12 text-[#D7C4B7] mx-auto mb-3" />
              <h3 className="font-serif font-bold text-base text-[#292524]">
                Keranjangmu Masih Kosong
              </h3>
              <p className="text-xs text-[#78716C] mt-1 max-w-xs mx-auto">
                Pilih menu kopi favoritmu dari daftar menu atau coba racikan rekomendasi Barista AI.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-[#451A03] text-white text-xs font-semibold rounded-xl hover:bg-[#2A0E02] cursor-pointer"
              >
                Jelajahi Menu Sekarang
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.cartItemId}
                className="p-3 bg-white rounded-xl border border-[#E7DFD5] space-y-2 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <img
                      src={item.menuItem.image}
                      alt={item.menuItem.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                    <div>
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[#292524] leading-tight">
                        {item.menuItem.name}
                      </h4>
                      <div className="font-mono text-xs font-bold text-[#C2410C] mt-0.5">
                        Rp {item.unitPrice.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.cartItemId)}
                    className="text-[#A8A29E] hover:text-[#DC2626] transition-colors p-1"
                    title="Hapus item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Customizations summary tags */}
                <div className="flex flex-wrap gap-1 text-[10px] text-[#78716C] bg-[#FAF7F2] p-1.5 rounded-lg">
                  {item.customization.size && (
                    <span className="capitalize">{item.customization.size}</span>
                  )}
                  {item.customization.temperature && (
                    <span>· {item.customization.temperature === 'iced' ? 'Es Dingin' : 'Hangat'}</span>
                  )}
                  {item.customization.sugarLevel && (
                    <span>· Manis {item.customization.sugarLevel}</span>
                  )}
                  {item.customization.milkChoice && item.customization.milkChoice !== 'fresh-milk' && (
                    <span className="text-[#C2410C]">· Susu {item.customization.milkChoice}</span>
                  )}
                  {item.customization.grindSize && (
                    <span>· Giling {item.customization.grindSize}</span>
                  )}
                  {item.customization.addons.length > 0 && (
                    <span>· {item.customization.addons.join(', ')}</span>
                  )}
                  {item.customization.notes && (
                    <span className="w-full text-[10px] text-[#57534E] italic mt-0.5">
                      Catatan: "{item.customization.notes}"
                    </span>
                  )}
                </div>

                {/* Quantity + Item Total */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center border border-[#D7C4B7] rounded-lg bg-[#FAF7F2]">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center text-[#57534E] hover:bg-white rounded-l"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-mono font-bold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center text-[#57534E] hover:bg-white rounded-r"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="font-mono text-xs sm:text-sm font-bold text-[#292524]">
                    Rp {item.totalPrice.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tumbler Discount Toggle */}
        {cartItems.length > 0 && (
          <div className="p-3 bg-[#FFEDD5]/50 border-t border-[#FED7AA] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">☕</span>
              <div>
                <span className="font-semibold text-[#78350F]">Bawa Tumbler Sendiri</span>
                <p className="text-[10px] text-[#9A3412]">Hemat Rp 3.000 untuk bumi lebih hijau</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleTumbler}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                bringTumbler
                  ? 'bg-[#C2410C] text-white shadow-xs'
                  : 'bg-white border border-[#D7C4B7] text-[#57534E]'
              }`}
            >
              {bringTumbler ? '✓ Aktif' : '+ Pasang'}
            </button>
          </div>
        )}

        {/* Drawer Footer with Totals */}
        {cartItems.length > 0 && (
          <div className="p-4 bg-white border-t border-[#E7DFD5] space-y-3">
            <div className="space-y-1.5 text-xs text-[#57534E]">
              <div className="flex justify-between">
                <span>Subtotal ({cartItems.length} item)</span>
                <span className="font-mono font-medium">Rp {rawSubtotal.toLocaleString('id-ID')}</span>
              </div>
              {bringTumbler && (
                <div className="flex justify-between text-[#16A34A] font-medium">
                  <span>Diskon Tumbler Sendiri</span>
                  <span className="font-mono">-Rp 3.000</span>
                </div>
              )}
              <div className="flex justify-between text-[#78716C] text-[11px]">
                <span>Pajak Restoran (PB1)</span>
                <span>Termasuk</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-bold text-[#292524] pt-2 border-t border-[#EFE8DD]">
                <span>Total Pembayaran</span>
                <span className="font-mono text-[#451A03]">
                  Rp {finalTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full py-3.5 px-4 rounded-xl bg-[#451A03] hover:bg-[#2A0E02] text-white text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <span>Lanjut ke Pembayaran</span>
              <div className="flex items-center gap-1">
                <span className="font-mono font-bold text-[#FDE68A]">
                  Rp {finalTotal.toLocaleString('id-ID')}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
