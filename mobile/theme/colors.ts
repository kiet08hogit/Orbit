/**
 * Semantic color tokens — mirrors frontend/app/globals.css `.dark` (mobile default)
 * and DESIGN-cursor.md light band tokens for marketing sections.
 *
 * Use `palette.*` in app screens; use `cream.*` on landing/marketing bands only.
 */

/** Web `.dark` semantic map (shadcn / globals.css) */
export const palette = {
  background: '#000000',
  foreground: '#f7f7f4',

  card: '#111111',
  cardForeground: '#ffffff',

  secondary: '#1a1a1a',
  secondaryForeground: '#a09c92',

  muted: '#262626',
  mutedForeground: '#807d72',

  border: '#262626',
  input: '#262626',
  ring: '#f54e00',

  primary: '#f54e00',
  primaryForeground: '#ffffff',

  destructive: '#cf2d56',
  destructiveForeground: '#ffffff',

  // aliases used across existing mobile screens
  surfaceElevated: '#1a1a1a',
  ink: '#26251e',
  body: '#a09c92',
  bodyMuted: '#807d72',
  accent: '#f54e00',
  accentPressed: '#d04200',
  accentSoft: '#3a1a0a',
  onAccent: '#ffffff',

  hairline: '#262626',
  hairlineStrong: '#3a3833',
  hairlineSoft: '#1a1a1a',

  success: '#1f8a65',
  error: '#cf2d56',
  warning: '#c08532',

  // timeline pastels (DESIGN-cursor.md — category tags only)
  catThinking: '#dfa88f',
  catGrep: '#9fc9a2',
  catRead: '#9fbbe0',
  catEdit: '#c0a8dd',
  catDone: '#c08532',
  catNeutral: '#a09c92',

  scrim: 'rgba(0, 0, 0, 0.6)',
  scrimStrong: 'rgba(0, 0, 0, 0.85)',
  glass: 'rgba(247, 247, 244, 0.06)',
  glassStrong: 'rgba(247, 247, 244, 0.12)',

  /** Home hero banner surface (web: dark:bg-[#181922]) */
  heroBanner: '#181922',
  /** Home hero banner surface in light context */
  heroBannerLight: '#e6e5e0',

  link: '#0066cc',
} as const;

/** Editorial cream band — web landing `dark:` variant (DESIGN-cursor.md :root) */
export const cream = {
  canvas: '#f7f7f4',
  canvasSoft: '#fafaf7',
  card: '#ffffff',
  ink: '#26251e',
  body: '#5a5852',
  muted: '#807d72',
  hairline: '#e6e5e0',
  hairlineStrong: '#cfcdc4',
  surfaceStrong: '#e6e5e0',
} as const;

export type ColorToken = keyof typeof palette;

export const categoryColors: Record<string, string> = {
  DORM: palette.catRead,
  SUBLEASE: palette.catRead,
  CLOTHES: palette.catEdit,
  SCHOOL: palette.catGrep,
  LEISURE: palette.catThinking,
  ACCESSORIES: palette.catDone,
  SERVICES: palette.catGrep,
  OTHER: palette.catNeutral,
};

export const categoryLabels: Record<string, string> = {
  DORM: 'Dorm',
  SUBLEASE: 'Sublease',
  CLOTHES: 'Clothing',
  SCHOOL: 'School',
  LEISURE: 'Leisure',
  ACCESSORIES: 'Accessories',
  SERVICES: 'Services',
  OTHER: 'Other',
};
