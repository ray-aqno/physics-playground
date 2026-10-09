import { describe, expect, it } from 'vitest';
import { ALL_LESSONS } from '../../src/content/catalog';
import type { Claim, SimSetup, Step } from '../../src/content/types';
import { createWorld } from '../../src/physics/bodies';
import { stepEventDriven } from '../../src/physics/collisions';
import { heightAt, stepRamp } from '../../src/physics/energyRamp';
import { PHYSICS_DT } from '../../src/physics/fixedStep';
import { centerOfMass, kineticEnergy } from '../../src/physics/invariants';

type Outcome = (claim: Claim) => boolean;

/** Runs a collisions / center-of-mass setup headless and returns a claim evaluator. */
function runBodies(setup: Extract<SimSetup, { sim: 'collisions' | 'com' }>): Outcome {
  const w = createWorld(setup.world);
  const k0 = kineticEnergy(w.bodies);
  const c0 = centerOfMass(w.bodies);
  const steps = Math.round(setup.seconds / PHYSICS_DT);
  for (let i = 0; i < steps; i++) expect(stepEventDriven(w, PHYSICS_DT).capped).toBe(false);
  const k1 = kineticEnergy(w.bodies);
  const c1 = centerOfMass(w.bodies);
  return (claim) => {
    switch (claim.kind) {
      case 'velocity-sign': {
        const v = w.bodies[claim.body]?.vx ?? NaN;
        const sign = Math.abs(v) < 1e-6 ? 0 : Math.sign(v);
        return sign === claim.sign;
      }
      case 'ke-change': {
        const rel = (k1 - k0) / k0;
        return claim.change === (Math.abs(rel) < 1e-6 ? 'same' : rel < 0 ? 'less' : 'more');
      }
      case 'com-velocity': {
        const dv = Math.hypot(c1.vx - c0.vx, c1.vy - c0.vy);
        return claim.change === (dv < 1e-9 ? 'same' : 'different');
      }
      case 'max-height': return false;
    }
  };
}

/**
 * Runs the energy track headless. "Max height" is measured after the block has been in the spring
 * (or from the start, if it starts there), and compared with the starting height to within 1%.
 */
function runRamp(setup: Extract<SimSetup, { sim: 'energy' }>): Outcome {
  const state = { s: setup.startS, v: 0, thermal: 0 };
  const h0 = heightAt(setup.startS, setup.ramp);
  let tracking = setup.startS < 0;
  let maxH = -Infinity;
  const steps = Math.round(setup.seconds / PHYSICS_DT);
  for (let i = 0; i < steps; i++) {
    stepRamp(state, setup.ramp, PHYSICS_DT);
    if (state.s < 0) tracking = true;
    if (tracking) maxH = Math.max(maxH, heightAt(state.s, setup.ramp));
  }
  const tol = 0.01 * Math.max(h0, 0.05);
  const relation = Math.abs(maxH - h0) <= tol ? 'same' : maxH < h0 ? 'lower' : 'higher';
  return (claim) => claim.kind === 'max-height' && claim.relation === relation;
}

const predictSteps = ALL_LESSONS.flatMap((l) => l.steps.filter((s): s is Extract<Step, { kind: 'predict' }> => s.kind === 'predict'));

describe('predict steps agree with a headless sim run (Stage 6)', () => {
  it('there are predict steps to check', () => {
    expect(predictSteps.length).toBeGreaterThanOrEqual(5);
  });
  for (const step of predictSteps) {
    it(`${step.id}: only the correct choice's claim holds`, () => {
      const holds = step.setup.sim === 'energy' ? runRamp(step.setup) : runBodies(step.setup);
      step.choices.forEach((choice, i) => {
        expect({ choice: choice.text, holds: holds(choice.claim) }).toEqual({ choice: choice.text, holds: i === step.answer });
      });
    });
  }
});

describe('Unit C coverage (Stage 6)', () => {
  const unitC = ALL_LESSONS.filter((l) => l.unit === 'C');
  it('every chapter C1-C14 has a lesson', () => {
    const chapters = new Set(unitC.map((l) => l.chapter));
    for (let c = 1; c <= 14; c++) expect(chapters.has(`C${c}`)).toBe(true);
  });
  it('every Unit C chapter has a TRIAGE problem', () => {
    for (const lesson of unitC) expect(lesson.steps.some((s) => s.kind === 'triage')).toBe(true);
  });
});
