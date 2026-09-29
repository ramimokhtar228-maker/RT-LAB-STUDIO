import React, { useState } from 'react';
import { 
  CalendarClock, 
  Home, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Clock, 
  Tag, 
  ArrowRight,
  Search,
  Check,
  Send,
  HelpCircle,
  Share2,
  CreditCard,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Activity,
  Zap,
  HeartPulse,
  Eye,
  X,
  Stethoscope,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { HealthPackage, LabTest, Booking, Gender, LoyaltyCard, LabSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { BarcodeRenderer } from './BarcodeRenderer';

interface BookingViewProps {
  packages: HealthPackage[];
  tests: LabTest[];
  bookings: Booking[];
  loyaltyCards?: LoyaltyCard[];
  settings?: LabSettings;
  onAddNewBooking: (booking: Booking) => void;
  onNavigateToCatalog: () => void;
  onUpdateBooking?: (booking: Booking) => void;
  patientMode?: boolean;
}

export const BookingView: React.FC<BookingViewProps> = ({
  packages,
  tests,
  bookings,
  loyaltyCards = [],
  settings,
  onAddNewBooking,
  onNavigateToCatalog,
  onUpdateBooking,
  patientMode = false
}) => {
  // Service Type
  const [serviceType, setServiceType] = useState<'home_visit' | 'lab_branch'>('home_visit');
  const [selectedBranch, setSelectedBranch] = useState('الفرع الرئيسي: ميدان بهتيم برج صيدلية العزبي الدور الثالث شبرا الخيمة');

  // Selected Tests & Package
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>('pkg-golden');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('all');
  const [hidePricesForPatient, setHidePricesForPatient] = useState(false);

  // Loyalty Card Code input
  const [loyaltyInput, setLoyaltyInput] = useState('');
  const [appliedLoyaltyCard, setAppliedLoyaltyCard] = useState<LoyaltyCard | null>(null);

  // Patient Info
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState<number>(35);
  const [patientGender, setPatientGender] = useState<Gender>('male');
  const [area, setArea] = useState('شبرا الخيمة - بهتيم');
  const [address, setAddress] = useState('');
  const [visitDate, setVisitDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [visitTime, setVisitTime] = useState('09:00 ص');
  const [notes, setNotes] = useState('');

  // Confirmation Success Modal
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Patient Sheet Modal (استمارة شيت المريض للأخصائي في الوحدات)
  const [patientSheetBooking, setPatientSheetBooking] = useState<Booking | null>(null);

  // Management Pricing Modal (تسعير الإدارة وموافقة المريض)
  const [pricingBooking, setPricingBooking] = useState<Booking | null>(null);
  const [quotedPriceInput, setQuotedPriceInput] = useState<number>(0);
  const [discountQuoteInput, setDiscountQuoteInput] = useState<number>(0);

  // Tracking Search Tab
  const [trackQuery, setTrackQuery] = useState('');
  const [foundBooking, setFoundBooking] = useState<Booking | null>(null);
  const [searched, setSearched] = useState(false);

  // Calculate Standard Prices
  let originalPrice = 0;
  let finalPrice = 0;
  let discount = 0;

  if (selectedPackageId) {
    const pkg = packages.find(p => p.id === selectedPackageId);
    if (pkg) {
      originalPrice = pkg.originalPrice;
      finalPrice = pkg.discountedPrice;
      discount = originalPrice - finalPrice;
    }
  } else {
    originalPrice = selectedTestIds.reduce((sum, tid) => {
      const t = tests.find(x => x.id === tid);
      return sum + (t ? t.price : 0);
    }, 0);
    finalPrice = originalPrice;
    discount = 0;
  }

  // Loyalty Card Discount
  let loyaltyDiscountAmount = 0;
  if (appliedLoyaltyCard) {
    loyaltyDiscountAmount = Math.round((finalPrice * appliedLoyaltyCard.discountPercentage) / 100);
    finalPrice = Math.max(0, finalPrice - loyaltyDiscountAmount);
    discount += loyaltyDiscountAmount;
  }

  const handleApplyLoyaltyCard = () => {
    const clean = loyaltyInput.trim().toLowerCase();
    const found = loyaltyCards.find(c => 
      c.cardNumber.toLowerCase() === clean || 
      c.patientPhone === clean
    );
    if (found) {
      setAppliedLoyaltyCard(found);
      if (!patientName && found.patientName) setPatientName(found.patientName);
      if (!patientPhone && found.patientPhone) setPatientPhone(found.patientPhone);
    } else {
      alert('لم يتم العثور على بطاقة ولاء بهذا الرقم أو الهاتف');
    }
  };

  // Check fasting requirement
  const currentTestsList = selectedPackageId 
    ? (packages.find(p => p.id === selectedPackageId)?.testIds || []).map(id => tests.find(t => t.id === id)).filter(Boolean)
    : selectedTestIds.map(id => tests.find(t => t.id === id)).filter(Boolean);

  const requiresFasting = currentTestsList.some(t => t && t.fastingHours > 0);
  const maxFastingHours = Math.max(...currentTestsList.map(t => t?.fastingHours || 0), 0);

  const handleSelectPackage = (pkgId: string) => {
    if (selectedPackageId === pkgId) {
      setSelectedPackageId(null);
    } else {
      setSelectedPackageId(pkgId);
      setSelectedTestIds([]);
    }
  };

  const handleToggleTest = (testId: string) => {
    setSelectedPackageId(null);
    if (selectedTestIds.includes(testId)) {
      setSelectedTestIds(selectedTestIds.filter(id => id !== testId));
    } else {
      setSelectedTestIds([...selectedTestIds, testId]);
    }
  };

  // Helper to extract English test abbreviations
  const getTestAbbreviations = (testIds: string[]): string => {
    return testIds.map(tid => {
      const t = tests.find(x => x.id === tid);
      if (!t) return tid;
      // Extract acronym like CBC, ESR, ALT, Lipid Profile, etc.
      const match = t.nameEn.match(/\(([^)]+)\)/);
      if (match) return match[1];
      return t.code.split('-')[0] || t.nameEn.slice(0, 8);
    }).join(', ');
  };

  // Fasting conditions text
  const getFastingConditionsText = (testIds: string[]): string => {
    const relevantTests = testIds.map(id => tests.find(t => t.id === id)).filter(Boolean);
    const fasting = relevantTests.filter(t => t && t.fastingHours > 0);
    if (fasting.length === 0) {
      return 'لا يشترط الصيام المسبق، يمكن إجراء التحاليل في أي وقت.';
    }
    const maxHours = Math.max(...fasting.map(t => t?.fastingHours || 0));
    return `يشترط الصيام التام عن الطعام لمدة ${maxHours} ساعات متواصلة (يُسمح بشرب الماء النقي فقط).`;
  };

  const toWaPhone = (phone: string) => {
    const clean = (phone || '').replace(/\D/g, '');
    if (!clean) return '';
    if (clean.startsWith('20')) return clean;
    if (clean.startsWith('0')) return '2' + clean;
    return clean;
  };

  // رسالة واتساب الرسمية للمريض
  const generateWhatsAppMessage = (booking: Booking): string => {
    const abbr = getTestAbbreviations(booking.selectedTestIds);
    const fastingNote = getFastingConditionsText(booking.selectedTestIds);

    return (
      `مرحباً بكم في معامل RT LAB للتحاليل التشخيصية - معامل رامي مختار 🔬\n` +
      `يسعدنا إبلاغكم بتأكيد حجز موعدكم وفقاً للتفاصيل التالية:\n\n` +
      `👤 اسم المريض: ${booking.patientName}\n` +
      `📱 رقم الهاتف: ${booking.patientPhone}\n` +
      `🧪 التحاليل المطلوبة: ${abbr || 'الفحص الشامل'}\n` +
      `💰 تفاصيل السعر: قبل الخصم: ${booking.totalPrice} ج.م | الخصم: ${booking.discount} ج.م | السعر النهائي بعد الخصم: ${booking.finalPrice} ج.م\n` +
      `📅 الموعد: ${booking.visitDate} الساعة ${booking.visitTime}\n` +
      `📍 العنوان / المكان: ${booking.serviceType === 'home_visit' ? `زيارة منزلية (${booking.address})` : booking.branchName || 'الفرع الرئيسي'}\n` +
      `⚠️ شروط التحاليل: ${fastingNote}\n\n` +
      `نتمنى لكم دوام الصحة والعافية، وأهلاً بكم دائماً في معامل RT LAB!`
    );
  };

  // إشعار واتساب للمعمل عند حجز مريض جديد
  const generateLabNotifyMessage = (booking: Booking): string => {
    const abbr = getTestAbbreviations(booking.selectedTestIds);
    return (
      `🔔 حجز جديد من التطبيق - RT LAB\n\n` +
      `كود الحجز: ${booking.bookingNumber}\n` +
      `👤 المريض: ${booking.patientName}\n` +
      `📱 الهاتف: ${booking.patientPhone}\n` +
      `🧪 التحاليل: ${abbr || '—'}\n` +
      `📅 الموعد: ${booking.visitDate} ${booking.visitTime}\n` +
      `📍 ${booking.serviceType === 'home_visit' ? `زيارة منزلية — ${booking.address || booking.area}` : (booking.branchName || 'فرع المختبر')}\n` +
      `💰 السعر المبدئي: ${booking.finalPrice} ج.م\n` +
      (booking.notes ? `📝 ملاحظات: ${booking.notes}\n` : '') +
      `\nيرجى التأكيد والتسعير من لوحة الحجوزات.`
    );
  };

  const handleSendWhatsAppNotification = (booking: Booking) => {
    const rawMsg = generateWhatsAppMessage(booking);
    const phone = toWaPhone(booking.patientPhone);
    if (!phone) return;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(rawMsg)}`, '_blank');
  };

  const handleNotifyLabWhatsApp = (booking: Booking) => {
    const labPhone = toWaPhone(settings?.whatsappNumber || settings?.phonePrimary || '');
    if (!labPhone) {
      alert('رقم واتساب المعمل غير مضبوط. اضبطه من لوحة الإدارة ← إعدادات المختبر.');
      return;
    }
    const msg = generateLabNotifyMessage(booking);
    window.open(`https://wa.me/${labPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientPhone) return;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      bookingNumber: `RT-BK-${randomSuffix}`,
      patientName,
      patientPhone,
      patientAge,
      patientGender,
      serviceType,
      branchName: serviceType === 'lab_branch' ? selectedBranch : undefined,
      address: serviceType === 'home_visit' ? address || area : 'حضور لفرع المختبر',
      area,
      visitDate,
      visitTime,
      selectedTestIds: selectedPackageId 
        ? (packages.find(p => p.id === selectedPackageId)?.testIds || [])
        : selectedTestIds,
      selectedPackageId: selectedPackageId || undefined,
      notes,
      totalPrice: originalPrice,
      discount,
      finalPrice,
      status: 'pending',
      pricingStatus: 'pending_pricing',
      createdAt: new Date().toISOString()
    };

    onAddNewBooking(newBooking);
    setConfirmedBooking(newBooking);

    // Fire Confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  const handleSearchTracking = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    const cleanQuery = trackQuery.trim().toLowerCase();
    const found = bookings.find(b => 
      b.bookingNumber.toLowerCase().includes(cleanQuery) ||
      b.patientPhone.includes(cleanQuery)
    );
    setFoundBooking(found || null);
  };

  // Helper icon component for health packages
  const renderPackageIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-amber-300" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-emerald-300" />;
      case 'Activity':
        return <Activity className="w-6 h-6 text-rose-300" />;
      case 'Zap':
        return <Zap className="w-6 h-6 text-yellow-300" />;
      case 'HeartPulse':
        return <HeartPulse className="w-6 h-6 text-red-300" />;
      default:
        return <Stethoscope className="w-6 h-6 text-blue-300" />;
    }
  };

  // Filter tests in the bilingual catalog
  const filteredCatalogTests = tests.filter(test => {
    const matchesCategory = selectedCatalogCategory === 'all' || test.category === selectedCatalogCategory;
    const q = catalogSearch.toLowerCase().trim();
    const matchesSearch = 
      test.nameAr.toLowerCase().includes(q) ||
      test.nameEn.toLowerCase().includes(q) ||
      test.code.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Prominent PWA Install Callout Banner */}
      <div className="mb-8 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-950 via-rose-900 to-blue-950 text-white flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-rose-950/20 border border-rose-800/40">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-400 text-slate-950 shadow-md">
            <Download className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base">تثبيت تطبيق معامل RT LAB على هذا الجهاز</h3>
              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">PWA فوري</span>
            </div>
            <p className="text-xs text-rose-200 mt-0.5">
              منظومة إلكترونية متكاملة لإدارة الحجوزات، تسعير الفحوصات، استمارات سحب العينات، وكروت الولاء
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton />
        </div>
      </div>

      {/* Main Grid: Form on Left, Info & Packages on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Booking Flow */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: Service Type Toggle */}
          <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200">
            <h2 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-rose-900 text-white flex items-center justify-center text-xs">1</span>
              <span>مكان تقديم الخدمة الطبية</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setServiceType('home_visit')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-right ${
                  serviceType === 'home_visit'
                    ? 'border-rose-900 bg-rose-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`p-3 rounded-xl ${serviceType === 'home_visit' ? 'bg-rose-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-slate-900 text-xs">سحب عينات منزلي (Home Visit)</div>
                  <div className="text-[11px] text-slate-500 font-medium">نصلكم للمنزل أينما كنتم بأعلى معايير التعقيم</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setServiceType('lab_branch')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-right ${
                  serviceType === 'lab_branch'
                    ? 'border-blue-900 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`p-3 rounded-xl ${serviceType === 'lab_branch' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-slate-900 text-xs">حضور لفرع المختبر</div>
                  <div className="text-[11px] text-slate-500 font-medium">الفرع الرئيسي: شبرا الخيمة - ميدان بهتيم</div>
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: Packages as Interactive Attractive Icons (الباقات على شكل أيقونات) */}
          <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-900 text-white flex items-center justify-center text-xs">2</span>
                <span>باقات الفحص الشامل المعتمدة (قابلة للتعديل والتسعير من الإدارة)</span>
              </h2>

              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                اختر باقة موفرة أو انتقل للكتالوج
              </span>
            </div>

            {/* Packages Visual Cards / Icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {packages.map(pkg => {
                const isSelected = selectedPackageId === pkg.id;

                return (
                  <div
                    key={pkg.id}
                    onClick={() => handleSelectPackage(pkg.id)}
                    className={`relative p-4 rounded-2xl cursor-pointer transition-all border-2 flex flex-col justify-between ${
                      isSelected
                        ? 'border-rose-900 bg-gradient-to-br from-rose-950 via-rose-900 to-blue-950 text-white shadow-md'
                        : 'border-slate-200 hover:border-rose-300 bg-slate-50/70 hover:bg-white text-slate-900'
                    }`}
                  >
                    <div>
                      {/* Top Badge & Icon */}
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-white/10' : 'bg-rose-100 text-rose-900'}`}>
                          {renderPackageIcon(pkg.iconName)}
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-amber-400 text-slate-950' : 'bg-rose-50 text-rose-900 border border-rose-200'
                        }`}>
                          {pkg.badge}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-xs leading-tight mb-1">{pkg.titleAr}</h4>
                      <div className={`text-[10px] font-mono tracking-tight ${isSelected ? 'text-rose-200' : 'text-slate-400'}`}>
                        {pkg.titleEn}
                      </div>

                      <p className={`text-[11px] mt-2 line-clamp-2 leading-relaxed ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}>
                        {pkg.descriptionAr}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/40 flex items-center justify-between">
                      <div>
                        <span className={`text-[10px] line-through block ${isSelected ? 'text-rose-300' : 'text-slate-400'}`}>
                          {pkg.originalPrice} ج.م
                        </span>
                        <span className={`text-base font-black ${isSelected ? 'text-amber-300' : 'text-rose-950'}`}>
                          {pkg.discountedPrice} ج.م
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                        isSelected ? 'bg-white text-rose-950' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isSelected ? '✓ محددة' : 'اختيار'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* STEP 2.B: Bilingual Tests Catalog Inside Booking View (كتالوج التحاليل باللغتين عربي وإنجليزي بدون أسعار أو بأسعار) */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span>أو اختر تحاليل فردية من الكتالوج الطبي ثنائي اللغة (Bilingual Catalog):</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    يمكن للمريض اختيار الفحوصات مباشرة، ويتم تحديد السعر والموعد من إدارة المعمل.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={hidePricesForPatient}
                      onChange={(e) => setHidePricesForPatient(e.target.checked)}
                      className="rounded text-rose-900 focus:ring-rose-800"
                    />
                    <span>إخفاء الأسعار (تحديد السعر والموافقة لاحقاً من الإدارة)</span>
                  </label>
                </div>
              </div>

              {/* Search in Bilingual Catalog */}
              <div className="relative mb-2.5">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم العربي أو الإنجليزي (مثال: CBC, Ferritin, سكر صائم، وظائف كبد، ACR)..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full text-xs font-semibold pr-9 pl-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-800"
                />
              </div>

              {/* Tests Grid */}
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl p-2.5 space-y-1.5 bg-slate-50/70">
                {filteredCatalogTests.map(test => {
                  const isChecked = selectedTestIds.includes(test.id);

                  return (
                    <label 
                      key={test.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all border ${
                        isChecked 
                          ? 'bg-rose-100/70 border-rose-300 text-rose-950 font-bold' 
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleTest(test.id)}
                          className="rounded text-rose-900 focus:ring-rose-800 w-4 h-4"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">{test.nameAr}</span>
                            <span className="text-[10px] font-mono font-bold bg-slate-100 px-1.5 py-0.2 rounded text-blue-900 border border-slate-200">
                              {test.nameEn}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            العينة: {test.sampleType} {test.fastingHours > 0 ? `• صيام ${test.fastingHours} ساعات` : '• لا يشترط صيام'}
                          </div>
                        </div>
                      </div>

                      {!hidePricesForPatient && (
                        <span className="font-mono font-bold text-rose-950 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {test.price} ج.م
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 3: Patient Information Form */}
          <form onSubmit={handleSubmitBooking} className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-rose-900 text-white flex items-center justify-center text-xs">3</span>
              <span>بيانات المريض وموعد الزيارة</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المريض بالكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="الاسم ثلاثي أو رباعي..."
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الموبايل / واتساب *</label>
                <input
                  type="tel"
                  required
                  placeholder="01xxxxxxxxx"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800 text-left font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">السن بالسنوات *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  value={patientAge}
                  onChange={(e) => setPatientAge(Number(e.target.value))}
                  className="w-full font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">النوع *</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as Gender)}
                  className="w-full font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800 bg-white"
                >
                  <option value="male">ذكر (Male)</option>
                  <option value="female">أنثى (Female)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ الزيارة المطلوب *</label>
                <input
                  type="date"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الوقت المفضل *</label>
                <select
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                  className="w-full font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800 bg-white"
                >
                  <option value="08:00 ص">08:00 صباحاً (صيام الصباح)</option>
                  <option value="09:00 ص">09:00 صباحاً</option>
                  <option value="10:00 ص">10:00 صباحاً</option>
                  <option value="11:30 ص">11:30 صباحاً</option>
                  <option value="02:00 م">02:00 ظهراً</option>
                  <option value="05:00 م">05:00 مساءً</option>
                  <option value="07:30 م">07:30 مساءً</option>
                </select>
              </div>

              {serviceType === 'home_visit' && (
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">عنوان المنزل التفصيلي *</label>
                  <input
                    type="text"
                    required
                    placeholder="اسم الشارع، رقم العمارة، الدور، رقم الشقة، علامة مميزة..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">ملاحظات طبية أو أعراض خاصة للمختبر</label>
                <input
                  type="text"
                  placeholder="مثل: مريض سكر، يتناول مسيلات دم، صعوبة في الأوردة..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
                />
              </div>
            </div>

            {/* Fasting Warning Alert if applicable */}
            {requiresFasting && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900 font-semibold">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  تنبيه هام: الفحوصات المختارة تتطلب صيام <strong>{maxFastingHours} ساعات</strong> متواصلة قبل السحب لضمان دقة النتيجة.
                </span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-rose-950 via-rose-900 to-blue-950 hover:from-rose-900 hover:to-blue-900 text-white font-black text-sm shadow-md shadow-rose-950/20 transition-all hover:scale-101"
              >
                تأكيد حجز الفحص وإرسال إشعار للإدارة والتسعير
              </button>
            </div>
          </form>

        </div>

        {/* Right Column: Pricing Summary & Patient Sheet Quick Generator */}
        <div className="space-y-6">
          
          {/* Price Breakdown Card */}
          <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-rose-900" />
              <span>ملخص التكلفة والحساب</span>
            </h3>

            {/* Loyalty Card Application */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-[11px] font-bold text-slate-600">لديك كارت ولاء / خصم؟</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="رقم الكارت أو الموبايل..."
                  value={loyaltyInput}
                  onChange={(e) => setLoyaltyInput(e.target.value)}
                  className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-300 bg-white"
                />
                <button
                  type="button"
                  onClick={handleApplyLoyaltyCard}
                  className="px-3 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl whitespace-nowrap"
                >
                  تطبيق
                </button>
              </div>

              {appliedLoyaltyCard && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-bold bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم تطبيق خصم {appliedLoyaltyCard.discountPercentage}% ({appliedLoyaltyCard.tierNameAr})</span>
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>السعر الإجمالي قبل الخصم:</span>
                <span className="font-mono font-bold text-slate-800">{originalPrice} ج.م</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>قيمة الخصم الممنوح:</span>
                  <span className="font-mono">-{discount} ج.م</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-black text-slate-900 text-sm">المطلوب سداده:</span>
                <span className="font-black text-rose-900 text-lg font-mono">{finalPrice} ج.م</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200 text-[11px] text-blue-900 leading-normal">
              * يتم احتساب نقاط الولاء تلقائياً للمريض فور إتمام السحب والسداد.
            </div>
          </div>

          {/* Quick Tracking & Patient Worklist Sheet Access */}
          <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-blue-900" />
              <span>تتبع حجز سابق وإصدار شيت المريض</span>
            </h3>

            <form onSubmit={handleSearchTracking} className="space-y-2">
              <input
                type="text"
                placeholder="أدخل كود الحجز أو رقم الموبايل..."
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
              />
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                بحث وتتبع
              </button>
            </form>

            {searched && (
              <div className="pt-2">
                {foundBooking ? (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-rose-950">{foundBooking.bookingNumber}</span>
                      <span className="text-[10px] font-bold bg-white text-slate-800 px-2 py-0.5 rounded-full border border-slate-200">
                        {foundBooking.status}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900">{foundBooking.patientName}</div>
                    <div className="text-slate-600 text-[11px]">
                      الموعد: {foundBooking.visitDate} ({foundBooking.visitTime})
                    </div>
                    <div className="font-mono text-slate-800 font-bold">
                      السعر: {foundBooking.finalPrice} ج.م
                    </div>

                    {/* Action buttons on found booking */}
                    <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2">
                      {/* Patient Sheet Button (شيت المريض للأخصائي في الوحدات) */}
                      {!patientMode && (
<>
<button
                        type="button"
                        onClick={() => setPatientSheetBooking(foundBooking)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-[11px] font-bold"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Patient Sheet للأخصائي</span>
                      </button>

                      {/* WhatsApp message trigger */}
                      <button
                        type="button"
                        onClick={() => handleSendWhatsAppNotification(foundBooking)}
                        className="flex items-center gap-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold"
                        title="إرسال رسالة واتساب المعتمدة"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </button>
</>
)}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-rose-600 font-medium text-center py-2">
                    لم يتم العثور على حجز بهذا الرقم أو الكود
                  </div>
                )}
              </div>
            )}
          </div>

          {!patientMode && (
          <>
          
          <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200 space-y-3">
            <h4 className="text-xs font-black text-slate-900 flex items-center justify-between">
              <span>أحدث طلبات الحجز بالمعمل ({bookings.length})</span>
              <span className="text-[10px] text-slate-400">شيتات وأوامر السحب</span>
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {bookings.slice(0, 5).map(b => (
                <div key={b.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900">{b.patientName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{b.bookingNumber} • {b.visitDate}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPatientSheetBooking(b)}
                      className="p-1 rounded-lg bg-white border border-slate-200 text-blue-900 hover:bg-blue-50 text-[10px] font-bold flex items-center gap-1"
                      title="شيت المريض للأخصائي"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">شيت</span>
                    </button>
                    <button
                      onClick={() => handleSendWhatsAppNotification(b)}
                      className="p-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-[10px] font-bold"
                      title="إرسال رسالة واتساب"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </>
          )}

        </div>

      </div>

      {/* MODAL 1: Booking Registered Success Dialog */}
      {confirmedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-black text-slate-900">تم تسجيل طلب الحجز بنجاح!</h3>
            <p className="text-xs text-slate-500 mt-1">
              معامل RT LAB للتحاليل التشخيصية ترحب بكم. سيتم مراجعة الطلب والتسعير والتأكيد عبر واتساب.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 my-5 text-right text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">كود الحجز:</span>
                <span className="font-mono font-extrabold text-rose-950 text-sm">{confirmedBooking.bookingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">اسم المريض:</span>
                <span className="font-bold text-slate-800">{confirmedBooking.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">التحاليل المطلوبة (اختصارات):</span>
                <span className="font-bold font-mono text-blue-900">{getTestAbbreviations(confirmedBooking.selectedTestIds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الموعد والتاريخ:</span>
                <span className="font-semibold text-slate-800">{confirmedBooking.visitDate} الساعة {confirmedBooking.visitTime}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">السعر الإجمالي:</span>
                <span className="font-black text-rose-950 text-sm">{confirmedBooking.finalPrice} ج.م</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {patientMode ? (
                <>
                  <div className="w-full text-center text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    ✅ تم تسجيل حجزك في النظام. يمكنك إرسال إشعار للمعمل عبر واتساب الآن.
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNotifyLabWhatsApp(confirmedBooking)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>إرسال إشعار الحجز لواتساب المعمل</span>
                  </button>
                </>
              ) : (
              <>
              <button
                type="button"
                onClick={() => handleSendWhatsAppNotification(confirmedBooking)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>إرسال رسالة الحجز الرسمية واتساب للمريض</span>
              </button>

              <button
                type="button"
                onClick={() => handleNotifyLabWhatsApp(confirmedBooking)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md"
              >
                <Phone className="w-4 h-4" />
                <span>إشعار واتساب المعمل</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPatientSheetBooking(confirmedBooking);
                  setConfirmedBooking(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-900/30"
              >
                <FileText className="w-4 h-4" />
                <span>عرض وطباعة Patient Sheet للأخصائي</span>
              </button>

              </>
              )}
              <button
                type="button"
                onClick={() => setConfirmedBooking(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PATIENT SHEET FOR SPECIALIST IN UNITS (عمل Patient Sheet للتحاليل المطلوبة خاصة بالأخصائي في الوحدات) */}
      {patientSheetBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Controls Bar */}
            <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-300" />
                <span className="font-black text-sm">استمارة سحب عينات وأمر عمل (Patient Worklist Sheet)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-900 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الشيت A4</span>
                </button>
                <button
                  onClick={() => setPatientSheetBooking(null)}
                  className="p-1 rounded-full hover:bg-white/10 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Patient Sheet Body */}
            <div className="p-6 bg-white text-slate-900 font-sans space-y-4">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <div className="flex items-center gap-3">
                    <img src={`${import.meta.env.BASE_URL}logo.png`} alt="RT LABS" style={{ width: 64, height: 64, borderRadius: 12, background: '#000' }} />
                    <h2 className="text-xl font-black text-slate-950">
                      معامل <span className="text-rose-900">RT LAB</span> للتحاليل التشخيصية
                    </h2>
                  </div>
                  <div className="text-xs font-bold text-blue-950 mt-0.5">
                    معامل رامي مختار • استمارة سحب عينات خاصة بالأخصائي وفني الوحدات
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    الفرع الرئيسي: ميدان بهتيم برج صيدلية العزبي الدور الثالث شبرا الخيمة
                  </div>
                  <div className="text-[11px] font-mono text-slate-700 font-bold">
                    تليفونات: 01100874444 • 01100046841 • 01013242777
                  </div>
                </div>

                <div className="text-left flex flex-col items-end">
                  <BarcodeRenderer value={patientSheetBooking.bookingNumber} width={130} height={36} />
                  <span className="font-mono text-xs font-bold text-slate-800 mt-1">{patientSheetBooking.bookingNumber}</span>
                  <span className="text-[10px] text-slate-500 font-bold">PATIENT WORKLIST SHEET</span>
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">اسم المريض</span>
                    <span className="font-black text-slate-950 text-sm">{patientSheetBooking.patientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">السن والنوع</span>
                    <span className="font-bold text-slate-800">
                      {patientSheetBooking.patientAge} سنة / {patientSheetBooking.patientGender === 'male' ? 'ذكر' : 'أنثى'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">رقم الهاتف</span>
                    <span className="font-mono font-bold text-slate-800">{patientSheetBooking.patientPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">موعد وتاريخ السحب</span>
                    <span className="font-bold text-rose-950">{patientSheetBooking.visitDate} ({patientSheetBooking.visitTime})</span>
                    <span className="text-slate-600 block text-[11px] font-bold mt-1">موعد استلام النتيجة:</span>
                    <span className="font-black text-blue-950">____ / ____ / ________</span>
                  </div>
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold">الموقع / العنوان</span>
                    <span className="font-semibold text-slate-800">{patientSheetBooking.address}</span>
                  </div>
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold">نوع الخدمة والفرع</span>
                    <span className="font-semibold text-slate-800">
                      {patientSheetBooking.serviceType === 'home_visit' ? 'سحب منزلي (Home Visit)' : 'استقبال المعمل'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specialist worklist: short test names + space to write results */}
              <div>
                <h4 className="text-xs font-black text-slate-900 mb-2 uppercase tracking-wider">
                  التحاليل المطلوبة - مساحة كتابة النتيجة للأخصائي (Worklist):
                </h4>
                <table className="w-full text-sm text-right border border-slate-400" style={{ borderCollapse: 'collapse' }}>
                  <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-400">
                    <tr>
                      <th className="py-2 px-2 text-center w-10 border border-slate-300">#</th>
                      <th className="py-2 px-3 text-center w-40 border border-slate-300">التحليل (اختصار)</th>
                      <th className="py-2 px-3 text-center border border-slate-300">النتيجة (Result)</th>
                      <th className="py-2 px-3 text-center w-24 border border-slate-300">العينة</th>
                      <th className="py-2 px-2 text-center w-16 border border-slate-300">تم السحب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientSheetBooking.selectedTestIds.map((tid, idx) => {
                      const t = tests.find(x => x.id === tid);
                      if (!t) return null;
                      const match = t.nameEn.match(/\(([^)]+)\)/);
                      const acronym = match ? match[1] : t.code.split('-')[0];
                      return (
                        <tr key={t.id} style={{ height: 38 }}>
                          <td className="px-2 text-center font-mono font-bold border border-slate-300">{idx + 1}</td>
                          <td className="px-3 text-center font-mono font-black text-blue-950 text-base border border-slate-300">{acronym}</td>
                          <td className="px-3 border border-slate-300" />
                          <td className="px-2 text-center text-[10px] font-bold text-slate-700 border border-slate-300">{t.sampleType.split(' ')[0]}</td>
                          <td className="px-2 border border-slate-300"><div className="w-4 h-4 rounded border-2 border-slate-400 mx-auto" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Specialist Quality Check & Handover Signatures */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold mb-1">فحص جودة ومظهر العينة:</span>
                  <div className="space-y-1">
                    <label className="flex items-center gap-1.5 text-[11px]">
                      <input type="checkbox" className="rounded text-rose-900" />
                      <span>عينة سليمة نقية (Clear)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px]">
                      <input type="checkbox" className="rounded text-rose-900" />
                      <span>تكسير دموي (Hemolyzed)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px]">
                      <input type="checkbox" className="rounded text-rose-900" />
                      <span>عكارة دهنية (Lipemic)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] font-bold mb-1">وقت وساعة السحب الفعلية:</span>
                  <div className="h-7 border-b border-slate-400 font-mono text-xs font-bold pt-1">
                    ____ : ____ ص / م
                  </div>
                  <span className="text-slate-500 block text-[10px] font-bold mt-2">اسم وتوقيع فني السحب:</span>
                  <div className="h-7 border-b border-slate-400 font-serif text-xs font-bold pt-1">
                    _________________________
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] font-bold mb-1">استلام أخصائي الوحدة بالمختبر:</span>
                  <div className="h-7 border-b border-slate-400 font-serif text-xs font-bold pt-1">
                    أخصائي المختبر: _________________
                  </div>
                  <span className="text-slate-500 block text-[10px] font-bold mt-2">ساعة إدخال الأجهزة:</span>
                  <div className="h-7 border-b border-slate-400 font-mono text-xs font-bold pt-1">
                    ____ : ____
                  </div>
                </div>
              </div>

              {/* Sheet Footer */}
              <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-2 flex justify-between">
                <span>معامل RT LAB للتحاليل التشخيصية • نظام المختبر LIS</span>
                <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
