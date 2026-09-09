import React, { useState, useRef } from 'react';
import { StoreSettings } from '../types';
import { StorageService } from '../db/storage';
import {
  Settings,
  Moon,
  Sun,
  Store,
  Phone,
  Printer,
  X,
  Check,
  Download,
  Upload,
  HardDrive,
  FileCheck,
  AlertCircle,
} from 'lucide-react';

interface SettingsDialogProps {
  settings: StoreSettings;
  onSave: (newSettings: StoreSettings) => void;
  onOpenPrinter: () => void;
  onDatabaseReloaded?: () => void;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  settings,
  onSave,
  onOpenPrinter,
  onDatabaseReloaded,
  onClose,
}) => {
  const [storeName, setStoreName] = useState(settings.storeName);
  const [storePhone, setStorePhone] = useState(settings.storePhone);
  const [dark, setDark] = useState(settings.dark);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      storeName: storeName.trim() || 'بقالة العزي للمواد الغذائية',
      storePhone: storePhone.trim(),
      dark,
    });
  };

  const handleExportBackup = () => {
    try {
      StorageService.downloadBackupFile();
      setBackupMessage('تم حفظ ملف النسخة الاحتياطية للتطبيق بنجاح!');
      setTimeout(() => setBackupMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage('تعذر تصدير الملف: ' + err.message);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const isSuccess = StorageService.importDatabaseJson(content);
        if (isSuccess) {
          setBackupMessage('تمت استعادة كافة بيانات التطبيق من الملف بنجاح!');
          if (onDatabaseReloaded) {
            onDatabaseReloaded();
          }
          setTimeout(() => setBackupMessage(null), 4000);
        } else {
          setErrorMessage('فشل استيراد الملف: يرجى التأكد من أن الملف هو ملف نسخة احتياطية صالح للتطبيق بصيغة JSON.');
          setTimeout(() => setErrorMessage(null), 5000);
        }
      } catch (err: any) {
        setErrorMessage('خطأ أثناء قراءة الملف: ' + err.message);
        setTimeout(() => setErrorMessage(null), 5000);
      }
    };
    reader.readAsText(file);
    // Reset the input so same file can be re-selected if needed
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            إعدادات التطبيق وحفظ البيانات
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices */}
        {backupMessage && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{backupMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mx-4 mt-3 p-3 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 rounded-xl text-red-800 dark:text-red-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Store Info */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              اسم المتجر / البقالة
            </label>
            <div className="relative">
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="بقالة العزي للمواد الغذائية"
                required
                className="w-full pr-10 pl-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100 font-medium"
              />
              <Store className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              هاتف المتجر
            </label>
            <div className="relative">
              <input
                type="tel"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                placeholder="777000000"
                className="w-full pr-10 pl-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 dark:text-slate-100"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              {dark ? (
                <Moon className="w-4 h-4 text-amber-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                الوضع الداكن (Dark Mode)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDark(!dark)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                dark ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
            </button>
          </div>

          {/* File Storage & Backup Section */}
          <div className="p-3.5 bg-blue-50/50 dark:bg-slate-900/80 rounded-2xl border border-blue-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-950 dark:text-blue-200">
              <HardDrive className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              حفظ البيانات في ملف خاص بالتطبيق
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              يمكنك تصدير قاعدة بيانات التطبيق كاملة (الفواتير، فواتير الشراء، حسابات العملاء والموردين، المخزون) في ملف خاص (.json) وحفظها على جهازك، واستعادتها في أي وقت.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="py-2.5 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير ملف النسخة الاحتياطية</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>استعادة من ملف التطبيق</span>
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Thermal Printer Settings */}
          <div>
            <button
              type="button"
              onClick={onOpenPrinter}
              className="w-full py-2.5 px-3 rounded-2xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              إعدادات الطابعة الحرارية (58mm / Bluetooth)
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-1">
              متوافق مع طابعات الإيصالات المحمولة 58mm عبر البلوتوث والشبكة
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
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
              حفظ الإعدادات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
