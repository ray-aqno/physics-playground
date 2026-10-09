import { invariant } from '../lib/invariant';
import type { Lesson } from './types';
import { lessonHash, MAX_LESSONS } from './validate';

/** Lesson id -> content hash recorded when a person reviewed its answer keys (SC3, SC15). */
export type ReviewRecord = Readonly<Record<string, string>>;

/**
 * Lessons released to learners: the longest prefix of the ordered path whose lessons all have a
 * current review. The path therefore never ends at a locked lesson with nothing after it (SC12, SC19).
 * `previewAll` (dev builds only) releases everything for authoring.
 */
export function releasedLessons(ordered: readonly Lesson[], review: ReviewRecord, previewAll: boolean): Lesson[] {
  invariant(ordered.length <= MAX_LESSONS, 'too many lessons');
  if (previewAll) return [...ordered];
  const out: Lesson[] = [];
  // bound: ordered.length <= MAX_LESSONS (200)
  for (const lesson of ordered) {
    if (review[lesson.id] !== lessonHash(lesson)) break;
    out.push(lesson);
  }
  invariant(out.length <= ordered.length, 'released is a prefix');
  return out;
}

/** Review entries whose lesson changed since review, or no longer exists. CI fails on any (SC15). */
export function staleReviews(ordered: readonly Lesson[], review: ReviewRecord): string[] {
  invariant(ordered.length <= MAX_LESSONS, 'too many lessons');
  const byId = new Map(ordered.map((l) => [l.id, l]));
  const ids = Object.keys(review);
  invariant(ids.length <= MAX_LESSONS, 'too many review entries');
  return ids.filter((id) => {
    const lesson = byId.get(id);
    return lesson === undefined || lessonHash(lesson) !== review[id];
  });
}
