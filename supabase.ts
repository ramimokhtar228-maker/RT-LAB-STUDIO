import { createClient, SupabaseClient } from '@supabase/supabase-js';
import bundled from '../../supabase-config.json';

const STORAGE_KEY = 'rt_lab_supabase_cfg_v2';

export type SupabaseCfg = { url: string; anonKey: string };

function isValidCfg(c: Partial<SupabaseCfg> | null | undefined): c is SupabaseCfg {
  return !!(
    c &&
    typeof c.url === 'string' &&
    c.url.startsWith('https://') &&
    !c.url.includes('REPLACE') &&
    !c.url.includes('placeholder') &&
    typeof c.anonKey === 'string' &&
    c.anonKey.length > 20
  );
}

function loadCfg(): SupabaseCfg {
  // Ignore the old per-device v1 setting. A v2 override is explicit; otherwise
  // every fresh device uses the same bundled RT LAB project.
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SupabaseCfg;
      if (isValidCfg(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  if (isValidCfg(bundled as SupabaseCfg)) return bundled as SupabaseCfg;
  return { url: 'https://placeholder.supabase.co', anonKey: 'placeholder-key' };
}

let currentCfg: SupabaseCfg = loadCfg();

function makeClient(cfg: SupabaseCfg): SupabaseClient {
  return createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });
}

export let supabase: SupabaseClient = makeClient(currentCfg);
export let supabaseReady = isValidCfg(currentCfg);

export function getSupabaseConfig(): SupabaseCfg {
  return { ...currentCfg };
}

/** Save URL + Anon Key, recreate the client, and return whether it's ready. */
export function saveSupabaseConfig(url: string, anonKey: string): { ok: boolean; error?: string } {
  const cleaned: SupabaseCfg = {
    url: url.trim().replace(/\/+$/, ''),
    anonKey: anonKey.trim(),
  };
  if (!isValidCfg(cleaned)) {
    return { ok: false, error: 'رابط المشروع أو مفتاح Anon غير صالح. يجب أن يبدأ الرابط بـ https:// وينتهي بـ .supabase.co' };
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  } catch {
    return { ok: false, error: 'تعذر حفظ الإعدادات محلياً' };
  }
  currentCfg = cleaned;
  supabase = makeClient(currentCfg);
  supabaseReady = true;
  // Force a full reload so every module picks up the new client and realtime channels restart cleanly
  window.location.reload();
  return { ok: true };
}

export function clearSupabaseConfig() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  currentCfg = loadCfg();
  supabase = makeClient(currentCfg);
  supabaseReady = isValidCfg(currentCfg);
  window.location.reload();
}
