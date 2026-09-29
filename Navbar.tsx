import React from 'react';
import { 
  FlaskConical, 
  CalendarClock, 
  FileText, 
  BookOpen, 
  Settings, 
  PhoneCall, 
  CreditCard,
  Users,
  DollarSign,
  Package,
  Award
} from 'lucide-react';
import { LabSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { BrandLogo } from './BrandLogo';

export type ActiveNavTab = 
  | 'booking' 
  | 'lis' 
  | 'catalog' 
  | 'loyalty' 
  | 'hr' 
  | 'finance' 
  | 'inventory' 
  | 'report' 
  | 'admin'
  | 'users'
  | 'records';

interface NavbarProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  pendingBookingsCount: number;
  activeOrdersCount: number;
  lowStockCount?: number;
  settings: LabSettings;
  isCloudConnected?: boolean;
  can?: (tab: ActiveNavTab) => boolean;
  roleLabel?: string;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingBookingsCount,
  activeOrdersCount,
  lowStockCount = 0,
  settings,
  isCloudConnected = true,
  can = () => true,
  roleLabel,
  onLogout
}) => {
  return (
    <header className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-rose-900/10 shadow-xs">
      {/* Top Banner Notice: Dark Crimson to Deep Blue Gradient */}
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-blue-950 text-white text-xs py-1.5 px-4 border-b border-rose-800/40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold">معامل RT LAB للتحاليل التشخيصية - معامل رامي مختار</span>
            
            {/* Real-time Cloud Sync Badge */}
            <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isCloudConnected ? 'bg-emerald-500/30 text-emerald-100 border-emerald-400/40' : 'bg-amber-500/20 text-amber-100 border-amber-300/40'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300'}`} />
              <span>{isCloudConnected ? 'CLOUD • REALTIME متصل' : 'CLOUD • جاري الاتصال'}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-rose-100 text-[11px] font-semibold">
            {/* Highly Prominent Install Button */}
            <PWAInstallButton />

            <div className="hidden sm:flex items-center gap-2">
              <PhoneCall className="w-3.5 h-3.5 text-amber-300" />
              <span>01100874444</span>
              <span>-</span>
              <span>01100046841</span>
              <span>-</span>
              <span>01013242777</span>
            </div>
            <span className="hidden md:inline text-rose-300/40">•</span>
            <span className="hidden lg:inline text-slate-200">الفرع الرئيسي: ميدان بهتيم برج صيدلية العزبي الدور الثالث شبرا الخيمة</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-18 gap-2">
          {/* Logo & Brand: Click takes to home/booking */}
          <div 
            onClick={() => setActiveTab('booking')}
            className="cursor-pointer group shrink-0"
          >
            <BrandLogo size="md" />
          </div>

          {/* Navigation Links Scrollable on mobile */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none text-xs">
            {/* Booking Tab */}
            {can('booking') && (
<button
              onClick={() => setActiveTab('booking')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'booking'
                  ? 'bg-rose-900 text-white shadow-sm shadow-rose-950/20'
                  : 'text-slate-700 hover:text-rose-900 hover:bg-slate-100'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>حجز موعد وزيارة</span>
              {pendingBookingsCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'booking' ? 'bg-white text-rose-950' : 'bg-rose-100 text-rose-900'
                }`}>
                  {pendingBookingsCount}
                </span>
              )}
            </button>
)}

            {/* LIS Tab */}
            {can('lis') && (
<button
              onClick={() => setActiveTab('lis')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'lis'
                  ? 'bg-blue-900 text-white shadow-sm shadow-blue-950/20'
                  : 'text-slate-700 hover:text-blue-900 hover:bg-slate-100'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>المختبر LIS</span>
              {activeOrdersCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'lis' ? 'bg-white text-blue-950' : 'bg-blue-100 text-blue-900'
                }`}>
                  {activeOrdersCount}
                </span>
              )}
            </button>
)}

            {/* Test Catalog Tab */}
            {can('catalog') && (
<button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'catalog'
                  ? 'bg-rose-900 text-white shadow-sm'
                  : 'text-slate-700 hover:text-rose-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>الكتالوج</span>
            </button>
)}

            {/* Loyalty Cards Tab */}
            {can('loyalty') && (
<button
              onClick={() => setActiveTab('loyalty')}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'loyalty'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-amber-800 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-500" />
              <span>كروت الولاء</span>
            </button>
)}

            {/* HR & Attendance Tab */}
            {can('hr') && (
<button
              onClick={() => setActiveTab('hr')}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'hr'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-700 hover:text-blue-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>الموارد والحضور</span>
            </button>
)}

            {/* Finance & Cash Flow Tab */}
            {can('finance') && (
<button
              onClick={() => setActiveTab('finance')}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'finance'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-700 hover:text-emerald-900 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>الماليات والخزينة</span>
            </button>
)}

            {/* Inventory Tab */}
            {can('inventory') && (
<button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'inventory'
                  ? 'bg-rose-900 text-white shadow-sm'
                  : 'text-slate-700 hover:text-rose-900 hover:bg-slate-100'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>الكيماويات والمخزن</span>
              {lowStockCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
)}

            {/* Live Report Preview Tab */}
            {can('report') && (
<button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'report'
                  ? 'bg-rose-900 text-white shadow-sm'
                  : 'text-slate-700 hover:text-rose-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>التقرير A4</span>
            </button>
)}

            {/* Admin Dashboard */}
            {can('admin') && (
<button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'admin'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>لوحة الإدارة</span>
            </button>
)}

            {/* PWA Install Button */}
            <div className="mr-1 shrink-0">
              <PWAInstallButton />
            </div>
          

            {can('records') && (
              <button
                onClick={() => setActiveTab('records')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all shrink-0 ${
                  activeTab === 'records' ? 'bg-rose-900 text-white' : 'text-slate-700 hover:text-rose-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>السجلات والتقارير</span>
              </button>
            )}
            {can('users') && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all shrink-0 ${
                  activeTab === 'users' ? 'bg-rose-900 text-white' : 'text-slate-700 hover:text-rose-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>المستخدمون</span>
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap shrink-0 text-slate-600 bg-slate-100 hover:bg-slate-200"
                title="تسجيل الخروج"
              >
                <span>خروج{roleLabel ? ` (${roleLabel})` : ''}</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
