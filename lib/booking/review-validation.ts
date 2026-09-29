import { isRecord, numericInput } from "@/lib/validation";

export const MAX_BOOKING_REVIEW_BODY = 1000;

// `rating`/`body` rate the mechanic. The optional service part
// (`serviceRating`/`serviceBody`) rates the booked service(s); it stays
// null for clients that only send the mechanic part.
export type BookingReviewInput = {
  rating: number;
  body: string;
  serviceRating: number | null;
  serviceBody: string;
};

export type BookingReviewValidation =
  | { input: BookingReviewInput; errors: null }
  | { input: null; errors: Record<string, string> };

function isStarRating(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null;
}

// Shared 1..5 star + note validation for the mechanic and service parts.
export function validateBookingReviewInput(
  raw: unknown,
): BookingReviewValidation {
  if (!isRecord(raw)) {
    return { input: null, errors: { form: "Dữ liệu gửi lên không hợp lệ." } };
  }
  const errors: Record<string, string> = {};

  const rating = numericInput(raw.rating);
  if (!isStarRating(rating)) {
    errors.rating = "Đánh giá phải từ 1 đến 5 sao.";
  }
  const body = typeof raw.body === "string" ? raw.body.trim() : "";
  if (typeof raw.body !== "string" || body.length > MAX_BOOKING_REVIEW_BODY) {
    errors.body = `Nội dung đánh giá tối đa ${MAX_BOOKING_REVIEW_BODY} ký tự.`;
  }

  let serviceRating: number | null = null;
  if (!isEmpty(raw.serviceRating)) {
    const parsed = numericInput(raw.serviceRating);
    if (isStarRating(parsed)) serviceRating = parsed;
    else errors.serviceRating = "Đánh giá dịch vụ phải từ 1 đến 5 sao.";
  }
  const serviceBody =
    typeof raw.serviceBody === "string" ? raw.serviceBody.trim() : "";
  if (
    (!isEmpty(raw.serviceBody) && typeof raw.serviceBody !== "string") ||
    serviceBody.length > MAX_BOOKING_REVIEW_BODY
  ) {
    errors.serviceBody = `Nội dung đánh giá dịch vụ tối đa ${MAX_BOOKING_REVIEW_BODY} ký tự.`;
  } else if (
    serviceBody.length > 0 &&
    isEmpty(raw.serviceRating) &&
    !errors.serviceRating
  ) {
    errors.serviceRating = "Hãy chọn số sao cho dịch vụ.";
  }

  if (Object.keys(errors).length > 0) return { input: null, errors };
  return {
    input: { rating, body, serviceRating, serviceBody },
    errors: null,
  };
}
