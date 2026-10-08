import { describe, expect, it } from 'vitest';
import { addDays, dayDiff, isDay, localDay } from '../../src/progress/dates';
import { dueItems, enterReview, reviewOutcome, REVIEW_CAP } from '../../src/progress/leitner';
import { displayedStreak, recordActivity, touchStreak } from '../../src/progress/xpStreak';
import { freshProgress, type LeitnerEntry } from '../../src/progress/schema';

describe('calendar-day math (SC6)', () => {
  it('validates days', () => {
    expect(isDay('2026-10-08')).toBe(true);
    expect(isDay('2026-02-30')).toBe(false);
    expect(isDay('2026-1-8')).toBe(false);
  });
  it('US spring-forward and fall-back days are still one day apart', () => {
    expect(dayDiff('2026-03-07', '2026-03-08')).toBe(1);
    expect(dayDiff('2026-03-08', '2026-03-09')).toBe(1);
    expect(dayDiff('2026-10-31', '2026-11-01')).toBe(1);
    expect(dayDiff('2026-11-01', '2026-11-02')).toBe(1);
  });
  it('EU DST days and year and leap boundaries', () => {
    expect(dayDiff('2026-03-28', '2026-03-29')).toBe(1);
    expect(dayDiff('2026-12-31', '2027-01-01')).toBe(1);
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-10-08', 16)).toBe('2026-10-24');
    expect(dayDiff('2026-10-08', '2026-10-01')).toBe(-7);
  });
  it('localDay uses the local calendar date', () => {
    expect(localDay(new Date(2026, 9, 8, 23, 59))).toBe('2026-10-08');
    expect(localDay(new Date(2026, 9, 9, 0, 1))).toBe('2026-10-09');
  });
});

describe('streak (SC6)', () => {
  const s0 = { count: 3, lastActiveDay: '2026-10-08' };
  it('same day leaves it unchanged', () => { expect(touchStreak(s0, '2026-10-08')).toEqual(s0); });
  it('next day adds one', () => { expect(touchStreak(s0, '2026-10-09')).toEqual({ count: 4, lastActiveDay: '2026-10-09' }); });
  it('across DST spring-forward night still adds one', () => {
    expect(touchStreak({ count: 2, lastActiveDay: '2026-03-07' }, '2026-03-08').count).toBe(3);
  });
  it('a two-day gap restarts at 1', () => { expect(touchStreak(s0, '2026-10-10')).toEqual({ count: 1, lastActiveDay: '2026-10-10' }); });
  it('clock moved backwards (or timezone change west) does not break the streak', () => {
    expect(touchStreak(s0, '2026-10-07')).toEqual(s0);
  });
  it('first activity starts at 1', () => {
    expect(touchStreak({ count: 0, lastActiveDay: null }, '2026-10-08')).toEqual({ count: 1, lastActiveDay: '2026-10-08' });
  });
  it('displayed streak drops to 0 after a missed day without changing stored data', () => {
    expect(displayedStreak(s0, '2026-10-09')).toBe(3);
    expect(displayedStreak(s0, '2026-10-10')).toBe(0);
  });
  it('recordActivity adds XP and touches the streak', () => {
    const p = recordActivity(freshProgress(), 30, '2026-10-08');
    expect(p.xp).toBe(30);
    expect(p.streak.count).toBe(1);
    expect(() => recordActivity(p, -5, '2026-10-08')).toThrow();
  });
});

describe('Leitner review', () => {
  const t = 1_000;
  it('a missed item enters box 1 due tomorrow', () => {
    expect(enterReview('2026-10-08', t)).toEqual({ box: 1, due: '2026-10-09', updated: t });
  });
  it('correct answers promote with intervals 2, 4, 8, 16 days; box 5 stays 5', () => {
    let e: LeitnerEntry = enterReview('2026-10-08', t);
    const expected: [number, string][] = [[2, '2026-10-11'], [3, '2026-10-13'], [4, '2026-10-17'], [5, '2026-10-25'], [5, '2026-10-25']];
    for (const [box, due] of expected) {
      e = reviewOutcome(e, true, '2026-10-09', t);
      expect(e.box).toBe(box);
      expect(e.due).toBe(due);
    }
  });
  it('a miss demotes to box 1', () => {
    const e = reviewOutcome({ box: 4, due: '2026-10-08', updated: t }, false, '2026-10-08', t);
    expect(e).toEqual({ box: 1, due: '2026-10-09', updated: t });
  });
  it('a clock moved backwards never demotes; only answers move items', () => {
    const e: LeitnerEntry = { box: 3, due: '2026-10-12', updated: t };
    expect(dueItems({ a: e }, '2026-10-01')).toEqual([]);
  });
  it('due items: most overdue first, capped at 20', () => {
    const leitner: Record<string, LeitnerEntry> = {};
    for (let i = 0; i < 30; i++) leitner[`item-${String(i).padStart(2, '0')}`] = { box: 1, due: addDays('2026-10-01', i % 10), updated: t };
    leitner.future = { box: 1, due: '2026-12-01', updated: t };
    const due = dueItems(leitner, '2026-10-08');
    expect(due.length).toBe(REVIEW_CAP);
    expect(due[0]).toBe('item-00');
    expect(due).not.toContain('future');
  });
});
