import React, { useEffect } from 'react';
import { Text, TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { palette } from '@/theme';

interface Props {
  children: string;
  style?: TextStyle | TextStyle[];
  duration?: number;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

/**
 * Shimmer-tinted text that cycles between two off-white tones — a faithful, motion-respectful
 * approximation of the web's gradient-slide shiny text (which doesn't translate to RN cleanly).
 * Reduced-motion users get the static base color.
 */
export function ShinyText({ children, style, duration = 4400 }: Props) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [duration, t]);

  const animated = useAnimatedStyle(() => ({
    color: interpolateColor(
      t.value,
      [0, 1],
      [palette.foreground, palette.body],
    ),
  }));

  return (
    <AnimatedText style={[style, animated]} accessibilityLabel={children}>
      {children}
    </AnimatedText>
  );
}
