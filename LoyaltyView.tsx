import React, { useState } from 'react';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Award, 
  Sparkles, 
  Percent, 
  Printer, 
  CheckCircle2, 
  Users, 
  Gift, 
  TrendingUp, 
  QrCode,
  X,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { LoyaltyCard, LoyaltyTier } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';

interface LoyaltyViewProps {
  cards: LoyaltyCard[];
  onAddCard: (card: LoyaltyCard) => void;
  onUpdatePoints: (cardId: string, newPoints: number) => void;
}

export const LoyaltyView: React.FC<LoyaltyViewProps> = ({
  cards,
  onAddCard,
  onUpdatePoints
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCardForPrint, setSelectedCardForPrint] = useState<LoyaltyCard | null>(null);

  // New Card Form State
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [tier, setTier] = useState<LoyaltyTier>('gold');
  const [customDiscount, setCustomDiscount] = useState<number>(15);

  const filteredCards = cards.filter(card => {
    const matchesSearch = 
      card.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.patientPhone.includes(searchQuery) ||
      card.cardNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = selectedTierFilter === 'all' || card.tier === selectedTierFilter;
    return matchesSearch && matchesTier;
  });

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientPhone) return;

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const cardCode = `RT-LOYAL-${randomNum}`;

    const tierNameMap: Record<LoyaltyTier, string> = {
      silver: 'البطاقة الفضية (Silver)',
      gold: 'البطاقة الذهبية (Gold)',
      platinum: 'البطاقة البلاتينية VIP (Platinum)',
      family: 'كارت العائلة الموحد (Family)',
      syndicate: 'كارت النقابات والهيئات (Syndicate)'
    };

    const newCard: LoyaltyCard = {
      id: `card-${Date.now()}`,
      cardNumber: cardCode,
      patientName,
      patientPhone,
      tier,
      tierNameAr: tierNameMap[tier],
      discountPercentage: Number(customDiscount) || 15,
      pointsBalance: 50, // Welcome gift points
      totalVisits: 1,
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      barcode: cardCode
    };

    onAddCard(newCard);
    setShowAddModal(false);
    setSelectedCardForPrint(newCard);
    setPatientName('');
    setPatientPhone('');
  };

  const getTierGradient = (cardTier: LoyaltyTier) => {
    switch (cardTier) {
      case 'platinum':
        return 'from-slate-900 via-rose-950 to-blue-950 text-white border-amber-300/40';
      case 'gold':
        return 'from-amber-600 via-rose-900 to-blue-900 text-white border-amber-400/50';
      case 'silver':
        return 'from-slate-700 via-slate-800 to-rose-950 text-white border-slate-400/40';
      case 'syndicate':
        return 'from-blue-900 via-blue-800 to-rose-900 text-white border-blue-400/40';
      case 'family':
        return 'from-rose-900 via-rose-800 to-blue-900 text-white border-rose-400/40';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-rose-100 text-rose-900 border border-rose-200">
              <CreditCard className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900">كروت الولاء ونقاط الخصم (Loyalty & Discounts)</h1>
              <p className="text-xs text-slate-500 font-medium">
                إصدار بطاقات الخصم المباشر، رصيد نقاط المرضى، وكروت العائلات والنقابات المعتمدة
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-900 to-blue-900 hover:from-rose-800 hover:to-blue-800 text-white font-bold text-xs shadow-md shadow-rose-950/20 transition-all hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>إصدار كارت ولاء / خصم جديد</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-bold">إجمالي الكروت الصادرة</span>
            <Users className="w-4 h-4 text-rose-800" />
          </div>
          <div className="text-2xl font-black text-slate-900">{cards.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">بطاقة مسجلة بالسيستم</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-bold">نقاط الولاء النشطة</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {cards.reduce((sum, c) => sum + c.pointsBalance, 0)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">نقطة قابلة للاستبدال</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-bold">أعلى نسبة خصم مخصصة</span>
            <Percent className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-black text-blue-900">30%</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">لكروت النقابات والأطباء</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-slate-400 mb-1">
            <span className="text-xs font-bold">قيمة النقاط المعادلة</span>
            <Gift className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {Math.round(cards.reduce((sum, c) => sum + c.pointsBalance, 0) * 0.5)} ج.م
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">رصيد تحاليل مجانية للمرضى</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-3xl shadow-2xs border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ابحث بالاسم، رقم الموبايل، أو رقم الكارت..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-800 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTierFilter}
            onChange={(e) => setSelectedTierFilter(e.target.value)}
            className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-800"
          >
            <option value="all">كل فئات الكروت</option>
            <option value="gold">الذهبية (Gold)</option>
            <option value="platinum">البلاتينية (Platinum)</option>
            <option value="silver">الفضية (Silver)</option>
            <option value="family">كارت العائلة (Family)</option>
            <option value="syndicate">كارت النقابات (Syndicate)</option>
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((card) => {
          const gradient = getTierGradient(card.tier);

          return (
            <div 
              key={card.id} 
              className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              {/* Virtual Smart Loyalty Card Header */}
              <div className={`p-5 bg-gradient-to-tr ${gradient} rounded-t-3xl border-b-2 relative overflow-hidden`}>
                <div className="flex items-start justify-between relative z-10 mb-4">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-slate-300 uppercase block">
                      RT LABORATORIES • LOYALTY CARD
                    </span>
                    <h3 className="font-extrabold text-base text-white mt-0.5">{card.tierNameAr}</h3>
                  </div>

                  {/* Microchip Graphic */}
                  <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-amber-400 border border-amber-500/60 shadow-inner flex flex-col justify-center px-1">
                    <div className="h-0.5 w-full bg-amber-600/40 my-0.5" />
                    <div className="h-0.5 w-full bg-amber-600/40" />
                  </div>
                </div>

                {/* Card Number */}
                <div className="font-mono text-lg font-black tracking-widest text-white/95 my-2">
                  {card.cardNumber}
                </div>

                {/* Patient Name & Discount */}
                <div className="flex items-end justify-between relative z-10 pt-2 border-t border-white/20 text-xs">
                  <div>
                    <span className="text-[10px] text-white/70 block">اسم العميل</span>
                    <strong className="text-white font-bold">{card.patientName}</strong>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-white/70 block">نسبة الخصم</span>
                    <span className="font-black text-amber-300 text-sm bg-black/30 px-2 py-0.5 rounded-md">
                      %{card.discountPercentage} خصم
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Meta & Points */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>رصيد النقاط:</span>
                    <strong className="text-rose-900 font-extrabold">{card.pointsBalance} نقطة</strong>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold">
                    (تساوي {Math.round(card.pointsBalance * 0.5)} ج.م خصم)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>هاتف العميل: <strong className="text-slate-800 font-mono">{card.patientPhone}</strong></span>
                  <span>الزيارات: <strong className="text-slate-800">{card.totalVisits}</strong></span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                  <span>تاريخ الصدور: {card.issueDate}</span>
                  <span>صالح حتى: {card.expiryDate}</span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    onClick={() => {
                      const add = prompt('أدخل عدد النقاط المراد إضافتها للعميل:', '20');
                      if (add && !isNaN(Number(add))) {
                        onUpdatePoints(card.id, card.pointsBalance + Number(add));
                      }
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                  >
                    + إضافة نقاط
                  </button>

                  <button
                    onClick={() => setSelectedCardForPrint(card)}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة الكارت</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Issue New Loyalty Card */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-900" />
                <h3 className="font-extrabold text-slate-900 text-base">إصدار بطاقة ولاء / خصم جديدة</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل / المريض بالكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: المستشار طارق عبد الحميد"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الموبايل *</label>
                <input
                  type="tel"
                  required
                  placeholder="010xxxxxxxx"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">فئة البطاقة *</label>
                  <select
                    value={tier}
                    onChange={(e) => {
                      const t = e.target.value as LoyaltyTier;
                      setTier(t);
                      if (t === 'platinum') setCustomDiscount(25);
                      else if (t === 'syndicate') setCustomDiscount(30);
                      else if (t === 'family') setCustomDiscount(20);
                      else if (t === 'gold') setCustomDiscount(15);
                      else setCustomDiscount(10);
                    }}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800 bg-white"
                  >
                    <option value="gold">الذهبية (Gold - %15)</option>
                    <option value="platinum">البلاتينية VIP (Platinum - %25)</option>
                    <option value="silver">الفضية (Silver - %10)</option>
                    <option value="family">كارت العائلة (Family - %20)</option>
                    <option value="syndicate">كارت النقابات والأطباء (%30)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نسبة الخصم المباشر (%) *</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    required
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(Number(e.target.value))}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                <span>سيتم إيداع 50 نقطة ترحيبية فورية برصيد البطاقة كهدية من معامل RT.</span>
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
                  className="px-6 py-2 rounded-xl bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold shadow-md shadow-rose-950/20"
                >
                  إصدار وتفعيل البطاقة فوراً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE CARD DIALOG */}
      {selectedCardForPrint && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 text-center animate-in fade-in duration-150">
            <h3 className="font-extrabold text-slate-900 text-base mb-1">بطاقة العضوية والخصم جاهزة</h3>
            <p className="text-xs text-slate-500 mb-4">يمكن تسليم هذه البطاقة للمريض للاستفادة من الخصم ونقاط الولاء</p>

            {/* Realistic Physical Card Simulation */}
            <div className={`p-6 rounded-3xl bg-gradient-to-tr ${getTierGradient(selectedCardForPrint.tier)} text-white text-right shadow-xl relative overflow-hidden mb-5 border-2`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] tracking-widest text-slate-300 font-mono block">RT LABORATORIES</span>
                  <div className="font-black text-sm">{selectedCardForPrint.tierNameAr}</div>
                </div>
                <div className="w-10 h-7 rounded bg-amber-300 border border-amber-500 shadow-inner" />
              </div>

              <div className="font-mono text-base tracking-widest font-black text-center my-3 bg-black/20 py-1.5 rounded-lg">
                {selectedCardForPrint.cardNumber}
              </div>

              <div className="flex justify-between items-end pt-3 border-t border-white/20 text-xs">
                <div>
                  <span className="text-[10px] text-white/70 block">اسم حامل البطاقة</span>
                  <strong className="text-sm">{selectedCardForPrint.patientName}</strong>
                </div>
                <div className="text-left font-black text-amber-300 text-sm">
                  %{selectedCardForPrint.discountPercentage} خصم مباشر
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-300">معامل د. رامي مختار • 01099238841</span>
                <BarcodeRenderer value={selectedCardForPrint.cardNumber} width={100} height={24} />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold shadow-md shadow-rose-950/20"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الكارت الفوري</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCardForPrint(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
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
