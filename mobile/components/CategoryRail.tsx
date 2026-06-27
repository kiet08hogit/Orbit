import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { categoryColors, spacing } from '@/theme';
import { Pill } from './ui/Pill';
import type { ListingCategory } from '@/lib/types';

const CATEGORIES: { key: ListingCategory | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'ALL' },
  { key: 'HOUSING', label: 'HOUSING' },
  { key: 'CLOTHES', label: 'CLOTHES' },
  { key: 'SCHOOL', label: 'SCHOOL' },
  { key: 'LEISURE', label: 'LEISURE' },
  { key: 'ACCESSORIES', label: 'ACCESSORIES' },
  { key: 'OTHER', label: 'OTHER' },
];

interface Props {
  value: ListingCategory | 'ALL';
  onChange: (v: ListingCategory | 'ALL') => void;
}

export function CategoryRail({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {CATEGORIES.map((c) => (
        <Pill
          key={c.key}
          label={c.label}
          selected={value === c.key}
          tone={c.key === 'ALL' ? 'neutral' : 'category'}
          color={c.key === 'ALL' ? undefined : categoryColors[c.key as ListingCategory]}
          onPress={() => onChange(c.key)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
});
