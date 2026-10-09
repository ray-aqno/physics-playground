import { invariant } from '../lib/invariant';
import { err, ok, type Result } from '../lib/result';
import { migrate } from './migrate';
import type { ProgressV1 } from './schema';

/** Cap on the decoded JSON bytes of a progress code (SC10, SC18). */
export const MAX_DECODED_BYTES = 256 * 1024;
const PREFIX = 'PP1';

export type ImportError =
  | { readonly kind: 'cut-off' }
  | { readonly kind: 'checksum' }
  | { readonly kind: 'too-big' }
  | { readonly kind: 'newer' }
  | { readonly kind: 'invalid'; readonly reason: string };

export function importErrorMessage(e: ImportError): string {
  invariant(typeof e.kind === 'string', 'import error needs a kind');
  switch (e.kind) {
    case 'cut-off': return 'That code looks cut off. Copy the whole code, from PP1 to the end, and try again.';
    case 'checksum': return 'That code was changed or cut off, so it was not imported.';
    case 'too-big': return 'That code is too large to be a progress code.';
    case 'newer': return 'That code was made by a newer version of the app. Reload the page and try again.';
    case 'invalid': return `That code is not valid progress (${e.reason}).`;
  }
}

/** 32-bit FNV-1a hash as 8 hex digits. Detects accidents, not tampering. */
export function fnv1a(s: string): string {
  invariant(s.length <= 2 * MAX_DECODED_BYTES, 'input too long to hash');
  let h = 0x811c9dc5;
  // bound: s.length <= 512 KiB
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  invariant(h >= 0 && h <= 0xffffffff, 'hash must be 32-bit');
  return h.toString(16).padStart(8, '0');
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  invariant(bytes.length <= MAX_DECODED_BYTES, 'progress too large to export');
  let bin = '';
  // bound: bytes.length <= MAX_DECODED_BYTES
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromBase64(b64: string): string | null {
  invariant(b64.length <= Math.ceil((MAX_DECODED_BYTES * 4) / 3) + 4, 'base64 over the cap');
  let bin: string;
  try { bin = atob(b64); } catch { return null; }
  const bytes = new Uint8Array(bin.length);
  // bound: bin.length <= MAX_DECODED_BYTES
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { return null; }
}

/** Progress code: "PP1.<base64 JSON>.<checksum>". */
export function exportCode(p: ProgressV1): string {
  invariant(Number.isInteger(p.xp) && p.xp >= 0, 'export needs whole, non-negative XP');
  const json = JSON.stringify(p);
  const code = `${PREFIX}.${toBase64(json)}.${fnv1a(json)}`;
  invariant(code.startsWith(PREFIX), 'code must carry its prefix');
  return code;
}

/** Decodes and validates a progress code. Size is checked before decoding and parsing (SC10). */
export function importCode(code: string): Result<ProgressV1, ImportError> {
  const parts = code.trim().split('.');
  if (parts.length !== 3 || parts[0] !== PREFIX) return err({ kind: 'cut-off' });
  const [, b64 = '', sum = ''] = parts;
  if (Math.floor((b64.length * 3) / 4) > MAX_DECODED_BYTES) return err({ kind: 'too-big' });
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64) || b64.length % 4 !== 0 || !/^[0-9a-f]{8}$/.test(sum)) return err({ kind: 'cut-off' });
  const json = fromBase64(b64);
  if (json === null) return err({ kind: 'cut-off' });
  if (fnv1a(json) !== sum) return err({ kind: 'checksum' });
  let raw: unknown;
  try { raw = JSON.parse(json); } catch { return err({ kind: 'invalid', reason: 'not JSON' }); }
  const m = migrate(raw);
  if (!m.ok) return err(m.error.kind === 'newer' ? { kind: 'newer' } : { kind: 'invalid', reason: m.error.reason });
  invariant(m.value.rev >= 0, 'imported revision must be non-negative');
  return ok(m.value);
}
