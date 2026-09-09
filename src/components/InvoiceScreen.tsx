import React, { useState } from 'react';
import { ItemRow, SaleLine } from '../types';
import { formatMoney } from '../services/nativeServices';
import { WhatsAppIcon } from './WhatsAppIcon';
import {
  User,
  UserPlus,
  Phone,
  ShoppingCart,
  Plus,
  Trash2,
  Save,
  Printer,
  FileText,
  Image as ImageIcon,
  Check,
  Package,
  MessageSquare,
  Receipt,
  Layers,
} from 'lucide-react';

interface InvoiceScreenProps {
  invoiceNo: number;
  customer: string;
  phone: string;
  payment: string;
  itemName: string;
  qty: string;
  totalInput: string;
  rows: SaleLine[];
  inventory: ItemRow[];
  setCustomer: (v: string) => void;
  setPhone: (v: string) => void;
  setPayment: (v: string) => void;
  setName: (v: string) => void;
  setQty: (v: string) => void;
  setTotal: (v: string) => void;
  setRows: (v: SaleLine[]) => void;
  onSave: () => void;
  onOpenCustomerPicker: () => void;
  onOpenPrinter: () => void;
  onShareImage: () => void;
  onSharePdf: () => void;
  onShareWhatsApp: () => void;
  onOpenSms?: () => void;
}

export const InvoiceScreen: React.FC<InvoiceScreenProps> = ({
  invoiceNo,
  customer,
  phone,
  payment,
  itemName,
  qty,
  totalInput,
  rows,
  inventory,
  setCustomer,
  setPhone,
  setPayment,
  setName,
  setQty,
  setTotal,
  setRows,
  onSave,
  onOpenCustomerPicker,
  onOpenPrinter,
  onShareImage,
  onSharePdf,
  onShareWhatsApp,
  onOpenSms,
}) => {
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const grandTotal = rows.reduce((acc, row) => acc + row.total, 0);

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = itemName.trim();
    const q = parseFloat(qty) || 1;
    const tot = parseFloat(totalInput);

    if (!cleanName) {
      alert('يرجى كتابة اسم الصنف');
      return;
    }
    if (isNaN(tot) || tot <= 0) {
      alert('يرجى تحديد إجمالي المبلغ للصنف');
      return;
    }

    const unit = tot / q;
    setRows([...rows, { name: cleanName, qty: q, unit, total: tot }]);
    setName('');
    setTotal('');
    setQty('1');
  };

  const handleQuickItemSelect = (item: ItemRow) => {
    setName(item.name);
    const q = parseFloat(qty) || 1;
    setTotal(formatMoney(item.price * q));
  };

  const handleDeleteLine = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleSaveInvoice = () => {
    if (rows.length === 0) {
      alert('أضف صنفاً واحداً على الأقل للفاتورة');
      return;
    }
    onSave();
    setSuccessNotice(`تم تأكيد وحفظ الفاتورة رقم #${invoiceNo} بنجاح!`);
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  return (
    <div className="space-y-2.5 p-2 sm:p-3 max-w-2xl mx-auto pb-24">
      {/* Success Alert Banner */}
      {successNotice && (
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* TOP COMPACT INVOICE BAR: Invoice #, Payment Toggle, Live Total */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 shadow-xs border border-slate-200/90 dark:border-slate-700/90 flex flex-wrap items-center justify-between gap-2">
        {/* Invoice Number & Items count */}
        <div className="flex items-center gap-2">
          <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-extrabold text-xs px-2.5 py-1 rounded-xl flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5" />
            <span>فاتورة #{invoiceNo}</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            ({rows.length} {rows.length === 1 ? 'صنف' : 'أصناف'})
          </span>
        </div>

        {/* Payment toggle: Cash vs Credit */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setPayment('نقدي')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              payment === 'نقدي'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            نقدي
          </button>
          <button
            type="button"
            onClick={() => setPayment('آجل')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              payment === 'آجل'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            آجل (دين)
          </button>
        </div>

        {/* Live Total Display */}
        <div className="flex items-center gap-1.5 bg-blue-600/10 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-xl border border-blue-200 dark:border-blue-800">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">المجموع:</span>
          <span className="text-sm sm:text-base font-extrabold">
            {formatMoney(grandTotal)}
          </span>
          <span className="text-[10px] font-bold">ر.ي</span>
        </div>
      </div>

      {/* CUSTOMER INFO ROW (Directly near the top of the screen) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 shadow-xs border border-slate-200/90 dark:border-slate-700/90">
        <div className="grid grid-cols-12 gap-2 items-center">
          {/* Customer Name */}
          <div className="col-span-7 sm:col-span-6">
            <div className="relative">
              <input
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                placeholder="اسم العميل (عميل نقدي)..."
                className="w-full pr-8 pl-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100 font-medium"
              />
              <User className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>
          </div>

          {/* Customer Phone (with numeric keyboard mode) */}
          <div className="col-span-5 sm:col-span-4">
            <div className="relative">
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                placeholder="الجوال (77...)"
                className="w-full pr-7 pl-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
              />
              <Phone className="w-3 h-3 text-slate-400 absolute right-2 top-2.5" />
            </div>
          </div>

          {/* Customer Picker Button */}
          <div className="col-span-12 sm:col-span-2 flex justify-end">
            <button
              type="button"
              onClick={onOpenCustomerPicker}
              className="w-full py-1.5 px-2 bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-600 transition"
              title="اختيار عميل مسجل"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">العملاء</span>
            </button>
          </div>
        </div>
      </div>

      {/* FAST ITEM ADDITION BOXES (Near the top for instant cashier entry) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xs border border-slate-200/90 dark:border-slate-700/90 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100">
          <div className="flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span>إضافة صنف للفاتورة</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">
            تحديد تلقائي للنص القديم واستقبال البيانات الجديدة فوراً
          </span>
        </div>

        {/* Input fields bar */}
        <form onSubmit={handleAddItem} className="space-y-2">
          <div className="grid grid-cols-12 gap-1.5 sm:gap-2">
            {/* Item Name */}
            <div className="col-span-5 sm:col-span-5">
              <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 font-medium">
                اسم الصنف
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setName(e.target.value)}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                placeholder="اكتب اسم الصنف..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Quantity Input (Numeric Keypad) */}
            <div className="col-span-3 sm:col-span-2">
              <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 font-medium text-center">
                الكمية
              </label>
              <input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                step="any"
                min="0.01"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                placeholder="1"
                className="w-full px-1.5 py-1.5 text-xs text-center font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Total / Price Input (Numeric Keypad) */}
            <div className="col-span-3 sm:col-span-4">
              <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 font-medium">
                المبلغ (ر.ي)
              </label>
              <input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                step="any"
                min="0.1"
                value={totalInput}
                onChange={(e) => setTotal(e.target.value)}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                placeholder="المبلغ الإجمالي"
                className="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100 text-blue-700 dark:text-blue-300"
              />
            </div>

            {/* Add Button */}
            <div className="col-span-1 flex items-end">
              <button
                type="submit"
                className="w-full h-8 flex items-center justify-center bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-xs transition"
                title="إضافة الصنف للقائمة"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Quick Inventory Chips directly below the input boxes */}
        {inventory.length > 0 && (
          <div className="pt-1 border-t border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <span className="text-[10px] text-slate-400 whitespace-nowrap">سريع:</span>
              {inventory.slice(0, 12).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleQuickItemSelect(item)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-xl bg-slate-100 dark:bg-slate-700/70 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 whitespace-nowrap flex items-center gap-1 transition"
                >
                  <Package className="w-3 h-3 text-blue-600" />
                  <span>{item.name}</span>
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300">
                    ({formatMoney(item.price)})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* INVOICE ITEMS LIST */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xs border border-slate-200/90 dark:border-slate-700/90 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span>أصناف الفاتورة الحالية ({rows.length})</span>
          </div>
          {rows.length > 0 && (
            <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300">
              المجموع: {formatMoney(grandTotal)} ر.ي
            </span>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            لم يتم إضافة أي صنف بعد. اكتب اسم الصنف والمبلغ بالأعلى أو اختر من الأصناف السريعة
          </div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5 scrollbar-thin">
            <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 px-2">
              <span className="col-span-5">الصنف</span>
              <span className="col-span-2 text-center">الكمية</span>
              <span className="col-span-2 text-center">سعر الوحدة</span>
              <span className="col-span-2 text-left">الإجمالي</span>
              <span className="col-span-1"></span>
            </div>
            {rows.map((line, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 items-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs"
              >
                <span className="col-span-5 font-medium text-slate-800 dark:text-slate-200 truncate">
                  {line.name}
                </span>
                <span className="col-span-2 text-center text-slate-600 dark:text-slate-300 font-semibold">
                  {formatMoney(line.qty)}
                </span>
                <span className="col-span-2 text-center text-slate-500 text-[11px]">
                  {formatMoney(line.unit)}
                </span>
                <span className="col-span-2 text-left font-extrabold text-slate-800 dark:text-slate-100">
                  {formatMoney(line.total)}
                </span>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleDeleteLine(idx)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-md transition"
                    title="حذف الصنف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GRAND TOTAL SUMMARY BAR */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-2xl p-3.5 shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs text-blue-100 block font-semibold">المبلغ الإجمالي للفاتورة</span>
          <span className="text-[11px] text-blue-200">
            {payment === 'آجل' ? 'فاتورة آجلة (ستضاف لحساب العميل)' : 'فاتورة نقدية كاش'}
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {formatMoney(grandTotal)} <span className="text-sm font-semibold">ر.ي</span>
        </div>
      </div>

      {/* ACTIONS BUTTONS GRID */}
      <div className="grid grid-cols-6 gap-2">
        <button
          type="button"
          onClick={handleSaveInvoice}
          className="col-span-2 py-2.5 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <Save className="w-4 h-4" />
          <span>تأكيد الفاتورة</span>
        </button>

        <button
          type="button"
          onClick={onOpenPrinter}
          className="py-2.5 px-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1 transition"
        >
          <Printer className="w-3.5 h-3.5 text-blue-600" />
          <span>طباعة</span>
        </button>

        <button
          type="button"
          onClick={onSharePdf}
          className="py-2.5 px-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1 transition"
        >
          <FileText className="w-3.5 h-3.5 text-purple-600" />
          <span>PDF</span>
        </button>

        {/* WhatsApp Button with Official WhatsApp Icon */}
        <button
          type="button"
          onClick={onShareWhatsApp}
          className="py-2.5 px-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1 transition"
          title="مشاركة الفاتورة عبر واتساب"
        >
          <WhatsAppIcon className="w-4 h-4" />
          <span>واتساب</span>
        </button>

        {/* SMS Button */}
        <button
          type="button"
          onClick={onOpenSms || onShareImage}
          className="py-2.5 px-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1 transition"
          title="إرسال رسالة نصية SMS للعميل"
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
          <span>SMS</span>
        </button>
      </div>

      <div className="flex justify-end pt-0.5">
        <button
          type="button"
          onClick={onShareImage}
          className="text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 py-1 px-2"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          معاينة وتنزيل صورة الإيصال (58mm) ومشاركة الرصيد التراكمي
        </button>
      </div>
    </div>
  );
};
