import { describe, expect, it } from 'vitest';
import { assertFinite, invariant, InvariantError } from '../../src/lib/invariant';
import { err, ok } from '../../src/lib/result';

describe('invariant', () => {
  it('passes silently when the condition holds', () => {
    expect(() => { invariant(true, 'never thrown'); }).not.toThrow();
  });
  it('throws InvariantError with the message when the condition fails', () => {
    expect(() => { invariant(false, 'mass must be positive'); }).toThrow(InvariantError);
    expect(() => { invariant(false, 'mass must be positive'); }).toThrow('mass must be positive');
  });
  it('rejects an empty message', () => {
    expect(() => { invariant(true, ''); }).toThrow(InvariantError);
  });
  it('assertFinite rejects NaN and Infinity', () => {
    expect(() => { assertFinite(NaN, 'x'); }).toThrow('x must be finite');
    expect(() => { assertFinite(Infinity, 'x'); }).toThrow(InvariantError);
    expect(() => { assertFinite(1.5, 'x'); }).not.toThrow();
  });
});

describe('result', () => {
  it('ok and err are discriminated by the ok flag', () => {
    expect(ok(3)).toEqual({ ok: true, value: 3 });
    expect(err('bad')).toEqual({ ok: false, error: 'bad' });
  });
});
