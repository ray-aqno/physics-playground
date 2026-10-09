import { invariant } from '../lib/invariant';

/**
 * Significant figures in a typed number such as "0.0450", "3.00e8" or "1200".
 * Trailing zeros count only when there is a decimal point ("1200" has 2, "1200." has 4).
 */
export function countSigFigs(text: string): number {
  invariant(text.length > 0 && text.length <= 64, 'number text must be 1..64 chars');
  const mantissa = (text.split(/[eE]/)[0] ?? '').replace(/^[+-]/, '');
  invariant(/^\d*\.?\d*$/.test(mantissa), 'mantissa must be digits and at most one point');
  const hasPoint = mantissa.includes('.');
  const digits = mantissa.replace('.', '').replace(/^0+/, '');
  if (digits === '') return 1;
  return hasPoint ? digits.length : digits.replace(/0+$/, '').length || 1;
}

/** Advisory note when the answer's precision is far from what the data supports; never grades. */
export function sigFigNote(numberTexts: readonly string[], expected: number): string | null {
  invariant(Number.isInteger(expected) && expected >= 1 && expected <= 10, 'expected sig figs must be 1..10');
  invariant(numberTexts.length >= 1, 'need at least one number');
  const given = Math.max(...numberTexts.map(countSigFigs));
  if (Math.abs(given - expected) <= 1) return null;
  return `You gave ${given} significant figures; the data supports about ${expected}.`;
}
