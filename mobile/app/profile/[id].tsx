import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { BadgeCheck, Star } from 'lucide-react-native';
import { palette, spacing, type } from '@/theme';
import { Screen, AppHeader, Avatar, Divider, Button } from '@/components/ui';
import { ListingCard } from '@/components/ListingCard';
import { usersApi, reviewsApi, chatApi, getImageUrl } from '@/lib/api';
import type { ReviewsResponse, User } from '@/lib/types';

export default function PublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [profile, setProfile] = useState<User | null>(null);
  const [reviews, setReviews] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      usersApi
        .get(id)
        .then((u) => {
          setProfile(u);
          setFollowing(!!u.isFollowing);
          if (u.id) reviewsApi.forUser(u.id).then(setReviews).catch(() => {});
        })
        .catch(() => setProfile(null))
        .finally(() => setLoading(false));
    }, [id]),
  );

  if (loading) {
    return (
      <Screen padded={false}>
        <AppHeader back />
        <View style={styles.loading}>
          <ActivityIndicator color={palette.foreground} />
        </View>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen padded={false}>
        <AppHeader back />
        <View style={styles.loading}>
          <Text style={[type.body, { color: palette.body }]}>Profile not found.</Text>
        </View>
      </Screen>
    );
  }

  const isMe = profile.clerkUserId === clerkUser?.id;
  const listings = profile.listings ?? [];
  const displayName = profile.name ?? profile.username ?? 'Student';

  const toggleFollow = async () => {
    setBusy(true);
    try {
      const res = await usersApi.toggleFollow(profile.clerkUserId);
      setFollowing(res.following);
    } catch (e) {
      Alert.alert('Could not update follow', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  const message = async () => {
    setBusy(true);
    try {
      const conversation = await chatApi.startConversation(profile.clerkUserId);
      router.push(`/chat/${conversation.id}` as any);
    } catch (e) {
      Alert.alert('Could not start chat', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen padded={false}>
      <AppHeader back title={displayName} />
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
              <Avatar
                name={displayName}
                uri={getImageUrl(profile.avatarUrl) || undefined}
                size={80}
              />
              <View style={styles.nameRow}>
                <Text style={[type.displayMd, { color: palette.foreground }]}>{displayName}</Text>
                {profile.isEduVerified ? (
                  <BadgeCheck color={palette.accent} size={20} strokeWidth={1.8} />
                ) : null}
              </View>
              <Text style={[type.bodySm, { color: palette.muted, marginTop: 4 }]}>
                {[profile.major, profile.classYear, profile.university].filter(Boolean).join(' · ') ||
                  'Student'}
              </Text>
              {profile.bio ? (
                <Text style={[type.body, { color: palette.body, marginTop: spacing.sm, textAlign: 'center' }]}>
                  {profile.bio}
                </Text>
              ) : null}

              <View style={styles.statsRow}>
                <Stat label="FOLLOWERS" value={String(profile._count?.followers ?? 0)} />
                <Stat label="FOLLOWING" value={String(profile._count?.following ?? 0)} />
                <View style={styles.statCell}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Star color={palette.warning} size={16} strokeWidth={1.8} fill={palette.warning} />
                    <Text style={[type.displaySm, { color: palette.foreground }]}>
                      {reviews && reviews.totalCount > 0 ? reviews.averageRating.toFixed(1) : '—'}
                    </Text>
                  </View>
                  <Text style={[type.captionUpper, { color: palette.muted, marginTop: 2 }]}>
                    {reviews?.totalCount ?? 0} REVIEWS
                  </Text>
                </View>
              </View>

              {!isMe ? (
                <View style={styles.actions}>
                  <Button
                    label={following ? 'Following' : 'Follow'}
                    variant={following ? 'secondary' : 'primary'}
                    loading={busy}
                    onPress={toggleFollow}
                  />
                  <Button label="Message" variant="secondary" onPress={message} />
                </View>
              ) : null}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={[type.displaySm, { color: palette.foreground }]}>{value}</Text>
      <Text style={[type.captionUpper, { color: palette.muted, marginTop: 2 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.base, paddingBottom: spacing.xxl },
  idCard: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.base,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: palette.hairline,
    alignSelf: 'stretch',
  },
  statCell: { flex: 1, alignItems: 'center' },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  sectionLabel: {
    color: palette.muted,
    marginTop: spacing.lg,
    marginBottom: spacing.base,
  },
});
