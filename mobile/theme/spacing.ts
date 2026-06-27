/**
 * 4pt rhythm — matches Cursor design system spacing scale.
 * Section spacing tightens on mobile from 80px to 56px.
 */

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  base: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 56,
  sectionLg: 80,
} as const;

export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  pill: 9999,
  full: 9999,
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
