import React, { useEffect, useRef, useState } from 'react';
import {
  renderReceiptCanvas,
  downloadCanvas,
  printCanvasReceipt,
  shareWhatsApp,
  shareReceiptImageOrWhatsApp,
  sendSms,
  formatSummarySms,
  formatDetailedInvoiceText,
  openPrintableDocument,
  formatMoney,
  GenericReceiptLine,
} from '../services/nativeServices';
import { WhatsAppIcon } from './WhatsAppIcon';
import {
  X,
  Printer,
  Download,
  FileText,
  MessageSquare,
  Copy,
  Check,
  Smartphone,
  Share2,
} from 'lucide-react';

interface ReceiptPreviewModalProps {
  invoiceNo: number;
  storeName: string;
  customer: string;
  phone: string;
  payment: string;
  lines: GenericReceiptLine[];
  total: number;
  dateStr?: string;
  timeStr?: string;
  operationType?: string;
  prevBalance?: number;
  newBalance?: number;
  onClose: () => void;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  invoiceNo,
  storeName,
  customer,
  phone,
  payment,
  lines,
  total,
  dateStr,
  timeStr,
  operationType = 'فاتورة مبيعات',
  prevBalance = 0,
  newBalance = 0,
  onClose,
}) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'receipt' | 'share_options'>('receipt');
  const [copied, setCopied] = useState(false);
  const [smsMode, setSmsMode] = useState<'summary' | 'detailed'>('summary');

  const summaryText = formatSummarySms(storeName, invoiceNo, customer, total, newBalance);
  const detailedText = formatDetailedInvoiceText(
    storeName,
    invoiceNo,
    operationType,
    customer,
    phone,
    payment,
    dateStr || '',
    timeStr || '',
    lines,
    total,
    prevBalance,
    newBalance
  );

  const currentSmsText = smsMode === 'summary' ? summaryText : detailedText;

  useEffect(() => {
    const canvas = renderReceiptCanvas(
      invoiceNo,
      storeName,
      customer,
      lines,
      total,
      payment,
      dateStr,
      timeStr,
      384,
      operationType,
      prevBalance,
      newBalance,
      phone
    );
    canvasRef.current = canvas;
    if (canvasContainerRef.current) {
      canvasContainerRef.current.innerHTML = '';
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      canvas.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      canvas.style.borderRadius = '8px';
      canvasContainerRef.current.appendChild(canvas);
    }
  }, [invoiceNo, storeName, customer, lines, total, payment, dateStr, timeStr, operationType, prevBalance, newBalance, phone]);

  const handlePrint = () => {
    if (canvasRef.current) {
      printCanvasReceipt(canvasRef.current);
    }
  };

  const handleDownloadImage = () => {
    if (canvasRef.current) {
      downloadCanvas(canvasRef.current, `إيصال_${operationType}_${invoiceNo}.png`);
    }
  };

  const handleWhatsAppDetailed = () => {
    shareWhatsApp(detailedText, phone);
  };

  const handleWhatsAppSummary = () => {
    shareWhatsApp(summaryText, phone);
  };

  const handleShareImageAndWhatsApp = async () => {
    if (canvasRef.current) {
      await shareReceiptImageOrWhatsApp(
        canvasRef.current,
        `إيصال_بقالة_العزي_${invoiceNo}.png`,
        detailedText,
        phone
      );
    }
  };

  const handleSendSms = () => {
    sendSms(phone, currentSmsText);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(currentSmsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePdf = () => {
    const html = `
      <div class="header">
        <h1>${storeName}</h1>
        <h2>${operationType} رقم #${invoiceNo}</h2>
      </div>
      <div class="meta">
        <div><strong>الطرف:</strong> ${customer.trim() || 'عميل نقدي'}</div>
        <div><strong>رقم الهاتف:</strong> ${phone || 'غير مسجل'}</div>
        <div><strong>طريقة الدفع:</strong> ${payment}</div>
        <div><strong>التاريخ والوقت:</strong> ${dateStr || ''} ${timeStr || ''}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>الصنف</th>
            <th>الكمية</th>
            <th>سعر الوحدة</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${lines
            .map(
              (l) => `
            <tr>
              <td>${l.name}</td>
              <td>${formatMoney(l.qty)}</td>
              <td>${formatMoney(l.unit ?? l.cost ?? 0)} ر.ي</td>
              <td>${formatMoney(l.total)} ر.ي</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <div style="margin-top: 20px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span>١. الرصيد السابق:</span>
          <strong>${formatMoney(prevBalance)} ر.ي</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span>٢. مبلغ الفاتورة الحالية:</span>
          <strong style="color: #0284c7;">${formatMoney(total)} ر.ي</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 16px; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
          <span>٣. الرصيد التراكمي الإجمالي:</span>
          <strong style="color: ${newBalance > 0 ? '#b91c1c' : '#15803d'};">${formatMoney(newBalance)} ر.ي</strong>
        </div>
      </div>
    `;
    openPrintableDocument(`${operationType}_${invoiceNo}`, html);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                معاينة الإيصال والمشاركة ({operationType} #{invoiceNo})
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                بقالة العزي للمواد الغذائية • الرصيد التراكمي: {formatMoney(newBalance)} ر.ي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/60 p-1 gap-1">
          <button
            onClick={() => setActiveTab('receipt')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'receipt'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>صورة الإيصال الحراري (58mm)</span>
          </button>
          <button
            onClick={() => setActiveTab('share_options')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'share_options'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span>إرسال SMS وواتساب</span>
          </button>
        </div>

        {/* Modal Body */}
        {activeTab === 'receipt' ? (
          <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center justify-start bg-slate-100 dark:bg-slate-900/80">
            <div ref={canvasContainerRef} className="flex justify-center" />
          </div>
        ) : (
          <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4 bg-slate-50 dark:bg-slate-900/50">
            {/* SMS Type Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                اختر صيغة الرسالة للعميل:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSmsMode('summary')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-start gap-1 text-right transition ${
                    smsMode === 'summary'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    رسالة موجزة (الإجمالي والرصيد)
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    تحتوي على الإجمالي والرصيد التراكمي فقط (سريعة وخفيفة)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSmsMode('detailed')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-start gap-1 text-right transition ${
                    smsMode === 'detailed'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    رسالة نصية تفصيلية (كامل الفاتورة)
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    تحتوي على الأصناف، الكميات، الأسعار، والرصيد التراكمي
                  </span>
                </button>
              </div>
            </div>

            {/* Message Preview Box */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  نص الرسالة للمستلم ({phone ? `إلى: ${phone}` : 'بدون رقم مسجل'}):
                </span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
                </button>
              </div>
              <pre className="text-xs font-sans whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/80 p-3 rounded-lg text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 max-h-48 overflow-y-auto leading-relaxed">
                {currentSmsText}
              </pre>
            </div>

            {/* Direct Send Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSendSms}
                className="py-2.5 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Smartphone className="w-4 h-4" />
                <span>إرسال كرسالة SMS عادية</span>
              </button>
              <button
                type="button"
                onClick={smsMode === 'summary' ? handleWhatsAppSummary : handleWhatsAppDetailed}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>إرسال عبر واتساب</span>
              </button>
            </div>
          </div>
        )}

        {/* Action buttons bar */}
        <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 grid grid-cols-5 gap-1.5">
          <button
            onClick={handlePrint}
            title="طباعة الفاتورة"
            className="py-2 px-1 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة</span>
          </button>
          <button
            onClick={handleDownloadImage}
            title="حفظ صورة الإيصال"
            className="py-2 px-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-medium flex flex-col items-center justify-center gap-1 transition"
          >
            <Download className="w-4 h-4 text-purple-600" />
            <span>حفظ صورة</span>
          </button>
          <button
            onClick={handlePdf}
            title="تصدير كملف PDF"
            className="py-2 px-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-medium flex flex-col items-center justify-center gap-1 transition"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>PDF</span>
          </button>
          <button
            onClick={handleShareImageAndWhatsApp}
            title="مشاركة صورة الإيصال أو إرسالها لواتساب"
            className="py-2 px-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition"
          >
            <div className="flex items-center gap-0.5">
              <WhatsAppIcon className="w-4 h-4" />
              <Share2 className="w-3 h-3 text-emerald-600" />
            </div>
            <span>مشاركة صورة</span>
          </button>
          <button
            onClick={() => setActiveTab('share_options')}
            title="خيارات إرسال SMS وواتساب"
            className="py-2 px-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-medium flex flex-col items-center justify-center gap-1 transition"
          >
            <MessageSquare className="w-4 h-4 text-amber-600" />
            <span>رسالة SMS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
