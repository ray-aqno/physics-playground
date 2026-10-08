import type { Lesson } from '../types';
import { D, q } from '../units';

export const c05: Lesson = {
  id: 'c05',
  unit: 'C',
  chapter: 'C5',
  title: 'Applying momentum conservation',
  minutes: 7,
  needs: ['lab.vector-add'],
  steps: [
    {
      kind: 'explain',
      md: `To use momentum conservation:

1. **Choose the system** so that interactions with the outside are small during the event. A collision or explosion is so brief that friction and gravity barely act.
2. Write **total p before = total p after**, one equation per component.
3. Solve.

This works for collisions and explosions alike, and it works whether or not kinetic energy is conserved.`,
    },
    {
      kind: 'predict',
      id: 'c05.q1',
      prompt: 'A 3.0 kg cart moving at 2.0 m/s bounces elastically off a 1.0 kg cart at rest. After the collision, what does the heavy cart do?',
      setup: {
        sim: 'collisions',
        seconds: 2,
        world: { width: 12, height: 1, walls: false, e: 1, bodies: [{ x: 1, y: 0.5, vx: 2, vy: 0, m: 3, r: 0.3 }, { x: 3, y: 0.5, vx: 0, vy: 0, m: 1, r: 0.3 }] },
      },
      choices: [
        { text: 'Keeps moving forward, slower', claim: { kind: 'velocity-sign', body: 0, sign: 1 } },
        { text: 'Stops dead', claim: { kind: 'velocity-sign', body: 0, sign: 0 } },
        { text: 'Bounces backwards', claim: { kind: 'velocity-sign', body: 0, sign: -1 } },
      ],
      answer: 0,
      reveal: 'A heavy object hitting a lighter one keeps going forward: here it slows to 1.0 m/s while the light cart shoots off at 3.0 m/s. It would stop only if the masses were equal, and bounce back only if it were the lighter one.',
    },
    {
      kind: 'numeric',
      id: 'c05.q2',
      prompt: 'A 1000 kg car moving at 20 m/s rear-ends a 1500 kg car at rest, and they lock together. How fast do they move just after the crash?',
      answer: q(8, D.velocity),
      hint: 'One object after the collision, with the combined mass.',
      worked: '(1000)(20) + (1500)(0) = (2500) v → v = 20,000 / 2500 = 8.0 m/s.',
    },
    {
      kind: 'triage',
      id: 'c05.q3',
      problem: 'A 0.020 kg bullet moving at 400 m/s embeds itself in a 2.0 kg wooden block at rest on ice. How fast does the block (with bullet) slide away?',
      stages: [
        { stage: 'Translate', prompt: 'Asked: the common speed just after the bullet stops inside the block.', tip: '"Embeds" means they move together afterwards.' },
        { stage: 'Represent', prompt: 'Before: bullet 0.020 kg at 400 m/s, block at rest. After: 2.020 kg at v.', tip: 'Do not forget to add the bullet\'s mass to the block.' },
        { stage: 'Identify', prompt: 'Which law?', tip: 'The collision is quick and the ice is smooth, so momentum of bullet + block is conserved.', check: { choices: ['Momentum conservation', 'Kinetic energy conservation', 'Both'], answer: 0 } },
        { stage: 'Assume', prompt: 'The embedding is over before the block moves appreciably; ice friction is negligible.', tip: 'Kinetic energy is NOT conserved; much becomes thermal energy in the wood.' },
        { stage: 'Generate', prompt: '(0.020)(400) = (2.020) v.', tip: 'Solve for v.' },
        { stage: 'Evaluate', prompt: 'Check the size.', tip: 'The block is about 100 times heavier, so v should be about 400/100 = 4 m/s ✓.' },
      ],
      answer: q(3.960396, D.velocity),
      hint: 'Total momentum before is all in the bullet.',
      worked: 'v = (0.020 × 400) / 2.020 = 8.0 / 2.020 = 3.96 m/s.',
    },
    {
      kind: 'numeric',
      id: 'c05.q4',
      prompt: 'A 4.0 kg object at rest explodes into two pieces. A 1.0 kg piece flies off at ⟨6, 3⟩ m/s. What is the velocity of the 3.0 kg piece?',
      answer: q([-2, -1], D.velocity),
      hint: 'Total momentum stays zero, in each component.',
      worked: '0 = (1.0)⟨6, 3⟩ + (3.0) v → v = -⟨6, 3⟩ / 3.0 = ⟨-2, -1⟩ m/s.',
    },
    {
      kind: 'selfExplain',
      id: 'c05.q5',
      prompt: 'Why can you use momentum conservation for a car crash even though friction from the road acts on the cars?',
      model: 'The crash lasts a fraction of a second. Friction is small compared with the huge crash forces, so in that short time it transfers very little momentum. The crash forces are internal to the two-car system, so total momentum just before and just after is practically the same.',
    },
  ],
};

export const c06: Lesson = {
  id: 'c06',
  unit: 'C',
  chapter: 'C6',
  title: 'Introducing angular momentum',
  minutes: 6,
  needs: ['lab.cross'],
  steps: [
    {
      kind: 'explain',
      md: `Angular momentum measures "how much rotation" a system has about a chosen point.

For a particle: **L = r × p**. Its size is **L = r p sin θ = m v r⊥**, where r⊥ is the perpendicular distance from the point to the particle's line of motion (the lever arm).

For a rigid body spinning about an axis: **L = I ω**.

Angular momentum changes only when a **torque** acts: **τ = ΔL / Δt**. It is the rotational partner of F = Δp / Δt.`,
    },
    {
      kind: 'numeric',
      id: 'c06.q1',
      prompt: 'A 2.0 kg puck slides at 3.0 m/s along a straight line that passes 0.50 m from the origin. What is the size of its angular momentum about the origin?',
      answer: q(3, D.angularMomentum),
      hint: 'L = m v r⊥. A straight path still has angular momentum about a point off the line.',
      worked: 'L = (2.0)(3.0)(0.50) = 3.0 kg·m²/s.',
    },
    {
      kind: 'numeric',
      id: 'c06.q2',
      prompt: 'A 0.10 kg ball on a 0.80 m string is whirled in a horizontal circle at 2.0 revolutions per second. What is its angular momentum about the center?',
      answer: q(0.8042477, D.angularMomentum),
      hint: 'Find the speed from the circumference and the rate: v = 2π r f.',
      worked: 'v = 2π(0.80)(2.0) = 10.05 m/s. L = m v r = (0.10)(10.05)(0.80) = 0.804 kg·m²/s.',
    },
    {
      kind: 'triage',
      id: 'c06.q3',
      problem: 'A steady torque of 0.50 N·m acts on a bicycle wheel that starts at rest. What is the wheel\'s angular momentum after 4.0 s?',
      stages: [
        { stage: 'Translate', prompt: 'Asked: L after 4.0 s of constant torque, starting from L = 0.', tip: 'This is the rotational version of "force for a time gives momentum".' },
        { stage: 'Represent', prompt: 'Sketch a graph of L against t: a straight line from zero.', tip: 'Constant torque means L grows at a constant rate.' },
        { stage: 'Identify', prompt: 'Which relation links torque, time and angular momentum?', tip: 'Angular impulse: τ Δt = ΔL.', check: { choices: ['τ Δt = ΔL', 'L = m v r', 'K = ½ I ω²'], answer: 0 } },
        { stage: 'Assume', prompt: 'No friction at the axle; the torque is constant.', tip: 'Friction would subtract a little torque.' },
        { stage: 'Generate', prompt: 'ΔL = (0.50 N·m)(4.0 s).', tip: 'N·m·s = kg·m²/s.' },
        { stage: 'Evaluate', prompt: 'Check units.', tip: 'N·m·s = (kg·m/s²)·m·s = kg·m²/s ✓, the units of angular momentum.' },
      ],
      answer: q(2, D.angularMomentum),
      hint: 'Angular impulse = torque × time.',
      worked: 'L = τ Δt = 0.50 × 4.0 = 2.0 kg·m²/s.',
    },
    {
      kind: 'mcq',
      id: 'c06.q4',
      prompt: 'A particle moves in a straight line at constant speed, not through the origin. About the origin, its angular momentum is:',
      choices: ['Zero, because it is not rotating', 'Constant and not zero', 'Increasing as it moves away'],
      answer: 1,
      hint: 'L = m v r⊥. Does the lever arm r⊥ change along a straight line?',
      explain: 'The perpendicular distance from the origin to the line is fixed, and so are m and v, so L = m v r⊥ is constant and not zero. No torque acts, so L cannot change.',
    },
    {
      kind: 'selfExplain',
      id: 'c06.q5',
      prompt: 'Explain why angular momentum depends on which point you measure it about, while momentum does not.',
      model: 'Momentum p = m v involves only the motion. Angular momentum L = r × p also involves the position r from the chosen point, so moving the point changes r and therefore L. The same motion has different lever arms about different points.',
    },
  ],
};

export const c07: Lesson = {
  id: 'c07',
  unit: 'C',
  chapter: 'C7',
  title: 'Conservation of angular momentum',
  minutes: 6,
  needs: ['lab.cross'],
  steps: [
    {
      kind: 'explain',
      md: `If no external torque acts on a system, its angular momentum stays constant:

**I₁ ω₁ = I₂ ω₂**

A spinning skater who pulls in their arms lowers I, so ω must go up. A diver tucks to spin faster. A collapsing star spins up into a pulsar.

Rotational kinetic energy is K = ½ I ω² = L² / (2I). With L fixed and I smaller, K gets **bigger**. The skater's muscles do work pulling their arms in.`,
    },
    {
      kind: 'numeric',
      id: 'c07.q1',
      prompt: 'A skater with I = 4.0 kg·m² spins at 2.0 rev/s, then pulls in their arms to I = 1.6 kg·m². What is their new angular velocity, in rad/s?',
      answer: q(31.41593, D.angularVelocity),
      hint: 'I₁ ω₁ = I₂ ω₂. One revolution is 2π rad.',
      worked: 'ω₁ = 2.0 × 2π = 4π rad/s. ω₂ = (4.0 / 1.6)(4π) = 10π = 31.4 rad/s (5.0 rev/s).',
    },
    {
      kind: 'triage',
      id: 'c07.q2',
      problem: 'A merry-go-round (a disk with I = 250 kg·m²) spins at 1.2 rad/s. A 40 kg child runs straight toward its center and jumps onto the rim, 2.0 m from the axis. What is the new angular velocity?',
      stages: [
        { stage: 'Translate', prompt: 'Asked: ω after the child is riding at the rim.', tip: 'Running straight at the center means the child brings no angular momentum.' },
        { stage: 'Represent', prompt: 'Before: disk only, I = 250, ω = 1.2. After: disk + child at r = 2.0 m.', tip: 'Treat the child as a point mass: I_child = m r².' },
        { stage: 'Identify', prompt: 'Which conserved quantity?', tip: 'No external torque about the axis, so L of disk + child is conserved.', check: { choices: ['Angular momentum', 'Rotational kinetic energy', 'Linear momentum of the disk'], answer: 0 } },
        { stage: 'Assume', prompt: 'Frictionless axle; the child is a point mass; the jump is radial.', tip: 'Any sideways run would add or remove angular momentum.' },
        { stage: 'Generate', prompt: '(250)(1.2) = (250 + 40 × 2.0²) ω.', tip: 'Total I after = 250 + 160 = 410 kg·m².' },
        { stage: 'Evaluate', prompt: 'Check that it slows down.', tip: 'More rotational inertia, same L, so ω should drop below 1.2 rad/s ✓.' },
      ],
      answer: q(0.7317073, D.angularVelocity),
      hint: 'L before = L after. Add the child\'s m r² to I.',
      worked: 'ω = (250 × 1.2) / (250 + 40 × 4.0) = 300 / 410 = 0.732 rad/s.',
    },
    {
      kind: 'numeric',
      id: 'c07.q3',
      prompt: 'For the skater in the first question (I from 4.0 to 1.6 kg·m²), by what factor does the rotational kinetic energy increase?',
      answer: q(2.5, D.none),
      hint: 'K = L² / (2I) and L does not change.',
      worked: 'K₂ / K₁ = I₁ / I₂ = 4.0 / 1.6 = 2.5. The extra energy comes from the work the skater does pulling their arms in.',
    },
    {
      kind: 'mcq',
      id: 'c07.q4',
      prompt: 'A spinning ice skater pulls in their arms and spins faster. What happens to the skater\'s rotational kinetic energy?',
      choices: ['It increases', 'It stays the same', 'It decreases'],
      answer: 0,
      hint: 'L stays the same and I gets smaller. Use K = L² / (2I).',
      explain: 'With L fixed, K = L²/(2I) grows as I shrinks. The muscles do work pulling the arms inward against their tendency to fly outward.',
    },
    {
      kind: 'selfExplain',
      id: 'c07.q5',
      prompt: 'Explain, without equations, why a diver who tucks into a ball spins faster.',
      model: 'While in the air nothing twists the diver, so their angular momentum cannot change. Tucking pulls their mass closer to the spin axis, which makes it easier to spin. To keep the same angular momentum with mass closer in, they have to rotate faster.',
    },
  ],
};
