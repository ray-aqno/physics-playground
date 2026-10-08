import type { Quantity } from '../checker/dims';
import type { WorldSpec } from '../physics/bodies';
import type { RampParams } from '../physics/energyRamp';

export type UnitId = 'lab' | 'C';
export type SimId = 'collisions' | 'com' | 'energy';
export type TriageStageName = 'Translate' | 'Represent' | 'Identify' | 'Assume' | 'Generate' | 'Evaluate';
export const TRIAGE_ORDER: readonly TriageStageName[] = ['Translate', 'Represent', 'Identify', 'Assume', 'Generate', 'Evaluate'];

export interface Choice {
  readonly text: string;
}

export interface TriageStage {
  readonly stage: TriageStageName;
  readonly prompt: string;
  readonly tip: string;
  /** Optional quick check for this stage; `answer` indexes `choices`. */
  readonly check?: { readonly choices: readonly string[]; readonly answer: number };
}

/** A sim setup that the predict step's claims are checked against, headless, in tests. */
export type SimSetup =
  | { readonly sim: 'collisions' | 'com'; readonly world: WorldSpec; readonly seconds: number }
  | { readonly sim: 'energy'; readonly ramp: RampParams; readonly startS: number; readonly seconds: number };

/** Claims a predict choice can make; tests evaluate them on the headless sim run. */
export type Claim =
  | { readonly kind: 'velocity-sign'; readonly body: number; readonly sign: -1 | 0 | 1 }
  | { readonly kind: 'ke-change'; readonly change: 'same' | 'less' | 'more' }
  | { readonly kind: 'com-velocity'; readonly change: 'same' | 'different' }
  | { readonly kind: 'max-height'; readonly relation: 'lower' | 'same' | 'higher' };

export type Step =
  | { readonly kind: 'explain'; readonly md: string }
  | { readonly kind: 'predict'; readonly id: string; readonly prompt: string; readonly setup: SimSetup; readonly choices: readonly (Choice & { readonly claim: Claim })[]; readonly answer: number; readonly reveal: string }
  | { readonly kind: 'mcq'; readonly id: string; readonly prompt: string; readonly choices: readonly string[]; readonly answer: number; readonly hint: string; readonly explain: string }
  | { readonly kind: 'numeric'; readonly id: string; readonly prompt: string; readonly answer: Quantity; readonly tol?: number; readonly sigFigs?: number; readonly angle?: boolean; readonly inUnits?: string; readonly hint: string; readonly worked: string }
  | { readonly kind: 'triage'; readonly id: string; readonly problem: string; readonly stages: readonly TriageStage[]; readonly answer: Quantity; readonly tol?: number; readonly hint: string; readonly worked: string }
  | { readonly kind: 'selfExplain'; readonly id: string; readonly prompt: string; readonly model: string };

export interface Lesson {
  readonly id: string;
  readonly unit: UnitId;
  /** "LAB" for the Skills Lab, "C1".."C14" for Unit C. */
  readonly chapter: string;
  readonly title: string;
  readonly minutes: number;
  /** Skills Lab lesson ids this lesson relies on (shown as links). */
  readonly needs: readonly string[];
  readonly steps: readonly Step[];
}

export type AnswerStep = Extract<Step, { kind: 'numeric' | 'triage' }>;

export function isAnswerStep(s: Step): s is AnswerStep {
  return s.kind === 'numeric' || s.kind === 'triage';
}
