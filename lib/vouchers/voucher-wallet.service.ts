// Wallet lifecycle for staff: grant to one account, list, revoke.
// Anti-share by design: wallets carry user_id, never a reusable code.
// Spending lives in voucher-spend.service.ts (CAS transitions there).
import { randomUUID } from "node:crypto";
import { findUserById } from "@/lib/auth/user.repository";
import type { UserRole } from "@/lib/auth/user.types";
import { decodeCursor, encodeCursor } from "@/lib/db/cursor";
import { toWallet } from "./voucher.mapper";
import type {
  CampaignRow,
  GrantWalletInput,
  VoucherResult,
  VoucherWallet,
} from "./voucher.types";
import { isDeletedFlag } from "./voucher.types";
import {
  claimGrantSlot,
  findCampaignRowById,
  releaseGrantSlot,
} from "./voucher-campaign.repository";
import { parseOptionalDate, validateGrantInput } from "./voucher-validation";
import {
  commitWalletTransition,
  countUserWalletsForCampaign,
  findWalletRowById,
  insertWallet,
  listWalletIdsByUser,
  listWalletRowsByIds,
} from "./voucher-wallet.repository";

function fail<T>(status: number, form: string): VoucherResult<T> {
  return { ok: false, status, errors: { form } };
}

type Actor = { id: string; role: UserRole };

// Worst-case VND value of one grant: fixed campaigns pay face value,
// percent campaigns are bounded by max_discount, and free_service (or an
// uncapped percent) is unbounded — null means "no ceiling exists".
function worstCaseDiscount(campaign: CampaignRow): number | null {
  if (campaign.discount_type === "fixed") {
    return campaign.discount_value ?? 0;
  }
  if (campaign.discount_type === "percent") {
    const cap = campaign.max_discount ?? 0;
    return cap > 0 ? cap : null;
  }
  return null;
}

// Dispatchers only grant campaigns flagged for them, and only when the
// campaign's worst-case discount fits inside their VND cap. Admin is
// unbounded; a zero cap is an explicit "no dispatcher cap" choice.
// Shared with the auto-rule service — wiring a rule to a campaign is the
// same power as granting from it.
export function dispatcherCapAllows(
  actor: Actor,
  campaign: CampaignRow,
): VoucherResult<null> | null {
  if (actor.role === "admin") return null;
  if (!campaign.allow_dispatcher_grant) {
    return {
      ok: false,
      status: 403,
      errors: { form: "Chiến dịch này chỉ admin được phát." },
    };
  }
  const cap = campaign.dispatcher_max_value ?? 0;
  const worst = worstCaseDiscount(campaign);
  if (cap > 0 && (worst === null || worst > cap)) {
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
  if (isDeletedFlag(campaign.is_deleted)) {
    return fail(400, "Chiến dịch đang nằm trong thùng rác.");
  }
  if (!campaign.is_active) return fail(400, "Chiến dịch đang tắt.");
  // Wallets only land on live customer accounts. That one check kills
  // self-dealing (staff ids are never customer role) and grants aimed
  // at ids that do not exist.
  const target = await findUserById(raw.userId.trim());
  if (target?.role !== "customer" || target.status !== "active") {
    return fail(404, "Không tìm thấy tài khoản khách hàng.");
  }
  const blocked = dispatcherCapAllows(actor, campaign);
  if (blocked) return blocked as VoucherResult<VoucherWallet>;
  const perUser = campaign.per_user_limit ?? 1;
  const owned = await countUserWalletsForCampaign(
    raw.userId.trim(),
    campaign.campaign_id,
  );
  if (owned >= perUser) {
    return fail(400, "Khách này đã nhận đủ số voucher của chiến dịch.");
  }
  // The slot claim carries the real total_limit enforcement: a CAS
  // increment on granted_count, so parallel grants never overshoot.
  // Admins pass 0 — unlimited, but still counted for the audit trail.
  const slot = await claimGrantSlot(
    campaign.campaign_id,
    actor.role === "admin" ? 0 : (campaign.total_limit ?? 0),
  );
  if (slot === "limit") {
    return fail(400, "Chiến dịch đã phát hết số lượng.");
  }
  if (slot !== "ok") {
    return fail(500, "Không ghi nhận được lượt phát voucher. Thử lại.");
  }
  const walletId = randomUUID();
  const now = new Date();
  const expiresAt = parseOptionalDate(raw.expiresAt) ?? campaign.end_at ?? null;
  try {
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
  } catch (error) {
    await releaseGrantSlot(campaign.campaign_id).catch(() => undefined);
    throw error;
  }
  const row = await findWalletRowById(walletId);
  if (!row) return fail(500, "Không phát được voucher.");
  return { ok: true, data: toWallet(row) };
}

export type MyWalletPage = {
  items: VoucherWallet[];
  nextCursor: string | null;
};

const MY_WALLETS_SCOPE = "vouchers-mine";
const MY_WALLETS_LIMIT = 12;
const MY_WALLETS_MAX_LIMIT = 100;

export async function listMyWallets(
  userId: string,
  params: { cursor?: string | null; limit?: number } = {},
): Promise<VoucherResult<MyWalletPage>> {
  let pageState: string | null = null;
  try {
    pageState = decodeCursor(params.cursor, MY_WALLETS_SCOPE);
  } catch {
    return fail(400, "Con trỏ trang không hợp lệ.");
  }
  const limit = Math.min(
    Math.max(params.limit ?? MY_WALLETS_LIMIT, 1),
    MY_WALLETS_MAX_LIMIT,
  );
  const page = await listWalletIdsByUser(userId, limit, pageState);
  const rows = await listWalletRowsByIds(page.ids);
  // One campaign lookup per distinct campaign on this page — the row
  // carries scope + minimum order so pickers can filter client-side.
  const campaignIds = [
    ...new Set(
      rows
        .map((row) => row.campaign_id)
        .filter((id): id is string => id !== null),
    ),
  ];
  const campaigns = new Map(
    (
      await Promise.all(
        campaignIds.map(async (id) => {
          const campaign = await findCampaignRowById(id).catch(() => null);
          return [id, campaign] as const;
        }),
      )
    ).filter((entry): entry is readonly [string, CampaignRow] =>
      Boolean(entry[1]),
    ),
  );
  return {
    ok: true,
    data: {
      items: rows.map((row) =>
        toWallet(
          row,
          row.campaign_id ? (campaigns.get(row.campaign_id) ?? null) : null,
        ),
      ),
      nextCursor: encodeCursor(page.pageState, MY_WALLETS_SCOPE),
    },
  };
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
  const applied = await commitWalletTransition({
    walletId: row.wallet_id,
    userId: row.user_id,
    campaignId: row.campaign_id,
    grantedAt: row.granted_at ?? new Date(),
    status: "revoked",
    usedAt: null,
    usedOrderId: null,
    usedBookingId: null,
    expectStatus: "active",
  });
  if (!applied) return fail(400, "Voucher không còn hiệu lực.");
  void note;
  const next = await findWalletRowById(walletId);
  if (!next) return fail(500, "Không thu hồi được voucher.");
  return { ok: true, data: toWallet(next) };
}
