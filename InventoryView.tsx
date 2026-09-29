import React, { useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Search, 
  TrendingDown, 
  Clock, 
  Calendar, 
  X,
  Filter,
  Layers,
  FlaskConical
} from 'lucide-react';
import { InventoryItem, InventoryCategory } from '../types';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onAddItem: (item: InventoryItem) => void;
  onUpdateStock: (itemId: string, newStock: number) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  onAddItem,
  onUpdateStock
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Item Form State
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('reagents');
  const [currentStock, setCurrentStock] = useState<number>(10);
  const [minThreshold, setMinThreshold] = useState<number>(3);
  const [unit, setUnit] = useState('علبة (Kit)');
  const [unitPrice, setUnitPrice] = useState<number>(450);
  const [supplier, setSupplier] = useState('شركة النيل للأجهزة والكواشف الطبية');
  const [lotNumber, setLotNumber] = useState('LOT-2026-981');
  const [expiryDate, setExpiryDate] = useState('2027-06-30');

  const categoryMap: Record<InventoryCategory, string> = {
    reagents: 'كواشف ومحاليل كيميائية (Reagents)',
    tubes: 'أنابيب سحب العينات (Blood Tubes)',
    needles: 'سنون وسرنجات معقمة (Needles/Syringes)',
    strips: 'شرائط تحليل سريعة (Rapid Strips)',
    control_calibrator: 'معايرات ومحاليل ضبط جودة (QC Controls)',
    ppe: 'مهمات وقاية وقفازات وماسكات (PPE)'
  };

  const filteredItems = inventory.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      item.nameAr.toLowerCase().includes(q) ||
      item.nameEn.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.supplier.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const lowStockCount = inventory.filter(i => i.currentStock <= i.minThreshold).length;
  const totalValue = inventory.reduce((sum, i) => sum + (i.currentStock * i.unitPrice), 0);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr) return;

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      code: `KIT-0${randomSuffix}`,
      nameAr,
      nameEn: nameEn || nameAr,
      category,
      categoryAr: categoryMap[category],
      currentStock: Number(currentStock),
      minThreshold: Number(minThreshold),
      unit,
      unitPrice: Number(unitPrice),
      supplier,
      lotNumber: lotNumber || `LOT-${Date.now().toString().slice(-4)}`,
      expiryDate,
      status: Number(currentStock) <= Number(minThreshold) ? 'low_stock' : 'in_stock'
    };

    onAddItem(newItem);
    setShowAddModal(false);
    setNameAr('');
    setNameEn('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-rose-100 text-rose-900 border border-rose-200">
              <Package className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900">المستلزمات والكيماويات والمخزن (Lab Inventory)</h1>
              <p className="text-xs text-slate-500 font-medium">
                متابعة أرصدة الكواشف الطبية، أنابيب العينات، تنبيهات النواقص، وتواريخ الصلاحية
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-900 to-blue-900 hover:from-rose-800 hover:to-blue-800 text-white font-bold text-xs shadow-md shadow-rose-950/20 transition-all hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة كاشف / مستلزم جديد</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-bold">إجمالي أصناف المخزن</span>
            <Layers className="w-4 h-4 text-rose-900" />
          </div>
          <div className="text-2xl font-black text-slate-900">{inventory.length} صنف</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">كواشف، أنابيب، مستهلكات</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-bold">تنبيهات قرب النفاد</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{lowStockCount} أصناف</div>
          <div className="text-[11px] text-amber-800 font-medium mt-0.5">وصلت للحد الأدنى (طلب توريد)</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-bold">صلاحية الكواشف</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">100%</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">جميع الكواشف سارية الصلاحية</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-bold">القيمة التقديرية للمخزون</span>
            <FlaskConical className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-2xl font-black text-blue-950">{totalValue.toLocaleString()} ج.م</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">سعر التكلفة الاستثمارية</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-3xl shadow-2xs border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ابحث باسم الكاشف، كود الصنف، أو اسم المورد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-800 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-800"
          >
            <option value="all">كل الفئات والأقسام</option>
            <option value="reagents">كواشف كيميائية (Reagents)</option>
            <option value="tubes">أنابيب سحب الدم (Tubes)</option>
            <option value="needles">سرنجات وسنون (Needles)</option>
            <option value="control_calibrator">محاليل معايرة وجودة (Controls)</option>
            <option value="strips">شرائط سريعة (Strips)</option>
          </select>
        </div>
      </div>

      {/* Inventory Items Table */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="py-3 px-4">كود الصنف</th>
                <th className="py-3 px-4">اسم الكاشف / المستلزم</th>
                <th className="py-3 px-4">القسم</th>
                <th className="py-3 px-4">رقم التشغيلة (Lot #)</th>
                <th className="py-3 px-4">تاريخ الصلاحية</th>
                <th className="py-3 px-4">الرصيد الحالي</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4 text-center">تحديث الرصيد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isLow = item.currentStock <= item.minThreshold;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{item.code}</td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900">{item.nameAr}</div>
                      <div className="text-[11px] text-slate-500 font-sans">{item.nameEn}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.categoryAr}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{item.lotNumber}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.expiryDate}</td>
                    <td className="py-3 px-4">
                      <span className={`font-black text-sm ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                        {item.currentStock} {item.unit}
                      </span>
                      {isLow && (
                        <span className="block text-[10px] text-amber-700 font-bold">
                          أقل من الحد الأدنى ({item.minThreshold})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isLow ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isLow ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        <span>{isLow ? 'أوشك على النفاد' : 'متوفر بالمخزن'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onUpdateStock(item.id, Math.max(0, item.currentStock - 1))}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center"
                          title="تسجيل استهلاك عبوة (-1)"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => onUpdateStock(item.id, item.currentStock + 5)}
                          className="w-7 h-7 rounded-lg bg-rose-900 hover:bg-rose-800 text-white font-black text-xs flex items-center justify-center shadow-2xs"
                          title="إضافة توريد (+5 عبوات)"
                        >
                          +5
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

      {/* MODAL: Add New Inventory Item */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-rose-900" />
                <h3 className="font-extrabold text-slate-900 text-base">إضافة كاشف / مستلزم جديد بالمخزن</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الكاشف أو المستلزم (بالعربية) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: كاشف فحص السكر الجلوكوز (GOD-PAP)"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الكاشف (بالإنجليزية)</label>
                <input
                  type="text"
                  placeholder="e.g. Glucose GOD-PAP Reagent Kit 5x100ml"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الفئة والتصنيف *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as InventoryCategory)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800 bg-white"
                  >
                    <option value="reagents">كواشف ومحاليل كيميائية (Reagents)</option>
                    <option value="tubes">أنابيب سحب الدم (Blood Tubes)</option>
                    <option value="needles">سرنجات وسنون (Needles/Syringes)</option>
                    <option value="strips">شرائط سريعة (Rapid Strips)</option>
                    <option value="control_calibrator">محاليل ضبط جودة (Controls)</option>
                    <option value="ppe">مهمات وقاية وقفازات (PPE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الوحدة</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الرصيد المتاح *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={currentStock}
                    onChange={(e) => setCurrentStock(Number(e.target.value))}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الحد الأدنى للتنبيه *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(Number(e.target.value))}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سعر التكلفة (ج.م)</label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم التشغيلة (Lot #)</label>
                  <input
                    type="text"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الصلاحية *</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الشركة الموردة</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
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
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-rose-900 to-blue-900 hover:from-rose-800 hover:to-blue-800 text-white text-xs font-bold shadow-md shadow-rose-950/20"
                >
                  إضافة المستلزم للمخزن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
