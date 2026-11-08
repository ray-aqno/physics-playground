import type { Claim, SimSetup } from '../../src/content/types';
import { assertFinite, invariant } from '../../src/lib/invariant';
import { PHYSICS_DT } from '../../src/physics/fixedStep';
import { checkPulleyParams, stepPulley, type PulleyState } from '../../src/physics/pulley';
import { tensionVsWeight } from '../../src/sims/describePulley';

/**
 * Runs the pulley physics headless for `setup.seconds` in PHYSICS_DT steps (from rest), then
 * evaluates claims on the final state:
 *   pulley-direction: the sign of block 2's displacement (+1 down, 0 stayed, -1 up);
 *   tension-vs-weight: the tension at the end against m2 g, "equal" within 1%.
 * Every other claim kind is false.
 */
export function runPulley(setup: Extract<SimSetup, { sim: 'pulley' }>): (claim: Claim) => boolean {
  checkPulleyParams(setup.params);
  invariant(setup.seconds > 0 && setup.seconds <= 60, 'a pulley run lasts (0, 60] s');
  const state: PulleyState = { x: 0, v: 0, t: 0 };
  const steps = Math.round(setup.seconds / PHYSICS_DT);
  // bound: steps <= 60 / PHYSICS_DT = 14,400
  for (let i = 0; i < steps; i++) stepPulley(state, setup.params, PHYSICS_DT);
  assertFinite(state.x + state.v, 'final pulley state');
  const direction = Math.abs(state.x) < 1e-9 ? 0 : Math.sign(state.x);
  const relation = tensionVsWeight(state, setup.params);
  return (claim) => {
    switch (claim.kind) {
      case 'pulley-direction': return claim.sign === direction;
      case 'tension-vs-weight': return claim.relation === relation;
      case 'velocity-sign':
      case 'ke-change':
      case 'com-velocity':
      case 'max-height':
      case 'ends-lower':
      case 'release-path': return false;
    }
  };
}
