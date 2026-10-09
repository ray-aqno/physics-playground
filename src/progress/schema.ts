import { invariant } from '../lib/invariant';
import { err, ok, type Result } from '../lib/result';
import { isDay } from './dates';

export const CURRENT_VERSION = 1;
/** Max lessons or review items stored (P10 rule 3). */
export const MAX_ITEMS = 2000;
const ID_RE = /^[a-z0-9][a-z0-9.-]{0,63}$/;

export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export interface LessonRecord {
  readonly done: boolean;
  readonly bestScore: number;
  readonly completedAt: string | null;
}

export interface LeitnerEntry {
  readonly box: LeitnerBox;
  readonly due: string;
  /** Epoch ms of the last change; the newer entry wins in a merge. */
  readonly updated: number;
}

export interface ProgressV1 {
  readonly version: 1;
  /** Bumped on every save; used to detect writes from another tab (SC4). */
  readonly rev: number;
  readonly xp: number;
  readonly streak: { readonly count: number; readonly lastActiveDay: string | null };
  readonly lessons: Readonly<Record<string, LessonRecord>>;
  readonly leitner: Readonly<Record<string, LeitnerEntry>>;
  readonly lastExportAt: string | null;
}

export function freshProgress(): ProgressV1 {
  const p: ProgressV1 = { version: 1, rev: 0, xp: 0, streak: { count: 0, lastActiveDay: null }, lessons: {}, leitner: {}, lastExportAt: null };
  invariant(p.rev === 0 && p.xp === 0, 'fresh progress starts at zero');
  invariant(Object.keys(p.lessons).length === 0, 'fresh progress has no lessons');
  return p;
}

export function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function isCount(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 1e9;
}

/** Epoch milliseconds up to the year 5000. */
function isTimestamp(x: unknown): x is number {
  return typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 95_617_584_000_000;
}

function isBox(x: unknown): x is LeitnerBox {
  return x === 1 || x === 2 || x === 3 || x === 4 || x === 5;
}

function readLessons(raw: unknown): Result<Record<string, LessonRecord>, string> {
  if (!isRecord(raw)) return err('lessons must be an object');
  const keys = Object.keys(raw);
  if (keys.length > MAX_ITEMS) return err('too many lessons');
  const out: Record<string, LessonRecord> = {};
  // bound: keys.length <= MAX_ITEMS (2000)
  for (const id of keys) {
    const r = raw[id];
    if (!ID_RE.test(id) || !isRecord(r)) return err(`bad lesson entry ${id.slice(0, 64)}`);
    const { done, bestScore, completedAt } = r;
    if (typeof done !== 'boolean' || typeof bestScore !== 'number' || bestScore < 0 || bestScore > 1) return err(`bad lesson ${id}`);
    if (completedAt !== null && (typeof completedAt !== 'string' || !isDay(completedAt))) return err(`bad completion date for ${id}`);
    out[id] = { done, bestScore, completedAt };
  }
  invariant(Object.keys(out).length === keys.length, 'every lesson copied');
  return ok(out);
}

function readLeitner(raw: unknown): Result<Record<string, LeitnerEntry>, string> {
  if (!isRecord(raw)) return err('leitner must be an object');
  const keys = Object.keys(raw);
  if (keys.length > MAX_ITEMS) return err('too many review items');
  const out: Record<string, LeitnerEntry> = {};
  // bound: keys.length <= MAX_ITEMS (2000)
  for (const id of keys) {
    const r = raw[id];
    if (!ID_RE.test(id) || !isRecord(r)) return err(`bad review entry ${id.slice(0, 64)}`);
    const { box, due, updated } = r;
    if (!isBox(box) || typeof due !== 'string' || !isDay(due) || !isTimestamp(updated)) return err(`bad review item ${id}`);
    out[id] = { box, due, updated };
  }
  invariant(Object.keys(out).length === keys.length, 'every review item copied');
  return ok(out);
}

/**
 * Validates untrusted data as ProgressV1 and copies only known fields into a fresh object
 * (allowlist, SC10). Iterative over a known flat shape; no recursion (arbiter condition 3).
 */
export function validateV1(raw: unknown): Result<ProgressV1, string> {
  if (!isRecord(raw)) return err('progress must be an object');
  if (raw.version !== 1) return err('progress version must be 1');
  const { rev, xp, streak, lastExportAt } = raw;
  if (!isCount(rev) || !isCount(xp)) return err('rev and xp must be whole numbers');
  if (!isRecord(streak) || !isCount(streak.count)) return err('bad streak');
  const last = streak.lastActiveDay;
  if (last !== null && (typeof last !== 'string' || !isDay(last))) return err('bad streak day');
  if (lastExportAt !== null && (typeof lastExportAt !== 'string' || !isDay(lastExportAt))) return err('bad export date');
  const lessons = readLessons(raw.lessons);
  if (!lessons.ok) return lessons;
  const leitner = readLeitner(raw.leitner);
  if (!leitner.ok) return leitner;
  return ok({ version: 1, rev, xp, streak: { count: streak.count, lastActiveDay: last }, lessons: lessons.value, leitner: leitner.value, lastExportAt });
}
