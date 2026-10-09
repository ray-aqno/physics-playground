import { invariant } from '../lib/invariant';
import type { World } from '../physics/bodies';
import { heightAt, type RampParams, type RampState } from '../physics/energyRamp';
import { centerOfMass } from '../physics/invariants';

export interface Palette {
  readonly ink: string;
  readonly muted: string;
  readonly accent: string;
  readonly accent2: string;
  readonly track: string;
  readonly bg: string;
}

/** Reads the theme colours from CSS custom properties on the element (light and dark themes). */
export function readPalette(el: Element): Palette {
  const cs = getComputedStyle(el);
  const v = (name: string, fallback: string): string => cs.getPropertyValue(name).trim() || fallback;
  const p = { ink: v('--ink', '#1d2433'), muted: v('--muted', '#6b7385'), accent: v('--accent', '#2f9e44'), accent2: v('--accent-2', '#3b6fd8'), track: v('--line', '#c9cfdb'), bg: v('--surface', '#ffffff') };
  invariant(p.ink.length > 0 && p.bg.length > 0, 'palette has ink and background');
  return p;
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number): void {
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  const a = Math.atan2(dy, dx);
  ctx.lineTo(x + dx - 8 * Math.cos(a - 0.4), y + dy - 8 * Math.sin(a - 0.4));
  ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - 8 * Math.cos(a + 0.4), y + dy - 8 * Math.sin(a + 0.4));
  ctx.stroke();
}

/** Draws carts (1-D) or pucks (2-D), velocity arrows, and the center of mass. */
export function drawBodies(ctx: CanvasRenderingContext2D, world: World, pal: Palette, selected: number, showCom: boolean): void {
  const W = ctx.canvas.clientWidth;
  const H = ctx.canvas.clientHeight;
  invariant(W > 0 && H > 0, 'canvas must have a size');
  invariant(world.bodies.length <= 8, 'at most 8 bodies');
  const s = W / world.width;
  const oneD = world.height <= 1.5;
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = pal.track;
  ctx.lineWidth = 2;
  if (oneD) { ctx.beginPath(); ctx.moveTo(0, H * 0.75); ctx.lineTo(W, H * 0.75); ctx.stroke(); }
  // bound: bodies.length <= 8
  world.bodies.forEach((b, i) => {
    // Drawn at least 44 px wide (carts) or 19 px radius (pucks) so labels fit at 360 px; positions stay to scale.
    const half = oneD ? Math.max(b.r * s, 22) : Math.max(b.r * s, 19);
    const x = b.x * s;
    const y = oneD ? H * 0.75 - 14 : H - b.y * s;
    ctx.fillStyle = i === selected ? pal.accent2 : pal.accent;
    ctx.beginPath();
    if (oneD) ctx.roundRect(x - half, y - 14, 2 * half, 28, 6);
    else ctx.arc(x, y, half, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = pal.bg;
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${b.m} kg`, x, y);
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 2;
    arrow(ctx, x, oneD ? y - 22 : y, b.vx * s * 0.4, -b.vy * s * 0.4);
  });
  if (showCom) drawCom(ctx, world, pal, s, H);
}

function drawCom(ctx: CanvasRenderingContext2D, world: World, pal: Palette, s: number, H: number): void {
  const c = centerOfMass(world.bodies);
  invariant(Number.isFinite(c.x) && Number.isFinite(c.y), 'center of mass is finite');
  const x = c.x * s;
  const y = H - c.y * s;
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 9, y + 9);
  ctx.moveTo(x + 9, y - 9); ctx.lineTo(x - 9, y + 9);
  ctx.stroke();
}

/** Track point (horizontal metres, height metres) for track position s. */
function trackPoint(s: number, p: RampParams): [number, number] {
  invariant(Number.isFinite(s), 'track position must be finite');
  const x = s <= p.flatLength ? s : p.flatLength + (s - p.flatLength) * Math.cos(p.angle);
  return [x, heightAt(s, p)];
}

/** Draws the spring, floor, ramp and block for the energy-bars sim. */
export function drawRamp(ctx: CanvasRenderingContext2D, state: RampState, p: RampParams, pal: Palette): void {
  const W = ctx.canvas.clientWidth;
  const H = ctx.canvas.clientHeight;
  invariant(W > 0 && H > 0, 'canvas must have a size');
  const x0 = -1;
  const span = p.flatLength + 5 * Math.cos(p.angle) - x0;
  const s = W / span;
  const toPx = (m: [number, number]): [number, number] => [(m[0] - x0) * s, H - 12 - m[1] * s];
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = pal.track;
  ctx.lineWidth = 3;
  ctx.beginPath();
  // bound: 120 track samples
  for (let i = 0; i <= 120; i++) {
    const [px, py] = toPx(trackPoint(-1 + (i / 120) * (p.flatLength + 6), p));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  drawSpringAndBlock(ctx, state, p, pal, toPx, s);
}

function drawSpringAndBlock(ctx: CanvasRenderingContext2D, state: RampState, p: RampParams, pal: Palette, toPx: (m: [number, number]) => [number, number], s: number): void {
  invariant(s > 0, 'scale must be positive');
  const [bx, by] = toPx(trackPoint(state.s, p));
  const [wallX, floorY] = toPx([-0.9, 0]);
  const springEnd = Math.min(bx, toPx([0, 0])[0]);
  ctx.strokeStyle = pal.muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(wallX, floorY - 10);
  // bound: 12 zigzag segments
  for (let i = 1; i <= 12; i++) ctx.lineTo(wallX + ((springEnd - wallX) * i) / 12, floorY - 10 + (i % 2 === 0 ? 6 : -6));
  ctx.stroke();
  const size = Math.max(16, 0.3 * s);
  ctx.save();
  ctx.translate(bx, by);
  if (state.s > p.flatLength) ctx.rotate(-p.angle);
  ctx.fillStyle = pal.accent;
  ctx.fillRect(-size / 2, -size, size, size);
  ctx.restore();
}
