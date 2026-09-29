"use client";

import { useState } from "react";
import { FiFlag } from "react-icons/fi";
import {
  BookingReviewForm,
  type BookingReviewSubmit,
} from "@/components/feedback/BookingReviewForm";
import { CommentSection } from "@/components/feedback/CommentSection";
import {
  ComplaintFormDialog,
  type ComplaintTarget,
} from "@/components/feedback/ComplaintFormDialog";
import { Stars } from "@/components/feedback/Stars";
import { useCreateBookingReview } from "@/hooks/booking";
import type { BookingDetail } from "@/lib/booking/workspace.types";
import { AuthApiError } from "@/services/auth.api";

function SubmittedRating({
  label,
  rating,
  body,
}: {
  label: string;
  rating: number;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
      <p className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          {label}
        </span>
        <Stars rating={rating} size="h-3.5 w-3.5" />
        <span>{rating}/5</span>
      </p>
      {body && <p className="whitespace-pre-line">{body}</p>}
    </div>
  );
}

// Feedback area inside the booking detail dialog: the service and mechanic
// review (once, after completion), a complaint entry and the private
// comment thread shared between the customer and staff.
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
  const serviceLabel = booking.serviceNames.join(", ") || "Dịch vụ sửa xe";
  const complaintTarget: ComplaintTarget = {
    refType: "booking",
    refId: booking.id,
    targetUserId: booking.mechanicId ?? undefined,
    targetName: booking.mechanicName || undefined,
    refLabel: `Đơn sửa xe ${booking.serviceNames.join(", ") || ""}`.trim(),
  };

  function submit(value: BookingReviewSubmit) {
    review.mutate(value, {
      onSuccess: () => setErrors({}),
      onError: (error) =>
        setErrors(
          error instanceof AuthApiError
            ? (error.errors as Record<string, string>)
            : { form: "Không gửi được đánh giá. Vui lòng thử lại." },
        ),
    });
  }

  return (
    <section aria-label="Đánh giá và phản hồi" className="flex flex-col gap-3">
      {booking.review ? (
        <div className="flex flex-col gap-2">
          {booking.review.serviceRating !== null && (
            <SubmittedRating
              label="Dịch vụ"
              rating={booking.review.serviceRating}
              body={booking.review.serviceBody}
            />
          )}
          <SubmittedRating
            label="Thợ sửa xe"
            rating={booking.review.rating}
            body={booking.review.body}
          />
        </div>
      ) : (
        reviewable && (
          <BookingReviewForm
            serviceLabel={serviceLabel}
            mechanicLabel={booking.mechanicName || "Thợ sửa xe"}
            pending={review.isPending}
            errors={errors}
            onSubmit={submit}
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
