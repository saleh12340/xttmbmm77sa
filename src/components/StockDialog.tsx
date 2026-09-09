import React, { useState } from 'react';
import { ItemRow } from '../types';
import { Package, X, Check, Plus, Minus, Edit3, Trash2, TrendingUp } from 'lucide-react';
import { formatMoney } from '../services/nativeServices';

interface StockDialogProps {
  item: ItemRow;
  onApply: (delta: number) => void;
  onUpdateItem?: (id: number, data: { name: string; price: number; cost?: number; stock?: number; minStock?: number }) => void;
  onDeleteItem?: (id: number) => void;
  onClose: () => void;
}

export const StockDialog: React.FC<StockDialogProps> = ({
  item,
  onApply,
  onUpdateItem,
  onDeleteItem,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'edit'>('stock');

  // Stock delta state
  const [value, setValue] = useState('');
  const [actionType, setActionType] = useState<'add' | 'sub'>('add');

  // Edit item state
  const [editName, setEditName] = useState(item.name);
  const [editPrice, setEditPrice] = useState(item.price.toString());
  const [editCost, setEditCost] = useState(item.cost ? item.cost.toString() : '');
  const [editMinStock, setEditMinStock] = useState(item.minStock.toString());
  const [editStock, setEditStock] = useState(item.stock.toString());

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      alert('يرجى كتابة كمية صحيحة');
      return;
    }
    const delta = actionType === 'add' ? num : -num;
    onApply(delta);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = editName.trim();
    const price = parseFloat(editPrice);
    const cost = editCost ? parseFloat(editCost) : undefined;
    const minStock = parseFloat(editMinStock) || 0;
    const stock = parseFloat(editStock) || 0;

    if (!cleanName || isNaN(price) || price <= 0) {
      alert('يرجى إدخال اسم صحيح وسعر بيع صحيح');
      return;
    }

    if (onUpdateItem) {
      onUpdateItem(item.id, {
        name: cleanName,
        price,
        cost,
        minStock,
        stock,
      });
    }
    onClose();
  };

  const priceNum = parseFloat(editPrice) || 0;
  const costNum = parseFloat(editCost) || 0;
  const profit = priceNum - costNum;
  const profitMarginPercent = costNum > 0 ? Math.round((profit / costNum) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span>إدارة الصنف: {item.name}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'stock'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>تعديل الكمية بالمخزون</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'edit'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>تعديل الأسعار والبيانات</span>
          </button>
        </div>

        {/* Tab 1: Fast Stock Adjust */}
        {activeTab === 'stock' && (
          <form onSubmit={handleStockSubmit} className="p-4 space-y-3">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">المخزون الحالي:</span>
                <span className="text-base font-extrabold text-blue-700 dark:text-blue-400">
                  {formatMoney(item.stock)} قطعة
                </span>
              </div>
              <div className="text-left">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">سعر البيع:</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {formatMoney(item.price)} ر.ي
                </span>
              </div>
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
                الكمية المراد {actionType === 'add' ? 'إضافتها' : 'خصمها'}
              </label>
              <input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                step="any"
                min="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                placeholder="مثال: 5 أو 10"
                autoFocus
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100 font-bold"
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
        )}

        {/* Tab 2: Edit Item Details, Selling Price & Purchase Cost */}
        {activeTab === 'edit' && (
          <form onSubmit={handleEditSubmit} className="p-4 space-y-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                اسم الصنف
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                required
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Purchase Cost */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  سعر الشراء / التكلفة (ر.ي)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  step="any"
                  min="0"
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  placeholder="سعر الشراء"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  سعر البيع (ر.ي) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  step="any"
                  min="1"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  placeholder="سعر البيع"
                  required
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-blue-700 dark:text-blue-400 font-bold"
                />
              </div>
            </div>

            {/* Profit margin live calculation */}
            {costNum > 0 && priceNum > 0 && (
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  الربح المتوقع بالقطعة:
                </span>
                <span>
                  +{formatMoney(profit)} ر.ي ({profitMarginPercent}%)
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  المخزون الحالي
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  step="any"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  حد التنبيه الأدنى
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  step="any"
                  value={editMinStock}
                  onChange={(e) => setEditMinStock(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
              {onDeleteItem && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`هل أنت متأكد من حذف الصنف "${item.name}" من المخزون؟`)) {
                      onDeleteItem(item.id);
                      onClose();
                    }
                  }}
                  className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الصنف</span>
                </button>
              )}

              <div className="flex items-center gap-2 mr-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  حفظ البيانات
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
