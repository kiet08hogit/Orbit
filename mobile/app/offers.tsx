import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { palette, spacing, type } from '@/theme';
import { Screen, AppHeader, EmptyState } from '@/components/ui';
import { TransactionRow } from '@/components/TransactionRow';
import { transactionsApi } from '@/lib/api';
import type { Transaction } from '@/lib/types';

type TabKey = 'sent' | 'received' | 'meetups';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'sent', label: 'Sent' },
  { key: 'received', label: 'Received' },
  { key: 'meetups', label: 'Meetups' },
];

export default function OffersScreen() {
  const [tab, setTab] = useState<TabKey>('sent');
  const [data, setData] = useState<{
    my_offers: Transaction[];
    received_offers: Transaction[];
    meetups: Transaction[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      transactionsApi
        .offers()
        .then(setData)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []),
  );

  const items =
    tab === 'sent'
      ? data?.my_offers ?? []
      : tab === 'received'
        ? data?.received_offers ?? []
        : data?.meetups ?? [];

  return (
    <Screen padded={false}>
      <AppHeader back title="Offers" />
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}
          >
            <Text
              style={[
                type.button,
                { color: tab === t.key ? palette.background : palette.body },
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.foreground} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          eyebrow="NOTHING ACTIVE"
          title={tab === 'meetups' ? 'No meetups yet' : 'No offers here'}
          body="Reservations and meetup plans show up here as soon as they start."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <TransactionRow
              transaction={item}
              counterpartyLabel={
                tab === 'received'
                  ? `From ${item.buyer?.name ?? item.buyer?.username ?? 'a buyer'}`
                  : `Seller: ${item.seller?.name ?? item.seller?.username ?? '—'}`
              }
            />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.hairline,
  },
  tab: {
    paddingHorizontal: spacing.base,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.hairlineStrong,
  },
  tabActive: {
    backgroundColor: palette.foreground,
    borderColor: palette.foreground,
  },
  list: { padding: spacing.base, paddingBottom: spacing.xxl },
});
