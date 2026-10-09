import { describe, expect, it } from 'vitest';
import { createWorld, type BodySpec, type World } from '../../src/physics/bodies';
import { resolveImpulse, stepEventDriven, timeOfImpact, MAX_EVENTS_PER_STEP } from '../../src/physics/collisions';
import { centerOfMass, kineticEnergy, momentum } from '../../src/physics/invariants';
import { PHYSICS_DT } from '../../src/physics/fixedStep';

const STEPS = 10_000;

function body(x: number, y: number, vx: number, vy: number, m = 1, r = 0.25): BodySpec {
  return { x, y, vx, vy, m, r };
}

/** Five disks in a 10 m box with mixed masses and velocities, none overlapping. */
function boxWorld(e: number, walls = true): World {
  return createWorld({
    width: 10, height: 10, walls, e,
    bodies: [
      body(2, 2, 3, 1, 1), body(5, 2, -2, 2, 2), body(8, 5, -1, -3, 0.5),
      body(5, 8, 1.5, -1, 3), body(2, 7, 2, 0.5, 1.5),
    ],
  });
}

function run(world: World, steps: number): { maxEvents: number; capped: boolean } {
  let maxEvents = 0;
  let capped = false;
  for (let i = 0; i < steps; i++) {
    const r = stepEventDriven(world, PHYSICS_DT);
    maxEvents = Math.max(maxEvents, r.events);
    capped = capped || r.capped;
  }
  return { maxEvents, capped };
}

function momentumScale(world: World): number {
  return world.bodies.reduce((s, b) => s + b.m * Math.hypot(b.vx, b.vy), 0);
}

describe('closed-form impacts against hand-derived values (SC3)', () => {
  // 1-D elastic: v1' = (m1-m2)/(m1+m2) v1 + 2 m2/(m1+m2) v2 ; m1=2, m2=1, v1=3, v2=0 -> v1'=1, v2'=4
  it('1-D elastic, 2 kg at 3 m/s hits 1 kg at rest', () => {
    const w = createWorld({ width: 100, height: 1, walls: false, e: 1, bodies: [body(0, 0, 3, 0, 2), body(0.5, 0, 0, 0, 1)] });
    const [a, b] = w.bodies;
    if (a === undefined || b === undefined) throw new Error('setup');
    resolveImpulse(a, b, 1);
    expect(a.vx).toBeCloseTo(1, 12);
    expect(b.vx).toBeCloseTo(4, 12);
  });
  // Perfectly inelastic: v = (m1 v1 + m2 v2)/(m1+m2) = (2*3 + 0)/3 = 2
  it('1-D perfectly inelastic gives the common velocity 2 m/s', () => {
    const w = createWorld({ width: 100, height: 1, walls: false, e: 0, bodies: [body(0, 0, 3, 0, 2), body(0.5, 0, 0, 0, 1)] });
    const [a, b] = w.bodies;
    if (a === undefined || b === undefined) throw new Error('setup');
    resolveImpulse(a, b, 0);
    expect(a.vx).toBeCloseTo(2, 12);
    expect(b.vx).toBeCloseTo(2, 12);
  });
  // e = 0.5: v1' = (P - m2 e (v1 - v2))/M = (6 - 1.5)/3 = 1.5 ; v2' = (P + m1 e (v1 - v2))/M = (6 + 3)/3 = 3
  it('1-D partially elastic e = 0.5', () => {
    const w = createWorld({ width: 100, height: 1, walls: false, e: 0.5, bodies: [body(0, 0, 3, 0, 2), body(0.5, 0, 0, 0, 1)] });
    const [a, b] = w.bodies;
    if (a === undefined || b === undefined) throw new Error('setup');
    resolveImpulse(a, b, 0.5);
    expect(a.vx).toBeCloseTo(1.5, 12);
    expect(b.vx).toBeCloseTo(3, 12);
  });
  // 2-D equal masses, elastic, target at rest, line of centers at 30°:
  // target gets (v·n) n = cos30 (cos30, sin30) = (0.75, 0.4330127); incoming keeps (0.25, -0.4330127)
  it('2-D oblique elastic impact sends equal masses off at right angles', () => {
    const r = 0.25;
    const nx = Math.cos(Math.PI / 6);
    const ny = Math.sin(Math.PI / 6);
    const w = createWorld({ width: 100, height: 100, walls: false, e: 1, bodies: [body(0, 0, 1, 0, 1, r), body(2 * r * nx, 2 * r * ny, 0, 0, 1, r)] });
    const [a, b] = w.bodies;
    if (a === undefined || b === undefined) throw new Error('setup');
    resolveImpulse(a, b, 1);
    expect(a.vx).toBeCloseTo(0.25, 9);
    expect(a.vy).toBeCloseTo(-0.4330127, 7);
    expect(b.vx).toBeCloseTo(0.75, 9);
    expect(b.vy).toBeCloseTo(0.4330127, 7);
    expect(a.vx * b.vx + a.vy * b.vy).toBeCloseTo(0, 9);
  });
  // Heavy-light 10:1 elastic, light at rest: v1' = 9/11 v, v2' = 20/11 v with v = 1
  it('10:1 heavy hits light at rest', () => {
    const w = createWorld({ width: 100, height: 1, walls: false, e: 1, bodies: [body(0, 0, 1, 0, 10), body(0.5, 0, 0, 0, 1)] });
    const [a, b] = w.bodies;
    if (a === undefined || b === undefined) throw new Error('setup');
    resolveImpulse(a, b, 1);
    expect(a.vx).toBeCloseTo(9 / 11, 12);
    expect(b.vx).toBeCloseTo(20 / 11, 12);
  });
  // Newton's cradle: three equal balls in a row, first moving -> only the last moves after
  it('three-body chain passes the motion to the end ball', () => {
    const w = createWorld({ width: 100, height: 1, walls: false, e: 1, bodies: [body(0, 0, 1, 0), body(0.6, 0, 0, 0), body(1.1, 0, 0, 0)] });
    run(w, 240);
    const v = w.bodies.map((b) => b.vx);
    expect(v[0]).toBeCloseTo(0, 9);
    expect(v[1]).toBeCloseTo(0, 9);
    expect(v[2]).toBeCloseTo(1, 9);
  });
});

describe('conservation over 10,000 steps (council condition 1)', () => {
  for (const e of [1, 0.5, 0]) {
    it(`momentum minus wall impulse is conserved within 0.1% (e = ${e})`, () => {
      const w = boxWorld(e);
      const p0 = momentum(w.bodies);
      const scale = momentumScale(w);
      const { capped } = run(w, STEPS);
      const p = momentum(w.bodies);
      expect(capped).toBe(false);
      expect(Math.hypot(p.x - w.wallImpulseX - p0.x, p.y - w.wallImpulseY - p0.y) / scale).toBeLessThan(1e-3);
    });
  }
  it('kinetic energy is conserved within 0.5% for elastic impacts', () => {
    const w = boxWorld(1);
    const k0 = kineticEnergy(w.bodies);
    const { capped, maxEvents } = run(w, STEPS);
    expect(capped).toBe(false);
    expect(maxEvents).toBeLessThan(MAX_EVENTS_PER_STEP);
    expect(Math.abs(kineticEnergy(w.bodies) - k0) / k0).toBeLessThan(5e-3);
  });
  it('kinetic energy never increases for inelastic impacts', () => {
    const w = boxWorld(0.5);
    const k0 = kineticEnergy(w.bodies);
    run(w, STEPS);
    expect(kineticEnergy(w.bodies)).toBeLessThanOrEqual(k0 * (1 + 1e-9));
  });
  it('center-of-mass velocity is constant with no external force', () => {
    const w = boxWorld(0.7, false);
    const c0 = centerOfMass(w.bodies);
    run(w, STEPS);
    const c1 = centerOfMass(w.bodies);
    expect(Math.abs(c1.vx - c0.vx)).toBeLessThan(1e-9);
    expect(Math.abs(c1.vy - c0.vy)).toBeLessThan(1e-9);
  });
});

describe('degenerate setups (SC8)', () => {
  it('overlapping bodies that approach are pushed apart, not capped', () => {
    const w = createWorld({ width: 10, height: 10, walls: true, e: 1, bodies: [body(5, 5, 1, 0), body(5.3, 5, -1, 0)] });
    const r = stepEventDriven(w, PHYSICS_DT);
    expect(r.capped).toBe(false);
    expect(w.bodies[0]?.vx).toBeLessThan(0);
  });
  it('bodies spawned at the same point do not throw or cap', () => {
    const w = createWorld({ width: 10, height: 10, walls: true, e: 1, bodies: [body(5, 5, 1, 0), body(5, 5, 1, 0)] });
    const { capped } = run(w, 100);
    expect(capped).toBe(false);
  });
  it('timeOfImpact is null for bodies moving apart', () => {
    const w = createWorld({ width: 10, height: 10, walls: false, e: 1, bodies: [body(1, 1, -1, 0), body(2, 1, 1, 0)] });
    const [a, b] = w.bodies;
    if (a === undefined || b === undefined) throw new Error('setup');
    expect(timeOfImpact(a, b)).toBeNull();
  });
  it('rejects bad specs', () => {
    expect(() => createWorld({ width: 10, height: 10, walls: true, e: 1.2, bodies: [body(1, 1, 0, 0)] })).toThrow('restitution');
    expect(() => createWorld({ width: 10, height: 10, walls: true, e: 1, bodies: [body(1, 1, 0, 0, -1)] })).toThrow('mass');
  });
});

describe('step time (arbiter condition 4)', () => {
  it('measures 10,000 steps with 8 bodies', () => {
    const specs: BodySpec[] = [];
    for (let i = 0; i < 8; i++) specs.push(body(1 + (i % 4) * 2.2, 2 + Math.floor(i / 4) * 5, ((i * 7) % 5) - 2, ((i * 3) % 5) - 2));
    const w = createWorld({ width: 10, height: 10, walls: true, e: 1, bodies: specs });
    const t0 = performance.now();
    const { capped } = run(w, STEPS);
    const ms = performance.now() - t0;
    console.log(`[step-time] 10,000 steps, 8 bodies: ${ms.toFixed(1)} ms (${((ms * 1000) / STEPS).toFixed(2)} µs/step)`);
    expect(capped).toBe(false);
    expect(ms).toBeLessThan(5000);
  });
});
