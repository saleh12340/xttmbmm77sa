import React, { useState } from 'react';
import { CustomerRow } from '../types';
import { User, Phone, Contact, X, Check, Search } from 'lucide-react';

interface CustomerDialogProps {
  list: CustomerRow[];
  current: string;
  currentPhone: string;
  onSave: (name: string, phone: string) => void;
  onClose: () => void;
}

export const CustomerDialog: React.FC<CustomerDialogProps> = ({
  list,
  current,
  currentPhone,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(current === 'عميل نقدي' ? '' : current);
  const [phone, setPhone] = useState(currentPhone);
  const [filter, setFilter] = useState('');

  const filteredList = list.filter(
    (c) =>
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.phone.includes(filter)
  );

  const handlePickContact = async () => {
    // If browser supports Contact Picker API
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const contacts = await (navigator as any).contacts.select(props, { multiple: false });
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          if (contact.name && contact.name.length > 0) {
            setName(contact.name[0]);
          }
          if (contact.tel && contact.tel.length > 0) {
            setPhone(contact.tel[0].replace(/\s+/g, ''));
          }
        }
      } catch {
        // Ignored or unsupported
      }
    }
  };

  const handleSave = () => {
    const clean = name.trim();
    if (!clean) {
      alert('يرجى كتابة اسم العميل');
      return;
    }
    onSave(clean, phone.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
            <User className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            {current && current !== 'عميل نقدي' ? 'تعديل أو اختيار العميل' : 'إضافة أو اختيار عميل'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {/* Quick contact picker button */}
          <button
            type="button"
            onClick={handlePickContact}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition"
          >
            <Contact className="w-4 h-4 text-blue-600" />
            اختيار من جهات الاتصال
          </button>

          {/* Form fields */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              اسم العميل <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                placeholder="أدخل اسم العميل (مثلاً: محمد القاسمي)"
                className="w-full pr-10 pl-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              رقم الجوال / واتساب
            </label>
            <div className="relative">
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                placeholder="مثلاً: 777123456"
                className="w-full pr-10 pl-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Saved customers list */}
          {list.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  العملاء المحفوظون ({list.length})
                </span>
                <div className="relative w-36">
                  <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    placeholder="بحث..."
                    className="w-full pr-6 pl-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                  <Search className="w-3 h-3 text-slate-400 absolute right-2 top-1.5" />
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1 divide-y divide-slate-50 dark:divide-slate-700/50">
                {filteredList.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setName(c.name);
                      setPhone(c.phone);
                    }}
                    className="w-full text-right py-1.5 px-2 hover:bg-blue-50 dark:hover:bg-slate-700/60 rounded-lg flex items-center justify-between group transition"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {c.phone || 'بدون جوال'}
                      </div>
                    </div>
                    {c.balance > 0 && (
                      <span className="text-[10px] text-red-600 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded-full font-medium">
                        دين: {c.balance} ر.ي
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-1.5 transition"
          >
            <Check className="w-4 h-4" />
            حفظ واختيار العميل
          </button>
        </div>
      </div>
    </div>
  );
};
