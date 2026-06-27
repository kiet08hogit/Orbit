import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { palette, radius, spacing, type } from '@/theme';
import { Screen, AppHeader, Button, Card, Divider } from '@/components/ui';
import { useListing } from '@/hooks/useListings';
import { formatPrice } from '@/lib/format';
import { paymentsApi } from '@/lib/api';

export default function Checkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data } = useListing(id || '');
  const [busy, setBusy] = useState(false);

  if (!data) return null;

  const fee = Math.round(data.price * 0.03);
  const total = data.price + fee;

  const pay = async () => {
    setBusy(true);
    try {
      // The Stripe-RN Payment Sheet is wired here in production. For now we hit our backend.
      await paymentsApi.paymentSheet(data.id);
      Alert.alert(
        'Reserved',
        `${data.title} is held for you. Confirm pickup to release payment.`,
        [{ text: 'Done', onPress: () => router.replace('/(tabs)/listings') }],
      );
    } catch (e) {
      Alert.alert(
        'Could not start checkout',
        e instanceof Error ? e.message : 'Try again later.',
      );
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
              source={{ uri: data.images[0]?.url }}
              style={styles.itemImage}
              contentFit="cover"
            />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[type.bodyStrong, { color: palette.foreground }]} numberOfLines={2}>
                {data.title}
              </Text>
              <Text style={[type.bodySm, { color: palette.muted, marginTop: 2 }]}>
                Sold by {data.seller.name}
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
            <Row label="Subtotal" value={formatPrice(data.price)} />
            <Divider strength="soft" />
            <Row label="Orbit fee (3%)" value={formatPrice(fee)} />
            <Divider strength="soft" />
            <Row label="Total" value={formatPrice(total)} strong />
          </Card>
        </View>

        <View style={styles.trustRow}>
          <ShieldCheck color={palette.success} size={16} strokeWidth={1.6} />
          <Text style={[type.bodySm, { color: palette.body, marginLeft: spacing.xs, flex: 1 }]}>
            Payment is held until you confirm pickup. If anything's off, you have 24 hours to flag.
          </Text>
        </View>

        <Button
          label={busy ? 'Reserving…' : `Pay ${formatPrice(total)}`}
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
