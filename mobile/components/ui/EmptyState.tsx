import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette, spacing, type } from '@/theme';
import { Button } from './Button';

interface Props {
  eyebrow?: string;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ eyebrow, title, body, actionLabel, onAction, icon }: Props) {
  return (
    <View style={styles.wrap}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      {eyebrow ? <Text style={[type.captionUpper, styles.eyebrow]}>{eyebrow}</Text> : null}
      <Text style={[type.displaySm, styles.title]}>{title}</Text>
      {body ? <Text style={[type.body, styles.body]}>{body}</Text> : null}
      {actionLabel ? (
        <View style={{ marginTop: spacing.lg }}>
          <Button label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  icon: { marginBottom: spacing.lg },
  eyebrow: { color: palette.accent, marginBottom: spacing.xs },
  title: { color: palette.foreground, textAlign: 'center' },
  body: { color: palette.body, textAlign: 'center', marginTop: spacing.xs },
});
