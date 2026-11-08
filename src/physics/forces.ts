import { assertFinite, invariant } from '../lib/invariant';

/** What kind of interaction a force arrow stands for; the drawing colours arrows by kind. */
export type ForceKind = 'gravity' | 'normal' | 'friction' | 'tension' | 'net';

/** One force on one object, in world coordinates (x right, y up), in newtons. */
export interface ForceVec {
  readonly kind: ForceKind;
  /** Free-body label, e.g. "Gravity", "Normal", "Static friction", "Tension". */
  readonly label: string;
  readonly fx: number;
  readonly fy: number;
}

/** Vector sum of the non-net forces in a free-body list. */
export function netForce(forces: readonly ForceVec[]): { readonly fx: number; readonly fy: number } {
  invariant(forces.length <= 8, 'a free-body diagram has at most 8 forces');
  let fx = 0;
  let fy = 0;
  // bound: forces.length <= 8
  for (const f of forces) {
    if (f.kind === 'net') continue;
    fx += f.fx;
    fy += f.fy;
  }
  assertFinite(fx + fy, 'net force');
  return { fx, fy };
}
