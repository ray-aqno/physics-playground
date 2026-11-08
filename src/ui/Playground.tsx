import { BodiesSimView } from '../sims/BodiesSimView';
import { CircleSimView } from '../sims/CircleSimView';
import { InclineSimView } from '../sims/InclineSimView';
import { PulleySimView } from '../sims/PulleySimView';
import { RampSimView } from '../sims/RampSimView';

/** Free-play sandbox with every demonstration. No answer keys, so always available. */
export function Playground() {
  return (
    <section class="playground" aria-label="Playground">
      <h1>Playground</h1>
      <p>Play with the demonstrations. Pause a sim to drag things around or use the arrow keys, then predict what will happen before you press Play.</p>
      <div class="card">
        <h2>Collision carts</h2>
        <p>Watch the total momentum while the carts bounce. Change the bounciness from elastic (e = 1) to sticky (e = 0) in the lessons.</p>
        <BodiesSimView label="Collision carts" showCom={false}
          preset={{ width: 10, height: 1, walls: true, e: 1, bodies: [{ x: 2, y: 0.5, vx: 2, vy: 0, m: 2, r: 0.35 }, { x: 6, y: 0.5, vx: -1, vy: 0, m: 1, r: 0.3 }] }} />
      </div>
      <div class="card">
        <h2>Center of mass</h2>
        <p>The cross marks the center of mass. Collisions between the pucks never change its velocity; only the walls do.</p>
        <BodiesSimView label="Center of mass" showCom
          preset={{ width: 10, height: 6, walls: true, e: 0.9, bodies: [{ x: 2, y: 2, vx: 2, vy: 1, m: 3, r: 0.4 }, { x: 6, y: 4, vx: -1.5, vy: -0.5, m: 1, r: 0.3 }, { x: 8, y: 1.5, vx: -0.5, vy: 1.5, m: 2, r: 0.35 }] }} />
      </div>
      <div class="card">
        <h2>Energy bars</h2>
        <p>Spring, floor and ramp. Watch energy move between kinetic, spring and gravity. This floor has friction, so watch the thermal bar too.</p>
        <RampSimView label="Energy bars" startS={-0.4} params={{ m: 1, k: 50, mu: 0.1, flatLength: 2, angle: Math.PI / 6, g: 9.8 }} />
      </div>
      <h2>Unit N · Forces</h2>
      <div class="card">
        <h2>Block on an incline</h2>
        <p>Arrows show every force on the block and the dashed net force. Tilt the slope with the arrow keys until static friction gives up.</p>
        <InclineSimView label="Block on an incline" startS={0.5} startV={0} params={{ m: 2, angle: (20 * Math.PI) / 180, muS: 0.5, muK: 0.3, g: 9.8, length: 4 }} />
      </div>
      <div class="card">
        <h2>Atwood machine</h2>
        <p>Two blocks on one string over a pulley. Compare the tension with each block's weight. Change the right-hand mass with the arrow keys.</p>
        <PulleySimView label="Atwood machine" params={{ mode: 'atwood', m1: 2, m2: 3, muS: 0, muK: 0, g: 9.8, travel: 1.5 }} />
      </div>
      <div class="card">
        <h2>Block, table and pulley</h2>
        <p>A hanging block pulls a block across a table with friction. Is the tension equal to the hanging weight?</p>
        <PulleySimView label="Table and pulley" params={{ mode: 'table', m1: 4, m2: 2, muS: 0.3, muK: 0.25, g: 9.8, travel: 1.5 }} />
      </div>
      <div class="card">
        <h2>Puck on a string</h2>
        <p>The tension points to the centre and the velocity points along the circle. Cut the string and watch which way the puck goes.</p>
        <CircleSimView label="Puck on a string" releaseAt={null} params={{ m: 0.5, r: 1.5, speed: 2 }} />
      </div>
    </section>
  );
}
