import type { Lesson } from '../types';
import { D, deg, q } from '../units';

export const labVectorAdd: Lesson = {
  id: 'lab.vector-add',
  unit: 'lab',
  chapter: 'LAB',
  title: 'Adding and subtracting vectors',
  minutes: 7,
  needs: ['lab.vectors'],
  steps: [
    {
      kind: 'explain',
      md: `To add vectors, **add their components**: ⟨a_x, a_y⟩ + ⟨b_x, b_y⟩ = ⟨a_x + b_x, a_y + b_y⟩.

Subtraction works the same way, component by component. Geometrically, A + B means "walk A, then walk B" (tip to tail).

The magnitudes do **not** simply add. 3 m east plus 4 m north is 5 m from where you started, not 7 m.`,
    },
    {
      kind: 'numeric',
      id: 'lab.vector-add.q1',
      prompt: 'A = ⟨3, 4⟩ m and B = ⟨2, -7⟩ m. Find A + B.',
      answer: q([5, -3], D.length),
      hint: 'Add the x-parts, then add the y-parts.',
      worked: 'A + B = ⟨3 + 2, 4 + (-7)⟩ = ⟨5, -3⟩ m.',
    },
    {
      kind: 'numeric',
      id: 'lab.vector-add.q2',
      prompt: 'With the same A = ⟨3, 4⟩ m and B = ⟨2, -7⟩ m, find A - B.',
      answer: q([1, 11], D.length),
      hint: 'Subtract component by component. Watch the double negative in y.',
      worked: 'A - B = ⟨3 - 2, 4 - (-7)⟩ = ⟨1, 11⟩ m.',
    },
    {
      kind: 'triage',
      id: 'lab.vector-add.q3',
      problem: 'A hiker walks 3.0 km due east, then 4.0 km in a direction 30° north of west. How far is the hiker from the starting point?',
      stages: [
        { stage: 'Translate', prompt: 'What is being asked: a distance, a displacement vector, or a path length?', tip: 'Underline the question. "How far from the start" is the size of the total displacement, not the distance walked.', check: { choices: ['Total distance walked (7.0 km)', 'Size of the total displacement'], answer: 1 } },
        { stage: 'Represent', prompt: 'Sketch the two legs tip to tail on axes with east = +x and north = +y.', tip: 'A sketch shows right away that the second leg goes back west, so the answer must be less than 3 km plus a bit.' },
        { stage: 'Identify', prompt: 'Which idea solves this? Add the two displacement vectors by components.', tip: 'Displacements add as vectors. Lengths do not.' },
        { stage: 'Assume', prompt: 'What are you assuming?', tip: 'Flat ground and straight legs. Directions are exact.' },
        { stage: 'Generate', prompt: 'Find the components of each leg, add them, and take the magnitude.', tip: 'Leg 2 at 30° north of west is 150° from +x: ⟨-4.0 cos 30°, 4.0 sin 30°⟩.' },
        { stage: 'Evaluate', prompt: 'Check units, sign and a limit.', tip: 'Units: km (or m). Size check: the legs partly cancel in x, so the answer should be well under 7 km. Limit: if leg 2 pointed due west, the answer would be 1.0 km.' },
      ],
      answer: q(2053.2, D.length),
      hint: 'Leg 1 = ⟨3.0, 0⟩ km. Leg 2 = ⟨-3.46, 2.0⟩ km.',
      worked: 'x: 3.0 + (-4.0 cos 30°) = 3.0 - 3.46 = -0.46 km. y: 0 + 4.0 sin 30° = 2.0 km. Distance = √(0.46² + 2.0²) = √4.215 = 2.05 km.',
    },
    {
      kind: 'selfExplain',
      id: 'lab.vector-add.q4',
      prompt: 'A friend says "3 km plus 4 km is always 7 km". When are they right, and when are they wrong?',
      model: 'They are right only when both displacements point the same way. Displacements add tip to tail, so if they point in different directions they partly cancel or add at an angle. The result can be anywhere from 1 km (opposite directions) to 7 km (same direction).',
    },
  ],
};

export const labDot: Lesson = {
  id: 'lab.dot',
  unit: 'lab',
  chapter: 'LAB',
  title: 'The dot product',
  minutes: 5,
  needs: ['lab.vectors'],
  steps: [
    {
      kind: 'explain',
      md: `The dot product turns two vectors into one number:

**A · B = A_x B_x + A_y B_y** (add A_z B_z in 3-D) **= |A| |B| cos θ**

It measures how much the two vectors point the same way. It is positive when the angle between them is under 90°, zero when they are perpendicular, and negative when it is over 90°.

In Unit C you will meet it as **work**: W = **F** · **d**.`,
    },
    {
      kind: 'numeric',
      id: 'lab.dot.q1',
      prompt: 'Compute ⟨3, 4⟩ · ⟨4, -3⟩.',
      answer: q(0, D.none),
      hint: 'Multiply x by x and y by y, then add.',
      worked: '(3)(4) + (4)(-3) = 12 - 12 = 0. The vectors are perpendicular.',
    },
    {
      kind: 'numeric',
      id: 'lab.dot.q2',
      prompt: 'A force F = ⟨10, 5⟩ N pushes a box through a displacement d = ⟨3, 0⟩ m. How much work does the force do?',
      answer: q(30, D.energy),
      hint: 'Work is F · d. N·m is the same as J.',
      worked: 'W = (10 N)(3 m) + (5 N)(0 m) = 30 J. Only the part of F along the motion does work.',
    },
    {
      kind: 'numeric',
      id: 'lab.dot.q3',
      prompt: 'What is the angle between ⟨2, 1⟩ and ⟨1, 3⟩? (Degrees.)',
      answer: q(deg(45), D.none),
      angle: true,
      hint: 'cos θ = (A · B) / (|A| |B|).',
      worked: 'A · B = 2 + 3 = 5. |A| = √5, |B| = √10. cos θ = 5/√50 = 0.7071, so θ = 45°.',
    },
    {
      kind: 'mcq',
      id: 'lab.dot.q4',
      prompt: 'A friction force points opposite to a box\'s motion. What is the sign of the work it does?',
      choices: ['Positive', 'Zero', 'Negative'],
      answer: 2,
      hint: 'The angle between force and displacement is 180°.',
      explain: 'cos 180° = -1, so W = F · d is negative. Friction takes kinetic energy away.',
    },
    {
      kind: 'selfExplain',
      id: 'lab.dot.q5',
      prompt: 'Explain why a force perpendicular to an object\'s motion does no work on it.',
      model: 'Work is F · d, which only counts the part of the force along the motion. A perpendicular force has no part along the motion (cos 90° = 0), so it can change the direction of the motion but not the speed.',
    },
  ],
};

export const labCross: Lesson = {
  id: 'lab.cross',
  unit: 'lab',
  chapter: 'LAB',
  title: 'The cross product',
  minutes: 6,
  needs: ['lab.dot'],
  steps: [
    {
      kind: 'explain',
      md: `The cross product of two vectors is a new vector **perpendicular to both**.

- Size: |A × B| = |A| |B| sin θ
- Direction: **right-hand rule**. Point your fingers along A, curl them toward B, and your thumb points along A × B.
- Order matters: **B × A = -(A × B)**.

For vectors in the xy-plane only the z-component survives: **(A × B)_z = A_x B_y - A_y B_x**. Positive means counterclockwise from A to B.

Unit C uses it for torque **τ = r × F** and angular momentum **L = r × p**.`,
    },
    {
      kind: 'numeric',
      id: 'lab.cross.q1',
      prompt: 'Find the z-component of ⟨3, 0⟩ × ⟨0, 2⟩.',
      answer: q(6, D.none),
      hint: 'A_x B_y - A_y B_x.',
      worked: '(3)(2) - (0)(0) = 6. Going from +x to +y is counterclockwise, so the result is positive.',
    },
    {
      kind: 'numeric',
      id: 'lab.cross.q2',
      prompt: 'A wrench is held at r = ⟨0.20, 0⟩ m from a bolt, and you push with F = ⟨0, -50⟩ N. Find the z-component of the torque τ = r × F in N·m.',
      answer: q(-10, D.energy),
      hint: 'τ_z = r_x F_y - r_y F_x.',
      worked: 'τ_z = (0.20)(-50) - (0)(0) = -10 N·m. Negative means clockwise when viewed from +z.',
    },
    {
      kind: 'numeric',
      id: 'lab.cross.q3',
      prompt: 'Compute ⟨1, 2, 3⟩ × ⟨4, 5, 6⟩ as a 3-D vector.',
      answer: q([-3, 6, -3], D.none),
      hint: '(A_y B_z - A_z B_y, A_z B_x - A_x B_z, A_x B_y - A_y B_x).',
      worked: 'x: 2·6 - 3·5 = -3. y: 3·4 - 1·6 = 6. z: 1·5 - 2·4 = -3. Result ⟨-3, 6, -3⟩.',
    },
    {
      kind: 'mcq',
      id: 'lab.cross.q4',
      prompt: 'If A × B = ⟨0, 0, 5⟩, what is B × A?',
      choices: ['⟨0, 0, 5⟩', '⟨0, 0, -5⟩', '⟨0, 0, 0⟩', 'It depends on the angle'],
      answer: 1,
      hint: 'Swapping the order reverses the curl of your fingers.',
      explain: 'The cross product is anti-commutative: B × A = -(A × B) = ⟨0, 0, -5⟩.',
    },
    {
      kind: 'selfExplain',
      id: 'lab.cross.q5',
      prompt: 'Explain why pushing straight toward a door\'s hinge cannot open the door, using the cross product.',
      model: 'Torque is r × F, with size |r| |F| sin θ. Pushing straight toward the hinge makes the force parallel to r, so θ = 0 and sin θ = 0. There is no torque, so the door does not start to rotate however hard you push.',
    },
  ],
};
