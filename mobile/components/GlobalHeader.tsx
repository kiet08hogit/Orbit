import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, Heart, Plus, Search } from 'lucide-react-native';
import { palette, spacing, type, hitSlop, radius } from '@/theme';
import { listingsApi, notificationsApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';

/**
 * Mobile counterpart of the web GlobalNav: logo, search entry point,
 * create listing, wishlist + notification badges.
 */
export function GlobalHeader() {
  const router = useRouter();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const refresh = useCallback(() => {
    listingsApi
      .wishlistCount()
      .then((r) => setWishlistCount(r.count))
      .catch(() => {});
    notificationsApi
      .unreadCount()
      .then((r) => setUnreadNotifications(r.unreadCount))
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onWishlist = () => refresh();
    const onNotification = () => setUnreadNotifications((n) => n + 1);
    socket.on('update_wishlist_count', onWishlist);
    socket.on('new_notification', onNotification);
    return () => {
      socket.off('update_wishlist_count', onWishlist);
      socket.off('new_notification', onNotification);
    };
  }, [refresh]);

  return (
    <View style={styles.bar}>
      <Pressable
        style={styles.brand}
        onPress={() => router.push('/(tabs)/home')}
        accessibilityLabel="Orbit home"
      >
        <Image source={require('@/assets/images/orbit-logo.png')} style={styles.logo} />
        <Text style={styles.brandText}>Orbit</Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          hitSlop={hitSlop}
          onPress={() => router.push('/listings' as any)}
          accessibilityLabel="Search listings"
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Search color={palette.foreground} size={18} strokeWidth={1.6} />
        </Pressable>

        <Pressable
          hitSlop={hitSlop}
          onPress={() => router.push('/wishlist' as any)}
          accessibilityLabel="Wishlist"
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Heart color={palette.foreground} size={18} strokeWidth={1.6} />
          {wishlistCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{wishlistCount > 9 ? '9+' : wishlistCount}</Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable
          hitSlop={hitSlop}
          onPress={() => router.push('/notifications' as any)}
          accessibilityLabel="Notifications"
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Bell color={palette.foreground} size={18} strokeWidth={1.6} />
          {unreadNotifications > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable
          hitSlop={hitSlop}
          onPress={() => router.push('/add-product')}
          accessibilityLabel="Create listing"
          style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.9 }]}
        >
          <Plus color={palette.primaryForeground} size={14} strokeWidth={2.4} />
          <Text style={styles.createLabel}>Create Listing</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    backgroundColor: palette.background,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  brand: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 36, height: 36 },
  brandText: {
    ...type.titleMd,
    fontSize: 22,
    color: palette.foreground,
    letterSpacing: -0.8,
    marginLeft: -2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    ...type.monoSm,
    fontSize: 9,
    lineHeight: 11,
    color: palette.primaryForeground,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
  },
  createLabel: {
    ...type.button,
    fontSize: 12,
    color: palette.primaryForeground,
  },
});
