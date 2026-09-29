"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ReviewForm,
  type ReviewSubmit,
} from "@/components/feedback/ReviewForm";
import { Stars } from "@/components/feedback/Stars";
import { useAccountSession } from "@/hooks/auth";
import {
  useCreateOrderPartReview,
  usePartReviewEligibility,
} from "@/hooks/reviews";
import { buildLoginHref } from "@/lib/auth/auth-redirect";
import { AuthApiError } from "@/services/reviews.api";

const HINT_CLASSES =
  "rounded-xl border border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400";

function EligibleForm({
  orderId,
  partId,
  partName,
}: {
  orderId: string;
  partId: string;
  partName?: string;
}) {
  const review = useCreateOrderPartReview(orderId);
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <ReviewForm
      title={partName ? `Đánh giá ${partName}` : "Đánh giá sản phẩm bạn đã mua"}
      pending={review.isPending}
      errors={errors}
      onSubmit={(value: ReviewSubmit) =>
        review.mutate(
          { partId, ...value },
          {
            onSuccess: () => setErrors({}),
            onError: (error) =>
              setErrors(
                error instanceof AuthApiError
                  ? (error.errors as Record<string, string>)
                  : { form: "Không gửi được đánh giá. Vui lòng thử lại." },
              ),
          },
        )
      }
    />
  );
}

// Star rating entry that sits right above the comment box on the product
// page. Only customers with a delivered order containing the product can
// rate it (one review per product in that order); everyone else gets a
// plain-language hint and still comments below.
export function ProductReviewComposer({
  slug,
  partName,
}: {
  slug: string;
  partName?: string;
}) {
  const session = useAccountSession();
  const signedIn = Boolean(session.data?.user);
  const eligibility = usePartReviewEligibility(slug, signedIn);
  const state = eligibility.data?.eligibility ?? null;

  if (session.isPending) return null;

  return (
    <section aria-label="Chấm sao sản phẩm" className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Chấm sao sản phẩm
      </p>

      {!signedIn && (
        <p className={HINT_CLASSES}>
          <Link
            href={buildLoginHref(`/products/${slug}`)}
            className="font-semibold text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
          >
            Đăng nhập
          </Link>{" "}
          để chấm sao sản phẩm bạn đã mua.
        </p>
      )}

      {signedIn && eligibility.isPending && (
        <div
          aria-busy="true"
          className="h-16 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
        />
      )}

      {signedIn && eligibility.isError && (
        <p role="alert" className={HINT_CLASSES}>
          Chưa kiểm tra được quyền chấm sao. Vui lòng tải lại trang.
        </p>
      )}

      {state?.status === "eligible" && (
        <EligibleForm
          orderId={state.orderId}
          partId={state.partId}
          partName={partName}
        />
      )}

      {state?.status === "reviewed" && (
        <p className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <Stars rating={state.review.rating} size="h-3.5 w-3.5" />
          Cảm ơn bạn đã đánh giá sản phẩm này
          {state.review.body ? ` — ${state.review.body}` : "."}
        </p>
      )}

      {state?.status === "not_purchased" && (
        <p className={HINT_CLASSES}>
          Chỉ khách đã nhận hàng mới chấm sao được. Bạn vẫn có thể đặt câu hỏi
          hoặc để lại bình luận ngay bên dưới.
        </p>
      )}
    </section>
  );
}
