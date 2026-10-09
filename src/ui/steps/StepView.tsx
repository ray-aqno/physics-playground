import { useState } from 'preact/hooks';
import type { Step } from '../../content/types';
import { invariant } from '../../lib/invariant';
import { BodiesSimView } from '../../sims/BodiesSimView';
import { RampSimView } from '../../sims/RampSimView';
import type { StepState } from '../flow';
import { Markdown } from '../md';
import { AnswerBox } from './AnswerBox';
import { TriageStep } from './TriageStep';

export interface StepHandlers {
  readonly onSubmit: (correct: boolean, message: string) => void;
  readonly onComplete: () => void;
  readonly onRate: (rating: 'got' | 'partly' | 'missed') => void;
}

/** Renders one lesson step of any kind. */
export function StepView({ step, state, h }: { readonly step: Step; readonly state: StepState; readonly h: StepHandlers }) {
  invariant(state.attempts >= 0, 'attempts are non-negative');
  switch (step.kind) {
    case 'explain': return <Markdown text={step.md} />;
    case 'numeric': return (
      <div>
        <Markdown text={step.prompt} />
        <AnswerBox id={step.id} answer={step.answer} state={state} hint={step.hint} worked={step.worked} onSubmit={h.onSubmit}
          options={{ ...(step.tol === undefined ? {} : { tol: step.tol }), ...(step.sigFigs === undefined ? {} : { sigFigs: step.sigFigs }), ...(step.angle === undefined ? {} : { angle: step.angle }), ...(step.inUnits === undefined ? {} : { inUnits: step.inUnits }) }} />
      </div>
    );
    case 'mcq': return <McqStep step={step} state={state} onSubmit={h.onSubmit} />;
    case 'predict': return <PredictStep step={step} onComplete={h.onComplete} done={state.status === 'done'} />;
    case 'triage': return <TriageStep step={step} state={state} onSubmit={h.onSubmit} />;
    case 'selfExplain': return <SelfExplainStep step={step} onRate={h.onRate} done={state.status === 'done'} />;
  }
}

function McqStep({ step, state, onSubmit }: { readonly step: Extract<Step, { kind: 'mcq' }>; readonly state: StepState; readonly onSubmit: StepHandlers['onSubmit'] }) {
  invariant(step.choices.length >= 2, 'multiple choice needs choices');
  const [pick, setPick] = useState<number | null>(null);
  const open = state.status === 'active' || state.status === 'retry';
  const submit = (e: Event): void => {
    e.preventDefault();
    if (pick === null) return;
    onSubmit(pick === step.answer, pick === step.answer ? 'Correct!' : 'Not quite.');
  };
  return (
    <form onSubmit={submit}>
      <fieldset class="choices" disabled={!open}>
        <legend><Markdown text={step.prompt} /></legend>
        {step.choices.map((c, i) => (
          <label key={i} class={`choice ${pick === i ? 'choice-picked' : ''}`}>
            <input type="radio" name={step.id} checked={pick === i} onChange={() => { setPick(i); }} /> {c}
          </label>
        ))}
      </fieldset>
      {open && <button type="submit" class="btn" disabled={pick === null}>Check</button>}
      {state.message !== null && (
        <div class={`feedback feedback-${state.status === 'done' ? 'good' : state.status === 'worked' ? 'info' : 'bad'}`} role="status">
          <p class="feedback-msg">{state.message}</p>
          {state.status === 'retry' && <p class="feedback-hint"><strong>Hint:</strong> {step.hint}</p>}
          {(state.status === 'done' || state.status === 'worked') && <p>{state.status === 'worked' ? `Answer: ${step.choices[step.answer] ?? ''}. ` : ''}{step.explain}</p>}
        </div>
      )}
    </form>
  );
}

function PredictStep({ step, onComplete, done }: { readonly step: Extract<Step, { kind: 'predict' }>; readonly onComplete: () => void; readonly done: boolean }) {
  invariant(step.choices.length >= 2, 'predict needs choices');
  const [pick, setPick] = useState<number | null>(null);
  const s = step.setup;
  const sim = s.sim === 'energy'
    ? <RampSimView params={s.ramp} startS={s.startS} label={`${step.id} sim`} locked={!done} />
    : <BodiesSimView preset={s.world} showCom={s.sim === 'com'} label={`${step.id} sim`} locked={!done} />;
  return (
    <div>
      <p class="tag">Predict first, then watch</p>
      <Markdown text={step.prompt} />
      <fieldset class="choices" disabled={done}>
        <legend class="sr-only">Your prediction</legend>
        {step.choices.map((c, i) => (
          <label key={i} class={`choice ${pick === i ? 'choice-picked' : ''}`}>
            <input type="radio" name={step.id} checked={pick === i} onChange={() => { setPick(i); }} /> {c.text}
          </label>
        ))}
      </fieldset>
      {!done && <button type="button" class="btn" disabled={pick === null} onClick={onComplete}>Lock in my prediction</button>}
      {sim}
      {done && <div class="feedback feedback-info" role="status"><p>{pick === step.answer ? 'Your prediction was right. ' : 'Not what you predicted? That gap is exactly what to learn from. '}Press Play and watch.</p><p>{step.reveal}</p></div>}
    </div>
  );
}

function SelfExplainStep({ step, onRate, done }: { readonly step: Extract<Step, { kind: 'selfExplain' }>; readonly onRate: StepHandlers['onRate']; readonly done: boolean }) {
  invariant(step.model.length > 0, 'self-explanation needs a model answer');
  const [text, setText] = useState('');
  const [shown, setShown] = useState(false);
  return (
    <div>
      <p class="tag">Explain it simply</p>
      <Markdown text={step.prompt} />
      <label for={`${step.id}-text`} class="sr-only">Your explanation</label>
      <textarea id={`${step.id}-text`} class="explain-input" rows={4} value={text} disabled={shown} placeholder="Explain it as if to a friend who missed the class."
        onInput={(e) => { setText(e.currentTarget.value); }} />
      {!shown && <button type="button" class="btn" disabled={text.trim().length < 10} onClick={() => { setShown(true); }}>Compare with a model answer</button>}
      {shown && (
        <div class="feedback feedback-info">
          <p><strong>Model answer:</strong> {step.model}</p>
          {!done && <div class="rate" role="group" aria-label="How close was your explanation?">
            <button type="button" class="btn" onClick={() => { onRate('got'); }}>Got it</button>
            <button type="button" class="btn btn-ghost" onClick={() => { onRate('partly'); }}>Partly</button>
            <button type="button" class="btn btn-ghost" onClick={() => { onRate('missed'); }}>Missed it</button>
          </div>}
          {done && <p>Saved. Anything you rated Partly or Missed comes back in review.</p>}
        </div>
      )}
    </div>
  );
}
