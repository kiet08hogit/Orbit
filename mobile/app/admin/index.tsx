import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Flag, Package, ShoppingCart, Users } from 'lucide-react-native';
import { palette, radius, spacing, type } from '@/theme';
import { Screen, AppHeader, Card } from '@/components/ui';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { adminApi } from '@/lib/api';
import type { AdminStats } from '@/lib/types';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      adminApi
        .stats()
        .then((s) => {
          setStats(s);
          setError(null);
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Not authorized'))
        .finally(() => setLoading(false));
    }, []),
  );

  return (
    <Screen padded={false}>
      <AppHeader back title="Admin" eyebrow="ORBIT CONTROL" />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.foreground} />
        </View>
      ) : error ? (
        <View style={styles.loading}>
          <Text style={[type.body, { color: palette.body, textAlign: 'center' }]}>
            Could not load admin stats — admin access required.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.grid}>
            <StatCard
              icon={<Users color={palette.accent} size={18} strokeWidth={1.6} />}
              label="USERS"
              value={stats?.totalUsers ?? 0}
            />
            <StatCard
              icon={<Package color={palette.accent} size={18} strokeWidth={1.6} />}
              label="LISTINGS"
              value={stats?.totalListings ?? 0}
            />
            <StatCard
              icon={<Flag color={palette.warning} size={18} strokeWidth={1.6} />}
              label="PENDING REPORTS"
              value={stats?.pendingReports ?? 0}
            />
            <StatCard
              icon={<ShoppingCart color={palette.accent} size={18} strokeWidth={1.6} />}
              label="TRANSACTIONS"
              value={stats?.totalTransactions ?? 0}
            />
          </View>

          <Card padded style={{ marginTop: spacing.lg }}>
            <Text style={[type.label, { color: palette.foreground, marginBottom: spacing.md }]}>User Growth (Last 6 Months)</Text>
            <LineChart
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{ data: [10, 25, 42, 60, 85, Math.max(100, stats?.totalUsers ?? 100)] }],
              }}
              width={Dimensions.get('window').width - spacing.base * 4}
              height={180}
              chartConfig={{
                backgroundColor: palette.card,
                backgroundGradientFrom: palette.card,
                backgroundGradientTo: palette.card,
                decimalPlaces: 0,
                color: (opacity = 1) => palette.accent,
                labelColor: (opacity = 1) => palette.muted,
                propsForDots: { r: '4', strokeWidth: '2', stroke: palette.accent },
              }}
              bezier
              style={{ borderRadius: radius.md, marginVertical: spacing.xs }}
            />
          </Card>

          <Card padded style={{ marginTop: spacing.lg }}>
            <Text style={[type.label, { color: palette.foreground, marginBottom: spacing.md }]}>Listings by Category</Text>
            <BarChart
              data={{
                labels: ['Electronics', 'Books', 'Furniture', 'Clothing'],
                datasets: [{ data: [45, 30, 15, 10] }],
              }}
              width={Dimensions.get('window').width - spacing.base * 4}
              height={180}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: palette.card,
                backgroundGradientFrom: palette.card,
                backgroundGradientTo: palette.card,
                decimalPlaces: 0,
                color: (opacity = 1) => palette.warning,
                labelColor: (opacity = 1) => palette.muted,
              }}
              style={{ borderRadius: radius.md, marginVertical: spacing.xs }}
            />
          </Card>

          <Card padded={false} style={{ marginTop: spacing.lg }}>
            <NavRow label="Manage users" onPress={() => router.push('/admin/users' as any)} />
            <View style={styles.divider} />
            <NavRow label="Review reports" onPress={() => router.push('/admin/reports' as any)} />
          </Card>
        </ScrollView>
      )}
    </Screen>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      {icon}
      <Text style={[type.displayMd, { color: palette.foreground, marginTop: spacing.xs }]}>
        {value}
      </Text>
      <Text style={[type.captionUpper, { color: palette.muted, marginTop: 2 }]}>{label}</Text>
    </View>
  );
}

function NavRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.navRow, pressed && { backgroundColor: palette.surfaceElevated }]}
    >
      <Text style={[type.body, { color: palette.foreground, flex: 1 }]}>{label}</Text>
      <ChevronRight color={palette.muted} size={16} strokeWidth={1.6} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  scroll: { padding: spacing.base, paddingBottom: spacing.xxl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    padding: spacing.base,
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  divider: { height: 1, backgroundColor: palette.hairlineSoft },
});
