// @vitest-environment happy-dom
import { h, render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import type { Claim, SimSetup } from '../../src/content/types';
import type { InclineParams } from '../../src/physics/incline';
import { describeIncline, inclineReadout } from '../../src/sims/describeIncline';
import { INCLINE_ASPECT, slopeGeometry } from '../../src/sims/drawIncline';
import { InclineSimView } from '../../src/sims/InclineSimView';
import { advanceIncline, angleDegrees, createInclineSim, setInclineAngle } from '../../src/sims/inclineController';
import { runIncline } from '../content/headless-incline';

const deg = (d: number): number => (d * Math.PI) / 180;
const slippery: InclineParams = { m: 2, angle: deg(30), muS: 0.3, muK: 0.2, g: 9.8, length: 5 };
const grippy: InclineParams = { m: 2, angle: deg(20), muS: 0.5, muK: 0.3, g: 9.8, length: 5 };
type InclineSetup = Extract<SimSetup, { sim: 'incline' }>;
const setup = (params: InclineParams, startS: number, startV: number, seconds: number): InclineSetup => ({ sim: 'incline', params, startS, startV, seconds });

const lower: Claim = { kind: 'ends-lower', lower: true };
const notLower: Claim = { kind: 'ends-lower', lower: false };
const others: Claim[] = [
  { kind: 'velocity-sign', body: 0, sign: 0 }, { kind: 'ke-change', change: 'less' }, { kind: 'com-velocity', change: 'same' },
  { kind: 'max-height', relation: 'lower' }, { kind: 'pulley-direction', sign: 0 }, { kind: 'tension-vs-weight', relation: 'equal' },
  { kind: 'release-path', path: 'tangent' },
];

describe('incline headless claim runner', () => {
  it('ends-lower: true when launched up a slope too steep to hold it (it slides back past the start)', () => {
    const holds = runIncline(setup(slippery, 3, -2, 3));
    expect(holds(lower)).toBe(true);
    expect(holds(notLower)).toBe(false);
  });
  it('ends-lower: false when launched up a slope that holds it (it stops above the start and stays)', () => {
    const holds = runIncline(setup(grippy, 3, -2, 3));
    expect(holds(lower)).toBe(false);
    expect(holds(notLower)).toBe(true);
  });
  it('ends-lower: false when released from rest on a slope that holds it (exactly at the limit too)', () => {
    expect(runIncline(setup(grippy, 2, 0, 2))(notLower)).toBe(true);
    expect(runIncline(setup({ ...grippy, angle: Math.atan(0.5) }, 2, 0, 2))(notLower)).toBe(true);
  });
  it('ends-lower: true when sliding down, even if friction slows it to a stop', () => {
    expect(runIncline(setup(slippery, 1, 0, 1))(lower)).toBe(true);
    expect(runIncline(setup({ ...grippy, muK: 0.45 }, 1, 1, 5))(lower)).toBe(true);
  });
  it('every other claim kind is false', () => {
    const holds = runIncline(setup(slippery, 3, -2, 3));
    for (const c of others) expect(holds(c)).toBe(false);
  });
  it('rejects bad setups', () => {
    expect(() => runIncline(setup(slippery, 6, 0, 1))).toThrow();
    expect(() => runIncline(setup(slippery, 1, 0, 0))).toThrow();
    expect(() => runIncline(setup({ ...slippery, muK: 0.5 }, 1, 0, 1))).toThrow();
  });
});

describe('incline sim controller', () => {
  it('runs and moves the block', () => {
    const sim = createInclineSim(slippery, 1, 0);
    advanceIncline(sim, 8);
    expect(sim.state.v).toBeGreaterThan(0);
    expect(sim.message).toBeNull();
  });
  it('a broken state resets to the start with a message', () => {
    const sim = createInclineSim(slippery, 1, -1);
    sim.state.v = NaN;
    advanceIncline(sim, 1);
    expect(sim.message).toContain('Sim reset');
    expect(sim.state).toEqual({ s: 1, v: -1, t: 0 });
  });
  it('after 2 consecutive resets it falls back to the starting setup', () => {
    const sim = createInclineSim(slippery, 1, 0);
    setInclineAngle(sim, 50);
    for (let i = 0; i < 3; i++) {
      sim.state.s = Infinity;
      advanceIncline(sim, 1);
    }
    expect(sim.message).toContain('starting setup');
    expect(sim.params).toBe(slippery);
  });
  it('arrow-key angle changes are 1° steps kept within 5°–60°, and put the block back at its start', () => {
    const sim = createInclineSim(slippery, 1, 0);
    advanceIncline(sim, 8);
    setInclineAngle(sim, angleDegrees(sim.params) + 1);
    expect(angleDegrees(sim.params)).toBeCloseTo(31, 9);
    expect(sim.state).toEqual({ s: 1, v: 0, t: 0 });
    setInclineAngle(sim, 90);
    expect(angleDegrees(sim.params)).toBeCloseTo(60, 9);
    setInclineAngle(sim, 1);
    expect(angleDegrees(sim.params)).toBeCloseTo(5, 9);
  });
  it('rejects more than 8 steps per frame, a start off the slope, and μk > μs', () => {
    expect(() => { advanceIncline(createInclineSim(slippery, 1, 0), 9); }).toThrow();
    expect(() => createInclineSim(slippery, -0.1, 0)).toThrow();
    expect(() => createInclineSim({ ...slippery, muK: 0.4 }, 1, 0)).toThrow();
  });
});

const row = (rows: { label: string; value: string }[], label: string): string | undefined => rows.find((r) => r.label === label)?.value;

describe('incline readouts and description', () => {
  it('held at rest: normal m g cos θ, static friction m g sin θ up the slope, a = v = 0', () => {
    const rows = inclineReadout({ s: 2, v: 0, t: 0 }, grippy);
    expect(row(rows, 'Slope angle')).toBe('20.0°');
    expect(row(rows, 'Normal force')).toBe('18.42 N'); // 2 × 9.8 × cos 20°
    expect(row(rows, 'Friction')).toBe('6.70 N static up the slope'); // 2 × 9.8 × sin 20°
    expect(row(rows, 'Gravity along slope')).toBe('6.70 N down the slope');
    expect(row(rows, 'Acceleration')).toBe('0.00 m/s²');
    expect(row(rows, 'Velocity')).toBe('0.00 m/s');
    expect(row(rows, 'Push from the stop')).toBeUndefined();
  });
  it('moving up: kinetic friction down the slope, a = g(sin θ + μk cos θ) down the slope', () => {
    const rows = inclineReadout({ s: 2, v: -1.5, t: 0 }, slippery);
    expect(row(rows, 'Friction')).toBe('3.39 N kinetic down the slope'); // 0.2 × 16.97
    expect(row(rows, 'Acceleration')).toBe('6.60 m/s² down the slope'); // 9.8 (0.5 + 0.2 × 0.866)
    expect(row(rows, 'Velocity')).toBe('1.50 m/s up the slope');
  });
  it('at the bottom stop the stop push appears and balances the forces', () => {
    const rows = inclineReadout({ s: 5, v: 0, t: 0 }, slippery);
    expect(row(rows, 'Friction')).toBe('5.09 N static up the slope'); // μs N = 0.3 × 16.97
    expect(row(rows, 'Push from the stop')).toBe('4.71 N up the slope'); // 9.80 − 5.09
    expect(row(rows, 'Acceleration')).toBe('0.00 m/s²');
  });
  it('the description names the forces and the motion', () => {
    const text = describeIncline({ s: 2, v: -1.5, t: 0 }, slippery);
    expect(text).toContain('A 2.0 kg block on a 30.0° slope, 2.00 m down from the top, moving up the slope at 1.50 m/s and slowing down.');
    expect(text).toContain('gravity 19.60 N straight down (9.80 N of it along the slope)');
    expect(text).toContain('the normal force 16.97 N from the slope');
    expect(text).toContain('kinetic friction 3.39 N down the slope, opposing the motion');
    expect(text).toContain('Net force 13.19 N down the slope, so the acceleration is 6.60 m/s² down the slope.');
  });
  it('the description of a held block says static friction and that the forces balance', () => {
    const text = describeIncline({ s: 2, v: 0, t: 0 }, grippy);
    expect(text).toContain('at rest');
    expect(text).toContain('static friction 6.70 N up the slope (it can give at most 9.21 N)');
    expect(text).toContain('The forces balance');
    expect(describeIncline({ s: 5, v: 0, t: 0 }, slippery)).toContain('The stop at the bottom pushes 4.71 N up the slope.');
  });
});

describe('incline drawing geometry', () => {
  for (const d of [5, 30, 60, 80]) {
    it(`at ${d}° the slope fits a 360 px canvas and the block is at least 28 px`, () => {
      const p = { ...slippery, angle: deg(d) };
      const geo = slopeGeometry(360, 360 * INCLINE_ASPECT, p);
      // The block at the bottom (its far corner) and at the top stays inside a 16 px margin.
      expect(geo.x0 + geo.lengthPx * Math.cos(p.angle) + geo.block * Math.sin(p.angle)).toBeLessThanOrEqual(360 - 16 + 1e-9);
      expect(geo.y0 - geo.block * Math.cos(p.angle)).toBeGreaterThanOrEqual(16 - 1e-9);
      expect(geo.block).toBeGreaterThanOrEqual(28);
      expect(geo.pxPerM * p.length + geo.block).toBeCloseTo(geo.lengthPx, 9);
    });
  }
});

describe('InclineSimView', () => {
  afterEach(() => { document.body.innerHTML = ''; });
  async function mount(locked = false): Promise<HTMLElement> {
    const root = document.createElement('div');
    document.body.append(root);
    await act(() => { render(h(InclineSimView, { params: grippy, startS: 2, startV: 0, label: 'Incline', locked }), root); });
    return root;
  }
  const angle = (root: HTMLElement): string | undefined => [...root.querySelectorAll('.readout div')].find((d) => d.querySelector('dt')?.textContent === 'Slope angle')?.querySelector('dd')?.textContent ?? undefined;
  const press = async (root: HTMLElement, key: string): Promise<void> => {
    await act(() => { root.querySelector('.sim-stage')?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); });
  };
  it('shows the readout and description, and arrow keys change the angle by 1° while paused', async () => {
    const root = await mount();
    expect(angle(root)).toBe('20.0°');
    expect(root.querySelector('figcaption')?.textContent).toContain('static friction');
    await press(root, 'ArrowUp');
    expect(angle(root)).toBe('21.0°');
    await press(root, 'ArrowLeft');
    await press(root, 'ArrowLeft');
    expect(angle(root)).toBe('19.0°');
  });
  it('Reset restores the setup from the props', async () => {
    const root = await mount();
    await press(root, 'ArrowUp');
    await press(root, 'r');
    expect(angle(root)).toBe('20.0°');
  });
  it('arrow keys do nothing while locked', async () => {
    const root = await mount(true);
    await press(root, 'ArrowUp');
    expect(angle(root)).toBe('20.0°');
  });
});
