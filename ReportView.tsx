import React, { useRef, useState } from 'react';
import { 
  Printer, 
  Share2, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3,
  Award,
  Phone,
  MapPin,
  Mail,
  UserCheck,
  Stethoscope,
  MessageSquare,
  FileDown,
  Presentation
} from 'lucide-react';
import { LabOrder, LabSettings, LabTest, StaffMember } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import { QRCodeRenderer } from './QRCodeRenderer';
import { exportPptx, logoUrl, saveElementsAsPdf, sendPdfViaWhatsApp } from '../lib/exporters';


const parseRange = (ref: string, dMin?: number, dMax?: number): [number, number] | null => {
  const t = (ref || '').trim();
  if (t.startsWith('<')) {
    const m = t.match(/(\d+(?:\.\d+)?)/);
    if (m) return [0, parseFloat(m[1])];
  }
  if (t.startsWith('>')) {
    const m = t.match(/(\d+(?:\.\d+)?)/);
    if (m) { const v = parseFloat(m[1]); return [v, v * 2]; }
  }
  const r = t.match(/(-?\d+(?:\.\d+)?)\s*[-–]\s*(-?\d+(?:\.\d+)?)/);
  if (r) return [parseFloat(r[1]), parseFloat(r[2])];
  if (dMin !== undefined && dMax !== undefined && dMax > dMin) return [dMin, dMax];
  return null;
};

// Flat coloured chart: blue = below range, green = normal, red = above range
const RangeBar: React.FC<{ value: string; refRange: string; dMin?: number; dMax?: number; flag: string }> = ({ value, refRange, dMin, dMax, flag }) => {
  const abnormal = flag === 'HIGH' || flag === 'LOW' || flag === 'PANIC' || flag === 'POSITIVE';
  const num = parseFloat(String(value).replace(/[^\d.\-]/g, ''));
  const range = parseRange(refRange, dMin, dMax);

  if (!isFinite(num) || !range) {
    if (!value || value === '---') return null;
    return (
      <span
        style={{ background: abnormal ? '#dc2626' : '#16a34a', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties}
        className="inline-block text-[10px] font-black text-white px-2.5 py-0.5 rounded-sm tracking-wide"
      >
        {abnormal ? 'ABNORMAL' : 'NORMAL'}
      </span>
    );
  }

  const [min, max] = range;
  const span = Math.max(max - min, 1e-9);
  const lo = min - span * 0.75;
  const total = span * 2.5;
  const pct = (x: number) => Math.min(100, Math.max(0, ((x - lo) / total) * 100));
  const left = pct(min);
  const right = pct(max);
  const pos = pct(num);
  const isOut = num < min || num > max || abnormal;
  const pa = { printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties;

  return (
    <div style={{ position: 'relative', width: '100%', minWidth: 90, height: 16 }} title={isOut ? 'Abnormal' : 'Normal'}>
      <div style={{ ...pa, position: 'absolute', top: 5, left: 0, width: `${left}%`, height: 6, background: '#60a5fa' }} />
      <div style={{ ...pa, position: 'absolute', top: 5, left: `${left}%`, width: `${right - left}%`, height: 6, background: '#22c55e' }} />
      <div style={{ ...pa, position: 'absolute', top: 5, left: `${right}%`, width: `${100 - right}%`, height: 6, background: '#ef4444' }} />
      <div style={{ ...pa, position: 'absolute', top: 0, left: `calc(${pos}% - 2px)`, width: 4, height: 16, background: isOut ? '#7f1d1d' : '#14532d', borderRadius: 1 }} />
    </div>
  );
};

interface ReportViewProps {
  order: LabOrder;
  allOrders: LabOrder[];
  allTests: LabTest[];
  settings: LabSettings;
  staff?: StaffMember[];
  onSelectOrder: (orderId: string) => void;
  onEditOrder: (order: LabOrder) => void;
  onBackToLis: () => void;
  onUpdateOrderComments?: (orderId: string, testComments: Record<string, string>, generalRemark: string) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  order,
  allOrders,
  allTests,
  settings,
  staff = [],
  onSelectOrder,
  onEditOrder,
  onBackToLis
}) => {
  // Specialist & Director selection state
  const staffSpecialists = staff.filter(x => x.role === 'lab_specialist');
  const staffOthers = staff.filter(x => x.role !== 'lab_specialist');

  const [selectedSpecialist, setSelectedSpecialist] = useState<string>(() => {
    const byName = staff.find(x => x.name === order.technicianName);
    return byName?.id || staffSpecialists[0]?.id || '';
  });
  const specialistObj = staff.find(x => x.id === selectedSpecialist);

  const [selectedDirector, setSelectedDirector] = useState<'none' | 'rehab' | 'ramy' | 'both'>('rehab');
  const [sealColor, setSealColor] = useState<'blue' | 'black'>('blue');
  const [separatePages, setSeparatePages] = useState<boolean>(true);
  const sheetsRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string>('');
  const ringColor = sealColor === 'black' ? '#111827' : '#1e3a8a';

  // Test-specific comments editing state
  const [testComments, setTestComments] = useState<Record<string, string>>(() => {
    return order.testComments || {};
  });
  const [generalComment, setGeneralComment] = useState<string>(() => {
    return order.clinicalRemarks || 'النتائج المخبرية أعلاه تتوافق مع البروتوكولات التشخيصية المعتمدة. يرجى المتابعة السريرية مع الطبيب المعالج.';
  });
  const [isEditingComments, setIsEditingComments] = useState<boolean>(false);

  // Default suggested comments based on test category if none provided
  const getDefaultTestComment = (test: LabTest): string => {
    if (testComments[test.id]) return testComments[test.id];

    switch (test.category) {
      case 'hematology':
        return 'TLC & CBC Indices within standard reference intervals. Normocytic normochromic blood picture.';
      case 'lipids':
        return 'Lipid profile evaluated via Friedewald equation. Desirable target cardiovascular risk index.';
      case 'diabetes':
        return 'Glycemic control monitored via HbA1c & Fasting Glucose. Correlate with clinical history.';
      case 'liver':
        return 'Hepatic enzymes ALT & AST within physiological range. Normal excretory liver function.';
      case 'kidney':
        return 'Renal parameters & estimated GFR indicate adequate glomerular filtration efficiency.';
      case 'thyroid':
        return 'Euthyroid biochemical profile with balanced TSH and peripheral free thyroid hormones.';
      case 'urine':
        return 'Urinalysis indicates absence of significant microscopic sediment, casts or pathological proteinuria.';
      case 'stool':
        return 'Stool examination negative for protozoal cysts, ova of parasites, or occult bleeding.';
      case 'coagulation':
        return 'Coagulation profile PT & INR within targeted therapeutic safety window.';
      default:
        return 'All investigation parameters validated and correlated with standard biological limits.';
    }
  };

  // Group results by test
  const testResultsGrouped = order.testIds.map(testId => {
    const test = allTests.find(t => t.id === testId);
    if (!test) return null;

    const paramsWithResults = test.parameters.map(param => {
      const res = order.results[param.id] || {
        paramId: param.id,
        testId: test.id,
        paramNameEn: param.nameEn,
        paramNameAr: param.nameAr,
        value: '---',
        unit: param.unit,
        refRange: param.refText || `${param.defaultRefMin ?? ''} - ${param.defaultRefMax ?? ''}`,
        flag: 'NORMAL' as const
      };

      // Determine appropriate ref range for patient gender
      let displayRef = res.refRange;
      if (order.patientGender === 'male' && param.refMale) {
        displayRef = param.refMale;
      } else if (order.patientGender === 'female' && param.refFemale) {
        displayRef = param.refFemale;
      }

      return {
        definition: param,
        result: { ...res, refRange: displayRef }
      };
    });

    return {
      test,
      params: paramsWithResults
    };
  }).filter(Boolean);

  const handlePrint = () => {
    window.print();
  };

  const getSheets = (): HTMLElement[] =>
    Array.from(sheetsRef.current?.querySelectorAll<HTMLElement>('.print-page') || []);

  const fileBase = `RT-LAB-${(order.patientName || 'report').replace(/[^\w\u0600-\u06FF]+/g, '_')}-${order.sampleBarcode}`;

  const handlePdf = async () => {
    setBusy('pdf');
    try {
      await saveElementsAsPdf(getSheets(), fileBase);
    } catch (e) {
      console.error(e);
      alert('تعذر إنشاء ملف PDF. جرّب زر الطباعة ثم "حفظ كـ PDF".');
    }
    setBusy('');
  };

  const handlePptx = async () => {
    setBusy('pptx');
    try {
      const slides = testResultsGrouped.filter(Boolean).map(g => {
        const { test, params } = g!;
        return {
          title: `${test.nameEn} - ${test.nameAr}`,
          subtitle: `${order.patientName} | ${order.patientAge} سنة | ${order.patientGender === 'male' ? 'ذكر' : 'أنثى'} | كود العينة ${order.sampleBarcode}`,
          lines: [`الطبيب المعالج: ${order.referringDoctor || '-'}`, `تاريخ السحب: ${order.sampleCollectionDate || '-'}`],
          table: {
            headers: ['Investigation', 'Result', 'Flag', 'Unit', 'Reference Range'],
            rows: params.map(({ definition, result }) => [
              definition.nameEn,
              String(result.value),
              result.flag === 'NORMAL' ? 'Normal' : result.flag,
              result.unit || '-',
              result.refRange,
            ]),
          },
        };
      });
      await exportPptx(fileBase, `RT LAB - ${order.patientName}`, slides);
    } catch (e) {
      console.error(e);
      alert('تعذر إنشاء ملف PowerPoint.');
    }
    setBusy('');
  };

  const handleWhatsAppShare = async () => {
    const testsSummary = order.testIds.map(tid => {
      const t = allTests.find(x => x.id === tid);
      return t ? t.code.split('-')[0] : tid;
    }).join(', ');

    const message =
      `مرحباً بكم في معامل RT LAB للتحاليل التشخيصية - معامل رامي مختار 🔬\n` +
      `يسرنا إبلاغكم بصدور واعتماد تقرير التحاليل الطبية الرسمي الخاص بكم:\n\n` +
      `👤 المريض: ${order.patientName}\n` +
      `🧪 الفحوصات: ${testsSummary}\n` +
      `🔖 كود العينة: ${order.sampleBarcode}\n` +
      `📅 تاريخ الاعتماد: ${order.reportReleaseDate || 'اليوم'}\n` +
      `📍 ميدان بهتيم برج صيدلية العزبي الدور الثالث شبرا الخيمة\n` +
      `📞 01100874444 - 01100046841 - 01013242777\n\n` +
      `نتمنى لكم دوام الصحة والعافية.`;

    setBusy('wa');
    try {
      await sendPdfViaWhatsApp({ elements: getSheets(), filename: fileBase, phone: order.patientPhone, message });
    } catch (e) {
      console.error(e);
      window.open(`https://wa.me/${order.patientPhone.replace(/\D/g, '').replace(/^0/, '20')}?text=${encodeURIComponent(message)}`, '_blank');
    }
    setBusy('');
  };

  const verificationUrl = `${window.location.origin}${import.meta.env.BASE_URL}#verify/${order.sampleBarcode}`;

  const renderSheet = (groups: typeof testResultsGrouped, sheetIdx: number) => (
    <div key={sheetIdx} className="print-page max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-300 overflow-hidden text-slate-900 transition-all font-sans">
        
        {/* Lab Header (Dark Crimson & Deep Blue Identity) */}
        <div className="p-6 border-b-4 border-rose-900 bg-gradient-to-r from-slate-50 via-white to-blue-50/50 relative">
          <div className="flex items-start justify-between gap-4">
            
            {/* Right Side: Lab Brand & Identification */}
            <div className="flex items-center gap-4">
              {/* Brand Logo (official) */}
              <img
                src={logoUrl()}
                alt="RT LABS"
                crossOrigin="anonymous"
                style={{ width: 84, height: 84, borderRadius: 16, background: '#000', objectFit: 'contain', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties}
                className="shrink-0"
              />

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                    معامل <span className="text-rose-900">RT LAB</span> للتحاليل التشخيصية
                  </h1>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-black bg-blue-950 text-white px-2.5 py-0.5 rounded-md shadow-2xs">
                    معامل رامي مختار
                  </span>
                  <span className="text-xs font-bold text-blue-900 font-sans tracking-wide">
                    RT LAB Diagnostic Laboratories
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-bold mt-1.5 flex items-center gap-2">
                  <span>الفرع الرئيسي:</span>
                  <strong className="text-slate-900">ميدان بهتيم برج صيدلية العزبي الدور الثالث شبرا الخيمة</strong>
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-700 font-mono font-bold mt-0.5">
                  <span className="text-rose-900">هواتف المعمل:</span>
                  <span>01100874444</span>
                  <span>•</span>
                  <span>01100046841</span>
                  <span>•</span>
                  <span>01013242777</span>
                </div>
              </div>
            </div>

            {/* Left Side: Barcode & QR Code */}
            <div className="flex items-center gap-3 text-left shrink-0">
              <div className="flex flex-col items-end">
                <BarcodeRenderer value={order.sampleBarcode} width={140} height={38} />
                <span className="text-[10px] text-slate-600 font-mono font-bold mt-0.5">SAMPLE: {order.sampleBarcode}</span>
                <span className="text-[9px] text-slate-500 font-mono">ORDER: {order.orderNumber}</span>
              </div>
              <QRCodeRenderer value={verificationUrl} size={64} />
            </div>
          </div>
        </div>

        {/* Patient Demographics Box (Clean Medical Summary) */}
        <div className="p-4 bg-slate-50/95 border-b border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2.5 gap-x-4 text-xs">
            <div>
              <span className="text-slate-600 block text-[11px] font-bold">اسم المريض / Patient Name</span>
              <span className="font-black text-slate-950 text-xl leading-snug block mt-0.5" style={{ letterSpacing: 0 }}>{order.patientName}</span>
            </div>
            <div>
              <span className="text-slate-600 block text-[11px] font-bold">السن والنوع / Age & Gender</span>
              <span className="font-bold text-slate-800 block mt-0.5">
                {order.patientAge} سنة / {order.patientGender === 'male' ? 'ذكر (Male)' : 'أنثى (Female)'}
              </span>
            </div>
            <div>
              <span className="text-slate-600 block text-[11px] font-bold">الطبيب المعالج / Ref. Doctor</span>
              <span className="font-extrabold text-slate-950 text-base leading-snug block mt-0.5">{order.referringDoctor || 'طبيبي الخاص / استشاري'}</span>
            </div>
            <div>
              <span className="text-slate-600 block text-[11px] font-bold">رقم الهاتف / Phone</span>
              <span className="font-mono font-bold text-slate-800 block mt-0.5">{order.patientPhone}</span>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-600 block text-[11px] font-bold">تاريخ وساعة السحب / Collection</span>
              <span className="font-semibold text-slate-700 block mt-0.5">{order.sampleCollectionDate}</span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-600 block text-[11px] font-bold">تاريخ الاعتماد / Release Date</span>
              <span className="font-bold text-rose-950 block mt-0.5">{order.reportReleaseDate || 'اليوم'}</span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-600 block text-[11px] font-bold">الفرع / Branch</span>
              <span className="font-bold text-slate-800 block mt-0.5">الفرع الرئيسي (شبرا الخيمة)</span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-600 block text-[11px] font-bold">حالة الاعتماد / Status</span>
              <span className={`inline-flex items-center gap-1 font-black text-[10px] px-2 py-0.5 rounded-full ${
                order.overallStatus === 'released' 
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                <CheckCircle2 className="w-3 h-3" />
                {order.overallStatus === 'released' ? 'معتمد رسمياً (Official Released)' : 'مسودة قيد المراجعة'}
              </span>
            </div>
          </div>
        </div>

        {/* Results Body: Strict LTR Layout from Left to Right */}
        <div className="p-6">
          {groups.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">
              لا توجد فحوصات مدرجة في هذا الطلب
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => {
                if (!group) return null;
                const { test, params } = group;
                const commentText = testComments[test.id] !== undefined ? testComments[test.id] : getDefaultTestComment(test);

                return (
                  <div key={test.id} className="border border-slate-300 rounded-2xl overflow-hidden shadow-2xs">
                    {/* Test Group Header: Dark Crimson to Deep Blue Gradient */}
                    <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-blue-950 text-white px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm tracking-wide font-sans">{test.nameEn}</span>
                        <span className="text-rose-300">•</span>
                        <span className="text-xs text-rose-100 font-bold">{test.nameAr}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-rose-200">
                        <span className="bg-rose-950/70 px-2 py-0.5 rounded border border-rose-500/40 text-[10px] font-mono">
                          SAMPLE: {test.sampleType}
                        </span>
                      </div>
                    </div>

                    {/* Test Parameters Table: STRICT LTR Layout (Left to Right) as requested:
                        Column 1 (Leftmost): INVESTIGATIONS
                        Column 2: RESULT
                        Column 3: UNIT
                        Column 4 (Rightmost): REFERENCE RANGE */}
                    <div dir="ltr" className="overflow-x-auto text-left">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 text-[12px] font-extrabold uppercase border-b-2 border-slate-300 font-sans tracking-tight">
                            <th className="py-2.5 px-4 text-left" style={{ width: '30%' }}>INVESTIGATIONS</th>
                            <th className="py-2.5 px-3 text-center" style={{ width: '15%' }}>RESULT</th>
                            <th className="py-2.5 px-3 text-center" style={{ width: '20%' }}>RANGE</th>
                            <th className="py-2.5 px-3 text-center" style={{ width: '10%' }}>UNIT</th>
                            <th className="py-2.5 px-4 text-right" style={{ width: '25%' }}>REFERENCE RANGE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                          {params.map(({ definition, result }) => {
                            const isHigh = result.flag === 'HIGH';
                            const isLow = result.flag === 'LOW';
                            const isPanic = result.flag === 'PANIC';
                            const isAbnormal = isHigh || isLow || isPanic;

                            return (
                              <tr 
                                key={definition.id} 
                                className={`transition-colors hover:bg-slate-50/80 ${
                                  isPanic ? 'bg-red-50 font-bold' : isAbnormal ? 'bg-rose-50/50' : ''
                                }`}
                              >
                                {/* 1. Leftmost Column: INVESTIGATIONS */}
                                <td className="py-2.5 px-4 text-left">
                                  <div className="font-extrabold text-slate-950 font-sans text-[13px] tracking-tight">
                                    {definition.nameEn}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-normal mt-0.5 font-sans">
                                    {definition.nameAr}
                                  </div>
                                </td>

                                {/* 2. Column: RESULT */}
                                <td className="py-2.5 px-4 text-center">
                                  <div className="inline-flex items-center justify-center gap-1.5">
                                    <span className={`text-[14px] font-black font-mono tracking-tight px-1.5 py-0.5 rounded ${
                                      isPanic 
                                        ? 'text-red-700 bg-red-100 border border-red-300'
                                        : isHigh 
                                          ? 'text-rose-900 bg-rose-100/90 font-black' 
                                          : isLow 
                                            ? 'text-blue-900 bg-blue-100/90 font-black' 
                                            : 'text-slate-900'
                                    }`}>
                                      {result.value}
                                    </span>

                                    {isHigh && (
                                      <span className="text-[10px] font-black text-rose-800 bg-rose-100 px-1 py-0.2 rounded border border-rose-300">
                                        ▲ HIGH
                                      </span>
                                    )}
                                    {isLow && (
                                      <span className="text-[10px] font-black text-blue-800 bg-blue-100 px-1 py-0.2 rounded border border-blue-300">
                                        ▼ LOW
                                      </span>
                                    )}
                                    {isPanic && (
                                      <span className="text-[10px] font-black text-red-700 bg-red-200 px-1 py-0.2 rounded border border-red-300">
                                        PANIC
                                      </span>
                                    )}
                                  </div>

                                  {result.notes && (
                                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                                      {result.notes}
                                    </div>
                                  )}
                                </td>

                                {/* Flat colour range chart */}
                                <td className="py-2.5 px-3 text-center">
                                  <RangeBar
                                    value={result.value}
                                    refRange={result.refRange}
                                    dMin={definition.defaultRefMin}
                                    dMax={definition.defaultRefMax}
                                    flag={result.flag}
                                  />
                                </td>

                                {/* 3. Column: UNIT */}
                                <td className="py-2.5 px-3 text-center text-slate-700 font-mono text-[12px] font-bold">
                                  {result.unit || '-'}
                                </td>

                                {/* 4. Rightmost Column: REFERENCE RANGE */}
                                <td className="py-2.5 px-4 text-right font-mono text-[12px] text-slate-800 font-bold">
                                  {result.refRange}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Specific COMMENT Box for each test panel (عمل COMMENT فى اخر كل تقرير على حدة) */}
                    <div className="bg-slate-50/90 border-t border-slate-200 px-4 py-2 text-[11px] text-slate-700 flex items-start gap-2">
                      <span className="font-extrabold text-blue-950 shrink-0 font-sans uppercase tracking-wider">
                        COMMENT / REMARKS:
                      </span>
                      <p className="font-semibold text-slate-800 italic">
                        {commentText}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* General Clinical Consultant Remarks */}
          {generalComment && (
            <div className="mt-5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-950 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>التقرير الاستشاري العام / General Consultant Clinical Remarks:</span>
              </div>
              <p className="text-slate-800 leading-relaxed font-semibold">
                {generalComment}
              </p>
            </div>
          )}

          {/* Notice & Verification */}
          <div className="mt-4 text-[10px] text-slate-500 leading-normal border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              * تم فحص ومعايرة العينات بنظام القياس الآلي الكامل والمعتمد دولياً في معامل RT LAB للتحاليل التشخيصية.
              <br />
              * التقرير موثق إلكترونياً ولا يعتد بأي تعديل يدوي عليه. للتحقق من النتيجة يرجى مسح رمز الاستجابة السريعة (QR).
            </div>
            <div className="font-mono text-slate-400 font-bold">
              RT-LAB-OFFICIAL-VERIFIED
            </div>
          </div>
        </div>

        {/* Official Footer: Signatures & Lab Specialist Dropdown & Official RT LAB Seal Stamp */}
        <div className="p-6 bg-slate-50 border-t-2 border-slate-200 flex flex-wrap items-end justify-between gap-6">
          
          {/* Lab Specialist Signature */}
          <div className="text-center min-w-[170px]">
            <span className="text-[11px] font-extrabold text-slate-500 block mb-1 uppercase tracking-wider">
              LAB SPECIALIST / أخصائي التحاليل
            </span>
            <div className="font-black text-blue-950 text-sm py-1">
              {specialistObj ? specialistObj.name : ''}
            </div>
            {specialistObj && (
              <div className="text-[10px] text-rose-900 font-bold">{specialistObj.roleAr}</div>
            )}
            <div className="h-0.5 w-32 bg-slate-300 mx-auto mt-1" />
            <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">Checked & Bench Validated</span>
          </div>

          {/* Official Laboratory Seal Stamp */}
          <div className="relative flex items-center justify-center">
            <div
              style={{ borderColor: ringColor, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties}
              className="w-28 h-28 rounded-full border-[3px] border-solid flex items-center justify-center -rotate-12 select-none"
            >
              <div
                style={{ borderColor: ringColor }}
                className="w-[98px] h-[98px] rounded-full border border-solid flex flex-col items-center justify-center text-center p-1"
              >
                <span style={{ color: ringColor }} className="text-[11px] font-black tracking-widest font-sans">RT LAB</span>
                <Award style={{ color: ringColor }} className="w-7 h-7 my-0.5" />
                <span style={{ color: '#7f1d1d' }} className="text-[12px] font-black leading-tight">معامل رامي مختار</span>
                <span style={{ color: '#7f1d1d' }} className="text-[9px] font-extrabold leading-tight">معتمد وموثق رسمياً</span>
              </div>
            </div>
          </div>

          {/* Technical Director & Clinical Doctor Approvals (Configurable) */}
          <div className="text-center min-w-[220px]">
            {selectedDirector !== 'none' && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-500 block uppercase tracking-wider">
                  TECHNICAL DIRECTOR / المدير الفني
                </span>
                {(selectedDirector === 'rehab' || selectedDirector === 'both') && (
                  <div>
                    <div className="font-black text-slate-950 text-sm">رحاب على عبد الحميد</div>
                    <div className="text-[10px] text-rose-900 font-bold">اخصائى الباثولوجيا الإكلينيكية والتحاليل الطبيه</div>
                  </div>
                )}
                {(selectedDirector === 'ramy' || selectedDirector === 'both') && (
                  <div className={selectedDirector === 'both' ? 'border-t border-slate-300 pt-1.5' : ''}>
                    <div className="font-black text-slate-950 text-sm">رامي مختار</div>
                    <div className="text-[10px] text-blue-900 font-bold">طبيب الباثولوجيا الإكلينيكية والكيميائيه</div>
                    <div className="text-[10px] text-blue-900 font-bold">طب قصر العيني</div>
                  </div>
                )}
                <svg className="w-36 h-8 mx-auto text-rose-950 mt-1" viewBox="0 0 160 40">
                  <path
                    d="M 10,25 Q 35,5 60,25 T 110,20 Q 130,10 150,28 M 40,15 Q 80,35 120,8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-[9px] text-slate-400 font-semibold block">Official Authorized Signature</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Contact Strip (Dark Blue / Crimson Banner) */}
        <div className="bg-gradient-to-r from-slate-950 via-rose-950 to-blue-950 text-slate-200 py-3 px-6 text-[10px] flex flex-wrap items-center justify-between gap-3 border-t border-rose-900/40">
          <div>
            <strong>الفرع الرئيسي:</strong> ميدان بهتيم برج صيدلية العزبي الدور الثالث شبرا الخيمة
          </div>
          <div className="flex items-center gap-3 font-mono font-bold">
            <span>تليفونات المعامل:</span>
            <span className="text-amber-300">01100874444</span>
            <span>•</span>
            <span className="text-amber-300">01100046841</span>
            <span>•</span>
            <span className="text-amber-300">01013242777</span>
          </div>
        </div>

      </div>
  );

  const sheets = separatePages && testResultsGrouped.length > 1
    ? testResultsGrouped.map(g => [g])
    : [testResultsGrouped];

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6">
      {/* Top Action Controls (Hidden on Print) */}
      <div className="no-print max-w-5xl mx-auto mb-6 bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLis}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>العودة للمختبر LIS</span>
          </button>
          
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />
          
          {/* Order Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">اختر مريض:</span>
            <select
              value={order.id}
              onChange={(e) => onSelectOrder(e.target.value)}
              className="text-xs font-bold border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-800"
            >
              {allOrders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.patientName} ({o.sampleBarcode}) - {o.overallStatus === 'released' ? 'معتمد' : 'مسودة'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Specialist Selector for Printing */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
            <UserCheck className="w-3.5 h-3.5 text-blue-900" />
            <span className="text-slate-500 font-semibold">الأخصائي:</span>
            <select
              value={selectedSpecialist}
              onChange={(e) => setSelectedSpecialist(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none text-[11px] max-w-[190px]"
            >
              <option value="">بدون توقيع</option>
              {staffSpecialists.length > 0 && (
                <optgroup label="Lab Specialist">
                  {staffSpecialists.map(x => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </optgroup>
              )}
              {staffOthers.length > 0 && (
                <optgroup label="الموظفين">
                  {staffOthers.map(x => (
                    <option key={x.id} value={x.id}>{x.name} - {x.roleAr}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Director Approval Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
            <Stethoscope className="w-3.5 h-3.5 text-rose-900" />
            <span className="text-slate-500 font-semibold">المدير الفني (اختياري):</span>
            <select
              value={selectedDirector}
              onChange={(e) => setSelectedDirector(e.target.value as 'none' | 'rehab' | 'ramy' | 'both')}
              className="bg-transparent font-bold text-slate-800 focus:outline-none text-[11px]"
            >
              <option value="none">بدون (اختياري)</option>
              <option value="rehab">رحاب على عبد الحميد</option>
              <option value="ramy">رامي مختار</option>
              <option value="both">كلاهما</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-700 cursor-pointer">
            <input type="checkbox" checked={separatePages} onChange={(e) => setSeparatePages(e.target.checked)} />
            <span>كل بروفايل في تقرير منفصل</span>
          </label>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
            <span className="text-slate-500 font-semibold">لون الختم:</span>
            <select
              value={sealColor}
              onChange={(e) => setSealColor(e.target.value as 'blue' | 'black')}
              className="bg-transparent font-bold text-slate-800 focus:outline-none text-[11px]"
            >
              <option value="blue">أزرق</option>
              <option value="black">أسود</option>
            </select>
          </div>

          <button
            onClick={() => setIsEditingComments(!isEditingComments)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isEditingComments ? 'إخفاء محرر التعليقات' : 'تعديل التعليق (Comment)'}</span>
          </button>

          <button
            onClick={() => onEditOrder(order)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>تعديل النتائج</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors"
            title="إرسال إشعار التقرير عبر واتساب"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{busy === 'wa' ? 'جاري التجهيز...' : 'إرسال النتيجة واتساب (PDF)'}</span>
          </button>

          <button
            onClick={handlePdf}
            disabled={busy !== ''}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{busy === 'pdf' ? '...' : 'حفظ PDF'}</span>
          </button>

          <button
            onClick={handlePptx}
            disabled={busy !== ''}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-orange-900 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-xs font-bold disabled:opacity-50"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>{busy === 'pptx' ? '...' : 'حفظ PowerPoint'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white bg-gradient-to-r from-rose-900 to-blue-900 hover:from-rose-800 hover:to-blue-800 shadow-md shadow-rose-950/20 text-xs font-black transition-all hover:scale-102"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير A4</span>
          </button>
        </div>
      </div>

      {/* Interactive Comments Editor Box (Visible only on screen when toggled) */}
      {isEditingComments && (
        <div className="no-print max-w-4xl mx-auto mb-6 bg-white p-5 rounded-3xl border border-blue-200 shadow-md">
          <div className="flex items-center gap-2 font-bold text-slate-900 mb-3 text-sm">
            <MessageSquare className="w-4 h-4 text-blue-900" />
            <span>تحرير تعليقات الفحوصات الطبية (Investigation Comments):</span>
          </div>
          <div className="space-y-3">
            {testResultsGrouped.map(group => {
              if (!group) return null;
              const { test } = group;
              return (
                <div key={test.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center text-xs">
                  <span className="font-bold text-slate-700">{test.nameEn} ({test.nameAr}):</span>
                  <input
                    type="text"
                    value={testComments[test.id] !== undefined ? testComments[test.id] : getDefaultTestComment(test)}
                    onChange={(e) => setTestComments({ ...testComments, [test.id]: e.target.value })}
                    className="md:col-span-2 px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-800"
                  />
                </div>
              );
            })}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1">التعليق الاستشاري الإجمالي (Overall Clinical Remark):</label>
              <textarea
                value={generalComment}
                onChange={(e) => setGeneralComment(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-rose-800"
              />
            </div>
          </div>
        </div>
      )}

      <div ref={sheetsRef} className="space-y-8">
        {sheets.map((g, i) => renderSheet(g, i))}
      </div>
    </div>
  );
};
