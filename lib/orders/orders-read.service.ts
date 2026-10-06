// Order read paths, split from orders.service.ts to keep both files under
// the size cap: customer list/detail (with the cash confirm code exposed
// to the owner only) and the staff detail read.
import { toOrderDetail, toOrderSummary } from "./orders.mapper";
import {
  findOrderRowById,
  listOrderHistoryRows,
  listOrderItemRows,
  listOrderRowsByCustomer,
} from "./orders.repository";
import type { OrderDetail, OrderSummary, OrdersResult } from "./orders.types";
import { fail } from "./orders-result";

export async function listMyOrders(
  customerId: string,
): Promise<OrdersResult<OrderSummary[]>> {
  const rows = await listOrderRowsByCustomer(customerId);
  return { ok: true, data: rows.map(toOrderSummary) };
}

export async function loadOrderDetail(
  orderId: string,
  exposePaymentCode = false,
): Promise<OrderDetail | null> {
  const row = await findOrderRowById(orderId);
  if (!row) return null;
  const [items, history] = await Promise.all([
    listOrderItemRows(orderId),
    listOrderHistoryRows(orderId),
  ]);
  return toOrderDetail(row, items, history, exposePaymentCode);
}

// Owner read: customers only ever see their own orders — including the
// cash confirm code while a courier COD collection is outstanding.
export async function getMyOrder(
  customerId: string,
  orderId: string,
): Promise<OrdersResult<OrderDetail>> {
  const row = await findOrderRowById(orderId);
  if (!row) return fail(404, "Không tìm thấy đơn hàng.");
  if (row.customer_id !== customerId) {
    return fail(403, "Đơn hàng này không thuộc tài khoản của bạn.");
  }
  const detail = await loadOrderDetail(orderId, true);
  if (!detail) return fail(404, "Không tìm thấy đơn hàng.");
  return { ok: true, data: detail };
}

export async function getOrderForStaff(
  orderId: string,
): Promise<OrdersResult<OrderDetail>> {
  const detail = await loadOrderDetail(orderId);
  if (!detail) return fail(404, "Không tìm thấy đơn hàng.");
  return { ok: true, data: detail };
}
