// Rescue payment collection: the assigned mechanic (or admin) records the
// cash/transfer the customer pays on scene, mirroring the booking receipt
// flow — one payments_by_id receipt, period + audit projections, and a
// CAS guard so a rescue can only be settled once.
import type { PublicUser } from "@/lib/auth/user.types";
import type { WorkspaceResult } from "@/lib/booking/workspace.types";
import {
  claimBookingPayment,
  findPaymentRowById,
  type PaymentWrite,
  projectBookingPayment,
} from "@/lib/payments/booking-payment.repository";
import {
  BOOKING_PAYMENT_METHODS,
  type BookingPaymentMethod,
} from "@/lib/payments/booking-payment.types";
import { verifyCashConfirmCode } from "@/lib/payments/payment-code.service";
import { publishRescueChange } from "@/lib/realtime/domain-publish";
import { projectReceipt } from "@/lib/revenue/revenue.service";
import { isRecord, isUuid, numericInput } from "@/lib/validation";
import { claimRescuePaymentStatus } from "./rescue-payment.repository";
import {
  findRescueRowById,
  type RescueRow,
} from "./rescue-workflow.repository";

export type RescuePayment = {
  id: string;
  requestId: string;
  amount: number;
  method: BookingPaymentMethod;
  paidAt: string | null;
  paymentStatus: "paid";
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

const MAX_RESCUE_PRICE = 500_000_000;

function rescueTotal(row: RescueRow): number | null {
  const candidate = row.final_price ?? row.price_estimate;
  if (
    typeof candidate !== "number" ||
    !Number.isSafeInteger(candidate) ||
    candidate <= 0
  ) {
    return null;
  }
  return candidate;
}

type PersistedRow = {
  payment_id: string;
  ref_type: string | null;
  ref_id: string | null;
  customer_id: string | null;
  mechanic_id: string | null;
  amount: number | null;
  method: string | null;
  status: string | null;
  recorded_by: string | null;
  customer_confirmed: boolean | null;
  paid_at: Date | null;
  created_at: Date | null;
};

function writeFromPersisted(
  row: PersistedRow,
  requestId: string,
): PaymentWrite {
  return {
    paymentId: row.payment_id,
    refType: "emergency",
    refId: requestId,
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

function matchesReceipt(
  row: PersistedRow,
  requestId: string,
  amount: number,
  method: string,
): boolean {
  return (
    row.ref_type === "emergency" &&
    row.ref_id === requestId &&
    row.status === "paid" &&
    row.amount === amount &&
    row.method === method
  );
}

export async function recordRescuePayment(
  actor: PublicUser,
  requestId: string,
  raw: unknown,
): Promise<WorkspaceResult<RescuePayment>> {
  if (actor.role !== "mechanic" && actor.role !== "admin") {
    return fail(403, "Bạn không có quyền thực hiện thao tác này.");
  }
  if (!isUuid(requestId)) return fail(400, "Mã yêu cầu cứu hộ không hợp lệ.");
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
  const paymentId = (raw.paymentId as string | undefined) ?? requestId;
  const confirmCode =
    typeof raw.confirmCode === "string" ? raw.confirmCode.trim() : undefined;

  const row = await findRescueRowById(requestId);
  if (!row) return fail(404, "Không tìm thấy yêu cầu cứu hộ này.");
  if (actor.role === "mechanic" && row.assigned_mechanic_id !== actor.id) {
    return fail(403, "Yêu cầu này không thuộc về bạn.");
  }
  if (row.status !== "completed") {
    return fail(400, "Chỉ ghi nhận thanh toán cho cứu hộ đã hoàn thành.");
  }
  if (row.payment_status === "paid") {
    const receipt = await findPaymentRowById(paymentId);
    if (
      receipt &&
      receipt.ref_type === "emergency" &&
      receipt.ref_id === requestId &&
      receipt.status === "paid" &&
      receipt.method === method
    ) {
      return {
        ok: true,
        data: {
          id: receipt.payment_id,
          requestId,
          amount: receipt.amount ?? 0,
          method,
          paidAt: receipt.paid_at?.toISOString() ?? null,
          paymentStatus: "paid",
        },
      };
    }
    return fail(409, "Yêu cầu này đã được thanh toán.");
  }
  if (row.payment_status !== "unpaid") {
    return fail(409, "Trạng thái thanh toán không hợp lệ.");
  }
  const customerId = row.customer_id;

  // Same cash guard as bookings: cod requires the customer's code.
  if (method === "cod") {
    const codeCheck = await verifyCashConfirmCode(
      actor.id,
      "emergency",
      requestId,
      row.payment_confirm_code,
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

  const base = rescueTotal(row);
  const requested = raw.amount === undefined ? null : numericInput(raw.amount);
  const amount = requested ?? base;
  if (
    amount === null ||
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    amount > MAX_RESCUE_PRICE
  ) {
    return fieldFail(400, {
      amount: "Số tiền thu không hợp lệ.",
    });
  }

  const now = new Date();
  // After the guards above the amount is a known positive integer; keep a
  // narrowed alias so the persisted-receipt helpers stay simple.
  const finalAmount = amount;
  const assignedMechanicId = row.assigned_mechanic_id;

  const settle = async (
    receipt: PaymentWrite,
  ): Promise<WorkspaceResult<RescuePayment>> => {
    await projectBookingPayment(receipt);
    const applied = await claimRescuePaymentStatus(
      requestId,
      receipt.amount,
      row.payment_status ?? "unpaid",
      receipt.paidAt,
    );
    if (!applied) {
      const reread = await findRescueRowById(requestId);
      if (!reread || reread.payment_status !== "paid") {
        return fail(
          409,
          "Trạng thái thanh toán vừa thay đổi. Vui lòng tải lại.",
        );
      }
    }
    await projectReceipt({
      paymentId: receipt.paymentId,
      refType: "emergency",
      refId: requestId,
      customerId: receipt.customerId || null,
      mechanicId: receipt.mechanicId,
      recordedBy: actor.id,
      customerConfirmed,
      amount: receipt.amount,
      method: receipt.method,
      paidAt: receipt.paidAt,
    });
    await publishRescueChange(
      "rescue-updated",
      requestId,
      "completed",
      customerId,
      [assignedMechanicId],
      row.zone_id,
    );
    return {
      ok: true,
      data: {
        id: receipt.paymentId,
        requestId,
        amount: receipt.amount,
        method: receipt.method as BookingPaymentMethod,
        paidAt: receipt.paidAt.toISOString(),
        paymentStatus: "paid",
      },
    };
  };

  const persisted = await findPaymentRowById(paymentId);
  if (persisted) {
    if (!matchesReceipt(persisted, requestId, finalAmount, method)) {
      return fail(409, "Yêu cầu này đã có giao dịch thanh toán khác.");
    }
    return settle(writeFromPersisted(persisted, requestId));
  }

  const write: PaymentWrite = {
    paymentId,
    refType: "emergency",
    refId: requestId,
    customerId: customerId ?? "",
    mechanicId: assignedMechanicId,
    amount: finalAmount,
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
    if (!reread || !matchesReceipt(reread, requestId, finalAmount, method)) {
      return fail(409, "Yêu cầu này đã có giao dịch thanh toán khác.");
    }
    return settle(writeFromPersisted(reread, requestId));
  }
  return settle(write);
}
