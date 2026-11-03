import React, { useState } from 'react';
import { Sale, StoreSettings } from '../types/index.ts';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import {
  Printer,
  FileText,
  FileSpreadsheet,
  X,
  Coffee,
  CheckCircle2,
  Download,
} from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale;
  items?: any[];
  settings?: StoreSettings | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  items,
  settings,
  onClose,
}) => {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(
    settings?.printerWidth || '80mm'
  );

  const displayItems = items || sale.items || [];
  const storeName = settings?.storeName || 'Kopi Nusantara';
  const storeAddress = settings?.storeAddress || 'Jl. Malioboro No. 45, Yogyakarta';
  const storePhone = settings?.storePhone || '+62 812-3456-7890';
  const receiptFooter =
    settings?.receiptFooter || 'Terima kasih telah berkunjung!\nNikmati seduhan kopi Nusantara.';

  const handlePrint = () => {
    window.print();
  };

  // Download PDF
  const handleDownloadPdf = () => {
    const is58 = paperWidth === '58mm';
    const width = is58 ? 58 : 80;
    const estimatedHeight = Math.max(140, 95 + displayItems.length * 9.5);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [width, estimatedHeight],
    });

    const margin = 4;
    const printWidth = width - margin * 2;
    let y = 7;

    // Header Branding
    doc.setFont('courier', 'bold');
    doc.setFontSize(is58 ? 8.5 : 10.5);
    doc.text(storeName.toUpperCase(), width / 2, y, { align: 'center' });
    y += 4;

    doc.setFont('courier', 'normal');
    doc.setFontSize(is58 ? 6.5 : 7.5);
    doc.text(storeAddress, width / 2, y, { align: 'center', maxWidth: printWidth });
    y += 3.5;
    doc.text(`Telp: ${storePhone}`, width / 2, y, { align: 'center' });
    y += 3;

    // Dashed line
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, y, width - margin, y);
    y += 3.5;

    // Meta details
    doc.setFontSize(is58 ? 6.5 : 7.5);
    doc.text(`No: ${sale.invoiceNumber}`, margin, y);
    y += 3.2;
    doc.text(
      `Waktu: ${new Date(sale.createdAt).toLocaleString('id-ID', {
        dateStyle: 'short',
        timeStyle: 'short',
      })}`,
      margin,
      y
    );
    y += 3.2;
    doc.text(`Kasir: ${sale.cashierName}`, margin, y);
    y += 3.2;

    // Dashed line
    doc.line(margin, y, width - margin, y);
    y += 3.5;

    // Items
    displayItems.forEach(item => {
      doc.setFont('courier', 'bold');
      doc.text(item.productName.substring(0, is58 ? 22 : 30), margin, y);
      y += 3.2;

      doc.setFont('courier', 'normal');
      const qtySell = `${item.quantity} x Rp ${Number(item.sellPrice).toLocaleString('id-ID')}`;
      const lineSubtotal = `Rp ${Number(item.subtotal).toLocaleString('id-ID')}`;
      doc.text(qtySell, margin, y);
      doc.text(lineSubtotal, width - margin, y, { align: 'right' });
      y += 3.8;
    });

    // Dashed line
    doc.line(margin, y, width - margin, y);
    y += 3.5;

    // Totals
    doc.setFont('courier', 'normal');
    doc.text('Subtotal:', margin, y);
    doc.text(`Rp ${Number(sale.subtotal).toLocaleString('id-ID')}`, width - margin, y, {
      align: 'right',
    });
    y += 3.2;

    if (Number(sale.discountAmount) > 0) {
      doc.text('Diskon:', margin, y);
      doc.text(`-Rp ${Number(sale.discountAmount).toLocaleString('id-ID')}`, width - margin, y, {
        align: 'right',
      });
      y += 3.2;
    }

    if (Number(sale.taxAmount) > 0) {
      doc.text('Pajak PPN:', margin, y);
      doc.text(`Rp ${Number(sale.taxAmount).toLocaleString('id-ID')}`, width - margin, y, {
        align: 'right',
      });
      y += 3.2;
    }

    doc.setFont('courier', 'bold');
    doc.setFontSize(is58 ? 7.5 : 9);
    doc.text('TOTAL:', margin, y);
    doc.text(`Rp ${Number(sale.totalAmount).toLocaleString('id-ID')}`, width - margin, y, {
      align: 'right',
    });
    y += 3.8;

    // Payment details
    doc.setFont('courier', 'normal');
    doc.setFontSize(is58 ? 6.5 : 7.5);
    doc.line(margin, y, width - margin, y);
    y += 3.5;

    doc.text(`Metode: ${sale.paymentMethod}`, margin, y);
    y += 3.2;
    doc.text(`Bayar: Rp ${Number(sale.amountPaid).toLocaleString('id-ID')}`, margin, y);
    y += 3.2;
    doc.text(`Kembalian: Rp ${Number(sale.changeAmount).toLocaleString('id-ID')}`, margin, y);
    y += 3.8;

    // Footer
    doc.line(margin, y, width - margin, y);
    y += 3.8;
    doc.setFontSize(is58 ? 6 : 7);
    doc.text(receiptFooter, width / 2, y, { align: 'center', maxWidth: printWidth });

    doc.save(`Struk_${sale.invoiceNumber}.pdf`);
  };

  // Download Excel (.xlsx)
  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    const rows: (string | number)[][] = [
      [storeName.toUpperCase()],
      [storeAddress],
      [`Telp: ${storePhone}`],
      [],
      ['STRUK PEMBAYARAN KASIR (POS)'],
      ['Nomor Faktur', sale.invoiceNumber],
      [
        'Tanggal & Waktu',
        new Date(sale.createdAt).toLocaleString('id-ID', {
          dateStyle: 'full',
          timeStyle: 'medium',
        }),
      ],
      ['Kasir', sale.cashierName],
      ['Metode Pembayaran', sale.paymentMethod],
      ['Status Transaksi', sale.paymentStatus],
      [],
      ['No', 'Nama Produk', 'Jumlah', 'Satuan', 'Harga Satuan (Rp)', 'Subtotal (Rp)'],
      ...displayItems.map((item, idx) => [
        idx + 1,
        item.productName,
        item.quantity,
        item.unit || 'pcs',
        Number(item.sellPrice),
        Number(item.subtotal),
      ]),
      [],
      ['', '', '', '', 'Subtotal (Rp):', Number(sale.subtotal)],
      Number(sale.discountAmount) > 0
        ? ['', '', '', '', 'Diskon (Rp):', -Number(sale.discountAmount)]
        : [],
      Number(sale.taxAmount) > 0
        ? ['', '', '', '', 'Pajak PPN (Rp):', Number(sale.taxAmount)]
        : [],
      ['', '', '', '', 'TOTAL PEMBAYARAN (Rp):', Number(sale.totalAmount)],
      ['', '', '', '', 'Uang Diterima (Rp):', Number(sale.amountPaid)],
      ['', '', '', '', 'Kembalian (Rp):', Number(sale.changeAmount)],
      [],
      [receiptFooter.replace(/\n/g, ' • ')],
    ].filter(r => r.length > 0);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 32 },
      { wch: 10 },
      { wch: 10 },
      { wch: 18 },
      { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Struk Transaksi');
    XLSX.writeFile(wb, `Struk_${sale.invoiceNumber}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Print-specific style */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #thermal-receipt, #thermal-receipt * {
            visibility: visible;
          }
          #thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: ${paperWidth === '58mm' ? '58mm' : '80mm'} !important;
            margin: 0;
            padding: 4mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="no-print p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-800/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                Struk Transaksi Berhasil
              </h3>
              <p className="text-[10px] text-stone-500 font-mono">{sale.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Paper width toggle */}
            <div className="flex bg-stone-200 dark:bg-stone-700 rounded-lg p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-0.5 rounded-md transition ${
                  paperWidth === '58mm'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-0.5 rounded-md transition ${
                  paperWidth === '80mm'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                80mm
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-100 dark:bg-stone-950 flex justify-center">
          <div
            id="thermal-receipt"
            className={`bg-white text-stone-900 shadow-lg rounded-xl p-5 border border-stone-200 font-mono text-xs transition-all ${
              paperWidth === '58mm' ? 'w-[260px]' : 'w-[340px]'
            }`}
          >
            {/* Store Branding */}
            <div className="text-center pb-3 border-b border-dashed border-stone-300">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Coffee className="w-4 h-4 text-stone-800" />
                <h4 className="font-bold text-sm uppercase tracking-wider">{storeName}</h4>
              </div>
              <p className="text-[10px] text-stone-600 leading-tight">{storeAddress}</p>
              <p className="text-[10px] text-stone-600 leading-tight">Telp: {storePhone}</p>
            </div>

            {/* Meta Information */}
            <div className="py-2.5 border-b border-dashed border-stone-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-600">No Faktur:</span>
                <span className="font-bold">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Waktu:</span>
                <span>
                  {new Date(sale.createdAt).toLocaleString('id-ID', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Kasir:</span>
                <span>{sale.cashierName}</span>
              </div>
            </div>

            {/* Items List */}
            <div className="py-2.5 border-b border-dashed border-stone-300 space-y-2">
              {displayItems.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-semibold text-stone-800 text-[11px] leading-tight">
                    {item.productName}
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-600">
                    <span>
                      {item.quantity} x Rp {Number(item.sellPrice).toLocaleString('id-ID')}
                    </span>
                    <span className="font-semibold text-stone-900">
                      Rp {Number(item.subtotal).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-stone-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span>Rp {Number(sale.subtotal).toLocaleString('id-ID')}</span>
              </div>

              {Number(sale.discountAmount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Diskon:</span>
                  <span>-Rp {Number(sale.discountAmount).toLocaleString('id-ID')}</span>
                </div>
              )}

              {Number(sale.taxAmount) > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Pajak (PPN):</span>
                  <span>Rp {Number(sale.taxAmount).toLocaleString('id-ID')}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-sm text-stone-950 pt-1 border-t border-dotted border-stone-300">
                <span>TOTAL:</span>
                <span>Rp {Number(sale.totalAmount).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2.5 border-b border-dashed border-stone-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-600">Metode Bayar:</span>
                <span className="font-bold uppercase">{sale.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Bayar:</span>
                <span>Rp {Number(sale.amountPaid).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Kembalian:</span>
                <span>Rp {Number(sale.changeAmount).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 text-center text-[10px] text-stone-600 whitespace-pre-line leading-relaxed">
              {receiptFooter}
            </div>
          </div>
        </div>

        {/* Action Buttons: PDF, Excel, Thermal Print & Close */}
        <div className="no-print p-4 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-wrap items-center justify-between gap-2">
          {/* Download Options */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/60 font-semibold text-xs transition active:scale-95"
              title="Unduh Struk format PDF"
            >
              <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>Unduh PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-900/60 font-semibold text-xs transition active:scale-95"
              title="Unduh Struk format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Unduh Excel</span>
            </button>
          </div>

          {/* Print & Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-xs transition active:scale-95 border border-stone-200 dark:border-stone-700"
            >
              <Printer className="w-4 h-4 text-stone-600 dark:text-stone-300" />
              <span>Cetak ({paperWidth})</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition active:scale-95 shadow-md shadow-amber-900/20"
            >
              Selesai / Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
