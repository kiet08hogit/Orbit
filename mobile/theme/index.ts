export { palette, cream, categoryColors, categoryLabels } from './colors';
export type { ColorToken } from './colors';
export { type, fontFamily } from './typography';
export type { TypeToken } from './typography';
export { spacing, radius, hitSlop } from './spacing';
export type { SpacingToken, RadiusToken } from './spacing';

/** Mobile matches the web app's dark theme (globals.css `.dark`). */
export const theme = {
  mode: 'dark' as const,
};
