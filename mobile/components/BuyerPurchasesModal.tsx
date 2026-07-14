import React, { useCallback, useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { X, AlertTriangle } from 'lucide-react-native';
import { palette, radius, spacing, type } from '@/theme';
import { transactionsApi, getImageUrl } from '@/lib/api';
import type { Transaction } from '@/lib/types';

interface BuyerPurchasesModalProps {
  visible: boolean;
  onClose: () => void;
  sellerId: string | undefined;
}

export function BuyerPurchasesModal({ visible, onClose, sellerId }: BuyerPurchasesModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCode, setActiveCode] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!visible || !sellerId) return;
    setLoading(true);
    try {
      const data = await transactionsApi.activeAsBuyer();
      const filtered = data.filter((t) => t.sellerId === sellerId);
      setTransactions(filtered);
      
      if (filtered.length > 0) {
        // Just fetch the active code for the first listing in the context
        const codeRes = await transactionsApi.activeMeetupCode(filtered[0].listingId, sellerId);
        if (codeRes && codeRes.activeCode) {
          setActiveCode(codeRes.activeCode);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch buyer transactions', e);
    } finally {
      setLoading(false);
    }
  }, [visible, sellerId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={[type.h3, { color: palette.foreground }]}>My Purchases</Text>
              <Text style={[type.caption, { color: palette.muted }]}>Manage your active purchases from this seller.</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <X color={palette.muted} size={24} />
            </Pressable>
          </View>
          
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={palette.foreground} />
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.center}>
              <AlertTriangle color={palette.muted} size={32} style={{ marginBottom: spacing.sm, opacity: 0.5 }} />
              <Text style={[type.body, { color: palette.foreground }]}>No Active Purchases</Text>
              <Text style={[type.caption, { color: palette.muted, textAlign: 'center', marginTop: 4 }]}>
                You don't have any pending purchases with this seller.
              </Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Image
                      source={{ uri: getImageUrl(item.listing?.images?.[0]?.url) }}
                      style={styles.image}
                      contentFit="cover"
                    />
                    <View style={styles.info}>
                      <Text style={[type.body, { color: palette.foreground, fontWeight: '700' }]} numberOfLines={1}>
                        {item.listing?.title || 'Unknown Item'}
                      </Text>
                      <Text style={[type.body, { color: palette.accent, fontWeight: '900' }]}>
                        ${(item.amount / 100).toFixed(2)}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{item.paymentMethod}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: palette.accent + '20' }]}>
                          <Text style={[styles.badgeText, { color: palette.accent }]}>{item.orderStatus.replace(/_/g, ' ')}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  {item.paymentMethod === 'STRIPE' && item.orderStatus !== 'COMPLETED_BY_SELLER' && (
                    <View style={styles.codeContainer}>
                      <Text style={[type.caption, { color: palette.muted, textAlign: 'center' }]}>
                        Show this 6-digit code to the seller:
                      </Text>
                      <Text style={styles.codeText}>
                        {activeCode || '------'}
                      </Text>
                    </View>
                  )}
                  {item.paymentMethod === 'DIRECT' && item.orderStatus !== 'COMPLETED_BY_SELLER' && (
                    <View style={styles.directContainer}>
                      <Text style={[type.body, { color: palette.foreground, textAlign: 'center', fontWeight: '700' }]}>
                        Direct Payment
                      </Text>
                      <Text style={[type.caption, { color: palette.muted, textAlign: 'center', marginTop: 4 }]}>
                        Pay the seller directly (Cash, Zelle, etc.) when you meet. The seller will mark the item as sold.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: palette.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    height: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: palette.hairline,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: palette.card,
  },
  info: {
    flex: 1,
  },
  badge: {
    backgroundColor: palette.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.muted,
  },
  codeContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: palette.accent + '10',
    borderRadius: radius.md,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 32,
    fontWeight: '900',
    color: palette.accent,
    letterSpacing: 8,
    marginTop: 4,
  },
  directContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.hairlineSoft,
  }
});
