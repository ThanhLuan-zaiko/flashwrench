import type { PublicUser } from "@/lib/auth/user.types";
import { nextTransitionAt } from "@/lib/booking/booking-workflow.service";
import type { WorkspaceResult } from "@/lib/booking/workspace.types";
import { toIso } from "@/lib/mechanic/mechanic.types";
import { findBookingRowById } from "@/lib/mechanic/mechanic-bookings.repository";
import { toBookingStatus } from "@/lib/mechanic/mechanic-mapper";
import { publishBookingChange } from "@/lib/realtime/domain-publish";
import { projectReceipt } from "@/lib/revenue/revenue.service";
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
import { verifyCashConfirmCode } from "./payment-code.service";

type PaymentTotals = {
  received: number;
  outstanding: number;
  paymentStatus: "partial" | "paid";
};

function fail<T>(status: number, form: string): WorkspaceResult<T> {
  return { ok: false, status, errors: { form } };
}

function fieldFail<T>(
  status: number,
  errors: Record<string, string>,
): WorkspaceResult<T> {
  return { ok: false, status, errors };
}

function toPayment(row: PaymentRow, totals: PaymentTotals): BookingPayment {
  return {
    id: row.payment_id,
    bookingId: row.ref_id ?? "",
    amount: row.amount ?? 0,
    method: (row.method ?? "cod") as BookingPaymentMethod,
    paidAt: toIso(row.paid_at),
    received: totals.received,
    outstanding: totals.outstanding,
    paymentStatus: totals.paymentStatus,
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
    mechanicId: row.mechanic_id,
    amount: row.amount ?? 0,
    method: row.method ?? "cod",
    status: row.status ?? "paid",
    recordedBy: row.recorded_by,
    customerConfirmed: row.customer_confirmed,
    paidAt: row.paid_at ?? new Date(0),
    createdAt: row.created_at ?? new Date(0),
  };
}

// A booking can be settled in installments: each accepted request writes one
// 'paid' receipt keyed by the caller-supplied paymentId (default: bookingId),
// so retries replay instead of double-charging. The booking's payment_status
// moves unpaid -> partial -> paid as received reaches the total.
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
  if (raw.paymentId !== undefined && !isUuid(raw.paymentId)) {
    return fieldFail(400, { paymentId: "Mã giao dịch không hợp lệ." });
  }
  if (
    raw.confirmCode !== undefined &&
    (typeof raw.confirmCode !== "string" ||
      !/^\d{6}$/.test(raw.confirmCode.trim()))
  ) {
    return fieldFail(400, { confirmCode: "Mã xác nhận gồm 6 chữ số." });
  }
  const method = raw.method as BookingPaymentMethod;
  const paymentId = (raw.paymentId as string | undefined) ?? bookingId;
  const confirmCode =
    typeof raw.confirmCode === "string" ? raw.confirmCode.trim() : undefined;

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
    booking.payment_status !== "partial" &&
    booking.payment_status !== "paid"
  ) {
    return fail(409, "Trạng thái thanh toán không hợp lệ.");
  }
  const total = booking.total ?? 0;
  if (!Number.isSafeInteger(total) || total < 0) {
    return fail(400, "Tổng tiền đơn hàng không hợp lệ.");
  }
  const customerId = booking.customer_id;
  if (!customerId || !isUuid(customerId)) {
    return fail(409, "Đơn hàng thiếu thông tin khách hàng.");
  }

  // Cash is the bribery surface: the customer dictates a 6-digit code the
  // mechanic must echo back. Transfers leave a bank trail, so they skip
  // the code. Wrong codes are audited for the admin fraud screen.
  if (method === "cod") {
    const codeCheck = await verifyCashConfirmCode(
      actor.id,
      "booking",
      bookingId,
      booking.payment_confirm_code,
      confirmCode,
      method,
    );
    if (codeCheck === "missing") {
      return fieldFail(400, {
        confirmCode: "Chưa cấp mã xác nhận — hãy gửi mã cho khách trước.",
      });
    }
    if (codeCheck === "mismatch") {
      return fieldFail(400, {
        confirmCode: "Mã xác nhận không đúng. Hãy hỏi lại khách.",
      });
    }
  }
  const customerConfirmed = method === "cod" ? true : null;

  const refPaymentIds = await listPaymentRefPaymentIds("booking", bookingId);
  const siblings = (
    await Promise.all(refPaymentIds.map((id) => findPaymentRowById(id)))
  ).filter((row): row is PaymentRow => row !== null);
  // Installments all read as 'paid' receipts; any other status on a sibling
  // is foreign to this flow (partial writes, refunds, gateway attempts).
  const conflicting = siblings.find(
    (row) =>
      row.customer_id !== customerId ||
      (row.status !== "paid" && row.status !== "failed"),
  );
  if (conflicting) {
    return fail(409, "Đơn này đã có giao dịch thanh toán khác.");
  }
  const received = siblings
    .filter((row) => row.status === "paid")
    .reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const outstanding = Math.max(0, total - received);
  const requestedAmount =
    raw.amount === undefined ? null : numericInput(raw.amount);
  if (
    requestedAmount !== null &&
    (!Number.isSafeInteger(requestedAmount) || requestedAmount <= 0)
  ) {
    return fieldFail(400, { amount: "Số tiền không hợp lệ." });
  }

  const status = booking.status ?? "completed";
  const matchesReceipt = (row: PaymentRow): boolean =>
    row.ref_type === "booking" &&
    row.ref_id === bookingId &&
    row.customer_id === customerId &&
    row.method === method &&
    row.status === "paid" &&
    isValidDate(row.paid_at) &&
    isValidDate(row.created_at) &&
    (requestedAmount === null || row.amount === requestedAmount);

  // Already settled: replay only the exact receipt this request refers to.
  if (booking.payment_status === "paid" || outstanding === 0) {
    const receipt = await findPaymentRowById(paymentId);
    if (!receipt || !matchesReceipt(receipt)) {
      return fail(409, "Đơn này đã có giao dịch thanh toán khác.");
    }
    await projectBookingPayment(writeFromRow(receipt));
    await publishBookingChange(
      "payment-recorded",
      bookingId,
      status,
      customerId,
      [booking.mechanic_id],
    );
    return {
      ok: true,
      data: toPayment(receipt, {
        received,
        outstanding: 0,
        paymentStatus: "paid",
      }),
    };
  }

  const amount = requestedAmount ?? outstanding;
  if (amount > outstanding) {
    return fieldFail(400, {
      amount: "Số tiền không vượt quá phần còn lại của đơn.",
    });
  }
  const nextPaymentStatus: PaymentTotals["paymentStatus"] =
    amount === outstanding ? "paid" : "partial";
  const after: PaymentTotals = {
    received: received + amount,
    outstanding: outstanding - amount,
    paymentStatus: nextPaymentStatus,
  };
  const matchesAmount = (row: PaymentRow): boolean =>
    matchesReceipt(row) && row.amount === amount;

  const settleStatus = async (at: Date): Promise<boolean> => {
    const applied = await claimBookingPaymentStatus(
      bookingId,
      nextPaymentStatus,
      "completed",
      booking.payment_status ?? "unpaid",
      at,
    );
    if (applied) return true;
    const reread = await findBookingRowById(bookingId);
    return (
      !!reread &&
      toBookingStatus(reread.status) === "completed" &&
      (reread.payment_status === "paid" ||
        (nextPaymentStatus === "partial" &&
          reread.payment_status === "partial"))
    );
  };

  const settleAndPublish = async (
    receipt: PaymentRow,
    at: Date,
  ): Promise<WorkspaceResult<BookingPayment>> => {
    await projectBookingPayment(writeFromRow(receipt));
    if (!(await settleStatus(at))) {
      return fail(409, "Trạng thái thanh toán vừa thay đổi. Vui lòng tải lại.");
    }
    await projectReceipt({
      paymentId: receipt.payment_id,
      refType: "booking",
      refId: bookingId,
      customerId,
      mechanicId: booking.mechanic_id,
      recordedBy: actor.id,
      customerConfirmed,
      amount: receipt.amount ?? amount,
      method: receipt.method ?? method,
      paidAt: receipt.paid_at ?? at,
    });
    await publishBookingChange(
      "payment-recorded",
      bookingId,
      status,
      customerId,
      [booking.mechanic_id],
    );
    return { ok: true, data: toPayment(receipt, after) };
  };

  const now = nextTransitionAt(booking);
  const persisted = await findPaymentRowById(paymentId);
  if (persisted) {
    if (!matchesAmount(persisted)) {
      return fail(409, "Đơn này đã có giao dịch thanh toán khác.");
    }
    return settleAndPublish(persisted, now);
  }

  const write: PaymentWrite = {
    paymentId,
    refType: "booking",
    refId: bookingId,
    customerId,
    mechanicId: booking.mechanic_id,
    amount,
    method,
    status: "paid",
    recordedBy: actor.id,
    customerConfirmed,
    paidAt: now,
    createdAt: now,
  };
  const claimed = await claimBookingPayment(write);
  if (!claimed) {
    const reread = await findPaymentRowById(paymentId);
    if (!reread || !matchesAmount(reread)) {
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
      mechanic_id: write.mechanicId,
      amount: write.amount,
      method: write.method,
      status: write.status,
      provider_ref: null,
      recorded_by: write.recordedBy,
      customer_confirmed: write.customerConfirmed,
      paid_at: write.paidAt,
      created_at: write.createdAt,
    },
    now,
  );
}
