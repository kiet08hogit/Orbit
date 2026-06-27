import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { palette, spacing, type } from '@/theme';
import { Screen, EmptyState } from '@/components/ui';
import { ListingCard } from '@/components/ListingCard';
import { useListings } from '@/hooks/useListings';

export default function WishlistTab() {
  const { data } = useListings();
  // Saved is simulated client-side for now — picks every other listing.
  const saved = data.filter((_, i) => i % 2 === 0);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={[type.captionUpper, { color: palette.muted }]}>SAVED FOR LATER</Text>
        <Text style={[type.displayLg, { color: palette.foreground }]}>Wishlist</Text>
      </View>

      {saved.length === 0 ? (
        <EmptyState
          eyebrow="NOTHING YET"
          title="Save things to revisit"
          body="Tap the heart on any listing to keep an eye on it — it lands here."
        />
      ) : (
        <FlatList
          data={saved}
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
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.hairline,
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
  },
});
