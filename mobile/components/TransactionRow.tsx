import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { palette, radius, spacing, type } from '@/theme';
import { getImageUrl } from '@/lib/api';
import { formatPrice, formatRelative } from '@/lib/format';
import type { Transaction } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  PENDING_MEETUP: 'Meetup pending',
  PAID_PENDING_MEETUP: 'Paid · meetup pending',
  MEETING_STARTED: 'Meetup in progress',
  MEETUP_CONFIRMED: 'Meetup confirmed',
  COMPLETED_BY_SELLER: 'Marked sold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  DISPUTED: 'Disputed',
  EXPIRED: 'Expired',
  DECLINED: 'Declined',
};

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: palette.success,
  MEETUP_CONFIRMED: palette.success,
  COMPLETED_BY_SELLER: palette.success,
  CANCELLED: palette.error,
  DECLINED: palette.error,
  EXPIRED: palette.error,
  DISPUTED: palette.warning,
  REFUNDED: palette.warning,
};

export function TransactionRow({
  transaction,
  counterpartyLabel,
}: {
  transaction: Transaction;
  counterpartyLabel?: string;
}) {
  const router = useRouter();
  const listing = transaction.listing;
  const statusLabel = STATUS_LABEL[transaction.orderStatus] ?? transaction.orderStatus;
  const statusColor = STATUS_COLOR[transaction.orderStatus] ?? palette.warning;

  return (
    <Pressable
      onPress={() => listing && router.push(`/listings/${listing.id}` as any)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: palette.surfaceElevated }]}
    >
      <Image
        source={{ uri: getImageUrl(listing?.images?.[0]?.url) }}
        style={styles.image}
        contentFit="cover"
      />
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Text style={[type.bodyStrong, { color: palette.foreground }]} numberOfLines={1}>
          {listing?.title ?? 'Listing'}
        </Text>
        {counterpartyLabel ? (
          <Text style={[type.caption, { color: palette.muted, marginTop: 2 }]} numberOfLines={1}>
            {counterpartyLabel}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={[type.captionUpper, { color: statusColor }]}>{statusLabel}</Text>
          <Text style={[type.caption, { color: palette.muted }]}>
            · {formatRelative(transaction.updatedAt)}
          </Text>
        </View>
      </View>
      <Text style={[type.price, { color: palette.foreground }]}>
        {formatPrice(listing?.price ?? transaction.amount / 100)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceElevated,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
});
