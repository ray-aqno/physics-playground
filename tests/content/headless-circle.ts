import type { Claim, SimSetup } from '../../src/content/types';
import { createCircleState, stepCircleTimed, type ReleaseSnapshot } from '../../src/physics/circle';
import { PHYSICS_DT } from '../../src/physics/fixedStep';
import { invariant } from '../../src/lib/invariant';

/** Max distance (m) from the release tangent line for the path to count as straight. */
export const LINE_TOL = 1e-6;

export type ReleasePath = 'tangent' | 'outward' | 'curved';

/**
 * Classifies the path after the cut, given the release snapshot and later positions:
 *   'tangent' if every point lies within LINE_TOL of the line through the release point along the
 *             release velocity, and the puck moves along +v;
 *   'outward' if every point lies within LINE_TOL of the radial line through the release point,
 *             moving away from the post;
 *   'curved'  otherwise.
 */
export function classifyReleasePath(rel: ReleaseSnapshot, later: readonly { readonly x: number; readonly y: number }[]): ReleasePath {
  invariant(later.length >= 1 && later.length <= 100_000, 'need 1..100000 positions after the cut');
  const v = Math.hypot(rel.vx, rel.vy);
  const r = Math.hypot(rel.x, rel.y);
  invariant(v > 0 && r > 0, 'release needs a moving puck away from the post');
  const [tx, ty] = [rel.vx / v, rel.vy / v];
  const [nx, ny] = [rel.x / r, rel.y / r];
  let tangent = true;
  let outward = true;
  // bound: later.length <= 100000
  for (const p of later) {
    const dx = p.x - rel.x;
    const dy = p.y - rel.y;
    const alongT = dx * tx + dy * ty;
    const alongN = dx * nx + dy * ny;
    if (Math.abs(alongN) >= LINE_TOL || alongT < 0) tangent = false;
    if (Math.abs(alongT) >= LINE_TOL || alongN < 0) outward = false;
  }
  const last = later[later.length - 1];
  const moved = last === undefined ? 0 : Math.hypot(last.x - rel.x, last.y - rel.y);
  if (moved <= LINE_TOL) return 'curved';
  return tangent ? 'tangent' : outward ? 'outward' : 'curved';
}

/** Runs the circle physics headless for setup.seconds and evaluates 'release-path' claims. */
export function runCircle(setup: Extract<SimSetup, { sim: 'circle' }>): (claim: Claim) => boolean {
  invariant(setup.seconds > 0 && setup.seconds <= 60, 'run length must be in (0, 60] s');
  invariant(setup.releaseAt >= 0 && setup.releaseAt < setup.seconds - 0.1, 'the string must be cut at least 0.1 s before the run ends');
  const state = createCircleState(setup.params);
  const steps = Math.round(setup.seconds / PHYSICS_DT);
  let rel: ReleaseSnapshot | null = null;
  const later: { x: number; y: number }[] = [];
  // bound: steps <= 60 s / PHYSICS_DT = 14400
  for (let i = 0; i < steps; i++) {
    const snap = stepCircleTimed(state, setup.params, PHYSICS_DT, setup.releaseAt);
    if (snap !== null) rel = snap;
    if (rel !== null) later.push({ x: state.x, y: state.y });
  }
  invariant(rel !== null, 'the string was cut during the run');
  const path = classifyReleasePath(rel, later);
  return (claim) => claim.kind === 'release-path' && claim.path === path;
}
