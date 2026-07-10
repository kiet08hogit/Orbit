import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image as RNImage,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { ChevronDown, Ghost, Heart, ImagePlus, MessageCircle, Send, Trash2, X } from 'lucide-react-native';
import { palette, radius, spacing, type } from '@/theme';
import { Screen, Avatar, EmptyState, Input, Pill } from '@/components/ui';
import { postsApi, getImageUrl } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { formatRelative } from '@/lib/format';
import type { Post, PostComment, PostType } from '@/lib/types';

const POST_TYPES: { key: PostType | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'DISCUSSION', label: 'Discussion' },
  { key: 'EVENT', label: 'Event' },
  { key: 'CHECK_IN', label: 'Check-in' },
  { key: 'LOOKING_FOR', label: 'Looking for' },
];

export default function CommunityTab() {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<PostType | 'ALL'>('ALL');

  const load = useCallback(async () => {
    try {
      const data = await postsApi.list(filter === 'ALL' ? undefined : filter);
      setPosts(data);
    } catch {
      // keep whatever we have
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load]),
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onLike = ({ postId, likeCount }: { postId: string; likeCount: number }) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, _count: { ...p._count, likes: likeCount } } : p)),
      );
    };
    const onComment = ({ postId, commentCount }: { postId: string; commentCount: number }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, _count: { ...p._count, comments: commentCount } } : p,
        ),
      );
    };
    socket.on('post_like_update', onLike);
    socket.on('post_comment_added', onComment);
    return () => {
      socket.off('post_like_update', onLike);
      socket.off('post_comment_added', onComment);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={[type.captionUpper, { color: palette.muted }]}>CAMPUS FEED</Text>
        <Text style={[type.displayLg, { color: palette.foreground }]}>Community</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ flexGrow: 0 }}
      >
        {POST_TYPES.map((t) => (
          <Pill
            key={t.key}
            label={t.label}
            selected={filter === t.key}
            onPress={() => setFilter(t.key)}
          />
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.foreground} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.foreground} />
          }
          ListHeaderComponent={<Composer onPosted={load} />}
          ListEmptyComponent={
            <EmptyState
              eyebrow="QUIET CAMPUS"
              title="No posts yet"
              body="Be the first — ask a question, plan an event, or just check in."
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <PostCard post={item} myClerkId={user?.id} onChanged={load} />
          )}
        />
      )}
    </Screen>
  );
}

function Composer({ onPosted }: { onPosted: () => void }) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('DISCUSSION');
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const pickImages = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 4 - images.length,
      quality: 0.8,
    });
    if (!res.canceled) {
      setImages((prev) => [...prev, ...res.assets.map((a) => a.uri)].slice(0, 4));
    }
  };

  const submit = async () => {
    const text = content.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('content', text);
      form.append('postType', postType);
      form.append('isAnonymous', isAnonymous ? 'true' : 'false');
      images.forEach((uri, i) => {
        form.append('images', {
          uri,
          name: `post-${i}.jpg`,
          type: 'image/jpeg',
        } as unknown as Blob);
      });
      await postsApi.create(form);
      setContent('');
      setImages([]);
      setIsAnonymous(false);
      onPosted();
    } catch {
      // surface via input state; keep draft
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.composer}>
      <Input
        placeholder="What's happening on campus?"
        value={content}
        onChangeText={setContent}
        multiline
        maxLength={1000}
      />
      {images.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
          {images.map((uri) => (
            <View key={uri} style={styles.composerImageWrap}>
              <Image source={{ uri }} style={styles.composerImage} contentFit="cover" />
              <Pressable
                onPress={() => setImages((prev) => prev.filter((u) => u !== uri))}
                style={styles.composerImageRemove}
                hitSlop={8}
              >
                <X color={palette.foreground} size={12} strokeWidth={2} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}
      <View style={styles.composerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.sm }}>
          <Pressable
            style={styles.categoryDropdown}
            onPress={() => setShowDropdown(true)}
            accessibilityLabel="Select post category"
          >
            <Text style={[type.bodySm, { color: palette.foreground, fontWeight: '600' }]}>
              {POST_TYPES.find((t) => t.key === postType)?.label}
            </Text>
            <ChevronDown color={palette.foreground} size={14} strokeWidth={2} style={{ marginLeft: 4 }} />
          </Pressable>

          <Pressable
            style={[styles.anonToggle, isAnonymous && styles.anonToggleActive]}
            onPress={() => setIsAnonymous(!isAnonymous)}
            accessibilityLabel="Toggle Anonymous Mode"
          >
            <Ghost color={isAnonymous ? palette.primaryForeground : palette.muted} size={14} strokeWidth={2} />
            <Text style={[type.caption, { color: isAnonymous ? palette.primaryForeground : palette.muted, marginLeft: 4, fontWeight: '600' }]}>
              Anon
            </Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.composerActions}>
        <Pressable onPress={pickImages} hitSlop={8} accessibilityLabel="Add photos">
          <ImagePlus color={palette.body} size={20} strokeWidth={1.6} />
        </Pressable>
        <Pressable
          onPress={submit}
          disabled={!content.trim() || busy}
          accessibilityLabel="Post"
          style={({ pressed }) => [
            styles.postBtn,
            (!content.trim() || busy) && { opacity: 0.4 },
            pressed && { opacity: 0.8 },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={palette.onAccent} size="small" />
          ) : (
            <Text style={[type.button, { color: palette.onAccent }]}>Post</Text>
          )}
        </Pressable>
      </View>

      {/* Category Dropdown Modal */}
      {showDropdown && (
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.dropdownContent}>
            {POST_TYPES.filter((t) => t.key !== 'ALL').map((t) => (
              <Pressable
                key={t.key}
                style={styles.dropdownItem}
                onPress={() => {
                  setPostType(t.key as PostType);
                  setShowDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, postType === t.key && styles.dropdownItemTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      )}
    </View>
  );
}

function PostCard({
  post,
  myClerkId,
  onChanged,
}: {
  post: Post;
  myClerkId?: string;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(
    (post.likes ?? []).length > 0,
  );
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentCount, setCommentCount] = useState(post._count.comments);

  useEffect(() => {
    setLikeCount(post._count.likes);
    setCommentCount(post._count.comments);
  }, [post]);

  const mine = post.author?.clerkUserId === myClerkId;
  const typeMeta = POST_TYPES.find((t) => t.key === post.postType);

  const toggleLike = async () => {
    // optimistic
    setLiked((v) => !v);
    setLikeCount((n) => (liked ? n - 1 : n + 1));
    try {
      const res = await postsApi.toggleLike(post.id);
      setLiked(res.liked);
      setLikeCount(res.likeCount);
    } catch {
      setLiked((v) => !v);
      setLikeCount(post._count.likes);
    }
  };

  const loadComments = async () => {
    if (!showComments) {
      try {
        setComments(await postsApi.comments(post.id));
      } catch {
        // ignore
      }
    }
    setShowComments((v) => !v);
  };

  const addComment = async () => {
    const text = commentDraft.trim();
    if (!text) return;
    setCommentDraft('');
    try {
      const res = await postsApi.addComment(post.id, text);
      setComments((prev) => [...prev, res.comment]);
      setCommentCount(res.commentCount);
    } catch {
      setCommentDraft(text);
    }
  };

  const remove = async () => {
    try {
      await postsApi.delete(post.id);
      onChanged();
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <Pressable
          style={styles.postAuthor}
          onPress={() =>
            post.author?.clerkUserId &&
            router.push(`/profile/${post.author.clerkUserId}` as any)
          }
        >
          <Avatar
            name={post.author?.name ?? 'Anonymous'}
            uri={getImageUrl(post.author?.avatarUrl) || undefined}
            size={36}
          />
          <View style={{ marginLeft: spacing.xs }}>
            <Text style={[type.bodyStrong, { color: palette.foreground }]}>
              {post.author?.name ?? 'Anonymous'}
            </Text>
            <Text style={[type.caption, { color: palette.muted }]}>
              {typeMeta?.label ?? post.postType} · {formatRelative(post.createdAt)}
            </Text>
          </View>
        </Pressable>
        {mine ? (
          <Pressable onPress={remove} hitSlop={8} accessibilityLabel="Delete post">
            <Trash2 color={palette.muted} size={16} strokeWidth={1.6} />
          </Pressable>
        ) : null}
      </View>

      <Text style={[type.body, { color: palette.foreground, marginTop: spacing.sm }]}>
        {post.content}
      </Text>

      {post.imageUrls && post.imageUrls.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
          {post.imageUrls.map((url, idx) => {
            const uri = getImageUrl(url);
            return (
              <RNImage
                key={url}
                source={{ uri, cache: 'reload' }}
                style={styles.postImage}
                resizeMode="cover"
              />
            );
          })}
        </ScrollView>
      ) : null}

      <View style={styles.postActions}>
        <Pressable onPress={toggleLike} style={styles.postAction} hitSlop={8}>
          <Heart
            color={liked ? palette.accent : palette.muted}
            fill={liked ? palette.accent : 'transparent'}
            size={17}
            strokeWidth={1.6}
          />
          <Text style={[type.caption, { color: liked ? palette.accent : palette.muted }]}>
            {likeCount}
          </Text>
        </Pressable>
        <Pressable onPress={loadComments} style={styles.postAction} hitSlop={8}>
          <MessageCircle color={palette.muted} size={17} strokeWidth={1.6} />
          <Text style={[type.caption, { color: palette.muted }]}>{commentCount}</Text>
        </Pressable>
      </View>

      {showComments ? (
        <View style={styles.commentsWrap}>
          {comments.map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <Avatar
                name={c.author?.name ?? '?'}
                uri={getImageUrl(c.author?.avatarUrl) || undefined}
                size={26}
              />
              <View style={{ flex: 1, marginLeft: spacing.xs }}>
                <Text style={[type.caption, { color: palette.muted }]}>
                  {c.author?.name ?? 'Anonymous'} · {formatRelative(c.createdAt)}
                </Text>
                <Text style={[type.bodySm, { color: palette.foreground, marginTop: 2 }]}>
                  {c.content}
                </Text>
              </View>
            </View>
          ))}
          <View style={styles.commentComposer}>
            <Input
              placeholder="Add a comment…"
              value={commentDraft}
              onChangeText={setCommentDraft}
              variant="pill"
              containerStyle={{ flex: 1 }}
              returnKeyType="send"
              onSubmitEditing={addComment}
              trailingIcon={
                <Pressable onPress={addComment} hitSlop={8} accessibilityLabel="Send comment">
                  <Send color={palette.accent} size={16} strokeWidth={1.8} />
                </Pressable>
              }
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  separator: { height: 1, backgroundColor: palette.hairlineSoft },
  composer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.hairline,
    backgroundColor: palette.card,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  anonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  anonToggleActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  composerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  composerImageWrap: { position: 'relative', marginRight: spacing.xs },
  composerImage: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: palette.surfaceElevated,
  },
  composerImageRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.scrimStrong,
  },
  postBtn: {
    backgroundColor: palette.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  post: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postAuthor: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  postImage: {
    width: 180,
    height: 180,
    borderRadius: radius.md,
    marginRight: spacing.xs,
    backgroundColor: palette.surfaceElevated,
  },
  postActions: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  commentsWrap: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.hairlineSoft,
    gap: spacing.sm,
  },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start' },
  commentComposer: { flexDirection: 'row', marginTop: spacing.xs },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  dropdownContent: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    padding: spacing.xs,
    width: 200,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
  },
  dropdownItemText: {
    ...type.body,
    fontSize: 15,
    color: palette.mutedForeground,
  },
  dropdownItemTextActive: {
    color: palette.foreground,
    fontFamily: type.titleMd.fontFamily,
  },
});
