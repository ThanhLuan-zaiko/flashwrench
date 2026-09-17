// Business logic behind POST /api/media and DELETE /api/media/[id].
// Validates, stores the file, then registers metadata. Services call
// repositories (and the storage module), never the ScyllaDB client.
import { randomUUID } from "node:crypto";
import type { PublicUser } from "@/lib/auth/user.types";
import {
  deleteAssetRows,
  findAssetRowById,
  type InsertAssetParams,
  insertAsset,
  listAssetRowsByOwner,
  relinkAssetOwner,
} from "./media.repository";
import type { CreateAssetInput, MediaAsset, MediaResult } from "./media.types";
import {
  checkUploadHeaders,
  extensionForMime,
  isAllowedMediaMime,
  isMediaScope,
  sniffImageMime,
  validateAltText,
  validateDimensions,
} from "./media.validation";
import { buildAssetKey, isSafeAssetKey, publicAssetUrl } from "./media-paths";
import { deleteAssetFile, writeAssetFile } from "./media-storage";

function fail<T>(status: number, form: string): MediaResult<T> {
  return { ok: false, status, errors: { form } };
}

function toIso(value: Date | null): string | null {
  return value ? new Date(value).toISOString() : null;
}

function toAsset(params: InsertAssetParams): MediaAsset {
  return {
    assetId: params.assetId,
    ownerType: params.ownerType,
    ownerId: params.ownerId,
    scope: params.scope as MediaAsset["scope"],
    filePath: params.filePath,
    url: params.url,
    mime: params.mime,
    sizeBytes: params.sizeBytes,
    width: params.width,
    height: params.height,
    alt: params.alt,
    createdBy: params.createdBy,
    createdAt: toIso(params.createdAt),
  };
}

// Only admins attach images to shared catalog rows (services,
// categories, parts). Avatars and flow photos (booking, emergency,
// review, misc) belong to the uploader themselves.
export function canUploadScope(
  role: PublicUser["role"],
  scope: string,
): boolean {
  if (scope === "service" || scope === "category" || scope === "part") {
    return role === "admin";
  }
  return true;
}

// Only the uploader or an admin removes an asset. Returns the doomed
// row so the route can answer 404 before touching anything.
export type AuthorizedAsset = {
  ownerType: string;
  ownerId: string;
  createdAt: Date;
  filePath: string;
};

export async function authorizeAssetDelete(
  assetId: string,
  user: PublicUser,
): Promise<MediaResult<AuthorizedAsset>> {
  const row = await findAssetRowById(assetId);
  if (!row || !row.owner_type || !row.owner_id || !row.created_at) {
    return fail(404, "Không tìm thấy ảnh này.");
  }
  if (user.role !== "admin" && row.created_by !== user.id) {
    return fail(403, "Bạn không có quyền xóa ảnh này.");
  }
  return {
    ok: true,
    data: {
      ownerType: row.owner_type,
      ownerId: row.owner_id,
      createdAt: row.created_at,
      filePath: row.file_path ?? "",
    },
  };
}

export async function createMediaAsset(
  user: PublicUser,
  input: CreateAssetInput,
): Promise<MediaResult<MediaAsset>> {
  if (!isMediaScope(input.scope)) {
    return fail(400, "Nhóm ảnh không hợp lệ.");
  }
  if (!canUploadScope(user.role, input.scope)) {
    return fail(403, "Bạn không có quyền tải ảnh cho nhóm này.");
  }
  const ownerType =
    typeof input.ownerType === "string" ? input.ownerType.trim() : "";
  const ownerId = typeof input.ownerId === "string" ? input.ownerId.trim() : "";
  if (!ownerType || !ownerId) {
    return fail(400, "Thiếu thông tin chủ sở hữu ảnh.");
  }
  const headerErrors = checkUploadHeaders({
    scope: input.scope,
    mime: input.mime,
    sizeBytes: input.file.length,
  });
  if (headerErrors) return { ok: false, status: 400, errors: headerErrors };

  // Declared mime must match the sniffed bytes: a renamed executable
  // fails here even with a flawless Content-Type.
  const sniffed = sniffImageMime(input.file);
  if (!sniffed || sniffed !== input.mime) {
    return fail(400, "File không phải ảnh JPEG, PNG hoặc WebP hợp lệ.");
  }
  if (!isAllowedMediaMime(input.mime)) {
    return fail(400, "Chỉ nhận ảnh JPEG, PNG hoặc WebP.");
  }
  const alt = validateAltText(input.alt);
  if ("error" in alt) return fail(400, alt.error);
  const dims = validateDimensions(input.width, input.height);
  if ("error" in dims) return fail(400, dims.error);

  const assetId = randomUUID();
  const key = buildAssetKey(input.scope, assetId, extensionForMime(input.mime));
  await writeAssetFile(key, input.file);

  const createdAt = new Date();
  const params: InsertAssetParams = {
    assetId,
    ownerType,
    ownerId,
    scope: input.scope,
    filePath: key,
    url: publicAssetUrl(key),
    mime: input.mime,
    sizeBytes: input.file.length,
    width: dims.width,
    height: dims.height,
    alt: alt.alt,
    createdBy: user.id,
    createdAt,
  };
  try {
    await insertAsset(params);
  } catch {
    // Registry failed after the bytes landed: remove the orphan file
    // so disk and database can never drift apart.
    await deleteAssetFile(key).catch(() => undefined);
    throw new Error("Asset registry write failed.");
  }
  return { ok: true, data: toAsset(params) };
}

export async function deleteMediaAsset(
  assetId: string,
  user: PublicUser,
): Promise<MediaResult<{ assetId: string }>> {
  const authorized = await authorizeAssetDelete(assetId, user);
  if (!authorized.ok) return authorized;
  const target = authorized.data;
  if (target.filePath && isSafeAssetKey(target.filePath)) {
    await deleteAssetFile(target.filePath).catch(() => undefined);
  }
  await deleteAssetRows(
    assetId,
    target.ownerType,
    target.ownerId,
    target.createdAt,
  );
  return { ok: true, data: { assetId } };
}

// Attach a freshly uploaded asset to its real catalog owner. The admin
// dialog uploads before the service/category row exists, so the asset
// carries a temporary owner until save. No asset id means nothing to
// do; unknown ids are 404 (admin-only callers, no hijack check needed).
export async function claimAssetForOwner(
  assetId: string | undefined,
  ownerType: string,
  ownerId: string,
): Promise<MediaResult<{ assetId: string } | null>> {
  const id = typeof assetId === "string" ? assetId.trim() : "";
  if (!id) return { ok: true, data: null };
  const relinked = await relinkAssetOwner(id, ownerType, ownerId);
  if (!relinked) {
    return {
      ok: false,
      status: 404,
      errors: {
        imageAssetId: "Không tìm thấy ảnh vừa tải lên. Vui lòng tải lại.",
      },
    };
  }
  return { ok: true, data: { assetId: id } };
}

// Bulk variant for cover galleries: claims every fresh asset in order.
// Stops at the first unknown id so the caller can abort before writing
// the catalog row. Empty input means nothing to do.
export async function claimAssetsForOwner(
  assetIds: string[],
  ownerType: string,
  ownerId: string,
): Promise<MediaResult<{ assetIds: string[] } | null>> {
  const ids = assetIds.map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0) return { ok: true, data: null };
  for (const id of ids) {
    const relinked = await relinkAssetOwner(id, ownerType, ownerId);
    if (!relinked) {
      return {
        ok: false,
        status: 404,
        errors: {
          imageAssetId: "Không tìm thấy ảnh vừa tải lên. Vui lòng tải lại.",
        },
      };
    }
  }
  return { ok: true, data: { assetIds: ids } };
}

// Lifecycle cleanup: delete every asset of one owner whose URL is not in
// keepUrls (file on disk plus both registry rows). Pass [] to purge the
// whole gallery on hard delete. Ownership is re-checked per asset so a
// stale index entry can never remove another owner's file. Missing files
// are skipped silently; callers run this best-effort after the catalog
// write so media trouble never blocks the admin action.
export async function pruneOwnerAssets(
  ownerType: string,
  ownerId: string,
  keepUrls: string[],
): Promise<{ deleted: number }> {
  const keep = new Set(keepUrls.map((u) => u.trim()).filter(Boolean));
  const refs = await listAssetRowsByOwner(ownerType, ownerId);
  let deleted = 0;
  for (const ref of refs) {
    if (keep.has(ref.url.trim())) continue;
    const row = await findAssetRowById(ref.assetId);
    if (!row || row.owner_type !== ownerType || row.owner_id !== ownerId) {
      continue;
    }
    if (row.file_path && isSafeAssetKey(row.file_path)) {
      await deleteAssetFile(row.file_path).catch(() => undefined);
    }
    await deleteAssetRows(
      ref.assetId,
      row.owner_type,
      row.owner_id,
      row.created_at ?? ref.createdAt,
    );
    deleted += 1;
  }
  return { deleted };
}
