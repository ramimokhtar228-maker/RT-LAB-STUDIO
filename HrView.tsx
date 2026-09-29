import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  UserCheck, 
  UserX, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  Briefcase, 
  DollarSign, 
  X, 
  FileSpreadsheet,
  Printer,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Award,
  Zap,
  Edit
} from 'lucide-react';
import { StaffMember, AttendanceRecord, StaffRole } from '../types';

interface HrViewProps {
  staff: StaffMember[];
  attendance: AttendanceRecord[];
  onAddStaff: (member: StaffMember) => void;
  onUpdateStaff?: (member: StaffMember) => void;
  onUpdateStaffStatus: (staffId: string, status: StaffMember['status']) => void;
  onRecordAttendance: (record: AttendanceRecord) => void;
}

export const HrView: React.FC<HrViewProps> = ({
  staff,
  attendance,
  onAddStaff,
  onUpdateStaff,
  onUpdateStaffStatus,
  onRecordAttendance
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'payroll' | 'staff'>('attendance');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<'all' | 'morning' | 'evening'>('all');

  // Adjust compensation modal state
  const [adjustingStaff, setAdjustingStaff] = useState<StaffMember | null>(null);
  const [adjustType, setAdjustType] = useState<'incentive' | 'bonus' | 'overtime' | 'deduction'>('incentive');
  const [adjustAmount, setAdjustAmount] = useState<number>(200);
  const [adjustNotes, setAdjustNotes] = useState('');

  // New Staff Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('lab_specialist');
  const [department, setDepartment] = useState('قسم الكيمياء والدم');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [baseSalary, setBaseSalary] = useState(6500);
  const [shift, setShift] = useState<'morning' | 'evening' | 'rotating'>('morning');

  const todayStr = new Date().toISOString().split('T')[0];

  const roleNameMap: Record<StaffRole, string> = {
    consultant_doctor: 'طبيب استشاري تحاليل',
    technical_director: 'المدير الفني للمختبر',
    lab_specialist: 'أخصائي تحاليل طبية (كيميائي)',
    phlebotomist: 'فني سحب عينات منزلي ومعملي',
    receptionist: 'موظف استقبال وخدمة عملاء',
    nurse: 'تمريض معملي ورعاية',
    accountant: 'محاسب ومسئول خزينة'
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newStaff: StaffMember = {
      id: `staff-${Date.now()}`,
      code: `EMP-0${staff.length + 1}`,
      name,
      role,
      roleAr: roleNameMap[role],
      department,
      phone,
      nationalId: nationalId || '29000000000000',
      hireDate: todayStr,
      baseSalary: Number(baseSalary) || 5000,
      shift,
      status: 'active',
      incentives: 0,
      bonuses: 0,
      overtimeHours: 0,
      overtimeHourlyRate: Math.round((Number(baseSalary) || 5000) / (30 * 8) * 1.5),
      deductions: 0
    };

    onAddStaff(newStaff);
    setShowAddStaffModal(false);
    setName('');
    setPhone('');
  };

  // Quick Check-in for employee today
  const handleQuickCheckIn = (member: StaffMember) => {
    const existing = attendance.find(a => a.staffId === member.id && a.date === todayStr);
    if (existing) {
      alert(`الموظف ${member.name} مسجل حضوره بالفعل اليوم الساعة ${existing.checkInTime}`);
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const shiftExpectedHour = member.shift === 'morning' ? 9 : 15;
    const currentHour = now.getHours();
    const isLate = currentHour > shiftExpectedHour;

    const record: AttendanceRecord = {
      id: `att-${Date.now()}`,
      staffId: member.id,
      staffName: member.name,
      staffRole: member.roleAr,
      date: todayStr,
      checkInTime: timeStr,
      shift: member.shift === 'evening' ? 'evening' : 'morning',
      status: isLate ? 'late' : 'present',
      delayMinutes: isLate ? (currentHour - shiftExpectedHour) * 60 + now.getMinutes() : 0,
      notes: isLate ? 'حضور متأخر عن الموعد' : 'حضور في الموعد المحدد'
    };

    onRecordAttendance(record);
  };

  // Quick Check-out
  const handleQuickCheckOut = (recordId: string) => {
    const timeStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const rec = attendance.find(a => a.id === recordId);
    if (rec) {
      onRecordAttendance({ ...rec, checkOutTime: timeStr });
    }
  };

  // Adjust compensation handler
  const handleSaveCompensationAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingStaff || !onUpdateStaff) return;

    let updated = { ...adjustingStaff };
    if (adjustType === 'incentive') {
      updated.incentives = (updated.incentives || 0) + Number(adjustAmount);
    } else if (adjustType === 'bonus') {
      updated.bonuses = (updated.bonuses || 0) + Number(adjustAmount);
    } else if (adjustType === 'overtime') {
      const addedHours = Number(adjustAmount);
      updated.overtimeHours = (updated.overtimeHours || 0) + addedHours;
    } else if (adjustType === 'deduction') {
      updated.deductions = (updated.deductions || 0) + Number(adjustAmount);
    }

    onUpdateStaff(updated);
    setAdjustingStaff(null);
  };

  // KPI calculations
  const presentCount = attendance.filter(a => a.date === todayStr && (a.status === 'present' || a.status === 'late')).length;
  const lateCount = attendance.filter(a => a.date === todayStr && a.status === 'late').length;
  const absentCount = staff.filter(s => s.status === 'active').length - presentCount;

  // Calculate Net Salary for a staff member
  const calculateNetSalary = (m: StaffMember) => {
    const base = m.baseSalary || 0;
    const inc = m.incentives || 0;
    const bon = m.bonuses || 0;
    const otRate = m.overtimeHourlyRate || Math.round(base / (30 * 8) * 1.5);
    const otTotal = (m.overtimeHours || 0) * otRate;
    const ded = m.deductions || 0;
    return Math.max(0, base + inc + bon + otTotal - ded);
  };

  const totalPayrollAmount = staff.reduce((sum, m) => sum + calculateNetSalary(m), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-rose-100 text-rose-950 border border-rose-200">
              <Users className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900">الموارد البشرية وفريق العمل (HR & Attendance)</h1>
              <p className="text-xs text-slate-500 font-medium">
                حساب الحضور والانصراف، الخصومات، الحوافز، الأوفر تايم، المكافآت، والمسمى الوظيفي لكل موظف
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddStaffModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-950 to-rose-900 hover:from-rose-900 hover:to-rose-800 text-white font-bold text-xs shadow-md shadow-rose-950/20 transition-all hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة موظف / كادر طبي جديد</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-bold">حضور اليوم بالمعمل</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{presentCount} موظف</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">مسجلين في الوردية</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-bold">تأخيرات الوردية اليوم</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{lateCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">تأخير بعد موعد الوردية</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-bold">إجمالي ساعات الأوفر تايم</span>
            <Zap className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-2xl font-black text-blue-950">
            {staff.reduce((sum, m) => sum + (m.overtimeHours || 0), 0)} <span className="text-xs font-normal">ساعة</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">إضافي نبطشيات وسحب منزلي</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-bold">إجمالي مسير الرواتب الصافي</span>
            <DollarSign className="w-4 h-4 text-rose-900" />
          </div>
          <div className="text-2xl font-black text-rose-950">
            {totalPayrollAmount.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">شامل الحوافز والمكافآت والخصم</div>
        </div>
      </div>

      {/* Subtabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 mb-6 pb-2">
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'attendance'
              ? 'bg-rose-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          سجل الحضور والانصراف اليومي ({attendance.filter(a => a.date === todayStr).length})
        </button>

        <button
          onClick={() => setActiveSubTab('payroll')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'payroll'
              ? 'bg-rose-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          كشف الرواتب، الحوافز، الأوفر تايم، والمكافآت الاحترافي
        </button>

        <button
          onClick={() => setActiveSubTab('staff')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'staff'
              ? 'bg-rose-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          دليل وبيانات الكادر الطبي ({staff.length})
        </button>
      </div>

      {/* SUBTAB 1: Daily Attendance */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-6">
          {/* Quick Punch In/Out Action Cards */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200">
            <h3 className="font-extrabold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-900" />
              <span>تسجيل بصمة الحضور والانصراف السريع اليوم ({todayStr}):</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {staff.filter(s => s.status === 'active').map((member) => {
                const record = attendance.find(a => a.staffId === member.id && a.date === todayStr);
                const isCheckedIn = !!record;
                const isCheckedOut = !!record?.checkOutTime;

                return (
                  <div key={member.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-black text-slate-900 text-xs">{member.name}</span>
                        <span className="text-[10px] font-bold text-rose-950 bg-rose-100 px-2 py-0.5 rounded-full">
                          {member.roleAr}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        الوردية: {member.shift === 'morning' ? 'صباحي (09:00 ص)' : 'مسائي (03:00 م)'}
                      </div>

                      {record && (
                        <div className="mt-2 text-[11px] font-mono space-y-0.5">
                          <span className="text-emerald-700 block font-bold">✓ حضور: {record.checkInTime}</span>
                          {record.checkOutTime && (
                            <span className="text-slate-600 block">✓ انصراف: {record.checkOutTime}</span>
                          )}
                          {record.delayMinutes > 0 && (
                            <span className="text-amber-700 block font-bold">⚠️ تأخير: {record.delayMinutes} دقيقة</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-200 flex gap-2">
                      {!isCheckedIn ? (
                        <button
                          onClick={() => handleQuickCheckIn(member)}
                          className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          تسجيل حضور الآن
                        </button>
                      ) : !isCheckedOut ? (
                        <button
                          onClick={() => handleQuickCheckOut(record!.id)}
                          className="w-full py-1.5 bg-rose-950 hover:bg-rose-900 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          تسجيل انصراف
                        </button>
                      ) : (
                        <span className="w-full text-center py-1 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold">
                          تم إنهاء الوردية
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Attendance Ledger Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-extrabold text-xs text-slate-800">
              سجل تفاصيل الحضور والانصراف اليومي
            </div>
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">اسم الموظف</th>
                  <th className="py-3 px-4">المسمى الوظيفي</th>
                  <th className="py-3 px-4">الوردية</th>
                  <th className="py-3 px-4">وقت الحضور</th>
                  <th className="py-3 px-4">وقت الانصراف</th>
                  <th className="py-3 px-4">الحالة والتأخير</th>
                  <th className="py-3 px-4">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.filter(a => a.date === todayStr).map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{rec.staffName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{rec.staffRole}</td>
                    <td className="py-3 px-4 text-slate-600">{rec.shift === 'morning' ? 'صباحي' : 'مسائي'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">{rec.checkInTime}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{rec.checkOutTime || '---'}</td>
                    <td className="py-3 px-4">
                      {rec.status === 'late' ? (
                        <span className="inline-block bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          تأخير {rec.delayMinutes} د
                        </span>
                      ) : (
                        <span className="inline-block bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          في الموعد
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{rec.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Professional Payroll, Incentives, Overtime & Deductions */}
      {activeSubTab === 'payroll' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                كشف الرواتب ومسير المستحقات والبدلات (Professional Payroll)
              </h3>
              <p className="text-xs text-slate-500">
                حساب الراتب الأساسي + الحوافز + المكافآت + الأوفر تايم - الخصومات والجزاءات = صافي المرتب
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة مسير الرواتب المعتمد A4</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                    <th className="py-3 px-4">الكود والاسم</th>
                    <th className="py-3 px-4">المسمى الوظيفي</th>
                    <th className="py-3 px-4">الراتب الأساسي</th>
                    <th className="py-3 px-4 text-emerald-800">حوافز (+)</th>
                    <th className="py-3 px-4 text-teal-800">مكافآت (+)</th>
                    <th className="py-3 px-4 text-blue-900">أوفر تايم (ساعات ومبلغ)</th>
                    <th className="py-3 px-4 text-rose-900">خصومات (-)</th>
                    <th className="py-3 px-4 font-black">صافي المرتب المستحق</th>
                    <th className="py-3 px-4 text-center">إجراء مالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staff.map((m) => {
                    const base = m.baseSalary || 0;
                    const inc = m.incentives || 0;
                    const bon = m.bonuses || 0;
                    const otHours = m.overtimeHours || 0;
                    const otRate = m.overtimeHourlyRate || Math.round(base / (30 * 8) * 1.5);
                    const otAmount = otHours * otRate;
                    const ded = m.deductions || 0;
                    const net = calculateNetSalary(m);

                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-900 block">{m.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{m.code}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-blue-950">{m.roleAr}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{base.toLocaleString()} ج.م</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">+{inc.toLocaleString()} ج.م</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-teal-700">+{bon.toLocaleString()} ج.م</td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-blue-900 block">+{otAmount.toLocaleString()} ج.م</span>
                          <span className="text-[10px] text-slate-500 font-mono">({otHours} س @ {otRate} ج/س)</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-rose-900">-{ded.toLocaleString()} ج.م</td>
                        <td className="py-3.5 px-4 font-black text-sm font-mono text-rose-950 bg-rose-50/50">
                          {net.toLocaleString()} ج.م
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setAdjustingStaff(m);
                              setAdjustType('incentive');
                              setAdjustAmount(200);
                              setAdjustNotes('');
                            }}
                            className="p-1.5 rounded-lg text-rose-950 hover:bg-rose-100 transition-colors"
                            title="تعديل الحوافز أو الخصم أو الأوفرتايم"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={7} className="py-3 px-4 text-left font-bold">إجمالي المستحقات الصافية لجميع الموظفين:</td>
                    <td colSpan={2} className="py-3 px-4 text-base font-black text-rose-950 font-mono">
                      {totalPayrollAmount.toLocaleString()} ج.م
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Modal: Adjust Staff Compensation */}
          {adjustingStaff && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      تعديل الحوافز / الخصم للموظف: {adjustingStaff.name}
                    </h3>
                    <div className="text-xs text-blue-900 font-bold">{adjustingStaff.roleAr}</div>
                  </div>
                  <button onClick={() => setAdjustingStaff(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <form onSubmit={handleSaveCompensationAdjustment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">نوع الحركة المالية:</label>
                    <select
                      value={adjustType}
                      onChange={(e) => setAdjustType(e.target.value as any)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900 bg-white"
                    >
                      <option value="incentive">إضافة حافز شهري (+)</option>
                      <option value="bonus">مكافأة تميز (+)</option>
                      <option value="overtime">إضافة ساعات أوفر تايم (+)</option>
                      <option value="deduction">تسجيل خصم / جزاء غياب أو تأخير (-)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {adjustType === 'overtime' ? 'عدد الساعات الإضافية (ساعة):' : 'المبلغ بالجنيه (ج.م):'}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(Number(e.target.value))}
                      className="w-full text-sm font-black p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">سبب أو بيان التعديل:</label>
                    <input
                      type="text"
                      placeholder="مثال: نبطشية إضافية يوم الجمعة، تميز في السحب المنزلي..."
                      value={adjustNotes}
                      onChange={(e) => setAdjustNotes(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-900"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setAdjustingStaff(null)}
                      className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-bold"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-white text-xs font-bold shadow-md shadow-rose-950/20"
                    >
                      تأكيد وحفظ في مسير الرواتب
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: Staff Directory */}
      {activeSubTab === 'staff' && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">كود الموظف</th>
                  <th className="py-3 px-4">الاسم بالكامل</th>
                  <th className="py-3 px-4">المسمى الوظيفي</th>
                  <th className="py-3 px-4">القسم والوحدة</th>
                  <th className="py-3 px-4">رقم الموبايل</th>
                  <th className="py-3 px-4">الراتب الأساسي</th>
                  <th className="py-3 px-4">الوردية</th>
                  <th className="py-3 px-4 text-center">حالة العمل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{m.code}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">{m.name}</td>
                    <td className="py-3 px-4 font-bold text-blue-900">{m.roleAr}</td>
                    <td className="py-3 px-4 text-slate-600">{m.department}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{m.phone}</td>
                    <td className="py-3 px-4 font-bold text-rose-900">{m.baseSalary.toLocaleString()} ج.م</td>
                    <td className="py-3 px-4 text-slate-600">
                      {m.shift === 'morning' ? 'صباحي (09:00 ص)' : 'مسائي (03:00 م)'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={m.status}
                        onChange={(e) => onUpdateStaffStatus(m.id, e.target.value as StaffMember['status'])}
                        className="text-[11px] font-bold border border-slate-200 rounded-lg px-2 py-1 bg-white"
                      >
                        <option value="active">على رأس العمل</option>
                        <option value="on_leave">في إجازة</option>
                        <option value="inactive">غير نشط</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Add New Staff Member */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-950" />
                <h3 className="font-extrabold text-slate-900 text-base">إضافة عضو جديد لفريق العمل</h3>
              </div>
              <button onClick={() => setShowAddStaffModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الموظف بالكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: د. مروان أشرف فهمي"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المسمى الوظيفي *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as StaffRole)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800 bg-white"
                  >
                    <option value="lab_specialist">أخصائي تحاليل (كيميائي)</option>
                    <option value="consultant_doctor">طبيب استشاري تحاليل</option>
                    <option value="phlebotomist">فني سحب عينات</option>
                    <option value="receptionist">موظف استقبال</option>
                    <option value="nurse">تمريض معملي</option>
                    <option value="accountant">محاسب</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الموبايل *</label>
                  <input
                    type="tel"
                    required
                    placeholder="010xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الرقم القومي</label>
                  <input
                    type="text"
                    placeholder="14 رقم"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الراتب الأساسي (ج.م)</label>
                  <input
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(Number(e.target.value))}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الوردية</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800 bg-white"
                  >
                    <option value="morning">وردية صباحية (09:00 ص - 04:00 م)</option>
                    <option value="evening">وردية مسائية (03:00 م - 11:00 م)</option>
                    <option value="rotating">متناوب</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-rose-950 to-rose-900 hover:from-rose-900 hover:to-rose-800 text-white text-xs font-bold shadow-md shadow-rose-950/20"
                >
                  حفظ وتسجيل الموظف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
