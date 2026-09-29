import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Printer, 
  CheckCircle2, 
  X, 
  CreditCard, 
  Building, 
  Calendar,
  PieChart,
  UserCheck,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Sliders,
  Save,
  Clock
} from 'lucide-react';
import { FinancialTransaction, TransactionType, PaymentMethod, LabOrder, Booking, LabSettings } from '../types';

interface FinanceViewProps {
  transactions: FinancialTransaction[];
  orders?: LabOrder[];
  bookings?: Booking[];
  settings?: LabSettings;
  onAddTransaction: (tx: FinancialTransaction) => void;
  onUpdateSettings?: (settings: LabSettings) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  transactions,
  orders = [],
  bookings = [],
  settings,
  onAddTransaction,
  onUpdateSettings
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'expenses' | 'patient_accounts' | 'profit_sharing'>('ledger');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<FinancialTransaction | null>(null);

  // Expense Subtab Filters
  const [selectedExpensePeriod, setSelectedExpensePeriod] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Profit Sharing Rates State
  const [ceoPercent, setCeoPercent] = useState<number>(() => settings?.ceoSharePercentage ?? 40);
  const [labPercent, setLabPercent] = useState<number>(() => settings?.labSharePercentage ?? 60);
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  // Add Transaction Form State
  const [type, setType] = useState<TransactionType>('income');
  const [category, setCategory] = useState<FinancialTransaction['category']>('patient_receipt');
  const [amount, setAmount] = useState<number>(350);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [partyName, setPartyName] = useState('');
  const [notes, setNotes] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Financial Calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const cashInDrawer = transactions
    .filter(t => t.paymentMethod === 'cash')
    .reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0);

  const netProfit = totalIncome - totalExpense;

  const ceoShareAmount = Math.max(0, Math.round(netProfit * (ceoPercent / 100)));
  const labShareAmount = Math.max(0, Math.round(netProfit * (labPercent / 100)));

  // Filtered Transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSearch = 
      t.txNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.patientOrPartyName && t.patientOrPartyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.categoryAr.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const categoryMap: Record<FinancialTransaction['category'], string> = {
    patient_receipt: 'إيراد فحص / تحليل مريض',
    reagents_purchase: 'شراء كيماويات وكواشف معملية',
    salary_payout: 'صرف رواتب وبدلات الموظفين',
    rent_utilities: 'إيجار المقر، كهرباء ومرافق',
    doctor_commission: 'حسابات ونسب الأطباء المعالجين',
    supplies: 'مستلزمات طبية وأنابيب وسرنجات',
    maintenance: 'صيانة أجهزة المعمل والمعايرة',
    other: 'مصروفات ونثريات إدارية أخرى'
  };

  const paymentMethodMap: Record<PaymentMethod, string> = {
    cash: 'كاش نقدي (الخزينة)',
    visa: 'بطاقة بنكية / فيزا POS',
    vodafone_cash: 'فودافون كاش',
    instapay: 'إنستاباي (InstaPay)',
    bank_transfer: 'تحويل بنكي'
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const now = new Date();

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      txNumber: `RT-TX-${randomSuffix}`,
      type,
      category,
      categoryAr: categoryMap[category],
      amount: Number(amount),
      paymentMethod,
      paymentMethodAr: paymentMethodMap[paymentMethod],
      date: todayStr,
      time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      patientOrPartyName: partyName || (type === 'income' ? 'مريض استقبال' : 'مورد مستلزمات'),
      notes,
      registeredBy: 'د. رامي مختار'
    };

    onAddTransaction(newTx);
    setShowAddModal(false);
    setSelectedTxForReceipt(newTx);
    setAmount(0);
    setPartyName('');
    setNotes('');
  };

  const handleSaveProfitSettings = () => {
    if (onUpdateSettings && settings) {
      onUpdateSettings({
        ...settings,
        ceoSharePercentage: ceoPercent,
        labSharePercentage: labPercent
      });
      setSavedSettingsNotice(true);
      setTimeout(() => setSavedSettingsNotice(false), 3000);
    }
  };

  // Expenses Calculations for Daily & Monthly breakdowns
  const allExpenses = transactions.filter(t => t.type === 'expense');

  const dailyExpensesList = allExpenses.filter(t => t.date === selectedDate);
  const dailyTotalExpense = dailyExpensesList.reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpensesList = allExpenses.filter(t => t.date.startsWith(selectedMonth));
  const monthlyTotalExpense = monthlyExpensesList.reduce((sum, t) => sum + t.amount, 0);

  // Group by category for monthly breakdown
  const monthlyCategoriesGrouped = monthlyExpensesList.reduce((acc, t) => {
    acc[t.categoryAr] = (acc[t.categoryAr] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-rose-100 text-rose-950 border border-rose-200">
              <DollarSign className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900">الماليات والحسابات والخزينة (Finance & Cash Flow)</h1>
              <p className="text-xs text-slate-500 font-medium">
                مصاريف المعمل اليومية والشهرية، حسابات المرضى، سندات الخزينة، ونسب توزيع أرباح CEO والمعمل
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-950 to-rose-900 hover:from-rose-900 hover:to-rose-800 text-white font-bold text-xs shadow-md shadow-rose-950/20 transition-all hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل حركة مالية (قبض / صرف)</span>
        </button>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-bold">إجمالي الإيرادات المقبوضة</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {totalIncome.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">تحاليل وباقات معملية</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-bold">إجمالي المصروفات والنثريات</span>
            <TrendingDown className="w-4 h-4 text-rose-800" />
          </div>
          <div className="text-2xl font-black text-rose-900">
            {totalExpense.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">كواشف، رواتب، مستلزمات</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-bold">رصيد الخزينة النقدي (Cash)</span>
            <Wallet className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-2xl font-black text-blue-950">
            {cashInDrawer.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">نقود فعلية في درج الخزينة</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-bold">صافي الربح الفعلي للمختبر</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-2xl font-black ${netProfit >= 0 ? 'text-teal-700' : 'text-rose-700'}`}>
            {netProfit.toLocaleString()} <span className="text-xs font-normal">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            حصة CEO: {ceoShareAmount.toLocaleString()} ج.م | المعمل: {labShareAmount.toLocaleString()} ج.م
          </div>
        </div>
      </div>

      {/* Subtabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 mb-6 pb-2">
        <button
          onClick={() => setActiveSubTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'ledger'
              ? 'bg-rose-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          حركة الخزينة وسندات القبض والصرف ({transactions.length})
        </button>

        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'expenses'
              ? 'bg-rose-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          تفصيل مصاريف المعمل اليومية والشهرية
        </button>

        <button
          onClick={() => setActiveSubTab('patient_accounts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'patient_accounts'
              ? 'bg-rose-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          حسابات وفواتير المرضى على أعلى دقة
        </button>

        <button
          onClick={() => setActiveSubTab('profit_sharing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'profit_sharing'
              ? 'bg-rose-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          توزيع الأرباح وحصة CEO ونسبة المعمل ({ceoPercent}% / {labPercent}%)
        </button>
      </div>

      {/* TAB 1: Ledger & Transactions */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl shadow-2xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث برقم السند، اسم المريض أو المورد، أو نوع الحركة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-800 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                كل الحركات ({transactions.length})
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  filterType === 'income' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                إيرادات فقط
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  filterType === 'expense' ? 'bg-rose-900 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                مصروفات فقط
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">رقم السند</th>
                    <th className="py-3 px-4">النوع</th>
                    <th className="py-3 px-4">البند والبيان</th>
                    <th className="py-3 px-4">الجهة / المريض / المستلم</th>
                    <th className="py-3 px-4">المبلغ</th>
                    <th className="py-3 px-4">طريقة الدفع</th>
                    <th className="py-3 px-4">التاريخ والوقت</th>
                    <th className="py-3 px-4 text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{tx.txNumber}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {tx.type === 'income' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{tx.type === 'income' ? 'سند قبض' : 'سند صرف'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{tx.categoryAr}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{tx.patientOrPartyName || '-'}</td>
                      <td className={`py-3 px-4 font-black text-sm ${tx.type === 'income' ? 'text-emerald-700' : 'text-rose-900'}`}>
                        {tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString()} ج.م
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-medium">
                          {tx.paymentMethodAr}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {tx.date} {tx.time}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedTxForReceipt(tx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-900 hover:bg-rose-50"
                          title="طباعة إيصال / سند مالي"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Detailed Daily & Monthly Lab Expenses */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">تفصيل وسرد كل مصاريف المعمل اليومية والشهرية</h3>
              <p className="text-xs text-slate-500">
                متابعة دقيقة لبنود الشراء، الكيماويات، الكواشف، صيانة الأجهزة، الرواتب، والإيجار
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setSelectedExpensePeriod('daily')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedExpensePeriod === 'daily' ? 'bg-white text-rose-950 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  عرض يومي
                </button>
                <button
                  onClick={() => setSelectedExpensePeriod('monthly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedExpensePeriod === 'monthly' ? 'bg-white text-rose-950 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  عرض شهري شامل
                </button>
              </div>

              {selectedExpensePeriod === 'daily' ? (
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs font-bold bg-transparent text-slate-800 focus:outline-none"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="text-xs font-bold bg-transparent text-slate-800 focus:outline-none font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Daily View Content */}
          {selectedExpensePeriod === 'daily' ? (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-900 block">إجمالي مصاريف المعمل لتاريخ ({selectedDate}):</span>
                  <div className="text-2xl font-black text-rose-950 mt-0.5">{dailyTotalExpense.toLocaleString()} ج.م</div>
                </div>
                <span className="text-xs font-bold text-rose-800 bg-white/70 px-3 py-1.5 rounded-xl">
                  {dailyExpensesList.length} بنود منصرفة
                </span>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="py-3 px-4">رقم السند</th>
                      <th className="py-3 px-4">بند المصروف</th>
                      <th className="py-3 px-4">المستلم / الجهة</th>
                      <th className="py-3 px-4">المبلغ المنصرف</th>
                      <th className="py-3 px-4">طريقة الدفع</th>
                      <th className="py-3 px-4">الوقت</th>
                      <th className="py-3 px-4">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyExpensesList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                          لا توجد مصروفات مسجلة لهذا اليوم المحدد.
                        </td>
                      </tr>
                    ) : (
                      dailyExpensesList.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">{tx.txNumber}</td>
                          <td className="py-3 px-4 font-black text-slate-900">{tx.categoryAr}</td>
                          <td className="py-3 px-4 text-slate-700">{tx.patientOrPartyName}</td>
                          <td className="py-3 px-4 font-black text-rose-900 text-sm">{tx.amount.toLocaleString()} ج.م</td>
                          <td className="py-3 px-4 text-slate-600">{tx.paymentMethodAr}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">{tx.time}</td>
                          <td className="py-3 px-4 text-slate-500">{tx.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Monthly Breakdown by Category */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-sm">
                  <span className="text-xs text-slate-300 block font-bold">إجمالي مصاريف شهر {selectedMonth}</span>
                  <div className="text-3xl font-black text-amber-400 mt-1">{monthlyTotalExpense.toLocaleString()} ج.م</div>
                  <span className="text-[11px] text-slate-400 block mt-1">تغطي كافة الاحتياجات التشغيلية</span>
                </div>

                <div className="bg-emerald-950 text-white p-5 rounded-3xl shadow-sm">
                  <span className="text-xs text-emerald-200 block font-bold">إيرادات نفس الشهر ({selectedMonth})</span>
                  <div className="text-3xl font-black text-emerald-300 mt-1">
                    {transactions
                      .filter(t => t.type === 'income' && t.date.startsWith(selectedMonth))
                      .reduce((sum, t) => sum + t.amount, 0).toLocaleString()} ج.م
                  </div>
                  <span className="text-[11px] text-emerald-300/80 block mt-1">من فواتير تحاليل المرضى</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 block font-bold">نسبة المصروفات من الإيراد</span>
                  <div className="text-3xl font-black text-rose-900 mt-1">
                    {monthlyTotalExpense > 0 ? (
                      `${Math.round((monthlyTotalExpense / Math.max(1, transactions.filter(t => t.type === 'income' && t.date.startsWith(selectedMonth)).reduce((sum, t) => sum + t.amount, 0))) * 100)}%`
                    ) : '0%'}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">معدل تشغيل ممتاز وآمن</span>
                </div>
              </div>

              {/* Categorized Bar Breakdown */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
                <h4 className="font-black text-sm text-slate-900">توزيع مصاريف الشهر حسب بنود التشغيل:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(monthlyCategoriesGrouped).map(([catName, catTotal]) => {
                    const percent = monthlyTotalExpense > 0 ? Math.round((catTotal / monthlyTotalExpense) * 100) : 0;
                    return (
                      <div key={catName} className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="font-extrabold text-slate-800">{catName}</span>
                          <span className="font-black text-rose-900 font-mono">{catTotal.toLocaleString()} ج.م ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-rose-900 h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Patient Accounts Ledger (حسابات المرضى على أعلى دقة) */}
      {activeSubTab === 'patient_accounts' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">سجل حسابات وفواتير المرضى بدقة متناهية</h3>
              <p className="text-xs text-slate-500">
                تتبع إجمالي حساب الفحوصات، الخصومات الممنوحة، المبالغ المسددة، والمتبقي على كل مريض
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                إجمالي فواتير المرضى: {bookings.reduce((sum, b) => sum + b.finalPrice, 0).toLocaleString()} ج.م
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">رقم الحجز</th>
                    <th className="py-3 px-4">اسم المريض</th>
                    <th className="py-3 px-4">الهاتف</th>
                    <th className="py-3 px-4">نوع الخدمة والفرع</th>
                    <th className="py-3 px-4">المبلغ قبل الخصم</th>
                    <th className="py-3 px-4">الخصم</th>
                    <th className="py-3 px-4">المطلوب سداده</th>
                    <th className="py-3 px-4">حالة الحساب</th>
                    <th className="py-3 px-4 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{b.bookingNumber}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-950">{b.patientName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{b.patientPhone}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {b.serviceType === 'home_visit' ? `منزلي (${b.area})` : 'فرع المختبر'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{b.totalPrice} ج.م</td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-bold">
                        {b.discount > 0 ? `-${b.discount} ج.م` : '0'}
                      </td>
                      <td className="py-3 px-4 font-black text-sm text-slate-900 font-mono">
                        {b.finalPrice} ج.م
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>مسدد بالكامل</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            const newTx: FinancialTransaction = {
                              id: `tx-${Date.now()}`,
                              txNumber: `RT-TX-${Math.floor(1000 + Math.random() * 9000)}`,
                              type: 'income',
                              category: 'patient_receipt',
                              categoryAr: 'إيراد فحص / تحليل مريض',
                              amount: b.finalPrice,
                              paymentMethod: 'cash',
                              paymentMethodAr: 'كاش نقدي',
                              date: todayStr,
                              time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
                              patientOrPartyName: b.patientName,
                              patientOrderId: b.bookingNumber,
                              notes: `سداد حجز رقم ${b.bookingNumber}`,
                              registeredBy: 'الخزينة والحسابات'
                            };
                            setSelectedTxForReceipt(newTx);
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-950 hover:bg-rose-50"
                          title="طباعة إيصال مريض"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CEO Share & Lab Share Calculator (نسب المعمل ونسبة CEO متغيرة يحددها الإدارة المالية) */}
      {activeSubTab === 'profit_sharing' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  تحديد وتوزيع نسب أرباح الـ CEO ونسبة المعمل (Profit Sharing)
                </h3>
                <p className="text-xs text-slate-500">
                  تحدد الإدارة المالية النسب المتغيرة لتوزيع صافي الفائض بعد خصم كافة المصاريف التشغيلية
                </p>
              </div>

              {savedSettingsNotice && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تم حفظ وتثبيت النسب المالية بنجاح</span>
                </span>
              )}
            </div>

            {/* Profit Formula Breakdown */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-slate-400 block text-xs font-bold mb-0.5">إجمالي الإيرادات (+)</span>
                <span className="text-lg font-black text-emerald-700">{totalIncome.toLocaleString()} ج.م</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs font-bold mb-0.5">إجمالي المصروفات (-)</span>
                <span className="text-lg font-black text-rose-900">{totalExpense.toLocaleString()} ج.م</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-500 block text-xs font-bold mb-0.5">صافي الأرباح القابلة للتوزيع</span>
                <span className="text-xl font-black text-teal-800">{netProfit.toLocaleString()} ج.م</span>
              </div>
            </div>

            {/* Sliders and Dynamic Rate Setting */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <span>نسبة الرئيس التنفيذي (CEO Share Percentage):</span>
                    <span className="text-rose-900 font-mono text-sm">{ceoPercent}%</span>
                  </label>
                  <span className="text-xs font-extrabold text-rose-950 font-mono">
                    المبلغ المستحق: {ceoShareAmount.toLocaleString()} ج.م
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={ceoPercent}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCeoPercent(val);
                    setLabPercent(100 - val);
                  }}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-900"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <span>نسبة المعمل للتطوير والاحتياطي (Lab Share Percentage):</span>
                    <span className="text-blue-900 font-mono text-sm">{labPercent}%</span>
                  </label>
                  <span className="text-xs font-extrabold text-blue-950 font-mono">
                    المبلغ المخصص للمعمل: {labShareAmount.toLocaleString()} ج.م
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={labPercent}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLabPercent(val);
                    setCeoPercent(100 - val);
                  }}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-900"
                />
              </div>

              {/* Graphic Split Representation */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex h-5 rounded-full overflow-hidden shadow-inner text-[10px] font-black text-white text-center leading-5">
                  <div className="bg-rose-950 transition-all" style={{ width: `${ceoPercent}%` }}>
                    {ceoPercent > 10 ? `حصة CEO: ${ceoPercent}%` : ''}
                  </div>
                  <div className="bg-blue-900 transition-all" style={{ width: `${labPercent}%` }}>
                    {labPercent > 10 ? `حصة المعمل: ${labPercent}%` : ''}
                  </div>
                </div>

                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-950 inline-block" />
                    <span>حصة الرئيس التنفيذي: {ceoShareAmount.toLocaleString()} ج.م</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-900 inline-block" />
                    <span>مخصصات تطوير المعمل: {labShareAmount.toLocaleString()} ج.م</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleSaveProfitSettings}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-white font-bold text-xs shadow-md shadow-rose-950/20 transition-all hover:scale-102"
              >
                <Save className="w-4 h-4" />
                <span>حفظ واعتماد النسب للمعمل</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Add New Transaction */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-rose-950" />
                <h3 className="font-extrabold text-slate-900 text-base">تسجيل حركة مالية جديدة</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              {/* Type Switch */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategory('patient_receipt'); }}
                  className={`py-2 text-xs font-extrabold rounded-lg transition-all ${
                    type === 'income' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  سند قبض (إيراد +)
                </button>
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategory('reagents_purchase'); }}
                  className={`py-2 text-xs font-extrabold rounded-lg transition-all ${
                    type === 'expense' ? 'bg-rose-900 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  سند صرف (مصروف -)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المالي (ج.م) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full text-sm font-black p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">بند الحساب *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800 bg-white"
                  >
                    {type === 'income' ? (
                      <>
                        <option value="patient_receipt">إيراد فحص / تحليل مريض</option>
                        <option value="other">إيرادات متنوعة</option>
                      </>
                    ) : (
                      <>
                        <option value="reagents_purchase">شراء كيماويات وكواشف معملية</option>
                        <option value="salary_payout">صرف رواتب وبدلات الموظفين</option>
                        <option value="rent_utilities">إيجار المقر، كهرباء ومرافق</option>
                        <option value="supplies">مستلزمات طبية وسرنجات وأنابيب</option>
                        <option value="maintenance">صيانة أجهزة ومعايرة</option>
                        <option value="doctor_commission">عمولات ونسب الأطباء</option>
                        <option value="other">مصروفات ونثريات إدارية أخرى</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800 bg-white"
                  >
                    <option value="cash">كاش نقدي (الخزينة)</option>
                    <option value="visa">فيزا / بطاقة بنكية</option>
                    <option value="instapay">إنستاباي (InstaPay)</option>
                    <option value="vodafone_cash">فودافون كاش</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الجهة / اسم المريض / المورد</label>
                <input
                  type="text"
                  placeholder={type === 'income' ? 'اسم المريض' : 'اسم المورد أو المستلم'}
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البيان والملاحظات</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="شرح تفصيلي للعملية المالية..."
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-white text-xs font-bold shadow-md shadow-rose-950/20"
                >
                  حفظ وتسجيل الحركة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Official Thermal/A5 Printable Receipt */}
      {selectedTxForReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-slate-900 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-300 mb-4">
              <div>
                <h4 className="font-black text-sm">
                  معامل <span className="text-rose-950">RT LAB</span> للتحاليل التشخيصية
                </h4>
                <div className="text-[10px] text-slate-500">معامل رامي مختار • سند مالي رسمي</div>
              </div>
              <button onClick={() => setSelectedTxForReceipt(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 border-b border-dashed border-slate-300 pb-4 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">رقم السند:</span>
                <span className="font-mono font-bold text-slate-900">{selectedTxForReceipt.txNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">نوع السند:</span>
                <span className="font-bold">{selectedTxForReceipt.type === 'income' ? 'سند قبض نقدي' : 'سند صرف نقدي'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">التاريخ والوقت:</span>
                <span className="font-mono">{selectedTxForReceipt.date} {selectedTxForReceipt.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الطرف المعني:</span>
                <span className="font-bold text-slate-900">{selectedTxForReceipt.patientOrPartyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">البند:</span>
                <span>{selectedTxForReceipt.categoryAr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">طريقة الدفع:</span>
                <span>{selectedTxForReceipt.paymentMethodAr}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center mb-4">
              <span className="text-[11px] text-slate-500 block mb-1">المبلغ الإجمالي</span>
              <span className="text-2xl font-black text-slate-950 font-mono">
                {selectedTxForReceipt.amount.toLocaleString()} ج.م
              </span>
            </div>

            <div className="text-[10px] text-slate-500 text-center space-y-1 mb-4">
              <div>الفرع الرئيسي: ميدان بهتيم برج صيدلية العزبي الدور الثالث شبرا الخيمة</div>
              <div>تليفونات المعامل: 01100874444 • 01100046841 • 01013242777</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-rose-950 hover:bg-rose-900 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الإيصال</span>
              </button>
              <button
                onClick={() => setSelectedTxForReceipt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
