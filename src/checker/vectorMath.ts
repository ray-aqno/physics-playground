import { assertFinite, invariant } from '../lib/invariant';

/** Vector helpers used by lesson answer keys and their second-derivation tests. */
export type Vec = readonly number[];

function checkVec(a: Vec, label: string): void {
  invariant(a.length === 2 || a.length === 3, `${label} must have 2 or 3 components`);
  // bound: <= 3 components
  for (const x of a) assertFinite(x, label);
}

export function dot(a: Vec, b: Vec): number {
  checkVec(a, 'a');
  checkVec(b, 'b');
  invariant(a.length === b.length, 'dot product needs equal-length vectors');
  return a.reduce((s, x, i) => s + x * (b[i] ?? 0), 0);
}

/** 3-D cross product a × b; 2-D inputs are treated as lying in the xy-plane. */
export function cross3(a: Vec, b: Vec): [number, number, number] {
  checkVec(a, 'a');
  checkVec(b, 'b');
  const [ax = 0, ay = 0, az = 0] = a;
  const [bx = 0, by = 0, bz = 0] = b;
  return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
}

/** z-component of a × b for 2-D vectors (positive = counterclockwise from a to b). */
export function cross2z(a: Vec, b: Vec): number {
  invariant(a.length === 2 && b.length === 2, 'cross2z needs 2-D vectors');
  checkVec(a, 'a');
  return cross3(a, b)[2];
}

export function magnitude(a: Vec): number {
  checkVec(a, 'a');
  const m = Math.sqrt(dot(a, a));
  invariant(m >= 0, 'magnitude must be non-negative');
  return m;
}

/** Direction of a 2-D vector in degrees counterclockwise from +x, in [0, 360). */
export function directionDeg(a: Vec): number {
  invariant(a.length === 2, 'direction needs a 2-D vector');
  invariant(magnitude(a) > 0, 'the zero vector has no direction');
  const deg = (Math.atan2(a[1] ?? 0, a[0] ?? 0) * 180) / Math.PI;
  return deg < 0 ? deg + 360 : deg;
}

/** 2-D vector from magnitude and direction (degrees counterclockwise from +x). */
export function fromPolar(mag: number, deg: number): [number, number] {
  invariant(mag >= 0, 'magnitude must be non-negative');
  assertFinite(deg, 'direction');
  const rad = (deg * Math.PI) / 180;
  return [mag * Math.cos(rad), mag * Math.sin(rad)];
}
