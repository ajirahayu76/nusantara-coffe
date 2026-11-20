import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  Copy,
  MessageCircle,
  QrCode,
  Building2,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  Printer,
  AlertCircle,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CartItem,
  OrderType,
  PaymentMethod,
  CustomerDetails,
  SaleTransaction,
  StoreSettings,
} from '../types';
import {
  getPaymentDetails,
  downloadReceiptPDF,
  downloadReceiptExcel,
  DownloadResult,
} from '../utils/receiptExport';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  orderType: OrderType;
  tableNumber: string;
  bringTumbler: boolean;
  onOrderSuccess: (details: CustomerDetails) => SaleTransaction;
  storeSettings: StoreSettings;
  onOpenReceipt: (tx: SaleTransaction) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  orderType,
  tableNumber,
  bringTumbler,
  onOrderSuccess,
  storeSettings,
  onOpenReceipt,
}) => {
  const rawSubtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const tumblerDiscount = bringTumbler ? 3000 : 0;
  const finalTotal = Math.max(0, rawSubtotal - tumblerDiscount);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [table, setTable] = useState(tableNumber || '');
  const [address, setAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('15 menit lagi');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris');
  const [cashGiven, setCashGiven] = useState<number>(finalTotal);
  const [notes, setNotes] = useState('');
  const [copiedBank, setCopiedBank] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [completedTx, setCompletedTx] = useState<SaleTransaction | null>(null);
  const [lastWaText, setLastWaText] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [downloadedType, setDownloadedType] = useState<'pdf' | 'excel' | null>(null);
  const [lastDownload, setLastDownload] = useState<(DownloadResult & { kind: 'pdf' | 'excel' }) | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const wasOpenRef = useRef(false);

  // Only reset checkout state when modal transitions from closed -> open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setOrderPlaced(false);
      setCompletedTx(null);
      setValidationError(null);
      setDownloadedType(null);
      setLastDownload(null);
      setDownloadError(null);
      setTable(tableNumber || '');
      setCashGiven(finalTotal);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, tableNumber, finalTotal]);

  if (!isOpen) return null;

  const cashChange = paymentMethod === 'cash' ? Math.max(0, cashGiven - finalTotal) : 0;

  const generateWhatsAppMessage = (txOverride?: SaleTransaction | null) => {
    const activeTotal = txOverride ? txOverride.totalAmount : finalTotal;
    const activeSubtotal = txOverride ? txOverride.subtotal : rawSubtotal;
    const activeDiscount = txOverride ? txOverride.discount : tumblerDiscount;
    const activeMethod = txOverride ? txOverride.paymentMethod : paymentMethod;

    let msg = `*PESANAN SALAM KOPI* ☕\n`;
    msg += `-------------------------------\n`;
    if (txOverride) {
      msg += `*No. Invoice:* ${txOverride.invoiceNumber}\n`;
    }
    msg += `*Tipe Pesanan:* ${
      orderType === 'dine-in'
        ? `Dine-In (${table ? `Meja ${table}` : 'Belum isi meja'})`
        : orderType === 'pickup'
        ? `Pick-Up (${pickupTime})`
        : `Delivery ke alamat: ${address || '-'}`
    }\n`;
    msg += `*Nama:* ${name || 'Pelanggan Salam Kopi'}\n`;
    msg += `*No. WA:* ${phone || '-'}\n\n`;
    msg += `*DETAIL MENU:*\n`;

    if (txOverride) {
      txOverride.items.forEach((item, index) => {
        msg += `${index + 1}. *${item.name}* (x${item.quantity}) - Rp ${item.totalPrice.toLocaleString('id-ID')}\n`;
        if (item.customizationSummary) {
          msg += `   └ [${item.customizationSummary}]\n`;
        }
      });
    } else {
      cartItems.forEach((item, index) => {
        msg += `${index + 1}. *${item.menuItem.name}* (x${item.quantity}) - Rp ${item.totalPrice.toLocaleString('id-ID')}\n`;
        const tags = [];
        if (item.customization.size) tags.push(item.customization.size);
        if (item.customization.temperature) tags.push(item.customization.temperature === 'iced' ? 'Es' : 'Hangat');
        if (item.customization.sugarLevel) tags.push(`Gula: ${item.customization.sugarLevel}`);
        if (item.customization.milkChoice && item.customization.milkChoice !== 'fresh-milk') tags.push(`Susu: ${item.customization.milkChoice}`);
        if (item.customization.grindSize) tags.push(`Giling: ${item.customization.grindSize}`);
        if (item.customization.addons.length > 0) tags.push(`Topping: ${item.customization.addons.join(', ')}`);
        if (tags.length > 0) {
          msg += `   └ [${tags.join(' | ')}]\n`;
        }
        if (item.customization.notes) {
          msg += `   └ Catatan: "${item.customization.notes}"\n`;
        }
      });
    }

    msg += `\n-------------------------------\n`;
    msg += `*Subtotal:* Rp ${activeSubtotal.toLocaleString('id-ID')}\n`;
    if (activeDiscount > 0) {
      msg += `*Diskon Bawa Tumbler:* -Rp ${activeDiscount.toLocaleString('id-ID')}\n`;
    }
    msg += `*TOTAL BAYAR:* Rp ${activeTotal.toLocaleString('id-ID')}\n`;
    msg += `*Metode Bayar:* ${
      activeMethod === 'qris'
        ? 'QRIS Dinamis'
        : activeMethod === 'bca'
        ? 'Transfer Bank BCA'
        : activeMethod === 'mandiri'
        ? 'Transfer Bank Mandiri'
        : 'Tunai / Cash'
    }\n`;
    if (notes) {
      msg += `*Catatan Tambahan:* ${notes}\n`;
    }
    msg += `\nTerima kasih Salam Kopi! Mohon konfirmasi pesanan saya. 🙏`;

    return encodeURIComponent(msg);
  };

  const handleCopyBankAccount = () => {
    const accNo = paymentMethod === 'mandiri' ? '1230099887766' : '80011223344';
    navigator.clipboard.writeText(accNo);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const submitOrder = (): SaleTransaction | null => {
    if (!name.trim()) {
      setValidationError('Mohon isi nama pemesan terlebih dahulu.');
      return null;
    }

    if (cartItems.length === 0) {
      setValidationError('Keranjang masih kosong. Silakan pilih menu terlebih dahulu.');
      return null;
    }

    setValidationError(null);
    const code = `SK-${Math.floor(1000 + Math.random() * 9000)}`;
    setOrderCode(code);

    const effectiveCashGiven =
      paymentMethod === 'cash' ? Math.max(cashGiven || finalTotal, finalTotal) : undefined;
    const effectiveCashChange =
      paymentMethod === 'cash' && effectiveCashGiven !== undefined
        ? Math.max(0, effectiveCashGiven - finalTotal)
        : undefined;

    const createdTx = onOrderSuccess({
      name: name.trim(),
      phone,
      tableNumber: table,
      deliveryAddress: address,
      pickupTime,
      orderType,
      paymentMethod,
      cashGiven: effectiveCashGiven,
      cashChange: effectiveCashChange,
      notes,
    });

    setLastWaText(generateWhatsAppMessage(createdTx));
    setCompletedTx(createdTx);
    setOrderPlaced(true);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C2410C', '#451A03', '#FDE68A', '#16A34A'],
      });
    } catch {
      // safe fallback
    }

    return createdTx;
  };

  const handleCompleteOrder = () => {
    submitOrder();
  };

  const handleOpenWhatsApp = () => {
    const waEncoded = generateWhatsAppMessage();
    const created = submitOrder();
    if (!created) return;
    const waUrl = `https://wa.me/6281288227711?text=${waEncoded}`;
    const anchor = document.createElement('a');
    anchor.href = waUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => anchor.remove(), 500);
  };

  const handleDownloadPDF = () => {
    if (!completedTx) return;
    try {
      setDownloadError(null);
      const res = downloadReceiptPDF(completedTx, storeSettings);
      setLastDownload({ ...res, kind: 'pdf' });
      setDownloadedType('pdf');
      setTimeout(() => setDownloadedType(null), 2500);
    } catch (err) {
      setDownloadError('Gagal membuat PDF struk. Silakan coba lihat pratinjau cetak.');
      console.error('PDF export error:', err);
    }
  };

  const handleDownloadExcel = () => {
    if (!completedTx) return;
    try {
      setDownloadError(null);
      const res = downloadReceiptExcel(completedTx, storeSettings);
      setLastDownload({ ...res, kind: 'excel' });
      setDownloadedType('excel');
      setTimeout(() => setDownloadedType(null), 2500);
    } catch (err) {
      setDownloadError('Gagal membuat file Excel struk.');
      console.error('Excel export error:', err);
    }
  };

  const completedPaymentDetails = completedTx
    ? getPaymentDetails(completedTx, storeSettings)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#E7DFD5] overflow-hidden my-8 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E7DFD5] flex items-center justify-between flex-shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C2410C]">
              Kasir Salam Kopi
            </span>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#292524]">
              {orderPlaced ? 'Pesanan Berhasil Dibuat!' : 'Konfirmasi & Pembayaran'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#78716C] hover:bg-[#EFE8DD] transition-colors cursor-pointer"
            aria-label="Tutup kasir"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {orderPlaced && completedTx && completedPaymentDetails ? (
          <div className="p-6 sm:p-7 text-center space-y-4 overflow-y-auto">
            <div className="w-14 h-14 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-[11px] font-mono font-bold text-[#C2410C] bg-[#FFEDD5] px-3 py-1 rounded-full">
                  KODE: #{orderCode}
                </span>
                <span className="text-[11px] font-mono font-bold text-[#451A03] bg-[#EFE8DD] px-3 py-1 rounded-full">
                  {completedTx.invoiceNumber}
                </span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#292524] mt-3">
                Terima Kasih, Kak {completedTx.customerName}!
              </h3>
              <p className="text-xs text-[#57534E] max-w-sm mx-auto mt-1">
                Pesanan tercatat di sistem kasir. Silakan unduh struk pembayaran resmi dalam format PDF atau Excel di bawah ini.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-white p-4 rounded-2xl border border-[#E7DFD5] text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between text-[#78716C]">
                <span>Tipe Pesanan:</span>
                <span className="font-bold text-[#292524] uppercase">
                  {completedTx.orderType === 'dine-in'
                    ? `Dine-in (${completedTx.tableNumber || 'Meja Kasir'})`
                    : completedTx.orderType}
                </span>
              </div>
              <div className="flex justify-between text-[#78716C]">
                <span>Total Item:</span>
                <span className="font-semibold text-[#292524]">
                  {completedTx.items.reduce((sum, i) => sum + i.quantity, 0)} Item ({completedTx.items.length} Menu)
                </span>
              </div>
              <div className="flex justify-between text-[#78716C]">
                <span>Metode Pembayaran:</span>
                <span className="font-bold text-[#292524]">
                  {completedPaymentDetails.methodLabel}
                </span>
              </div>

              {/* Method-specific rows */}
              <div className="pt-2 border-t border-dashed border-[#EFE8DD] space-y-1 text-[11px]">
                {completedPaymentDetails.detailRows.map((row, idx) => (
                  <div key={idx} className="flex justify-between gap-2">
                    <span className="text-[#78716C]">{row.label}:</span>
                    <span className="font-semibold text-[#292524] text-right">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm font-bold text-[#451A03] pt-2 border-t border-[#EFE8DD]">
                <span>Total Bayar:</span>
                <span className="font-mono">Rp {completedTx.totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Receipt Download Actions (PDF, Excel, Print Preview) */}
            <div className="max-w-md mx-auto bg-white p-3.5 rounded-2xl border border-[#E7DFD5] space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                Download Struk Pembayaran ({completedPaymentDetails.shortBadge})
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="py-2.5 px-3 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  {downloadedType === 'pdf' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>PDF Terunduh</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="py-2.5 px-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  {downloadedType === 'excel' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Excel Terunduh</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Download Excel</span>
                    </>
                  )}
                </button>
              </div>

              {downloadError && (
                <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px]">
                  {downloadError}
                </div>
              )}

              {lastDownload && (
                <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#D7C4B7] text-[11px] text-[#451A03] flex flex-wrap items-center justify-center gap-2">
                  <Download className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>File siap:</span>
                  <a
                    href={lastDownload.url}
                    download={lastDownload.filename}
                    className="font-bold underline text-[#C2410C] hover:text-[#9A3412]"
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
              )}

              <button
                type="button"
                onClick={() => onOpenReceipt(completedTx)}
                className="w-full py-2 px-3 rounded-xl border border-[#D7C4B7] hover:border-[#C2410C] text-[#451A03] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#C2410C]" />
                <span>Lihat Pratinjau & Cetak Struk</span>
              </button>
            </div>

            <div className="pt-1 flex flex-col sm:flex-row gap-2 justify-center max-w-md mx-auto">
              <a
                href={`https://wa.me/6281288227711?text=${lastWaText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#16A34A] text-white text-xs font-semibold hover:bg-[#15803D] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Kirim ke WhatsApp
              </a>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#451A03] text-white text-xs font-semibold hover:bg-[#2A0E02] cursor-pointer"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-[#292524]">
            
            {validationError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 text-xs font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Customer Information Form */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#78716C]">
                Data Pemesan
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#57534E] mb-1">
                    Nama Pemesan *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="Contoh: Aji Rahayu"
                    className="w-full p-2.5 rounded-xl border border-[#D7C4B7] bg-white text-xs focus:outline-hidden focus:border-[#C2410C]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#57534E] mb-1">
                    Nomor WhatsApp / HP *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full p-2.5 rounded-xl border border-[#D7C4B7] bg-white text-xs focus:outline-hidden focus:border-[#C2410C]"
                  />
                </div>
              </div>

              {/* Order type specific fields */}
              {orderType === 'dine-in' && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#57534E] mb-1">
                    Nomor Meja Kedai
                  </label>
                  <input
                    type="text"
                    value={table}
                    onChange={(e) => setTable(e.target.value)}
                    placeholder="Contoh: Meja 04 (Lantai 1)"
                    className="w-full p-2.5 rounded-xl border border-[#D7C4B7] bg-white text-xs focus:outline-hidden focus:border-[#C2410C]"
                  />
                </div>
              )}

              {orderType === 'delivery' && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#57534E] mb-1">
                    Alamat Lengkap Pengantaran *
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Tuliskan nama jalan, nomor rumah/kantor, patokan..."
                    className="w-full p-2.5 rounded-xl border border-[#D7C4B7] bg-white text-xs focus:outline-hidden focus:border-[#C2410C]"
                  />
                </div>
              )}

              {orderType === 'pickup' && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#57534E] mb-1">
                    Waktu Pengambilan
                  </label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#D7C4B7] bg-white text-xs focus:outline-hidden focus:border-[#C2410C]"
                  >
                    <option value="10 menit lagi">10 Menit Lagi</option>
                    <option value="20 menit lagi">20 Menit Lagi</option>
                    <option value="30 menit lagi">30 Menit Lagi</option>
                    <option value="1 jam lagi">1 Jam Lagi</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#57534E] mb-1">
                  Catatan Tambahan untuk Kasir / Barista
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: tolong jangan dipisah plastiknya..."
                  className="w-full p-2.5 rounded-xl border border-[#D7C4B7] bg-white text-xs focus:outline-hidden focus:border-[#C2410C]"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 pt-3 border-t border-[#EFE8DD]">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#78716C]">
                Metode Pembayaran
              </h3>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'qris'
                      ? 'border-[#C2410C] bg-[#FFEDD5]/50 text-[#292524] font-bold shadow-xs'
                      : 'border-[#E7DFD5] bg-white text-[#57534E]'
                  }`}
                >
                  <QrCode className="w-5 h-5 mx-auto mb-1 text-[#C2410C]" />
                  <span>QRIS Dinamis</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (paymentMethod !== 'bca' && paymentMethod !== 'mandiri') {
                      setPaymentMethod('bca');
                    }
                  }}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'bca' || paymentMethod === 'mandiri'
                      ? 'border-[#C2410C] bg-[#FFEDD5]/50 text-[#292524] font-bold shadow-xs'
                      : 'border-[#E7DFD5] bg-white text-[#57534E]'
                  }`}
                >
                  <Building2 className="w-5 h-5 mx-auto mb-1 text-[#0284C7]" />
                  <span>Transfer Bank</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('cash');
                    setCashGiven(finalTotal);
                  }}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'border-[#C2410C] bg-[#FFEDD5]/50 text-[#292524] font-bold shadow-xs'
                      : 'border-[#E7DFD5] bg-white text-[#57534E]'
                  }`}
                >
                  <Banknote className="w-5 h-5 mx-auto mb-1 text-[#16A34A]" />
                  <span>Tunai di Kasir</span>
                </button>
              </div>

              {/* Dynamic QRIS Simulation Screen */}
              {paymentMethod === 'qris' && (
                <div className="p-4 bg-white rounded-2xl border border-[#E7DFD5] text-center space-y-2">
                  <div className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider">
                    Scan via GoPay, OVO, Dana, BCA, ShopeePay
                  </div>
                  
                  {/* QR Box */}
                  <div className="w-40 h-40 mx-auto p-2 border-2 border-[#292524] rounded-xl bg-white shadow-xs flex flex-col items-center justify-center relative">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <rect width="100" height="100" fill="#ffffff" />
                      <path d="M10 10h24v24h-24zM66 10h24v24h-24zM10 66h24v24h-24z" fill="#000" />
                      <path d="M16 16h12v12h-12zM72 16h12v12h-12zM16 72h12v12h-12z" fill="#fff" />
                      <path d="M19 19h6v6h-6zM75 19h6v6h-6zM19 75h6v6h-6z" fill="#000" />
                      <circle cx="45" cy="20" r="3" fill="#000" />
                      <circle cx="55" cy="25" r="3" fill="#000" />
                      <circle cx="45" cy="40" r="4" fill="#C2410C" />
                      <circle cx="55" cy="50" r="3" fill="#000" />
                      <circle cx="20" cy="45" r="3" fill="#000" />
                      <circle cx="35" cy="55" r="3" fill="#000" />
                      <circle cx="70" cy="45" r="3" fill="#000" />
                      <circle cx="80" cy="55" r="3" fill="#000" />
                      <circle cx="45" cy="70" r="3" fill="#000" />
                      <circle cx="55" cy="80" r="3" fill="#000" />
                      <circle cx="75" cy="75" r="4" fill="#000" />
                      <circle cx="85" cy="85" r="4" fill="#C2410C" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="bg-[#451A03] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                        SALAM KOPI
                      </span>
                    </div>
                  </div>

                  <div className="font-mono text-base font-bold text-[#451A03]">
                    Rp {finalTotal.toLocaleString('id-ID')}
                  </div>
                  <p className="text-[10px] text-[#A8A29E]">
                    NMID: {storeSettings.qrisNmid || 'ID102008892182'} · QRIS Standar Bank Indonesia
                  </p>
                </div>
              )}

              {/* Bank Transfer Details */}
              {(paymentMethod === 'bca' || paymentMethod === 'mandiri') && (
                <div className="p-4 bg-white rounded-2xl border border-[#E7DFD5] space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bca')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                        paymentMethod === 'bca'
                          ? 'bg-[#0284C7] text-white border-[#0284C7]'
                          : 'bg-[#FAF7F2] text-[#57534E] border-[#D7C4B7]'
                      }`}
                    >
                      Bank BCA
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mandiri')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                        paymentMethod === 'mandiri'
                          ? 'bg-[#0284C7] text-white border-[#0284C7]'
                          : 'bg-[#FAF7F2] text-[#57534E] border-[#D7C4B7]'
                      }`}
                    >
                      Bank Mandiri
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#0284C7] uppercase">
                        {paymentMethod === 'mandiri' ? 'Bank Mandiri' : 'Bank Central Asia (BCA)'}
                      </span>
                      <div className="font-mono text-base font-bold text-[#292524]">
                        {paymentMethod === 'mandiri' ? '123-00-9988-7766' : '800-1122-3344'}
                      </div>
                      <div className="text-[11px] text-[#78716C]">a/n PT Salam Kopi Indonesia</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyBankAccount}
                      className="px-3 py-1.5 rounded-lg border border-[#D7C4B7] bg-[#FAF7F2] text-xs font-semibold hover:border-[#C2410C] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedBank ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedBank ? 'Tersalin' : 'Salin Rek'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#78716C] italic pt-1 border-t border-[#F5EFE6]">
                    *Cantumkan nama pemesan pada berita transfer. Struk PDF & Excel tersedia setelah konfirmasi.
                  </p>
                </div>
              )}

              {/* Cash note & optional nominal */}
              {paymentMethod === 'cash' && (
                <div className="p-3.5 bg-white rounded-xl border border-[#E7DFD5] space-y-2.5 text-[11px] text-[#57534E]">
                  <div>
                    💵 Silakan siapkan uang minimal sebesar <strong className="text-[#292524] font-mono">Rp {finalTotal.toLocaleString('id-ID')}</strong> saat membayar di kasir kedai atau kepada kurir.
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EFE8DD]">
                    <span className="font-semibold text-[#292524]">Nominal Uang Dibayar:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCashGiven(finalTotal)}
                        className={`px-2 py-1 rounded border text-[10px] font-semibold cursor-pointer ${
                          cashGiven === finalTotal
                            ? 'bg-[#16A34A] text-white border-[#16A34A]'
                            : 'bg-[#FAF7F2] border-[#D7C4B7]'
                        }`}
                      >
                        Uang Pas
                      </button>
                      <button
                        type="button"
                        onClick={() => setCashGiven(Math.max(finalTotal, 50000))}
                        className={`px-2 py-1 rounded border text-[10px] font-semibold cursor-pointer ${
                          cashGiven === 50000 && finalTotal <= 50000
                            ? 'bg-[#16A34A] text-white border-[#16A34A]'
                            : 'bg-[#FAF7F2] border-[#D7C4B7]'
                        }`}
                      >
                        50rb
                      </button>
                      <button
                        type="button"
                        onClick={() => setCashGiven(Math.max(finalTotal, 100000))}
                        className={`px-2 py-1 rounded border text-[10px] font-semibold cursor-pointer ${
                          cashGiven === 100000 && finalTotal <= 100000
                            ? 'bg-[#16A34A] text-white border-[#16A34A]'
                            : 'bg-[#FAF7F2] border-[#D7C4B7]'
                        }`}
                      >
                        100rb
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Input Nominal Tunai:</span>
                    <input
                      type="number"
                      min={finalTotal}
                      value={cashGiven || ''}
                      onChange={(e) => setCashGiven(Number(e.target.value))}
                      className="w-32 px-2 py-1 text-right font-mono font-bold text-xs rounded-lg border border-[#D7C4B7] bg-[#FAF7F2]"
                    />
                  </div>
                  <div className="flex justify-between font-bold text-[#16A34A]">
                    <span>Estimasi Kembalian:</span>
                    <span className="font-mono">Rp {cashChange.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Total Summary */}
            <div className="pt-3 border-t border-[#EFE8DD] flex items-center justify-between text-sm">
              <span className="font-bold text-[#57534E]">Total Bayar:</span>
              <span className="font-mono text-lg font-bold text-[#451A03]">
                Rp {finalTotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Submit Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleCompleteOrder}
                className="w-full py-3.5 px-4 rounded-xl bg-[#451A03] hover:bg-[#2A0E02] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#FDE68A]" />
                <span>Konfirmasi Pesanan & Buat Struk</span>
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full py-3 px-4 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Pesan & Kirim Rincian via WhatsApp</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
