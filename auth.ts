import type { ActiveNavTab } from '../components/Navbar';
import { supabase, supabaseReady } from './supabase';
import { resetRealtime } from './cloud';

export type Role = 'ceo' | 'manager' | 'chemist' | 'rtlab' | 'patient';

export const ROLE_LABELS: Record<Role, string> = {
  ceo: 'CEO - الإدارة العليا',
  manager: 'MANAGER - مدير',
  chemist: 'CHEMIST - كيميائي',
  rtlab: 'RTLAB - استقبال',
  patient: 'مريض',
};

// Which screens each role can open
export const ROLE_TABS: Record<Role, ActiveNavTab[]> = {
  ceo: ['booking', 'lis', 'catalog', 'loyalty', 'hr', 'finance', 'inventory', 'report', 'admin', 'users', 'records'],
  manager: ['booking', 'lis', 'catalog', 'loyalty', 'hr', 'finance', 'inventory', 'report', 'records'],
  chemist: ['booking', 'lis', 'report'],
  rtlab: ['booking'],
  patient: ['booking'],
};

// Cloud data each role may read / write (mirrors the Row Level Security in supabase-setup.sql)
const ALL = ['bookings', 'orders', 'settings', 'tests', 'packages', 'loyalty', 'staff', 'attendance', 'transactions', 'inventory'];
export const READ_COLS: Record<Role, string[]> = {
  ceo: ALL,
  manager: ALL,
  chemist: ['bookings', 'orders', 'tests', 'packages', 'loyalty', 'staff', 'settings'],
  rtlab: ['bookings', 'tests', 'packages', 'loyalty', 'settings'],
  patient: [],
};
export const WRITE_COLS: Record<Role, string[]> = {
  ceo: ALL,
  manager: ALL,
  chemist: ['bookings', 'orders', 'loyalty', 'transactions'],
  rtlab: ['bookings'],
  patient: [],
};

export interface Session { role: Role; username: string; displayName: string }

const SESSION_KEY = 'rt_lab_session_v2';

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session | null) {
  if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else sessionStorage.removeItem(SESSION_KEY);
}

const toEmail = (u: string) => {
  const v = u.trim().toLowerCase();
  return v.includes('@') ? v : `${v}@rt-lab.app`;
};

async function sessionFromEmail(email: string | undefined | null): Promise<Session | null> {
  if (!email) return null;
  const { data } = await supabase.from('staff_roles').select('role,display_name,email').eq('email', email.toLowerCase()).maybeSingle();
  if (!data) return null;
  return {
    role: data.role as Role,
    username: String(data.email).split('@')[0],
    displayName: data.display_name || String(data.email).split('@')[0],
  };
}

export async function signInStaff(username: string, password: string): Promise<Session> {
  if (!supabaseReady) throw new Error('لم يتم ربط البرنامج بقاعدة البيانات بعد');
  const { data, error } = await supabase.auth.signInWithPassword({ email: toEmail(username), password });
  if (error || !data.user) throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  const s = await sessionFromEmail(data.user.email);
  if (!s) {
    await supabase.auth.signOut();
    throw new Error('هذا الحساب غير مصرح له بدخول البرنامج (لم يتم تحديد صلاحيته)');
  }
  return s;
}

/** Auto-login when this device already has a valid staff session. */
export async function restoreStaffSession(): Promise<Session | null> {
  if (!supabaseReady) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return await sessionFromEmail(data.session?.user?.email);
  } catch {
    return null;
  }
}

export async function signOutStaff() {
  try { resetRealtime(); await supabase.auth.signOut(); } catch { /* ignore */ }
}

export async function changeMyPassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
