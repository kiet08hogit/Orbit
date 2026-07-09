import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { palette, radius, spacing, type } from '@/theme';
import { Screen, AppHeader, Avatar, Button, EmptyState } from '@/components/ui';
import { adminApi, getImageUrl } from '@/lib/api';
import type { User } from '@/lib/types';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    adminApi
      .users()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggleBan = (user: User) => {
    const banning = !user.isBanned;
    Alert.alert(
      banning ? 'Ban user' : 'Unban user',
      `${user.name ?? user.email} will ${banning ? 'lose' : 'regain'} access to Orbit.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: banning ? 'Ban' : 'Unban',
          style: banning ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await adminApi.banUser(user.id, banning);
              load();
            } catch (e) {
              Alert.alert('Failed', e instanceof Error ? e.message : 'Try again.');
            }
          },
        },
      ],
    );
  };

  const warn = (user: User) => {
    const send = async (message: string) => {
      try {
        await adminApi.warnUser(user.id, 'Community guidelines warning', message);
        Alert.alert('Sent', 'Warning delivered.');
      } catch (e) {
        Alert.alert('Failed', e instanceof Error ? e.message : 'Try again.');
      }
    };
    if (Platform.OS === 'ios') {
      Alert.prompt('Warn user', `Send a warning notification to ${user.name ?? user.email}.`, (message) => {
        if (message?.trim()) send(message.trim());
      });
    } else {
      Alert.alert('Warn user', `Send a standard warning to ${user.name ?? user.email}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: () => send('Please review the Orbit community guidelines.') },
      ]);
    }
  };

  return (
    <Screen padded={false}>
      <AppHeader back title="Users" eyebrow="ADMIN" />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.foreground} />
        </View>
      ) : users.length === 0 ? (
        <EmptyState eyebrow="EMPTY" title="No users found" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Avatar
                name={item.name ?? item.email ?? '?'}
                uri={getImageUrl(item.avatarUrl) || undefined}
                size={40}
              />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={[type.bodyStrong, { color: palette.foreground }]} numberOfLines={1}>
                  {item.name ?? item.username ?? '—'}
                </Text>
                <Text style={[type.caption, { color: palette.muted }]} numberOfLines={1}>
                  {item.email}
                </Text>
                {item.isBanned ? (
                  <Text style={[type.captionUpper, { color: palette.error, marginTop: 2 }]}>
                    BANNED
                  </Text>
                ) : null}
              </View>
              <View style={styles.actions}>
                <Button label="Warn" variant="secondary" onPress={() => warn(item)} />
                <Button
                  label={item.isBanned ? 'Unban' : 'Ban'}
                  variant={item.isBanned ? 'secondary' : 'destructive'}
                  onPress={() => toggleBan(item)}
                />
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.base, paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  actions: { gap: spacing.xs },
});
