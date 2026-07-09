import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, radius, spacing, type } from '@/theme';
import { AppHeader, Card, Divider } from '@/components/ui';
import { usersApi } from '@/lib/api';
import type { User } from '@/lib/types';

type PrefKey =
  | 'emailNotifications'
  | 'notifyMessages'
  | 'notifyComments'
  | 'notifyWishlists'
  | 'notifyMeetups'
  | 'notifyReminders'
  | 'profanityFilter';

const NOTIFICATION_PREFS: { key: PrefKey; title: string; body: string }[] = [
  {
    key: 'emailNotifications',
    title: 'Email notifications',
    body: 'Digest emails about activity you care about.',
  },
  { key: 'notifyMessages', title: 'Messages', body: 'New chat messages from buyers and sellers.' },
  { key: 'notifyComments', title: 'Comments', body: 'Replies on your community posts.' },
  { key: 'notifyWishlists', title: 'Wishlist', body: 'Price drops and updates on saved items.' },
  { key: 'notifyMeetups', title: 'Meetups', body: 'Meetup proposals and confirmations.' },
  { key: 'notifyReminders', title: 'Reminders', body: 'Nudges about pending offers and pickups.' },
];

export default function SettingsScreen() {
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<PrefKey | null>(null);

  useEffect(() => {
    usersApi
      .me()
      .then(setMe)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key: PrefKey, value: boolean) => {
    if (!me) return;
    setMe({ ...me, [key]: value });
    setSavingKey(key);
    try {
      await usersApi.updateMe({ [key]: value });
    } catch {
      setMe((prev) => (prev ? { ...prev, [key]: !value } : prev));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <AppHeader back title="Preferences" />
      {loading || !me ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.foreground} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[type.captionUpper, styles.sectionLabel]}>NOTIFICATIONS</Text>
          <Card padded={false}>
            {NOTIFICATION_PREFS.map((pref, i) => (
              <React.Fragment key={pref.key}>
                {i > 0 ? <Divider strength="soft" /> : null}
                <PrefRow
                  title={pref.title}
                  body={pref.body}
                  value={!!me[pref.key]}
                  saving={savingKey === pref.key}
                  onChange={(v) => toggle(pref.key, v)}
                />
              </React.Fragment>
            ))}
          </Card>

          <Text style={[type.captionUpper, styles.sectionLabel, { marginTop: spacing.lg }]}>
            SAFETY
          </Text>
          <Card padded={false}>
            <PrefRow
              title="Profanity filter"
              body="Hide listings and posts with strong language."
              value={!!me.profanityFilter}
              saving={savingKey === 'profanityFilter'}
              onChange={(v) => toggle('profanityFilter', v)}
            />
          </Card>

          <View style={styles.metaCard}>
            <Text style={[type.captionUpper, { color: palette.muted }]}>ACCOUNT</Text>
            <Text style={[type.body, { color: palette.body, marginTop: spacing.xs }]}>
              Signed in as {me.email}
              {me.isEduVerified ? ' · .edu verified' : ''}
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function PrefRow({
  title,
  body,
  value,
  saving,
  onChange,
}: {
  title: string;
  body: string;
  value: boolean;
  saving: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.prefRow}>
      <View style={{ flex: 1, marginRight: spacing.sm }}>
        <Text style={[type.bodyStrong, { color: palette.foreground }]}>{title}</Text>
        <Text style={[type.bodySm, { color: palette.body, marginTop: 2 }]}>{body}</Text>
      </View>
      {saving ? (
        <ActivityIndicator color={palette.muted} size="small" />
      ) : (
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ true: palette.accent, false: palette.hairlineStrong }}
          thumbColor={palette.foreground}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.base, paddingBottom: spacing.xxl },
  sectionLabel: { color: palette.muted, marginBottom: spacing.sm },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  metaCard: {
    marginTop: spacing.lg,
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.hairline,
  },
});
