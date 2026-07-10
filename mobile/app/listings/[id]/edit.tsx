import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { categoryColors, categoryLabels, palette, spacing, type } from '@/theme';
import { AppHeader, Input, Button, Pill } from '@/components/ui';
import { listingsApi } from '@/lib/api';
import type { Listing, ListingCategory, ListingStatus } from '@/lib/types';

const CATEGORIES: ListingCategory[] = [
  'DORM',
  'SUBLEASE',
  'CLOTHES',
  'SCHOOL',
  'LEISURE',
  'ACCESSORIES',
  'SERVICES',
  'OTHER',
];

const STATUSES: ListingStatus[] = ['ACTIVE', 'SOLD', 'RESERVED', 'REMOVED'];

export default function EditListing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<ListingCategory>('OTHER');
  const [status, setStatus] = useState<ListingStatus>('ACTIVE');

  useEffect(() => {
    if (!id) return;
    listingsApi
      .get(id)
      .then((l: Listing) => {
        setTitle(l.title);
        setDescription(l.description);
        setPrice(String(l.price));
        setCategory(l.category);
        setStatus(l.status);
      })
      .catch(() => Alert.alert('Could not load listing'))
      .finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    if (!id) return;
    if (!title.trim() || !price.trim()) {
      Alert.alert('Almost there', 'Title and price are required.');
      return;
    }
    setSaving(true);
    try {
      await listingsApi.update(id, {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        status,
      });
      router.back();
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    Alert.alert('Delete listing', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await listingsApi.delete(id!);
            router.replace('/(tabs)/home');
          } catch (e) {
            Alert.alert('Could not delete', e instanceof Error ? e.message : 'Try again.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
        <AppHeader back title="Edit listing" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={palette.foreground} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <AppHeader back title="Edit listing" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Input label="TITLE" value={title} onChangeText={setTitle} maxLength={80} />
        <Input
          label="PRICE"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          containerStyle={{ marginTop: spacing.base }}
          leadingIcon={<Text style={[type.bodyLg, { color: palette.muted }]}>$</Text>}
        />
        <Input
          label="DESCRIPTION"
          value={description}
          onChangeText={setDescription}
          multiline
          containerStyle={{ marginTop: spacing.base }}
        />

        <Text style={[type.captionUpper, styles.label, { marginTop: spacing.lg }]}>CATEGORY</Text>
        <View style={styles.pillRow}>
          {CATEGORIES.map((c) => (
            <Pill
              key={c}
              label={categoryLabels[c]}
              tone="category"
              color={categoryColors[c]}
              selected={category === c}
              onPress={() => setCategory(c)}
            />
          ))}
        </View>

        <Text style={[type.captionUpper, styles.label, { marginTop: spacing.lg }]}>STATUS</Text>
        <View style={styles.pillRow}>
          {STATUSES.map((s) => (
            <Pill key={s} label={s} selected={status === s} onPress={() => setStatus(s)} />
          ))}
        </View>

        <Button
          label={saving ? 'Saving…' : 'Save changes'}
          loading={saving}
          onPress={save}
          size="lg"
          fullWidth
          style={{ marginTop: spacing.xl }}
        />
        <Button
          label="Delete listing"
          variant="destructive"
          onPress={remove}
          fullWidth
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.base, paddingBottom: spacing.xxl },
  label: { color: palette.muted, marginBottom: spacing.xs },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
