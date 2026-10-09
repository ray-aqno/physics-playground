import { assertFinite, invariant } from '../lib/invariant';

/** Maximum bodies in any sim world (P10 rule 3: fixed pool, allocated at init). */
export const MAX_BODIES = 8;

/** A disk (2-D) or cart (1-D when vy = 0 and all y are equal). SI units. */
export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly m: number;
  readonly r: number;
}

export interface World {
  readonly bodies: Body[];
  readonly width: number;
  readonly height: number;
  /** When true, bodies bounce elastically off the box edges [0,width] x [0,height]. */
  readonly walls: boolean;
  /** Coefficient of restitution for body-body impacts, 0 (sticky) to 1 (elastic). */
  readonly e: number;
  /** Total impulse delivered by the walls so far (kg·m/s); keeps momentum auditable. */
  wallImpulseX: number;
  wallImpulseY: number;
}

export interface BodySpec {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly m: number;
  readonly r: number;
}

export interface WorldSpec {
  readonly bodies: readonly BodySpec[];
  readonly width: number;
  readonly height: number;
  readonly walls: boolean;
  readonly e: number;
}

function checkBody(b: BodySpec, index: number): void {
  invariant(b.m > 0, `body ${index} mass must be positive`);
  invariant(b.r > 0, `body ${index} radius must be positive`);
  assertFinite(b.x + b.y + b.vx + b.vy, `body ${index} state`);
}

/** Builds a world from a spec. All allocation happens here (P10 rule 3). */
export function createWorld(spec: WorldSpec): World {
  invariant(spec.bodies.length >= 1 && spec.bodies.length <= MAX_BODIES, `world needs 1..${MAX_BODIES} bodies`);
  invariant(spec.e >= 0 && spec.e <= 1, 'restitution e must be in [0, 1]');
  invariant(spec.width > 0 && spec.height > 0, 'world size must be positive');
  const bodies: Body[] = [];
  // bound: spec.bodies.length <= MAX_BODIES (8)
  for (let i = 0; i < spec.bodies.length; i++) {
    const s = spec.bodies[i];
    invariant(s !== undefined, 'body spec missing');
    checkBody(s, i);
    bodies.push({ x: s.x, y: s.y, vx: s.vx, vy: s.vy, m: s.m, r: s.r });
  }
  return { bodies, width: spec.width, height: spec.height, walls: spec.walls, e: spec.e, wallImpulseX: 0, wallImpulseY: 0 };
}

/** Index pair helper used by the collision search; avoids allocating per step. */
export function bodyAt(world: World, index: number): Body {
  const b = world.bodies[index];
  invariant(b !== undefined, `no body at index ${index}`);
  invariant(index >= 0 && index < MAX_BODIES, 'body index out of range');
  return b;
}
