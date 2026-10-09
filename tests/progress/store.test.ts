import { describe, expect, it } from 'vitest';
import { exportCode, importCode, MAX_DECODED_BYTES } from '../../src/progress/exportImport';
import { KEYS, MemoryKV } from '../../src/progress/kv';
import { mergeProgress } from '../../src/progress/merge';
import { migrate } from '../../src/progress/migrate';
import { freshProgress, validateV1, type ProgressV1 } from '../../src/progress/schema';
import { ProgressStore } from '../../src/progress/store';

const NOW = 1_760_000_000_000;

function sample(): ProgressV1 {
  return {
    ...freshProgress(),
    rev: 3,
    xp: 120,
    streak: { count: 4, lastActiveDay: '2026-10-08' },
    lessons: { 'lab.vectors-1': { done: true, bestScore: 0.8, completedAt: '2026-10-07' } },
    leitner: { 'lab.vectors-1.q2': { box: 2, due: '2026-10-10', updated: NOW } },
    lastExportAt: '2026-10-01',
  };
}

function storeWith(kv: MemoryKV, p: ProgressV1 | string): ProgressStore {
  kv.setItem(KEYS.main, typeof p === 'string' ? p : JSON.stringify(p));
  const s = new ProgressStore(kv);
  s.load(NOW);
  return s;
}

describe('schema and migration (council condition 3)', () => {
  it('migrates v0 { xp, done[] } to v1', () => {
    const r = migrate({ xp: 50, done: ['lab.vectors-1', 'c01.intro'] });
    expect(r.ok && r.value.version).toBe(1);
    expect(r.ok && r.value.xp).toBe(50);
    expect(r.ok && r.value.lessons['c01.intro']?.done).toBe(true);
  });
  it('rejects a newer version with kind "newer"', () => {
    const r = migrate({ ...sample(), version: 2 });
    expect(!r.ok && r.error.kind).toBe('newer');
  });
  it('copies only known fields (allowlist, SC10)', () => {
    const r = validateV1({ ...sample(), evil: 'x', streak: { count: 1, lastActiveDay: null, extra: 1 } });
    expect(r.ok && Object.keys(r.value)).not.toContain('evil');
    expect(r.ok && Object.keys(r.value.streak)).toEqual(['count', 'lastActiveDay']);
  });
  it('rejects bad shapes', () => {
    for (const bad of [null, [], { ...sample(), xp: -1 }, { ...sample(), lessons: { 'BAD ID': {} } }, { ...sample(), leitner: { a: { box: 9, due: '2026-10-01', updated: 1 } } }]) {
      expect(validateV1(bad).ok).toBe(false);
    }
  });
});

describe('export / import codes (council condition 3, SC10, SC18)', () => {
  it('round-trips', () => {
    const r = importCode(exportCode(sample()));
    expect(r.ok && r.value).toEqual(sample());
  });
  it('rejects a cut-off code', () => {
    const code = exportCode(sample());
    expect(importCode(code.slice(0, code.length - 12)).ok).toBe(false);
    expect(importCode(code.split('.').slice(0, 2).join('.'))).toEqual({ ok: false, error: { kind: 'cut-off' } });
  });
  it('rejects an edited code by checksum', () => {
    const [p, b, s] = exportCode(sample()).split('.');
    const edited = btoa(atob(b ?? '').replace('"xp":120', '"xp":999'));
    expect(importCode(`${p ?? ''}.${edited}.${s ?? ''}`)).toEqual({ ok: false, error: { kind: 'checksum' } });
  });
  it('rejects an oversized code before decoding', () => {
    const huge = `PP1.${'A'.repeat(Math.ceil((MAX_DECODED_BYTES * 4) / 3) + 8)}.00000000`;
    expect(importCode(huge)).toEqual({ ok: false, error: { kind: 'too-big' } });
  });
  it('rejects a code from a newer version', () => {
    const json = JSON.stringify({ ...sample(), version: 2 });
    let h = 0x811c9dc5;
    for (let i = 0; i < json.length; i++) { h ^= json.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    const code = `PP1.${btoa(json)}.${h.toString(16).padStart(8, '0')}`;
    expect(importCode(code)).toEqual({ ok: false, error: { kind: 'newer' } });
  });
});

describe('corrupt data is never lost (SC2, SC14)', () => {
  it('a corrupt load enters recovering, stashes the payload and refuses to save', () => {
    const kv = new MemoryKV();
    const s = storeWith(kv, '{not json');
    expect(s.status).toBe('recovering');
    s.update((p) => ({ ...p, xp: 10 }), NOW);
    expect(kv.getItem(KEYS.main)).toBe('{not json');
    expect(s.unsavedSince).toBe(NOW);
    expect(s.corruptPayload()).toBe('{not json');
  });
  it('two corrupt loads keep both payloads; a third (unacknowledged) is kept in memory', () => {
    const kv = new MemoryKV();
    storeWith(kv, 'bad-1');
    storeWith(kv, 'bad-2');
    const third = storeWith(kv, 'bad-3');
    const slots = [kv.getItem(KEYS.corrupt1), kv.getItem(KEYS.corrupt2)].join(' ');
    expect(slots).toContain('bad-1');
    expect(slots).toContain('bad-2');
    expect(third.unstashed).toBe('bad-3');
  });
  it('after acknowledgement, the oldest slot can rotate and saving resumes', () => {
    const kv = new MemoryKV();
    storeWith(kv, 'bad-1');
    const s2 = storeWith(kv, 'bad-2');
    s2.acknowledgeRecovery(NOW);
    expect(s2.status).toBe('ok');
    expect(JSON.parse(kv.getItem(KEYS.main) ?? 'null')).toMatchObject({ version: 1, xp: 0 });
    kv.setItem(KEYS.main, 'bad-3');
    const s3 = new ProgressStore(kv);
    s3.load(NOW + 1);
    expect(s3.unstashed).toBeNull();
    expect([kv.getItem(KEYS.corrupt1), kv.getItem(KEYS.corrupt2)].join(' ')).toContain('bad-3');
  });
  it('a newer-version save is treated as recovering, not overwritten', () => {
    const kv = new MemoryKV();
    const s = storeWith(kv, JSON.stringify({ ...sample(), version: 2 }));
    expect(s.status).toBe('recovering');
    expect(s.notice).toContain('newer version');
  });
});

describe('imports back up first and can be undone (SC1, SC13)', () => {
  it('import then undo restores the previous progress exactly', () => {
    const kv = new MemoryKV();
    const s = storeWith(kv, sample());
    const before = s.progress;
    const preview = s.previewImport(exportCode({ ...freshProgress(), xp: 5 }));
    expect(preview.ok && preview.value.current.xp).toBe(120);
    expect(preview.ok && preview.value.incoming.xp).toBe(5);
    if (!preview.ok) return;
    expect(s.commitImport(preview.value.progress, NOW).ok).toBe(true);
    expect(s.progress.xp).toBe(5);
    expect(s.undoImport(NOW).ok).toBe(true);
    expect({ ...s.progress, rev: 0 }).toEqual({ ...before, rev: 0 });
    expect(s.hasImportBackup()).toBe(false);
  });
  it('a second import keeps the pre-first-import snapshot (SC13)', () => {
    const kv = new MemoryKV();
    const s = storeWith(kv, sample());
    s.commitImport({ ...freshProgress(), xp: 5 }, NOW);
    s.commitImport({ ...freshProgress(), xp: 7 }, NOW);
    s.undoImport(NOW);
    expect(s.progress.xp).toBe(120);
  });
  it('the import is cancelled when the backup cannot be written', () => {
    const kv = new MemoryKV();
    const s = storeWith(kv, sample());
    kv.failWrites = true;
    const r = s.commitImport({ ...freshProgress(), xp: 5 }, NOW);
    expect(r.ok).toBe(false);
    expect(s.progress.xp).toBe(120);
  });
  it('the preview shows both export dates', () => {
    const s = storeWith(new MemoryKV(), sample());
    const r = s.previewImport(exportCode({ ...freshProgress(), lastExportAt: '2026-09-20' }));
    expect(r.ok && [r.value.current.exportedOn, r.value.incoming.exportedOn]).toEqual(['2026-10-01', '2026-09-20']);
  });
});

describe('tabs and failed saves (SC4, SC5, SC16)', () => {
  it('two tabs saving interleaved keep both changes', () => {
    const kv = new MemoryKV();
    kv.setItem(KEYS.main, JSON.stringify(sample()));
    const a = new ProgressStore(kv);
    const b = new ProgressStore(kv);
    a.load(NOW);
    b.load(NOW);
    a.update((p) => ({ ...p, xp: p.xp + 10, lessons: { ...p.lessons, 'c01.intro': { done: true, bestScore: 1, completedAt: '2026-10-08' } } }), NOW);
    b.update((p) => ({ ...p, xp: p.xp + 20, lessons: { ...p.lessons, 'c02.momentum': { done: true, bestScore: 0.5, completedAt: '2026-10-08' } } }), NOW);
    const saved: unknown = JSON.parse(kv.getItem(KEYS.main) ?? 'null');
    const r = validateV1(saved);
    expect(r.ok && Object.keys(r.value.lessons).sort()).toEqual(['c01.intro', 'c02.momentum', 'lab.vectors-1']);
    expect(r.ok && r.value.xp).toBe(140);
  });
  it('a reset in one tab is not undone by a stale save in another', () => {
    const kv = new MemoryKV();
    kv.setItem(KEYS.main, JSON.stringify(sample()));
    const a = new ProgressStore(kv);
    const b = new ProgressStore(kv);
    a.load(NOW);
    b.load(NOW);
    a.reset(NOW);
    b.update((p) => ({ ...p, xp: p.xp + 20 }), NOW);
    expect(b.progress.xp).toBe(0);
    expect(b.notice).toContain('another tab');
    const r = validateV1(JSON.parse(kv.getItem(KEYS.main) ?? 'null'));
    expect(r.ok && r.value.xp).toBe(0);
  });
  it('storage events are ignored while recovering', () => {
    const s = storeWith(new MemoryKV(), 'garbage');
    s.onExternalChange(JSON.stringify(sample()));
    expect(s.status).toBe('recovering');
    expect(s.progress.xp).toBe(0);
  });
  it('storage events from another tab are adopted when newer', () => {
    const s = storeWith(new MemoryKV(), sample());
    s.onExternalChange(JSON.stringify({ ...sample(), rev: 9, xp: 300 }));
    expect(s.progress.xp).toBe(300);
  });
  it('a failed save sets unsavedSince; the next good save clears it', () => {
    const kv = new MemoryKV();
    const s = storeWith(kv, sample());
    kv.failWrites = true;
    s.update((p) => ({ ...p, xp: 1 }), NOW);
    expect(s.unsavedSince).toBe(NOW);
    kv.failWrites = false;
    s.update((p) => ({ ...p, xp: 2 }), NOW + 5);
    expect(s.unsavedSince).toBeNull();
  });
  it('mergeProgress never loses XP and keeps the newer review entry', () => {
    const a = sample();
    const b: ProgressV1 = { ...sample(), xp: 90, leitner: { 'lab.vectors-1.q2': { box: 4, due: '2026-10-20', updated: NOW + 1 } } };
    const m = mergeProgress(a, b);
    expect(m.xp).toBe(120);
    expect(m.leitner['lab.vectors-1.q2']?.box).toBe(4);
  });
  it('exportNow records today as the export date', () => {
    const s = storeWith(new MemoryKV(), sample());
    const code = s.exportNow(new Date(2026, 9, 8, 12));
    expect(s.progress.lastExportAt).toBe('2026-10-08');
    expect(importCode(code).ok).toBe(true);
  });
});
