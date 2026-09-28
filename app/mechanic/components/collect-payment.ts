// Shared collect-payment vocabulary for the mechanic workspace: method
// labels, eligibility predicates, amount parsing and mutation error
// mapping. Used by the pending-income dialog and the booking detail
// collect section.
import type {
  MechanicBookingStatus,
  MechanicPaymentState,
} from "@/lib/mechanic/mechanic.types";
import {
  BOOKING_PAYMENT_METHODS,
  type BookingPaymentMethod,
} from "@/lib/payments/booking-payment.types";
import { AuthApiError } from "@/services/auth.api";

export const COLLECT_METHODS = BOOKING_PAYMENT_METHODS;

export const COLLECT_METHOD_LABELS: Record<BookingPaymentMethod, string> = {
  cod: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
};

// A finished job that is not fully paid yet can be collected — the balance
// may arrive in several installments (unpaid -> partial -> paid).
export function canCollectBookingPayment(
  status: MechanicBookingStatus,
  paymentState: MechanicPaymentState,
): boolean {
  return (
    status === "completed" &&
    (paymentState === "unpaid" || paymentState === "partial")
  );
}

// An income row is collectible exactly when it sits in the "pending" bucket.
export function isCollectableIncomeEntry(state: string): boolean {
  return state === "pending";
}

// Parses a VND amount input: digits only, integer, within the remaining
// balance. null means "leave empty to settle everything later".
export function parseCollectAmount(
  value: string,
  outstanding: number,
): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return outstanding;
  if (!/^\d+$/.test(trimmed)) return null;
  const amount = Number(trimmed);
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > outstanding) {
    return null;
  }
  return amount;
}

// Cash collections need the customer's six-digit confirmation code —
// their signature that money changed hands. Transfers skip it entirely.
export function needsConfirmCode(method: BookingPaymentMethod): boolean {
  return method === "cod";
}

export function isValidConfirmCode(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}

// Field errors from recordBookingPayment beat the generic form error;
// foreign errors get a safe fallback message.
export function collectPaymentError(error: unknown): string {
  if (error instanceof AuthApiError) {
    const errors = error.errors as Record<string, string | undefined>;
    return (
      errors.method ??
      errors.amount ??
      errors.confirmCode ??
      errors.confirmed ??
      errors.paymentId ??
      errors.form ??
      error.message
    );
  }
  return "Không ghi nhận được thanh toán. Vui lòng thử lại.";
}
