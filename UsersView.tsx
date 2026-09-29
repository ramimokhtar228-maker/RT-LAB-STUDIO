import React, { useState } from 'react';
import { KeyRound, Save, Cloud, Link2 } from 'lucide-react';
import { changeMyPassword } from '../lib/auth';
import { getSupabaseConfig, saveSupabaseConfig, supabaseReady } from '../lib/supabase';

export const UsersView: React.FC = () => {
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const cfg = getSupabaseConfig();
  const [cloudUrl, setCloudUrl] = useState(cfg.url.includes('placeholder') ? '' : cfg.url);
  const [cloudKey, setCloudKey] = useState(cfg.anonKey.includes('placeholder') ? '' : cfg.anonKey);
  const [cloudMsg, setCloudMsg] = useState('');
  const [cloudErr, setCloudErr] = useState('');

  const save = async () => {
    setMsg(''); setErr('');
    if (pass.length < 6) return setErr('كلمة المرور لازم 6 أحرف/أرقام على الأقل');
    try {
      await changeMyPassword(pass);
      setPass('');
      setMsg('تم تغيير كلمة مرورك بنجاح');
    } catch (e) {
      setErr((e as Error).message || 'تعذر تغيير كلمة المرور');
    }
  };

  const saveCloud = () => {
    setCloudMsg(''); setCloudErr('');
    const res = saveSupabaseConfig(cloudUrl, cloudKey);
    if (!res.ok) setCloudErr(res.error || 'فشل');
    else setCloudMsg('تم الحفظ. جاري إعادة التحميل...');
  };

  return (
    <div dir="rtl" className="max-w-xl mx-auto p-4 space-y-4">
      <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
        <KeyRound className="w-5 h-5 text-rose-900" /> حسابي وإدارة المستخدمين
      </h2>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="text-sm font-black text-slate-800 flex items-center gap-2">
          <Cloud className={`w-4 h-4 ${supabaseReady ? 'text-emerald-600' : 'text-amber-600'}`} />
          مفاتيح السحابة (Project URL + Anon Key)
          {supabaseReady
            ? <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">مفعّل</span>
            : <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full">غير مربوط</span>}
        </div>
        <p className="text-[11px] text-slate-600 font-semibold">
          تفعيل التزامن بين الأجهزة وتسجيل الحالات من أكثر من مستخدم (موظفين + مرضى). من Supabase: Project Settings → API.
        </p>
        <div className="relative">
          <Link2 className="w-4 h-4 text-slate-400 absolute top-3.5 right-3" />
          <input type="text" dir="ltr" placeholder="https://xxxx.supabase.co" value={cloudUrl}
            onChange={e => setCloudUrl(e.target.value)}
            className="w-full text-sm font-semibold p-3 rounded-xl border border-slate-300 pr-9 text-left" autoComplete="off" />
        </div>
        <div className="relative">
          <KeyRound className="w-4 h-4 text-slate-400 absolute top-3.5 right-3" />
          <input type="password" dir="ltr" placeholder="Anon public key (eyJ...)" value={cloudKey}
            onChange={e => setCloudKey(e.target.value)}
            className="w-full text-sm font-semibold p-3 rounded-xl border border-slate-300 pr-9 text-left" autoComplete="off" />
        </div>
        {cloudErr && <div className="text-xs font-bold text-rose-700">{cloudErr}</div>}
        {cloudMsg && <div className="text-xs font-bold text-emerald-700">{cloudMsg}</div>}
        <button onClick={saveCloud} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold">
          <Save className="w-3.5 h-3.5" /> حفظ مفاتيح السحابة
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="text-sm font-black text-slate-800">تغيير كلمة مرور حسابي</div>
        <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="كلمة المرور الجديدة"
          className="w-full text-sm font-semibold p-3 rounded-xl border border-slate-300" autoComplete="new-password" />
        {msg && <div className="text-xs font-bold text-emerald-800">{msg}</div>}
        {err && <div className="text-xs font-bold text-rose-700">{err}</div>}
        <button onClick={save} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-900 text-white text-xs font-bold">
          <Save className="w-3.5 h-3.5" /> حفظ
        </button>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-600 leading-relaxed space-y-1.5">
        <div className="font-black text-slate-800">إعداد السحابة متعدد المستخدمين</div>
        <div>1) أنشئ مشروع Supabase ثم نفّذ ملف <span dir="ltr" className="font-mono">supabase-setup.sql</span> من SQL Editor.</div>
        <div>2) أدخل Project URL + anon key هنا أو من شاشة الدخول.</div>
        <div>3) أضف موظفاً: Authentication ← Users ← Add user (مثال <span dir="ltr">name@rt-lab.app</span> + Auto Confirm).</div>
        <div>4) نفّذ في SQL:</div>
        <pre dir="ltr" className="bg-white border border-slate-200 rounded-xl p-2 text-[11px] overflow-x-auto">{`insert into public.staff_roles(email, role, display_name)
values ('name@rt-lab.app', 'chemist', 'اسم الموظف')
on conflict (email) do update set role = excluded.role;`}</pre>
        <div>الصلاحيات: ceo / manager / chemist / rtlab. المريض يحجز بدون حساب ويُرسل الإشعار لواتساب المعمل.</div>
      </div>
    </div>
  );
};
