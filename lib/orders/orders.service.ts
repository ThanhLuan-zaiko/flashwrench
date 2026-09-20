import type { UserRole } from "@/lib/auth/user.types";
import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import { MECHANIC_TIME_ZONE, monthKey } from "@/lib/mechanic/mechanic-period";
import { restockForOrder } from "@/lib/parts/parts-lifecycle.service";
import { toOrderDetail, toOrderSummary } from "./orders.mapper";
import {
  findOrderRowById,
  listOrderHistoryRows,
  listOrderItemRows,
  listOrderRowsByCustomer,
  listOrderRowsByStatus,
} from "./orders.repository";
import {
  canTransition,
  isOrderStatus,
  type OrderDetail,
  type OrderFieldErrors,
  type OrderStatus,
  type OrderSummary,
  type OrdersResult,
  RESTOCK_TRANSITIONS,
  requiresAdminTransition,
} from "./orders.types";
import {
  insertOrderHistory,
  updateOrderStatusRows,
} from "./orders-write.repository";

const ORDERS_CURSOR_SCOPE = "dispatch-orders";
const ORDERS_PAGE_LIMIT = 20;

function fail<T>(status: number, form: string): OrdersResult<T> {
  return { ok: false, status, errors: { form } };
}

function failFields<T>(
  status: number,
  errors: OrderFieldErrors,
): OrdersResult<T> {
  return { ok: false, status, errors };
}

export async function listMyOrders(
  customerId: string,
): Promise<OrdersResult<OrderSummary[]>> {
  const rows = await listOrderRowsByCustomer(customerId);
  return { ok: true, data: rows.map(toOrderSummary) };
}

async function loadDetail(orderId: string): Promise<OrderDetail | null> {
  const row = await findOrderRowById(orderId);
  if (!row) return null;
  const [items, history] = await Promise.all([
    listOrderItemRows(orderId),
    listOrderHistoryRows(orderId),
  ]);
  return toOrderDetail(row, items, history);
}

// Owner read: customers only ever see their own orders.
export async function getMyOrder(
  customerId: string,
  orderId: string,
): Promise<OrdersResult<OrderDetail>> {
  const row = await findOrderRowById(orderId);
  if (!row) return fail(404, "Không tìm thấy đơn hàng.");
  if (row.customer_id !== customerId) {
    return fail(403, "Đơn hàng này không thuộc tài khoản của bạn.");
  }
  const detail = await loadDetail(orderId);
  if (!detail) return fail(404, "Không tìm thấy đơn hàng.");
  return { ok: true, data: detail };
}

export async function getOrderForStaff(
  orderId: string,
): Promise<OrdersResult<OrderDetail>> {
  const detail = await loadDetail(orderId);
  if (!detail) return fail(404, "Không tìm thấy đơn hàng.");
  return { ok: true, data: detail };
}

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
  await applyStatusChange(row, "cancelled", customerId, "Khách hàng hủy");
  const detail = await loadDetail(orderId);
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

// Staff transition: the state machine guards the move, admin-only targets
// (refund) check the role, and a cancel restocks the purchased items.
export async function updateOrderStatus(
  actor: { id: string; role: UserRole },
  orderId: string,
  nextStatus: unknown,
  note?: string,
): Promise<OrdersResult<OrderDetail>> {
  if (!isOrderStatus(nextStatus)) {
    return failFields(400, { status: "Trạng thái đơn hàng không hợp lệ." });
  }
  const row = await findOrderRowById(orderId);
  if (!row) return fail(404, "Không tìm thấy đơn hàng.");
  const from = isOrderStatus(row.status) ? row.status : "pending";
  if (from === nextStatus) {
    return fail(400, "Đơn hàng đã ở trạng thái này.");
  }
  if (!canTransition(from, nextStatus)) {
    return failFields(400, {
      status: "Không thể chuyển đơn hàng sang trạng thái này.",
    });
  }
  if (requiresAdminTransition(nextStatus) && actor.role !== "admin") {
    return fail(403, "Chỉ quản trị viên mới được hoàn tiền đơn hàng.");
  }
  await applyStatusChange(row, nextStatus, actor.id, note ?? "");
  const detail = await loadDetail(orderId);
  if (!detail) return fail(500, "Không cập nhật được đơn hàng.");
  return { ok: true, data: detail };
}

async function applyStatusChange(
  row: NonNullable<Awaited<ReturnType<typeof findOrderRowById>>>,
  nextStatus: OrderStatus,
  changedBy: string,
  note: string,
): Promise<void> {
  const now = new Date();
  const createdAt = row.created_at ?? now;
  const monthBucket =
    row.month_bucket ?? monthKey(createdAt, MECHANIC_TIME_ZONE);
  await updateOrderStatusRows({
    orderId: row.order_id,
    customerId: row.customer_id,
    oldStatus: row.status ?? "pending",
    newStatus: nextStatus,
    monthBucket,
    createdAt,
    total: row.total ?? 0,
    now,
  });
  await insertOrderHistory({
    orderId: row.order_id,
    oldStatus: row.status ?? null,
    newStatus: nextStatus,
    changedBy,
    note,
    now,
  });
  if (RESTOCK_TRANSITIONS.includes(nextStatus)) {
    const items = await listOrderItemRows(row.order_id);
    for (const item of items) {
      await restockForOrder(item.part_id, item.quantity ?? 0).catch(
        () => undefined,
      );
    }
  }
}
