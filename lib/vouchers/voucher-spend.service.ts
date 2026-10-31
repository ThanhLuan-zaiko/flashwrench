// Wallet spending: quote, redeem, release and restore. Every change is a
// CAS on the by_id row, so a wallet can never be overspent under concurrent
// checkouts. A fixed-value wallet keeps its leftover: a 1.000.000đ voucher
// used on a 700.000đ order stays active with 300.000đ remaining.
import { toWallet } from "./voucher.mapper";
import type { VoucherResult, VoucherWallet, WalletRow } from "./voucher.types";
import { findCampaignRowById } from "./voucher-campaign.repository";
import {
  clampVoucherDiscount,
  isFixedWallet,
  walletRemainingValue,
} from "./voucher-discount";
import { publishWalletChange } from "./voucher-realtime";
import {
  commitWalletTransition,
  findWalletRowById,
} from "./voucher-wallet.repository";

function fail<T>(status: number, form: string): VoucherResult<T> {
  return { ok: false, status, errors: { form } };
}

type WalletRef = { orderId?: string | null; bookingId?: string | null };

// Shared eligibility gate for quote + redeem: ownership, lifecycle,
// campaign window, scope, minimum order, then the discount math against
// what the wallet still holds. Read-only.
async function walletDiscountFor(
  row: WalletRow,
  params: { userId: string; subtotal: number; kind: "order" | "booking" },
): Promise<VoucherResult<number>> {
  if (row.user_id !== params.userId) {
    return fail(404, "Không tìm thấy voucher của bạn.");
  }
  if (row.status !== "active") {
    return fail(400, "Voucher đã được dùng hoặc thu hồi.");
  }
  const campaign = row.campaign_id
    ? await findCampaignRowById(row.campaign_id)
    : null;
  const now = new Date();
  if (!campaign) return fail(400, "Chiến dịch đã dừng.");
  if (!campaign.is_active) {
    return fail(400, "Chiến dịch đã tắt.");
  }
  if (campaign.start_at && now < campaign.start_at) {
    return fail(400, "Chưa đến ngày áp dụng voucher.");
  }
  if (campaign.end_at && now > campaign.end_at) {
    return fail(400, "Voucher đã hết hạn.");
  }
  const scope = campaign.scope ?? "all";
  if (scope !== "all" && scope !== params.kind) {
    return fail(400, "Voucher không áp dụng cho loại đơn này.");
  }
  const minOrder = campaign.min_order ?? 0;
  if (params.subtotal < minOrder) {
    return fail(400, "Đơn chưa đạt giá trị tối thiểu của voucher.");
  }
  if (row.expires_at && now > row.expires_at) {
    return fail(400, "Voucher đã hết hạn.");
  }
  const discount = clampVoucherDiscount({
    discountType:
      row.discount_type === "percent" || row.discount_type === "free_service"
        ? row.discount_type
        : "fixed",
    discountValue: walletRemainingValue(row),
    maxDiscount: row.max_discount ?? 0,
    subtotal: params.subtotal,
  });
  if (discount <= 0) return fail(400, "Đơn chưa đạt điều kiện áp voucher.");
  return { ok: true, data: discount };
}

// Read-only quote for the picker: same checks as redeemWallet but never
// writes, so a preview can never burn or rebind a wallet.
export async function quoteWalletRedemption(params: {
  walletId: string;
  userId: string;
  subtotal: number;
  kind: "order" | "booking";
}): Promise<VoucherResult<{ discount: number; wallet: VoucherWallet }>> {
  const row = await findWalletRowById(params.walletId);
  if (!row) return fail(404, "Không tìm thấy voucher của bạn.");
  const eligible = await walletDiscountFor(row, params);
  if (!eligible.ok) return eligible;
  return { ok: true, data: { discount: eligible.data, wallet: toWallet(row) } };
}

export async function redeemWallet(params: {
  walletId: string;
  userId: string;
  subtotal: number;
  kind: "order" | "booking";
  orderId?: string | null;
  bookingId?: string | null;
}): Promise<VoucherResult<{ discount: number; wallet: VoucherWallet }>> {
  const row = await findWalletRowById(params.walletId);
  if (!row || row.user_id !== params.userId) {
    return fail(404, "Không tìm thấy voucher của bạn.");
  }
  if (params.orderId && params.bookingId) {
    return fail(400, "Chỉ áp voucher cho đơn hàng hoặc lịch hẹn.");
  }
  const now = new Date();
  const eligible = await walletDiscountFor(row, params);
  if (!eligible.ok) {
    // An expired wallet flips itself so pickers stop offering it. The
    // CAS keeps this write from clobbering a concurrent spend.
    if (row.status === "active" && row.expires_at && now > row.expires_at) {
      await commitWalletTransition({
        walletId: row.wallet_id,
        userId: row.user_id,
        campaignId: row.campaign_id,
        grantedAt: row.granted_at ?? now,
        status: "expired",
        usedAt: null,
        usedOrderId: null,
        usedBookingId: null,
        expectStatus: "active",
      }).catch(() => undefined);
    }
    return eligible;
  }
  // Fixed wallets keep the leftover active; percent and free-service
  // wallets are single-use and always close here.
  const current = walletRemainingValue(row);
  const left = isFixedWallet(row) ? current - eligible.data : current;
  const applied = await commitWalletTransition({
    walletId: row.wallet_id,
    userId: row.user_id,
    campaignId: row.campaign_id,
    grantedAt: row.granted_at ?? now,
    status: left > 0 && isFixedWallet(row) ? "active" : "used",
    usedAt: now,
    usedOrderId: params.orderId ?? null,
    usedBookingId: params.bookingId ?? null,
    expectStatus: "active",
    remainingValue: left,
    expectRemainingValue: current,
  });
  if (!applied) return fail(400, "Voucher đã được dùng hoặc thu hồi.");
  const next = await findWalletRowById(params.walletId);
  if (!next) return fail(500, "Không áp được voucher.");
  return {
    ok: true,
    data: { discount: eligible.data, wallet: toWallet(next) },
  };
}

// Gives `amount` back to a wallet spent by `ref`. Fixed wallets regain the
// value, capped at their face value so a repeated call can never mint
// more than the voucher was worth. Percent and free-service wallets reopen
// only when they were closed by this same ref. Never throws.
async function giveBack(
  walletId: string,
  amount: number,
  ref: WalletRef,
): Promise<boolean> {
  const row = await findWalletRowById(walletId);
  if (!row || row.status === null) return false;
  if (row.status !== "used" && row.status !== "active") return false;
  const fixed = isFixedWallet(row);
  if (!fixed && row.status === "active") return false;
  if (!fixed && row.status === "used") {
    if (ref.orderId && row.used_order_id !== ref.orderId) return false;
    if (ref.bookingId && row.used_booking_id !== ref.bookingId) return false;
  }
  const now = new Date();
  const current = walletRemainingValue(row);
  const face = row.discount_value ?? 0;
  const next = fixed ? Math.min(face, current + Math.max(0, amount)) : current;
  let expired = row.expires_at !== null && now > row.expires_at;
  if (!expired && row.campaign_id) {
    const campaign = await findCampaignRowById(row.campaign_id);
    expired = Boolean(campaign?.end_at && now > campaign.end_at);
  }
  const applied = await commitWalletTransition({
    walletId: row.wallet_id,
    userId: row.user_id,
    campaignId: row.campaign_id,
    grantedAt: row.granted_at ?? now,
    status: expired ? "expired" : "active",
    usedAt: null,
    usedOrderId: null,
    usedBookingId: null,
    expectStatus: row.status,
    expectUsedOrderId:
      !fixed && row.status === "used" ? (ref.orderId ?? undefined) : undefined,
    expectUsedBookingId:
      !fixed && row.status === "used"
        ? (ref.bookingId ?? undefined)
        : undefined,
    remainingValue: next,
    expectRemainingValue: current,
  });
  return applied;
}

// Best-effort rollback of a reservation whose order or booking write failed.
// The caller passes the same amount it spent, so the leftover comes back
// exactly. Never throws.
export async function releaseWalletReservation(
  walletId: string,
  ref: WalletRef,
  amount: number,
): Promise<void> {
  try {
    const applied = await giveBack(walletId, amount, ref);
    if (applied) {
      // Tell open wallet screens the voucher is spendable again — without
      // the signal, a failed checkout leaves the UI showing it as used.
      void publishWalletChange({
        kind: "voucher-granted",
        walletId,
        userId: (await findWalletRowById(walletId))?.user_id ?? "",
      });
    }
  } catch {
    return;
  }
}

// Best-effort refund: a cancelled/refunded order or booking gives back what
// it spent. A wallet past its expiry comes back as expired, not active, so
// it can never be spent late. Never throws.
export async function restoreWalletForRef(params: {
  walletId: string | null;
  userId: string | null;
  orderId?: string | null;
  bookingId?: string | null;
  amount: number;
}): Promise<void> {
  try {
    if (!params.walletId || !params.userId) return;
    const row = await findWalletRowById(params.walletId);
    if (!row || row.user_id !== params.userId) return;
    await giveBack(params.walletId, params.amount, {
      orderId: params.orderId,
      bookingId: params.bookingId,
    });
  } catch {
    return;
  }
}
