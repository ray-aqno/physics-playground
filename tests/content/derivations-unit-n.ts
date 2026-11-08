import { N01_N02_DERIVATIONS } from './derivations-n01-n02';
import { N03_N05_DERIVATIONS } from './derivations-n03-n05';
import { N06_N07_DERIVATIONS } from './derivations-n06-n07';

/** Second, independent derivations of every Unit N answer key (council condition 2, SC3). */
export const UNIT_N_DERIVATIONS: Readonly<Record<string, () => readonly number[]>> = { ...N01_N02_DERIVATIONS, ...N03_N05_DERIVATIONS, ...N06_N07_DERIVATIONS };
