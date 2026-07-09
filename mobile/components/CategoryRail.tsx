import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { categoryLabels, palette, spacing } from '@/theme';
import { Pill } from './ui/Pill';
import type { ListingCategory } from '@/lib/types';

/** Mirrors frontend/app/ClientNav.tsx order and labels. */
const NAV_ITEMS: Array<{
  key: ListingCategory | 'HOME' | 'SWIPE';
  label: string;
  category?: ListingCategory;
}> = [
  { key: 'DORM', label: categoryLabels.DORM, category: 'DORM' },
  { key: 'SUBLEASE', label: categoryLabels.SUBLEASE, category: 'SUBLEASE' },
  { key: 'CLOTHES', label: categoryLabels.CLOTHES, category: 'CLOTHES' },
  { key: 'SCHOOL', label: categoryLabels.SCHOOL, category: 'SCHOOL' },
  { key: 'LEISURE', label: categoryLabels.LEISURE, category: 'LEISURE' },
  { key: 'ACCESSORIES', label: categoryLabels.ACCESSORIES, category: 'ACCESSORIES' },
  { key: 'OTHER', label: categoryLabels.OTHER, category: 'OTHER' },
  { key: 'SERVICES', label: categoryLabels.SERVICES, category: 'SERVICES' },
  { key: 'HOME', label: 'Home' },
  { key: 'SWIPE', label: 'Match your needs' },
];

export type CategoryRailValue = ListingCategory | 'HOME' | 'SWIPE';

interface Props {
  value?: CategoryRailValue;
}

export function CategoryRail({ value }: Props) {
  const router = useRouter();

  const onPress = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.key === 'HOME') {
      router.push('/(tabs)/home');
      return;
    }
    if (item.key === 'SWIPE') {
      router.push('/(tabs)/swipe');
      return;
    }
    router.push({ pathname: '/listings', params: { category: item.category } } as any);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.bar}
    >
      {NAV_ITEMS.map((item, i) => (
        <React.Fragment key={item.key}>
          {i === NAV_ITEMS.length - 2 ? <View style={styles.divider} /> : null}
          <Pill
            label={item.label}
            tone="nav"
            selected={value != null && value === item.key}
            onPress={() => onPress(item)}
          />
        </React.Fragment>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: palette.border,
    marginHorizontal: spacing.xs,
  },
});
