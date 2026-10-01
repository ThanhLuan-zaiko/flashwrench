// Wallet spending: quote, redeem, release and restore. Every status
// change is a CAS transition on the by_id row — a wallet can only be
// spent once, even under concurrent checkouts.
import { toWallet } from "./voucher.mapper";
import type { VoucherResult, VoucherWallet, WalletRow } from "./voucher.types";
import { findCampaignRowById } from "./voucher-campaign.repository";
import { clampVoucherDiscount } from "./voucher-discount";
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
// campaign window, scope, minimum order, then the discount math.
// Read-only — marking an expired wallet happens only in redeemWallet.
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
    discountValue: row.discount_value ?? 0,
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
  const applied = await commitWalletTransition({
    walletId: row.wallet_id,
    userId: row.user_id,
    campaignId: row.campaign_id,
    grantedAt: row.granted_at ?? now,
    status: "used",
    usedAt: now,
    usedOrderId: params.orderId ?? null,
    usedBookingId: params.bookingId ?? null,
    expectStatus: "active",
  });
  if (!applied) return fail(400, "Voucher đã được dùng hoặc thu hồi.");
  const next = await findWalletRowById(params.walletId);
  if (!next) return fail(500, "Không áp được voucher.");
  return {
    ok: true,
    data: { discount: eligible.data, wallet: toWallet(next) },
  };
}

// Best-effort rollback: a wallet reserved for a ref whose write failed
// goes back to active so the customer keeps it. The CAS condition on the
// ref column pins the release to THIS reservation — a concurrent spend
// on another ref can never be flipped back by a stale caller. Never
// throws.
export async function releaseWalletReservation(
  walletId: string,
  ref: WalletRef,
): Promise<void> {
  try {
    const row = await findWalletRowById(walletId);
    if (row?.status !== "used") return;
    if (ref.orderId && row.used_order_id !== ref.orderId) return;
    if (ref.bookingId && row.used_booking_id !== ref.bookingId) return;
    const applied = await commitWalletTransition({
      walletId: row.wallet_id,
      userId: row.user_id,
      campaignId: row.campaign_id,
      grantedAt: row.granted_at ?? new Date(),
      status: "active",
      usedAt: null,
      usedOrderId: null,
      usedBookingId: null,
      expectStatus: "used",
      expectUsedOrderId: ref.orderId ?? undefined,
      expectUsedBookingId: ref.bookingId ?? undefined,
    });
    // Tell open wallet screens the voucher is spendable again — without
    // the signal, a failed checkout leaves the UI showing it as used.
    if (applied) {
      void publishWalletChange({
        kind: "voucher-granted",
        walletId: row.wallet_id,
        userId: row.user_id,
      });
    }
  } catch {
    return;
  }
}

// Best-effort refund: a cancelled/refunded order or booking returns its
// wallet to the owner. A wallet past its expiry comes back as expired,
// not active, so it can never be spent late. Never throws.
export async function restoreWalletForRef(params: {
  walletId: string | null;
  userId: string | null;
  orderId?: string | null;
  bookingId?: string | null;
}): Promise<void> {
  try {
    if (!params.walletId || !params.userId) return;
    const row = await findWalletRowById(params.walletId);
    if (!row || row.user_id !== params.userId || row.status !== "used") {
      return;
    }
    if (params.orderId && row.used_order_id !== params.orderId) return;
    if (params.bookingId && row.used_booking_id !== params.bookingId) return;
    const now = new Date();
    const expiredByWallet = row.expires_at ? now > row.expires_at : false;
    let expiredByCampaign = false;
    if (row.campaign_id) {
      const campaign = await findCampaignRowById(row.campaign_id);
      if (campaign?.end_at && now > campaign.end_at) expiredByCampaign = true;
    }
    await commitWalletTransition({
      walletId: row.wallet_id,
      userId: row.user_id,
      campaignId: row.campaign_id,
      grantedAt: row.granted_at ?? now,
      status: expiredByWallet || expiredByCampaign ? "expired" : "active",
      usedAt: null,
      usedOrderId: null,
      usedBookingId: null,
      expectStatus: "used",
      expectUsedOrderId: params.orderId ?? undefined,
      expectUsedBookingId: params.bookingId ?? undefined,
    });
  } catch {
    return;
  }
}
