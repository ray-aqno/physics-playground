// @vitest-environment happy-dom
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import type { Claim, SimSetup } from '../../src/content/types';
import type { CircleParams } from '../../src/physics/circle';
import { advanceCircle, createCircleSim, cutString, setCircleSpeed, TRAIL_MAX } from '../../src/sims/circleController';
import { CircleSimView } from '../../src/sims/CircleSimView';
import { circleReadout, describeCircle } from '../../src/sims/describeCircle';
import { classifyReleasePath, runCircle } from '../content/headless-circle';

const base: CircleParams = { m: 0.5, r: 1, speed: 2 };
const setup = (params: CircleParams, releaseAt: number, seconds: number): Extract<SimSetup, { sim: 'circle' }> => ({ sim: 'circle', params, releaseAt, seconds });
const path = (p: 'tangent' | 'outward' | 'curved'): Claim => ({ kind: 'release-path', path: p });

describe('headless circle runner: release-path claims', () => {
  const cases = [
    setup(base, 0.5, 2),
    setup(base, 0, 1),
    setup({ m: 2, r: 0.6, speed: 5 }, 1.234, 3),
    setup({ m: 0.1, r: 2.5, speed: 0.5 }, 7, 10),
    // The predict setups suggested to the lesson author.
    setup({ m: 0.5, r: 1, speed: 2 }, 0.785, 2),
    setup({ m: 0.5, r: 1, speed: 4 }, 0.5, 1.5),
    setup({ m: 0.2, r: 0.8, speed: 1.5 }, 0, 1),
  ];
  for (const s of cases) {
    it(`cut at ${s.releaseAt} s (v=${s.params.speed}, r=${s.params.r}): only 'tangent' holds`, () => {
      const holds = runCircle(s);
      expect(holds(path('tangent'))).toBe(true);
      expect(holds(path('outward'))).toBe(false);
      expect(holds(path('curved'))).toBe(false);
    });
  }
  it('is false for every other claim kind', () => {
    const holds = runCircle(setup(base, 0.5, 2));
    const others: Claim[] = [
      { kind: 'velocity-sign', body: 0, sign: 1 },
      { kind: 'ke-change', change: 'same' },
      { kind: 'com-velocity', change: 'same' },
      { kind: 'max-height', relation: 'same' },
      { kind: 'ends-lower', lower: true },
      { kind: 'pulley-direction', sign: 1 },
      { kind: 'tension-vs-weight', relation: 'equal' },
    ];
    for (const c of others) expect(holds(c)).toBe(false);
  });
  it('rejects a setup that never cuts the string', () => {
    expect(() => runCircle(setup(base, 3, 2))).toThrow();
  });
});

describe('release-path classifier on synthetic paths', () => {
  const rel = { t: 0, x: 1, y: 0, vx: 0, vy: 2 };
  const pts = (f: (k: number) => [number, number]) => Array.from({ length: 50 }, (_, i) => { const [x, y] = f((i + 1) / 50); return { x, y }; });
  it("a straight line along +v is 'tangent'", () => {
    expect(classifyReleasePath(rel, pts((k) => [1, 2 * k]))).toBe('tangent');
  });
  it("a straight line along -v is not 'tangent' (wrong way)", () => {
    expect(classifyReleasePath(rel, pts((k) => [1, -2 * k]))).toBe('curved');
  });
  it("radially away from the post is 'outward'", () => {
    expect(classifyReleasePath(rel, pts((k) => [1 + k, 0]))).toBe('outward');
  });
  it("still going round the circle is 'curved'", () => {
    expect(classifyReleasePath(rel, pts((k) => [Math.cos(2 * k), Math.sin(2 * k)]))).toBe('curved');
  });
  it("a spiral outward is 'curved'", () => {
    expect(classifyReleasePath(rel, pts((k) => [(1 + k) * Math.cos(k), (1 + k) * Math.sin(k)]))).toBe('curved');
  });
  it("a 1e-5 m sideways wobble is not 'tangent'", () => {
    expect(classifyReleasePath(rel, pts((k) => [1 + 1e-5 * Math.sin(20 * k), 2 * k]))).toBe('curved');
  });
});

describe('circle sim controller', () => {
  it('runs on the circle and records a bounded trail', () => {
    const sim = createCircleSim(base, null);
    for (let i = 0; i < 100; i++) advanceCircle(sim, 8);
    expect(sim.message).toBeNull();
    expect(Math.hypot(sim.state.x, sim.state.y)).toBeCloseTo(1, 12);
    expect(sim.trail.length).toBe(TRAIL_MAX);
  });
  it('cuts automatically at releaseAt and records the snapshot', () => {
    const sim = createCircleSim(base, 0.25);
    for (let i = 0; i < 10; i++) advanceCircle(sim, 8);
    expect(sim.state.released).toBe(true);
    expect(sim.release?.t).toBeCloseTo(0.25, 12);
  });
  it('the learner can cut the string; cutting twice keeps the first snapshot', () => {
    const sim = createCircleSim(base, null);
    advanceCircle(sim, 8);
    cutString(sim);
    const first = sim.release;
    advanceCircle(sim, 8);
    cutString(sim);
    expect(sim.release).toBe(first);
    expect(sim.state.released).toBe(true);
  });
  it('cutting by hand is refused when the setup cuts automatically', () => {
    expect(() => { cutString(createCircleSim(base, 1)); }).toThrow();
  });
  it('a broken state resets to the start with a message', () => {
    const sim = createCircleSim(base, null);
    advanceCircle(sim, 8);
    sim.state.vx = NaN;
    advanceCircle(sim, 1);
    expect(sim.message).toContain('Sim reset');
    expect(sim.state).toEqual({ t: 0, x: 1, y: 0, vx: 0, vy: 2, released: false });
  });
  it('after 2 consecutive resets it falls back to the default speed', () => {
    const sim = createCircleSim(base, null);
    setCircleSpeed(sim, 4);
    for (let i = 0; i < 3; i++) {
      sim.state.vx = NaN;
      advanceCircle(sim, 1);
    }
    expect(sim.params.speed).toBe(2);
  });
  it('speed changes in 0.1 m/s steps, clamped to 0.5..6, and restarts', () => {
    const sim = createCircleSim(base, null);
    advanceCircle(sim, 8);
    setCircleSpeed(sim, 2.1000000001);
    expect(sim.params.speed).toBe(2.1);
    expect(sim.state.t).toBe(0);
    setCircleSpeed(sim, 99);
    expect(sim.params.speed).toBe(6);
    setCircleSpeed(sim, 0.1);
    expect(sim.params.speed).toBe(0.5);
  });
  it('rejects more than 8 steps per frame', () => {
    expect(() => { advanceCircle(createCircleSim(base, null), 9); }).toThrow();
  });
});

describe('circle readouts and description', () => {
  it('on the string: v, r, T = 2πr/v, v²/r, tension m v²/r with units', () => {
    const sim = createCircleSim(base, null);
    expect(circleReadout(sim.state, base)).toEqual([
      { label: 'Speed', value: '2.00 m/s' },
      { label: 'Distance from post r', value: '1.00 m' },
      { label: 'Period T = 2πr/v', value: '3.14 s' },
      { label: 'Acceleration v²/r (toward post)', value: '4.00 m/s²' },
      { label: 'Tension', value: '2.00 N' },
      { label: 'Net force', value: '2.00 N' },
      { label: 'String', value: 'attached' },
    ]);
  });
  it('after the cut: no tension, no acceleration, same speed, growing r', () => {
    const sim = createCircleSim(base, 0);
    for (let i = 0; i < 30; i++) advanceCircle(sim, 8);
    const rows = circleReadout(sim.state, base);
    expect(rows.find((r) => r.label === 'Speed')?.value).toBe('2.00 m/s');
    expect(rows.find((r) => r.label === 'Tension')?.value).toBe('0.00 N');
    expect(rows.find((r) => r.label === 'Acceleration')?.value).toBe('0.00 m/s²');
    expect(rows.find((r) => r.label === 'String')?.value).toBe('cut');
    expect(rows.find((r) => r.label === 'Distance from post r')?.value).toBe(`${Math.hypot(1, 2).toFixed(2)} m`);
  });
  it('description names the tension, the net force and the motion', () => {
    const text = describeCircle(createCircleSim(base, null).state, base);
    expect(text).toContain('tension, 2.00 N, pulls toward the post and is the net force');
    expect(text).toContain('4.00 m/s²');
    const cut = createCircleSim(base, 0);
    advanceCircle(cut, 8);
    expect(describeCircle(cut.state, base)).toContain('No horizontal force acts');
    expect(describeCircle(cut.state, base)).toContain('straight line along the tangent');
  });
});

describe('CircleSimView', () => {
  afterEach(() => { document.body.innerHTML = ''; });
  function mount(releaseAt: number | null, locked = false): HTMLElement {
    const root = document.createElement('div');
    document.body.append(root);
    void act(() => { render(h(CircleSimView, { params: base, releaseAt, label: 'Circle', locked }), root); });
    return root;
  }
  const stringRow = (root: HTMLElement) => Array.from(root.querySelectorAll('.readout div')).find((d) => d.querySelector('dt')?.textContent === 'String')?.querySelector('dd')?.textContent;
  const press = (root: HTMLElement, key: string) => { void act(() => { root.querySelector('.sim-stage')?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); }); };
  it('C cuts the string when the learner controls the cut', () => {
    const root = mount(null);
    expect(stringRow(root)).toBe('attached');
    press(root, 'c');
    expect(stringRow(root)).toBe('cut');
  });
  it('C does nothing while locked or when the cut is automatic', () => {
    const locked = mount(null, true);
    press(locked, 'c');
    expect(stringRow(locked)).toBe('attached');
    const auto = mount(1);
    press(auto, 'C');
    expect(stringRow(auto)).toBe('attached');
  });
  it('arrow up while paused raises the speed by 0.1 m/s', () => {
    const root = mount(null);
    press(root, 'ArrowUp');
    expect(root.textContent).toContain('2.10 m/s');
  });
});
