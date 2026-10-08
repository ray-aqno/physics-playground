import { invariant } from '../lib/invariant';
import type { Lesson, Step } from '../content/types';
import { enterReview } from '../progress/leitner';
import type { ProgressV1 } from '../progress/schema';
import { recordActivity, XP_PERFECT_BONUS, XP_STEP } from '../progress/xpStreak';

/**
 * Lesson flow (council condition 4): a wrong answer gives a retry with a hint; after two misses
 * the worked solution is shown and the learner moves on. Nothing ever locks them out.
 */
export const MISSES_BEFORE_WORKED = 2;

export type StepStatus = 'active' | 'retry' | 'worked' | 'done';

export interface StepState {
  readonly status: StepStatus;
  readonly attempts: number;
  readonly message: string | null;
}

export interface LessonFlow {
  readonly lessonId: string;
  readonly index: number;
  readonly steps: readonly StepState[];
  /** Step ids answered wrong at least once (or rated Partly / Missed it): they go to review. */
  readonly missed: readonly string[];
}

const GRADED = new Set<Step['kind']>(['numeric', 'mcq', 'triage']);

export function startFlow(lesson: Lesson): LessonFlow {
  invariant(lesson.steps.length >= 1, 'a lesson needs steps');
  const flow: LessonFlow = { lessonId: lesson.id, index: 0, steps: lesson.steps.map(() => ({ status: 'active', attempts: 0, message: null })), missed: [] };
  invariant(flow.steps.length === lesson.steps.length, 'one state per step');
  return flow;
}

function withStep(flow: LessonFlow, state: StepState, missedId: string | null): LessonFlow {
  invariant(flow.index >= 0 && flow.index < flow.steps.length, 'current step index in range');
  const steps = flow.steps.map((s, i) => (i === flow.index ? state : s));
  const missed = missedId !== null && !flow.missed.includes(missedId) ? [...flow.missed, missedId] : flow.missed;
  invariant(missed.length <= flow.steps.length, 'cannot miss more steps than exist');
  return { ...flow, steps, missed };
}

/** Records a graded answer for the current step. */
export function submitAnswer(flow: LessonFlow, stepId: string, correct: boolean, message: string): LessonFlow {
  const cur = flow.steps[flow.index];
  invariant(cur !== undefined, 'current step exists');
  invariant(cur.status === 'active' || cur.status === 'retry', 'can only answer an open step');
  if (correct) return withStep(flow, { status: 'done', attempts: cur.attempts + 1, message }, cur.attempts > 0 ? stepId : null);
  const attempts = cur.attempts + 1;
  const status: StepStatus = attempts >= MISSES_BEFORE_WORKED ? 'worked' : 'retry';
  return withStep(flow, { status, attempts, message }, stepId);
}

/** Marks a non-graded step (explain, predict reveal) complete. */
export function completeStep(flow: LessonFlow): LessonFlow {
  const cur = flow.steps[flow.index];
  invariant(cur !== undefined, 'current step exists');
  invariant(cur.status !== 'worked', 'worked steps are already complete');
  return withStep(flow, { ...cur, status: 'done' }, null);
}

/** Self-explanation rating: "partly" and "missed" send the prompt to review. */
export function rateSelfExplain(flow: LessonFlow, stepId: string, rating: 'got' | 'partly' | 'missed'): LessonFlow {
  invariant(stepId.length > 0, 'step id required');
  invariant(flow.steps[flow.index] !== undefined, 'current step exists');
  return withStep(flow, { status: 'done', attempts: 1, message: null }, rating === 'got' ? null : stepId);
}

export function canAdvance(flow: LessonFlow): boolean {
  const cur = flow.steps[flow.index];
  invariant(cur !== undefined, 'current step exists');
  return cur.status === 'done' || cur.status === 'worked';
}

export function advance(flow: LessonFlow): LessonFlow {
  invariant(canAdvance(flow), 'finish the current step first');
  invariant(flow.index < flow.steps.length, 'already past the end');
  return { ...flow, index: flow.index + 1 };
}

export function isFinished(flow: LessonFlow): boolean {
  invariant(flow.index >= 0, 'index is non-negative');
  return flow.index >= flow.steps.length;
}

export interface LessonResult {
  /** Fraction of graded steps right on the first try (1 when there are none). */
  readonly score: number;
  readonly perfect: boolean;
  readonly xp: number;
}

export function lessonResult(flow: LessonFlow, lesson: Lesson): LessonResult {
  invariant(flow.lessonId === lesson.id, 'flow belongs to this lesson');
  invariant(isFinished(flow), 'lesson not finished');
  const graded = lesson.steps.map((s, i) => ({ s, st: flow.steps[i] })).filter(({ s }) => GRADED.has(s.kind));
  const firstTry = graded.filter(({ st }) => st?.status === 'done' && st.attempts === 1).length;
  const score = graded.length === 0 ? 1 : firstTry / graded.length;
  const interactive = lesson.steps.filter((s) => s.kind !== 'explain').length;
  const perfect = score === 1;
  return { score, perfect, xp: interactive * XP_STEP + (perfect ? XP_PERFECT_BONUS : 0) };
}

/** Folds a finished lesson into progress: completion, best score, XP, streak, review items. */
export function applyLessonResult(p: ProgressV1, lesson: Lesson, flow: LessonFlow, today: string, nowMs: number): ProgressV1 {
  const r = lessonResult(flow, lesson);
  const prev = p.lessons[lesson.id];
  const lessons = { ...p.lessons, [lesson.id]: { done: true, bestScore: Math.max(prev?.bestScore ?? 0, r.score), completedAt: prev?.completedAt ?? today } };
  const leitner = { ...p.leitner };
  // bound: missed.length <= steps (30)
  for (const id of flow.missed) leitner[id] = enterReview(today, nowMs);
  const next = recordActivity({ ...p, lessons, leitner }, r.xp, today);
  invariant(next.xp >= p.xp, 'finishing a lesson never loses XP');
  return next;
}
