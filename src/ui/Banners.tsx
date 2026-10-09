import { useState } from 'preact/hooks';
import { invariant } from '../lib/invariant';
import { dayDiff, localDay } from '../progress/dates';
import type { ProgressStore } from '../progress/store';
import { notify } from './appStore';

/** Offers a file download of `text` (used for progress codes and damaged data). */
export function download(name: string, text: string): void {
  invariant(name.length > 0, 'file name required');
  invariant(text.length > 0, 'nothing to download');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Progress safety banners: recovering after damaged data (SC2), progress not being saved (SC5,
 * SC17, persistent, not a toast), and the weekly export nudge (council condition 3).
 */
export function Banners({ store, go }: { readonly store: ProgressStore; readonly go: (route: string) => void }) {
  invariant(store.progress.xp >= 0, 'XP is non-negative');
  const [later, setLater] = useState(false);
  if (store.status === 'recovering') {
    const payload = store.corruptPayload();
    return (
      <div class="banner banner-bad" role="alert">
        <p>{store.notice}</p>
        <div class="banner-actions">
          <button type="button" class="btn" onClick={() => { store.acknowledgeRecovery(Date.now()); notify(); }}>Start fresh</button>
          <button type="button" class="btn btn-ghost" onClick={() => { go('#/settings'); }}>Import a progress code</button>
          {payload !== null && <button type="button" class="btn btn-ghost" onClick={() => { download('physics-playground-damaged-progress.txt', payload); }}>Download damaged data</button>}
        </div>
      </div>
    );
  }
  if (store.unsavedSince !== null) {
    return (
      <div class="banner banner-bad" role="alert">
        <p>{store.notice ?? 'Your progress is not being saved in this browser.'} Export a progress code so you don't lose it.</p>
        <button type="button" class="btn" onClick={() => { go('#/settings'); }}>Export now</button>
      </div>
    );
  }
  const today = localDay(new Date());
  const last = store.progress.lastExportAt;
  const stale = store.progress.xp > 0 && (last === null || dayDiff(last, today) > 7);
  if (!stale || later) return store.notice === null ? null : <div class="banner" role="status"><p>{store.notice}</p></div>;
  return (
    <div class="banner" role="status">
      <p>{last === null ? 'Save a backup of your progress.' : 'It has been over a week since your last backup.'} Your progress lives only in this browser.</p>
      <div class="banner-actions">
        <button type="button" class="btn" onClick={() => { go('#/settings'); }}>Export a backup</button>
        <button type="button" class="btn btn-ghost" onClick={() => { setLater(true); }}>Later</button>
      </div>
    </div>
  );
}
