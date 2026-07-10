import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { palette, radius, spacing, type } from '@/theme';
import { Screen, AppHeader, Button, EmptyState } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { formatRelative } from '@/lib/format';
import type { Report } from '@/lib/types';

const STATUS_COLOR: Record<string, string> = {
  PENDING: palette.warning,
  RESOLVED: palette.success,
  DISMISSED: palette.muted,
};

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    adminApi
      .reports()
      .then(setReports)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const updateStatus = async (report: Report, status: 'RESOLVED' | 'DISMISSED') => {
    try {
      await adminApi.updateReport(report.id, status);
      load();
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Try again.');
    }
  };

  return (
    <Screen padded={false}>
      <AppHeader back title="Reports" eyebrow="ADMIN" />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.foreground} />
        </View>
      ) : reports.length === 0 ? (
        <EmptyState eyebrow="ALL CLEAR" title="No reports" body="Nothing needs review right now." />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text
                  style={[
                    type.captionUpper,
                    { color: STATUS_COLOR[item.status] ?? palette.muted },
                  ]}
                >
                  {item.status}
                </Text>
                <Text style={[type.caption, { color: palette.muted }]}>
                  {formatRelative(item.createdAt)}
                </Text>
              </View>
              <Text style={[type.bodyStrong, { color: palette.foreground, marginTop: spacing.xs }]}>
                {item.listing
                  ? `Listing: ${item.listing.title}`
                  : item.reportedUser
                    ? `User: ${item.reportedUser.name ?? item.reportedUser.email}`
                    : 'Report'}
              </Text>
              <Text style={[type.body, { color: palette.body, marginTop: 4 }]}>{item.reason}</Text>
              <Text style={[type.caption, { color: palette.muted, marginTop: spacing.xs }]}>
                Reported by {item.reporter?.name ?? item.reporter?.email ?? 'unknown'}
              </Text>
              {item.status === 'PENDING' ? (
                <View style={styles.actions}>
                  <Button label="Resolve" onPress={() => updateStatus(item, 'RESOLVED')} />
                  <Button
                    label="Dismiss"
                    variant="secondary"
                    onPress={() => updateStatus(item, 'DISMISSED')}
                  />
                </View>
              ) : null}
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
  card: {
    padding: spacing.base,
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
});
