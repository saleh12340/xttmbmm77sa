import React, { useState } from 'react';
import { ItemRow } from '../types';
import { Package, X, Check, Plus, Minus } from 'lucide-react';
import { formatMoney } from '../services/nativeServices';

interface StockDialogProps {
  item: ItemRow;
  onApply: (delta: number) => void;
  onClose: () => void;
}

export const StockDialog: React.FC<StockDialogProps> = ({ item, onApply, onClose }) => {
  const [value, setValue] = useState('');
  const [actionType, setActionType] = useState<'add' | 'sub'>('add');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      alert('يرجى كتابة كمية صحيحة');
      return;
    }
    const delta = actionType === 'add' ? num : -num;
    onApply(delta);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            تعديل مخزون: {item.name}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs text-slate-600 dark:text-slate-400">المخزون الحالي:</span>
            <span className="text-base font-bold text-blue-700 dark:text-blue-400">
              {formatMoney(item.stock)}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActionType('add')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition ${
                actionType === 'add'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              إضافة للمخزون (+)
            </button>
            <button
              type="button"
              onClick={() => setActionType('sub')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition ${
                actionType === 'sub'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Minus className="w-4 h-4" />
              خصم من المخزون (-)
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              الكمية المطلوبة
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="مثال: 5 أو 10"
              autoFocus
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-4 h-4" />
              تطبيق التعديل
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
