import { invariant } from '../lib/invariant';
import { dayDiff, isDay } from './dates';
import type { ProgressV1 } from './schema';

export const XP_STEP = 10;
export const XP_PERFECT_BONUS = 20;
export const XP_REVIEW = 5;

/**
 * Streak counts consecutive calendar days with activity. Same day: unchanged. Next day: +1.
 * Gap of 2+ days: restart at 1. Clock moved backwards (negative gap): treated as the same day (SC6).
 */
export function touchStreak(streak: ProgressV1['streak'], today: string): ProgressV1['streak'] {
  invariant(isDay(today), 'today must be a calendar day');
  invariant(streak.count >= 0, 'streak count must be non-negative');
  if (streak.lastActiveDay === null) return { count: 1, lastActiveDay: today };
  const gap = dayDiff(streak.lastActiveDay, today);
  if (gap <= 0) return { count: Math.max(streak.count, 1), lastActiveDay: streak.lastActiveDay };
  if (gap === 1) return { count: streak.count + 1, lastActiveDay: today };
  return { count: 1, lastActiveDay: today };
}

/** Streak to show today: a missed day shows 0 without changing stored progress. */
export function displayedStreak(streak: ProgressV1['streak'], today: string): number {
  invariant(isDay(today), 'today must be a calendar day');
  invariant(streak.count >= 0, 'streak count must be non-negative');
  if (streak.lastActiveDay === null) return 0;
  return dayDiff(streak.lastActiveDay, today) > 1 ? 0 : streak.count;
}

/** Adds XP and touches the streak for activity today. */
export function recordActivity(p: ProgressV1, xp: number, today: string): ProgressV1 {
  invariant(Number.isInteger(xp) && xp >= 0, 'XP awarded must be a non-negative whole number');
  invariant(isDay(today), 'today must be a calendar day');
  return { ...p, xp: p.xp + xp, streak: touchStreak(p.streak, today) };
}
