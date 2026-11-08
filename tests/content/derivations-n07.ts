/**
 * Second, independent derivations for n07 answer keys. SI units.
 * Each takes a different route from the lesson's worked solution: a numerical second
 * derivative of the position vector instead of ω²r, a bisection search on the friction limit
 * instead of the closed form, and axes along the bank instead of horizontal/vertical ones.
 */
const G = 9.8;
const rad = (d: number): number => (d * Math.PI) / 180;

export const N07_DERIVATIONS: Readonly<Record<string, () => readonly number[]>> = {
  // Central-difference second derivative of r(t) = ⟨R cos ωt, R sin ωt⟩ at t = 0, with
  // ω = 2π/T; its magnitude times m is the net force. No a = ω²r formula is used.
  'n07.q1': () => {
    const m = 20;
    const r = 2;
    const w = (2 * Math.PI) / 4;
    const h = 1e-3;
    const pos = (t: number): [number, number] => [r * Math.cos(w * t), r * Math.sin(w * t)];
    const [xp, yp] = pos(h);
    const [x0, y0] = pos(0);
    const [xm, ym] = pos(-h);
    const ax = (xp - 2 * x0 + xm) / (h * h);
    const ay = (yp - 2 * y0 + ym) / (h * h);
    return [m * Math.hypot(ax, ay)];
  },
  // Bisection on speed: the car holds the curve while the friction it needs, m v²/r, is at
  // most μs m g (m = 1 kg). 60 halvings of [0, 100] m/s pin down the largest such speed.
  'n07.q4': () => {
    const r = 50;
    const mu = 0.8;
    let lo = 0;
    let hi = 100;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if ((mid * mid) / r <= mu * G) lo = mid;
      else hi = mid;
    }
    return [lo];
  },
  // Axes along the bank: project the horizontal acceleration v²/r and gravity onto the
  // down-slope unit vector ⟨cos θ, -sin θ⟩ (x toward the center, y up). The normal force is
  // perpendicular to it, so (v²/r) cos θ = g sin θ, solved for v.
  'n07.q6': () => {
    const t = rad(12);
    const r = 80;
    const ux = Math.cos(t);
    const uy = -Math.sin(t);
    // gravity per unit mass ⟨0, -g⟩ · u, and the acceleration per unit v², ⟨1/r, 0⟩ · u
    const gravityAlong = 0 * ux + -G * uy;
    const perV2 = (1 / r) * ux + 0 * uy;
    return [Math.sqrt(gravityAlong / perV2)];
  },
};
