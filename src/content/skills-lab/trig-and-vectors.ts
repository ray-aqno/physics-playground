import type { Lesson } from '../types';
import { D, deg, q } from '../units';

export const labTrig: Lesson = {
  id: 'lab.trig',
  unit: 'lab',
  chapter: 'LAB',
  title: 'Right triangles and resolving vectors',
  minutes: 5,
  needs: [],
  steps: [
    {
      kind: 'explain',
      md: `Almost every vector problem starts by splitting a vector into perpendicular pieces.

Draw the vector as the long side (hypotenuse) of a right triangle. If it has length **L** and makes angle **θ** with the x-axis:

- the side **next to** θ is **L cos θ** (the x-component)
- the side **across from** θ is **L sin θ** (the y-component)

**Feynman habit:** sketch the triangle before you touch the calculator. If θ is small, the piece next to it should look long. If your numbers disagree with your sketch, trust the sketch and recheck.`,
    },
    {
      kind: 'numeric',
      id: 'lab.trig.q1',
      prompt: 'A rope pulls a sled with a 50 N force at 30° above the horizontal. What is the horizontal component of the force?',
      answer: q(43.30127, D.force),
      hint: 'The angle is measured from the horizontal, so the horizontal piece is the side next to the angle.',
      worked: 'F_x = F cos θ = (50 N)(cos 30°) = (50 N)(0.8660) = 43.3 N.',
    },
    {
      kind: 'numeric',
      id: 'lab.trig.q2',
      prompt: 'Same rope, same 50 N at 30° above horizontal. What is the vertical component?',
      answer: q(25, D.force),
      hint: 'The vertical piece is across from the 30° angle.',
      worked: 'F_y = F sin θ = (50 N)(sin 30°) = (50 N)(0.5) = 25 N.',
    },
    {
      kind: 'numeric',
      id: 'lab.trig.q3',
      prompt: 'A ramp rises 1.5 m over a horizontal distance of 4.0 m. What angle does it make with the ground? (Answer in degrees.)',
      answer: q(deg(20.556), D.none),
      angle: true,
      hint: 'You know the side across from the angle (rise) and the side next to it (run). Which trig ratio uses those two?',
      worked: 'tan θ = rise / run = 1.5 / 4.0 = 0.375, so θ = arctan(0.375) = 20.6°.',
    },
    {
      kind: 'mcq',
      id: 'lab.trig.q4',
      prompt: 'A force points 70° above the horizontal. Which component is larger?',
      choices: ['Horizontal', 'Vertical', 'They are equal'],
      answer: 1,
      hint: 'Picture a line tipped 70° up. Is it closer to lying flat or standing up?',
      explain: 'At 70° the vector is close to vertical, so sin 70° = 0.94 is much bigger than cos 70° = 0.34. They are equal only at 45°.',
    },
    {
      kind: 'selfExplain',
      id: 'lab.trig.q5',
      prompt: 'In your own words: why does the x-component use cosine when the angle is measured from the x-axis? What changes if the angle is measured from the y-axis instead?',
      model: 'Cosine gives the side next to the angle. When the angle is measured from the x-axis, the side next to it lies along x, so x gets cos θ. If the angle is measured from the y-axis, the side next to it lies along y, so then y gets cos θ and x gets sin θ. The rule is "next to the angle gets cosine", not "x always gets cosine".',
    },
  ],
};

export const labVectors: Lesson = {
  id: 'lab.vectors',
  unit: 'lab',
  chapter: 'LAB',
  title: 'Components, magnitude and direction',
  minutes: 6,
  needs: ['lab.trig'],
  steps: [
    {
      kind: 'explain',
      md: `A 2-D vector can be written by its components, **⟨a_x, a_y⟩**. In this app you can type it as \`<3, -4> m/s\`.

- **Magnitude** (length): |a| = √(a_x² + a_y²)
- **Direction** (angle counterclockwise from +x): use tan θ = a_y / a_x, **then check the quadrant**.

A calculator's arctan only returns angles between -90° and +90°. If a_x is negative, the vector points left, so add 180°.`,
    },
    {
      kind: 'numeric',
      id: 'lab.vectors.q1',
      prompt: 'A puck has velocity ⟨-6, 8⟩ m/s. What is its speed?',
      answer: q(10, D.velocity),
      hint: 'Speed is the magnitude of the velocity vector.',
      worked: '|v| = √((-6)² + 8²) = √(36 + 64) = √100 = 10 m/s.',
    },
    {
      kind: 'mcq',
      id: 'lab.vectors.q2',
      prompt: 'For v = ⟨-6, 8⟩ m/s, a calculator gives arctan(8 / -6) = -53.1°. What is the real direction, measured counterclockwise from +x?',
      choices: ['-53.1°', '53.1°', '126.9°', '233.1°'],
      answer: 2,
      hint: 'Which quadrant is ⟨-6, 8⟩ in? Left and up.',
      explain: 'Left and up is the second quadrant (between 90° and 180°). The calculator answer is off by 180°: -53.1° + 180° = 126.9°.',
    },
    {
      kind: 'numeric',
      id: 'lab.vectors.q3',
      prompt: 'Find the direction of ⟨-6, 8⟩ m/s in degrees, counterclockwise from +x.',
      answer: q(deg(126.8699), D.none),
      angle: true,
      hint: 'Use the reference angle arctan(8/6), then place it in the correct quadrant.',
      worked: 'Reference angle = arctan(8/6) = 53.13°. The vector points left and up, so θ = 180° - 53.13° = 126.87°.',
    },
    {
      kind: 'numeric',
      id: 'lab.vectors.q4',
      prompt: 'A displacement of 12 m points at 210° (counterclockwise from +x). Give it as a vector ⟨x, y⟩ in meters.',
      answer: q([-10.3923, -6], D.length),
      hint: '210° is 30° past the -x axis, so both components are negative.',
      worked: 'x = 12 cos 210° = -12 cos 30° = -10.39 m; y = 12 sin 210° = -12 sin 30° = -6.0 m. So ⟨-10.4, -6.0⟩ m.',
    },
    {
      kind: 'selfExplain',
      id: 'lab.vectors.q5',
      prompt: 'Explain why you cannot always trust the calculator\'s arctan to give a vector\'s direction, and how you fix it.',
      model: 'arctan only knows the ratio a_y/a_x, and ⟨-6, 8⟩ and ⟨6, -8⟩ have the same ratio, so it cannot tell which way the vector points. It always answers between -90° and 90°. Look at the signs of the components to find the quadrant; if a_x is negative, add 180°.',
    },
  ],
};
