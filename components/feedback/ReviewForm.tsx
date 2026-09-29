"use client";

import { useState } from "react";
import { FiLoader } from "react-icons/fi";
import { StarPicker } from "./StarPicker";

export type ReviewSubmit = { rating: number; body: string };

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

      <StarPicker value={rating} onChange={setRating} />
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
