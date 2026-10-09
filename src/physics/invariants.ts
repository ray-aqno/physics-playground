import { assertFinite, invariant } from '../lib/invariant';
import type { Body } from './bodies';

export interface Vec {
  readonly x: number;
  readonly y: number;
}

/** Total momentum Σ m v (kg·m/s). */
export function momentum(bodies: readonly Body[]): Vec {
  invariant(bodies.length > 0, 'momentum of an empty system');
  let px = 0;
  let py = 0;
  // bound: bodies.length <= MAX_BODIES (8)
  for (const b of bodies) {
    px += b.m * b.vx;
    py += b.m * b.vy;
  }
  assertFinite(px + py, 'momentum');
  return { x: px, y: py };
}

/** Total kinetic energy Σ ½ m v² (J). */
export function kineticEnergy(bodies: readonly Body[]): number {
  invariant(bodies.length > 0, 'kinetic energy of an empty system');
  let k = 0;
  // bound: bodies.length <= MAX_BODIES (8)
  for (const b of bodies) {
    k += 0.5 * b.m * (b.vx * b.vx + b.vy * b.vy);
  }
  assertFinite(k, 'kinetic energy');
  return k;
}

/** Center-of-mass position and velocity. */
export function centerOfMass(bodies: readonly Body[]): { x: number; y: number; vx: number; vy: number } {
  invariant(bodies.length > 0, 'center of mass of an empty system');
  let m = 0;
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  // bound: bodies.length <= MAX_BODIES (8)
  for (const b of bodies) {
    m += b.m;
    x += b.m * b.x;
    y += b.m * b.y;
    vx += b.m * b.vx;
    vy += b.m * b.vy;
  }
  invariant(m > 0, 'total mass must be positive');
  return { x: x / m, y: y / m, vx: vx / m, vy: vy / m };
}
