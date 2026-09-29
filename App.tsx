import React, { useState, useEffect } from 'react';
import { 
  INITIAL_TESTS, 
  INITIAL_PACKAGES, 
  INITIAL_ORDERS, 
  INITIAL_BOOKINGS, 
  INITIAL_SETTINGS,
  INITIAL_LOYALTY_CARDS,
  INITIAL_STAFF,
  INITIAL_ATTENDANCE,
  INITIAL_FINANCIALS,
  INITIAL_INVENTORY
} from './data/initialData';
import { 
  LabOrder, 
  Booking, 
  LabTest, 
  HealthPackage, 
  LabSettings, 
  BookingStatus,
  LoyaltyCard,
  StaffMember,
  AttendanceRecord,
  FinancialTransaction,
  InventoryItem
} from './types';
import { Navbar, ActiveNavTab } from './components/Navbar';
import { BookingView } from './components/BookingView';
import { LisView } from './components/LisView';
import { CatalogView } from './components/CatalogView';
import { ReportView } from './components/ReportView';
import { AdminView } from './components/AdminView';
import { LoyaltyView } from './components/LoyaltyView';
import { HrView } from './components/HrView';
import { FinanceView } from './components/FinanceView';
import { InventoryView } from './components/InventoryView';
import { LoginGate } from './components/LoginGate';
import { UsersView } from './components/UsersView';
import { RecordsView, RecordCollection } from './components/RecordsView';
import { useCloudCollection } from './lib/useCloudCollection';
import { Session, ROLE_TABS, ROLE_LABELS, READ_COLS, WRITE_COLS, loadSession, saveSession, signOutStaff } from './lib/auth';
import { supabase } from './lib/supabase';
import { subscribeCloudStatus, setCloudStatus } from './lib/cloudStatus';
import {
  seedCloudDatabaseIfEmpty,
  subscribeToBookings,
  subscribeToOrders,
  subscribeToSettings,
  saveBookingToCloud,
  deleteBookingFromCloud,
  deleteOrderFromCloud,
  saveOrderToCloud,
  saveSettingsToCloud
} from './lib/cloud';

export default function App() {
  // Auth / role state
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const role = session?.role;
  const cloudOn = !!session && session.role !== 'patient';
  const canRead = (col: string) => !!role && READ_COLS[role].includes(col);
  const canWrite = (col: string) => !!role && WRITE_COLS[role].includes(col);

  // A staff session that is no longer valid on the server falls back to the login screen
  useEffect(() => {
    if (session && session.role !== 'patient') {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) { saveSession(null); setSession(null); }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('booking');

  // Core Data with Supabase Cloud Realtime Sync
  const [orders, setOrders] = useState<LabOrder[]>(() => {
    try {
      const saved = localStorage.getItem('rt_lab_orders_v2');
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem('rt_lab_bookings_v2');
      return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  });

  const [tests, setTests] = useState<LabTest[]>(() => {
    try {
      const saved = localStorage.getItem('rt_lab_tests_v2');
      if (!saved) return INITIAL_TESTS;
      const parsed: LabTest[] = JSON.parse(saved);
      const have = new Set(parsed.map(t => t.id));
      return [...parsed, ...INITIAL_TESTS.filter(t => !have.has(t.id))];
    } catch {
      return INITIAL_TESTS;
    }
  });

  const [packages, setPackages] = useState<HealthPackage[]>(() => {
    try {
      const saved = localStorage.getItem('rt_lab_packages_v2');
      return saved ? JSON.parse(saved) : INITIAL_PACKAGES;
    } catch {
      return INITIAL_PACKAGES;
    }
  });

  const [settings, setSettings] = useState<LabSettings>(() => {
    try {
      const saved = localStorage.getItem('rt_lab_settings_v2');
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // 1. Loyalty Cards State
  const [loyaltyCards, setLoyaltyCards] = useState<LoyaltyCard[]>(() => {
    try {
      const saved = localStorage.getItem('rt_lab_loyalty_v2');
      return saved ? JSON.parse(saved) : INITIAL_LOYALTY_CARDS;
    } catch {
      return INITIAL_LOYALTY_CARDS;
    }
  });

  // 2. HR & Staff State
  const [staff, setStaff] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem('rt_lab_staff_v2');
      return saved ? JSON.parse(saved) : INITIAL_STAFF;
    } catch {
      return INITIAL_STAFF;
    }
  });

  // 3. Attendance State
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('rt_lab_attendance_v2');
      return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
    } catch {
      return INITIAL_ATTENDANCE;
    }
  });

  // 4. Financials State
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('rt_lab_finance_v2');
      return saved ? JSON.parse(saved) : INITIAL_FINANCIALS;
    } catch {
      return INITIAL_FINANCIALS;
    }
  });

  // 5. Inventory & Reagents State
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('rt_lab_inventory_v2');
      return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
    } catch {
      return INITIAL_INVENTORY;
    }
  });

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  useEffect(() => subscribeCloudStatus((status) => setIsCloudConnected(status === 'connected')), []);

  // Selected Order for Report View
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => {
    return orders[0]?.id || 'order-101';
  });

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial cloud seeding + real-time subscriptions (staff only; patients never read cloud data)
  useEffect(() => {
    if (!cloudOn || !role) { setCloudStatus('offline'); return; }
    setCloudStatus('connecting');
    let cancelled = false;
    const unsubs: Array<() => void> = [];

    (async () => {
      await seedCloudDatabaseIfEmpty(canWrite, bookings, orders, settings);
      if (cancelled) return;
      if (canRead('bookings')) {
        unsubs.push(subscribeToBookings(
          (list) => { setBookings(list); },
          () => setCloudStatus('offline')
        ));
      }
      if (canRead('orders')) {
        unsubs.push(subscribeToOrders(
          (list) => { setOrders(list); },
          () => setCloudStatus('offline')
        ));
      }
      if (canRead('settings')) {
        unsubs.push(subscribeToSettings((cloudSettings) => {
          const { id: _id, ...rest } = cloudSettings as any;
          setSettings(rest as typeof settings);
        }));
      }
    })();

    return () => { cancelled = true; unsubs.forEach(u => u()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudOn, role]);

  // Sync to LocalStorage as offline fallback
  useEffect(() => {
    localStorage.setItem('rt_lab_orders_v2', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('rt_lab_bookings_v2', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('rt_lab_tests_v2', JSON.stringify(tests));
  }, [tests]);

  useEffect(() => {
    localStorage.setItem('rt_lab_settings_v2', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('rt_lab_loyalty_v2', JSON.stringify(loyaltyCards));
  }, [loyaltyCards]);

  useEffect(() => {
    localStorage.setItem('rt_lab_staff_v2', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem('rt_lab_attendance_v2', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('rt_lab_finance_v2', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('rt_lab_inventory_v2', JSON.stringify(inventory));
  }, [inventory]);

  // Handlers with instant cloud broadcasting
  const handleAddNewBooking = async (newBooking: Booking) => {
    setBookings([newBooking, ...bookings]);
    try {
      await saveBookingToCloud(newBooking);
    } catch (err) {
      console.warn('Saved locally, will sync when online:', err);
    }
    showToast(`تم تسجيل الحجز رقم ${newBooking.bookingNumber} وتسميعه سحابياً بنجاح!`);
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: BookingStatus, techName?: string) => {
    const updatedList = bookings.map(b => {
      if (b.id === bookingId) {
        const updated = {
          ...b,
          status: newStatus,
          technicianName: techName || b.technicianName
        };
        // Cloud update
        saveBookingToCloud(updated).catch(e => console.warn('Cloud update queued:', e));
        return updated;
      }
      return b;
    });

    setBookings(updatedList);
    showToast('تم تحديث حالة الحجز وتسميعه لجميع الأجهزة');
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الحجز؟')) {
      setBookings(bookings.filter(b => b.id !== bookingId));
      try {
        await deleteBookingFromCloud(bookingId);
      } catch (err) {
        console.warn('Delete cloud failed:', err);
      }
      showToast('تم حذف الحجز من السحابة');
    }
  };

  // Transfer Booking to LIS order with cloud broadcast
  const handleTransferBookingToLis = async (booking: Booking) => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newOrderId = `order-${Date.now()}`;
    const newSampleBarcode = `SMP-2026-${randomSuffix}`;

    const newOrder: LabOrder = {
      id: newOrderId,
      orderNumber: `RT-2026-${randomSuffix}`,
      sampleBarcode: newSampleBarcode,
      patientId: `pat-${Date.now().toString().slice(-4)}`,
      patientName: booking.patientName,
      patientAge: booking.patientAge,
      patientGender: booking.patientGender,
      patientPhone: booking.patientPhone,
      referringDoctor: 'طبيبي الخاص / حجز منزلي',
      branch: booking.serviceType === 'home_visit' ? `زيارة منزلية (${booking.area})` : (booking.branchName || 'الفرع الرئيسي: بهتيم شبرا الخيمة'),
      bookingId: booking.id,
      sampleCollectionDate: `${booking.visitDate} ${booking.visitTime}`,
      testIds: booking.selectedTestIds.length > 0 ? booking.selectedTestIds : ['test-cbc', 'test-liver', 'test-kidney'],
      results: {},
      overallStatus: 'pending_results',
      technicianName: booking.technicianName || 'كيميائي / هاني عبد الفتاح',
      verifiedByDoctor: settings.directorNameAr,
      createdAt: new Date().toISOString()
    };

    setOrders([newOrder, ...orders]);

    // Automatic Loyalty Card & Points Crediting upon sample collection / payment (النقاط وكروت الولاء تلقائياً)
    const pointsEarned = Math.max(15, Math.round((booking.finalPrice || 350) * (settings.pointsPerPoundSpent || 0.1)));
    const cleanPhone = booking.patientPhone.replace(/\D/g, '');
    const existingCardIndex = loyaltyCards.findIndex(c => 
      c.patientPhone.replace(/\D/g, '') === cleanPhone || 
      c.patientName.trim() === booking.patientName.trim()
    );

    let updatedCards = [...loyaltyCards];
    if (existingCardIndex >= 0) {
      const existing = updatedCards[existingCardIndex];
      updatedCards[existingCardIndex] = {
        ...existing,
        pointsBalance: existing.pointsBalance + pointsEarned,
        totalVisits: (existing.totalVisits || 1) + 1,
        totalSpent: (existing.totalSpent || 0) + booking.finalPrice
      };
      setLoyaltyCards(updatedCards);
    } else {
      const randomLoyal = Math.floor(1000 + Math.random() * 9000);
      const isGold = booking.finalPrice >= 500;
      const newCard: LoyaltyCard = {
        id: `card-${Date.now()}`,
        cardNumber: `RT-LOYAL-${randomLoyal}`,
        patientName: booking.patientName,
        patientPhone: booking.patientPhone,
        tier: isGold ? 'gold' : 'silver',
        tierNameAr: isGold ? 'البطاقة الذهبية (Gold)' : 'البطاقة الفضية (Silver)',
        discountPercentage: isGold ? 20 : (settings.defaultDiscountPercentage || 15),
        pointsBalance: 50 + pointsEarned, // 50 welcome points + points earned
        totalVisits: 1,
        totalSpent: booking.finalPrice,
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        barcode: `RT-LOYAL-${randomLoyal}`
      };
      updatedCards = [newCard, ...updatedCards];
      setLoyaltyCards(updatedCards);
    }

    // Mark booking as transferred and sample collected
    const updatedBooking: Booking = { 
      ...booking, 
      transferredToLisOrderId: newOrderId, 
      status: 'sample_collected' 
    };

    setBookings(bookings.map(b => b.id === booking.id ? updatedBooking : b));

    // Save both to cloud
    try {
      await saveOrderToCloud(newOrder);
      await saveBookingToCloud(updatedBooking);
    } catch (e) {
      console.warn('Sync to cloud error:', e);
    }

    setSelectedOrderId(newOrderId);
    setActiveTab('lis');
    showToast(`تم استقبال العينة، إصدار كارت ولاء تلقائي وإضافة ${pointsEarned} نقطة للمريض! (كود: ${newSampleBarcode})`);
  };

  const handleSaveOrder = async (updatedOrder: LabOrder) => {
    const exists = orders.some(o => o.id === updatedOrder.id);
    if (exists) {
      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    } else {
      setOrders([updatedOrder, ...orders]);
    }

    try {
      await saveOrderToCloud(updatedOrder);
    } catch (err) {
      console.warn('Save order cloud error:', err);
    }

    showToast('تم حفظ الفحص المخبري وتسميع النتائج سحابياً');
  };

  const handleViewReport = (order: LabOrder) => {
    setSelectedOrderId(order.id);
    setActiveTab('report');
  };

  const handleUpdateTestPrice = (testId: string, newPrice: number) => {
    setTests(tests.map(t => t.id === testId ? { ...t, price: newPrice } : t));
    showToast('تم تحديث سعر الفحص في الكتالوج');
  };

  // Loyalty Handlers
  const handleAddLoyaltyCard = (newCard: LoyaltyCard) => {
    setLoyaltyCards([newCard, ...loyaltyCards]);
    showToast(`تم إصدار كارت الولاء رقم ${newCard.cardNumber} بنجاح!`);
  };

  const handleUpdateLoyaltyPoints = (cardId: string, newPoints: number) => {
    setLoyaltyCards(loyaltyCards.map(c => c.id === cardId ? { ...c, pointsBalance: newPoints } : c));
    showToast('تم تحديث رصيد نقاط الولاء');
  };

  // HR & Staff Handlers
  const handleAddStaff = (member: StaffMember) => {
    setStaff([member, ...staff]);
    showToast(`تم تسجيل الموظف ${member.name} بنجاح`);
  };

  const handleUpdateStaffStatus = (staffId: string, status: StaffMember['status']) => {
    setStaff(staff.map(s => s.id === staffId ? { ...s, status } : s));
    showToast('تم تحديث حالة الموظف');
  };

  const handleRecordAttendance = (record: AttendanceRecord) => {
    const existingIndex = attendance.findIndex(a => a.id === record.id);
    if (existingIndex >= 0) {
      const copy = [...attendance];
      copy[existingIndex] = record;
      setAttendance(copy);
    } else {
      setAttendance([record, ...attendance]);
    }
    showToast(`تم تسجيل الحضور: ${record.staffName}`);
  };

  // Finance Handlers
  const handleAddTransaction = (tx: FinancialTransaction) => {
    setTransactions([tx, ...transactions]);
    showToast(`تم تسجيل السند المالي رقم ${tx.txNumber} بنجاح`);
  };

  // Inventory Handlers
  const handleAddInventoryItem = (item: InventoryItem) => {
    setInventory([item, ...inventory]);
    showToast(`تم إضافة الصنف ${item.nameAr} إلى المخزن`);
  };

  const handleUpdateInventoryStock = (itemId: string, newStock: number) => {
    setInventory(inventory.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          currentStock: newStock,
          status: newStock <= item.minThreshold ? 'low_stock' : 'in_stock'
        };
      }
      return item;
    }));
    showToast('تم تحديث رصيد المخزن');
  };

  // Packages Handlers
  const handleUpdatePackage = (updatedPkg: HealthPackage) => {
    setPackages(packages.map(p => p.id === updatedPkg.id ? updatedPkg : p));
    showToast(`تم تحديث باقة ${updatedPkg.titleAr} بنجاح`);
  };

  const handleAddPackage = (newPkg: HealthPackage) => {
    setPackages([newPkg, ...packages]);
    showToast(`تمت إضافة باقة ${newPkg.titleAr} الجديدة بنجاح`);
  };

  // Staff compensation update handler
  const handleUpdateStaff = (updatedMember: StaffMember) => {
    setStaff(staff.map(s => s.id === updatedMember.id ? updatedMember : s));
    showToast(`تم تحديث بيانات ومستحقات ${updatedMember.name}`);
  };

  // Test catalog update handlers
  const handleUpdateTest = (updatedTest: LabTest) => {
    setTests(tests.map(t => t.id === updatedTest.id ? updatedTest : t));
    showToast(`تم تحديث فحص ${updatedTest.nameAr} في الكتالوج`);
  };

  const handleAddTest = (newTest: LabTest) => {
    setTests([newTest, ...tests]);
    showToast(`تمت إضافة فحص ${newTest.nameAr} إلى الكتالوج`);
  };

  const handleResetData = () => {
    localStorage.removeItem('rt_lab_orders_v2');
    localStorage.removeItem('rt_lab_bookings_v2');
    localStorage.removeItem('rt_lab_tests_v2');
    localStorage.removeItem('rt_lab_settings_v2');
    localStorage.removeItem('rt_lab_loyalty_v2');
    localStorage.removeItem('rt_lab_staff_v2');
    localStorage.removeItem('rt_lab_attendance_v2');
    localStorage.removeItem('rt_lab_finance_v2');
    localStorage.removeItem('rt_lab_inventory_v2');
    setOrders(INITIAL_ORDERS);
    setBookings(INITIAL_BOOKINGS);
    setTests(INITIAL_TESTS);
    setPackages(INITIAL_PACKAGES);
    setSettings(INITIAL_SETTINGS);
    setLoyaltyCards(INITIAL_LOYALTY_CARDS);
    setStaff(INITIAL_STAFF);
    setAttendance(INITIAL_ATTENDANCE);
    setTransactions(INITIAL_FINANCIALS);
    setInventory(INITIAL_INVENTORY);
    setSelectedOrderId('order-101');
    showToast('تمت استعادة البيانات النموذجية الأولية بالكامل');
  };

  const handleImportBackup = (data: {
    bookings?: Booking[];
    orders?: LabOrder[];
    tests?: LabTest[];
    settings?: LabSettings;
    packages?: HealthPackage[];
  }) => {
    if (data.bookings) setBookings(data.bookings);
    if (data.orders) setOrders(data.orders);
    if (data.tests) setTests(data.tests);
    if (data.packages) setPackages(data.packages);
    if (data.settings) setSettings(data.settings);
    // Push restored data to cloud when staff has write access
    (async () => {
      try {
        if (data.bookings && canWrite('bookings')) {
          for (const b of data.bookings) await saveBookingToCloud(b);
        }
        if (data.orders && canWrite('orders')) {
          for (const o of data.orders) await saveOrderToCloud(o);
        }
        if (data.settings && canWrite('settings')) {
          await saveSettingsToCloud(data.settings);
        }
      } catch (e) {
        console.warn('Import cloud sync:', e);
      }
    })();
    showToast('تم استيراد النسخة الاحتياطية بنجاح');
  };

  // Find currently selected order for Report View
  const currentReportOrder = orders.find(o => o.id === selectedOrderId) || orders[0] || INITIAL_ORDERS[0];

  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
  const activeOrdersCount = orders.filter(o => o.overallStatus !== 'released').length;
  const lowStockCount = inventory.filter(i => i.currentStock <= i.minThreshold).length;


  // ---- Multi-device real-time sync for staff data (not for patients)
  useCloudCollection('tests', tests, setTests, cloudOn && canRead('tests'), canWrite('tests'));
  useCloudCollection('packages', packages, setPackages, cloudOn && canRead('packages'), canWrite('packages'));
  useCloudCollection('loyalty', loyaltyCards, setLoyaltyCards, cloudOn && canRead('loyalty'), canWrite('loyalty'));
  useCloudCollection('staff', staff, setStaff, cloudOn && canRead('staff'), canWrite('staff'));
  useCloudCollection('attendance', attendance, setAttendance, cloudOn && canRead('attendance'), canWrite('attendance'));
  useCloudCollection('transactions', transactions, setTransactions, cloudOn && canRead('transactions'), canWrite('transactions'));
  useCloudCollection('inventory', inventory, setInventory, cloudOn && canRead('inventory'), canWrite('inventory'));

  // ---- Generic records manager (add / edit / permanent delete for every section)
  const upsert = <T extends { id: string }>(list: T[], setList: (l: T[]) => void, item: T, isNew: boolean) =>
    setList(isNew ? [item, ...list] : list.map(x => (x.id === item.id ? item : x)));
  const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const today = () => new Date().toISOString().slice(0, 10);

  const recordCollections: RecordCollection[] = [
    {
      key: 'bookings', title: 'الحجوزات', items: bookings, allowAdd: false,
      fields: [
        { key: 'bookingNumber', label: 'رقم الحجز' }, { key: 'patientName', label: 'اسم المريض' },
        { key: 'patientPhone', label: 'التليفون' }, { key: 'visitDate', label: 'التاريخ', type: 'date' },
        { key: 'visitTime', label: 'الوقت' }, { key: 'area', label: 'المنطقة' },
        { key: 'finalPrice', label: 'السعر النهائي', type: 'number' },
        { key: 'status', label: 'الحالة', type: 'select', options: [
          { value: 'pending', label: 'قيد المراجعة' }, { value: 'priced', label: 'تم التسعير' }, { value: 'confirmed', label: 'مؤكد' },
          { value: 'sample_collected', label: 'تم السحب' }, { value: 'processing', label: 'قيد التحليل' },
          { value: 'completed', label: 'مكتمل' }, { value: 'cancelled', label: 'ملغي' } ] },
        { key: 'notes', label: 'ملاحظات', type: 'textarea', showInTable: false },
      ],
      onSave: async (it) => { setBookings(bookings.map(b => (b.id === it.id ? it : b))); try { await saveBookingToCloud(it); } catch (e) { console.warn(e); } showToast('تم حفظ التعديل'); },
      onDelete: async (it) => { setBookings(bookings.filter(b => b.id !== it.id)); try { await deleteBookingFromCloud(it.id); } catch (e) { console.warn(e); } showToast('تم الحذف النهائي'); },
    },
    {
      key: 'orders', title: 'أوردرات المعمل', items: orders, allowAdd: false,
      fields: [
        { key: 'orderNumber', label: 'رقم الأوردر' }, { key: 'sampleBarcode', label: 'كود العينة' },
        { key: 'patientName', label: 'المريض' }, { key: 'patientPhone', label: 'التليفون' },
        { key: 'referringDoctor', label: 'الطبيب المعالج' }, { key: 'sampleCollectionDate', label: 'تاريخ السحب', type: 'date' },
        { key: 'paidAmount', label: 'المدفوع', type: 'number' }, { key: 'remainingAmount', label: 'المتبقي', type: 'number' },
      ],
      onSave: async (it) => { setOrders(orders.map(o => (o.id === it.id ? it : o))); try { await saveOrderToCloud(it); } catch (e) { console.warn(e); } showToast('تم حفظ التعديل'); },
      onDelete: async (it) => { setOrders(orders.filter(o => o.id !== it.id)); try { await deleteOrderFromCloud(it.id); } catch (e) { console.warn(e); } showToast('تم الحذف النهائي'); },
    },
    {
      key: 'tests', title: 'كتالوج التحاليل', items: tests,
      makeNew: () => ({ id: uid('test'), code: '', nameEn: '', nameAr: '', category: 'chemistry', categoryAr: 'الكيمياء الحيوية', sampleType: 'Serum', tubeColor: 'yellow', tubeName: 'أنبوب جل أصفر', turnaroundHours: 4, fastingHours: 0, instructionsAr: 'لا يشترط الصيام.', price: 0, parameters: [{ id: 'p1', nameEn: '', nameAr: '', unit: '', refText: '' }] }),
      fields: [
        { key: 'code', label: 'الكود' }, { key: 'nameEn', label: 'الاسم EN' }, { key: 'nameAr', label: 'الاسم AR' },
        { key: 'categoryAr', label: 'القسم' }, { key: 'sampleType', label: 'نوع العينة' },
        { key: 'price', label: 'السعر', type: 'number' }, { key: 'turnaroundHours', label: 'ساعات النتيجة', type: 'number' },
        { key: 'instructionsAr', label: 'تعليمات', type: 'textarea', showInTable: false },
      ],
      onSave: (it, isNew) => { upsert(tests, setTests, it, isNew); showToast('تم الحفظ'); },
      onDelete: (it) => { setTests(tests.filter(t => t.id !== it.id)); showToast('تم الحذف النهائي'); },
    },
    {
      key: 'packages', title: 'الباقات', items: packages,
      makeNew: () => ({ id: uid('pkg'), titleAr: '', titleEn: '', badge: '', descriptionAr: '', testIds: [], originalPrice: 0, discountedPrice: 0, iconName: 'Heart' }),
      fields: [
        { key: 'titleAr', label: 'اسم الباقة' }, { key: 'titleEn', label: 'Name' }, { key: 'badge', label: 'الشارة' },
        { key: 'originalPrice', label: 'السعر الأصلي', type: 'number' }, { key: 'discountedPrice', label: 'بعد الخصم', type: 'number' },
        { key: 'descriptionAr', label: 'الوصف', type: 'textarea', showInTable: false },
      ],
      onSave: (it, isNew) => { upsert(packages, setPackages, it, isNew); showToast('تم الحفظ'); },
      onDelete: (it) => { setPackages(packages.filter(p => p.id !== it.id)); showToast('تم الحذف النهائي'); },
    },
    {
      key: 'loyalty', title: 'كروت الولاء', items: loyaltyCards,
      makeNew: () => ({ id: uid('card'), cardNumber: `RT-${Date.now().toString().slice(-6)}`, patientName: '', patientPhone: '', tier: 'silver', tierNameAr: 'فضي', discountPercentage: 5, pointsBalance: 0, totalVisits: 0, totalSpent: 0, issueDate: today(), expiryDate: '', status: 'active', barcode: Date.now().toString() }),
      fields: [
        { key: 'cardNumber', label: 'رقم الكارت' }, { key: 'patientName', label: 'الاسم' }, { key: 'patientPhone', label: 'التليفون' },
        { key: 'tierNameAr', label: 'الفئة' }, { key: 'discountPercentage', label: 'الخصم %', type: 'number' },
        { key: 'pointsBalance', label: 'النقاط', type: 'number' }, { key: 'expiryDate', label: 'الانتهاء', type: 'date' },
        { key: 'status', label: 'الحالة', type: 'select', options: [{ value: 'active', label: 'نشط' }, { value: 'suspended', label: 'موقوف' }] },
      ],
      onSave: (it, isNew) => { upsert(loyaltyCards, setLoyaltyCards, it, isNew); showToast('تم الحفظ'); },
      onDelete: (it) => { setLoyaltyCards(loyaltyCards.filter(c => c.id !== it.id)); showToast('تم الحذف النهائي'); },
    },
    {
      key: 'staff', title: 'الموظفون', items: staff,
      makeNew: () => ({ id: uid('staff'), code: `EMP-${Date.now().toString().slice(-4)}`, name: '', role: 'lab_specialist', roleAr: 'أخصائي معمل', department: 'المعمل', phone: '', nationalId: '', hireDate: today(), baseSalary: 0, shift: 'morning', status: 'active' }),
      fields: [
        { key: 'code', label: 'الكود' }, { key: 'name', label: 'الاسم' },
        { key: 'role', label: 'الوظيفة', type: 'select', options: [
          { value: 'lab_specialist', label: 'Lab Specialist' }, { value: 'phlebotomist', label: 'فني سحب' }, { value: 'receptionist', label: 'استقبال' },
          { value: 'consultant_doctor', label: 'طبيب استشاري' }, { value: 'technical_director', label: 'مدير فني' }, { value: 'nurse', label: 'تمريض' }, { value: 'accountant', label: 'محاسب' } ] },
        { key: 'roleAr', label: 'المسمى بالعربي' }, { key: 'department', label: 'القسم' }, { key: 'phone', label: 'التليفون' },
        { key: 'baseSalary', label: 'الراتب الأساسي', type: 'number' },
        { key: 'shift', label: 'الوردية', type: 'select', options: [{ value: 'morning', label: 'صباحي' }, { value: 'evening', label: 'مسائي' }, { value: 'rotating', label: 'متغير' }] },
        { key: 'status', label: 'الحالة', type: 'select', options: [{ value: 'active', label: 'يعمل' }, { value: 'on_leave', label: 'إجازة' }, { value: 'inactive', label: 'متوقف' }] },
        { key: 'nationalId', label: 'الرقم القومي', showInTable: false }, { key: 'hireDate', label: 'تاريخ التعيين', type: 'date', showInTable: false },
      ],
      onSave: (it, isNew) => { upsert(staff, setStaff, it, isNew); showToast('تم الحفظ'); },
      onDelete: (it) => { setStaff(staff.filter(x => x.id !== it.id)); showToast('تم الحذف النهائي'); },
    },
    {
      key: 'attendance', title: 'الحضور والانصراف', items: attendance,
      makeNew: () => ({ id: uid('att'), staffId: '', staffName: '', staffRole: '', date: today(), checkInTime: '', checkOutTime: '', shift: 'morning', status: 'present', delayMinutes: 0 }),
      fields: [
        { key: 'staffName', label: 'الموظف' }, { key: 'date', label: 'التاريخ', type: 'date' },
        { key: 'checkInTime', label: 'حضور' }, { key: 'checkOutTime', label: 'انصراف' },
        { key: 'status', label: 'الحالة', type: 'select', options: [{ value: 'present', label: 'حاضر' }, { value: 'late', label: 'متأخر' }, { value: 'absent', label: 'غائب' }, { value: 'excused', label: 'بإذن' }] },
        { key: 'delayMinutes', label: 'دقائق التأخير', type: 'number' },
      ],
      onSave: (it, isNew) => { upsert(attendance, setAttendance, it, isNew); showToast('تم الحفظ'); },
      onDelete: (it) => { setAttendance(attendance.filter(a => a.id !== it.id)); showToast('تم الحذف النهائي'); },
    },
    {
      key: 'finance', title: 'الحسابات', items: transactions,
      makeNew: () => ({ id: uid('tx'), txNumber: `TX-${Date.now().toString().slice(-6)}`, type: 'income', category: 'patient_receipt', categoryAr: 'إيراد مريض', amount: 0, paymentMethod: 'cash', paymentMethodAr: 'نقدي', date: today(), time: new Date().toTimeString().slice(0, 5), patientOrPartyName: '', registeredBy: 'CEO' }),
      fields: [
        { key: 'txNumber', label: 'رقم العملية' },
        { key: 'type', label: 'النوع', type: 'select', options: [{ value: 'income', label: 'إيراد' }, { value: 'expense', label: 'مصروف' }] },
        { key: 'categoryAr', label: 'البند' }, { key: 'amount', label: 'المبلغ', type: 'number' },
        { key: 'paymentMethodAr', label: 'طريقة الدفع' }, { key: 'date', label: 'التاريخ', type: 'date' },
        { key: 'patientOrPartyName', label: 'الجهة/المريض' }, { key: 'notes', label: 'ملاحظات', type: 'textarea', showInTable: false },
      ],
      onSave: (it, isNew) => { upsert(transactions, setTransactions, it, isNew); showToast('تم الحفظ'); },
      onDelete: (it) => { setTransactions(transactions.filter(t => t.id !== it.id)); showToast('تم الحذف النهائي'); },
    },
    {
      key: 'inventory', title: 'المخازن', items: inventory,
      makeNew: () => ({ id: uid('inv'), code: `INV-${Date.now().toString().slice(-4)}`, nameAr: '', nameEn: '', category: 'reagents', categoryAr: 'كواشف', currentStock: 0, minThreshold: 5, unit: 'علبة', unitPrice: 0, supplier: '', lotNumber: '', expiryDate: '', status: 'in_stock' }),
      fields: [
        { key: 'code', label: 'الكود' }, { key: 'nameAr', label: 'الصنف' }, { key: 'categoryAr', label: 'القسم' },
        { key: 'currentStock', label: 'الرصيد', type: 'number' }, { key: 'minThreshold', label: 'حد الطلب', type: 'number' },
        { key: 'unit', label: 'الوحدة' }, { key: 'unitPrice', label: 'سعر الوحدة', type: 'number' },
        { key: 'supplier', label: 'المورد' }, { key: 'expiryDate', label: 'الصلاحية', type: 'date' },
        { key: 'nameEn', label: 'Name EN', showInTable: false }, { key: 'lotNumber', label: 'Lot', showInTable: false },
      ],
      onSave: (it, isNew) => { upsert(inventory, setInventory, it, isNew); showToast('تم الحفظ'); },
      onDelete: (it) => { setInventory(inventory.filter(i => i.id !== it.id)); showToast('تم الحذف النهائي'); },
    },
  ];

  const can = (tab: ActiveNavTab) => !!role && ROLE_TABS[role].includes(tab);
  const handleLogout = () => {
    signOutStaff();
    saveSession(null);
    setSession(null);
    setActiveTab('booking');
  };

  if (!session) {
    return <LoginGate onLogin={(sess) => { setSession(sess); setActiveTab('booking'); }} />;
  }

  // A tab the current role may not open falls back to booking
  const safeTab: ActiveNavTab = can(activeTab) ? activeTab : 'booking';

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans selection:bg-rose-900 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed bottom-6 left-6 z-50 bg-gradient-to-r from-rose-950 to-blue-950 text-white text-xs font-bold py-3 px-5 rounded-2xl shadow-xl border border-rose-800 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={safeTab}
        setActiveTab={setActiveTab}
        can={can}
        roleLabel={role ? ROLE_LABELS[role].split(' ')[0] : undefined}
        onLogout={handleLogout}
        pendingBookingsCount={pendingBookingsCount}
        activeOrdersCount={activeOrdersCount}
        lowStockCount={lowStockCount}
        settings={settings}
        isCloudConnected={isCloudConnected}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {safeTab === 'booking' && (
          <BookingView
            patientMode={role === 'patient'}
            packages={packages}
            tests={tests}
            bookings={bookings}
            loyaltyCards={loyaltyCards}
            settings={settings}
            onAddNewBooking={handleAddNewBooking}
            onNavigateToCatalog={() => setActiveTab('catalog')}
          />
        )}

        {safeTab === 'lis' && (
          <LisView
            orders={orders}
            tests={tests}
            staff={staff}
            onSaveOrder={handleSaveOrder}
            onViewReport={handleViewReport}
          />
        )}

        {safeTab === 'catalog' && (
          <CatalogView
            tests={tests}
            onSelectTestForBooking={(testId) => {
              setActiveTab('booking');
              showToast('تم فتح استمارة الحجز');
            }}
            onUpdateTest={handleUpdateTest}
            onAddTest={handleAddTest}
          />
        )}

        {safeTab === 'loyalty' && (
          <LoyaltyView
            cards={loyaltyCards}
            onAddCard={handleAddLoyaltyCard}
            onUpdatePoints={handleUpdateLoyaltyPoints}
          />
        )}

        {safeTab === 'hr' && (
          <HrView
            staff={staff}
            attendance={attendance}
            onAddStaff={handleAddStaff}
            onUpdateStaff={handleUpdateStaff}
            onUpdateStaffStatus={handleUpdateStaffStatus}
            onRecordAttendance={handleRecordAttendance}
          />
        )}

        {safeTab === 'finance' && (
          <FinanceView
            transactions={transactions}
            orders={orders}
            bookings={bookings}
            settings={settings}
            onAddTransaction={handleAddTransaction}
            onUpdateSettings={async (s) => {
              setSettings(s);
              try {
                await saveSettingsToCloud(s);
              } catch (e) {
                console.warn(e);
              }
              showToast('تم حفظ وتحديث الإعدادات والنسب المالية');
            }}
          />
        )}

        {safeTab === 'inventory' && (
          <InventoryView
            inventory={inventory}
            onAddItem={handleAddInventoryItem}
            onUpdateStock={handleUpdateInventoryStock}
          />
        )}

        {safeTab === 'report' && (
          <ReportView
            order={currentReportOrder}
            allOrders={orders}
            allTests={tests}
            settings={settings}
            staff={staff}
            onSelectOrder={(id) => setSelectedOrderId(id)}
            onEditOrder={() => setActiveTab('lis')}
            onBackToLis={() => setActiveTab('lis')}
          />
        )}

        {safeTab === 'users' && <UsersView />}

        {safeTab === 'records' && <RecordsView collections={recordCollections} canDelete={role === 'ceo' || role === 'manager'} />}

        {safeTab === 'admin' && (
          <AdminView
            bookings={bookings}
            orders={orders}
            tests={tests}
            packages={packages}
            settings={settings}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onTransferBookingToLis={handleTransferBookingToLis}
            onDeleteBooking={handleDeleteBooking}
            onUpdatePackage={handleUpdatePackage}
            onAddPackage={handleAddPackage}
            onSaveSettings={async (s) => {
              setSettings(s);
              try {
                await saveSettingsToCloud(s);
              } catch (e) {
                console.warn(e);
              }
              showToast('تم حفظ إعدادات المختبر وتسميعها سحابياً');
            }}
            onUpdateTestPrice={handleUpdateTestPrice}
            onResetData={handleResetData}
            onImportBackup={handleImportBackup}
          />
        )}
      </main>
    </div>
  );
}
