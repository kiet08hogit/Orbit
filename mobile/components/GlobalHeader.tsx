import React, { useCallback, useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View, TouchableWithoutFeedback } from 'react-native';
import { useFocusEffect, useRouter, usePathname } from 'expo-router';
import { Bell, ChevronDown, Heart, Menu, MessageCircle, Plus, Search } from 'lucide-react-native';
import { palette, spacing, type, hitSlop, radius } from '@/theme';
import { chatApi, listingsApi, notificationsApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Sidebar } from './Sidebar';

/**
 * Mobile counterpart of the web GlobalNav: logo, search entry point,
 * create listing, wishlist + notification badges.
 */
export function GlobalHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const refresh = useCallback(() => {
    listingsApi
      .wishlistCount()
      .then((r) => setWishlistCount(r.count))
      .catch(() => {});
    notificationsApi
      .unreadCount()
      .then((r) => setUnreadNotifications(r.unreadCount))
      .catch(() => {});
    chatApi
      .unreadCount()
      .then((r) => setUnreadChatCount(r.count))
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
    const onMessage = () => refresh();
    socket.on('update_wishlist_count', onWishlist);
    socket.on('new_notification', onNotification);
    socket.on('receive_message', onMessage);
    return () => {
      socket.off('update_wishlist_count', onWishlist);
      socket.off('new_notification', onNotification);
      socket.off('receive_message', onMessage);
    };
  }, [refresh]);

  const currentLabel = pathname?.includes('community') ? 'Community' : 'Marketplace';

  return (
    <>
      <View style={styles.bar}>
        <View style={styles.brandContainer}>
          <Pressable
            style={styles.brand}
            onPress={() => setShowDropdown(true)}
            accessibilityLabel="Switch between Marketplace and Community"
          >
            <Image source={require('@/assets/images/orbit-logo.png')} style={styles.logo} />
            <Text style={styles.brandText}>{currentLabel}</Text>
            <ChevronDown color={palette.foreground} size={16} strokeWidth={2} style={{ marginLeft: 4 }} />
          </Pressable>
        </View>

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
            onPress={() => router.push('/(tabs)/chat' as any)}
            accessibilityLabel="Chat"
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <MessageCircle color={palette.foreground} size={18} strokeWidth={1.6} />
            {unreadChatCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadChatCount > 9 ? '9+' : unreadChatCount}</Text>
              </View>
            ) : null}
          </Pressable>
          
          <Pressable
            hitSlop={hitSlop}
            onPress={() => setIsSidebarOpen(true)}
            accessibilityLabel="Menu"
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Menu color={palette.foreground} size={18} strokeWidth={1.6} />
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
            <Text style={styles.createLabel}>Sell</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownContent}>
                <Pressable
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowDropdown(false);
                    router.push('/(tabs)/home');
                  }}
                >
                  <Text style={[styles.dropdownItemText, currentLabel === 'Marketplace' && styles.dropdownItemTextActive]}>Marketplace</Text>
                </Pressable>
                <View style={styles.dropdownDivider} />
                <Pressable
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowDropdown(false);
                    router.push('/(tabs)/community');
                  }}
                >
                  <Text style={[styles.dropdownItemText, currentLabel === 'Community' && styles.dropdownItemTextActive]}>Community</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        wishlistCount={wishlistCount}
        unreadNotifications={unreadNotifications}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    backgroundColor: palette.background,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  brandContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: palette.secondary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  logo: { width: 24, height: 24, marginRight: 4 },
  brandText: {
    ...type.monoSm,
    fontSize: 13,
    color: palette.foreground,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: { position: 'relative', padding: 2 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
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
    gap: 2,
    height: 28,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: palette.primary,
  },
  createLabel: {
    ...type.button,
    fontSize: 11,
    color: palette.primaryForeground,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  dropdownContent: {
    marginTop: 64, // below header
    marginLeft: spacing.base,
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    padding: spacing.xs,
    width: 160,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
  },
  dropdownItemText: {
    ...type.body,
    fontSize: 15,
    color: palette.mutedForeground,
  },
  dropdownItemTextActive: {
    color: palette.foreground,
    fontFamily: type.titleMd.fontFamily,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: 4,
  },
});
