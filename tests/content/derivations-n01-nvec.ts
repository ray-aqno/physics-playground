/**
 * Second, independent derivations for n01 and n-vec answer keys. SI units.
 * Each takes a different route from the lesson's worked solution: work-energy instead of
 * F = m a, polar form instead of components, a per-object third-law argument, numerical
 * differentiation instead of symbolic, and a polynomial fit instead of a Δv motion diagram.
 */

/** Solves [[a, b], [c, d]] [x, y] = [e, f] by Cramer's rule. */
function solve2(a: number, b: number, c: number, d: number, e: number, f: number): [number, number] {
  const det = a * d - b * c;
  return [(e * d - b * f) / det, (a * f - e * c) / det];
}

/** Ball position from n-vec: r(t) = ⟨1.5t², 6.0t - 4.9t²⟩ m. */
function ballPos(t: number): [number, number] {
  return [1.5 * t * t, 6.0 * t - 4.9 * t * t];
}

export const N01_NVEC_DERIVATIONS: Readonly<Record<string, () => readonly number[]>> = {
  // Work-energy: distance from the average speed, then F = ΔK / d
  'n01.q2': () => {
    const d = ((10 + 25) / 2) * 6;
    const dK = 0.5 * 1200 * (25 ** 2 - 10 ** 2);
    return [dK / d];
  },
  // Polar: |F_net| / m along the direction of F_net
  'n01.q3': () => {
    const fx = 6 + -2;
    const fy = 0 + 6;
    const mag = Math.hypot(fx, fy) / 4;
    const dir = Math.atan2(fy, fx);
    return [mag * Math.cos(dir), mag * Math.sin(dir)];
  },
  // Per-object, then third law: force on the water over a 0.50 s window (toward the wall +),
  // and the wall feels the opposite
  'n01.q6': () => {
    const dt = 0.5;
    const m = 3.0 * dt;
    const forceOnWater = (m * (0 - 12)) / dt;
    return [Math.abs(-forceOnWater)];
  },
  // Numerical central difference of the position at t = 1.0 s
  'n-vec.q1': () => {
    const h = 1e-3;
    const [x1, y1] = ballPos(1 + h);
    const [x0, y0] = ballPos(1 - h);
    return [(x1 - x0) / (2 * h), (y1 - y0) / (2 * h)];
  },
  // Numerical second difference of the position (at t = 2.0 s; a is constant)
  'n-vec.q2': () => {
    const h = 0.1;
    const [xp, yp] = ballPos(2 + h);
    const [xc, yc] = ballPos(2);
    const [xm, ym] = ballPos(2 - h);
    return [(xp - 2 * xc + xm) / (h * h), (yp - 2 * yc + ym) / (h * h)];
  },
  // Polar: |Δv| = 25 m/s by Pythagoras, pointing 180° - arctan(15/20) from east
  'n-vec.q5': () => {
    const mag = Math.hypot(20, 15) / 5;
    const dir = Math.PI - Math.atan(15 / 20);
    return [mag * Math.cos(dir), mag * Math.sin(dir)];
  },
  // Fit r(t) = r_B + v t + c t² through A (t = -0.5 s) and C (t = +0.5 s), then a = 2c
  'n-vec.q6': () => {
    const fit = (rA: number, rB: number, rC: number): number => {
      const [, c] = solve2(-0.5, 0.25, 0.5, 0.25, rA - rB, rC - rB);
      return 2 * c;
    };
    return [fit(0, 2.0, 4.0), fit(0, 0, 1.0)];
  },
};
