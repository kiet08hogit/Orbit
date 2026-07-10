import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { palette, spacing, type } from '@/theme';
import { Screen, Avatar, EmptyState } from '@/components/ui';
import { chatApi, getImageUrl } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { formatRelative } from '@/lib/format';
import type { Conversation, Message, User } from '@/lib/types';

export default function ChatTab() {
  const router = useRouter();
  const { user } = useUser();
  const [data, setData] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    chatApi
      .inbox()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onMessage = () => load();
    socket.on('receive_message', onMessage);
    return () => {
      socket.off('receive_message', onMessage);
    };
  }, [load]);

  const myClerkId = user?.id;

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
              myClerkId={myClerkId}
              onPress={() => router.push(`/chat/${item.id}` as any)}
            />
          )}
        />
      )}
    </Screen>
  );
}

function otherMember(conversation: Conversation, myClerkId?: string): User | undefined {
  const members = conversation.members ?? [];
  const other = members.find((m) => m.user.clerkUserId !== myClerkId);
  return (other ?? members[0])?.user;
}

function ConversationRow({
  conversation,
  myClerkId,
  onPress,
}: {
  conversation: Conversation;
  myClerkId?: string;
  onPress: () => void;
}) {
  const other = otherMember(conversation, myClerkId);
  const last: Message | undefined = conversation.messages?.[0];
  const unread = !!last && !last.isRead && last.sender?.clerkUserId !== myClerkId;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: palette.card }]}
    >
      <Avatar
        name={other?.name ?? other?.username ?? '?'}
        uri={getImageUrl(other?.avatarUrl) || undefined}
        size={44}
      />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[type.bodyStrong, { color: palette.foreground }]} numberOfLines={1}>
            {other?.name ?? other?.username ?? 'Unknown'}
          </Text>
          <Text style={[type.monoSm, { color: palette.muted }]}>
            {formatRelative(conversation.updatedAt)}
          </Text>
        </View>
        <View style={styles.rowBottom}>
          <Text
            style={[
              type.body,
              { color: unread ? palette.foreground : palette.body, flex: 1 },
            ]}
            numberOfLines={1}
          >
            {last?.content || (last?.imageUrls?.length ? 'Sent a photo' : 'No messages yet')}
          </Text>
          {unread ? <View style={styles.dot} /> : null}
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
