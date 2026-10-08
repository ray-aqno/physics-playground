import { useCallback, useRef, useState } from 'preact/hooks';
import { invariant } from '../lib/invariant';
import type { WorldSpec } from '../physics/bodies';
import { advanceBodies, createBodiesSim, markRunning, placeBody, type BodiesSim } from './controller';
import { bodiesReadout, describeBodies } from './describe';
import { drawBodies } from './draw';
import { SimShell, useCanvas } from './SimShell';
import { useSimLoop, useThrottledTick } from './useSimLoop';

interface Props {
  readonly preset: WorldSpec;
  readonly label: string;
  readonly showCom: boolean;
  /** When false, the learner cannot run the sim yet (a predict step before the prediction). */
  readonly locked?: boolean;
}

/** Collisions and center-of-mass sim: carts on a track (1-D) or pucks on a table (2-D). */
export function BodiesSimView({ preset, label, showCom, locked = false }: Props) {
  invariant(preset.bodies.length >= 1 && preset.bodies.length <= 8, 'sim needs 1 to 8 bodies');
  const sim = useRef<BodiesSim>(createBodiesSim(preset));
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState(0);
  const [, setVersion] = useState(0);
  const bump = useCallback(() => { setVersion((v) => v + 1); }, []);
  const canvas = useCanvas(preset.height <= 1.5 ? 0.3 : preset.height / preset.width);
  const dragging = useRef<number | null>(null);

  useSimLoop(running && !locked, (steps) => {
    const before = sim.current.message;
    advanceBodies(sim.current, steps);
    if (sim.current.message !== before) { setRunning(false); bump(); }
    const ctx = canvas.ctx();
    const pal = canvas.palette();
    if (ctx !== null && pal !== null) drawBodies(ctx, sim.current.world, pal, selected, showCom);
  });
  useThrottledTick(running, bump);

  const toggle = (): void => {
    if (locked) return;
    if (!running) markRunning(sim.current);
    setRunning(!running);
  };
  const reset = (): void => { sim.current = createBodiesSim(preset); setRunning(false); bump(); };
  const onKey = useKeyControl(sim, selected, setSelected, running, bump);
  const pointer = usePointerDrag(sim, canvas.ref, dragging, running, setSelected, bump);
  const world = sim.current.world;
  return (
    <SimShell label={label} running={running && !locked} onToggle={toggle} onReset={reset} onKey={onKey}
      readout={bodiesReadout(world, showCom)} description={describeBodies(world, showCom)} message={sim.current.message}
      noCanvas={!canvas.supported} help="Space: play or pause. R: reset. 1-8: choose a body. Arrow keys (paused): change its velocity. Drag a body (paused) to move it.">
      <canvas ref={canvas.ref} class="sim-canvas" onPointerDown={pointer.down} onPointerMove={pointer.move} onPointerUp={pointer.up} />
    </SimShell>
  );
}

function useKeyControl(sim: { current: BodiesSim }, selected: number, setSelected: (i: number) => void, running: boolean, bump: () => void) {
  return (e: KeyboardEvent): void => {
    const n = sim.current.world.bodies.length;
    const digit = Number(e.key);
    if (Number.isInteger(digit) && digit >= 1 && digit <= n) { setSelected(digit - 1); bump(); return; }
    const b = sim.current.world.bodies[selected];
    if (running || b === undefined) return;
    const dv: Record<string, [number, number]> = { ArrowLeft: [-0.5, 0], ArrowRight: [0.5, 0], ArrowUp: [0, 0.5], ArrowDown: [0, -0.5] };
    const d = dv[e.key];
    if (d === undefined) return;
    e.preventDefault();
    b.vx = Math.round((b.vx + d[0]) * 10) / 10;
    if (sim.current.world.height > 1.5) b.vy = Math.round((b.vy + d[1]) * 10) / 10;
    bump();
  };
}

function usePointerDrag(sim: { current: BodiesSim }, ref: { current: HTMLCanvasElement | null }, dragging: { current: number | null }, running: boolean, setSelected: (i: number) => void, bump: () => void) {
  const toWorld = (e: PointerEvent): [number, number] => {
    const el = ref.current;
    if (el === null) return [0, 0];
    const rect = el.getBoundingClientRect();
    const w = sim.current.world;
    const s = rect.width / w.width;
    const oneD = w.height <= 1.5;
    return [(e.clientX - rect.left) / s, oneD ? w.height / 2 : (rect.height - (e.clientY - rect.top)) / s];
  };
  return {
    down: (e: PointerEvent): void => {
      if (running) return;
      const [x, y] = toWorld(e);
      const i = sim.current.world.bodies.findIndex((b) => Math.hypot(b.x - x, b.y - y) <= b.r * 1.5);
      if (i < 0) return;
      dragging.current = i;
      setSelected(i);
      if (e.target instanceof Element) e.target.setPointerCapture(e.pointerId);
    },
    move: (e: PointerEvent): void => {
      if (dragging.current === null) return;
      const [x, y] = toWorld(e);
      placeBody(sim.current, dragging.current, x, sim.current.world.height <= 1.5 ? sim.current.world.bodies[dragging.current]?.y ?? y : y);
      bump();
    },
    up: (): void => { dragging.current = null; },
  };
}
