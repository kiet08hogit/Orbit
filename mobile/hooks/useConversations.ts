import { useEffect, useState } from 'react';
import { chatApi } from '@/lib/api';
import { mockConversations, mockMessages } from '@/data/mock';
import type { Conversation, Message } from '@/lib/types';

export function useConversations() {
  const [data, setData] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await chatApi.conversations();
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setData(mockConversations);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}

export function useMessages(conversationId: string) {
  const [data, setData] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await chatApi.messages(conversationId);
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setData(mockMessages[conversationId] ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  return { data, loading, appendLocal: (m: Message) => setData((prev) => [...prev, m]) };
}
