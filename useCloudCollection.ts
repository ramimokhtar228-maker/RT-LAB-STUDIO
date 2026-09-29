import { useEffect, useRef } from 'react';
import { deleteRecord, fetchCollection, hasMeta, onCollectionChange, seedCollection, upsertRecord, writeState } from './cloud';

/**
 * Real-time multi-device sync of a list (one Supabase row per item).
 * The cloud is the source of truth once it holds data; the first device seeds it.
 */
type WithId = { id: string };

const canon = (v: any): string => {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object') {
    return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  }
  return JSON.stringify(v) ?? 'null';
};

export function useCloudCollection<T extends WithId>(
  key: string,
  items: T[],
  setItems: (v: T[]) => void,
  enabled: boolean,
  canWrite: boolean = true
) {
  const known = useRef<Map<string, string>>(new Map());
  const stamps = useRef<Map<string, number>>(new Map());
  const ready = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const applyRows = (rows: { id: string; data: any; ts: number }[]) => {
    known.current.clear();
    stamps.current.clear();
    const list = rows.map(r => {
      const it = r.data as T;
      known.current.set(it.id, canon(it));
      stamps.current.set(it.id, r.ts);
      return { it, ts: r.ts };
    });
    list.sort((a, b) => b.ts - a.ts);
    const next = list.map(x => x.it);
    if (canon(next) !== canon(itemsRef.current)) setItems(next);
  };

  const refetch = async () => {
    const epoch = writeState.epoch;
    try {
      const rows = await fetchCollection<T>(key);
      if (epoch !== writeState.epoch || writeState.pending > 0) return; // a local write happened meanwhile
      applyRows(rows);
    } catch (e) {
      console.warn(`[sync:${key}] refetch failed`, e);
    }
  };
  const schedule = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { if (ready.current) refetch(); }, 200);
  };

  // ---- cloud -> local
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    ready.current = false;

    (async () => {
      try {
        const rows = await fetchCollection<T>(key);
        if (cancelled) return;
        if (rows.length) {
          applyRows(rows);
        } else if (await hasMeta(key)) {
          known.current.clear();
          if (itemsRef.current.length) setItems([]); // everything was deleted on purpose
        } else if (canWrite) {
          const local = itemsRef.current;
          await seedCollection(key, local);
          const base = Date.now();
          local.forEach((it, i) => { known.current.set(it.id, canon(it)); stamps.current.set(it.id, base - i); });
        }
        if (!cancelled) ready.current = true;
      } catch (e) {
        console.warn(`[sync:${key}] cloud unavailable (working offline)`, e);
      }
    })();

    const off = onCollectionChange(key, schedule);
    const poll = setInterval(() => { if (ready.current) refetch(); }, 30000);
    return () => { cancelled = true; clearTimeout(timer.current); clearInterval(poll); off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key]);

  // ---- local -> cloud
  useEffect(() => {
    if (!enabled || !canWrite || !ready.current) return;
    const present = new Set<string>();
    items.forEach(it => {
      present.add(it.id);
      const c = canon(it);
      if (known.current.get(it.id) !== c) {
        known.current.set(it.id, c);
        if (!stamps.current.has(it.id)) stamps.current.set(it.id, Date.now());
        upsertRecord(key, it.id, it, stamps.current.get(it.id)!).then(schedule).catch(e => console.warn(`[sync:${key}] save`, e));
      }
    });
    Array.from(known.current.keys()).forEach(id => {
      if (!present.has(id)) {
        known.current.delete(id);
        stamps.current.delete(id);
        deleteRecord(key, id).then(schedule).catch(e => console.warn(`[sync:${key}] delete`, e));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, enabled, canWrite, key]);
}
