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
import { useCreateBookingReview } from "@/hooks/booking";
import type { BookingDetail } from "@/lib/booking/workspace.types";
import { AuthApiError } from "@/services/auth.api";

// Feedback area inside the booking detail dialog: the mechanic review
// (once, after completion), a complaint entry and the private comment
// thread shared between the customer and staff.
export function BookingFeedbackSection({
  booking,
}: {
  booking: BookingDetail;
}) {
  const review = useCreateBookingReview(booking.id);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reviewable =
    booking.status === "completed" && booking.mechanicId !== null;
  const complaintTarget: ComplaintTarget = {
    refType: "booking",
    refId: booking.id,
    targetUserId: booking.mechanicId ?? undefined,
    targetName: booking.mechanicName || undefined,
    refLabel: `Đơn sửa xe ${booking.serviceNames.join(", ") || ""}`.trim(),
  };

  return (
    <section aria-label="Đánh giá và phản hồi" className="flex flex-col gap-3">
      {booking.review ? (
        <p className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <FiStar aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          Bạn đã đánh giá {booking.review.rating}/5
          {booking.review.body ? ` — ${booking.review.body}` : ""}
        </p>
      ) : (
        reviewable && (
          <ReviewForm
            title="Đánh giá thợ sửa xe"
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
        Gửi khiếu nại về đơn này
      </button>

      <CommentSection targetType="booking" targetId={booking.id} />

      {complaintOpen && (
        <ComplaintFormDialog
          target={complaintTarget}
          onClose={() => setComplaintOpen(false)}
        />
      )}
    </section>
  );
}
