import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { palette, radius, spacing } from '@/theme';

interface Props extends ViewProps {
  variant?: 'flat' | 'hairline' | 'elevated';
  padded?: boolean;
}

export function Card({ variant = 'hairline', padded = true, style, children, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[
        styles.base,
        variant === 'hairline' && styles.hairline,
        variant === 'elevated' && styles.elevated,
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
  },
  hairline: {
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  elevated: {
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.hairlineStrong,
  },
  padded: {
    padding: spacing.lg,
  },
});
