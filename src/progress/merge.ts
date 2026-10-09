import { invariant } from '../lib/invariant';
import { dayDiff } from './dates';
import { MAX_ITEMS, type LeitnerEntry, type LessonRecord, type ProgressV1 } from './schema';

function laterDay(a: string | null, b: string | null): string | null {
  if (a === null) return b;
  if (b === null) return a;
  return dayDiff(a, b) > 0 ? b : a;
}

function mergeLessons(a: ProgressV1['lessons'], b: ProgressV1['lessons']): Record<string, LessonRecord> {
  const out: Record<string, LessonRecord> = { ...a };
  const ids = Object.keys(b);
  invariant(ids.length <= MAX_ITEMS, 'too many lessons to merge');
  // bound: ids.length <= MAX_ITEMS (2000)
  for (const id of ids) {
    const x = out[id];
    const y = b[id];
    if (y === undefined) continue;
    out[id] = x === undefined ? y : {
      done: x.done || y.done,
      bestScore: Math.max(x.bestScore, y.bestScore),
      completedAt: x.completedAt === null ? y.completedAt : y.completedAt === null ? x.completedAt : dayDiff(x.completedAt, y.completedAt) < 0 ? y.completedAt : x.completedAt,
    };
  }
  invariant(Object.keys(out).length <= 2 * MAX_ITEMS, 'merged lessons bounded');
  return out;
}

function mergeLeitner(a: ProgressV1['leitner'], b: ProgressV1['leitner']): Record<string, LeitnerEntry> {
  const out: Record<string, LeitnerEntry> = { ...a };
  const ids = Object.keys(b);
  invariant(ids.length <= MAX_ITEMS, 'too many review items to merge');
  // bound: ids.length <= MAX_ITEMS (2000)
  for (const id of ids) {
    const x = out[id];
    const y = b[id];
    if (y !== undefined && (x === undefined || y.updated > x.updated)) out[id] = y;
  }
  invariant(Object.keys(out).length <= 2 * MAX_ITEMS, 'merged review items bounded');
  return out;
}

/**
 * Combines two tabs' progress (SC4): max XP, later streak, union of lessons (best of each),
 * newer review entry per item. Not used for reset, undo or import, which are authoritative (SC16).
 */
export function mergeProgress(a: ProgressV1, b: ProgressV1): ProgressV1 {
  invariant(a.rev >= 0 && b.rev >= 0, 'revisions must be non-negative');
  const day = laterDay(a.streak.lastActiveDay, b.streak.lastActiveDay);
  const streak = day === a.streak.lastActiveDay && day === b.streak.lastActiveDay
    ? { count: Math.max(a.streak.count, b.streak.count), lastActiveDay: day }
    : day === a.streak.lastActiveDay ? a.streak : b.streak;
  const merged: ProgressV1 = {
    version: 1,
    rev: Math.max(a.rev, b.rev),
    xp: Math.max(a.xp, b.xp),
    streak,
    lessons: mergeLessons(a.lessons, b.lessons),
    leitner: mergeLeitner(a.leitner, b.leitner),
    lastExportAt: laterDay(a.lastExportAt, b.lastExportAt),
  };
  invariant(merged.xp >= a.xp && merged.xp >= b.xp, 'merge never loses XP');
  return merged;
}
