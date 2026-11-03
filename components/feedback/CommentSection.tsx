"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { scrollToPageTop } from "@/components/pagination/scroll-to-page-top";
import { useAccountSession } from "@/hooks/auth";
import { useAddComment, useComments } from "@/hooks/comments";
import { useEmbeddedPage } from "@/hooks/useEmbeddedPage";
import type { CommentTargetType } from "@/services/comments.api";
import { AuthApiError } from "@/services/comments.api";
import { CommentComposer } from "./CommentComposer";
import { CommentItem } from "./CommentItem";

// Pager links: bold text with an arrow, no border or box.
const PAGER_LINK =
  "flex min-h-11 items-center gap-1 text-sm font-bold text-[#111111] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] dark:text-zinc-100 dark:focus-visible:ring-zinc-100";
const PAGER_IDLE =
  "flex min-h-11 items-center gap-1 text-sm font-bold text-zinc-400 dark:text-zinc-600";

// One comment thread per entity. The composer appears only for signed-in
// users; private threads are enforced server-side per target type.
// Admin/dispatcher sessions additionally see hidden rows and hide/unhide
// controls; everyone gets one level of replies. Paging lives in a
// per-target ?cm_<id>=N param so several threads share one URL.
function CommentSectionInner({
  targetType,
  targetId,
  title = "Bình luận",
}: {
  targetType: CommentTargetType;
  targetId: string | null;
  title?: string;
}) {
  const router = useRouter();
  const session = useAccountSession();
  const pager = useEmbeddedPage(`cm_${targetId ?? "none"}`);
  const query = useComments(targetType, targetId, pager.cursor);
  const add = useAddComment(targetType, targetId ?? "");

  const page = query.data?.comments;
  const items = page?.items ?? [];
  const user = session.data?.user;
  const signedIn = Boolean(user);
  const canModerate = Boolean(
    user && ["admin", "dispatcher"].includes(user.role),
  );

  const errorMessage =
    add.error instanceof AuthApiError
      ? ((add.error.errors as Record<string, string>).form ??
        (add.error.errors as Record<string, string>).body ??
        null)
      : add.isError
        ? "Không gửi được bình luận. Vui lòng thử lại."
        : null;

  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
        {title}
      </p>

      {query.isPending && targetId && (
        <p
          aria-busy="true"
          className="text-xs text-zinc-500 dark:text-zinc-400"
        >
          Đang tải bình luận…
        </p>
      )}
      {query.isError && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          Không tải được bình luận.
        </p>
      )}

      {items.length === 0 && !query.isPending ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Chưa có bình luận nào.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.map((item) => (
            <CommentItem
              key={item.id}
              item={item}
              targetType={targetType}
              targetId={targetId ?? ""}
              signedIn={signedIn}
              canModerate={canModerate}
            />
          ))}
        </ul>
      )}

      {(pager.canPrev || page?.nextCursor) && (
        <div data-pager className="flex items-center justify-end gap-5">
          {pager.canPrev ? (
            <Link
              href={pager.prevHref}
              scroll={false}
              onClick={scrollToPageTop}
              prefetch
              aria-label="Trang trước"
              className={PAGER_LINK}
            >
              <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
              Trước
            </Link>
          ) : (
            <span aria-disabled="true" className={PAGER_IDLE}>
              <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
              Trước
            </span>
          )}
          {page?.nextCursor ? (
            <Link
              href={pager.nextHref}
              scroll={false}
              prefetch
              onClick={(event) => {
                scrollToPageTop(event);
                if (page.nextCursor) pager.recordNext(page.nextCursor);
              }}
              aria-label="Trang sau"
              className={PAGER_LINK}
            >
              Sau
              <FiChevronRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          ) : (
            <span aria-disabled="true" className={PAGER_IDLE}>
              Sau
              <FiChevronRight aria-hidden="true" className="h-4 w-4" />
            </span>
          )}
        </div>
      )}

      {signedIn ? (
        <CommentComposer
          id={`comment-${targetType}-${targetId}`}
          pending={add.isPending}
          error={errorMessage}
          onSubmit={(body) =>
            add.mutate(
              { body },
              {
                onSuccess: () => {
                  pager.reset();
                  if (pager.page > 1) {
                    router.replace(pager.firstHref, { scroll: false });
                  }
                },
              },
            )
          }
        />
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Đăng nhập để tham gia bình luận.
        </p>
      )}
    </section>
  );
}

// Suspense wrapper: useEmbeddedPage reads useSearchParams, which needs a
// boundary when the host page gets prerendered.
export function CommentSection(props: {
  targetType: CommentTargetType;
  targetId: string | null;
  title?: string;
}) {
  return (
    <Suspense fallback={null}>
      <CommentSectionInner {...props} />
    </Suspense>
  );
}
