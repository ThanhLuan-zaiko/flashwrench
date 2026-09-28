import { randomUUID } from "node:crypto";
import {
  findPaymentRowById,
  type PaymentRow,
} from "@/lib/payments/booking-payment.repository";
import type {
  OrderInvoice,
  OrderPaymentReceipt,
} from "@/lib/payments/order-payment.types";
import { isUuid } from "@/lib/validation";
import { projectOrderReceipts } from "./order-revenue";
import { toOrderDetail } from "./orders.mapper";
import {
  findOrderRowById,
  listOrderHistoryRows,
  listOrderItemRows,
} from "./orders.repository";
import type {
  OrderDetail,
  OrderFieldErrors,
  OrderRow,
  OrdersResult,
} from "./orders.types";
import {
  listOrderPaymentRefs,
  markOrderPaymentStatus,
} from "./orders-delivery.repository";
import { insertOrderHistory } from "./orders-write.repository";

export type OrderPaymentResult = {
  order: OrderDetail;
  providerRef: string | null;
  paidAt: string | null;
};

function fail<T>(status: number, form: string): OrdersResult<T> {
  return { ok: false, status, errors: { form } };
}

function failFields<T>(
  status: number,
  errors: OrderFieldErrors,
): OrdersResult<T> {
  return { ok: false, status, errors };
}

const TERMINAL_STATUSES = new Set([
  "delivered",
  "return_requested",
  "cancelled",
  "refunded",
]);

async function loadDetail(orderId: string): Promise<OrderDetail | null> {
  const row = await findOrderRowById(orderId);
  if (!row) return null;
  const [items, history] = await Promise.all([
    listOrderItemRows(orderId),
    listOrderHistoryRows(orderId),
  ]);
  return toOrderDetail(row, items, history);
}

// Shared settle path for the two collection points: flip the order + every
// payment projection to paid and record the event on the order timeline so
// both customer and staff can see who collected, when, and how.
async function settlePayment(
  row: OrderRow,
  changedBy: string,
  note: string,
  providerRef?: string,
): Promise<OrdersResult<OrderPaymentResult>> {
  const now = new Date();
  await markOrderPaymentStatus({
    orderId: row.order_id,
    customerId: row.customer_id,
    paymentStatus: "paid",
    paidAt: now,
    now,
    paymentRefs: await listOrderPaymentRefs(row.order_id),
    providerRef,
    recordedBy: changedBy,
  });
  await projectOrderReceipts(row.order_id, changedBy, now);
  await insertOrderHistory({
    orderId: row.order_id,
    oldStatus: row.status ?? null,
    newStatus: row.status ?? "pending",
    changedBy,
    note,
    now,
  });
  const detail = await loadDetail(row.order_id);
  if (!detail) {
    return fail(500, "Không cập nhật được thanh toán. Vui lòng thử lại.");
  }
  return {
    ok: true,
    data: {
      order: detail,
      providerRef: providerRef ?? null,
      paidAt: now.toISOString(),
    },
  };
}

// Simulated online gateway: the customer chose "Thanh toán online (giả
// lập)" at checkout, then confirms the fake transfer on the order page.
// No real money moves — the payment settles immediately with a MOCK-*
// provider reference so the flow can be demoed end to end.
export async function payOrderOnlineMock(
  customerId: string,
  orderId: string,
): Promise<OrdersResult<OrderPaymentResult>> {
  if (!isUuid(orderId)) return fail(400, "Mã đơn hàng không hợp lệ.");
  const row = await findOrderRowById(orderId);
  if (!row) return fail(404, "Không tìm thấy đơn hàng.");
  if (row.customer_id !== customerId) {
    return fail(403, "Đơn hàng này không thuộc tài khoản của bạn.");
  }
  if (row.payment_method !== "bank_transfer") {
    return failFields(400, {
      paymentMethod: "Đơn này không sử dụng thanh toán online.",
    });
  }
  if (row.payment_status !== "unpaid") {
    return fail(409, "Đơn hàng đã được thanh toán.");
  }
  if (TERMINAL_STATUSES.has(row.status ?? "")) {
    return fail(400, "Đơn hàng không còn ở trạng thái có thể thanh toán.");
  }
  const providerRef = `MOCK-${randomUUID().slice(0, 8).toUpperCase()}`;
  return settlePayment(
    row,
    customerId,
    `Thanh toán online (giả lập) · Mã GD ${providerRef}`,
    providerRef,
  );
}

// Counter collection: staff marks a "Thanh toán tại quầy" order paid when
// the customer hands over the money at the workshop — before the goods are
// delivered or picked up. Delivery-time collection still happens through
// the delivered transition, which settles whatever is left unpaid.
export async function collectCounterPayment(
  staffId: string,
  orderId: string,
): Promise<OrdersResult<OrderPaymentResult>> {
  if (!isUuid(orderId)) return fail(400, "Mã đơn hàng không hợp lệ.");
  const row = await findOrderRowById(orderId);
  if (!row) return fail(404, "Không tìm thấy đơn hàng.");
  if (row.payment_method !== "counter") {
    return failFields(400, {
      paymentMethod: "Đơn này không phải thanh toán tại quầy.",
    });
  }
  if (row.payment_status !== "unpaid") {
    return fail(409, "Đơn hàng đã được thanh toán.");
  }
  if (TERMINAL_STATUSES.has(row.status ?? "")) {
    return fail(400, "Đơn hàng không còn ở trạng thái có thể thu tiền.");
  }
  return settlePayment(row, staffId, "Thu tiền tại quầy");
}

function toReceipt(row: PaymentRow): OrderPaymentReceipt {
  return {
    paymentId: row.payment_id,
    method: row.method,
    status: row.status,
    amount: row.amount,
    providerRef: row.provider_ref,
    paidAt: row.paid_at?.toISOString() ?? null,
    createdAt: row.created_at?.toISOString() ?? null,
  };
}

// Staff invoice view (dispatcher + admin): the full order detail plus the
// latest payment projection. orders can accumulate more than one payment
// row (e.g. refund markers), so pick the newest by clustering timestamp.
export async function getOrderInvoice(
  orderId: string,
): Promise<OrdersResult<OrderInvoice>> {
  if (!isUuid(orderId)) return fail(400, "Mã đơn hàng không hợp lệ.");
  const row = await findOrderRowById(orderId);
  if (!row) return fail(404, "Không tìm thấy đơn hàng.");
  const detail = await loadDetail(orderId);
  if (!detail) {
    return fail(500, "Không tải được hóa đơn. Vui lòng thử lại.");
  }
  const refs = await listOrderPaymentRefs(orderId);
  const latest = refs
    .filter((ref) => ref.createdAt instanceof Date)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .at(0);
  const payment = latest ? await findPaymentRowById(latest.paymentId) : null;
  return {
    ok: true,
    data: { order: detail, payment: payment ? toReceipt(payment) : null },
  };
}
