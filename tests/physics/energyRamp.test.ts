import { describe, expect, it } from 'vitest';
import { heightAt, rampEnergies, stepRamp, type RampParams, type RampState } from '../../src/physics/energyRamp';
import { PHYSICS_DT } from '../../src/physics/fixedStep';

const base: RampParams = { m: 1, k: 50, mu: 0, flatLength: 2, angle: Math.PI / 6, g: 9.8 };

function runRamp(state: RampState, p: RampParams, steps: number): { minS: number } {
  let minS = state.s;
  for (let i = 0; i < steps; i++) {
    stepRamp(state, p, PHYSICS_DT);
    minS = Math.min(minS, state.s);
  }
  return { minS };
}

describe('energy bars sim: total energy over 10,000 steps (council condition 1)', () => {
  it('frictionless: K + U stays within 0.5%', () => {
    const state: RampState = { s: -0.4, v: 0, thermal: 0 };
    const e0 = rampEnergies(state, base).total;
    for (let i = 0; i < 10_000; i++) {
      stepRamp(state, base, PHYSICS_DT);
      expect(Math.abs(rampEnergies(state, base).total - e0) / e0).toBeLessThan(5e-3);
    }
  });
  it('with friction: K + U + thermal stays within 0.5% and the block comes to rest', () => {
    const p: RampParams = { ...base, mu: 0.2 };
    const state: RampState = { s: -0.4, v: 0, thermal: 0 };
    const e0 = rampEnergies(state, p).total;
    for (let i = 0; i < 10_000; i++) {
      stepRamp(state, p, PHYSICS_DT);
      expect(Math.abs(rampEnergies(state, p).total - e0) / e0).toBeLessThan(5e-3);
    }
    expect(state.v).toBe(0);
    expect(state.thermal).toBeGreaterThan(0.9 * e0);
  });
});

describe('energy bars against hand-derived values (SC3)', () => {
  // Released from rest on the frictionless ramp at height h, the block compresses the spring
  // until ½ k x² = m g h, so x = sqrt(2 m g h / k).
  it('maximum spring compression matches ½kx² = mgh', () => {
    const s0 = 4;
    const h = heightAt(s0, base);
    const expected = Math.sqrt((2 * base.m * base.g * h) / base.k);
    const { minS } = runRamp({ s: s0, v: 0, thermal: 0 }, base, 2000);
    expect(Math.abs(-minS - expected) / expected).toBeLessThan(1e-2);
  });
  // Far up the ramp the height is (s - L) sin θ: at s = 4, L = 2, θ = 30°, h ≈ 2 × 0.5 = 1.0 m
  // (the 0.1 m bend changes it by under 0.1%).
  it('track height far from the bend is (s - L) sin θ', () => {
    expect(heightAt(4, base)).toBeCloseTo(1.0, 3);
    expect(heightAt(0, base)).toBeLessThan(1e-9);
  });
  // Static friction: a block at rest on the flat floor stays put.
  it('a block at rest on the floor stays at rest', () => {
    const p: RampParams = { ...base, mu: 0.3 };
    const state: RampState = { s: 1, v: 0, thermal: 0 };
    runRamp(state, p, 500);
    expect(state.s).toBe(1);
    expect(state.v).toBe(0);
  });
});
