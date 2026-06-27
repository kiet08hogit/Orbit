import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { palette, radius, spacing, type } from '@/theme';
import { Screen, AppHeader, Input, Avatar } from '@/components/ui';
import { useMessages } from '@/hooks/useConversations';
import { mockUser } from '@/data/mock';
import { formatRelative } from '@/lib/format';
import { getSocket } from '@/lib/socket';
import type { Message } from '@/lib/types';

export default function Thread() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const id = conversationId || 'c1';
  const { data, appendLocal } = useMessages(id);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onMessage = (msg: Message) => {
      if (msg.conversationId === id) appendLocal(msg);
    };
    socket.on('message', onMessage);
    return () => {
      socket.off('message', onMessage);
    };
  }, [id, appendLocal]);

  const send = () => {
    const content = draft.trim();
    if (!content) return;
    const msg: Message = {
      id: `local-${Date.now()}`,
      conversationId: id,
      sender: mockUser,
      content,
      createdAt: new Date().toISOString(),
      read: false,
    };
    appendLocal(msg);
    setDraft('');
    getSocket()?.emit('send_message', { conversationId: id, content });
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AppHeader back title="Conversation" />
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <Bubble message={item} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

        <View style={styles.composer}>
          <Input
            placeholder="Type a message…"
            value={draft}
            onChangeText={setDraft}
            variant="pill"
            containerStyle={{ flex: 1 }}
            returnKeyType="send"
            onSubmitEditing={send}
            trailingIcon={
              <Pressable onPress={send} accessibilityLabel="Send" hitSlop={8}>
                <View style={[styles.sendBtn, !draft && { opacity: 0.4 }]}>
                  <Send color={palette.background} size={14} strokeWidth={2} />
                </View>
              </Pressable>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ message }: { message: Message }) {
  const mine = message.sender.id === mockUser.id;
  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
      {!mine ? <Avatar name={message.sender.name} size={28} /> : null}
      <View
        style={[
          styles.bubble,
          mine ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        <Text style={[type.body, { color: mine ? palette.background : palette.foreground }]}>
          {message.content}
        </Text>
        <Text
          style={[
            type.monoSm,
            { color: mine ? `${palette.background}99` : palette.muted, marginTop: 4 },
          ]}
        >
          {formatRelative(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  bubbleMine: {
    backgroundColor: palette.foreground,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: palette.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  composer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
    backgroundColor: palette.background,
    borderTopWidth: 1,
    borderTopColor: palette.hairline,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
