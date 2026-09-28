"use client";

import { useState } from "react";
import { FiFlag, FiStar } from "react-icons/fi";
import { CommentSection } from "@/components/feedback/CommentSection";
import {
  ComplaintFormDialog,
  type ComplaintTarget,
} from "@/components/feedback/ComplaintFormDialog";
import {
  ReviewForm,
  type ReviewSubmit,
} from "@/components/feedback/ReviewForm";
import { Stars } from "@/components/feedback/Stars";
import {
  useCreateOrderPartReview,
  useCreateOrderReview,
  useOrderReviews,
} from "@/hooks/reviews";
import type { OrderDetail } from "@/lib/orders/orders.types";
import { AuthApiError } from "@/services/reviews.api";

function reviewErrors(
  error: unknown,
  setErrors: (errors: Record<string, string>) => void,
): void {
  setErrors(
    error instanceof AuthApiError
      ? (error.errors as Record<string, string>)
      : { form: "Không gửi được đánh giá. Vui lòng thử lại." },
  );
}

// Order feedback on the customer detail page: one overall review per
// delivered order, one review per purchased part (feeds the public
// product rating), a complaint entry and the private comment thread.
export function OrderReviewSection({ order }: { order: OrderDetail }) {
  const state = useOrderReviews(order.id);
  const reviewOrder = useCreateOrderReview(order.id);
  const reviewPart = useCreateOrderPartReview(order.id);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [orderErrors, setOrderErrors] = useState<Record<string, string>>({});
  const [partErrors, setPartErrors] = useState<Record<string, string>>({});
  const [openPartId, setOpenPartId] = useState<string | null>(null);

  const delivered = order.status === "delivered";
  const orderReview = state.data?.state.orderReview ?? null;
  const partReviews = state.data?.state.partReviews ?? {};
  const complaintTarget: ComplaintTarget = {
    refType: "order",
    refId: order.id,
    refLabel: `Đơn mua linh kiện #${order.id.slice(0, 8)}`,
  };

  return (
    <section
      data-reveal
      aria-label="Đánh giá và phản hồi"
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Đánh giá đơn hàng
      </h2>

      {orderReview ? (
        <p className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <FiStar aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          Đánh giá đơn hàng: {orderReview.rating}/5
          {orderReview.body ? ` — ${orderReview.body}` : ""}
        </p>
      ) : (
        delivered && (
          <ReviewForm
            title="Trải nghiệm mua hàng"
            pending={reviewOrder.isPending}
            errors={orderErrors}
            onSubmit={(value: ReviewSubmit) =>
              reviewOrder.mutate(value, {
                onSuccess: () => setOrderErrors({}),
                onError: (error) => reviewErrors(error, setOrderErrors),
              })
            }
          />
        )
      )}

      {delivered && order.items.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Đánh giá từng sản phẩm
          </p>
          <ul className="flex flex-col gap-2">
            {order.items.map((item) => {
              const reviewed = partReviews[item.partId];
              const open = openPartId === item.partId && !reviewed;
              return (
                <li
                  key={item.partId}
                  className="rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {item.partName}
                    </span>
                    {reviewed ? (
                      <span className="flex shrink-0 items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <Stars rating={reviewed.rating} size="h-3 w-3" />
                        Đã đánh giá
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setOpenPartId(open ? null : item.partId)}
                        aria-expanded={open}
                        className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-lg border border-zinc-300 px-3 text-xs font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        <FiStar aria-hidden="true" className="h-3.5 w-3.5" />
                        Đánh giá
                      </button>
                    )}
                  </div>
                  {open && (
                    <div className="mt-2">
                      <ReviewForm
                        title={`Đánh giá ${item.partName}`}
                        pending={reviewPart.isPending}
                        errors={partErrors}
                        onSubmit={(value: ReviewSubmit) =>
                          reviewPart.mutate(
                            { partId: item.partId, ...value },
                            {
                              onSuccess: () => {
                                setPartErrors({});
                                setOpenPartId(null);
                              },
                              onError: (error) =>
                                reviewErrors(error, setPartErrors),
                            },
                          )
                        }
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setComplaintOpen(true)}
        className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <FiFlag aria-hidden="true" className="h-4 w-4" />
        Gửi khiếu nại về đơn này
      </button>

      <CommentSection targetType="order" targetId={order.id} />

      {complaintOpen && (
        <ComplaintFormDialog
          target={complaintTarget}
          onClose={() => setComplaintOpen(false)}
        />
      )}
    </section>
  );
}
