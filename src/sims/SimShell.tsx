import type { ComponentChildren, RefObject } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { readPalette, type Palette } from './draw';
import type { Readout } from './describe';

/** Keeps a canvas sized to its container (360 px and up) at device pixel ratio. */
export function useCanvas(aspect: number): { ref: RefObject<HTMLCanvasElement>; ctx: () => CanvasRenderingContext2D | null; palette: () => Palette | null; supported: boolean } {
  const ref = useRef<HTMLCanvasElement>(null);
  const pal = useRef<Palette | null>(null);
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    const canvas = ref.current;
    if (canvas === null) return undefined;
    if (canvas.getContext('2d') === null) { setSupported(false); return undefined; }
    const fit = (): void => {
      const w = canvas.parentElement?.clientWidth ?? 360;
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${Math.round(w * aspect)}px`;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(w * aspect * dpr);
      canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
      pal.current = readPalette(canvas);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (canvas.parentElement !== null) ro.observe(canvas.parentElement);
    return () => { ro.disconnect(); };
  }, [aspect]);
  return { ref, ctx: () => ref.current?.getContext('2d') ?? null, palette: () => pal.current, supported };
}

interface ShellProps {
  readonly label: string;
  readonly running: boolean;
  readonly onToggle: () => void;
  readonly onReset: () => void;
  readonly onKey: (e: KeyboardEvent) => void;
  readonly readout: readonly Readout[];
  readonly description: string;
  readonly message: string | null;
  readonly noCanvas: boolean;
  readonly help: string;
  /** True while a predict step waits for the learner's prediction. */
  readonly locked?: boolean;
  readonly children: ComponentChildren;
}

/**
 * Common frame for every sim: canvas, Play/Pause and Reset buttons, a numeric readout, a text
 * description for screen readers, and keyboard control (council condition 5).
 */
export function SimShell(p: ShellProps) {
  const [showHelp, setShowHelp] = useState(false);
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === ' ') { e.preventDefault(); p.onToggle(); return; }
    if (e.key === 'r' || e.key === 'R') { p.onReset(); return; }
    p.onKey(e);
  };
  return (
    <figure class="sim" aria-label={p.label}>
      <div class="sim-stage" tabIndex={0} onKeyDown={onKeyDown} aria-describedby={`${p.label}-help`}>
        {p.noCanvas ? <p class="sim-fallback">This browser cannot draw the sim, but the numbers below still update.</p> : p.children}
      </div>
      {p.message !== null && <p class="sim-message" role="status">{p.message}</p>}
      <div class="sim-controls">
        <button type="button" class="btn" disabled={p.locked === true} onClick={p.onToggle}>{p.locked === true ? 'Predict first' : p.running ? 'Pause' : 'Play'}</button>
        <button type="button" class="btn btn-ghost" onClick={p.onReset}>Reset</button>
        <button type="button" class="btn btn-ghost" aria-expanded={showHelp} onClick={() => { setShowHelp(!showHelp); }}>Keys</button>
      </div>
      <p id={`${p.label}-help`} class="sim-help" hidden={!showHelp}>{p.help}</p>
      <dl class="readout">
        {p.readout.map((r) => <div key={r.label}><dt>{r.label}</dt><dd>{r.value}</dd></div>)}
      </dl>
      <figcaption class="sim-desc" aria-live="polite">{p.description}</figcaption>
    </figure>
  );
}
