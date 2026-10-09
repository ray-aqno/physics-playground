import { useEffect, useState } from 'preact/hooks';
import type { Lesson } from '../content/types';
import { invariant } from '../lib/invariant';
import { localDay } from '../progress/dates';
import { notify, store } from './appStore';
import { advance, applyLessonResult, canAdvance, completeStep, isFinished, lessonResult, rateSelfExplain, startFlow, submitAnswer, type LessonFlow } from './flow';
import { StepView } from './steps/StepView';

/** Plays one lesson step by step, with a progress bar, then saves the result. */
export function LessonPlayer({ lesson, onExit }: { readonly lesson: Lesson; readonly onExit: () => void }) {
  invariant(lesson.steps.length >= 1, 'lesson has steps');
  const [flow, setFlow] = useState<LessonFlow>(() => startFlow(lesson));
  const [saved, setSaved] = useState(false);
  if (isFinished(flow)) return <LessonDone lesson={lesson} flow={flow} saved={saved} setSaved={setSaved} onExit={onExit} />;
  const step = lesson.steps[flow.index];
  const state = flow.steps[flow.index];
  invariant(step !== undefined && state !== undefined, 'current step exists');
  const id = step.kind === 'explain' ? '' : step.id;
  const h = {
    onSubmit: (correct: boolean, message: string) => { setFlow(submitAnswer(flow, id, correct, message)); },
    onComplete: () => { setFlow(completeStep(flow)); },
    onRate: (r: 'got' | 'partly' | 'missed') => { setFlow(rateSelfExplain(flow, id, r)); },
  };
  const ready = step.kind === 'explain' || canAdvance(flow);
  const pct = Math.round((flow.index / lesson.steps.length) * 100);
  return (
    <section class="lesson" aria-label={lesson.title}>
      <header class="lesson-top">
        <button type="button" class="link" onClick={onExit}>✕ Exit</button>
        <div class="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Lesson progress">
          <span style={{ width: `${pct}%` }} />
        </div>
      </header>
      <h1 class="lesson-title"><span class="chip">{lesson.chapter}</span> {lesson.title}</h1>
      <article class="card" key={flow.index}>
        <StepView step={step} state={state} h={h} />
      </article>
      <footer class="lesson-foot">
        <button type="button" class="btn btn-big" disabled={!ready}
          onClick={() => { setFlow(advance(step.kind === 'explain' && state.status !== 'done' ? completeStep(flow) : flow)); }}>
          {flow.index === lesson.steps.length - 1 ? 'Finish' : 'Continue'}
        </button>
      </footer>
    </section>
  );
}

function LessonDone({ lesson, flow, saved, setSaved, onExit }: { readonly lesson: Lesson; readonly flow: LessonFlow; readonly saved: boolean; readonly setSaved: (b: boolean) => void; readonly onExit: () => void }) {
  const r = lessonResult(flow, lesson);
  invariant(r.score >= 0 && r.score <= 1, 'score in [0, 1]');
  useEffect(() => {
    if (saved) return;
    const now = new Date();
    store.update((p) => applyLessonResult(p, lesson, flow, localDay(now), now.getTime()), now.getTime());
    setSaved(true);
    notify();
  }, [saved, setSaved, lesson, flow]);
  return (
    <section class="lesson-done card" aria-live="polite">
      <h1>{r.perfect ? 'Perfect lesson!' : 'Lesson complete'}</h1>
      <p class="big-number">+{r.xp} XP</p>
      <p>{Math.round(r.score * 100)}% right on the first try.</p>
      {flow.missed.length > 0 && <p>{flow.missed.length} item{flow.missed.length === 1 ? '' : 's'} added to your review deck. They come back tomorrow.</p>}
      <p class="feynman">“What I cannot create, I do not understand.” Try explaining today's idea to someone else.</p>
      <button type="button" class="btn btn-big" onClick={onExit}>Back to the path</button>
    </section>
  );
}
