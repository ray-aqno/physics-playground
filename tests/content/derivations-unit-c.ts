/**
 * Second, independent derivations of every Unit C answer key (council condition 2, SC3).
 * Each takes a different route from the lesson's worked solution: a moving reference frame,
 * a center-of-mass argument, a work-energy route instead of impulse, numerical integration
 * instead of a closed form, and so on. SI units throughout.
 */
const rad = (d: number): number => (d * Math.PI) / 180;

/** Midpoint-rule integral of f over [a, b] with n slices (n fixed, loop bounded). */
function integrate(f: (x: number) => number, a: number, b: number, n = 20000): number {
  const h = (b - a) / n;
  let s = 0;
  for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h);
  return s * h;
}

/** Solves [[a, b], [c, d]] [x, y] = [e, f] by Cramer's rule. */
function solve2(a: number, b: number, c: number, d: number, e: number, f: number): [number, number] {
  const det = a * d - b * c;
  return [(e * d - b * f) / det, (a * f - e * c) / det];
}

export const UNIT_C_DERIVATIONS: Readonly<Record<string, () => readonly number[]>> = {
  // In a frame moving at +4 m/s, then shift back: p = p' + M u
  'c01.q2': () => [2 * (3 - 4) + 1 * (-4 - 4) + 3 * 4],
  // The center of mass stays at the origin: after 2 s, 60 x_s + 3 (16) = 0
  'c01.q3': () => [-(3 * 16) / 60 / 2],
  // Polar: |Δr| / Δt along the direction of Δr
  'c02.q1': () => {
    const speed = Math.hypot(6, -8) / 2;
    const dir = Math.atan2(-8, 6);
    return [speed * Math.cos(dir), speed * Math.sin(dir)];
  },
  'c02.q2': () => [Math.hypot(6, -8) / 2],
  // Polar: 5 m/s at arctan(4/3) north of east
  'c02.q3': () => [5 * Math.cos(Math.atan2(4, 3)), 5 * Math.sin(Math.atan2(4, 3))],
  // Opposite sign convention (toward the bat positive)
  'c03.q1': () => [Math.abs(-0.15 * 30 - 0.15 * 20)],
  // m × (Δv / Δt) = m a
  'c03.q2': () => [0.15 * (50 / 0.0015)],
  // Work-energy: stopping distance from average speed, then F = ΔK / d
  'c03.q3': () => [-(0.5 * 1200 * 25 ** 2) / ((25 / 2) * 5)],
  // Lever balance about the center of mass
  'c04.q2': () => [(3 * 5) / (2 + 3)],
  // v_cm = v1 + (m2/M)(v2 - v1)
  'c04.q3': () => [3 + 0.6 * (0 - 3), 0 + 0.6 * (2 - 0)],
  // Center of mass stays put: positions after 1 s
  'c04.q4': () => [(50 * 1.5) / 75],
  // Impulse balance: 1000 (v - 20) = -1500 v
  'c05.q2': () => [(1000 * 20) / (1000 + 1500)],
  // Impulse balance on the block: 2.0 v = 0.020 (400 - v)
  'c05.q3': () => [(0.02 * 400) / (2.0 + 0.02)],
  // Center of mass at the origin: 1.0 (6, 3) + 3.0 x = 0
  'c05.q4': () => [-6 / 3, -3 / 3],
  // r × p with an explicit position on the path y = -0.5
  'c06.q1': () => [-4 * 0 - -0.5 * (2 * 3)],
  // L = m r² ω with ω = 2π f
  'c06.q2': () => [0.1 * 0.8 ** 2 * (2 * Math.PI * 2)],
  // Numerically integrate the torque over time
  'c06.q3': () => [integrate(() => 0.5, 0, 4, 4000)],
  // In rev/s first, then convert
  'c07.q1': () => [2 * (4 / 1.6) * 2 * Math.PI],
  // ω scales by I_disk / (I_disk + I_child)
  'c07.q2': () => [1.2 / (1 + (40 * 2 ** 2) / 250)],
  // Compute both kinetic energies explicitly and divide
  'c07.q3': () => [(0.5 * 1.6 * (10 * Math.PI) ** 2) / (0.5 * 4 * (4 * Math.PI) ** 2)],
  // K = p² / 2m
  'c08.q2': () => [(1500 * 20) ** 2 / (2 * 1500)],
  // Kinematics: fall time, then v = g t
  'c08.q3': () => [9.8 * Math.sqrt((2 * 12) / 9.8)],
  // Height per kilogram first, then divide by 60
  'c09.q1': () => [17000 / 9.8 / 60],
  'c09.q2': () => [4.2e6 / 3.0e8 / 3.0e8],
  'c09.q3': () => [7.0 * 6.022 * 1e4],
  // Integrate k x dx from 0 to x
  'c10.q2': () => [integrate((x) => 200 * x, 0, 0.15)],
  // Launch speed first, then height from v² = 2 g h
  'c10.q3': () => {
    const v2 = (2 * (0.5 * 400 * 0.05 ** 2)) / 0.1;
    return [v2 / (2 * 9.8)];
  },
  // Integrate the gravitational force G M m / r² from r1 to r2
  'c10.q4': () => [integrate((r) => (6.67e-11 * 5.97e24 * 1000) / r ** 2, 6.37e6, 1.27e7, 200000)],
  // Dot product of force and displacement vectors
  'c11.q1': () => [40 * Math.cos(rad(60)) * 5 + 40 * Math.sin(rad(60)) * 0],
  // Numerical derivative: F = -dU/dx by central difference
  'c11.q2': () => {
    const u = (x: number): number => 3 * x * x;
    const h = 1e-5;
    return [-(u(2 + h) - u(2 - h)) / (2 * h)];
  },
  // Kinematics: deceleration μg, stop time, average speed × time
  'c11.q3': () => {
    const a = 0.25 * 9.8;
    const t = 6 / a;
    return [(6 / 2) * t];
  },
  // Sum thin rings: K = ½ ω² ∫ r² dm with dm = σ 2π r dr
  'c12.q1': () => {
    const sigma = 10 / (Math.PI * 0.3 ** 2);
    return [0.5 * 100 ** 2 * integrate((r) => r ** 2 * sigma * 2 * Math.PI * r, 0, 0.3)];
  },
  // Dynamics on a 30° incline: a = g sin θ / (1 + 2/5), d = h / sin θ, v² = 2 a d
  'c12.q2': () => {
    const a = (9.8 * Math.sin(rad(30))) / (1 + 2 / 5);
    const d = 1.2 / Math.sin(rad(30));
    return [Math.sqrt(2 * a * d)];
  },
  // Energy per degree, times 60 degrees
  'c13.q2': () => [60 * (0.5 * 4186)],
  // K from momentum, then energy per kilogram of steel
  'c13.q3': () => [((1200 * 25) ** 2 / (2 * 1200) / 8) / 450],
  // Factor the difference of squares
  'c13.q4': () => [0.5 * 2 * (4 - 1) * (4 + 1)],
  // Solve momentum + restitution as a 2x2 system
  'c14.q3': () => [solve2(2, 1, -1, 1, 6, 1.5)[1]],
  // Concrete numbers m = 1, v = 1
  'c14.q4': () => {
    const before = 0.5 * 1 * 1 ** 2;
    const after = 0.5 * 2 * 0.5 ** 2;
    return [(before - after) / before];
  },
};
