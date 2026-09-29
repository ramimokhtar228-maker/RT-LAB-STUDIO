import React, { useEffect, useState } from 'react';
import { Lock, UserRound, LogIn, Cloud, KeyRound, Link2, Save } from 'lucide-react';
import { Session, restoreStaffSession, saveSession, signInStaff } from '../lib/auth';
import { supabaseReady, getSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';

interface Props {
  onLogin: (s: Session) => void;
}

export const LoginGate: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Cloud keys (Project URL + Anon Key)
  const [showCloudSetup, setShowCloudSetup] = useState(!supabaseReady);
  const [cloudUrl, setCloudUrl] = useState(() => getSupabaseConfig().url.includes('placeholder') ? '' : getSupabaseConfig().url);
  const [cloudKey, setCloudKey] = useState(() => getSupabaseConfig().anonKey.includes('placeholder') ? '' : getSupabaseConfig().anonKey);
  const [cloudMsg, setCloudMsg] = useState('');
  const [cloudErr, setCloudErr] = useState('');

  const enter = (s: Session) => {
    saveSession(s);
    onLogin(s);
  };

  useEffect(() => {
    let alive = true;
    restoreStaffSession().then(s => {
      if (!alive) return;
      if (s) enter(s);
      else setLoading(false);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      enter(await signInStaff(username, password));
    } catch (err) {
      setError((err as Error).message || 'تعذر تسجيل الدخول');
    }
    setBusy(false);
  };

  const handleSaveCloud = () => {
    setCloudMsg('');
    setCloudErr('');
    const res = saveSupabaseConfig(cloudUrl, cloudKey);
    if (!res.ok) {
      setCloudErr(res.error || 'فشل الحفظ');
      return;
    }
    setCloudMsg('تم حفظ مفاتيح السحابة. جاري إعادة التحميل...');
  };

  const inputCls = 'w-full text-sm font-semibold p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-800';

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-black via-rose-950 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
        <div className="text-center space-y-2">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="RT LABS" className="w-28 h-28 mx-auto rounded-2xl bg-black object-contain" />
          <div className="text-xs font-bold text-slate-500">معامل رامي مختار للتحاليل الطبية</div>
        </div>

        {/* Cloud keys panel */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCloudSetup(v => !v)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-right"
          >
            <span className="flex items-center gap-2 text-xs font-black text-slate-800">
              <Cloud className={`w-4 h-4 ${supabaseReady ? 'text-emerald-600' : 'text-amber-600'}`} />
              مفاتيح السحابة (UID / Project URL + Anon Key)
              {supabaseReady ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">مفعّل</span>
              ) : (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full">غير مربوط</span>
              )}
            </span>
            <span className="text-[10px] font-bold text-slate-400">{showCloudSetup ? 'إخفاء' : 'إظهار'}</span>
          </button>

          {showCloudSetup && (
            <div className="px-3 pb-3 space-y-2 border-t border-slate-200 pt-2">
              <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                من لوحة Supabase: Project Settings → API. انسخ <b>Project URL</b> و <b>anon public</b> key لتفعيل التزامن والسحابة بين الأجهزة وتسجيل الحالات من أكثر من مستخدم.
              </p>
              <div className="relative">
                <Link2 className="w-4 h-4 text-slate-400 absolute top-3.5 right-3" />
                <input
                  type="text"
                  dir="ltr"
                  placeholder="https://xxxx.supabase.co  (Project URL / UID)"
                  value={cloudUrl}
                  onChange={e => setCloudUrl(e.target.value)}
                  className={inputCls + ' pr-9 text-left'}
                  autoCapitalize="none"
                  autoComplete="off"
                />
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute top-3.5 right-3" />
                <input
                  type="password"
                  dir="ltr"
                  placeholder="Anon / public key (eyJ...)"
                  value={cloudKey}
                  onChange={e => setCloudKey(e.target.value)}
                  className={inputCls + ' pr-9 text-left'}
                  autoCapitalize="none"
                  autoComplete="off"
                />
              </div>
              {cloudErr && <div className="text-xs font-bold text-rose-700">{cloudErr}</div>}
              {cloudMsg && <div className="text-xs font-bold text-emerald-700">{cloudMsg}</div>}
              <button
                type="button"
                onClick={handleSaveCloud}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs"
              >
                <Save className="w-3.5 h-3.5" /> حفظ المفاتيح وتفعيل السحابة
              </button>
            </div>
          )}
        </div>

        {!supabaseReady && (
          <div className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2">
            لم يتم ربط قاعدة البيانات بعد. أدخل مفاتيح السحابة أعلاه لتفعيل التزامن وتسجيل الحالات من عدة مستخدمين. دخول الموظفين غير متاح بدون الربط.
          </div>
        )}

        {loading ? (
          <div className="text-center text-sm font-bold text-slate-500 py-6">جاري الاتصال...</div>
        ) : (
          <>
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="relative">
                <UserRound className="w-4 h-4 text-slate-400 absolute top-3.5 right-3" />
                <input type="text" placeholder="اسم المستخدم" value={username} onChange={e => setUsername(e.target.value)} className={inputCls + ' pr-9'} autoCapitalize="none" autoComplete="username" />
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute top-3.5 right-3" />
                <input type="password" placeholder="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)} className={inputCls + ' pr-9'} autoComplete="current-password" />
              </div>
              {error && <div className="text-xs font-bold text-rose-700">{error}</div>}
              <button type="submit" disabled={busy || !supabaseReady} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-900 hover:bg-rose-800 disabled:opacity-50 text-white font-black text-sm">
                <LogIn className="w-4 h-4" /> {busy ? 'جاري الدخول...' : 'دخول الموظفين'}
              </button>
            </form>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold">
              <div className="h-px bg-slate-200 flex-1" /> أو <div className="h-px bg-slate-200 flex-1" />
            </div>
            <button
              type="button"
              onClick={() => enter({ role: 'patient', username: 'patient', displayName: 'مريض' })}
              className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-black text-sm"
            >
              دخول كمريض (حجز موعد فقط)
            </button>
          </>
        )}
      </div>
    </div>
  );
};
