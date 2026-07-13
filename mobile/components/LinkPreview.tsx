import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Image } from 'expo-image';
import { getLinkPreview } from 'link-preview-js';
import { palette, radius, spacing, type } from '@/theme';

interface LinkPreviewProps {
  url: string;
}

export function LinkPreview({ url }: LinkPreviewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getLinkPreview(url)
      .then((preview) => {
        if (mounted) {
          setData(preview);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.warn('Link preview failed:', e);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [url]);

  if (loading || !data) {
    return null; // Fail silently if it can't fetch metadata
  }

  const handlePress = () => {
    Linking.openURL(url).catch(() => {});
  };

  const imageUrl = data.images?.[0] || data.favicons?.[0];

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
        />
      )}
      <View style={styles.content}>
        <Text style={[type.caption, { color: palette.foreground, fontWeight: '700' }]} numberOfLines={1}>
          {data.title || data.siteName || new URL(url).hostname}
        </Text>
        {data.description && (
          <Text style={[type.caption, { color: palette.muted, marginTop: 2 }]} numberOfLines={2}>
            {data.description}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
    backgroundColor: palette.surfaceElevated,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: palette.card,
  },
  content: {
    padding: spacing.sm,
  },
});
