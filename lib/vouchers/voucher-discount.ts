// Pure discount math for account-bound wallets. Tested without a DB.
import type { VoucherDiscountType } from "./voucher.types";

export function clampVoucherDiscount(params: {
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscount: number;
  subtotal: number;
}): number {
  const subtotal = Math.max(0, Math.trunc(params.subtotal));
  if (subtotal <= 0) return 0;
  if (params.discountType === "free_service") return subtotal;
  if (params.discountType === "percent") {
    const percent = Math.min(
      100,
      Math.max(0, Math.trunc(params.discountValue)),
    );
    const raw = Math.floor((subtotal * percent) / 100);
    const cap = Math.max(0, Math.trunc(params.maxDiscount));
    return cap > 0 ? Math.min(raw, cap, subtotal) : Math.min(raw, subtotal);
  }
  return Math.min(Math.max(0, Math.trunc(params.discountValue)), subtotal);
}

export function isWalletUsable(params: {
  status: string | null;
  campaignActive: boolean;
  now: Date;
  startAt: Date | null;
  endAt: Date | null;
  expiresAt: Date | null;
  minOrder: number;
  subtotal: number;
}): { ok: true } | { ok: false; reason: string } {
  if (params.status !== "active") return { ok: false, reason: "used" };
  if (!params.campaignActive) return { ok: false, reason: "inactive" };
  if (params.startAt && params.now < params.startAt) {
    return { ok: false, reason: "not_started" };
  }
  if (params.endAt && params.now > params.endAt) {
    return { ok: false, reason: "expired" };
  }
  if (params.expiresAt && params.now > params.expiresAt) {
    return { ok: false, reason: "expired" };
  }
  if (params.subtotal < params.minOrder) {
    return { ok: false, reason: "min_order" };
  }
  return { ok: true };
}
