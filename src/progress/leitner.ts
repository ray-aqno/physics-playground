import { invariant } from '../lib/invariant';
import { addDays, dayDiff, isDay } from './dates';
import { MAX_ITEMS, type LeitnerBox, type LeitnerEntry } from './schema';

/** Days until the next review for each box. */
export const INTERVALS: Readonly<Record<LeitnerBox, number>> = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 };
export const REVIEW_CAP = 20;

/** A missed item (or a self-explanation rated Partly / Missed it) enters box 1, due tomorrow. */
export function enterReview(today: string, nowMs: number): LeitnerEntry {
  invariant(isDay(today), 'today must be a calendar day');
  invariant(Number.isInteger(nowMs) && nowMs >= 0, 'timestamp must be a whole number');
  return { box: 1, due: addDays(today, INTERVALS[1]), updated: nowMs };
}

function nextBox(box: LeitnerBox): LeitnerBox {
  invariant(box >= 1 && box <= 5, 'box out of range');
  invariant(Number.isInteger(box), 'box must be whole');
  return box === 1 ? 2 : box === 2 ? 3 : box === 3 ? 4 : 5;
}

/** Correct: move up a box. Missed: back to box 1. Only answers move items, never the clock (SC6). */
export function reviewOutcome(entry: LeitnerEntry, correct: boolean, today: string, nowMs: number): LeitnerEntry {
  invariant(isDay(today), 'today must be a calendar day');
  invariant(Number.isInteger(nowMs) && nowMs >= 0, 'timestamp must be a whole number');
  const box = correct ? nextBox(entry.box) : 1;
  return { box, due: addDays(today, INTERVALS[box]), updated: Math.max(nowMs, entry.updated) };
}

/** Item ids due today or earlier, oldest first, at most REVIEW_CAP. */
export function dueItems(leitner: Readonly<Record<string, LeitnerEntry>>, today: string, cap = REVIEW_CAP): string[] {
  invariant(isDay(today), 'today must be a calendar day');
  invariant(cap >= 1 && cap <= REVIEW_CAP, 'cap must be 1..20');
  const ids = Object.keys(leitner);
  invariant(ids.length <= MAX_ITEMS, 'too many review items');
  const due: { id: string; overdue: number }[] = [];
  // bound: ids.length <= MAX_ITEMS (2000)
  for (const id of ids) {
    const e = leitner[id];
    if (e !== undefined && dayDiff(e.due, today) >= 0) due.push({ id, overdue: dayDiff(e.due, today) });
  }
  due.sort((a, b) => b.overdue - a.overdue || a.id.localeCompare(b.id));
  return due.slice(0, cap).map((d) => d.id);
}
