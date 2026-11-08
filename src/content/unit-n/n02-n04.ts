import type { Lesson } from '../types';
import { D, deg, q } from '../units';

export const n02: Lesson = {
  id: 'n02',
  unit: 'N',
  chapter: 'N2',
  title: 'Forces from motion',
  minutes: 7,
  needs: ['lab.units', 'lab.vectors', 'lab.vector-add'],
  steps: [
    {
      kind: 'explain',
      md: `A **free-body diagram** shows one object as a dot and every force **on** that object as an arrow. Each arrow must be exerted **by** something you can name.

| Force | Exerted by | Direction | Size |
|---|---|---|---|
| Gravity F_g | the Earth | down | m g, with g = 9.8 N/kg near Earth |
| Normal F_N | a surface | perpendicular to the surface, pushing out | whatever it takes to stop the objects overlapping |
| Tension F_T | a string or rope | along the string, pulling | the same all along an ideal string |
| Friction F_f | a surface | along the surface, against sliding | static up to μs F_N; kinetic μk F_N |
| Drag F_D | air or water | opposite to the velocity | grows with speed |
| Spring F_sp | a spring | toward its relaxed length | k × (stretch) |

To get forces **from motion**: find the acceleration (Δv / Δt, or from a motion diagram), then use **F_net = m a**. The net force points the way the acceleration points, which is not always the way the object moves.

**Feynman habit:** draw the free-body diagram before writing any equation, and say each arrow out loud: "the ___ pushes (or pulls) on the ___". If you can't fill in the first blank, it is not a force. There is no "force of motion".`,
    },
    {
      kind: 'mcq',
      id: 'n02.q1',
      prompt: 'A hockey puck slides across frictionless ice at constant velocity. Which forces act on the puck while it slides? (Ignore air.)',
      choices: ['Gravity (down) and the normal force (up) only', 'Gravity, the normal force, and a forward force that keeps it moving', 'Gravity only', 'No forces at all, because its velocity is constant'],
      answer: 0,
      hint: 'For each candidate force, name the object exerting it. What touches the puck?',
      explain: 'Only the Earth (gravity) and the ice (normal force) interact with the puck, and they balance. Constant velocity needs zero net force, not a forward force. The stick\'s push ended when the puck left the stick.',
    },
    {
      kind: 'numeric',
      id: 'n02.q2',
      prompt: 'A 60 kg student stands on a bathroom scale in an elevator that is moving upward but slowing down at 1.5 m/s². The scale reads the size of the normal force on the student. What does it read? Use g = 9.8 m/s².',
      answer: q(60 * (9.8 - 1.5), D.force),
      hint: 'Moving up while slowing down means the acceleration points down. Take up as positive and write F_N - m g = m a.',
      worked: 'Up is +, so a = -1.5 m/s². F_N - (60)(9.8) = (60)(-1.5) → F_N = 60 × (9.8 - 1.5) = 498 N ≈ 500 N, less than the student\'s 588 N weight.',
    },
    {
      kind: 'explain',
      md: `**Newton's third law:** if A pushes on B, then B pushes on A with a force of the same size, in the opposite direction, and of the **same type** (gravity pairs with gravity, contact with contact).

The two forces of a third-law pair act on **different objects**. So they never appear on the same free-body diagram and they never cancel each other.

**Balanced forces** are something else: two or more forces on the **same** object that happen to add to zero. To find a force's third-law partner, swap the words: "A on B" becomes "B on A".`,
    },
    {
      kind: 'mcq',
      id: 'n02.q3',
      prompt: 'A book rests on a table. The Earth pulls down on the book. What is the third-law partner of that force?',
      choices: ['The table\'s upward normal force on the book', 'The book\'s upward gravitational pull on the Earth', 'The book\'s downward push on the table', 'There is none, because the book is at rest'],
      answer: 1,
      hint: 'Swap the objects: "Earth on book" becomes "book on ___". The type must stay the same.',
      explain: 'The partner of "Earth pulls book (gravity)" is "book pulls Earth (gravity)", upward and equally strong. The table\'s normal force does balance the book\'s weight, but that is a different force type on the same object, so it is not a third-law pair.',
    },
    {
      kind: 'numeric',
      id: 'n02.q4',
      prompt: 'A 2.0 kg drone\'s velocity changes steadily from ⟨3.0, 1.0⟩ m/s to ⟨5.0, -3.0⟩ m/s in 0.50 s (x horizontal, y up). What is the net force on the drone? Give it as a vector, <a, b> N.',
      answer: q([(2 * (5 - 3)) / 0.5, (2 * (-3 - 1)) / 0.5], D.force),
      hint: 'Find Δv component by component, divide by Δt to get a, then multiply by m.',
      worked: 'Δv = ⟨5.0 - 3.0, -3.0 - 1.0⟩ = ⟨2.0, -4.0⟩ m/s. a = Δv / Δt = ⟨4.0, -8.0⟩ m/s². F_net = m a = ⟨8.0, -16⟩ N. The net force points along Δv, not along either velocity.',
    },
    {
      kind: 'triage',
      id: 'n02.q5',
      problem: 'A 5.0 kg crate is dragged across a level floor by a horizontal rope with a tension of 25 N. Its speed rises steadily from 1.0 m/s to 3.0 m/s in 2.0 s. What is the friction force on the crate? Give its x-component, taking +x in the direction of motion.',
      stages: [
        { stage: 'Translate', prompt: 'Asked: the friction force on the crate, as a signed x-component.', tip: 'Friction is not given directly. It has to come out of the motion.' },
        { stage: 'Represent', prompt: 'Free-body diagram: tension 25 N along +x, friction along the x-axis (unknown), gravity down, normal force up.', tip: 'Nothing moves vertically, so the vertical forces balance and only x matters.' },
        { stage: 'Identify', prompt: 'Which idea links the motion to the unknown force?', tip: 'Get the acceleration from the speeds, then use F_net = m a.', check: { choices: ['F_net,x = m a_x, with a_x from the change in speed', 'Friction equals the tension, because the forces balance', 'Friction is zero, because the crate moves forward'], answer: 0 } },
        { stage: 'Assume', prompt: 'The acceleration is constant ("steadily") and the rope is horizontal.', tip: 'If the rope were slanted, only its horizontal component would go into the x equation.' },
        { stage: 'Generate', prompt: 'a_x = (3.0 - 1.0) / 2.0 = 1.0 m/s². Then 25 + F_f,x = (5.0)(1.0).', tip: 'Solve for F_f,x.' },
        { stage: 'Evaluate', prompt: 'Check the sign and the size.', tip: 'Negative: friction points backward ✓. Its size (20 N) is less than the 25 N tension, as it must be for the crate to speed up ✓.' },
      ],
      answer: q(5 * ((3 - 1) / 2) - 25, D.force),
      hint: 'Net force = tension + friction = m a.',
      worked: 'a_x = (2.0 m/s) / (2.0 s) = 1.0 m/s². F_net,x = 5.0 × 1.0 = 5.0 N = 25 N + F_f,x → F_f,x = 5.0 - 25 = -20 N.',
    },
    {
      kind: 'selfExplain',
      id: 'n02.q6',
      prompt: 'A horse pulls a cart. By Newton\'s third law the cart pulls back on the horse just as hard. Explain how the horse and cart can still speed up.',
      model: 'The two forces of a third-law pair act on different objects, so they cannot cancel. Whether the cart speeds up depends only on the forces on the cart: the horse\'s forward pull beats the backward friction on its wheels. The horse speeds up because the ground pushes forward on its hooves harder than the cart pulls back on it.',
    },
  ],
};

export const n03: Lesson = {
  id: 'n03',
  unit: 'N',
  chapter: 'N3',
  title: 'Motion from forces',
  minutes: 7,
  needs: ['lab.units', 'lab.sigfigs'],
  steps: [
    {
      kind: 'explain',
      md: `Newton's second law also runs forwards: **know the forces, predict the motion**, with a = F_net / m. If the net force is constant, so is the acceleration, and three formulas follow (along one axis; signs matter):

- v = v₀ + a t
- x = x₀ + v₀ t + ½ a t²
- v² = v₀² + 2 a Δx (use this when time is neither given nor asked)

**Free fall:** when gravity is the only force, F_net = m g, so a = g = 9.8 m/s² downward for every object. The mass cancels.

**Feynman habit:** check limiting cases. Put t = 0 into x = x₀ + v₀ t + ½ a t² and you get x₀; put a = 0 and you get steady motion. A result that fails a limit you understand is wrong, however tidy the algebra looks.`,
    },
    {
      kind: 'mcq',
      id: 'n03.q1',
      prompt: 'A 5.0 kg bowling ball and a 0.50 kg ball are dropped together from the same height. Ignoring air resistance, which lands first?',
      choices: ['The 5.0 kg ball, because gravity pulls on it 10 times harder', 'They land at the same time', 'The 0.50 kg ball, because it is easier to accelerate'],
      answer: 1,
      hint: 'Compare F_net / m for the two balls.',
      explain: 'Gravity on the heavy ball is 10 times bigger, but its mass is also 10 times bigger, so a = F/m = g for both. Same acceleration from the same start means they land together.',
    },
    {
      kind: 'numeric',
      id: 'n03.q2',
      prompt: 'A 1200 kg car starts from rest. The net force on it is a constant 3000 N forward. How far does it travel in the first 4.0 s?',
      answer: q(0.5 * (3000 / 1200) * 4 ** 2, D.length),
      hint: 'Find a = F_net / m first. It starts from rest, so v₀ = 0.',
      worked: 'a = 3000 N / 1200 kg = 2.5 m/s². x = ½ (2.5)(4.0)² = 20 m.',
    },
    {
      kind: 'numeric',
      id: 'n03.q3',
      prompt: 'A stone is thrown straight up at 7.0 m/s from a bridge 20 m above a river. Ignoring air resistance, what is its velocity just before it hits the water? Take up as positive and use g = 9.8 m/s².',
      answer: q(-Math.sqrt(7 ** 2 + 2 * 9.8 * 20), D.velocity),
      hint: 'With up positive, a = -9.8 m/s² and the stone ends 20 m below its start, so Δy = -20 m. No time is given.',
      worked: 'v² = v₀² + 2 a Δy = 7.0² + 2(-9.8)(-20) = 49 + 392 = 441 m²/s², so |v| = 21 m/s. It is moving down, so v = -21 m/s.',
    },
    {
      kind: 'mcq',
      id: 'n03.q4',
      prompt: 'A ball is thrown straight up. At the very top of its path (ignoring air), what is its acceleration?',
      choices: ['Zero, because it has stopped', '9.8 m/s² downward', '9.8 m/s² upward', 'Zero for an instant, then 9.8 m/s² downward'],
      answer: 1,
      hint: 'What forces act on the ball at the top? Velocity can be zero while acceleration is not.',
      explain: 'Gravity still acts at the top, so F_net = m g downward and a = 9.8 m/s² downward. Its velocity is momentarily zero, but it is changing from up to down, and a change in velocity is exactly what acceleration measures.',
    },
    {
      kind: 'explain',
      md: `Many forces change as the object moves: drag grows with speed, a spring's force depends on position. Then the constant-acceleration formulas fail, but a **step-by-step model** still works. Choose a small time step Δt and repeat:

- Compute the net force from the current state, then a = F_net / m.
- Update the velocity: v_new = v + a Δt.
- Update the position: x_new = x + v_new Δt.

Each step pretends the acceleration stays fixed for one Δt. Smaller steps give better answers, and a computer can take millions of them.`,
    },
    {
      kind: 'numeric',
      id: 'n03.q5',
      prompt: 'A 1.0 kg ball is dropped from rest. Air drag on it has size (0.10 kg/m) v², pointing up while it falls. Model it step by step with Δt = 0.50 s: each step, compute a from the current speed, then v_new = v + a Δt. Taking down as positive, what is v after two steps (t = 1.0 s)? Use g = 9.8 m/s².',
      answer: q(9.8 * 0.5 + (9.8 - (0.1 * (9.8 * 0.5) ** 2) / 1.0) * 0.5, D.velocity),
      hint: 'In step 1 the speed is zero, so there is no drag yet. In step 2, use the speed you got from step 1 to find the drag.',
      worked: 'Step 1: v = 0, drag 0, a = 9.8 m/s², v = 0 + 9.8 × 0.50 = 4.9 m/s. Step 2: drag = 0.10 × 4.9² = 2.40 N, a = (9.8 - 2.40) / 1.0 = 7.40 m/s², v = 4.9 + 7.40 × 0.50 = 8.60 m/s. (Very small steps give about 7.5 m/s: big steps overshoot here because they use the smaller, start-of-step drag for the whole step.)',
    },
    {
      kind: 'triage',
      id: 'n03.q6',
      problem: 'A 2.0 kg box is pulled straight up from rest by a rope with a constant tension of 29.6 N. How fast is it moving after it has risen 2.5 m? Use g = 9.8 m/s² and ignore air resistance.',
      stages: [
        { stage: 'Translate', prompt: 'Asked: the box\'s speed after rising 2.5 m from rest.', tip: 'No time is given and none is asked for. Note that now.' },
        { stage: 'Represent', prompt: 'Free-body diagram: tension 29.6 N up, gravity (2.0)(9.8) = 19.6 N down. Take up as positive.', tip: 'Draw the tension arrow longer than the gravity arrow: the box speeds up.' },
        { stage: 'Identify', prompt: 'Once you have a from F_net / m, which kinematics formula fits?', tip: 'Pick the one without t.', check: { choices: ['v² = v₀² + 2 a Δy', 'v = v₀ + a t', 'y = y₀ + v₀ t + ½ a t²'], answer: 0 } },
        { stage: 'Assume', prompt: 'Both forces are constant, so a is constant. The rope is massless and there is no drag.', tip: 'Constant acceleration is what makes the formulas valid.' },
        { stage: 'Generate', prompt: 'a = (29.6 - 19.6) / 2.0 = 5.0 m/s². Then v² = 0 + 2(5.0)(2.5).', tip: 'Solve for v.' },
        { stage: 'Evaluate', prompt: 'Check the units and the size.', tip: '√(m/s² × m) = m/s ✓. With a tension of exactly 19.6 N the box would not accelerate at all; 10 N extra on 2.0 kg gives a moderate 5.0 m/s², so 5.0 m/s after 2.5 m is reasonable.' },
      ],
      answer: q(Math.sqrt(2 * ((29.6 - 2 * 9.8) / 2) * 2.5), D.velocity),
      hint: 'Net force first, then acceleration, then the time-free kinematics formula.',
      worked: 'F_net = 29.6 - 19.6 = 10 N up. a = 10 / 2.0 = 5.0 m/s². v² = 2 × 5.0 × 2.5 = 25 m²/s², so v = 5.0 m/s.',
    },
    {
      kind: 'selfExplain',
      id: 'n03.q7',
      prompt: 'Explain why a step-by-step model gets more accurate as the time step Δt gets smaller, and how you could check whether your Δt is small enough.',
      model: 'During each step the model treats the acceleration as fixed at its start-of-step value, but really it changes during the step (the drag grows as the ball speeds up). A shorter step leaves less time for it to change, so the error shrinks. To check, halve Δt and run again: if the answer barely changes, the step was small enough.',
    },
  ],
};

export const n04: Lesson = {
  id: 'n04',
  unit: 'N',
  chapter: 'N4',
  title: 'Statics',
  minutes: 7,
  needs: ['lab.trig', 'lab.vectors'],
  steps: [
    {
      kind: 'explain',
      md: `An object is in **equilibrium** when F_net = 0, so its acceleration is zero: it is at rest, or moving at constant velocity. In components that is two equations:

- ΣF_x = 0
- ΣF_y = 0

Ropes and cables pull along their length. A rope at angle θ above the horizontal with tension T pulls with components T cos θ (horizontal) and T sin θ (vertical). The recipe: draw the free-body diagram, choose axes, split every slanted force into components, then solve.`,
    },
    {
      kind: 'numeric',
      id: 'n04.q1',
      prompt: 'A 10 kg lamp hangs from the midpoint of a wire. Each half of the wire makes 30° below the horizontal. What is the tension in each half of the wire? Use g = 9.8 m/s².',
      answer: q((10 * 9.8) / (2 * Math.sin(deg(30))), D.force),
      hint: 'Only the vertical components hold the lamp up. Each half supplies T sin 30° upward.',
      worked: 'ΣF_y = 0: 2 T sin 30° = m g → T = (10 × 9.8) / (2 × 0.50) = 98 N. Each half carries the full weight, not half of it: much of each tension is spent pulling sideways against the other half.',
    },
    {
      kind: 'mcq',
      id: 'n04.q2',
      prompt: 'A wet towel hangs from the middle of a clothesline. You pull the line tighter so that it sags less (the angle to the horizontal gets smaller). What happens to the tension in the line?',
      choices: ['It gets smaller, because the line is tighter', 'It stays the same, because the towel weighs the same', 'It gets bigger, and grows without limit as the line approaches straight', 'It gets bigger, but never more than the towel\'s weight'],
      answer: 2,
      hint: 'Write the vertical balance, 2 T sin θ = m g, and let θ shrink.',
      explain: 'T = m g / (2 sin θ). As θ → 0, sin θ → 0 and T → ∞. A loaded line can never be pulled perfectly straight, and a nearly straight one carries a tension many times the load.',
    },
    {
      kind: 'explain',
      md: `Contact forces come from tiny squashes and stretches of the materials, so surfaces and ropes behave like very stiff springs.

| Force | Rule |
|---|---|
| Static friction (not sliding) | whatever size is needed, up to a ceiling: F_s ≤ μs F_N |
| Kinetic friction (sliding) | F_k = μk F_N, opposite to the sliding, roughly independent of speed |
| Spring (Hooke's law) | F_sp = k × (stretch or compression), toward the relaxed length |

μs F_N is a **maximum**, not the value. A crate that nobody pushes has zero friction on it. Usually μk < μs, which is why things are harder to start than to keep sliding.

**Feynman habit:** test every formula on a case you already know. Set the rope angle to θ = 0 in a slanted-rope answer and you should get the horizontal-rope answer back. If you don't, find the mistake before you go on.`,
    },
    {
      kind: 'mcq',
      id: 'n04.q3',
      prompt: 'A 10 kg crate rests on a level floor with μs = 0.50. You push it horizontally with 20 N and it does not move. How big is the static friction force on it? (g = 9.8 m/s²)',
      choices: ['49 N, which is μs F_N', '20 N', 'Zero, because nothing is moving', '98 N, the crate\'s weight'],
      answer: 1,
      hint: 'The crate is in equilibrium. What must friction be to balance your push?',
      explain: 'ΣF_x = 0, so friction is exactly 20 N, opposite your push. 49 N is only the most static friction could supply; you would need to push harder than that to start the crate sliding.',
    },
    {
      kind: 'numeric',
      id: 'n04.q4',
      prompt: 'A 0.50 kg mass hangs at rest from a vertical spring with spring constant k = 49 N/m. How far is the spring stretched from its relaxed length? Use g = 9.8 m/s².',
      answer: q((0.5 * 9.8) / 49, D.length),
      hint: 'At rest, the spring force up balances gravity down: k x = m g.',
      worked: 'k x = m g → x = (0.50 × 9.8) / 49 = 4.9 / 49 = 0.10 m.',
    },
    {
      kind: 'numeric',
      id: 'n04.q5',
      prompt: 'A 5.0 kg block on a level floor is attached to a horizontal spring (k = 98 N/m) whose other end is fixed to a wall. The coefficient of static friction is μs = 0.40. You slide the block away from the wall, stretching the spring, and release it gently. What is the largest stretch at which the block stays at rest? Use g = 9.8 m/s².',
      answer: q((0.4 * 5 * 9.8) / 98, D.length),
      hint: 'The block stays put as long as the spring force is no bigger than the static friction ceiling μs F_N.',
      worked: 'F_N = m g = 49 N, so the friction ceiling is 0.40 × 49 = 19.6 N. k x ≤ 19.6 N → x ≤ 19.6 / 98 = 0.20 m.',
    },
    {
      kind: 'predict',
      id: 'n04.p1',
      prompt: 'A 1.0 kg block sits at rest on a 25° slope. Between the block and the slope, μs = 0.50 and μk = 0.40. You let go. What happens?',
      setup: { sim: 'incline', params: { m: 1, angle: (25 * Math.PI) / 180, muS: 0.5, muK: 0.4, g: 9.8, length: 4 }, startS: 1, startV: 0, seconds: 2 },
      choices: [
        { text: 'It slides down, because the slope is tilted', claim: { kind: 'ends-lower', lower: true } },
        { text: 'It stays put', claim: { kind: 'ends-lower', lower: false } },
      ],
      answer: 1,
      reveal: 'Static friction holds it. The block stays as long as mg sinθ ≤ μs mg cosθ, that is tanθ ≤ μs: tan 25° = 0.47 ≤ 0.50. Look at the arrows: static friction is only mg sinθ = 4.1 N up the slope, not its maximum μs N = 4.4 N. Static friction is only as big as it needs to be. Tilt the slope a few degrees steeper in the Playground and it lets go.',
    },
    {
      kind: 'triage',
      id: 'n04.q6',
      problem: 'A 20 kg crate is dragged across a level floor at constant velocity by a rope pulled at 30° above the horizontal. The coefficient of kinetic friction is 0.40. What is the tension in the rope? Use g = 9.8 m/s².',
      stages: [
        { stage: 'Translate', prompt: 'Asked: the size of the tension. "Constant velocity" means a = 0.', tip: 'Constant velocity is equilibrium, just like rest.' },
        { stage: 'Represent', prompt: 'Free-body diagram: T at 30° above +x, kinetic friction along -x, normal force up, gravity (20)(9.8) = 196 N down. +x forward, +y up.', tip: 'Split T into T cos 30° (along x) and T sin 30° (along y).' },
        { stage: 'Identify', prompt: 'Is the normal force equal to m g = 196 N here?', tip: 'Write ΣF_y = 0 including the rope before deciding.', check: { choices: ['Yes, because the floor is level', 'No, it is less, because the rope lifts part of the weight', 'No, it is more, because the rope pulls on the crate'], answer: 1 } },
        { stage: 'Assume', prompt: 'Kinetic friction is μk F_N, the rope is massless, and the crate slides without tipping.', tip: 'Sliding means kinetic friction, so its size is fixed by F_N.' },
        { stage: 'Generate', prompt: 'x: T cos 30° - 0.40 F_N = 0. y: F_N + T sin 30° - 196 = 0. Substitute F_N = 196 - T sin 30° into the x equation.', tip: 'You get T (cos 30° + 0.40 sin 30°) = 0.40 × 196.' },
        { stage: 'Evaluate', prompt: 'Test a limiting case.', tip: 'At θ = 0 the formula gives T = μk m g = 78 N. The slanted pull needs a bit less (about 74 N) because it lightens the normal force and so the friction ✓.' },
      ],
      answer: q((0.4 * 20 * 9.8) / (Math.cos(deg(30)) + 0.4 * Math.sin(deg(30))), D.force),
      hint: 'The normal force is unknown too. Write both equilibrium equations and solve them together.',
      worked: 'T = (0.40 × 196) / (cos 30° + 0.40 sin 30°) = 78.4 / (0.866 + 0.200) = 78.4 / 1.066 ≈ 73.5 N. Then F_N = 196 - 73.5 × 0.50 ≈ 159 N, less than the weight.',
    },
    {
      kind: 'selfExplain',
      id: 'n04.q7',
      prompt: 'A crate sits on a level floor with μs = 0.60. Explain why the static friction force on it is not simply μs F_N, and what μs F_N actually tells you.',
      model: 'Static friction is whatever force keeps the surfaces from sliding, so it just balances the other horizontal forces: zero if nobody pushes, 20 N against a 20 N push. μs F_N is only the ceiling, the most static friction can supply. Push harder than that and the crate starts to slide, and kinetic friction takes over.',
    },
  ],
};
