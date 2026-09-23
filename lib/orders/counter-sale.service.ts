import { randomUUID } from "node:crypto";
import { MECHANIC_TIME_ZONE, monthKey } from "@/lib/mechanic/mechanic-period";
import {
  reserveOrderLines,
  validateCounterSaleLines,
} from "./order-lines.service";
import { toOrderDetail } from "./orders.mapper";
import {
  findOrderRowById,
  listOrderHistoryRows,
  listOrderItemRows,
} from "./orders.repository";
import type {
  CounterSaleInput,
  OrderDetail,
  OrderFieldErrors,
  OrdersResult,
} from "./orders.types";
import { insertOrder } from "./orders-write.repository";

function fail<T>(status: number, form: string): OrdersResult<T> {
  return { ok: false, status, errors: { form } };
}

function failFields<T>(
  status: number,
  errors: OrderFieldErrors,
): OrdersResult<T> {
  return { ok: false, status, errors };
}

// Walk-in counter sale: staff picks the parts, payment is collected at
// the counter and the goods leave immediately — so the order is born
// delivered + paid with pickup fulfillment and no customer account.
export async function createCounterSale(
  staffId: string,
  raw: CounterSaleInput,
): Promise<OrdersResult<OrderDetail>> {
  const lineErrors = validateCounterSaleLines(raw?.lines);
  if (lineErrors) return failFields(400, lineErrors);
  const errors: OrderFieldErrors = {};
  const customerName = (raw.customerName ?? "").trim().replace(/\s+/g, " ");
  if (customerName.length > 100) {
    errors.recipientName = "Tên khách tối đa 100 ký tự.";
  }
  const customerPhone = (raw.customerPhone ?? "").trim();
  if (customerPhone.length > 20) {
    errors.phone = "Số điện thoại tối đa 20 ký tự.";
  }
  if (raw.note !== undefined && raw.note.length > 500) {
    errors.note = "Ghi chú tối đa 500 ký tự.";
  }
  if (Object.keys(errors).length > 0) return failFields(400, errors);

  const reserved = await reserveOrderLines(
    raw.lines.map((line) => ({
      partId: line.partId,
      quantity: line.quantity,
    })),
  );
  if (!reserved.ok) return reserved;

  const { lines, subtotal } = reserved.data;
  const now = new Date();
  const orderId = randomUUID();
  await insertOrder({
    orderId,
    customerId: null,
    customerName: customerName || "Khách mua tại quầy",
    customerPhone,
    address: null,
    status: "delivered",
    paymentStatus: "paid",
    paidAt: now,
    fulfillmentType: "pickup",
    historyNote: "Bán tại quầy",
    createdBy: staffId,
    subtotal,
    shippingFee: 0,
    total: subtotal,
    note: (raw.note ?? "").trim(),
    monthBucket: monthKey(now, MECHANIC_TIME_ZONE),
    lines,
    paymentId: randomUUID(),
    now,
  });
  const row = await findOrderRowById(orderId);
  if (!row) return fail(500, "Không tạo được đơn bán. Vui lòng thử lại.");
  const [items, history] = await Promise.all([
    listOrderItemRows(orderId),
    listOrderHistoryRows(orderId),
  ]);
  return { ok: true, data: toOrderDetail(row, items, history) };
}
