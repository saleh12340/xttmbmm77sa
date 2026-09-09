import React, { useState } from 'react';
import { ItemRow, PurchaseInvoiceRow, PurchaseLine, SupplierRow } from '../types';
import { StorageService } from '../db/storage';
import { formatMoney, now, today, shareWhatsApp, sendSms } from '../services/nativeServices';
import { WhatsAppIcon } from './WhatsAppIcon';
import {
  Truck,
  Building2,
  Phone,
  Package,
  Plus,
  Trash2,
  Save,
  Printer,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface PurchaseInvoiceScreenProps {
  inventory: ItemRow[];
  onInventoryUpdated: () => void;
  onPreviewReceipt: (invoice: {
    invoiceNo: number;
    customer: string;
    phone: string;
    payment: string;
    lines: { name: string; qty: number; cost?: number; unit?: number; total: number }[];
    total: number;
    operationType: string;
    prevBalance: number;
    newBalance: number;
    dateStr: string;
    timeStr: string;
  }) => void;
}

export const PurchaseInvoiceScreen: React.FC<PurchaseInvoiceScreenProps> = ({
  inventory,
  onInventoryUpdated,
  onPreviewReceipt,
}) => {
  const [purchaseNumber, setPurchaseNumber] = useState<number>(() => StorageService.nextPurchaseInvoice());
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [payment, setPayment] = useState<'نقدي' | 'آجل'>('نقدي');

  const [itemName, setItemName] = useState('');
  const [qty, setQty] = useState('1');
  const [costInput, setCostInput] = useState('');
  const [sellingPriceInput, setSellingPriceInput] = useState('');
  const [lines, setLines] = useState<PurchaseLine[]>([]);

  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'new_invoice' | 'history' | 'suppliers'>('new_invoice');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<number | null>(null);

  const [suppliers, setSuppliers] = useState<SupplierRow[]>(() => StorageService.getSuppliers());
  const [purchases, setPurchases] = useState<PurchaseInvoiceRow[]>(() => StorageService.getPurchases());

  const grandTotal = lines.reduce((sum, line) => sum + line.total, 0);

  // Live profit calculation for current item being entered
  const curCost = parseFloat(costInput) || 0;
  const curSell = parseFloat(sellingPriceInput) || 0;
  const unitProfit = curSell > 0 && curCost > 0 ? curSell - curCost : 0;
  const profitMarginPercent = curCost > 0 && unitProfit !== 0 ? ((unitProfit / curCost) * 100).toFixed(1) : null;

  const handleAddLine = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = itemName.trim();
    const q = parseFloat(qty) || 1;
    const c = parseFloat(costInput);
    const sp = parseFloat(sellingPriceInput);

    if (!cleanName) {
      alert('يرجى كتابة أو تحديد اسم الصنف المراد شراؤه');
      return;
    }
    if (isNaN(c) || c <= 0) {
      alert('يرجى تحديد سعر الشراء / التكلفة');
      return;
    }

    const tot = q * c;
    setLines([
      ...lines,
      {
        name: cleanName,
        qty: q,
        cost: c,
        sellingPrice: !isNaN(sp) && sp > 0 ? sp : undefined,
        total: tot,
      },
    ]);

    // Reset input fields
    setItemName('');
    setCostInput('');
    setSellingPriceInput('');
    setQty('1');
  };

  const handleSelectFromStock = (item: ItemRow) => {
    setItemName(item.name);
    setCostInput(item.cost ? item.cost.toString() : '');
    setSellingPriceInput(item.price ? item.price.toString() : '');
  };

  const handleDeleteLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleConfirmPurchase = () => {
    if (lines.length === 0) {
      alert('يرجى إضافة صنف واحد على الأقل لفاتورة الشراء');
      return;
    }
    const cleanSupplier = supplierName.trim() || 'مورد عام';
    const dateStr = today();
    const timeStr = now();

    const res = StorageService.addPurchaseInvoice(
      purchaseNumber,
      cleanSupplier,
      supplierPhone,
      grandTotal,
      payment,
      dateStr,
      timeStr,
      lines
    );

    // Refresh inventory and purchases
    onInventoryUpdated();
    setPurchases(StorageService.getPurchases());
    setSuppliers(StorageService.getSuppliers());

    // Prompt receipt preview
    onPreviewReceipt({
      invoiceNo: purchaseNumber,
      customer: cleanSupplier,
      phone: supplierPhone,
      payment,
      lines,
      total: grandTotal,
      operationType: 'فاتورة شراء من المورد',
      prevBalance: res.prevBalance,
      newBalance: res.newBalance,
      dateStr,
      timeStr,
    });

    setSuccessNotice(`تم حفظ فاتورة الشراء #${purchaseNumber} وتحديث المخزون والأسعار بنجاح!`);
    setTimeout(() => setSuccessNotice(null), 4000);

    // Reset form
    setLines([]);
    setSupplierName('');
    setSupplierPhone('');
    setPurchaseNumber(StorageService.nextPurchaseInvoice());
  };

  const handleSelectSupplier = (s: SupplierRow) => {
    setSupplierName(s.name);
    setSupplierPhone(s.phone);
  };

  return (
    <div className="space-y-3 p-2.5 sm:p-3 max-w-2xl mx-auto pb-24">
      {/* Sub Navigation */}
      <div className="flex bg-slate-200/70 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('new_invoice')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'new_invoice'
              ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>فاتورة شراء جديدة</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>سجل المشتريات ({purchases.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'suppliers'
              ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>حسابات الموردين ({suppliers.length})</span>
        </button>
      </div>

      {activeTab === 'new_invoice' && (
        <>
          {/* Notice Banner */}
          {successNotice && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Compact Top Bar with Invoice Number, Payment Type, and Real-time Total */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-800 dark:text-blue-300 text-xs font-black">
                شراء #{purchaseNumber}
              </div>

              {/* Quick Payment Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setPayment('نقدي')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    payment === 'نقدي'
                      ? 'bg-blue-700 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  نقدي
                </button>
                <button
                  type="button"
                  onClick={() => setPayment('آجل')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    payment === 'آجل'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  آجل مورد
                </button>
              </div>
            </div>

            {/* Live Grand Total */}
            <div className="text-left flex items-baseline gap-1">
              <span className="text-[10px] text-slate-400 font-medium">الإجمالي:</span>
              <span className="text-lg sm:text-xl font-black text-blue-700 dark:text-blue-400">
                {formatMoney(grandTotal)}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">ر.ي</span>
            </div>
          </div>

          {/* Supplier Info Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xs border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  placeholder="اسم المورد / الشركة (مثلاً: شركة البركة)"
                  className="w-full pr-8 pl-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100 font-medium"
                />
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
              <div className="relative">
                <input
                  type="tel"
                  inputMode="tel"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  placeholder="رقم هاتف المورد (مثلاً: 771234567)"
                  className="w-full pr-8 pl-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>

            {/* Quick Supplier Chips */}
            {suppliers.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
                <span className="text-[10px] text-slate-400 self-center shrink-0">الموردون:</span>
                {suppliers.slice(0, 6).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSupplier(s)}
                    className="px-2 py-0.5 text-[11px] rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 border border-slate-200 dark:border-slate-600 whitespace-nowrap"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cashier Item Addition Section - Close to Top of Screen with Cost and Selling Price */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-xs border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>إدخال صنف الشراء وتحديث أسعار المحزون</span>
              </div>
              {unitProfit > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <TrendingUp className="w-3 h-3" />
                  <span>ربح القطعة: +{formatMoney(unitProfit)} ر.ي ({profitMarginPercent}%)</span>
                </div>
              )}
            </div>

            <form onSubmit={handleAddLine} className="space-y-2">
              {/* Primary Item Name & Qty */}
              <div className="grid grid-cols-12 gap-1.5">
                <div className="col-span-8 sm:col-span-9">
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                    اسم الصنف المشترى
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    placeholder="اكتب اسم الصنف أو اختره من المخزون أدناه..."
                    className="w-full px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100 font-medium"
                  />
                </div>
                <div className="col-span-4 sm:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
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
                    className="w-full px-2 py-2 text-xs text-center bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100 font-black"
                  />
                </div>
              </div>

              {/* Cost Price, Selling Price & Add Button */}
              <div className="grid grid-cols-12 gap-1.5 items-end">
                <div className="col-span-5 sm:col-span-5">
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                    سعر الشراء / التكلفة (ر.ي) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    step="any"
                    min="0.1"
                    value={costInput}
                    onChange={(e) => setCostInput(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    placeholder="التكلفة من المورد"
                    className="w-full px-2.5 py-2 text-xs bg-blue-50/50 dark:bg-slate-900 border border-blue-300 dark:border-blue-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-blue-900 dark:text-blue-300 font-black"
                  />
                </div>

                <div className="col-span-5 sm:col-span-5">
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                    سعر البيع بالمحل (ر.ي)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    step="any"
                    min="0.1"
                    value={sellingPriceInput}
                    onChange={(e) => setSellingPriceInput(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    placeholder="سعر البيع للزبون"
                    className="w-full px-2.5 py-2 text-xs bg-emerald-50/50 dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-emerald-900 dark:text-emerald-300 font-black"
                  />
                </div>

                <div className="col-span-2 sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full h-9 flex items-center justify-center bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-xs transition font-bold"
                    title="إضافة الصنف لفاتورة الشراء"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>

            {/* Quick stock shortcuts */}
            {inventory.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] text-slate-400 block mb-1">اختر صنفاً مسجلاً لتعبئة بياناته:</span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {inventory.slice(0, 10).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectFromStock(item)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 whitespace-nowrap"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Purchased Lines List */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-xs border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
              <span>أصناف فاتورة الشراء ({lines.length})</span>
              <span className="text-[11px] text-slate-400">
                المجموع: {formatMoney(grandTotal)} ر.ي
              </span>
            </div>

            {lines.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                أضف الأصناف المشتراة من المورد أعلاه لتسجيلها وزيادة كمياتها في المخزون
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 px-2">
                  <span className="col-span-4">الصنف</span>
                  <span className="col-span-2 text-center">الكمية</span>
                  <span className="col-span-2 text-center">سعر الشراء</span>
                  <span className="col-span-2 text-center">سعر البيع</span>
                  <span className="col-span-2 text-left">الإجمالي</span>
                </div>
                {lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 items-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs"
                  >
                    <span className="col-span-4 font-medium text-slate-800 dark:text-slate-200 truncate">
                      {line.name}
                    </span>
                    <span className="col-span-2 text-center text-blue-700 font-bold dark:text-blue-400">
                      +{formatMoney(line.qty)}
                    </span>
                    <span className="col-span-2 text-center text-slate-700 dark:text-slate-300 font-semibold">
                      {formatMoney(line.cost)}
                    </span>
                    <span className="col-span-2 text-center text-emerald-700 dark:text-emerald-400 font-semibold">
                      {line.sellingPrice ? `${formatMoney(line.sellingPrice)}` : '-'}
                    </span>
                    <div className="col-span-2 flex items-center justify-between text-left">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {formatMoney(line.total)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteLine(idx)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-md transition"
                        title="حذف السطر"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleConfirmPurchase}
              className="py-3 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>تأكيد الفاتورة وزيادة المخزون</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (lines.length === 0) {
                  alert('أضف أصنافاً لمعاينة الإيصال');
                  return;
                }
                onPreviewReceipt({
                  invoiceNo: purchaseNumber,
                  customer: supplierName.trim() || 'مورد عام',
                  phone: supplierPhone,
                  payment,
                  lines,
                  total: grandTotal,
                  operationType: 'فاتورة شراء من المورد',
                  prevBalance: 0,
                  newBalance: payment === 'آجل' ? grandTotal : 0,
                  dateStr: today(),
                  timeStr: now(),
                });
              }}
              className="py-3 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>معاينة إيصال الشراء</span>
            </button>
          </div>
        </>
      )}

      {/* History Tab with Compact Details Under Invoice Name */}
      {activeTab === 'history' && (
        <div className="space-y-2.5">
          {purchases.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              لا توجد فواتير شراء سابقة مسجلة.
            </div>
          ) : (
            purchases.map((inv) => {
              const isExpanded = expandedInvoiceId === inv.id;
              return (
                <div
                  key={inv.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 shadow-xs border border-slate-200 dark:border-slate-700 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          فاتورة شراء #{inv.number}
                        </span>
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                          • {inv.supplier}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            inv.payment === 'آجل'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          }`}
                        >
                          {inv.payment}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>التاريخ: {inv.date} {inv.time}</span>
                        {inv.phone && <span>• جوال: {inv.phone}</span>}
                      </div>
                    </div>

                    <div className="text-left flex items-center gap-2">
                      <span className="font-black text-base text-slate-900 dark:text-slate-100">
                        {formatMoney(inv.total)} <span className="text-xs font-normal">ر.ي</span>
                      </span>
                      <button
                        onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                        title="عرض / إخفاء تفاصيل الأصناف"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Compact details under invoice name */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      تفاصيل الأصناف المشتراة ({inv.lines.length} صنف):
                    </span>
                    <div className="space-y-1">
                      {(isExpanded ? inv.lines : inv.lines.slice(0, 2)).map((line, lIdx) => (
                        <div key={lIdx} className="flex justify-between text-slate-700 dark:text-slate-300">
                          <span>
                            • {line.name} ({formatMoney(line.qty)} × {formatMoney(line.cost)} ر.ي)
                          </span>
                          <span className="font-semibold">{formatMoney(line.total)} ر.ي</span>
                        </div>
                      ))}
                      {!isExpanded && inv.lines.length > 2 && (
                        <button
                          onClick={() => setExpandedInvoiceId(inv.id)}
                          className="text-[10px] text-blue-600 hover:underline font-semibold"
                        >
                          + عرض بقية الأصناف ({inv.lines.length - 2} أخرى)
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions for historic invoice */}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() =>
                        onPreviewReceipt({
                          invoiceNo: inv.number,
                          customer: inv.supplier,
                          phone: inv.phone,
                          payment: inv.payment,
                          lines: inv.lines,
                          total: inv.total,
                          operationType: 'فاتورة شراء من المورد',
                          prevBalance: inv.prevBalance || 0,
                          newBalance: inv.newBalance || 0,
                          dateStr: inv.date,
                          timeStr: inv.time,
                        })
                      }
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-200 flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>إيصال الشراء والمشاركة</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="space-y-2.5">
          {suppliers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              لا يوجد موردون مسجلون حتى الآن. عند تأكيد فاتورة شراء سيتم حفظ المورد تلقائياً.
            </div>
          ) : (
            suppliers.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 shadow-xs border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-700" />
                    {s.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    الجوال: {s.phone || 'غير مسجل'}
                  </p>
                </div>

                <div className="text-left flex flex-col items-end gap-1.5">
                  <div>
                    <span className="text-[10px] text-slate-400 block">المستحق للمورد:</span>
                    <span
                      className={`font-black text-sm sm:text-base ${
                        s.balance > 0 ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatMoney(s.balance)} ر.ي
                    </span>
                  </div>

                  {s.phone && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          shareWhatsApp(
                            `*كشف حساب المورد: ${s.name}*\nالمبلغ المستحق لكم: ${formatMoney(s.balance)} ر.ي\nبقالة العزي للمواد الغذائية`,
                            s.phone
                          )
                        }
                        className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-200"
                        title="واتساب للمورد"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          sendSms(
                            s.phone,
                            `كشف حساب المورد ${s.name}: المبلغ المستحق لكم ${formatMoney(s.balance)} ر.ي - بقالة العزي`
                          )
                        }
                        className="p-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 border border-amber-200"
                        title="رسالة نصية SMS"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
