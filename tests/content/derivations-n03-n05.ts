/**
 * Second, independent derivations for n03-n05 answer keys. SI units.
 * Each takes a different route from the lesson's worked solution: momentum rates instead of
 * F = m a, work-energy instead of kinematics, polar instead of components, a general 2x2 solve
 * instead of substitution, numerical minimization or bisection instead of a closed form.
 */
const G = 9.8;
const rad = (d: number): number => (d * Math.PI) / 180;

/** Solves [[a, b], [c, d]] [x, y] = [e, f] by Cramer's rule. */
function solve2(a: number, b: number, c: number, d: number, e: number, f: number): [number, number] {
  const det = a * d - b * c;
  return [(e * d - b * f) / det, (a * f - e * c) / det];
}

export const N03_N05_DERIVATIONS: Readonly<Record<string, () => readonly number[]>> = {
  // Momentum-transfer view (N1): dp/dt by central difference on p(t) = m v(t), then F_N = dp/dt + m g
  'n03.q2': () => {
    const p = (t: number): number => 60 * (3.0 - 1.5 * t);
    const h = 1e-3;
    const dpdt = (p(1 + h) - p(1 - h)) / (2 * h);
    return [dpdt + 60 * G];
  },
  // Polar: |F| = m |Δv| / Δt along the direction of Δv, then back to components
  'n03.q4': () => {
    const size = (2 * Math.hypot(2, -4)) / 0.5;
    const dir = Math.atan2(-4, 2);
    return [size * Math.cos(dir), size * Math.sin(dir)];
  },
  // Work-energy over the 2.0 s: distance from average speed, then W_friction = ΔK - W_rope
  'n03.q5': () => {
    const d = ((1 + 3) / 2) * 2;
    const dK = 0.5 * 5 * (3 ** 2 - 1 ** 2);
    return [(dK - 25 * d) / d];
  },
  // Impulse gives the final speed, then work-energy gives the distance: F d = ½ m v²
  'n04.q2': () => {
    const v = (3000 * 4) / 1200;
    return [(0.5 * 1200 * v ** 2) / 3000];
  },
  // Time route: solve -20 = 7 t - 4.9 t² for the positive root, then v = v₀ - g t
  'n04.q3': () => {
    const t = (7 + Math.sqrt(7 ** 2 + 4 * 4.9 * 20)) / (2 * 4.9);
    return [7 - G * t];
  },
  // Generic stepper with up as positive and signed drag +c v|v| opposing motion; report -v_up
  'n04.q5': () => {
    let vUp = 0;
    for (let i = 0; i < 2; i++) {
      const fUp = -1.0 * G - 0.1 * vUp * Math.abs(vUp);
      vUp += (fUp / 1.0) * 0.5;
    }
    return [-vUp];
  },
  // Work-energy with each force's work separately: W_T + W_g = ½ m v²
  'n04.q6': () => {
    const work = 29.6 * 2.5 - 2 * G * 2.5;
    return [Math.sqrt((2 * work) / 2)];
  },
  // Both tensions as unknowns (not assuming symmetry), solved as a 2x2 system
  'n05.q1': () => {
    const c = Math.cos(rad(30));
    const s = Math.sin(rad(30));
    return [solve2(-c, c, s, s, 0, 10 * G)[0]];
  },
  // Energy: equilibrium minimizes U(x) = ½ k x² - m g x; ternary search on [0, 1] m
  'n05.q4': () => {
    const u = (x: number): number => 0.5 * 49 * x * x - 0.5 * G * x;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 200; i++) {
      const m1 = lo + (hi - lo) / 3;
      const m2 = hi - (hi - lo) / 3;
      if (u(m1) < u(m2)) hi = m2;
      else lo = m1;
    }
    return [(lo + hi) / 2];
  },
  // Bisection on the stay-at-rest condition k x ≤ μs m g
  'n05.q5': () => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (98 * mid <= 0.4 * 5 * G) lo = mid;
      else hi = mid;
    }
    return [lo];
  },
  // Simultaneous 2x2 solve for [T, F_N]: T cos θ - μk F_N = 0, T sin θ + F_N = m g
  'n05.q6': () => [solve2(Math.cos(rad(30)), -0.4, Math.sin(rad(30)), 1, 0, 20 * G)[0]],
};
