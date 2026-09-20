import type { PublicUser } from "@/lib/auth/user.types";
import { nextTransitionAt } from "@/lib/booking/booking-workflow.service";
import type { WorkspaceResult } from "@/lib/booking/workspace.types";
import { toIso } from "@/lib/mechanic/mechanic.types";
import { findBookingRowById } from "@/lib/mechanic/mechanic-bookings.repository";
import { toBookingStatus } from "@/lib/mechanic/mechanic-mapper";
import { publishBookingChange } from "@/lib/realtime/domain-publish";
import { isRecord, isUuid, numericInput } from "@/lib/validation";
import {
  claimBookingPayment,
  claimBookingPaymentStatus,
  findPaymentRowById,
  listPaymentRefPaymentIds,
  type PaymentRow,
  type PaymentWrite,
  projectBookingPayment,
} from "./booking-payment.repository";
import {
  BOOKING_PAYMENT_METHODS,
  type BookingPayment,
  type BookingPaymentMethod,
} from "./booking-payment.types";

function fail<T>(status: number, form: string): WorkspaceResult<T> {
  return { ok: false, status, errors: { form } };
}

function fieldFail<T>(
  status: number,
  errors: Record<string, string>,
): WorkspaceResult<T> {
  return { ok: false, status, errors };
}

function toPayment(row: PaymentRow): BookingPayment {
  return {
    id: row.payment_id,
    bookingId: row.ref_id ?? "",
    amount: row.amount ?? 0,
    method: (row.method ?? "cod") as BookingPaymentMethod,
    paidAt: toIso(row.paid_at),
  };
}

function isValidDate(value: Date | null): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function writeFromRow(row: PaymentRow): PaymentWrite {
  return {
    paymentId: row.payment_id,
    refType: row.ref_type ?? "booking",
    refId: row.ref_id ?? "",
    customerId: row.customer_id ?? "",
    amount: row.amount ?? 0,
    method: row.method ?? "cod",
    status: row.status ?? "paid",
    paidAt: row.paid_at ?? new Date(0),
    createdAt: row.created_at ?? new Date(0),
  };
}

export async function recordBookingPayment(
  actor: PublicUser,
  bookingId: string,
  raw: unknown,
): Promise<WorkspaceResult<BookingPayment>> {
  if (actor.role !== "mechanic" && actor.role !== "admin") {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  if (!isUuid(bookingId)) return fail(400, "Mã đơn hàng không hợp lệ.");
  if (!isRecord(raw)) {
    return fieldFail(400, { form: "Dữ liệu gửi lên không hợp lệ." });
  }
  if (
    typeof raw.method !== "string" ||
    !BOOKING_PAYMENT_METHODS.includes(raw.method as BookingPaymentMethod)
  ) {
    return fieldFail(400, {
      method: "Phương thức thanh toán không hợp lệ.",
    });
  }
  if (raw.confirmed !== true) {
    return fieldFail(400, {
      confirmed: "Vui lòng xác nhận đã nhận đủ tiền.",
    });
  }
  const method = raw.method as BookingPaymentMethod;

  const booking = await findBookingRowById(bookingId);
  if (!booking) return fail(404, "Không tìm thấy đơn hàng này.");
  if (actor.role === "mechanic" && booking.mechanic_id !== actor.id) {
    return fail(403, "Đơn hàng này không thuộc về bạn.");
  }
  if (toBookingStatus(booking.status) !== "completed") {
    return fail(400, "Chỉ ghi nhận thanh toán cho đơn đã hoàn thành.");
  }
  if (
    booking.payment_status !== "unpaid" &&
    booking.payment_status !== "paid"
  ) {
    return fail(409, "Trạng thái thanh toán không hợp lệ.");
  }
  const total = booking.total ?? 0;
  if (!Number.isSafeInteger(total) || total < 0) {
    return fail(400, "Tổng tiền đơn hàng không hợp lệ.");
  }
  if (raw.amount !== undefined && numericInput(raw.amount) !== total) {
    return fieldFail(400, { amount: "Số tiền phải khớp tổng đơn hàng." });
  }
  const customerId = booking.customer_id;
  if (!customerId || !isUuid(customerId)) {
    return fail(409, "Đơn hàng thiếu thông tin khách hàng.");
  }

  const refPaymentIds = await listPaymentRefPaymentIds("booking", bookingId);
  const siblings = await Promise.all(
    refPaymentIds
      .filter((paymentId) => paymentId !== bookingId)
      .map((paymentId) => findPaymentRowById(paymentId)),
  );
  const conflicting = siblings.find(
    (row) =>
      row !== null &&
      (row.customer_id !== customerId ||
        (row.amount ?? 0) !== 0 ||
        row.status === "partial" ||
        row.status === "refunded"),
  );
  if (conflicting) {
    return fail(409, "Đơn này đã có giao dịch thanh toán khác.");
  }

  const status = booking.status ?? "completed";
  const matchesReceipt = (row: PaymentRow): boolean =>
    row.ref_type === "booking" &&
    row.ref_id === bookingId &&
    row.customer_id === customerId &&
    row.amount === total &&
    row.method === method &&
    row.status === "paid" &&
    isValidDate(row.paid_at) &&
    isValidDate(row.created_at);

  const settleStatus = async (at: Date): Promise<boolean> => {
    const applied = await claimBookingPaymentStatus(
      bookingId,
      "paid",
      "completed",
      booking.payment_status ?? "unpaid",
      at,
    );
    if (applied) return true;
    const reread = await findBookingRowById(bookingId);
    if (
      !reread ||
      toBookingStatus(reread.status) !== "completed" ||
      reread.payment_status !== "paid"
    ) {
      return false;
    }
    const rereadReceipt = await findPaymentRowById(bookingId);
    return rereadReceipt !== null && matchesReceipt(rereadReceipt);
  };

  const settleAndPublish = async (
    receipt: PaymentRow,
    at: Date,
  ): Promise<WorkspaceResult<BookingPayment>> => {
    await projectBookingPayment(writeFromRow(receipt));
    if (!(await settleStatus(at))) {
      return fail(409, "Trạng thái thanh toán vừa thay đổi. Vui lòng tải lại.");
    }
    await publishBookingChange(
      "payment-recorded",
      bookingId,
      status,
      customerId,
      [booking.mechanic_id],
    );
    return { ok: true, data: toPayment(receipt) };
  };

  const persisted = await findPaymentRowById(bookingId);
  if (booking.payment_status === "paid") {
    if (!persisted || !matchesReceipt(persisted)) {
      return fail(409, "Đơn này đã có giao dịch thanh toán khác.");
    }
    await projectBookingPayment(writeFromRow(persisted));
    await publishBookingChange(
      "payment-recorded",
      bookingId,
      status,
      customerId,
      [booking.mechanic_id],
    );
    return { ok: true, data: toPayment(persisted) };
  }

  const now = nextTransitionAt(booking);
  if (persisted) {
    if (!matchesReceipt(persisted)) {
      return fail(409, "Đơn này đã có giao dịch thanh toán khác.");
    }
    return settleAndPublish(persisted, now);
  }

  const write: PaymentWrite = {
    paymentId: bookingId,
    refType: "booking",
    refId: bookingId,
    customerId,
    amount: total,
    method,
    status: "paid",
    paidAt: now,
    createdAt: now,
  };
  const claimed = await claimBookingPayment(write);
  if (!claimed) {
    const reread = await findPaymentRowById(bookingId);
    if (!reread || !matchesReceipt(reread)) {
      return fail(409, "Đơn này đã có giao dịch thanh toán khác.");
    }
    return settleAndPublish(reread, now);
  }
  return settleAndPublish(
    {
      payment_id: write.paymentId,
      ref_type: write.refType,
      ref_id: write.refId,
      customer_id: write.customerId,
      amount: write.amount,
      method: write.method,
      status: write.status,
      paid_at: write.paidAt,
      created_at: write.createdAt,
    },
    now,
  );
}
