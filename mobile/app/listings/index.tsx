import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Search } from 'lucide-react-native';
import { palette, spacing, type, categoryLabels } from '@/theme';
import { Screen, Input, EmptyState, AppHeader } from '@/components/ui';
import { ListingCard } from '@/components/ListingCard';
import { CategoryRail } from '@/components/CategoryRail';
import { listingsApi } from '@/lib/api';
import type { Listing, ListingCategory } from '@/lib/types';

const CATEGORIES: ListingCategory[] = [
  'DORM',
  'SUBLEASE',
  'CLOTHES',
  'SCHOOL',
  'LEISURE',
  'ACCESSORIES',
  'OTHER',
  'SERVICES',
];

function parseCategory(raw?: string): ListingCategory | undefined {
  if (!raw) return undefined;
  return CATEGORIES.includes(raw as ListingCategory) ? (raw as ListingCategory) : undefined;
}

export default function BrowseListings() {
  const params = useLocalSearchParams<{ category?: string; q?: string }>();
  const category = parseCategory(params.category);
  const [query, setQuery] = useState(params.q ?? '');
  const [submittedQuery, setSubmittedQuery] = useState(params.q ?? '');
  const [data, setData] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuery(params.q ?? '');
    setSubmittedQuery(params.q ?? '');
  }, [params.q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = submittedQuery.trim()
        ? await listingsApi.recommendations(submittedQuery.trim(), category)
        : await listingsApi.all({ category });
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach Orbit');
    } finally {
      setLoading(false);
    }
  }, [category, submittedQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const headline = category ? categoryLabels[category] ?? category : 'All listings';

  return (
    <Screen padded={false}>
      <AppHeader back title="Browse" />
      <View style={styles.headerWrap}>
        <View style={styles.searchWrap}>
          <Input
            variant="pill"
            placeholder="Search products…"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => setSubmittedQuery(query)}
            leadingIcon={<Search color={palette.mutedForeground} size={16} strokeWidth={1.6} />}
          />
        </View>
        <CategoryRail value={category} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={palette.foreground} />
        </View>
      ) : data.length === 0 ? (
        <EmptyState
          eyebrow="QUIET ORBIT"
          title="Nothing matches yet"
          body={
            error
              ? `Couldn't reach Orbit (${error}). Pull to retry.`
              : 'Try a different category or search — new listings post every hour.'
          }
          actionLabel="Clear filters"
          onAction={() => {
            setQuery('');
            setSubmittedQuery('');
          }}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={[type.captionUpper, styles.resultLabel]}>
              {headline.toUpperCase()} · {data.length} RESULT{data.length === 1 ? '' : 'S'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <ListingCard listing={item} />
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  searchWrap: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  resultLabel: {
    color: palette.mutedForeground,
    marginBottom: spacing.sm,
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
    gap: spacing.base,
  },
  column: { gap: spacing.base },
  cell: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
