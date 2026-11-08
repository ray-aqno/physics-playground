import { useCallback, useRef, useState } from 'preact/hooks';
import { invariant } from '../lib/invariant';
import type { CircleParams } from '../physics/circle';
import { advanceCircle, createCircleSim, cutString, setCircleSpeed, type CircleSim } from './circleController';
import { circleReadout, describeCircle } from './describeCircle';
import { drawCircle } from './drawCircle';
import { SimShell, useCanvas } from './SimShell';
import { useSimLoop, useThrottledTick } from './useSimLoop';

export interface CircleSimProps {
  readonly params: CircleParams;
  /** Time (s) at which the string is cut automatically, or null to let the learner cut it. */
  readonly releaseAt: number | null;
  readonly label: string;
  readonly locked?: boolean;
}

const HELP_MANUAL = 'Space: play or pause. R: reset. C or the Cut button: cut the string. Up/right and down/left arrows (paused): speed up or slow down by 0.1 m/s (0.5 to 6 m/s), restarting the puck.';
const HELP_AUTO = 'Space: play or pause. R: reset. The string is cut automatically. Up/right and down/left arrows (paused): speed up or slow down by 0.1 m/s (0.5 to 6 m/s), restarting the puck.';

function speedDelta(key: string): number {
  invariant(key.length > 0, 'key must not be empty');
  const d = key === 'ArrowUp' || key === 'ArrowRight' ? 0.1 : key === 'ArrowDown' || key === 'ArrowLeft' ? -0.1 : 0;
  invariant(Math.abs(d) <= 0.1, 'speed step is at most 0.1 m/s');
  return d;
}

/** Puck on a string on frictionless ice, seen from above; the string can be cut. */
export function CircleSimView({ params, releaseAt, label, locked = false }: CircleSimProps) {
  invariant(params.m > 0 && params.r > 0 && params.speed > 0, 'mass, string length and speed must be positive');
  invariant(releaseAt === null || releaseAt >= 0, 'release time must be null or >= 0');
  const sim = useRef<CircleSim>(createCircleSim(params, releaseAt));
  const [running, setRunning] = useState(false);
  const [, setVersion] = useState(0);
  const bump = useCallback(() => { setVersion((v) => v + 1); }, []);
  const canvas = useCanvas(0.75);

  useSimLoop(running && !locked, (steps) => {
    const s = sim.current;
    const before = s.message;
    const wasReleased = s.state.released;
    advanceCircle(s, steps);
    if (s.message !== before) { setRunning(false); bump(); }
    if (s.state.released !== wasReleased) bump();
    const ctx = canvas.ctx();
    const pal = canvas.palette();
    if (ctx !== null && pal !== null) drawCircle(ctx, { state: s.state, params: s.params, trail: s.trail, release: s.release, refSpeed: params.speed }, pal);
  });
  useThrottledTick(running, bump);

  const manual = releaseAt === null;
  const canCut = manual && !locked && !sim.current.state.released;
  const toggle = (): void => { if (!locked) setRunning(!running); };
  const reset = (): void => { sim.current = createCircleSim(params, releaseAt); setRunning(false); bump(); };
  const cut = (): void => { if (canCut) { cutString(sim.current); bump(); } };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'c' || e.key === 'C') { cut(); return; }
    const d = speedDelta(e.key);
    if (running || d === 0) return;
    e.preventDefault();
    setCircleSpeed(sim.current, sim.current.params.speed + d);
    bump();
  };
  const st = sim.current.state;
  return (
    <SimShell label={label} running={running && !locked} onToggle={toggle} onReset={reset} onKey={onKey}
      readout={circleReadout(st, sim.current.params)} description={describeCircle(st, sim.current.params)}
      message={sim.current.message} noCanvas={!canvas.supported} locked={locked} help={manual ? HELP_MANUAL : HELP_AUTO}>
      <canvas ref={canvas.ref} class="sim-canvas" />
      {manual && (
        <div class="sim-controls" style={{ padding: '0 8px' }}>
          <button type="button" class="btn" disabled={!canCut} onClick={cut}>{st.released ? 'String cut' : 'Cut the string'}</button>
        </div>
      )}
    </SimShell>
  );
}
