import { useState } from 'preact/hooks';
import { checkAnswer, type CheckOptions } from '../../checker/compare';
import type { Quantity } from '../../checker/dims';
import { invariant } from '../../lib/invariant';
import type { StepState } from '../flow';
import { Markdown } from '../md';

interface Props {
  readonly id: string;
  readonly answer: Quantity;
  readonly options: CheckOptions;
  readonly state: StepState;
  readonly hint: string;
  readonly worked: string;
  readonly onSubmit: (correct: boolean, message: string) => void;
}

/** Typed answer with units. Retry with a hint after a miss; worked solution after two (condition 4). */
export function AnswerBox({ id, answer, options, state, hint, worked, onSubmit }: Props) {
  invariant(id.length > 0, 'answer box needs an id');
  invariant(answer.value.length >= 1, 'answer key has a value');
  const [text, setText] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const open = state.status === 'active' || state.status === 'retry';
  const submit = (e: Event): void => {
    e.preventDefault();
    const v = checkAnswer(answer, text, options);
    setNote(v.sigFigNote);
    onSubmit(v.correct, v.message);
  };
  const placeholder = answer.value.length > 1 ? 'e.g. <3, -4> m/s' : 'e.g. 12 kg*m/s';
  return (
    <form class="answer" onSubmit={submit}>
      <label for={`${id}-input`} class="sr-only">Your answer</label>
      <div class="answer-row">
        <input id={`${id}-input`} class="answer-input" value={text} disabled={!open} placeholder={placeholder}
          autocomplete="off" spellcheck={false} inputMode="text" onInput={(e) => { setText(e.currentTarget.value); }} />
        <button type="submit" class="btn" disabled={!open || text.trim() === ''}>Check</button>
      </div>
      <Feedback state={state} note={note} hint={hint} worked={worked} />
    </form>
  );
}

function Feedback({ state, note, hint, worked }: { readonly state: StepState; readonly note: string | null; readonly hint: string; readonly worked: string }) {
  invariant(state.attempts >= 0, 'attempts are non-negative');
  if (state.message === null) return null;
  const tone = state.status === 'done' ? 'good' : state.status === 'worked' ? 'info' : 'bad';
  return (
    <div class={`feedback feedback-${tone}`} role="status">
      <p class="feedback-msg">{state.message}</p>
      {note !== null && state.status === 'done' && <p class="feedback-note">{note}</p>}
      {state.status === 'retry' && <p class="feedback-hint"><strong>Hint:</strong> {hint}</p>}
      {state.status === 'worked' && <div class="worked"><strong>Worked solution</strong><Markdown text={worked} /></div>}
    </div>
  );
}
