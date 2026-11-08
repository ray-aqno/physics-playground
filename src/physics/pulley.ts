import { assertFinite, invariant } from '../lib/invariant';
import { netForce, type ForceVec } from './forces';

/**
 * Two blocks joined by an ideal string over an ideal pulley (Unit N: coupled objects).
 *   mode 'atwood': block 1 hangs on the left, block 2 on the right.
 *   mode 'table':  block 1 sits on a table (friction μs, μk) and the string runs over a pulley at
 *                  the table's right edge down to block 2, which hangs.
 * Single coordinate x = how far block 2 has moved DOWN (m); block 1 moves the same distance
 * (up for Atwood, right for the table). The system always starts at rest at x = 0.
 *
 * To implement (owned by the pulley author):
 *   stepPulley(state, p, dt): constant acceleration from rest; stop when |x| reaches p.travel.
 *   pulleyAcceleration(p): signed acceleration of block 2 (m/s², + = down); 0 when static
 *     friction holds the table block.
 *   pulleyTension(state, p): string tension (N) — while moving, while held, and after stopping.
 *   pulleyForces(state, p): { block1, block2 } free-body ForceVec[] in world coordinates
 *     (x right, y up), each with one 'net' entry equal to that block's m × a.
 */
export interface PulleyParams {
  readonly mode: 'atwood' | 'table';
  readonly m1: number;
  readonly m2: number;
  /** Table friction (ignored for Atwood). */
  readonly muS: number;
  readonly muK: number;
  readonly g: number;
  /** How far the blocks can move before block 2 reaches the floor (m). */
  readonly travel: number;
}

export interface PulleyState {
  /** Distance block 2 has moved down (m). */
  x: number;
  v: number;
  t: number;
}

/** Relative slack so decimal inputs exactly at the static limit (e.g. m2 = μs m1) count as held. */
const STATIC_LIMIT_SLACK = 1e-9;

export interface PulleyForces {
  readonly block1: readonly ForceVec[];
  readonly block2: readonly ForceVec[];
}

/** Throws InvariantError for impossible or out-of-range parameters. */
export function checkPulleyParams(p: PulleyParams): void {
  invariant(Number.isFinite(p.m1 + p.m2 + p.g + p.travel + p.muS + p.muK), 'pulley parameters must be finite');
  invariant(p.m1 > 0 && p.m2 > 0 && p.m1 <= 100 && p.m2 <= 100, 'masses must be in (0, 100] kg');
  invariant(p.g > 0 && p.g <= 30, 'g must be in (0, 30] m/s²');
  invariant(p.travel > 0 && p.travel <= 10, 'travel must be in (0, 10] m');
  invariant(p.muK >= 0 && p.muS >= 0 && p.muS <= 2, 'friction coefficients must be in [0, 2]');
  invariant(p.muK <= p.muS, 'kinetic friction μk cannot exceed static friction μs');
}

/** Table mode: true when static friction can hold block 1 against block 2's weight (m2 g ≤ μs m1 g). */
export function pulleyHeld(p: PulleyParams): boolean {
  checkPulleyParams(p);
  invariant(p.mode === 'table', 'only the table block can be held by friction');
  assertFinite(p.muS * p.m1, 'static friction limit');
  return p.m2 <= p.muS * p.m1 * (1 + STATIC_LIMIT_SLACK);
}

/**
 * Signed acceleration of block 2 from rest (m/s², + = down) before anything reaches the floor.
 *   Atwood: a = (m2 − m1) g / (m1 + m2).
 *   Table:  0 if static friction holds, else a = (m2 − μk m1) g / (m1 + m2).
 */
export function pulleyAcceleration(p: PulleyParams): number {
  checkPulleyParams(p);
  const total = p.m1 + p.m2;
  invariant(total > 0, 'total mass must be positive');
  if (p.mode === 'atwood') return ((p.m2 - p.m1) * p.g) / total;
  if (pulleyHeld(p)) return 0;
  const a = ((p.m2 - p.muK * p.m1) * p.g) / total;
  invariant(a > 0, 'a table system that slides must speed up toward the floor');
  return a;
}

/** True once a block has reached the floor (|x| = travel); then everything is at rest. */
export function pulleyLanded(state: PulleyState, p: PulleyParams): boolean {
  assertFinite(state.x, 'pulley position');
  invariant(Math.abs(state.x) <= p.travel * (1 + 1e-12), 'blocks cannot move past the floor');
  return Math.abs(state.x) >= p.travel;
}

/** Acceleration of block 2 in this state (m/s², + = down): 0 once landed. */
export function pulleyAccelerationNow(state: PulleyState, p: PulleyParams): number {
  const a = pulleyLanded(state, p) ? 0 : pulleyAcceleration(p);
  assertFinite(a, 'pulley acceleration');
  invariant(Math.abs(a) < p.g, 'a hanging system accelerates slower than free fall');
  return a;
}

/**
 * Exact constant-acceleration step from rest: x += v dt + ½ a dt², v += a dt. When |x| reaches
 * travel the moving block lands, both blocks stop, and the state stays there.
 */
export function stepPulley(state: PulleyState, p: PulleyParams, dt: number): void {
  invariant(dt > 0 && dt <= 1 / 30, 'dt must be in (0, 1/30]');
  assertFinite(state.x + state.v + state.t, 'pulley state');
  const a = pulleyAccelerationNow(state, p);
  state.t += dt;
  if (a === 0) { state.v = 0; return; }
  const x1 = state.x + state.v * dt + 0.5 * a * dt * dt;
  if (Math.abs(x1) >= p.travel) {
    state.x = Math.sign(a) * p.travel;
    state.v = 0;
  } else {
    state.x = x1;
    state.v += a * dt;
  }
  assertFinite(state.x + state.v + state.t, 'pulley state after step');
}

/**
 * String tension (N).
 *   Moving or balanced: T = m2 (g − a)  (equals m1 (g + a) for Atwood, μk m1 g + m1 a on the table).
 *   Held by static friction: T = m2 g.
 *   Landed, Atwood: the block still hanging is at rest, so T = its weight (the lighter block's).
 *   Landed, table: block 1 at rest needs no pull and the floor carries block 2, so the string
 *   goes slack, T = 0 (this choice keeps every force determinate; see pulleyForces).
 */
export function pulleyTension(state: PulleyState, p: PulleyParams): number {
  checkPulleyParams(p);
  let T: number;
  if (!pulleyLanded(state, p)) T = p.m2 * (p.g - pulleyAcceleration(p));
  else if (p.mode === 'table') T = 0;
  else T = (state.x > 0 ? p.m1 : p.m2) * p.g;
  invariant(T >= 0, 'a string can pull but not push');
  assertFinite(T, 'tension');
  return T;
}

/** Appends the 'net' entry m × a and checks that the listed forces really add up to it. */
function withNet(forces: ForceVec[], m: number, ax: number, ay: number): ForceVec[] {
  invariant(m > 0 && forces.length <= 7, 'a block has positive mass and at most 7 forces');
  const sum = netForce(forces);
  const scale = Math.max(1, ...forces.map((f) => Math.hypot(f.fx, f.fy)));
  invariant(Math.hypot(sum.fx - m * ax, sum.fy - m * ay) <= 1e-9 * scale, 'forces must add up to m × a');
  forces.push({ kind: 'net', label: 'Net', fx: m * ax, fy: m * ay });
  return forces;
}

/** Block 2 hangs: weight down, tension up, and the floor's push once it has landed on it. */
function block2Forces(state: PulleyState, p: PulleyParams, T: number, a: number): ForceVec[] {
  const W2 = p.m2 * p.g;
  invariant(T >= 0 && T <= W2 + p.m1 * p.g, 'tension is between 0 and the total weight');
  invariant(Math.abs(a) < p.g, 'block 2 accelerates slower than free fall');
  const f: ForceVec[] = [{ kind: 'gravity', label: 'Gravity', fx: 0, fy: -W2 }];
  if (T > 0) f.push({ kind: 'tension', label: 'Tension', fx: 0, fy: T });
  const onFloor = pulleyLanded(state, p) && state.x > 0;
  if (onFloor) f.push({ kind: 'normal', label: 'Normal', fx: 0, fy: W2 - T });
  return withNet(f, p.m2, 0, -a);
}

/** Atwood block 1 hangs on the other side: it moves up when block 2 moves down. */
function atwoodBlock1Forces(state: PulleyState, p: PulleyParams, T: number, a: number): ForceVec[] {
  const W1 = p.m1 * p.g;
  invariant(p.mode === 'atwood', 'block 1 hangs only in Atwood mode');
  invariant(T >= 0 && T <= W1 + p.m2 * p.g, 'tension is between 0 and the total weight');
  const f: ForceVec[] = [{ kind: 'gravity', label: 'Gravity', fx: 0, fy: -W1 }];
  if (T > 0) f.push({ kind: 'tension', label: 'Tension', fx: 0, fy: T });
  const onFloor = pulleyLanded(state, p) && state.x < 0;
  if (onFloor) f.push({ kind: 'normal', label: 'Normal', fx: 0, fy: W1 - T });
  return withNet(f, p.m1, 0, a);
}

/** Table block 1: weight, table normal, tension to the right, friction to the left. */
function tableBlock1Forces(state: PulleyState, p: PulleyParams, T: number, a: number): ForceVec[] {
  const W1 = p.m1 * p.g;
  invariant(p.mode === 'table', 'block 1 sits on the table only in table mode');
  const f: ForceVec[] = [
    { kind: 'gravity', label: 'Gravity', fx: 0, fy: -W1 },
    { kind: 'normal', label: 'Normal', fx: 0, fy: W1 },
  ];
  if (T > 0) f.push({ kind: 'tension', label: 'Tension', fx: T, fy: 0 });
  const landed = pulleyLanded(state, p);
  const held = !landed && pulleyHeld(p);
  const friction = landed ? 0 : held ? T : p.muK * W1;
  invariant(friction <= p.muS * W1 * (1 + 1e-9), 'friction cannot exceed μs N');
  if (friction > 0) f.push({ kind: 'friction', label: held ? 'Static friction' : 'Kinetic friction', fx: -friction, fy: 0 });
  return withNet(f, p.m1, a, 0);
}

/**
 * Free-body lists for both blocks in world coordinates (x right, y up), each ending in one 'net'
 * entry equal to m × a. Zero-size forces are left out (slack string, frictionless table).
 */
export function pulleyForces(state: PulleyState, p: PulleyParams): PulleyForces {
  checkPulleyParams(p);
  const a = pulleyAccelerationNow(state, p);
  const T = pulleyTension(state, p);
  const block1 = p.mode === 'atwood' ? atwoodBlock1Forces(state, p, T, a) : tableBlock1Forces(state, p, T, a);
  const block2 = block2Forces(state, p, T, a);
  invariant(block1.filter((f) => f.kind === 'net').length === 1, 'block 1 has one net entry');
  invariant(block2.filter((f) => f.kind === 'net').length === 1, 'block 2 has one net entry');
  return { block1, block2 };
}
