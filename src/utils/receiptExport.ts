import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { SaleTransaction, StoreSettings, PaymentMethod } from '../types';

export interface PaymentDetailRow {
  label: string;
  value: string;
}

export interface PaymentDisplayDetails {
  methodKey: PaymentMethod;
  methodCode: string;
  fileTag: string;
  methodLabel: string;
  shortBadge: string;
  statusLabel: string;
  accentHex: string;
  detailRows: PaymentDetailRow[];
  cashGivenAmount?: number;
  cashChangeAmount?: number;
}

export interface DownloadResult {
  url: string;
  filename: string;
}

export const formatRupiah = (amount: number): string => {
  return `Rp ${Math.round(amount || 0).toLocaleString('id-ID')}`;
};

const triggerBlobDownload = (blob: Blob, filename: string): DownloadResult => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.position = 'fixed';
  link.style.left = '-9999px';
  link.style.top = '-9999px';
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
  }, 1500);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000);

  return { url, filename };
};

export const getPaymentDetails = (
  tx: SaleTransaction,
  settings: StoreSettings
): PaymentDisplayDetails => {
  const refSuffix = String(tx.invoiceNumber || '0000').replace(/^INV-SK-/, '');

  if (tx.paymentMethod === 'qris') {
    return {
      methodKey: 'qris',
      methodCode: 'QRIS',
      fileTag: 'QRIS',
      methodLabel: 'QRIS Dinamis (Standar BI)',
      shortBadge: 'QRIS DINAMIS',
      statusLabel: 'LUNAS - TERVERIFIKASI OTOMATIS',
      accentHex: '#C2410C',
      detailRows: [
        { label: 'Merchant NMID', value: settings.qrisNmid || 'ID102008892182' },
        { label: 'Kanal Pembayaran', value: 'GoPay / OVO / DANA / M-Banking' },
        { label: 'No. Referensi QRIS', value: `QR-${refSuffix}` },
        { label: 'Nominal Terbayar', value: formatRupiah(tx.totalAmount) },
      ],
    };
  }

  if (tx.paymentMethod === 'bca' || tx.paymentMethod === 'mandiri') {
    const isMandiri = tx.paymentMethod === 'mandiri';
    const bankName = isMandiri ? 'Bank Mandiri' : 'Bank Central Asia (BCA)';
    const accountNumber = isMandiri ? '123-00-9988-7766' : '800-1122-3344';

    return {
      methodKey: tx.paymentMethod,
      methodCode: isMandiri ? 'TRANSFER MANDIRI' : 'TRANSFER BCA',
      fileTag: isMandiri ? 'TRANSFER-MANDIRI' : 'TRANSFER-BCA',
      methodLabel: `Transfer Bank (${bankName})`,
      shortBadge: 'TRANSFER BANK',
      statusLabel: 'LUNAS - TRANSFER TERKONFIRMASI',
      accentHex: '#0284C7',
      detailRows: [
        { label: 'Bank Tujuan', value: bankName },
        { label: 'No. Rekening', value: accountNumber },
        { label: 'Atas Nama', value: 'PT Salam Kopi Indonesia' },
        { label: 'No. Referensi Transfer', value: `TRF-${refSuffix}` },
        { label: 'Nominal Transfer', value: formatRupiah(tx.totalAmount) },
      ],
    };
  }

  // Cash / Tunai
  const cashGivenAmount =
    tx.cashGiven !== undefined ? tx.cashGiven : tx.totalAmount;
  const cashChangeAmount =
    tx.cashChange !== undefined
      ? tx.cashChange
      : Math.max(0, cashGivenAmount - tx.totalAmount);

  return {
    methodKey: 'cash',
    methodCode: 'TUNAI',
    fileTag: 'TUNAI',
    methodLabel: 'Pembayaran Tunai (Cash)',
    shortBadge: 'TUNAI / CASH',
    statusLabel: 'LUNAS - PEMBAYARAN TUNAI',
    accentHex: '#16A34A',
    cashGivenAmount,
    cashChangeAmount,
    detailRows: [
      { label: 'Uang Tunai Diterima', value: formatRupiah(cashGivenAmount) },
      { label: 'Uang Kembalian', value: formatRupiah(cashChangeAmount) },
      { label: 'Kasir Penerima', value: tx.cashierStaffName || 'Kasir Kedai' },
    ],
  };
};

/**
 * Generates and downloads a crisp, print-ready PDF payment receipt
 * tailored for QRIS, Transfer Bank (BCA/Mandiri), and Tunai.
 */
export const downloadReceiptPDF = (
  tx: SaleTransaction,
  settings: StoreSettings
): DownloadResult => {
  const payment = getPaymentDetails(tx, settings);
  const pageWidth = 105; // A6-style receipt width in mm
  const marginX = 7;
  const contentWidth = pageWidth - marginX * 2;

  const storeName = String(settings.storeName || 'Salam Kopi');
  const tagline = String(settings.tagline || '');
  const address = String(settings.address || '');
  const phone = String(settings.phone || '-');
  const receiptFooter = String(
    settings.receiptFooter || 'Terima kasih telah menikmati kopi Salam Kopi.'
  );
  const safeNotes = tx.notes ? String(tx.notes) : '';

  // Measure pass
  const measureDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, 297],
  });

  measureDoc.setFont('helvetica', 'normal');
  measureDoc.setFontSize(7.5);
  const addressLines: string[] = address
    ? measureDoc.splitTextToSize(address, contentWidth)
    : [];
  const footerLines: string[] = measureDoc.splitTextToSize(
    receiptFooter,
    contentWidth
  );
  const noteLines: string[] = safeNotes
    ? measureDoc.splitTextToSize(`Catatan: ${safeNotes}`, contentWidth - 4)
    : [];

  let itemsBlockHeight = 8;
  tx.items.forEach((item) => {
    measureDoc.setFont('helvetica', 'bold');
    measureDoc.setFontSize(8.5);
    const nameLines: string[] = measureDoc.splitTextToSize(
      String(item.name || 'Menu'),
      contentWidth - 26
    );
    itemsBlockHeight += nameLines.length * 3.8 + 4.2;
    if (item.customizationSummary) {
      measureDoc.setFont('helvetica', 'italic');
      measureDoc.setFontSize(7);
      const customLines: string[] = measureDoc.splitTextToSize(
        `- ${item.customizationSummary}`,
        contentWidth - 4
      );
      itemsBlockHeight += customLines.length * 3.1;
    }
    itemsBlockHeight += 1.5;
  });

  const headerHeight = 26 + addressLines.length * 3.3;
  const metaHeight = 27;
  const totalsHeight = tx.discount > 0 ? 27 : 22;
  const paymentBoxHeight = 14 + payment.detailRows.length * 4.8;
  const notesHeight = noteLines.length > 0 ? 7 + noteLines.length * 3.4 : 0;
  const footerHeight = 16 + footerLines.length * 3.4;

  const totalHeight = Math.max(
    145,
    headerHeight +
      metaHeight +
      itemsBlockHeight +
      totalsHeight +
      paymentBoxHeight +
      notesHeight +
      footerHeight +
      16
  );

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidth, totalHeight],
  });

  let y = 0;

  // Top Espresso Banner
  doc.setFillColor(69, 26, 3);
  doc.rect(0, 0, pageWidth, 19, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(storeName.toUpperCase(), pageWidth / 2, 7.5, { align: 'center' });

  if (tagline) {
    doc.setTextColor(253, 230, 138);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(tagline, pageWidth / 2, 12, { align: 'center' });
  }

  doc.setTextColor(253, 230, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(`STRUK PEMBAYARAN - ${payment.shortBadge}`, pageWidth / 2, 16.5, {
    align: 'center',
  });

  y = 23.5;

  // Address & Phone
  doc.setTextColor(87, 83, 78);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  addressLines.forEach((line) => {
    doc.text(line, pageWidth / 2, y, { align: 'center' });
    y += 3.3;
  });
  doc.text(`Telp: ${phone}`, pageWidth / 2, y, { align: 'center' });
  y += 4;

  const drawDashedLine = (posY: number) => {
    doc.setDrawColor(180, 168, 155);
    doc.setLineWidth(0.25);
    doc.setLineDashPattern([1.2, 1.2], 0);
    doc.line(marginX, posY, pageWidth - marginX, posY);
    doc.setLineDashPattern([], 0);
  };

  drawDashedLine(y);
  y += 4.5;

  const drawKeyValue = (
    label: string,
    value: string,
    boldValue = false,
    fontSize = 7.8
  ) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(100, 92, 86);
    doc.text(label, marginX, y);

    doc.setFont('helvetica', boldValue ? 'bold' : 'normal');
    doc.setTextColor(28, 25, 23);
    doc.text(String(value || '-'), pageWidth - marginX, y, { align: 'right' });
    y += 4.2;
  };

  drawKeyValue('No. Invoice', String(tx.invoiceNumber || '-'), true);
  drawKeyValue('Waktu', String(tx.timestamp || '-'));
  drawKeyValue('Kasir', String(tx.cashierStaffName || 'Kasir'));
  drawKeyValue('Pelanggan', String(tx.customerName || 'Pelanggan'), true);
  drawKeyValue(
    'Tipe Pesanan',
    `${String(tx.orderType || 'dine-in').toUpperCase()}${
      tx.tableNumber ? ` (${tx.tableNumber})` : ''
    }`,
    true
  );

  y += 0.5;
  drawDashedLine(y);
  y += 4.5;

  // Items header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(120, 113, 108);
  doc.text('ITEM PESANAN', marginX, y);
  doc.text('SUBTOTAL', pageWidth - marginX, y, { align: 'right' });
  y += 4;

  // Item rows
  tx.items.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(28, 25, 23);
    const nameLines: string[] = doc.splitTextToSize(
      String(item.name || 'Menu'),
      contentWidth - 26
    );
    nameLines.forEach((line, idx) => {
      doc.text(line, marginX, y);
      if (idx === 0) {
        doc.text(formatRupiah(item.totalPrice), pageWidth - marginX, y, {
          align: 'right',
        });
      }
      y += 3.7;
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);
    doc.setTextColor(87, 83, 78);
    doc.text(
      `${item.quantity} x ${formatRupiah(item.unitPrice)}`,
      marginX + 1.5,
      y
    );
    y += 3.6;

    if (item.customizationSummary) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.9);
      doc.setTextColor(120, 113, 108);
      const customLines: string[] = doc.splitTextToSize(
        `- ${item.customizationSummary}`,
        contentWidth - 4
      );
      customLines.forEach((cl) => {
        doc.text(cl, marginX + 1.5, y);
        y += 3.1;
      });
    }

    y += 1.4;
  });

  drawDashedLine(y);
  y += 4.5;

  // Totals Breakdown
  drawKeyValue('Subtotal', formatRupiah(tx.subtotal));
  if (tx.discount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(22, 163, 74);
    doc.text('Diskon / Tumbler', marginX, y);
    doc.text(`-${formatRupiah(tx.discount)}`, pageWidth - marginX, y, {
      align: 'right',
    });
    y += 4.2;
  }
  drawKeyValue(
    'PB1 (Pajak Restoran)',
    tx.tax > 0 ? formatRupiah(tx.tax) : 'Termasuk (0%)'
  );

  y += 0.5;
  doc.setFillColor(250, 247, 242);
  doc.setDrawColor(215, 196, 183);
  doc.roundedRect(marginX, y - 3, contentWidth, 8, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.2);
  doc.setTextColor(69, 26, 3);
  doc.text('TOTAL BAYAR', marginX + 2.5, y + 2.3);
  doc.text(formatRupiah(tx.totalAmount), pageWidth - marginX - 2.5, y + 2.3, {
    align: 'right',
  });
  y += 9;

  // Payment Method Details Card
  const boxStartY = y;
  const boxH = 10 + payment.detailRows.length * 4.5;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(215, 196, 183);
  doc.roundedRect(marginX, boxStartY, contentWidth, boxH, 1.8, 1.8, 'FD');

  if (payment.methodKey === 'qris') {
    doc.setFillColor(255, 237, 213);
  } else if (payment.methodKey === 'cash') {
    doc.setFillColor(220, 252, 231);
  } else {
    doc.setFillColor(224, 242, 254);
  }
  doc.roundedRect(marginX, boxStartY, contentWidth, 6.5, 1.8, 1.8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(28, 25, 23);
  doc.text(payment.methodLabel.toUpperCase(), marginX + 2.5, boxStartY + 4.3);

  doc.setFontSize(6.4);
  doc.setTextColor(22, 101, 52);
  doc.text('LUNAS', pageWidth - marginX - 2.5, boxStartY + 4.3, {
    align: 'right',
  });

  let py = boxStartY + 10.5;
  payment.detailRows.forEach((row) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.1);
    doc.setTextColor(100, 92, 86);
    doc.text(row.label, marginX + 2.5, py);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(28, 25, 23);
    const valLines: string[] = doc.splitTextToSize(
      String(row.value),
      contentWidth * 0.56
    );
    doc.text(valLines[0] || '', pageWidth - marginX - 2.5, py, {
      align: 'right',
    });
    py += 4.3;
  });

  y = boxStartY + boxH + 4;

  // Optional notes
  if (noteLines.length > 0) {
    doc.setFillColor(250, 247, 242);
    doc.roundedRect(
      marginX,
      y - 2,
      contentWidth,
      4 + noteLines.length * 3.4,
      1.2,
      1.2,
      'F'
    );
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(87, 83, 78);
    noteLines.forEach((nl) => {
      doc.text(nl, marginX + 2, y + 1);
      y += 3.4;
    });
    y += 4;
  }

  drawDashedLine(y);
  y += 4.5;

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 92, 86);
  footerLines.forEach((fl) => {
    doc.text(fl, pageWidth / 2, y, { align: 'center' });
    y += 3.3;
  });

  y += 2;
  doc.setFontSize(6.2);
  doc.setTextColor(150, 142, 134);
  doc.text(
    `Dokumen Struk Sah - ${payment.statusLabel} - Salam Kopi POS`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  const filename = `Struk-${payment.fileTag}-${tx.invoiceNumber}.pdf`;
  const pdfArrayBuffer = doc.output('arraybuffer');
  const blob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
  return triggerBlobDownload(blob, filename);
};

/**
 * Generates and downloads a structured .xlsx Excel receipt workbook
 * tailored for QRIS, Transfer Bank (BCA/Mandiri), and Tunai.
 */
export const downloadReceiptExcel = (
  tx: SaleTransaction,
  settings: StoreSettings
): DownloadResult => {
  const payment = getPaymentDetails(tx, settings);

  // Sheet 1: Formal Formatted Receipt
  const aoa: (string | number)[][] = [
    [String(settings.storeName || 'Salam Kopi').toUpperCase(), '', '', '', '', ''],
    [String(settings.tagline || ''), '', '', '', '', ''],
    [`Alamat: ${settings.address || ''}`, '', '', '', '', ''],
    [`Telepon: ${settings.phone || '-'}`, '', '', '', '', ''],
    [''],
    ['STRUK PEMBAYARAN RESMI', '', '', '', '', ''],
    ['No. Invoice', tx.invoiceNumber, '', 'Tipe Pesanan', tx.orderType.toUpperCase()],
    ['Waktu Transaksi', tx.timestamp, '', 'No. Meja', tx.tableNumber || '-'],
    ['Kasir', tx.cashierStaffName, '', 'Pelanggan', tx.customerName],
    ['Status', payment.statusLabel, '', 'Metode Bayar', payment.methodLabel],
    [''],
    [`DETAIL PEMBAYARAN (${payment.shortBadge})`, '', '', '', '', ''],
  ];

  payment.detailRows.forEach((row) => {
    aoa.push([row.label, row.value]);
  });

  aoa.push(['']);
  aoa.push(['RINCIAN PESANAN MENU', '', '', '', '', '']);
  aoa.push([
    'No',
    'Nama Menu',
    'Kustomisasi / Catatan',
    'Qty',
    'Harga Satuan (Rp)',
    'Subtotal (Rp)',
  ]);

  tx.items.forEach((item, index) => {
    aoa.push([
      index + 1,
      item.name,
      item.customizationSummary || '-',
      item.quantity,
      item.unitPrice,
      item.totalPrice,
    ]);
  });

  aoa.push(['']);
  aoa.push(['', '', '', '', 'Subtotal (Rp)', tx.subtotal]);
  aoa.push(['', '', '', '', 'Diskon (Rp)', tx.discount > 0 ? -tx.discount : 0]);
  aoa.push(['', '', '', '', 'Pajak / PB1 (Rp)', tx.tax]);
  aoa.push(['', '', '', '', 'TOTAL BAYAR (Rp)', tx.totalAmount]);

  if (payment.methodKey === 'cash') {
    aoa.push([
      '',
      '',
      '',
      '',
      'Uang Tunai Diterima (Rp)',
      payment.cashGivenAmount ?? tx.totalAmount,
    ]);
    aoa.push([
      '',
      '',
      '',
      '',
      'Kembalian (Rp)',
      payment.cashChangeAmount ?? 0,
    ]);
  }

  if (tx.notes) {
    aoa.push(['']);
    aoa.push(['Catatan Pelanggan', tx.notes]);
  }

  aoa.push(['']);
  aoa.push([settings.receiptFooter || 'Terima kasih!']);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [
    { wch: 24 },
    { wch: 30 },
    { wch: 28 },
    { wch: 16 },
    { wch: 24 },
    { wch: 20 },
  ];

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:F1');
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (cell && typeof cell.v === 'number' && C >= 4) {
        cell.z = '#,##0';
      }
    }
  }

  // Sheet 2: Flat Tabular Data
  const tabularRows = tx.items.map((item, idx) => ({
    'No': idx + 1,
    'No. Invoice': tx.invoiceNumber,
    'Waktu': tx.timestamp,
    'Pelanggan': tx.customerName,
    'Kasir': tx.cashierStaffName,
    'Tipe Pesanan': tx.orderType.toUpperCase(),
    'Metode Pembayaran': payment.methodLabel,
    'Detail Pembayaran': payment.detailRows
      .map((d) => `${d.label}: ${d.value}`)
      .join(' | '),
    'Nama Menu': item.name,
    'Kustomisasi': item.customizationSummary || '-',
    'Qty': item.quantity,
    'Harga Satuan (Rp)': item.unitPrice,
    'Subtotal Item (Rp)': item.totalPrice,
    'Diskon Transaksi (Rp)': tx.discount,
    'Total Transaksi (Rp)': tx.totalAmount,
    'Uang Diterima (Rp)':
      payment.methodKey === 'cash'
        ? payment.cashGivenAmount ?? tx.totalAmount
        : tx.totalAmount,
    'Kembalian (Rp)':
      payment.methodKey === 'cash' ? payment.cashChangeAmount ?? 0 : 0,
    'Status': 'Lunas',
  }));

  const wsData = XLSX.utils.json_to_sheet(tabularRows);
  wsData['!cols'] = [
    { wch: 5 },
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 14 },
    { wch: 24 },
    { wch: 48 },
    { wch: 26 },
    { wch: 22 },
    { wch: 6 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 10 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Struk Pembayaran');
  XLSX.utils.book_append_sheet(wb, wsData, 'Data Pembukuan');

  const filename = `Struk-${payment.fileTag}-${tx.invoiceNumber}.xlsx`;
  const wbArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbArray], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  return triggerBlobDownload(blob, filename);
};

/**
 * Generates and downloads a plain-text thermal receipt (.txt)
 */
export const downloadReceiptTxt = (
  tx: SaleTransaction,
  settings: StoreSettings
): DownloadResult => {
  const payment = getPaymentDetails(tx, settings);

  let txt = `========================================\n`;
  txt += `          ${settings.storeName}\n`;
  txt += `       ${settings.tagline}\n`;
  txt += `========================================\n`;
  txt += `Alamat    : ${settings.address}\n`;
  txt += `Telp      : ${settings.phone}\n`;
  txt += `No. Struk : ${tx.invoiceNumber}\n`;
  txt += `Waktu     : ${tx.timestamp}\n`;
  txt += `Kasir     : ${tx.cashierStaffName}\n`;
  txt += `Pelanggan : ${tx.customerName}\n`;
  txt += `Tipe      : ${tx.orderType.toUpperCase()} ${
    tx.tableNumber ? `(${tx.tableNumber})` : ''
  }\n`;
  txt += `----------------------------------------\n`;
  tx.items.forEach((item) => {
    txt += `${item.name}\n`;
    txt += `  ${item.quantity} x ${formatRupiah(item.unitPrice)} = ${formatRupiah(
      item.totalPrice
    )}\n`;
    if (item.customizationSummary) {
      txt += `  (${item.customizationSummary})\n`;
    }
  });
  txt += `----------------------------------------\n`;
  txt += `Subtotal  : ${formatRupiah(tx.subtotal)}\n`;
  if (tx.discount > 0) {
    txt += `Diskon    : -${formatRupiah(tx.discount)}\n`;
  }
  txt += `Pajak     : ${tx.tax > 0 ? formatRupiah(tx.tax) : 'Termasuk (0%)'}\n`;
  txt += `TOTAL     : ${formatRupiah(tx.totalAmount)}\n`;
  txt += `----------------------------------------\n`;
  txt += `Metode    : ${payment.methodLabel}\n`;
  txt += `Status    : ${payment.statusLabel}\n`;
  payment.detailRows.forEach((row) => {
    txt += `${row.label.padEnd(16, ' ')}: ${row.value}\n`;
  });
  if (tx.notes) {
    txt += `Catatan   : ${tx.notes}\n`;
  }
  txt += `========================================\n`;
  txt += `${settings.receiptFooter}\n`;
  txt += `========================================\n`;

  const filename = `Struk-${payment.fileTag}-${tx.invoiceNumber}.txt`;
  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  return triggerBlobDownload(blob, filename);
};

/**
 * Exports filtered sales report rows to an .xlsx file via safe DOM blob download.
 */
export const downloadSalesReportExcel = (
  transactions: SaleTransaction[]
): DownloadResult => {
  const rows = transactions.map((t) => ({
    'No. Invoice': t.invoiceNumber,
    'Waktu Transaksi': t.timestamp,
    'Nama Pelanggan': t.customerName,
    'Kasir': t.cashierStaffName,
    'Tipe Pesanan': t.orderType.toUpperCase(),
    'No. Meja': t.tableNumber || '-',
    'Rincian Menu': t.items.map((i) => `${i.name} (x${i.quantity})`).join('; '),
    'Total Item': t.items.reduce((sum, i) => sum + i.quantity, 0),
    'Subtotal (Rp)': t.subtotal,
    'Diskon (Rp)': t.discount,
    'Total Bayar (Rp)': t.totalAmount,
    'Total HPP (Rp)': t.totalCost,
    'Laba Kotor (Rp)': t.grossProfit,
    'Metode Bayar': t.paymentMethod.toUpperCase(),
    'Uang Diterima (Rp)':
      t.paymentMethod === 'cash' ? t.cashGiven ?? t.totalAmount : t.totalAmount,
    'Kembalian (Rp)':
      t.paymentMethod === 'cash' ? t.cashChange ?? 0 : 0,
    'Status': t.status,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
    { wch: 40 },
    { wch: 10 },
    { wch: 15 },
    { wch: 12 },
    { wch: 16 },
    { wch: 15 },
    { wch: 15 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Penjualan');

  const filename = `Laporan-Penjualan-SalamKopi-${
    new Date().toISOString().split('T')[0]
  }.xlsx`;
  const wbArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbArray], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  return triggerBlobDownload(blob, filename);
};
