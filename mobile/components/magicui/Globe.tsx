import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Defs, RadialGradient, Stop } from 'react-native-svg';

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

const MERIDIAN_COUNT = 7;
const PARALLELS = [-60, -40, -20, 0, 20, 40, 60];

export function Globe({ size = 320 }: { size?: number }) {
  const [spin, setSpin] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let start: number;
    const animate = (time: number) => {
      if (!start) start = time;
      const progress = ((time - start) % 18000) / 18000;
      setSpin(progress);
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const r = size / 2 - 8;
  const c = size / 2;

  return (
    <View style={[styles.root, { width: size, height: size }]} pointerEvents="none">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="globeGrad" cx="50%" cy="50%" rx="50%" ry="50%" fx="30%" fy="30%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <Stop offset="70%" stopColor="#d4d4d4" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#7a7a7a" stopOpacity="0.9" />
          </RadialGradient>
          <RadialGradient id="glowGrad" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="80%" stopColor="#ffffff" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Outer Glow */}
        <Circle cx={c} cy={c} r={size / 2} fill="url(#glowGrad)" />

        {/* Solid Sphere */}
        <Circle cx={c} cy={c} r={r} fill="url(#globeGrad)" />

        {/* Parallels (Latitudes) */}
        {PARALLELS.map((lat) => {
          const latRad = (lat * Math.PI) / 180;
          const rx = r * Math.cos(latRad);
          const cy = c - r * Math.sin(latRad);
          return (
            <Ellipse
              key={`p${lat}`}
              cx={c}
              cy={cy}
              rx={rx}
              ry={rx * 0.15}
              stroke="rgba(0,0,0,0.15)"
              strokeWidth={1}
              fill="none"
            />
          );
        })}

        {/* Meridians (Longitudes) */}
        {Array.from({ length: MERIDIAN_COUNT }).map((_, i) => (
          <Meridian key={`m${i}`} index={i} spin={spin} c={c} r={r} />
        ))}

        {/* Orange Markers */}
        {MARKERS.map(([lat, lon, s], i) => (
          <Marker key={`mk${i}`} lat={lat} lon={lon} size={s} spin={spin} c={c} r={r} />
        ))}
      </Svg>
    </View>
  );
}

function Meridian({ index, spin, c, r }: { index: number; spin: number; c: number; r: number }) {
  const progress = (spin + index / MERIDIAN_COUNT) % 1;
  let widthScale = Math.cos(progress * Math.PI * 2);
  const rx = Math.max(0.1, r * Math.abs(widthScale));
  const strokeOpacity = widthScale > 0 ? 0.25 : 0.05;

  return (
    <Ellipse
      cx={c}
      cy={c}
      ry={r}
      rx={rx}
      stroke="#000000"
      strokeWidth={0.8}
      strokeOpacity={strokeOpacity}
      fill="none"
    />
  );
}

function Marker({ lat, lon, size, spin, c, r }: { lat: number; lon: number; size: number; spin: number; c: number; r: number }) {
  const latRad = (lat * Math.PI) / 180;
  const yOffset = Math.sin(latRad) * r;
  const ringRadius = Math.cos(latRad) * r;
  const baseLonProgress = (lon + 180) / 360;
  const currentProgress = (baseLonProgress + spin) % 1;
  const angle = currentProgress * Math.PI * 2;
  const xOffset = Math.cos(angle) * ringRadius;
  const isFront = Math.sin(angle) > 0;

  return (
    <Circle 
      cx={c + xOffset}
      cy={c - yOffset}
      r={isFront ? size + 1.5 : size * 0.6}
      opacity={isFront ? 1 : 0.2}
      fill="#fb6415" 
    />
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
