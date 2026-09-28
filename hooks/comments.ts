import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CommentTargetType } from "@/services/comments.api";
import { addCommentRequest, fetchComments } from "@/services/comments.api";

export const commentKeys = {
  all: ["comments"] as const,
  thread: (targetType: CommentTargetType, targetId: string) =>
    ["comments", targetType, targetId] as const,
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

export function useAddComment(targetType: CommentTargetType, targetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      addCommentRequest({ targetType, targetId, body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: commentKeys.thread(targetType, targetId),
      });
    },
  });
}
