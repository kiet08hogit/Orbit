import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ImagePlus, X } from 'lucide-react-native';
import { categoryColors, palette, radius, spacing, type } from '@/theme';
import { Screen, AppHeader, Input, Button, Pill } from '@/components/ui';
import { listingsApi } from '@/lib/api';
import type { ListingCategory } from '@/lib/types';

const CATEGORIES: ListingCategory[] = [
  'HOUSING',
  'CLOTHES',
  'SCHOOL',
  'LEISURE',
  'ACCESSORIES',
  'OTHER',
];

export default function AddProductScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ListingCategory>('OTHER');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

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

  const submit = async () => {
    if (!title.trim() || !price.trim()) {
      Alert.alert('Almost there', 'Add a title and price to publish.');
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('description', description.trim());
      form.append('price', price.trim());
      form.append('category', category);
      images.forEach((uri, i) => {
        form.append('images', {
          uri,
          name: `photo-${i}.jpg`,
          type: 'image/jpeg',
        } as unknown as Blob);
      });
      await listingsApi.create(form);
      router.replace('/listings');
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
            placeholder="$0"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            containerStyle={{ flex: 1 }}
            leadingIcon={<Text style={[type.bodyLg, { color: palette.muted }]}>$</Text>}
          />
        </View>

        <Text style={[type.captionUpper, styles.label, { marginTop: spacing.lg }]}>CATEGORY</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((c) => (
            <Pill
              key={c}
              label={c}
              tone="category"
              color={categoryColors[c]}
              selected={category === c}
              onPress={() => setCategory(c)}
            />
          ))}
        </View>

        <Input
          label="DESCRIPTION"
          placeholder="Condition, history, why you’re parting with it…"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          containerStyle={{ marginTop: spacing.lg }}
        />

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
  footer: {
    marginTop: spacing.xl,
  },
});
