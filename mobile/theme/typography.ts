/**
 * Type system — Inter as CursorGothic substitute, JetBrains Mono for data/code.
 * Display sits at weight 400 with negative tracking — magazine voice, never bold.
 */

import { TextStyle } from 'react-native';

export const fontFamily = {
  display: 'Inter_400Regular',
  displayMedium: 'Inter_500Medium',
  bodyMedium: 'Inter_500Medium',
  body: 'Inter_400Regular',
  bodySemi: 'Inter_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

export const type = {
  displayMega: {
    fontFamily: fontFamily.display,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1.7,
  },
  displayLg: {
    fontFamily: fontFamily.display,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.72,
  },
  displayMd: {
    fontFamily: fontFamily.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  displaySm: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  titleMd: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 18,
    lineHeight: 24,
  },
  titleSm: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 16,
    lineHeight: 22,
  },
  bodyLg: {
    fontFamily: fontFamily.body,
    fontSize: 17,
    lineHeight: 25,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyStrong: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySm: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 16,
  },
  captionUpper: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 14,
    lineHeight: 18,
  },
  buttonLg: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 16,
    lineHeight: 20,
  },
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: 13,
    lineHeight: 18,
  },
  monoSm: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
  },
  price: {
    fontFamily: fontFamily.monoMedium,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
} as const satisfies Record<string, TextStyle>;

export type TypeToken = keyof typeof type;
