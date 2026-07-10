import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  children?: React.ReactNode;
  /** Orbit radius in px (matches web magicui prop). */
  radius?: number;
  /** Seconds for one full revolution (matches web magicui prop). */
  duration?: number;
  /** Seconds of negative animation-delay — i.e. starting phase offset. */
  delay?: number;
  reverse?: boolean;
  /** Whether to draw the dashed orbit path. */
  path?: boolean;
  pathColor?: string;
  /** Diameter of the orbiting chip. */
  size?: number;
}

/**
 * React Native port of `frontend/components/magicui/orbiting-circles.tsx`.
 * Renders a dashed circular path and carries its child around it, keeping
 * the child upright via counter-rotation (same as the web keyframes).
 */
export default function OrbitingCircles({
  children,
  radius = 50,
  duration = 20,
  delay = 10,
  reverse,
  path = true,
  pathColor = 'rgba(255,255,255,0.2)',
  size = 50,
}: Props) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: duration * 1000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [duration, t]);

  const phase = (delay / duration) * 360;

  const orbitStyle = useAnimatedStyle(() => {
    const deg = (t.value * 360 + phase) * (reverse ? -1 : 1);
    return { transform: [{ rotate: `${deg}deg` }] };
  });

  const uprightStyle = useAnimatedStyle(() => {
    const deg = (t.value * 360 + phase) * (reverse ? -1 : 1);
    return { transform: [{ rotate: `${-deg}deg` }] };
  });

  const box = radius * 2 + size;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: box,
        height: box,
        marginLeft: -box / 2,
        marginTop: -box / 2,
      }}>
        {path && (
          <Svg
            width={box}
            height={box}
            viewBox={`0 0 ${box} ${box}`}
            style={{ position: 'absolute' }}
          >
            <Circle
              cx={box / 2}
              cy={box / 2}
              r={radius}
              stroke={pathColor}
              strokeWidth={1}
              strokeDasharray="4 4"
              fill="none"
            />
          </Svg>
        )}
        <Animated.View style={[{ width: box, height: box, position: 'absolute' }, orbitStyle]}>
          <Animated.View
            style={[
              styles.chip,
              { width: size, height: size, top: 0, left: box / 2 - size / 2 },
              uprightStyle,
            ]}
          >
            {children}
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
