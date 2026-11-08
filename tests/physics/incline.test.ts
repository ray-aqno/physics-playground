import { describe, expect, it } from 'vitest';
import { PHYSICS_DT } from '../../src/physics/fixedStep';
import { netForce } from '../../src/physics/forces';
import {
  inclineAcceleration, inclineContact, inclineForces, staticFrictionHolds, stepIncline,
  type InclineParams, type InclineState,
} from '../../src/physics/incline';

const deg = (d: number): number => (d * Math.PI) / 180;
const g = 9.8;
/** 30°: tan θ = 0.577 > μs = 0.3, so the block cannot rest on the slope. */
const slippery: InclineParams = { m: 2, angle: deg(30), muS: 0.3, muK: 0.2, g, length: 5 };
/** 20°: tan θ = 0.364 ≤ μs = 0.5, so static friction can hold the block. */
const grippy: InclineParams = { m: 2, angle: deg(20), muS: 0.5, muK: 0.3, g, length: 5 };

function run(state: InclineState, p: InclineParams, steps: number): { minS: number; maxS: number } {
  let minS = state.s;
  let maxS = state.s;
  for (let i = 0; i < steps; i++) {
    stepIncline(state, p, PHYSICS_DT);
    minS = Math.min(minS, state.s);
    maxS = Math.max(maxS, state.s);
    expectNewton(state, p);
  }
  return { minS, maxS };
}

/** ΣF (non-net) = m a along the slope, 0 across it, and exactly one 'net' entry equal to it. */
function expectNewton(state: InclineState, p: InclineParams): void {
  const forces = inclineForces(state, p);
  const nets = forces.filter((f) => f.kind === 'net');
  expect(nets).toHaveLength(1);
  const sum = netForce(forces);
  const ma = p.m * inclineAcceleration(state, p);
  expect(sum.fx).toBeCloseTo(ma * Math.cos(p.angle), 9);
  expect(sum.fy).toBeCloseTo(-ma * Math.sin(p.angle), 9);
  expect(nets[0]?.fx).toBeCloseTo(sum.fx, 9);
  expect(nets[0]?.fy).toBeCloseTo(sum.fy, 9);
}

const aDown = (p: InclineParams): number => p.g * (Math.sin(p.angle) - p.muK * Math.cos(p.angle));
const aUp = (p: InclineParams): number => p.g * (Math.sin(p.angle) + p.muK * Math.cos(p.angle));

describe('incline accelerations against the closed forms', () => {
  it('sliding down: a = g(sin θ − μk cos θ), s = ½ a t² after 1 s from rest', () => {
    const state: InclineState = { s: 0, v: 0, t: 0 };
    expect(inclineAcceleration({ s: 1, v: 1, t: 0 }, slippery)).toBeCloseTo(aDown(slippery), 12);
    run(state, slippery, 240);
    const a = aDown(slippery); // 9.8 (0.5 − 0.2 × 0.866) = 3.203 m/s²
    expect(a).toBeCloseTo(3.2026, 3);
    expect(state.t).toBeCloseTo(1, 12);
    expect(state.s).toBeCloseTo(0.5 * a, 9);
    expect(state.v).toBeCloseTo(a, 9);
  });
  it('moving up: a = g(sin θ + μk cos θ) down the slope; stops after v²/(2a)', () => {
    const v0 = 3;
    const state: InclineState = { s: 4, v: -v0, t: 0 };
    expect(inclineAcceleration(state, slippery)).toBeCloseTo(aUp(slippery), 12);
    const { minS } = run(state, slippery, 240);
    // The turnaround falls inside a step, so the sampled minimum lies at most ½ a_down dt² below the top.
    const top = 4 - (v0 * v0) / (2 * aUp(slippery));
    expect(minS).toBeGreaterThanOrEqual(top - 1e-12);
    expect(minS - top).toBeLessThanOrEqual(0.5 * aDown(slippery) * PHYSICS_DT * PHYSICS_DT + 1e-12);
  });
  it('slides back down after stopping when tan θ > μs, with the sliding-down acceleration', () => {
    const v0 = 3;
    const state: InclineState = { s: 4, v: -v0, t: 0 };
    const tUp = v0 / aUp(slippery);
    const steps = 240;
    run(state, slippery, steps);
    const tDown = steps * PHYSICS_DT - tUp;
    const top = 4 - (v0 * v0) / (2 * aUp(slippery));
    expect(state.v).toBeCloseTo(aDown(slippery) * tDown, 9);
    expect(state.s).toBeCloseTo(top + 0.5 * aDown(slippery) * tDown * tDown, 9);
  });
  it('stays at its highest point when tan θ ≤ μs (static friction m g sin θ up the slope)', () => {
    const v0 = 2;
    const state: InclineState = { s: 4, v: -v0, t: 0 };
    run(state, grippy, 480);
    expect(state.v).toBe(0);
    expect(state.s).toBeCloseTo(4 - (v0 * v0) / (2 * aUp(grippy)), 9);
    const c = inclineContact(state, grippy);
    expect(c.frictionKind).toBe('static');
    expect(c.friction).toBeCloseTo(-grippy.m * g * Math.sin(grippy.angle), 12);
    expect(Math.abs(c.friction)).toBeLessThanOrEqual(grippy.muS * c.normal);
  });
  it('moving down with μk > tan θ decelerates and stops after v²/(2|a|)', () => {
    const p: InclineParams = { ...grippy, muK: 0.45 };
    const a = aDown(p); // 9.8 (0.342 − 0.45 × 0.940) = −0.793 m/s²
    expect(a).toBeLessThan(0);
    const state: InclineState = { s: 0.5, v: 2, t: 0 };
    run(state, p, 2400);
    expect(state.v).toBe(0);
    expect(state.s).toBeCloseTo(0.5 + 4 / (2 * -a), 9);
  });
  it('normal force is m g cos θ in every regime', () => {
    for (const v of [-1, 0, 1]) expect(inclineContact({ s: 2, v, t: 0 }, slippery).normal).toBeCloseTo(2 * g * Math.cos(deg(30)), 12);
  });
});

describe('incline edge cases', () => {
  it('exactly at the static limit (tan θ = μs) the block stays at rest', () => {
    const p: InclineParams = { m: 1, angle: Math.atan(0.5), muS: 0.5, muK: 0.4, g, length: 5 };
    expect(staticFrictionHolds(p)).toBe(true);
    const state: InclineState = { s: 1, v: 0, t: 0 };
    run(state, p, 240);
    expect(state).toMatchObject({ s: 1, v: 0 });
    expect(Math.abs(inclineContact(state, p).friction)).toBeCloseTo(p.muS * inclineContact(state, p).normal, 12);
  });
  it('μk = μs = tan θ: a block moving down keeps a constant speed', () => {
    const p: InclineParams = { m: 1, angle: Math.atan(0.5), muS: 0.5, muK: 0.5, g, length: 5 };
    const state: InclineState = { s: 0, v: 1, t: 0 };
    run(state, p, 480);
    expect(state.v).toBeCloseTo(1, 12);
    expect(state.s).toBeCloseTo(2, 9);
  });
  it('zero friction: a = g sin θ both ways and the block returns to its start with its starting speed', () => {
    const p: InclineParams = { m: 1, angle: deg(30), muS: 0, muK: 0, g, length: 10 };
    const v0 = 2;
    const tBack = (2 * v0) / (g * 0.5); // 0.816 s
    const steps = Math.round(tBack / PHYSICS_DT);
    const state: InclineState = { s: 5, v: -v0, t: 0 };
    const { minS } = run(state, p, steps);
    const extra = steps * PHYSICS_DT - tBack;
    const top = 5 - (v0 * v0) / (2 * g * 0.5);
    expect(minS).toBeGreaterThanOrEqual(top - 1e-12);
    expect(minS - top).toBeLessThanOrEqual(0.5 * g * 0.5 * PHYSICS_DT * PHYSICS_DT + 1e-12);
    expect(state.v).toBeCloseTo(v0 + g * 0.5 * extra, 9);
    expect(state.s).toBeCloseTo(5 + v0 * extra + 0.25 * g * extra * extra, 9);
  });
  it('a step that crosses v = 0 is split: the held block ends exactly at rest, never moving down', () => {
    const state: InclineState = { s: 3, v: -0.001, t: 0 };
    stepIncline(state, grippy, PHYSICS_DT);
    expect(state.v).toBe(0);
    expect(state.s).toBeLessThan(3);
    expect(state.t).toBe(PHYSICS_DT);
  });
  it('stops at the bottom; the stop pushes so that ΣF = 0, with static friction at its maximum', () => {
    const state: InclineState = { s: 4, v: 0, t: 0 };
    const { maxS } = run(state, slippery, 480);
    expect(maxS).toBe(5);
    expect(state).toMatchObject({ s: 5, v: 0 });
    const c = inclineContact(state, slippery);
    expect(c.accel).toBe(0);
    expect(c.friction).toBeCloseTo(-slippery.muS * c.normal, 12);
    expect(c.stop).toBeCloseTo(-(c.gravityAlong - slippery.muS * c.normal), 12);
    const forces = inclineForces(state, slippery);
    expect(forces.map((f) => f.label)).toEqual(['Gravity', 'Normal', 'Static friction', 'Stop', 'Net']);
    const sum = netForce(forces);
    expect(Math.hypot(sum.fx, sum.fy)).toBeLessThan(1e-12);
  });
  it('a held block at the bottom needs no push from the stop', () => {
    const forces = inclineForces({ s: 5, v: 0, t: 0 }, grippy);
    expect(forces.map((f) => f.label)).toEqual(['Gravity', 'Normal', 'Static friction', 'Net']);
  });
  it('stops at the top (s = 0) when launched past it, then slides back if it cannot be held', () => {
    // Reaches s = 0 at t1 where 0.2 = 5 t1 − ½ a_up t1², stops there, then slides from rest.
    const state: InclineState = { s: 0.2, v: -5, t: 0 };
    const { minS } = run(state, slippery, 240);
    const t1 = (5 - Math.sqrt(25 - 2 * aUp(slippery) * 0.2)) / aUp(slippery);
    const tSlide = 1 - t1;
    expect(minS).toBeGreaterThanOrEqual(0);
    expect(state.s).toBeCloseTo(0.5 * aDown(slippery) * tSlide * tSlide, 9);
    expect(state.v).toBeCloseTo(aDown(slippery) * tSlide, 9);
    const held: InclineState = { s: 0.2, v: -5, t: 0 };
    run(held, grippy, 240);
    expect(held).toMatchObject({ s: 0, v: 0 });
  });
  it('labels friction static at rest and kinetic while moving or starting to slide', () => {
    expect(inclineForces({ s: 2, v: 0, t: 0 }, grippy)[2]?.label).toBe('Static friction');
    expect(inclineForces({ s: 2, v: 0, t: 0 }, slippery)[2]?.label).toBe('Kinetic friction');
    expect(inclineForces({ s: 2, v: -1, t: 0 }, grippy)[2]?.label).toBe('Kinetic friction');
  });
  it('kinetic friction opposes the motion: down the slope when moving up', () => {
    expect(inclineContact({ s: 2, v: -1, t: 0 }, slippery).friction).toBeGreaterThan(0);
    expect(inclineContact({ s: 2, v: 1, t: 0 }, slippery).friction).toBeLessThan(0);
  });
});

describe('incline rejects bad input', () => {
  const bad: Partial<InclineParams>[] = [
    { muK: 0.4, muS: 0.3 }, { angle: 0 }, { angle: deg(81) }, { m: 0 }, { length: -1 }, { g: 0 }, { muK: -0.1 }, { muS: NaN }, { m: Infinity },
  ];
  for (const b of bad) {
    it(`throws for ${JSON.stringify(b)}`, () => {
      expect(() => { stepIncline({ s: 1, v: 0, t: 0 }, { ...slippery, ...b }, PHYSICS_DT); }).toThrow();
    });
  }
  it('throws for a block off the slope, a non-finite velocity, or a bad dt', () => {
    expect(() => { stepIncline({ s: 6, v: 0, t: 0 }, slippery, PHYSICS_DT); }).toThrow();
    expect(() => { inclineForces({ s: 1, v: NaN, t: 0 }, slippery); }).toThrow();
    expect(() => { stepIncline({ s: 1, v: 0, t: 0 }, slippery, 0); }).toThrow();
  });
  it('allows 80° exactly', () => {
    expect(() => { stepIncline({ s: 1, v: 0, t: 0 }, { ...slippery, angle: deg(80) }, PHYSICS_DT); }).not.toThrow();
  });
});
