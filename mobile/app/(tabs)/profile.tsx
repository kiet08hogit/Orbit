import React, { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Bell,
  Check,
  ChevronRight,
  Clock,
  Heart,
  LogOut,
  Settings,
  Shield,
  Tag,
  Wallet,
} from 'lucide-react-native';
import { useAuth } from '@clerk/clerk-expo';
import { palette, spacing, type } from '@/theme';
import { Screen, Avatar, Card, Button, Divider } from '@/components/ui';
import { ListingCard } from '@/components/ListingCard';
import { listingsApi, paymentsApi, reviewsApi, usersApi, getImageUrl } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';
import type { Listing, ReviewsResponse, User } from '@/lib/types';

export default function ProfileTab() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [me, setMe] = useState<User | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<ReviewsResponse | null>(null);
  const [stripeLinked, setStripeLinked] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      usersApi
        .me()
        .then((user) => {
          setMe(user);
          if (user.id) {
            reviewsApi.forUser(user.id).then(setReviews).catch(() => {});
          }
        })
        .catch(() => {});
      listingsApi.myListings().then(setMyListings).catch(() => {});
      paymentsApi
        .connectStatus()
        .then((s) => setStripeLinked(s.linked))
        .catch(() => {});
    }, []),
  );

  const startStripeConnect = async () => {
    setConnecting(true);
    try {
      const { url } = await paymentsApi.startConnect();
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Could not open Stripe', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setConnecting(false);
    }
  };

  const soldCount = myListings.filter((l) => l.status === 'SOLD').length;
  const displayName = me?.name ?? me?.username ?? 'You';

  return (
    <Screen scroll padded={false}>
      {/* Identity card */}
      <View style={styles.idWrap}>
        <View style={styles.idRow}>
          <Avatar name={displayName} uri={getImageUrl(me?.avatarUrl) || undefined} size={64} />
          <View style={{ flex: 1, marginLeft: spacing.base }}>
            <Text style={[type.captionUpper, { color: palette.muted }]}>YOUR ORBIT</Text>
            <Text style={[type.displayMd, { color: palette.foreground, marginTop: 2 }]}>
              {displayName}
            </Text>
            <Text style={[type.mono, { color: palette.muted, marginTop: 2 }]}>
              {me?.username ? `@${me.username}` : me?.email ?? ''}
            </Text>
          </View>
          {me?.clerkUserId ? (
            <Pressable
              onPress={() => router.push(`/profile/${me.clerkUserId}` as any)}
              hitSlop={8}
            >
              <Text style={[type.button, { color: palette.accent }]}>View public</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <Stat label="LISTED" value={String(myListings.length)} />
          <Stat label="SOLD" value={String(soldCount)} />
          <Stat
            label="RATING"
            value={reviews && reviews.totalCount > 0 ? reviews.averageRating.toFixed(1) : '—'}
          />
        </View>
      </View>

      {/* Stripe Connect card */}
      <View style={styles.section}>
        <Text style={[type.captionUpper, styles.sectionLabel]}>PAYMENTS</Text>
        <Card padded>
          <View style={styles.payRow}>
            {stripeLinked ? (
              <Check color={palette.success} size={20} strokeWidth={1.8} />
            ) : (
              <Wallet color={palette.accent} size={20} strokeWidth={1.6} />
            )}
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[type.bodyStrong, { color: palette.foreground }]}>
                {stripeLinked
                  ? 'Stripe connected — protected payments enabled'
                  : 'Connect Stripe to accept protected payments'}
              </Text>
              <Text style={[type.bodySm, { color: palette.body, marginTop: 2 }]}>
                Buyers pay through Orbit; funds release once they confirm pickup.
              </Text>
            </View>
          </View>
          {!stripeLinked ? (
            <Button
              label={connecting ? 'Opening Stripe…' : 'Set up payouts'}
              variant="secondary"
              loading={connecting}
              onPress={startStripeConnect}
              style={{ marginTop: spacing.base }}
            />
          ) : null}
        </Card>
      </View>

      {/* My listings */}
      {myListings.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[type.captionUpper, styles.sectionLabel]}>YOUR LISTINGS</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {myListings.map((l) => (
              <View key={l.id} style={{ width: 180 }}>
                <ListingCard listing={l} />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Activity */}
      <View style={styles.section}>
        <Text style={[type.captionUpper, styles.sectionLabel]}>ACTIVITY</Text>
        <Card padded={false}>
          <Row
            icon={<Heart color={palette.body} size={18} strokeWidth={1.6} />}
            label="Wishlist"
            onPress={() => router.push('/wishlist' as any)}
          />
          <Divider strength="soft" />
          <Row
            icon={<Tag color={palette.body} size={18} strokeWidth={1.6} />}
            label="Offers"
            onPress={() => router.push('/offers' as any)}
          />
          <Divider strength="soft" />
          <Row
            icon={<Clock color={palette.body} size={18} strokeWidth={1.6} />}
            label="Purchase history"
            onPress={() => router.push('/purchase-history' as any)}
          />
          <Divider strength="soft" />
          <Row
            icon={<Bell color={palette.body} size={18} strokeWidth={1.6} />}
            label="Notifications"
            onPress={() => router.push('/notifications' as any)}
          />
        </Card>
      </View>

      {/* Settings rows */}
      <View style={styles.section}>
        <Text style={[type.captionUpper, styles.sectionLabel]}>SETTINGS</Text>
        <Card padded={false}>
          <Row
            icon={<Settings color={palette.body} size={18} strokeWidth={1.6} />}
            label="Preferences"
            onPress={() => router.push('/settings' as any)}
          />
          {me?.role === 'ADMIN' ? (
            <>
              <Divider strength="soft" />
              <Row
                icon={<Shield color={palette.body} size={18} strokeWidth={1.6} />}
                label="Admin dashboard"
                onPress={() => router.push('/admin' as any)}
              />
            </>
          ) : null}
          <Divider strength="soft" />
          <Row
            icon={<LogOut color={palette.error} size={18} strokeWidth={1.6} />}
            label="Sign out"
            destructive
            onPress={async () => {
              try {
                disconnectSocket();
                await signOut();
              } catch {}
              router.replace('/');
            }}
          />
        </Card>
      </View>
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

function Row({
  icon,
  label,
  destructive,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, pressed && { backgroundColor: palette.surfaceElevated }]}
    >
      {icon}
      <Text
        style={[
          type.body,
          { color: destructive ? palette.error : palette.foreground, flex: 1, marginLeft: spacing.sm },
        ]}
      >
        {label}
      </Text>
      <ChevronRight color={palette.muted} size={16} strokeWidth={1.6} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  idWrap: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  idRow: { flexDirection: 'row', alignItems: 'center' },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: palette.hairline,
  },
  statCell: { flex: 1 },
  section: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionLabel: { color: palette.muted, marginBottom: spacing.sm },
  payRow: { flexDirection: 'row', alignItems: 'flex-start' },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
});
