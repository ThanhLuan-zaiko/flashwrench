"use client";

import { useId, useState } from "react";
import { FiLoader, FiStar } from "react-icons/fi";

export type ReviewSubmit = { rating: number; body: string };

const RATING_LABELS = [
  "Rất tệ",
  "Tệ",
  "Bình thường",
  "Tốt",
  "Rất tốt",
] as const;

// Shared review composer: a 1-5 star radio group plus an optional note.
// Used by booking, rescue, order-level and per-part review surfaces.
export function ReviewForm({
  title,
  pending,
  errors,
  submitLabel = "Gửi đánh giá",
  onSubmit,
}: {
  title: string;
  pending: boolean;
  errors?: Partial<Record<"rating" | "body" | "form", string>>;
  submitLabel?: string;
  onSubmit: (value: ReviewSubmit) => void;
}) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const groupName = useId();

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ rating, body: body.trim() });
      }}
    >
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </p>

      <fieldset>
        <legend className="sr-only">Chọn số sao đánh giá</legend>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <label
              key={star}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-zinc-300 transition-colors duration-150 hover:text-zinc-500 motion-safe:active:scale-95 dark:text-zinc-600 dark:hover:text-zinc-300 has-focus-visible:ring-2 has-focus-visible:ring-zinc-500"
            >
              <input
                type="radio"
                name={groupName}
                value={star}
                checked={rating === star}
                onChange={() => setRating(star)}
                aria-label={`${star} sao - ${RATING_LABELS[star - 1]}`}
                className="sr-only"
              />
              <FiStar
                aria-hidden="true"
                className={`h-6 w-6 ${
                  star <= rating
                    ? "fill-zinc-900 text-zinc-900 dark:fill-zinc-50 dark:text-zinc-50"
                    : ""
                }`}
              />
            </label>
          ))}
          <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
            {rating > 0 ? RATING_LABELS[rating - 1] : "Chạm để chọn số sao"}
          </span>
        </div>
      </fieldset>
      {errors?.rating && (
        <p
          role="alert"
          className="text-[11px] font-medium text-red-600 dark:text-red-400"
        >
          {errors.rating}
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
          Chia sẻ thêm (không bắt buộc)
        </span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Trải nghiệm của bạn như thế nào?"
          className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      {errors?.body && (
        <p
          role="alert"
          className="text-[11px] font-medium text-red-600 dark:text-red-400"
        >
          {errors.body}
        </p>
      )}
      {errors?.form && (
        <p
          role="alert"
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          {errors.form}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || rating === 0}
        className="flex min-h-[44px] items-center justify-center gap-1.5 self-start rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending && (
          <FiLoader
            aria-hidden="true"
            className="h-4 w-4 motion-safe:animate-spin"
          />
        )}
        {submitLabel}
      </button>
    </form>
  );
}
