import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { palette, spacing, type } from '@/theme';
import { Screen, Avatar, EmptyState } from '@/components/ui';
import { useConversations } from '@/hooks/useConversations';
import { formatRelative } from '@/lib/format';
import type { Conversation } from '@/lib/types';

export default function ChatTab() {
  const router = useRouter();
  const { data, loading } = useConversations();

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={[type.captionUpper, { color: palette.muted }]}>MESSAGES</Text>
        <Text style={[type.displayLg, { color: palette.foreground }]}>Inbox</Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.foreground} />
        </View>
      ) : data.length === 0 ? (
        <EmptyState
          eyebrow="ALL CLEAR"
          title="Your inbox is quiet"
          body="Start a conversation from any listing — sellers respond fastest within an hour."
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(c) => c.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              onPress={() => router.push(`/chat/${item.id}` as any)}
            />
          )}
        />
      )}
    </Screen>
  );
}

function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: Conversation;
  onPress: () => void;
}) {
  const other = conversation.participants[1] ?? conversation.participants[0];
  const last = conversation.lastMessage;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: palette.card }]}
    >
      <Avatar name={other.name} uri={other.avatarUrl} size={44} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[type.bodyStrong, { color: palette.foreground }]} numberOfLines={1}>
            {other.name}
          </Text>
          <Text style={[type.monoSm, { color: palette.muted }]}>
            {formatRelative(conversation.updatedAt)}
          </Text>
        </View>
        <View style={styles.rowBottom}>
          <Text
            style={[
              type.body,
              { color: conversation.unread ? palette.foreground : palette.body, flex: 1 },
            ]}
            numberOfLines={1}
          >
            {last?.content ?? 'No messages yet'}
          </Text>
          {conversation.unread ? <View style={styles.dot} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.hairline,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    alignItems: 'center',
  },
  rowBody: { flex: 1, marginLeft: spacing.sm },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: spacing.xs,
  },
  separator: {
    height: 1,
    backgroundColor: palette.hairlineSoft,
    marginLeft: spacing.base + 44 + spacing.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.accent },
});
