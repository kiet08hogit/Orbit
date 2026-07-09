import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { palette, spacing, type } from '@/theme';
import { Screen, AppHeader, EmptyState } from '@/components/ui';
import { TransactionRow } from '@/components/TransactionRow';
import { transactionsApi } from '@/lib/api';
import type { Transaction } from '@/lib/types';

type TabKey = 'buying' | 'selling';

export default function PurchaseHistoryScreen() {
  const [tab, setTab] = useState<TabKey>('buying');
  const [data, setData] = useState<{ buying: Transaction[]; selling: Transaction[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      transactionsApi
        .history()
        .then(setData)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []),
  );

  const items = tab === 'buying' ? data?.buying ?? [] : data?.selling ?? [];

  return (
    <Screen padded={false}>
      <AppHeader back title="Purchase history" />
      <View style={styles.tabs}>
        {(['buying', 'selling'] as TabKey[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[type.button, { color: tab === t ? palette.background : palette.body }]}>
              {t === 'buying' ? 'Buying' : 'Selling'}
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
          eyebrow="NO HISTORY"
          title={tab === 'buying' ? 'Nothing bought yet' : 'Nothing sold yet'}
          body="Completed and past transactions live here."
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
                tab === 'buying'
                  ? `Seller: ${item.seller?.name ?? item.seller?.username ?? '—'}`
                  : `Buyer: ${item.buyer?.name ?? item.buyer?.username ?? '—'}`
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
