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
import { ImagePlus, Send, MoreVertical, ChevronLeft } from 'lucide-react-native';
import { palette, radius, spacing, type } from '@/theme';
import { AppHeader, Input, Avatar } from '@/components/ui';
import { ImageViewerModal } from '@/components/ImageViewerModal';
import { chatApi, getImageUrl } from '@/lib/api';
import { formatRelative } from '@/lib/format';
import { getSocket } from '@/lib/socket';
import type { Message, User } from '@/lib/types';
import { LinkPreview } from '@/components/LinkPreview';
import { SharedMediaModal } from '@/components/SharedMediaModal';
import { SellerVerificationModal } from '@/components/SellerVerificationModal';
import { BuyerPurchasesModal } from '@/components/BuyerPurchasesModal';

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
  const [showSharedMedia, setShowSharedMedia] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  
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

  // Determine active listing and roles based on the latest message that references a listing
  const activeListingMessage = [...messages].reverse().find(m => m.listingId && m.listing);
  const activeListingId = activeListingMessage?.listingId;
  const isSeller = activeListingMessage && activeListingMessage.listing?.sellerId === user?.id;
  const isBuyer = activeListingMessage && activeListingMessage.listing?.sellerId !== user?.id;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ChevronLeft color={palette.foreground} size={24} strokeWidth={1.5} />
          </Pressable>
          <Pressable 
            onPress={() => other && router.push(`/profile/${other.clerkUserId}` as any)}
            style={styles.headerProfile}
          >
            {other && <Avatar name={other.name ?? '?'} uri={getImageUrl(other.avatarUrl) || undefined} size={28} />}
            <Text numberOfLines={1} style={styles.headerName}>
              {other?.name ?? other?.username ?? 'Conversation'}
            </Text>
          </Pressable>
          <View style={styles.headerActions}>
            {isSeller && (
              <Pressable onPress={() => setShowSellerModal(true)} style={styles.actionBtn}>
                <Text style={[type.caption, { color: palette.background, fontWeight: '700' }]}>Verify</Text>
              </Pressable>
            )}
            {isBuyer && (
              <Pressable onPress={() => setShowBuyerModal(true)} style={[styles.actionBtn, { backgroundColor: palette.surfaceElevated, borderWidth: 1, borderColor: palette.hairline }]}>
                <Text style={[type.caption, { color: palette.foreground, fontWeight: '700' }]}>Purchases</Text>
              </Pressable>
            )}
            <Pressable onPress={() => setShowSharedMedia(true)} hitSlop={8}>
              <MoreVertical color={palette.foreground} size={24} />
            </Pressable>
          </View>
        </View>
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
            renderItem={({ item }) => (
              <Bubble message={item} myClerkId={user?.id} onImagePress={setEnlargedImage} />
            )}
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
      
      <SharedMediaModal 
        visible={showSharedMedia} 
        onClose={() => setShowSharedMedia(false)} 
        messages={messages} 
      />
      <SellerVerificationModal
        visible={showSellerModal}
        onClose={() => setShowSellerModal(false)}
        buyerId={other?.id}
      />
      <BuyerPurchasesModal
        visible={showBuyerModal}
        onClose={() => setShowBuyerModal(false)}
        sellerId={other?.id}
      />
      <ImageViewerModal
        visible={!!enlargedImage}
        onClose={() => setEnlargedImage(null)}
        imageUrl={enlargedImage ? getImageUrl(enlargedImage) : null}
      />
    </SafeAreaView>
  );
}

function Bubble({ message, myClerkId, onImagePress }: { message: Message; myClerkId?: string; onImagePress: (url: string) => void }) {
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
              <Pressable key={url} onPress={() => onImagePress(url)}>
                <Image 
                  source={{ uri: getImageUrl(url) }} 
                  style={styles.chatImage} 
                  contentFit="cover" 
                />
              </Pressable>
            ))}
          </View>
        ) : null}

        {message.content ? (
          <Text style={[type.body, { color: mine ? palette.background : palette.foreground }]}>
            {message.content}
          </Text>
        ) : null}

        {message.content ? (() => {
          const match = message.content.match(/https?:\/\/[^\s]+/);
          return match ? <LinkPreview url={match[0]} /> : null;
        })() : null}
        
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
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    backgroundColor: palette.background,
    borderBottomWidth: 1,
    borderBottomColor: palette.hairline,
  },
  backBtn: {
    marginRight: spacing.sm,
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerName: {
    ...type.body,
    color: palette.foreground,
    fontWeight: '600',
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
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
  actionBtn: {
    backgroundColor: palette.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
});
