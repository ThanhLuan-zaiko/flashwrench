"use client";

import { FiStar } from "react-icons/fi";

// Read-only star row: filled stars for the rounded rating, outlined for
// the rest. Pure monochrome — rating meaning comes from count, not hue.
export function Stars({
  rating,
  size = "h-4 w-4",
  label,
}: {
  rating: number;
  size?: string;
  label?: string;
}) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span
      role="img"
      aria-label={label ?? `${filled} trên 5 sao`}
      className="inline-flex items-center gap-0.5 text-zinc-900 dark:text-zinc-50"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar
          key={star}
          aria-hidden="true"
          className={`${size} ${
            star <= filled
              ? "fill-zinc-900 dark:fill-zinc-50"
              : "text-zinc-300 dark:text-zinc-600"
          }`}
        />
      ))}
    </span>
  );
}
