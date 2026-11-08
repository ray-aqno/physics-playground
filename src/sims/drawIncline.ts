import { invariant } from '../lib/invariant';
import { inclineForces, type InclineParams, type InclineState } from '../physics/incline';
import type { Palette } from './draw';
import { drawForceArrows } from './drawForces';
import { angleDegrees } from './inclineController';

/** Canvas height / width for the incline sim. */
export const INCLINE_ASPECT = 0.75;

/** Where the slope sits on the canvas, in CSS pixels (canvas y points down). */
export interface SlopeGeometry {
  /** Top end of the slope surface. */
  readonly x0: number;
  readonly y0: number;
  /** Length of the drawn slope surface (px). */
  readonly lengthPx: number;
  /** Drawn block size (px); at least 28 px so the mass label fits at 360 px wide. */
  readonly block: number;
  /** Pixels per metre along the slope (the block's position stays to scale). */
  readonly pxPerM: number;
}

/** Fits the slope to the left part of the canvas, leaving the top right free for the free-body diagram. */
export function slopeGeometry(W: number, H: number, p: InclineParams): SlopeGeometry {
  invariant(W > 0 && H > 0, 'canvas must have a size');
  invariant(p.length > 0 && p.angle > 0, 'slope needs a length and an angle');
  const margin = 16;
  const cos = Math.cos(p.angle);
  const sin = Math.sin(p.angle);
  // Leave room for the largest block (48 px) standing out of the surface at either end.
  const lengthPx = Math.min((W - 2 * margin - 48 * sin) / cos, (H - 2 * margin - 8 - 48 * cos) / sin);
  const block = Math.min(Math.max(28, 0.12 * lengthPx), 48);
  const y0 = H - margin - 8 - lengthPx * sin;
  // The block's centre runs from block/2 to lengthPx − block/2 as s goes 0 → length: linear, to scale.
  return { x0: margin, y0, lengthPx, block, pxPerM: (lengthPx - block) / p.length };
}

function drawWedge(ctx: CanvasRenderingContext2D, geo: SlopeGeometry, p: InclineParams, pal: Palette): void {
  invariant(geo.lengthPx > geo.block, 'slope is longer than the block');
  invariant(Number.isFinite(geo.y0), 'slope position is finite');
  const xb = geo.x0 + geo.lengthPx * Math.cos(p.angle);
  const yb = geo.y0 + geo.lengthPx * Math.sin(p.angle);
  ctx.fillStyle = pal.track;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(geo.x0, geo.y0);
  ctx.lineTo(xb, yb);
  ctx.lineTo(geo.x0, yb);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = pal.muted;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(geo.x0, geo.y0);
  ctx.lineTo(xb, yb);
  ctx.stroke();
  // The stop at the bottom: a short bar standing out of the surface.
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(xb, yb);
  ctx.lineTo(xb + 16 * Math.sin(p.angle), yb - 16 * Math.cos(p.angle));
  ctx.stroke();
  ctx.fillStyle = pal.ink;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${Math.round(angleDegrees(p) * 10) / 10}°`, xb - geo.block - 8, yb - 2);
}

function drawBlock(ctx: CanvasRenderingContext2D, geo: SlopeGeometry, state: InclineState, p: InclineParams, pal: Palette): void {
  invariant(state.s >= 0 && state.s <= p.length, 'block is on the slope');
  invariant(geo.pxPerM > 0, 'scale must be positive');
  const cos = Math.cos(p.angle);
  const sin = Math.sin(p.angle);
  const u = geo.block / 2 + state.s * geo.pxPerM;
  const half = geo.block / 2;
  ctx.save();
  ctx.translate(geo.x0 + u * cos + half * sin, geo.y0 + u * sin - half * cos);
  ctx.rotate(p.angle);
  ctx.fillStyle = pal.accent2;
  ctx.fillRect(-half, -half, geo.block, geo.block);
  ctx.fillStyle = pal.bg;
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${p.m} kg`, 0, 0);
  ctx.restore();
}

/** Free-body diagram in the top-right corner: a dot for the block and one labelled arrow per force. */
function drawFreeBody(ctx: CanvasRenderingContext2D, W: number, H: number, state: InclineState, p: InclineParams, pal: Palette): void {
  invariant(W > 0 && H > 0, 'canvas must have a size');
  const forces = inclineForces(state, p);
  invariant(p.m * p.g > 0, 'weight must be positive to scale the arrows');
  const ox = W * 0.64;
  const oy = H * 0.36;
  ctx.fillStyle = pal.ink;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Forces on the block', ox, 8);
  // Gravity (m g) is drawn 0.2 × the canvas height long; every other arrow uses the same scale.
  const pxPerN = (0.2 * H) / (p.m * p.g);
  // Friction, the stop's push and the net force all lie along the slope, so the stop's arrow starts
  // 14 px to the outside of that line and the net arrow 14 px to the inside, keeping labels apart.
  const side = (k: number): [number, number] => [ox + k * 14 * Math.sin(p.angle), oy - k * 14 * Math.cos(p.angle)];
  const [sx, sy] = side(1);
  const [nx, ny] = side(-1);
  drawForceArrows(ctx, ox, oy, forces.filter((f) => f.kind !== 'net' && f.label !== 'Stop'), pxPerN, pal);
  drawForceArrows(ctx, sx, sy, forces.filter((f) => f.label === 'Stop'), pxPerN, pal);
  drawForceArrows(ctx, nx, ny, forces.filter((f) => f.kind === 'net'), pxPerN, pal);
  ctx.fillStyle = pal.ink;
  ctx.beginPath();
  ctx.arc(ox, oy, 4, 0, 2 * Math.PI);
  ctx.fill();
}

/** Draws the slope, the stop, the block (to scale along the slope) and the labelled free-body diagram. */
export function drawIncline(ctx: CanvasRenderingContext2D, state: InclineState, p: InclineParams, pal: Palette): void {
  const W = ctx.canvas.clientWidth;
  const H = ctx.canvas.clientHeight;
  invariant(W > 0 && H > 0, 'canvas must have a size');
  invariant(pal.bg.length > 0, 'palette has a background');
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);
  const geo = slopeGeometry(W, H, p);
  drawWedge(ctx, geo, p, pal);
  drawBlock(ctx, geo, state, p, pal);
  drawFreeBody(ctx, W, H, state, p, pal);
}
