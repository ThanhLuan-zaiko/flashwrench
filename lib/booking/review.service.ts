import { randomUUID } from "node:crypto";
import type { PublicUser } from "@/lib/auth/user.types";
import { toIso } from "@/lib/mechanic/mechanic.types";
import {
  findBookingRowById,
  listBookingItemRowsByBookingIds,
} from "@/lib/mechanic/mechanic-bookings.repository";
import { toBookingStatus } from "@/lib/mechanic/mechanic-mapper";
import { publishBookingChange } from "@/lib/realtime/domain-publish";
import { isUuid } from "@/lib/validation";
import {
  type BookingReviewRow,
  type BookingReviewWrite,
  claimBookingReview,
  findReviewRowByBookingId,
  projectBookingReview,
} from "./review.repository";
import {
  type BookingReviewInput,
  validateBookingReviewInput,
} from "./review-validation";
import type { BookingReview, WorkspaceResult } from "./workspace.types";

function fail<T>(status: number, form: string): WorkspaceResult<T> {
  return { ok: false, status, errors: { form } };
}

function toReview(row: BookingReviewRow): BookingReview {
  return {
    id: row.review_id,
    bookingId: row.booking_id,
    mechanicId: row.mechanic_id ?? "",
    rating: row.rating ?? 0,
    body: row.body ?? "",
    serviceRating: row.service_rating,
    serviceBody: row.service_body ?? "",
    createdAt: toIso(row.created_at) ?? "",
  };
}

// A retry is the same review only when both the mechanic part and the
// service part match what is already stored.
function sameReview(
  row: BookingReviewRow,
  customerId: string,
  input: BookingReviewInput,
): boolean {
  return (
    row.customer_id === customerId &&
    row.rating === input.rating &&
    (row.body ?? "") === input.body &&
    (row.service_rating ?? null) === input.serviceRating &&
    (input.serviceRating === null ||
      (row.service_body ?? "") === input.serviceBody)
  );
}

function persistedWrite(
  row: BookingReviewRow,
  serviceIds: string[],
): BookingReviewWrite | null {
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
    serviceRating: row.service_rating,
    serviceBody: row.service_body ?? "",
    serviceIds,
  };
}

// Distinct services on the booking; the service rating fans out to each.
async function bookedServiceIds(bookingId: string): Promise<string[]> {
  const items = await listBookingItemRowsByBookingIds([bookingId]);
  return [...new Set(items.map((item) => item.service_id))];
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
  const parsed = validateBookingReviewInput(raw);
  if (parsed.errors) return { ok: false, status: 400, errors: parsed.errors };
  const input = parsed.input;

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

  const serviceIds =
    input.serviceRating === null ? [] : await bookedServiceIds(bookingId);
  if (input.serviceRating !== null && serviceIds.length === 0) {
    return fail(400, "Đơn này không có dịch vụ để đánh giá.");
  }

  const mechanicId = booking.mechanic_id;
  const status = booking.status ?? "completed";
  const existing = await findReviewRowByBookingId(bookingId);
  if (existing) {
    if (!sameReview(existing, customer.id, input)) {
      return fail(409, "Đơn này đã có đánh giá khác.");
    }
    const write = persistedWrite(existing, serviceIds);
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
    rating: input.rating,
    body: input.body,
    createdAt: new Date(),
    serviceRating: input.serviceRating,
    serviceBody: input.serviceBody,
    serviceIds,
  };
  const claimed = await claimBookingReview(write);
  if (!claimed) {
    const persisted = await findReviewRowByBookingId(bookingId);
    if (persisted && sameReview(persisted, customer.id, input)) {
      const repaired = persistedWrite(persisted, serviceIds);
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
      rating: input.rating,
      body: input.body,
      serviceRating: input.serviceRating,
      serviceBody: input.serviceRating === null ? "" : input.serviceBody,
      createdAt: write.createdAt.toISOString(),
    },
  };
}
