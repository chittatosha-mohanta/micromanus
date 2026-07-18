'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { StreamEvent, ThinkingStep, Citation } from '@/agents/types';

interface Chat {
  id: string;
  title: string;
  model: string | null;
  provider: string | null;
  totalTokens: number;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

interface Message {
  id: string;
  chatId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
  content: string;
  thinkingSteps: ThinkingStep[] | null;
  citations: Citation[] | null;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  cost: number;
  createdAt: string;
}

export function useChats() {
  return useQuery<Chat[]>({
    queryKey: ['chats'],
    queryFn: async () => {
      const res = await fetch('/api/chats');
      if (!res.ok) throw new Error('Failed to fetch chats');
      return res.json();
    },
  });
}

export function useMessages(chatId: string | null) {
  return useQuery<Message[]>({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const res = await fetch(`/api/messages?chatId=${chatId}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!chatId,
  });
}

export function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/chats', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create chat');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

export function useDeleteChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string) => {
      const res = await fetch(`/api/chats?id=${chatId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete chat');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

export function useRenameChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const res = await fetch('/api/chats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title }),
      });
      if (!res.ok) throw new Error('Failed to rename chat');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

export function useSendMessage() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const sendMessage = useCallback(
    async (chatId: string, message: string, model?: string, provider?: string) => {
      setIsStreaming(true);
      setStreamContent('');
      setThinkingSteps([]);
      setError(null);

      abortRef.current = new AbortController();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, message, model, provider }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        // Check if it's a cached response (non-streaming)
        const contentType = res.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await res.json();
          setStreamContent(data.response);
          setIsStreaming(false);
          queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
          queryClient.invalidateQueries({ queryKey: ['chats'] });
          queryClient.invalidateQueries({ queryKey: ['user'] });
          return;
        }

        // Handle SSE stream
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('No response stream');

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event: StreamEvent = JSON.parse(line.slice(6));

                switch (event.type) {
                  case 'content':
                    setStreamContent(event.data as string);
                    break;
                  case 'thinking':
                  case 'tool_start':
                  case 'tool_end':
                    setThinkingSteps((prev) => [...prev, event.data as ThinkingStep]);
                    break;
                  case 'error':
                    setError(event.data as string);
                    break;
                  case 'done':
                    break;
                }
              } catch {
                // Ignore JSON parse errors in stream
              }
            }
          }
        }

        // Refresh data after stream completes
        queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        queryClient.invalidateQueries({ queryKey: ['user'] });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [queryClient]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    sendMessage,
    abort,
    isStreaming,
    streamContent,
    thinkingSteps,
    error,
  };
}
