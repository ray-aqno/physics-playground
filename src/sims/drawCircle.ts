import { invariant } from '../lib/invariant';
import { circleForces, type CircleParams, type CircleState, type ReleaseSnapshot } from '../physics/circle';
import type { Palette } from './draw';
import { drawForceArrows } from './drawForces';

export interface CircleDrawing {
  readonly state: CircleState;
  readonly params: CircleParams;
  readonly trail: readonly { readonly x: number; readonly y: number }[];
  readonly release: ReleaseSnapshot | null;
  /** Speed the arrow scales are set from (the setup's speed), so arrows grow with v and v². */
  readonly refSpeed: number;
}

interface Frame {
  readonly cx: number;
  readonly cy: number;
  /** Pixels per metre. */
  readonly s: number;
}

/** Visible half-height of the ice in string lengths. */
const VIEW_HALF = 1.9;

function toPx(f: Frame, x: number, y: number): [number, number] {
  return [f.cx + x * f.s, f.cy - y * f.s];
}

function drawTrail(ctx: CanvasRenderingContext2D, f: Frame, trail: CircleDrawing['trail'], pal: Palette): void {
  invariant(trail.length <= 2000, 'trail is bounded');
  invariant(f.s > 0, 'scale must be positive');
  if (trail.length < 2) return;
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = pal.muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  // bound: trail.length <= 2000
  trail.forEach((pt, i) => {
    const [px, py] = toPx(f, pt.x, pt.y);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.restore();
}

/** Velocity arrow: thin, solid ink, open chevron head (as in the collisions sim), labelled "v"; forces have filled heads. */
function drawVelocity(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, pal: Palette): void {
  invariant(Number.isFinite(dx) && Number.isFinite(dy), 'velocity arrow must be finite');
  invariant(Number.isFinite(x) && Number.isFinite(y), 'velocity arrow origin must be finite');
  const len = Math.hypot(dx, dy);
  if (len < 3) return;
  const a = Math.atan2(dy, dx);
  ctx.save();
  ctx.strokeStyle = pal.ink;
  ctx.fillStyle = pal.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.moveTo(x + dx - 10 * Math.cos(a - 0.5), y + dy - 10 * Math.sin(a - 0.5));
  ctx.lineTo(x + dx, y + dy);
  ctx.lineTo(x + dx - 10 * Math.cos(a + 0.5), y + dy - 10 * Math.sin(a + 0.5));
  ctx.stroke();
  ctx.font = 'italic 700 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('v', x + dx + 12 * Math.cos(a), y + dy + 12 * Math.sin(a));
  ctx.restore();
}

function drawPostStringPuck(ctx: CanvasRenderingContext2D, f: Frame, d: CircleDrawing, pal: Palette): [number, number] {
  invariant(d.params.r > 0, 'string length must be positive');
  const [px, py] = toPx(f, d.state.x, d.state.y);
  invariant(Number.isFinite(px) && Number.isFinite(py), 'puck position must be finite');
  ctx.save();
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = pal.track;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(f.cx, f.cy, d.params.r * f.s, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.setLineDash([]);
  if (!d.state.released) {
    ctx.strokeStyle = pal.muted;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(f.cx, f.cy);
    ctx.lineTo(px, py);
    ctx.stroke();
  }
  ctx.fillStyle = pal.ink;
  ctx.beginPath();
  ctx.arc(f.cx, f.cy, 5, 0, 2 * Math.PI);
  ctx.fill();
  // Drawn at least 12 px in radius so it stays visible at 360 px; its position stays to scale.
  ctx.fillStyle = pal.accent;
  ctx.beginPath();
  ctx.arc(px, py, Math.max(0.08 * d.params.r * f.s, 12), 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
  return [px, py];
}

function drawReleaseMark(ctx: CanvasRenderingContext2D, f: Frame, rel: ReleaseSnapshot | null, pal: Palette): void {
  invariant(f.s > 0, 'scale must be positive');
  if (rel === null) return;
  const [x, y] = toPx(f, rel.x, rel.y);
  invariant(Number.isFinite(x) && Number.isFinite(y), 'release point must be finite');
  ctx.save();
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5);
  ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5);
  ctx.stroke();
  ctx.fillStyle = pal.ink;
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('cut here', x + 8, y + 12);
  ctx.restore();
}

/** Draws the post, string, puck, trail, velocity arrow and the free-body diagram (top view). */
export function drawCircle(ctx: CanvasRenderingContext2D, d: CircleDrawing, pal: Palette): void {
  const W = ctx.canvas.clientWidth;
  const H = ctx.canvas.clientHeight;
  invariant(W > 0 && H > 0, 'canvas must have a size');
  invariant(d.refSpeed > 0 && d.params.m > 0, 'reference speed and mass must be positive');
  const f: Frame = { cx: W / 2, cy: H / 2, s: Math.min(W, H) / 2 / (VIEW_HALF * d.params.r) };
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);
  drawTrail(ctx, f, d.trail, pal);
  drawReleaseMark(ctx, f, d.release, pal);
  const [px, py] = drawPostStringPuck(ctx, f, d, pal);
  const rs = d.params.r * f.s;
  const speed = Math.hypot(d.state.vx, d.state.vy);
  const pxPerMps = Math.min((0.7 * rs) / d.refSpeed, (1.2 * rs) / speed);
  drawVelocity(ctx, px, py, d.state.vx * pxPerMps, -d.state.vy * pxPerMps, pal);
  const forces = circleForces(d.state, d.params);
  const tRef = (d.params.m * d.refSpeed * d.refSpeed) / d.params.r;
  const tNow = (d.params.m * speed * speed) / d.params.r;
  const pxPerN = Math.min((0.7 * rs) / tRef, (0.9 * rs) / tNow);
  // The only horizontal force is the tension, so it IS the net force: the dashed net arrow lies on
  // top of it and one label names both (two labels at the same tip would overlap at 360 px).
  const fbd = forces.map((g) => (g.kind === 'net' ? { ...g, label: '' } : { ...g, label: `${g.label} = net force` }));
  drawForceArrows(ctx, px, py, fbd, pxPerN, pal);
  ctx.fillStyle = pal.muted;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(d.state.released ? 'String cut: no horizontal force' : 'Top view: string pulls toward the post', 8, 8);
  ctx.textBaseline = 'bottom';
  ctx.fillText('v = velocity (not a force)', 8, H - 8);
}
