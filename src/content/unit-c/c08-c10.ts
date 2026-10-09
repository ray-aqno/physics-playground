import type { Lesson } from '../types';
import { D, q } from '../units';

/** The energy-bars track used by the predict steps: 1 kg block, k = 50 N/m, 2 m floor, 30° ramp. */
const TRACK = { m: 1, k: 50, mu: 0, flatLength: 2, angle: Math.PI / 6, g: 9.8 } as const;

export const c08: Lesson = {
  id: 'c08',
  unit: 'C',
  chapter: 'C8',
  title: 'Conservation of energy',
  minutes: 7,
  needs: ['lab.units'],
  steps: [
    {
      kind: 'explain',
      md: `Energy comes in many forms: **kinetic** (K = ½ m v²), **potential** (stored by position, like height or a stretched spring), **thermal**, **chemical** and more.

For an isolated system, the total never changes. Energy only moves between forms or between objects:

**K_before + U_before + (other forms) = K_after + U_after + (other forms)**

Energy is a number, not a vector, which often makes it much easier to use than momentum. But it cannot tell you directions.`,
    },
    {
      kind: 'predict',
      id: 'c08.q1',
      prompt: 'A block is released from rest partway up a frictionless ramp. It slides down, crosses the floor, squashes the spring and comes back. How high up the ramp does it return?',
      setup: { sim: 'energy', ramp: TRACK, startS: 4, seconds: 6 },
      choices: [
        { text: 'Lower than where it started', claim: { kind: 'max-height', relation: 'lower' } },
        { text: 'To the same height', claim: { kind: 'max-height', relation: 'same' } },
        { text: 'Higher than where it started', claim: { kind: 'max-height', relation: 'higher' } },
      ],
      answer: 1,
      reveal: 'With no friction, no energy leaves the block-spring-Earth system as heat. The energy bars trade between gravitational, kinetic and spring energy, and the total stays fixed, so the block climbs back to exactly its starting height.',
    },
    {
      kind: 'numeric',
      id: 'c08.q2',
      prompt: 'What is the kinetic energy of a 1500 kg car moving at 20 m/s?',
      answer: q(300000, D.energy),
      hint: 'K = ½ m v².',
      worked: 'K = ½ (1500)(20)² = ½ (1500)(400) = 300,000 J = 300 kJ.',
    },
    {
      kind: 'triage',
      id: 'c08.q3',
      problem: 'A 0.50 kg ball is dropped from rest 12 m above the ground. Ignoring air resistance, how fast is it moving just before it lands?',
      stages: [
        { stage: 'Translate', prompt: 'Asked: the speed at the bottom of a 12 m drop.', tip: 'Speed, not velocity, so the answer is positive.' },
        { stage: 'Represent', prompt: 'Draw energy bar charts: top (all gravitational) and bottom (all kinetic).', tip: 'Bar charts are the energy version of a free-body diagram.' },
        { stage: 'Identify', prompt: 'Which idea is fastest here?', tip: 'Energy conservation for the ball-Earth system: mgh becomes ½mv².', check: { choices: ['Energy conservation', 'Momentum conservation of the ball', 'Angular momentum'], answer: 0 } },
        { stage: 'Assume', prompt: 'No air drag; g = 9.8 m/s².', tip: 'For a heavy ball over 12 m, drag is a small correction.' },
        { stage: 'Generate', prompt: 'm g h = ½ m v² → v = √(2 g h).', tip: 'The mass cancels, so you do not need the 0.50 kg.' },
        { stage: 'Evaluate', prompt: 'Check size and units.', tip: '√(m/s² × m) = m/s ✓. 15 m/s ≈ 55 km/h: reasonable for a 4-storey drop.' },
      ],
      answer: q(15.33623, D.velocity),
      hint: 'All the gravitational energy becomes kinetic energy.',
      worked: 'v = √(2 × 9.8 × 12) = √235.2 = 15.3 m/s.',
    },
    {
      kind: 'mcq',
      id: 'c08.q4',
      prompt: 'A ball thrown straight up slows down as it rises. Where does its kinetic energy go?',
      choices: ['It is destroyed by gravity', 'Into gravitational potential energy of the ball-Earth system', 'Into the ball\'s momentum'],
      answer: 1,
      hint: 'Energy is never destroyed; what form grows as the ball rises?',
      explain: 'The kinetic energy becomes gravitational potential energy, which belongs to the ball-Earth system as a whole. It turns back into kinetic energy on the way down.',
    },
    {
      kind: 'selfExplain',
      id: 'c08.q5',
      prompt: 'Explain why the mass cancels when you find the landing speed of a dropped ball.',
      model: 'Both the gravitational energy (m g h) and the kinetic energy (½ m v²) are proportional to the mass. A heavier ball has more energy to convert, but it needs proportionally more energy to reach the same speed, so every mass lands at the same speed.',
    },
  ],
};

export const c09: Lesson = {
  id: 'c09',
  unit: 'C',
  chapter: 'C9',
  title: 'Energy in bonds and rest energy',
  minutes: 6,
  needs: ['lab.prefixes'],
  steps: [
    {
      kind: 'explain',
      md: `Atoms in molecules are held together by bonds, and bonds store **potential energy**. Breaking a bond takes energy; forming one releases it. Chemical energy (food, fuel, batteries) is energy stored in bonds.

Einstein showed that mass itself is a form of energy: **E = m c²**, with c = 3.00 × 10⁸ m/s. When a system releases energy, its mass goes down by Δm = E / c². In chemistry the change is far too small to measure; in nuclear reactions it is not.`,
    },
    {
      kind: 'numeric',
      id: 'c09.q1',
      prompt: 'Digesting 1.0 g of sugar releases about 17 kJ. If all of it went into lifting a 60 kg person, how high could they be lifted? (g = 9.8 m/s²)',
      answer: q(28.91156, D.length),
      hint: 'Set the chemical energy equal to m g h.',
      worked: 'h = E / (m g) = 17,000 J / (60 × 9.8 N) = 28.9 m. (Real muscles are only about 25% efficient.)',
    },
    {
      kind: 'numeric',
      id: 'c09.q2',
      prompt: 'Exploding 1.0 kg of TNT releases about 4.2 × 10⁶ J. By how much does the mass of the products drop?',
      answer: q(4.6666667e-11, D.mass),
      hint: 'Δm = E / c².',
      worked: 'Δm = 4.2 × 10⁶ / (3.00 × 10⁸)² = 4.2 × 10⁶ / 9.0 × 10¹⁶ = 4.7 × 10⁻¹¹ kg. That is 0.00000000047% of the mass, which is why chemists never notice it.',
    },
    {
      kind: 'triage',
      id: 'c09.q3',
      problem: 'Breaking one carbon-carbon bond takes about 7.0 × 10⁻¹⁹ J. How much energy does it take to break one mole (6.022 × 10²³) of these bonds?',
      stages: [
        { stage: 'Translate', prompt: 'Asked: total energy for a mole of bonds.', tip: 'Per-bond energy times number of bonds.' },
        { stage: 'Represent', prompt: 'Write it as (energy per bond) × (number of bonds).', tip: 'Keep powers of ten separate from the leading numbers.' },
        { stage: 'Identify', prompt: 'Bond energies add: breaking N bonds takes N times the energy of one.', tip: 'This assumes the bonds do not affect one another.' },
        { stage: 'Assume', prompt: 'Every bond has the same energy.', tip: 'Real bond energies vary a little with the molecule.' },
        { stage: 'Generate', prompt: '(7.0 × 10⁻¹⁹)(6.022 × 10²³).', tip: '7.0 × 6.022 = 42.2 and 10⁻¹⁹ × 10²³ = 10⁴.' },
        { stage: 'Evaluate', prompt: 'Is this sensible?', tip: '≈ 420 kJ per mole: that is the typical size of chemical bond energies in tables (hundreds of kJ/mol) ✓.' },
      ],
      answer: q(421540, D.energy),
      hint: 'Multiply the per-bond energy by Avogadro\'s number.',
      worked: 'E = 7.0 × 10⁻¹⁹ × 6.022 × 10²³ = 4.2 × 10⁵ J ≈ 420 kJ.',
    },
    {
      kind: 'mcq',
      id: 'c09.q4',
      prompt: 'When two atoms form a chemical bond, energy is:',
      choices: ['Absorbed from the surroundings', 'Released to the surroundings', 'Neither; bonds have no energy'],
      answer: 1,
      hint: 'Which takes energy: breaking a bond or forming one?',
      explain: 'Breaking a bond takes energy, so forming one releases the same amount. A bonded pair sits lower in potential energy than separate atoms.',
    },
    {
      kind: 'selfExplain',
      id: 'c09.q5',
      prompt: 'Explain, in your own words, why a charged battery is (very slightly) heavier than a flat one.',
      model: 'A charged battery stores extra energy in its chemical bonds, and energy has mass by E = m c². Discharging releases that energy, so the battery loses a mass of E/c². It is far too small to weigh, but it is real.',
    },
  ],
};

export const c10: Lesson = {
  id: 'c10',
  unit: 'C',
  chapter: 'C10',
  title: 'Potential energy functions',
  minutes: 7,
  needs: ['lab.units'],
  steps: [
    {
      kind: 'explain',
      md: `Each kind of interaction has its own potential energy formula:

- **Gravity near Earth's surface:** U = m g h
- **A spring** stretched or squashed by x: U = ½ k x²
- **Gravity anywhere:** U = -G M m / r

Only **changes** in U matter, so you can choose where U = 0. (That is why the far-away gravity formula is negative: it puts U = 0 at infinity.)`,
    },
    {
      kind: 'predict',
      id: 'c10.q1',
      prompt: 'The block starts at rest against a squashed spring at the bottom of the track. When released, what happens?',
      setup: { sim: 'energy', ramp: TRACK, startS: -0.4, seconds: 4 },
      choices: [
        { text: 'It stays at floor level', claim: { kind: 'max-height', relation: 'same' } },
        { text: 'It climbs partway up the ramp', claim: { kind: 'max-height', relation: 'higher' } },
      ],
      answer: 1,
      reveal: 'The spring energy ½ k x² = ½ (50)(0.4)² = 4.0 J becomes kinetic energy, then gravitational energy. The block climbs until m g h = 4.0 J, a height of about 0.41 m.',
    },
    {
      kind: 'numeric',
      id: 'c10.q2',
      prompt: 'A spring with k = 200 N/m is compressed by 0.15 m. How much energy does it store?',
      answer: q(2.25, D.energy),
      hint: 'U = ½ k x².',
      worked: 'U = ½ (200)(0.15)² = ½ (200)(0.0225) = 2.25 J.',
    },
    {
      kind: 'triage',
      id: 'c10.q3',
      problem: 'A toy launcher has a spring with k = 400 N/m, compressed 0.050 m. It fires a 0.10 kg ball straight up. How high above the launch point does the ball rise? (Ignore the small height change while the spring extends.)',
      stages: [
        { stage: 'Translate', prompt: 'Asked: maximum height above the launch point.', tip: 'At the top, the ball is momentarily at rest.' },
        { stage: 'Represent', prompt: 'Energy bars: start (all spring energy) and top (all gravitational).', tip: 'The middle (all kinetic) is not needed.' },
        { stage: 'Identify', prompt: 'Energy conservation from spring to gravity.', tip: '½ k x² = m g h.', check: { choices: ['½ k x² = m g h', 'k x = m g', 'Momentum conservation'], answer: 0 } },
        { stage: 'Assume', prompt: 'No air drag, no energy lost in the launcher, spring massless.', tip: 'Real launchers lose some energy to friction and the spring\'s own motion.' },
        { stage: 'Generate', prompt: 'h = ½ k x² / (m g).', tip: '½ (400)(0.050)² = 0.50 J.' },
        { stage: 'Evaluate', prompt: 'Check units and size.', tip: 'J / N = m ✓. About half a meter for a toy launcher is sensible.' },
      ],
      answer: q(0.5102041, D.length),
      hint: 'Spring energy becomes gravitational energy.',
      worked: 'U_spring = ½ (400)(0.050)² = 0.50 J. h = 0.50 / (0.10 × 9.8) = 0.51 m.',
    },
    {
      kind: 'numeric',
      id: 'c10.q4',
      prompt: 'How much does the gravitational potential energy of a 1000 kg satellite increase when it is moved from Earth\'s surface (r = 6.37 × 10⁶ m) to r = 1.27 × 10⁷ m? Use G = 6.67 × 10⁻¹¹ N·m²/kg² and M = 5.97 × 10²⁴ kg.',
      answer: q(3.1157365e10, D.energy),
      hint: 'ΔU = U₂ - U₁ with U = -G M m / r.',
      worked: 'ΔU = G M m (1/r₁ - 1/r₂) = (3.98 × 10¹⁷)(1.570 × 10⁻⁷ - 7.874 × 10⁻⁸) = 3.12 × 10¹⁰ J.',
    },
    {
      kind: 'selfExplain',
      id: 'c10.q5',
      prompt: 'Why is it fine to use U = m g h near the ground, but not for a satellite?',
      model: 'U = m g h assumes the gravitational pull is the same at every height. Near the ground the height changes are tiny compared with Earth\'s radius, so g barely changes. For a satellite the distance doubles and g drops a lot, so you need U = -G M m / r.',
    },
  ],
};
