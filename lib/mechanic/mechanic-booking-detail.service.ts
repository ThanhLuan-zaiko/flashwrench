// Single-booking read model for the mechanic workspace: the detail dialog
// merges the booking row, line items, status history and the payment
// receipts so the collect section knows the remaining balance.

import { isUuid } from "@/lib/validation";
import type { MechanicBookingDetail, MechanicResult } from "./mechanic.types";
import {
  findBookingRowById,
  listBookingItemRowsByBookingIds,
  listStatusHistoryRows,
} from "./mechanic-bookings.repository";
import {
  groupItemsByBooking,
  toBookingStatus,
  toBookingSummary,
  toTimelineEntry,
  workloadFromDetail,
} from "./mechanic-mapper";
import { listPaymentRowsByRefIds } from "./mechanic-workspace.repository";

const HISTORY_LIMIT = 20;

function formError<T>(status: number, form: string): MechanicResult<T> {
  return { ok: false, status, errors: { form } };
}

export async function getMechanicBookingDetail(
  mechanicId: string,
  bookingId: string,
): Promise<MechanicResult<MechanicBookingDetail>> {
  if (!isUuid(bookingId)) return formError(400, "Mã đơn hàng không hợp lệ.");

  const detail = await findBookingRowById(bookingId);
  if (!detail) return formError(404, "Không tìm thấy đơn hàng này.");
  if (detail.mechanic_id !== mechanicId) {
    return formError(403, "Đơn hàng này không thuộc về bạn.");
  }
  const status = toBookingStatus(detail.status);
  if (!status) {
    return formError(400, "Đơn hàng đang ở trạng thái không xác định.");
  }

  const [itemRows, historyRows, paymentRows] = await Promise.all([
    listBookingItemRowsByBookingIds([bookingId]),
    listStatusHistoryRows(bookingId, HISTORY_LIMIT),
    listPaymentRowsByRefIds("booking", [bookingId]),
  ]);
  const items = groupItemsByBooking(itemRows).get(bookingId) ?? [];
  const summary = toBookingSummary({
    workload: workloadFromDetail(mechanicId, detail),
    detail,
    items,
    status,
  });
  // 'paid' receipts are installments: the dialog collects the balance left.
  const paymentReceived = paymentRows
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + (payment.amount ?? 0), 0);

  return {
    ok: true,
    data: {
      ...summary,
      items,
      timeline: historyRows
        .map(toTimelineEntry)
        .filter((entry) => entry !== null),
      cancelReason: detail.cancel_reason ?? "",
      paymentReceived,
      paymentOutstanding: Math.max(0, summary.total - paymentReceived),
    },
  };
}
