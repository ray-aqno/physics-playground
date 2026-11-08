import type { Lesson } from '../types';
import { D, deg, q } from '../units';

export const n07: Lesson = {
  id: 'n07',
  unit: 'N',
  chapter: 'N7',
  title: 'Uniform circular motion',
  minutes: 7,
  needs: ['lab.units', 'lab.trig', 'lab.vectors'],
  steps: [
    {
      kind: 'explain',
      md: `An object going around a circle at **constant speed** is still accelerating. Its speed stays the same, but the direction of its velocity keeps changing, and a change in velocity is an acceleration.

For a circle of radius r traveled at speed v:

- Acceleration: **a = v²/r**, pointing **toward the center** of the circle.
- Period, the time for one lap: **T = 2πr/v**.
- Angular speed, in rad/s: **ω = v/r = 2π/T**. So the acceleration can also be written **a = ω²r**.

By Newton's second law the net force must point toward the center too, with magnitude **F_net = m v²/r**. This is not a new kind of force. It is a job that real forces must do: the tension in a string, friction from the road, a normal force from a wall or a seat, or gravity. On a free-body diagram, draw only the real forces. Then set their total component toward the center equal to m v²/r.

In an inertial frame there is **no outward "centrifugal force"**. Nothing pushes a turning object outward. The feeling of being thrown outward is your body trying to keep going straight while the car turns underneath you.

**Feynman habit:** before you trust a formula, ask whether it behaves sensibly. v²/r has units (m/s)² / m = m/s². Turning at twice the speed should be much harder, and v² says it takes four times the force. A tighter turn (smaller r) at the same speed should need more force, and 1/r agrees.`,
    },
    {
      kind: 'numeric',
      id: 'n07.q1',
      prompt: 'A 20 kg child sits on a merry-go-round 2.0 m from its axis. The merry-go-round turns steadily, making one revolution every 4.0 s. What is the magnitude of the net force on the child?',
      answer: q(20 * (2 * Math.PI / 4) ** 2 * 2, D.force),
      hint: 'Find the angular speed from the period, then the acceleration toward the axis. Newton\'s second law gives the force.',
      worked: 'ω = 2π/T = 2π / 4.0 s = 1.57 rad/s. a = ω²r = (1.57)²(2.0) = 4.93 m/s², toward the axis. F_net = m a = (20)(4.93) = 98.7 N, about 99 N, pointing toward the axis. Friction from the seat, or a handrail, supplies it. Check with speed: v = 2πr/T = 3.14 m/s, and v²/r = 9.87 / 2.0 = 4.93 m/s². ✓',
    },
    {
      kind: 'mcq',
      id: 'n07.q2',
      prompt: 'A car drives around a flat (unbanked) curve at a steady 20 m/s. Ignore air drag and rolling resistance. Viewed from the road, which choice lists all the horizontal forces on the car?',
      choices: [
        'None: the speed is constant, so the net force is zero',
        'Static friction from the road, pointing toward the center of the curve',
        'Static friction toward the center, balanced by an equal centrifugal force pointing outward',
        'Kinetic friction from the road, pointing outward because the car slides out',
      ],
      answer: 1,
      hint: 'Is the velocity constant, or only the speed? If the horizontal forces added to zero, what path would the car follow?',
      explain: 'The speed is constant but the direction is not, so the car accelerates toward the center at v²/r, and the net force must point that way. The only horizontal force is static friction from the road on the tires. It is static because the tires do not slide sideways. A "centrifugal force" has no object exerting it. If it existed and balanced friction, the net force would be zero and the car would go straight off the road.',
    },
    {
      kind: 'mcq',
      id: 'n07.q3',
      prompt: 'You whirl a ball on a string in a horizontal circle, counterclockwise as seen from above. Use compass directions on the ground: when the ball is due east of your hand, it is moving north. At that instant the string breaks. Ignoring air resistance, which way does the ball move just afterward, as seen from above?',
      choices: [
        'North, along the tangent to the circle',
        'East, straight out from the center',
        'Along a curved path that slowly straightens out',
        'West, back toward your hand',
      ],
      answer: 0,
      hint: 'Once the string breaks, what horizontal force acts on the ball? What does Newton\'s first law say then?',
      explain: 'With the string gone, no horizontal force acts. Gravity is vertical, so it only makes the ball fall. By the first law the ball keeps the velocity it had at that instant: north, along the tangent, in a straight line seen from above. Moving straight out from the center would need an outward force, which does not exist. The ball does get farther from the center, but only because it goes straight while the circle curves away.',
    },
    {
      kind: 'numeric',
      id: 'n07.q4',
      prompt: 'A car rounds a flat (unbanked) curve of radius 50 m. The coefficient of static friction between the tires and the road is 0.80. Using g = 9.8 m/s², what is the maximum speed at which the car can take the curve without skidding?',
      answer: q(Math.sqrt(0.8 * 9.8 * 50), D.velocity),
      hint: 'Static friction is the only force toward the center, and it can be at most μs N. On a flat road, what is N?',
      worked: 'Vertical: N = mg. Toward the center: f_s = m v²/r, and f_s ≤ μs N = μs mg. So m v²/r ≤ μs mg, giving v_max = √(μs g r) = √(0.80 × 9.8 × 50) = √392 = 19.8 m/s, about 71 km/h. The mass cancels, so a truck and a small car have the same limit.',
    },
    {
      kind: 'explain',
      md: `**Banked curve.** Tilt the road by θ toward the center of the curve. Now the normal force tilts toward the center too, and its horizontal part can supply the inward force with no friction at all. The acceleration points horizontally toward the center, so use **horizontal and vertical axes**, not axes along the slope:

- Vertical, no acceleration: N cosθ = mg
- Horizontal, toward the center: N sinθ = m v²/r
- Divide: **tanθ = v²/(g r)**

There is one speed at which a car needs no friction to round the curve.

**Vertical loop.** A roller-coaster car runs around the inside of a vertical loop of radius r. The track's normal force always points toward the center of the loop. Take "toward the center" as positive:

| Where | Center is | Newton's second law | Normal force |
|---|---|---|---|
| Bottom | up | N - mg = m v²/r | N = mg + m v²/r |
| Top | down | N + mg = m v²/r | N = m v²/r - mg |

At the top, both N and gravity point **down**, toward the center. The slowest the car can go at the top and stay on the track is when N = 0 and gravity alone supplies m v²/r: **v_min = √(g r)**.`,
    },
    {
      kind: 'mcq',
      id: 'n07.q5',
      prompt: 'A roller-coaster car goes around the inside of a vertical loop of radius 8.0 m. At the top the car is upside down and moving at 12 m/s. Using g = 9.8 m/s², what is the normal force from the seat on a 50 kg rider at that instant?',
      choices: [
        '410 N, downward (toward the center of the loop)',
        '410 N, upward',
        '1390 N, upward',
        '490 N, upward, equal to her weight',
      ],
      answer: 0,
      hint: 'At the top, which way is the center? Both gravity and the normal force point the same way there.',
      explain: 'The rider needs m v²/r = (50)(12²)/8.0 = 900 N toward the center, which at the top is down. Gravity supplies 490 N of that, and the seat, which is above her, pushes down with the rest: N = 900 - 490 = 410 N. "Upward" treats the normal force as if it always holds you up. 1390 N is the bottom-of-the-loop formula. 490 N assumes the normal force equals the weight. At the minimum speed √(g r) = 8.9 m/s, N would be zero.',
    },
    {
      kind: 'predict',
      id: 'n07.p1',
      prompt: 'A puck on frictionless ice circles a post on a 1.0 m string at 2.0 m/s. The string is cut when the puck is at the top of the circle, moving left. Which path does it take?',
      setup: { sim: 'circle', params: { m: 0.5, r: 1, speed: 2 }, releaseAt: Math.PI / 4, seconds: 2 },
      choices: [
        { text: 'Straight out, away from the post', claim: { kind: 'release-path', path: 'outward' } },
        { text: 'A straight line along the direction it was moving (the tangent)', claim: { kind: 'release-path', path: 'tangent' } },
        { text: 'It keeps curving for a while, then straightens out', claim: { kind: 'release-path', path: 'curved' } },
      ],
      answer: 1,
      reveal: 'Once the string is cut, no horizontal force acts, so by Newton\'s first law the puck keeps the velocity it had at that instant. That velocity is along the tangent, so it moves straight left. Nothing pushes it "outward"; the string was only ever pulling inward. Look at the trail: a straight line touching the circle.',
    },
    {
      kind: 'triage',
      id: 'n07.q6',
      problem: 'A highway curve of radius 80 m is banked at 12° toward its center. On an icy day the friction between the tires and the road is negligible. At what speed must a car travel to round the curve without sliding up or down the bank? Use g = 9.8 m/s².',
      stages: [
        { stage: 'Translate', prompt: 'What is asked: the single speed (a magnitude) at which the car follows the curve with no friction.', tip: '"No friction" means only two forces act: gravity and the normal force.' },
        { stage: 'Represent', prompt: 'Draw a free-body diagram from behind the car: gravity mg straight down, and the normal force perpendicular to the road, tilted 12° from vertical toward the center. Choose x horizontal, toward the center, and y up.', tip: 'The center of the curve is level with the car, so the acceleration is horizontal. Axes along the slope would give the acceleration two components.' },
        { stage: 'Identify', prompt: 'Which force supplies the inward net force m v²/r?', tip: 'List only forces that some object exerts on the car.', check: { choices: ['The horizontal component of the normal force, N sinθ', 'A centrifugal force', 'The component of gravity along the bank, mg sinθ', 'Static friction from the road'], answer: 0 } },
        { stage: 'Assume', prompt: 'Assume friction is zero, the car moves in a horizontal circle of radius 80 m at constant speed, and it can be treated as a particle.', tip: 'Then the vertical forces balance and the horizontal net force is m v²/r.' },
        { stage: 'Generate', prompt: 'Vertical: N cos 12° = mg. Horizontal: N sin 12° = m v²/r. Divide to get tan 12° = v²/(g r), so v = √(g r tan 12°).', tip: 'Dividing the two equations removes both N and m.' },
        { stage: 'Evaluate', prompt: 'Check limits, units and size.', tip: 'At θ = 0 the formula gives v = 0: an icy flat road cannot turn a car at any speed. A steeper bank allows a higher speed. √(m/s² × m) = m/s. 12.9 m/s is about 46 km/h, reasonable for an 80 m curve. Note also N = mg / cos 12°, which is more than mg, not mg cos 12° as on an incline.' },
      ],
      answer: q(Math.sqrt(9.8 * 80 * Math.tan(deg(12))), D.velocity),
      hint: 'Use horizontal and vertical axes. The vertical forces balance, and the horizontal part of the normal force is m v²/r.',
      worked: 'N cos 12° = mg and N sin 12° = m v²/r. Dividing, tan 12° = v²/(g r), so v² = (9.8)(80)(tan 12°) = 784 × 0.2126 = 166.6 m²/s², and v = 12.9 m/s.',
    },
    {
      kind: 'selfExplain',
      id: 'n07.q7',
      prompt: 'A passenger in a car turning sharply left feels pressed against the right-hand door. A friend says, "Centrifugal force pushes her outward." Explain what is really happening, as seen from the road.',
      model: 'Seen from the road, which is an inertial frame, no force pushes her outward. By Newton\'s first law her body tends to keep moving in a straight line. The car turns left underneath her, so the right-hand door moves into her path and must push her to the left, toward the center of the turn, to make her follow the curve. That inward push from the door is the force she feels, and it supplies her m v²/r. If the door suddenly opened, she would move off along the tangent in a straight line, not straight out from the center. "Centrifugal force" only appears if you insist on using the turning car as your reference frame, and that frame is not inertial.',
    },
  ],
};
