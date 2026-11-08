import { N01_NVEC_DERIVATIONS } from './derivations-n01-nvec';
import { N02_N04_DERIVATIONS } from './derivations-n02-n04';
import { N05_N06_DERIVATIONS } from './derivations-n05-n06';
import { N07_DERIVATIONS } from './derivations-n07';

/** Second, independent derivations of every Unit N answer key (council condition 2, SC3). */
export const UNIT_N_DERIVATIONS: Readonly<Record<string, () => readonly number[]>> = { ...N01_NVEC_DERIVATIONS, ...N02_N04_DERIVATIONS, ...N05_N06_DERIVATIONS, ...N07_DERIVATIONS };
