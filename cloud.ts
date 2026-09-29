import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { setCloudStatus } from './cloudStatus';
import type { Booking, LabOrder, LabSettings } from '../types';

/**
 * Supabase cloud layer. Everything lives in one table: public.lab_records
 *   (collection, id, data jsonb, ts bigint)
 * Access is enforced by Row Level Security (see supabase-setup.sql).
 */
export const T = 'lab_records';
export const MAIN_SETTINGS_DOC = 'general_settings';

export const clean = <X,>(v: X): X => JSON.parse(JSON.stringify(v));

// ---- shared write tracking (prevents stale refetches from overwriting fresh local edits)
export const writeState = { epoch: 0, pending: 0 };

export interface CloudRow<X> { id: string; data: X; ts: number }

export async function fetchCollection<X>(col: string): Promise<CloudRow<X>[]> {
  const { data, error } = await supabase.from(T).select('id,data,ts').eq('collection', col);
  if (error) throw error;
  return ((data ?? []) as any[]).map(r => ({ id: r.id, data: r.data as X, ts: Number(r.ts) || 0 }));
}

export async function hasMeta(col: string): Promise<boolean> {
  const { data, error } = await supabase.from(T).select('id').eq('collection', 'lab_meta').eq('id', col).maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function upsertRecord(col: string, id: string, data: unknown, ts: number) {
  writeState.epoch++;
  writeState.pending++;
  try {
    const { error } = await supabase
      .from(T)
      .upsert({ collection: col, id, data: clean(data), ts, updated_at: new Date().toISOString() }, { onConflict: 'collection,id' });
    if (error) throw error;
  } finally {
    writeState.pending--;
  }
}

export async function deleteRecord(col: string, id: string) {
  writeState.epoch++;
  writeState.pending++;
  try {
    const { error } = await supabase.from(T).delete().eq('collection', col).eq('id', id);
    if (error) throw error;
  } finally {
    writeState.pending--;
  }
}

/** Upload local items once, so the first device fills the cloud. Never runs again after the meta flag exists. */
export async function seedCollection(col: string, items: { id: string }[]) {
  if (await hasMeta(col)) return;
  const base = Date.now();
  if (items.length) {
    const rows = items.map((it, i) => ({ collection: col, id: it.id, data: clean(it), ts: base - i }));
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase.from(T).upsert(rows.slice(i, i + 200), { onConflict: 'collection,id' });
      if (error) throw error;
    }
  }
  const { error } = await supabase.from(T).upsert({ collection: 'lab_meta', id: col, data: { seeded: true }, ts: base }, { onConflict: 'collection,id' });
  if (error) throw error;
}

// ---- one realtime channel shared by everything
const listeners = new Map<string, Set<() => void>>();
let channel: RealtimeChannel | null = null;

function ensureChannel() {
  if (channel) return;
  setCloudStatus('connecting');
  channel = supabase
    .channel('lab-records')
    .on('postgres_changes', { event: '*', schema: 'public', table: T }, (p: any) => {
      const col = p?.new?.collection ?? p?.old?.collection;
      if (col) listeners.get(col)?.forEach(fn => fn());
    })
    .subscribe((state) => {
      if (state === 'SUBSCRIBED') setCloudStatus('connected');
      else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') setCloudStatus('offline');
      else if (state === 'JOINING' || state === 'REJOINING') setCloudStatus('connecting');
    });
}

export function onCollectionChange(col: string, fn: () => void): () => void {
  ensureChannel();
  if (!listeners.has(col)) listeners.set(col, new Set());
  listeners.get(col)!.add(fn);
  return () => { listeners.get(col)?.delete(fn); };
}

export function resetRealtime() {
  listeners.clear();
  channel = null;
  setCloudStatus('offline');
  supabase.removeAllChannels();
}

// ---- API used by App.tsx (same names as the old Firebase layer)
function subscribeList<X extends { createdAt?: string }>(
  col: string,
  onData: (list: X[]) => void,
  onError?: (e: Error) => void
) {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const load = async () => {
    const epoch = writeState.epoch;
    try {
      const rows = await fetchCollection<X>(col);
      if (stopped || epoch !== writeState.epoch || writeState.pending > 0) return;
      if (rows.length === 0 && !(await hasMeta(col))) return; // cloud not seeded yet: keep local data
      const list = rows.map(r => r.data);
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onData(list);
    } catch (e) {
      onError?.(e as Error);
    }
  };
  const schedule = () => { clearTimeout(timer); timer = setTimeout(load, 200); };

  load();
  const off = onCollectionChange(col, schedule);
  const poll = setInterval(load, 30000);
  return () => { stopped = true; clearTimeout(timer); clearInterval(poll); off(); };
}

export const subscribeToBookings = (onData: (b: Booking[]) => void, onError?: (e: Error) => void) =>
  subscribeList<Booking>('bookings', onData, onError);

export const subscribeToOrders = (onData: (o: LabOrder[]) => void, onError?: (e: Error) => void) =>
  subscribeList<LabOrder>('orders', onData, onError);

export function subscribeToSettings(onData: (s: LabSettings) => void, onError?: (e: Error) => void) {
  let stopped = false;
  const load = async () => {
    const epoch = writeState.epoch;
    try {
      const rows = await fetchCollection<LabSettings>('settings');
      if (stopped || epoch !== writeState.epoch || writeState.pending > 0) return;
      const row = rows.find(r => r.id === MAIN_SETTINGS_DOC);
      if (row) onData(row.data);
    } catch (e) {
      onError?.(e as Error);
    }
  };
  load();
  const off = onCollectionChange('settings', load);
  const poll = setInterval(load, 30000);
  return () => { stopped = true; clearInterval(poll); off(); };
}

export async function seedCloudDatabaseIfEmpty(
  canWrite: (col: string) => boolean,
  bookings: Booking[],
  orders: LabOrder[],
  settings: LabSettings
) {
  try {
    if (canWrite('bookings')) await seedCollection('bookings', bookings);
    if (canWrite('orders')) await seedCollection('orders', orders);
    if (canWrite('settings')) await seedCollection('settings', [{ ...settings, id: MAIN_SETTINGS_DOC } as any]);
  } catch (e) {
    console.warn('[cloud] seeding will retry later:', e);
  }
}

const tsOf = (createdAt?: string) => {
  const t = createdAt ? new Date(createdAt).getTime() : NaN;
  return Number.isFinite(t) ? t : Date.now();
};

export async function saveBookingToCloud(booking: Booking) {
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) {
    // Patient (not signed in): may only INSERT a new booking
    const { error } = await supabase.from(T).insert({ collection: 'bookings', id: booking.id, data: clean(booking), ts: tsOf(booking.createdAt) });
    if (error && (error as any).code !== '23505') throw error;
    return;
  }
  await upsertRecord('bookings', booking.id, booking, tsOf(booking.createdAt));
}

export const deleteBookingFromCloud = (id: string) => deleteRecord('bookings', id);
export const saveOrderToCloud = (order: LabOrder) => upsertRecord('orders', order.id, order, tsOf(order.createdAt));
export const deleteOrderFromCloud = (id: string) => deleteRecord('orders', id);
export const saveSettingsToCloud = (s: LabSettings) => upsertRecord('settings', MAIN_SETTINGS_DOC, { ...s, id: MAIN_SETTINGS_DOC }, Date.now());
