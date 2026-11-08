import { describe, expect, it } from 'vitest';
import { PHYSICS_DT } from '../../src/physics/fixedStep';
import { netForce, type ForceVec } from '../../src/physics/forces';
import {
  checkPulleyParams, pulleyAcceleration, pulleyAccelerationNow, pulleyForces, pulleyHeld, pulleyLanded, pulleyTension, stepPulley,
  type PulleyParams, type PulleyState,
} from '../../src/physics/pulley';

const g = 9.8;
const atwood: PulleyParams = { mode: 'atwood', m1: 2, m2: 3, muS: 0, muK: 0, g, travel: 1.5 };
const table: PulleyParams = { mode: 'table', m1: 4, m2: 2, muS: 0.4, muK: 0.25, g, travel: 1.2 };

function rest(): PulleyState { return { x: 0, v: 0, t: 0 }; }

function run(p: PulleyParams, seconds: number): PulleyState {
  const s = rest();
  const steps = Math.round(seconds / PHYSICS_DT);
  for (let i = 0; i < steps; i++) stepPulley(s, p, PHYSICS_DT);
  return s;
}

function net(list: readonly ForceVec[]): ForceVec {
  const n = list.filter((f) => f.kind === 'net');
  expect(n).toHaveLength(1);
  const e = n[0];
  if (e === undefined) throw new Error('no net entry');
  return e;
}

function force(list: readonly ForceVec[], label: string): ForceVec | undefined {
  return list.find((f) => f.label === label);
}

/** Σ F (non-net) = m × a for both blocks, and the net entry equals it too. */
function expectNewton2(state: PulleyState, p: PulleyParams): void {
  const a = pulleyAccelerationNow(state, p);
  const { block1, block2 } = pulleyForces(state, p);
  const a1 = p.mode === 'atwood' ? { x: 0, y: a } : { x: a, y: 0 };
  const s1 = netForce(block1);
  const s2 = netForce(block2);
  expect(s1.fx).toBeCloseTo(p.m1 * a1.x, 9);
  expect(s1.fy).toBeCloseTo(p.m1 * a1.y, 9);
  expect(s2.fx).toBeCloseTo(0, 9);
  expect(s2.fy).toBeCloseTo(-p.m2 * a, 9);
  expect(net(block1).fx).toBeCloseTo(s1.fx, 9);
  expect(net(block1).fy).toBeCloseTo(s1.fy, 9);
  expect(net(block2).fy).toBeCloseTo(s2.fy, 9);
}

describe('Atwood machine against the textbook closed forms', () => {
  // a = (m2 − m1) g / (m1 + m2) = (1)(9.8)/5 = 1.96 m/s²; T = m1(g + a) = 2 × 11.76 = 23.52 N.
  it('a = (m2 − m1)g/(m1 + m2) and T = m1(g + a) = m2(g − a)', () => {
    expect(pulleyAcceleration(atwood)).toBeCloseTo(1.96, 12);
    const T = pulleyTension(rest(), atwood);
    expect(T).toBeCloseTo(23.52, 12);
    expect(T).toBeCloseTo(atwood.m2 * (g - 1.96), 12);
    expect(T).toBeLessThan(atwood.m2 * g);
    expect(T).toBeGreaterThan(atwood.m1 * g);
  });
  it('the heavier block on the left makes block 2 rise, and T exceeds m2 g', () => {
    const p: PulleyParams = { ...atwood, m1: 3, m2: 2 };
    expect(pulleyAcceleration(p)).toBeCloseTo(-1.96, 12);
    expect(pulleyTension(rest(), p)).toBeCloseTo(23.52, 12);
    expect(pulleyTension(rest(), p)).toBeGreaterThan(p.m2 * g);
    expect(run(p, 0.5).x).toBeCloseTo(-0.5 * 1.96 * 0.25, 9);
  });
  it('equal masses: nothing moves and T = m g', () => {
    const p: PulleyParams = { ...atwood, m1: 2.5, m2: 2.5 };
    expect(pulleyAcceleration(p)).toBe(0);
    const s = run(p, 2);
    expect(s.x).toBe(0);
    expect(s.v).toBe(0);
    expect(pulleyTension(s, p)).toBeCloseTo(2.5 * g, 12);
    expectNewton2(s, p);
  });
  it('the exact step matches x = ½ a t² and v = a t', () => {
    const s = run(atwood, 1);
    expect(s.t).toBeCloseTo(1, 9);
    expect(s.x).toBeCloseTo(0.5 * 1.96 * 1, 9);
    expect(s.v).toBeCloseTo(1.96, 9);
  });
  it('lands after t = √(2 L / a), then rests with T = the lighter block’s weight', () => {
    const tLand = Math.sqrt((2 * atwood.travel) / 1.96);
    expect(pulleyLanded(run(atwood, tLand - 0.01), atwood)).toBe(false);
    const s = run(atwood, tLand + 0.01);
    expect(s.x).toBe(atwood.travel);
    expect(s.v).toBe(0);
    expect(pulleyAccelerationNow(s, atwood)).toBe(0);
    expect(pulleyTension(s, atwood)).toBeCloseTo(atwood.m1 * g, 12);
    const N = force(pulleyForces(s, atwood).block2, 'Normal');
    expect(N?.fy).toBeCloseTo((atwood.m2 - atwood.m1) * g, 12);
    expectNewton2(s, atwood);
  });
  it('when block 1 lands instead, the floor holds it and block 2 hangs with T = m2 g', () => {
    const p: PulleyParams = { ...atwood, m1: 3, m2: 2 };
    const s = run(p, 3);
    expect(s.x).toBe(-p.travel);
    expect(pulleyTension(s, p)).toBeCloseTo(p.m2 * g, 12);
    expect(force(pulleyForces(s, p).block1, 'Normal')?.fy).toBeCloseTo(g, 12);
    expect(force(pulleyForces(s, p).block2, 'Normal')).toBeUndefined();
    expectNewton2(s, p);
  });
});

describe('block on a table pulled by a hanging block', () => {
  // m2 g = 19.6 N > μs m1 g = 15.68 N, so it slides: a = (2 − 0.25 × 4)(9.8)/6 = 1.6333 m/s²,
  // T = m2(g − a) = 2 × 8.1667 = 16.333 N; kinetic friction = μk m1 g = 9.8 N.
  it('slides with a = (m2 − μk m1)g/(m1 + m2) and T = m2(g − a)', () => {
    expect(pulleyHeld(table)).toBe(false);
    const a = pulleyAcceleration(table);
    expect(a).toBeCloseTo((9.8 * 1) / 6, 12);
    expect(pulleyTension(rest(), table)).toBeCloseTo(2 * (9.8 - a), 12);
    const { block1 } = pulleyForces(rest(), table);
    expect(force(block1, 'Kinetic friction')?.fx).toBeCloseTo(-9.8, 12);
    expect(force(block1, 'Normal')?.fy).toBeCloseTo(4 * 9.8, 12);
    expect(force(block1, 'Tension')?.fx).toBeCloseTo(pulleyTension(rest(), table), 12);
    expectNewton2(run(table, 0.5), table);
  });
  it('static friction holds it below the limit: a = 0, f_s = T = m2 g', () => {
    const p: PulleyParams = { ...table, m2: 1.5 };
    expect(pulleyHeld(p)).toBe(true);
    const s = run(p, 2);
    expect(s.x).toBe(0);
    expect(pulleyTension(s, p)).toBeCloseTo(1.5 * g, 12);
    expect(force(pulleyForces(s, p).block1, 'Static friction')?.fx).toBeCloseTo(-1.5 * g, 12);
    expectNewton2(s, p);
  });
  it('exactly at the static limit (m2 = μs m1) it still holds', () => {
    const p: PulleyParams = { ...table, m1: 2.5, m2: 1 };
    expect(pulleyHeld(p)).toBe(true);
    expect(pulleyAcceleration(p)).toBe(0);
    expect(run(p, 1).x).toBe(0);
    expectNewton2(rest(), p);
    expect(pulleyHeld({ ...p, m2: 1.01 })).toBe(false);
  });
  it('frictionless table: a = m2 g/(m1 + m2), no friction force listed', () => {
    const p: PulleyParams = { ...table, muS: 0, muK: 0 };
    expect(pulleyAcceleration(p)).toBeCloseTo((2 * g) / 6, 12);
    expect(pulleyForces(rest(), p).block1.some((f) => f.kind === 'friction')).toBe(false);
    expectNewton2(rest(), p);
  });
  it('μs = μk: the slide starts once m2 just exceeds μ m1', () => {
    const p: PulleyParams = { ...table, muS: 0.3, muK: 0.3, m1: 5, m2: 1.6 };
    expect(pulleyAcceleration(p)).toBeCloseTo(((1.6 - 1.5) * g) / 6.6, 12);
  });
  it('after landing: both at rest, string slack (T = 0), floor carries m2 g, no friction', () => {
    const tLand = Math.sqrt((2 * table.travel) / pulleyAcceleration(table));
    const s = run(table, tLand + 0.05);
    expect(s.x).toBe(table.travel);
    expect(pulleyTension(s, table)).toBe(0);
    const { block1, block2 } = pulleyForces(s, table);
    expect(block1.some((f) => f.kind === 'friction' || f.kind === 'tension')).toBe(false);
    expect(force(block2, 'Normal')?.fy).toBeCloseTo(2 * g, 12);
    expectNewton2(s, table);
  });
  it('F_net = m a every step of a whole run, through the landing', () => {
    const s = rest();
    for (let i = 0; i < 960; i++) { stepPulley(s, table, PHYSICS_DT); expectNewton2(s, table); }
    expect(pulleyLanded(s, table)).toBe(true);
  });
});

describe('bad parameters throw', () => {
  it.each([
    ['μk > μs', { ...table, muS: 0.2, muK: 0.3 }],
    ['zero mass', { ...atwood, m1: 0 }],
    ['negative mass', { ...atwood, m2: -1 }],
    ['zero g', { ...atwood, g: 0 }],
    ['no travel', { ...atwood, travel: 0 }],
    ['negative friction', { ...table, muK: -0.1 }],
    ['NaN mass', { ...atwood, m2: NaN }],
  ])('%s', (_name, p) => {
    expect(() => { checkPulleyParams(p); }).toThrow();
    expect(() => { pulleyAcceleration(p); }).toThrow();
  });
  it('a bad step size or a non-finite state throws', () => {
    expect(() => { stepPulley(rest(), atwood, 0); }).toThrow();
    expect(() => { stepPulley({ x: 0, v: NaN, t: 0 }, atwood, PHYSICS_DT); }).toThrow();
    expect(() => { pulleyForces({ x: 2, v: 0, t: 0 }, atwood); }).toThrow();
  });
});
