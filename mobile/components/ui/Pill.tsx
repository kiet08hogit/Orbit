import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { palette, radius, spacing, type } from '@/theme';

interface Props {
  label: string;
  tone?: 'neutral' | 'accent' | 'category' | 'nav';
  color?: string;
  selected?: boolean;
  onPress?: () => void;
  dot?: boolean;
}

/**
 * shadcn Badge / ClientNav pill — selected nav pills use bg-primary (Cursor Orange).
 */
export function Pill({ label, tone = 'neutral', color, selected, onPress, dot }: Props) {
  const isCategory = tone === 'category';
  const isNav = tone === 'nav';
  const tint = isCategory && color ? color : palette.primary;

  let baseStyle: ViewStyle;
  let textColor: string;

  if (selected && isNav) {
    baseStyle = {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    };
    textColor = palette.primaryForeground;
  } else if (selected) {
    baseStyle = {
      backgroundColor: palette.primary,
      borderColor: palette.primary,
    };
    textColor = palette.primaryForeground;
  } else if (isNav) {
    baseStyle = {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    };
    textColor = palette.mutedForeground;
  } else if (isCategory) {
    baseStyle = {
      backgroundColor: `${tint}22`,
      borderColor: `${tint}55`,
    };
    textColor = tint;
  } else {
    baseStyle = {
      backgroundColor: palette.glass,
      borderColor: palette.hairlineStrong,
    };
    textColor = palette.body;
  }

  const content = (
    <>
      {dot ? <View style={[styles.dot, { backgroundColor: tint }]} /> : null}
      <Text style={[isNav ? type.body : type.captionUpper, { color: textColor, fontSize: isNav ? 13 : undefined }]}>
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
    paddingHorizontal: spacing.base,
    paddingVertical: 8,
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
