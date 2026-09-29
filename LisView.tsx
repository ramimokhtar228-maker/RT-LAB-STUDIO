import React, { useState } from 'react';
import { 
  FlaskConical, 
  Search, 
  Plus, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Tag, 
  Sparkles, 
  Save, 
  X, 
  Filter,
  UserPlus,
  Stethoscope,
  Eye,
  CheckCheck,
  Calculator,
  Activity,
  Heart,
  Droplet
} from 'lucide-react';
import { LabOrder, LabTest, LabParamResult, OrderStatus, Gender, StaffMember } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import { 
  calculateCBCIndices, 
  calculateLipidProfile, 
  calculateHomaIR, 
  calculateINR, 
  calculateEAG, 
  calculateACR, 
  calculateEGFR,
  calculateLiverIndices
} from '../lib/medicalCalculations';

interface LisViewProps {
  orders: LabOrder[];
  tests: LabTest[];
  staff?: StaffMember[];
  onSaveOrder: (order: LabOrder) => void;
  onViewReport: (order: LabOrder) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export const LisView: React.FC<LisViewProps> = ({
  orders,
  tests,
  staff = [],
  onSaveOrder,
  onViewReport
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Results Entry Modal State
  const [editingOrder, setEditingOrder] = useState<LabOrder | null>(null);
  const [currentResults, setCurrentResults] = useState<Record<string, LabParamResult>>({});
  const [currentRemarks, setCurrentRemarks] = useState('');
  const [currentTechName, setCurrentTechName] = useState('');
  const [currentDirectorName, setCurrentDirectorName] = useState('أ.د / رحاب على عبد الحميد');

  // Medical Calculators Dialog State
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [calcTab, setCalcTab] = useState<'cbc' | 'lipid' | 'homa' | 'inr' | 'acr' | 'egfr'>('cbc');
  
  // Calc Scratchpad Inputs
  const [calcHb, setCalcHb] = useState<number>(14.0);
  const [calcRbc, setCalcRbc] = useState<number>(4.8);
  const [calcHct, setCalcHct] = useState<number>(42.0);
  const [calcChol, setCalcChol] = useState<number>(210);
  const [calcTrig, setCalcTrig] = useState<number>(150);
  const [calcHdl, setCalcHdl] = useState<number>(45);
  const [calcFbg, setCalcFbg] = useState<number>(105);
  const [calcInsulin, setCalcInsulin] = useState<number>(12);
  const [calcPtPatient, setCalcPtPatient] = useState<number>(13.5);
  const [calcPtControl, setCalcPtControl] = useState<number>(12.0);
  const [calcMicroalb, setCalcMicroalb] = useState<number>(35);
  const [calcUrineCreat, setCalcUrineCreat] = useState<number>(120);
  const [calcSerumCreat, setCalcSerumCreat] = useState<number>(1.0);

  // Barcode Labels Print Modal
  const [barcodeOrder, setBarcodeOrder] = useState<LabOrder | null>(null);

  // New Order Creation Modal State
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState<number>(30);
  const [newPatientGender, setNewPatientGender] = useState<Gender>('male');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newDoctor, setNewDoctor] = useState('');
  const [newBranch, setNewBranch] = useState('الفرع الرئيسي (شبرا الخيمة)');
  const [newSelectedTestIds, setNewSelectedTestIds] = useState<string[]>(['test-cbc']);

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.patientPhone.includes(searchQuery) ||
      o.sampleBarcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || o.overallStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Open Results Editor
  const handleOpenResults = (order: LabOrder) => {
    setEditingOrder(order);
    setCurrentResults({ ...(order.results || {}) });
    setCurrentRemarks(order.clinicalRemarks || '');
    setCurrentTechName(order.technicianName || 'كيميائي / هاني عبد الفتاح');
    setCurrentDirectorName(order.verifiedByDoctor || 'أ.د / رحاب على عبد الحميد');
  };

  // Comprehensive Auto-Calculation Engine
  const handleValueChange = (test: LabTest, paramId: string, rawVal: string) => {
    const updated = { ...currentResults };
    const num = parseFloat(rawVal);
    const paramDef = test.parameters.find(p => p.id === paramId);

    // Compute flag
    let flag: LabParamResult['flag'] = 'NORMAL';
    if (!isNaN(num) && paramDef) {
      if (paramDef.panicMax !== undefined && num >= paramDef.panicMax) {
        flag = 'PANIC';
      } else if (paramDef.panicMin !== undefined && num <= paramDef.panicMin) {
        flag = 'PANIC';
      } else if (paramDef.defaultRefMax !== undefined && num > paramDef.defaultRefMax) {
        flag = 'HIGH';
      } else if (paramDef.defaultRefMin !== undefined && num < paramDef.defaultRefMin) {
        flag = 'LOW';
      }
    } else if (rawVal && ['Positive (+)', '++', '+++', 'Trace'].includes(rawVal)) {
      flag = 'HIGH';
    }

    updated[paramId] = {
      paramId,
      testId: test.id,
      paramNameEn: paramDef?.nameEn || paramId,
      paramNameAr: paramDef?.nameAr || paramId,
      value: rawVal,
      numericValue: isNaN(num) ? undefined : num,
      unit: paramDef?.unit || '',
      refRange: paramDef?.refText || `${paramDef?.defaultRefMin ?? ''} - ${paramDef?.defaultRefMax ?? ''}`,
      flag
    };

    // 1. CBC INDICES (MCV, MCH, MCHC) Calculation
    if (paramId === 'hb' || paramId === 'rbc' || paramId === 'hct') {
      const hbVal = parseFloat(paramId === 'hb' ? rawVal : (updated['hb']?.value || '0'));
      const rbcVal = parseFloat(paramId === 'rbc' ? rawVal : (updated['rbc']?.value || '0'));
      const hctVal = parseFloat(paramId === 'hct' ? rawVal : (updated['hct']?.value || '0'));

      const indices = calculateCBCIndices(hbVal, rbcVal, hctVal);
      if (indices) {
        updated['mcv'] = {
          paramId: 'mcv',
          testId: 'test-cbc',
          paramNameEn: 'MCV',
          paramNameAr: 'متوسط حجم الكرية (محسوب)',
          value: indices.mcv.toString(),
          numericValue: indices.mcv,
          unit: 'fL',
          refRange: '80.0 - 98.0',
          flag: indices.mcv > 98 ? 'HIGH' : indices.mcv < 80 ? 'LOW' : 'NORMAL'
        };
        updated['mch'] = {
          paramId: 'mch',
          testId: 'test-cbc',
          paramNameEn: 'MCH',
          paramNameAr: 'متوسط وزن الهيموجلوبين (محسوب)',
          value: indices.mch.toString(),
          numericValue: indices.mch,
          unit: 'pg',
          refRange: '27.0 - 33.0',
          flag: indices.mch > 33 ? 'HIGH' : indices.mch < 27 ? 'LOW' : 'NORMAL'
        };
        updated['mchc'] = {
          paramId: 'mchc',
          testId: 'test-cbc',
          paramNameEn: 'MCHC',
          paramNameAr: 'تركيز الهيموجلوبين بالكرية (محسوب)',
          value: indices.mchc.toString(),
          numericValue: indices.mchc,
          unit: 'g/dL',
          refRange: '32.0 - 36.0',
          flag: indices.mchc > 36 ? 'HIGH' : indices.mchc < 32 ? 'LOW' : 'NORMAL'
        };
      }
    }

    // 2. LIPID CALCULATOR (Friedewald Formula: VLDL, LDL, Chol/HDL Ratio, Non-HDL)
    if (paramId === 'chol' || paramId === 'trig' || paramId === 'hdl') {
      const chol = parseFloat(paramId === 'chol' ? rawVal : (updated['chol']?.value || '0'));
      const trig = parseFloat(paramId === 'trig' ? rawVal : (updated['trig']?.value || '0'));
      const hdl = parseFloat(paramId === 'hdl' ? rawVal : (updated['hdl']?.value || '0'));
      
      const lipidRes = calculateLipidProfile(chol, trig, hdl);
      if (lipidRes) {
        updated['vldl'] = {
          paramId: 'vldl',
          testId: 'test-lipids',
          paramNameEn: 'VLDL Cholesterol',
          paramNameAr: 'كوليسترول منخفض الكثافة جداً (محسوب)',
          value: lipidRes.vldl.toString(),
          numericValue: lipidRes.vldl,
          unit: 'mg/dL',
          refRange: '10 - 30',
          flag: lipidRes.vldl > 30 ? 'HIGH' : 'NORMAL'
        };

        if (lipidRes.isFriedewaldValid) {
          updated['ldl'] = {
            paramId: 'ldl',
            testId: 'test-lipids',
            paramNameEn: 'LDL Cholesterol (Bad)',
            paramNameAr: 'الكوليسترول منخفض الكثافة (الضار - محسوب)',
            value: lipidRes.ldl.toString(),
            numericValue: lipidRes.ldl,
            unit: 'mg/dL',
            refRange: '< 100',
            flag: lipidRes.ldl >= 130 ? 'HIGH' : 'NORMAL'
          };
        }

        updated['chol_hdl_ratio'] = {
          paramId: 'chol_hdl_ratio',
          testId: 'test-lipids',
          paramNameEn: 'Cholesterol / HDL Ratio',
          paramNameAr: 'مؤشر خطورة تصلب الشرايين (محسوب)',
          value: lipidRes.cholHdlRatio.toString(),
          numericValue: lipidRes.cholHdlRatio,
          unit: 'Ratio',
          refRange: '< 4.5',
          flag: lipidRes.cholHdlRatio >= 4.5 ? 'HIGH' : 'NORMAL'
        };
      }
    }

    // 3. HOMA-IR (Homeostatic Model Assessment for Insulin Resistance)
    if (paramId === 'fbg' || paramId === 'fasting_insulin') {
      const glu = parseFloat(paramId === 'fbg' ? rawVal : (updated['fbg']?.value || '0'));
      const ins = parseFloat(paramId === 'fasting_insulin' ? rawVal : (updated['fasting_insulin']?.value || '0'));
      
      const homa = calculateHomaIR(glu, ins);
      if (homa) {
        updated['homa_ir'] = {
          paramId: 'homa_ir',
          testId: 'test-diabetes',
          paramNameEn: 'HOMA-IR (Insulin Resistance)',
          paramNameAr: 'مؤشر مقاومة الإنسولين (HOMA-IR محسوب)',
          value: homa.homaIr.toString(),
          numericValue: homa.homaIr,
          unit: 'Index',
          refRange: '< 1.9 Normal | 1.9 - 2.9 Early | > 2.9 High',
          flag: homa.stage === 'high_resistance' ? 'HIGH' : homa.stage === 'early_resistance' ? 'HIGH' : 'NORMAL',
          notes: homa.stageAr
        };
      }
    }

    // 4. HBA1C & Estimated Average Glucose (eAG)
    if (paramId === 'hba1c') {
      const a1c = parseFloat(rawVal);
      const eag = calculateEAG(a1c);
      if (eag) {
        updated['eag'] = {
          paramId: 'eag',
          testId: 'test-diabetes',
          paramNameEn: 'Estimated Average Glucose (eAG)',
          paramNameAr: 'متوسط السكر التقديري المحسوب (eAG)',
          value: eag.eagMgDl.toString(),
          numericValue: eag.eagMgDl,
          unit: 'mg/dL',
          refRange: '68 - 114',
          flag: eag.eagMgDl > 114 ? 'HIGH' : 'NORMAL'
        };
      }
    }

    // 5. INR & PT Coagulation Calculations
    if (paramId === 'pt_patient') {
      const ptVal = parseFloat(rawVal);
      const inrRes = calculateINR(ptVal, 12.0, 1.0);
      if (inrRes) {
        updated['inr'] = {
          paramId: 'inr',
          testId: 'test-coag',
          paramNameEn: 'INR',
          paramNameAr: 'معدل التخثر الدولي (INR محسوب)',
          value: inrRes.inr.toString(),
          numericValue: inrRes.inr,
          unit: 'Ratio',
          refRange: '0.85 - 1.15 (Warfarin target: 2.0 - 3.0)',
          flag: inrRes.inr > 1.3 ? 'HIGH' : inrRes.inr < 0.85 ? 'LOW' : 'NORMAL'
        };
        updated['pt_activity'] = {
          paramId: 'pt_activity',
          testId: 'test-coag',
          paramNameEn: 'Prothrombin Activity',
          paramNameAr: 'نشاط البروثرومبين (محسوب)',
          value: inrRes.activityPercent.toString(),
          numericValue: inrRes.activityPercent,
          unit: '%',
          refRange: '70 - 100 %',
          flag: inrRes.activityPercent < 70 ? 'LOW' : 'NORMAL'
        };
      }
    }

    // 6. ACR (Albumin to Creatinine Ratio in Urine)
    if (paramId === 'urine_microalb' || paramId === 'urine_creat') {
      const micro = parseFloat(paramId === 'urine_microalb' ? rawVal : (updated['urine_microalb']?.value || '0'));
      const creat = parseFloat(paramId === 'urine_creat' ? rawVal : (updated['urine_creat']?.value || '0'));

      const acrRes = calculateACR(micro, creat);
      if (acrRes) {
        updated['acr_ratio'] = {
          paramId: 'acr_ratio',
          testId: 'test-acr',
          paramNameEn: 'Albumin / Creatinine Ratio (ACR)',
          paramNameAr: 'نسبة الزلال للكرياتينين بالبول (ACR محسوبة)',
          value: acrRes.acr.toString(),
          numericValue: acrRes.acr,
          unit: 'mg/g',
          refRange: '< 30 Normal | 30 - 300 Micro | > 300 Macro',
          flag: acrRes.stage === 'macroalbuminuria' ? 'HIGH' : acrRes.stage === 'microalbuminuria' ? 'HIGH' : 'NORMAL',
          notes: acrRes.stageAr
        };
      }
    }

    // 7. Renal eGFR (CKD-EPI Formula)
    if (paramId === 'creatinine') {
      const scr = parseFloat(rawVal);
      const age = editingOrder ? editingOrder.patientAge : 35;
      const gender = editingOrder ? editingOrder.patientGender : 'male';
      const egfrVal = calculateEGFR(scr, age, gender);
      if (egfrVal !== null) {
        updated['egfr'] = {
          paramId: 'egfr',
          testId: 'test-kidney',
          paramNameEn: 'eGFR (CKD-EPI 2021)',
          paramNameAr: 'معدل الترشيح الكلوي التقديري (محسوب)',
          value: egfrVal.toString(),
          numericValue: egfrVal,
          unit: 'mL/min/1.73m2',
          refRange: '> 90 Normal renal function',
          flag: egfrVal < 60 ? 'LOW' : 'NORMAL',
          notes: egfrVal < 60 ? 'انخفاض في معدل الترشيح الكلوي (Stage 3+ CKD)' : 'كفاءة كلوية طبيعية'
        };
      }
    }

    // 8. Liver: Bilirubin & Protein Indices
    if (paramId === 'tot_bili' || paramId === 'dir_bili' || paramId === 'tot_prot' || paramId === 'albumin') {
      const totB = parseFloat(paramId === 'tot_bili' ? rawVal : (updated['tot_bili']?.value || '0'));
      const dirB = parseFloat(paramId === 'dir_bili' ? rawVal : (updated['dir_bili']?.value || '0'));
      const totP = parseFloat(paramId === 'tot_prot' ? rawVal : (updated['tot_prot']?.value || '0'));
      const albP = parseFloat(paramId === 'albumin' ? rawVal : (updated['albumin']?.value || '0'));

      const liv = calculateLiverIndices(totB, dirB, totP, albP);

      if (liv.indirectBili !== null) {
        updated['indir_bili'] = {
          paramId: 'indir_bili',
          testId: 'test-liver',
          paramNameEn: 'Indirect Bilirubin',
          paramNameAr: 'الصفراء غير المباشرة (محسوبة)',
          value: liv.indirectBili.toString(),
          numericValue: liv.indirectBili,
          unit: 'mg/dL',
          refRange: '0.1 - 0.8',
          flag: liv.indirectBili > 0.8 ? 'HIGH' : 'NORMAL'
        };
      }

      if (liv.globulin !== null) {
        updated['globulin'] = {
          paramId: 'globulin',
          testId: 'test-liver',
          paramNameEn: 'Serum Globulin',
          paramNameAr: 'الجلوبيولين (محسوب)',
          value: liv.globulin.toString(),
          numericValue: liv.globulin,
          unit: 'g/dL',
          refRange: '2.0 - 3.5',
          flag: liv.globulin > 3.5 ? 'HIGH' : liv.globulin < 2.0 ? 'LOW' : 'NORMAL'
        };
      }

      if (liv.agRatio !== null) {
        updated['ag_ratio'] = {
          paramId: 'ag_ratio',
          testId: 'test-liver',
          paramNameEn: 'A/G Ratio',
          paramNameAr: 'نسبة الألبومين للجلوبيولين (محسوبة)',
          value: liv.agRatio.toString(),
          numericValue: liv.agRatio,
          unit: 'Ratio',
          refRange: '1.2 - 2.2',
          flag: liv.agRatio < 1.2 ? 'LOW' : liv.agRatio > 2.2 ? 'HIGH' : 'NORMAL'
        };
      }
    }

    setCurrentResults(updated);
  };


  // Quick fill normal reference values
  const handleQuickFillNormal = () => {
    if (!editingOrder) return;
    const filled = { ...currentResults };

    editingOrder.testIds.forEach(testId => {
      const t = tests.find(x => x.id === testId);
      if (!t) return;

      t.parameters.forEach(param => {
        if (!filled[param.id] || !filled[param.id].value || filled[param.id].value === '---') {
          let val = '';
          if (param.defaultRefMin !== undefined && param.defaultRefMax !== undefined) {
            // Midpoint rounded
            val = ((param.defaultRefMin + param.defaultRefMax) / 2).toFixed(1).replace(/\.0$/, '');
          } else if (param.options && param.options.length > 0) {
            val = param.options[0];
          }

          if (val) {
            const num = parseFloat(val);
            filled[param.id] = {
              paramId: param.id,
              testId: t.id,
              paramNameEn: param.nameEn,
              paramNameAr: param.nameAr,
              value: val,
              numericValue: isNaN(num) ? undefined : num,
              unit: param.unit,
              refRange: param.refText || `${param.defaultRefMin ?? ''} - ${param.defaultRefMax ?? ''}`,
              flag: 'NORMAL'
            };
          }
        }
      });
    });

    setCurrentResults(filled);
  };

  // Save changes
  const handleSaveResults = (newStatus: OrderStatus) => {
    if (!editingOrder) return;

    const updated: LabOrder = {
      ...editingOrder,
      results: currentResults,
      clinicalRemarks: currentRemarks,
      technicianName: currentTechName,
      verifiedByDoctor: currentDirectorName,
      overallStatus: newStatus,
      reportReleaseDate: newStatus === 'released' ? new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : editingOrder.reportReleaseDate
    };

    onSaveOrder(updated);
    setEditingOrder(null);
  };

  // Handle Create New Order
  const handleCreateNewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newOrder: LabOrder = {
      id: `order-${Date.now()}`,
      orderNumber: `RT-2026-${randomSuffix}`,
      sampleBarcode: `SMP-2026-${randomSuffix}`,
      patientId: `pat-${Date.now().toString().slice(-4)}`,
      patientName: newPatientName,
      patientAge: Number(newPatientAge) || 25,
      patientGender: newPatientGender,
      patientPhone: newPatientPhone || '01000000000',
      referringDoctor: newDoctor || 'طبيبي الخاص / فحص ذاتي',
      branch: newBranch,
      sampleCollectionDate: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      testIds: newSelectedTestIds,
      results: {},
      overallStatus: 'pending_results',
      technicianName: 'كيميائي / محمود الشناوي',
      verifiedByDoctor: 'أ.د. رامي طاهر السعيد',
      createdAt: new Date().toISOString()
    };

    onSaveOrder(newOrder);
    setShowNewOrderModal(false);
    // Open results entry immediately for convenience
    handleOpenResults(newOrder);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-100 text-teal-800">
              <FlaskConical className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900">نظام إدارة المختبر الطبي (LIS)</h1>
              <p className="text-xs text-slate-500 font-medium">
                استقبال العينات، إدخال النتائج الطبية، حساب المعادلات، وطباعة الباركود والتقارير المعتمدة
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewOrderModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/30 transition-all hover:scale-102"
          >
            <UserPlus className="w-4 h-4" />
            <span>تسجيل فحص / مريض جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالاسم، رقم الموبايل، كود العينة (Barcode)، أو رقم الفحص..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">كل الحالات ({orders.length})</option>
            <option value="pending_results">في انتظار النتائج</option>
            <option value="partially_entered">إدخال جزئي</option>
            <option value="released">معتمد وجاهز للطباعة</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
                <th className="py-3.5 px-4 text-right">كود العينة / الباركود</th>
                <th className="py-3.5 px-4 text-right">بيانات المريض</th>
                <th className="py-3.5 px-4 text-right">الفحوصات المطلوبة</th>
                <th className="py-3.5 px-4 text-right">تاريخ السحب</th>
                <th className="py-3.5 px-4 text-center">الحالة</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    لا توجد طلبات مطابقة لمعايير البحث
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const orderTests = order.testIds
                    .map(tid => tests.find(t => t.id === tid)?.nameAr || tid)
                    .filter(Boolean);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Barcode & Order Number */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-mono font-bold text-teal-800 text-xs bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {order.sampleBarcode}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {order.orderNumber}
                          </span>
                        </div>
                      </td>

                      {/* Patient Info */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900">{order.patientName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{order.patientAge} سنة</span>
                          <span>•</span>
                          <span>{order.patientGender === 'male' ? 'ذكر' : 'أنثى'}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-600">{order.patientPhone}</span>
                        </div>
                      </td>

                      {/* Tests badges */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {orderTests.slice(0, 3).map((testName, i) => (
                            <span 
                              key={i} 
                              className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md truncate max-w-[140px]"
                              title={testName}
                            >
                              {testName}
                            </span>
                          ))}
                          {orderTests.length > 3 && (
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                              +{orderTests.length - 3} فحوصات
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Collection Date & Branch */}
                      <td className="py-3 px-4 text-xs text-slate-600">
                        <div>{order.sampleCollectionDate}</div>
                        <div className="text-[11px] text-slate-400">{order.branch}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                          order.overallStatus === 'released'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.overallStatus === 'partially_entered'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.overallStatus === 'released' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {order.overallStatus === 'partially_entered' && <Clock className="w-3.5 h-3.5" />}
                          {order.overallStatus === 'pending_results' && <AlertCircle className="w-3.5 h-3.5" />}
                          
                          {order.overallStatus === 'released' ? 'معتمد' : order.overallStatus === 'partially_entered' ? 'إدخال جزئي' : 'بانتظار النتائج'}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tube Barcode sticker button */}
                          <button
                            onClick={() => setBarcodeOrder(order)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                            title="ملصقات أنابيب الباركود"
                          >
                            <Tag className="w-4 h-4" />
                          </button>

                          {/* Enter Results */}
                          <button
                            onClick={() => handleOpenResults(order)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-colors"
                          >
                            <FlaskConical className="w-3.5 h-3.5" />
                            <span>النتائج</span>
                          </button>

                          {/* View Report */}
                          <button
                            onClick={() => onViewReport(order)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
                            title="معاينة وطباعة التقرير"
                          >
                            <FileText className="w-3.5 h-3.5 text-teal-600" />
                            <span>التقرير</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 3: Smart Medical Calculators Hub (CBC Indices, Lipids, HOMA, INR/PT, ACR, eGFR) */}
      {showCalculatorModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-950 via-slate-900 to-rose-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/20 text-amber-300 border border-blue-400/30">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight">
                    حاسبة المعادلات المخبرية الذكية (Smart Lab Calculators)
                  </h2>
                  <p className="text-xs text-slate-300">
                    معادلات CBC، دهون الدم، مقاومة الإنسولين HOMA، السيولة INR، زلال البول ACR، وكفاءة الكلى eGFR
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCalculatorModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Calculator Tabs Navigation */}
            <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs">
              <button
                onClick={() => setCalcTab('cbc')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  calcTab === 'cbc' ? 'bg-rose-900 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                معادلات CBC & Indices
              </button>
              <button
                onClick={() => setCalcTab('lipid')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  calcTab === 'lipid' ? 'bg-blue-900 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                حاسبة الدهون (Friedewald)
              </button>
              <button
                onClick={() => setCalcTab('homa')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  calcTab === 'homa' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                مقاومة الإنسولين HOMA-IR
              </button>
              <button
                onClick={() => setCalcTab('inr')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  calcTab === 'inr' ? 'bg-emerald-800 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                السيولة INR & PT
              </button>
              <button
                onClick={() => setCalcTab('acr')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  calcTab === 'acr' ? 'bg-teal-800 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                زلال البول ACR
              </button>
              <button
                onClick={() => setCalcTab('egfr')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  calcTab === 'egfr' ? 'bg-indigo-900 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                كفاءة الكلى eGFR
              </button>
            </div>

            {/* Modal Body: Active Calculator View */}
            <div className="p-6 bg-slate-50 space-y-6 max-h-[65vh] overflow-y-auto">
              
              {/* TAB 1: CBC Indices */}
              {calcTab === 'cbc' && (
                <div className="space-y-4">
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-950 font-medium">
                    المعادلات: MCV = (Hct × 10) / RBC | MCH = (Hb × 10) / RBC | MCHC = (Hb × 100) / Hct
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hemoglobin (Hb g/dL)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={calcHb}
                        onChange={(e) => setCalcHb(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">RBC Count (x10^6/uL)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={calcRbc}
                        onChange={(e) => setCalcRbc(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hematocrit (Hct %)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={calcHct}
                        onChange={(e) => setCalcHct(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  {(() => {
                    const res = calculateCBCIndices(calcHb, calcRbc, calcHct);
                    return res ? (
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                        <span className="text-xs font-bold text-slate-500">النتائج المحسوبة فورياً:</span>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[11px] text-slate-500 block">MCV (متوسط حجم الكرية)</span>
                            <span className="text-lg font-black text-rose-950 font-mono">{res.mcv} fL</span>
                            <span className="text-[10px] text-slate-400 block">Normal: 80 - 98</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[11px] text-slate-500 block">MCH (متوسط الهيموجلوبين)</span>
                            <span className="text-lg font-black text-rose-950 font-mono">{res.mch} pg</span>
                            <span className="text-[10px] text-slate-400 block">Normal: 27 - 33</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[11px] text-slate-500 block">MCHC (التركيز)</span>
                            <span className="text-lg font-black text-rose-950 font-mono">{res.mchc} g/dL</span>
                            <span className="text-[10px] text-slate-400 block">Normal: 32 - 36</span>
                          </div>
                        </div>

                        {editingOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...currentResults };
                              const tDef = tests.find(t => t.id === 'test-cbc');
                              if (tDef) {
                                handleValueChange(tDef, 'hb', calcHb.toString());
                                handleValueChange(tDef, 'rbc', calcRbc.toString());
                                handleValueChange(tDef, 'hct', calcHct.toString());
                              }
                              setShowCalculatorModal(false);
                            }}
                            className="w-full py-2 bg-rose-900 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                          >
                            حقن قيم CBC المحسوبة في نتائج المريض الحالية ✓
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 text-center py-4">أدخل قيم الهيموجلوبين وكرات الدم الحمراء والهيماتوكريت للحساب</div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 2: Lipid Profile */}
              {calcTab === 'lipid' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-blue-950 font-medium">
                    معادلة Friedewald: VLDL = Trig / 5 | LDL = Total Chol - HDL - VLDL (صالحة عند الدهون الثلاثية &lt; 400 mg/dL)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Total Cholesterol (mg/dL)</label>
                      <input
                        type="number"
                        value={calcChol}
                        onChange={(e) => setCalcChol(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Triglycerides (mg/dL)</label>
                      <input
                        type="number"
                        value={calcTrig}
                        onChange={(e) => setCalcTrig(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">HDL Cholesterol (mg/dL)</label>
                      <input
                        type="number"
                        value={calcHdl}
                        onChange={(e) => setCalcHdl(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  {(() => {
                    const res = calculateLipidProfile(calcChol, calcTrig, calcHdl);
                    return res ? (
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                        <span className="text-xs font-bold text-slate-500">النتائج المحسوبة:</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">VLDL</span>
                            <span className="text-base font-black text-blue-950 font-mono">{res.vldl} mg/dL</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">LDL (الضار)</span>
                            <span className="text-base font-black text-rose-950 font-mono">{res.ldl} mg/dL</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">مؤشر الخطورة (Ratio)</span>
                            <span className="text-base font-black text-slate-900 font-mono">{res.cholHdlRatio}</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[10px] text-slate-500 block">Non-HDL</span>
                            <span className="text-base font-black text-slate-900 font-mono">{res.nonHdl} mg/dL</span>
                          </div>
                        </div>

                        {editingOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              const tDef = tests.find(t => t.id === 'test-lipids');
                              if (tDef) {
                                handleValueChange(tDef, 'chol', calcChol.toString());
                                handleValueChange(tDef, 'trig', calcTrig.toString());
                                handleValueChange(tDef, 'hdl', calcHdl.toString());
                              }
                              setShowCalculatorModal(false);
                            }}
                            className="w-full py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                          >
                            حقن قيم الدهون المحسوبة في نتائج المريض الحالية ✓
                          </button>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* TAB 3: HOMA-IR */}
              {calcTab === 'homa' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 font-medium">
                    معادلة HOMA-IR: (Fasting Glucose mg/dL × Fasting Insulin uIU/mL) / 405
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">السكر الصائم (Glucose mg/dL)</label>
                      <input
                        type="number"
                        value={calcFbg}
                        onChange={(e) => setCalcFbg(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">إنسولين الدم الصائم (Insulin uIU/mL)</label>
                      <input
                        type="number"
                        value={calcInsulin}
                        onChange={(e) => setCalcInsulin(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  {(() => {
                    const res = calculateHomaIR(calcFbg, calcInsulin);
                    return res ? (
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-xs text-slate-500 font-bold block">مؤشر HOMA-IR:</span>
                            <span className="text-2xl font-black text-rose-950 font-mono">{res.homaIr}</span>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            res.stage === 'high_resistance' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                            res.stage === 'early_resistance' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {res.stageAr}
                          </span>
                        </div>

                        {editingOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              const tDef = tests.find(t => t.id === 'test-diabetes');
                              if (tDef) {
                                handleValueChange(tDef, 'fbg', calcFbg.toString());
                                handleValueChange(tDef, 'fasting_insulin', calcInsulin.toString());
                              }
                              setShowCalculatorModal(false);
                            }}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                          >
                            حقن مؤشر HOMA-IR والسكر في نتائج المريض الحالية ✓
                          </button>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* TAB 4: INR & PT */}
              {calcTab === 'inr' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 font-medium">
                    معادلة INR = (PT Patient / PT Control) ^ ISI | Activity % = (Control / Patient) × 100
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">زمن المريض (PT Patient sec)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={calcPtPatient}
                        onChange={(e) => setCalcPtPatient(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">زمن الكنترول (PT Control sec)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={calcPtControl}
                        onChange={(e) => setCalcPtControl(parseFloat(e.target.value) || 12.0)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  {(() => {
                    const res = calculateINR(calcPtPatient, calcPtControl, 1.0);
                    return res ? (
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[11px] text-slate-500 block">INR (معدل التخثر الدولي)</span>
                            <span className="text-2xl font-black text-emerald-900 font-mono">{res.inr}</span>
                            <span className="text-[10px] text-slate-400 block">Normal: 0.85 - 1.15</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="text-[11px] text-slate-500 block">Prothrombin Activity %</span>
                            <span className="text-2xl font-black text-slate-900 font-mono">{res.activityPercent}%</span>
                            <span className="text-[10px] text-slate-400 block">Normal: 70 - 100%</span>
                          </div>
                        </div>

                        {editingOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              const tDef = tests.find(t => t.id === 'test-coag');
                              if (tDef) {
                                handleValueChange(tDef, 'pt_patient', calcPtPatient.toString());
                              }
                              setShowCalculatorModal(false);
                            }}
                            className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                          >
                            حقن قيم PT و INR في نتائج المريض الحالية ✓
                          </button>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* TAB 5: Urine ACR */}
              {calcTab === 'acr' && (
                <div className="space-y-4">
                  <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200 text-xs text-teal-950 font-medium">
                    معادلة ACR: (Urine Microalbumin mg/L / Urine Creatinine g/dL) = mg/g Creatinine
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">الزلال الدقيق بالبول (Microalbumin mg/L)</label>
                      <input
                        type="number"
                        value={calcMicroalb}
                        onChange={(e) => setCalcMicroalb(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">كرياتينين البول (Creatinine mg/dL)</label>
                      <input
                        type="number"
                        value={calcUrineCreat}
                        onChange={(e) => setCalcUrineCreat(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  {(() => {
                    const res = calculateACR(calcMicroalb, calcUrineCreat);
                    return res ? (
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-xs text-slate-500 font-bold block">نسبة الزلال للكرياتينين ACR:</span>
                            <span className="text-2xl font-black text-teal-950 font-mono">{res.acr} mg/g</span>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            res.stage === 'macroalbuminuria' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                            res.stage === 'microalbuminuria' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {res.stageAr}
                          </span>
                        </div>

                        {editingOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              const tDef = tests.find(t => t.id === 'test-acr');
                              if (tDef) {
                                handleValueChange(tDef, 'urine_microalb', calcMicroalb.toString());
                                handleValueChange(tDef, 'urine_creat', calcUrineCreat.toString());
                              }
                              setShowCalculatorModal(false);
                            }}
                            className="w-full py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                          >
                            حقن نسبة ACR في نتائج المريض الحالية ✓
                          </button>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* TAB 6: eGFR */}
              {calcTab === 'egfr' && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 text-xs text-indigo-950 font-medium">
                    معادلة CKD-EPI 2021 لتقدير معدل الترشيح الكلوي بناءً على كرياتينين السيروم والسن والنوع
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الكرياتينين بالدم (Serum Creatinine mg/dL)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={calcSerumCreat}
                      onChange={(e) => setCalcSerumCreat(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  {(() => {
                    const age = editingOrder ? editingOrder.patientAge : 40;
                    const gender = editingOrder ? editingOrder.patientGender : 'male';
                    const egfr = calculateEGFR(calcSerumCreat, age, gender);
                    return egfr !== null ? (
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-xs text-slate-500 font-bold block">معدل الترشيح الكلوي eGFR:</span>
                            <span className="text-2xl font-black text-indigo-950 font-mono">{egfr} mL/min/1.73m2</span>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            egfr >= 90 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                            egfr >= 60 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}>
                            {egfr >= 90 ? 'وظيفة كلوية طبيعية (G1 Normal)' : egfr >= 60 ? 'انخفاض كلوي طفيف (G2 Mild)' : 'اعتلال كلوي (G3+ CKD)'}
                          </span>
                        </div>

                        {editingOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              const tDef = tests.find(t => t.id === 'test-kidney');
                              if (tDef) {
                                handleValueChange(tDef, 'creatinine', calcSerumCreat.toString());
                              }
                              setShowCalculatorModal(false);
                            }}
                            className="w-full py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                          >
                            حقن الكرياتينين و eGFR في نتائج المريض الحالية ✓
                          </button>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
              <button
                type="button"
                onClick={() => setShowCalculatorModal(false)}
                className="px-5 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-bold"
              >
                إغلاق الحاسبة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Results Entry & Verification */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-teal-800 to-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight">إدخال وتدقيق النتائج المخبرية</h2>
                  <span className="bg-teal-500/30 text-teal-200 text-xs px-2 py-0.5 rounded font-mono font-bold">
                    {editingOrder.sampleBarcode}
                  </span>
                </div>
                <p className="text-xs text-teal-100 mt-0.5">
                  المريض: <strong>{editingOrder.patientName}</strong> ({editingOrder.patientAge} سنة - {editingOrder.patientGender === 'male' ? 'ذكر' : 'أنثى'})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCalculatorModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-700/90 hover:bg-blue-600 text-white text-xs font-bold border border-blue-400/40 transition-colors shadow-xs"
                  title="فتح حاسبة المعادلات المخبرية الذكية (CBC, Lipids, HOMA, PT/INR, ACR, eGFR)"
                >
                  <Calculator className="w-3.5 h-3.5 text-amber-300" />
                  <span>حاسبة المعادلات المخبرية</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickFillNormal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-white text-xs font-bold border border-rose-500/40 transition-colors"
                  title="ملء جميع الحقول الشاغرة بالقيم الطبيعية القياسية للتوفير في وقت الإدخال"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>ملء تلقائي بالقيم الطبيعية</span>
                </button>

                <button
                  onClick={() => setEditingOrder(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Test Panels & Parameters Form */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
              {editingOrder.testIds.map(testId => {
                const testDef = tests.find(t => t.id === testId);
                if (!testDef) return null;

                return (
                  <div key={testDef.id} className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                      <div className="font-extrabold text-sm text-slate-800">
                        {testDef.nameAr} ({testDef.nameEn})
                      </div>
                      <span className="text-xs text-slate-500 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">
                        {testDef.sampleType}
                      </span>
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {testDef.parameters.map(param => {
                        const currentVal = currentResults[param.id]?.value || '';
                        const flag = currentResults[param.id]?.flag;
                        const isHigh = flag === 'HIGH';
                        const isLow = flag === 'LOW';
                        const isPanic = flag === 'PANIC';

                        // Calculate gender-based reference display
                        let refStr = param.refText || `${param.defaultRefMin ?? ''} - ${param.defaultRefMax ?? ''}`;
                        if (editingOrder.patientGender === 'male' && param.refMale) refStr = param.refMale;
                        if (editingOrder.patientGender === 'female' && param.refFemale) refStr = param.refFemale;

                        return (
                          <div 
                            key={param.id} 
                            className={`p-3 rounded-xl border transition-all ${
                              isPanic 
                                ? 'border-red-400 bg-red-50/50' 
                                : isHigh 
                                ? 'border-rose-300 bg-rose-50/40' 
                                : isLow 
                                ? 'border-blue-300 bg-blue-50/40' 
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <label className="text-xs font-bold text-slate-800">
                                {param.nameEn}
                              </label>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {param.unit}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mb-2 truncate">
                              {param.nameAr}
                            </div>

                            {/* Input or Options Select */}
                            {param.options && param.options.length > 0 ? (
                              <select
                                value={currentVal}
                                onChange={(e) => handleValueChange(testDef, param.id, e.target.value)}
                                className="w-full text-xs font-bold py-1.5 px-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                              >
                                <option value="">-- اختر النتيجة --</option>
                                {param.options.map((opt, idx) => (
                                  <option key={idx} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder={param.isCalculated ? 'محسوب تلقائياً' : 'أدخل القيمة'}
                                  value={currentVal}
                                  onChange={(e) => handleValueChange(testDef, param.id, e.target.value)}
                                  className={`w-full text-xs font-bold py-1.5 px-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                    isPanic 
                                      ? 'border-red-500 text-red-700 bg-red-50 font-black' 
                                      : isHigh 
                                      ? 'border-rose-400 text-rose-700 bg-rose-50' 
                                      : isLow 
                                      ? 'border-blue-400 text-blue-700 bg-blue-50' 
                                      : 'border-slate-300 bg-white'
                                  }`}
                                />
                                {isHigh && (
                                  <span className="absolute left-2 top-1.5 text-[9px] font-black text-rose-600 bg-rose-100 px-1 rounded">
                                    ▲ High
                                  </span>
                                )}
                                {isLow && (
                                  <span className="absolute left-2 top-1.5 text-[9px] font-black text-blue-600 bg-blue-100 px-1 rounded">
                                    ▼ Low
                                  </span>
                                )}
                                {isPanic && (
                                  <span className="absolute left-2 top-1.5 text-[9px] font-black text-red-700 bg-red-200 px-1 rounded animate-pulse">
                                    CRITICAL
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Reference Interval text */}
                            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                              <span>المعدل الطبيعي:</span>
                              <span className="font-mono text-slate-700">{refStr}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Technician Name & Remarks */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اسم الفاحص / أخصائي التحاليل (Lab Specialist)
                    </label>
                    <div className="space-y-1.5">
                      <select
                        value={currentTechName}
                        onChange={(e) => setCurrentTechName(e.target.value)}
                        className="w-full text-xs font-semibold py-2 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-800"
                      >
                        <option value="كيميائي / هاني عبد الفتاح (أخصائي أول كيمياء وسيرولوجي)">كيميائي / هاني عبد الفتاح (كيمياء وسيرولوجي)</option>
                        <option value="كيميائية / ريهام عزمي (أخصائية أمراض دم وهرمونات)">كيميائية / ريهام عزمي (أمراض دم وهرمونات)</option>
                        <option value="ممرض وفني سحب / كريم الدسوقي">فني سحب / كريم الدسوقي</option>
                        {staff.map(s => (
                          <option key={s.id} value={`${s.name} (${s.roleAr})`}>
                            {s.name} ({s.roleAr})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="أو اكتب اسماً مخصصاً..."
                        value={currentTechName}
                        onChange={(e) => setCurrentTechName(e.target.value)}
                        className="w-full text-xs font-medium py-1.5 px-3 rounded-xl border border-slate-200 text-slate-600 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      طبيب الاعتماد / الاستشاري المراجع
                    </label>
                    <select
                      value={currentDirectorName}
                      onChange={(e) => setCurrentDirectorName(e.target.value)}
                      className="w-full text-xs font-bold py-2 px-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-800"
                    >
                      <option value="أ.د / رحاب على عبد الحميد">المدير الفني: أ.د / رحاب على عبد الحميد (استشاري وأخصائي الباثولوجيا الإكلينيكية)</option>
                      <option value="د. رامي مختار">د. رامي مختار (طبيب الباثولوجيا الإكلينيكية - كلية طب قصر العيني)</option>
                      <option value="أ.د / رحاب على عبد الحميد & د. رامي مختار">إشراف مشترك: أ.د / رحاب على عبد الحميد + د. رامي مختار</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    التعليق الإكلينيكي والملاحظات الطبية (Clinical Comments & Remarks)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="اكتب أي ملاحظة طبية تظهر بأسفل التقرير للمريض والطبيب المعالج..."
                    value={currentRemarks}
                    onChange={(e) => setCurrentRemarks(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-bold transition-colors"
              >
                إلغاء التعديل
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveResults('partially_entered')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ كمسودة (إدخال جزئي)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveResults('released')}
                  className="flex items-center gap-1.5 px-6 py-2 rounded-xl text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/30 text-xs font-bold transition-all hover:scale-102"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>اعتماد وإصدار التقرير النهائي</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Tube Barcode Labels Printer */}
      {barcodeOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-slate-900 text-base">ملصقات أنابيب العينات (Sample Labels)</h3>
              </div>
              <button 
                onClick={() => setBarcodeOrder(null)} 
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              ملصقات جاهزة للطباعة على طابعات الباركود الحرارية (Zebra / Xprinter) لأنابيب الاختبار:
            </p>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
              {barcodeOrder.testIds.map((testId) => {
                const t = tests.find(x => x.id === testId);
                if (!t) return null;

                const tubeColorClass = 
                  t.tubeColor === 'purple' ? 'border-purple-500 bg-purple-50' :
                  t.tubeColor === 'yellow' ? 'border-amber-400 bg-amber-50' :
                  t.tubeColor === 'blue' ? 'border-sky-500 bg-sky-50' :
                  t.tubeColor === 'grey' ? 'border-slate-500 bg-slate-50' :
                  'border-teal-500 bg-teal-50';

                return (
                  <div 
                    key={t.id} 
                    className={`p-3 rounded-xl border-2 ${tubeColorClass} text-slate-900 relative flex items-center justify-between gap-3 shadow-2xs`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{barcodeOrder.patientName}</span>
                        <span className="text-[11px] font-bold text-slate-600">({barcodeOrder.patientAge}y/{barcodeOrder.patientGender === 'male' ? 'M' : 'F'})</span>
                      </div>
                      <div className="font-bold text-xs text-teal-800 mt-0.5">{t.code} - {t.nameEn}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {barcodeOrder.sampleCollectionDate}
                      </div>
                      <div className="text-[10px] font-bold text-slate-700 mt-1">
                        الأنبوب: {t.tubeName}
                      </div>
                    </div>

                    <div className="text-left">
                      <BarcodeRenderer value={barcodeOrder.sampleBarcode} width={130} height={32} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setBarcodeOrder(null)}
                className="px-4 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-bold"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/30"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الملصقات الحرارية</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: New Order Registration */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-slate-900 text-base">تسجيل مريض وفحص مخبري جديد</h3>
              </div>
              <button 
                onClick={() => setShowNewOrderModal(false)} 
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المريض بالكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حسام الدين محمود علي"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full text-sm font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">العمر *</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(Number(e.target.value))}
                    className="w-full text-sm font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">النوع *</label>
                  <select
                    value={newPatientGender}
                    onChange={(e) => setNewPatientGender(e.target.value as Gender)}
                    className="w-full text-sm font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="male">ذكر (Male)</option>
                    <option value="female">أنثى (Female)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الموبايل *</label>
                  <input
                    type="tel"
                    required
                    placeholder="01012345678"
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    className="w-full text-sm font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الطبيب المعالج</label>
                  <input
                    type="text"
                    placeholder="اختياري (مثال: د. مجدي يعقوب)"
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                    className="w-full text-sm p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الفرع</label>
                  <select
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className="w-full text-sm font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="الفرع الرئيسي - المهندسين">الفرع الرئيسي - المهندسين</option>
                    <option value="فرع مدينة نصر">فرع مدينة نصر</option>
                    <option value="فرع المعادي">فرع المعادي</option>
                    <option value="زيارة منزلية (Home Visit)">زيارة منزلية (Home Visit)</option>
                  </select>
                </div>
              </div>

              {/* Select Tests */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اختر الفحوصات الطبية المطلوبة *
                </label>
                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl p-2.5 space-y-1.5 bg-slate-50">
                  {tests.map(t => {
                    const isSelected = newSelectedTestIds.includes(t.id);
                    return (
                      <label 
                        key={t.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                          isSelected ? 'bg-teal-100/70 text-teal-900 font-bold' : 'hover:bg-slate-200/60 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewSelectedTestIds([...newSelectedTestIds, t.id]);
                              } else {
                                setNewSelectedTestIds(newSelectedTestIds.filter(id => id !== t.id));
                              }
                            }}
                            className="rounded text-teal-600 focus:ring-teal-500"
                          />
                          <span>{t.nameAr} ({t.nameEn})</span>
                        </div>
                        <span className="font-mono text-slate-600">{t.price} ج.م</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={newSelectedTestIds.length === 0}
                  className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-teal-600/30"
                >
                  إنشاء الفحص وبدء إدخال النتائج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
