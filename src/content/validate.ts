import { invariant } from '../lib/invariant';
import { dimsEqual } from '../checker/dims';
import { parseUnits } from '../checker/parseQuantity';
import { fnv1a } from '../progress/exportImport';
import { TRIAGE_ORDER, type Lesson, type Step } from './types';

export const MAX_LESSONS = 200;
export const MAX_STEPS = 30;
const ID_RE = /^[a-z0-9][a-z0-9.-]{0,63}$/;
const CHAPTER_RE = /^(LAB|C([1-9]|1[0-4]))$/;

function checkStep(step: Step, lesson: Lesson, errors: string[]): void {
  invariant(lesson.id.length > 0, 'lesson needs an id');
  const where = lesson.id;
  if (step.kind === 'explain') { if (step.md.trim() === '') errors.push(`${where}: empty explain step`); return; }
  if (!ID_RE.test(step.id) || !step.id.startsWith(`${lesson.id}.`)) errors.push(`${where}: step id "${step.id}" must start with "${lesson.id}."`);
  if (step.kind === 'mcq' && (step.choices.length < 2 || step.answer < 0 || step.answer >= step.choices.length || step.hint === '')) errors.push(`${step.id}: bad multiple choice`);
  if (step.kind === 'predict' && (step.choices.length < 2 || step.answer < 0 || step.answer >= step.choices.length || step.reveal === '')) errors.push(`${step.id}: bad predict step`);
  if ((step.kind === 'numeric' || step.kind === 'triage') && (step.hint.trim() === '' || step.worked.trim() === '')) errors.push(`${step.id}: needs a hint and a worked solution`);
  if (step.kind === 'numeric' && step.inUnits !== undefined) {
    const u = parseUnits(step.inUnits);
    if (!u.ok || !dimsEqual(u.value.dims, step.answer.dims)) errors.push(`${step.id}: inUnits "${step.inUnits}" must be units of the answer's dimension`);
  }
  if (step.kind === 'triage') {
    const names = step.stages.map((s) => s.stage);
    if (names.join() !== TRIAGE_ORDER.join()) errors.push(`${step.id}: TRIAGE needs all 6 stages in order`);
    if (step.stages.some((s) => s.check !== undefined && (s.check.answer < 0 || s.check.answer >= s.check.choices.length))) errors.push(`${step.id}: bad stage check`);
  }
  if (step.kind === 'selfExplain' && (step.prompt.trim() === '' || step.model.trim() === '')) errors.push(`${step.id}: needs a prompt and a model explanation`);
  invariant(errors.length <= 10_000, 'too many errors');
}

/** Checks every lesson; returns a list of problems (empty when valid). Run by the content tests. */
export function validateLessons(lessons: readonly Lesson[]): string[] {
  invariant(lessons.length <= MAX_LESSONS, 'too many lessons');
  const errors: string[] = [];
  const lessonIds = new Set<string>();
  const stepIds = new Set<string>();
  // bound: lessons.length <= MAX_LESSONS (200)
  for (const lesson of lessons) {
    if (!ID_RE.test(lesson.id) || lessonIds.has(lesson.id)) errors.push(`lesson id "${lesson.id}" is invalid or repeated`);
    lessonIds.add(lesson.id);
    if (!CHAPTER_RE.test(lesson.chapter) || (lesson.unit === 'lab') !== (lesson.chapter === 'LAB')) errors.push(`${lesson.id}: bad chapter ${lesson.chapter}`);
    if (lesson.minutes < 3 || lesson.minutes > 7) errors.push(`${lesson.id}: lessons are 3-7 minutes`);
    if (lesson.steps.length < 1 || lesson.steps.length > MAX_STEPS) errors.push(`${lesson.id}: needs 1-${MAX_STEPS} steps`);
    // bound: steps.length <= MAX_STEPS (30), checked above
    for (const step of lesson.steps.slice(0, MAX_STEPS)) {
      checkStep(step, lesson, errors);
      if (step.kind !== 'explain') { if (stepIds.has(step.id)) errors.push(`step id ${step.id} repeated`); stepIds.add(step.id); }
    }
  }
  // bound: lessons.length <= MAX_LESSONS (200)
  for (const lesson of lessons) {
    for (const need of lesson.needs) if (!need.startsWith('lab.') || !lessonIds.has(need)) errors.push(`${lesson.id}: needs unknown Skills Lab lesson ${need}`);
  }
  invariant(errors.every((e) => e.length > 0), 'errors are described');
  return errors;
}

/** Content hash of a lesson; a change to any text or key changes it and invalidates review (SC15). */
export function lessonHash(lesson: Lesson): string {
  invariant(lesson.steps.length <= MAX_STEPS, 'too many steps to hash');
  const h = fnv1a(JSON.stringify(lesson));
  invariant(h.length === 8, 'hash is 8 hex digits');
  return h;
}
