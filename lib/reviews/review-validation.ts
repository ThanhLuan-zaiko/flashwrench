import { isUuid, numericInput } from "@/lib/validation";
import type { ReviewFieldErrors } from "./review.types";

export const MAX_REVIEW_BODY = 1000;

// Shared 1..5 star + optional text validation for every review source.
export function validateReviewInput(raw: unknown): {
  rating: number;
  body: string;
  errors: ReviewFieldErrors | null;
} {
  const record =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const errors: ReviewFieldErrors = {};
  const rating = numericInput(record.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = "Đánh giá phải từ 1 đến 5 sao.";
  }
  const body = typeof record.body === "string" ? record.body.trim() : "";
  if (typeof record.body !== "string" || body.length > MAX_REVIEW_BODY) {
    errors.body = `Nội dung đánh giá tối đa ${MAX_REVIEW_BODY} ký tự.`;
  }
  const partId =
    record.partId === undefined || record.partId === null
      ? null
      : String(record.partId);
  if (partId !== null && !isUuid(partId)) {
    errors.partId = "Linh kiện cần đánh giá không hợp lệ.";
  }
  return {
    rating,
    body,
    errors: Object.keys(errors).length > 0 ? errors : null,
  };
}
