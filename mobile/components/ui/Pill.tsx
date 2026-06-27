import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { palette, radius, spacing, type } from '@/theme';

interface Props {
  label: string;
  tone?: 'neutral' | 'accent' | 'category';
  color?: string;
  selected?: boolean;
  onPress?: () => void;
  dot?: boolean;
}

export function Pill({ label, tone = 'neutral', color, selected, onPress, dot }: Props) {
  const isCategory = tone === 'category';
  const isAccent = tone === 'accent';
  const tint = isCategory && color ? color : isAccent ? palette.accent : palette.glassStrong;

  const baseStyle: ViewStyle = {
    backgroundColor: selected
      ? palette.foreground
      : isCategory
        ? `${tint}22`
        : palette.glass,
    borderColor: selected
      ? palette.foreground
      : isCategory
        ? `${tint}55`
        : palette.hairlineStrong,
  };

  const content = (
    <>
      {dot ? <View style={[styles.dot, { backgroundColor: tint }]} /> : null}
      <Text
        style={[
          type.captionUpper,
          {
            color: selected ? palette.background : isCategory ? tint : palette.body,
          },
        ]}
      >
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={({ pressed }) => [styles.base, baseStyle, pressed && { opacity: 0.7 }]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.base, baseStyle]}>{content}</View>;
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginRight: spacing.xs,
  },
});
