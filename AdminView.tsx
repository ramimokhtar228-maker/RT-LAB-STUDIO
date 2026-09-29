import React, { useState } from 'react';
import { 
  Settings, 
  Users, 
  CalendarClock, 
  FlaskConical, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  ArrowRightLeft, 
  Edit, 
  Plus, 
  Save, 
  Download, 
  Upload,
  RotateCcw,
  Building,
  Phone,
  Tag,
  Sparkles,
  PieChart,
  Percent
} from 'lucide-react';
import { Booking, LabOrder, LabTest, LabSettings, BookingStatus, HealthPackage } from '../types';

interface AdminViewProps {
  bookings: Booking[];
  orders: LabOrder[];
  tests: LabTest[];
  packages?: HealthPackage[];
  settings: LabSettings;
  onUpdateBookingStatus: (bookingId: string, newStatus: BookingStatus, techName?: string) => void;
  onTransferBookingToLis: (booking: Booking) => void;
  onDeleteBooking: (bookingId: string) => void;
  onSaveSettings: (settings: LabSettings) => void;
  onUpdateTestPrice: (testId: string, newPrice: number) => void;
  onUpdatePackage?: (pkg: HealthPackage) => void;
  onAddPackage?: (pkg: HealthPackage) => void;
  onResetData: () => void;
  onImportBackup?: (data: {
    bookings?: Booking[];
    orders?: LabOrder[];
    tests?: LabTest[];
    settings?: LabSettings;
    packages?: HealthPackage[];
  }) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  bookings,
  orders,
  tests,
  packages = [],
  settings,
  onUpdateBookingStatus,
  onTransferBookingToLis,
  onImportBackup,
  onDeleteBooking,
  onSaveSettings,
  onUpdateTestPrice,
  onUpdatePackage,
  onAddPackage,
  onResetData
}) => {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'bookings' | 'packages' | 'tests' | 'settings'>('bookings');
  
  // Technician assign dialog state
  const [selectedBookingForTech, setSelectedBookingForTech] = useState<Booking | null>(null);
  const [assignTechName, setAssignTechName] = useState('كيميائي / هاني عبد الفتاح');

  // Package editing state
  const [editingPackage, setEditingPackage] = useState<HealthPackage | null>(null);

  // Editable settings form state
  const [formData, setFormData] = useState<LabSettings>({ ...settings });
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);

  // Test price editing
  const [editingPriceTestId, setEditingPriceTestId] = useState<string | null>(null);
  const [newPriceVal, setNewPriceVal] = useState<number>(0);

  // Stats Calculations
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0) +
                       orders.reduce((sum, o) => sum + (o.testIds.length * 150), 0);
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const homeVisitsCount = bookings.filter(b => b.serviceType === 'home_visit').length;

  const handleSaveSettingsForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSettingsSuccess(true);
    setTimeout(() => setSavedSettingsSuccess(false), 3000);
  };

  const handleAssignTechSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForTech) return;
    onUpdateBookingStatus(selectedBookingForTech.id, 'technician_assigned', assignTechName);
    setSelectedBookingForTech(null);
  };

  const handleExportData = () => {
    const data = {
      bookings,
      orders,
      tests,
      packages,
      settings,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rt-lab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    if (!onImportBackup) {
      alert('استيراد النسخة غير مفعّل في هذا الإصدار.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object') throw new Error('ملف غير صالح');
        if (!window.confirm('سيتم استبدال البيانات الحالية (حجوزات / طلبات / تحاليل / إعدادات) بمحتوى النسخة المستوردة. هل تريد المتابعة؟')) return;
        onImportBackup({
          bookings: Array.isArray(parsed.bookings) ? parsed.bookings : undefined,
          orders: Array.isArray(parsed.orders) ? parsed.orders : undefined,
          tests: Array.isArray(parsed.tests) ? parsed.tests : undefined,
          packages: Array.isArray(parsed.packages) ? parsed.packages : undefined,
          settings: parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : undefined,
        });
      } catch (e) {
        alert('تعذر قراءة ملف النسخة: ' + ((e as Error).message || 'خطأ غير معروف'));
      }
    };
    input.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Admin Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-slate-900 text-white">
              <Settings className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900">لوحة تحكم إدارة المختبر والحجوزات</h1>
              <p className="text-xs text-slate-500 font-medium">
                متابعة الحجوزات، تحويل الطلبات إلى LIS، تعديل أسعار الكتالوج، وإعدادات المركز
              </p>
            </div>
          </div>
        </div>

        {/* Backup / Export / Import Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير نسخة احتياطية</span>
          </button>

          <button
            onClick={handleImportData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>استيراد نسخة</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('هل تريد استعادة البيانات النموذجية الأولية؟ سيتم مسح التغييرات غير المحفوظة.')) {
                onResetData();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط المصنع</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">الحجوزات المسجلة</span>
            <CalendarClock className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{bookings.length}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            منها {pendingBookings.length} في انتظار التأكيد
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">الزيارات المنزلية</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{homeVisitsCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            سحب منزلي في القاهرة والجيزة
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">فحوصات المختبر LIS</span>
            <FlaskConical className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{orders.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {orders.filter(o => o.overallStatus === 'released').length} تقرير معتمد
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold">إجمالي الإيرادات المقدرة</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-teal-700">{totalRevenue} <span className="text-xs font-bold text-slate-600">ج.م</span></div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            شامل باقات الفحص والعروض
          </div>
        </div>
      </div>

      {/* Admin Subtabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 mb-6 pb-2">
        <button
          onClick={() => setActiveAdminSubTab('bookings')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeAdminSubTab === 'bookings'
              ? 'bg-rose-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          إدارة الحجوزات والزيارات ({bookings.length})
        </button>

        <button
          onClick={() => setActiveAdminSubTab('packages')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeAdminSubTab === 'packages'
              ? 'bg-rose-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          باقات الفحوصات والعروض ({packages.length})
        </button>

        <button
          onClick={() => setActiveAdminSubTab('tests')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeAdminSubTab === 'tests'
              ? 'bg-rose-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          إدارة أسعار الكتالوج والفحوصات
        </button>

        <button
          onClick={() => setActiveAdminSubTab('settings')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeAdminSubTab === 'settings'
              ? 'bg-rose-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          إعدادات المختبر والنسب المالية
        </button>
      </div>

      {/* SUBTAB: Packages Management (باقات التحاليل قابلة للتعديل من حيث التحاليل والسعر) */}
      {activeAdminSubTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">إدارة وتعديل باقات الفحوصات الطبية والعروض</h3>
              <p className="text-xs text-slate-500">
                التحكم في أسعار الباقات، الفحوصات المشمولة في كل باقة، ونسب الخصم المباشر للمرضى
              </p>
            </div>
            {onAddPackage && (
              <button
                onClick={() => {
                  const newPkg: HealthPackage = {
                    id: `pkg-${Date.now()}`,
                    titleAr: 'باقة فحص جديدة',
                    titleEn: 'New Health Package',
                    badge: 'فحص مخصص',
                    descriptionAr: 'باقة مخصصة تم إنشاؤها من لوحة التحكم',
                    testIds: ['test-cbc', 'test-liver'],
                    originalPrice: 400,
                    discountedPrice: 320,
                    iconName: 'Sparkles',
                    popular: false
                  };
                  onAddPackage(newPkg);
                  setEditingPackage(newPkg);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة باقة فحص جديدة</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div 
                key={pkg.id} 
                className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-100 text-rose-900">
                      {pkg.badge}
                    </span>
                    <button
                      onClick={() => setEditingPackage(pkg)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-900 hover:bg-rose-50"
                      title="تعديل الباقة"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="font-black text-slate-950 text-base mb-1">{pkg.titleAr}</h4>
                  <div className="text-xs text-slate-500 font-mono mb-2">{pkg.titleEn}</div>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">{pkg.descriptionAr}</p>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">السعر قبل الخصم:</span>
                      <span className="line-through text-slate-400 font-mono">{pkg.originalPrice} ج.م</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-700 font-bold">السعر المخفض للجمهور:</span>
                      <span className="font-black text-rose-900 font-mono text-sm">{pkg.discountedPrice} ج.م</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-emerald-700 font-bold pt-1 border-t border-slate-200">
                      <span>وفر للمريض:</span>
                      <span>{pkg.originalPrice - pkg.discountedPrice} ج.م ({Math.round(((pkg.originalPrice - pkg.discountedPrice) / pkg.originalPrice) * 100)}%)</span>
                    </div>
                  </div>

                  <div className="text-xs">
                    <span className="text-slate-500 font-bold block mb-1">التحاليل المشمولة ({pkg.testIds.length}):</span>
                    <div className="flex flex-wrap gap-1">
                      {pkg.testIds.map(tid => {
                        const t = tests.find(x => x.id === tid);
                        return (
                          <span key={tid} className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {t?.nameAr || tid}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => setEditingPackage(pkg)}
                    className="w-full py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-900 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>تعديل السعر والتحاليل</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal: Edit Package Details and Included Tests */}
          {editingPackage && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl p-6 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                  <h3 className="font-extrabold text-slate-900 text-base">تعديل باقة التحاليل: {editingPackage.titleAr}</h3>
                  <button onClick={() => setEditingPackage(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (onUpdatePackage) onUpdatePackage(editingPackage);
                  setEditingPackage(null);
                }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">اسم الباقة (بالعربية)</label>
                      <input
                        type="text"
                        required
                        value={editingPackage.titleAr}
                        onChange={(e) => setEditingPackage({ ...editingPackage, titleAr: e.target.value })}
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">اسم الباقة (بالإنجليزية)</label>
                      <input
                        type="text"
                        value={editingPackage.titleEn}
                        onChange={(e) => setEditingPackage({ ...editingPackage, titleEn: e.target.value })}
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">السعر الأصلي (ج.م)</label>
                      <input
                        type="number"
                        value={editingPackage.originalPrice}
                        onChange={(e) => setEditingPackage({ ...editingPackage, originalPrice: Number(e.target.value) })}
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">السعر بعد الخصم (ج.م)</label>
                      <input
                        type="number"
                        value={editingPackage.discountedPrice}
                        onChange={(e) => setEditingPackage({ ...editingPackage, discountedPrice: Number(e.target.value) })}
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">شارة الباقة (Badge)</label>
                      <input
                        type="text"
                        value={editingPackage.badge}
                        onChange={(e) => setEditingPackage({ ...editingPackage, badge: e.target.value })}
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">وصف الباقة وملاحظات الفحص</label>
                    <textarea
                      rows={2}
                      value={editingPackage.descriptionAr}
                      onChange={(e) => setEditingPackage({ ...editingPackage, descriptionAr: e.target.value })}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      التحاليل المشمولة في الباقة (اضغط للتحديد أو الإلغاء):
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-2 bg-slate-50">
                      {tests.map(test => {
                        const isChecked = editingPackage.testIds.includes(test.id);
                        return (
                          <label key={test.id} className="flex items-center gap-2 text-xs bg-white p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-rose-50">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const newTestIds = isChecked
                                  ? editingPackage.testIds.filter(id => id !== test.id)
                                  : [...editingPackage.testIds, test.id];
                                setEditingPackage({ ...editingPackage, testIds: newTestIds });
                              }}
                              className="rounded text-rose-900 focus:ring-rose-800"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{test.nameAr}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{test.code}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditingPackage(null)}
                      className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-bold"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold shadow-md shadow-rose-950/20"
                    >
                      حفظ تعديلات الباقة
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 1: Bookings Management */}
      {activeAdminSubTab === 'bookings' && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
                  <th className="py-3.5 px-4 text-right">رقم الحجز</th>
                  <th className="py-3.5 px-4 text-right">بيانات المريض</th>
                  <th className="py-3.5 px-4 text-right">الخدمة والعنوان</th>
                  <th className="py-3.5 px-4 text-right">الموعد والتاريخ</th>
                  <th className="py-3.5 px-4 text-right">السعر</th>
                  <th className="py-3.5 px-4 text-center">الحالة الحالية</th>
                  <th className="py-3.5 px-4 text-center">الإجراء والتحويل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => {
                  const isTransferred = Boolean(booking.transferredToLisOrderId);

                  return (
                    <tr key={booking.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Booking Code */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {booking.bookingNumber}
                        </span>
                      </td>

                      {/* Patient Name & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">{booking.patientName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{booking.patientPhone}</span>
                        </div>
                      </td>

                      {/* Service & Address */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                        <div className="font-bold text-slate-800">
                          {booking.serviceType === 'home_visit' ? 'زيارة منزلية' : 'فرع المختبر'}
                        </div>
                        <div className="text-slate-500 truncate" title={booking.address}>
                          {booking.address}
                        </div>
                        {booking.technicianName && (
                          <div className="text-teal-700 font-bold text-[11px] mt-0.5">
                            الفني: {booking.technicianName}
                          </div>
                        )}
                      </td>

                      {/* Visit Date & Time */}
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-slate-800">{booking.visitDate}</div>
                        <div className="text-slate-500">{booking.visitTime}</div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-bold text-teal-800 text-xs">
                        {booking.finalPrice} ج.م
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <select
                          value={booking.status}
                          onChange={(e) => onUpdateBookingStatus(booking.id, e.target.value as BookingStatus)}
                          className="text-xs font-bold border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="pending">قيد الانتظار</option>
                          <option value="confirmed">تم التأكيد</option>
                          <option value="technician_assigned">تم تعيين الفني</option>
                          <option value="sample_collected">تم سحب العينة</option>
                          <option value="processing">جاري التحليل بالمختبر</option>
                          <option value="completed">مكتمل</option>
                          <option value="cancelled">ملغي</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Transfer to LIS button */}
                          {!isTransferred ? (
                            <button
                              type="button"
                              onClick={() => onTransferBookingToLis(booking)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-colors"
                              title="إنشاء فحص واستقبال العينة مباشرة في الـ LIS"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              <span>تحويل للـ LIS</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>تم التحويل</span>
                            </span>
                          )}

                          {/* Assign Technician */}
                          <button
                            type="button"
                            onClick={() => setSelectedBookingForTech(booking)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="تعيين فني السحب"
                          >
                            <Users className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => onDeleteBooking(booking.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="حذف الحجز"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Catalog Price Management */}
      {activeAdminSubTab === 'tests' && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm">قائمة أسعار الفحوصات والتحاليل الطبية</h3>
            <span className="text-xs text-slate-500">يمكنك تعديل أسعار التحاليل مباشرة لحساب تكلفة الحجوزات</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold text-xs border-b border-slate-200">
                  <th className="py-3 px-4">كود الفحص</th>
                  <th className="py-3 px-4">اسم الفحص</th>
                  <th className="py-3 px-4">القسم المخبري</th>
                  <th className="py-3 px-4">نوع الأنبوب والعينة</th>
                  <th className="py-3 px-4">السعر الحالي (ج.م)</th>
                  <th className="py-3 px-4 text-center">تعديل السعر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tests.map(test => (
                  <tr key={test.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-slate-800">{test.code}</td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900">{test.nameAr}</div>
                      <div className="text-xs text-slate-500 font-sans">{test.nameEn}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{test.categoryAr}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{test.tubeName}</td>
                    <td className="py-3 px-4 font-black text-teal-700 text-sm">
                      {editingPriceTestId === test.id ? (
                        <input
                          type="number"
                          value={newPriceVal}
                          onChange={(e) => setNewPriceVal(Number(e.target.value))}
                          className="w-24 p-1.5 rounded-lg border border-teal-500 text-sm font-bold"
                        />
                      ) : (
                        <span>{test.price} ج.م</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {editingPriceTestId === test.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateTestPrice(test.id, newPriceVal);
                              setEditingPriceTestId(null);
                            }}
                            className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                          >
                            حفظ
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPriceTestId(null)}
                            className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-xs font-bold"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPriceTestId(test.id);
                            setNewPriceVal(test.price);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Settings Form */}
      {activeAdminSubTab === 'settings' && (
        <form onSubmit={handleSaveSettingsForm} className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200 space-y-6 max-w-4xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">هوية وبيانات المختبر المعتمدة والنسب المالية</h3>
              <p className="text-xs text-slate-500">
                تظهر هذه البيانات في رأس وتذييل التقارير الطبية وشيتات السحب ونظام احتساب الأرباح
              </p>
            </div>
            {savedSettingsSuccess && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم حفظ الإعدادات وتحديثها في السيستم</span>
              </span>
            )}
          </div>

          {/* Section 1: Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المعامل الرسمي (بالعربية)</label>
              <input
                type="text"
                value={formData.labNameAr}
                onChange={(e) => setFormData({ ...formData, labNameAr: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اسم المعامل (بالإنجليزية)</label>
              <input
                type="text"
                value={formData.labNameEn}
                onChange={(e) => setFormData({ ...formData, labNameEn: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الوصف الفرعي / هوية المعامل</label>
            <input
              type="text"
              value={formData.subTitleAr}
              onChange={(e) => setFormData({ ...formData, subTitleAr: e.target.value })}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900"
            />
          </div>

          {/* Section 2: Phones & Address (3 Official Lab Phones) */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-rose-900" />
              <span>أرقام تليفونات المعامل المعتمدة والفرع الرئيسي:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">هاتف المختبر 1 (أساسي)</label>
                <input
                  type="text"
                  value={formData.phonePrimary}
                  onChange={(e) => setFormData({ ...formData, phonePrimary: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">هاتف المختبر 2</label>
                <input
                  type="text"
                  value={formData.phoneSecondary}
                  onChange={(e) => setFormData({ ...formData, phoneSecondary: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">هاتف المختبر 3</label>
                <input
                  type="text"
                  value={formData.phoneThird || '01013242777'}
                  onChange={(e) => setFormData({ ...formData, phoneThird: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الواتساب المعتمد لنتائج التحاليل</label>
              <input
                type="text"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الفرع الرئيسي للمختبر</label>
              <input
                type="text"
                value={formData.addressAr}
                onChange={(e) => setFormData({ ...formData, addressAr: e.target.value, branchMain: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900"
              />
            </div>
          </div>

          {/* Section 3: Directors & Clinical Authorities */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-900" />
              <span>الإدارة الطبية والفنية (اعتماد التقارير):</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المدير الفني للمختبر</label>
                <input
                  type="text"
                  value={formData.directorNameAr}
                  onChange={(e) => setFormData({ ...formData, directorNameAr: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الدرجة والصفة العلمية للمدير الفني</label>
                <input
                  type="text"
                  value={formData.directorTitleAr}
                  onChange={(e) => setFormData({ ...formData, directorTitleAr: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">استشاري وطبيب الباثولوجيا الإكلينيكية</label>
                <input
                  type="text"
                  value={formData.clinicalDoctorNameAr || 'د. رامي مختار'}
                  onChange={(e) => setFormData({ ...formData, clinicalDoctorNameAr: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الدرجة العلمية والجهة</label>
                <input
                  type="text"
                  value={formData.clinicalDoctorTitleAr || 'طبيب الباثولوجيا الإكلينيكية - كلية طب قصر العيني'}
                  onChange={(e) => setFormData({ ...formData, clinicalDoctorTitleAr: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Financial Profit Sharing & Loyalty Policies */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-emerald-700" />
              <span>سياسات النسب المالية للأرباح وكروت الولاء (تحددها الإدارة المالية):</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">نسبة الـ CEO من صافي الربح (%)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.ceoSharePercentage || 40}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormData({ 
                        ...formData, 
                        ceoSharePercentage: val,
                        labSharePercentage: Math.max(0, 100 - val)
                      });
                    }}
                    className="w-full text-xs font-mono font-bold p-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900 text-center"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">نسبة المعمل والتطوير (%)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.labSharePercentage || 60}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormData({ 
                        ...formData, 
                        labSharePercentage: val,
                        ceoSharePercentage: Math.max(0, 100 - val)
                      });
                    }}
                    className="w-full text-xs font-mono font-bold p-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900 text-center"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">نقاط الولاء لكل 1 ج.م مدفوع</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.05"
                    min={0}
                    value={formData.pointsPerPoundSpent || 0.1}
                    onChange={(e) => setFormData({ ...formData, pointsPerPoundSpent: Number(e.target.value) })}
                    className="w-full text-xs font-mono font-bold p-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900 text-center"
                  />
                  <span className="text-xs font-bold text-slate-500">نقطة</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">خصم كروت الولاء الافتراضي (%)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.defaultDiscountPercentage || 15}
                    onChange={(e) => setFormData({ ...formData, defaultDiscountPercentage: Number(e.target.value) })}
                    className="w-full text-xs font-mono font-bold p-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900 text-center"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-white font-bold text-xs shadow-md shadow-rose-950/20 transition-all hover:scale-102"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الإعدادات والسياسات المالية</span>
            </button>
          </div>
        </form>
      )}

      {/* Technician Assign Dialog */}
      {selectedBookingForTech && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="font-black text-slate-900 text-base mb-1">تعيين فني سحب العينة للزيارة</h3>
            <p className="text-xs text-slate-500 mb-4">
              الحجز رقم <strong>{selectedBookingForTech.bookingNumber}</strong> للمريض: {selectedBookingForTech.patientName}
            </p>

            <form onSubmit={handleAssignTechSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختر أخصائي سحب العينات:</label>
                <select
                  value={assignTechName}
                  onChange={(e) => setAssignTechName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50"
                >
                  <option value="كيميائي / هاني عبد الفتاح (خبير أوردة دقيقة)">كيميائي / هاني عبد الفتاح (خبير أوردة دقيقة)</option>
                  <option value="ممرض / كريم الدسوقي (زيارات كبار السن)">ممرض / كريم الدسوقي (زيارات كبار السن والأطفال)</option>
                  <option value="أخصائية / منى الشربيني (زيارات سيدات وأطفال)">أخصائية / منى الشربيني (زيارات سيدات وأطفال)</option>
                  <option value="كيميائي / أحمد الصاوي (منطقة 6 أكتوبر وزايد)">كيميائي / أحمد الصاوي (منطقة 6 أكتوبر وزايد)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForTech(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
                >
                  تعيين وتأكيد الموعد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
