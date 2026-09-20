import { randomUUID } from "node:crypto";
import type { PublicUser } from "@/lib/auth/user.types";
import { toIso } from "@/lib/mechanic/mechanic.types";
import { findBookingRowById } from "@/lib/mechanic/mechanic-bookings.repository";
import { toBookingStatus } from "@/lib/mechanic/mechanic-mapper";
import { publishBookingChange } from "@/lib/realtime/domain-publish";
import { isRecord, isUuid, numericInput } from "@/lib/validation";
import {
  type BookingReviewRow,
  type BookingReviewWrite,
  claimBookingReview,
  findReviewRowByBookingId,
  projectBookingReview,
} from "./review.repository";
import type { BookingReview, WorkspaceResult } from "./workspace.types";

const MAX_REVIEW_BODY = 1000;

function fail<T>(status: number, form: string): WorkspaceResult<T> {
  return { ok: false, status, errors: { form } };
}

function fieldFail<T>(
  status: number,
  errors: Record<string, string>,
): WorkspaceResult<T> {
  return { ok: false, status, errors };
}

function toReview(row: BookingReviewRow): BookingReview {
  return {
    id: row.review_id,
    bookingId: row.booking_id,
    mechanicId: row.mechanic_id ?? "",
    rating: row.rating ?? 0,
    body: row.body ?? "",
    createdAt: toIso(row.created_at) ?? "",
  };
}

function sameReview(
  row: BookingReviewRow,
  customerId: string,
  rating: number,
  body: string,
): boolean {
  return (
    row.customer_id === customerId &&
    row.rating === rating &&
    (row.body ?? "") === body
  );
}

function persistedWrite(row: BookingReviewRow): BookingReviewWrite | null {
  if (!row.customer_id || !row.mechanic_id) return null;
  if (
    !(row.created_at instanceof Date) ||
    Number.isNaN(row.created_at.getTime())
  ) {
    return null;
  }
  if (row.rating === null || row.body === null) return null;
  return {
    bookingId: row.booking_id,
    reviewId: row.review_id,
    customerId: row.customer_id,
    mechanicId: row.mechanic_id,
    customerName: row.customer_name ?? "",
    rating: row.rating,
    body: row.body,
    createdAt: row.created_at,
  };
}

async function repairAndPublish(
  write: BookingReviewWrite,
  status: string,
): Promise<void> {
  await projectBookingReview(write);
  await publishBookingChange(
    "review-created",
    write.bookingId,
    status,
    write.customerId,
    [write.mechanicId],
  );
}

export async function createBookingReview(
  customer: PublicUser,
  bookingId: string,
  raw: unknown,
): Promise<WorkspaceResult<BookingReview>> {
  if (!isUuid(bookingId)) return fail(400, "Mã đơn hàng không hợp lệ.");
  if (!isRecord(raw)) {
    return fieldFail(400, { form: "Dữ liệu gửi lên không hợp lệ." });
  }
  const errors: Record<string, string> = {};
  const rating = numericInput(raw.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = "Đánh giá phải từ 1 đến 5 sao.";
  }
  const body = typeof raw.body === "string" ? raw.body.trim() : "";
  if (typeof raw.body !== "string" || body.length > MAX_REVIEW_BODY) {
    errors.body = `Nội dung đánh giá tối đa ${MAX_REVIEW_BODY} ký tự.`;
  }
  if (Object.keys(errors).length > 0) return fieldFail(400, errors);

  const booking = await findBookingRowById(bookingId);
  if (!booking || booking.customer_id !== customer.id) {
    return fail(404, "Không tìm thấy đơn hàng này.");
  }
  if (toBookingStatus(booking.status) !== "completed") {
    return fail(400, "Chỉ có thể đánh giá đơn đã hoàn thành.");
  }
  if (!booking.mechanic_id) {
    return fail(400, "Đơn này không có thợ để đánh giá.");
  }

  const mechanicId = booking.mechanic_id;
  const status = booking.status ?? "completed";
  const existing = await findReviewRowByBookingId(bookingId);
  if (existing) {
    if (!sameReview(existing, customer.id, rating, body)) {
      return fail(409, "Đơn này đã có đánh giá khác.");
    }
    const write = persistedWrite(existing);
    if (!write) return fail(409, "Đơn này đã có đánh giá khác.");
    await repairAndPublish(write, status);
    return { ok: true, data: toReview(existing) };
  }

  const write: BookingReviewWrite = {
    bookingId,
    reviewId: randomUUID(),
    customerId: customer.id,
    mechanicId,
    customerName: customer.fullName,
    rating,
    body,
    createdAt: new Date(),
  };
  const claimed = await claimBookingReview(write);
  if (!claimed) {
    const persisted = await findReviewRowByBookingId(bookingId);
    if (persisted && sameReview(persisted, customer.id, rating, body)) {
      const repaired = persistedWrite(persisted);
      if (!repaired) return fail(409, "Đơn này đã có đánh giá khác.");
      await repairAndPublish(repaired, status);
      return { ok: true, data: toReview(persisted) };
    }
    return fail(409, "Đơn này đã có đánh giá khác.");
  }
  await repairAndPublish(write, status);
  return {
    ok: true,
    data: {
      id: write.reviewId,
      bookingId,
      mechanicId,
      rating,
      body,
      createdAt: write.createdAt.toISOString(),
    },
  };
}
