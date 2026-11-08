import { invariant } from '../lib/invariant';
import { circleForces, type CircleParams, type CircleState } from '../physics/circle';
import { netForce } from '../physics/forces';
import { fmt, type Readout } from './describe';

interface CircleNumbers {
  readonly speed: number;
  readonly dist: number;
  readonly tension: number;
  readonly net: number;
  readonly accel: number;
}

/** Magnitudes read off the motion and the free-body list (a = F_net / m). */
function circleNumbers(state: CircleState, p: CircleParams): CircleNumbers {
  const forces = circleForces(state, p);
  const tension = forces.find((f) => f.kind === 'tension');
  const n = netForce(forces);
  const net = Math.hypot(n.fx, n.fy);
  const nums: CircleNumbers = {
    speed: Math.hypot(state.vx, state.vy),
    dist: Math.hypot(state.x, state.y),
    tension: tension === undefined ? 0 : Math.hypot(tension.fx, tension.fy),
    net,
    accel: net / p.m,
  };
  invariant(Number.isFinite(nums.speed + nums.dist + nums.accel), 'circle readout numbers are finite');
  invariant(state.released === (tension === undefined), 'tension acts exactly while the string is attached');
  return nums;
}

/**
 * Live readout: speed, distance from the post, period 2πr/v, acceleration toward the centre
 * (v²/r on the string, 0 once cut), tension, net force, and whether the string is attached.
 */
export function circleReadout(state: CircleState, p: CircleParams): Readout[] {
  const n = circleNumbers(state, p);
  const rows: Readout[] = [
    { label: 'Speed', value: `${fmt(n.speed)} m/s` },
    { label: 'Distance from post r', value: `${fmt(n.dist)} m` },
    { label: 'Period T = 2πr/v', value: state.released ? 'none (cut)' : `${fmt((2 * Math.PI * p.r) / p.speed)} s` },
    { label: state.released ? 'Acceleration' : 'Acceleration v²/r (toward post)', value: `${fmt(n.accel)} m/s²` },
    { label: 'Tension', value: `${fmt(n.tension)} N` },
    { label: 'Net force', value: `${fmt(n.net)} N` },
    { label: 'String', value: state.released ? 'cut' : 'attached' },
  ];
  invariant(rows.length === 7, 'seven readout rows');
  invariant(rows.every((r) => r.value.length > 0), 'every readout row has a value');
  return rows;
}

/** A plain-language description for screen readers that names the forces and the motion. */
export function describeCircle(state: CircleState, p: CircleParams): string {
  const n = circleNumbers(state, p);
  invariant(p.m > 0, 'puck mass must be positive');
  const vel = `⟨${fmt(state.vx)}, ${fmt(state.vy)}⟩ m/s`;
  const text = state.released
    ? `Seen from above. The string has been cut. No horizontal force acts on the ${fmt(p.m)} kg puck, so the net force is 0 N and it slides in a straight line along the tangent at a constant ${fmt(n.speed)} m/s, velocity ${vel}, now ${fmt(n.dist)} m from the post. Gravity and the ice's normal force are vertical and cancel.`
    : `Seen from above. A ${fmt(p.m)} kg puck on a ${fmt(p.r)} m string circles the post counterclockwise at a steady ${fmt(n.speed)} m/s, velocity ${vel}. The string's tension, ${fmt(n.tension)} N, pulls toward the post and is the net force, so the puck accelerates toward the centre at ${fmt(n.accel)} m/s² while its speed stays the same. Gravity and the ice's normal force are vertical and cancel.`;
  invariant(text.length > 0, 'description must not be empty');
  return text;
}
