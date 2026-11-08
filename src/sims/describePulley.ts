import { assertFinite, invariant } from '../lib/invariant';
import type { ForceVec } from '../physics/forces';
import { pulleyAccelerationNow, pulleyForces, pulleyLanded, pulleyTension, type PulleyParams, type PulleyState } from '../physics/pulley';
import { fmt, type Readout } from './describe';

export type TensionRelation = 'less' | 'equal' | 'more';

/** String tension compared with block 2's weight m2 g, "equal" within 1% (the claim's rule). */
export function tensionVsWeight(state: PulleyState, p: PulleyParams): TensionRelation {
  const T = pulleyTension(state, p);
  assertFinite(T, 'tension');
  const W2 = p.m2 * p.g;
  invariant(W2 > 0, 'block 2 has weight');
  if (Math.abs(T - W2) <= 0.01 * W2) return 'equal';
  return T < W2 ? 'less' : 'more';
}

/** Friction on the table block: its size (N) and whether it is static, kinetic or absent. */
export function pulleyFriction(state: PulleyState, p: PulleyParams): { readonly newtons: number; readonly kind: 'static' | 'kinetic' | 'none' } {
  const f = pulleyForces(state, p).block1.find((x) => x.kind === 'friction');
  invariant(f === undefined || p.mode === 'table', 'only the table block feels friction');
  if (f === undefined) return { newtons: 0, kind: 'none' };
  invariant(f.fx < 0 && f.fy === 0, 'friction on block 1 points left, against the pull');
  return { newtons: -f.fx, kind: f.label === 'Static friction' ? 'static' : 'kinetic' };
}

function magnitude(f: ForceVec): number {
  const m = Math.hypot(f.fx, f.fy);
  invariant(Number.isFinite(m), 'force must be finite');
  invariant(f.kind !== 'net', 'net is not a separate force');
  return m;
}

function frictionText(state: PulleyState, p: PulleyParams): string {
  invariant(p.mode === 'table', 'friction acts only on the table block');
  const fr = pulleyFriction(state, p);
  invariant(fr.newtons >= 0, 'friction size is non-negative');
  return fr.kind === 'none' ? '0.00 N' : `${fmt(fr.newtons)} N (${fr.kind})`;
}

/** Live numbers: m2, acceleration, speed, tension next to m2 g, every other force, and friction. */
export function pulleyReadout(state: PulleyState, p: PulleyParams): Readout[] {
  const a = pulleyAccelerationNow(state, p);
  assertFinite(a + state.v, 'acceleration and velocity');
  const { block1, block2 } = pulleyForces(state, p);
  const dir = a > 0 ? ' (block 2 down)' : a < 0 ? ' (block 2 up)' : '';
  const rows: Readout[] = [
    { label: 'Block 2 mass m₂', value: `${fmt(p.m2, 1)} kg` },
    { label: 'Acceleration', value: `${fmt(Math.abs(a))} m/s²${dir}` },
    { label: 'Speed', value: `${fmt(Math.abs(state.v))} m/s` },
    { label: 'String tension T', value: `${fmt(pulleyTension(state, p))} N` },
    { label: 'Block 2 weight m₂g', value: `${fmt(p.m2 * p.g)} N` },
    { label: 'Block 1 weight m₁g', value: `${fmt(p.m1 * p.g)} N` },
  ];
  if (p.mode === 'table') rows.push({ label: 'Friction on block 1', value: frictionText(state, p) });
  const n1 = block1.find((f) => f.kind === 'normal');
  if (n1 !== undefined) rows.push({ label: p.mode === 'table' ? 'Table normal on block 1' : 'Floor normal on block 1', value: `${fmt(magnitude(n1))} N` });
  const n2 = block2.find((f) => f.kind === 'normal');
  if (n2 !== undefined) rows.push({ label: 'Floor normal on block 2', value: `${fmt(magnitude(n2))} N` });
  invariant(rows.length >= 6 && rows.length <= 9, 'readout has 6 to 9 rows');
  return rows;
}

function directionWord(f: ForceVec): string {
  invariant(Number.isFinite(f.fx) && Number.isFinite(f.fy), 'force must be finite');
  invariant(f.fx === 0 || f.fy === 0, 'pulley forces are horizontal or vertical');
  if (f.fx !== 0) return f.fx > 0 ? 'right' : 'left';
  return f.fy > 0 ? 'up' : 'down';
}

function listForces(name: string, forces: readonly ForceVec[]): string {
  invariant(name.length > 0, 'the block needs a name');
  const parts = forces.filter((f) => f.kind !== 'net').map((f) => `${f.label.toLowerCase()} ${fmt(magnitude(f))} N ${directionWord(f)}`);
  invariant(parts.length >= 1 && parts.length <= 7, 'each block has 1 to 7 forces');
  return `Forces on ${name}: ${parts.join(', ')}.`;
}

function motionText(state: PulleyState, p: PulleyParams): string {
  const a = pulleyAccelerationNow(state, p);
  invariant(Number.isFinite(state.v), 'speed must be finite');
  const block1Way = p.mode === 'atwood' ? (a > 0 ? 'up' : 'down') : 'to the right';
  if (pulleyLanded(state, p)) return `Block ${state.x > 0 ? 2 : 1} has reached the floor, so both blocks are at rest.`;
  if (a === 0) return p.mode === 'atwood' ? 'The masses balance, so neither block moves.' : 'Static friction holds block 1, so neither block moves.';
  if (state.v === 0) return `Both blocks are at rest at the start. Once released, block 2 speeds up ${a > 0 ? 'downward' : 'upward'} at ${fmt(Math.abs(a))} m/s².`;
  return `Block 2 is moving ${a > 0 ? 'down' : 'up'} at ${fmt(Math.abs(state.v))} m/s and speeding up at ${fmt(Math.abs(a))} m/s²; block 1 moves ${block1Way} at the same speed.`;
}

/** One paragraph for screen readers: the setup, the motion, every force, and T against m2 g. */
export function describePulley(state: PulleyState, p: PulleyParams): string {
  const { block1, block2 } = pulleyForces(state, p);
  invariant(block1.length >= 3 && block2.length >= 2, 'each block has its weight, its other forces and a net entry');
  const setup = p.mode === 'atwood'
    ? `Atwood machine: block 1 (${fmt(p.m1, 1)} kg) hangs on the left and block 2 (${fmt(p.m2, 1)} kg) on the right of a pulley.`
    : `Block 1 (${fmt(p.m1, 1)} kg) sits on a table with μs ${fmt(p.muS)} and μk ${fmt(p.muK)}; the string runs over a pulley at the edge to block 2 (${fmt(p.m2, 1)} kg), which hangs.`;
  const rel = tensionVsWeight(state, p);
  const compare = rel === 'equal' ? 'equal to' : rel === 'less' ? 'less than' : 'more than';
  const text = `${setup} ${motionText(state, p)} ${listForces('block 1', block1)} ${listForces('block 2', block2)} The tension is ${compare} block 2's weight.`;
  invariant(text.length > 0, 'description must not be empty');
  return text;
}
