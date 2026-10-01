import { isUuid } from "@/lib/validation";
import type { BookingFieldErrors } from "./booking.types";

// Account-bound wallet id from the wire: guests hold no wallet, so any
// value with a guest session fails here with the signup incentive.
export function normalizeWalletId(
  raw: unknown,
  guest: boolean,
  errors: BookingFieldErrors,
): string | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string") {
    errors.walletId = "Voucher đã chọn không hợp lệ.";
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (!isUuid(trimmed)) {
    errors.walletId = "Voucher đã chọn không hợp lệ.";
    return null;
  }
  if (guest) {
    errors.walletId =
      "Khách vãng lai chưa dùng được voucher. Hãy tạo tài khoản để nhận ưu đãi.";
    return null;
  }
  return trimmed;
}
