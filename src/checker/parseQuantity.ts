import { invariant } from '../lib/invariant';
import { err, ok, type Result } from '../lib/result';
import { DIMLESS, dimsDiv, dimsMul, dimsPow, type Dims, type Quantity } from './dims';
import { applyDecimalComma, MAX_INPUT, normalizeInput, tokenizeUnits, type ParseError, type Token } from './tokenize';
import { lookupUnit, suggestUnit } from './units';

const MAX_STACK = 32;

/** Precedence for binary operators: implicit multiply binds tighter than * and / (SC20). */
const PRECEDENCE: Readonly<Record<'mul' | 'div' | 'jux', number>> = { mul: 1, div: 1, jux: 2 };

type Op = Extract<Token, { t: 'mul' | 'div' | 'jux' }>;

function isOp(tok: Token): tok is Op {
  return tok.t === 'mul' || tok.t === 'div' || tok.t === 'jux';
}

/** Shunting-yard: infix unit tokens -> RPN. Powers are postfix and go straight to output. */
export function toRpn(tokens: readonly Token[]): Result<Token[], ParseError> {
  invariant(tokens.length <= 128, 'too many tokens');
  const out: Token[] = [];
  const ops: Token[] = [];
  // bound: tokens.length (<= 128)
  for (const tok of tokens) {
    if (tok.t === 'unit' || tok.t === 'pow') out.push(tok);
    else if (tok.t === 'lp') ops.push(tok);
    else if (tok.t === 'rp') {
      let top = ops.pop();
      // bound: ops.length (<= tokens.length)
      while (top !== undefined && top.t !== 'lp') { out.push(top); top = ops.pop(); }
      if (top === undefined) return err({ kind: 'syntax', message: 'A ")" has no matching "("' });
    } else if (isOp(tok)) {
      let top = ops[ops.length - 1];
      // bound: ops.length (<= tokens.length)
      while (top !== undefined && isOp(top) && PRECEDENCE[top.t] >= PRECEDENCE[tok.t]) {
        out.push(top);
        ops.pop();
        top = ops[ops.length - 1];
      }
      ops.push(tok);
    }
  }
  // bound: ops.length (<= tokens.length)
  for (let top = ops.pop(); top !== undefined; top = ops.pop()) {
    if (top.t === 'lp') return err({ kind: 'syntax', message: 'A "(" is never closed' });
    out.push(top);
  }
  invariant(out.length <= tokens.length, 'RPN cannot be longer than its input');
  return ok(out);
}

type Unit = { factor: number; dims: Dims };

function applyBinary(stack: Unit[], op: Op): Result<null, ParseError> {
  invariant(stack.length <= MAX_STACK, 'unit stack overflow');
  invariant(isOp(op), 'applyBinary needs an operator');
  const b = stack.pop();
  const a = stack.pop();
  if (a === undefined || b === undefined) return err({ kind: 'syntax', message: 'An operator is missing a unit on one side' });
  if (op.t === 'div') stack.push({ factor: a.factor / b.factor, dims: dimsDiv(a.dims, b.dims) });
  else stack.push({ factor: a.factor * b.factor, dims: dimsMul(a.dims, b.dims) });
  return ok(null);
}

/** Evaluates RPN unit tokens to a single SI factor and dimensions. */
export function evalRpn(rpn: readonly Token[]): Result<Unit, ParseError> {
  invariant(rpn.length <= 128, 'too many RPN tokens');
  const stack: Unit[] = [];
  // bound: rpn.length (<= 128)
  for (const tok of rpn) {
    if (tok.t === 'unit') {
      const def = lookupUnit(tok.name);
      if (def === null) return err({ kind: 'unknown-unit', unit: tok.name, suggestion: suggestUnit(tok.name) });
      if (stack.length >= MAX_STACK) return err({ kind: 'too-long' });
      stack.push({ factor: def.factor, dims: def.dims });
    } else if (tok.t === 'pow') {
      const a = stack.pop();
      if (a === undefined) return err({ kind: 'syntax', message: 'A power has no unit before it' });
      if (!Number.isInteger(tok.n) || Math.abs(tok.n) > 4) return err({ kind: 'syntax', message: 'Unit powers must be between -4 and 4' });
      stack.push({ factor: a.factor ** tok.n, dims: dimsPow(a.dims, tok.n) });
    } else if (isOp(tok)) {
      const r = applyBinary(stack, tok);
      if (!r.ok) return r;
    }
  }
  const top = stack.pop();
  if (top === undefined || stack.length > 0) return err({ kind: 'syntax', message: 'Could not read those units' });
  return ok(top);
}

/** Parses a unit expression; an empty string means "no units". */
export function parseUnits(text: string): Result<Unit, ParseError> {
  invariant(text.length <= MAX_INPUT, 'unit text over the length cap');
  if (text.trim() === '') return ok({ factor: 1, dims: DIMLESS });
  const tokens = tokenizeUnits(text);
  if (!tokens.ok) return tokens;
  const rpn = toRpn(tokens.value);
  return rpn.ok ? evalRpn(rpn.value) : rpn;
}

const NUMBER = /^\s*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)(?:\s*\*\s*10\^([+-]?\d+))?/;

/** Reads "3.0e2", "-12.5", "3*10^2" at the start; returns the value, its text and the rest. */
export function readNumber(s: string): { value: number; text: string; rest: string } | null {
  invariant(s.length <= MAX_INPUT, 'input over the length cap');
  const m = NUMBER.exec(s);
  if (m === null || m[1] === undefined) return null;
  const pow = m[2] === undefined ? 0 : Number(m[2]);
  const value = Number(m[1]) * 10 ** pow;
  invariant(Number.isFinite(value), 'number must be finite');
  return { value, text: m[1], rest: s.slice(m[0].length) };
}

/** Parsed learner answer: the SI quantity plus the raw number texts (for sig-fig feedback). */
export interface ParsedAnswer {
  readonly quantity: Quantity;
  readonly numberTexts: readonly string[];
  /** False when the learner typed a bare number with no units. */
  readonly hasUnits: boolean;
}

/** Reads "<3, -4> m/s" or "(3, -4) m/s" (2 or 3 components). */
function parseVector(s: string): Result<ParsedAnswer, ParseError> {
  invariant(s.startsWith('<') || s.startsWith('('), 'vector must start with a bracket');
  const close = s.indexOf(s.startsWith('<') ? '>' : ')');
  if (close < 0) return err({ kind: 'syntax', message: 'A vector needs a closing bracket, like <3, -4> m/s' });
  const parts = s.slice(1, close).split(',');
  if (parts.length < 2 || parts.length > 3) return err({ kind: 'syntax', message: 'A vector needs 2 or 3 components' });
  const values: number[] = [];
  const texts: string[] = [];
  // bound: parts.length <= 3
  for (const p of parts) {
    const n = readNumber(p);
    if (n === null || n.rest.trim() !== '') return err({ kind: 'no-number' });
    values.push(n.value);
    texts.push(n.text);
  }
  const units = parseUnits(s.slice(close + 1));
  if (!units.ok) return units;
  const f = units.value.factor;
  invariant(values.length === texts.length, 'one text per component');
  const hasUnits = s.slice(close + 1).trim() !== '';
  return ok({ quantity: { value: values.map((v) => v * f), dims: units.value.dims }, numberTexts: texts, hasUnits });
}

/** Parses a learner's typed answer into an SI quantity. Never throws on bad input. */
export function parseAnswer(raw: string): Result<ParsedAnswer, ParseError> {
  invariant(typeof raw === 'string', 'answer must be a string');
  if (raw.length > MAX_INPUT) return err({ kind: 'too-long' });
  const norm = normalizeInput(raw);
  if (norm === '') return err({ kind: 'empty' });
  if (norm.startsWith('<') || (norm.startsWith('(') && norm.includes(','))) return parseVector(norm);
  const decimal = applyDecimalComma(norm);
  if (!decimal.ok) return decimal;
  const n = readNumber(decimal.value);
  if (n === null) return err({ kind: 'no-number' });
  const units = parseUnits(n.rest);
  if (!units.ok) return units;
  const hasUnits = n.rest.trim() !== '';
  return ok({ quantity: { value: [n.value * units.value.factor], dims: units.value.dims }, numberTexts: [n.text], hasUnits });
}
