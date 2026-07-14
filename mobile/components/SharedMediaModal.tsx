import React, { useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, FlatList, Linking } from 'react-native';
import { Image } from 'expo-image';
import { X, ExternalLink, Image as ImageIcon } from 'lucide-react-native';
import { palette, radius, spacing, type } from '@/theme';
import { getImageUrl } from '@/lib/api';
import type { Message } from '@/lib/types';
import { ImageViewerModal } from '@/components/ImageViewerModal';

interface SharedMediaModalProps {
  visible: boolean;
  onClose: () => void;
  messages: Message[];
}

export function SharedMediaModal({ visible, onClose, messages }: SharedMediaModalProps) {
  const { images, links } = useMemo(() => {
    const imgs: string[] = [];
    const lnks: string[] = [];
    messages.forEach((m) => {
      if (m.imageUrls) {
        m.imageUrls.forEach((url) => imgs.push(url));
      }
      if (m.content) {
        const matches = m.content.match(/https?:\/\/[^\s]+/g);
        if (matches) {
          matches.forEach((match) => lnks.push(match));
        }
      }
    });
    return { images: imgs, links: lnks };
  }, [messages]);

  const [activeTab, setActiveTab] = useState<'media' | 'links'>('media');
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[type.h3, { color: palette.foreground }]}>Shared Media</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X color={palette.muted} size={24} />
            </Pressable>
          </View>
          
          <View style={styles.tabs}>
            <Pressable 
              style={[styles.tab, activeTab === 'media' && styles.tabActive]} 
              onPress={() => setActiveTab('media')}
            >
              <Text style={[styles.tabText, activeTab === 'media' && styles.tabTextActive]}>
                Pictures ({images.length})
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.tab, activeTab === 'links' && styles.tabActive]} 
              onPress={() => setActiveTab('links')}
            >
              <Text style={[styles.tabText, activeTab === 'links' && styles.tabTextActive]}>
                URLs ({links.length})
              </Text>
            </Pressable>
          </View>
          
          <FlatList
            data={activeTab === 'media' ? images : links}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => {
              if (activeTab === 'media') {
                return (
                  <Pressable onPress={() => setEnlargedImage(item)}>
                    <Image
                      source={{ uri: getImageUrl(item) }}
                      style={styles.image}
                      contentFit="cover"
                    />
                  </Pressable>
                );
              }
              if (activeTab === 'links') {
                return (
                  <Pressable onPress={() => Linking.openURL(item).catch(() => {})} style={styles.linkRow}>
                    <ExternalLink color={palette.accent} size={20} />
                    <Text style={[type.body, { color: palette.accent, marginLeft: spacing.sm }]} numberOfLines={1}>
                      {item}
                    </Text>
                  </Pressable>
                );
              }
              return null;
            }}
            contentContainerStyle={styles.list}
          />
        </View>
      </View>
      
      <ImageViewerModal
        visible={!!enlargedImage}
        onClose={() => setEnlargedImage(null)}
        imageUrl={enlargedImage ? getImageUrl(enlargedImage) : null}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: palette.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    height: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: palette.hairline,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: palette.hairline,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: palette.foreground,
  },
  tabText: {
    ...type.body,
    fontWeight: '600',
    color: palette.muted,
  },
  tabTextActive: {
    color: palette.foreground,
  },
  list: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.xxl,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    backgroundColor: palette.card,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.hairlineSoft,
  },
});
