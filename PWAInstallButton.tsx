import React, { useState } from 'react';
import { Download, Smartphone, X, Laptop, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'badge' | 'button' }> = ({ variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already running inside standalone PWA window, show installed badge
  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-xl text-[11px] font-bold">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>مثبت كتطبيق رسمي</span>
      </span>
    );
  }

  // Click handler
  const handleClick = () => {
    if (isInstallable) {
      install();
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 border border-amber-300 transition-all hover:scale-105 active:scale-95 animate-pulse shrink-0"
        title="تثبيت معامل RT كتطبيق على سطح المكتب أو شاشة الموبايل"
      >
        <Download className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
        <span>تثبيت البرنامج (PWA)</span>
      </button>

      {/* Guide Dialog when opened on browsers where direct prompt requires a click or instructions */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">تثبيت برنامج معامل RT</h3>
                  <p className="text-[11px] text-slate-500">ليعمل كبرنامج مستقل على شاشة جهازك بدون متصفح</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 font-medium">
                ⚡ <strong>برنامج معامل RT يدعم تقنية (PWA):</strong> يمكنك تثبيته ليفتح مباشرة من أيقونة سطح المكتب أو شاشة الموبايل الرئيسية كأي تطبيق احترافي.
              </div>

              {/* Desktop Chrome / Edge */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <strong className="text-slate-900 block mb-1 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-blue-900" />
                  <span>على الكمبيوتر أو اللابتوب (Chrome أو Edge):</span>
                </strong>
                <p className="text-slate-600">
                  1. انظر إلى <strong>أقصى يمين شريط العنوان (URL bar)</strong> في المتصفح بالأعلى.
                  <br />
                  2. ستجد أيقونة تثبيت صغيرة <strong>(⊕ أو شاشة مع سهم لأسفل)</strong>.
                  <br />
                  3. اضغط عليها واختر <strong>«Install / تثبيت»</strong>، وستجد أيقونة المعمل ظهرت على سطح مكتبك فوراً!
                </p>
              </div>

              {/* Mobile Phone */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <strong className="text-slate-900 block mb-1 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-rose-900" />
                  <span>على الهاتف المحمول (Android أو iPhone):</span>
                </strong>
                <p className="text-slate-600">
                  * <strong>أندرويد (Chrome):</strong> اضغط على القائمة (الثلاث نقاط ⋮) في أعلى المتصفح، ثم اختر <strong>«تثبيت التطبيق / Install App»</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.
                  <br />
                  * <strong>آيفون (Safari):</strong> اضغط على زر المشاركة <strong>(Share ⎋)</strong> أسفل الشاشة، ثم اختر <strong>«إضافة إلى الصفحة الرئيسية (Add to Home Screen)»</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-rose-900 to-blue-900 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-950/20 hover:opacity-95"
            >
              فهمت، شكراً لك
            </button>
          </div>
        </div>
      )}
    </>
  );
};
