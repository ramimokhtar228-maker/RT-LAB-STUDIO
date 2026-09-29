export type Gender = 'male' | 'female';

export interface LabParameterDefinition {
  id: string;
  nameEn: string;
  nameAr: string;
  unit: string;
  defaultRefMin?: number;
  defaultRefMax?: number;
  refText?: string;
  refMale?: string;
  refFemale?: string;
  isCalculated?: boolean;
  options?: string[]; // For qualitative tests (e.g. Negative, Trace, ++, Clear, Straw)
  panicMin?: number;
  panicMax?: number;
}

export interface LabTest {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  category: 'hematology' | 'chemistry' | 'coagulation' | 'diabetes' | 'lipids' | 'liver' | 'kidney' | 'thyroid' | 'vitamins' | 'serology' | 'urine' | 'stool' | 'cardiac';
  categoryAr: string;
  sampleType: string;
  tubeColor: 'purple' | 'yellow' | 'red' | 'blue' | 'grey' | 'green' | 'sterile_cup';
  tubeName: string;
  turnaroundHours: number;
  fastingHours: number;
  instructionsAr: string;
  price: number;
  parameters: LabParameterDefinition[];
}

export interface HealthPackage {
  id: string;
  titleAr: string;
  titleEn: string;
  badge: string;
  descriptionAr: string;
  testIds: string[];
  originalPrice: number;
  discountedPrice: number;
  iconName: string;
  popular?: boolean;
}

export interface LabParamResult {
  paramId: string;
  testId: string;
  paramNameEn: string;
  paramNameAr: string;
  value: string;
  numericValue?: number;
  unit: string;
  refRange: string;
  flag: 'NORMAL' | 'HIGH' | 'LOW' | 'PANIC' | 'POSITIVE' | 'NEGATIVE';
  notes?: string;
}

export interface Patient {
  id: string;
  nationalId?: string;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  loyaltyCardNumber?: string;
}

export type BookingStatus = 
  | 'pending'
  | 'priced'
  | 'confirmed'
  | 'technician_assigned'
  | 'sample_collected'
  | 'processing'
  | 'completed'
  | 'cancelled';

export interface Booking {
  id: string;
  bookingNumber: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientGender: Gender;
  serviceType: 'home_visit' | 'lab_branch';
  branchName?: string;
  address: string;
  area: string;
  visitDate: string;
  visitTime: string;
  selectedTestIds: string[];
  selectedPackageId?: string;
  notes?: string;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  pricingStatus?: 'pending_pricing' | 'quoted' | 'accepted' | 'completed';
  patientAgreed?: boolean;
  loyaltyDiscountApplied?: number;
  status: BookingStatus;
  technicianName?: string;
  transferredToLisOrderId?: string;
  createdAt: string;
}

export type OrderStatus = 'pending_results' | 'partially_entered' | 'verified' | 'released';

export interface LabOrder {
  id: string;
  orderNumber: string;
  sampleBarcode: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: Gender;
  patientPhone: string;
  referringDoctor?: string;
  branch: string;
  bookingId?: string;
  sampleCollectionDate: string;
  reportReleaseDate?: string;
  testIds: string[];
  results: Record<string, LabParamResult>;
  overallStatus: OrderStatus;
  clinicalRemarks?: string;
  testComments?: Record<string, string>; // Specific comment per test
  technicianName: string;
  specialistId?: string;
  directorName?: string;
  directorTitle?: string;
  clinicalDoctorName?: string;
  clinicalDoctorTitle?: string;
  verifiedByDoctor: string;
  paidAmount?: number;
  remainingAmount?: number;
  isPaid?: boolean;
  paymentMethod?: string;
  createdAt: string;
}

export interface LabSettings {
  labNameAr: string;
  labNameEn: string;
  subTitleAr: string;
  directorNameAr: string;
  directorTitleAr: string;
  clinicalDoctorNameAr: string;
  clinicalDoctorTitleAr: string;
  phonePrimary: string;
  phoneSecondary: string;
  phoneThird: string;
  whatsappNumber: string;
  addressAr: string;
  branchMain: string;
  email: string;
  website: string;
  sealTextAr: string;
  headerTheme: 'crimson_blue';
  // Financial Profit Sharing
  ceoSharePercentage: number;
  labSharePercentage: number;
  // Loyalty Points Configuration
  pointsPerPoundSpent: number; // e.g., 0.1 (1 point for every 10 EGP)
  defaultDiscountPercentage: number;
  // Security & Admin Access
  adminPassword?: string;
}

// 1. Loyalty & Discount Cards
export type LoyaltyTier = 'silver' | 'gold' | 'platinum' | 'family' | 'syndicate';

export interface LoyaltyCard {
  id: string;
  cardNumber: string;
  patientName: string;
  patientPhone: string;
  tier: LoyaltyTier;
  tierNameAr: string;
  discountPercentage: number;
  pointsBalance: number;
  totalVisits: number;
  totalSpent?: number;
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'suspended';
  barcode: string;
}

// 2. HR & Staff Management
export type StaffRole = 
  | 'lab_specialist' 
  | 'phlebotomist' 
  | 'receptionist' 
  | 'consultant_doctor' 
  | 'technical_director'
  | 'nurse' 
  | 'accountant';

export interface StaffMember {
  id: string;
  code: string;
  name: string;
  role: StaffRole;
  roleAr: string;
  titleDescription?: string;
  department: string;
  phone: string;
  nationalId: string;
  hireDate: string;
  baseSalary: number;
  shift: 'morning' | 'evening' | 'rotating';
  status: 'active' | 'on_leave' | 'inactive';
  // Financial Payroll additions
  incentives?: number; // حوافز
  bonuses?: number; // مكافآت
  deductions?: number; // خصومات
  overtimeHours?: number; // ساعات إضافية
  overtimeHourlyRate?: number; // سعر ساعة الأوفرتايم
}

// 3. Attendance & Shifts
export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  shift: 'morning' | 'evening';
  status: 'present' | 'late' | 'absent' | 'excused';
  delayMinutes: number;
  overtimeHours?: number;
  deductionAmount?: number;
  incentiveAmount?: number;
  notes?: string;
}

// 4. Financials & Accounting
export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'visa' | 'vodafone_cash' | 'instapay' | 'bank_transfer';

export interface FinancialTransaction {
  id: string;
  txNumber: string;
  type: TransactionType;
  category: 
    | 'patient_receipt' 
    | 'reagents_purchase' 
    | 'salary_payout' 
    | 'rent_utilities' 
    | 'doctor_commission' 
    | 'supplies' 
    | 'maintenance'
    | 'other';
  categoryAr: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentMethodAr: string;
  date: string;
  time: string;
  patientOrPartyName?: string;
  patientOrderId?: string;
  isDebtSettlement?: boolean;
  notes?: string;
  registeredBy: string;
}

// 5. Inventory & Reagents
export type InventoryCategory = 'reagents' | 'tubes' | 'needles' | 'strips' | 'ppe' | 'control_calibrator';

export interface InventoryItem {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  category: InventoryCategory;
  categoryAr: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  unitPrice: number;
  supplier: string;
  lotNumber: string;
  expiryDate: string;
  status: 'in_stock' | 'low_stock' | 'expired';
}

