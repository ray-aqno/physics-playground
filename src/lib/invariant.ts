/**
 * Runtime-check policy (P10 arbiter condition 2, SC9, SC23):
 * `invariant` throws `InvariantError` in every build, dev, test and production alike.
 * Nothing continues silently with bad state. Two boundaries catch it:
 *   - sim step wrappers (src/sims) reset the sim and show a message;
 *   - progress load/import validators (src/progress) turn it into a Result error.
 * Gameplay code never catches it to enter the progress `recovering` state (SC23).
 */
export class InvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvariantError';
  }
}

export function invariant(condition: boolean, message: string): asserts condition {
  if (message.length === 0) {
    throw new InvariantError('invariant called with an empty message');
  }
  if (!condition) {
    throw new InvariantError(message);
  }
}

/** Asserts a value is a finite number (not NaN or ±Infinity). */
export function assertFinite(value: number, label: string): void {
  invariant(label.length > 0, 'assertFinite needs a label');
  invariant(Number.isFinite(value), `${label} must be finite, got ${String(value)}`);
}
