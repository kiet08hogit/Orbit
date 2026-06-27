import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, MapPin, MessageCircle, ShieldCheck, Tag } from 'lucide-react-native';
import { categoryColors, palette, radius, spacing, type } from '@/theme';
import { Screen, Button, AppHeader, Avatar, Pill, Divider } from '@/components/ui';
import { useListing } from '@/hooks/useListings';
import { formatPrice, formatRelative } from '@/lib/format';

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, loading } = useListing(id || '');
  const { width } = useWindowDimensions();
  const [saved, setSaved] = useState(false);

  if (loading || !data) {
    return (
      <Screen>
        <AppHeader back />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={palette.foreground} />
        </View>
      </Screen>
    );
  }

  const tone = categoryColors[data.category];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <AppHeader
          back
          borderless
          trailing={
            <Pressable onPress={() => setSaved((v) => !v)} accessibilityLabel="Save">
              <Heart
                color={saved ? palette.accent : palette.foreground}
                fill={saved ? palette.accent : 'transparent'}
                size={20}
                strokeWidth={1.6}
              />
            </Pressable>
          }
        />

        {/* Gallery */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ height: width * 0.88 }}
        >
          {data.images.map((img, i) => (
            <Image
              key={i}
              source={{ uri: img.url }}
              style={{ width, height: width * 0.88 }}
              contentFit="cover"
            />
          ))}
        </ScrollView>

        {/* Title + price */}
        <View style={styles.section}>
          <Pill label={data.category} tone="category" color={tone} dot />
          <Text style={[type.displayLg, styles.title]}>{data.title}</Text>
          <Text style={[type.price, { color: palette.foreground, fontSize: 32, lineHeight: 36, marginTop: spacing.xs }]}>
            {formatPrice(data.price)}
          </Text>
          {data.location ? (
            <View style={styles.metaRow}>
              <MapPin color={palette.muted} size={14} strokeWidth={1.6} />
              <Text style={[type.bodySm, { color: palette.muted, marginLeft: 6 }]}>
                {data.location}
              </Text>
              <Text style={[type.bodySm, { color: palette.muted }]}> · {formatRelative(data.createdAt)}</Text>
            </View>
          ) : null}
        </View>

        <Divider />

        {/* Description */}
        <View style={styles.section}>
          <Text style={[type.captionUpper, { color: palette.muted, marginBottom: spacing.xs }]}>
            DETAILS
          </Text>
          <Text style={[type.bodyLg, { color: palette.body }]}>{data.description}</Text>
        </View>

        {/* Spec strip */}
        {(data.brand || data.size || data.material || data.colors) ? (
          <>
            <Divider />
            <View style={styles.section}>
              <Text style={[type.captionUpper, { color: palette.muted, marginBottom: spacing.sm }]}>
                SPECS
              </Text>
              <View style={styles.specs}>
                {data.brand ? <Spec label="BRAND" value={data.brand} /> : null}
                {data.size ? <Spec label="SIZE" value={data.size} /> : null}
                {data.material ? <Spec label="MATERIAL" value={data.material} /> : null}
                {data.colors ? <Spec label="COLOR" value={data.colors} /> : null}
              </View>
            </View>
          </>
        ) : null}

        <Divider />

        {/* Trust strip */}
        <View style={styles.section}>
          {data.acceptsProtectedPayment ? (
            <View style={styles.trustRow}>
              <ShieldCheck color={palette.success} size={16} strokeWidth={1.6} />
              <Text style={[type.bodySm, { color: palette.body, marginLeft: spacing.xs }]}>
                Protected payment available — funds release on confirmed pickup.
              </Text>
            </View>
          ) : null}
          {data.acceptsDirectPayment ? (
            <View style={[styles.trustRow, { marginTop: spacing.xs }]}>
              <Tag color={palette.muted} size={16} strokeWidth={1.6} />
              <Text style={[type.bodySm, { color: palette.body, marginLeft: spacing.xs }]}>
                Direct payment OK — Venmo, cash, or whatever you arrange.
              </Text>
            </View>
          ) : null}
        </View>

        <Divider />

        {/* Seller */}
        <View style={styles.section}>
          <Text style={[type.captionUpper, { color: palette.muted, marginBottom: spacing.sm }]}>
            SELLER
          </Text>
          <Pressable
            style={styles.sellerRow}
            onPress={() => router.push(`/profile/${data.seller.id}` as any)}
          >
            <Avatar name={data.seller.name} uri={data.seller.avatarUrl} size={48} />
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <Text style={[type.bodyStrong, { color: palette.foreground }]}>
                {data.seller.name}
              </Text>
              <Text style={[type.bodySm, { color: palette.muted, marginTop: 2 }]}>
                {data.seller.major ? `${data.seller.major} · ` : ''}{data.seller.classYear ?? 'Student'}
              </Text>
            </View>
            <Text style={[type.button, { color: palette.accent }]}>View →</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Floating sticky bar */}
      <View style={styles.stickyBar}>
        <View style={{ flex: 1 }}>
          <Text style={[type.captionUpper, { color: palette.muted }]}>TOTAL</Text>
          <Text style={[type.price, { color: palette.foreground }]}>{formatPrice(data.price)}</Text>
        </View>
        <Button
          label="Message seller"
          variant="secondary"
          icon={<MessageCircle color={palette.foreground} size={14} strokeWidth={1.6} />}
          onPress={() => router.push(`/chat/new?listingId=${data.id}` as any)}
        />
        <View style={{ width: spacing.xs }} />
        <Button
          label="Buy now"
          onPress={() => router.push(`/checkout/${data.id}` as any)}
        />
      </View>
    </SafeAreaView>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.spec}>
      <Text style={[type.captionUpper, { color: palette.muted }]}>{label}</Text>
      <Text style={[type.bodyStrong, { color: palette.foreground, marginTop: 2 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: spacing.base, paddingVertical: spacing.lg },
  title: { color: palette.foreground, marginTop: spacing.sm, letterSpacing: -0.6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  spec: { minWidth: 100 },
  trustRow: { flexDirection: 'row', alignItems: 'center' },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.hairline,
    padding: spacing.base,
  },
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: palette.card,
    borderTopWidth: 1,
    borderTopColor: palette.hairlineStrong,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
