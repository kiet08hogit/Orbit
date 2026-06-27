import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { palette, spacing, type, hitSlop } from '@/theme';

interface Props {
  title?: string;
  eyebrow?: string;
  back?: boolean;
  onBack?: () => void;
  trailing?: React.ReactNode;
  borderless?: boolean;
}

export function AppHeader({ title, eyebrow, back, onBack, trailing, borderless }: Props) {
  const router = useRouter();
  return (
    <View style={[styles.bar, !borderless && styles.barBorder]}>
      <View style={styles.left}>
        {back ? (
          <Pressable
            hitSlop={hitSlop}
            onPress={() => (onBack ? onBack() : router.back())}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]}
          >
            <ChevronLeft color={palette.foreground} size={22} strokeWidth={1.5} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.center}>
        {eyebrow ? <Text style={[type.captionUpper, styles.eyebrow]}>{eyebrow}</Text> : null}
        {title ? (
          <Text numberOfLines={1} style={[type.titleMd, { color: palette.foreground }]}>
            {title}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    backgroundColor: palette.background,
  },
  barBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.hairline,
  },
  left: { width: 44, alignItems: 'flex-start' },
  center: { flex: 1, alignItems: 'center' },
  right: { width: 44, alignItems: 'flex-end' },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  eyebrow: { color: palette.muted, marginBottom: 2 },
});
