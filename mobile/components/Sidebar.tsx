import React, { useCallback, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Bell,
  Check,
  ChevronRight,
  Clock,
  Heart,
  HelpCircle,
  Info,
  LogOut,
  Settings,
  Shield,
  Tag,
  Wallet,
  X,
  User as UserIcon,
} from 'lucide-react-native';
import { useAuth } from '@clerk/clerk-expo';
import { palette, spacing, type, radius } from '@/theme';
import { Avatar, Card, Button, Divider } from '@/components/ui';
import { listingsApi, paymentsApi, reviewsApi, usersApi, getImageUrl } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';
import type { Listing, ReviewsResponse, User } from '@/lib/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistCount?: number;
  unreadNotifications?: number;
}

export function Sidebar({ isOpen, onClose, wishlistCount = 0, unreadNotifications = 0 }: SidebarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  
  const [me, setMe] = useState<User | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<ReviewsResponse | null>(null);
  const [stripeLinked, setStripeLinked] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // We only fetch when the sidebar is opened
  useFocusEffect(
    useCallback(() => {
      if (!isOpen) return;
      usersApi
        .me()
        .then((user) => {
          setMe(user);
          if (user.id) {
            reviewsApi.forUser(user.id).then(setReviews).catch(() => {});
          }
        })
        .catch(() => {});
      listingsApi.myListings().then(setMyListings).catch(() => {});
      paymentsApi
        .connectStatus()
        .then((s) => setStripeLinked(s.linked))
        .catch(() => {});
    }, [isOpen]),
  );

  const startStripeConnect = async () => {
    setConnecting(true);
    try {
      const { url } = await paymentsApi.startConnect();
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Could not open Stripe', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setConnecting(false);
    }
  };

  const displayName = me?.name ?? me?.username ?? 'You';

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        
        <View style={[styles.drawer, { paddingTop: Math.max(insets.top, spacing.base), paddingBottom: Math.max(insets.bottom, spacing.base) }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Menu</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <X color={palette.foreground} size={24} strokeWidth={1.5} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
            {/* Identity */}
            <Pressable 
              style={styles.idWrap} 
              onPress={() => {
                onClose();
                router.push('/(tabs)/profile');
              }}
            >
              <Avatar name={displayName} uri={getImageUrl(me?.avatarUrl) || undefined} size={56} />
              <View style={styles.idTextWrap}>
                <Text style={[type.displayMd, { color: palette.foreground, fontSize: 18 }]}>{displayName}</Text>
                <Text style={[type.mono, { color: palette.muted, marginTop: 2, fontSize: 12 }]}>
                  {me?.username ? `@${me.username}` : me?.email ?? ''}
                </Text>
              </View>
              <ChevronRight color={palette.muted} size={18} strokeWidth={1.6} />
            </Pressable>

            {/* Activity */}
            <View style={styles.section}>
              <Text style={[type.captionUpper, styles.sectionLabel]}>ACTIVITY</Text>
              <Card padded={false}>
                <Row icon={<Heart color={palette.body} size={18} strokeWidth={1.6} />} label="Wishlist" badgeCount={wishlistCount} onPress={() => { onClose(); router.push('/wishlist' as any); }} />
                <Divider strength="soft" />
                <Row icon={<Bell color={palette.body} size={18} strokeWidth={1.6} />} label="Notifications" badgeCount={unreadNotifications} onPress={() => { onClose(); router.push('/notifications' as any); }} />
                <Divider strength="soft" />
                <Row icon={<Tag color={palette.body} size={18} strokeWidth={1.6} />} label="Offers" onPress={() => { onClose(); router.push('/offers' as any); }} />
                <Divider strength="soft" />
                <Row icon={<Clock color={palette.body} size={18} strokeWidth={1.6} />} label="Purchase history" onPress={() => { onClose(); router.push('/purchase-history' as any); }} />
                <Divider strength="soft" />
                <Row icon={<UserIcon color={palette.body} size={18} strokeWidth={1.6} />} label="My Listings" onPress={() => { onClose(); router.push('/(tabs)/profile' as any); }} />
              </Card>
            </View>

            {/* Settings */}
            <View style={styles.section}>
              <Text style={[type.captionUpper, styles.sectionLabel]}>SETTINGS</Text>
              <Card padded={false}>
                <Row icon={<Settings color={palette.body} size={18} strokeWidth={1.6} />} label="Preferences" onPress={() => { onClose(); router.push('/settings' as any); }} />
                <Divider strength="soft" />
                <Row icon={<Info color={palette.body} size={18} strokeWidth={1.6} />} label="About Orbit" onPress={() => { onClose(); router.push('/about' as any); }} />
                <Divider strength="soft" />
                <Row icon={<HelpCircle color={palette.body} size={18} strokeWidth={1.6} />} label="FAQs" onPress={() => { onClose(); router.push('/faqs' as any); }} />
                {me?.role === 'ADMIN' ? (
                  <>
                    <Divider strength="soft" />
                    <Row icon={<Shield color={palette.body} size={18} strokeWidth={1.6} />} label="Admin dashboard" onPress={() => { onClose(); router.push('/admin' as any); }} />
                  </>
                ) : null}
                <Divider strength="soft" />
                <Row
                  icon={<LogOut color={palette.error} size={18} strokeWidth={1.6} />}
                  label="Sign out"
                  destructive
                  onPress={async () => {
                    onClose();
                    try {
                      disconnectSocket();
                      await signOut();
                    } catch {}
                    router.replace('/');
                  }}
                />
              </Card>
            </View>
            
            {/* Stripe Connect card */}
            <View style={styles.section}>
              <Text style={[type.captionUpper, styles.sectionLabel]}>PAYMENTS</Text>
              <Card padded>
                <View style={styles.payRow}>
                  {stripeLinked ? (
                    <Check color={palette.success} size={20} strokeWidth={1.8} />
                  ) : (
                    <Wallet color={palette.accent} size={20} strokeWidth={1.6} />
                  )}
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={[type.bodyStrong, { color: palette.foreground }]}>
                      {stripeLinked ? 'Stripe connected' : 'Connect Stripe'}
                    </Text>
                  </View>
                </View>
                {!stripeLinked ? (
                  <Button
                    label={connecting ? 'Opening Stripe…' : 'Set up'}
                    variant="secondary"
                    loading={connecting}
                    onPress={startStripeConnect}
                    style={{ marginTop: spacing.base, height: 36 }}
                  />
                ) : null}
              </Card>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Row({ icon, label, destructive, onPress, badgeCount = 0 }: { icon: React.ReactNode; label: string; destructive?: boolean; onPress: () => void; badgeCount?: number; }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, pressed && { backgroundColor: palette.surfaceElevated }]}
    >
      {icon}
      <Text style={[type.body, { color: destructive ? palette.error : palette.foreground, flex: 1, marginLeft: spacing.sm }]}>
        {label}
      </Text>
      {badgeCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
        </View>
      ) : (
        <ChevronRight color={palette.muted} size={16} strokeWidth={1.6} />
      )}
    </Pressable>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    width: Math.min(width * 0.8, 340),
    backgroundColor: palette.background,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  headerTitle: {
    ...type.titleMd,
    color: palette.foreground,
  },
  closeBtn: {
    padding: spacing.xs,
    marginRight: -spacing.xs,
  },
  idWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    backgroundColor: palette.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.border,
  },
  idTextWrap: {
    flex: 1,
    marginLeft: spacing.base,
  },
  section: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.lg,
  },
  sectionLabel: { color: palette.muted, marginBottom: spacing.sm },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  payRow: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...type.monoSm,
    fontSize: 10,
    lineHeight: 12,
    color: palette.primaryForeground,
  },
});
