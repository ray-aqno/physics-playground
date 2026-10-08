import { describe, expect, it } from 'vitest';
import { checkAnswer } from '../../src/checker/compare';
import type { Dims } from '../../src/checker/dims';
import { ALL_LESSONS, REVIEWED, SKILLS_LAB } from '../../src/content/catalog';
import { releasedLessons, staleReviews } from '../../src/content/release';
import { isAnswerStep, type AnswerStep } from '../../src/content/types';
import { validateLessons } from '../../src/content/validate';
import { LAB_DERIVATIONS } from './derivations-lab';
import { UNIT_C_DERIVATIONS } from './derivations-unit-c';

const DERIVATIONS = { ...LAB_DERIVATIONS, ...UNIT_C_DERIVATIONS };
const BASE = ['m', 'kg', 's', 'A', 'K', 'mol', 'cd'];

/** Writes an SI value the way a learner might type it, e.g. "12 m kg s^-1". */
function typed(values: readonly number[], dims: Dims, angle: boolean): string {
  const units = dims.map((p, i) => (p === 0 ? '' : p === 1 ? (BASE[i] ?? '') : `${BASE[i] ?? ''}^${p}`)).filter((s) => s !== '').join(' ');
  const num = values.length === 1 ? String(values[0]) : `<${values.join(', ')}>`;
  return angle ? `${num} rad` : `${num} ${units}`.trim();
}

const answerSteps: AnswerStep[] = ALL_LESSONS.flatMap((l) => l.steps.filter(isAnswerStep));

describe('content is valid', () => {
  it('validateLessons finds no problems', () => {
    expect(validateLessons(ALL_LESSONS)).toEqual([]);
  });
  it('the Skills Lab has 8 lessons', () => {
    expect(SKILLS_LAB.length).toBe(8);
  });
});

describe('every answer key is derived a second way (council condition 2, SC3)', () => {
  it('every answer step has a derivation, and every derivation has a step', () => {
    const ids = answerSteps.map((s) => s.id).sort();
    expect(Object.keys(DERIVATIONS).sort()).toEqual(ids);
  });
  for (const step of answerSteps) {
    it(`${step.id} matches its independent derivation`, () => {
      const derive = DERIVATIONS[step.id];
      expect(derive).toBeDefined();
      if (derive === undefined) return;
      const derived = derive();
      expect(derived.length).toBe(step.answer.value.length);
      derived.forEach((d, i) => {
        const key = step.answer.value[i] ?? NaN;
        expect(Math.abs(d - key)).toBeLessThanOrEqual(1e-4 * Math.max(Math.abs(key), 1));
      });
    });
    it(`${step.id}: the derived value typed in SI is marked correct by the checker`, () => {
      const derive = DERIVATIONS[step.id];
      if (derive === undefined) return;
      const angle = step.kind === 'numeric' && step.angle === true;
      const inUnits = step.kind === 'numeric' ? step.inUnits : undefined;
      const v = checkAnswer(step.answer, typed(derive(), step.answer.dims, angle), { tol: step.tol ?? 0.02, angle, ...(inUnits === undefined ? {} : { inUnits }) });
      expect(v.message).toBe('Correct!');
    });
  }
});

describe('release gate (SC3, SC15, SC19)', () => {
  it('no recorded review is stale', () => {
    expect(staleReviews(ALL_LESSONS, REVIEWED)).toEqual([]);
  });
  it('released lessons are a prefix of the path', () => {
    const released = releasedLessons(ALL_LESSONS, REVIEWED, false);
    expect(ALL_LESSONS.slice(0, released.length)).toEqual(released);
  });
  it('an edited lesson is no longer released', () => {
    const first = ALL_LESSONS[0];
    if (first === undefined) throw new Error('no lessons');
    const review = { [first.id]: 'deadbeef' };
    expect(releasedLessons(ALL_LESSONS, review, false)).toEqual([]);
    expect(staleReviews(ALL_LESSONS, review)).toEqual([first.id]);
  });
});
