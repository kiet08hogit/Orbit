import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { ImagePlus, Send } from 'lucide-react-native';
import { palette, radius, spacing, type } from '@/theme';
import { AppHeader, Input, Avatar } from '@/components/ui';
import { chatApi, getImageUrl } from '@/lib/api';
import { formatRelative } from '@/lib/format';
import { getSocket } from '@/lib/socket';
import type { Message, User } from '@/lib/types';

export default function Thread() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const id = conversationId || '';
  const { user } = useUser();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [other, setOther] = useState<User | undefined>();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const load = useCallback(async () => {
    try {
      const data = await chatApi.messages(id);
      setMessages(data);
      const someoneElse = data.find((m) => m.sender && m.sender.clerkUserId !== user?.id)?.sender;
      if (someoneElse) setOther(someoneElse);
    } catch {
      // leave empty state
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onMessage = (msg: Message) => {
      if (msg.conversationId !== id) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      socket.emit('mark_read', { conversationId: id });
    };
    socket.on('receive_message', onMessage);
    socket.emit('mark_read', { conversationId: id });
    return () => {
      socket.off('receive_message', onMessage);
    };
  }, [id]);

  const send = () => {
    const content = draft.trim();
    if (!content) return;
    setDraft('');
    getSocket()?.emit('send_message', { conversationId: id, content });
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const pickAndSendImage = async () => {
    if (busy) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.8,
    });
    if (res.canceled) return;
    
    setBusy(true);
    try {
      const form = new FormData();
      res.assets.forEach((a, i) => {
        form.append('images', {
          uri: a.uri,
          name: `chat-${i}.jpg`,
          type: 'image/jpeg',
        } as unknown as Blob);
      });
      const msg = await chatApi.sendImages(id, form);
      // Let the socket handle updating the UI for consistency, but we can optimistically scroll
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <AppHeader 
          back 
          title={other?.name ?? other?.username ?? 'Conversation'} 
          trailing={
            other ? (
              <Pressable onPress={() => router.push(`/profile/${other.clerkUserId}` as any)}>
                <Avatar name={other.name ?? '?'} uri={getImageUrl(other.avatarUrl) || undefined} size={32} />
              </Pressable>
            ) : null
          }
        />
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={palette.foreground} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <Bubble message={item} myClerkId={user?.id} />}
            ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Pressable onPress={pickAndSendImage} accessibilityLabel="Send Image" hitSlop={8} disabled={busy}>
                  {busy ? <ActivityIndicator size="small" color={palette.muted} /> : <ImagePlus color={palette.muted} size={20} strokeWidth={1.6} />}
                </Pressable>
                <Pressable onPress={send} accessibilityLabel="Send" hitSlop={8}>
                  <View style={[styles.sendBtn, !draft && { opacity: 0.4 }]}>
                    <Send color={palette.background} size={14} strokeWidth={2} />
                  </View>
                </Pressable>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ message, myClerkId }: { message: Message; myClerkId?: string }) {
  const mine = message.sender?.clerkUserId === myClerkId;
  return (
    <View style={[styles.bubbleRow, mine ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
      {!mine ? (
        <Avatar
          name={message.sender?.name ?? '?'}
          uri={getImageUrl(message.sender?.avatarUrl) || undefined}
          size={28}
        />
      ) : null}
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        {message.replyTo ? (
          <View style={styles.replyPreview}>
            <Text
              style={[type.caption, { color: mine ? `${palette.background}aa` : palette.muted }]}
              numberOfLines={1}
            >
              ↩ {message.replyTo.content}
            </Text>
          </View>
        ) : null}
        
        {message.imageUrls && message.imageUrls.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: message.content ? 4 : 0 }}>
            {message.imageUrls.map(url => (
              <Image 
                key={url} 
                source={{ uri: getImageUrl(url) }} 
                style={styles.chatImage} 
                contentFit="cover" 
              />
            ))}
          </View>
        ) : null}

        {message.content ? (
          <Text style={[type.body, { color: mine ? palette.background : palette.foreground }]}>
            {message.content}
          </Text>
        ) : null}
        
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
  replyPreview: {
    borderLeftWidth: 2,
    borderLeftColor: palette.accent,
    paddingLeft: spacing.xs,
    marginBottom: 4,
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
  chatImage: {
    width: 120,
    height: 120,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});
