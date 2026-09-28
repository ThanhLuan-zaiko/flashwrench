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
import { useCreateRescueReview, useRescueReview } from "@/hooks/reviews";
import type { RescueDetail } from "@/services/rescue.api";
import { AuthApiError } from "@/services/reviews.api";

// Feedback area inside the rescue detail dialog: one mechanic review per
// completed request, a complaint entry and the private comment thread.
export function RescueFeedbackSection({ rescue }: { rescue: RescueDetail }) {
  const state = useRescueReview(rescue.requestId);
  const review = useCreateRescueReview(rescue.requestId);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const existing = state.data?.state.review ?? null;
  const reviewable =
    rescue.status === "completed" && rescue.assignedMechanicId !== null;
  const complaintTarget: ComplaintTarget = {
    refType: "emergency",
    refId: rescue.requestId,
    targetUserId: rescue.assignedMechanicId ?? undefined,
    targetName: rescue.assignedMechanicName ?? undefined,
    refLabel: "Yêu cầu cứu hộ khẩn cấp",
  };

  return (
    <section aria-label="Đánh giá và phản hồi" className="flex flex-col gap-3">
      {existing ? (
        <p className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <FiStar aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          Bạn đã đánh giá {existing.rating}/5
          {existing.body ? ` — ${existing.body}` : ""}
        </p>
      ) : (
        reviewable && (
          <ReviewForm
            title="Đánh giá thợ cứu hộ"
            pending={review.isPending}
            errors={errors}
            onSubmit={(value: ReviewSubmit) =>
              review.mutate(value, {
                onSuccess: () => setErrors({}),
                onError: (error) =>
                  setErrors(
                    error instanceof AuthApiError
                      ? (error.errors as Record<string, string>)
                      : { form: "Không gửi được đánh giá. Vui lòng thử lại." },
                  ),
              })
            }
          />
        )
      )}

      <button
        type="button"
        onClick={() => setComplaintOpen(true)}
        className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 motion-safe:active:scale-[0.99] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <FiFlag aria-hidden="true" className="h-4 w-4" />
        Gửi khiếu nại về cứu hộ này
      </button>

      <CommentSection targetType="rescue" targetId={rescue.requestId} />

      {complaintOpen && (
        <ComplaintFormDialog
          target={complaintTarget}
          onClose={() => setComplaintOpen(false)}
        />
      )}
    </section>
  );
}
