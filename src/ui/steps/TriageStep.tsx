import { useState } from 'preact/hooks';
import type { Step, TriageStage } from '../../content/types';
import { invariant } from '../../lib/invariant';
import type { StepState } from '../flow';
import { Markdown } from '../md';
import { AnswerBox } from './AnswerBox';

type Triage = Extract<Step, { kind: 'triage' }>;

/**
 * TRIAGE problem: Translate, Represent, Identify, Assume and Generate one stage at a time, then
 * the answer, then Evaluate as the closing check. Each stage has a prompt and a study tip.
 */
export function TriageStep({ step, state, onSubmit }: { readonly step: Triage; readonly state: StepState; readonly onSubmit: (correct: boolean, message: string) => void }) {
  invariant(step.stages.length === 6, 'TRIAGE has six stages');
  const [shown, setShown] = useState(1);
  const before = step.stages.slice(0, 5);
  const evaluate = step.stages[5];
  const answered = state.status === 'done' || state.status === 'worked';
  return (
    <div class="triage">
      <p class="tag">TRIAGE problem</p>
      <Markdown text={step.problem} />
      <ol class="triage-stages">
        {before.slice(0, shown).map((s) => <Stage key={s.stage} stage={s} />)}
      </ol>
      {shown < 5 && <button type="button" class="btn btn-ghost" onClick={() => { setShown(shown + 1); }}>Next: {before[shown]?.stage ?? ''}</button>}
      {shown >= 5 && <AnswerBox id={step.id} answer={step.answer} state={state} hint={step.hint} worked={step.worked} onSubmit={onSubmit} options={step.tol === undefined ? {} : { tol: step.tol }} />}
      {answered && evaluate !== undefined && <ol class="triage-stages" start={6}><Stage stage={evaluate} /></ol>}
    </div>
  );
}

function Stage({ stage }: { readonly stage: TriageStage }) {
  invariant(stage.prompt.length > 0, 'stage needs a prompt');
  const [tip, setTip] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const check = stage.check;
  return (
    <li class="triage-stage">
      <p><strong class="triage-name">{stage.stage}</strong> {stage.prompt}</p>
      {check !== undefined && (
        <fieldset class="choices choices-small">
          <legend class="sr-only">Quick check</legend>
          {check.choices.map((c, i) => (
            <label key={i} class={`choice ${pick === i ? (i === check.answer ? 'choice-good' : 'choice-bad') : ''}`}>
              <input type="radio" name={`${stage.stage}-check`} checked={pick === i} onChange={() => { setPick(i); setTip(true); }} /> {c}
            </label>
          ))}
        </fieldset>
      )}
      {tip ? <p class="tip"><strong>Study tip:</strong> {stage.tip}</p> : <button type="button" class="link" onClick={() => { setTip(true); }}>Show study tip</button>}
    </li>
  );
}
