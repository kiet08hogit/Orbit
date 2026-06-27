import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { palette, spacing, type } from '@/theme';
import { Screen, Input, EmptyState } from '@/components/ui';
import { ListingCard } from '@/components/ListingCard';
import { CategoryRail } from '@/components/CategoryRail';
import { useListings } from '@/hooks/useListings';
import type { ListingCategory } from '@/lib/types';

export default function ListingsTab() {
  const router = useRouter();
  const { data, loading, error } = useListings();
  const [category, setCategory] = useState<ListingCategory | 'ALL'>('ALL');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return data.filter((l) => {
      if (category !== 'ALL' && l.category !== category) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
      );
    });
  }, [data, category, query]);

  return (
    <Screen padded={false}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[type.captionUpper, { color: palette.muted }]}>ORBIT MARKETPLACE</Text>
            <Text style={[type.displayLg, { color: palette.foreground, marginTop: 4 }]}>
              Find it on campus
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/add-product')}
            accessibilityLabel="Add a new listing"
            accessibilityRole="button"
            style={({ pressed }) => [styles.addBtn, pressed && { transform: [{ scale: 0.95 }] }]}
          >
            <Plus color={palette.background} size={20} strokeWidth={2.2} />
          </Pressable>
        </View>
        <View style={styles.searchWrap}>
          <Input
            variant="pill"
            placeholder="Search desks, books, kayaks…"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            leadingIcon={<Search color={palette.muted} size={16} strokeWidth={1.6} />}
          />
        </View>
        <CategoryRail value={category} onChange={setCategory} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={palette.foreground} />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          eyebrow="QUIET ORBIT"
          title="Nothing matches yet"
          body="Try a different category or come back tomorrow — new listings post every hour."
          actionLabel="Clear filters"
          onAction={() => {
            setCategory('ALL');
            setQuery('');
          }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <ListingCard listing={item} />
            </View>
          )}
          ListFooterComponent={
            error ? (
              <Text style={[type.caption, styles.errorNote]}>
                Showing demo listings — couldn’t reach Orbit ({error})
              </Text>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    paddingTop: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.hairline,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
    gap: spacing.base,
  },
  column: { gap: spacing.base },
  cell: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorNote: {
    color: palette.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
