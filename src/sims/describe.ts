import { invariant } from '../lib/invariant';
import type { World } from '../physics/bodies';
import { rampEnergies, type RampParams, type RampState } from '../physics/energyRamp';
import { centerOfMass, kineticEnergy, momentum } from '../physics/invariants';

/** Formats to a fixed number of decimals, avoiding "-0.00". */
export function fmt(x: number, digits = 2): string {
  invariant(Number.isFinite(x), 'value to format must be finite');
  invariant(digits >= 0 && digits <= 6, 'digits must be 0..6');
  const s = x.toFixed(digits);
  return /^-0\.?0*$/.test(s) ? s.slice(1) : s;
}

export interface Readout {
  readonly label: string;
  readonly value: string;
}

function direction(vx: number): string {
  invariant(Number.isFinite(vx), 'velocity must be finite');
  const speed = Math.abs(vx);
  invariant(speed >= 0, 'speed is non-negative');
  return speed < 0.005 ? 'at rest' : `moving ${vx > 0 ? 'right' : 'left'} at ${fmt(speed)} m/s`;
}

/** Live numbers for the collisions / center-of-mass sims (council condition 5). */
export function bodiesReadout(world: World, showCom: boolean): Readout[] {
  invariant(world.bodies.length >= 1, 'world needs bodies');
  const p = momentum(world.bodies);
  const rows: Readout[] = [
    { label: 'Total momentum', value: world.height <= 1.5 ? `${fmt(p.x)} kg·m/s` : `⟨${fmt(p.x)}, ${fmt(p.y)}⟩ kg·m/s` },
    { label: 'Total kinetic energy', value: `${fmt(kineticEnergy(world.bodies))} J` },
  ];
  if (showCom) {
    const c = centerOfMass(world.bodies);
    rows.push({ label: 'Center-of-mass velocity', value: `⟨${fmt(c.vx)}, ${fmt(c.vy)}⟩ m/s` });
  }
  invariant(rows.length >= 2, 'readout has rows');
  return rows;
}

/** A plain-language description of the bodies sim for screen readers (council condition 5). */
export function describeBodies(world: World, showCom: boolean): string {
  invariant(world.bodies.length >= 1, 'world needs bodies');
  const parts = world.bodies.map((b, i) => (world.height <= 1.5
    ? `Cart ${i + 1}, ${fmt(b.m, 1)} kg, ${direction(b.vx)}.`
    : `Puck ${i + 1}, ${fmt(b.m, 1)} kg, velocity ⟨${fmt(b.vx)}, ${fmt(b.vy)}⟩ m/s.`));
  const totals = bodiesReadout(world, showCom).map((r) => `${r.label} ${r.value}.`);
  const text = [...parts, ...totals].join(' ');
  invariant(text.length > 0, 'description must not be empty');
  return text;
}

export interface EnergyBar {
  readonly label: string;
  readonly joules: number;
  /** 0..1 of the total, for the bar width. */
  readonly fraction: number;
}

/** Energy bars with labels and values, not color alone (council condition 5). */
export function rampBars(state: RampState, params: RampParams): EnergyBar[] {
  const e = rampEnergies(state, params);
  const total = Math.max(e.total, 1e-9);
  const bars: EnergyBar[] = [
    { label: 'Kinetic', joules: e.kinetic, fraction: e.kinetic / total },
    { label: 'Spring', joules: e.spring, fraction: e.spring / total },
    { label: 'Gravity', joules: e.gravity, fraction: e.gravity / total },
    { label: 'Thermal', joules: e.thermal, fraction: e.thermal / total },
  ];
  invariant(bars.every((b) => b.fraction >= -1e-9), 'bar fractions are non-negative');
  invariant(bars.length === 4, 'four energy bars');
  return bars;
}

export function describeRamp(state: RampState, params: RampParams): string {
  const e = rampEnergies(state, params);
  invariant(Number.isFinite(e.total), 'energy total must be finite');
  const where = state.s < 0 ? `squashing the spring by ${fmt(-state.s)} m` : state.s <= params.flatLength ? `on the floor, ${fmt(state.s)} m from the spring` : `on the ramp, ${fmt(state.s - params.flatLength)} m up`;
  const text = `Block ${where}, ${Math.abs(state.v) < 0.005 ? 'at rest' : `moving at ${fmt(Math.abs(state.v))} m/s`}. Kinetic ${fmt(e.kinetic)} J, spring ${fmt(e.spring)} J, gravity ${fmt(e.gravity)} J, thermal ${fmt(e.thermal)} J, total ${fmt(e.total)} J.`;
  invariant(text.length > 0, 'description must not be empty');
  return text;
}
