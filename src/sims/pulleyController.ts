import { invariant, InvariantError } from '../lib/invariant';
import { PHYSICS_DT } from '../physics/fixedStep';
import { checkPulleyParams, stepPulley, type PulleyParams, type PulleyState } from '../physics/pulley';
import { MAX_CONSECUTIVE_RESETS } from './controller';

/** Range and step for block 2's mass, set with the arrow keys while paused. */
export const M2_MIN = 0.1;
export const M2_MAX = 10;
export const M2_STEP = 0.1;

export interface PulleySim {
  /** Current setup; the learner can change m2 while paused. */
  params: PulleyParams;
  /** The setup the sim falls back to after repeated resets (the props' setup). */
  readonly defaultParams: PulleyParams;
  state: PulleyState;
  resets: number;
  message: string | null;
}

export function createPulleySim(params: PulleyParams): PulleySim {
  checkPulleyParams(params);
  invariant(params.travel > 0, 'blocks need room to move');
  const sim: PulleySim = { params, defaultParams: params, state: { x: 0, v: 0, t: 0 }, resets: 0, message: null };
  invariant(sim.state.x === 0 && sim.state.v === 0, 'the pulley sim starts at rest');
  return sim;
}

/** Puts both blocks back at the start, at rest. */
export function resetPulley(sim: PulleySim, why: string | null): void {
  checkPulleyParams(sim.params);
  invariant(sim.resets >= 0, 'reset count is non-negative');
  sim.state = { x: 0, v: 0, t: 0 };
  sim.message = why;
  invariant(sim.state.v === 0 && sim.state.t === 0, 'reset starts at rest at t = 0');
}

/** Runs pulley steps; a broken invariant resets to the start (SC9), and to the default setup after 2 in a row (SC21). */
export function advancePulley(sim: PulleySim, steps: number): void {
  invariant(Number.isInteger(steps) && steps >= 0 && steps <= 8, 'steps per frame must be 0..8');
  invariant(sim.resets >= 0, 'reset count is non-negative');
  // bound: steps <= MAX_SUBSTEPS (8)
  for (let i = 0; i < steps; i++) {
    try {
      stepPulley(sim.state, sim.params, PHYSICS_DT);
    } catch (e) {
      if (!(e instanceof InvariantError)) throw e;
      sim.resets += 1;
      const useDefault = sim.resets > MAX_CONSECUTIVE_RESETS;
      if (useDefault) { sim.params = sim.defaultParams; sim.resets = 0; }
      resetPulley(sim, useDefault ? 'The numbers went out of range. Back to the starting setup.' : 'The numbers went out of range. Sim reset.');
      return;
    }
  }
  if (steps > 0) sim.resets = 0;
}

/** Sets block 2's mass (paused only), rounded to 0.1 kg and kept in 0.1–10 kg, and restarts from rest. */
export function setPulleyM2(sim: PulleySim, m2: number): void {
  invariant(Number.isFinite(m2), 'mass must be finite');
  const clamped = Math.min(Math.max(Math.round(m2 / M2_STEP) * M2_STEP, M2_MIN), M2_MAX);
  const next: PulleyParams = { ...sim.params, m2: Math.round(clamped * 10) / 10 };
  checkPulleyParams(next);
  sim.params = next;
  resetPulley(sim, null);
  invariant(sim.params.m2 >= M2_MIN && sim.params.m2 <= M2_MAX, 'm2 stays in range');
}
