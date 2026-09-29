import { LabTest } from '../types';

type Cat = LabTest['category'];
type Tube = 'gel' | 'edta' | 'citrate' | 'fluoride' | 'urine' | 'stool' | 'red';

const TUBES: Record<Tube, { color: LabTest['tubeColor']; name: string }> = {
  gel: { color: 'yellow', name: 'أنبوب جل أصفر (Gel SST)' },
  red: { color: 'red', name: 'أنبوب أحمر (Plain Tube)' },
  edta: { color: 'purple', name: 'أنبوب لافندر (EDTA Tube)' },
  citrate: { color: 'blue', name: 'أنبوب ستريت أزرق سماوي (Citrate Tube)' },
  fluoride: { color: 'grey', name: 'أنبوب فلورايد رمادي' },
  urine: { color: 'sterile_cup', name: 'وعاء معقم لجمع عينات البول (Sterile Container)' },
  stool: { color: 'sterile_cup', name: 'وعاء معقم لجمع عينات البراز (Stool Container)' },
};

const SAMPLE: Record<Tube, string> = {
  gel: 'Serum', red: 'Serum', edta: 'Whole Blood (EDTA)', citrate: 'Citrated Plasma',
  fluoride: 'Fluoride Plasma', urine: 'Urine', stool: 'Stool',
};

const CAT_AR: Record<string, string> = {
  hematology: 'أمراض الدم والهماتولوجي',
  chemistry: 'الكيمياء الحيوية والأملاح',
  coagulation: 'السيولة والتخثر',
  diabetes: 'داء السكري',
  lipids: 'الدهون وصحة القلب',
  liver: 'وظائف الكبد والإنزيمات',
  kidney: 'وظائف الكلى والأملاح',
  thyroid: 'الغدة الدرقية',
  hormones: 'الغدد الصماء والهرمونات',
  vitamins: 'الفيتامينات والمعادن',
  serology: 'المناعة والدلالات السيرولوجية',
  tumor: 'دلالات الأورام',
  urine: 'الفحص الميكروسكوبي وسوائل الجسم',
  stool: 'فحوصات البراز',
  cardiac: 'إنزيمات وعلامات القلب',
};

const make = (
  code: string, en: string, ar: string, catKey: string, tube: Tube, price: number,
  param: LabTest['parameters'][number], fasting = 0, hours = 4, instr = ''
): LabTest => {
  const cat = (catKey === 'hormones' ? 'thyroid' : catKey === 'tumor' ? 'serology' : catKey) as Cat;
  return {
    id: `test-${code.toLowerCase()}`,
    code,
    nameEn: en,
    nameAr: ar,
    category: cat,
    categoryAr: CAT_AR[catKey],
    sampleType: SAMPLE[tube],
    tubeColor: TUBES[tube].color,
    tubeName: TUBES[tube].name,
    turnaroundHours: hours,
    fastingHours: fasting,
    instructionsAr: instr || (fasting ? `يشترط الصيام ${fasting} ساعات.` : 'لا يشترط الصيام.'),
    price,
    parameters: [param],
  };
};

// Quantitative single-parameter test
const n = (
  code: string, en: string, ar: string, cat: string, tube: Tube, price: number,
  unit: string, min: number, max: number,
  o: { ref?: string; m?: string; f?: string; fast?: number; panicMin?: number; panicMax?: number } = {}
): LabTest =>
  make(code, en, ar, cat, tube, price, {
    id: code.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    nameEn: en, nameAr: ar, unit, defaultRefMin: min, defaultRefMax: max,
    refText: o.ref ?? `${min} - ${max}`,
    refMale: o.m, refFemale: o.f, panicMin: o.panicMin, panicMax: o.panicMax,
  }, o.fast ?? 0);

// Qualitative single-parameter test
const q = (
  code: string, en: string, ar: string, cat: string, tube: Tube, price: number,
  options: string[], ref: string
): LabTest =>
  make(code, en, ar, cat, tube, price, {
    id: code.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    nameEn: en, nameAr: ar, unit: '', options, refText: ref,
  });

export const EXTRA_TESTS: LabTest[] = [
  // Hematology
  n('RET-14', 'Reticulocyte Count', 'عدد الخلايا الشبكية', 'hematology', 'edta', 60, '%', 0.5, 2.5),
  q('ABO-15', 'Blood Group ABO & Rh', 'فصيلة الدم وعامل Rh', 'hematology', 'edta', 40, ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', 'O Rh+', 'O Rh-'], '—'),
  n('FER-16', 'Serum Ferritin', 'مخزون الحديد (فيريتين)', 'hematology', 'gel', 220, 'ng/mL', 11, 336, { ref: 'M: 24 - 336 | F: 11 - 307', m: '24 - 336', f: '11 - 307' }),
  n('IRON-17', 'Serum Iron', 'الحديد بالدم', 'hematology', 'gel', 100, 'µg/dL', 60, 170),
  n('TIBC-18', 'TIBC', 'السعة الكلية لارتباط الحديد', 'hematology', 'gel', 120, 'µg/dL', 250, 450),
  n('TSAT-19', 'Transferrin Saturation', 'نسبة تشبع الترانسفرين', 'hematology', 'gel', 100, '%', 20, 50),
  q('DCOOMBS-20', 'Direct Coombs Test', 'اختبار كومبس المباشر', 'hematology', 'edta', 120, ['Negative', 'Positive'], 'Negative'),
  q('SICKLE-21', 'Sickling Test', 'اختبار الأنيميا المنجلية', 'hematology', 'edta', 80, ['Negative', 'Positive'], 'Negative'),
  n('G6PD-22', 'G6PD Quantitative', 'إنزيم G6PD', 'hematology', 'edta', 250, 'U/g Hb', 4.6, 13.5),
  q('BFILM-23', 'Peripheral Blood Film', 'فحص مسحة الدم', 'hematology', 'edta', 90, ['Normocytic normochromic', 'Microcytic hypochromic', 'Macrocytic', 'Abnormal cells seen'], 'Normocytic normochromic'),
  // Coagulation
  n('APTT-24', 'aPTT', 'زمن الثرومبوبلاستين الجزئي', 'coagulation', 'citrate', 120, 'sec', 25, 35),
  n('FIB-25', 'Fibrinogen', 'الفيبرينوجين', 'coagulation', 'citrate', 160, 'mg/dL', 200, 400),
  n('DDIM-26', 'D-Dimer', 'دي دايمر', 'coagulation', 'citrate', 350, 'µg/mL FEU', 0, 0.5, { ref: '< 0.5' }),
  n('BT-27', 'Bleeding Time', 'زمن النزف', 'coagulation', 'citrate', 40, 'min', 1, 6),
  n('CT-28', 'Clotting Time', 'زمن التجلط', 'coagulation', 'citrate', 40, 'min', 4, 10),
  // Electrolytes & chemistry
  n('NA-29', 'Sodium (Na+)', 'الصوديوم', 'chemistry', 'gel', 60, 'mmol/L', 135, 145, { panicMin: 120, panicMax: 160 }),
  n('K-30', 'Potassium (K+)', 'البوتاسيوم', 'chemistry', 'gel', 60, 'mmol/L', 3.5, 5.1, { panicMin: 2.5, panicMax: 6.5 }),
  n('CL-31', 'Chloride (Cl-)', 'الكلوريد', 'chemistry', 'gel', 60, 'mmol/L', 98, 107),
  n('CA-32', 'Total Calcium', 'الكالسيوم الكلي', 'chemistry', 'gel', 70, 'mg/dL', 8.6, 10.2),
  n('ICA-33', 'Ionized Calcium', 'الكالسيوم المتأين', 'chemistry', 'gel', 140, 'mmol/L', 1.12, 1.32),
  n('PHOS-34', 'Phosphorus', 'الفوسفور', 'chemistry', 'gel', 70, 'mg/dL', 2.5, 4.5),
  n('MG-35', 'Magnesium', 'الماغنسيوم', 'chemistry', 'gel', 90, 'mg/dL', 1.7, 2.2),
  n('UA-36', 'Uric Acid', 'حمض اليوريك', 'chemistry', 'gel', 70, 'mg/dL', 2.4, 7.0, { ref: 'M: 3.4 - 7.0 | F: 2.4 - 6.0', m: '3.4 - 7.0', f: '2.4 - 6.0' }),
  n('UREA-37', 'Urea', 'اليوريا', 'kidney', 'gel', 60, 'mg/dL', 15, 45),
  n('BUN-38', 'Blood Urea Nitrogen (BUN)', 'نيتروجين اليوريا بالدم', 'kidney', 'gel', 60, 'mg/dL', 7, 20),
  n('CREAT-39', 'Serum Creatinine', 'الكرياتينين', 'kidney', 'gel', 60, 'mg/dL', 0.6, 1.3, { ref: 'M: 0.7 - 1.3 | F: 0.6 - 1.1', m: '0.7 - 1.3', f: '0.6 - 1.1', panicMax: 10 }),
  n('TP-40', 'Total Protein', 'البروتين الكلي', 'liver', 'gel', 60, 'g/dL', 6.4, 8.3),
  n('ALB-41', 'Serum Albumin', 'الألبومين', 'liver', 'gel', 60, 'g/dL', 3.5, 5.2),
  n('AMY-42', 'Amylase', 'إنزيم الأميليز', 'chemistry', 'gel', 150, 'U/L', 28, 100),
  n('LIPA-43', 'Lipase', 'إنزيم الليبيز', 'chemistry', 'gel', 180, 'U/L', 13, 60),
  n('LDH-44', 'LDH', 'إنزيم LDH', 'chemistry', 'gel', 100, 'U/L', 140, 280),
  n('HCY-45', 'Homocysteine', 'الهوموسيستين', 'chemistry', 'gel', 450, 'µmol/L', 5, 15, { fast: 8 }),
  n('AMM-46', 'Ammonia', 'الأمونيا', 'chemistry', 'edta', 200, 'µmol/L', 15, 45),
  n('LAC-47', 'Lactate', 'حمض اللاكتيك', 'chemistry', 'fluoride', 180, 'mmol/L', 0.5, 2.2),
  n('ZN-48', 'Zinc', 'الزنك', 'chemistry', 'red', 220, 'µg/dL', 60, 120),
  n('CU-49', 'Copper', 'النحاس', 'chemistry', 'red', 220, 'µg/dL', 70, 140),
  n('CERU-50', 'Ceruloplasmin', 'سيرولوبلازمين', 'chemistry', 'gel', 280, 'mg/dL', 20, 60),
  // Liver
  n('ALT-51', 'ALT (SGPT)', 'إنزيم ALT', 'liver', 'gel', 60, 'U/L', 7, 55),
  n('AST-52', 'AST (SGOT)', 'إنزيم AST', 'liver', 'gel', 60, 'U/L', 8, 48),
  n('ALP-53', 'Alkaline Phosphatase', 'الفوسفاتيز القلوي', 'liver', 'gel', 70, 'U/L', 44, 147),
  n('GGT-54', 'GGT', 'إنزيم GGT', 'liver', 'gel', 90, 'U/L', 5, 61, { ref: 'M: 8 - 61 | F: 5 - 36', m: '8 - 61', f: '5 - 36' }),
  n('TBIL-55', 'Total Bilirubin', 'البيليروبين الكلي', 'liver', 'gel', 60, 'mg/dL', 0.1, 1.2),
  n('DBIL-56', 'Direct Bilirubin', 'البيليروبين المباشر', 'liver', 'gel', 60, 'mg/dL', 0, 0.3),
  // Cardiac
  n('CK-57', 'CK Total', 'إنزيم CK الكلي', 'cardiac', 'gel', 120, 'U/L', 26, 308, { ref: 'M: 39 - 308 | F: 26 - 192', m: '39 - 308', f: '26 - 192' }),
  n('CKMB-58', 'CK-MB', 'إنزيم CK-MB', 'cardiac', 'gel', 160, 'U/L', 0, 25, { ref: '< 25' }),
  n('TNI-59', 'Troponin I', 'تروبونين آي', 'cardiac', 'gel', 350, 'ng/mL', 0, 0.04, { ref: '< 0.04' }),
  n('NTBNP-60', 'NT-proBNP', 'NT-proBNP', 'cardiac', 'gel', 900, 'pg/mL', 0, 125, { ref: '< 125' }),
  // Diabetes
  n('FBS-61', 'Fasting Blood Sugar (FBS)', 'سكر صائم', 'diabetes', 'fluoride', 40, 'mg/dL', 70, 100, { fast: 8, panicMin: 40, panicMax: 500 }),
  n('PPBS-62', '2h Post-prandial Glucose', 'سكر بعد الأكل بساعتين', 'diabetes', 'fluoride', 40, 'mg/dL', 70, 140, { ref: '< 140' }),
  n('RBS-63', 'Random Blood Sugar (RBS)', 'سكر عشوائي', 'diabetes', 'fluoride', 40, 'mg/dL', 70, 140, { panicMin: 40, panicMax: 500 }),
  n('HBA1C-64', 'HbA1c', 'السكر التراكمي', 'diabetes', 'edta', 200, '%', 4.0, 5.6, { ref: '< 5.7 Normal | 5.7 - 6.4 Pre-diabetes | ≥ 6.5 Diabetes' }),
  n('INS-65', 'Fasting Insulin', 'الأنسولين الصائم', 'diabetes', 'gel', 250, 'µIU/mL', 2.6, 24.9, { fast: 8 }),
  n('CPEP-66', 'C-Peptide', 'سي ببتيد', 'diabetes', 'gel', 400, 'ng/mL', 0.8, 3.1, { fast: 8 }),
  n('FRUC-67', 'Fructosamine', 'الفركتوزامين', 'diabetes', 'gel', 250, 'µmol/L', 200, 285),
  // Lipids
  n('CHOL-68', 'Total Cholesterol', 'الكوليسترول الكلي', 'lipids', 'gel', 60, 'mg/dL', 0, 200, { ref: '< 200', fast: 12 }),
  n('TG-69', 'Triglycerides', 'الدهون الثلاثية', 'lipids', 'gel', 60, 'mg/dL', 0, 150, { ref: '< 150', fast: 12 }),
  n('HDL-70', 'HDL Cholesterol', 'الكوليسترول النافع HDL', 'lipids', 'gel', 70, 'mg/dL', 40, 100, { ref: 'M: > 40 | F: > 50', m: '> 40', f: '> 50', fast: 12 }),
  n('LDL-71', 'LDL Cholesterol', 'الكوليسترول الضار LDL', 'lipids', 'gel', 70, 'mg/dL', 0, 100, { ref: '< 100 Optimal', fast: 12 }),
  n('LPA-72', 'Lipoprotein (a)', 'ليبوبروتين (أ)', 'lipids', 'gel', 450, 'mg/dL', 0, 30, { ref: '< 30' }),
  // Thyroid & hormones
  n('TSH-73', 'TSH', 'الهرمون المنبه للغدة الدرقية', 'thyroid', 'gel', 150, 'µIU/mL', 0.4, 4.0),
  n('FT4-74', 'Free T4', 'ثيروكسين حر FT4', 'thyroid', 'gel', 150, 'ng/dL', 0.8, 1.8),
  n('FT3-75', 'Free T3', 'ثلاثي يودوثيرونين حر FT3', 'thyroid', 'gel', 150, 'pg/mL', 2.3, 4.2),
  n('T3-76', 'Total T3', 'T3 الكلي', 'thyroid', 'gel', 150, 'ng/dL', 80, 200),
  n('T4-77', 'Total T4', 'T4 الكلي', 'thyroid', 'gel', 150, 'µg/dL', 5.1, 14.1),
  n('ATPO-78', 'Anti-TPO Antibodies', 'أجسام مضادة للغدة الدرقية Anti-TPO', 'thyroid', 'gel', 300, 'IU/mL', 0, 35, { ref: '< 35' }),
  n('ATG-79', 'Anti-Thyroglobulin', 'Anti-Thyroglobulin', 'thyroid', 'gel', 300, 'IU/mL', 0, 40, { ref: '< 40' }),
  n('PRL-80', 'Prolactin', 'هرمون اللبن (البرولاكتين)', 'hormones', 'gel', 200, 'ng/mL', 4, 23.3, { ref: 'M: 4.0 - 15.2 | F: 4.8 - 23.3', m: '4.0 - 15.2', f: '4.8 - 23.3' }),
  n('TESTO-81', 'Total Testosterone', 'التستوستيرون الكلي', 'hormones', 'gel', 250, 'ng/dL', 8, 950, { ref: 'M: 240 - 950 | F: 8 - 60', m: '240 - 950', f: '8 - 60' }),
  n('DHEAS-82', 'DHEA-S', 'DHEA-S', 'hormones', 'gel', 300, 'µg/dL', 35, 560, { ref: 'M: 80 - 560 | F: 35 - 430', m: '80 - 560', f: '35 - 430' }),
  n('CORT-83', 'Cortisol (Morning)', 'الكورتيزول (صباحاً)', 'hormones', 'gel', 250, 'µg/dL', 6.2, 19.4),
  n('PTH-84', 'Parathyroid Hormone (PTH)', 'هرمون الغدة الجاردرقية', 'hormones', 'edta', 400, 'pg/mL', 15, 65),
  n('AMH-85', 'AMH', 'هرمون AMH (مخزون المبيض)', 'hormones', 'gel', 700, 'ng/mL', 1.0, 4.0),
  n('BHCG-86', 'β-hCG Quantitative', 'هرمون الحمل الكمي β-hCG', 'hormones', 'gel', 150, 'mIU/mL', 0, 5, { ref: '< 5 (Non-pregnant)' }),
  // Vitamins
  n('VITD-87', 'Vitamin D (25-OH)', 'فيتامين د', 'vitamins', 'gel', 450, 'ng/mL', 30, 100, { ref: '< 20 Deficient | 20 - 29 Insufficient | 30 - 100 Sufficient' }),
  n('B12-88', 'Vitamin B12', 'فيتامين ب12', 'vitamins', 'gel', 300, 'pg/mL', 200, 900),
  n('FOL-89', 'Folate (Folic Acid)', 'حمض الفوليك', 'vitamins', 'gel', 300, 'ng/mL', 3.0, 17.0, { ref: '> 3.0' }),
  // Serology
  q('HBSAG-90', 'HBsAg', 'الفيروس الكبدي B (HBsAg)', 'serology', 'gel', 100, ['Non-reactive', 'Reactive'], 'Non-reactive'),
  q('HCV-91', 'Anti-HCV Antibodies', 'الفيروس الكبدي C', 'serology', 'gel', 120, ['Non-reactive', 'Reactive'], 'Non-reactive'),
  q('HIV-92', 'HIV Ag/Ab', 'فيروس نقص المناعة HIV', 'serology', 'gel', 150, ['Non-reactive', 'Reactive'], 'Non-reactive'),
  n('HBSAB-93', 'Anti-HBs (Quantitative)', 'المناعة ضد فيروس B (Anti-HBs)', 'serology', 'gel', 200, 'mIU/mL', 10, 1000, { ref: '> 10 Immune' }),
  q('HAV-94', 'Anti-HAV IgM', 'الفيروس الكبدي A IgM', 'serology', 'gel', 250, ['Negative', 'Positive'], 'Negative'),
  q('TOXG-95', 'Toxoplasma IgG', 'توكسوبلازما IgG', 'serology', 'gel', 200, ['Negative', 'Positive'], 'Negative'),
  q('TOXM-96', 'Toxoplasma IgM', 'توكسوبلازما IgM', 'serology', 'gel', 200, ['Negative', 'Positive'], 'Negative'),
  q('RUBG-97', 'Rubella IgG', 'الحصبة الألمانية IgG', 'serology', 'gel', 200, ['Negative', 'Positive'], 'Negative'),
  q('RUBM-98', 'Rubella IgM', 'الحصبة الألمانية IgM', 'serology', 'gel', 200, ['Negative', 'Positive'], 'Negative'),
  q('CMVG-99', 'CMV IgG', 'فيروس CMV IgG', 'serology', 'gel', 250, ['Negative', 'Positive'], 'Negative'),
  q('CMVM-100', 'CMV IgM', 'فيروس CMV IgM', 'serology', 'gel', 250, ['Negative', 'Positive'], 'Negative'),
  n('RF-101', 'Rheumatoid Factor (RF)', 'العامل الروماتويدي', 'serology', 'gel', 120, 'IU/mL', 0, 14, { ref: '< 14' }),
  n('ASO-102', 'ASO Titre', 'مضاد الستربتوليزين ASO', 'serology', 'gel', 120, 'IU/mL', 0, 200, { ref: '< 200' }),
  q('ANA-103', 'ANA (Antinuclear Antibodies)', 'الأجسام المضادة للنواة ANA', 'serology', 'gel', 350, ['Negative', 'Positive'], 'Negative'),
  n('DSDNA-104', 'Anti-dsDNA', 'Anti-dsDNA', 'serology', 'gel', 400, 'IU/mL', 0, 30, { ref: '< 30' }),
  n('CCP-105', 'Anti-CCP', 'Anti-CCP', 'serology', 'gel', 450, 'U/mL', 0, 17, { ref: '< 17' }),
  n('IGE-106', 'Total IgE', 'الحساسية الكلية IgE', 'serology', 'gel', 250, 'IU/mL', 0, 100, { ref: '< 100' }),
  q('HPYG-107', 'H. pylori IgG', 'جرثومة المعدة IgG (دم)', 'serology', 'gel', 180, ['Negative', 'Positive'], 'Negative'),
  q('VDRL-108', 'VDRL / RPR', 'اختبار الزهري VDRL', 'serology', 'gel', 100, ['Non-reactive', 'Reactive'], 'Non-reactive'),
  q('WIDAL-109', 'Widal Test', 'اختبار فيدال', 'serology', 'gel', 100, ['Negative', 'Positive'], 'Negative'),
  q('BRU-110', 'Brucella Agglutination', 'اختبار البروسيلا', 'serology', 'gel', 120, ['Negative', 'Positive'], 'Negative'),
  // Tumor markers
  n('PSA-111', 'PSA Total', 'PSA الكلي (البروستاتا)', 'tumor', 'gel', 250, 'ng/mL', 0, 4, { ref: '< 4.0' }),
  n('CEA-112', 'CEA', 'CEA', 'tumor', 'gel', 250, 'ng/mL', 0, 3, { ref: '< 3.0 (Non-smoker)' }),
  n('AFP-113', 'AFP', 'ألفا فيتو بروتين AFP', 'tumor', 'gel', 250, 'ng/mL', 0, 8, { ref: '< 8.0' }),
  n('CA125-114', 'CA 125', 'CA 125', 'tumor', 'gel', 300, 'U/mL', 0, 35, { ref: '< 35' }),
  n('CA199-115', 'CA 19-9', 'CA 19-9', 'tumor', 'gel', 300, 'U/mL', 0, 37, { ref: '< 37' }),
  n('CA153-116', 'CA 15-3', 'CA 15-3', 'tumor', 'gel', 300, 'U/mL', 0, 30, { ref: '< 30' }),
  // Urine & stool
  q('UCS-117', 'Urine Culture & Sensitivity', 'مزرعة بول وحساسية', 'urine', 'urine', 250, ['No growth', 'Growth detected'], 'No growth'),
  q('UPT-118', 'Urine Pregnancy Test', 'اختبار الحمل بالبول', 'urine', 'urine', 50, ['Negative', 'Positive'], 'Negative'),
  n('U24P-119', '24h Urine Protein', 'بروتين البول 24 ساعة', 'urine', 'urine', 150, 'mg/24h', 0, 150, { ref: '< 150' }),
  q('FOB-120', 'Stool Occult Blood', 'الدم الخفي في البراز', 'stool', 'stool', 80, ['Negative', 'Positive'], 'Negative'),
  q('HPYAG-121', 'H. pylori Antigen (Stool)', 'جرثومة المعدة (براز)', 'stool', 'stool', 250, ['Negative', 'Positive'], 'Negative'),
  q('STC-122', 'Stool Culture', 'مزرعة براز', 'stool', 'stool', 250, ['No pathogens isolated', 'Pathogen isolated'], 'No pathogens isolated'),
];
