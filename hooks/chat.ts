"use client";

import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMe } from "@/hooks/auth";
import {
  buildOptimisticMessage,
  insertOptimisticMessage,
  replaceOptimisticMessage,
} from "@/lib/chat/chat-optimistic";
import {
  type ChatMessagePage,
  type ChatSendInput,
  fetchChatMessages,
  fetchChatThread,
  fetchChatThreads,
  markChatThreadRead,
  openChatThread,
  sendChatContentMessage,
} from "@/services/chat.api";

export const chatKeys = {
  all: ["chat"] as const,
  threads: () => [...chatKeys.all, "threads"] as const,
  thread: (threadId: string) => [...chatKeys.all, "thread", threadId] as const,
  messages: (threadId: string) =>
    [...chatKeys.all, "messages", threadId] as const,
};

export function useChatThreads(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: chatKeys.threads(),
    queryFn: ({ pageParam }) =>
      fetchChatThreads({ cursor: pageParam, limit: 20 }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled,
    staleTime: 15_000,
  });
}

export function useChatThread(threadId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: chatKeys.thread(threadId ?? ""),
    queryFn: () => fetchChatThread(threadId ?? ""),
    enabled: enabled && !!threadId,
    staleTime: 15_000,
  });
}

export function useChatMessages(threadId: string | null, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(threadId ?? ""),
    queryFn: ({ pageParam }) => fetchChatMessages(threadId ?? "", pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: enabled && !!threadId,
    staleTime: 10_000,
  });
}

export function useOpenChatThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => openChatThread(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
    },
  });
}

export function useSendChatMessage(threadId: string) {
  const queryClient = useQueryClient();
  const me = useMe();
  const key = chatKeys.messages(threadId);
  return useMutation({
    mutationFn: (input: ChatSendInput) =>
      sendChatContentMessage(threadId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous =
        queryClient.getQueryData<InfiniteData<ChatMessagePage>>(key);
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimistic = buildOptimisticMessage({
        id: tempId,
        threadId,
        senderId: me.data?.id ?? "",
        kind: input.kind ?? "text",
        body: input.body.trim(),
        createdAt: new Date().toISOString(),
      });
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(key, (old) => {
        if (!old) {
          return {
            pages: [{ items: [optimistic], nextCursor: null }],
            pageParams: [null],
          };
        }
        return {
          ...old,
          pages: insertOptimisticMessage(old.pages, optimistic),
        };
      });
      return { previous, tempId };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSuccess: (real, _body, context) => {
      if (!context?.tempId) return;
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(key, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: replaceOptimisticMessage(old.pages, context.tempId, real),
        };
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
    },
  });
}

export function useMarkChatRead(threadId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markChatThreadRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.threads() });
      if (threadId) {
        void queryClient.invalidateQueries({
          queryKey: chatKeys.thread(threadId),
        });
      }
    },
  });
}
