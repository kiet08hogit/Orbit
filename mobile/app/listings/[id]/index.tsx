import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Flag, Heart, MapPin, MessageCircle, Pencil, ShieldCheck, Tag } from 'lucide-react-native';
import { categoryColors, categoryLabels, palette, radius, spacing, type } from '@/theme';
import { Screen, Button, AppHeader, Avatar, Pill, Divider } from '@/components/ui';
import CampusMap from '@/components/CampusMap';
import { listingsApi, chatApi, transactionsApi, reportsApi, offersApi, getImageUrl } from '@/lib/api';
import { formatPrice, formatRelative } from '@/lib/format';
import type { Listing, Offer } from '@/lib/types';

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { width } = useWindowDimensions();

  const [data, setData] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [existingOffer, setExistingOffer] = useState<Offer | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const listing = await listingsApi.get(id);
      setData(listing);
      listingsApi.view(id).catch(() => {});
      listingsApi
        .wishlist()
        .then((items) => setSaved(items.some((l) => l.id === id)))
        .catch(() => {});
        
      if (user) {
        offersApi
          .mySentOffers()
          .then((offers) => {
             const offer = offers.find(o => o.listingId === id && o.status !== 'CANCELLED');
             setExistingOffer(offer || null);
          })
          .catch(() => {});
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <Screen>
        <AppHeader back />
        <View style={styles.loadingWrap}>
          {loading ? (
            <ActivityIndicator color={palette.foreground} />
          ) : (
            <Text style={[type.body, { color: palette.body }]}>Listing not found.</Text>
          )}
        </View>
      </Screen>
    );
  }

  const tone = categoryColors[data.category];
  const isMine = data.seller?.clerkUserId === user?.id;
  const images = data.images ?? [];

  const toggleSave = async () => {
    if (isMine) return;
    setSaved((v) => !v);
    try {
      // LIKE both saves to wishlist and re-LIKE toggles off server-side interaction
      await listingsApi.swipe(data.id, saved ? 'SKIP' : 'LIKE');
    } catch {
      setSaved((v) => !v);
    }
  };

  const messageSeller = async () => {
    if (!data.seller?.clerkUserId) return;
    setBusy(true);
    try {
      const conversation = await chatApi.startConversation(data.seller.clerkUserId);
      router.push(`/chat/${conversation.id}` as any);
    } catch (e) {
      Alert.alert('Could not start chat', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  };

  const buy = () => {
    if (data.acceptsProtectedPayment) {
      router.push(`/checkout/${data.id}` as any);
      return;
    }
    Alert.alert(
      'Reserve this item',
      'This seller takes direct payment (cash, Venmo…). Reserve it and arrange the meetup in chat.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reserve',
          onPress: async () => {
            try {
              await transactionsApi.directReservation(data.id);
              Alert.alert('Reserved', 'The item is held for you — message the seller to arrange pickup.');
            } catch (e) {
              Alert.alert('Could not reserve', e instanceof Error ? e.message : 'Try again.');
            }
          },
        },
      ],
    );
  };

  const report = () => {
    const send = async (reason: string) => {
      try {
        await reportsApi.create({ listingId: data.id, reason });
        Alert.alert('Thanks', 'Our team will take a look.');
      } catch {
        Alert.alert('Could not send report', 'Try again later.');
      }
    };
    if (Platform.OS === 'ios') {
      Alert.prompt('Report listing', 'Tell us what is wrong with this listing.', (reason) => {
        if (reason?.trim()) send(reason.trim());
      });
    } else {
      Alert.alert('Report listing', 'Report this listing to the Orbit team?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => send('Reported from mobile') },
      ]);
    }
  };

  const handleMakeOffer = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Make an Offer',
        'Enter your offer amount (USD)',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Submit',
            onPress: async (amountStr) => {
              if (!amountStr) return;
              const amount = Number(amountStr);
              if (isNaN(amount) || amount <= 0) {
                Alert.alert('Invalid amount', 'Please enter a valid number.');
                return;
              }
              if (amount >= data.price) {
                Alert.alert('Offer too high', 'Your offer must be less than the asking price.');
                return;
              }
              try {
                const newOffer = await offersApi.create({ listingId: data.id, price: amount });
                setExistingOffer(newOffer);
                Alert.alert('Success', 'Offer submitted! The seller will be notified.');
              } catch (e: any) {
                Alert.alert('Error', e.response?.data?.message || 'Failed to submit offer.');
              }
            },
          },
        ],
        'plain-text',
        '',
        'number-pad'
      );
    } else {
      // Android fallback could go here, for now just show not supported
      Alert.alert('Not Supported', 'Making offers is currently only supported on iOS in this demo.');
    }
  };

  const handleCancelOffer = () => {
    if (!existingOffer) return;
    Alert.alert('Cancel Offer', 'Are you sure you want to cancel your offer?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await offersApi.cancel(existingOffer.id);
            setExistingOffer(null);
            Alert.alert('Cancelled', 'Your offer has been cancelled.');
          } catch (e: any) {
            Alert.alert('Error', 'Failed to cancel offer.');
          }
        },
      }
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <AppHeader
          back
          borderless
          trailing={
            <View style={{ flexDirection: 'row', gap: spacing.base }}>
              {isMine ? (
                <Pressable
                  onPress={() => router.push(`/listings/${data.id}/edit` as any)}
                  accessibilityLabel="Edit listing"
                  hitSlop={8}
                >
                  <Pencil color={palette.foreground} size={19} strokeWidth={1.6} />
                </Pressable>
              ) : (
                <>
                  <Pressable onPress={report} accessibilityLabel="Report" hitSlop={8}>
                    <Flag color={palette.muted} size={19} strokeWidth={1.6} />
                  </Pressable>
                </>
              )}
            </View>
          }
        />

        {/* Gallery */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ height: width * 0.88 }}
        >
          {(images.length > 0 ? images : [{ url: '' }]).map((img, i) => (
            <Image
              key={i}
              source={{ uri: getImageUrl(img.url) }}
              style={{ width, height: width * 0.88, backgroundColor: palette.surfaceElevated }}
              contentFit="cover"
            />
          ))}
        </ScrollView>

        {/* Title + price */}
        <View style={styles.section}>
          <Pill label={categoryLabels[data.category] ?? data.category} tone="category" color={tone} dot />
          <Text style={[type.displayLg, styles.title]}>{data.title}</Text>
          <Text style={[type.price, { color: palette.foreground, fontSize: 32, lineHeight: 36, marginTop: spacing.xs }]}>
            {formatPrice(data.price)}
          </Text>
          <View style={styles.metaRow}>
            {data.location ? (
              <>
                <MapPin color={palette.muted} size={14} strokeWidth={1.6} />
                <Text style={[type.bodySm, { color: palette.muted, marginLeft: 6 }]}>
                  {data.location}
                </Text>
              </>
            ) : null}
            <Text style={[type.bodySm, { color: palette.muted }]}>
              {data.location ? ' · ' : ''}{formatRelative(data.createdAt)}
            </Text>
            {data.status !== 'ACTIVE' ? (
              <Text style={[type.captionUpper, { color: palette.warning, marginLeft: spacing.xs }]}>
                {data.status}
              </Text>
            ) : null}
          </View>
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

        {/* Meetup Location Map */}
        {data.location ? (
          <>
            <Divider />
            <View style={styles.section}>
              <Text style={[type.captionUpper, { color: palette.muted, marginBottom: spacing.sm }]}>
                MEETUP LOCATION
              </Text>
              <CampusMap locationName={data.location} />
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
        {data.seller ? (
          <View style={styles.section}>
            <Text style={[type.captionUpper, { color: palette.muted, marginBottom: spacing.sm }]}>
              SELLER
            </Text>
            <Pressable
              style={styles.sellerRow}
              onPress={() => router.push(`/profile/${data.seller!.clerkUserId}` as any)}
            >
              <Avatar
                name={data.seller.name ?? data.seller.username ?? '?'}
                uri={getImageUrl(data.seller.avatarUrl) || undefined}
                size={48}
              />
              <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                <Text style={[type.bodyStrong, { color: palette.foreground }]}>
                  {data.seller.name ?? data.seller.username}
                </Text>
                <Text style={[type.bodySm, { color: palette.muted, marginTop: 2 }]}>
                  {data.seller.university ?? data.seller.major ?? 'Student'}
                </Text>
              </View>
              <Text style={[type.button, { color: palette.accent }]}>View →</Text>
            </Pressable>
          </View>
        ) : null}
        
        {/* Action Buttons Section */}
        {!isMine ? (
          <View style={styles.section}>
            <Text style={[type.captionUpper, { color: palette.muted, marginBottom: spacing.sm }]}>
              ACTIONS
            </Text>
            
            <View style={{ gap: spacing.sm }}>
              <Button 
                label="Reserve Your Order" 
                onPress={buy} 
                disabled={data.status !== 'ACTIVE'} 
                style={{ backgroundColor: '#f97316' }} // orange-500
              />

              {existingOffer ? (
                <View style={{ backgroundColor: palette.surfaceElevated, padding: spacing.base, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.hairline }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                    <Text style={[type.bodyStrong, { color: palette.foreground }]}>Your Offer: ${existingOffer.price}</Text>
                    <Text style={[type.captionUpper, { 
                      color: existingOffer.status === 'PENDING' ? '#ca8a04' : existingOffer.status === 'ACCEPTED' ? '#16a34a' : '#dc2626'
                    }]}>
                      {existingOffer.status}
                    </Text>
                  </View>
                  <Text style={[type.bodySm, { color: palette.muted, marginBottom: spacing.base }]}>
                    {existingOffer.status === 'PENDING' ? "Waiting for the seller to respond." :
                     existingOffer.status === 'ACCEPTED' ? "Your offer was accepted! You can now reserve your order at this price." :
                     "Your offer was rejected."}
                  </Text>
                  {existingOffer.status === 'PENDING' ? (
                    <Button 
                      label="Cancel Offer" 
                      variant="secondary" 
                      onPress={handleCancelOffer} 
                    />
                  ) : null}
                </View>
              ) : (
                <Button 
                  label="Make an Offer" 
                  variant="secondary" 
                  onPress={handleMakeOffer} 
                />
              )}

              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Button 
                  label={saved ? "Saved" : "Wishlist"} 
                  variant="secondary" 
                  icon={
                    <Heart 
                      color={saved ? '#ef4444' : palette.foreground} 
                      fill={saved ? '#ef4444' : 'transparent'} 
                      size={16} 
                      strokeWidth={1.6} 
                    />
                  }
                  onPress={toggleSave} 
                  style={[{ flex: 1 }, saved && { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}
                />
                <Button 
                  label="Talk To Seller" 
                  variant="secondary" 
                  icon={<MessageCircle color={palette.foreground} size={16} strokeWidth={1.6} />}
                  onPress={messageSeller}
                  loading={busy}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
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
});
