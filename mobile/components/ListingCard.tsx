import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { categoryColors, palette, radius, spacing, type } from '@/theme';
import type { Listing } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { Pill } from './ui/Pill';

interface Props {
  listing: Listing;
  variant?: 'grid' | 'wide';
}

export function ListingCard({ listing, variant = 'grid' }: Props) {
  const router = useRouter();
  const img = listing.images?.[0]?.url;
  const tone = categoryColors[listing.category] ?? palette.body;

  return (
    <Pressable
      onPress={() => router.push(`/listings/${listing.id}` as any)}
      accessibilityRole="button"
      accessibilityLabel={`${listing.title}, ${formatPrice(listing.price)}`}
      style={({ pressed }) => [
        styles.wrap,
        variant === 'wide' && styles.wide,
        pressed && { transform: [{ scale: 0.985 }] },
      ]}
    >
      <View style={[styles.imageWrap, variant === 'wide' && styles.imageWide]}>
        {img ? (
          <Image
            source={{ uri: img }}
            style={styles.image}
            transition={250}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={[type.captionUpper, { color: palette.muted }]}>NO IMAGE</Text>
          </View>
        )}
        <View style={styles.tagRow}>
          <Pill label={listing.category} tone="category" color={tone} dot />
        </View>
      </View>

      <View style={[styles.body, variant === 'wide' && styles.bodyWide]}>
        <Text numberOfLines={2} style={[type.bodyStrong, { color: palette.foreground }]}>
          {listing.title}
        </Text>
        <View style={styles.priceRow}>
          <Text style={[type.price, { color: palette.foreground }]}>
            {formatPrice(listing.price)}
          </Text>
          {listing.location ? (
            <Text numberOfLines={1} style={[type.caption, { color: palette.muted }]}>
              · {listing.location}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  wide: { flexDirection: 'row' },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: palette.surfaceElevated,
    position: 'relative',
  },
  imageWide: { width: 110, aspectRatio: undefined, height: '100%' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  tagRow: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
  },
  body: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  bodyWide: { flex: 1, padding: spacing.base, justifyContent: 'center' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
});
