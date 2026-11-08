import { invariant } from '../lib/invariant';
import { inclineContact, type InclineParams, type InclineState } from '../physics/incline';
import { fmt, type Readout } from './describe';
import { angleDegrees } from './inclineController';

/** Below this a speed (m/s) or acceleration (m/s²) reads as zero. */
const ZERO = 0.005;

/** "down the slope" / "up the slope" for a signed along-slope value (+ = down), or "" for ~0. */
function slopeWay(x: number): string {
  invariant(Number.isFinite(x), 'along-slope value must be finite');
  if (Math.abs(x) < ZERO) return '';
  return x > 0 ? ' down the slope' : ' up the slope';
}

/** Live numbers: each force in N, the acceleration and the velocity (council condition 5). */
export function inclineReadout(state: InclineState, p: InclineParams): Readout[] {
  const c = inclineContact(state, p);
  invariant(c.normal > 0, 'normal force is positive');
  const rows: Readout[] = [
    { label: 'Slope angle', value: `${fmt(angleDegrees(p), 1)}°` },
    { label: 'Normal force', value: `${fmt(c.normal)} N` },
    { label: 'Friction', value: `${fmt(Math.abs(c.friction))} N ${c.frictionKind}${slopeWay(c.friction)}` },
    { label: 'Gravity along slope', value: `${fmt(c.gravityAlong)} N down the slope` },
  ];
  if (c.stop !== 0) rows.push({ label: 'Push from the stop', value: `${fmt(Math.abs(c.stop))} N up the slope` });
  rows.push(
    { label: 'Acceleration', value: `${fmt(Math.abs(c.accel))} m/s²${slopeWay(c.accel)}` },
    { label: 'Velocity', value: `${fmt(Math.abs(state.v))} m/s${slopeWay(state.v)}` },
  );
  invariant(Number.isFinite(c.accel), 'acceleration must be finite');
  return rows;
}

function motionPhrase(state: InclineState, accel: number): string {
  invariant(Number.isFinite(state.v), 'velocity must be finite');
  invariant(Number.isFinite(accel), 'acceleration must be finite');
  const speed = Math.abs(state.v);
  if (speed < ZERO) return Math.abs(accel) < ZERO ? 'at rest' : 'at rest for an instant, starting to slide down the slope';
  const trend = Math.abs(accel) < ZERO ? 'at a steady speed' : accel * state.v > 0 ? 'and speeding up' : 'and slowing down';
  return `moving${slopeWay(state.v)} at ${fmt(speed)} m/s ${trend}`;
}

function frictionPhrase(friction: number, kind: 'static' | 'kinetic', maxStatic: number): string {
  invariant(maxStatic >= 0, 'maximum static friction is non-negative');
  invariant(Number.isFinite(friction), 'friction must be finite');
  const mag = fmt(Math.abs(friction));
  if (Math.abs(friction) < ZERO) return 'no friction';
  if (kind === 'kinetic') return `kinetic friction ${mag} N${slopeWay(friction)}, opposing the motion`;
  return `static friction ${mag} N${slopeWay(friction)} (it can give at most ${fmt(maxStatic)} N)`;
}

/** A plain-language description for screen readers that names the forces and the motion. */
export function describeIncline(state: InclineState, p: InclineParams): string {
  const c = inclineContact(state, p);
  invariant(c.normal > 0, 'normal force is positive');
  const where = state.s >= p.length ? 'at the bottom, against the stop' : state.s <= 0 ? 'at the top' : `${fmt(state.s)} m down from the top`;
  const stop = c.stop !== 0 ? ` The stop at the bottom pushes ${fmt(Math.abs(c.stop))} N up the slope.` : '';
  const net = Math.abs(c.accel) < ZERO
    ? 'The forces balance: the net force is zero.'
    : `Net force ${fmt(Math.abs(p.m * c.accel))} N${slopeWay(c.accel)}, so the acceleration is ${fmt(Math.abs(c.accel))} m/s²${slopeWay(c.accel)}.`;
  const text = `A ${fmt(p.m, 1)} kg block on a ${fmt(angleDegrees(p), 1)}° slope, ${where}, ${motionPhrase(state, c.accel)}. `
    + `Forces on it: gravity ${fmt(p.m * p.g)} N straight down (${fmt(c.gravityAlong)} N of it along the slope), `
    + `the normal force ${fmt(c.normal)} N from the slope, and ${frictionPhrase(c.friction, c.frictionKind, p.muS * c.normal)}.${stop} ${net}`;
  invariant(text.length > 0, 'description must not be empty');
  return text;
}
