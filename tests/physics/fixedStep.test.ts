import { describe, expect, it } from 'vitest';
import { MAX_SUBSTEPS, PHYSICS_DT, planSteps } from '../../src/physics/fixedStep';

describe('fixed-step accumulator', () => {
  it('runs 4 steps for one 60 Hz frame at dt = 1/240', () => {
    const plan = planSteps(0, 1 / 60);
    expect(plan.steps).toBe(4);
    expect(plan.carry).toBeCloseTo(0, 12);
  });
  it('carries leftover time to the next frame', () => {
    const plan = planSteps(0, 1.5 * PHYSICS_DT);
    expect(plan.steps).toBe(1);
    expect(plan.carry).toBeCloseTo(0.5 * PHYSICS_DT, 12);
  });
  it('caps steps after a long pause and drops the extra time', () => {
    const plan = planSteps(0, 5);
    expect(plan.steps).toBe(MAX_SUBSTEPS);
    expect(plan.carry).toBe(0);
  });
  it('rejects negative time', () => {
    expect(() => planSteps(-1, 0)).toThrow('non-negative');
  });
});
