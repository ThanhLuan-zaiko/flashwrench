// Pure path helpers for uploaded images. No fs here (see
// media-storage.ts for the three fs calls), so tests use these for
// real while mocking only the disk access.
import { join, relative, sep } from "node:path";
import type { MediaScope } from "./media.types";

export function resolveStorageDir(): string {
  const configured = (process.env.STORAGE_DIR ?? "").trim();
  if (configured) return configured;
  return join(process.cwd(), "storage");
}

export function monthBucket(date: Date = new Date()): string {
  // UTC on purpose: this only folders files on disk, so the bucket must
  // not depend on the server's local timezone. Booking calendar months
  // are a different concept (see monthKey in mechanic-period).
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Relative key inside uploads/, e.g. avatar/2026-09/<uuid>.jpg.
// The filename is always server-generated: client names never touch disk.
export function buildAssetKey(
  scope: MediaScope,
  fileId: string,
  extension: string,
  now: Date = new Date(),
): string {
  return [scope, monthBucket(now), `${fileId}.${extension}`].join("/");
}

export function publicAssetUrl(key: string): string {
  return `/api/media/${key}`;
}

export function absoluteAssetPath(key: string): string {
  return join(resolveStorageDir(), "uploads", ...key.split("/"));
}

// Rejects traversal before any fs call: keys stay inside uploads/ and
// match the generated shape (scope/month/file.ext, no dots, no seps).
export function isSafeAssetKey(key: unknown): key is string {
  if (typeof key !== "string" || key.length === 0 || key.length > 220) {
    return false;
  }
  if (key.includes("\\") || key.includes("..")) return false;
  const parts = key.split("/");
  if (parts.length !== 3) return false;
  const [scope, month, file] = parts as [string, string, string];
  if (!/^[a-z]+$/.test(scope)) return false;
  if (!/^\d{4}-\d{2}$/.test(month)) return false;
  if (!/^[A-Za-z0-9-]{1,80}\.[a-z0-9]{2,5}$/.test(file)) return false;
  const absolute = absoluteAssetPath(key);
  const root = join(resolveStorageDir(), "uploads") + sep;
  return absolute.startsWith(root);
}

export function relativeUploadsKey(absolute: string): string | null {
  const root = join(resolveStorageDir(), "uploads") + sep;
  if (!absolute.startsWith(root)) return null;
  return relative(join(resolveStorageDir(), "uploads"), absolute)
    .split(sep)
    .join("/");
}
