import { invariant } from '../lib/invariant';
import type { Dims } from './dims';

export interface UnitDef {
  /** Multiply a value in this unit by `factor` to get SI base units. */
  readonly factor: number;
  readonly dims: Dims;
}

/** Units are case-sensitive, as in SI. The kilogram is "k" + "g". */
const UNITS: Readonly<Record<string, UnitDef>> = {
  m: { factor: 1, dims: [1, 0, 0, 0, 0, 0, 0] },
  g: { factor: 1e-3, dims: [0, 1, 0, 0, 0, 0, 0] },
  s: { factor: 1, dims: [0, 0, 1, 0, 0, 0, 0] },
  A: { factor: 1, dims: [0, 0, 0, 1, 0, 0, 0] },
  K: { factor: 1, dims: [0, 0, 0, 0, 1, 0, 0] },
  mol: { factor: 1, dims: [0, 0, 0, 0, 0, 1, 0] },
  cd: { factor: 1, dims: [0, 0, 0, 0, 0, 0, 1] },
  N: { factor: 1, dims: [1, 1, -2, 0, 0, 0, 0] },
  J: { factor: 1, dims: [2, 1, -2, 0, 0, 0, 0] },
  W: { factor: 1, dims: [2, 1, -3, 0, 0, 0, 0] },
  Pa: { factor: 1, dims: [-1, 1, -2, 0, 0, 0, 0] },
  Hz: { factor: 1, dims: [0, 0, -1, 0, 0, 0, 0] },
  C: { factor: 1, dims: [0, 0, 1, 1, 0, 0, 0] },
  V: { factor: 1, dims: [2, 1, -3, -1, 0, 0, 0] },
  min: { factor: 60, dims: [0, 0, 1, 0, 0, 0, 0] },
  h: { factor: 3600, dims: [0, 0, 1, 0, 0, 0, 0] },
  rad: { factor: 1, dims: [0, 0, 0, 0, 0, 0, 0] },
  deg: { factor: Math.PI / 180, dims: [0, 0, 0, 0, 0, 0, 0] },
};

const PREFIXES: Readonly<Record<string, number>> = {
  G: 1e9, M: 1e6, k: 1e3, c: 1e-2, m: 1e-3, u: 1e-6, n: 1e-9, p: 1e-12,
};

/** Looks up a unit symbol, exact match first, then prefix + unit (e.g. "km", "mN", "us"). */
export function lookupUnit(symbol: string): UnitDef | null {
  invariant(symbol.length > 0, 'unit symbol must not be empty');
  invariant(symbol.length <= 16, 'unit symbol too long');
  const exact = UNITS[symbol];
  if (exact !== undefined) return exact;
  if (symbol.length < 2) return null;
  const prefix = PREFIXES[symbol.charAt(0)];
  const base = UNITS[symbol.slice(1)];
  if (prefix === undefined || base === undefined) return null;
  return { factor: prefix * base.factor, dims: base.dims };
}

/** For an unknown symbol, a case variant that is a real unit ("pa" -> "Pa"), if any. */
export function suggestUnit(symbol: string): string | null {
  invariant(symbol.length > 0, 'unit symbol must not be empty');
  invariant(lookupUnit(symbol) === null, 'suggestUnit is only for unknown symbols');
  const lower = symbol.toLowerCase();
  const candidates = [lower, lower.charAt(0).toUpperCase() + lower.slice(1), symbol.toUpperCase()];
  // bound: 3 candidates
  for (const c of candidates) {
    if (c !== symbol && lookupUnit(c) !== null) return c;
  }
  return null;
}
