// Admin-only campaign lifecycle: create, update, toggle, trash, list.
import { randomUUID } from "node:crypto";
import {
  claimAssetsForOwner,
  pruneOwnerAssets,
} from "@/lib/media/media.service";
import { toCampaign } from "./voucher.mapper";
import type {
  CreateCampaignInput,
  UpdateCampaignInput,
  VoucherCampaign,
  VoucherFieldErrors,
  VoucherResult,
} from "./voucher.types";
import { isDeletedFlag } from "./voucher.types";
import {
  claimCampaignCode,
  claimCampaignSlug,
  claimGrantSlot,
  findCampaignIdByCode,
  findCampaignIdBySlug,
  findCampaignRowById,
  hardDeleteCampaign,
  insertCampaign,
  listCampaignRows,
  releaseCampaignCode,
  releaseCampaignSlug,
  setCampaignActive,
  setCampaignDeleted,
  updateCampaignRows,
} from "./voucher-campaign.repository";
import {
  normalizeVoucherSlug,
  parseOptionalDate,
  validateCampaignInput,
  voucherCodeFromSlug,
} from "./voucher-validation";
import { countActiveWalletsForCampaign } from "./voucher-wallet.repository";

function fail<T>(status: number, form: string): VoucherResult<T> {
  return { ok: false, status, errors: { form } };
}

function failFields<T>(
  status: number,
  errors: VoucherFieldErrors,
): VoucherResult<T> {
  return { ok: false, status, errors };
}

export async function listCampaigns(options?: {
  includeDeleted?: boolean;
}): Promise<VoucherResult<VoucherCampaign[]>> {
  const rows = await listCampaignRows();
  const items = rows
    .filter((row) => options?.includeDeleted || !isDeletedFlag(row.is_deleted))
    .map(toCampaign)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return { ok: true, data: items };
}

export async function createCampaign(
  actorId: string,
  raw: CreateCampaignInput,
): Promise<VoucherResult<VoucherCampaign>> {
  const slug = normalizeVoucherSlug(raw.slug);
  const code = voucherCodeFromSlug(slug);
  const images = (raw.images ?? []).map((u) => u.trim()).filter(Boolean);
  const fieldErrors = validateCampaignInput({
    code,
    slug,
    name: raw.name.trim(),
    description: (raw.description ?? "").trim(),
    images,
    discountType: raw.discountType,
    discountValue: raw.discountValue,
    maxDiscount: raw.maxDiscount ?? 0,
    minOrder: raw.minOrder ?? 0,
    scope: raw.scope ?? "all",
    startAt: raw.startAt,
    endAt: raw.endAt,
    totalLimit: raw.totalLimit ?? 0,
    perUserLimit: raw.perUserLimit ?? 1,
    allowDispatcherGrant: raw.allowDispatcherGrant ?? false,
    dispatcherMaxValue: raw.dispatcherMaxValue ?? 0,
    isActive: raw.isActive,
  });
  if (fieldErrors) return failFields(400, fieldErrors);
  const slugOwner = await findCampaignIdBySlug(slug);
  if (slugOwner) {
    return failFields(409, { slug: "Slug đã tồn tại. Chọn slug khác." });
  }
  const codeOwner = await findCampaignIdByCode(code);
  if (codeOwner) {
    return failFields(409, {
      slug: "Slug này sinh ra mã đã tồn tại. Chọn slug khác.",
    });
  }
  const campaignId = randomUUID();
  const now = new Date();
  if (!(await claimCampaignSlug(slug, campaignId))) {
    return failFields(409, { slug: "Slug đã tồn tại. Chọn slug khác." });
  }
  if (!(await claimCampaignCode(code, campaignId))) {
    await releaseCampaignSlug(slug, campaignId);
    return failFields(409, {
      slug: "Slug này sinh ra mã đã tồn tại. Chọn slug khác.",
    });
  }
  const claimed = await claimAssetsForOwner(
    raw.imageAssetIds ?? [],
    "promotion",
    campaignId,
  );
  if (!claimed.ok) {
    await releaseCampaignCode(code, campaignId);
    await releaseCampaignSlug(slug, campaignId);
    return failFields(claimed.status, claimed.errors);
  }
  try {
    await insertCampaign({
      campaignId,
      code,
      slug,
      name: raw.name.trim(),
      description: (raw.description ?? "").trim(),
      imageUrl: images[0] ?? "",
      images,
      discountType: raw.discountType,
      discountValue: Math.trunc(raw.discountValue),
      maxDiscount: Math.trunc(raw.maxDiscount ?? 0),
      minOrder: Math.trunc(raw.minOrder ?? 0),
      scope: raw.scope ?? "all",
      startAt: parseOptionalDate(raw.startAt),
      endAt: parseOptionalDate(raw.endAt),
      totalLimit: Math.trunc(raw.totalLimit ?? 0),
      perUserLimit: Math.trunc(raw.perUserLimit ?? 1),
      allowDispatcherGrant: raw.allowDispatcherGrant ?? false,
      dispatcherMaxValue: Math.trunc(raw.dispatcherMaxValue ?? 0),
      isActive: raw.isActive ?? true,
      createdBy: actorId,
      now,
    });
  } catch {
    await releaseCampaignCode(code, campaignId);
    await releaseCampaignSlug(slug, campaignId);
    throw new Error("Campaign insert failed.");
  }
  const row = await findCampaignRowById(campaignId);
  if (!row) return fail(500, "Không tạo được chiến dịch.");
  return { ok: true, data: toCampaign(row) };
}

export async function updateCampaign(
  campaignId: string,
  raw: UpdateCampaignInput,
): Promise<VoucherResult<VoucherCampaign>> {
  const existing = await findCampaignRowById(campaignId);
  if (!existing) return fail(404, "Không tìm thấy chiến dịch.");
  if (isDeletedFlag(existing.is_deleted)) {
    return fail(400, "Chiến dịch đang nằm trong thùng rác, không thể sửa.");
  }
  const slug = normalizeVoucherSlug(raw.slug);
  if (slug !== (existing.slug ?? "")) {
    return failFields(400, { slug: "Không được đổi slug sau khi tạo." });
  }
  const code = existing.code ?? voucherCodeFromSlug(slug);
  const images = (raw.images ?? []).map((u) => u.trim()).filter(Boolean);
  const fieldErrors = validateCampaignInput({
    code,
    slug,
    name: raw.name.trim(),
    description: (raw.description ?? "").trim(),
    images,
    discountType: raw.discountType,
    discountValue: raw.discountValue,
    maxDiscount: raw.maxDiscount ?? 0,
    minOrder: raw.minOrder ?? 0,
    scope: raw.scope ?? "all",
    startAt: raw.startAt,
    endAt: raw.endAt,
    totalLimit: raw.totalLimit ?? 0,
    perUserLimit: raw.perUserLimit ?? 1,
    allowDispatcherGrant: raw.allowDispatcherGrant ?? false,
    dispatcherMaxValue: raw.dispatcherMaxValue ?? 0,
    isActive: raw.isActive,
  });
  if (fieldErrors) return failFields(400, fieldErrors);
  const assetClaim = await claimAssetsForOwner(
    raw.imageAssetIds ?? [],
    "promotion",
    campaignId,
  );
  if (!assetClaim.ok) return failFields(assetClaim.status, assetClaim.errors);
  await updateCampaignRows({
    campaignId,
    code,
    slug,
    name: raw.name.trim(),
    description: (raw.description ?? "").trim(),
    imageUrl: images[0] ?? "",
    images,
    discountType: raw.discountType,
    discountValue: Math.trunc(raw.discountValue),
    maxDiscount: Math.trunc(raw.maxDiscount ?? 0),
    minOrder: Math.trunc(raw.minOrder ?? 0),
    scope: raw.scope ?? "all",
    startAt: parseOptionalDate(raw.startAt),
    endAt: parseOptionalDate(raw.endAt),
    totalLimit: Math.trunc(raw.totalLimit ?? 0),
    perUserLimit: Math.trunc(raw.perUserLimit ?? 1),
    allowDispatcherGrant: raw.allowDispatcherGrant ?? false,
    dispatcherMaxValue: Math.trunc(raw.dispatcherMaxValue ?? 0),
    isActive: raw.isActive ?? true,
    createdBy: existing.created_by ?? "",
    now: new Date(),
  });
  await pruneOwnerAssets("promotion", campaignId, images).catch(
    () => undefined,
  );
  const row = await findCampaignRowById(campaignId);
  if (!row) return fail(500, "Không cập nhật được chiến dịch.");
  return { ok: true, data: toCampaign(row) };
}

export async function toggleCampaign(
  campaignId: string,
  isActive: boolean,
): Promise<VoucherResult<VoucherCampaign>> {
  const existing = await findCampaignRowById(campaignId);
  if (!existing) return fail(404, "Không tìm thấy chiến dịch.");
  if (isDeletedFlag(existing.is_deleted)) {
    return fail(400, "Chiến dịch đang nằm trong thùng rác.");
  }
  await setCampaignActive(campaignId, isActive);
  const row = await findCampaignRowById(campaignId);
  if (!row) return fail(500, "Không cập nhật được trạng thái.");
  return { ok: true, data: toCampaign(row) };
}

export async function softDeleteCampaign(
  campaignId: string,
): Promise<VoucherResult<VoucherCampaign>> {
  const existing = await findCampaignRowById(campaignId);
  if (!existing) return fail(404, "Không tìm thấy chiến dịch.");
  if (isDeletedFlag(existing.is_deleted)) {
    return fail(400, "Chiến dịch đã nằm trong thùng rác.");
  }
  await setCampaignDeleted(campaignId, true, new Date());
  const row = await findCampaignRowById(campaignId);
  if (!row) return fail(500, "Không xóa được chiến dịch.");
  return { ok: true, data: toCampaign(row) };
}

export async function restoreCampaign(
  campaignId: string,
): Promise<VoucherResult<VoucherCampaign>> {
  const existing = await findCampaignRowById(campaignId);
  if (!existing) return fail(404, "Không tìm thấy chiến dịch.");
  if (!isDeletedFlag(existing.is_deleted)) {
    return fail(400, "Chiến dịch không nằm trong thùng rác.");
  }
  await setCampaignDeleted(campaignId, false, null);
  const row = await findCampaignRowById(campaignId);
  if (!row) return fail(500, "Không khôi phục được chiến dịch.");
  return { ok: true, data: toCampaign(row) };
}

// Hard delete is permanent: the row plus the code/slug claims go away.
// The client echoes the slug back as confirm; the service re-checks it
// and refuses while the campaign still has live wallets, since redeeming
// reads the campaign row for scope and minimum order.
export async function hardDeleteCampaignWithConfirm(
  campaignId: string,
  confirm: string,
): Promise<VoucherResult<{ id: string }>> {
  const existing = await findCampaignRowById(campaignId);
  if (!existing) return fail(404, "Không tìm thấy chiến dịch.");
  const slug = existing.slug ?? "";
  if (confirm.trim().toLowerCase() !== slug) {
    return failFields(400, {
      confirm: "Mã xác nhận chưa đúng. Hãy nhập đúng slug để xóa vĩnh viễn.",
    });
  }
  const activeWallets = await countActiveWalletsForCampaign(campaignId);
  if (activeWallets > 0) {
    return fail(
      400,
      `Chiến dịch còn ${activeWallets} voucher đang hiệu lực — thu hồi hết trước khi xóa vĩnh viễn.`,
    );
  }
  await hardDeleteCampaign({
    campaignId,
    code: existing.code ?? "",
    slug,
  });
  await pruneOwnerAssets("promotion", campaignId, []).catch(() => undefined);
  return { ok: true, data: { id: campaignId } };
}

export async function incrementGranted(campaignId: string): Promise<void> {
  await claimGrantSlot(campaignId, 0).catch(() => undefined);
}
