import type { Lesson } from '../types';
import { D, q } from '../units';

export const c11: Lesson = {
  id: 'c11',
  unit: 'C',
  chapter: 'C11',
  title: 'Force and energy',
  minutes: 7,
  needs: ['lab.dot'],
  steps: [
    {
      kind: 'explain',
      md: `**Work** is energy transferred by a force acting through a distance:

**W = F · d = F d cos θ**

The **work-energy theorem**: the net work on an object equals its change in kinetic energy, W_net = ΔK.

For a conservative force (gravity, springs), force and potential energy are linked: **F = -dU/dx**. The force pushes "downhill" on the U(x) graph.`,
    },
    {
      kind: 'numeric',
      id: 'c11.q1',
      prompt: 'You drag a box 5.0 m across a floor by pulling a rope with 40 N at 60° above the horizontal. How much work does your pull do?',
      answer: q(100, D.energy),
      hint: 'Only the part of the force along the motion does work.',
      worked: 'W = F d cos θ = (40)(5.0)(cos 60°) = (40)(5.0)(0.5) = 100 J.',
    },
    {
      kind: 'numeric',
      id: 'c11.q2',
      prompt: 'An object\'s potential energy is U(x) = 3x² (U in J, x in m). What is the force on it at x = 2.0 m? (Give the sign.)',
      answer: q(-12, D.force),
      hint: 'F = -dU/dx.',
      worked: 'dU/dx = 6x = 12 N at x = 2.0 m, so F = -12 N. It points back toward x = 0, like a spring.',
    },
    {
      kind: 'triage',
      id: 'c11.q3',
      problem: 'A 2.0 kg box slides across a floor at 6.0 m/s. The coefficient of kinetic friction is 0.25. How far does it slide before stopping?',
      stages: [
        { stage: 'Translate', prompt: 'Asked: stopping distance.', tip: 'The box starts with kinetic energy and ends with none.' },
        { stage: 'Represent', prompt: 'Free-body diagram: weight down, normal force up, friction backwards.', tip: 'Friction magnitude = μ N = μ m g.' },
        { stage: 'Identify', prompt: 'Which principle connects force, distance and speed?', tip: 'The work-energy theorem: friction\'s (negative) work removes all the kinetic energy.', check: { choices: ['Work-energy theorem', 'Momentum conservation', 'Angular momentum'], answer: 0 } },
        { stage: 'Assume', prompt: 'Flat floor, constant friction coefficient, no air drag.', tip: 'The normal force equals the weight on a flat floor.' },
        { stage: 'Generate', prompt: '-μ m g d = 0 - ½ m v² → d = v² / (2 μ g).', tip: 'The mass cancels.' },
        { stage: 'Evaluate', prompt: 'Check units and a limit.', tip: '(m/s)² / (m/s²) = m ✓. If μ → 0, d → ∞: no friction, no stopping ✓.' },
      ],
      answer: q(7.346939, D.length),
      hint: 'Set friction\'s work equal to the loss of kinetic energy.',
      worked: 'd = v² / (2 μ g) = 36 / (2 × 0.25 × 9.8) = 36 / 4.9 = 7.3 m.',
    },
    {
      kind: 'mcq',
      id: 'c11.q4',
      prompt: 'A box slides across a horizontal floor. How much work does the normal force do on it?',
      choices: ['Positive work', 'Zero', 'Negative work'],
      answer: 1,
      hint: 'What is the angle between the normal force and the motion?',
      explain: 'The normal force is vertical and the motion is horizontal, so they are at 90° and W = F d cos 90° = 0.',
    },
    {
      kind: 'selfExplain',
      id: 'c11.q5',
      prompt: 'Explain what F = -dU/dx means for a ball sitting in a bowl.',
      model: 'The force points the way potential energy decreases fastest, "downhill" on the U graph. In a bowl, U is lowest at the bottom, so wherever the ball is on the side, the force pushes it back toward the bottom. At the bottom the slope is zero, so the force is zero.',
    },
  ],
};

export const c12: Lesson = {
  id: 'c12',
  unit: 'C',
  chapter: 'C12',
  title: 'Rotational energy',
  minutes: 6,
  needs: ['lab.units'],
  steps: [
    {
      kind: 'explain',
      md: `A spinning object has **rotational kinetic energy**: K_rot = ½ I ω².

The moment of inertia I depends on how the mass is spread out:

| Shape (about its center) | I |
|---|---|
| Hoop or thin ring | M R² |
| Solid disk or cylinder | ½ M R² |
| Solid sphere | ⅖ M R² |

A rolling object has both kinds of kinetic energy: K = ½ m v² + ½ I ω², with v = ω R if it does not slip.`,
    },
    {
      kind: 'numeric',
      id: 'c12.q1',
      prompt: 'A flywheel is a solid disk of mass 10 kg and radius 0.30 m, spinning at 100 rad/s. How much rotational kinetic energy does it store?',
      answer: q(2250, D.energy),
      hint: 'First find I = ½ M R², then K = ½ I ω².',
      worked: 'I = ½ (10)(0.30)² = 0.45 kg·m². K = ½ (0.45)(100)² = 2250 J.',
    },
    {
      kind: 'triage',
      id: 'c12.q2',
      problem: 'A solid ball rolls without slipping down a ramp, starting from rest 1.2 m above the bottom. How fast is it moving at the bottom?',
      stages: [
        { stage: 'Translate', prompt: 'Asked: the ball\'s speed (of its center) at the bottom.', tip: 'Rolling, so part of the energy goes into spin.' },
        { stage: 'Represent', prompt: 'Energy bars: top (gravitational) and bottom (translational K + rotational K).', tip: 'Two kinetic bars, not one.' },
        { stage: 'Identify', prompt: 'Energy conservation including rotation.', tip: 'm g h = ½ m v² + ½ (⅖ m R²)(v/R)².', check: { choices: ['m g h = ½ m v² + ½ I ω²', 'm g h = ½ m v²', 'Angular momentum is conserved'], answer: 0 } },
        { stage: 'Assume', prompt: 'Rolling without slipping, so static friction does no work.', tip: 'If it slipped, some energy would become thermal energy.' },
        { stage: 'Generate', prompt: 'm g h = ½ m v² + ⅕ m v² = (7/10) m v² → v = √(10 g h / 7).', tip: 'Both m and R cancel.' },
        { stage: 'Evaluate', prompt: 'Compare with sliding without friction.', tip: 'A frictionless slide gives √(2 g h) = 4.85 m/s. Rolling should be slower, since some energy goes into spin ✓.' },
      ],
      answer: q(4.09878, D.velocity),
      hint: 'For a solid sphere rolling, the total kinetic energy is (7/10) m v².',
      worked: 'v = √(10 × 9.8 × 1.2 / 7) = √16.8 = 4.10 m/s.',
    },
    {
      kind: 'mcq',
      id: 'c12.q3',
      prompt: 'A hoop and a solid disk with the same mass and radius race down a ramp, rolling without slipping. Which wins?',
      choices: ['The hoop', 'The solid disk', 'It is a tie'],
      answer: 1,
      hint: 'Which one has to put more of its energy into spinning?',
      explain: 'The hoop\'s mass is all at the rim (I = M R²), so more of its energy goes into spin and less into forward motion. The disk (I = ½ M R²) gets to the bottom first.',
    },
    {
      kind: 'selfExplain',
      id: 'c12.q4',
      prompt: 'Explain why the rolling ball\'s answer did not depend on its mass or radius.',
      model: 'Every energy term was proportional to the mass, so mass cancels. The radius cancels because a bigger ball spins more slowly at the same speed (ω = v/R) while its I grows as R², so the rotational energy for a given speed is the same.',
    },
  ],
};

export const c13: Lesson = {
  id: 'c13',
  unit: 'C',
  chapter: 'C13',
  title: 'Thermal energy',
  minutes: 6,
  needs: ['lab.units'],
  steps: [
    {
      kind: 'explain',
      md: `Friction does not destroy energy. It turns organised motion into the random jiggling of atoms: **thermal energy**. The total energy is still conserved; it is just much harder to get back.

Adding thermal energy Q to a substance raises its temperature:

**Q = m c ΔT**

where c is the **specific heat**. Water has c = 4186 J/(kg·K), which is unusually large. Steel is about 450 J/(kg·K).`,
    },
    {
      kind: 'predict',
      id: 'c13.q1',
      prompt: 'Same track as before, but now the floor has friction. The block starts from the same place up the ramp. How high does it get on the way back?',
      setup: { sim: 'energy', ramp: { m: 1, k: 50, mu: 0.2, flatLength: 2, angle: Math.PI / 6, g: 9.8 }, startS: 4, seconds: 8 },
      choices: [
        { text: 'Lower than where it started', claim: { kind: 'max-height', relation: 'lower' } },
        { text: 'To the same height', claim: { kind: 'max-height', relation: 'same' } },
        { text: 'Higher than where it started', claim: { kind: 'max-height', relation: 'higher' } },
      ],
      answer: 0,
      reveal: 'Friction turns some of the mechanical energy into thermal energy (watch the thermal bar grow), so less is left to climb back. The total of all the bars stays the same.',
    },
    {
      kind: 'numeric',
      id: 'c13.q2',
      prompt: 'How much energy does it take to heat 0.50 kg of water from 20 °C to 80 °C? (c = 4186 J/(kg·K))',
      answer: q(125580, D.energy),
      hint: 'Q = m c ΔT. A change of 1 °C is a change of 1 K.',
      worked: 'Q = (0.50)(4186)(60) = 125,580 J ≈ 126 kJ.',
    },
    {
      kind: 'triage',
      id: 'c13.q3',
      problem: 'A 1200 kg car brakes to a stop from 25 m/s. All its kinetic energy goes into the steel brake discs, 8.0 kg in total, with c = 450 J/(kg·K). By how much does their temperature rise? (Answer in K.)',
      stages: [
        { stage: 'Translate', prompt: 'Asked: the temperature rise ΔT of the discs.', tip: 'Temperature change, so a positive number in kelvin (or °C, same size).' },
        { stage: 'Represent', prompt: 'Energy bars: car K before → thermal energy of discs after.', tip: 'One bar empties, another fills.' },
        { stage: 'Identify', prompt: 'Energy conservation, kinetic → thermal.', tip: '½ M v² = m c ΔT.', check: { choices: ['½ M v² = m c ΔT', 'Momentum conservation', 'm g h = m c ΔT'], answer: 0 } },
        { stage: 'Assume', prompt: 'All the energy stays in the discs; none goes to the air or tyres in this time.', tip: 'Real brakes lose some heat to the air, so this is an upper limit.' },
        { stage: 'Generate', prompt: 'ΔT = ½ (1200)(25)² / (8.0 × 450).', tip: 'K = 375,000 J.' },
        { stage: 'Evaluate', prompt: 'Is this plausible?', tip: '≈ 100 K rise from one hard stop: brake discs really do get hot enough to glow after repeated hard braking ✓.' },
      ],
      answer: q(104.16667, D.temperature),
      hint: 'Find the car\'s kinetic energy first.',
      worked: 'K = ½ (1200)(25)² = 375,000 J. ΔT = 375,000 / (8.0 × 450) = 104 K.',
    },
    {
      kind: 'numeric',
      id: 'c13.q4',
      prompt: 'A 2.0 kg box slows from 4.0 m/s to 1.0 m/s sliding across a rough floor. How much thermal energy is produced?',
      answer: q(15, D.energy),
      hint: 'The lost kinetic energy becomes thermal energy.',
      worked: 'ΔK = ½ (2.0)(4.0² - 1.0²) = (1.0)(16 - 1) = 15 J of thermal energy.',
    },
    {
      kind: 'selfExplain',
      id: 'c13.q5',
      prompt: 'Rub your hands together and they get warm. Explain where that energy came from and where it went.',
      model: 'Chemical energy in my muscles became kinetic energy of my hands. Friction between the hands turned that motion into thermal energy, the random motion of the atoms in my skin, which I feel as warmth. Energy changed form but none was created or destroyed.',
    },
  ],
};

export const c14: Lesson = {
  id: 'c14',
  unit: 'C',
  chapter: 'C14',
  title: 'Collisions',
  minutes: 7,
  needs: ['lab.vector-add'],
  steps: [
    {
      kind: 'explain',
      md: `In every collision of an isolated pair, **momentum is conserved**. Kinetic energy may or may not be:

- **Elastic:** kinetic energy is conserved (billiard balls, nearly).
- **Inelastic:** some kinetic energy becomes thermal energy, sound, or deformation.
- **Perfectly inelastic:** the objects stick together. This loses the most kinetic energy that momentum conservation allows.

The **coefficient of restitution** e = (speed of separation) / (speed of approach) runs from 0 (stick) to 1 (elastic).`,
    },
    {
      kind: 'predict',
      id: 'c14.q1',
      prompt: 'Cart A slides at 2.0 m/s into an identical cart B at rest. The collision is elastic. What does cart A do afterwards?',
      setup: {
        sim: 'collisions',
        seconds: 2,
        world: { width: 12, height: 1, walls: false, e: 1, bodies: [{ x: 1, y: 0.5, vx: 2, vy: 0, m: 1, r: 0.3 }, { x: 3, y: 0.5, vx: 0, vy: 0, m: 1, r: 0.3 }] },
      },
      choices: [
        { text: 'Keeps going forward, slower', claim: { kind: 'velocity-sign', body: 0, sign: 1 } },
        { text: 'Stops dead', claim: { kind: 'velocity-sign', body: 0, sign: 0 } },
        { text: 'Bounces back', claim: { kind: 'velocity-sign', body: 0, sign: -1 } },
      ],
      answer: 1,
      reveal: 'Equal masses in an elastic head-on collision swap velocities: A stops and B moves off at 2.0 m/s. That is the only way to conserve both momentum and kinetic energy here.',
    },
    {
      kind: 'predict',
      id: 'c14.q2',
      prompt: 'Now the carts have sticky bumpers and lock together (perfectly inelastic). What happens to the total kinetic energy?',
      setup: {
        sim: 'collisions',
        seconds: 2,
        world: { width: 12, height: 1, walls: false, e: 0, bodies: [{ x: 1, y: 0.5, vx: 2, vy: 0, m: 1, r: 0.3 }, { x: 3, y: 0.5, vx: 0, vy: 0, m: 1, r: 0.3 }] },
      },
      choices: [
        { text: 'It stays the same', claim: { kind: 'ke-change', change: 'same' } },
        { text: 'It decreases', claim: { kind: 'ke-change', change: 'less' } },
        { text: 'It increases', claim: { kind: 'ke-change', change: 'more' } },
      ],
      answer: 1,
      reveal: 'Momentum is still conserved: the pair moves at 1.0 m/s. But kinetic energy drops from 2.0 J to 1.0 J. The missing half becomes thermal energy and sound in the bumpers.',
    },
    {
      kind: 'numeric',
      id: 'c14.q3',
      prompt: 'A 2.0 kg cart at 3.0 m/s hits a 1.0 kg cart at rest. The coefficient of restitution is e = 0.5. How fast does the 1.0 kg cart move afterwards?',
      answer: q(3, D.velocity),
      hint: 'Use momentum conservation and v₂\' - v₁\' = e (v₁ - v₂). Two equations, two unknowns.',
      worked: 'Momentum: 2v₁\' + v₂\' = 6. Restitution: v₂\' - v₁\' = 0.5 × 3 = 1.5. Subtract: 3v₁\' = 4.5 → v₁\' = 1.5 m/s, so v₂\' = 3.0 m/s.',
    },
    {
      kind: 'triage',
      id: 'c14.q4',
      problem: 'A cart slides into an identical cart at rest and they stick together. What fraction of the original kinetic energy is lost?',
      stages: [
        { stage: 'Translate', prompt: 'Asked: (K lost) / (K before), a pure number.', tip: 'No masses or speeds are given, so the answer cannot depend on them.' },
        { stage: 'Represent', prompt: 'Before: m at v, m at rest. After: 2m at v\'.', tip: 'Use symbols; they will cancel.' },
        { stage: 'Identify', prompt: 'Momentum gives v\'; then compare kinetic energies.', tip: 'Momentum is conserved; kinetic energy is not.', check: { choices: ['Momentum, then compare K', 'Kinetic energy conservation', 'Restitution e = 1'], answer: 0 } },
        { stage: 'Assume', prompt: 'Isolated pair; the collision is quick.', tip: 'Track friction is negligible during the collision.' },
        { stage: 'Generate', prompt: 'm v = 2m v\' → v\' = v/2. K_after = ½(2m)(v/2)² = ¼ m v² = ½ K_before.', tip: 'Fraction lost = 1 - ½.' },
        { stage: 'Evaluate', prompt: 'Is it between 0 and 1?', tip: '0.5 ✓, matching the sim in the previous step (2.0 J → 1.0 J).' },
      ],
      answer: q(0.5, D.none),
      hint: 'Find the shared velocity with momentum, then compare ½ m v² before and after.',
      worked: 'v\' = v/2. K_before = ½ m v². K_after = ½ (2m)(v/2)² = ¼ m v². Lost fraction = (½ - ¼) / ½ = 0.5.',
    },
    {
      kind: 'selfExplain',
      id: 'c14.q5',
      prompt: 'Explain why momentum is always conserved in a collision, but kinetic energy is not.',
      model: 'The colliding objects push on each other equally and oppositely for the same time, so the momentum one gains the other loses, whatever the bumpers are made of. Kinetic energy is only one form of energy; squashing, heating and sound can take some of it, so the kinetic part can drop while total energy is still conserved.',
    },
  ],
};
