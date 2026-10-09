import { invariant, InvariantError } from '../lib/invariant';
import { createWorld, type World, type WorldSpec } from '../physics/bodies';
import { stepEventDriven } from '../physics/collisions';
import { stepRamp, type RampParams, type RampState } from '../physics/energyRamp';
import { PHYSICS_DT } from '../physics/fixedStep';

/** After this many resets in a row, fall back to the default preset (SC21). */
export const MAX_CONSECUTIVE_RESETS = 2;
const MIN_GAP = 0.01;

export interface BodiesSim {
  world: World;
  /** The setup the sim restarts from: the last one the learner started running (SC8). */
  lastValid: WorldSpec;
  readonly defaultPreset: WorldSpec;
  resets: number;
  message: string | null;
}

export interface RampSim {
  readonly params: RampParams;
  state: RampState;
  startS: number;
  readonly defaultStartS: number;
  resets: number;
  message: string | null;
}

export function createBodiesSim(preset: WorldSpec): BodiesSim {
  invariant(preset.bodies.length >= 1, 'a sim needs bodies');
  const sim: BodiesSim = { world: createWorld(preset), lastValid: preset, defaultPreset: preset, resets: 0, message: null };
  invariant(sim.world.bodies.length === preset.bodies.length, 'world matches preset');
  return sim;
}

/** Snapshot of the current world as a spec (used when the learner presses play after editing). */
export function worldToSpec(world: World): WorldSpec {
  invariant(world.bodies.length >= 1, 'world needs bodies');
  const spec: WorldSpec = { width: world.width, height: world.height, walls: world.walls, e: world.e, bodies: world.bodies.map((b) => ({ x: b.x, y: b.y, vx: b.vx, vy: b.vy, m: b.m, r: b.r })) };
  invariant(spec.bodies.length === world.bodies.length, 'every body copied');
  return spec;
}

function resetBodies(sim: BodiesSim, why: string): void {
  invariant(why.length > 0, 'reset needs a reason');
  sim.resets += 1;
  const useDefault = sim.resets > MAX_CONSECUTIVE_RESETS;
  sim.world = createWorld(useDefault ? sim.defaultPreset : sim.lastValid);
  if (useDefault) { sim.lastValid = sim.defaultPreset; sim.resets = 0; }
  sim.message = useDefault ? `${why} Back to the starting setup.` : `${why} Sim reset.`;
}

/**
 * Runs `steps` physics steps. A step that hits the event cap (SC8) or breaks an invariant (SC9)
 * resets the sim with a message instead of freezing or continuing with bad numbers.
 */
export function advanceBodies(sim: BodiesSim, steps: number): void {
  invariant(Number.isInteger(steps) && steps >= 0 && steps <= 8, 'steps per frame must be 0..8');
  invariant(sim.world.bodies.length >= 1, 'sim has bodies');
  // bound: steps <= MAX_SUBSTEPS (8)
  for (let i = 0; i < steps; i++) {
    try {
      const r = stepEventDriven(sim.world, PHYSICS_DT);
      if (r.capped) { resetBodies(sim, 'Too many simultaneous contacts.'); return; }
    } catch (e) {
      if (!(e instanceof InvariantError)) throw e;
      resetBodies(sim, 'The numbers went out of range.');
      return;
    }
  }
  if (steps > 0) sim.resets = 0;
}

/** Learner pressed play: remember this setup as the one to reset to. */
export function markRunning(sim: BodiesSim): void {
  invariant(sim.world.bodies.length >= 1, 'sim has bodies');
  sim.lastValid = worldToSpec(sim.world);
  sim.message = null;
  invariant(sim.lastValid.bodies.length === sim.world.bodies.length, 'snapshot complete');
}

/**
 * Moves body `index` to (x, y), kept inside the box and at least MIN_GAP from every other body.
 * If the spot overlaps, the body is nudged out along the line between centers (SC8).
 */
export function placeBody(sim: BodiesSim, index: number, x: number, y: number): void {
  const w = sim.world;
  const b = w.bodies[index];
  invariant(b !== undefined, 'no body at that index');
  invariant(Number.isFinite(x) && Number.isFinite(y), 'position must be finite');
  b.x = Math.min(Math.max(x, b.r), w.width - b.r);
  b.y = Math.min(Math.max(y, b.r), w.height - b.r);
  // bound: bodies.length <= 8
  for (const o of w.bodies) {
    if (o === b) continue;
    const dx = b.x - o.x;
    const dy = b.y - o.y;
    const dist = Math.hypot(dx, dy);
    const need = b.r + o.r + MIN_GAP;
    if (dist >= need) continue;
    const ux = dist > 0 ? dx / dist : 1;
    const uy = dist > 0 ? dy / dist : 0;
    b.x = o.x + ux * need;
    b.y = o.y + uy * need;
  }
}

export function createRampSim(params: RampParams, startS: number): RampSim {
  invariant(Number.isFinite(startS), 'start position must be finite');
  invariant(params.m > 0, 'block mass must be positive');
  return { params, state: { s: startS, v: 0, thermal: 0 }, startS, defaultStartS: startS, resets: 0, message: null };
}

export function resetRamp(sim: RampSim, why: string | null): void {
  sim.state = { s: sim.startS, v: 0, thermal: 0 };
  sim.message = why;
  invariant(sim.state.v === 0, 'reset starts at rest');
  invariant(sim.state.thermal === 0, 'reset clears thermal energy');
}

/** Runs ramp steps; a broken invariant resets to the start (SC9), and to the default after 2 (SC21). */
export function advanceRamp(sim: RampSim, steps: number): void {
  invariant(Number.isInteger(steps) && steps >= 0 && steps <= 8, 'steps per frame must be 0..8');
  invariant(Number.isFinite(sim.state.s), 'ramp state is finite');
  // bound: steps <= MAX_SUBSTEPS (8)
  for (let i = 0; i < steps; i++) {
    try {
      stepRamp(sim.state, sim.params, PHYSICS_DT);
    } catch (e) {
      if (!(e instanceof InvariantError)) throw e;
      sim.resets += 1;
      if (sim.resets > MAX_CONSECUTIVE_RESETS) { sim.startS = sim.defaultStartS; sim.resets = 0; }
      resetRamp(sim, 'The numbers went out of range. Sim reset.');
      return;
    }
  }
}

/** Moves the block's start position (paused only); kept between the squashed spring and 6 m up the track. */
export function setRampStart(sim: RampSim, s: number): void {
  invariant(Number.isFinite(s), 'start must be finite');
  sim.startS = Math.min(Math.max(s, -0.6), sim.params.flatLength + 4);
  resetRamp(sim, null);
  invariant(sim.state.s === sim.startS, 'block moved to the new start');
}
