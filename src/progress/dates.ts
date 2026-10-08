import { invariant } from '../lib/invariant';

/**
 * Calendar-day arithmetic on "YYYY-MM-DD" strings (SC6). Days are counted with UTC epoch math on
 * the date's own y/m/d, so DST changes and time zones never make a day 23 or 25 hours long.
 */
const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export function isDay(s: string): boolean {
  invariant(s.length <= 32, 'day string too long');
  const m = DAY_RE.exec(s);
  if (m === null) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

function epochDay(day: string): number {
  invariant(isDay(day), `not a calendar day: ${day}`);
  const m = DAY_RE.exec(day);
  invariant(m !== null, 'day must match YYYY-MM-DD');
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / MS_PER_DAY;
}

/** The learner's local calendar day for a moment in time. */
export function localDay(now: Date): string {
  invariant(!Number.isNaN(now.getTime()), 'invalid date');
  const y = now.getFullYear();
  invariant(y >= 1970 && y <= 9999, 'year out of range');
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

/** Whole days from a to b (negative when b is earlier). */
export function dayDiff(a: string, b: string): number {
  const diff = epochDay(b) - epochDay(a);
  invariant(Number.isInteger(diff), 'day difference must be whole');
  return diff;
}

export function addDays(day: string, n: number): string {
  invariant(Number.isInteger(n) && Math.abs(n) <= 3660, 'day offset must be a whole number within 10 years');
  const t = new Date((epochDay(day) + n) * MS_PER_DAY);
  const out = `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
  invariant(isDay(out), 'addDays produced an invalid day');
  return out;
}
