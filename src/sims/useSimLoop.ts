import { useEffect, useRef } from 'preact/hooks';
import { planSteps } from '../physics/fixedStep';

/**
 * Drives a sim with requestAnimationFrame and the fixed-step accumulator (P10 rule 2:
 * at most MAX_SUBSTEPS physics steps per frame). `onFrame` gets the step count, then draws.
 */
export function useSimLoop(running: boolean, onFrame: (steps: number) => void): void {
  const frame = useRef(onFrame);
  frame.current = onFrame;
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let carry = 0;
    const tick = (now: number): void => {
      const elapsed = Math.min(Math.max((now - last) / 1000, 0), 1);
      last = now;
      const plan = running ? planSteps(carry, elapsed) : { steps: 0, carry: 0 };
      carry = plan.carry;
      frame.current(plan.steps);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); };
  }, [running]);
}

/** Re-renders the readout at most 4 times a second while running (screen-reader friendly). */
export function useThrottledTick(running: boolean, bump: () => void): void {
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(bump, 250);
    return () => { clearInterval(id); };
  }, [running, bump]);
}
