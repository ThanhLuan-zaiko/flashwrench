// Customer confirmation codes for cash collection. The mechanic requests
// a code, it is stored on the booking/rescue row, and the customer reads
// it back — so a mechanic cannot mark cash as collected without the
// customer present. The code itself is never returned to the collector.
import { randomInt, randomUUID } from "node:crypto";
import type { PublicUser } from "@/lib/auth/user.types";
import type { WorkspaceResult } from "@/lib/booking/workspace.types";
import { findBookingRowById } from "@/lib/mechanic/mechanic-bookings.repository";
import { toBookingStatus } from "@/lib/mechanic/mechanic-mapper";
import { findOrderRowById } from "@/lib/orders/orders.repository";
import type { OrdersResult } from "@/lib/orders/orders.types";
import { setOrderPaymentCode } from "@/lib/orders/orders-delivery.repository";
import {
  publishBookingChange,
  publishRescueChange,
} from "@/lib/realtime/domain-publish";
import { OPERATIONS_TOPIC, userTopic } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";
import { setRescuePaymentCode } from "@/lib/rescue/rescue-payment.repository";
import { findRescueRowById } from "@/lib/rescue/rescue-workflow.repository";
import { recordAuditEvent } from "@/lib/revenue/revenue.service";
import type { RevenueSource } from "@/lib/revenue/revenue.types";
import { isUuid } from "@/lib/validation";
import { setBookingPaymentCode } from "./booking-payment.repository";
import {
  upsertBookingPrompt,
  upsertOrderPrompt,
  upsertRescuePrompt,
} from "./payment-prompt.service";

function fail<T>(status: number, form: string): WorkspaceResult<T> {
  return { ok: false, status, errors: { form } };
}

/**
 * Cash guard shared by bookings and rescues: the customer dictates their
 * six-digit code and the collector must echo it. Returns null on a match,
 * otherwise the failure kind so the caller can build its field error.
 * Mismatches land on the admin audit feed — they're the bribery signal.
 */
export async function verifyCashConfirmCode(
  actorId: string,
  refType: RevenueSource,
  refId: string,
  issuedCode: string | null,
  providedCode: string | undefined,
  method: string,
): Promise<"missing" | "mismatch" | null> {
  if (!issuedCode) return "missing";
  if (providedCode !== issuedCode) {
    await recordAuditEvent({
      eventId: randomUUID(),
      actorId,
      action: "confirm_failed",
      refType,
      refId,
      paymentId: null,
      amount: null,
      method,
      detail: "cod collection rejected: wrong or missing code",
      at: new Date(),
    });
    return "mismatch";
  }
  return null;
}

function newConfirmCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

const COLLECTABLE = new Set(["unpaid", "partial"]);

export async function issueBookingPaymentCode(
  actor: PublicUser,
  bookingId: string,
): Promise<WorkspaceResult<{ issued: true }>> {
  if (actor.role !== "mechanic" && actor.role !== "admin") {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  if (!isUuid(bookingId)) return fail(400, "Mã đơn hàng không hợp lệ.");
  const booking = await findBookingRowById(bookingId);
  if (!booking) return fail(404, "Không tìm thấy đơn hàng này.");
  if (actor.role === "mechanic" && booking.mechanic_id !== actor.id) {
    return fail(403, "Đơn hàng này không thuộc về bạn.");
  }
  if (toBookingStatus(booking.status) !== "completed") {
    return fail(400, "Chỉ cấp mã cho đơn đã hoàn thành.");
  }
  if (!COLLECTABLE.has(booking.payment_status ?? "")) {
    return fail(409, "Đơn này không còn khoản cần thu.");
  }
  const now = new Date();
  await setBookingPaymentCode(bookingId, newConfirmCode(), now);
  await upsertBookingPrompt(booking, now);
  await recordAuditEvent({
    eventId: randomUUID(),
    actorId: actor.id,
    action: "confirm_code_issued",
    refType: "booking",
    refId: bookingId,
    paymentId: null,
    amount: null,
    method: null,
    detail: null,
    at: now,
  });
  // Refresh the customer's booking detail so the new code shows up.
  await publishBookingChange(
    "booking-updated",
    bookingId,
    booking.status ?? "completed",
    booking.customer_id,
    [booking.mechanic_id],
  );
  return { ok: true, data: { issued: true } };
}

export async function issueRescuePaymentCode(
  actor: PublicUser,
  requestId: string,
): Promise<WorkspaceResult<{ issued: true }>> {
  if (actor.role !== "mechanic" && actor.role !== "admin") {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  if (!isUuid(requestId)) return fail(400, "Mã yêu cầu cứu hộ không hợp lệ.");
  const row = await findRescueRowById(requestId);
  if (!row) return fail(404, "Không tìm thấy yêu cầu cứu hộ này.");
  if (actor.role === "mechanic" && row.assigned_mechanic_id !== actor.id) {
    return fail(403, "Yêu cầu này không thuộc về bạn.");
  }
  if (row.status !== "completed") {
    return fail(400, "Chỉ cấp mã cho cứu hộ đã hoàn thành.");
  }
  if (row.payment_status !== "unpaid") {
    return fail(409, "Yêu cầu này không còn khoản cần thu.");
  }
  const now = new Date();
  await setRescuePaymentCode(requestId, newConfirmCode(), now);
  await upsertRescuePrompt(row, now);
  await recordAuditEvent({
    eventId: randomUUID(),
    actorId: actor.id,
    action: "confirm_code_issued",
    refType: "emergency",
    refId: requestId,
    paymentId: null,
    amount: null,
    method: null,
    detail: null,
    at: now,
  });
  await publishRescueChange(
    "rescue-updated",
    requestId,
    "completed",
    row.customer_id,
    [row.assigned_mechanic_id],
    row.zone_id,
  );
  return { ok: true, data: { issued: true } };
}

// Courier COD variant: the mechanic carrying a delivery order requests the
// customer's code at the door. Only shipping orders with a mechanic courier
// and an unpaid COD balance qualify — counter/online orders settle through
// their own paths and never need the handover code.
function failOrder<T>(status: number, form: string): OrdersResult<T> {
  return { ok: false, status, errors: { form } };
}

export async function issueOrderPaymentCode(
  actor: PublicUser,
  orderId: string,
): Promise<OrdersResult<{ issued: true }>> {
  if (actor.role !== "mechanic" && actor.role !== "admin") {
    return failOrder(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  if (!isUuid(orderId)) return failOrder(400, "Mã đơn hàng không hợp lệ.");
  const row = await findOrderRowById(orderId);
  if (!row) return failOrder(404, "Không tìm thấy đơn hàng.");
  if (actor.role === "mechanic" && row.courier_id !== actor.id) {
    return failOrder(403, "Đơn giao này không thuộc về bạn.");
  }
  if (row.status !== "shipping" || row.courier_type !== "mechanic") {
    return failOrder(400, "Chỉ cấp mã cho đơn đang giao bởi thợ của shop.");
  }
  if (row.payment_method !== "cod") {
    return failOrder(400, "Đơn này không thu tiền mặt khi giao.");
  }
  if (row.payment_status !== "unpaid") {
    return failOrder(409, "Đơn này không còn khoản cần thu.");
  }
  const now = new Date();
  await setOrderPaymentCode(orderId, newConfirmCode(), now);
  await upsertOrderPrompt(row, now);
  await recordAuditEvent({
    eventId: randomUUID(),
    actorId: actor.id,
    action: "confirm_code_issued",
    refType: "order",
    refId: orderId,
    paymentId: null,
    amount: null,
    method: null,
    detail: null,
    at: now,
  });
  await publishRealtimeEvent(OPERATIONS_TOPIC, {
    kind: "orders-updated",
    updatedAt: now.toISOString(),
  });
  if (row.customer_id) {
    await publishRealtimeEvent(userTopic(row.customer_id), {
      kind: "order-updated",
      orderId,
    });
  }
  return { ok: true, data: { issued: true } };
}
