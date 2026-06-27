import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '@/theme';

/**
 * A whisper of motion — three meteors slide across the background on long loops.
 * Restrained: not the hero moment, just a quiet ambient cue.
 */
export function Meteors({ count = 5 }: { count?: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }).map((_, i) => (
        <Meteor key={i} index={i} />
      ))}
    </View>
  );
}

function Meteor({ index }: { index: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      index * 1800,
      withRepeat(
        withTiming(1, {
          duration: 6500 + index * 900,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        false,
      ),
    );
  }, [index, t]);

  const startX = 30 + index * 50;
  const startY = -40 - index * 20;

  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateX: t.value * 320 + startX },
      { translateY: t.value * 480 + startY },
      { rotate: '215deg' },
    ],
    opacity: t.value > 0.9 ? 0 : t.value < 0.1 ? t.value * 10 : 1,
  }));

  return (
    <Animated.View style={[styles.meteor, animated]}>
      <View style={styles.head} />
      <View style={styles.tail} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  meteor: {
    position: 'absolute',
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  head: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.foreground,
  },
  tail: {
    width: 80,
    height: 1,
    backgroundColor: palette.foreground,
    opacity: 0.35,
    marginTop: 1,
  },
});
