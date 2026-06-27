import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { palette, type } from '@/theme';

interface Props {
  uri?: string;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name, size = 36 }: Props) {
  const initials = (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || '·';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]}
        accessibilityLabel={name ? `${name} avatar` : 'avatar'}
      />
    );
  }
  return (
    <View
      style={[
        styles.base,
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      accessibilityLabel={name ? `${name} avatar` : 'avatar'}
    >
      <Text style={[type.captionUpper, { color: palette.foreground }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.hairlineStrong,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
