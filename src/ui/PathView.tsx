import { ALL_LESSONS } from '../content/catalog';
import type { Lesson } from '../content/types';
import { invariant } from '../lib/invariant';
import type { ProgressV1 } from '../progress/schema';

interface Props {
  readonly released: readonly Lesson[];
  readonly progress: ProgressV1;
  readonly dueCount: number;
  readonly go: (route: string) => void;
}

/**
 * The learning path: Skills Lab, then Unit C. A lesson unlocks when the one before it is done.
 * Only released (key-reviewed) lessons appear, so the path never dead-ends (SC12, SC19).
 */
export function PathView({ released, progress, dueCount, go }: Props) {
  invariant(released.length <= ALL_LESSONS.length, 'released is a subset');
  const pending = ALL_LESSONS.length - released.length;
  const sections: [string, string, readonly Lesson[]][] = [
    ['lab', 'Skills Lab', released.filter((l) => l.unit === 'lab')],
    ['C', 'Unit C · Conservation laws', released.filter((l) => l.unit === 'C')],
  ];
  return (
    <section class="path" aria-label="Learning path">
      <div class="review-card card">
        <div>
          <h2>Daily review</h2>
          <p>{dueCount === 0 ? 'Nothing due. Nice work!' : `${dueCount} item${dueCount === 1 ? '' : 's'} due today.`}</p>
        </div>
        <button type="button" class="btn" disabled={dueCount === 0} onClick={() => { go('#/review'); }}>Start review</button>
      </div>
      {sections.map(([key, title, lessons]) => lessons.length > 0 && (
        <div key={key} class="path-section">
          <h2>{title}</h2>
          <ol class="path-list">
            {lessons.map((l) => <PathNode key={l.id} lesson={l} progress={progress} released={released} go={go} />)}
          </ol>
        </div>
      ))}
      {pending > 0 && (
        <p class="pending card">{released.length === 0 ? 'Lessons are on their way.' : 'More lessons are coming.'} {pending} lesson{pending === 1 ? ' is' : 's are'} waiting for an answer-key check before release. In the meantime, try the <a href="#/playground">Playground</a>.</p>
      )}
    </section>
  );
}

function PathNode({ lesson, progress, released, go }: { readonly lesson: Lesson; readonly progress: ProgressV1; readonly released: readonly Lesson[]; readonly go: (r: string) => void }) {
  const i = released.indexOf(lesson);
  invariant(i >= 0, 'lesson is released');
  const prev = released[i - 1];
  const record = progress.lessons[lesson.id];
  const unlocked = prev === undefined || progress.lessons[prev.id]?.done === true;
  const stars = record === undefined ? 0 : record.bestScore === 1 ? 3 : record.bestScore >= 0.6 ? 2 : 1;
  const state = record?.done === true ? 'done' : unlocked ? 'open' : 'locked';
  return (
    <li class={`node node-${state}`}>
      <button type="button" class="node-btn" disabled={!unlocked} onClick={() => { go(`#/lesson/${lesson.id}`); }}
        aria-label={`${lesson.chapter} ${lesson.title}. ${state === 'done' ? `Done, ${stars} of 3 stars.` : state === 'open' ? 'Ready.' : 'Locked: finish the lesson before it.'}`}>
        <span class="node-dot" aria-hidden="true">{state === 'done' ? '★' : state === 'locked' ? '🔒' : '▶'}</span>
        <span class="node-text">
          <span class="node-chapter">{lesson.chapter === 'LAB' ? 'Skills Lab' : lesson.chapter} · {lesson.minutes} min</span>
          <span class="node-title">{lesson.title}</span>
          {state === 'done' && <span class="node-stars" aria-hidden="true">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</span>}
        </span>
      </button>
    </li>
  );
}
