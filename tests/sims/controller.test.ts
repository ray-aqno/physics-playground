import { describe, expect, it } from 'vitest';
import type { WorldSpec } from '../../src/physics/bodies';
import { advanceBodies, advanceRamp, createBodiesSim, createRampSim, markRunning, placeBody, setRampStart } from '../../src/sims/controller';
import { bodiesReadout, describeBodies, describeRamp, fmt, rampBars } from '../../src/sims/describe';

const preset: WorldSpec = { width: 10, height: 1, walls: true, e: 1, bodies: [{ x: 2, y: 0.5, vx: 1, vy: 0, m: 2, r: 0.3 }, { x: 5, y: 0.5, vx: 0, vy: 0, m: 1, r: 0.3 }] };
function body0(sim: ReturnType<typeof createBodiesSim>) {
  const b = sim.world.bodies[0];
  if (b === undefined) throw new Error('no body 0');
  return b;
}

const ramp = { m: 1, k: 50, mu: 0, flatLength: 2, angle: Math.PI / 6, g: 9.8 };

describe('bodies sim controller (SC8, SC9, SC21)', () => {
  it('advances normally without a message', () => {
    const sim = createBodiesSim(preset);
    advanceBodies(sim, 8);
    expect(sim.message).toBeNull();
    expect(sim.world.bodies[0]?.x).toBeGreaterThan(2);
  });
  it('a broken invariant resets to the last valid setup with a message', () => {
    const sim = createBodiesSim(preset);
    body0(sim).vx = NaN;
    advanceBodies(sim, 1);
    expect(sim.message).toContain('Sim reset');
    expect(sim.world.bodies[0]?.vx).toBe(1);
  });
  it('after 2 consecutive resets it falls back to the default preset', () => {
    const sim = createBodiesSim(preset);
    body0(sim).vx = 3;
    markRunning(sim);
    for (let i = 0; i < 3; i++) {
      body0(sim).vx = NaN;
      advanceBodies(sim, 1);
    }
    expect(sim.message).toContain('starting setup');
    expect(sim.world.bodies[0]?.vx).toBe(1);
  });
  it('placing a body on top of another nudges it apart', () => {
    const sim = createBodiesSim(preset);
    placeBody(sim, 0, 5, 0.5);
    const [a, b] = sim.world.bodies;
    expect(Math.hypot((a?.x ?? 0) - (b?.x ?? 0), (a?.y ?? 0) - (b?.y ?? 0))).toBeGreaterThanOrEqual(0.6);
  });
  it('placing keeps bodies inside the box', () => {
    const sim = createBodiesSim(preset);
    placeBody(sim, 1, 50, -3);
    expect(sim.world.bodies[1]?.x).toBe(9.7);
    expect(sim.world.bodies[1]?.y).toBe(0.3);
  });
  it('rejects more than 8 steps per frame', () => {
    expect(() => { advanceBodies(createBodiesSim(preset), 9); }).toThrow();
  });
});

describe('ramp sim controller', () => {
  it('runs and moves the block', () => {
    const sim = createRampSim(ramp, -0.4);
    advanceRamp(sim, 8);
    expect(sim.state.v).toBeGreaterThan(0);
  });
  it('a broken state resets to the start with a message', () => {
    const sim = createRampSim(ramp, 4);
    sim.state.v = Infinity;
    advanceRamp(sim, 1);
    expect(sim.message).toContain('Sim reset');
    expect(sim.state.s).toBe(4);
  });
  it('setRampStart clamps to the track', () => {
    const sim = createRampSim(ramp, 4);
    setRampStart(sim, -5);
    expect(sim.state.s).toBe(-0.6);
  });
});

describe('readouts and descriptions (council condition 5)', () => {
  it('1-D readout shows momentum and kinetic energy with units', () => {
    const sim = createBodiesSim(preset);
    expect(bodiesReadout(sim.world, false)).toEqual([
      { label: 'Total momentum', value: '2.00 kg·m/s' },
      { label: 'Total kinetic energy', value: '1.00 J' },
    ]);
  });
  it('description names each cart and its motion', () => {
    const text = describeBodies(createBodiesSim(preset).world, false);
    expect(text).toContain('Cart 1, 2.0 kg, moving right at 1.00 m/s.');
    expect(text).toContain('Cart 2, 1.0 kg, at rest.');
  });
  it('energy bars carry labels and joules that sum to the total', () => {
    const bars = rampBars({ s: -0.4, v: 0, thermal: 0 }, ramp);
    expect(bars.map((b) => b.label)).toEqual(['Kinetic', 'Spring', 'Gravity', 'Thermal']);
    expect(bars[1]?.joules).toBeCloseTo(4, 9);
    expect(bars.reduce((s, b) => s + b.fraction, 0)).toBeCloseTo(1, 9);
  });
  it('ramp description says where the block is', () => {
    expect(describeRamp({ s: -0.4, v: 0, thermal: 0 }, ramp)).toContain('squashing the spring by 0.40 m');
  });
  it('fmt never shows -0.00', () => {
    expect(fmt(-0.001)).toBe('0.00');
  });
});
