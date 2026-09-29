"use client";

import { useState } from "react";
import { FiLoader } from "react-icons/fi";
import { StarPicker } from "./StarPicker";

export type BookingReviewSubmit = {
  serviceRating: number;
  serviceBody: string;
  rating: number;
  body: string;
};

type BookingReviewErrors = Partial<
  Record<"serviceRating" | "serviceBody" | "rating" | "body" | "form", string>
>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="text-[11px] font-medium text-red-600 dark:text-red-400"
    >
      {message}
    </p>
  );
}

function RatingBlock({
  title,
  subject,
  rating,
  body,
  ratingError,
  bodyError,
  onRating,
  onBody,
}: {
  title: string;
  subject: string;
  rating: number;
  body: string;
  ratingError?: string;
  bodyError?: string;
  onRating: (value: number) => void;
  onBody: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </p>
        <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
          {subject}
        </p>
      </div>
      <StarPicker
        value={rating}
        onChange={onRating}
        legend={`Chọn số sao: ${title}`}
      />
      <FieldError message={ratingError} />
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
          Chia sẻ thêm (không bắt buộc)
        </span>
        <textarea
          value={body}
          onChange={(event) => onBody(event.target.value)}
          maxLength={1000}
          rows={2}
          placeholder="Trải nghiệm của bạn như thế nào?"
          className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      <FieldError message={bodyError} />
    </div>
  );
}

// Two-part review for a completed booking: one star rating (plus optional
// note) for the service and one for the mechanic. Both ratings are required
// so the public service and mechanic feeds stay in step.
export function BookingReviewForm({
  serviceLabel,
  mechanicLabel,
  pending,
  errors,
  onSubmit,
}: {
  serviceLabel: string;
  mechanicLabel: string;
  pending: boolean;
  errors?: BookingReviewErrors;
  onSubmit: (value: BookingReviewSubmit) => void;
}) {
  const [serviceRating, setServiceRating] = useState(0);
  const [serviceBody, setServiceBody] = useState("");
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");

  return (
    <form
      aria-label="Đánh giá dịch vụ và thợ sửa xe"
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          serviceRating,
          serviceBody: serviceBody.trim(),
          rating,
          body: body.trim(),
        });
      }}
    >
      <RatingBlock
        title="Đánh giá dịch vụ"
        subject={serviceLabel}
        rating={serviceRating}
        body={serviceBody}
        ratingError={errors?.serviceRating}
        bodyError={errors?.serviceBody}
        onRating={setServiceRating}
        onBody={setServiceBody}
      />
      <RatingBlock
        title="Đánh giá thợ sửa xe"
        subject={mechanicLabel}
        rating={rating}
        body={body}
        ratingError={errors?.rating}
        bodyError={errors?.body}
        onRating={setRating}
        onBody={setBody}
      />
      <FieldError message={errors?.form} />
      <button
        type="submit"
        disabled={pending || serviceRating === 0 || rating === 0}
        className="flex min-h-[44px] items-center justify-center gap-1.5 self-start rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending && (
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
        )}
        Gửi đánh giá
      </button>
    </form>
  );
}
