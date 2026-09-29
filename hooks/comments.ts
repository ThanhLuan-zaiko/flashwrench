import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CommentTargetType } from "@/services/comments.api";
import {
  addCommentRequest,
  fetchComments,
  fetchReplies,
  moderateCommentRequest,
} from "@/services/comments.api";

export const commentKeys = {
  all: ["comments"] as const,
  thread: (targetType: CommentTargetType, targetId: string) =>
    ["comments", targetType, targetId] as const,
  replies: (parentId: string) => ["comments", "replies", parentId] as const,
};

// One thread per entity; the cursor stack lives in the caller so page
// keys stay stable for Trước/Sau paging.
export function useComments(
  targetType: CommentTargetType,
  targetId: string | null,
  cursor?: string | null,
) {
  return useQuery({
    queryKey: [
      ...commentKeys.thread(targetType, targetId ?? "none"),
      cursor ?? null,
    ],
    queryFn: () => fetchComments(targetType, targetId as string, cursor),
    enabled: Boolean(targetId),
    staleTime: 15 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// Replies under one top-level comment; only fetched once expanded.
export function useReplies(
  parentId: string,
  cursor?: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: [...commentKeys.replies(parentId), cursor ?? null],
    queryFn: () => fetchReplies(parentId, cursor),
    enabled,
    staleTime: 15 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useAddComment(targetType: CommentTargetType, targetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string; parentId?: string }) =>
      addCommentRequest({ targetType, targetId, ...input }),
    onSuccess: () => {
      // Covers the thread page and any expanded reply lists.
      void queryClient.invalidateQueries({ queryKey: commentKeys.all });
    },
  });
}

// Staff hide/unhide; thread and reply pages refetch so the row flips
// to its moderated state (or disappears for non-moderators).
export function useModerateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moderateCommentRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: commentKeys.all });
    },
  });
}
