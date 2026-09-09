import React from 'react';
import { CustomerRow, InvoiceRow, ItemRow } from '../types';
import { formatMoney, today } from '../services/nativeServices';
import {
  TrendingUp,
  Wallet,
  AlertTriangle,
  Receipt,
  Store,
  CreditCard,
  Banknote,
  BarChart3,
} from 'lucide-react';

interface ReportsScreenProps {
  invoices: InvoiceRow[];
  customers: CustomerRow[];
  inventory: ItemRow[];
  storeName: string;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  invoices,
  customers,
  inventory,
  storeName,
}) => {
  const todayStr = today();
  const todayInvoices = invoices.filter((inv) => inv.date === todayStr);
  const todayTotal = todayInvoices.reduce((sum, inv) => sum + inv.total, 0);

  const todayCash = todayInvoices
    .filter((inv) => inv.payment === 'نقدي' || !inv.payment.includes('آجل'))
    .reduce((sum, inv) => sum + inv.total, 0);

  const todayCredit = todayInvoices
    .filter((inv) => inv.payment.includes('آجل') || inv.payment.includes('دين'))
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalDebt = customers.reduce(
    (sum, c) => sum + (c.balance > 0 ? c.balance : 0),
    0
  );

  const lowStockItems = inventory.filter(
    (item) => item.minStock > 0 && item.stock <= item.minStock
  );

  return (
    <div className="space-y-4 p-3 max-w-2xl mx-auto pb-24">
      {/* Store Title */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            {storeName}
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            لوحة التقارير والمؤشرات المالية
          </span>
        </div>
        <div className="p-2 bg-blue-50 dark:bg-slate-700/60 rounded-xl text-blue-700 dark:text-blue-400">
          <BarChart3 className="w-5 h-5" />
        </div>
      </div>

      {/* Primary Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Today's Sales */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
              مبيعات اليوم ({todayStr})
            </span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {formatMoney(todayTotal)} <span className="text-xs font-normal">ر.ي</span>
            </span>
          </div>
        </div>

        {/* Customer Total Debt */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
              إجمالي ديون العملاء
            </span>
            <span className="text-xl font-extrabold text-red-600 dark:text-red-400">
              {formatMoney(totalDebt)} <span className="text-xs font-normal">ر.ي</span>
            </span>
          </div>
        </div>

        {/* Low stock count */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
              الأصناف منخفضة المخزون
            </span>
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              {lowStockItems.length} <span className="text-xs font-normal">صنف</span>
            </span>
          </div>
        </div>

        {/* Invoices Count */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
              عدد الفواتير الكلي
            </span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {invoices.length} <span className="text-xs font-normal">فاتورة</span>
            </span>
          </div>
        </div>
      </div>

      {/* Today Breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xs border border-slate-200/80 dark:border-slate-700/80 space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          تفاصيل مبيعات اليوم
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              <Banknote className="w-4 h-4 text-emerald-600" />
              المبيعات النقدية
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatMoney(todayCash)} ر.ي
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              <CreditCard className="w-4 h-4 text-amber-600" />
              المبيعات الآجلة (دين)
            </div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {formatMoney(todayCredit)} ر.ي
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Items Warning Table */}
      {lowStockItems.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xs border border-amber-200 dark:border-amber-900/50 space-y-2">
          <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            تنبيه: أصناف تحتاج توريد سريع
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
            {lowStockItems.map((item) => (
              <div key={item.id} className="py-2 flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {item.name}
                </span>
                <div className="text-left">
                  <span className="text-red-600 dark:text-red-400 font-bold">
                    المتبقي: {item.stock}
                  </span>
                  <span className="text-slate-400 text-[11px] block">
                    الحد الأدنى: {item.minStock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
