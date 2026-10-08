import type { Lesson } from '../types';
import { D, q } from '../units';

export const labUnits: Lesson = {
  id: 'lab.units',
  unit: 'lab',
  chapter: 'LAB',
  title: 'Units and dimensional analysis',
  minutes: 7,
  needs: [],
  steps: [
    {
      kind: 'explain',
      md: `Every physical quantity has **dimensions**: length, mass, time, and so on. Units are how we measure them.

Two rules catch more mistakes than any other check:

1. You can only add or compare things with the **same dimensions**. Adding meters to seconds is nonsense.
2. Both sides of an equation must have the **same dimensions**.

Derived units are shorthand: **N = kg·m/s²**, **J = N·m = kg·m²/s²**. So momentum can be written kg·m/s or N·s. This app accepts either.`,
    },
    {
      kind: 'mcq',
      id: 'lab.units.q1',
      prompt: 'A pendulum\'s period T (seconds) might depend on its length L (m) and g (m/s²). Which formula has the right dimensions?',
      choices: ['T = 2π √(g / L)', 'T = 2π √(L / g)', 'T = 2π L g', 'T = 2π L / g'],
      answer: 1,
      hint: 'Work out the units of L/g.',
      explain: 'L/g has units m ÷ (m/s²) = s², and its square root is s. The other choices give 1/s, m²/s² and s².',
    },
    {
      kind: 'numeric',
      id: 'lab.units.q2',
      prompt: 'Convert a highway speed of 72 km/h to m/s.',
      answer: q(20, D.velocity),
      hint: 'Multiply by 1000 m per km and by (1 h / 3600 s).',
      worked: '72 km/h × (1000 m / 1 km) × (1 h / 3600 s) = 72000 / 3600 m/s = 20 m/s.',
    },
    {
      kind: 'numeric',
      id: 'lab.units.q3',
      prompt: 'What is the momentum of a 1500 kg car moving at 20 m/s? (kg·m/s or N·s are both fine.)',
      answer: q(30000, D.momentum),
      hint: 'p = m v.',
      worked: 'p = (1500 kg)(20 m/s) = 30,000 kg·m/s = 3.0 × 10⁴ N·s.',
    },
    {
      kind: 'triage',
      id: 'lab.units.q4',
      problem: 'The air drag force on a fast-moving object depends on the air density ρ (kg/m³), the speed v (m/s) and the front area A (m²): F = C ρ^a v^b A^c, where C has no units. Use dimensional analysis to find the power b on the speed.',
      stages: [
        { stage: 'Translate', prompt: 'What is unknown: the value of C, or the powers a, b, c?', tip: 'Only the powers. Dimensional analysis can never find a unitless number like C.' },
        { stage: 'Represent', prompt: 'Write the dimensions of each symbol: F = kg·m·s⁻², ρ = kg·m⁻³, v = m·s⁻¹, A = m².', tip: 'A table of kg, m and s exponents for each symbol keeps the bookkeeping clean.' },
        { stage: 'Identify', prompt: 'Both sides must have the same power of kg, of m and of s.', tip: 'That gives one equation per base dimension.', check: { choices: ['Same dimensions on both sides', 'Conservation of energy', 'Newton\'s third law'], answer: 0 } },
        { stage: 'Assume', prompt: 'Assume F depends only on ρ, v and A, as a product of powers.', tip: 'If something else mattered (like viscosity), the analysis would need it too.' },
        { stage: 'Generate', prompt: 'Match exponents. kg: 1 = a. s: -2 = -b. m: 1 = -3a + b + 2c.', tip: 'Solve the simplest equations first: the kg and s equations give a and b straight away.' },
        { stage: 'Evaluate', prompt: 'Check that c comes out sensible and the units work.', tip: 'With a = 1, b = 2: 1 = -3 + 2 + 2c gives c = 1. F = C ρ v² A has units kg·m⁻³ · m²s⁻² · m² = kg·m·s⁻². ✓' },
      ],
      answer: q(2, D.none),
      hint: 'Look only at the seconds. Which symbols contain seconds?',
      worked: 'Only F (s⁻²) and v (s⁻¹) contain seconds, so s⁻² = (s⁻¹)^b gives b = 2. Drag grows with the square of speed.',
    },
    {
      kind: 'selfExplain',
      id: 'lab.units.q5',
      prompt: 'Explain how checking units can tell you an answer is wrong, but can never prove it is right.',
      model: 'If the units do not match, the formula cannot be right, so a units mismatch proves an error. But a formula can have perfect units and still be off by a number like 2 or π, or use the wrong physics. Matching units is necessary, not sufficient.',
    },
  ],
};

export const labPrefixes: Lesson = {
  id: 'lab.prefixes',
  unit: 'lab',
  chapter: 'LAB',
  title: 'SI prefixes and scientific notation',
  minutes: 4,
  needs: ['lab.units'],
  steps: [
    {
      kind: 'explain',
      md: `Prefixes are powers of ten:

| Prefix | Symbol | Factor |
|---|---|---|
| giga | G | 10⁹ |
| mega | M | 10⁶ |
| kilo | k | 10³ |
| centi | c | 10⁻² |
| milli | m | 10⁻³ |
| micro | µ (type \`u\`) | 10⁻⁶ |
| nano | n | 10⁻⁹ |

Capitals matter: **M** is mega and **m** is milli, a factor of a billion apart. You can type 4.7e-6 s, 4.7*10^-6 s or 4.7 us.`,
    },
    {
      kind: 'numeric',
      id: 'lab.prefixes.q1',
      prompt: 'Write 4.7 µs in seconds.',
      answer: q(4.7e-6, D.time),
      hint: 'Micro means 10⁻⁶.',
      worked: '4.7 µs = 4.7 × 10⁻⁶ s.',
    },
    {
      kind: 'numeric',
      id: 'lab.prefixes.q2',
      prompt: 'Green light has a wavelength of about 530 nm. Write it in meters.',
      answer: q(5.3e-7, D.length),
      hint: 'Nano means 10⁻⁹.',
      worked: '530 nm = 530 × 10⁻⁹ m = 5.3 × 10⁻⁷ m.',
    },
    {
      kind: 'numeric',
      id: 'lab.prefixes.q3',
      prompt: 'Light travels at 3.00 × 10⁸ m/s. How long does it take to cross 1.5 km?',
      answer: q(5e-6, D.time),
      hint: 'time = distance / speed. Convert km to m first.',
      worked: 't = 1500 m / (3.00 × 10⁸ m/s) = 5.0 × 10⁻⁶ s = 5.0 µs.',
    },
    {
      kind: 'mcq',
      id: 'lab.prefixes.q4',
      prompt: 'Which is the most energy?',
      choices: ['2 GJ', '2000 MJ', '2 × 10⁸ kJ'],
      answer: 2,
      hint: 'Convert all three to joules.',
      explain: '2 GJ = 2 × 10⁹ J and 2000 MJ = 2 × 10⁹ J are equal. 2 × 10⁸ kJ = 2 × 10¹¹ J is 100 times larger.',
    },
  ],
};

export const labSigfigs: Lesson = {
  id: 'lab.sigfigs',
  unit: 'lab',
  chapter: 'LAB',
  title: 'Significant figures and estimates',
  minutes: 5,
  needs: ['lab.prefixes'],
  steps: [
    {
      kind: 'explain',
      md: `**Significant figures** say how precisely a number is known. Leading zeros never count (0.0034 has 2). Trailing zeros count only after a decimal point (2.50 has 3, 1200 has 2).

A result is only as precise as its least precise input. Dividing 2.4 m by 1.37 s gives 1.751... on the calculator, but the answer is 1.8 m/s.

**Estimates first (Feynman's habit):** before calculating, guess the size of the answer to within a factor of 10. If the calculation comes out a thousand times off, you have caught a mistake for free.`,
    },
    {
      kind: 'mcq',
      id: 'lab.sigfigs.q1',
      prompt: 'How many significant figures does 0.00340 have?',
      choices: ['2', '3', '5', '6'],
      answer: 1,
      hint: 'Leading zeros do not count. A trailing zero after the decimal point does.',
      explain: 'The significant digits are 3, 4 and the final 0: three significant figures.',
    },
    {
      kind: 'numeric',
      id: 'lab.sigfigs.q2',
      prompt: 'A cart rolls 2.4 m in 1.37 s. What is its average speed, to the right number of significant figures?',
      answer: q(1.7518248, D.velocity),
      sigFigs: 2,
      // The correctly rounded 1.8 m/s is 2.75% from the unrounded value, so allow 3%.
      tol: 0.03,
      hint: '2.4 has two significant figures, so the answer gets two.',
      worked: 'v = 2.4 m / 1.37 s = 1.75 m/s, which rounds to 1.8 m/s (two significant figures).',
    },
    {
      kind: 'numeric',
      id: 'lab.sigfigs.q3',
      prompt: 'Estimate the mass of air in a classroom 4 m × 5 m × 2.5 m. Air has a density of about 1.2 kg/m³.',
      answer: q(60, D.mass),
      tol: 0.1,
      hint: 'mass = density × volume.',
      worked: 'Volume = 4 × 5 × 2.5 = 50 m³. Mass = 1.2 kg/m³ × 50 m³ = 60 kg, about the mass of a person.',
    },
    {
      kind: 'selfExplain',
      id: 'lab.sigfigs.q4',
      prompt: 'Why is writing "1.751824818 m/s" for the cart\'s speed worse than writing "1.8 m/s", even though it has more digits?',
      model: 'The extra digits claim a precision the measurements never had. The distance was only known to about 0.1 m, so the speed is only known to about 0.1 m/s. Writing more digits misleads the reader about how well we know the answer.',
    },
  ],
};
