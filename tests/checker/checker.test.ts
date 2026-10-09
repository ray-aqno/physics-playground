import { describe, expect, it } from 'vitest';
import { checkAnswer } from '../../src/checker/compare';
import { quantity, type Dims } from '../../src/checker/dims';
import { parseAnswer } from '../../src/checker/parseQuantity';
import { countSigFigs } from '../../src/checker/sigfigs';
import { cross2z, cross3, directionDeg, dot, fromPolar, magnitude } from '../../src/checker/vectorMath';

const LEN: Dims = [1, 0, 0, 0, 0, 0, 0];
const MOM: Dims = [1, 1, -1, 0, 0, 0, 0]; // kg·m/s
const ACC: Dims = [1, 0, -2, 0, 0, 0, 0];
const FORCE: Dims = [1, 1, -2, 0, 0, 0, 0];
const ENERGY: Dims = [2, 1, -2, 0, 0, 0, 0];
const VEL: Dims = [1, 0, -1, 0, 0, 0, 0];
const TIME: Dims = [0, 0, 1, 0, 0, 0, 0];
const NONE: Dims = [0, 0, 0, 0, 0, 0, 0];

/** Realistic learner typings (SC7): input -> SI values (hand-converted) and dimensions. */
const CORPUS: [string, number[], Dims][] = [
  ['12 kg*m/s', [12], MOM], ['12 kg m/s', [12], MOM], ['12 kg·m/s', [12], MOM], ['12 kg⋅m/s', [12], MOM],
  ['12 N*s', [12], MOM], ['12 N s', [12], MOM], ['12 N·s', [12], MOM], ['12 kg m s^-1', [12], MOM],
  ['12 kg m s⁻¹', [12], MOM], ['  12   kg*m / s ', [12], MOM], ['1.2e1 kg*m/s', [12], MOM], ['1.2E1 N*s', [12], MOM],
  ['1.2*10^1 N*s', [12], MOM], ['1.2×10^1 N·s', [12], MOM], ['−12 kg*m/s', [-12], MOM], ['-12 N*s', [-12], MOM],
  ['9.8 m/s^2', [9.8], ACC], ['9.8 m/s2', [9.8], ACC], ['9.8 m/s²', [9.8], ACC], ['9.8 m/s**2', [9.8], ACC],
  ['9.8 m/s/s', [9.8], ACC], ['9.8 m s^-2', [9.8], ACC], ['9.8 N/kg', [9.8], ACC], ['9.8 m/(s*s)', [9.8], ACC],
  ['5 kN', [5000], FORCE], ['5 kg m/s^2', [5], FORCE], ['250 mN', [0.25], FORCE], ['5 J/m', [5], FORCE],
  ['4.5 J', [4.5], ENERGY], ['4.5 N*m', [4.5], ENERGY], ['4.5 kg m^2/s^2', [4.5], ENERGY], ['4500 mJ', [4.5], ENERGY],
  ['0.0045 kJ', [4.5], ENERGY], ['3 km', [3000], LEN], ['50 cm', [0.5], LEN], ['50 mm', [0.05], LEN],
  ['72 km/h', [20], VEL], ['20 m/s', [20], VEL], ['300 us', [3e-4], TIME], ['300 µs', [3e-4], TIME],
  ['300 μs', [3e-4], TIME], ['2 min', [120], TIME], ['1,5 m', [1.5], LEN], ['.5 m', [0.5], LEN],
  ['<3, -4> m/s', [3, -4], VEL], ['(3, -4) m/s', [3, -4], VEL], ['<3,-4>m/s', [3, -4], VEL], ['<1, 2, 3> m', [1, 2, 3], LEN],
  ['<3, −4> N*s', [3, -4], MOM], ['0.5', [0.5], NONE], ['3.00e8 m/s', [3e8], VEL],
];

describe('parser corpus of learner typings (SC7)', () => {
  it('has at least 40 typings', () => {
    expect(CORPUS.length).toBeGreaterThanOrEqual(40);
  });
  for (const [input, value, dims] of CORPUS) {
    it(`reads "${input}"`, () => {
      const r = parseAnswer(input);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.value.quantity.dims).toEqual(dims);
      expect(r.value.quantity.value.length).toBe(value.length);
      r.value.quantity.value.forEach((v, i) => { expect(v).toBeCloseTo(value[i] ?? NaN, 9); });
    });
  }
});

describe('juxtaposition and comma rules (SC20)', () => {
  // Juxtaposition binds tighter than "/": "J/kg K" = J/(kg·K)
  it('J/kg K is joules per (kilogram kelvin)', () => {
    const r = parseAnswer('4186 J/kg K');
    expect(r.ok && r.value.quantity.dims).toEqual([2, 0, -2, 0, -1, 0, 0]);
  });
  it('3,4 without brackets asks for vector syntax', () => {
    const r = parseAnswer('3,4');
    expect(!r.ok && r.error.kind).toBe('comma');
  });
  it('1,2,3 without brackets asks for vector syntax', () => {
    expect(parseAnswer('1,2,3 m').ok).toBe(false);
  });
});

describe('checkAnswer verdicts (council condition 2)', () => {
  const p = quantity(12, MOM);
  it('N·s equals kg·m/s', () => {
    expect(checkAnswer(p, '12 N*s').correct).toBe(true);
    expect(checkAnswer(p, '12 kg*m/s').correct).toBe(true);
  });
  it('J equals N·m equals kg·m²/s²', () => {
    const e = quantity(4.5, ENERGY);
    for (const s of ['4.5 J', '4.5 N*m', '4.5 kg m^2/s^2']) expect(checkAnswer(e, s).correct).toBe(true);
  });
  it('2% tolerance edge: +2% passes, +2.1% fails, -2% passes', () => {
    expect(checkAnswer(quantity(1, LEN), '1.02 m').correct).toBe(true);
    expect(checkAnswer(quantity(1, LEN), '1.021 m').correct).toBe(false);
    expect(checkAnswer(quantity(1, LEN), '0.98 m').correct).toBe(true);
  });
  it('wrong dimensions get a units verdict naming both', () => {
    const v = checkAnswer(p, '12 N');
    expect(v.correct).toBe(false);
    expect(v.unitsOk).toBe(false);
    expect(v.message).toContain('kg·m·s^-1');
    expect(v.message).toContain('kg·m·s^-2');
  });
  it('flipped scalar sign gets a sign verdict', () => {
    const v = checkAnswer(quantity(-3, VEL), '3 m/s');
    expect(v.signOk).toBe(false);
    expect(v.unitsOk).toBe(true);
  });
  it('flipped vector component gets a sign verdict', () => {
    const v = checkAnswer(quantity([3, -4], VEL), '<3, 4> m/s');
    expect(v.signOk).toBe(false);
  });
  it('vector in both syntaxes is accepted', () => {
    const want = quantity([3, -4], VEL);
    expect(checkAnswer(want, '<3, -4> m/s').correct).toBe(true);
    expect(checkAnswer(want, '(3, -4) m/s').correct).toBe(true);
  });
  it('scalar vs vector mismatch is explained', () => {
    expect(checkAnswer(quantity([3, -4], VEL), '5 m/s').message).toContain('vector');
  });
  it('a zero component is judged against the vector size', () => {
    expect(checkAnswer(quantity([5, 0], VEL), '<5, 0.05> m/s').correct).toBe(true);
  });
  it('sig figs give a note but never mark a right answer wrong', () => {
    const v = checkAnswer(quantity(9.8, ACC), '9.80665 m/s^2', { sigFigs: 2 });
    expect(v.correct).toBe(true);
    expect(v.sigFigNote).toContain('6 significant figures');
    expect(checkAnswer(quantity(9.8, ACC), '9.8 m/s^2', { sigFigs: 2 }).sigFigNote).toBeNull();
  });
  it('angle answers accept bare degrees or explicit units', () => {
    const theta = quantity((36.87 * Math.PI) / 180, NONE);
    expect(checkAnswer(theta, '36.87', { angle: true }).correct).toBe(true);
    expect(checkAnswer(theta, '36.87 deg', { angle: true }).correct).toBe(true);
    expect(checkAnswer(theta, '0.6435 rad', { angle: true }).correct).toBe(true);
  });
  it('malformed input returns a parse verdict and never throws', () => {
    for (const bad of ['', 'kg', '12 kg**', '12 (m/s', '12 m/s)', '12 $', 'x'.repeat(200), '12 m^', '<1> m', '<1,2', '12 m^9']) {
      const v = checkAnswer(p, bad);
      expect(v.correct).toBe(false);
      expect(v.message.length).toBeGreaterThan(0);
    }
  });
  it('case errors name the intended unit', () => {
    const v = checkAnswer(quantity(100, [-1, 1, -2, 0, 0, 0, 0]), '100 pa');
    expect(v.parseError?.kind).toBe('unknown-unit');
    expect(v.message).toContain('"Pa"');
  });
});

describe('sig fig counting', () => {
  const cases: [string, number][] = [['0.0450', 3], ['3.00e8', 3], ['1200', 2], ['1200.', 4], ['7', 1], ['0', 1], ['-2.50', 3]];
  for (const [t, n] of cases) it(`${t} has ${n}`, () => { expect(countSigFigs(t)).toBe(n); });
});

describe('vector math against hand values (SC3)', () => {
  it('cross-product sign: x̂ × ŷ = +ẑ, ŷ × x̂ = -ẑ', () => {
    expect(cross2z([1, 0], [0, 1])).toBe(1);
    expect(cross2z([0, 1], [1, 0])).toBe(-1);
    expect(cross3([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
    expect(cross3([2, 3, 4], [5, 6, 7])).toEqual([-3, 6, -3]); // (3·7-4·6, 4·5-2·7, 2·6-3·5)
  });
  it('perpendicular vectors have zero dot product', () => {
    expect(dot([3, 4], [4, -3])).toBe(0);
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
  });
  it('3-4-5 triangle magnitude and direction', () => {
    expect(magnitude([3, 4])).toBe(5);
    expect(directionDeg([3, 4])).toBeCloseTo(53.130102, 5);
    expect(directionDeg([-1, -1])).toBeCloseTo(225, 9);
    const [x, y] = fromPolar(10, 30);
    expect(x).toBeCloseTo(8.660254, 6);
    expect(y).toBeCloseTo(5, 9);
  });
});

describe('required units for conversion questions (found by playing the lesson)', () => {
  const v = quantity(20, VEL);
  it('retyping the given "72 km/h" does not answer "convert to m/s"', () => {
    const r = checkAnswer(v, '72 km/h', { inUnits: 'm/s' });
    expect(r.correct).toBe(false);
    expect(r.message).toBe('Give your answer in m/s.');
  });
  it('20 m/s and 20 m s^-1 are accepted', () => {
    expect(checkAnswer(v, '20 m/s', { inUnits: 'm/s' }).correct).toBe(true);
    expect(checkAnswer(v, '20 m s^-1', { inUnits: 'm/s' }).correct).toBe(true);
  });
  it('4.7 us is rejected when seconds are required; 4.7e-6 s is accepted', () => {
    const t = quantity(4.7e-6, TIME);
    expect(checkAnswer(t, '4.7 us', { inUnits: 's' }).correct).toBe(false);
    expect(checkAnswer(t, '4.7e-6 s', { inUnits: 's' }).correct).toBe(true);
  });
  it('without inUnits, any units of the right dimension still work', () => {
    expect(checkAnswer(v, '72 km/h').correct).toBe(true);
  });
});
