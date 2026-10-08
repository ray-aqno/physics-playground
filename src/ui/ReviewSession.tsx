import { useState } from 'preact/hooks';
import { ALL_LESSONS } from '../content/catalog';
import type { Step } from '../content/types';
import { invariant } from '../lib/invariant';
import { localDay } from '../progress/dates';
import { reviewOutcome } from '../progress/leitner';
import { recordActivity, XP_REVIEW } from '../progress/xpStreak';
import { notify, store } from './appStore';
import type { StepState } from './flow';
import { StepView } from './steps/StepView';

type Reviewable = Exclude<Step, { kind: 'explain' | 'predict' }>;

/** Finds a step by its id across all lessons (review items are step ids). */
export function findStep(id: string): Reviewable | null {
  invariant(id.length > 0, 'step id required');
  // bound: lessons (<= 200) x steps (<= 30)
  for (const l of ALL_LESSONS) {
    for (const s of l.steps) if (s.kind !== 'explain' && s.kind !== 'predict' && s.id === id) return s;
  }
  return null;
}

/** Spaced review: each due item once. Right on the first try moves it up a box; otherwise back to box 1. */
export function ReviewSession({ due, onExit }: { readonly due: readonly string[]; readonly onExit: () => void }) {
  invariant(due.length <= 20, 'review sessions hold at most 20 items');
  const items = due.map((id) => findStep(id)).filter((s): s is Reviewable => s !== null);
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<StepState>({ status: 'active', attempts: 0, message: null });
  const step = items[index];
  if (step === undefined) {
    return (
      <section class="card lesson-done">
        <h1>Review done</h1>
        <p>{items.length === 0 ? 'Nothing to review right now.' : `You reviewed ${items.length} item${items.length === 1 ? '' : 's'}.`}</p>
        <button type="button" class="btn btn-big" onClick={onExit}>Back to the path</button>
      </section>
    );
  }
  const finish = (correct: boolean): void => {
    const now = new Date();
    store.update((p) => {
      const entry = p.leitner[step.id];
      const leitner = entry === undefined ? p.leitner : { ...p.leitner, [step.id]: reviewOutcome(entry, correct, localDay(now), now.getTime()) };
      return recordActivity({ ...p, leitner }, XP_REVIEW, localDay(now));
    }, now.getTime());
    notify();
  };
  const h = {
    onSubmit: (correct: boolean, message: string) => {
      const attempts = state.attempts + 1;
      const status = correct ? 'done' : attempts >= 2 ? 'worked' : 'retry';
      setState({ status, attempts, message });
      if (correct || attempts >= 2) finish(correct && attempts === 1);
    },
    onComplete: () => { setState({ ...state, status: 'done' }); },
    onRate: (r: 'got' | 'partly' | 'missed') => { setState({ status: 'done', attempts: 1, message: null }); finish(r === 'got'); },
  };
  const ready = state.status === 'done' || state.status === 'worked';
  return (
    <section class="lesson" aria-label="Review">
      <header class="lesson-top">
        <button type="button" class="link" onClick={onExit}>✕ Exit</button>
        <p class="review-count">Review {index + 1} of {items.length}</p>
      </header>
      <article class="card" key={step.id}><StepView step={step} state={state} h={h} /></article>
      <footer class="lesson-foot">
        <button type="button" class="btn btn-big" disabled={!ready} onClick={() => { setIndex(index + 1); setState({ status: 'active', attempts: 0, message: null }); }}>Continue</button>
      </footer>
    </section>
  );
}
