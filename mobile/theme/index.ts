export { palette, categoryColors } from './colors';
export type { ColorToken } from './colors';
export { type, fontFamily } from './typography';
export type { TypeToken } from './typography';
export { spacing, radius, hitSlop } from './spacing';
export type { SpacingToken, RadiusToken } from './spacing';

export const theme = {
  // single dark theme — matches frontend default (`:root` not `.dark`)
  mode: 'dark' as const,
};
