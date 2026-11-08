import { assertFinite, invariant } from '../lib/invariant';
import { netForce, type ForceVec } from './forces';

/**
 * A puck on a string in uniform circular motion on frictionless ice, seen from above
 * (Unit N7). The string can be cut; afterwards no horizontal force acts.
 * Starts at (r, 0) moving counterclockwise (+y) at the given speed, centre at the origin.
 *
 * To implement (owned by the circle author):
 *   createCircleState(p): the starting state.
 *   stepCircle(state, p, dt): on the string, advance the angle exactly (θ += v dt / r);
 *     once released, move in a straight line at constant velocity.
 *   releaseString(state): cut the string (idempotent).
 *   circleForces(state, p): ForceVec[] in the horizontal plane: the tension toward the centre
 *     (magnitude m v² / r) while attached, plus one 'net' entry; empty net force once released.
 */
export interface CircleParams {
  readonly m: number;
  readonly r: number;
  readonly speed: number;
}

export interface CircleState {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  released: boolean;
}

/** Where and how fast the puck was moving at the instant the string was cut. */
export interface ReleaseSnapshot {
  readonly t: number;
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
}

/** How far |r| and |v| may drift from r and speed on the string before it counts as broken. */
const ON_STRING_TOL = 1e-9;

function checkParams(p: CircleParams): void {
  invariant(Number.isFinite(p.m) && p.m > 0, 'puck mass must be positive and finite');
  invariant(Number.isFinite(p.r) && p.r > 0, 'string length must be positive and finite');
  invariant(Number.isFinite(p.speed) && p.speed > 0, 'speed must be positive and finite');
}

function checkState(state: CircleState): void {
  assertFinite(state.t, 'circle time');
  assertFinite(state.x + state.y + state.vx + state.vy, 'circle state');
}

/** Starts at (r, 0) moving counterclockwise (+y) at p.speed, string attached. */
export function createCircleState(p: CircleParams): CircleState {
  checkParams(p);
  const s: CircleState = { t: 0, x: p.r, y: 0, vx: 0, vy: p.speed, released: false };
  invariant(Math.hypot(s.x, s.y) === p.r, 'puck starts on the circle');
  return s;
}

/**
 * Advances by dt. On the string the rotation is exact: θ += v dt / r, and position and
 * velocity are rebuilt from θ, so |r| = r and |v| = speed hold to rounding. Once cut, the
 * puck moves in a straight line at constant velocity (no horizontal force).
 */
export function stepCircle(state: CircleState, p: CircleParams, dt: number): void {
  checkParams(p);
  invariant(dt > 0 && dt <= 1 / 30, 'dt must be in (0, 1/30]');
  checkState(state);
  if (state.released) {
    state.x += state.vx * dt;
    state.y += state.vy * dt;
  } else {
    invariant(Math.abs(Math.hypot(state.x, state.y) - p.r) <= ON_STRING_TOL * p.r, 'puck on the string must stay at distance r');
    invariant(Math.abs(Math.hypot(state.vx, state.vy) - p.speed) <= ON_STRING_TOL * p.speed, 'puck on the string must keep its speed');
    const theta = Math.atan2(state.y, state.x) + (p.speed * dt) / p.r;
    state.x = p.r * Math.cos(theta);
    state.y = p.r * Math.sin(theta);
    state.vx = -p.speed * Math.sin(theta);
    state.vy = p.speed * Math.cos(theta);
  }
  state.t += dt;
  checkState(state);
}

/** Cuts the string. Idempotent; the velocity at the cut is already along the tangent. */
export function releaseString(state: CircleState): void {
  checkState(state);
  invariant(Math.hypot(state.vx, state.vy) > 0, 'the puck is moving when the string is cut');
  state.released = true;
}

/**
 * Advances by dt and cuts the string at exactly `releaseAt` (null: never) by splitting the step:
 * circle up to releaseAt, cut, then straight for the rest. Returns the cut snapshot if the cut
 * happened during this call, else null.
 */
export function stepCircleTimed(state: CircleState, p: CircleParams, dt: number, releaseAt: number | null): ReleaseSnapshot | null {
  invariant(dt > 0 && dt <= 1 / 30, 'dt must be in (0, 1/30]');
  invariant(releaseAt === null || (Number.isFinite(releaseAt) && releaseAt >= 0), 'release time must be null or a finite time >= 0');
  if (state.released || releaseAt === null || state.t + dt < releaseAt) {
    stepCircle(state, p, dt);
    return null;
  }
  const before = Math.max(0, releaseAt - state.t);
  if (before > 0) stepCircle(state, p, before);
  releaseString(state);
  const snap: ReleaseSnapshot = { t: state.t, x: state.x, y: state.y, vx: state.vx, vy: state.vy };
  const after = dt - before;
  if (after > 0) stepCircle(state, p, after);
  return snap;
}

/**
 * Horizontal free-body list. On the string: tension m v² / r toward the post, plus the net entry.
 * Once cut: only the net entry, which is zero. Gravity and the ice's normal force are vertical
 * (out of this plane) and cancel, so they are not listed.
 */
export function circleForces(state: CircleState, p: CircleParams): ForceVec[] {
  checkParams(p);
  checkState(state);
  const forces: ForceVec[] = [];
  if (!state.released) {
    const dist = Math.hypot(state.x, state.y);
    invariant(dist > 0, 'puck on the string is away from the post');
    const mag = (p.m * p.speed * p.speed) / p.r;
    forces.push({ kind: 'tension', label: 'Tension', fx: (-mag * state.x) / dist, fy: (-mag * state.y) / dist });
  }
  const net = netForce(forces);
  forces.push({ kind: 'net', label: 'Net force', fx: net.fx, fy: net.fy });
  return forces;
}
