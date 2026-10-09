import { invariant } from '../lib/invariant';
import { isRecord } from './schema';
import { KEYS, kvGet, kvSet, type KV } from './kv';
import { MAX_DECODED_BYTES } from './exportImport';

interface Slot {
  readonly savedAt: number;
  readonly acked: boolean;
  readonly payload: string;
}

const SLOTS = [KEYS.corrupt1, KEYS.corrupt2] as const;

function readSlot(kv: KV, key: string): Slot | null | 'unreadable' {
  const r = kvGet(kv, key);
  invariant(SLOTS.some((k) => k === key), 'not a corrupt slot key');
  if (!r.ok) return 'unreadable';
  if (r.value === null) return null;
  let raw: unknown;
  try { raw = JSON.parse(r.value); } catch { return 'unreadable'; }
  if (!isRecord(raw) || typeof raw.savedAt !== 'number' || typeof raw.acked !== 'boolean' || typeof raw.payload !== 'string') return 'unreadable';
  return { savedAt: raw.savedAt, acked: raw.acked, payload: raw.payload };
}

/**
 * Keeps a corrupt payload (SC2, SC14). Uses an empty slot first; otherwise overwrites the oldest
 * slot the user has already acknowledged. Returns false when it could not keep the payload, in
 * which case the caller keeps it in memory and offers a download.
 */
export function stashCorrupt(kv: KV, payload: string, nowMs: number): boolean {
  invariant(Number.isFinite(nowMs), 'timestamp must be finite');
  if (payload.length > 2 * MAX_DECODED_BYTES) return false;
  let target: string | null = null;
  let oldest = Infinity;
  // bound: 2 slots
  for (const key of SLOTS) {
    const s = readSlot(kv, key);
    if (s === null) { target = key; break; }
    if (s !== 'unreadable' && s.acked && s.savedAt < oldest) { target = key; oldest = s.savedAt; }
  }
  if (target === null) return false;
  const slot: Slot = { savedAt: nowMs, acked: false, payload };
  return kvSet(kv, target, JSON.stringify(slot)).ok;
}

/** Marks every corrupt slot acknowledged, so a later corrupt load may rotate over it. */
export function acknowledgeCorrupt(kv: KV): void {
  let acked = 0;
  // bound: 2 slots
  for (const key of SLOTS) {
    const s = readSlot(kv, key);
    if (s !== null && s !== 'unreadable' && !s.acked && kvSet(kv, key, JSON.stringify({ ...s, acked: true })).ok) acked++;
  }
  invariant(acked >= 0 && acked <= SLOTS.length, 'at most one acknowledgement per slot');
  invariant(SLOTS.every((k) => k.startsWith('pp.')), 'slots are namespaced');
}

/** The most recent unacknowledged payload, for the "download damaged data" button. */
export function latestCorruptPayload(kv: KV): string | null {
  let best: Slot | null = null;
  // bound: 2 slots
  for (const key of SLOTS) {
    const s = readSlot(kv, key);
    if (s !== null && s !== 'unreadable' && (best === null || s.savedAt > best.savedAt)) best = s;
  }
  invariant(best === null || Number.isFinite(best.savedAt), 'slot time is finite');
  return best?.payload ?? null;
}
