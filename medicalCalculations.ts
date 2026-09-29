/**
 * RT LAB - Comprehensive Medical Laboratory Calculators
 * All formulas aligned with clinical pathology and laboratory medicine standards.
 */

// 1. CBC Indices & TLC Film
export interface CBCIndicesResult {
  mcv: number; // fL
  mch: number; // pg
  mchc: number; // g/dL
  differentialSum?: number; // %
  differentialValid?: boolean;
}

export function calculateCBCIndices(hb: number, rbc: number, hct: number): CBCIndicesResult | null {
  if (!rbc || rbc <= 0 || !hct || hct <= 0 || !hb || hb <= 0) return null;
  
  const mcv = parseFloat(((hct * 10) / rbc).toFixed(1));
  const mch = parseFloat(((hb * 10) / rbc).toFixed(1));
  const mchc = parseFloat(((hb * 100) / hct).toFixed(1));

  return { mcv, mch, mchc };
}

export function calculateTLCFilm(
  totalWbc: number,
  neutPct: number,
  lymphPct: number,
  monoPct: number,
  eosPct: number,
  basoPct: number
) {
  const sum = neutPct + lymphPct + monoPct + eosPct + basoPct;
  const isValid = Math.abs(sum - 100) <= 2; // within normal counting tolerance

  const absNeut = (totalWbc * (neutPct / 100)).toFixed(2);
  const absLymph = (totalWbc * (lymphPct / 100)).toFixed(2);
  const absMono = (totalWbc * (monoPct / 100)).toFixed(2);
  const absEos = (totalWbc * (eosPct / 100)).toFixed(2);
  const absBaso = (totalWbc * (basoPct / 100)).toFixed(2);

  return {
    sum,
    isValid,
    absNeut: parseFloat(absNeut),
    absLymph: parseFloat(absLymph),
    absMono: parseFloat(absMono),
    absEos: parseFloat(absEos),
    absBaso: parseFloat(absBaso)
  };
}

// 2. Lipid Profile (Friedewald Formula & Atherogenic Risk)
export interface LipidCalculationResult {
  vldl: number;
  ldl: number;
  cholHdlRatio: number;
  nonHdl: number;
  isFriedewaldValid: boolean;
  notes?: string;
}

export function calculateLipidProfile(chol: number, trig: number, hdl: number): LipidCalculationResult | null {
  if (!chol || chol <= 0 || !trig || trig <= 0 || !hdl || hdl <= 0) return null;

  const vldl = parseFloat((trig / 5).toFixed(1));
  const isFriedewaldValid = trig < 400;
  
  // If TG >= 400, direct LDL measurement is advised
  const ldl = isFriedewaldValid ? parseFloat((chol - hdl - vldl).toFixed(1)) : 0;
  const cholHdlRatio = parseFloat((chol / hdl).toFixed(2));
  const nonHdl = parseFloat((chol - hdl).toFixed(1));

  return {
    vldl,
    ldl: Math.max(0, ldl),
    cholHdlRatio,
    nonHdl,
    isFriedewaldValid,
    notes: isFriedewaldValid 
      ? 'تم حساب كوليسترول LDL و VLDL طبقاً لمعادلة Friedewald المعتمدة.'
      : 'تنبيه: الدهون الثلاثية >= 400 mg/dL، يوصى بقياس LDL المباشر (Direct LDL).'
  };
}

// 3. HOMA-IR (Homeostatic Model Assessment for Insulin Resistance)
export interface HomaResult {
  homaIr: number;
  stage: 'normal' | 'early_resistance' | 'high_resistance';
  stageAr: string;
}

export function calculateHomaIR(glucoseMgDl: number, insulinUiuMl: number): HomaResult | null {
  if (!glucoseMgDl || glucoseMgDl <= 0 || !insulinUiuMl || insulinUiuMl <= 0) return null;

  const homaIr = parseFloat(((glucoseMgDl * insulinUiuMl) / 405).toFixed(2));
  
  let stage: HomaResult['stage'] = 'normal';
  let stageAr = 'طبيعي (حساسية إنسولين مثالية)';

  if (homaIr > 2.9) {
    stage = 'high_resistance';
    stageAr = 'مقاومة إنسولين ملحوظة (Significant Insulin Resistance)';
  } else if (homaIr >= 1.9) {
    stage = 'early_resistance';
    stageAr = 'مقاومة إنسولين في مرحلة مبكرة (Borderline / Early Resistance)';
  }

  return { homaIr, stage, stageAr };
}

// 4. Coagulation PT & INR
export interface INRResult {
  inr: number;
  activityPercent: number;
}

export function calculateINR(patientPtSec: number, controlPtSec = 12.0, isi = 1.0): INRResult | null {
  if (!patientPtSec || patientPtSec <= 0 || !controlPtSec || controlPtSec <= 0) return null;

  const inr = parseFloat(Math.pow(patientPtSec / controlPtSec, isi).toFixed(2));
  const activityPercent = Math.min(100, Math.round((controlPtSec / patientPtSec) * 100));

  return { inr, activityPercent };
}

// 5. HbA1c & Estimated Average Glucose (eAG)
export function calculateEAG(hba1c: number): { eagMgDl: number; eagMmolL: number } | null {
  if (!hba1c || hba1c <= 3.0) return null;

  const eagMgDl = Math.round(28.7 * hba1c - 46.7);
  const eagMmolL = parseFloat((eagMgDl / 18.018).toFixed(1));

  return { eagMgDl, eagMmolL };
}

// 6. ACR (Albumin / Creatinine Ratio in Urine)
export interface ACRResult {
  acr: number; // mg/g
  stage: 'normal' | 'microalbuminuria' | 'macroalbuminuria';
  stageAr: string;
}

export function calculateACR(urineMicroalbuminMgL: number, urineCreatinineMgDl: number): ACRResult | null {
  if (!urineMicroalbuminMgL || urineMicroalbuminMgL < 0 || !urineCreatinineMgDl || urineCreatinineMgDl <= 0) return null;

  // Urine Creatinine in g/dL = mg/dL / 1000
  // ACR in mg/g = (mg/L) / (g/L) = (Microalbumin mg/L / (Creatinine mg/dL * 0.01))
  const acr = parseFloat((urineMicroalbuminMgL / (urineCreatinineMgDl * 0.01)).toFixed(1));

  let stage: ACRResult['stage'] = 'normal';
  let stageAr = 'طبيعي (< 30 mg/g Creatinine)';

  if (acr > 300) {
    stage = 'macroalbuminuria';
    stageAr = 'زلال كلوي صريح (Overt Proteinuria / Macroalbuminuria > 300 mg/g)';
  } else if (acr >= 30) {
    stage = 'microalbuminuria';
    stageAr = 'اعتلال كلوي دقيق مبكر (Microalbuminuria 30 - 300 mg/g)';
  }

  return { acr, stage, stageAr };
}

// 7. eGFR (CKD-EPI 2021 Equation without race coefficient)
export function calculateEGFR(creatinineMgDl: number, age: number, gender: 'male' | 'female'): number | null {
  if (!creatinineMgDl || creatinineMgDl <= 0 || !age || age <= 0) return null;

  const isFemale = gender === 'female';
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const genderMultiplier = isFemale ? 1.012 : 1.0;

  const scrOverKappa = creatinineMgDl / kappa;
  const minScr = Math.min(scrOverKappa, 1);
  const maxScr = Math.max(scrOverKappa, 1);

  const egfr = 142 * Math.pow(minScr, alpha) * Math.pow(maxScr, -1.2) * Math.pow(0.9938, age) * genderMultiplier;

  return Math.round(egfr);
}

// 8. Liver: Bilirubin & Protein Indices
export function calculateLiverIndices(
  totalBilirubin: number,
  directBilirubin: number,
  totalProtein: number,
  albumin: number
) {
  let indirectBili: number | null = null;
  if (totalBilirubin >= directBilirubin && directBilirubin >= 0) {
    indirectBili = parseFloat((totalBilirubin - directBilirubin).toFixed(2));
  }

  let globulin: number | null = null;
  let agRatio: number | null = null;
  if (totalProtein >= albumin && albumin > 0) {
    globulin = parseFloat((totalProtein - albumin).toFixed(2));
    if (globulin > 0) {
      agRatio = parseFloat((albumin / globulin).toFixed(2));
    }
  }

  return {
    indirectBili,
    globulin,
    agRatio
  };
}
