import React, { useState } from 'react';
import { Printer, Bluetooth, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { renderReceiptCanvas, printCanvasReceipt } from '../services/nativeServices';

interface PrinterDialogProps {
  storeName: string;
  onClose: () => void;
}

export const PrinterDialog: React.FC<PrinterDialogProps> = ({ storeName, onClose }) => {
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleConnectBluetooth = async () => {
    if (!('bluetooth' in navigator)) {
      setStatus('متصفحك لا يدعم Web Bluetooth، يمكنك استخدام خيار الطباعة المباشرة.');
      return;
    }

    try {
      setLoading(true);
      setStatus('جارٍ البحث عن طابعات Bluetooth القريبة...');
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '00001101-0000-1000-8000-00805f9b34fb'],
      });

      if (device) {
        setConnectedDevice(device.name || 'طابعة حرارية');
        setStatus(`تم الاتصال بالطابعة: ${device.name || 'طابعة Bluetooth'}`);
      }
    } catch (err: any) {
      setStatus('لم يتم اختيار جهاز أو تم إلغاء البحث.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestPrint = () => {
    const canvas = renderReceiptCanvas(
      9999,
      storeName,
      'عميل تجريبي',
      [
        { name: 'صنف تجريبي 1', qty: 1, unit: 500, total: 500 },
        { name: 'صنف تجريبي 2', qty: 2, unit: 250, total: 500 },
      ],
      1000,
      'نقدي'
    );
    printCanvasReceipt(canvas);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            طابعة الفواتير الحرارية (58mm)
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-blue-50 dark:bg-slate-900/60 p-3 rounded-xl border border-blue-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-blue-900 dark:text-blue-300">
              مواصفات الطباعة المدعومة:
            </p>
            <p>• العرض: 58 ملم (عرض الورق القياسي 384 نقطة)</p>
            <p>• بروتوكول: ESC/POS المباشر أو نافذة الطباعة السريعة للنظام</p>
          </div>

          {connectedDevice ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                  متصل: {connectedDevice}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  جاهزة للطباعة الفورية
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500">
                لم يتم إقران طابعة Bluetooth حالياً، سيتم استخدام الطباعة التلقائية للنظام.
              </span>
            </div>
          )}

          {status && (
            <p className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-slate-900/30 p-2 rounded-lg text-center">
              {status}
            </p>
          )}

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleConnectBluetooth}
              disabled={loading}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Bluetooth className="w-4 h-4 text-blue-600" />
              {loading ? 'جارٍ البحث...' : 'اقتران بطابعة Bluetooth جديدة'}
            </button>

            <button
              type="button"
              onClick={handleTestPrint}
              className="w-full py-2 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs"
            >
              <Printer className="w-4 h-4" />
              طباعة إيصال تجريبي 58mm
            </button>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
