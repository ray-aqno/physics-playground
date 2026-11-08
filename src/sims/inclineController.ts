import { assertFinite, invariant, InvariantError } from '../lib/invariant';
import { PHYSICS_DT } from '../physics/fixedStep';
import { checkInclineParams, stepIncline, type InclineParams, type InclineState } from '../physics/incline';
import { MAX_CONSECUTIVE_RESETS } from './controller';

/** Range the arrow keys keep the slope angle in (degrees). */
export const MIN_ANGLE_DEG = 5;
export const MAX_ANGLE_DEG = 60;

export interface InclineSim {
  /** Current parameters; the angle changes with the arrow keys while paused. */
  params: InclineParams;
  state: InclineState;
  readonly startS: number;
  readonly startV: number;
  /** The setup the sim falls back to after repeated resets (the props' setup). */
  readonly defaultParams: InclineParams;
  resets: number;
  message: string | null;
}

export function createInclineSim(params: InclineParams, startS: number, startV: number): InclineSim {
  checkInclineParams(params);
  assertFinite(startV, 'start velocity');
  invariant(startS >= 0 && startS <= params.length, 'start position must be on the slope');
  return { params, state: { s: startS, v: startV, t: 0 }, startS, startV, defaultParams: params, resets: 0, message: null };
}

export function resetIncline(sim: InclineSim, why: string | null): void {
  invariant(why === null || why.length > 0, 'a reset message must not be empty');
  sim.state = { s: sim.startS, v: sim.startV, t: 0 };
  sim.message = why;
  invariant(sim.state.t === 0, 'reset restarts the clock');
}

/** Runs incline steps; a broken invariant resets to the start (SC9), and to the default setup after 2 in a row (SC21). */
export function advanceIncline(sim: InclineSim, steps: number): void {
  invariant(Number.isInteger(steps) && steps >= 0 && steps <= 8, 'steps per frame must be 0..8');
  invariant(sim.resets >= 0, 'reset count is non-negative');
  // bound: steps <= MAX_SUBSTEPS (8)
  for (let i = 0; i < steps; i++) {
    try {
      stepIncline(sim.state, sim.params, PHYSICS_DT);
    } catch (e) {
      if (!(e instanceof InvariantError)) throw e;
      sim.resets += 1;
      const fallBack = sim.resets > MAX_CONSECUTIVE_RESETS;
      if (fallBack) { sim.params = sim.defaultParams; sim.resets = 0; }
      resetIncline(sim, fallBack ? 'The numbers went out of range. Back to the starting setup.' : 'The numbers went out of range. Sim reset.');
      return;
    }
  }
  if (steps > 0) sim.resets = 0;
}

export function angleDegrees(p: InclineParams): number {
  assertFinite(p.angle, 'slope angle');
  invariant(p.angle > 0, 'slope angle must be positive');
  return (p.angle * 180) / Math.PI;
}

/** Sets the slope angle (paused only), kept within 5°–60°, and puts the block back at its start. */
export function setInclineAngle(sim: InclineSim, degrees: number): void {
  assertFinite(degrees, 'slope angle (degrees)');
  const clamped = Math.min(Math.max(degrees, MIN_ANGLE_DEG), MAX_ANGLE_DEG);
  sim.params = { ...sim.params, angle: (clamped * Math.PI) / 180 };
  checkInclineParams(sim.params);
  resetIncline(sim, null);
  invariant(Math.abs(angleDegrees(sim.params) - clamped) < 1e-9, 'angle set');
}
