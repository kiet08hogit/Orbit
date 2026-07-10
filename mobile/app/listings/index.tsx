import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, ListFilter, Search, X } from 'lucide-react-native';
import { palette, spacing, type, categoryLabels, radius } from '@/theme';
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

const getCategoryHeroInfo = (category: string | undefined) => {
  switch (category) {
    case 'DORM':
      return {
        image: require('@/assets/images/landing/dorm.jpg'),
        title: 'Dorm Essentials',
        description: 'Move in and settle with all the essentials.',
      };
    case 'SUBLEASE':
      return {
        image: require('@/assets/images/landing/sublease.jpg'),
        title: 'Subleases',
        description: 'Find a spot or sublet yours.',
      };
    case 'CLOTHES':
      return {
        image: require('@/assets/images/landing/clothing.jpg'),
        title: 'Clothing & Apparel',
        description: 'Refresh your wardrobe with great finds on campus.',
      };
    case 'SCHOOL':
      return {
        image: require('@/assets/images/landing/school-supplies.jpg'),
        title: 'School Supplies',
        description: 'Everything you need for your classes, for less.',
      };
    case 'LEISURE':
      return {
        image: require('@/assets/images/landing/rave.jpg'),
        title: 'Leisure & Hobbies',
        description: 'Find gear and tickets for your weekend adventures.',
      };
    case 'ACCESSORIES':
      return {
        image: require('@/assets/images/landing/accessories.jpg'),
        title: 'Accessories',
        description: 'Complete your look with the perfect accessories.',
      };
    case 'SERVICES':
      return {
        image: require('@/assets/images/landing/services.png'),
        title: 'Campus Services',
        description: 'Find tutoring, moving help, and more.',
      };
    default:
      return {
        image: require('@/assets/images/landing/goods.jpg'),
        title: 'Trying to pass down your items?',
        description: 'Sell your items quickly and safely to other students on campus.',
      };
  }
};

export default function BrowseListings() {
  const params = useLocalSearchParams<{ category?: string; q?: string }>();
  const category = parseCategory(params.category);
  const [query, setQuery] = useState(params.q ?? '');
  const [submittedQuery, setSubmittedQuery] = useState(params.q ?? '');
  const [data, setData] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const router = useRouter();

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
  const heroInfo = getCategoryHeroInfo(category);

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
            trailingIcon={
              <Pressable onPress={() => setShowFilters(true)} hitSlop={8} style={{ padding: 4, backgroundColor: palette.surfaceElevated, borderRadius: 8 }}>
                <ListFilter color={palette.foreground} size={16} strokeWidth={2} />
              </Pressable>
            }
            leadingIcon={<Search color={palette.mutedForeground} size={16} strokeWidth={1.6} />}
          />
        </View>
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
            <View>
              {/* Dynamic Hero Banner */}
              {!submittedQuery && (
                <View style={styles.heroBanner}>
                  <View style={styles.heroLeft}>
                    <Text style={styles.heroHeadline}>{heroInfo.title}</Text>
                    <Text style={styles.heroBody}>{heroInfo.description}</Text>
                    <Pressable
                      onPress={() => router.push('/add-product')}
                      style={({ pressed }) => [styles.sellBtn, pressed && { opacity: 0.9 }]}
                    >
                      <Text style={styles.sellBtnLabel}>Sell now</Text>
                    </Pressable>
                  </View>
                  <Image source={heroInfo.image} style={styles.heroImage} resizeMode="cover" />
                </View>
              )}
              <Text style={[type.captionUpper, styles.resultLabel]}>
                {headline.toUpperCase()} · {data.length} RESULT{data.length === 1 ? '' : 'S'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <ListingCard listing={item} />
            </View>
          )}
        />
      )}
      <View style={styles.bottomBarContainer}>
        <CategoryRail value={category} />
      </View>

      {/* Filter Modal */}
      {showFilters && (
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <Text style={[type.titleMd, { color: palette.foreground }]}>Filters</Text>
              <Pressable onPress={() => setShowFilters(false)} hitSlop={8}>
                <X color={palette.foreground} size={24} strokeWidth={1.5} />
              </Pressable>
            </View>
            <Text style={[type.captionUpper, { color: palette.muted, marginTop: spacing.base, marginBottom: spacing.sm }]}>
              CATEGORIES
            </Text>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={styles.filterRow}
                onPress={() => {
                  setShowFilters(false);
                  router.setParams({ category: cat });
                }}
              >
                <Text style={[type.body, { color: category === cat ? palette.foreground : palette.mutedForeground }]}>
                  {categoryLabels[cat] || cat}
                </Text>
                {category === cat && <ChevronRight color={palette.foreground} size={16} />}
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    paddingBottom: spacing.sm,
  },
  searchWrap: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  resultLabel: {
    color: palette.mutedForeground,
    marginBottom: spacing.sm,
  },
  heroBanner: {
    marginBottom: spacing.lg,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  heroLeft: {
    padding: spacing.lg,
  },
  heroHeadline: {
    ...type.titleMd,
    fontSize: 22,
    lineHeight: 28,
    fontFamily: type.titleMd.fontFamily,
    color: palette.foreground,
    marginBottom: spacing.sm,
  },
  heroBody: {
    ...type.body,
    color: palette.mutedForeground,
    marginBottom: spacing.lg,
    maxWidth: 320,
  },
  sellBtn: {
    alignSelf: 'flex-start',
    backgroundColor: palette.foreground,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  sellBtnLabel: {
    ...type.button,
    color: palette.background,
    fontFamily: type.titleMd.fontFamily,
  },
  heroImage: {
    width: '100%',
    height: 180,
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
    gap: spacing.base,
  },
  column: { gap: spacing.base },
  cell: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  filterModal: {
    backgroundColor: palette.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.xxl,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.hairlineSoft,
  },
});
