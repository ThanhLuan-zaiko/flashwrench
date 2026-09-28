import { describe, expect, test } from "bun:test";
import {
  COLLECT_METHOD_LABELS,
  COLLECT_METHODS,
  canCollectBookingPayment,
  collectPaymentError,
  isCollectableIncomeEntry,
  parseCollectAmount,
} from "@/app/mechanic/components/collect-payment";
import type { MechanicBookingStatus } from "@/lib/mechanic/mechanic.types";
import { BOOKING_PAYMENT_METHODS } from "@/lib/payments/booking-payment.types";
import { AuthApiError } from "@/services/auth.api";

describe("collect payment helpers", () => {
  test("collect methods mirror the server-side vocabulary", () => {
    expect(COLLECT_METHODS).toEqual(BOOKING_PAYMENT_METHODS);
  });

  test("every method has an accented Vietnamese label", () => {
    for (const method of BOOKING_PAYMENT_METHODS) {
      expect(COLLECT_METHOD_LABELS[method]).toBeTruthy();
    }
    expect(COLLECT_METHOD_LABELS.cod).toBe("Tiền mặt");
    expect(COLLECT_METHOD_LABELS.bank_transfer).toBe("Chuyển khoản");
  });

  test("only a completed booking still owing money is collectible", () => {
    expect(canCollectBookingPayment("completed", "unpaid")).toBe(true);
    expect(canCollectBookingPayment("completed", "partial")).toBe(true);
    expect(canCollectBookingPayment("completed", "paid")).toBe(false);
    expect(canCollectBookingPayment("completed", "refunded")).toBe(false);
    const openStatuses: MechanicBookingStatus[] = [
      "pending",
      "confirmed",
      "mechanic_assigned",
      "en_route",
      "in_progress",
      "cancelled",
      "no_show",
    ];
    for (const status of openStatuses) {
      expect(canCollectBookingPayment(status, "unpaid")).toBe(false);
    }
  });

  test("parseCollectAmount settles the balance on empty input", () => {
    expect(parseCollectAmount("", 300000)).toBe(300000);
    expect(parseCollectAmount("   ", 300000)).toBe(300000);
    expect(parseCollectAmount("150000", 300000)).toBe(150000);
  });

  test("parseCollectAmount rejects invalid and excessive amounts", () => {
    for (const value of ["abc", "1.5", "-50", "0", "300001", "4_000"]) {
      expect(parseCollectAmount(value, 300000)).toBeNull();
    }
  });

  test("income rows collect only from the pending bucket", () => {
    expect(isCollectableIncomeEntry("pending")).toBe(true);
    expect(isCollectableIncomeEntry("paid")).toBe(false);
    expect(isCollectableIncomeEntry("refunded")).toBe(false);
    expect(isCollectableIncomeEntry("unknown")).toBe(false);
  });

  test("field errors beat the generic form error", () => {
    const error = new AuthApiError(400, {
      method: "Phương thức thanh toán không hợp lệ.",
      form: "Dữ liệu gửi lên không hợp lệ.",
    } as never);
    expect(collectPaymentError(error)).toBe(
      "Phương thức thanh toán không hợp lệ.",
    );
  });

  test("falls back to the form error, then to a safe default", () => {
    expect(
      collectPaymentError(
        new AuthApiError(409, { form: "Đơn này đã có giao dịch khác." }),
      ),
    ).toBe("Đơn này đã có giao dịch khác.");
    expect(collectPaymentError(new Error("network"))).toBe(
      "Không ghi nhận được thanh toán. Vui lòng thử lại.",
    );
    expect(collectPaymentError("oops")).toBe(
      "Không ghi nhận được thanh toán. Vui lòng thử lại.",
    );
  });
});
