import { MECHANIC_TIME_ZONE, monthKey } from "@/lib/mechanic/mechanic-period";
import { isUuid } from "@/lib/validation";
import {
  latestDeliveredAt,
  returnWindowOpen,
  validateReturnInput,
} from "./order-return";
import { findOrderRowById, listOrderHistoryRows } from "./orders.repository";
import { loadOrderDetail } from "./orders.service";
import type {
  OrderDetail,
  OrderFieldErrors,
  OrdersResult,
} from "./orders.types";
import {
  insertOrderHistory,
  saveOrderReturnRequest,
  updateOrderStatusRows,
} from "./orders-write.repository";

function fail<T>(status: number, form: string): OrdersResult<T> {
  return { ok: false, status, errors: { form } };
}

// Customer return/refund request: the delivered order must still be inside
// the 3-day window and carry a reason plus at least one evidence photo.
// Approving/rejecting happens on the staff board via updateOrderStatus.
export async function requestOrderReturn(
  customerId: string,
  orderId: string,
  input: { reason: unknown; images: unknown },
): Promise<OrdersResult<OrderDetail>> {
  if (!isUuid(orderId)) return fail(404, "Không tìm thấy đơn hàng.");
  const row = await findOrderRowById(orderId);
  if (!row) return fail(404, "Không tìm thấy đơn hàng.");
  if (row.customer_id !== customerId) {
    return fail(403, "Đơn hàng này không thuộc tài khoản của bạn.");
  }
  if (row.status !== "delivered") {
    return fail(400, "Chỉ đơn đã giao mới gửi được yêu cầu đổi trả.");
  }
  const history = await listOrderHistoryRows(orderId);
  const deliveredAt = latestDeliveredAt(
    history.map((h) => ({
      newStatus: h.new_status ?? "",
      changedAt: h.changed_at,
    })),
  );
  const now = new Date();
  if (!returnWindowOpen(deliveredAt, now)) {
    return fail(400, "Đã quá 3 ngày kể từ khi nhận hàng — không thể đổi trả.");
  }
  const fieldErrors = validateReturnInput(input);
  if (fieldErrors) {
    return { ok: false, status: 400, errors: fieldErrors as OrderFieldErrors };
  }
  const reason = String(input.reason).trim();
  const images = input.images as string[];

  const createdAt = row.created_at ?? now;
  const monthBucket =
    row.month_bucket ?? monthKey(createdAt, MECHANIC_TIME_ZONE);
  await updateOrderStatusRows({
    orderId: row.order_id,
    customerId: row.customer_id,
    oldStatus: "delivered",
    newStatus: "return_requested",
    monthBucket,
    createdAt,
    total: row.total ?? 0,
    now,
  });
  await saveOrderReturnRequest({
    orderId: row.order_id,
    reason,
    images,
    now,
  });
  await insertOrderHistory({
    orderId: row.order_id,
    oldStatus: "delivered",
    newStatus: "return_requested",
    changedBy: customerId,
    note: `Yêu cầu đổi trả: ${reason}`,
    now,
  });
  const detail = await loadOrderDetail(orderId);
  if (!detail) return fail(500, "Không cập nhật được đơn hàng.");
  return { ok: true, data: detail };
}
