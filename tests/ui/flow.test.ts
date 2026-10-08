import { describe, expect, it } from 'vitest';
import type { Lesson } from '../../src/content/types';
import { q, D } from '../../src/content/units';
import { freshProgress } from '../../src/progress/schema';
import { advance, applyLessonResult, canAdvance, completeStep, isFinished, lessonResult, rateSelfExplain, startFlow, submitAnswer } from '../../src/ui/flow';

const lesson: Lesson = {
  id: 't1', unit: 'lab', chapter: 'LAB', title: 'Test', minutes: 3, needs: [],
  steps: [
    { kind: 'explain', md: 'Hi' },
    { kind: 'numeric', id: 't1.q1', prompt: 'p', answer: q(1, D.length), hint: 'h', worked: 'w' },
    { kind: 'mcq', id: 't1.q2', prompt: 'p', choices: ['a', 'b'], answer: 0, hint: 'h', explain: 'e' },
    { kind: 'selfExplain', id: 't1.q3', prompt: 'p', model: 'm' },
  ],
};

function runPerfect() {
  let f = startFlow(lesson);
  f = advance(completeStep(f));
  f = advance(submitAnswer(f, 't1.q1', true, 'Correct!'));
  f = advance(submitAnswer(f, 't1.q2', true, 'Correct!'));
  f = advance(rateSelfExplain(f, 't1.q3', 'got'));
  return f;
}

describe('lesson flow (council condition 4)', () => {
  it('a wrong answer gives a retry with the step still open', () => {
    let f = advance(completeStep(startFlow(lesson)));
    f = submitAnswer(f, 't1.q1', false, 'Not quite.');
    expect(f.steps[1]?.status).toBe('retry');
    expect(canAdvance(f)).toBe(false);
  });
  it('after 2 misses the worked solution shows and the learner can move on (no lockout)', () => {
    let f = advance(completeStep(startFlow(lesson)));
    f = submitAnswer(f, 't1.q1', false, 'x');
    f = submitAnswer(f, 't1.q1', false, 'x');
    expect(f.steps[1]?.status).toBe('worked');
    expect(canAdvance(f)).toBe(true);
    expect(f.missed).toEqual(['t1.q1']);
  });
  it('right on the second try still counts as missed for review, but not first-try', () => {
    let f = advance(completeStep(startFlow(lesson)));
    f = submitAnswer(f, 't1.q1', false, 'x');
    f = submitAnswer(f, 't1.q1', true, 'Correct!');
    expect(f.steps[1]?.status).toBe('done');
    expect(f.missed).toEqual(['t1.q1']);
  });
  it('a perfect lesson scores 1 and earns the bonus: 3 interactive steps x 10 + 20', () => {
    const f = runPerfect();
    expect(isFinished(f)).toBe(true);
    expect(lessonResult(f, lesson)).toEqual({ score: 1, perfect: true, xp: 50 });
  });
  it('self-explanation rated "partly" goes to review', () => {
    let f = startFlow(lesson);
    f = advance(completeStep(f));
    f = advance(submitAnswer(f, 't1.q1', true, 'ok'));
    f = advance(submitAnswer(f, 't1.q2', true, 'ok'));
    f = rateSelfExplain(f, 't1.q3', 'partly');
    expect(f.missed).toEqual(['t1.q3']);
  });
  it('cannot advance past an unanswered step', () => {
    const f = advance(completeStep(startFlow(lesson)));
    expect(() => advance(f)).toThrow('finish the current step first');
  });
  it('applying a result marks the lesson done, adds XP and review items', () => {
    let f = startFlow(lesson);
    f = advance(completeStep(f));
    f = submitAnswer(f, 't1.q1', false, 'x');
    f = advance(submitAnswer(f, 't1.q1', false, 'x'));
    f = advance(submitAnswer(f, 't1.q2', true, 'ok'));
    f = advance(rateSelfExplain(f, 't1.q3', 'got'));
    const p = applyLessonResult(freshProgress(), lesson, f, '2026-10-08', 1000);
    expect(p.lessons.t1).toEqual({ done: true, bestScore: 0.5, completedAt: '2026-10-08' });
    expect(p.xp).toBe(30);
    expect(p.leitner['t1.q1']?.box).toBe(1);
    expect(p.streak.count).toBe(1);
  });
  it('replaying keeps the best score and first completion date', () => {
    const p1 = applyLessonResult(freshProgress(), lesson, runPerfect(), '2026-10-08', 1000);
    let f = startFlow(lesson);
    f = advance(completeStep(f));
    f = submitAnswer(f, 't1.q1', false, 'x');
    f = advance(submitAnswer(f, 't1.q1', false, 'x'));
    f = submitAnswer(f, 't1.q2', false, 'x');
    f = advance(submitAnswer(f, 't1.q2', false, 'x'));
    f = advance(rateSelfExplain(f, 't1.q3', 'got'));
    const p2 = applyLessonResult(p1, lesson, f, '2026-10-09', 2000);
    expect(p2.lessons.t1).toEqual({ done: true, bestScore: 1, completedAt: '2026-10-08' });
  });
});
