import { useCallback, useRef, useState } from 'preact/hooks';
import { invariant } from '../lib/invariant';
import type { InclineParams } from '../physics/incline';
import { describeIncline, inclineReadout } from './describeIncline';
import { drawIncline, INCLINE_ASPECT } from './drawIncline';
import { advanceIncline, angleDegrees, createInclineSim, setInclineAngle, type InclineSim } from './inclineController';
import { SimShell, useCanvas } from './SimShell';
import { useSimLoop, useThrottledTick } from './useSimLoop';

export interface InclineSimProps {
  readonly params: InclineParams;
  /** Starting distance down the slope (m) and velocity along it (m/s, + = down). */
  readonly startS: number;
  readonly startV: number;
  readonly label: string;
  readonly locked?: boolean;
}

const ANGLE_KEYS: Readonly<Record<string, number>> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 };

/** Block on an incline with static and kinetic friction, and a live free-body diagram. */
export function InclineSimView({ params, startS, startV, label, locked = false }: InclineSimProps) {
  invariant(Number.isFinite(startS) && Number.isFinite(startV), 'start position and velocity must be finite');
  invariant(params.m > 0 && params.length > 0, 'mass and slope length must be positive');
  const sim = useRef<InclineSim>(createInclineSim(params, startS, startV));
  const [running, setRunning] = useState(false);
  const [, setVersion] = useState(0);
  const bump = useCallback(() => { setVersion((v) => v + 1); }, []);
  const canvas = useCanvas(INCLINE_ASPECT);

  useSimLoop(running && !locked, (steps) => {
    const before = sim.current.message;
    advanceIncline(sim.current, steps);
    if (sim.current.message !== before) { setRunning(false); bump(); }
    const ctx = canvas.ctx();
    const pal = canvas.palette();
    if (ctx !== null && pal !== null) drawIncline(ctx, sim.current.state, sim.current.params, pal);
  });
  useThrottledTick(running, bump);

  const toggle = (): void => { if (!locked) setRunning(!running); };
  const reset = (): void => { sim.current = createInclineSim(params, startS, startV); setRunning(false); bump(); };
  const onKey = (e: KeyboardEvent): void => {
    const delta = ANGLE_KEYS[e.key];
    if (running || locked || delta === undefined) return;
    e.preventDefault();
    setInclineAngle(sim.current, angleDegrees(sim.current.params) + delta);
    bump();
  };
  const { state, params: current } = sim.current;
  return (
    <SimShell label={label} running={running && !locked} onToggle={toggle} onReset={reset} onKey={onKey}
      readout={inclineReadout(state, current)} description={describeIncline(state, current)}
      message={sim.current.message} noCanvas={!canvas.supported} locked={locked}
      help="Space: play or pause. R: reset. Up or right arrow (paused): steepen the slope by 1°. Down or left arrow (paused): make it 1° shallower. The angle stays between 5° and 60°.">
      <canvas ref={canvas.ref} class="sim-canvas" />
    </SimShell>
  );
}
