// Customer typed-code claims: typing a campaign's redeem code binds one
// fresh wallet to the caller's account (or reuses their active one).
// Writes are serialized by a short-lived per-(campaign, user, seq) lock
// plus the shared granted_count CAS slot, so a burst can never overshoot
// per_user_limit or total_limit.
import { randomUUID } from "node:crypto";
import { toWallet } from "./voucher.mapper";
import type {
  CampaignRow,
  VoucherDiscountType,
  VoucherFieldErrors,
  VoucherResult,
  WalletRow,
} from "./voucher.types";
import { isDeletedFlag } from "./voucher.types";
import {
  claimGrantSlot,
  findCampaignIdBySlug,
  findCampaignRowById,
  releaseGrantSlot,
} from "./voucher-campaign.repository";
import type {
  ClaimVoucherCodeResult,
  RedeemCodeVisibility,
} from "./voucher-code.types";
import { clampVoucherDiscount } from "./voucher-discount";
import type { VoucherKind } from "./voucher-pick";
import { publishWalletChange } from "./voucher-realtime";
import {
  claimCodeClaimLock,
  findCampaignIdByRedeemCode,
  releaseCodeClaimLock,
} from "./voucher-redeem-code.repository";
import { isValidRedeemCode, normalizeRedeemCode } from "./voucher-validation";
import { isPublicVisible } from "./voucher-visibility";
import {
  findWalletRowById,
  insertWallet,
  listUserWalletIdsForCampaign,
  listWalletRowsByIds,
} from "./voucher-wallet.repository";

const CODE_NOT_FOUND = "Mã voucher không tồn tại hoặc đã hết hạn.";
const APPLY_FAILED = "Không áp được mã. Vui lòng thử lại.";
const NOT_ELIGIBLE = "Đơn chưa đạt điều kiện dùng mã này.";

function fail<T>(status: number, form: string): VoucherResult<T> {
  return { ok: false, status, errors: { form } };
}

function failFields<T>(
  status: number,
  errors: VoucherFieldErrors,
): VoucherResult<T> {
  return { ok: false, status, errors };
}

function formatVnd(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

// Same normalization as voucher-spend's walletDiscountFor: unknown
// stored types fall back to "fixed".
function normalizeDiscountType(value: string | null): VoucherDiscountType {
  return value === "percent" || value === "free_service" ? value : "fixed";
}

function walletDiscount(row: WalletRow, subtotal: number): number {
  return clampVoucherDiscount({
    discountType: normalizeDiscountType(row.discount_type),
    discountValue: row.discount_value ?? 0,
    maxDiscount: row.max_discount ?? 0,
    subtotal,
  });
}

function campaignDiscount(row: CampaignRow, subtotal: number): number {
  return clampVoucherDiscount({
    discountType: normalizeDiscountType(row.discount_type),
    discountValue: row.discount_value ?? 0,
    maxDiscount: row.max_discount ?? 0,
    subtotal,
  });
}

// The caller's wallets of one campaign: owned counts every status (same
// rule as manual grants); active is the first spendable one, read from
// by_id (source of truth) and unexpired.
async function userCampaignWallets(
  userId: string,
  campaignId: string,
  now: Date,
): Promise<{ owned: number; active: WalletRow | null }> {
  const ids = await listUserWalletIdsForCampaign(userId, campaignId);
  const rows = await listWalletRowsByIds(ids);
  const active =
    rows.find(
      (row) =>
        row.status === "active" && (!row.expires_at || row.expires_at > now),
    ) ?? null;
  return { owned: ids.length, active };
}

export async function claimWalletByCode(params: {
  userId: string;
  code: unknown;
  kind: VoucherKind;
  subtotal: number;
  now?: Date;
}): Promise<VoucherResult<ClaimVoucherCodeResult>> {
  const now = params.now ?? new Date();
  const code = normalizeRedeemCode(params.code);
  if (!isValidRedeemCode(code)) {
    return failFields(400, { redeemCode: "Mã voucher không hợp lệ." });
  }
  if (!Number.isSafeInteger(params.subtotal) || params.subtotal < 0) {
    return failFields(400, { form: "Tạm tính không hợp lệ." });
  }
  const campaignId = await findCampaignIdByRedeemCode(code);
  if (!campaignId) {
    return failFields(404, { redeemCode: CODE_NOT_FOUND });
  }
  const row = await findCampaignRowById(campaignId);
  if (
    !row ||
    isDeletedFlag(row.is_deleted) ||
    row.is_active !== true ||
    row.redeem_code !== code
  ) {
    return failFields(404, { redeemCode: CODE_NOT_FOUND });
  }
  if (row.start_at && row.start_at > now) {
    return failFields(400, {
      redeemCode: "Mã voucher chưa đến ngày áp dụng.",
    });
  }
  if (row.end_at && row.end_at < now) {
    return failFields(400, { redeemCode: "Mã voucher đã hết hạn." });
  }
  const scope = row.scope ?? "all";
  if (scope !== "all" && scope !== params.kind) {
    return failFields(400, {
      redeemCode:
        params.kind === "booking"
          ? "Mã này chỉ dùng cho đơn linh kiện."
          : "Mã này chỉ dùng cho lịch sửa xe.",
    });
  }
  const minOrder = row.min_order ?? 0;
  if (params.subtotal < minOrder) {
    return failFields(400, {
      redeemCode: `Cần tạm tính từ ${formatVnd(minOrder)} để dùng mã này.`,
    });
  }
  if (campaignDiscount(row, params.subtotal) <= 0) {
    return failFields(400, { redeemCode: NOT_ELIGIBLE });
  }
  const { owned, active } = await userCampaignWallets(
    params.userId,
    campaignId,
    now,
  );
  if (active) {
    const discount = walletDiscount(active, params.subtotal);
    if (discount <= 0) {
      return failFields(400, { redeemCode: NOT_ELIGIBLE });
    }
    return {
      ok: true,
      data: { wallet: toWallet(active, row), discount, reused: true },
    };
  }
  if (owned >= (row.per_user_limit ?? 1)) {
    return failFields(400, {
      redeemCode: "Bạn đã nhận đủ số lượt của mã này.",
    });
  }
  const walletId = randomUUID();
  const seq = owned + 1;
  const locked = await claimCodeClaimLock({
    campaignId,
    userId: params.userId,
    seq,
    walletId,
    claimedAt: now,
  });
  if (!locked) {
    return failFields(409, {
      redeemCode: "Mã đang được xử lý, vui lòng thử lại sau giây lát.",
    });
  }
  const slot = await claimGrantSlot(campaignId, row.total_limit ?? 0);
  if (slot === "limit") {
    await releaseCodeClaimLock(campaignId, params.userId, seq);
    return failFields(400, { redeemCode: "Mã voucher đã hết lượt." });
  }
  if (slot === "error") {
    await releaseCodeClaimLock(campaignId, params.userId, seq);
    return fail(500, APPLY_FAILED);
  }
  try {
    await insertWallet({
      walletId,
      userId: params.userId,
      campaignId,
      campaignCode: row.code ?? "",
      campaignName: row.name ?? "",
      imageUrl: row.image_url ?? "",
      discountType: normalizeDiscountType(row.discount_type),
      discountValue: row.discount_value ?? 0,
      maxDiscount: row.max_discount ?? 0,
      grantedBy: null,
      grantNote: `Nhập mã ${code}`,
      grantedAt: now,
      expiresAt: row.end_at ?? null,
    });
  } catch (error) {
    await releaseGrantSlot(campaignId).catch(() => undefined);
    await releaseCodeClaimLock(campaignId, params.userId, seq).catch(
      () => undefined,
    );
    throw error;
  }
  const created = await findWalletRowById(walletId);
  if (!created) return fail(500, APPLY_FAILED);
  // The customer started this action, so no email — only open wallet
  // screens need the grant signal.
  void publishWalletChange({
    kind: "voucher-granted",
    walletId,
    userId: params.userId,
  });
  return {
    ok: true,
    data: {
      wallet: toWallet(created, row),
      discount: walletDiscount(created, params.subtotal),
      reused: false,
    },
  };
}

// What the public campaign page may reveal to one signed-in customer:
// the code itself only when they could still claim it.
export async function getRedeemCodeForViewer(
  userId: string,
  slug: string,
  now = new Date(),
): Promise<VoucherResult<RedeemCodeVisibility>> {
  const campaignId = await findCampaignIdBySlug(slug.trim().toLowerCase());
  const row = campaignId ? await findCampaignRowById(campaignId) : null;
  if (!row || !isPublicVisible(row, now) || !row.redeem_code) {
    return fail(404, "Không tìm thấy mã ưu đãi.");
  }
  const { owned, active } = await userCampaignWallets(
    userId,
    row.campaign_id,
    now,
  );
  if (active)
    return { ok: true, data: { status: "owned", walletId: active.wallet_id } };
  if (owned >= (row.per_user_limit ?? 1)) {
    return { ok: true, data: { status: "limit" } };
  }
  return { ok: true, data: { status: "claimable", code: row.redeem_code } };
}
