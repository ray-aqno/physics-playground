import { assertFinite, invariant } from '../lib/invariant';

/** Exponents of the SI base dimensions, in order: length, mass, time, current, temperature, amount, luminosity. */
export type Dims = readonly [number, number, number, number, number, number, number];

export const DIMLESS: Dims = [0, 0, 0, 0, 0, 0, 0];

const SYMBOLS = ['m', 'kg', 's', 'A', 'K', 'mol', 'cd'] as const;
const DISPLAY_ORDER = [1, 0, 2, 3, 4, 5, 6] as const;

/** A physical quantity in SI base units: one value for a scalar, 2 or 3 for a vector. */
export interface Quantity {
  readonly value: readonly number[];
  readonly dims: Dims;
}

function checkDims(d: Dims): void {
  invariant(d.every(Number.isFinite), 'dim exponents must be finite');
  // bound: 7 exponents
  for (const x of d) invariant(Number.isInteger(x) && x >= -8 && x <= 8, 'dim exponents must be integers in [-8, 8]');
}

export function dimsMul(a: Dims, b: Dims): Dims {
  checkDims(a);
  checkDims(b);
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3], a[4] + b[4], a[5] + b[5], a[6] + b[6]];
}

export function dimsDiv(a: Dims, b: Dims): Dims {
  checkDims(a);
  checkDims(b);
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3], a[4] - b[4], a[5] - b[5], a[6] - b[6]];
}

export function dimsPow(a: Dims, n: number): Dims {
  checkDims(a);
  invariant(Number.isInteger(n) && Math.abs(n) <= 4, 'unit powers must be integers in [-4, 4]');
  return [a[0] * n, a[1] * n, a[2] * n, a[3] * n, a[4] * n, a[5] * n, a[6] * n];
}

export function dimsEqual(a: Dims, b: Dims): boolean {
  checkDims(a);
  checkDims(b);
  return a.every((x, i) => x === b[i]);
}

/** Human-readable SI form, e.g. "kg·m·s^-1"; "(no units)" when dimensionless. */
export function formatDims(d: Dims): string {
  checkDims(d);
  const parts: string[] = [];
  // bound: 7 base dimensions; shown in the usual SI order kg, m, s, A, K, mol, cd
  for (const i of DISPLAY_ORDER) {
    const p = d[i];
    const sym = SYMBOLS[i];
    if (p === 1) parts.push(sym);
    else if (p !== 0) parts.push(`${sym}^${p}`);
  }
  return parts.length === 0 ? '(no units)' : parts.join('·');
}

/** Builds a quantity from SI values; used by lesson answer keys. */
export function quantity(value: number | readonly number[], dims: Dims): Quantity {
  const v = typeof value === 'number' ? [value] : [...value];
  invariant(v.length >= 1 && v.length <= 3, 'a quantity has 1 to 3 components');
  // bound: <= 3 components
  for (const x of v) assertFinite(x, 'quantity component');
  checkDims(dims);
  return { value: v, dims };
}
