import { invariant } from '../lib/invariant';
import { err, ok, type Result } from '../lib/result';
import { CURRENT_VERSION, freshProgress, isRecord, MAX_ITEMS, validateV1, type LessonRecord, type ProgressV1 } from './schema';

export type MigrateError = { readonly kind: 'newer'; readonly version: number } | { readonly kind: 'invalid'; readonly reason: string };

/**
 * v0 was the pre-release shape { xp: number, done: string[] } with no version field.
 * It becomes v1 with each listed lesson marked done (best score unknown, recorded as 1).
 */
function fromV0(raw: Record<string, unknown>): Result<ProgressV1, MigrateError> {
  const { xp, done } = raw;
  if (typeof xp !== 'number' || !Number.isInteger(xp) || xp < 0 || !Array.isArray(done)) return err({ kind: 'invalid', reason: 'bad v0 progress' });
  if (done.length > MAX_ITEMS) return err({ kind: 'invalid', reason: 'too many lessons' });
  const lessons: Record<string, LessonRecord> = {};
  // bound: done.length <= MAX_ITEMS (2000)
  for (const id of done) {
    if (typeof id !== 'string') return err({ kind: 'invalid', reason: 'v0 lesson ids must be strings' });
    lessons[id] = { done: true, bestScore: 1, completedAt: null };
  }
  const candidate = { ...freshProgress(), xp, lessons };
  const v = validateV1(candidate);
  invariant(Object.keys(lessons).length <= done.length, 'v0 migration cannot invent lessons');
  return v.ok ? v : err({ kind: 'invalid', reason: v.error });
}

/** Brings any stored progress up to the current version. Bounded: at most one step per version. */
export function migrate(raw: unknown): Result<ProgressV1, MigrateError> {
  if (!isRecord(raw)) return err({ kind: 'invalid', reason: 'progress must be an object' });
  const version = raw.version;
  if (version === undefined) return fromV0(raw);
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return err({ kind: 'invalid', reason: 'bad version' });
  if (version > CURRENT_VERSION) return err({ kind: 'newer', version });
  const v = validateV1(raw);
  invariant(!v.ok || v.value.rev >= 0, 'validated revision is non-negative');
  return v.ok ? ok(v.value) : err({ kind: 'invalid', reason: v.error });
}
