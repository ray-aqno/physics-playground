import { assertFinite, invariant } from '../lib/invariant';

/**
 * A block on a 1-D track, position s = distance along the track (m):
 *   s < 0         spring compressed by |s| (U = ½ k s²)
 *   0 <= s <= L   flat floor with kinetic friction μ
 *   s > L         ramp of angle θ, joined to the floor by a smooth bend of width w
 * The bend keeps the force continuous so velocity-Verlet stays energy-bounded.
 */
export interface RampParams {
  readonly m: number;
  readonly k: number;
  readonly mu: number;
  readonly flatLength: number;
  readonly angle: number;
  readonly g: number;
}

export interface RampState {
  s: number;
  v: number;
  /** Energy turned into heat by friction so far (J). */
  thermal: number;
}

export interface RampEnergies {
  readonly kinetic: number;
  readonly spring: number;
  readonly gravity: number;
  readonly thermal: number;
  readonly total: number;
}

const BEND_WIDTH = 0.1;

function checkParams(p: RampParams): void {
  invariant(p.m > 0 && p.k > 0 && p.g > 0, 'mass, spring constant and g must be positive');
  invariant(p.mu >= 0 && p.mu < 1, 'friction coefficient must be in [0, 1)');
  invariant(p.angle > 0 && p.angle < Math.PI / 2, 'ramp angle must be in (0, 90°)');
  invariant(p.flatLength > 0, 'flat length must be positive');
}

/** Track height h(s) (m): softplus bend from flat to slope sin θ. */
export function heightAt(s: number, p: RampParams): number {
  assertFinite(s, 'track position');
  invariant(p.flatLength > 0, 'flat length must be positive');
  const z = (s - p.flatLength) / BEND_WIDTH;
  const softplus = z > 30 ? z : Math.log1p(Math.exp(z));
  return Math.sin(p.angle) * BEND_WIDTH * softplus;
}

function slopeAt(s: number, p: RampParams): number {
  const z = (s - p.flatLength) / BEND_WIDTH;
  invariant(Number.isFinite(z), 'slope position must be finite');
  invariant(p.angle > 0, 'ramp angle must be positive');
  return Math.sin(p.angle) / (1 + Math.exp(-z));
}

/** Conservative force along the track (N): spring push plus gravity along the slope. */
function conservativeForce(s: number, p: RampParams): number {
  assertFinite(s, 'track position');
  invariant(p.k > 0, 'spring constant must be positive');
  const spring = s < 0 ? -p.k * s : 0;
  return spring - p.m * p.g * slopeAt(s, p);
}

function onFriction(s: number, p: RampParams): boolean {
  invariant(p.flatLength > 0, 'flat length must be positive');
  assertFinite(s, 'track position');
  return p.mu > 0 && s >= 0 && s <= p.flatLength;
}

export function rampEnergies(state: RampState, p: RampParams): RampEnergies {
  checkParams(p);
  assertFinite(state.s + state.v + state.thermal, 'ramp state');
  const kinetic = 0.5 * p.m * state.v * state.v;
  const spring = state.s < 0 ? 0.5 * p.k * state.s * state.s : 0;
  const gravity = p.m * p.g * heightAt(state.s, p);
  return { kinetic, spring, gravity, thermal: state.thermal, total: kinetic + spring + gravity + state.thermal };
}

/**
 * One velocity-Verlet step. Friction opposes the motion at the step start and can stop the
 * block but never reverse it; while at rest on the floor static friction holds it if it can.
 */
export function stepRamp(state: RampState, p: RampParams, dt: number): void {
  checkParams(p);
  invariant(dt > 0 && dt <= 1 / 30, 'dt must be in (0, 1/30]');
  const fricMag = onFriction(state.s, p) ? p.mu * p.m * p.g : 0;
  const f0 = conservativeForce(state.s, p);
  if (state.v === 0 && Math.abs(f0) <= fricMag) return;
  const dir = state.v !== 0 ? Math.sign(state.v) : Math.sign(f0);
  const a0 = (f0 - dir * fricMag) / p.m;
  const s1 = state.s + state.v * dt + 0.5 * a0 * dt * dt;
  const fric1 = onFriction(s1, p) ? p.mu * p.m * p.g : 0;
  const a1 = (conservativeForce(s1, p) - dir * fric1) / p.m;
  let v1 = state.v + 0.5 * (a0 + a1) * dt;
  if ((fricMag > 0 || fric1 > 0) && Math.sign(v1) !== dir) v1 = 0;
  state.thermal += 0.5 * (fricMag + fric1) * Math.abs(s1 - state.s);
  state.s = s1;
  state.v = v1;
  assertFinite(state.s + state.v + state.thermal, 'ramp state after step');
}
