import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { ShieldCheck } from 'lucide-react-native';
import { palette, radius, spacing, type } from '@/theme';
import { AppHeader, Button, Card, Divider } from '@/components/ui';
import { listingsApi, paymentsApi, getImageUrl } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { stripePublishableKey } from '@/lib/auth';
import type { Listing } from '@/lib/types';

export default function Checkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [data, setData] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    listingsApi
      .get(id)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
        <AppHeader back title="Checkout" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={palette.foreground} />
        </View>
      </SafeAreaView>
    );
  }
  if (!data) return null;

  const pay = async () => {
    if (!stripePublishableKey) {
      Alert.alert(
        'Payments not configured',
        'Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in mobile/.env to enable protected checkout.',
      );
      return;
    }
    setBusy(true);
    try {
      const { clientSecret } = await paymentsApi.createIntent(data.id);
      const init = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Orbit',
        defaultBillingDetails: {},
      });
      if (init.error) throw new Error(init.error.message);

      const result = await presentPaymentSheet();
      if (result.error) {
        if (result.error.code !== 'Canceled') {
          Alert.alert('Payment failed', result.error.message);
        }
        return;
      }
      Alert.alert(
        'Payment held',
        `${data.title} is reserved. Funds release to the seller when you confirm pickup.`,
        [{ text: 'Done', onPress: () => router.replace('/(tabs)/home') }],
      );
    } catch (e) {
      Alert.alert('Could not start checkout', e instanceof Error ? e.message : 'Try again later.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <AppHeader back title="Checkout" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card padded>
          <View style={styles.itemRow}>
            <Image
              source={{ uri: getImageUrl(data.images?.[0]?.url) }}
              style={styles.itemImage}
              contentFit="cover"
            />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[type.bodyStrong, { color: palette.foreground }]} numberOfLines={2}>
                {data.title}
              </Text>
              <Text style={[type.bodySm, { color: palette.muted, marginTop: 2 }]}>
                Sold by {data.seller?.name ?? data.seller?.username ?? 'a student'}
              </Text>
              <Text style={[type.price, { color: palette.foreground, marginTop: spacing.xs }]}>
                {formatPrice(data.price)}
              </Text>
            </View>
          </View>
        </Card>

        <View style={{ marginTop: spacing.lg }}>
          <Text style={[type.captionUpper, styles.label]}>BREAKDOWN</Text>
          <Card padded={false}>
            <Row label="Total" value={formatPrice(data.price)} strong />
          </Card>
        </View>

        <View style={styles.trustRow}>
          <ShieldCheck color={palette.success} size={16} strokeWidth={1.6} />
          <Text style={[type.bodySm, { color: palette.body, marginLeft: spacing.xs, flex: 1 }]}>
            Payment is held in escrow until you confirm pickup. If anything's off, you have 24 hours
            to flag it.
          </Text>
        </View>

        <Button
          label={busy ? 'Preparing…' : `Pay ${formatPrice(data.price)}`}
          onPress={pay}
          loading={busy}
          size="lg"
          fullWidth
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[type.body, { color: strong ? palette.foreground : palette.body }]}>
        {label}
      </Text>
      <Text style={[strong ? type.price : type.body, { color: palette.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.base, paddingBottom: spacing.xxl },
  itemRow: { flexDirection: 'row' },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceElevated,
  },
  label: { color: palette.muted, marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.lg,
    padding: spacing.base,
    borderRadius: radius.md,
    backgroundColor: `${palette.success}11`,
    borderWidth: 1,
    borderColor: `${palette.success}33`,
  },
});
