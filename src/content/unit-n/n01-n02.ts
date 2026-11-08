import type { Lesson } from '../types';
import { D, q } from '../units';

export const n01: Lesson = {
  id: 'n01',
  unit: 'N',
  chapter: 'N1',
  title: 'Newton\'s laws',
  minutes: 7,
  needs: ['lab.units', 'lab.vector-add'],
  steps: [
    {
      kind: 'explain',
      md: `Unit C said interactions transfer momentum. A **force** is the **rate** of that transfer:

**F = dp/dt**

Add up every force on an object and you get the net force. When the mass is fixed, dp/dt = m dv/dt, so

**F_net = m a**

- **First law:** an object with no net force on it keeps a constant velocity (constant momentum). Nothing is needed to *keep* it moving.
- **Second law:** F_net = dp/dt = m a. The net force points the same way as the acceleration, not necessarily the velocity.
- **Third law:** if A pushes on B, B pushes on A with an equal and opposite force. It is momentum conservation: what B gains, A loses. The two forces act on **different** objects.

The unit of force is the **newton**: 1 N = 1 kg·m/s². These laws hold in **inertial frames**, frames that are not accelerating. The ground is close enough for everyday problems; a braking bus is not.

**Feynman habit:** explain it to a friend with no physics. If you catch yourself saying "the force keeps it going", stop: that is exactly the idea the first law throws out.`,
    },
    {
      kind: 'mcq',
      id: 'n01.q1',
      prompt: 'A hockey puck slides across perfectly frictionless ice at a steady 5 m/s. What horizontal force is needed to keep it moving?',
      choices: ['A forward force that matches its speed', 'A forward force that slowly fades away', 'None: with no horizontal interactions its momentum stays constant', 'A forward force equal to its weight'],
      answer: 2,
      hint: 'What does the first law say about an object with zero net force?',
      explain: 'No force is needed. A force changes momentum; it does not maintain it. On real ice the puck slows because friction transfers momentum out of it, not because a "moving force" runs out.',
    },
    {
      kind: 'numeric',
      id: 'n01.q2',
      prompt: 'A 1200 kg car speeds up steadily from 10 m/s to 25 m/s in 6.0 s along a straight, level road. What is the magnitude of the net force on it?',
      answer: q((1200 * (25 - 10)) / 6, D.force),
      hint: 'Find the acceleration first, then use F_net = m a. Or find the momentum change per second.',
      worked: 'a = Δv / Δt = (25 - 10) / 6.0 = 2.5 m/s². F_net = m a = 1200 × 2.5 = 3000 N. Same thing as momentum transfer: Δp / Δt = (30,000 - 12,000) / 6.0 = 3000 N.',
    },
    {
      kind: 'numeric',
      id: 'n01.q3',
      prompt: 'Seen from above, a 4.0 kg puck on frictionless horizontal ice feels two horizontal forces: F₁ = ⟨6.0, 0⟩ N and F₂ = ⟨-2.0, 6.0⟩ N (gravity and the normal force cancel). What is its acceleration vector, using the same x and y axes?',
      answer: q([(6 - 2) / 4, (0 + 6) / 4], D.acceleration),
      hint: 'Add the forces as vectors to get F_net, then divide each component by the mass.',
      worked: 'F_net = ⟨6.0 - 2.0, 0 + 6.0⟩ = ⟨4.0, 6.0⟩ N. a = F_net / m = ⟨4.0, 6.0⟩ / 4.0 = ⟨1.0, 1.5⟩ m/s².',
    },
    {
      kind: 'mcq',
      id: 'n01.q4',
      prompt: 'A horse pulls a cart forward. By the third law, the cart pulls back on the horse with a force of the same size. So how can the horse and cart ever speed up?',
      choices: [
        'They can\'t: the two forces cancel, so the pair moves at constant velocity',
        'The horse pulls slightly harder on the cart than the cart pulls back',
        'The two forces act on different objects, so they never cancel each other; each object speeds up if the forces on it are unbalanced',
        'The third law only applies to objects at rest',
      ],
      answer: 2,
      hint: 'To decide whether the cart speeds up, which forces do you add: the ones on the cart, or the ones on the cart and the horse?',
      explain: 'Third-law pairs act on different objects, so they never appear in the same free-body sum. The cart speeds up because the horse\'s pull on it is bigger than the friction on it. The horse speeds up because the ground pushes it forward harder than the cart pulls back.',
    },
    {
      kind: 'mcq',
      id: 'n01.q5',
      prompt: 'You are standing in a bus that brakes hard. A ball on the floor rolls toward the front of the bus, though nothing pushes it forward. What is the best explanation?',
      choices: [
        'A forward "braking force" acts on the ball',
        'The braking bus is not an inertial frame; in the ground\'s frame the ball just keeps its velocity while the bus slows down under it',
        'The ball\'s inertia is a force that pushes it forward',
        'Newton\'s first law does not apply to rolling objects',
      ],
      answer: 1,
      hint: 'Is the bus accelerating? Look at the ball from the sidewalk instead.',
      explain: 'Newton\'s laws hold in inertial (non-accelerating) frames. From the sidewalk, nothing horizontal acts on the ball, so it keeps going at the old speed (first law) while the bus slows. Inertia is not a force; it is the absence of a reason to change.',
    },
    {
      kind: 'triage',
      id: 'n01.q6',
      problem: 'A fire hose sprays 3.0 kg of water per second horizontally at 12 m/s onto a wall. The water hits the wall and runs straight down it (it does not bounce back). What is the magnitude of the horizontal force the water exerts on the wall?',
      stages: [
        { stage: 'Translate', prompt: 'Asked: the size of the horizontal force from the water on the wall.', tip: 'No single "object" has a mass and an acceleration here. That is a clue to think about momentum transfer instead.' },
        { stage: 'Represent', prompt: 'Sketch water arriving at 12 m/s toward the wall and leaving with zero horizontal velocity, running down the wall.', tip: 'Draw a positive direction arrow pointing toward the wall.' },
        { stage: 'Identify', prompt: 'Which idea gives a force from a steady stream?', tip: 'Force is the rate of momentum transfer.', check: { choices: ['F = dp/dt: the momentum delivered per second', 'F = m a with m = 3.0 kg', 'The weight of the water'], answer: 0 } },
        { stage: 'Assume', prompt: 'State your assumptions.', tip: 'The water loses all its horizontal momentum at the wall. Gravity is vertical, so it does not change the horizontal momentum.' },
        { stage: 'Generate', prompt: 'Each second, 3.0 kg of water loses 12 m/s of horizontal velocity: dp/dt = (3.0 kg/s)(12 m/s).', tip: 'The momentum the water loses, the wall gains (third law).' },
        { stage: 'Evaluate', prompt: 'Check units and size. Then a limiting case: if the water bounced straight back off the wall instead, would the force on the wall be bigger, the same, or smaller?', tip: '(kg/s)(m/s) = kg·m/s² = N ✓. 36 N is about the weight of a 3.7 kg bag, so a firefighter can brace against it. A bounce reverses the water\'s velocity, so more momentum changes each second and the force is bigger (up to double).', check: { choices: ['Bigger', 'The same', 'Smaller'], answer: 0 } },
      ],
      answer: q(3.0 * 12, D.force),
      hint: 'How much horizontal momentum arrives at the wall each second, and where does it go?',
      worked: 'dp/dt = (3.0 kg/s)(12 m/s - 0) = 36 kg·m/s each second, so the wall pushes the water with 36 N away from the wall, and the water pushes the wall with 36 N toward it.',
    },
    {
      kind: 'selfExplain',
      id: 'n01.q7',
      prompt: 'A car cruises at a constant 100 km/h on a straight highway with its engine working hard. Explain why the net force on it is zero, and what the engine is actually for.',
      model: 'Constant velocity means constant momentum, so the net rate of momentum transfer into the car is zero: the net force is zero. The engine makes the wheels push back on the road, so the road pushes the car forward. That forward force exactly balances air drag and rolling friction, which keep taking momentum away. The engine is not needed to keep the car moving; it is needed to cancel the forces that would slow it down.',
    },
  ],
};

export const n02: Lesson = {
  id: 'n02',
  unit: 'N',
  chapter: 'N2',
  title: 'Vector calculus of motion',
  minutes: 7,
  needs: ['lab.vectors', 'lab.vector-add'],
  steps: [
    {
      kind: 'explain',
      md: `Velocity and acceleration are **time derivatives of vectors**:

**v = dr/dt** and **a = dv/dt**

Take them one component at a time: v_x = dx/dt, v_y = dy/dt, a_x = dv_x/dt, and so on.

A **motion diagram** shows an object's position as dots at equal time intervals Δt. The arrow from one dot to the next, divided by Δt, is the velocity. To find the acceleration at a dot:

- draw the velocity arrow arriving at the dot and the one leaving it, **tail to tail**
- **Δv** = v_after - v_before is the arrow from the first tip to the second
- **a** ≈ Δv / Δt points the same way as Δv

| Motion | Direction of a |
|---|---|
| speeding up in a straight line | along v |
| slowing down in a straight line | opposite to v |
| turning at constant speed | toward the inside of the turn |

A change in **direction** is a change in velocity, so a turning object accelerates even when its speed is constant.

**Feynman habit:** draw the picture first. Sketch the two velocity arrows tail to tail and guess the direction of Δv before calculating anything. Then check the numbers against your sketch.`,
    },
    {
      kind: 'numeric',
      id: 'n02.q1',
      prompt: 'A ball\'s position is r(t) = ⟨1.5t², 6.0t - 4.9t²⟩, in meters with t in seconds, x horizontal and y up. What is its velocity vector at t = 1.0 s?',
      answer: q([2 * 1.5 * 1, 6 - 2 * 4.9 * 1], D.velocity),
      hint: 'Differentiate each component separately, then put in t = 1.0 s.',
      worked: 'v = dr/dt = ⟨3.0t, 6.0 - 9.8t⟩. At t = 1.0 s: v = ⟨3.0, 6.0 - 9.8⟩ = ⟨3.0, -3.8⟩ m/s. The ball is already on its way down.',
    },
    {
      kind: 'numeric',
      id: 'n02.q2',
      prompt: 'For the same ball, r(t) = ⟨1.5t², 6.0t - 4.9t²⟩ m, what is its acceleration vector (x horizontal, y up)?',
      answer: q([2 * 1.5, -2 * 4.9], D.acceleration),
      hint: 'Differentiate the velocity components once more.',
      worked: 'a = dv/dt = d/dt ⟨3.0t, 6.0 - 9.8t⟩ = ⟨3.0, -9.8⟩ m/s². It is constant: gravity gives -9.8 m/s² in y, and something (a steady wind, say) gives 3.0 m/s² in x.',
    },
    {
      kind: 'mcq',
      id: 'n02.q3',
      prompt: 'A car drives around a circular curve at a constant speed of 15 m/s. Which way does its acceleration point?',
      choices: ['Nowhere: it is zero because the speed is constant', 'Forward, along the velocity', 'Toward the center of the curve', 'Away from the center of the curve'],
      answer: 2,
      hint: 'Draw two velocity arrows a moment apart on the curve, tail to tail. Which way does Δv point?',
      explain: 'The speed is constant but the direction is not, so v changes. The two velocity arrows have the same length but are rotated, and Δv between them points toward the center of the curve. "Thrown outward" is what it feels like from inside the car, which is not an inertial frame.',
    },
    {
      kind: 'mcq',
      id: 'n02.q4',
      prompt: 'A ball is thrown straight up. Ignore air resistance and take g = 9.8 m/s². At the very top of its flight, the ball is momentarily at rest. What is its acceleration at that instant?',
      choices: ['Zero, because it is at rest', '9.8 m/s² downward', '9.8 m/s² upward', 'It is switching from up to down, so it has no definite value'],
      answer: 1,
      hint: 'Acceleration is how fast the velocity is changing, not how big the velocity is. Is the velocity changing at the top?',
      explain: 'Just before the top the velocity is a little upward, just after it is a little downward, so Δv points down. Zero velocity is not zero acceleration. If a were zero at the top, the ball would hang there forever.',
    },
    {
      kind: 'numeric',
      id: 'n02.q5',
      prompt: 'A car heading due east at 20 m/s rounds a bend and, 5.0 s later, is heading due north at 15 m/s. What is its average acceleration vector over those 5.0 s? Use east = +x and north = +y.',
      answer: q([(0 - 20) / 5, (15 - 0) / 5], D.acceleration),
      hint: 'a_avg = Δv / Δt, with Δv = v_final - v_initial found component by component.',
      worked: 'v_i = ⟨20, 0⟩ m/s, v_f = ⟨0, 15⟩ m/s. Δv = ⟨0 - 20, 15 - 0⟩ = ⟨-20, 15⟩ m/s. a_avg = ⟨-20, 15⟩ / 5.0 = ⟨-4.0, 3.0⟩ m/s², magnitude 5.0 m/s², pointing 37° north of west, into the turn.',
    },
    {
      kind: 'triage',
      id: 'n02.q6',
      problem: 'A motion diagram for a puck shows three successive positions taken 0.50 s apart: A = (0, 0), B = (2.0, 0) and C = (4.0, 1.0), in meters. Estimate the puck\'s acceleration vector at B, using the same x and y axes.',
      stages: [
        { stage: 'Translate', prompt: 'Asked: the acceleration vector at the middle dot B.', tip: 'A vector answer, so give both components, e.g. <a, b> m/s².' },
        { stage: 'Represent', prompt: 'Plot A, B, C. Draw the arrow A→B and the arrow B→C, then redraw them tail to tail.', tip: 'The path bends toward +y, so expect Δv to point roughly in +y.' },
        { stage: 'Identify', prompt: 'a ≈ Δv / Δt, where v_AB = (B - A)/Δt and v_BC = (C - B)/Δt. What Δt separates these two velocity estimates?', tip: 'Each velocity is an average over one interval, so it belongs to the middle of that interval.', check: { choices: ['0.50 s', '1.0 s', '0.25 s'], answer: 0 } },
        { stage: 'Assume', prompt: 'Assume the acceleration is roughly constant over A to C.', tip: 'Three dots can only give an average; a finer diagram would give a better estimate.' },
        { stage: 'Generate', prompt: 'v_AB = ⟨2.0, 0⟩ / 0.50 = ⟨4.0, 0⟩ m/s. v_BC = ⟨2.0, 1.0⟩ / 0.50 = ⟨4.0, 2.0⟩ m/s. Δv = ⟨0, 2.0⟩ m/s.', tip: 'Now divide Δv by Δt.' },
        { stage: 'Evaluate', prompt: 'Check the direction.', tip: 'The x-velocity did not change and the puck turned toward +y, so a should point straight along +y, into the turn ✓.' },
      ],
      answer: q([((4.0 - 2.0) / 0.5 - (2.0 - 0) / 0.5) / 0.5, ((1.0 - 0) / 0.5 - (0 - 0) / 0.5) / 0.5], D.acceleration),
      hint: 'Find the two velocity arrows first, subtract them, then divide by the time between frames.',
      worked: 'v_AB = (B - A)/0.50 s = ⟨4.0, 0⟩ m/s and v_BC = (C - B)/0.50 s = ⟨4.0, 2.0⟩ m/s. Δv = ⟨0, 2.0⟩ m/s. a ≈ Δv / Δt = ⟨0, 2.0⟩ / 0.50 = ⟨0, 4.0⟩ m/s².',
    },
    {
      kind: 'selfExplain',
      id: 'n02.q7',
      prompt: 'Explain why a car rounding a curve at a steady 50 km/h is accelerating, and which way its acceleration points.',
      model: 'Velocity is a vector, so changing its direction changes it, even at constant speed. Draw the velocity arrows at two nearby moments: same length, slightly rotated. Put them tail to tail and the change Δv points toward the inside of the curve, so the acceleration points toward the center of the turn.',
    },
  ],
};
