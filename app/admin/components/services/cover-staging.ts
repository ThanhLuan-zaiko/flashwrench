// Pure helpers for deferred catalog cover galleries (categories and
// services share the same UX). Files dropped on the dialog stay in
// memory as previews; nothing touches /api/media, ScyllaDB or disk
// until the user presses save. All functions are pure so bun:test can
// cover them without DOM or File APIs.
import { MAX_COVER_IMAGES } from "@/lib/catalog/catalog-validation";
import {
  defaultMaxUploadBytes,
  isAllowedMediaMime,
} from "@/lib/media/media.validation";

export { MAX_COVER_IMAGES };

export type PickableFile = {
  name: string;
  type: string;
  size: number;
};

export type StageDecision = {
  accepted: PickableFile[];
  rejected: { name: string; reason: string }[];
  limitHit: boolean;
};

export function maxUploadMbLabel(): string {
  return `${Math.round(defaultMaxUploadBytes() / 1024 / 1024)}MB`;
}

// Client pre-check mirroring the server guardrails: mime allowlist,
// non-empty size and the shared max-bytes cap. Magic-byte sniffing runs
// later in the hook (needs async bytes); this stays sync for tests.
export function decideStageFiles(
  incoming: PickableFile[],
  alreadyCount: number,
  maxBytes: number = defaultMaxUploadBytes(),
): StageDecision {
  const accepted: PickableFile[] = [];
  const rejected: { name: string; reason: string }[] = [];
  const slots = Math.max(0, MAX_COVER_IMAGES - alreadyCount);
  let limitHit = alreadyCount >= MAX_COVER_IMAGES;

  for (const file of incoming) {
    if (accepted.length >= slots) {
      limitHit = true;
      rejected.push({
        name: file.name,
        reason: `Tối đa ${MAX_COVER_IMAGES} ảnh cho mỗi mục.`,
      });
      continue;
    }
    if (!isAllowedMediaMime(file.type)) {
      rejected.push({
        name: file.name,
        reason: "Chỉ nhận ảnh JPEG, PNG hoặc WebP.",
      });
      continue;
    }
    if (!Number.isFinite(file.size) || file.size <= 0) {
      rejected.push({ name: file.name, reason: "File ảnh trống." });
      continue;
    }
    if (file.size > maxBytes) {
      rejected.push({
        name: file.name,
        reason: `Ảnh tối đa ${Math.round(maxBytes / 1024 / 1024)}MB.`,
      });
      continue;
    }
    accepted.push(file);
  }
  return { accepted, rejected, limitHit };
}

export function removeAtIndex<T>(list: T[], index: number): T[] {
  if (index < 0 || index >= list.length) return list;
  return [...list.slice(0, index), ...list.slice(index + 1)];
}

// Move the chosen image to the front: index 0 is always the cover that
// mirrors image_url for legacy readers while images keeps full order.
export function moveToCover<T>(list: T[], index: number): T[] {
  if (index <= 0 || index >= list.length) return list;
  return [list[index] as T, ...list.slice(0, index), ...list.slice(index + 1)];
}

export function canAddMore(
  existingCount: number,
  stagedCount: number,
): boolean {
  return existingCount + stagedCount < MAX_COVER_IMAGES;
}

// Saved gallery of a catalog row for dialog init: full order when the
// row carries one, legacy single cover otherwise.
export function initialGalleryFromItem(
  item: { images: string[]; imageUrl: string } | null,
): string[] {
  if (!item) return [];
  if (Array.isArray(item.images) && item.images.length > 0) return item.images;
  return item.imageUrl ? [item.imageUrl] : [];
}

// True when the gallery differs from the saved row: staged additions or
// removed/reordered kept covers. Drives the unsaved-changes warning so
// F5 or tab close never silently drops picked photos.
export function isGalleryDirty(
  initial: string[],
  current: string[],
  stagedCount: number,
): boolean {
  if (stagedCount > 0) return true;
  if (initial.length !== current.length) return true;
  return initial.some((url, index) => url !== current[index]);
}

// Short display name for a stored cover URL (last path segment), so
// horizontal gallery rows can label each photo without the full path.
export function displayNameFromUrl(url: string): string {
  const tail = url.split("/").filter(Boolean).pop() ?? "";
  if (!tail) return "Ảnh bìa";
  try {
    return decodeURIComponent(tail);
  } catch {
    return tail;
  }
}

// Final gallery payload for the save request: kept existing URLs first,
// then freshly uploaded URLs, deduped and capped. Cover is urls[0].
export function buildGalleryPayload(
  keptExisting: string[],
  uploadedUrls: string[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of [...keptExisting, ...uploadedUrls]) {
    const trimmed = url.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= MAX_COVER_IMAGES) break;
  }
  return out;
}
