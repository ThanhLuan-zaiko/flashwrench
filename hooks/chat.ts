"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchChatMessages,
  fetchChatThread,
  fetchChatThreads,
  markChatThreadRead,
  openChatThread,
  sendChatMessage,
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
  return useMutation({
    mutationFn: (body: string) => sendChatMessage(threadId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: chatKeys.messages(threadId),
      });
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
