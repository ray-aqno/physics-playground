import { BodiesSimView } from '../sims/BodiesSimView';
import { RampSimView } from '../sims/RampSimView';

/** Free-play sandbox with all three demonstrations. No answer keys, so always available. */
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
    </section>
  );
}
