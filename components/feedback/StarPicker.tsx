"use client";

import { useId } from "react";
import { FiStar } from "react-icons/fi";

export const RATING_LABELS = [
  "Rất tệ",
  "Tệ",
  "Bình thường",
  "Tốt",
  "Rất tốt",
] as const;

// Shared 1-5 star radio group. Every review composer reuses it so the touch
// targets (44px), labels and focus ring stay identical across surfaces.
export function StarPicker({
  value,
  onChange,
  legend = "Chọn số sao đánh giá",
  hint = "Chạm để chọn số sao",
}: {
  value: number;
  onChange: (rating: number) => void;
  legend?: string;
  hint?: string;
}) {
  const groupName = useId();

  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
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
              checked={value === star}
              onChange={() => onChange(star)}
              aria-label={`${star} sao - ${RATING_LABELS[star - 1]}`}
              className="sr-only"
            />
            <FiStar
              aria-hidden="true"
              className={`h-6 w-6 ${
                star <= value
                  ? "fill-zinc-900 text-zinc-900 dark:fill-zinc-50 dark:text-zinc-50"
                  : ""
              }`}
            />
          </label>
        ))}
        <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
          {value > 0 ? RATING_LABELS[value - 1] : hint}
        </span>
      </div>
    </fieldset>
  );
}
