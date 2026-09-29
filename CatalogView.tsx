import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  CalendarClock, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Info,
  Edit,
  Plus,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { LabTest, LabParameterDefinition } from '../types';

interface CatalogViewProps {
  tests: LabTest[];
  onSelectTestForBooking: (testId: string) => void;
  onUpdateTest?: (updatedTest: LabTest) => void;
  onAddTest?: (newTest: LabTest) => void;
  onDeleteTest?: (testId: string) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  tests,
  onSelectTestForBooking,
  onUpdateTest,
  onAddTest,
  onDeleteTest
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  // Edit Test Modal State
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit form state
  const [formCode, setFormCode] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formCategory, setFormCategory] = useState<LabTest['category']>('chemistry');
  const [formCategoryAr, setFormCategoryAr] = useState('كيمياء حيوية');
  const [formSampleType, setFormSampleType] = useState('Serum');
  const [formTubeColor, setFormTubeColor] = useState<LabTest['tubeColor']>('yellow');
  const [formTubeName, setFormTubeName] = useState('أنبوب جل أصفر');
  const [formTurnaroundHours, setFormTurnaroundHours] = useState(3);
  const [formFastingHours, setFormFastingHours] = useState(0);
  const [formInstructionsAr, setFormInstructionsAr] = useState('');
  const [formPrice, setFormPrice] = useState(150);
  const [formParameters, setFormParameters] = useState<LabParameterDefinition[]>([]);

  const categories = [
    { id: 'all', label: 'كل الفحوصات' },
    { id: 'hematology', label: 'أمراض الدم والـ CBC' },
    { id: 'liver', label: 'وظائف الكبد' },
    { id: 'kidney', label: 'وظائف الكلى والأملاح' },
    { id: 'diabetes', label: 'السكري ومقاومة الإنسولين' },
    { id: 'lipids', label: 'الدهون وصحة القلب' },
    { id: 'thyroid', label: 'الغدة الدرقية' },
    { id: 'vitamins', label: 'الفيتامينات والأنيميا' },
    { id: 'coagulation', label: 'السيولة والتخثر' },
    { id: 'urine', label: 'البول والميكروسكوبي' },
    { id: 'stool', label: 'البراز والطفيليات' },
    { id: 'serology', label: 'المناعة والـ CRP' }
  ];

  const filteredTests = tests.filter(test => {
    const matchesCategory = selectedCategory === 'all' || test.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      test.nameAr.toLowerCase().includes(q) ||
      test.nameEn.toLowerCase().includes(q) ||
      test.code.toLowerCase().includes(q) ||
      test.parameters.some(p => p.nameAr.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q));
    
    return matchesCategory && matchesSearch;
  });

  const toggleExpand = (testId: string) => {
    setExpandedTestId(expandedTestId === testId ? null : testId);
  };

  const handleOpenEdit = (test: LabTest) => {
    setEditingTest(test);
    setFormCode(test.code);
    setFormNameAr(test.nameAr);
    setFormNameEn(test.nameEn);
    setFormCategory(test.category);
    setFormCategoryAr(test.categoryAr);
    setFormSampleType(test.sampleType);
    setFormTubeColor(test.tubeColor);
    setFormTubeName(test.tubeName);
    setFormTurnaroundHours(test.turnaroundHours);
    setFormFastingHours(test.fastingHours);
    setFormInstructionsAr(test.instructionsAr);
    setFormPrice(test.price);
    setFormParameters(JSON.parse(JSON.stringify(test.parameters || [])));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest || !onUpdateTest) return;

    const updated: LabTest = {
      ...editingTest,
      code: formCode,
      nameAr: formNameAr,
      nameEn: formNameEn,
      category: formCategory,
      categoryAr: formCategoryAr,
      sampleType: formSampleType,
      tubeColor: formTubeColor,
      tubeName: formTubeName,
      turnaroundHours: Number(formTurnaroundHours) || 2,
      fastingHours: Number(formFastingHours) || 0,
      instructionsAr: formInstructionsAr,
      price: Number(formPrice) || 50,
      parameters: formParameters
    };

    onUpdateTest(updated);
    setEditingTest(null);
  };

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddTest || !formNameAr || !formNameEn) return;

    const newTest: LabTest = {
      id: `test-${Date.now()}`,
      code: formCode || `TEST-${Math.floor(10 + Math.random() * 90)}`,
      nameAr: formNameAr,
      nameEn: formNameEn,
      category: formCategory,
      categoryAr: formCategoryAr,
      sampleType: formSampleType,
      tubeColor: formTubeColor,
      tubeName: formTubeName,
      turnaroundHours: Number(formTurnaroundHours) || 2,
      fastingHours: Number(formFastingHours) || 0,
      instructionsAr: formInstructionsAr || 'لا توجد تعليمات خاصة.',
      price: Number(formPrice) || 100,
      parameters: formParameters.length > 0 ? formParameters : [
        {
          id: `param-${Date.now()}`,
          nameAr: formNameAr,
          nameEn: formNameEn,
          unit: 'mg/dL',
          defaultRefMin: 0,
          defaultRefMax: 100,
          refText: '0 - 100'
        }
      ]
    };

    onAddTest(newTest);
    setShowAddModal(false);
  };

  const handleAddParameter = () => {
    const newParam: LabParameterDefinition = {
      id: `p-${Date.now()}`,
      nameEn: 'New Parameter',
      nameAr: 'معيار جديد',
      unit: 'mg/dL',
      defaultRefMin: 0,
      defaultRefMax: 100,
      refText: '0 - 100'
    };
    setFormParameters([...formParameters, newParam]);
  };

  const handleUpdateParamField = (idx: number, field: keyof LabParameterDefinition, val: any) => {
    const list = [...formParameters];
    list[idx] = { ...list[idx], [field]: val };
    setFormParameters(list);
  };

  const handleRemoveParam = (idx: number) => {
    setFormParameters(formParameters.filter((_, i) => i !== idx));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Catalog Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-rose-100 text-rose-900 border border-rose-200">
              <BookOpen className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900">دليل وكتالوج الفحوصات الطبية (Test Catalog)</h1>
              <p className="text-xs text-slate-500 font-medium">
                جميع التحاليل المخبرية وقابليتها للتعديل الكامل: الاسم، السعر، النورمال، والوحدات
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-200">
            إجمالي الفحوصات: <strong className="text-rose-900 font-black">{tests.length} تحليل معتمد</strong>
          </div>

          <button
            onClick={() => {
              setFormCode('');
              setFormNameAr('');
              setFormNameEn('');
              setFormCategory('chemistry');
              setFormCategoryAr('كيمياء حيوية');
              setFormSampleType('Serum (Gel SST)');
              setFormTubeColor('yellow');
              setFormTubeName('أنبوب جل أصفر');
              setFormTurnaroundHours(3);
              setFormFastingHours(0);
              setFormInstructionsAr('');
              setFormPrice(150);
              setFormParameters([]);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-rose-950 to-blue-950 hover:from-rose-900 hover:to-blue-900 text-white rounded-xl text-xs font-black shadow-md shadow-rose-950/20 transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة تحليل جديد للكتالوج</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-3xl shadow-xs border border-slate-200 mb-6 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ابحث بالاسم العربي، الإنجليزي، الاختصار (مثال: CBC, Ferritin, سكر صائم، وظائف كلى، ACR)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-800 bg-slate-50/50"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTests.length === 0 ? (
          <div className="col-span-2 text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-400">
            لم يتم العثور على أي تحليل يطابق بحثك
          </div>
        ) : (
          filteredTests.map((test) => {
            const isExpanded = expandedTestId === test.id;

            const tubeBg = 
              test.tubeColor === 'purple' ? 'bg-purple-100 text-purple-900 border-purple-200' :
              test.tubeColor === 'yellow' ? 'bg-amber-100 text-amber-900 border-amber-200' :
              test.tubeColor === 'blue' ? 'bg-sky-100 text-sky-900 border-sky-200' :
              test.tubeColor === 'grey' ? 'bg-slate-200 text-slate-900 border-slate-300' :
              'bg-teal-100 text-teal-900 border-teal-200';

            return (
              <div 
                key={test.id} 
                className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200 hover:border-rose-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges, Code & Price */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-md">
                        {test.code}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {test.categoryAr}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-rose-950 font-mono">
                        {test.price} <span className="text-xs font-normal">ج.م</span>
                      </span>

                      {/* Edit Test Button */}
                      <button
                        onClick={() => handleOpenEdit(test)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-900 border border-slate-200 transition-colors"
                        title="تعديل هذا التحليل بالكامل (الاسم، السعر، النورمال، والوحدات)"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Test Titles */}
                  <h3 className="font-black text-base text-slate-900 tracking-tight">
                    {test.nameAr}
                  </h3>
                  <h4 className="text-xs font-bold text-blue-900 font-sans tracking-wide mb-3">
                    {test.nameEn}
                  </h4>

                  {/* Metadata Chips: Tube, Fasting, TAT */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mb-3">
                    <div className={`p-2 rounded-xl border flex items-center gap-1.5 ${tubeBg}`}>
                      <Tag className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{test.tubeName}</span>
                    </div>

                    <div className="p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>الظهور: خلال <strong>{test.turnaroundHours} ساعات</strong></span>
                    </div>
                  </div>

                  {/* Fasting & Preparation */}
                  <div className="text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-rose-900 shrink-0 mt-0.5" />
                    <span>{test.instructionsAr || 'لا توجد تعليمات خاصة قبل الفحص.'}</span>
                  </div>

                  {/* Parameters Details (Collapsible) */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs animate-in fade-in duration-150">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-800">
                        <span>الدلالات والمعايير المقاسة في هذا الفحص ({test.parameters.length}):</span>
                        <span className="text-rose-900 cursor-pointer hover:underline" onClick={() => handleOpenEdit(test)}>
                          تعديل المعايير والنورمال ✎
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {test.parameters.map(p => (
                          <div key={p.id} className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-[11px]">
                            <div>
                              <strong className="text-slate-900 font-sans">{p.nameEn}</strong>
                              <span className="text-slate-500 mr-1.5">({p.nameAr})</span>
                              {p.isCalculated && (
                                <span className="mr-1 text-[9px] font-bold bg-blue-100 text-blue-900 px-1 py-0.2 rounded">معادلة محسوبة</span>
                              )}
                            </div>
                            <div className="text-left font-mono text-[11px] text-rose-950 font-bold">
                              {p.refText || `${p.defaultRefMin ?? ''} - ${p.defaultRefMax ?? ''}`} {p.unit}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpand(test.id)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <span>{isExpanded ? 'إخفاء التفاصيل' : `عرض المعايير والنورمال (${test.parameters.length})`}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectTestForBooking(test.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-900 to-blue-900 hover:from-rose-800 hover:to-blue-800 text-white text-xs font-bold shadow-xs transition-all hover:scale-102"
                  >
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span>حجز هذا التحليل</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: Edit Test Completely (Name, Price, Category, Parameters, Normal Ranges, Units) */}
      {(editingTest || showAddModal) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-rose-950 to-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-300" />
                <h3 className="font-black text-sm">
                  {editingTest ? `تعديل التحليل: ${editingTest.nameAr}` : 'إضافة تحليل جديد للكتالوج'}
                </h3>
              </div>
              <button
                onClick={() => { setEditingTest(null); setShowAddModal(false); }}
                className="p-1 rounded-full hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={editingTest ? handleSaveEdit : handleCreateTest} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم التحليل بالعربي *</label>
                  <input
                    type="text"
                    required
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-rose-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم التحليل بالإنجليزي (Name En) *</label>
                  <input
                    type="text"
                    required
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold font-sans text-left focus:ring-2 focus:ring-rose-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">كود التحليل (Code)</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر التحليل (Price EGP) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-rose-950 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">القسم والتصنيف</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value="hematology">أمراض الدم والـ CBC</option>
                    <option value="liver">وظائف الكبد والإنزيمات</option>
                    <option value="kidney">وظائف الكلى والأملاح</option>
                    <option value="diabetes">داء السكري والغدد</option>
                    <option value="lipids">الدهون وصحة القلب</option>
                    <option value="thyroid">الغدة الدرقية</option>
                    <option value="vitamins">الفيتامينات والمعادن</option>
                    <option value="coagulation">السيولة والتخثر</option>
                    <option value="urine">البول والميكروسكوبي</option>
                    <option value="stool">البراز والطفيليات</option>
                    <option value="serology">المناعة والدلالات السيرولوجية</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع الأنبوب والغطاء</label>
                  <input
                    type="text"
                    value={formTubeName}
                    onChange={(e) => setFormTubeName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ساعات الصيام المطلوبة (Fasting Hours)</label>
                  <input
                    type="number"
                    min={0}
                    value={formFastingHours}
                    onChange={(e) => setFormFastingHours(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">وقت ظهور النتيجة (بالساعات)</label>
                  <input
                    type="number"
                    min={1}
                    value={formTurnaroundHours}
                    onChange={(e) => setFormTurnaroundHours(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">تعليمات وشروط التحليل</label>
                  <input
                    type="text"
                    value={formInstructionsAr}
                    onChange={(e) => setFormInstructionsAr(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              {/* Editable Parameters List (النورمال والوحدات والمعايير) */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-slate-900 text-xs">
                      المعايير والقيم المرجعية الطبيعية والوحدات ({formParameters.length}):
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      يمكنك تعديل اسم كل مؤشر، وحدته، والقيم الطبيعية (Reference Intervals) بالكامل
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddParameter}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-[11px] font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة معيار جديد</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {formParameters.map((param, pIdx) => (
                    <div key={param.id || pIdx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500">الاسم En</label>
                        <input
                          type="text"
                          value={param.nameEn}
                          onChange={(e) => handleUpdateParamField(pIdx, 'nameEn', e.target.value)}
                          className="w-full p-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white font-sans text-left"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500">الاسم Ar</label>
                        <input
                          type="text"
                          value={param.nameAr}
                          onChange={(e) => handleUpdateParamField(pIdx, 'nameAr', e.target.value)}
                          className="w-full p-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500">الوحدة Unit</label>
                        <input
                          type="text"
                          value={param.unit}
                          onChange={(e) => handleUpdateParamField(pIdx, 'unit', e.target.value)}
                          className="w-full p-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-white text-center"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500">النورمال الطبيعي (Ref Range)</label>
                        <input
                          type="text"
                          value={param.refText || ''}
                          onChange={(e) => handleUpdateParamField(pIdx, 'refText', e.target.value)}
                          className="w-full p-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-white"
                        />
                      </div>

                      <div className="sm:col-span-1 text-center pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveParam(pIdx)}
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-100"
                          title="حذف هذا المعيار"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setEditingTest(null); setShowAddModal(false); }}
                  className="px-4 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-rose-950 to-blue-950 hover:from-rose-900 hover:to-blue-900 text-white text-xs font-black shadow-md shadow-rose-950/20"
                >
                  {editingTest ? 'حفظ التعديلات في الكتالوج' : 'إضافة التحليل الجديد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
