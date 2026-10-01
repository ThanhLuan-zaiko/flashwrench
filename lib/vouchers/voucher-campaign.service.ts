// Admin-only campaign lifecycle: create, update, toggle, list.
import { randomUUID } from "node:crypto";
import {
  claimAssetForOwner,
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
import {
  claimCampaignCode,
  claimGrantSlot,
  findCampaignIdByCode,
  findCampaignRowById,
  insertCampaign,
  listCampaignRows,
  releaseCampaignCode,
  setCampaignActive,
  updateCampaignRows,
} from "./voucher-campaign.repository";
import {
  normalizeVoucherCode,
  parseOptionalDate,
  validateCampaignInput,
} from "./voucher-validation";

function fail<T>(status: number, form: string): VoucherResult<T> {
  return { ok: false, status, errors: { form } };
}

function failFields<T>(
  status: number,
  errors: VoucherFieldErrors,
): VoucherResult<T> {
  return { ok: false, status, errors };
}

export async function listCampaigns(): Promise<
  VoucherResult<VoucherCampaign[]>
> {
  const rows = await listCampaignRows();
  const items = rows
    .map(toCampaign)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return { ok: true, data: items };
}

export async function createCampaign(
  actorId: string,
  raw: CreateCampaignInput,
): Promise<VoucherResult<VoucherCampaign>> {
  const code = normalizeVoucherCode(raw.code);
  const fieldErrors = validateCampaignInput({
    code,
    name: raw.name.trim(),
    description: (raw.description ?? "").trim(),
    imageUrl: (raw.imageUrl ?? "").trim(),
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
  const owner = await findCampaignIdByCode(code);
  if (owner) return failFields(409, { code: "Mã chiến dịch đã tồn tại." });

  const campaignId = randomUUID();
  const now = new Date();
  if (!(await claimCampaignCode(code, campaignId))) {
    return failFields(409, { code: "Mã chiến dịch đã tồn tại." });
  }
  const claimed = await claimAssetForOwner(
    raw.imageAssetId,
    "promotion",
    campaignId,
  );
  if (!claimed.ok) {
    await releaseCampaignCode(code, campaignId);
    return failFields(claimed.status, claimed.errors);
  }
  try {
    await insertCampaign({
      campaignId,
      code,
      name: raw.name.trim(),
      description: (raw.description ?? "").trim(),
      imageUrl: (raw.imageUrl ?? "").trim(),
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
  const code = normalizeVoucherCode(raw.code);
  if ((existing.code ?? "") !== code) {
    return failFields(400, { code: "Không được đổi mã sau khi tạo." });
  }
  const fieldErrors = validateCampaignInput({
    code,
    name: raw.name.trim(),
    description: (raw.description ?? "").trim(),
    imageUrl: (raw.imageUrl ?? "").trim(),
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
  const assetClaim = await claimAssetForOwner(
    raw.imageAssetId,
    "promotion",
    campaignId,
  );
  if (!assetClaim.ok) return failFields(assetClaim.status, assetClaim.errors);
  await updateCampaignRows({
    campaignId,
    code,
    name: raw.name.trim(),
    description: (raw.description ?? "").trim(),
    imageUrl: (raw.imageUrl ?? "").trim(),
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
  await pruneOwnerAssets("promotion", campaignId, [
    (raw.imageUrl ?? "").trim(),
  ]).catch(() => undefined);
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
  await setCampaignActive(campaignId, isActive);
  const row = await findCampaignRowById(campaignId);
  if (!row) return fail(500, "Không cập nhật được trạng thái.");
  return { ok: true, data: toCampaign(row) };
}

export async function incrementGranted(campaignId: string): Promise<void> {
  await claimGrantSlot(campaignId, 0).catch(() => undefined);
}
