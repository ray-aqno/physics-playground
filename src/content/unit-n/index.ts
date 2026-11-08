import type { Lesson } from '../types';
import { n01, nvec } from './n01-nvec';
import { n02, n03, n04 } from './n02-n04';
import { n05, n06 } from './n05-n06';
import { n07 } from './n07';

/**
 * Unit N lessons in course order (N1-N7, for the Unit N test). Vector calculus is its own
 * unnumbered math module after N1, so the numbered chapters follow the course syllabus.
 */
export const UNIT_N: readonly Lesson[] = [n01, nvec, n02, n03, n04, n05, n06, n07];
