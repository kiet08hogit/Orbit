import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { palette, spacing, type } from '@/theme';
import { Screen, AppHeader, Avatar, EmptyState, Pill } from '@/components/ui';
import { notificationsApi, getImageUrl } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { formatRelative } from '@/lib/format';
import type { AppNotification } from '@/lib/types';

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'FOLLOW', label: 'Follows' },
  { key: 'LIKE', label: 'Likes' },
  { key: 'COMMENT', label: 'Comments' },
  { key: 'PURCHASE', label: 'Purchases' },
  { key: 'OFFER', label: 'Offers' },
  { key: 'WARNING', label: 'Warnings' },
];

export default function NotificationsScreen() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const load = useCallback(() => {
    notificationsApi
      .list(filter)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNew = () => load();
    socket.on('new_notification', onNew);
    return () => {
      socket.off('new_notification', onNew);
    };
  }, [load]);

  const markAll = async () => {
    try {
      await notificationsApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const open = async (n: AppNotification) => {
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      notificationsApi.markRead(n.id).catch(() => {});
    }
  };

  return (
    <Screen padded={false}>
      <AppHeader
        back
        title="Notifications"
        trailing={
          <Pressable onPress={markAll} hitSlop={8}>
            <Text style={[type.caption, { color: palette.accent }]}>Read all</Text>
          </Pressable>
        }
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ flexGrow: 0 }}
      >
        {FILTERS.map((f) => (
          <Pill key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.foreground} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          eyebrow="ALL CAUGHT UP"
          title="No notifications"
          body="Follows, likes, comments, and offers show up here."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => open(item)}
              style={({ pressed }) => [
                styles.row,
                !item.isRead && styles.rowUnread,
                pressed && { backgroundColor: palette.card },
              ]}
            >
              <Avatar
                name={item.actor?.name ?? 'Orbit'}
                uri={getImageUrl(item.actor?.avatarUrl) || undefined}
                size={40}
              />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={[type.bodyStrong, { color: palette.foreground }]}>{item.title}</Text>
                {item.content ? (
                  <Text style={[type.bodySm, { color: palette.body, marginTop: 2 }]} numberOfLines={2}>
                    {item.content}
                  </Text>
                ) : null}
                <Text style={[type.monoSm, { color: palette.muted, marginTop: 4 }]}>
                  {formatRelative(item.createdAt)}
                </Text>
              </View>
              {!item.isRead ? <View style={styles.dot} /> : null}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  separator: { height: 1, backgroundColor: palette.hairlineSoft },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  rowUnread: { backgroundColor: `${palette.accent}0d` },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.accent,
    marginTop: 6,
  },
});
