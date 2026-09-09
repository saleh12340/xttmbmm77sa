import React, { useState } from 'react';
import { ItemRow } from '../types';
import { formatMoney } from '../services/nativeServices';
import { StockDialog } from './StockDialog';
import {
  Package,
  AlertTriangle,
  Search,
  Plus,
  Layers,
  Edit3,
  X,
  Check,
  TrendingUp,
  DollarSign,
  Tag,
} from 'lucide-react';

interface InventoryScreenProps {
  inventory: ItemRow[];
  onAdjustStock: (itemId: number, delta: number) => void;
  onAddItem: (name: string, price: number, stock: number, minStock: number, cost?: number) => void;
  onUpdateItem?: (id: number, data: { name: string; price: number; cost?: number; stock?: number; minStock?: number }) => void;
  onDeleteItem?: (id: number) => void;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  inventory,
  onAdjustStock,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) => {
  const [filter, setFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<ItemRow | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New item form state: Both Selling Price and Purchase Cost!
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('0');
  const [newMinStock, setNewMinStock] = useState('5');

  const filtered = inventory.filter((item) =>
    item.name.toLowerCase().includes(filter.toLowerCase())
  );

  const costVal = parseFloat(newCost) || 0;
  const priceVal = parseFloat(newPrice) || 0;
  const estimatedProfit = priceVal - costVal;
  const profitMargin = costVal > 0 ? Math.round((estimatedProfit / costVal) * 100) : 0;

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newName.trim();
    const price = parseFloat(newPrice);
    const cost = newCost ? parseFloat(newCost) : undefined;
    const stock = parseFloat(newStock) || 0;
    const minStock = parseFloat(newMinStock) || 0;

    if (!cleanName || isNaN(price) || price <= 0) {
      alert('يرجى كتابة اسم الصنف وتحديد سعر بيع صحيح');
      return;
    }

    onAddItem(cleanName, price, stock, minStock, cost);
    setNewName('');
    setNewCost('');
    setNewPrice('');
    setNewStock('0');
    setNewMinStock('5');
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-3 p-3 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <span>الأصناف والمخزون</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {inventory.length} صنف مسجل • إدارة أسعار الشراء والبيع والكميات
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          إضافة صنف جديد
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onFocus={(e) => e.target.select()}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          placeholder="ابحث باسم الصنف..."
          className="w-full pr-9 pl-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100 shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
      </div>

      {/* Inventory Items List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          لا توجد أصناف مطابقة للبحث
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const isLow = item.minStock > 0 && item.stock <= item.minStock;
            const cost = item.cost !== undefined ? item.cost : Math.round(item.price * 0.8);
            const profit = item.price - cost;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-xs border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition group space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                      <span>{item.name}</span>
                    </div>

                    {/* Prices: Both Selling Price and Purchase Cost */}
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                      <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-900">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">سعر البيع:</span>
                        <span className="font-extrabold text-blue-700 dark:text-blue-300">
                          {formatMoney(item.price)} ر.ي
                        </span>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-lg">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">سعر الشراء:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {formatMoney(cost)} ر.ي
                        </span>
                      </div>

                      {/* Profit tag */}
                      <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-lg font-bold text-[11px]">
                        <TrendingUp className="w-3 h-3" />
                        <span>الربح: +{formatMoney(profit)} ر.ي</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Level and actions */}
                  <div className="text-left flex flex-col items-end gap-1">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>المخزون: {formatMoney(item.stock)}</span>
                    </div>

                    {isLow && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold flex items-center gap-1 border border-red-200 dark:border-red-900">
                        <AlertTriangle className="w-3 h-3" />
                        منخفض (الحد: {item.minStock})
                      </span>
                    )}

                    <span className="text-[10px] text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-0.5">
                      <Edit3 className="w-3 h-3" />
                      تعديل السعر والمخزون
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stock Adjustment & Edit Dialog */}
      {selectedItem && (
        <StockDialog
          item={selectedItem}
          onApply={(delta) => {
            onAdjustStock(selectedItem.id, delta);
            setSelectedItem(null);
          }}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Add Item Modal: Allows entering both Purchase Cost and Selling Price */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                إضافة صنف جديد (سعر الشراء والبيع)
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="p-4 space-y-3">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  اسم الصنف <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  placeholder="مثلاً: زيت زيتون 500 مل"
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Purchase Cost & Selling Price Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    سعر الشراء / التكلفة (ر.ي)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    step="any"
                    min="0"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    placeholder="مثلاً: 1000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    سعر البيع (ر.ي) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    step="any"
                    min="1"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    placeholder="مثلاً: 1250"
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-blue-700 dark:text-blue-300 font-bold"
                  />
                </div>
              </div>

              {/* Profit margin estimation preview */}
              {costVal > 0 && priceVal > 0 && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    الربح المتوقع بالقطعة:
                  </span>
                  <span>
                    +{formatMoney(estimatedProfit)} ر.ي ({profitMargin}%)
                  </span>
                </div>
              )}

              {/* Stock & Min Stock with numeric keypad */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الكمية الابتدائية بالمخزون
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    step="any"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    حد التنبيه الأدنى
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    step="any"
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    placeholder="5"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  حفظ الصنف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
