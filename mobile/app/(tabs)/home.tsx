import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Eye, Flame } from 'lucide-react-native';
import { palette, radius, spacing, type } from '@/theme';
import { Screen } from '@/components/ui';
import { GlobalHeader } from '@/components/GlobalHeader';
import { CategoryRail } from '@/components/CategoryRail';
import { ListingCard } from '@/components/ListingCard';
import { listingsApi } from '@/lib/api';
import type { Listing } from '@/lib/types';

interface Sections {
  recommended: Listing[];
  hot: Listing[];
  viewed: Listing[];
  latest: Listing[];
}

export default function HomeTab() {
  const router = useRouter();
  const [sections, setSections] = useState<Sections | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [recommended, hot, viewed, latest] = await Promise.all([
      listingsApi.recommended().catch(() => [] as Listing[]),
      listingsApi.hot().catch(() => [] as Listing[]),
      listingsApi.viewed().catch(() => [] as Listing[]),
      listingsApi.all().catch(() => [] as Listing[]),
    ]);
    setSections({ recommended, hot, viewed, latest });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const newListings = [...(sections?.latest ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <Screen padded={false}>
      <GlobalHeader />
      <CategoryRail value="HOME" />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.foreground} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={palette.foreground}
            />
          }
        >
          {/* Hero banner — mirrors web /home */}
          <View style={styles.heroBanner}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroHeadline}>Trying to pass down your items?</Text>
              <Text style={styles.heroBody}>
                Sell your items quickly and safely to other students on campus.
              </Text>
              <Pressable
                onPress={() => router.push('/add-product')}
                style={({ pressed }) => [styles.sellBtn, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.sellBtnLabel}>Sell now</Text>
              </Pressable>
            </View>
            <Image
              source={require('@/assets/images/landing/goods.jpg')}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.main}>
            <ProductSection
              title={
                <Text style={styles.sectionTitle}>
                  For you <Text style={{ color: '#dc2626' }}>!</Text>
                </Text>
              }
              listings={
                (sections?.recommended?.length ?? 0) > 0
                  ? sections!.recommended
                  : sections?.latest ?? []
              }
              onViewMore={() => router.push('/listings' as any)}
            />
            <ProductSection
              title={
                <View style={styles.titleRow}>
                  <Text style={styles.sectionTitle}>Hot @ UIC </Text>
                  <Flame size={22} color="#f97316" fill="#f97316" strokeWidth={0} />
                </View>
              }
              listings={sections?.hot ?? []}
              onViewMore={() => router.push('/listings' as any)}
            />
            <ProductSection
              title={
                <View style={styles.titleRow}>
                  <Text style={styles.sectionTitle}>You&apos;ve viewed </Text>
                  <Eye size={22} color="#3b82f6" strokeWidth={1.8} />
                </View>
              }
              listings={sections?.viewed ?? []}
            />
            <ProductSection
              title={<Text style={styles.sectionTitle}>New Listings</Text>}
              listings={newListings}
              onViewMore={() => router.push('/listings' as any)}
            />
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

function ProductSection({
  title,
  listings,
  onViewMore,
}: {
  title: React.ReactNode;
  listings: Listing[];
  onViewMore?: () => void;
}) {
  if (listings.length === 0) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {typeof title === 'string' ? (
          <Text style={styles.sectionTitle}>{title}</Text>
        ) : (
          title
        )}
        {onViewMore ? (
          <Pressable onPress={onViewMore} hitSlop={8} style={styles.viewMore}>
            <Text style={styles.viewMoreText}>View More</Text>
            <ChevronRight size={16} color={palette.link} strokeWidth={1.8} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {listings.map((l) => (
          <View key={l.id} style={{ width: 160 }}>
            <ListingCard listing={l} />
          </View>
        ))}
      </ScrollView>
      {onViewMore ? (
        <Pressable onPress={onViewMore} style={styles.viewMoreMobile}>
          <Text style={styles.viewMoreMobileText}>View More</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroBanner: {
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    marginBottom: spacing.lg,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.heroBanner,
  },
  heroLeft: {
    padding: spacing.lg,
  },
  heroHeadline: {
    ...type.titleMd,
    fontSize: 24,
    lineHeight: 30,
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
  main: {
    paddingHorizontal: spacing.base,
    gap: spacing.section,
  },
  section: { marginBottom: spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  sectionTitle: {
    ...type.displaySm,
    color: palette.foreground,
    letterSpacing: -0.4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewMoreText: {
    ...type.body,
    color: palette.link,
  },
  rail: {
    gap: spacing.base,
    paddingBottom: spacing.sm,
  },
  viewMoreMobile: {
    marginTop: spacing.base,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
  },
  viewMoreMobileText: {
    ...type.body,
    color: palette.foreground,
  },
});
