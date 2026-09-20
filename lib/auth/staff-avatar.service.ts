import { findAssetRowById } from "@/lib/media/media.repository";
import { claimAssetForOwner } from "@/lib/media/media.service";
import { isSafeAssetKey, publicAssetUrl } from "@/lib/media/media-paths";
import type { StaffFieldErrors } from "./staff.validation";
import { findUserById, setAvatarUrl } from "./user.repository";

type AvatarResolution =
  | { ok: true; assetId?: string; avatarUrl: string | null | undefined }
  | { ok: false; status: 404 | 403; errors: StaffFieldErrors };

export async function resolveStaffAvatar(
  adminId: string,
  assetId: string | null | undefined,
  targetUserId?: string,
): Promise<AvatarResolution> {
  if (assetId === undefined || assetId === null) {
    return { ok: true, avatarUrl: assetId };
  }
  const id = assetId.trim();
  const row = await findAssetRowById(id);
  if (!row || !row.url || !row.created_at) {
    return {
      ok: false,
      status: 404,
      errors: {
        avatarAssetId: "Không tìm thấy ảnh đại diện. Vui lòng tải lại.",
      },
    };
  }
  const validOwner =
    targetUserId !== undefined
      ? row.owner_id === targetUserId
      : row.owner_id === adminId ||
        (row.owner_id !== null && !(await findUserById(row.owner_id)));
  if (
    row.scope !== "avatar" ||
    row.owner_type !== "user" ||
    row.created_by !== adminId ||
    !validOwner ||
    !isSafeAssetKey(row.file_path) ||
    !row.file_path.startsWith("avatar/") ||
    row.url !== publicAssetUrl(row.file_path)
  ) {
    return {
      ok: false,
      status: 403,
      errors: {
        avatarAssetId:
          "Ảnh này không dùng được làm ảnh đại diện cho tài khoản này.",
      },
    };
  }
  return { ok: true, assetId: id, avatarUrl: row.url };
}

export async function saveStaffAvatar(
  userId: string,
  avatar: Extract<AvatarResolution, { ok: true }>,
  rebind = false,
): Promise<void> {
  if (avatar.avatarUrl === undefined) return;
  if (rebind && avatar.assetId) {
    const claimed = await claimAssetForOwner(avatar.assetId, "user", userId);
    if (!claimed.ok) throw new Error("Avatar owner rebinding failed.");
  }
  await setAvatarUrl(userId, avatar.avatarUrl);
}
