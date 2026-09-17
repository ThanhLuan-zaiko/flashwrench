// Pure helpers for the single staff avatar field. The UX mirrors the
// catalog cover gallery (deferred upload, local preview, crop before
// save) but a staff account owns at most one square photo. All
// functions are pure so bun:test can cover them without DOM or File.
export const MAX_STAFF_AVATARS = 1;

export type AvatarAction = "keep" | "replace" | "clear";

// Saved avatar of a staff row for dialog init: trimmed URL or null when
// the account has no photo yet.
export function initialAvatarFromItem(
  item: { avatarUrl: string | null | undefined } | null,
): string | null {
  if (!item) return null;
  const url = (item.avatarUrl ?? "").trim();
  return url ? url : null;
}

// True when the avatar differs from the saved row: a staged pick or a
// removed/kept URL change. Drives dirty checks so F5 never drops a pick.
export function isAvatarDirty(
  initial: string | null,
  current: string | null,
  hasStaged: boolean,
): boolean {
  if (hasStaged) return true;
  return (initial ?? null) !== (current ?? null);
}

// Decide what avatarAssetId the save payload should carry. Staged wins
// (caller uploads first, then sends the new asset id); a removed saved
// photo clears with null; otherwise undefined means no change so the
// service keeps the stored URL untouched.
export function decideAvatarAction(
  initial: string | null,
  current: string | null,
  hasStaged: boolean,
): AvatarAction {
  if (hasStaged) return "replace";
  if (initial && !current) return "clear";
  return "keep";
}

// Payload value for the staff create/update routes from the decided
// action. Uploaded asset id is required for replace; keep maps to
// undefined (no change) and clear maps to null (remove photo).
export function avatarAssetIdForAction(
  action: AvatarAction,
  uploadedAssetId: string | null,
): string | null | undefined {
  if (action === "replace") return uploadedAssetId ?? undefined;
  if (action === "clear") return null;
  return undefined;
}
