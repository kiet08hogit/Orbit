import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter, useSegments, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { categoryLabels, palette, spacing } from '@/theme';
import { Pill } from './ui/Pill';
import type { ListingCategory } from '@/lib/types';

/** Mirrors frontend/app/ClientNav.tsx order and labels. */
const NAV_ITEMS: Array<{
  key: ListingCategory | 'HOME' | 'SWIPE';
  label: string;
  category?: ListingCategory;
}> = [
  { key: 'HOME', label: 'Home' },
  { key: 'SWIPE', label: 'Match your needs' },
  { key: 'DORM', label: categoryLabels.DORM, category: 'DORM' },
  { key: 'SUBLEASE', label: categoryLabels.SUBLEASE, category: 'SUBLEASE' },
  { key: 'CLOTHES', label: categoryLabels.CLOTHES, category: 'CLOTHES' },
  { key: 'SCHOOL', label: categoryLabels.SCHOOL, category: 'SCHOOL' },
  { key: 'LEISURE', label: categoryLabels.LEISURE, category: 'LEISURE' },
  { key: 'ACCESSORIES', label: categoryLabels.ACCESSORIES, category: 'ACCESSORIES' },
  { key: 'OTHER', label: categoryLabels.OTHER, category: 'OTHER' },
  { key: 'SERVICES', label: categoryLabels.SERVICES, category: 'SERVICES' },
];

export type CategoryRailValue = ListingCategory | 'HOME' | 'SWIPE';

interface Props {
  value?: CategoryRailValue;
}

export function CategoryRail({ value }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  // Auto-detect active based on route if no value provided
  const segments = useSegments();
  const params = useLocalSearchParams();
  
  let activeValue = value;
  if (activeValue == null) {
    if (segments[segments.length - 1] === 'home') activeValue = 'HOME';
    else if (segments[segments.length - 1] === 'swipe') activeValue = 'SWIPE';
    else if (params.category) activeValue = params.category as ListingCategory;
  }

  const onPress = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.key === 'HOME') {
      router.push('/(tabs)/home');
      return;
    }
    if (item.key === 'SWIPE') {
      router.push('/(tabs)/swipe');
      return;
    }
    router.push({ pathname: '/listings', params: { category: item.category } } as any);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    setShowLeft(contentOffset.x > 0);
    setShowRight(contentOffset.x + layoutMeasurement.width < contentSize.width - 1);
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={styles.bar}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {NAV_ITEMS.map((item, i) => (
          <React.Fragment key={item.key}>
            {i === 2 ? <View style={styles.divider} /> : null}
            <Pill
              label={item.label}
              tone="nav"
              selected={activeValue != null && activeValue === item.key}
              onPress={() => onPress(item)}
            />
          </React.Fragment>
        ))}
      </ScrollView>

      {/* Left Gradient & Chevron */}
      {showLeft && (
        <View style={[styles.gradientWrapper, styles.leftGradient]} pointerEvents="none">
          <LinearGradient
            colors={[palette.background, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          />
          <View style={[styles.iconContainer, { left: 4 }]}>
            <ChevronLeft size={20} color={palette.muted} strokeWidth={2} />
          </View>
        </View>
      )}

      {/* Right Gradient & Chevron */}
      {showRight && (
        <View style={[styles.gradientWrapper, styles.rightGradient]} pointerEvents="none">
          <LinearGradient
            colors={['transparent', palette.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          />
          <View style={[styles.iconContainer, { right: 4 }]}>
            <ChevronRight size={20} color={palette.muted} strokeWidth={2} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.background,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  bar: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: palette.border,
    marginHorizontal: spacing.xs,
  },
  gradientWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 48,
    justifyContent: 'center',
  },
  leftGradient: {
    left: 0,
  },
  rightGradient: {
    right: 0,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  iconContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.4,
    elevation: 2,
  },
});
