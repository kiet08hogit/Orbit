import React from 'react';
import { View } from 'react-native';
import { palette, spacing } from '@/theme';

interface Props {
  vertical?: boolean;
  inset?: boolean;
  strength?: 'soft' | 'default' | 'strong';
}

export function Divider({ vertical, inset, strength = 'default' }: Props) {
  const color =
    strength === 'soft'
      ? palette.hairlineSoft
      : strength === 'strong'
        ? palette.hairlineStrong
        : palette.hairline;
  return (
    <View
      accessibilityRole="none"
      style={{
        backgroundColor: color,
        height: vertical ? '100%' : 1,
        width: vertical ? 1 : 'auto',
        alignSelf: 'stretch',
        marginVertical: vertical ? 0 : 0,
        marginHorizontal: inset ? spacing.base : 0,
      }}
    />
  );
}
