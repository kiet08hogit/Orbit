import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  BookOpen,
  Shirt,
  Home,
  Headphones,
  Bike,
  Package,
} from 'lucide-react-native';
import { categoryColors, palette, spacing } from '@/theme';

/**
 * Signature: three concentric orbital rings rotating at different speeds,
 * with the Orbit logo locked at center. Category glyphs ride each ring.
 * This is the one bold motion moment in the app — everything else stays quiet.
 */
export function OrbitHero({ size = 320 }: { size?: number }) {
  const rA = useSharedValue(0);
  const rB = useSharedValue(0);
  const rC = useSharedValue(0);

  useEffect(() => {
    rA.value = withRepeat(withTiming(1, { duration: 26000, easing: Easing.linear }), -1, false);
    rB.value = withRepeat(withTiming(1, { duration: 38000, easing: Easing.linear }), -1, false);
    rC.value = withRepeat(withTiming(1, { duration: 52000, easing: Easing.linear }), -1, false);
  }, [rA, rB, rC]);

  const ringA = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rA.value * 360}deg` }],
  }));
  const ringB = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-rB.value * 360}deg` }],
  }));
  const ringC = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rC.value * 360}deg` }],
  }));

  const ringSizes = [size, size * 0.72, size * 0.46];

  return (
    <View style={[styles.root, { width: size, height: size }]} accessibilityLabel="Orbit motion">
      {/* Static rings — hairline circles */}
      {ringSizes.map((s, i) => (
        <View
          key={`bg-${i}`}
          style={[
            styles.ring,
            {
              width: s,
              height: s,
              borderRadius: s / 2,
              borderColor: i === 0 ? palette.hairline : palette.hairlineSoft,
              top: (size - s) / 2,
              left: (size - s) / 2,
            },
          ]}
        />
      ))}

      {/* Orbital A — outer, category icons */}
      <Animated.View
        style={[
          styles.orbit,
          { width: ringSizes[0], height: ringSizes[0], top: (size - ringSizes[0]) / 2, left: (size - ringSizes[0]) / 2 },
          ringA,
        ]}
      >
        <OrbitDot icon={<Home color={palette.background} size={16} strokeWidth={2} />} tint={categoryColors.HOUSING} angle={0} radius={ringSizes[0] / 2} />
        <OrbitDot icon={<Shirt color={palette.background} size={16} strokeWidth={2} />} tint={categoryColors.CLOTHES} angle={120} radius={ringSizes[0] / 2} />
        <OrbitDot icon={<BookOpen color={palette.background} size={16} strokeWidth={2} />} tint={categoryColors.SCHOOL} angle={240} radius={ringSizes[0] / 2} />
      </Animated.View>

      {/* Orbital B — middle */}
      <Animated.View
        style={[
          styles.orbit,
          { width: ringSizes[1], height: ringSizes[1], top: (size - ringSizes[1]) / 2, left: (size - ringSizes[1]) / 2 },
          ringB,
        ]}
      >
        <OrbitDot icon={<Bike color={palette.background} size={14} strokeWidth={2} />} tint={categoryColors.LEISURE} angle={60} radius={ringSizes[1] / 2} />
        <OrbitDot icon={<Headphones color={palette.background} size={14} strokeWidth={2} />} tint={categoryColors.ACCESSORIES} angle={210} radius={ringSizes[1] / 2} />
      </Animated.View>

      {/* Orbital C — inner */}
      <Animated.View
        style={[
          styles.orbit,
          { width: ringSizes[2], height: ringSizes[2], top: (size - ringSizes[2]) / 2, left: (size - ringSizes[2]) / 2 },
          ringC,
        ]}
      >
        <OrbitDot icon={<Package color={palette.background} size={12} strokeWidth={2} />} tint={categoryColors.OTHER} angle={45} radius={ringSizes[2] / 2} small />
      </Animated.View>

      {/* Center sun */}
      <View style={styles.centerWrap}>
        <View style={styles.centerRing}>
          <Image
            source={require('@/assets/images/orbit-logo.png')}
            style={styles.centerLogo}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}

function OrbitDot({
  icon,
  tint,
  angle,
  radius,
  small,
}: {
  icon: React.ReactNode;
  tint: string;
  angle: number;
  radius: number;
  small?: boolean;
}) {
  const sz = small ? 22 : 28;
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;
  return (
    <View
      style={[
        styles.dot,
        {
          backgroundColor: tint,
          width: sz,
          height: sz,
          borderRadius: sz / 2,
          left: '50%',
          top: '50%',
          transform: [{ translateX: x - sz / 2 }, { translateY: y - sz / 2 }],
        },
      ]}
    >
      {icon}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
  },
  orbit: {
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  centerWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.hairlineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLogo: {
    width: 56,
    height: 56,
  },
});
