import React, { useState } from 'react';
import { InvoiceRow } from '../types';
import {
  formatMoney,
  shareWhatsApp,
  openPrintableDocument,
  exportInvoicesToCsv,
  sendSms,
  formatSummarySms,
} from '../services/nativeServices';
import { WhatsAppIcon } from './WhatsAppIcon';
import {
  History,
  FileSpreadsheet,
  FileText,
  Search,
  Calendar,
  User,
  Eye,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Package,
} from 'lucide-react';

interface HistoryScreenProps {
  invoices: InvoiceRow[];
  storeName: string;
  onPreviewInvoice: (invoice: InvoiceRow) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  invoices,
  storeName,
  onPreviewInvoice,
}) => {
  const [filter, setFilter] = useState('');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<number | null>(null);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.number.toString().includes(filter) ||
      inv.customer.toLowerCase().includes(filter.toLowerCase()) ||
      inv.phone.includes(filter) ||
      inv.date.includes(filter)
  );

  const handleOpenPdf = (inv: InvoiceRow) => {
    const html = `
      <div class="header">
        <h1>${storeName}</h1>
        <h2>فاتورة مبيعات #${inv.number}</h2>
      </div>
      <div class="meta">
        <div><strong>العميل:</strong> ${inv.customer}</div>
        <div><strong>رقم الهاتف:</strong> ${inv.phone || 'غير مسجل'}</div>
        <div><strong>التاريخ والوقت:</strong> ${inv.date} ${inv.time}</div>
        <div><strong>طريقة الدفع:</strong> ${inv.payment}</div>
      </div>
      ${
        inv.lines && inv.lines.length > 0
          ? `
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
            ${inv.lines
              .map(
                (l) => `
              <tr>
                <td>${l.name}</td>
                <td>${formatMoney(l.qty)}</td>
                <td>${formatMoney(l.unit)} ر.ي</td>
                <td>${formatMoney(l.total)} ر.ي</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
          : ''
      }
      <div style="margin-top: 16px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>١. الرصيد السابق:</span>
          <strong>${formatMoney(inv.prevBalance || 0)} ر.ي</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>٢. مبلغ الفاتورة الحالية:</span>
          <strong style="color: #0284c7;">${formatMoney(inv.total)} ر.ي</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
          <span>٣. الرصيد التراكمي:</span>
          <strong>${formatMoney(inv.newBalance || (inv.payment === 'آجل' ? inv.total : 0))} ر.ي</strong>
        </div>
      </div>
    `;
    openPrintableDocument(`فاتورة_${inv.number}`, html);
  };

  const handleShareWhatsApp = (inv: InvoiceRow) => {
    let text = `*${storeName}*\n`;
    text += `فاتورة رقم #${inv.number}\n`;
    text += `العميل: ${inv.customer}\n`;
    text += `التاريخ: ${inv.date} ${inv.time}\n`;
    text += `طريقة الدفع: ${inv.payment}\n`;
    text += `------------------------\n`;
    if (inv.lines && inv.lines.length > 0) {
      inv.lines.forEach((l) => {
        text += `• ${l.name} (${formatMoney(l.qty)} × ${formatMoney(l.unit)}) = ${formatMoney(l.total)} ر.ي\n`;
      });
      text += `------------------------\n`;
    }
    text += `١. الرصيد السابق: ${formatMoney(inv.prevBalance || 0)} ر.ي\n`;
    text += `٢. مبلغ الفاتورة: ${formatMoney(inv.total)} ر.ي\n`;
    text += `٣. الرصيد التراكمي: ${formatMoney(inv.newBalance || (inv.payment === 'آجل' ? inv.total : 0))} ر.ي\n`;
    text += `شكراً لتعاملكم معنا`;

    shareWhatsApp(text, inv.phone);
  };

  const handleSendSms = (inv: InvoiceRow) => {
    const text = formatSummarySms(
      storeName,
      inv.number,
      inv.customer,
      inv.total,
      inv.newBalance || (inv.payment === 'آجل' ? inv.total : 0)
    );
    sendSms(inv.phone, text);
  };

  const handleExportExcel = () => {
    if (invoices.length === 0) {
      alert('لا توجد فواتير لتصديرها');
      return;
    }
    exportInvoicesToCsv(invoices);
  };

  return (
    <div className="space-y-3 p-3 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            سجل الفواتير
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            إجمالي {invoices.length} فاتورة مسجلة
          </span>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4" />
          تصدير Excel
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="ابحث برقم الفاتورة، اسم العميل، الهاتف، أو التاريخ..."
          className="w-full pr-9 pl-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100 shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          لا توجد فواتير تطابق بحثك
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredInvoices.map((inv) => {
            const isExpanded = expandedInvoiceId === inv.id;
            const hasLines = inv.lines && inv.lines.length > 0;
            const linesToShow = isExpanded ? inv.lines || [] : (inv.lines || []).slice(0, 2);

            return (
              <div
                key={inv.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 shadow-xs border border-slate-200/80 dark:border-slate-700/80 space-y-2 transition hover:border-blue-300 dark:hover:border-blue-700"
              >
                {/* Main Row */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        فاتورة #{inv.number}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          inv.payment.includes('آجل')
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                        }`}
                      >
                        {inv.payment}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>{inv.customer}</span>
                      {inv.phone && <span className="text-slate-400 text-[10px]">({inv.phone})</span>}
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {inv.date} • {inv.time}
                      </span>
                    </div>
                  </div>

                  <div className="text-left flex flex-col items-end gap-1">
                    <div className="text-base font-extrabold text-blue-700 dark:text-blue-400">
                      {formatMoney(inv.total)} <span className="text-[11px] font-normal">ر.ي</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onPreviewInvoice(inv)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                        title="معاينة الإيصال"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPdf(inv)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                        title="تصدير PDF"
                      >
                        <FileText className="w-4 h-4 text-purple-600" />
                      </button>

                      {/* WhatsApp Icon Button */}
                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(inv)}
                        className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                        title="مشاركة عبر واتساب"
                      >
                        <WhatsAppIcon className="w-4 h-4" />
                      </button>

                      {/* SMS Button */}
                      <button
                        type="button"
                        onClick={() => handleSendSms(inv)}
                        className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                        title="إرسال رسالة SMS للعميل"
                      >
                        <MessageSquare className="w-4 h-4 text-amber-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Compact Details Under Invoice Name */}
                {hasLines && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs mt-1">
                    <div className="flex items-center justify-between mb-1 text-[11px] text-slate-500 font-bold">
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-blue-600" />
                        تفاصيل الفاتورة المصغرة ({inv.lines?.length} صنف):
                      </span>
                      {inv.lines && inv.lines.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 text-[10px]"
                        >
                          <span>{isExpanded ? 'طي التفاصيل' : `عرض الكل (${inv.lines.length})`}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      {linesToShow.map((line, lIdx) => (
                        <div key={lIdx} className="flex justify-between items-center text-slate-700 dark:text-slate-300 text-[11px]">
                          <span className="truncate max-w-[65%]">
                            • {line.name} ({formatMoney(line.qty)} × {formatMoney(line.unit)})
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatMoney(line.total)} ر.ي
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Balance breakdown badge if available */}
                    {(inv.prevBalance !== undefined || inv.newBalance !== undefined) && (
                      <div className="mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[10px] text-slate-500">
                        <span>الرصيد السابق: {formatMoney(inv.prevBalance || 0)} ر.ي</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          الرصيد التراكمي: {formatMoney(inv.newBalance || (inv.payment === 'آجل' ? inv.total : 0))} ر.ي
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
