"use client";

import { useState } from "react";
import { FiEye, FiEyeOff, FiMessageSquare } from "react-icons/fi";
import { useAddComment, useModerateComment } from "@/hooks/comments";
import type {
  CommentItem as CommentItemData,
  CommentTargetType,
} from "@/services/comments.api";
import { AuthApiError } from "@/services/comments.api";
import { CommentCard } from "./CommentCard";
import { CommentComposer } from "./CommentComposer";
import { CommentReplyList } from "./CommentReplyList";

// One top-level comment: reply toggle (one level deep), expandable
// replies, and staff hide/unhide for moderation.
export function CommentItem({
  item,
  targetType,
  targetId,
  signedIn,
  canModerate,
}: {
  item: CommentItemData;
  targetType: CommentTargetType;
  targetId: string;
  signedIn: boolean;
  canModerate: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const add = useAddComment(targetType, targetId);
  const moderate = useModerateComment();

  const replyError =
    add.error instanceof AuthApiError
      ? ((add.error.errors as Record<string, string>).form ??
        (add.error.errors as Record<string, string>).body ??
        null)
      : add.isError
        ? "Không gửi được phản hồi. Vui lòng thử lại."
        : null;

  return (
    <li className="flex flex-col gap-2">
      <CommentCard
        item={item}
        actions={
          <>
            {signedIn && (
              <button
                type="button"
                aria-label={`Trả lời ${item.userName}`}
                onClick={() => setReplying((open) => !open)}
                className="flex min-h-[32px] items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <FiMessageSquare aria-hidden="true" className="h-3.5 w-3.5" />
                Trả lời
              </button>
            )}
            {item.replyCount > 0 && (
              <button
                type="button"
                aria-expanded={showReplies}
                onClick={() => setShowReplies((open) => !open)}
                className="flex min-h-[32px] items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                {showReplies
                  ? "Ẩn phản hồi"
                  : `Xem ${item.replyCount} phản hồi`}
              </button>
            )}
            {canModerate && (
              <button
                type="button"
                disabled={moderate.isPending}
                onClick={() =>
                  moderate.mutate({
                    commentId: item.id,
                    action: item.hidden ? "unhide" : "hide",
                    targetType,
                    targetId,
                  })
                }
                className="flex min-h-[32px] items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-zinc-500 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                {item.hidden ? (
                  <FiEye aria-hidden="true" className="h-3.5 w-3.5" />
                ) : (
                  <FiEyeOff aria-hidden="true" className="h-3.5 w-3.5" />
                )}
                {item.hidden ? "Hiện lại" : "Ẩn"}
              </button>
            )}
          </>
        }
      />

      {replying && (
        <div className="border-l-2 border-zinc-200 pl-3 dark:border-zinc-700">
          <CommentComposer
            id={`reply-${item.id}`}
            placeholder={`Phản hồi ${item.userName}…`}
            submitLabel="Gửi phản hồi"
            pending={add.isPending}
            error={replyError}
            autoFocus
            onCancel={() => setReplying(false)}
            onSubmit={(replyBody) =>
              add.mutate(
                { body: replyBody, parentId: item.id },
                {
                  onSuccess: () => {
                    setReplying(false);
                    setShowReplies(true);
                  },
                },
              )
            }
          />
        </div>
      )}

      {showReplies && (
        <CommentReplyList
          parentId={item.id}
          targetType={targetType}
          targetId={targetId}
          canModerate={canModerate}
        />
      )}
    </li>
  );
}
