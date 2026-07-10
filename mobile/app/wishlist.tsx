import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { palette, spacing } from '@/theme';
import { Screen, AppHeader, EmptyState } from '@/components/ui';
import { ListingCard } from '@/components/ListingCard';
import { listingsApi } from '@/lib/api';
import type { Listing } from '@/lib/types';

export default function WishlistScreen() {
  const [data, setData] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      listingsApi
        .wishlist()
        .then(setData)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []),
  );

  return (
    <Screen padded={false}>
      <AppHeader back title="Wishlist" eyebrow="SAVED FOR LATER" />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.foreground} />
        </View>
      ) : data.length === 0 ? (
        <EmptyState
          eyebrow="NOTHING YET"
          title="Save things to revisit"
          body="Tap the heart on any listing to keep an eye on it — it lands here."
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => <ListingCard listing={item} variant="wide" />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
  },
});
