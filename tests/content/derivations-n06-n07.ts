/**
 * Second, independent derivations for n06-n07 answer keys. SI units.
 * Each takes a different route from the lesson's worked solution: horizontal/vertical axes
 * instead of tilted ones, a dot product instead of components, energy instead of kinematics,
 * per-object simultaneous equations instead of a whole-system shortcut, and numerical
 * integration instead of a closed form.
 */
const G = 9.8;
const rad = (d: number): number => (d * Math.PI) / 180;

/** Solves [[a, b], [c, d]] [x, y] = [e, f] by Cramer's rule. */
function solve2(a: number, b: number, c: number, d: number, e: number, f: number): [number, number] {
  const det = a * d - b * c;
  return [(e * d - b * f) / det, (a * f - e * c) / det];
}

export const N06_N07_DERIVATIONS: Readonly<Record<string, () => readonly number[]>> = {
  // Dot product: gravity <0, -g> per unit mass (x horizontal, y up) onto the uphill unit
  // vector <cos 15°, sin 15°>; the normal force is perpendicular to it and adds nothing.
  'n06.q2': () => {
    const t = rad(15);
    return [0 * Math.cos(t) + -G * Math.sin(t)];
  },
  // Horizontal/vertical axes with m = 1 kg: unknowns N and f. Surface normal <sin θ, cos θ>,
  // friction up the slope <-cos θ, sin θ>. Balance x and y, solve, then μk = f / N.
  'n06.q3': () => {
    const t = rad(20);
    const [n, f] = solve2(Math.sin(t), -Math.cos(t), Math.cos(t), Math.sin(t), 0, G);
    return [f / n];
  },
  // Work-energy: ½ m v² = m g h - μk (m g cos θ) d, with drop h = d sin θ (m = 2.0 kg).
  'n06.q4': () => {
    const m = 2;
    const d = 3;
    const t = rad(30);
    const work = m * G * d * Math.sin(t) - 0.2 * m * G * Math.cos(t) * d;
    return [Math.sqrt((2 * work) / m)];
  },
  // Euler-step dv/dt = g - (C ρ A / 2m) v² for 120 s (≈ 28 time constants); the fixed point
  // of the update is exactly where drag balances weight.
  'n06.q6': () => {
    const k = (1.0 * 1.2 * 0.7) / 2 / 75;
    const dt = 0.001;
    let v = 0;
    for (let i = 0; i < 120000; i++) v += (G - k * v * v) * dt;
    return [v];
  },
  // Per-object simultaneous equations (unknowns a and F): A: 3a + F = 15, B: 2a - F = 0.
  'n07.q1': () => [solve2(3, 1, 2, -1, 15, 0)[1]],
  // Energy: after the heavy block falls d, ½ (m1 + m2) v² = (m1 - m2) g d, then a = v² / (2d).
  'n07.q3': () => {
    const d = 1;
    const v2 = (2 * (3 - 2) * G * d) / (3 + 2);
    return [v2 / (2 * d)];
  },
  // Per-object simultaneous equations on the heavy block and the light block (unknowns a, T):
  // 3a + T = 3g and 2a - T = -2g; Cramer gives T (= 2 m1 m2 g / (m1 + m2)).
  'n07.q5': () => [solve2(3, 1, 2, -1, 3 * G, -2 * G)[1]],
  // Per-object simultaneous equations (unknowns a, T): table block 4a - T = -μk(4)g,
  // hanging block 2a + T = 2g; read T off Cramer instead of the whole-system shortcut.
  'n07.q6': () => [solve2(4, -1, 2, 1, -0.25 * 4 * G, 2 * G)[1]],
};
