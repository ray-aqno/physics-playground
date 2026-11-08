import { useCallback, useRef, useState } from 'preact/hooks';
import { invariant } from '../lib/invariant';
import type { PulleyParams } from '../physics/pulley';
import { describePulley, pulleyReadout } from './describePulley';
import { drawPulley } from './drawPulley';
import { advancePulley, createPulleySim, M2_STEP, setPulleyM2, type PulleySim } from './pulleyController';
import { SimShell, useCanvas } from './SimShell';
import { useSimLoop, useThrottledTick } from './useSimLoop';

export interface PulleySimProps {
  readonly params: PulleyParams;
  readonly label: string;
  readonly locked?: boolean;
}

const KEY_STEP: Readonly<Record<string, number>> = { ArrowUp: M2_STEP, ArrowRight: M2_STEP, ArrowDown: -M2_STEP, ArrowLeft: -M2_STEP };

/** Two blocks on a string over a pulley: an Atwood machine, or a block on a table with friction. */
export function PulleySimView({ params, label, locked = false }: PulleySimProps) {
  invariant(params.m1 > 0 && params.m2 > 0, 'masses must be positive');
  invariant(params.travel > 0, 'travel must be positive');
  const sim = useRef<PulleySim>(createPulleySim(params));
  const [running, setRunning] = useState(false);
  const [, setVersion] = useState(0);
  const bump = useCallback(() => { setVersion((v) => v + 1); }, []);
  const canvas = useCanvas(params.mode === 'atwood' ? 0.75 : 0.8);

  useSimLoop(running && !locked, (steps) => {
    const before = sim.current.message;
    advancePulley(sim.current, steps);
    if (sim.current.message !== before) { setRunning(false); bump(); }
    const ctx = canvas.ctx();
    const pal = canvas.palette();
    if (ctx !== null && pal !== null) drawPulley(ctx, sim.current.state, sim.current.params, pal);
  });
  useThrottledTick(running, bump);

  const toggle = (): void => { if (!locked) setRunning(!running); };
  const reset = (): void => { sim.current = createPulleySim(params); setRunning(false); bump(); };
  const onKey = (e: KeyboardEvent): void => {
    const d = KEY_STEP[e.key];
    if (running || locked || d === undefined) return;
    e.preventDefault();
    setPulleyM2(sim.current, sim.current.params.m2 + d);
    bump();
  };
  const { state, params: current } = sim.current;
  return (
    <SimShell label={label} running={running && !locked} onToggle={toggle} onReset={reset} onKey={onKey}
      readout={pulleyReadout(state, current)} description={describePulley(state, current)} message={sim.current.message}
      noCanvas={!canvas.supported} locked={locked}
      help="Space: play or pause. R: reset to the starting setup. Up or right arrow (paused): add 0.1 kg to block 2. Down or left arrow (paused): take 0.1 kg off block 2 (0.1 to 10 kg).">
      <canvas ref={canvas.ref} class="sim-canvas" />
    </SimShell>
  );
}
