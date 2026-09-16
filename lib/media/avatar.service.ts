// Avatar flow: the customer uploads through POST /api/media (scope
// avatar, owner = self), then points their profile at the new asset
// here. Services call repositories, never the ScyllaDB client.
import { setAvatarUrl } from "@/lib/auth/user.repository";
import type { PublicUser } from "@/lib/auth/user.types";
import { findAssetRowById } from "./media.repository";
import type { MediaResult } from "./media.types";

export async function setMyAvatar(
  user: PublicUser,
  assetId: string,
): Promise<MediaResult<{ avatarUrl: string }>> {
  const id = (assetId ?? "").trim();
  if (!id) {
    return {
      ok: false,
      status: 400,
      errors: { form: "Thiếu mã ảnh đại diện." },
    };
  }
  const row = await findAssetRowById(id);
  // Only own avatar-scope uploads can become an avatar: catalog or
  // flow photos (and anyone else's uploads) are rejected here.
  if (!row || !row.url) {
    return {
      ok: false,
      status: 404,
      errors: { form: "Không tìm thấy ảnh này." },
    };
  }
  if (row.scope !== "avatar" || row.created_by !== user.id) {
    return {
      ok: false,
      status: 403,
      errors: { form: "Ảnh này không dùng được làm ảnh đại diện." },
    };
  }
  await setAvatarUrl(user.id, row.url);
  return { ok: true, data: { avatarUrl: row.url } };
}
