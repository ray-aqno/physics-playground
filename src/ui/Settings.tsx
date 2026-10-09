import { useState } from 'preact/hooks';
import { invariant } from '../lib/invariant';
import { importErrorMessage } from '../progress/exportImport';
import type { ProgressV1 } from '../progress/schema';
import { summarize, type ProgressSummary, type ProgressStore } from '../progress/store';
import { notify } from './appStore';
import { download } from './Banners';

/** Export, import (with side-by-side confirm and undo), and reset (council condition 3, SC1). */
export function Settings({ store }: { readonly store: ProgressStore }) {
  invariant(store.progress.xp >= 0, 'XP is non-negative');
  return (
    <section class="settings" aria-label="Settings">
      <h1>Your progress</h1>
      <ExportPanel store={store} />
      <ImportPanel store={store} />
      <ResetPanel store={store} />
    </section>
  );
}

function ExportPanel({ store }: { readonly store: ProgressStore }) {
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  invariant(code === null || code.startsWith('PP1.'), 'progress codes start with PP1.');
  const make = (): void => { setCode(store.exportNow(new Date())); setCopied(false); notify(); };
  const copy = (): void => {
    if (code === null) return;
    navigator.clipboard.writeText(code).then(() => { setCopied(true); }, () => { setCopied(false); });
  };
  return (
    <div class="card">
      <h2>Back up (export)</h2>
      <p>Progress is saved only in this browser. A progress code lets you restore it here or move it to another device.</p>
      <button type="button" class="btn" onClick={make}>Make a progress code</button>
      {code !== null && (
        <div class="code-box">
          <label for="export-code">Your progress code</label>
          <textarea id="export-code" readOnly rows={4} value={code} onFocus={(e) => { e.currentTarget.select(); }} />
          <div class="banner-actions">
            <button type="button" class="btn btn-ghost" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
            <button type="button" class="btn btn-ghost" onClick={() => { download('physics-playground-progress.txt', code); }}>Download as a file</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryTable({ current, incoming }: { readonly current: ProgressSummary; readonly incoming: ProgressSummary }) {
  invariant(current.xp >= 0 && incoming.xp >= 0, 'summaries are non-negative');
  const rows: [string, string | number, string | number][] = [
    ['XP', current.xp, incoming.xp], ['Streak (days)', current.streak, incoming.streak], ['Lessons done', current.lessonsDone, incoming.lessonsDone],
    ['Review items', current.reviewItems, incoming.reviewItems], ['Exported on', current.exportedOn ?? 'never', incoming.exportedOn ?? 'never'],
  ];
  return (
    <table class="compare">
      <thead><tr><th /><th>This browser now</th><th>The code</th></tr></thead>
      <tbody>{rows.map(([k, a, b]) => <tr key={k}><th>{k}</th><td>{a}</td><td>{b}</td></tr>)}</tbody>
    </table>
  );
}

function ImportPanel({ store }: { readonly store: ProgressStore }) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ current: ProgressSummary; incoming: ProgressSummary; progress: ProgressV1 } | null>(null);
  const preview = (): void => {
    const r = store.previewImport(text);
    if (r.ok) { setPending(r.value); setError(null); } else { setPending(null); setError(importErrorMessage(r.error)); }
  };
  const confirm = (): void => {
    if (pending === null) return;
    const r = store.commitImport(pending.progress, Date.now());
    setError(r.ok ? null : r.error);
    setPending(null);
    setText('');
    notify();
  };
  return (
    <div class="card">
      <h2>Restore (import)</h2>
      <label for="import-code">Paste a progress code</label>
      <textarea id="import-code" rows={3} value={text} onInput={(e) => { setText(e.currentTarget.value); setPending(null); }} />
      <button type="button" class="btn" disabled={text.trim() === ''} onClick={preview}>Check this code</button>
      {error !== null && <p class="feedback feedback-bad" role="alert">{error}</p>}
      {pending !== null && (
        <div class="confirm">
          <p>Replace this browser's progress with the code? Your current progress is backed up first, and you can undo.</p>
          <SummaryTable current={pending.current} incoming={pending.incoming} />
          <div class="banner-actions">
            <button type="button" class="btn" onClick={confirm}>Replace my progress</button>
            <button type="button" class="btn btn-ghost" onClick={() => { setPending(null); }}>Cancel</button>
          </div>
        </div>
      )}
      {store.hasImportBackup() && <UndoImport store={store} />}
    </div>
  );
}

function UndoImport({ store }: { readonly store: ProgressStore }) {
  const [msg, setMsg] = useState<string | null>(null);
  invariant(store.status === 'ok', 'undo is offered only when the store is ok');
  const undo = (): void => { const r = store.undoImport(Date.now()); setMsg(r.ok ? 'Restored your progress from before the import.' : r.error); notify(); };
  return (
    <div class="banner">
      <p>{msg ?? 'You imported a progress code. Keep it, or undo to get back what you had before.'}</p>
      <div class="banner-actions">
        <button type="button" class="btn btn-ghost" onClick={undo}>Undo last import</button>
        <button type="button" class="btn btn-ghost" onClick={() => { store.keepImported(); notify(); }}>Keep imported progress</button>
      </div>
    </div>
  );
}

function ResetPanel({ store }: { readonly store: ProgressStore }) {
  const [asking, setAsking] = useState(false);
  const summary = summarize(store.progress);
  invariant(summary.xp >= 0, 'XP is non-negative');
  return (
    <div class="card">
      <h2>Start over</h2>
      {!asking && <button type="button" class="btn btn-danger" disabled={store.status !== 'ok'} onClick={() => { setAsking(true); }}>Reset all progress</button>}
      {asking && (
        <div class="confirm">
          <p>This deletes {summary.xp} XP and {summary.lessonsDone} finished lessons from this browser. Export a code first if you might want them back.</p>
          <button type="button" class="btn btn-danger" onClick={() => { store.reset(Date.now()); setAsking(false); notify(); }}>Yes, reset</button>
          <button type="button" class="btn btn-ghost" onClick={() => { setAsking(false); }}>Cancel</button>
        </div>
      )}
    </div>
  );
}
