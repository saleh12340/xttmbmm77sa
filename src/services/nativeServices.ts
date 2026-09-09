import { CustomerRow, InvoiceRow, SaleLine, TransactionRow } from '../types';

export function formatMoney(v: number): string {
  if (v % 1 === 0) {
    return v.toString();
  }
  return v.toFixed(2);
}

export function today(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function now(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}

export function safeName(value: string): string {
  return value.replace(/[^\p{L}\p{N}_-]/gu, '_').slice(0, 40) || 'ملف';
}

export interface GenericReceiptLine {
  name: string;
  qty: number;
  unit?: number;
  cost?: number;
  total: number;
}

/**
 * Generates an exact 384px 58mm thermal receipt canvas (identical to native thermal POS)
 * with the 3 cumulative balance figures: 1. Previous Balance, 2. Current Invoice Amount, 3. Cumulative Balance
 */
export function renderReceiptCanvas(
  invoiceNumber: number,
  store: string,
  partyName: string,
  lines: GenericReceiptLine[],
  total: number,
  payment: string,
  dateStr?: string,
  timeStr?: string,
  width: number = 384,
  operationType: string = 'فاتورة مبيعات',
  prevBalance: number = 0,
  newBalance: number = 0,
  partyPhone: string = ''
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const rowHeight = 28;
  // Calculate dynamic canvas height to fit header, items, and the 3 balance figures nicely
  const height = Math.min(Math.max(lines.length * rowHeight + 380, 420), 2600);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // White clean receipt background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#000000';
  ctx.direction = 'rtl';

  let y = 32;

  // Store name
  ctx.font = 'bold 20px Tajawal, Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(store || 'بقالة العزي للمواد الغذائية', width / 2, y);
  y += 24;

  // Operation Type & Subtitle / Invoice #
  ctx.font = 'bold 16px Tajawal, Cairo, sans-serif';
  ctx.fillStyle = '#1e3a8a';
  ctx.fillText(`${operationType} رقم #${invoiceNumber}`, width / 2, y);
  ctx.fillStyle = '#000000';
  y += 22;

  // Dashed divider
  ctx.font = '12px monospace';
  ctx.fillText('------------------------------------------------', width / 2, y);
  y += 20;

  // Customer or Supplier & Payment (RTL right-aligned)
  const isPurchase = operationType.includes('شراء') || operationType.includes('مورد');
  const partyLabel = isPurchase ? 'المورد' : 'العميل';

  ctx.textAlign = 'right';
  ctx.font = 'bold 14px Tajawal, Cairo, sans-serif';
  ctx.fillText(`${partyLabel}: ${partyName.trim() || (isPurchase ? 'مورد عام' : 'عميل نقدي')}`, width - 15, y);
  y += 20;

  if (partyPhone) {
    ctx.font = '13px Tajawal, Cairo, sans-serif';
    ctx.fillText(`الهاتف: ${partyPhone}`, width - 15, y);
    y += 18;
  }

  ctx.font = '13px Tajawal, Cairo, sans-serif';
  ctx.fillText(`طريقة الدفع: ${payment}`, width - 15, y);
  y += 18;

  const currentDateTime = `${dateStr || today()} ${timeStr || now()}`;
  ctx.fillStyle = '#444444';
  ctx.fillText(`التاريخ: ${currentDateTime}`, width - 15, y);
  y += 18;

  // Dashed divider
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.font = '12px monospace';
  ctx.fillText('------------------------------------------------', width / 2, y);
  y += 20;

  // Table header
  ctx.font = 'bold 14px Tajawal, Cairo, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('الصنف', width - 15, y);
  ctx.textAlign = 'center';
  ctx.fillText('الكمية', width / 2 + 10, y);
  ctx.textAlign = 'left';
  ctx.fillText('الإجمالي', 15, y);
  y += 20;

  // Table items
  ctx.font = '13px Tajawal, Cairo, sans-serif';
  lines.forEach((line) => {
    const itemName = line.name.length > 18 ? line.name.slice(0, 18) + '..' : line.name;
    ctx.textAlign = 'right';
    ctx.fillText(itemName, width - 15, y);

    ctx.textAlign = 'center';
    ctx.fillText(formatMoney(line.qty), width / 2 + 10, y);

    ctx.textAlign = 'left';
    ctx.fillText(formatMoney(line.total), 15, y);
    y += rowHeight;
  });

  // Dashed divider
  ctx.textAlign = 'center';
  ctx.font = '12px monospace';
  ctx.fillText('------------------------------------------------', width / 2, y);
  y += 22;

  // Current Invoice Total
  ctx.font = 'bold 16px Tajawal, Cairo, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('مبلغ الفاتورة الحالية:', width - 15, y);
  ctx.textAlign = 'left';
  ctx.fillText(`${formatMoney(total)} ر.ي`, 15, y);
  y += 24;

  // Highlight Box: The 3 Cumulative Balance Figures
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  const boxHeight = 72;
  ctx.fillRect(12, y, width - 24, boxHeight);
  ctx.strokeRect(12, y, width - 24, boxHeight);

  // 1. Previous Balance (الرصيد السابق)
  ctx.fillStyle = '#475569';
  ctx.font = '13px Tajawal, Cairo, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('١. الرصيد السابق:', width - 24, y + 20);
  ctx.textAlign = 'left';
  ctx.fillText(`${formatMoney(prevBalance)} ر.ي`, 24, y + 20);

  // 2. Current Invoice Total (مبلغ العملية)
  ctx.fillText('٢. مبلغ هذه العملية:', width - 24, y + 42);
  ctx.textAlign = 'left';
  ctx.fillText(`${formatMoney(total)} ر.ي`, 24, y + 42);

  // 3. New Cumulative Balance (الرصيد التراكمي الإجمالي)
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px Tajawal, Cairo, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('٣. الرصيد التراكمي الكلي:', width - 24, y + 64);
  ctx.textAlign = 'left';
  ctx.fillStyle = newBalance > 0 ? '#b91c1c' : '#15803d';
  ctx.fillText(`${formatMoney(newBalance)} ر.ي`, 24, y + 64);

  y += boxHeight + 24;

  // Dashed divider
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.font = '12px monospace';
  ctx.fillText('------------------------------------------------', width / 2, y);
  y += 22;

  // Footer message
  ctx.font = '13px Tajawal, Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#475569';
  ctx.fillText('شكراً لزيارتكم • بقالة العزي ترحب بكم دائماً', width / 2, y);

  return canvas;
}

/**
 * Generates an exact 384px 58mm customer account statement canvas (identical to Android accountBitmap)
 */
export function renderAccountCanvas(
  store: string,
  customer: CustomerRow,
  invoices: InvoiceRow[],
  transactions: TransactionRow[],
  width: number = 384
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const lineCount = invoices.length + transactions.length + 8;
  const height = Math.min(Math.max(lineCount * 28 + 260, 480), 3000);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#000000';
  ctx.direction = 'rtl';

  let y = 35;

  // Store name
  ctx.font = 'bold 20px Tajawal, Cairo, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(store, width / 2, y);
  y += 26;

  ctx.font = 'bold 16px Tajawal, Cairo, sans-serif';
  ctx.fillText('كشف حساب العميل', width / 2, y);
  y += 24;

  ctx.font = '12px monospace';
  ctx.fillText('------------------------------------------------', width / 2, y);
  y += 20;

  // Customer info
  ctx.textAlign = 'right';
  ctx.font = 'bold 15px Tajawal, Cairo, sans-serif';
  ctx.fillText(`العميل: ${customer.name}`, width - 15, y);
  y += 22;

  ctx.font = '14px Tajawal, Cairo, sans-serif';
  ctx.fillText(`الجوال: ${customer.phone || 'بدون رقم'}`, width - 15, y);
  y += 24;

  // Outstanding balance
  ctx.font = 'bold 17px Tajawal, Cairo, sans-serif';
  ctx.fillStyle = customer.balance > 0 ? '#C62828' : '#2E7D32';
  ctx.fillText(`الرصيد المستحق: ${formatMoney(customer.balance)} ر.ي`, width - 15, y);
  ctx.fillStyle = '#000000';
  y += 26;

  // Linked invoices section
  if (invoices.length > 0) {
    ctx.font = 'bold 15px Tajawal, Cairo, sans-serif';
    ctx.fillText('الفواتير المرتبطة:', width - 15, y);
    y += 20;

    ctx.font = '13px Tajawal, Cairo, sans-serif';
    invoices.slice(0, 25).forEach((inv) => {
      ctx.textAlign = 'right';
      ctx.fillText(`#${inv.number}  ${inv.date}  (${inv.payment})`, width - 15, y);
      ctx.textAlign = 'left';
      ctx.fillText(`${formatMoney(inv.total)} ر.ي`, 15, y);
      y += 22;
    });
  }

  // Transactions / Payments section
  if (transactions.length > 0) {
    y += 8;
    ctx.textAlign = 'right';
    ctx.font = 'bold 15px Tajawal, Cairo, sans-serif';
    ctx.fillText('الحركات والسداد:', width - 15, y);
    y += 20;

    ctx.font = '13px Tajawal, Cairo, sans-serif';
    transactions.slice(0, 25).forEach((tx) => {
      const typeLabel = tx.type === 'payment' ? 'سداد' : 'فاتورة';
      ctx.textAlign = 'right';
      ctx.fillText(`${tx.date} ${tx.time} - ${tx.note || typeLabel}`, width - 15, y);
      ctx.textAlign = 'left';
      ctx.fillText(`${formatMoney(tx.amount)} ر.ي`, 15, y);
      y += 22;
    });
  }

  y += 10;
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('------------------------------------------------', width / 2, y);
  y += 20;

  ctx.font = '12px Tajawal, Cairo, sans-serif';
  ctx.fillStyle = '#555555';
  ctx.fillText(`تاريخ الكشف: ${today()} ${now()}`, width / 2, y);

  return canvas;
}

/**
 * Downloads a canvas as a PNG file
 */
export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Opens a print window for the thermal receipt
 */
export function printCanvasReceipt(canvas: HTMLCanvasElement): void {
  const dataUrl = canvas.toDataURL('image/png');
  const printWindow = window.open('', '_blank', 'width=420,height=600');
  if (!printWindow) {
    // Fallback: direct browser print
    window.print();
    return;
  }
  printWindow.document.write(`
    <!doctype html>
    <html dir="rtl">
      <head>
        <title>طباعة الفاتورة</title>
        <style>
          @page { size: 58mm auto; margin: 0; }
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: flex-start; background: #fff; }
          img { width: 58mm; max-width: 100%; display: block; margin: 0 auto; }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" onload="window.print(); window.close();" />
      </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Shares text or invoice via WhatsApp
 */
export function shareWhatsApp(text: string, phone: string = ''): void {
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  // If Yemeni local mobile starts with 7 (9 digits) and lacks 967 prefix, add it
  if (cleanPhone.length === 9 && cleanPhone.startsWith('7')) {
    cleanPhone = `967${cleanPhone}`;
  }
  const encoded = encodeURIComponent(text);
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;
  window.open(url, '_blank');
}

/**
 * Shares image receipt via Web Share API if supported, or downloads image and opens WhatsApp
 */
export async function shareReceiptImageOrWhatsApp(
  canvas: HTMLCanvasElement,
  filename: string,
  text: string,
  phone: string = ''
): Promise<{ method: 'share_api' | 'download_fallback' }> {
  try {
    if (navigator.share && navigator.canShare) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: filename,
            text,
          });
          return { method: 'share_api' };
        }
      }
    }
  } catch (e) {
    console.log('Native share failed or dismissed, falling back:', e);
  }

  // Fallback: download canvas receipt image and open WhatsApp with invoice text
  downloadCanvas(canvas, filename);
  shareWhatsApp(text, phone);
  return { method: 'download_fallback' };
}

/**
 * Opens device SMS app with prefilled text
 */
export function sendSms(phone: string, text: string): void {
  let cleanPhone = phone.replace(/[^0-9+]/g, '');
  const encoded = encodeURIComponent(text);
  const isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
  const delimiter = isApple ? '&' : '?';
  const url = cleanPhone ? `sms:${cleanPhone}${delimiter}body=${encoded}` : `sms:${delimiter}body=${encoded}`;
  window.location.href = url;
}

/**
 * Generates concise SMS message for customer with total and cumulative balance
 */
export function formatSummarySms(
  storeName: string,
  invoiceNo: number,
  customer: string,
  total: number,
  newBalance: number
): string {
  const store = storeName || 'بقالة العزي للمواد الغذائية';
  const cust = customer.trim() || 'المحترم';
  return `عميلنا العزيز: ${cust}\n${store}\nتم قيد فاتورة رقم: #${invoiceNo}\nقيمة الفاتورة: ${formatMoney(total)} ر.ي\nالرصيد التراكمي: ${formatMoney(newBalance)} ر.ي\nشكراً لتعاملكم معنا`;
}

/**
 * Generates detailed SMS message for customer with all items, amounts, and the 3 balance figures
 */
export function formatDetailedInvoiceText(
  storeName: string,
  invoiceNo: number,
  operationTitle: string,
  partyName: string,
  partyPhone: string,
  payment: string,
  dateStr: string,
  timeStr: string,
  lines: GenericReceiptLine[],
  total: number,
  prevBalance: number,
  newBalance: number
): string {
  const store = storeName || 'بقالة العزي للمواد الغذائية';
  let text = `*${store}*\n`;
  text += `*${operationTitle} #${invoiceNo}*\n`;
  text += `الاسم: ${partyName.trim() || 'عميل نقدي'}\n`;
  if (partyPhone) text += `الهاتف: ${partyPhone}\n`;
  text += `طريقة الدفع: ${payment}\n`;
  text += `التاريخ: ${dateStr || today()} ${timeStr || now()}\n`;
  text += `------------------------\n`;
  lines.forEach((l) => {
    const price = l.unit ?? l.cost ?? 0;
    text += `• ${l.name} (${formatMoney(l.qty)} × ${formatMoney(price)}) = ${formatMoney(l.total)} ر.ي\n`;
  });
  text += `------------------------\n`;
  text += `١. الرصيد السابق: ${formatMoney(prevBalance)} ر.ي\n`;
  text += `٢. مبلغ الفاتورة الحالية: ${formatMoney(total)} ر.ي\n`;
  text += `٣. الرصيد التراكمي الكلي: ${formatMoney(newBalance)} ر.ي\n`;
  text += `------------------------\n`;
  text += `شكراً لزيارتكم • نسعد بخدمتكم دائماً`;
  return text;
}


/**
 * Exports invoices as an Excel-compatible CSV file (with UTF-8 BOM for perfect Arabic display)
 */
export function exportInvoicesToCsv(invoices: InvoiceRow[]): void {
  const headers = ['رقم الفاتورة', 'اسم العميل', 'رقم الهاتف', 'الإجمالي (ر.ي)', 'طريقة الدفع', 'التاريخ', 'الوقت'];
  const rows = invoices.map((inv) => [
    inv.number.toString(),
    `"${inv.customer.replace(/"/g, '""')}"`,
    `"${inv.phone}"`,
    inv.total.toString(),
    `"${inv.payment}"`,
    inv.date,
    inv.time,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `سجل_الفواتير_${today()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an HTML printable PDF / print preview for an invoice or account statement
 */
export function openPrintableDocument(title: string, contentHtml: string): void {
  const printWindow = window.open('', '_blank', 'width=600,height=800');
  if (!printWindow) {
    window.print();
    return;
  }
  printWindow.document.write(`
    <!doctype html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          body { font-family: 'Tajawal', 'Cairo', sans-serif; padding: 24px; color: #1e293b; direction: rtl; }
          .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
          h1 { margin: 0 0 6px 0; font-size: 22px; color: #0f172a; }
          h2 { margin: 0; font-size: 16px; color: #0284c7; font-weight: normal; }
          .meta { margin-bottom: 20px; font-size: 14px; line-height: 1.8; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right; }
          th { background: #f1f5f9; font-weight: bold; }
          .total { font-size: 18px; font-weight: bold; color: #0284c7; margin-top: 20px; text-align: left; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        ${contentHtml}
        <div style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 24px; background: #1565C0; color: white; border: none; border-radius: 6px; font-size: 15px; cursor: pointer;">
            طباعة / حفظ PDF
          </button>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
}
