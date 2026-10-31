import type { UserRole } from "@/lib/auth/user.types";
import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import { MECHANIC_TIME_ZONE, monthKey } from "@/lib/mechanic/mechanic-period";
import { clearPaymentPrompt } from "@/lib/payments/payment-prompt.service";
import { handleVoucherOrderTransition } from "@/lib/vouchers/auto-grant.service";
import {
  type ResolvedCourier,
  resolveCourierConfig,
} from "./order-courier.service";
import { restockOrderItems } from "./order-restock";
import { projectOrderReceipts, refundOrderReceipts } from "./order-revenue";
import { refundOrderWallet } from "./order-wallet-restore";
import { ORDER_CONFLICT_MESSAGE } from "./orders.constants";
import { toOrderSummary } from "./orders.mapper";
import { findOrderRowById, listOrderRowsByStatus } from "./orders.repository";
import {
  type CourierConfigInput,
  canTransitionForOrder,
  isFulfillmentType,
  isOrderStatus,
  type OrderDetail,
  type OrderRow,
  type OrderStatus,
  type OrderSummary,
  type OrdersResult,
  RESTOCK_TRANSITIONS,
  requiresAdminTransition,
} from "./orders.types";
import {
  assignOrderCourier,
  listOrderPaymentRefs,
  markOrderPaymentStatus,
  updateOrderCourierStatus,
} from "./orders-delivery.repository";
import { loadOrderDetail } from "./orders-read.service";
import { fail, failFields } from "./orders-result";
import {
  insertOrderHistory,
  saveOrderReturnDecision,
  updateOrderStatusRows,
} from "./orders-write.repository";

const ORDERS_CURSOR_SCOPE = "dispatch-orders";
const ORDERS_PAGE_LIMIT = 20;

// Customer cancel: only while the order is still pending. Items go back
// into stock and the history row records who cancelled.
export async function cancelMyOrder(
  customerId: string,
  orderId: string,
): Promise<OrdersResult<OrderDetail>> {
  const row = await findOrderRowById(orderId);
  if (!row) return fail(404, "Không tìm thấy đơn hàng.");
  if (row.customer_id !== customerId) {
    return fail(403, "Đơn hàng này không thuộc tài khoản của bạn.");
  }
  if (row.status !== "pending") {
    return fail(
      400,
      "Đơn hàng đã được xử lý, không thể hủy. Vui lòng liên hệ cửa hàng.",
    );
  }
  const cancelled = await applyStatusChange(
    row,
    "cancelled",
    customerId,
    "Khách hàng hủy",
    null,
  );
  if (!cancelled) return fail(409, ORDER_CONFLICT_MESSAGE);
  // Simulated money is refunded by the status move above; the spent
  // wallet comes back to the owner so a cancel never eats the voucher.
  await refundOrderWallet({
    couponCode: row.coupon_code,
    customerId: row.customer_id,
    orderId,
    amount: row.discount ?? 0,
  });
  const detail = await loadOrderDetail(orderId);
  if (!detail) return fail(500, "Không cập nhật được đơn hàng.");
  return { ok: true, data: detail };
}

export type StaffOrdersParams = {
  status: string;
  month?: string;
  cursor?: string | null;
  limit?: string;
};

export type StaffOrdersPage = {
  items: OrderSummary[];
  nextCursor: string | null;
};

// Dispatcher board: page one status partition of one month bucket.
export async function listStaffOrders(
  params: StaffOrdersParams,
): Promise<OrdersResult<StaffOrdersPage>> {
  if (!isOrderStatus(params.status)) {
    return failFields(400, { status: "Trạng thái đơn hàng không hợp lệ." });
  }
  const month = params.month ?? monthKey(new Date(), MECHANIC_TIME_ZONE);
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return failFields(400, { status: "Tháng không hợp lệ." });
  }
  const limit = Math.min(
    Math.max(Number.parseInt(params.limit ?? "", 10) || ORDERS_PAGE_LIMIT, 1),
    50,
  );
  let pageState: string | null = null;
  try {
    pageState = decodeCursor(params.cursor ?? null, ORDERS_CURSOR_SCOPE);
  } catch {
    return failFields(400, { status: "Con trỏ phân trang không hợp lệ." });
  }
  const page = await listOrderRowsByStatus(
    params.status,
    month,
    limit,
    pageState,
  );
  return {
    ok: true,
    data: {
      items: page.rows.map(toOrderSummary),
      nextCursor: encodeCursor(page.pageState, ORDERS_CURSOR_SCOPE),
    },
  };
}

// Staff transition: the fulfillment-aware state machine guards the move,
// shipping requires a courier assignment, delivery settles the COD
// payment, and a cancel restocks the purchased items.
export async function updateOrderStatus(
  actor: { id: string; role: UserRole },
  orderId: string,
  nextStatus: unknown,
  note?: string,
  courier?: CourierConfigInput,
  options?: { restockReturned?: boolean },
): Promise<OrdersResult<OrderDetail>> {
  if (!isOrderStatus(nextStatus)) {
    return failFields(400, { status: "Trạng thái đơn hàng không hợp lệ." });
  }
  const row = await findOrderRowById(orderId);
  if (!row) return fail(404, "Không tìm thấy đơn hàng.");
  const fulfillment = isFulfillmentType(row.fulfillment_type)
    ? row.fulfillment_type
    : "delivery";
  const from = isOrderStatus(row.status) ? row.status : "pending";
  if (from === nextStatus) {
    return fail(400, "Đơn hàng đã ở trạng thái này.");
  }
  if (!canTransitionForOrder(from, nextStatus, fulfillment)) {
    return failFields(400, {
      status: "Không thể chuyển đơn hàng sang trạng thái này.",
    });
  }
  if (requiresAdminTransition(from, nextStatus) && actor.role !== "admin") {
    return fail(403, "Chỉ quản trị viên mới được hoàn tiền đơn hàng.");
  }
  // Rejecting a return request always needs a reason — it lands on the
  // order timeline and is shown back to the customer.
  if (
    from === "return_requested" &&
    nextStatus === "delivered" &&
    !(note ?? "").trim()
  ) {
    return failFields(400, { note: "Nhập lý do từ chối yêu cầu đổi trả." });
  }
  // Staff-side cancels carry a reason for the same reason: the note is
  // the customer's only explanation on their timeline.
  if (nextStatus === "cancelled" && !(note ?? "").trim()) {
    return failFields(400, {
      note: "Nhập lý do hủy đơn — khách hàng sẽ thấy thông báo này.",
    });
  }
  // Mechanic-courier COD deliveries must settle through the collect path so
  // the customer's confirm code is verified — a bare "delivered" click here
  // would auto-mark the order paid without the customer present.
  if (
    nextStatus === "delivered" &&
    from === "shipping" &&
    row.courier_type === "mechanic" &&
    row.payment_method === "cod" &&
    row.payment_status === "unpaid"
  ) {
    return fail(
      400,
      "Đơn COD do thợ giao phải thu tiền bằng mã xác nhận của khách.",
    );
  }
  let resolvedCourier: ResolvedCourier | null = null;
  if (nextStatus === "shipping") {
    const resolved = await resolveCourierConfig(courier, orderId);
    if (!resolved.ok) return resolved;
    resolvedCourier = resolved.data;
  }
  const applied = await applyStatusChange(
    row,
    nextStatus,
    actor.id,
    note ?? "",
    resolvedCourier,
    options?.restockReturned === true,
  );
  if (!applied) return fail(409, ORDER_CONFLICT_MESSAGE);
  // Staff cancels and refunds return the spent wallet the same way the
  // customer cancel above does; other moves leave the wallet consumed.
  if (nextStatus === "cancelled" || nextStatus === "refunded") {
    await refundOrderWallet({
      couponCode: row.coupon_code,
      customerId: row.customer_id,
      orderId,
      amount: row.discount ?? 0,
    });
  }
  const detail = await loadOrderDetail(orderId);
  if (!detail) return fail(500, "Không cập nhật được đơn hàng.");
  return { ok: true, data: detail };
}

// Exported for the courier collect path (order-courier-collect.service):
// mechanic-courier COD delivery settles through the same transition as
// the staff "delivered" button so all projections stay identical.
export async function applyStatusChange(
  row: OrderRow,
  nextStatus: OrderStatus,
  changedBy: string,
  note: string,
  courier: ResolvedCourier | null,
  restockReturned = false,
): Promise<boolean> {
  const now = new Date();
  const createdAt = row.created_at ?? now;
  const monthBucket =
    row.month_bucket ?? monthKey(createdAt, MECHANIC_TIME_ZONE);
  const claimed = await updateOrderStatusRows({
    orderId: row.order_id,
    customerId: row.customer_id,
    oldStatus: row.status ?? "pending",
    newStatus: nextStatus,
    monthBucket,
    createdAt,
    total: row.total ?? 0,
    now,
  });
  // Lost the claim: another move already changed the order. Nothing after
  // this point (payments, stock, wallet, history) may run for this call.
  if (!claimed) return false;
  if (nextStatus === "shipping" && courier) {
    await assignOrderCourier({
      orderId: row.order_id,
      courierType: courier.type,
      courierId: courier.courierId,
      courierName: courier.courierName,
      trackingCode: courier.trackingCode,
      orderCreatedAt: createdAt,
      orderTotal: row.total ?? 0,
      customerName: row.customer_name ?? "",
      now,
    });
  }
  if (row.courier_id && nextStatus !== "shipping") {
    await updateOrderCourierStatus({
      courierId: row.courier_id,
      orderCreatedAt: createdAt,
      orderId: row.order_id,
      status: nextStatus,
    });
  }
  if (nextStatus === "delivered" || nextStatus === "refunded") {
    const paymentStatus = nextStatus === "delivered" ? "paid" : "refunded";
    await markOrderPaymentStatus({
      orderId: row.order_id,
      customerId: row.customer_id,
      paymentStatus,
      paidAt: paymentStatus === "paid" ? now : null,
      now,
      paymentRefs: await listOrderPaymentRefs(row.order_id),
      recordedBy: changedBy,
    });
    if (paymentStatus === "paid") {
      await projectOrderReceipts(row.order_id, changedBy, now);
    } else {
      await refundOrderReceipts(row.order_id, changedBy);
    }
    // Settled or refunded: any customer-facing payment prompt is dead.
    await clearPaymentPrompt(row.customer_id, "order", row.order_id);
  }
  // A mock-paid order can still be cancelled while pending: the money is
  // simulated, so cancelling flips its payment rows straight to refunded.
  if (nextStatus === "cancelled" && row.payment_status === "paid") {
    await markOrderPaymentStatus({
      orderId: row.order_id,
      customerId: row.customer_id,
      paymentStatus: "refunded",
      paidAt: null,
      now,
      paymentRefs: await listOrderPaymentRefs(row.order_id),
    });
    await refundOrderReceipts(row.order_id, changedBy);
  }
  // Loyalty automation: delivered ticks the rollup and evaluates
  // count/value/spend rules; refunded unwinds the counters without
  // clawing back grants. Best-effort, never throws.
  await handleVoucherOrderTransition(row, nextStatus).catch(() => undefined);
  // Leaving the review queue: approving means the money goes back, a
  // rejection puts the order back on the delivered shelf.
  if (row.status === "return_requested") {
    await saveOrderReturnDecision({
      orderId: row.order_id,
      decision: nextStatus === "refunded" ? "approved" : "rejected",
      note,
      decidedBy: changedBy,
      now,
    });
  }
  await insertOrderHistory({
    orderId: row.order_id,
    oldStatus: row.status ?? null,
    newStatus: nextStatus,
    changedBy,
    note,
    now,
  });
  if (
    RESTOCK_TRANSITIONS.includes(nextStatus) ||
    (nextStatus === "refunded" && restockReturned)
  ) {
    await restockOrderItems(row.order_id);
  }
  return true;
}
