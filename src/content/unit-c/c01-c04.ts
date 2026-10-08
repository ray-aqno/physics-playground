import type { Lesson } from '../types';
import { D, q } from '../units';

export const c01: Lesson = {
  id: 'c01',
  unit: 'C',
  chapter: 'C1',
  title: 'Interactions and conserved quantities',
  minutes: 6,
  needs: ['lab.units'],
  steps: [
    {
      kind: 'explain',
      md: `Unit C rests on one idea: **interactions move conserved quantities around, but never create or destroy them.**

Momentum, energy and angular momentum are all conserved. When two objects interact, one gains exactly what the other loses. If a system is **isolated** (nothing outside it interacts with it), its totals stay fixed no matter how complicated things get inside.

**Feynman habit:** before reaching for forces, ask "what stays the same here?" It is often the shortest road to the answer.`,
    },
    {
      kind: 'mcq',
      id: 'c01.q1',
      prompt: 'A ball falls toward the ground. Taking the ball alone as the system, is its momentum conserved?',
      choices: ['Yes, momentum is always conserved', 'No, the Earth interacts with it from outside the system', 'Only if air resistance is ignored'],
      answer: 1,
      hint: 'Is the ball-only system isolated?',
      explain: 'Gravity is an interaction with the Earth, which is outside a ball-only system, so the ball\'s momentum changes. Take the ball plus the Earth as the system and the total momentum is conserved: the Earth gains the opposite momentum.',
    },
    {
      kind: 'numeric',
      id: 'c01.q2',
      prompt: 'Two carts on a track: 2.0 kg moving at +3.0 m/s and 1.0 kg moving at -4.0 m/s. What is the total momentum of the two-cart system?',
      answer: q(2, D.momentum),
      hint: 'Momentum has a sign. Add m v for each cart.',
      worked: 'p = (2.0)(+3.0) + (1.0)(-4.0) = 6.0 - 4.0 = +2.0 kg·m/s.',
    },
    {
      kind: 'triage',
      id: 'c01.q3',
      problem: 'A 60 kg skater stands at rest on smooth ice holding a 3.0 kg ball. She throws the ball forward at 8.0 m/s (relative to the ice). What is her velocity afterwards? Take forward as positive.',
      stages: [
        { stage: 'Translate', prompt: 'What is asked: the skater\'s velocity (with sign) right after the throw.', tip: 'Restate it in your own words. "Velocity" means the sign matters.' },
        { stage: 'Represent', prompt: 'Draw before and after. Before: both at rest. After: ball moving +8.0 m/s, skater moving at unknown v.', tip: 'Label masses and velocities on the sketch; a positive direction arrow avoids sign mistakes.' },
        { stage: 'Identify', prompt: 'Which conserved quantity applies?', tip: 'The throw is an internal interaction; nothing outside pushes horizontally.', check: { choices: ['Momentum of the skater + ball system', 'Kinetic energy', 'The skater\'s momentum alone'], answer: 0 } },
        { stage: 'Assume', prompt: 'State your assumptions.', tip: 'Smooth ice means no horizontal friction, so the system is isolated horizontally.' },
        { stage: 'Generate', prompt: 'Total momentum before = after: 0 = (60)v + (3.0)(8.0).', tip: 'Solve for v.' },
        { stage: 'Evaluate', prompt: 'Check the sign and size.', tip: 'Negative means backwards, which makes sense. She is 20 times heavier than the ball, so her speed should be 20 times smaller: 8.0/20 = 0.4 m/s. ✓' },
      ],
      answer: q(-0.4, D.velocity),
      hint: 'Total momentum starts at zero, so it must end at zero.',
      worked: '0 = 60 v + 3.0 × 8.0 → v = -24 / 60 = -0.40 m/s. She slides backwards at 0.40 m/s.',
    },
    {
      kind: 'selfExplain',
      id: 'c01.q4',
      prompt: 'Explain why the skater moves backwards when she throws the ball forward, without using the word "force".',
      model: 'Momentum is conserved for the skater and ball together, and it started at zero. Throwing the ball gives it forward momentum, so the skater must end up with an equal amount of backward momentum to keep the total at zero.',
    },
  ],
};

export const c02: Lesson = {
  id: 'c02',
  unit: 'C',
  chapter: 'C2',
  title: 'Vectors in motion',
  minutes: 6,
  needs: ['lab.vectors', 'lab.vector-add'],
  steps: [
    {
      kind: 'explain',
      md: `Position, displacement, velocity and momentum are all **vectors**: they have a size and a direction.

- Displacement: **Δr** = r_final - r_initial
- Average velocity: **v_avg** = Δr / Δt
- Momentum: **p** = m **v**, pointing the same way as the velocity

Because momentum is a vector, conservation of momentum is really two (or three) conservation laws, one for each component.`,
    },
    {
      kind: 'numeric',
      id: 'c02.q1',
      prompt: 'A puck slides from position (1, 2) m to (7, -6) m in 2.0 s. What is its average velocity vector?',
      answer: q([3, -4], D.velocity),
      hint: 'Find Δr first, then divide each component by Δt.',
      worked: 'Δr = ⟨7 - 1, -6 - 2⟩ = ⟨6, -8⟩ m. v_avg = ⟨6, -8⟩ / 2.0 s = ⟨3, -4⟩ m/s.',
    },
    {
      kind: 'numeric',
      id: 'c02.q2',
      prompt: 'What is the magnitude of that average velocity?',
      answer: q(5, D.velocity),
      hint: '√(3² + 4²).',
      worked: '|v_avg| = √(9 + 16) = 5.0 m/s.',
    },
    {
      kind: 'triage',
      id: 'c02.q3',
      problem: 'A boat heads due north at 4.0 m/s relative to the water. The river flows due east at 3.0 m/s. What is the boat\'s velocity relative to the ground? Use east = +x and north = +y.',
      stages: [
        { stage: 'Translate', prompt: 'You want the boat\'s velocity vector relative to the ground (the riverbank).', tip: 'Two velocities are given, each relative to something different. Name what each one is relative to.' },
        { stage: 'Represent', prompt: 'Draw the boat-relative-to-water arrow (north) and the water-relative-to-ground arrow (east) tip to tail.', tip: 'The sum is the diagonal of the rectangle.' },
        { stage: 'Identify', prompt: 'Relative velocities add as vectors: v(boat, ground) = v(boat, water) + v(water, ground).', tip: 'The middle letters "cancel" like a chain: boat→water→ground.' },
        { stage: 'Assume', prompt: 'Assume the current is the same everywhere.', tip: 'Real rivers are faster in the middle, so this is a model.' },
        { stage: 'Generate', prompt: 'Add components: ⟨0, 4.0⟩ + ⟨3.0, 0⟩.', tip: 'Give the answer as a vector, e.g. <a, b> m/s.' },
        { stage: 'Evaluate', prompt: 'Check the size and direction.', tip: 'The speed should be more than either part but less than their sum: √(3² + 4²) = 5.0 m/s. The boat drifts east of north, as expected.' },
      ],
      answer: q([3, 4], D.velocity),
      hint: 'Add the two velocity vectors component by component.',
      worked: 'v = ⟨0, 4.0⟩ + ⟨3.0, 0⟩ = ⟨3.0, 4.0⟩ m/s, a speed of 5.0 m/s at 53° north of east.',
    },
    {
      kind: 'mcq',
      id: 'c02.q4',
      prompt: 'Two identical 1.0 kg carts move toward each other, each at 2.0 m/s. What is the total momentum?',
      choices: ['4.0 kg·m/s', '2.0 kg·m/s', '0', 'It depends on where they are'],
      answer: 2,
      hint: 'Momentum is a vector. What are the two directions?',
      explain: 'One cart has +2.0 kg·m/s and the other has -2.0 kg·m/s, so the total is zero. Adding speeds instead of vectors would give the wrong 4.0.',
    },
    {
      kind: 'selfExplain',
      id: 'c02.q5',
      prompt: 'Explain why two objects can both be moving fast while their total momentum is zero.',
      model: 'Momentum is a vector, so momenta pointing in opposite directions cancel. Two equal masses moving toward each other at the same speed have equal and opposite momenta, which add to zero even though each one is large.',
    },
  ],
};

export const c03: Lesson = {
  id: 'c03',
  unit: 'C',
  chapter: 'C3',
  title: 'Interactions transfer momentum',
  minutes: 6,
  needs: ['lab.units'],
  steps: [
    {
      kind: 'explain',
      md: `An interaction transfers momentum. The amount transferred is the **impulse**:

**J = Δp = F_avg Δt**

Impulse has units N·s, which is the same as kg·m/s.

Two objects that interact receive **equal and opposite** impulses. That is why their total momentum stays the same, and it is what Newton's third law really says.`,
    },
    {
      kind: 'numeric',
      id: 'c03.q1',
      prompt: 'A 0.15 kg baseball moving at 20 m/s toward a bat leaves at 30 m/s in the opposite direction. What is the magnitude of the impulse from the bat?',
      answer: q(7.5, D.momentum),
      hint: 'Choose a positive direction. The velocity changes sign, so the change is bigger than either speed.',
      worked: 'Take "away from the bat" as +. Δp = (0.15)(+30) - (0.15)(-20) = 4.5 + 3.0 = 7.5 N·s.',
    },
    {
      kind: 'numeric',
      id: 'c03.q2',
      prompt: 'If the bat and ball are in contact for 1.5 ms, what is the average force on the ball (magnitude)?',
      answer: q(5000, D.force),
      hint: 'F_avg = J / Δt. Convert ms to s.',
      worked: 'F_avg = 7.5 N·s / 0.0015 s = 5000 N, about 3400 times the ball\'s weight.',
    },
    {
      kind: 'triage',
      id: 'c03.q3',
      problem: 'A 1200 kg car brakes steadily from 25 m/s to rest in 5.0 s. What is the average braking force? Take the direction of motion as positive.',
      stages: [
        { stage: 'Translate', prompt: 'Asked: the average force (with sign) from the brakes, via the road.', tip: 'A signed answer: the force should point backwards.' },
        { stage: 'Represent', prompt: 'Before: p = (1200)(25). After: p = 0. Time 5.0 s.', tip: 'A before/after momentum bar chart makes the change obvious.' },
        { stage: 'Identify', prompt: 'Which idea links force, time and momentum change?', tip: 'Impulse: F_avg Δt = Δp.', check: { choices: ['Impulse: F Δt = Δp', 'Conservation of momentum of the car alone', 'Energy conservation only'], answer: 0 } },
        { stage: 'Assume', prompt: 'Assume the braking force is the only horizontal interaction.', tip: 'Air drag is small at these speeds compared with braking.' },
        { stage: 'Generate', prompt: 'F_avg = Δp / Δt = (0 - 1200 × 25) / 5.0.', tip: 'Keep the sign.' },
        { stage: 'Evaluate', prompt: 'Check sign, units and size.', tip: 'Negative: opposite to the motion ✓. Units kg·m/s² = N ✓. 6000 N is about half the car\'s weight, which is reasonable for firm braking.' },
      ],
      answer: q(-6000, D.force),
      hint: 'The car loses all 30,000 kg·m/s of momentum in 5.0 s.',
      worked: 'Δp = 0 - 1200 × 25 = -30,000 kg·m/s. F_avg = -30,000 / 5.0 = -6000 N.',
    },
    {
      kind: 'mcq',
      id: 'c03.q4',
      prompt: 'A truck hits a mosquito. Which gets the larger impulse?',
      choices: ['The truck', 'The mosquito', 'Both get the same size impulse'],
      answer: 2,
      hint: 'What does momentum conservation say about the two changes?',
      explain: 'They interact with each other only, so the impulses are equal and opposite. The mosquito\'s velocity changes enormously because its mass is tiny; the truck\'s barely changes.',
    },
    {
      kind: 'selfExplain',
      id: 'c03.q5',
      prompt: 'Explain why an airbag reduces the force on a passenger even though the passenger\'s momentum change is the same.',
      model: 'The passenger has to lose the same momentum either way, so the impulse F Δt is fixed. The airbag makes the stop take longer, so Δt is bigger and the average force is smaller.',
    },
  ],
};

export const c04: Lesson = {
  id: 'c04',
  unit: 'C',
  chapter: 'C4',
  title: 'Particles and systems',
  minutes: 7,
  needs: ['lab.vector-add'],
  steps: [
    {
      kind: 'explain',
      md: `Any group of objects can be treated as a **system**. Its total momentum is

**p_total = M v_cm**

where M is the total mass and **v_cm** is the velocity of the **center of mass**, the mass-weighted average position:

x_cm = (m₁x₁ + m₂x₂ + …) / M

Interactions **inside** the system cannot change its total momentum. So if nothing outside interacts with the system, its center of mass moves at constant velocity, however wildly the parts bounce around.`,
    },
    {
      kind: 'predict',
      id: 'c04.q1',
      prompt: 'Two pucks of different mass slide toward each other and collide. Watch the center of mass (the cross). After the collision, will its velocity be the same as before, or different?',
      setup: {
        sim: 'com',
        seconds: 2,
        world: { width: 10, height: 6, walls: false, e: 0.8, bodies: [{ x: 2, y: 3.1, vx: 2, vy: 0, m: 3, r: 0.3 }, { x: 6, y: 2.9, vx: -1, vy: 0.2, m: 1, r: 0.3 }] },
      },
      choices: [{ text: 'The same', claim: { kind: 'com-velocity', change: 'same' } }, { text: 'Different', claim: { kind: 'com-velocity', change: 'different' } }],
      answer: 0,
      reveal: 'The collision is an interaction inside the system, so it cannot change the total momentum. The center of mass sails on at the same velocity while the pucks scatter.',
    },
    {
      kind: 'numeric',
      id: 'c04.q2',
      prompt: 'A 2.0 kg mass sits at x = 0 and a 3.0 kg mass sits at x = 5.0 m. Where is their center of mass?',
      answer: q(3, D.length),
      hint: 'x_cm = (m₁x₁ + m₂x₂) / (m₁ + m₂).',
      worked: 'x_cm = (2.0 × 0 + 3.0 × 5.0) / 5.0 = 15 / 5.0 = 3.0 m, closer to the heavier mass.',
    },
    {
      kind: 'numeric',
      id: 'c04.q3',
      prompt: 'A 2.0 kg puck moves at ⟨3, 0⟩ m/s and a 3.0 kg puck moves at ⟨0, 2⟩ m/s. What is the velocity of their center of mass?',
      answer: q([1.2, 1.2], D.velocity),
      hint: 'v_cm = p_total / M.',
      worked: 'p_total = ⟨6, 0⟩ + ⟨0, 6⟩ = ⟨6, 6⟩ kg·m/s. v_cm = ⟨6, 6⟩ / 5.0 = ⟨1.2, 1.2⟩ m/s.',
    },
    {
      kind: 'triage',
      id: 'c04.q4',
      problem: 'Two ice skaters, 50 kg and 75 kg, stand together at rest and push apart. The 50 kg skater moves away at 1.5 m/s. How fast does the 75 kg skater move?',
      stages: [
        { stage: 'Translate', prompt: 'Asked: the speed of the heavier skater after the push.', tip: 'Speed only, so give a positive number.' },
        { stage: 'Represent', prompt: 'Draw the two skaters moving apart from a common start; mark the center of mass.', tip: 'The center of mass starts at rest.' },
        { stage: 'Identify', prompt: 'The push is internal to the two-skater system.', tip: 'So the center of mass stays at rest and total momentum stays zero.', check: { choices: ['Total momentum stays zero', 'Each skater\'s momentum stays zero', 'Kinetic energy is conserved'], answer: 0 } },
        { stage: 'Assume', prompt: 'Ice is frictionless; nothing outside pushes horizontally.', tip: 'Real ice has a little friction, but the push is short.' },
        { stage: 'Generate', prompt: '0 = (50)(-1.5) + (75)v.', tip: 'Solve for v.' },
        { stage: 'Evaluate', prompt: 'Check the size.', tip: 'The heavier skater should move slower, by the mass ratio 50/75: 1.5 × 2/3 = 1.0 m/s ✓.' },
      ],
      answer: q(1, D.velocity),
      hint: 'Momentum is zero before, so it is zero after.',
      worked: '0 = 50(-1.5) + 75 v → v = 75 / 75 = 1.0 m/s.',
    },
    {
      kind: 'selfExplain',
      id: 'c04.q5',
      prompt: 'Explain how fireworks bursting in the sky illustrate the center-of-mass idea.',
      model: 'The explosion is internal to the shell, so it cannot change the total momentum. Ignoring air drag, the center of mass of all the pieces keeps following the same arc the shell would have followed, even though the pieces fly off in every direction.',
    },
  ],
};
