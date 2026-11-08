import { invariant } from '../lib/invariant';
import type { ForceKind, ForceVec } from '../physics/forces';
import type { Palette } from './draw';

/** Arrow colours by force kind; "net" uses the theme ink and is drawn dashed. */
export function forceColor(kind: ForceKind, pal: Palette): string {
  switch (kind) {
    case 'gravity': return pal.accent;
    case 'normal': return pal.accent2;
    case 'friction': return '#e8590c';
    case 'tension': return '#ae3ec9';
    case 'net': return pal.ink;
  }
}

/**
 * Draws a free-body diagram at pixel point (ox, oy): one labelled arrow per force, scaled by
 * pxPerN (canvas y points down, so world fy is flipped). Arrows shorter than 3 px are skipped.
 */
export function drawForceArrows(ctx: CanvasRenderingContext2D, ox: number, oy: number, forces: readonly ForceVec[], pxPerN: number, pal: Palette): void {
  invariant(forces.length <= 8, 'at most 8 forces');
  invariant(Number.isFinite(pxPerN) && pxPerN > 0, 'arrow scale must be positive');
  ctx.save();
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  // bound: forces.length <= 8
  for (const f of forces) {
    const dx = f.fx * pxPerN;
    const dy = -f.fy * pxPerN;
    const len = Math.hypot(dx, dy);
    if (len < 3) continue;
    const color = forceColor(f.kind, pal);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = f.kind === 'net' ? 2 : 3;
    ctx.setLineDash(f.kind === 'net' ? [6, 4] : []);
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + dx, oy + dy);
    ctx.stroke();
    ctx.setLineDash([]);
    const a = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(ox + dx, oy + dy);
    ctx.lineTo(ox + dx - 9 * Math.cos(a - 0.45), oy + dy - 9 * Math.sin(a - 0.45));
    ctx.lineTo(ox + dx - 9 * Math.cos(a + 0.45), oy + dy - 9 * Math.sin(a + 0.45));
    ctx.closePath();
    ctx.fill();
    ctx.textAlign = dx >= 0 ? 'left' : 'right';
    ctx.fillText(f.label, ox + dx + (dx >= 0 ? 6 : -6) * Math.abs(Math.cos(a)), oy + dy + 10 * Math.sin(a));
  }
  ctx.restore();
}
