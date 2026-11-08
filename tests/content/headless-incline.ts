import type { Claim, SimSetup } from '../../src/content/types';
import { invariant } from '../../src/lib/invariant';
import { PHYSICS_DT } from '../../src/physics/fixedStep';
import { stepIncline, type InclineState } from '../../src/physics/incline';

/** "Ends lower" means the block finishes more than 1 mm further down the slope than it started. */
export const ENDS_LOWER_TOL = 1e-3;
/** Longest headless run (s); predict setups are a few seconds long. */
const MAX_SECONDS = 120;

/**
 * Runs the incline physics headless (not the controller) for `setup.seconds` in PHYSICS_DT steps,
 * then evaluates claims on the final state. Only 'ends-lower' claims can hold; every other kind is false.
 */
export function runIncline(setup: Extract<SimSetup, { sim: 'incline' }>): (claim: Claim) => boolean {
  invariant(setup.seconds > 0 && setup.seconds <= MAX_SECONDS, 'headless run must be 0..120 s');
  invariant(setup.startS >= 0 && setup.startS <= setup.params.length, 'start must be on the slope');
  const state: InclineState = { s: setup.startS, v: setup.startV, t: 0 };
  const steps = Math.round(setup.seconds / PHYSICS_DT);
  // bound: steps <= 120 s / PHYSICS_DT = 28,800
  for (let i = 0; i < steps; i++) stepIncline(state, setup.params, PHYSICS_DT);
  const lower = state.s - setup.startS > ENDS_LOWER_TOL;
  return (claim) => claim.kind === 'ends-lower' && claim.lower === lower;
}
