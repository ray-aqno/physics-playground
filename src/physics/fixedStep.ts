import { assertFinite, invariant } from '../lib/invariant';

/** Physics timestep (s), decoupled from the display frame rate. */
export const PHYSICS_DT = 1 / 240;

/** Max physics steps per animation frame; stops the spiral of death after a background tab. */
export const MAX_SUBSTEPS = 8;

export interface StepPlan {
  /** Number of PHYSICS_DT steps to run this frame (0..MAX_SUBSTEPS). */
  readonly steps: number;
  /** Leftover time to carry to the next frame. */
  readonly carry: number;
}

/**
 * Fixed-timestep accumulator. Given the carried time and the frame's elapsed time, returns
 * how many steps to run. When the cap is hit the extra time is dropped, not queued.
 */
export function planSteps(carry: number, frameSeconds: number, dt: number = PHYSICS_DT): StepPlan {
  invariant(dt > 0 && dt <= 1 / 30, 'dt must be in (0, 1/30]');
  invariant(carry >= 0 && frameSeconds >= 0, 'times must be non-negative');
  assertFinite(carry + frameSeconds, 'accumulator time');
  const total = carry + frameSeconds;
  const wanted = Math.floor(total / dt);
  if (wanted > MAX_SUBSTEPS) return { steps: MAX_SUBSTEPS, carry: 0 };
  return { steps: wanted, carry: total - wanted * dt };
}
