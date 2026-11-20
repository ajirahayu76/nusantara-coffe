import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Check,
  Coffee,
  FileText,
  FileSpreadsheet,
  QrCode,
  Building2,
  Banknote,
} from 'lucide-react';
import { SaleTransaction, StoreSettings } from '../../types';
import {
  getPaymentDetails,
  downloadReceiptPDF,
  downloadReceiptExcel,
  downloadReceiptTxt,
  DownloadResult,
} from '../../utils/receiptExport';

interface ReceiptModalProps {
  transaction: SaleTransaction | null;
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  isOpen,
  onClose,
  settings,
}) => {
  const [downloadedType, setDownloadedType] = useState<'pdf' | 'excel' | 'txt' | null>(null);
  const [lastDownload, setLastDownload] = useState<(DownloadResult & { kind: 'pdf' | 'excel' | 'txt' }) | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDownloadedType(null);
      setLastDownload(null);
      setDownloadError(null);
    }
  }, [isOpen, transaction?.id]);

  if (!isOpen || !transaction) return null;

  const payment = getPaymentDetails(transaction, settings);

  const triggerFeedback = (type: 'pdf' | 'excel' | 'txt', result: DownloadResult) => {
    setLastDownload({ ...result, kind: type });
    setDownloadedType(type);
    setTimeout(() => setDownloadedType(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      setDownloadError(null);
      const res = downloadReceiptPDF(transaction, settings);
      triggerFeedback('pdf', res);
    } catch (err) {
      setDownloadError('Gagal membuat file PDF struk.');
      console.error('ReceiptModal PDF error:', err);
    }
  };

  const handleDownloadExcel = () => {
    try {
      setDownloadError(null);
      const res = downloadReceiptExcel(transaction, settings);
      triggerFeedback('excel', res);
    } catch (err) {
      setDownloadError('Gagal membuat file Excel struk.');
      console.error('ReceiptModal Excel error:', err);
    }
  };

  const handleDownloadTxt = () => {
    try {
      setDownloadError(null);
      const res = downloadReceiptTxt(transaction, settings);
      triggerFeedback('txt', res);
    } catch (err) {
      setDownloadError('Gagal membuat file TXT struk.');
      console.error('ReceiptModal TXT error:', err);
    }
  };

  const renderPaymentIcon = () => {
    if (payment.methodKey === 'qris') {
      return <QrCode className="w-3.5 h-3.5 text-[#C2410C]" />;
    }
    if (payment.methodKey === 'cash') {
      return <Banknote className="w-3.5 h-3.5 text-[#16A34A]" />;
    }
    return <Building2 className="w-3.5 h-3.5 text-[#0284C7]" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#D7C4B7] overflow-hidden my-6">
        
        {/* Top Action Bar */}
        <div className="p-3.5 bg-[#451A03] text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#FDE68A]" />
            <div>
              <span className="text-xs font-bold block leading-tight">
                Struk Pembayaran · {payment.shortBadge}
              </span>
              <span className="text-[10px] text-[#FDE68A]/90 font-mono">
                {transaction.invoiceNumber}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
            aria-label="Tutup struk"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div
          id="thermal-receipt"
          className="p-5 font-mono text-[11px] text-[#1C1917] leading-tight space-y-3 bg-[#FCFBF8] border-b border-dashed border-[#A8A29E] max-h-[58vh] overflow-y-auto"
        >
          
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-[#A8A29E]">
            <div className="w-8 h-8 rounded-full bg-[#451A03] text-[#FAF7F2] flex items-center justify-center mx-auto mb-1">
              <Coffee className="w-4 h-4" />
            </div>
            <h2 className="font-serif font-bold text-sm tracking-tight text-[#292524]">
              {settings.storeName}
            </h2>
            <p className="text-[10px] text-[#57534E]">{settings.tagline}</p>
            <p className="text-[9px] text-[#78716C]">{settings.address}</p>
            <p className="text-[9px] text-[#78716C]">Telp: {settings.phone}</p>
          </div>

          {/* Meta Info */}
          <div className="space-y-0.5 text-[10px] text-[#44403C] pb-2 border-b border-dashed border-[#A8A29E]">
            <div className="flex justify-between">
              <span>No. Struk:</span>
              <span className="font-bold">{transaction.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Waktu:</span>
              <span>{transaction.timestamp}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{transaction.cashierStaffName}</span>
            </div>
            <div className="flex justify-between">
              <span>Pelanggan:</span>
              <span className="font-bold">{transaction.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Tipe:</span>
              <span className="font-bold uppercase">
                {transaction.orderType} {transaction.tableNumber ? `(${transaction.tableNumber})` : ''}
              </span>
            </div>
          </div>

          {/* Itemized List */}
          <div className="space-y-2 py-1 border-b border-dashed border-[#A8A29E]">
            {transaction.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="font-bold text-[11px] text-[#1C1917]">
                  {item.name}
                </div>
                <div className="flex justify-between text-[10px] text-[#57534E]">
                  <span>
                    {item.quantity} x Rp {item.unitPrice.toLocaleString('id-ID')}
                  </span>
                  <span className="font-bold text-[#1C1917]">
                    Rp {item.totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
                {item.customizationSummary && (
                  <div className="text-[9px] text-[#78716C] italic">
                    ↳ {item.customizationSummary}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals Calculation */}
          <div className="space-y-1 text-[11px] pt-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rp {transaction.subtotal.toLocaleString('id-ID')}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between text-[#16A34A]">
                <span>Diskon:</span>
                <span>-Rp {transaction.discount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between text-[10px] text-[#78716C]">
              <span>PB1 (Pajak Restoran):</span>
              <span>Termasuk (0%)</span>
            </div>
            <div className="flex justify-between text-xs font-bold pt-1.5 border-t border-dashed border-[#A8A29E] text-[#1C1917]">
              <span>TOTAL BAYAR:</span>
              <span>Rp {transaction.totalAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Payment Method Specific Detail Box (QRIS / Transfer Bank / Tunai) */}
          <div className="p-2.5 rounded-xl bg-white border border-[#D7C4B7] space-y-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-dashed border-[#E7DFD5]">
              <div className="flex items-center gap-1.5 font-bold text-[10px] text-[#1C1917]">
                {renderPaymentIcon()}
                <span>{payment.methodLabel}</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#166534]">
                LUNAS
              </span>
            </div>

            <div className="space-y-0.5 text-[10px]">
              {payment.detailRows.map((row, idx) => (
                <div key={idx} className="flex justify-between gap-2">
                  <span className="text-[#78716C]">{row.label}:</span>
                  <span className="font-bold text-[#1C1917] text-right">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {transaction.notes && (
            <div className="text-[9.5px] text-[#57534E] italic bg-white/80 p-2 rounded border border-[#E7DFD5]">
              Catatan: "{transaction.notes}"
            </div>
          )}

          {/* Footer & Barcode simulation */}
          <div className="text-center pt-2 space-y-1.5 text-[9px] text-[#78716C] border-t border-dashed border-[#A8A29E]">
            <p className="whitespace-pre-line leading-snug">
              {settings.receiptFooter}
            </p>
            <div className="h-6 w-48 mx-auto bg-repeat-x flex items-center justify-center tracking-widest text-[8px] font-mono select-none">
              ||||| | |||| || ||||| ||| |||| |
            </div>
            <p className="text-[8px] text-[#A8A29E]">
              {payment.statusLabel} · Salam Kopi POS
            </p>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="p-3.5 bg-white space-y-2 no-print">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="py-2.5 px-3 rounded-xl bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
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
              className="py-2.5 px-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
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
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] text-center">
              {downloadError}
            </div>
          )}

          {lastDownload && (
            <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#D7C4B7] text-[10.5px] text-[#451A03] flex flex-wrap items-center justify-center gap-1.5">
              <Download className="w-3 h-3 text-[#16A34A]" />
              <span>Siap:</span>
              <a
                href={lastDownload.url}
                download={lastDownload.filename}
                className="font-bold underline text-[#C2410C]"
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
                  (Buka PDF)
                </a>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-2 px-3 rounded-xl bg-[#451A03] hover:bg-[#2A0E02] text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#FDE68A]" />
              <span>Cetak Struk (Print)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="px-3 py-2 rounded-xl border border-[#D7C4B7] hover:border-[#C2410C] text-[#44403C] hover:text-[#C2410C] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              title="Download Struk .txt"
            >
              {downloadedType === 'txt' ? (
                <Check className="w-3.5 h-3.5 text-[#16A34A]" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>.TXT</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
