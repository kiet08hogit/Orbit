import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import { palette } from '@/theme';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Marker locations as [latitude, longitude] — same cities as the web cobe globe. */
const MARKERS: Array<[number, number, number]> = [
  [14.6, 120.98, 3],
  [19.08, 72.88, 5],
  [30.04, 31.24, 4],
  [39.9, 116.4, 4.5],
  [-23.55, -46.63, 5],
  [19.43, -99.13, 5],
  [40.71, -74.0, 5],
  [41.0, 28.98, 3.5],
];

const MERIDIAN_COUNT = 5;
const PARALLELS = [-50, -25, 0, 25, 50];

/**
 * React Native stand-in for `frontend/components/ui/globe.tsx` (cobe/WebGL).
 * A slowly spinning orthographic wireframe globe: static parallels, meridians
 * whose apparent width breathes with the rotation, and Cursor-Orange markers
 * that traverse the surface and fade behind the horizon.
 */
export function Globe({ size = 320 }: { size?: number }) {
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(1, { duration: 24000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [spin]);

  const r = size / 2 - 4;
  const c = size / 2;

  return (
    <View style={[styles.root, { width: size, height: size }]} pointerEvents="none">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Sphere silhouette */}
        <Circle cx={c} cy={c} r={r} stroke="rgba(247,247,244,0.28)" strokeWidth={1.2} fill="rgba(247,247,244,0.04)" />

        {/* Parallels — fixed under a vertical-axis spin */}
        {PARALLELS.map((lat) => {
          const latRad = (lat * Math.PI) / 180;
          const rx = r * Math.cos(latRad);
          const cy = c - r * Math.sin(latRad) * 0.98;
          return (
            <Ellipse
              key={`p${lat}`}
              cx={c}
              cy={cy}
              rx={rx}
              ry={rx * 0.16}
              stroke="rgba(247,247,244,0.14)"
              strokeWidth={1}
              fill="none"
            />
          );
        })}

        {/* Meridians — rx breathes as the globe turns */}
        {Array.from({ length: MERIDIAN_COUNT }).map((_, i) => (
          <Meridian key={`m${i}`} index={i} spin={spin} c={c} r={r} />
        ))}

        {/* Markers */}
        {MARKERS.map(([lat, lon, s], i) => (
          <Marker key={`mk${i}`} lat={lat} lon={lon} size={s} spin={spin} c={c} r={r} />
        ))}
      </Svg>
    </View>
  );
}

function Meridian({
  index,
  spin,
  c,
  r,
}: {
  index: number;
  spin: SharedValue<number>;
  c: number;
  r: number;
}) {
  const props = useAnimatedProps(() => {
    const phase = spin.value * 2 * Math.PI + (index * Math.PI) / MERIDIAN_COUNT;
    const rx = Math.abs(Math.cos(phase)) * r;
    const front = Math.sin(phase) >= 0;
    return {
      rx: Math.max(rx, 0.5),
      opacity: front ? 0.16 : 0.07,
    };
  });

  return (
    <AnimatedEllipse
      animatedProps={props}
      cx={c}
      cy={c}
      ry={r}
      stroke="rgba(247,247,244,1)"
      strokeWidth={1}
      fill="none"
    />
  );
}

function Marker({
  lat,
  lon,
  size,
  spin,
  c,
  r,
}: {
  lat: number;
  lon: number;
  size: number;
  spin: SharedValue<number>;
  c: number;
  r: number;
}) {
  const props = useAnimatedProps(() => {
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180 + spin.value * 2 * Math.PI;
    const depth = Math.cos(latRad) * Math.cos(lonRad); // >0 → front hemisphere
    return {
      cx: c + r * Math.cos(latRad) * Math.sin(lonRad),
      cy: c - r * Math.sin(latRad) * 0.98,
      opacity: depth > 0.05 ? Math.min(depth + 0.25, 1) : 0,
    };
  });

  return <AnimatedCircle animatedProps={props} r={size} fill={palette.accent} />;
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
