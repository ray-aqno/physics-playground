/**
 * Second, independent derivations of every Skills Lab answer key (council condition 2, SC3).
 * Each one takes a different route from the worked solution in the lesson: polar instead of
 * components, law of cosines instead of component sums, energy instead of p = mv, and so on.
 * Values are in SI base units; angles in radians.
 */
const rad = (d: number): number => (d * Math.PI) / 180;

/** Levi-Civita sum: a different code path from the component formula used in the lesson. */
function crossByLeviCivita(a: readonly number[], b: readonly number[]): number[] {
  const eps = (i: number, j: number, k: number): number => ((i - j) * (j - k) * (k - i)) / 2;
  const out = [0, 0, 0];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) out[i] = (out[i] ?? 0) + eps(i, j, k) * (a[j] ?? 0) * (b[k] ?? 0);
  return out;
}

/** Solves the drag-exponent system by Cramer's rule. Rows: kg, m, s; unknowns a, b, c. */
function dragExponentB(): number {
  const m = [[1, 0, 0], [-3, 1, 2], [0, -1, 0]];
  const rhs = [1, 1, -2];
  const det = (x: number[][]): number => {
    const r = (i: number, j: number): number => x[i]?.[j] ?? 0;
    return r(0, 0) * (r(1, 1) * r(2, 2) - r(1, 2) * r(2, 1)) - r(0, 1) * (r(1, 0) * r(2, 2) - r(1, 2) * r(2, 0)) + r(0, 2) * (r(1, 0) * r(2, 1) - r(1, 1) * r(2, 0));
  };
  const withB = m.map((row, i) => [row[0] ?? 0, rhs[i] ?? 0, row[2] ?? 0]);
  return det(withB) / det(m);
}

const polar = (mag: number, d: number): [number, number] => [mag * Math.cos(rad(d)), mag * Math.sin(rad(d))];
const dirDeg = (x: number, y: number): number => (Math.atan2(y, x) * 180) / Math.PI;

export const LAB_DERIVATIONS: Readonly<Record<string, () => readonly number[]>> = {
  // Pythagoras with the vertical part instead of cos 30°
  'lab.trig.q1': () => [Math.sqrt(50 ** 2 - 25 ** 2)],
  // cos of the complementary angle instead of sin 30°
  'lab.trig.q2': () => [50 * Math.cos(rad(60))],
  // arcsin of rise / slope length instead of arctan(rise / run)
  'lab.trig.q3': () => [Math.asin(1.5 / Math.hypot(1.5, 4))],
  // scaled 3-4-5 triangle
  'lab.vectors.q1': () => [2 * 5],
  // atan2 handles the quadrant directly
  'lab.vectors.q3': () => [Math.atan2(8, -6)],
  // reference angle 30° below -x, written with explicit signs
  'lab.vectors.q4': () => [-12 * Math.cos(rad(30)), -12 * Math.sin(rad(30))],
  // add in polar form, converting each vector to magnitude and angle first
  'lab.vector-add.q1': () => {
    const a = polar(5, dirDeg(3, 4));
    const b = polar(Math.hypot(2, 7), dirDeg(2, -7));
    return [a[0] + b[0], a[1] + b[1]];
  },
  'lab.vector-add.q2': () => {
    const a = polar(5, dirDeg(3, 4));
    const b = polar(Math.hypot(2, 7), dirDeg(2, -7));
    return [a[0] - b[0], a[1] - b[1]];
  },
  // law of cosines: legs at 0° and 150°, so the angle between them is 150°
  'lab.vector-add.q3': () => [1000 * Math.sqrt(3 ** 2 + 4 ** 2 + 2 * 3 * 4 * Math.cos(rad(150)))],
  // |a||b|cos θ with θ from directions
  'lab.dot.q1': () => [5 * 5 * Math.cos(rad(dirDeg(4, -3) - dirDeg(3, 4)))],
  'lab.dot.q2': () => [Math.hypot(10, 5) * 3 * Math.cos(Math.atan2(5, 10))],
  // difference of directions instead of arccos of the dot product
  'lab.dot.q3': () => [rad(dirDeg(1, 3) - dirDeg(2, 1))],
  // |A||B| sin θ with θ = +90° (counterclockwise)
  'lab.cross.q1': () => [3 * 2 * Math.sin(rad(90))],
  // angle from r (+x) to F (-y) is -90°
  'lab.cross.q2': () => [0.2 * 50 * Math.sin(rad(-90))],
  'lab.cross.q3': () => crossByLeviCivita([1, 2, 3], [4, 5, 6]),
  // 72 km/h ÷ 3.6
  'lab.units.q2': () => [72 / 3.6],
  // p = √(2 m K) with K = ½ m v²
  'lab.units.q3': () => [Math.sqrt(2 * 1500 * (0.5 * 1500 * 20 ** 2))],
  'lab.units.q4': () => [dragExponentB()],
  // 4700 ns
  'lab.prefixes.q1': () => [4700e-9],
  // 0.53 µm
  'lab.prefixes.q2': () => [0.53e-6],
  // 5 µs written as 1.5 km ÷ (3.00e5 km/s), then km/s -> s
  'lab.prefixes.q3': () => [1.5 / 3.0e5],
  // in cm and ms, then back to m/s
  'lab.sigfigs.q2': () => [(240 / 1370) * 10],
  'lab.sigfigs.q3': () => [1.2 * (4 * 5 * 2.5)],
};
