import { invariant } from '../lib/invariant';
import { dimsEqual, formatDims, type Quantity } from './dims';
import { parseAnswer } from './parseQuantity';
import { sigFigNote } from './sigfigs';
import type { ParseError } from './tokenize';

export interface CheckOptions {
  /** Relative tolerance, default 2%. */
  readonly tol?: number;
  /** Significant figures the data supports; only produces an advisory note. */
  readonly sigFigs?: number;
  /** Answer is an angle: a bare number is read as degrees. Expected value is in radians. */
  readonly angle?: boolean;
}

export interface Verdict {
  readonly correct: boolean;
  readonly unitsOk: boolean;
  readonly valueOk: boolean;
  /** False when the size is right but the sign or direction is flipped. */
  readonly signOk: boolean;
  readonly message: string;
  readonly sigFigNote: string | null;
  readonly parseError: ParseError | null;
}

const DEFAULT_TOL = 0.02;
const ABS_FLOOR = 1e-9;

export function parseErrorMessage(e: ParseError): string {
  invariant(typeof e.kind === 'string', 'parse error needs a kind');
  switch (e.kind) {
    case 'empty': return 'Type an answer first.';
    case 'too-long': return 'That answer is too long. Keep it under 128 characters.';
    case 'no-number': return 'Start with a number, e.g. 12 kg*m/s.';
    case 'comma': return e.message;
    case 'bad-char': return `Couldn't read "${e.char}". Try a form like 12 kg*m/s or <3, -4> m/s.`;
    case 'unknown-unit':
      return e.suggestion === null ? `Unknown unit "${e.unit}".` : `Unknown unit "${e.unit}". Did you mean "${e.suggestion}"? Units are case-sensitive.`;
    case 'syntax': return e.message;
  }
}

/** True when every component of `got` is within tol of `want`, scaled by |want|. */
function withinTol(got: readonly number[], want: readonly number[], tol: number): boolean {
  invariant(got.length === want.length, 'component counts must match');
  invariant(tol > 0 && tol <= 0.5, 'tolerance must be in (0, 0.5]');
  const scale = Math.max(Math.hypot(...want), ABS_FLOOR);
  return got.every((g, i) => Math.abs(g - (want[i] ?? 0)) <= tol * scale * (1 + 1e-9));
}

/** True when flipping the sign of one or more components would make the answer right. */
function signFlipped(got: readonly number[], want: readonly number[], tol: number): boolean {
  invariant(got.length === want.length, 'component counts must match');
  invariant(tol > 0, 'tolerance must be positive');
  const abs = (v: readonly number[]): number[] => v.map(Math.abs);
  return withinTol(abs(got), abs(want), tol) && !withinTol(got, want, tol);
}

function verdict(fields: Omit<Verdict, 'sigFigNote' | 'parseError'>, note: string | null = null, pe: ParseError | null = null): Verdict {
  invariant(fields.message.length > 0, 'verdict needs a message');
  invariant(!fields.correct || (fields.unitsOk && fields.valueOk), 'a correct verdict needs units and value');
  return { ...fields, sigFigNote: note, parseError: pe };
}

/** Grades a typed answer against an SI answer key. Never throws on learner input. */
export function checkAnswer(expected: Quantity, input: string, opts: CheckOptions = {}): Verdict {
  const tol = opts.tol ?? DEFAULT_TOL;
  invariant(tol > 0 && tol <= 0.5, 'tolerance must be in (0, 0.5]');
  invariant(expected.value.length >= 1 && expected.value.length <= 3, 'answer key needs 1 to 3 components');
  const parsed = parseAnswer(input);
  if (!parsed.ok) return verdict({ correct: false, unitsOk: false, valueOk: false, signOk: true, message: parseErrorMessage(parsed.error) }, null, parsed.error);
  const got = parsed.value.quantity;
  const bareAngle = opts.angle === true && dimsEqual(got.dims, expected.dims) && !parsed.value.hasUnits;
  const value = bareAngle ? got.value.map((v) => (v * Math.PI) / 180) : got.value;
  if (value.length !== expected.value.length) {
    const want = expected.value.length === 1 ? 'a single number' : `a vector with ${expected.value.length} components, like <3, -4>`;
    return verdict({ correct: false, unitsOk: true, valueOk: false, signOk: true, message: `Expected ${want}.` });
  }
  if (!dimsEqual(got.dims, expected.dims)) {
    return verdict({ correct: false, unitsOk: false, valueOk: false, signOk: true, message: `Units don't match: the answer is in ${formatDims(expected.dims)}, you gave ${formatDims(got.dims)}.` });
  }
  const note = opts.sigFigs === undefined ? null : sigFigNote(parsed.value.numberTexts, opts.sigFigs);
  if (withinTol(value, expected.value, tol)) return verdict({ correct: true, unitsOk: true, valueOk: true, signOk: true, message: 'Correct!' }, note);
  if (signFlipped(value, expected.value, tol)) {
    return verdict({ correct: false, unitsOk: true, valueOk: false, signOk: false, message: 'Right size, wrong sign or direction. Check which way is positive.' }, note);
  }
  return verdict({ correct: false, unitsOk: true, valueOk: false, signOk: true, message: 'Not quite. Check your numbers.' }, note);
}
