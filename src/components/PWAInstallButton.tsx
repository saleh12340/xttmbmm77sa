import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { STORE_LOGO_URL } from '../assets/logo';
import { Download, CheckCircle2, Share2, X, Smartphone, ShieldCheck } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'dialog';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // If already running as an installed PWA
  if (isInstalled) {
    if (variant === 'dialog') {
      return (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
              التطبيق مثبت وموقع رسمياً على جهازك
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
              يعمل الآن كبرنامج مستقل بكامل صلاحيات التخزين وبدون الحاجة لمتصفح.
            </span>
          </div>
        </div>
      );
    }
    return (
      <button
        onClick={() => setShowInfoModal(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-2xs"
        title="التطبيق يعمل بوضع البرنامج المستقل"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden sm:inline">تطبيق رسمي</span>
      </button>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <>
        <button
          onClick={install}
          className={`flex items-center gap-1.5 rounded-xl font-bold transition shadow-xs ${
            variant === 'dialog'
              ? 'w-full py-2.5 px-3 bg-blue-700 hover:bg-blue-800 text-white text-xs justify-center'
              : 'px-2.5 py-1 text-[11px] bg-blue-700 hover:bg-blue-800 text-white'
          }`}
          title="تثبيت بقالة العزي كتطبيق رسمي على الشاشة الرئيسية"
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span>تثبيت التطبيق على الهاتف</span>
        </button>
      </>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-xl font-bold transition shadow-xs ${
            variant === 'dialog'
              ? 'w-full py-2.5 px-3 bg-blue-700 hover:bg-blue-800 text-white text-xs justify-center'
              : 'px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600'
          }`}
          title="تثبيت التطبيق على آيفون / آيباد"
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>تثبيت على آيفون</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-800 p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={STORE_LOGO_URL}
                    alt="بقالة العزي"
                    className="w-10 h-10 rounded-xl object-cover border border-emerald-500"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">تثبيت بقالة العزي</h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">على أجهزة iPhone و iPad</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                <p className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0">١</span>
                  <span>اضغط على زر المشاركة <Share2 className="w-3.5 h-3.5 inline text-blue-600" /> في شريط متصفح سفاري بالأسفل.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0">٢</span>
                  <span>مرر القائمة للأسفل واختر <strong>"إضافة إلى الصفحة الرئيسية" (Add to Home Screen)</strong>.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0">٣</span>
                  <span>اضغط <strong>"إضافة"</strong> وسيظهر التطبيق بأيقونته الرسمية كبرنامج مستقل على شاشة جوالك.</span>
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 transition"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for browsers before prompt fires
  return (
    <button
      onClick={() => setShowInfoModal(true)}
      className={`flex items-center gap-1.5 rounded-xl font-bold transition ${
        variant === 'dialog'
          ? 'w-full py-2.5 px-3 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs justify-center'
          : 'px-2 py-1 text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800'
      }`}
      title="تثبيت التطبيق على الشاشة الرئيسية"
    >
      <Smartphone className="w-3.5 h-3.5" />
      <span>تثبيت التطبيق</span>

      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-800 p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 text-right">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={STORE_LOGO_URL}
                  alt="شعار بقالة العزي"
                  className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-500"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">تثبيت التطبيق الرسمي للمتجر</h3>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">تطبيق ويب تقدمي PWA مستقل</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInfoModal(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                يمكنك تثبيت هذا التطبيق مباشرة على أي هاتف (أندرويد أو آيفون) أو جهاز لوحي ليتحول إلى <strong>تطبيق رسمي مستقل</strong> بأيقونة المتجر الخاصة، بدون شريط متصفح ويعمل حتى بدون اتصال بالإنترنت!
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">طريقة التثبيت:</div>
                <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-600 dark:text-slate-300">
                  <li><strong>على هواتف أندرويد (Chrome):</strong> اضغط على القائمة (الثلاث نقاط) بالأعلى ثم اختر <strong>"تثبيت التطبيق" (Install App)</strong> أو <strong>"الإضافة إلى الشاشة الرئيسية"</strong>.</li>
                  <li><strong>على هواتف آيفون (Safari):</strong> اضغط زر المشاركة بالأسفل ثم اختر <strong>"إضافة إلى الصفحة الرئيسية"</strong>.</li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowInfoModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </button>
  );
};
