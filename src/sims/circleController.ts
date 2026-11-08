import { invariant, InvariantError } from '../lib/invariant';
import { createCircleState, releaseString, stepCircleTimed, type CircleParams, type CircleState, type ReleaseSnapshot } from '../physics/circle';
import { PHYSICS_DT } from '../physics/fixedStep';
import { MAX_CONSECUTIVE_RESETS } from './controller';

/** Recent positions kept for the trail: 2 s of physics steps. */
export const TRAIL_MAX = 480;
export const MIN_SPEED = 0.5;
export const MAX_SPEED = 6;

export interface TrailPoint {
  readonly x: number;
  readonly y: number;
}

export interface CircleSim {
  /** Current setup; the learner can change the speed while paused. */
  params: CircleParams;
  readonly defaultParams: CircleParams;
  /** Time (s) the string is cut automatically, or null for the learner's Cut button. */
  readonly releaseAt: number | null;
  state: CircleState;
  /** Where and how the puck was moving when the string was cut (null while attached). */
  release: ReleaseSnapshot | null;
  trail: TrailPoint[];
  resets: number;
  message: string | null;
}

export function createCircleSim(params: CircleParams, releaseAt: number | null): CircleSim {
  invariant(releaseAt === null || (Number.isFinite(releaseAt) && releaseAt >= 0), 'release time must be null or a finite time >= 0');
  const state = createCircleState(params);
  const sim: CircleSim = { params, defaultParams: params, releaseAt, state, release: null, trail: [{ x: state.x, y: state.y }], resets: 0, message: null };
  invariant(sim.trail.length === 1, 'trail starts at the puck');
  return sim;
}

/** Back to the start (puck at (r, 0), string attached) with the current params. */
export function resetCircle(sim: CircleSim, why: string | null): void {
  invariant(why === null || why.length > 0, 'a reset reason must not be empty');
  sim.state = createCircleState(sim.params);
  sim.release = null;
  sim.trail = [{ x: sim.state.x, y: sim.state.y }];
  sim.message = why;
  invariant(!sim.state.released && sim.state.t === 0, 'reset starts attached at t = 0');
}

function pushTrail(sim: CircleSim): void {
  invariant(sim.trail.length <= TRAIL_MAX, 'trail is bounded');
  sim.trail.push({ x: sim.state.x, y: sim.state.y });
  if (sim.trail.length > TRAIL_MAX) sim.trail.shift();
  invariant(sim.trail.length <= TRAIL_MAX, 'trail stays bounded');
}

/**
 * Runs `steps` physics steps, cutting the string at releaseAt if set. A broken invariant resets
 * the sim with a message (SC9); after MAX_CONSECUTIVE_RESETS it falls back to the default (SC21).
 */
export function advanceCircle(sim: CircleSim, steps: number): void {
  invariant(Number.isInteger(steps) && steps >= 0 && steps <= 8, 'steps per frame must be 0..8');
  invariant(sim.params.r > 0, 'sim has a positive string length');
  // bound: steps <= MAX_SUBSTEPS (8)
  for (let i = 0; i < steps; i++) {
    try {
      const snap = stepCircleTimed(sim.state, sim.params, PHYSICS_DT, sim.releaseAt);
      if (snap !== null) sim.release = snap;
      pushTrail(sim);
    } catch (e) {
      if (!(e instanceof InvariantError)) throw e;
      sim.resets += 1;
      if (sim.resets > MAX_CONSECUTIVE_RESETS) { sim.params = sim.defaultParams; sim.resets = 0; }
      resetCircle(sim, 'The numbers went out of range. Sim reset.');
      return;
    }
  }
  if (steps > 0) sim.resets = 0;
}

/** Learner cut the string (Cut button or C); only for setups with no automatic cut. Idempotent. */
export function cutString(sim: CircleSim): void {
  invariant(sim.releaseAt === null, 'the string is cut automatically in this setup');
  if (sim.state.released) return;
  const snap: ReleaseSnapshot = { t: sim.state.t, x: sim.state.x, y: sim.state.y, vx: sim.state.vx, vy: sim.state.vy };
  invariant(Math.abs(Math.hypot(snap.vx, snap.vy) - sim.params.speed) <= 1e-9 * sim.params.speed, 'the puck leaves at its circling speed');
  releaseString(sim.state);
  sim.release = snap;
}

/** Sets the speed (paused only), clamped to MIN_SPEED..MAX_SPEED in 0.1 m/s steps, and restarts. */
export function setCircleSpeed(sim: CircleSim, speed: number): void {
  invariant(Number.isFinite(speed), 'speed must be finite');
  const v = Math.round(Math.min(Math.max(speed, MIN_SPEED), MAX_SPEED) * 10) / 10;
  sim.params = { ...sim.params, speed: v };
  resetCircle(sim, null);
  invariant(sim.state.vy === v, 'puck restarts at the new speed');
}
