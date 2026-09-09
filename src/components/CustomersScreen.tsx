import React, { useState } from 'react';
import { CustomerRow } from '../types';
import { formatMoney } from '../services/nativeServices';
import { Users, UserPlus, Phone, Search, ChevronLeft, CreditCard } from 'lucide-react';

interface CustomersScreenProps {
  customers: CustomerRow[];
  onSelectCustomer: (c: CustomerRow) => void;
  onNewCustomer: () => void;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  customers,
  onSelectCustomer,
  onNewCustomer,
}) => {
  const [filter, setFilter] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.phone.includes(filter)
  );

  const totalDebt = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);

  return (
    <div className="space-y-3 p-3 max-w-2xl mx-auto pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            العملاء والحسابات
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            إجمالي الديون المستحقة: {formatMoney(totalDebt)} ر.ي
          </span>
        </div>

        <button
          type="button"
          onClick={onNewCustomer}
          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          إضافة عميل
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onFocus={(e) => e.target.select()}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          className="w-full pr-9 pl-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100 shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
      </div>

      {/* Customers List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          لا يوجد عملاء بعد. أضف عميلاً أو استورده من جهات الاتصال.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectCustomer(c)}
              className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 shadow-xs border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition group"
            >
              <div className="space-y-1">
                <div className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition">
                  {c.name}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.phone || 'بدون جوال'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div
                    className={`text-sm font-bold ${
                      c.balance > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {formatMoney(c.balance)} <span className="text-[11px] font-normal">ر.ي</span>
                  </div>
                  <div className="text-[10px] text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1 justify-end">
                    <CreditCard className="w-3 h-3" />
                    فتح كشف الحساب
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
