import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
  background?: string;
}

export function Screen({
  children,
  scroll,
  padded = true,
  edges = ['top'],
  contentStyle,
  background = palette.background,
}: Props) {
  const inner = padded ? { paddingHorizontal: spacing.base } : null;

  if (scroll) {
    return (
      <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: background }]}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            inner,
            { paddingBottom: spacing.xxl },
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: background }]}>
      <View style={[styles.body, inner, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
