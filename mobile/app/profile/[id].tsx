import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { palette, spacing, type } from '@/theme';
import { Screen, AppHeader, Avatar, Divider, Button } from '@/components/ui';
import { ListingCard } from '@/components/ListingCard';
import { mockListings, mockUser } from '@/data/mock';

export default function PublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listings = mockListings.filter((l) => l.seller.id === id);
  const user = listings[0]?.seller ?? mockUser;

  return (
    <Screen padded={false}>
      <AppHeader back title={user.name} />
      <FlatList
        data={listings}
        keyExtractor={(l) => l.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.base }}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.base }} />}
        ListHeaderComponent={
          <>
            <View style={styles.idCard}>
              <Avatar name={user.name} uri={user.avatarUrl} size={80} />
              <Text style={[type.displayMd, { color: palette.foreground, marginTop: spacing.base }]}>
                {user.name}
              </Text>
              <Text style={[type.bodySm, { color: palette.muted, marginTop: 4 }]}>
                {user.major ? `${user.major} · ` : ''}{user.classYear ?? 'Student'}
              </Text>
              {user.bio ? (
                <Text style={[type.body, { color: palette.body, marginTop: spacing.sm, textAlign: 'center' }]}>
                  {user.bio}
                </Text>
              ) : null}
              <View style={{ marginTop: spacing.lg }}>
                <Button label="Message" variant="secondary" />
              </View>
            </View>
            <Divider />
            <Text style={[type.captionUpper, styles.sectionLabel]}>
              {listings.length} ACTIVE LISTING{listings.length === 1 ? '' : 'S'}
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <ListingCard listing={item} />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.base, paddingBottom: spacing.xxl },
  idCard: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    color: palette.muted,
    marginTop: spacing.lg,
    marginBottom: spacing.base,
  },
});
