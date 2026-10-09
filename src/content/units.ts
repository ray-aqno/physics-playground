import { quantity, type Dims, type Quantity } from '../checker/dims';

/** Named SI dimensions for answer keys: [m, kg, s, A, K, mol, cd] exponents. */
export const D = {
  none: [0, 0, 0, 0, 0, 0, 0],
  length: [1, 0, 0, 0, 0, 0, 0],
  mass: [0, 1, 0, 0, 0, 0, 0],
  time: [0, 0, 1, 0, 0, 0, 0],
  velocity: [1, 0, -1, 0, 0, 0, 0],
  acceleration: [1, 0, -2, 0, 0, 0, 0],
  force: [1, 1, -2, 0, 0, 0, 0],
  momentum: [1, 1, -1, 0, 0, 0, 0],
  energy: [2, 1, -2, 0, 0, 0, 0],
  power: [2, 1, -3, 0, 0, 0, 0],
  angularMomentum: [2, 1, -1, 0, 0, 0, 0],
  inertia: [2, 1, 0, 0, 0, 0, 0],
  angularVelocity: [0, 0, -1, 0, 0, 0, 0],
  springConstant: [0, 1, -2, 0, 0, 0, 0],
  heatCapacity: [2, 0, -2, 0, -1, 0, 0],
  temperature: [0, 0, 0, 0, 1, 0, 0],
} as const satisfies Record<string, Dims>;

/** Shorthand for an SI answer key. */
export function q(value: number | readonly number[], dims: Dims): Quantity {
  return quantity(value, dims);
}

/** Converts degrees to radians for angle answer keys. */
export function deg(d: number): number {
  return (d * Math.PI) / 180;
}
