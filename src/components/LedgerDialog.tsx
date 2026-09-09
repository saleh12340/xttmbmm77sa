import React, { useState, useEffect } from 'react';
import { CustomerRow, InvoiceRow, TransactionRow } from '../types';
import { StorageService } from '../db/storage';
import {
  formatMoney,
  renderAccountCanvas,
  downloadCanvas,
  shareWhatsApp,
  openPrintableDocument,
  safeName,
  sendSms,
  formatSummarySms,
} from '../services/nativeServices';
import { WhatsAppIcon } from './WhatsAppIcon';
import {
  X,
  FileText,
  DollarSign,
  PlusCircle,
  Clock,
  Receipt,
  MessageSquare,
  Package,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LedgerDialogProps {
  customer: CustomerRow;
  storeName: string;
  onClose: () => void;
  onUpdated: () => void;
}

export const LedgerDialog: React.FC<LedgerDialogProps> = ({
  customer,
  storeName,
  onClose,
  onUpdated,
}) => {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [amount, setAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('سداد حساب');
  const [currentBalance, setCurrentBalance] = useState(customer.balance);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<number | null>(null);

  const loadData = () => {
    const invs = StorageService.getCustomerInvoices(customer.name);
    const txs = StorageService.getCustomerTransactions(customer.id);
    const updatedCustomer = StorageService.getCustomers().find((c) => c.id === customer.id);
    setInvoices(invs);
    setTransactions(txs);
    if (updatedCustomer) {
      setCurrentBalance(updatedCustomer.balance);
    }
  };

  useEffect(() => {
    loadData();
  }, [customer.id]);

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      alert('يرجى كتابة مبلغ سداد صحيح');
      return;
    }
    const d = new Date();
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    StorageService.addPayment(customer.id, val, paymentNote, dateStr, timeStr);
    setAmount('');
    loadData();
    onUpdated();
  };

  const getAccountText = (): string => {
    let text = `*${storeName}*\n`;
    text += `*كشف حساب العميل: ${customer.name}*\n`;
    text += `الجوال: ${customer.phone || 'غير مسجل'}\n`;
    text += `الرصيد المستحق الحالي: ${formatMoney(currentBalance)} ر.ي\n\n`;

    if (invoices.length > 0) {
      text += `*الفواتير المسجلة:*\n`;
      invoices.slice(0, 10).forEach((inv) => {
        text += `• فاتورة #${inv.number} (${inv.date}) = ${formatMoney(inv.total)} ر.ي\n`;
      });
      text += `\n`;
    }

    if (transactions.length > 0) {
      text += `*آخر الحركات والسداد:*\n`;
      transactions.slice(0, 10).forEach((t) => {
        text += `• ${t.date} ${t.time} - ${t.note || t.type}: ${formatMoney(t.amount)} ر.ي\n`;
      });
    }

    return text;
  };

  const handleShareWhatsApp = () => {
    const text = getAccountText();
    shareWhatsApp(text, customer.phone);
  };

  const handleSendAccountSms = () => {
    const text = `عميلنا العزيز ${customer.name}\n${storeName}\nرصيد حسابكم الحالي المستحق: ${formatMoney(currentBalance)} ر.ي\nشكراً لتعاملكم معنا`;
    sendSms(customer.phone, text);
  };

  const handleDownloadImage = () => {
    const canvas = renderAccountCanvas(
      storeName,
      { ...customer, balance: currentBalance },
      invoices,
      transactions
    );
    downloadCanvas(canvas, `كشف_حساب_${safeName(customer.name)}.png`);
  };

  const handlePrintPdf = () => {
    const html = `
      <div class="header">
        <h1>${storeName}</h1>
        <h2>كشف حساب تفصيلي للعميل</h2>
      </div>
      <div class="meta">
        <div><strong>اسم العميل:</strong> ${customer.name}</div>
        <div><strong>رقم الجوال:</strong> ${customer.phone || 'غير مسجل'}</div>
        <div style="font-size: 18px; color: ${currentBalance > 0 ? '#dc2626' : '#16a34a'}; margin-top: 8px;">
          <strong>الرصيد المستحق:</strong> ${formatMoney(currentBalance)} ر.ي
        </div>
      </div>
      <h3>الفواتير المرتبطة (${invoices.length})</h3>
      <table>
        <thead>
          <tr>
            <th>رقم الفاتورة</th>
            <th>التاريخ</th>
            <th>طريقة الدفع</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${invoices
            .map(
              (i) => `
            <tr>
              <td>#${i.number}</td>
              <td>${i.date} ${i.time}</td>
              <td>${i.payment}</td>
              <td>${formatMoney(i.total)} ر.ي</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <h3 style="margin-top: 24px;">حركات السداد والدفعات (${transactions.length})</h3>
      <table>
        <thead>
          <tr>
            <th>النوع</th>
            <th>التاريخ</th>
            <th>البيان</th>
            <th>المبلغ</th>
          </tr>
        </thead>
        <tbody>
          ${transactions
            .map(
              (t) => `
            <tr>
              <td>${t.type === 'payment' ? 'سداد دفعة' : 'فاتورة آجلة'}</td>
              <td>${t.date} ${t.time}</td>
              <td>${t.note || '-'}</td>
              <td style="color: ${t.type === 'payment' ? '#16a34a' : '#dc2626'}; font-weight: bold;">
                ${t.type === 'payment' ? '-' : '+'}${formatMoney(t.amount)} ر.ي
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
    openPrintableDocument(`كشف_حساب_${safeName(customer.name)}`, html);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              كشف حساب: {customer.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              الجوال: {customer.phone || 'غير مسجل'} • الرصيد المستحق: {formatMoney(currentBalance)} ر.ي
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Balance card */}
          <div
            className={`p-4 rounded-2xl flex items-center justify-between border ${
              currentBalance > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <div>
              <span className="text-xs block opacity-80">الرصيد التراكمي المستحق</span>
              <span className="text-xs font-semibold">
                {currentBalance > 0 ? 'مبلغ دين على العميل' : 'الحساب خالص'}
              </span>
            </div>
            <div className="text-2xl font-black">{formatMoney(currentBalance)} ر.ي</div>
          </div>

          {/* Share / Export Actions */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={handlePrintPdf}
              className="py-2 px-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex flex-col items-center justify-center gap-1 transition"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>تقرير PDF</span>
            </button>
            <button
              onClick={handleDownloadImage}
              className="py-2 px-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex flex-col items-center justify-center gap-1 transition"
            >
              <Receipt className="w-4 h-4 text-purple-600" />
              <span>صورة الكشف</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="py-2 px-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex flex-col items-center justify-center gap-1 transition"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>واتساب</span>
            </button>
            <button
              onClick={handleSendAccountSms}
              className="py-2 px-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex flex-col items-center justify-center gap-1 transition"
            >
              <MessageSquare className="w-4 h-4 text-amber-600" />
              <span>رسالة SMS</span>
            </button>
          </div>

          {/* Add Payment Form */}
          <form onSubmit={handleAddPayment} className="p-3.5 bg-blue-50/50 dark:bg-slate-900/70 rounded-2xl border border-blue-100 dark:border-slate-700/80 space-y-2.5">
            <div className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-blue-600" />
              تسجيل دفعة سداد جديدة
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="المبلغ المدفوع (ر.ي)"
                  className="w-full pl-3 pr-8 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
                />
                <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
              <input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="بيان الدفعة"
                className="w-1/3 px-2 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-xs"
              >
                تسجيل
              </button>
            </div>
          </form>

          {/* Linked Invoices with Mini Details */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-slate-500" />
                فواتير العميل مع التفاصيل المصغرة ({invoices.length})
              </h4>
            </div>
            {invoices.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-2">لا توجد فواتير مرتبطة بهذا العميل بعد.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-0.5">
                {invoices.map((inv) => {
                  const isExpanded = expandedInvoiceId === inv.id;
                  const hasLines = inv.lines && inv.lines.length > 0;
                  return (
                    <div
                      key={inv.id}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/40 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              فاتورة #{inv.number}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {inv.payment}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {inv.date} {inv.time}
                          </span>
                        </div>
                        <span className="font-bold text-sm text-blue-700 dark:text-blue-400">
                          {formatMoney(inv.total)} ر.ي
                        </span>
                      </div>

                      {/* Mini Invoice Details under invoice name */}
                      {hasLines && (
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 text-[11px]">
                          <div className="flex items-center justify-between text-slate-500 font-medium mb-1">
                            <span className="flex items-center gap-1 text-[10px]">
                              <Package className="w-3 h-3 text-blue-500" />
                              تفاصيل الأصناف ({inv.lines?.length}):
                            </span>
                            {inv.lines && inv.lines.length > 2 && (
                              <button
                                type="button"
                                onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                                className="text-blue-600 text-[10px] hover:underline flex items-center gap-0.5"
                              >
                                <span>{isExpanded ? 'طي' : 'عرض الكل'}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            {(isExpanded ? inv.lines || [] : (inv.lines || []).slice(0, 2)).map((line, lIdx) => (
                              <div key={lIdx} className="flex justify-between text-slate-700 dark:text-slate-300">
                                <span>• {line.name} ({formatMoney(line.qty)} × {formatMoney(line.unit)})</span>
                                <span className="font-medium">{formatMoney(line.total)} ر.ي</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transactions / Payment log */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                الحركات والدفعات ({transactions.length})
              </h4>
            </div>
            {transactions.length === 0 ? (
              <p className="text-[11px] text-slate-400 py-2">لا توجد حركات مسجلة.</p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-700/60">
                {transactions.map((tx) => (
                  <div key={tx.id} className="pt-1.5 flex items-center justify-between text-xs">
                    <div>
                      <span
                        className={`font-semibold ${
                          tx.type === 'payment'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {tx.type === 'payment' ? 'سداد دفعة' : 'فاتورة آجلة'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {tx.note} • {tx.date} {tx.time}
                      </span>
                    </div>
                    <span
                      className={`font-bold ${
                        tx.type === 'payment'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {tx.type === 'payment' ? '-' : '+'}
                      {formatMoney(tx.amount)} ر.ي
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
