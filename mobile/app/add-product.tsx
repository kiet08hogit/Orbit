import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ImagePlus, Sparkles, X } from 'lucide-react-native';
import { categoryColors, categoryLabels, palette, radius, spacing, type } from '@/theme';
import { AppHeader, Input, Button, Pill } from '@/components/ui';
import { listingsApi, paymentsApi } from '@/lib/api';
import type { ListingCategory } from '@/lib/types';

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

export default function AddProductScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<ListingCategory>('OTHER');
  const [images, setImages] = useState<string[]>([]);
  const [acceptsDirect, setAcceptsDirect] = useState(true);
  const [acceptsProtected, setAcceptsProtected] = useState(false);
  const [stripeLinked, setStripeLinked] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    paymentsApi
      .connectStatus()
      .then((s) => setStripeLinked(s.linked))
      .catch(() => setStripeLinked(false));
  }, []);

  const pickImages = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 6 - images.length,
      quality: 0.8,
    });
    if (!res.canceled) {
      setImages((prev) => [...prev, ...res.assets.map((a) => a.uri)].slice(0, 6));
    }
  };

  const removeImage = (uri: string) => {
    setImages((prev) => prev.filter((u) => u !== uri));
  };

  const aiAutofill = async () => {
    if (images.length === 0) {
      Alert.alert('Add a photo first', 'AI autofill reads your first photo to draft the listing.');
      return;
    }
    setSuggesting(true);
    try {
      const form = new FormData();
      form.append('image', {
        uri: images[0],
        name: 'ai-photo.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);
      const s = await listingsApi.aiSuggest(form);
      if (s.title) setTitle(s.title);
      if (s.description) setDescription(s.description);
      if (s.price !== undefined) setPrice(String(s.price));
      if (s.category && CATEGORIES.includes(s.category)) setCategory(s.category);
    } catch (e) {
      Alert.alert('AI autofill failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setSuggesting(false);
    }
  };

  const submit = async () => {
    if (!title.trim() || !price.trim()) {
      Alert.alert('Almost there', 'Add a title and price to publish.');
      return;
    }
    if (!acceptsDirect && !acceptsProtected) {
      Alert.alert('Pick a payment option', 'Enable direct payment, protected payment, or both.');
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('description', description.trim());
      form.append('price', price.trim());
      form.append('category', category);
      if (location.trim()) form.append('location', location.trim());
      form.append('acceptsDirectPayment', String(acceptsDirect));
      form.append('acceptsProtectedPayment', String(acceptsProtected));
      images.forEach((uri, i) => {
        form.append('images', {
          uri,
          name: `photo-${i}.jpg`,
          type: 'image/jpeg',
        } as unknown as Blob);
      });
      await listingsApi.create(form);
      router.replace('/(tabs)/home');
    } catch (e) {
      Alert.alert(
        'Could not publish',
        e instanceof Error ? e.message : 'Try again in a moment.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <AppHeader back title="New listing" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Image grid */}
        <Text style={[type.captionUpper, styles.label]}>PHOTOS · {images.length}/6</Text>
        <View style={styles.imageGrid}>
          {images.map((uri) => (
            <View key={uri} style={styles.imageCell}>
              <Image source={{ uri }} style={styles.image} contentFit="cover" />
              <Pressable
                onPress={() => removeImage(uri)}
                style={styles.removeBtn}
                accessibilityLabel="Remove photo"
                hitSlop={8}
              >
                <X color={palette.foreground} size={14} strokeWidth={2} />
              </Pressable>
            </View>
          ))}
          {images.length < 6 ? (
            <Pressable
              onPress={pickImages}
              style={[styles.imageCell, styles.addCell]}
              accessibilityRole="button"
              accessibilityLabel="Add photo"
            >
              <ImagePlus color={palette.body} size={22} strokeWidth={1.6} />
              <Text style={[type.captionUpper, { color: palette.muted, marginTop: 6 }]}>
                ADD PHOTO
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Button
          label={suggesting ? 'Reading your photo…' : 'AI autofill from photo'}
          variant="secondary"
          loading={suggesting}
          onPress={aiAutofill}
          fullWidth
          icon={<Sparkles color={palette.accent} size={15} strokeWidth={1.8} />}
          style={{ marginTop: spacing.base }}
        />

        {/* Form fields */}
        <Input
          label="TITLE"
          placeholder="What are you listing?"
          value={title}
          onChangeText={setTitle}
          maxLength={80}
          containerStyle={{ marginTop: spacing.xl }}
        />

        <View style={styles.row}>
          <Input
            label="PRICE"
            placeholder="0"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            containerStyle={{ flex: 1 }}
            leadingIcon={<Text style={[type.bodyLg, { color: palette.muted }]}>$</Text>}
          />
          <Input
            label="LOCATION"
            placeholder="e.g. Student Center"
            value={location}
            onChangeText={setLocation}
            containerStyle={{ flex: 1.4 }}
          />
        </View>

        <Text style={[type.captionUpper, styles.label, { marginTop: spacing.lg }]}>CATEGORY</Text>
        <View style={styles.categoryRow}>
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

        <Input
          label="DESCRIPTION"
          placeholder="Condition, history, why you're parting with it…"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          containerStyle={{ marginTop: spacing.lg }}
        />

        {/* Payments */}
        <Text style={[type.captionUpper, styles.label, { marginTop: spacing.lg }]}>PAYMENTS</Text>
        <View style={styles.toggleCard}>
          <ToggleRow
            title="Direct payment"
            body="Cash, Venmo, Zelle — you arrange it."
            value={acceptsDirect}
            onChange={setAcceptsDirect}
          />
          <View style={styles.toggleDivider} />
          <ToggleRow
            title="Protected payment"
            body={
              stripeLinked === false
                ? 'Requires a linked Stripe account — set it up from your profile.'
                : 'Buyer pays through Orbit; funds release on pickup.'
            }
            value={acceptsProtected}
            onChange={setAcceptsProtected}
            disabled={stripeLinked === false}
          />
        </View>

        <View style={styles.footer}>
          <Button
            label={submitting ? 'Publishing…' : 'Publish listing'}
            loading={submitting}
            onPress={submit}
            size="lg"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({
  title,
  body,
  value,
  onChange,
  disabled,
}: {
  title: string;
  body: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.toggleRow, disabled && { opacity: 0.5 }]}>
      <View style={{ flex: 1, marginRight: spacing.sm }}>
        <Text style={[type.bodyStrong, { color: palette.foreground }]}>{title}</Text>
        <Text style={[type.bodySm, { color: palette.body, marginTop: 2 }]}>{body}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: palette.accent, false: palette.hairlineStrong }}
        thumbColor={palette.foreground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.base,
    paddingBottom: spacing.xxl,
  },
  label: { color: palette.muted, marginBottom: spacing.xs },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  imageCell: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  image: { width: '100%', height: '100%' },
  addCell: {
    borderStyle: 'dashed',
    borderColor: palette.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.scrimStrong,
  },
  row: { flexDirection: 'row', gap: spacing.base, marginTop: spacing.base },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  toggleCard: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  toggleDivider: { height: 1, backgroundColor: palette.hairlineSoft },
  footer: {
    marginTop: spacing.xl,
  },
});
