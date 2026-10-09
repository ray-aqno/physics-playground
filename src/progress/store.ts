import { invariant } from '../lib/invariant';
import { err, ok, type Result } from '../lib/result';
import { acknowledgeCorrupt, latestCorruptPayload, stashCorrupt } from './corrupt';
import { localDay } from './dates';
import { exportCode, importCode, type ImportError } from './exportImport';
import { KEYS, kvGet, kvRemove, kvSet, type KV } from './kv';
import { mergeProgress } from './merge';
import { migrate } from './migrate';
import { freshProgress, type ProgressV1 } from './schema';

export type StoreStatus = 'ok' | 'recovering';

export interface ProgressSummary {
  readonly xp: number;
  readonly streak: number;
  readonly lessonsDone: number;
  readonly reviewItems: number;
  readonly exportedOn: string | null;
}

export function summarize(p: ProgressV1): ProgressSummary {
  invariant(p.xp >= 0, 'XP must be non-negative');
  const lessonsDone = Object.values(p.lessons).filter((l) => l.done).length;
  invariant(lessonsDone >= 0, 'lesson count must be non-negative');
  return { xp: p.xp, streak: p.streak.count, lessonsDone, reviewItems: Object.keys(p.leitner).length, exportedOn: p.lastExportAt };
}

/**
 * Owns the learner's progress and every write to storage. Fails loudly but never loses data:
 * corrupt data is stashed and nothing is saved until the user acknowledges (SC2); imports back up
 * first and can be undone (SC1, SC13); failed saves are tracked in `unsavedSince` (SC5, SC17).
 */
export class ProgressStore {
  progress: ProgressV1 = freshProgress();
  status: StoreStatus = 'ok';
  notice: string | null = null;
  unsavedSince: number | null = null;
  /** Corrupt payload that could not be stashed; the UI forces a download (SC14). */
  unstashed: string | null = null;
  private epoch = 0;

  constructor(private readonly kv: KV) {}

  load(nowMs: number): void {
    invariant(Number.isFinite(nowMs), 'timestamp must be finite');
    const raw = kvGet(this.kv, KEYS.main);
    this.epoch = this.readEpoch();
    if (!raw.ok) {
      this.markUnsaved(nowMs);
      this.notice = 'Your browser is blocking storage, so progress will not be saved. Use Export to keep it.';
      return;
    }
    if (raw.value === null) return;
    let parsed: unknown;
    try { parsed = JSON.parse(raw.value); } catch { this.enterRecovering(raw.value, nowMs, 'Saved progress was damaged.'); return; }
    const m = migrate(parsed);
    if (!m.ok) {
      this.enterRecovering(raw.value, nowMs, m.error.kind === 'newer' ? 'Progress was saved by a newer version of the app.' : 'Saved progress was damaged.');
      return;
    }
    this.progress = m.value;
    invariant(this.status === 'ok', 'a successful load leaves the store ok');
  }

  /** Applies a gameplay change and saves it, merging with other tabs' writes (SC4). */
  update(change: (p: ProgressV1) => ProgressV1, nowMs: number): void {
    invariant(Number.isFinite(nowMs), 'timestamp must be finite');
    this.progress = change(this.progress);
    invariant(Number.isInteger(this.progress.xp) && this.progress.xp >= 0, 'XP stays a non-negative whole number');
    if (this.status === 'recovering') { this.markUnsaved(nowMs); return; }
    this.persist(false, nowMs);
  }

  /** User chose how to leave the recovering state: start fresh (import goes through commitImport). */
  acknowledgeRecovery(nowMs: number): void {
    invariant(this.status === 'recovering', 'not recovering');
    acknowledgeCorrupt(this.kv);
    this.status = 'ok';
    this.notice = null;
    const saved = this.persist(true, nowMs);
    invariant(saved || this.unsavedSince !== null, 'a failed save is recorded as unsaved');
  }

  corruptPayload(): string | null {
    invariant(this.status === 'recovering' || this.unstashed === null, 'payload only while recovering');
    return this.unstashed ?? latestCorruptPayload(this.kv);
  }

  previewImport(code: string): Result<{ current: ProgressSummary; incoming: ProgressSummary; progress: ProgressV1 }, ImportError> {
    invariant(code.length <= 512 * 1024, 'code too long to preview');
    const r = importCode(code);
    if (!r.ok) return r;
    return ok({ current: summarize(this.progress), incoming: summarize(r.value), progress: r.value });
  }

  /** Backs up current progress first (aborts if that fails), then replaces it (SC1, SC13). */
  commitImport(incoming: ProgressV1, nowMs: number): Result<null, string> {
    invariant(incoming.rev >= 0 && incoming.xp >= 0, 'imported progress must be non-negative');
    const existing = kvGet(this.kv, KEYS.prev);
    if (!existing.ok) return err('Could not back up your current progress, so the import was cancelled.');
    if (existing.value === null) {
      const backup = kvSet(this.kv, KEYS.prev, JSON.stringify(this.progress));
      if (!backup.ok) return err('Could not back up your current progress, so the import was cancelled.');
    }
    if (this.status === 'recovering') { acknowledgeCorrupt(this.kv); this.status = 'ok'; this.notice = null; }
    this.progress = incoming;
    return this.persist(true, nowMs) ? ok(null) : err('Imported, but saving failed. Export your progress to keep it.');
  }

  hasImportBackup(): boolean {
    const r = kvGet(this.kv, KEYS.prev);
    invariant(r.ok || r.error.length > 0, 'a failed read carries a reason');
    return r.ok && r.value !== null;
  }

  undoImport(nowMs: number): Result<null, string> {
    const r = kvGet(this.kv, KEYS.prev);
    if (!r.ok || r.value === null) return err('There is no import to undo.');
    let parsed: unknown;
    try { parsed = JSON.parse(r.value); } catch { return err('The backup is damaged.'); }
    const m = migrate(parsed);
    if (!m.ok) return err('The backup is damaged.');
    this.progress = m.value;
    if (!this.persist(true, nowMs)) return err('Could not restore the backup.');
    kvRemove(this.kv, KEYS.prev);
    invariant(this.progress.rev > m.value.rev, 'restored progress was written with a new revision');
    return ok(null);
  }

  keepImported(): void {
    invariant(this.status === 'ok', 'keeping an import is only offered when the store is ok');
    const r = kvRemove(this.kv, KEYS.prev);
    if (!r.ok) this.notice = 'Could not clear the import backup.';
    invariant(!r.ok || !this.hasImportBackup(), 'backup is gone after a successful remove');
  }

  reset(nowMs: number): void {
    invariant(this.status === 'ok', 'reset is not offered while recovering');
    this.progress = freshProgress();
    this.persist(true, nowMs);
    invariant(this.progress.xp === 0, 'reset clears XP');
  }

  /** Marks today as exported and returns the code (SC5 nudge resets). */
  exportNow(now: Date): string {
    invariant(!Number.isNaN(now.getTime()), 'invalid date');
    this.update((p) => ({ ...p, lastExportAt: localDay(now) }), now.getTime());
    const code = exportCode(this.progress);
    invariant(code.length > 0, 'export produced a code');
    return code;
  }

  /** Another tab wrote progress (storage event). Ignored while recovering (SC16). */
  onExternalChange(newValue: string | null): void {
    if (this.status === 'recovering' || newValue === null) return;
    let parsed: unknown;
    try { parsed = JSON.parse(newValue); } catch { return; }
    const m = migrate(parsed);
    if (m.ok && m.value.rev >= this.progress.rev) { this.progress = m.value; this.epoch = this.readEpoch(); }
    invariant(this.progress.xp >= 0, 'XP stays non-negative');
  }

  private readEpoch(): number {
    const r = kvGet(this.kv, KEYS.epoch);
    const n = r.ok && r.value !== null ? Number(r.value) : 0;
    const epoch = Number.isInteger(n) && n >= 0 ? n : 0;
    invariant(epoch >= 0 && Number.isInteger(epoch), 'epoch is a whole number');
    return epoch;
  }

  private markUnsaved(nowMs: number): void {
    invariant(Number.isFinite(nowMs), 'timestamp must be finite');
    this.unsavedSince ??= nowMs;
    invariant(this.unsavedSince <= nowMs, 'unsaved time cannot be in the future');
  }

  private enterRecovering(payload: string, nowMs: number, why: string): void {
    invariant(payload.length > 0, 'nothing to recover');
    this.status = 'recovering';
    if (!stashCorrupt(this.kv, payload, nowMs)) this.unstashed = payload;
    this.notice = `${why} A copy was kept. Start fresh, import a progress code, or download the damaged data.`;
    this.markUnsaved(nowMs);
    invariant(this.unsavedSince !== null, 'recovering marks progress unsaved');
  }

  /** Writes progress. Non-authoritative writes merge with newer data from other tabs, unless an
   *  authoritative write (reset/import/undo) happened since this tab loaded; then this tab adopts it. */
  private persist(authoritative: boolean, nowMs: number): boolean {
    invariant(this.status === 'ok', 'never save while recovering (SC2)');
    const storedEpoch = this.readEpoch();
    let next = this.progress;
    let storedRev = 0;
    const stored = kvGet(this.kv, KEYS.main);
    if (stored.ok && stored.value !== null) {
      let parsed: unknown = null;
      try { parsed = JSON.parse(stored.value); } catch { parsed = null; }
      const m = migrate(parsed);
      if (m.ok) {
        storedRev = m.value.rev;
        if (!authoritative && storedEpoch !== this.epoch) { this.progress = m.value; this.epoch = storedEpoch; this.notice = 'Your progress was replaced in another tab.'; return true; }
        if (!authoritative && m.value.rev > this.progress.rev) next = mergeProgress(m.value, next);
      }
    }
    next = { ...next, rev: Math.max(storedRev, next.rev) + 1 };
    const epoch = authoritative ? storedEpoch + 1 : storedEpoch;
    const wrote = kvSet(this.kv, KEYS.main, JSON.stringify(next));
    if (!wrote.ok) { this.markUnsaved(nowMs); return false; }
    if (authoritative) kvSet(this.kv, KEYS.epoch, String(epoch));
    this.progress = next;
    this.epoch = epoch;
    this.unsavedSince = null;
    return true;
  }
}
