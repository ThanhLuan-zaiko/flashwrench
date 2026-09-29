"use client";

import { Suspense } from "react";
import { FiLoader, FiRefreshCw } from "react-icons/fi";
import { ReviewList } from "@/components/feedback/ReviewList";
import { useServiceReviews } from "@/hooks/reviews";
import { useEmbeddedPage } from "@/hooks/useEmbeddedPage";
import type { ServiceItem } from "@/lib/catalog/service-catalog.types";

// Public reviews of the service picked on the booking page: rating summary
// plus the newest reviews, cursor-paged on ?srv_page=N. Remount (key by
// service id) when the picked service changes so a cursor is never reused
// across services.
function ServiceReviewsCardInner({ service }: { service: ServiceItem | null }) {
  const pager = useEmbeddedPage("srv_page");
  const query = useServiceReviews(service?.id ?? null, pager.cursor);
  const page = query.data?.reviews;

  return (
    <section
      aria-label="Đánh giá dịch vụ"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Đánh giá dịch vụ
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {service
            ? service.name
            : "Chọn dịch vụ để xem đánh giá từ khách hàng."}
        </p>
      </div>

      {service && query.isPending && (
        <p
          aria-busy="true"
          className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"
        >
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
          Đang tải đánh giá…
        </p>
      )}

      {query.isError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          Không tải được đánh giá.
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-300 px-3 font-semibold hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950"
          >
            <FiRefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            Thử lại
          </button>
        </div>
      )}

      {page && service && (
        <ReviewList
          items={page.items}
          ratingAvg={page.ratingAvg}
          ratingCount={page.ratingCount}
          emptyLabel="Dịch vụ này chưa có đánh giá. Đánh giá sẽ xuất hiện sau khi khách hoàn tất đơn."
          canPrev={pager.canPrev}
          canNext={Boolean(page.nextCursor)}
          prevHref={pager.prevHref}
          nextHref={pager.nextHref}
          onNextClick={() => {
            if (page.nextCursor) pager.recordNext(page.nextCursor);
          }}
          moderation={{ targetType: "service", targetId: service.id }}
        />
      )}
    </section>
  );
}

// Suspense wrapper: useEmbeddedPage reads useSearchParams, which needs a
// boundary when the host page gets prerendered.
export function ServiceReviewsCard(props: { service: ServiceItem | null }) {
  return (
    <Suspense fallback={null}>
      <ServiceReviewsCardInner {...props} />
    </Suspense>
  );
}
