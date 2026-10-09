import { invariant } from '../lib/invariant';
import { err, ok, type Result } from '../lib/result';

/** The subset of localStorage the app uses; injectable so tests run without a browser. */
export interface KV {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const KEYS = {
  main: 'pp.progress',
  /** Bumped on every authoritative write (reset, import, undo) so other tabs never merge over it (SC16). */
  epoch: 'pp.progress.epoch',
  /** Snapshot taken before the first import; kept until the user keeps or undoes it (SC1, SC13). */
  prev: 'pp.progress.backup.prev',
  corrupt1: 'pp.progress.corrupt.1',
  corrupt2: 'pp.progress.corrupt.2',
} as const;

/** localStorage throws in private mode and on quota errors; every access returns a Result (P10 rule 7). */
export function kvGet(kv: KV, key: string): Result<string | null, string> {
  invariant(key.startsWith('pp.'), 'keys must be namespaced with pp.');
  invariant(key.length <= 64, 'key too long');
  try { return ok(kv.getItem(key)); } catch (e) { return err(e instanceof Error ? e.message : 'storage read failed'); }
}

export function kvSet(kv: KV, key: string, value: string): Result<null, string> {
  invariant(key.startsWith('pp.'), 'keys must be namespaced with pp.');
  invariant(value.length <= 1_048_576, 'value over 1 MiB');
  try { kv.setItem(key, value); return ok(null); } catch (e) { return err(e instanceof Error ? e.message : 'storage write failed'); }
}

export function kvRemove(kv: KV, key: string): Result<null, string> {
  invariant(key.startsWith('pp.'), 'keys must be namespaced with pp.');
  invariant(key.length <= 64, 'key too long');
  try { kv.removeItem(key); return ok(null); } catch (e) { return err(e instanceof Error ? e.message : 'storage remove failed'); }
}

/** In-memory KV for tests and for browsers that block storage. Can be told to fail writes. */
export class MemoryKV implements KV {
  private readonly data = new Map<string, string>();
  failWrites = false;
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error('QuotaExceededError');
    this.data.set(key, value);
  }
  removeItem(key: string): void { this.data.delete(key); }
}
