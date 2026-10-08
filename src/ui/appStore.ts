import { useEffect, useState } from 'preact/hooks';
import { invariant } from '../lib/invariant';
import { KEYS, MemoryKV, type KV } from '../progress/kv';
import { ProgressStore } from '../progress/store';

/** Uses localStorage when the browser allows it, otherwise an in-memory store (progress then needs Export). */
function pickKV(): KV {
  try {
    const probe = 'pp.probe';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return new MemoryKV();
  }
}

/**
 * The one progress store for the page (module state allowed by the P10 plan: the progress-store
 * singleton). Components subscribe to re-render after any change.
 */
const kv = pickKV();
export const store = new ProgressStore(kv);
store.load(Date.now());
const listeners = new Set<() => void>();

export function notify(): void {
  invariant(listeners.size <= 100, 'too many store listeners');
  // bound: listeners.size <= 100
  for (const fn of listeners) fn();
}

window.addEventListener('storage', (e) => {
  if (e.key !== KEYS.main) return;
  store.onExternalChange(e.newValue);
  notify();
});

/** Re-renders the calling component whenever progress changes. */
export function useStore(): ProgressStore {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = (): void => { setTick((t) => t + 1); };
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return store;
}
