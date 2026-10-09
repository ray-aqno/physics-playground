import { assertFinite, invariant } from '../lib/invariant';
import { bodyAt, type Body, type World } from './bodies';

/** Max impacts resolved in one step before giving up (P10 rule 2, arbiter condition 1). */
export const MAX_EVENTS_PER_STEP = 64;

/** Relative approach speeds smaller than this are treated as "not approaching". */
const APPROACH_EPS = 1e-12;

export interface StepReport {
  readonly events: number;
  /** True when MAX_EVENTS_PER_STEP was hit; the sim must reset (SC8). Never throws. */
  readonly capped: boolean;
}

/**
 * Time until disks a and b touch, or null if they never do while moving apart or parallel.
 * Solves |d + w t| = ra + rb for the earliest t >= 0. Overlapping and approaching gives 0.
 */
export function timeOfImpact(a: Body, b: Body): number | null {
  invariant(a !== b, 'timeOfImpact needs two distinct bodies');
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const wx = b.vx - a.vx;
  const wy = b.vy - a.vy;
  const approach = dx * wx + dy * wy;
  if (approach >= -APPROACH_EPS) return null;
  const qa = wx * wx + wy * wy;
  const reach = a.r + b.r;
  const qc = dx * dx + dy * dy - reach * reach;
  if (qc <= 0) return 0;
  const disc = approach * approach - qa * qc;
  if (disc < 0) return null;
  const t = (-approach - Math.sqrt(disc)) / qa;
  assertFinite(t, 'time of impact');
  return Math.max(0, t);
}

/** Time until body b reaches a wall, and which axis, or null when it is at rest. */
export function timeToWall(b: Body, world: World): { t: number; axis: 'x' | 'y' } | null {
  invariant(world.walls, 'timeToWall called on a world without walls');
  assertFinite(b.vx + b.vy, 'body velocity');
  let best: { t: number; axis: 'x' | 'y' } | null = null;
  if (b.vx > 0) best = { t: Math.max(0, (world.width - b.r - b.x) / b.vx), axis: 'x' };
  if (b.vx < 0) best = { t: Math.max(0, (b.r - b.x) / b.vx), axis: 'x' };
  let ty: number | null = null;
  if (b.vy > 0) ty = Math.max(0, (world.height - b.r - b.y) / b.vy);
  if (b.vy < 0) ty = Math.max(0, (b.r - b.y) / b.vy);
  if (ty !== null && (best === null || ty < best.t)) best = { t: ty, axis: 'y' };
  return best;
}

/** Applies the closed-form impulse along the line of centers with restitution e. */
export function resolveImpulse(a: Body, b: Body, e: number): void {
  invariant(e >= 0 && e <= 1, 'restitution e must be in [0, 1]');
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  invariant(dist > 0, 'cannot resolve an impact between coincident centers');
  const nx = dx / dist;
  const ny = dy / dist;
  const vrel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (vrel >= 0) return;
  const j = (-(1 + e) * vrel) / (1 / a.m + 1 / b.m);
  a.vx -= (j / a.m) * nx;
  a.vy -= (j / a.m) * ny;
  b.vx += (j / b.m) * nx;
  b.vy += (j / b.m) * ny;
  const after = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  invariant(after >= -1e-9 * (Math.abs(vrel) + 1), 'bodies must separate after an impact');
}

/** Reflects b off a wall elastically and records the wall's impulse on the world. */
function bounceOffWall(b: Body, axis: 'x' | 'y', world: World): void {
  invariant(world.walls, 'bounce without walls');
  if (axis === 'x') {
    world.wallImpulseX += -2 * b.m * b.vx;
    b.vx = -b.vx;
  } else {
    world.wallImpulseY += -2 * b.m * b.vy;
    b.vy = -b.vy;
  }
  assertFinite(world.wallImpulseX + world.wallImpulseY, 'wall impulse');
}

type Event = { t: number; i: number; j: number; axis: 'x' | 'y' | null };

/** Finds the earliest impact within `horizon`; j = -1 means a wall event for body i. */
export function findEarliestEvent(world: World, horizon: number): Event | null {
  invariant(horizon >= 0, 'event horizon must be non-negative');
  const n = world.bodies.length;
  invariant(n <= 8, 'too many bodies');
  let best: Event | null = null;
  // bound: n <= 8, so at most 28 pairs
  for (let i = 0; i < n; i++) {
    const a = bodyAt(world, i);
    // bound: n - i - 1 <= 7
    for (let j = i + 1; j < n; j++) {
      const t = timeOfImpact(a, bodyAt(world, j));
      if (t !== null && t <= horizon && (best === null || t < best.t)) best = { t, i, j, axis: null };
    }
    if (world.walls) {
      const w = timeToWall(a, world);
      if (w !== null && w.t <= horizon && (best === null || w.t < best.t)) best = { t: w.t, i, j: -1, axis: w.axis };
    }
  }
  return best;
}

/** Moves every body in a straight line for time t (exact between impacts). */
export function advanceFree(world: World, t: number): void {
  invariant(t >= 0, 'cannot advance by negative time');
  assertFinite(t, 'advance time');
  // bound: bodies.length <= 8
  for (const b of world.bodies) {
    b.x += b.vx * t;
    b.y += b.vy * t;
  }
}

function applyEvent(world: World, ev: Event): void {
  invariant(ev.i >= 0, 'event needs a body');
  invariant(ev.j === -1 || ev.j > ev.i, 'event pair must be ordered');
  const a = bodyAt(world, ev.i);
  if (ev.j === -1) {
    invariant(ev.axis !== null, 'wall event needs an axis');
    bounceOffWall(a, ev.axis, world);
  } else {
    resolveImpulse(a, bodyAt(world, ev.j), world.e);
  }
}

/**
 * Advances the world by dt, resolving impacts in time order. Momentum changes only through
 * recorded wall impulses. If MAX_EVENTS_PER_STEP is hit, returns capped: true without
 * advancing further (never throws on the cap; arbiter condition 1).
 */
export function stepEventDriven(world: World, dt: number): StepReport {
  invariant(dt > 0 && dt <= 1 / 30, 'dt must be in (0, 1/30]');
  invariant(world.bodies.length > 0, 'world has no bodies');
  let remaining = dt;
  // bound: MAX_EVENTS_PER_STEP (64) iterations
  for (let events = 0; events < MAX_EVENTS_PER_STEP; events++) {
    const ev = findEarliestEvent(world, remaining);
    if (ev === null) {
      advanceFree(world, remaining);
      return { events, capped: false };
    }
    advanceFree(world, ev.t);
    applyEvent(world, ev);
    remaining -= ev.t;
  }
  return { events: MAX_EVENTS_PER_STEP, capped: true };
}
