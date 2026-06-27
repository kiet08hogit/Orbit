import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, ExternalLink, LogOut, Settings, Wallet } from 'lucide-react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { palette, spacing, type } from '@/theme';
import { Screen, Avatar, Card, Button, Divider } from '@/components/ui';
import { mockUser, mockListings } from '@/data/mock';
import { ListingCard } from '@/components/ListingCard';
import { clerkPublishableKey } from '@/lib/auth';

const CLERK_ENABLED = !!clerkPublishableKey;

interface Identity {
  name: string;
  email: string;
  avatarUri?: string;
  signOut: () => Promise<void>;
}

function useClerkIdentity(): Identity {
  const { user } = useUser();
  const { signOut } = useAuth();
  return {
    name: user?.fullName ?? mockUser.name ?? 'You',
    email: user?.primaryEmailAddress?.emailAddress ?? '',
    avatarUri: user?.imageUrl ?? undefined,
    signOut: async () => {
      try { await signOut(); } catch {}
    },
  };
}

function useMockIdentity(): Identity {
  return {
    name: mockUser.name ?? 'You',
    email: 'demo@orbit.app',
    avatarUri: undefined,
    signOut: async () => {},
  };
}

const useIdentity = CLERK_ENABLED ? useClerkIdentity : useMockIdentity;

export default function ProfileTab() {
  const router = useRouter();
  const identity = useIdentity();
  const { name: displayName, email: displayEmail, avatarUri } = identity;
  const myListings = mockListings.slice(0, 3);

  return (
    <Screen scroll padded={false}>
      {/* Identity card */}
      <View style={styles.idWrap}>
        <View style={styles.idRow}>
          <Avatar name={displayName} uri={avatarUri} size={64} />
          <View style={{ flex: 1, marginLeft: spacing.base }}>
            <Text style={[type.captionUpper, { color: palette.muted }]}>YOUR ORBIT</Text>
            <Text style={[type.displayMd, { color: palette.foreground, marginTop: 2 }]}>
              {displayName}
            </Text>
            {displayEmail ? (
              <Text style={[type.mono, { color: palette.muted, marginTop: 2 }]}>
                {displayEmail}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat label="LISTED" value="12" />
          <Stat label="SOLD" value="7" />
          <Stat label="RATING" value="4.9" />
        </View>
      </View>

      {/* Stripe Connect card */}
      <View style={styles.section}>
        <Text style={[type.captionUpper, styles.sectionLabel]}>PAYMENTS</Text>
        <Card padded>
          <View style={styles.payRow}>
            <Wallet color={palette.accent} size={20} strokeWidth={1.6} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[type.bodyStrong, { color: palette.foreground }]}>
                Connect Stripe to accept protected payments
              </Text>
              <Text style={[type.bodySm, { color: palette.body, marginTop: 2 }]}>
                Buyers pay through Orbit; funds release once they confirm pickup.
              </Text>
            </View>
          </View>
          <Button
            label="Set up payouts"
            variant="secondary"
            onPress={() => router.push('/profile/payments' as any)}
            style={{ marginTop: spacing.base }}
            iconRight={<ExternalLink color={palette.foreground} size={14} strokeWidth={1.6} />}
          />
        </Card>
      </View>

      {/* My listings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[type.captionUpper, styles.sectionLabel]}>YOUR LISTINGS</Text>
          <Pressable onPress={() => router.push('/listings')} hitSlop={8}>
            <Text style={[type.button, { color: palette.body }]}>See all</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.base }}
        >
          {myListings.map((l) => (
            <View key={l.id} style={{ width: 180 }}>
              <ListingCard listing={l} />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Settings rows */}
      <View style={styles.section}>
        <Text style={[type.captionUpper, styles.sectionLabel]}>SETTINGS</Text>
        <Card padded={false}>
          <Row icon={<Settings color={palette.body} size={18} strokeWidth={1.6} />} label="Preferences" onPress={() => {}} />
          <Divider strength="soft" />
          <Row icon={<Wallet color={palette.body} size={18} strokeWidth={1.6} />} label="Payment methods" onPress={() => {}} />
          <Divider strength="soft" />
          <Row
            icon={<LogOut color={palette.error} size={18} strokeWidth={1.6} />}
            label="Sign out"
            destructive
            onPress={async () => {
              await identity.signOut();
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
    marginBottom: spacing.sm,
    marginRight: -spacing.base,
    paddingRight: spacing.base,
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
