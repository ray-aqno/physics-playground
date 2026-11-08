import type { Lesson } from '../types';
import { D, deg, q } from '../units';

export const n05: Lesson = {
  id: 'n05',
  unit: 'N',
  chapter: 'N5',
  title: 'Inclines, friction and drag',
  minutes: 7,
  needs: ['lab.trig', 'lab.vectors'],
  steps: [
    {
      kind: 'explain',
      md: `When an object is **constrained** to move along a line, such as a block on a ramp, pick axes along that line and perpendicular to it. Then the acceleration has only one nonzero component.

For a ramp tilted at angle θ above horizontal:

| Force | Along the slope | Perpendicular to the slope |
|---|---|---|
| Gravity | mg sinθ, downhill | mg cosθ, into the surface |
| Normal | 0 | N, out of the surface |
| Kinetic friction | μk N, opposite the motion | 0 |

The block does not sink into or lift off the ramp, so the perpendicular forces balance. With nothing else pushing perpendicular, **N = mg cosθ**, which is less than mg. The normal force is not a fixed number: it is whatever the surface must supply to enforce the constraint.

**Feynman habit:** check the limiting cases. At θ = 0 the ramp is a floor: sin 0 = 0 and N = mg. At θ = 90° it is a wall: the block is in free fall along it, and N = 0. If your formula fails either test, it is wrong.`,
    },
    {
      kind: 'mcq',
      id: 'n05.q1',
      prompt: 'A 5.0 kg block sits at rest on a ramp tilted 30° above horizontal. Nothing touches it except the ramp. Using g = 9.8 m/s², what is the magnitude of the normal force on the block?',
      choices: ['49 N', '42 N', '25 N', '57 N'],
      answer: 1,
      hint: 'Only the part of gravity perpendicular to the ramp is balanced by the normal force.',
      explain: 'Perpendicular to the ramp, N balances mg cos 30° = (5.0)(9.8)(0.866) = 42 N. Choosing 49 N treats the normal force as always equal to mg. 25 N is mg sin 30°, the part of gravity along the slope, and 57 N comes from dividing by cos 30° instead of multiplying.',
    },
    {
      kind: 'numeric',
      id: 'n05.q2',
      prompt: 'A cart is released on a frictionless ramp tilted 15° above horizontal. Take +x along the slope, pointing **uphill**. Using g = 9.8 m/s², what is the cart\'s acceleration component a_x?',
      answer: q(-9.8 * Math.sin(deg(15)), D.acceleration),
      hint: 'Only one force has a component along the slope. Which way does it point compared with +x?',
      worked: 'Along the slope, the only force is the gravity component mg sin 15°, pointing downhill. The normal force is perpendicular to the slope and contributes nothing. a_x = -g sin 15° = -(9.8)(0.259) = -2.5 m/s². The minus sign means downhill, whichever way the cart is moving.',
    },
    {
      kind: 'numeric',
      id: 'n05.q3',
      prompt: 'A book slides down a board tilted 20° above horizontal at **constant speed**. What is the coefficient of kinetic friction between the book and the board?',
      answer: q(Math.tan(deg(20)), D.none),
      hint: 'Constant speed means the net force is zero. Balance the forces along the slope and perpendicular to it.',
      worked: 'Perpendicular: N = mg cos 20°. Along the slope: friction balances gravity, so μk N = mg sin 20°. Divide: μk = sin 20° / cos 20° = tan 20° = 0.36. The mass and g cancel.',
    },
    {
      kind: 'predict',
      id: 'n05.p1',
      prompt: 'A 2.0 kg block is pushed up a 30° slope at 2.0 m/s and let go. Between the block and the slope, μs = 0.30 and μk = 0.20. Where does it end up?',
      setup: { sim: 'incline', params: { m: 2, angle: Math.PI / 6, muS: 0.3, muK: 0.2, g: 9.8, length: 5 }, startS: 3, startV: -2, seconds: 2 },
      choices: [
        { text: 'It stops at its highest point and stays there', claim: { kind: 'ends-lower', lower: false } },
        { text: 'It stops, then slides back down past where it started', claim: { kind: 'ends-lower', lower: true } },
      ],
      answer: 1,
      reveal: 'On the way up, gravity and kinetic friction both point down the slope: a = g(sinθ + μk cosθ) = 6.6 m/s², so it stops after only 0.30 m. At rest it stays only if tanθ ≤ μs, but tan 30° = 0.58 > 0.30, so it slides back. On the way down, friction now points up the slope: a = g(sinθ − μk cosθ) = 3.2 m/s². Watch the friction arrow flip at the turning point.',
    },
    {
      kind: 'triage',
      id: 'n05.q4',
      problem: 'A 2.0 kg box is released from rest at the top of a ramp tilted 30° above horizontal. The coefficient of kinetic friction between the box and the ramp is 0.20, and the box slides. How fast is it moving after it has slid 3.0 m down the ramp? Use g = 9.8 m/s².',
      stages: [
        { stage: 'Translate', prompt: 'What is asked: the box\'s speed (a magnitude) after a 3.0 m slide that starts from rest.', tip: 'Distance is given, not time. That points to v² = v0² + 2aΔx.' },
        { stage: 'Represent', prompt: 'Draw a free-body diagram: gravity straight down, normal force out of the ramp, kinetic friction up the slope (opposite the motion). Choose +x along the slope, downhill.', tip: 'Tilt your axes to match the ramp, then split gravity into mg sinθ along and mg cosθ perpendicular.' },
        { stage: 'Identify', prompt: 'What is the magnitude of the normal force here?', tip: 'The box stays on the ramp surface, so the perpendicular forces balance.', check: { choices: ['mg', 'mg cos 30°', 'mg sin 30°', 'μk mg'], answer: 1 } },
        { stage: 'Assume', prompt: 'Assume μk is constant along the ramp and air drag is negligible.', tip: 'Both make the acceleration constant, so constant-acceleration kinematics applies.' },
        { stage: 'Generate', prompt: 'Newton along the slope: m a = mg sin 30° - μk mg cos 30°, so a = g(sin 30° - μk cos 30°). Then v = √(2 a Δx).', tip: 'The mass cancels. You did not need the 2.0 kg.' },
        { stage: 'Evaluate', prompt: 'Check the size.', tip: 'Without friction, a = 4.9 m/s² and v = √(2 × 4.9 × 3.0) = 5.4 m/s. Friction must give less than that, and it does. If μk were tan 30° = 0.58, a would be zero.' },
      ],
      answer: q(Math.sqrt(2 * 9.8 * (Math.sin(deg(30)) - 0.2 * Math.cos(deg(30))) * 3), D.velocity),
      hint: 'Find the acceleration along the slope first, including friction μk N with N = mg cosθ.',
      worked: 'a = 9.8 × (sin 30° - 0.20 cos 30°) = 9.8 × (0.500 - 0.173) = 3.20 m/s² downhill. v² = 0 + 2(3.20)(3.0) = 19.2 m²/s², so v = 4.4 m/s.',
    },
    {
      kind: 'explain',
      md: `An object moving through air or water feels a **drag** force opposite its velocity. For everyday sizes and speeds:

**D = ½ C ρ A v²**

- C: drag coefficient, a number about 0.5 for a sphere and about 1 for a person falling flat
- ρ: the fluid's density (air is about 1.2 kg/m³)
- A: the object's cross-sectional area facing the flow
- v: its speed relative to the fluid

A falling object speeds up until drag grows to match its weight. Then the net force is zero and it falls at a steady **terminal speed**: ½ C ρ A v_t² = mg, so **v_t = √(2mg / (C ρ A))**.`,
    },
    {
      kind: 'mcq',
      id: 'n05.q5',
      prompt: 'Two balls have the same size and shape, but one is 4 times as massive as the other. Both are dropped from a tall tower in air and reach terminal speed. How do their terminal speeds compare?',
      choices: ['They are equal, because all objects fall at the same rate', 'The heavier ball\'s terminal speed is 2 times larger', 'The heavier ball\'s terminal speed is 4 times larger', 'The lighter ball\'s terminal speed is larger'],
      answer: 1,
      hint: 'Use v_t = √(2mg / (C ρ A)). Which quantities are the same for both balls?',
      explain: 'C, ρ and A are the same, so v_t is proportional to √m, and √4 = 2. "All objects fall at the same rate" is only true when drag is negligible, as in a vacuum or at low speed. With drag, a heavier object of the same shape needs a higher speed before drag can balance its weight.',
    },
    {
      kind: 'numeric',
      id: 'n05.q6',
      prompt: 'A 75 kg skydiver falls flat with drag coefficient C = 1.0 and cross-sectional area A = 0.70 m². The air density is 1.2 kg/m³. Using drag D = ½CρAv² and g = 9.8 m/s², what is the skydiver\'s terminal speed?',
      answer: q(Math.sqrt((2 * 75 * 9.8) / (1.0 * 1.2 * 0.7)), D.velocity),
      hint: 'At terminal speed, drag equals weight: ½ C ρ A v² = mg.',
      worked: 'v_t = √(2mg / (C ρ A)) = √(2 × 75 × 9.8 / (1.0 × 1.2 × 0.70)) = √(1470 / 0.84) = √1750 = 42 m/s, about 150 km/h.',
    },
    {
      kind: 'selfExplain',
      id: 'n05.q7',
      prompt: 'A friend says, "The normal force always equals the object\'s weight." Explain why that is wrong for a block on a ramp.',
      model: 'The normal force is whatever push the surface must supply to stop the block moving into it. On a ramp only the part of gravity perpendicular to the surface, mg cosθ, pushes into it, so N = mg cosθ, which is less than mg. The other part of gravity, mg sinθ, points along the slope, and the normal force has nothing to do with it. Pushing down on the block or accelerating the ramp would change N again.',
    },
  ],
};

export const n06: Lesson = {
  id: 'n06',
  unit: 'N',
  chapter: 'N6',
  title: 'Coupled objects',
  minutes: 7,
  needs: ['lab.units', 'lab.vectors'],
  steps: [
    {
      kind: 'explain',
      md: `Objects joined by strings, by pulleys, or simply by touching are **coupled**: what one does constrains the other.

- **Ideal string** (massless, does not stretch): it pulls with the same tension T at both ends, and both ends move the same distance, so the objects share the same **magnitude** of acceleration.
- **Ideal pulley** (massless, frictionless): it changes the string's direction but not its tension.
- **Contact:** two objects pushing on each other exert equal and opposite forces (Newton's third law).

**Choose the system on purpose.** Treat all the objects as one system and the forces between them are **internal**: they come in third-law pairs and cancel, so only external forces set the shared acceleration. To find an internal force such as a tension, isolate a single object and apply F_net = m a to it alone.

**Feynman habit:** before solving, guess the extremes. For two masses hanging over a pulley: equal masses should give a = 0, and one mass far heavier than the other should give a → g. Your final formula must pass both tests.`,
    },
    {
      kind: 'numeric',
      id: 'n06.q1',
      prompt: 'Block A (3.0 kg) and block B (2.0 kg) sit side by side on a frictionless floor, touching. You push A horizontally with 15 N, so A pushes B and both speed up together. What is the magnitude of the force A exerts on B?',
      answer: q(6, D.force),
      hint: 'Find the shared acceleration from the two-block system, then look at B alone.',
      worked: 'System A + B: the only horizontal external force is your 15 N, so a = 15 N / 5.0 kg = 3.0 m/s². B alone: the only horizontal force on B is A\'s push, so F = m_B a = (2.0)(3.0) = 6.0 N. Check on A: 15 - 6.0 = 9.0 N = (3.0)(3.0). ✓',
    },
    {
      kind: 'mcq',
      id: 'n06.q2',
      prompt: 'In the same setup, while the blocks speed up together, compare the size of the force A exerts on B with the size of the force B exerts on A.',
      choices: ['A on B is larger, since the blocks accelerate toward B', 'They are equal in size', 'B on A is zero, since B is moving away from A', 'A on B is 15 N, and B on A is smaller'],
      answer: 1,
      hint: 'These two forces are one interaction viewed from each side.',
      explain: 'They are a Newton\'s third-law pair, so they are equal and opposite (6.0 N each), whether or not anything accelerates. The blocks accelerate because of your external 15 N push, not because the pair is unbalanced. The two forces act on different objects, so they never cancel on a single object.',
    },
    {
      kind: 'numeric',
      id: 'n06.q3',
      prompt: 'An Atwood machine: a 3.0 kg block and a 2.0 kg block hang on opposite ends of a light string over an ideal pulley and are released from rest. Using g = 9.8 m/s², what is the magnitude of the acceleration of each block?',
      answer: q(((3 - 2) * 9.8) / (3 + 2), D.acceleration),
      hint: 'Treat both blocks as one system moving along the string. Which external forces drive it, and how much mass moves?',
      worked: 'Along the string, gravity on the 3.0 kg block drives the motion and gravity on the 2.0 kg block opposes it. The tension is internal and drops out. a = (m1 - m2) g / (m1 + m2) = (3.0 - 2.0)(9.8) / 5.0 = 1.96 m/s², heavy block down and light block up.',
    },
    {
      kind: 'mcq',
      id: 'n06.q4',
      prompt: 'In that Atwood machine, the 3.0 kg block weighs 29.4 N and the 2.0 kg block weighs 19.6 N. What can you say about the tension in the string while the blocks move?',
      choices: ['T = 29.4 N, the heavier weight', 'T = 19.6 N, the lighter weight', 'T is between 19.6 N and 29.4 N', 'T = 49 N, the total weight'],
      answer: 2,
      hint: 'Which way does each block accelerate? What does that say about T compared with each weight?',
      explain: 'The light block accelerates upward, so T must exceed its weight (19.6 N). The heavy block accelerates downward, so its weight must exceed T (29.4 N). T is therefore between them. T would equal a weight only if that block were not accelerating.',
    },
    {
      kind: 'numeric',
      id: 'n06.q5',
      prompt: 'Find the tension in the Atwood machine string (3.0 kg and 2.0 kg blocks, g = 9.8 m/s²).',
      answer: q(2 * (9.8 + ((3 - 2) * 9.8) / (3 + 2)), D.force),
      hint: 'Isolate one block. The 2.0 kg block accelerates upward at 1.96 m/s².',
      worked: '2.0 kg block, up positive: T - m2 g = m2 a, so T = m2(g + a) = (2.0)(9.8 + 1.96) = 23.5 N. Check with the 3.0 kg block, down positive: m1 g - T = (3.0)(9.8) - 23.5 = 5.9 N = (3.0)(1.96). ✓',
    },
    {
      kind: 'predict',
      id: 'n06.p1',
      prompt: 'An Atwood machine: a 2.0 kg block and a 3.0 kg block hang from one string over a light, frictionless pulley. You release them. While they move, how does the string tension compare with the 3.0 kg block\'s weight (29.4 N)?',
      setup: { sim: 'pulley', params: { mode: 'atwood', m1: 2, m2: 3, muS: 0, muK: 0, g: 9.8, travel: 1.5 }, seconds: 1 },
      choices: [
        { text: 'Equal: the string just carries the hanging weight', claim: { kind: 'tension-vs-weight', relation: 'equal' } },
        { text: 'Less than its weight', claim: { kind: 'tension-vs-weight', relation: 'less' } },
        { text: 'More than its weight: the string has to hold the heavy block up', claim: { kind: 'tension-vs-weight', relation: 'more' } },
      ],
      answer: 1,
      reveal: 'The 3.0 kg block accelerates downward, so the net force on it must point down: T < m₂g. Here a = (3 − 2)(9.8)/5 = 1.96 m/s² and T = 3.0(9.8 − 1.96) = 23.5 N, which is between the two weights (19.6 N and 29.4 N). T equals a hanging weight only when nothing accelerates.',
    },
    {
      kind: 'triage',
      id: 'n06.q6',
      problem: 'A 4.0 kg block on a horizontal table is tied to a light string that runs over an ideal pulley at the table\'s edge to a hanging 2.0 kg block. The coefficient of kinetic friction between the 4.0 kg block and the table is 0.25. The blocks are released and the 4.0 kg block slides. Using g = 9.8 m/s², what is the tension in the string?',
      stages: [
        { stage: 'Translate', prompt: 'What is asked: the tension (a force magnitude) in the string while the blocks move.', tip: 'Tension is internal to the two-block system, so at some point you must look at one block alone.' },
        { stage: 'Represent', prompt: 'Draw a free-body diagram for each block. Table block: T toward the pulley, friction away from it, N up, mg down. Hanging block: T up, mg down.', tip: 'Pick a "positive" direction that follows the string: toward the pulley for the table block, down for the hanging block.' },
        { stage: 'Identify', prompt: 'How are the two accelerations related?', tip: 'The string does not stretch, so both ends move the same distance in the same time.', check: { choices: ['Same magnitude, along the string', 'The hanging block accelerates at g', 'The table block does not accelerate'], answer: 0 } },
        { stage: 'Assume', prompt: 'Assume the string is massless and does not stretch, the pulley is ideal, and μk is constant.', tip: 'This makes the tension the same at both ends and the acceleration the same for both blocks.' },
        { stage: 'Generate', prompt: 'Whole system along the string: (2.0 + 4.0) a = (2.0)(9.8) - (0.25)(4.0)(9.8). Then hanging block alone: T = m(g - a).', tip: 'Solve for a first, then use it in the single-block equation.' },
        { stage: 'Evaluate', prompt: 'Check the size against limits.', tip: 'T must be less than the hanging weight (19.6 N), because that block accelerates down. It must also exceed the friction force (9.8 N), because the table block accelerates toward the pulley. 16.3 N fits both.' },
      ],
      answer: q(2 * (9.8 - (2 * 9.8 - 0.25 * 4 * 9.8) / (2 + 4)), D.force),
      hint: 'Get the shared acceleration from the whole system, then isolate the hanging block.',
      worked: 'Friction: μk N = (0.25)(4.0)(9.8) = 9.8 N. System: a = (19.6 - 9.8) / 6.0 = 1.63 m/s². Hanging block, down positive: m g - T = m a, so T = (2.0)(9.8 - 1.63) = 16.3 N. Check on the table block: T - 9.8 = 6.53 N = (4.0)(1.63). ✓',
    },
    {
      kind: 'selfExplain',
      id: 'n06.q7',
      prompt: 'Explain why the tension drops out when you treat both Atwood blocks as one system, but you must include it when you look at one block alone.',
      model: 'Measure positions along the string: forward means down on the heavy side and up on the light side. The string pulls up on both blocks with the same T, which is backward (-T) for the heavy block and forward (+T) for the light block. Added over the whole system those two pulls cancel, so only gravity, which is external, drives the motion. When you isolate one block, the string is outside that system, so its pull is an external force on the block and must appear in F_net = m a.',
    },
  ],
};
