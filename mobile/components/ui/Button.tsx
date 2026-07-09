import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { palette, radius, spacing, type } from '@/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
type Size = 'md' | 'lg';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  haptic?: boolean;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  fullWidth,
  icon,
  iconRight,
  style,
  haptic = true,
  testID,
}: Props) {
  const handle = useCallback(() => {
    if (disabled || loading) return;
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  }, [disabled, loading, onPress, haptic]);

  const v = variants[variant];
  const sz = sizes[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={handle}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        v.container,
        sz.container,
        fullWidth && styles.full,
        isDisabled && styles.disabled,
        pressed && !isDisabled && { transform: [{ scale: 0.97 }], opacity: 0.92 },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={v.text.color as string} size="small" />
        ) : (
          <>
            {icon ? <View style={styles.iconLeft}>{icon}</View> : null}
            <Text style={[type.button, v.text, sz.text]}>{label}</Text>
            {iconRight ? <View style={styles.iconRight}>{iconRight}</View> : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

const variants = {
  primary: {
    container: { backgroundColor: palette.primary },
    text: { color: palette.primaryForeground },
  },
  secondary: {
    container: { backgroundColor: palette.secondary },
    text: { color: palette.secondaryForeground },
  },
  outline: {
    container: {
      backgroundColor: palette.background,
      borderWidth: 1,
      borderColor: palette.border,
    },
    text: { color: palette.foreground },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: palette.foreground },
  },
  link: {
    container: { backgroundColor: 'transparent' },
    text: { color: palette.primary, textDecorationLine: 'underline' as const },
  },
  destructive: {
    container: { backgroundColor: palette.destructive },
    text: { color: palette.destructiveForeground },
  },
} as const satisfies Record<Variant, { container: ViewStyle; text: { color: string; textDecorationLine?: 'underline' } }>;

const sizes = {
  md: {
    container: { height: 44, paddingHorizontal: spacing.md },
    text: { fontSize: 14 },
  },
  lg: {
    container: { height: 52, paddingHorizontal: spacing.lg },
    text: { fontSize: 16 },
  },
} as const;

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  iconLeft: { marginRight: spacing.xs },
  iconRight: { marginLeft: spacing.xs },
  full: { width: '100%' },
  disabled: { opacity: 0.5 },
});
