import { describe, expect, it } from 'vitest';
import { circleForces, createCircleState, releaseString, stepCircle, stepCircleTimed, type CircleParams, type CircleState } from '../../src/physics/circle';
import { PHYSICS_DT } from '../../src/physics/fixedStep';
import { netForce } from '../../src/physics/forces';

const base: CircleParams = { m: 0.5, r: 1, speed: 2 };
const h = PHYSICS_DT;

function run(state: CircleState, p: CircleParams, steps: number): CircleState {
  for (let i = 0; i < steps; i++) stepCircle(state, p, h);
  return state;
}

/** Positions at t - h, t, t + h (three consecutive steps) for a numerical second derivative. */
function threePoints(p: CircleParams, stepsBefore: number, cut: boolean): [CircleState, CircleState, CircleState] {
  const s = run(createCircleState(p), p, stepsBefore);
  if (cut) releaseString(s);
  const a = { ...s };
  stepCircle(s, p, h);
  const b = { ...s };
  stepCircle(s, p, h);
  return [a, b, { ...s }];
}

function netOf(state: CircleState, p: CircleParams) {
  const forces = circleForces(state, p);
  const nets = forces.filter((f) => f.kind === 'net');
  expect(nets).toHaveLength(1);
  const sum = netForce(forces);
  expect(nets[0]?.fx).toBeCloseTo(sum.fx, 12);
  expect(nets[0]?.fy).toBeCloseTo(sum.fy, 12);
  return sum;
}

describe('circle on the string: exact uniform circular motion', () => {
  it('starts at (r, 0) moving +y at the given speed', () => {
    expect(createCircleState(base)).toEqual({ t: 0, x: 1, y: 0, vx: 0, vy: 2, released: false });
  });
  it('|r| = r and |v| = v stay fixed over 20 periods', () => {
    const s = createCircleState(base);
    const T = (2 * Math.PI * base.r) / base.speed;
    const steps = Math.round((20 * T) / h);
    for (let i = 0; i < steps; i++) {
      stepCircle(s, base, h);
      expect(Math.abs(Math.hypot(s.x, s.y) - base.r)).toBeLessThan(1e-12);
      expect(Math.abs(Math.hypot(s.vx, s.vy) - base.speed)).toBeLessThan(1e-12);
    }
  });
  it('angle matches θ = v t / r', () => {
    const s = run(createCircleState(base), base, 100);
    const theta = (base.speed * s.t) / base.r;
    expect(s.x).toBeCloseTo(base.r * Math.cos(theta), 10);
    expect(s.y).toBeCloseTo(base.r * Math.sin(theta), 10);
  });
  // r = 0.5 m, v = π m/s: T = 2πr/v = 1 s = 240 steps exactly.
  it('returns to the start after one period T = 2πr/v', () => {
    const p: CircleParams = { m: 1, r: 0.5, speed: Math.PI };
    const s = run(createCircleState(p), p, 240);
    expect(s.x).toBeCloseTo(0.5, 9);
    expect(s.y).toBeCloseTo(0, 9);
    const half = run(createCircleState(p), p, 120);
    expect(half.x).toBeCloseTo(-0.5, 9);
  });
  it('velocity is perpendicular to the radius (tangent)', () => {
    const s = run(createCircleState(base), base, 77);
    expect(s.x * s.vx + s.y * s.vy).toBeCloseTo(0, 12);
  });
});

describe('circle forces: tension m v²/r toward the post is the net force = m a', () => {
  // m = 0.5 kg, v = 2 m/s, r = 1 m: T = 0.5 × 4 / 1 = 2 N.
  it('tension magnitude is m v² / r and points at the post', () => {
    const forces = circleForces(createCircleState(base), base);
    const t = forces.find((f) => f.kind === 'tension');
    expect(t?.fx).toBeCloseTo(-2, 12);
    expect(t?.fy).toBeCloseTo(0, 12);
    expect(forces).toHaveLength(2);
  });
  it('tension at a later angle still points at the post with magnitude m v² / r', () => {
    const s = run(createCircleState(base), base, 50);
    const t = circleForces(s, base).find((f) => f.kind === 'tension');
    const mag = Math.hypot(t?.fx ?? 0, t?.fy ?? 0);
    expect(mag).toBeCloseTo(2, 12);
    expect((t?.fx ?? 0) * s.y - (t?.fy ?? 0) * s.x).toBeCloseTo(0, 12);
    expect((t?.fx ?? 0) * s.x + (t?.fy ?? 0) * s.y).toBeLessThan(0);
  });
  for (const p of [base, { m: 2, r: 0.8, speed: 5 }, { m: 0.1, r: 3, speed: 0.5 }]) {
    it(`F_net = m a with a from a numerical second derivative (m=${p.m}, r=${p.r}, v=${p.speed})`, () => {
      const [a, b, c] = threePoints(p, 33, false);
      const ax = (a.x - 2 * b.x + c.x) / (h * h);
      const ay = (a.y - 2 * b.y + c.y) / (h * h);
      const f = netOf(b, p);
      const scale = (p.m * p.speed * p.speed) / p.r;
      expect(Math.abs(f.fx - p.m * ax) / scale).toBeLessThan(1e-4);
      expect(Math.abs(f.fy - p.m * ay) / scale).toBeLessThan(1e-4);
      expect(Math.abs(Math.hypot(ax, ay) / ((p.speed * p.speed) / p.r) - 1)).toBeLessThan(1e-4);
    });
  }
});

describe('after the string is cut: straight line along the tangent, no force', () => {
  it('no force acts: one net entry of zero, numerical acceleration zero', () => {
    const [a, b, c] = threePoints(base, 40, true);
    const forces = circleForces(b, base);
    expect(forces).toEqual([{ kind: 'net', label: 'Net force', fx: 0, fy: 0 }]);
    expect(Math.abs(a.x - 2 * b.x + c.x) / (h * h)).toBeLessThan(1e-6);
    expect(Math.abs(a.y - 2 * b.y + c.y) / (h * h)).toBeLessThan(1e-6);
  });
  it('moves at the release velocity: x = x0 + vx (t - t0)', () => {
    const s = run(createCircleState(base), base, 60);
    releaseString(s);
    const s0 = { ...s };
    run(s, base, 480);
    expect(s.vx).toBe(s0.vx);
    expect(s.vy).toBe(s0.vy);
    expect(s.x).toBeCloseTo(s0.x + s0.vx * (s.t - s0.t), 10);
    expect(s.y).toBeCloseTo(s0.y + s0.vy * (s.t - s0.t), 10);
  });
  it('cutting at t = 0 sends the puck straight up the +y tangent: x stays r', () => {
    const s = createCircleState(base);
    releaseString(s);
    run(s, base, 240);
    expect(s.x).toBe(1);
    expect(s.y).toBeCloseTo(2, 10);
  });
  it('releaseString is idempotent', () => {
    const s = createCircleState(base);
    releaseString(s);
    releaseString(s);
    expect(s.released).toBe(true);
    expect(s.vy).toBe(2);
  });
});

describe('stepCircleTimed cuts at exactly releaseAt, mid-step', () => {
  it('release snapshot is on the circle at θ = v t_r / r with tangent velocity', () => {
    const s = createCircleState(base);
    const releaseAt = 0.3001;
    let snap = null;
    for (let i = 0; i < 120 && snap === null; i++) snap = stepCircleTimed(s, base, h, releaseAt);
    expect(snap).not.toBeNull();
    const theta = (base.speed * releaseAt) / base.r;
    expect(snap?.t).toBeCloseTo(releaseAt, 12);
    expect(snap?.x).toBeCloseTo(Math.cos(theta), 10);
    expect(snap?.y).toBeCloseTo(Math.sin(theta), 10);
    expect(snap?.vx).toBeCloseTo(-2 * Math.sin(theta), 10);
    expect(snap?.vy).toBeCloseTo(2 * Math.cos(theta), 10);
    expect(s.released).toBe(true);
    expect(s.x).toBeCloseTo((snap?.x ?? 0) + (snap?.vx ?? 0) * (s.t - releaseAt), 10);
  });
  it('null releaseAt never cuts', () => {
    const s = createCircleState(base);
    for (let i = 0; i < 500; i++) expect(stepCircleTimed(s, base, h, null)).toBeNull();
    expect(s.released).toBe(false);
  });
  it('releaseAt = 0 cuts on the first step', () => {
    const s = createCircleState(base);
    expect(stepCircleTimed(s, base, h, 0)).toEqual({ t: 0, x: 1, y: 0, vx: 0, vy: 2 });
    expect(stepCircleTimed(s, base, h, 0)).toBeNull();
  });
});

describe('bad params and states throw', () => {
  it.each([
    { m: 0, r: 1, speed: 2 },
    { m: 1, r: 0, speed: 2 },
    { m: 1, r: -1, speed: 2 },
    { m: 1, r: 1, speed: 0 },
    { m: 1, r: 1, speed: NaN },
    { m: Infinity, r: 1, speed: 2 },
  ])('rejects %o', (p) => {
    expect(() => createCircleState(p)).toThrow();
  });
  it('rejects bad dt and bad release times', () => {
    const s = createCircleState(base);
    expect(() => { stepCircle(s, base, 0); }).toThrow();
    expect(() => { stepCircle(s, base, 0.1); }).toThrow();
    expect(() => { stepCircleTimed(s, base, h, -1); }).toThrow();
    expect(() => { stepCircleTimed(s, base, h, NaN); }).toThrow();
  });
  it('rejects a state knocked off the circle or with NaN', () => {
    const off = createCircleState(base);
    off.x = 1.5;
    expect(() => { stepCircle(off, base, h); }).toThrow();
    const nan = createCircleState(base);
    nan.vy = NaN;
    expect(() => { stepCircle(nan, base, h); }).toThrow();
  });
});
