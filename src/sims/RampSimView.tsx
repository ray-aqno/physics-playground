import { useCallback, useRef, useState } from 'preact/hooks';
import { invariant } from '../lib/invariant';
import type { RampParams } from '../physics/energyRamp';
import { advanceRamp, createRampSim, setRampStart, type RampSim } from './controller';
import { describeRamp, fmt, rampBars } from './describe';
import { drawRamp } from './draw';
import { SimShell, useCanvas } from './SimShell';
import { useSimLoop, useThrottledTick } from './useSimLoop';

interface Props {
  readonly params: RampParams;
  readonly startS: number;
  readonly label: string;
  readonly locked?: boolean;
}

/** Energy-bars sim: block, spring, floor (with optional friction) and ramp. */
export function RampSimView({ params, startS, label, locked = false }: Props) {
  invariant(Number.isFinite(startS), 'start position must be finite');
  invariant(params.m > 0 && params.k > 0, 'mass and spring constant must be positive');
  const sim = useRef<RampSim>(createRampSim(params, startS));
  const [running, setRunning] = useState(false);
  const [, setVersion] = useState(0);
  const bump = useCallback(() => { setVersion((v) => v + 1); }, []);
  const canvas = useCanvas(0.42);

  useSimLoop(running && !locked, (steps) => {
    const before = sim.current.message;
    advanceRamp(sim.current, steps);
    if (sim.current.message !== before) { setRunning(false); bump(); }
    const ctx = canvas.ctx();
    const pal = canvas.palette();
    if (ctx !== null && pal !== null) drawRamp(ctx, sim.current.state, params, pal);
  });
  useThrottledTick(running, bump);

  const toggle = (): void => { if (!locked) setRunning(!running); };
  const reset = (): void => { sim.current = createRampSim(params, startS); setRunning(false); bump(); };
  const onKey = (e: KeyboardEvent): void => {
    if (running || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    setRampStart(sim.current, sim.current.startS + (e.key === 'ArrowRight' ? 0.1 : -0.1));
    bump();
  };
  const bars = rampBars(sim.current.state, params);
  return (
    <SimShell label={label} running={running && !locked} onToggle={toggle} onReset={reset} onKey={onKey}
      readout={bars.map((b) => ({ label: `${b.label} energy`, value: `${fmt(b.joules)} J` }))}
      description={describeRamp(sim.current.state, params)} message={sim.current.message} noCanvas={!canvas.supported}
      help="Space: play or pause. R: reset. Left and right arrows (paused): move the block's starting point.">
      <canvas ref={canvas.ref} class="sim-canvas" />
      <div class="energy-bars" aria-hidden="true">
        {bars.map((b) => (
          <div class={`bar bar-${b.label.toLowerCase()}`} key={b.label}>
            <span class="bar-label">{b.label}</span>
            <span class="bar-track"><span class="bar-fill" style={{ width: `${Math.round(Math.max(0, b.fraction) * 100)}%` }} /></span>
            <span class="bar-value">{fmt(b.joules)} J</span>
          </div>
        ))}
      </div>
    </SimShell>
  );
}
