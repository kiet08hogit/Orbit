import React, { useCallback, useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { X, AlertTriangle } from 'lucide-react-native';
import { palette, radius, spacing, type } from '@/theme';
import { transactionsApi, getImageUrl } from '@/lib/api';
import type { Transaction } from '@/lib/types';
import { Button } from '@/components/ui';

interface SellerVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  buyerId: string | undefined;
}

export function SellerVerificationModal({ visible, onClose, buyerId }: SellerVerificationModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [codes, setCodes] = useState<Record<string, string>>({});

  const fetchTransactions = useCallback(async () => {
    if (!visible || !buyerId) return;
    setLoading(true);
    try {
      const data = await transactionsApi.activeAsSeller();
      // Filter only transactions with this specific buyer
      const filtered = data.filter((t) => t.buyerId === buyerId);
      setTransactions(filtered);
    } catch (e) {
      console.warn('Failed to fetch seller transactions', e);
    } finally {
      setLoading(false);
    }
  }, [visible, buyerId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleMarkAsSold = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await transactionsApi.markAsSold(id);
      await fetchTransactions(); // Refresh
    } catch (e) {
      console.warn('Failed to mark as sold', e);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleVerifyCode = async (id: string) => {
    const code = codes[id];
    if (!code || code.length !== 6) return;
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await transactionsApi.verifyMeetupCode(id, code);
      await fetchTransactions(); // Refresh
    } catch (e) {
      console.warn('Failed to verify code', e);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={[type.h3, { color: palette.foreground }]}>Verify Meetups</Text>
              <Text style={[type.caption, { color: palette.muted }]}>Manage your active transactions with this buyer.</Text>
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
              <Text style={[type.body, { color: palette.foreground }]}>No Active Meetups</Text>
              <Text style={[type.caption, { color: palette.muted, textAlign: 'center', marginTop: 4 }]}>
                You don't have any pending transactions with this buyer.
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
                  
                  <View style={styles.actions}>
                    {item.paymentMethod === 'DIRECT' && item.orderStatus !== 'COMPLETED_BY_SELLER' && (
                      <Button
                        title="Mark as Sold"
                        onPress={() => handleMarkAsSold(item.id)}
                        loading={actionLoading[item.id]}
                        style={{ backgroundColor: palette.success }}
                      />
                    )}
                    {item.paymentMethod === 'STRIPE' && item.orderStatus !== 'COMPLETED_BY_SELLER' && (
                      <View style={styles.codeRow}>
                        <TextInput
                          style={styles.input}
                          placeholder="6-digit code"
                          placeholderTextColor={palette.muted}
                          keyboardType="number-pad"
                          maxLength={6}
                          value={codes[item.id] || ''}
                          onChangeText={(text) => setCodes((prev) => ({ ...prev, [item.id]: text }))}
                        />
                        <Button
                          title="Verify"
                          onPress={() => handleVerifyCode(item.id)}
                          loading={actionLoading[item.id]}
                          disabled={!codes[item.id] || codes[item.id].length !== 6}
                        />
                      </View>
                    )}
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </KeyboardAvoidingView>
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
  actions: {
    marginTop: spacing.sm,
  },
  codeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.hairlineStrong,
    color: palette.foreground,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
});
