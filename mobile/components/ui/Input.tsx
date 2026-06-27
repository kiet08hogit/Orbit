import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { palette, radius, spacing, type } from '@/theme';

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'pill';
}

export function Input({
  label,
  hint,
  error,
  leadingIcon,
  trailingIcon,
  containerStyle,
  variant = 'default',
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const showHint = !error && !!hint;

  return (
    <View style={containerStyle}>
      {label ? <Text style={[type.captionUpper, styles.label]}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          variant === 'pill' && styles.fieldPill,
          focused && { borderColor: palette.accent },
          error ? { borderColor: palette.error } : null,
        ]}
      >
        {leadingIcon ? <View style={styles.iconLeft}>{leadingIcon}</View> : null}
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={palette.muted}
          style={[
            styles.input,
            type.body,
            { color: palette.foreground },
            rest.multiline && { paddingTop: spacing.sm, minHeight: 96 },
            rest.style,
          ]}
        />
        {trailingIcon ? <View style={styles.iconRight}>{trailingIcon}</View> : null}
      </View>
      {error ? (
        <Text style={[type.caption, { color: palette.error, marginTop: spacing.xs }]}>
          {error}
        </Text>
      ) : showHint ? (
        <Text style={[type.caption, { color: palette.muted, marginTop: spacing.xs }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: palette.muted,
    marginBottom: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.hairlineStrong,
    backgroundColor: palette.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    minHeight: 48,
  },
  fieldPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  iconLeft: { marginRight: spacing.xs },
  iconRight: { marginLeft: spacing.xs },
});
