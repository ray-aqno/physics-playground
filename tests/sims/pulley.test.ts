import { describe, expect, it } from 'vitest';
import type { Claim, SimSetup } from '../../src/content/types';
import type { PulleyParams } from '../../src/physics/pulley';
import { describePulley, pulleyFriction, pulleyReadout, tensionVsWeight } from '../../src/sims/describePulley';
import { arrowScale, blockSide } from '../../src/sims/drawPulley';
import { advancePulley, createPulleySim, setPulleyM2 } from '../../src/sims/pulleyController';
import { runPulley } from '../content/headless-pulley';

const atwood: PulleyParams = { mode: 'atwood', m1: 2, m2: 3, muS: 0, muK: 0, g: 9.8, travel: 1.5 };
const table: PulleyParams = { mode: 'table', m1: 4, m2: 2, muS: 0.4, muK: 0.25, g: 9.8, travel: 1.2 };
type PulleySetup = Extract<SimSetup, { sim: 'pulley' }>;
const setup = (params: PulleyParams, seconds = 0.5): PulleySetup => ({ sim: 'pulley', params, seconds });

const dir = (sign: -1 | 0 | 1): Claim => ({ kind: 'pulley-direction', sign });
const tens = (relation: 'less' | 'equal' | 'more'): Claim => ({ kind: 'tension-vs-weight', relation });
const ALL: readonly Claim[] = [dir(-1), dir(0), dir(1), tens('less'), tens('equal'), tens('more')];

function holds(s: PulleySetup): Claim[] {
  const ev = runPulley(s);
  return ALL.filter((c) => ev(c));
}

describe('headless pulley claims', () => {
  it('heavier block 2: moves down, T < m2 g', () => {
    expect(holds(setup(atwood))).toEqual([dir(1), tens('less')]);
  });
  it('heavier block 1: block 2 moves up, T > m2 g', () => {
    expect(holds(setup({ ...atwood, m1: 3, m2: 2 }))).toEqual([dir(-1), tens('more')]);
  });
  it('equal masses: stays, T = m2 g', () => {
    expect(holds(setup({ ...atwood, m2: 2 }))).toEqual([dir(0), tens('equal')]);
  });
  it('table held by static friction: stays, T = m2 g', () => {
    expect(holds(setup({ ...table, m2: 1.5 }))).toEqual([dir(0), tens('equal')]);
  });
  it('table sliding: moves down, T < m2 g', () => {
    expect(holds(setup(table))).toEqual([dir(1), tens('less')]);
  });
  it('after landing, the state at the end decides: Atwood T = m1 g < m2 g, table string slack', () => {
    expect(holds(setup(atwood, 3))).toEqual([dir(1), tens('less')]);
    expect(holds(setup({ ...atwood, m1: 3, m2: 2 }, 3))).toEqual([dir(-1), tens('equal')]);
    expect(holds(setup(table, 3))).toEqual([dir(1), tens('less')]);
  });
  it('every other claim kind is false', () => {
    const ev = runPulley(setup(atwood));
    const others: Claim[] = [
      { kind: 'velocity-sign', body: 0, sign: 1 }, { kind: 'ke-change', change: 'more' }, { kind: 'com-velocity', change: 'same' },
      { kind: 'max-height', relation: 'same' }, { kind: 'ends-lower', lower: true }, { kind: 'release-path', path: 'tangent' },
    ];
    expect(others.some((c) => ev(c))).toBe(false);
  });
  it('rejects bad setups', () => {
    expect(() => runPulley(setup({ ...table, muK: 0.5 }))).toThrow();
    expect(() => runPulley(setup(atwood, 0))).toThrow();
  });
});

describe('pulley controller', () => {
  it('advances from rest without a message', () => {
    const sim = createPulleySim(atwood);
    advancePulley(sim, 8);
    expect(sim.message).toBeNull();
    expect(sim.state.x).toBeGreaterThan(0);
    expect(sim.state.v).toBeCloseTo(1.96 * (8 / 240), 12);
  });
  it('a broken state resets to rest with a message', () => {
    const sim = createPulleySim(atwood);
    advancePulley(sim, 4);
    sim.state.v = NaN;
    advancePulley(sim, 1);
    expect(sim.message).toContain('Sim reset');
    expect(sim.state).toEqual({ x: 0, v: 0, t: 0 });
  });
  it('after 2 resets in a row it goes back to the starting setup', () => {
    const sim = createPulleySim(atwood);
    setPulleyM2(sim, 5);
    for (let i = 0; i < 3; i++) { sim.state.x = Infinity; advancePulley(sim, 1); }
    expect(sim.message).toContain('starting setup');
    expect(sim.params.m2).toBe(3);
  });
  it('setPulleyM2 rounds to 0.1 kg, clamps to 0.1–10 kg and restarts from rest', () => {
    const sim = createPulleySim(table);
    advancePulley(sim, 8);
    setPulleyM2(sim, 2 + 0.1 + 0.1 + 0.1);
    expect(sim.params.m2).toBe(2.3);
    expect(sim.state.x).toBe(0);
    setPulleyM2(sim, 50);
    expect(sim.params.m2).toBe(10);
    setPulleyM2(sim, -3);
    expect(sim.params.m2).toBe(0.1);
    expect(sim.params.m1).toBe(table.m1);
  });
  it('rejects more than 8 steps per frame and bad params', () => {
    expect(() => { advancePulley(createPulleySim(atwood), 9); }).toThrow();
    expect(() => createPulleySim({ ...table, muS: 0.1 })).toThrow();
  });
});

describe('pulley readouts and description', () => {
  it('readout shows a, speed, T beside m2 g, weights, friction and normal with units', () => {
    const rows = pulleyReadout({ x: 0, v: 0, t: 0 }, table);
    const v = (label: string): string | undefined => rows.find((r) => r.label === label)?.value;
    expect(v('Block 2 mass m₂')).toBe('2.0 kg');
    expect(v('Acceleration')).toBe('1.63 m/s² (block 2 down)');
    expect(v('Speed')).toBe('0.00 m/s');
    expect(v('String tension T')).toBe('16.33 N');
    expect(v('Block 2 weight m₂g')).toBe('19.60 N');
    expect(v('Block 1 weight m₁g')).toBe('39.20 N');
    expect(v('Friction on block 1')).toBe('9.80 N (kinetic)');
    expect(v('Table normal on block 1')).toBe('39.20 N');
  });
  it('held table block reports static friction equal to m2 g', () => {
    const p = { ...table, m2: 1.5 };
    expect(pulleyFriction({ x: 0, v: 0, t: 0 }, p)).toEqual({ newtons: 1.5 * 9.8, kind: 'static' });
    expect(describePulley({ x: 0, v: 0, t: 0 }, p)).toContain('Static friction holds block 1');
  });
  it('Atwood description names the forces, the motion and T against m2 g', () => {
    const text = describePulley({ x: 0.1, v: 0.6, t: 0.3 }, atwood);
    expect(text).toContain('Atwood machine');
    expect(text).toContain('Block 2 is moving down at 0.60 m/s and speeding up at 1.96 m/s²; block 1 moves up');
    expect(text).toContain('Forces on block 1: gravity 19.60 N down, tension 23.52 N up.');
    expect(text).toContain('Forces on block 2: gravity 29.40 N down, tension 23.52 N up.');
    expect(text).toContain("The tension is less than block 2's weight.");
  });
  it('after landing, the floor normal shows up in the readout and description', () => {
    const s = { x: 1.5, v: 0, t: 2 };
    expect(pulleyReadout(s, atwood).find((r) => r.label === 'Floor normal on block 2')?.value).toBe('9.80 N');
    expect(describePulley(s, atwood)).toContain('Block 2 has reached the floor');
    expect(tensionVsWeight(s, atwood)).toBe('less');
  });
  it('drawing sizes: blocks at least 30 px, heaviest weight arrow 60 px', () => {
    expect(blockSide(0.1)).toBeGreaterThanOrEqual(30);
    expect(arrowScale(atwood) * 3 * 9.8).toBeCloseTo(60, 9);
  });
});
