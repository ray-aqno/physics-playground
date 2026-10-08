import { invariant } from '../lib/invariant';
import { err, ok, type Result } from '../lib/result';

/** Max characters in an answer, and max tokens in a unit expression (SC7). */
export const MAX_INPUT = 128;
export const MAX_TOKENS = 128;

export type ParseError =
  | { readonly kind: 'empty' }
  | { readonly kind: 'too-long' }
  | { readonly kind: 'no-number' }
  | { readonly kind: 'comma'; readonly message: string }
  | { readonly kind: 'bad-char'; readonly char: string }
  | { readonly kind: 'unknown-unit'; readonly unit: string; readonly suggestion: string | null }
  | { readonly kind: 'syntax'; readonly message: string };

export type Token =
  | { readonly t: 'unit'; readonly name: string }
  | { readonly t: 'mul' }
  | { readonly t: 'div' }
  /** Implicit multiplication from a space ("kg m"); binds tighter than "/" (SC20). */
  | { readonly t: 'jux' }
  | { readonly t: 'pow'; readonly n: number }
  | { readonly t: 'lp' }
  | { readonly t: 'rp' };

/**
 * Rewrites how learners actually type into one canonical form (SC7):
 * unicode minus/dashes -> "-", × · ⋅ -> "*", µ μ -> "u", ** -> "^", ° -> " deg",
 * superscripts ² ³ ⁻¹ ⁻² ⁻³ -> ^2 ^3 ^-1 ^-2 ^-3, runs of spaces -> one.
 */
export function normalizeInput(raw: string): string {
  invariant(typeof raw === 'string', 'input must be a string');
  const s = raw
    .replace(/[−–—]/g, '-')
    .replace(/[×·⋅∙]/g, '*')
    .replace(/[µμ]/g, 'u')
    .replace(/\*\*/g, '^')
    .replace(/°/g, ' deg')
    .replace(/⁻¹/g, '^-1').replace(/⁻²/g, '^-2').replace(/⁻³/g, '^-3')
    .replace(/²/g, '^2').replace(/³/g, '^3')
    .replace(/\s+/g, ' ')
    .trim();
  invariant(!s.includes('**'), 'normalisation must remove **');
  return s;
}

/**
 * Comma rule (SC20): without vector brackets, a comma is a decimal point only when there is
 * exactly one comma followed by 1-3 digits and then a unit ("1,5 m"); anything else asks for <a,b>.
 */
export function applyDecimalComma(s: string): Result<string, ParseError> {
  invariant(s.length <= MAX_INPUT, 'input over the length cap');
  const commas = (s.match(/,/g) ?? []).length;
  if (commas === 0) return ok(s);
  invariant(commas > 0, 'comma count must be positive here');
  if (commas === 1 && /^[+-]?\d+,\d{1,3}\s*[A-Za-z]/.test(s)) return ok(s.replace(',', '.'));
  return err({ kind: 'comma', message: 'For a vector, use brackets like <3, -4> m/s. For a decimal, use a point: 1.5' });
}

function isLetter(c: string): boolean {
  return /^[A-Za-z]$/.test(c);
}

/** Reads a power after "^" or digits glued to a unit ("s2"); returns [power, next index]. */
function readPower(s: string, start: number): [number, number] | null {
  invariant(start >= 0 && start <= s.length, 'power start out of range');
  const m = /^\s*([+-]?\d+)/.exec(s.slice(start));
  if (m === null || m[1] === undefined) return null;
  const n = Number(m[1]);
  invariant(Number.isInteger(n), 'power must be an integer');
  return [n, start + m[0].length];
}

function needsJux(prev: Token | undefined): boolean {
  return prev !== undefined && (prev.t === 'unit' || prev.t === 'rp' || prev.t === 'pow');
}

/** Tokenizes a unit expression such as "kg m/s^2" or "N*s". Iterative, bounded by length. */
export function tokenizeUnits(s: string): Result<Token[], ParseError> {
  invariant(s.length <= MAX_INPUT, 'unit expression over the length cap');
  invariant(!s.includes('\n'), 'unit expression must be one line');
  const out: Token[] = [];
  let i = 0;
  // bound: each pass consumes >= 1 char, so <= s.length (<= 128) passes
  while (i < s.length && out.length < MAX_TOKENS) {
    const c = s.charAt(i);
    if (c === ' ') { i++; continue; }
    if (isLetter(c)) {
      const m = /^[A-Za-z]+/.exec(s.slice(i));
      const name = m?.[0] ?? c;
      if (needsJux(out[out.length - 1])) out.push({ t: 'jux' });
      out.push({ t: 'unit', name });
      i += name.length;
      const glued = /^\d/.test(s.charAt(i)) ? readPower(s, i) : null;
      if (glued !== null) { out.push({ t: 'pow', n: glued[0] }); i = glued[1]; }
      continue;
    }
    if (c === '^') {
      const p = readPower(s, i + 1);
      if (p === null) return err({ kind: 'syntax', message: 'A power needs a whole number, like s^2 or s^-1' });
      out.push({ t: 'pow', n: p[0] });
      i = p[1];
      continue;
    }
    if (c === '(') { if (needsJux(out[out.length - 1])) out.push({ t: 'jux' }); out.push({ t: 'lp' }); i++; continue; }
    if (c === ')') { out.push({ t: 'rp' }); i++; continue; }
    if (c === '*') { out.push({ t: 'mul' }); i++; continue; }
    if (c === '/') { out.push({ t: 'div' }); i++; continue; }
    return err({ kind: 'bad-char', char: c });
  }
  return out.length < MAX_TOKENS ? ok(out) : err({ kind: 'too-long' });
}
