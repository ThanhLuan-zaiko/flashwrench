// Wallet lifecycle: grant to one account, revoke, redeem on one ref.
// Anti-share by design: wallets carry user_id, never a reusable code.
import { randomUUID } from "node:crypto";
import type { UserRole } from "@/lib/auth/user.types";
import { toWallet } from "./voucher.mapper";
import type {
  GrantWalletInput,
  VoucherResult,
  VoucherWallet,
} from "./voucher.types";
import { findCampaignRowById } from "./voucher-campaign.repository";
import { clampVoucherDiscount } from "./voucher-discount";
import { parseOptionalDate, validateGrantInput } from "./voucher-validation";
import {
  countUserWalletsForCampaign,
  findWalletRowById,
  insertWallet,
  listWalletRowsByUser,
  markWalletStatus,
} from "./voucher-wallet.repository";

function fail<T>(status: number, form: string): VoucherResult<T> {
  return { ok: false, status, errors: { form } };
}

type Actor = { id: string; role: UserRole };

function dispatcherCapAllows(
  actor: Actor,
  grantedCount: number,
  totalLimit: number,
  discountValue: number,
  cap: number,
  allowed: boolean,
): VoucherResult<null> | null {
  if (actor.role === "admin") return null;
  if (!allowed) {
    return {
      ok: false,
      status: 403,
      errors: { form: "Chiến dịch này chỉ admin được phát." },
    };
  }
  if (totalLimit > 0 && grantedCount >= totalLimit) {
    return {
      ok: false,
      status: 400,
      errors: { form: "Chiến dịch đã phát hết số lượng." },
    };
  }
  if (cap > 0 && discountValue > cap) {
    return {
      ok: false,
      status: 403,
      errors: { form: "Voucher vượt hạn mức điều phối được phát." },
    };
  }
  return null;
}

export async function grantWallet(
  actor: Actor,
  raw: GrantWalletInput,
): Promise<VoucherResult<VoucherWallet>> {
  const fieldErrors = validateGrantInput({
    campaignId: raw.campaignId.trim(),
    userId: raw.userId.trim(),
    note: (raw.note ?? "").trim(),
    expiresAt: raw.expiresAt,
  });
  if (fieldErrors) {
    return { ok: false, status: 400, errors: fieldErrors };
  }
  const campaign = await findCampaignRowById(raw.campaignId.trim());
  if (!campaign) return fail(404, "Không tìm thấy chiến dịch.");
  if (!campaign.is_active) return fail(400, "Chiến dịch đang tắt.");
  const granted = campaign.granted_count ?? 0;
  const totalLimit = campaign.total_limit ?? 0;
  if (actor.role !== "admin" && totalLimit > 0 && granted >= totalLimit) {
    return fail(400, "Chiến dịch đã phát hết số lượng.");
  }
  const blocked = dispatcherCapAllows(
    actor,
    granted,
    totalLimit,
    campaign.discount_value ?? 0,
    campaign.dispatcher_max_value ?? 0,
    campaign.allow_dispatcher_grant ?? false,
  );
  if (blocked) return blocked as VoucherResult<VoucherWallet>;
  const perUser = campaign.per_user_limit ?? 1;
  const owned = await countUserWalletsForCampaign(
    raw.userId.trim(),
    campaign.campaign_id,
  );
  if (owned >= perUser) {
    return fail(400, "Khách này đã nhận đủ số voucher của chiến dịch.");
  }
  const walletId = randomUUID();
  const now = new Date();
  const expiresAt = parseOptionalDate(raw.expiresAt) ?? campaign.end_at ?? null;
  await insertWallet({
    walletId,
    userId: raw.userId.trim(),
    campaignId: campaign.campaign_id,
    campaignCode: campaign.code ?? "",
    campaignName: campaign.name ?? "",
    imageUrl: campaign.image_url ?? "",
    discountType:
      campaign.discount_type === "percent" ||
      campaign.discount_type === "free_service"
        ? campaign.discount_type
        : "fixed",
    discountValue: campaign.discount_value ?? 0,
    maxDiscount: campaign.max_discount ?? 0,
    grantedBy: actor.id,
    grantNote: (raw.note ?? "").trim(),
    grantedAt: now,
    expiresAt,
  });
  const { bumpGrantedCount } = await import("./voucher-campaign.repository");
  await bumpGrantedCount(campaign.campaign_id, 1).catch(() => undefined);
  const row = await findWalletRowById(walletId);
  if (!row) return fail(500, "Không phát được voucher.");
  const { toWallet: map } = await import("./voucher.mapper");
  return { ok: true, data: map(row) };
}

export async function listMyWallets(
  userId: string,
): Promise<VoucherResult<VoucherWallet[]>> {
  const rows = await listWalletRowsByUser(userId);
  const wallets: VoucherWallet[] = [];
  for (const row of rows) {
    // Small fan-out (one wallet list per page): the campaign carries
    // scope + minimum order so pickers can filter before submitting.
    const campaign = row.campaign_id
      ? await findCampaignRowById(row.campaign_id).catch(() => null)
      : null;
    wallets.push(toWallet(row, campaign));
  }
  return { ok: true, data: wallets };
}

export async function revokeWallet(
  actor: Actor,
  walletId: string,
  note: string,
): Promise<VoucherResult<VoucherWallet>> {
  const row = await findWalletRowById(walletId);
  if (!row) return fail(404, "Không tìm thấy voucher.");
  if (row.status !== "active") return fail(400, "Voucher không còn hiệu lực.");
  if (actor.role !== "admin" && row.granted_by !== actor.id) {
    return fail(403, "Chỉ admin hoặc người đã phát mới được thu hồi.");
  }
  await markWalletStatus({
    walletId: row.wallet_id,
    userId: row.user_id,
    campaignId: row.campaign_id,
    grantedAt: row.granted_at ?? new Date(),
    status: "revoked",
    usedAt: null,
    usedOrderId: null,
    usedBookingId: null,
  });
  void note;
  const next = await findWalletRowById(walletId);
  if (!next) return fail(500, "Không thu hồi được voucher.");
  return { ok: true, data: toWallet(next) };
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
  if (row.status !== "active")
    return fail(400, "Voucher đã được dùng hoặc thu hồi.");
  if (params.orderId && params.bookingId) {
    return fail(400, "Chỉ áp voucher cho đơn hàng hoặc lịch hẹn.");
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
    await markWalletStatus({
      walletId: row.wallet_id,
      userId: row.user_id,
      campaignId: row.campaign_id,
      grantedAt: row.granted_at ?? now,
      status: "expired",
      usedAt: null,
      usedOrderId: null,
      usedBookingId: null,
    });
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
  await markWalletStatus({
    walletId: row.wallet_id,
    userId: row.user_id,
    campaignId: row.campaign_id,
    grantedAt: row.granted_at ?? now,
    status: "used",
    usedAt: now,
    usedOrderId: params.orderId ?? null,
    usedBookingId: params.bookingId ?? null,
  });
  const next = await findWalletRowById(params.walletId);
  if (!next) return fail(500, "Không áp được voucher.");
  return { ok: true, data: { discount, wallet: toWallet(next) } };
}

// Best-effort rollback: a wallet reserved for a ref whose write failed
// goes back to active so the customer keeps it. Never throws.
export async function releaseWalletReservation(
  walletId: string,
): Promise<void> {
  try {
    const row = await findWalletRowById(walletId);
    if (!row || row.status !== "used") return;
    await markWalletStatus({
      walletId: row.wallet_id,
      userId: row.user_id,
      campaignId: row.campaign_id,
      grantedAt: row.granted_at ?? new Date(),
      status: "active",
      usedAt: null,
      usedOrderId: null,
      usedBookingId: null,
    });
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
    await markWalletStatus({
      walletId: row.wallet_id,
      userId: row.user_id,
      campaignId: row.campaign_id,
      grantedAt: row.granted_at ?? now,
      status: expiredByWallet || expiredByCampaign ? "expired" : "active",
      usedAt: null,
      usedOrderId: null,
      usedBookingId: null,
    });
  } catch {
    return;
  }
}
