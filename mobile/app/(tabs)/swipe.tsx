import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Heart, Sparkles, X } from 'lucide-react-native';
import { palette, radius, spacing, type, categoryColors, categoryLabels } from '@/theme';
import { Screen, Pill, Button } from '@/components/ui';
import { listingsApi, getImageUrl } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import type { Listing } from '@/lib/types';

const SWIPE_THRESHOLD = 120;

export default function SwipeTab() {
  const [data, setData] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    listingsApi
      .feed()
      .then((listings) => {
        setData(listings);
        setIndex(0);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const x = useSharedValue(0);
  const y = useSharedValue(0);

  const commitSwipe = (swipedIndex: number, dir: 'left' | 'right') => {
    const listing = data[swipedIndex];
    if (listing) {
      listingsApi.swipe(listing.id, dir === 'right' ? 'LIKE' : 'SKIP').catch(() => {});
    }
    setIndex(swipedIndex + 1);
  };

  const advance = (dir: 'left' | 'right' | 'reset') => {
    if (dir === 'reset') {
      x.value = withSpring(0);
      y.value = withSpring(0);
      return;
    }
    const current = index;
    x.value = withTiming(dir === 'right' ? 500 : -500, { duration: 220 }, () => {
      runOnJS(commitSwipe)(current, dir);
      x.value = 0;
      y.value = 0;
    });
  };

  const pan = Gesture.Pan()
    .onChange((e) => {
      x.value = e.translationX;
      y.value = e.translationY;
    })
    .onEnd(() => {
      if (Math.abs(x.value) > SWIPE_THRESHOLD) {
        runOnJS(advance)(x.value > 0 ? 'right' : 'left');
      } else {
        runOnJS(advance)('reset');
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${x.value / 16}deg` },
    ],
  }));

  const likeStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, x.value / 100),
  }));

  const nopeStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, -x.value / 100),
  }));

  const current = data[index];
  const next = data[index + 1];

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={[type.captionUpper, { color: palette.muted }]}>MATCH YOUR NEEDS</Text>
        <Text style={[type.displayLg, { color: palette.foreground }]}>
          One at a time.
        </Text>
      </View>

      <View style={styles.deck}>
        {loading ? (
          <ActivityIndicator color={palette.foreground} />
        ) : !current ? (
          <View style={styles.empty}>
            <Sparkles color={palette.accent} size={32} strokeWidth={1.5} />
            <Text style={[type.displaySm, { color: palette.foreground, marginTop: spacing.base }]}>
              That's all for now
            </Text>
            <Text style={[type.body, { color: palette.body, textAlign: 'center', marginTop: spacing.xs }]}>
              You've seen every new listing. Fresh items land every few hours.
            </Text>
            <View style={{ marginTop: spacing.lg }}>
              <Button label="Check again" onPress={load} variant="secondary" />
            </View>
          </View>
        ) : (
          <>
            {next ? (
              <View style={[styles.card, styles.cardBack]}>
                <Image
                  source={{ uri: getImageUrl(next.images?.[0]?.url) }}
                  style={styles.cardImage}
                  contentFit="cover"
                />
              </View>
            ) : null}

            <GestureDetector gesture={pan}>
              <Animated.View style={[styles.card, cardStyle]}>
                <Image
                  source={{ uri: getImageUrl(current.images?.[0]?.url) }}
                  style={styles.cardImage}
                  contentFit="cover"
                />
                <Animated.View style={[styles.badge, styles.like, likeStyle]}>
                  <Text style={[type.captionUpper, { color: palette.success }]}>LIKE</Text>
                </Animated.View>
                <Animated.View style={[styles.badge, styles.nope, nopeStyle]}>
                  <Text style={[type.captionUpper, { color: palette.error }]}>SKIP</Text>
                </Animated.View>
                <View style={styles.cardBody}>
                  <Pill
                    label={categoryLabels[current.category] ?? current.category}
                    tone="category"
                    color={categoryColors[current.category]}
                    dot
                  />
                  <Text style={[type.displaySm, { color: palette.foreground, marginTop: spacing.sm }]} numberOfLines={1}>
                    {current.title}
                  </Text>
                  <Text style={[type.price, { color: palette.foreground, marginTop: spacing.xxs }]}>
                    {formatPrice(current.price)}
                  </Text>
                  <Text style={[type.body, { color: palette.body, marginTop: spacing.xs }]} numberOfLines={2}>
                    {current.description}
                  </Text>
                </View>
              </Animated.View>
            </GestureDetector>
          </>
        )}
      </View>

      <View style={styles.controls}>
        <RoundButton onPress={() => current && advance('left')} label="Skip">
          <X color={palette.body} size={22} strokeWidth={1.6} />
        </RoundButton>
        <RoundButton onPress={() => current && advance('right')} label="Like" accent>
          <Heart color={palette.background} size={22} strokeWidth={2} fill={palette.background} />
        </RoundButton>
      </View>
    </Screen>
  );
}

function RoundButton({
  children,
  onPress,
  label,
  accent,
}: {
  children: React.ReactNode;
  onPress: () => void;
  label: string;
  accent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.round,
        accent
          ? { backgroundColor: palette.accent }
          : { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.hairlineStrong },
        pressed && { transform: [{ scale: 0.94 }] },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  deck: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
  },
  card: {
    width: '100%',
    aspectRatio: 0.72,
    borderRadius: radius.xl,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.hairline,
    overflow: 'hidden',
    position: 'absolute',
  },
  cardBack: {
    transform: [{ scale: 0.94 }],
    opacity: 0.55,
  },
  cardImage: {
    width: '100%',
    height: '68%',
  },
  cardBody: {
    padding: spacing.lg,
  },
  badge: {
    position: 'absolute',
    top: spacing.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  like: {
    right: spacing.lg,
    borderColor: palette.success,
  },
  nope: {
    left: spacing.lg,
    borderColor: palette.error,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.lg,
  },
  round: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
});
