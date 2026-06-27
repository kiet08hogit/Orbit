/**
 * Orbit color tokens — dark by default, warm-ink subtones, one Cursor-Orange voltage.
 * Mirrors frontend/app/globals.css :root + DESIGN-cursor.md token map.
 */

export const palette = {
  // canvas
  background: '#0a0a0a',
  card: '#111111',
  surfaceElevated: '#1a1916',
  ink: '#26251e',
  inkWarm: '#1d1d1f',

  // text
  foreground: '#f7f7f4',
  body: '#c8c5bc',
  bodyMuted: '#a09c92',
  muted: '#807d72',
  mutedSoft: '#5a5852',

  // hairlines
  hairline: '#26251e',
  hairlineStrong: '#3a3833',
  hairlineSoft: '#1a1916',

  // brand
  accent: '#f54e00',
  accentPressed: '#d04200',
  accentSoft: '#3a1a0a',
  onAccent: '#ffffff',

  // semantic
  success: '#1f8a65',
  error: '#cf2d56',
  warning: '#c08532',

  // category / timeline pastels (reused as listing category tags)
  catThinking: '#dfa88f',
  catGrep: '#9fc9a2',
  catRead: '#9fbbe0',
  catEdit: '#c0a8dd',
  catDone: '#c08532',
  catNeutral: '#a09c92',

  // overlays
  scrim: 'rgba(10, 10, 10, 0.6)',
  scrimStrong: 'rgba(10, 10, 10, 0.85)',
  glass: 'rgba(247, 247, 244, 0.06)',
  glassStrong: 'rgba(247, 247, 244, 0.12)',
} as const;

export type ColorToken = keyof typeof palette;

export const categoryColors: Record<string, string> = {
  HOUSING: palette.catRead,
  CLOTHES: palette.catEdit,
  SCHOOL: palette.catGrep,
  LEISURE: palette.catThinking,
  ACCESSORIES: palette.catDone,
  OTHER: palette.catNeutral,
};
