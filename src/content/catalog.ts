import type { Lesson } from './types';
import { labCross, labDot, labVectorAdd } from './skills-lab/vector-ops';
import { labTrig, labVectors } from './skills-lab/trig-and-vectors';
import { labPrefixes, labSigfigs, labUnits } from './skills-lab/units-and-numbers';
import { UNIT_C } from './unit-c';
import reviewJson from './review.json';
import type { ReviewRecord } from './release';

/** The Skills Lab, in path order: number skills first, then vectors. */
export const SKILLS_LAB: readonly Lesson[] = [labUnits, labPrefixes, labSigfigs, labTrig, labVectors, labVectorAdd, labDot, labCross];

/** The whole learning path, in order. */
export const ALL_LESSONS: readonly Lesson[] = [...SKILLS_LAB, ...UNIT_C];

/** Lessons whose answer keys a person has reviewed (lesson id -> content hash). See docs/key-review.md. */
export const REVIEWED: ReviewRecord = reviewJson;
