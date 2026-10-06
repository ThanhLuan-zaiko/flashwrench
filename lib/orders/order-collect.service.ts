// Courier COD collection: the mechanic delivering a shop order records the
// cash handover at the door. The customer's six-digit code is mandatory —
// without it a courier could mark any delivery as paid without the customer
// present. On a match the order drives the exact same "delivered" transition
// as the staff path, so payment/receipt/history projections stay identical.
import { randomUUID } from "node:crypto";
import type { PublicUser } from "@/lib/auth/user.types";
import { verifyCashConfirmCode } from "@/lib/payments/payment-code.service";
import { OPERATIONS_TOPIC, userTopic } from "@/lib/realtime/protocol";
import { publishRealtimeEvent } from "@/lib/realtime/publish";
import { recordAuditEvent } from "@/lib/revenue/revenue.service";
import { isRecord, isUuid } from "@/lib/validation";
import { findOrderRowById } from "./orders.repository";
import { applyStatusChange } from "./orders.service";
import type { OrderDetail, OrdersResult } from "./orders.types";
import { setOrderPaymentCode } from "./orders-delivery.repository";
import { loadOrderDetail } from "./orders-read.service";

function fail<T>(status: number, form: string): OrdersResult<T> {
  return { ok: false, status, errors: { form } };
}

export async function collectOrderDelivery(
  actor: PublicUser,
  orderId: string,
  body: unknown,
): Promise<OrdersResult<OrderDetail>> {
  if (actor.role !== "mechanic" && actor.role !== "admin") {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  if (!isUuid(orderId)) return fail(400, "Mã đơn hàng không hợp lệ.");
  const input = isRecord(body) ? body : {};
  const note = typeof input.note === "string" ? input.note.trim() : "";
  const confirmCode =
    typeof input.confirmCode === "string" ? input.confirmCode.trim() : "";
  const row = await findOrderRowById(orderId);
  if (!row) return fail(404, "Không tìm thấy đơn hàng.");
  if (actor.role === "mechanic" && row.courier_id !== actor.id) {
    return fail(403, "Đơn giao này không thuộc về bạn.");
  }
  if (row.status !== "shipping" || row.courier_type !== "mechanic") {
    return fail(400, "Đơn này không ở trạng thái đang giao bởi thợ.");
  }
  if (row.payment_method !== "cod") {
    return fail(400, "Đơn này không thu tiền mặt khi giao.");
  }
  if (row.payment_status !== "unpaid") {
    return fail(409, "Đơn này không còn khoản cần thu.");
  }
  const failure = await verifyCashConfirmCode(
    actor.id,
    "order",
    orderId,
    row.payment_confirm_code,
    confirmCode || undefined,
    "cash",
  );
  if (failure === "missing") {
    return fail(409, "Chưa cấp mã xác nhận — hãy bấm 'Lấy mã từ khách' trước.");
  }
  if (failure === "mismatch") {
    return fail(400, "Mã xác nhận không đúng. Kiểm tra lại với khách hàng.");
  }
  const now = new Date();
  await setOrderPaymentCode(orderId, null, now);
  await applyStatusChange(
    row,
    "delivered",
    actor.id,
    note || "Giao hàng tận nơi — đã thu tiền COD",
    null,
  );
  await recordAuditEvent({
    eventId: randomUUID(),
    actorId: actor.id,
    action: "recorded",
    refType: "order",
    refId: orderId,
    paymentId: null,
    amount: row.total ?? 0,
    method: "cash",
    detail: "courier COD collected with customer confirm code",
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
  const detail = await loadOrderDetail(orderId);
  if (!detail) return fail(500, "Không cập nhật được đơn hàng.");
  return { ok: true, data: detail };
}
