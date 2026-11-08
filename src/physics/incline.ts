import { assertFinite, invariant } from '../lib/invariant';
import { netForce, type ForceVec } from './forces';

/**
 * Block on a straight incline (Unit N: statics, inclines, static vs. kinetic friction).
 * The slope runs from the top (s = 0) down to the bottom (s = length), descending to the right.
 * State coordinates are along the slope: s and v are positive DOWN the slope.
 *
 * To implement (owned by the incline author):
 *   stepIncline(state, p, dt): advance exactly (piecewise constant acceleration), splitting a step
 *     where v crosses 0 so the static-friction check happens at rest; stop at s = 0 or s = length.
 *   inclineAcceleration(state, p): current acceleration along the slope (m/s², + = down the slope).
 *   inclineForces(state, p): ForceVec[] on the block (gravity, normal, static or kinetic friction)
 *     in world coordinates, plus one 'net' entry; their sum must equal m × acceleration.
 */
export interface InclineParams {
  readonly m: number;
  /** Slope angle (rad), in (0, 80°]. */
  readonly angle: number;
  readonly muS: number;
  readonly muK: number;
  readonly g: number;
  /** Length of the slope (m). */
  readonly length: number;
}

export interface InclineState {
  /** Distance down the slope from the top (m), 0..length. */
  s: number;
  /** Velocity along the slope (m/s), + = down the slope. */
  v: number;
  /** Time since start (s). */
  t: number;
}


/** Steepest slope the contract allows (80°). */
export const MAX_INCLINE_ANGLE = (80 * Math.PI) / 180;
/** sin θ within this of μs cos θ counts as "exactly at the static limit", so the block stays. */
const LIMIT_TOL = 1e-12;
/** Positions within this of an end count as touching it (m). */
const EDGE_TOL = 1e-9;

export type FrictionKind = 'static' | 'kinetic';

/** Force components on the block. Along-slope values are signed, + = DOWN the slope (N). */
export interface InclineContact {
  /** Normal force from the slope surface, m g cos θ. */
  readonly normal: number;
  /** Gravity's component along the slope, m g sin θ (always down the slope). */
  readonly gravityAlong: number;
  readonly friction: number;
  readonly frictionKind: FrictionKind;
  /** Push of the stop at the bottom (≤ 0, i.e. up the slope); 0 when it is not pushing. */
  readonly stop: number;
  /** Acceleration along the slope (m/s²), + = down. */
  readonly accel: number;
}

/** Throws InvariantError unless 0 < θ ≤ 80°, m, g, length > 0 and 0 ≤ μk ≤ μs, all finite. */
export function checkInclineParams(p: InclineParams): void {
  assertFinite(p.m + p.g + p.length + p.angle + p.muS + p.muK, 'incline parameters');
  invariant(p.m > 0 && p.g > 0 && p.length > 0, 'mass, g and slope length must be positive');
  invariant(p.angle > 0 && p.angle <= MAX_INCLINE_ANGLE + 1e-12, 'slope angle must be in (0, 80°]');
  invariant(p.muK >= 0 && p.muK <= p.muS, 'friction must satisfy 0 ≤ μk ≤ μs');
}

function checkState(state: InclineState, p: InclineParams): void {
  assertFinite(state.s + state.v + state.t, 'incline state');
  invariant(state.s >= -EDGE_TOL && state.s <= p.length + EDGE_TOL, 'block must be on the slope (0 ≤ s ≤ length)');
}

/** True when static friction can hold the block at rest: m g sin θ ≤ μs m g cos θ (tan θ ≤ μs). */
export function staticFrictionHolds(p: InclineParams): boolean {
  checkInclineParams(p);
  const sin = Math.sin(p.angle);
  const cos = Math.cos(p.angle);
  invariant(cos > 0, 'slope is not vertical');
  invariant(sin > 0, 'slope is not flat');
  return sin <= p.muS * cos + LIMIT_TOL;
}

/**
 * The forces on the block in its current state. Moving: kinetic friction μk N opposes v. At rest:
 * static friction holds it (f = m g sin θ up the slope) if it can; at rest against the bottom stop
 * when it cannot, static friction gives its maximum μs N and the stop pushes the rest; otherwise
 * it is just starting to slide down and kinetic friction acts.
 */
export function inclineContact(state: InclineState, p: InclineParams): InclineContact {
  checkInclineParams(p);
  checkState(state, p);
  const normal = p.m * p.g * Math.cos(p.angle);
  const gravityAlong = p.m * p.g * Math.sin(p.angle);
  invariant(normal > 0 && gravityAlong > 0, 'normal force and gravity along the slope are positive');
  const kinetic = (friction: number): InclineContact => ({ normal, gravityAlong, friction, frictionKind: 'kinetic', stop: 0, accel: (gravityAlong + friction) / p.m });
  if (state.v > 0) return kinetic(-p.muK * normal);
  if (state.v < 0) return kinetic(p.muK * normal);
  if (staticFrictionHolds(p)) return { normal, gravityAlong, friction: -gravityAlong, frictionKind: 'static', stop: 0, accel: 0 };
  if (state.s >= p.length - EDGE_TOL) {
    const friction = -p.muS * normal;
    return { normal, gravityAlong, friction, frictionKind: 'static', stop: -(gravityAlong + friction), accel: 0 };
  }
  return kinetic(-p.muK * normal);
}

/** Current acceleration along the slope (m/s², + = down the slope). */
export function inclineAcceleration(state: InclineState, p: InclineParams): number {
  const a = inclineContact(state, p).accel;
  assertFinite(a, 'incline acceleration');
  invariant(Math.abs(a) <= p.g * (1 + p.muK) + 1e-9, 'acceleration is bounded by g (1 + μk)');
  return a;
}

/**
 * Free-body list in world coordinates (x right, y up; the slope descends to the right): gravity,
 * normal, friction, the bottom stop's push when it pushes, and one 'net' entry equal to m a.
 */
export function inclineForces(state: InclineState, p: InclineParams): ForceVec[] {
  const c = inclineContact(state, p);
  const cos = Math.cos(p.angle);
  const sin = Math.sin(p.angle);
  // Down-slope unit vector (cos θ, −sin θ); outward surface normal (sin θ, cos θ).
  const forces: ForceVec[] = [
    { kind: 'gravity', label: 'Gravity', fx: 0, fy: -p.m * p.g },
    { kind: 'normal', label: 'Normal', fx: c.normal * sin, fy: c.normal * cos },
    { kind: 'friction', label: c.frictionKind === 'static' ? 'Static friction' : 'Kinetic friction', fx: c.friction * cos, fy: -c.friction * sin },
  ];
  if (c.stop !== 0) forces.push({ kind: 'normal', label: 'Stop', fx: c.stop * cos, fy: -c.stop * sin });
  const sum = netForce(forces);
  const ma = p.m * c.accel;
  assertFinite(ma, 'm × a');
  const err = Math.abs(sum.fx - ma * cos) + Math.abs(sum.fy + ma * sin);
  invariant(err <= 1e-9 * p.m * p.g, 'the forces must sum to m × a');
  forces.push({ kind: 'net', label: 'Net', fx: ma * cos, fy: -ma * sin });
  return forces;
}

/** Time to cover distance L starting at speed w with acceleration α along the motion; Infinity if it stops first. */
function timeToCover(L: number, w: number, alpha: number): number {
  invariant(L >= -EDGE_TOL && w >= 0, 'distance and speed must be non-negative');
  assertFinite(alpha, 'acceleration along the motion');
  if (L <= 0) return 0;
  const disc = w * w + 2 * alpha * L;
  if (disc < 0) return Infinity;
  const denom = w + Math.sqrt(disc);
  return denom > 0 ? (2 * L) / denom : Infinity;
}

/**
 * One constant-acceleration phase, at most `left` seconds long, ending early when v reaches 0
 * or the block reaches an end of the slope (where it stops). Returns the time used.
 */
function advancePhase(state: InclineState, p: InclineParams, left: number): number {
  invariant(left > 0, 'phase needs time left');
  const a = inclineContact(state, p).accel;
  if (state.v === 0 && a === 0) return left;
  const dir = state.v !== 0 ? Math.sign(state.v) : Math.sign(a);
  const speed = Math.abs(state.v);
  const along = dir * a;
  const tStop = along < 0 ? speed / -along : Infinity;
  const tEnd = timeToCover(dir > 0 ? p.length - state.s : state.s, speed, along);
  const t = Math.min(left, tStop, tEnd);
  invariant(t >= 0 && Number.isFinite(t), 'phase time must be finite and non-negative');
  if (t === tEnd) {
    state.s = dir > 0 ? p.length : 0;
    state.v = 0;
    return t;
  }
  const v1 = t === tStop ? 0 : state.v + a * t;
  state.s = Math.min(Math.max(state.s + state.v * t + 0.5 * a * t * t, 0), p.length);
  state.v = Math.sign(v1) === -dir ? 0 : v1;
  return t;
}

/**
 * Advances exactly (piecewise constant acceleration). A step is split where v reaches 0, so the
 * static-friction check happens at rest, and where the block hits an end (s = 0 or s = length).
 */
export function stepIncline(state: InclineState, p: InclineParams, dt: number): void {
  checkInclineParams(p);
  invariant(dt > 0 && dt <= 1 / 30, 'dt must be in (0, 1/30]');
  checkState(state, p);
  let left = dt;
  // bound: at most 6 phases per step (moving → stopped or end → sliding → end → at rest)
  for (let i = 0; i < 6 && left > 0; i++) left -= advancePhase(state, p, left);
  invariant(left <= 1e-12, 'step used all its time');
  state.t += dt;
  checkState(state, p);
}
