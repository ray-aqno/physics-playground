import { assertFinite, invariant } from '../lib/invariant';
import type { ForceVec } from '../physics/forces';
import { pulleyForces, type PulleyParams, type PulleyState } from '../physics/pulley';
import type { Palette } from './draw';
import { drawForceArrows } from './drawForces';

/** Longest force arrow (the heavier block's weight), in px. */
const MAX_ARROW = 60;
/** Space under the floor line, so a landed block's weight arrow and label stay on the canvas. */
const FLOOR_GAP = 46;

/** Drawn block side (px): at least 32 px so the block number shows; grows gently with mass. */
export function blockSide(m: number): number {
  invariant(m > 0 && Number.isFinite(m), 'mass must be positive');
  const side = 30 + 5 * Math.cbrt(m);
  invariant(side >= 30, 'block is at least 30 px');
  return side;
}

/** Arrow scale (px per N), fixed for a setup so arrows can be compared as the sim runs. */
export function arrowScale(p: PulleyParams): number {
  const wMax = Math.max(p.m1, p.m2) * p.g;
  invariant(wMax > 0 && Number.isFinite(wMax), 'weights must be positive');
  const k = MAX_ARROW / wMax;
  assertFinite(k, 'arrow scale');
  return k;
}

/** Splits a free-body list: gravity and tension from the block centre; normal and net beside it. */
function split(forces: readonly ForceVec[]): { readonly main: ForceVec[]; readonly side: ForceVec[] } {
  invariant(forces.length <= 8, 'at most 8 forces');
  const main = forces.filter((f) => f.kind === 'gravity' || f.kind === 'tension');
  const side = forces.filter((f) => f.kind === 'normal' || f.kind === 'net');
  invariant(main.length + side.length === forces.length, 'hanging blocks have no friction');
  return { main, side };
}

/** Canvas labels are shortened so they fit at 360 px; the readout says static or kinetic. */
function canvasLabels(forces: readonly ForceVec[]): ForceVec[] {
  invariant(forces.length <= 8, 'at most 8 forces');
  const out = forces.map((f) => (f.kind === 'friction' ? { ...f, label: 'Friction' } : f));
  invariant(out.length === forces.length, 'every force kept');
  return out;
}

function drawBlock(ctx: CanvasRenderingContext2D, cx: number, cy: number, side: number, n: 1 | 2, pal: Palette): void {
  invariant(side >= 30, 'block is at least 30 px');
  invariant(Number.isFinite(cx) && Number.isFinite(cy), 'block position must be finite');
  ctx.fillStyle = pal.track;
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - side / 2, cy - side / 2, side, side, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = pal.ink;
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(String(n), cx - side / 2 + 4, cy - side / 2 + 3);
}

/** Masses written in a top corner, clear of the arrows (left for Atwood, right for the table). */
function drawCaption(ctx: CanvasRenderingContext2D, p: PulleyParams, W: number, pal: Palette): void {
  invariant(p.m1 > 0 && p.m2 > 0, 'masses must be positive');
  invariant(pal.ink.length > 0, 'palette has ink');
  ctx.fillStyle = pal.ink;
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.textAlign = p.mode === 'atwood' ? 'left' : 'right';
  ctx.textBaseline = 'middle';
  const x = p.mode === 'atwood' ? 8 : W - 8;
  ctx.fillText(`Block 1: ${p.m1.toFixed(1)} kg`, x, 12);
  ctx.fillText(`Block 2: ${p.m2.toFixed(1)} kg`, x, 27);
}

function line(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number): void {
  invariant(Number.isFinite(x0 + y0 + x1 + y1), 'line ends must be finite');
  invariant(ctx.lineWidth > 0, 'line needs a width');
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function drawPulleyWheel(ctx: CanvasRenderingContext2D, xp: number, yp: number, r: number, pal: Palette): void {
  invariant(r > 0, 'pulley radius must be positive');
  invariant(Number.isFinite(xp + yp), 'pulley position must be finite');
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(xp, yp, r, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = pal.ink;
  ctx.beginPath();
  ctx.arc(xp, yp, 3, 0, 2 * Math.PI);
  ctx.fill();
}

interface Hanging {
  readonly cx: number;
  readonly cy: number;
  readonly side: number;
  readonly n: 1 | 2;
  readonly forces: readonly ForceVec[];
  /** Where the normal / net arrows go: left or right of the block. */
  readonly slot: 'left' | 'right';
}

/** A hanging block with its free-body diagram: weight and tension from the centre, normal and net beside it. */
function drawHanging(ctx: CanvasRenderingContext2D, b: Hanging, pxPerN: number, pal: Palette): void {
  invariant(pxPerN > 0, 'arrow scale must be positive');
  const parts = split(b.forces);
  invariant(parts.main.length >= 1, 'a hanging block has a weight');
  drawBlock(ctx, b.cx, b.cy, b.side, b.n, pal);
  drawForceArrows(ctx, b.cx, b.cy, parts.main, pxPerN, pal);
  const sx = b.slot === 'right' ? b.cx + b.side / 2 + 14 : b.cx - b.side / 2 - 48;
  drawForceArrows(ctx, sx, b.cy, parts.side, pxPerN, pal);
}

function clear(ctx: CanvasRenderingContext2D, p: PulleyParams, pal: Palette): { readonly W: number; readonly H: number } {
  const W = ctx.canvas.clientWidth;
  const H = ctx.canvas.clientHeight;
  invariant(W > 0 && H > 0, 'canvas must have a size');
  invariant(pal.bg.length > 0, 'palette has a background');
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = pal.track;
  ctx.lineWidth = 3;
  line(ctx, 0, H - FLOOR_GAP, W, H - FLOOR_GAP);
  drawCaption(ctx, p, W, pal);
  return { W, H };
}

/**
 * Atwood machine to scale: both blocks start level, `travel` above the floor; block 2 is x lower
 * and block 1 x higher. The scale fits the rising block under the pulley at the end.
 */
function drawAtwood(ctx: CanvasRenderingContext2D, state: PulleyState, p: PulleyParams, pal: Palette): void {
  const { W, H } = clear(ctx, p, pal);
  invariant(p.mode === 'atwood', 'Atwood layout');
  const r = 26;
  const xp = W * 0.5;
  const yp = r + 12;
  const floorY = H - FLOOR_GAP;
  const s1 = blockSide(p.m1);
  const s2 = blockSide(p.m2);
  const scale = Math.max(floorY - yp - 12 - Math.max(s1, s2), 10) / (2 * p.travel);
  invariant(scale > 0, 'drawing scale must be positive');
  const bottom1 = floorY - (p.travel + state.x) * scale;
  const bottom2 = floorY - (p.travel - state.x) * scale;
  ctx.strokeStyle = pal.muted;
  ctx.lineWidth = 3;
  line(ctx, xp - 30, 3, xp + 30, 3);
  ctx.lineWidth = 2;
  line(ctx, xp, 3, xp, yp);
  drawPulleyWheel(ctx, xp, yp, r, pal);
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.5;
  line(ctx, xp - r, yp, xp - r, bottom1 - s1);
  line(ctx, xp + r, yp, xp + r, bottom2 - s2);
  const { block1, block2 } = pulleyForces(state, p);
  const k = arrowScale(p);
  drawHanging(ctx, { cx: xp - r, cy: bottom1 - s1 / 2, side: s1, n: 1, forces: block1, slot: 'left' }, k, pal);
  drawHanging(ctx, { cx: xp + r, cy: bottom2 - s2 / 2, side: s2, n: 2, forces: block2, slot: 'right' }, k, pal);
}

function drawTableTop(ctx: CanvasRenderingContext2D, edge: number, tableY: number, floorY: number, pal: Palette): void {
  invariant(edge > 0 && tableY < floorY, 'table fits on the canvas');
  invariant(Number.isFinite(edge + tableY), 'table position must be finite');
  ctx.fillStyle = pal.track;
  ctx.fillRect(4, tableY, edge - 4, 8);
  ctx.fillRect(14, tableY, 6, floorY - tableY);
  ctx.fillRect(edge - 18, tableY, 6, floorY - tableY);
}

/** Table block: all four forces from the centre; the net arrow sits just above, clear of the normal arrow. */
function drawTableBlock(ctx: CanvasRenderingContext2D, cx: number, cy: number, side: number, forces: readonly ForceVec[], k: number, pal: Palette): void {
  invariant(side >= 30, 'block is at least 30 px');
  const labelled = canvasLabels(forces);
  invariant(labelled.some((f) => f.kind === 'normal'), 'the table pushes up on block 1');
  drawBlock(ctx, cx, cy, side, 1, pal);
  drawForceArrows(ctx, cx, cy, labelled.filter((f) => f.kind !== 'net'), k, pal);
  drawForceArrows(ctx, cx + 8, cy - side / 2 - 12, labelled.filter((f) => f.kind === 'net'), k, pal);
}

/**
 * Table mode to scale: block 1 slides right toward the pulley at the table edge and block 2 hangs
 * below it. The string leaves block 1 a little above its centre so the tension label stays clear
 * of the string. Block 1 ends 16 px short of the pulley wheel when block 2 reaches the floor.
 */
function drawTable(ctx: CanvasRenderingContext2D, state: PulleyState, p: PulleyParams, pal: Palette): void {
  const { W, H } = clear(ctx, p, pal);
  invariant(p.mode === 'table', 'table layout');
  const floorY = H - FLOOR_GAP;
  const tableY = H * 0.45;
  const xp = W * 0.62;
  const r = 16;
  const s1 = blockSide(p.m1);
  const s2 = blockSide(p.m2);
  const y1 = tableY - s1 / 2;
  const ys = y1 - s1 / 4;
  const yp = ys + r;
  const scale = Math.max(Math.min(xp - r - 16 - s1 - 70, floorY - yp - r - 10 - s2), 10) / p.travel;
  invariant(scale > 0, 'drawing scale must be positive');
  const right1 = xp - r - 16 - (p.travel - state.x) * scale;
  const bottom2 = floorY - (p.travel - state.x) * scale;
  drawTableTop(ctx, xp, tableY, floorY, pal);
  drawPulleyWheel(ctx, xp, yp, r, pal);
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.5;
  line(ctx, right1, ys, xp, ys);
  line(ctx, xp + r, yp, xp + r, bottom2 - s2);
  const { block1, block2 } = pulleyForces(state, p);
  const k = arrowScale(p);
  drawTableBlock(ctx, right1 - s1 / 2, y1, s1, block1, k, pal);
  drawHanging(ctx, { cx: xp + r, cy: bottom2 - s2 / 2, side: s2, n: 2, forces: block2, slot: 'right' }, k, pal);
}

/** Draws the pulley sim (Atwood or table) with labelled free-body diagrams on both blocks. */
export function drawPulley(ctx: CanvasRenderingContext2D, state: PulleyState, p: PulleyParams, pal: Palette): void {
  invariant(p.travel > 0, 'travel must be positive');
  invariant(Number.isFinite(state.x), 'position must be finite');
  if (p.mode === 'atwood') drawAtwood(ctx, state, p, pal);
  else drawTable(ctx, state, p, pal);
}
