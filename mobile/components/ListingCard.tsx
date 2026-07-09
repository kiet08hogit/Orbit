import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { BadgeCheck, Heart, Star, Tag } from 'lucide-react-native';
import { palette, radius, spacing, type } from '@/theme';
import type { Listing } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { getImageUrl, listingsApi } from '@/lib/api';

interface Props {
  listing: Listing;
  variant?: 'grid' | 'wide';
}

/** Mirrors web home/listings ListingCard — price first, muted title, seller footer. */
export function ListingCard({ listing, variant = 'grid' }: Props) {
  const router = useRouter();
  const img = getImageUrl(listing.images?.[0]?.url);
  const [saved, setSaved] = useState(false);

  const reviews = (listing.seller as { reviewsReceived?: { rating: number }[] } | undefined)
    ?.reviewsReceived;
  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  const toggleSave = async (e?: { stopPropagation?: () => void }) => {
    e?.stopPropagation?.();
    setSaved((v) => !v);
    try {
      await listingsApi.swipe(listing.id, saved ? 'SKIP' : 'LIKE');
    } catch {
      setSaved((v) => !v);
    }
  };

  return (
    <Pressable
      onPress={() => router.push(`/listings/${listing.id}` as any)}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${formatPrice(listing.price)}`}
      style={({ pressed }) => [
        styles.wrap,
        variant === 'wide' && styles.wide,
        pressed && { opacity: 0.95 },
      ]}
    >
      <View style={[styles.imageWrap, variant === 'wide' && styles.imageWide]}>
        {img ? (
          <Image source={{ uri: img }} style={styles.image} transition={250} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Tag color={palette.mutedForeground} size={32} strokeWidth={1.5} />
          </View>
        )}
        <Pressable
          onPress={() => toggleSave()}
          style={styles.heartBtn}
          hitSlop={8}
          accessibilityLabel="Save to wishlist"
        >
          <Heart
            size={16}
            color="#ffffff"
            fill={saved ? '#ffffff' : 'transparent'}
            strokeWidth={1.8}
          />
        </Pressable>
      </View>

      <View style={[styles.body, variant === 'wide' && styles.bodyWide]}>
        <Text style={[type.bodyStrong, styles.price]}>{formatPrice(listing.price)}</Text>
        <Text numberOfLines={2} style={[type.body, styles.title]}>
          {listing.title}
        </Text>

        <View style={styles.footer}>
          {listing.seller?.university ? (
            <Text numberOfLines={1} style={[type.captionUpper, styles.university]}>
              {listing.seller.university}
            </Text>
          ) : (
            <View />
          )}
          <View style={styles.footerBadges}>
            {avgRating != null ? (
              <View style={styles.ratingRow}>
                <Star size={12} color="#f59e0b" fill="#f59e0b" strokeWidth={0} />
                <Text style={[type.caption, { color: '#f59e0b' }]}>{avgRating.toFixed(1)}</Text>
              </View>
            ) : null}
            {listing.seller?.isEduVerified ? (
              <BadgeCheck size={14} color="#3b82f6" strokeWidth={1.8} />
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: palette.card,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
  },
  wide: { flexDirection: 'row' },
  imageWrap: {
    aspectRatio: 4 / 3,
    backgroundColor: palette.background,
    position: 'relative',
  },
  imageWide: { width: 110, aspectRatio: undefined, height: '100%' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heartBtn: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    padding: 6,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  body: {
    padding: spacing.sm,
    gap: 2,
    flex: 1,
  },
  bodyWide: { justifyContent: 'center' },
  price: {
    color: palette.foreground,
    fontSize: 16,
    lineHeight: 20,
  },
  title: {
    color: palette.mutedForeground,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: `${palette.border}80`,
  },
  university: {
    color: palette.mutedForeground,
    fontSize: 10,
    flex: 1,
    marginRight: spacing.xs,
  },
  footerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
