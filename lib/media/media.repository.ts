// Raw CQL for the media asset registry. Files live on disk; only
// metadata and the public URL are stored here. No business logic.
import { scylla } from "@/lib/db/client";
import type { MediaAssetRow } from "./media.types";

export type InsertAssetParams = {
  assetId: string;
  ownerType: string;
  ownerId: string;
  scope: string;
  filePath: string;
  url: string;
  mime: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  alt: string;
  createdBy: string;
  createdAt: Date;
};

type RawRow = Record<string, unknown>;

function toStringOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") return Number(value);
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toRow(raw: RawRow): MediaAssetRow {
  return {
    asset_id: String(raw.asset_id),
    owner_type: toStringOrNull(raw.owner_type),
    owner_id: toStringOrNull(raw.owner_id),
    scope: toStringOrNull(raw.scope),
    file_path: toStringOrNull(raw.file_path),
    url: toStringOrNull(raw.url),
    mime: toStringOrNull(raw.mime),
    size_bytes: toNumberOrNull(raw.size_bytes),
    width: toNumberOrNull(raw.width),
    height: toNumberOrNull(raw.height),
    alt: toStringOrNull(raw.alt),
    created_by: toStringOrNull(raw.created_by),
    created_at: toDateOrNull(raw.created_at),
  };
}

export async function insertAsset(params: InsertAssetParams): Promise<void> {
  await scylla.batch(
    [
      {
        query:
          "INSERT INTO media_assets (asset_id, owner_type, owner_id, scope, file_path, url, mime, size_bytes, width, height, alt, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params: [
          params.assetId,
          params.ownerType,
          params.ownerId,
          params.scope,
          params.filePath,
          params.url,
          params.mime,
          params.sizeBytes,
          params.width,
          params.height,
          params.alt,
          params.createdBy,
          params.createdAt,
        ],
      },
      {
        query:
          "INSERT INTO media_assets_by_owner (owner_type, owner_id, created_at, asset_id, url) VALUES (?, ?, ?, ?, ?)",
        params: [
          params.ownerType,
          params.ownerId,
          params.createdAt,
          params.assetId,
          params.url,
        ],
      },
    ],
    { prepare: true },
  );
}

export async function findAssetRowById(
  assetId: string,
): Promise<MediaAssetRow | null> {
  const result = await scylla.execute(
    "SELECT asset_id, owner_type, owner_id, scope, file_path, url, mime, size_bytes, width, height, alt, created_by, created_at FROM media_assets WHERE asset_id = ?",
    [assetId],
    { prepare: true },
  );
  const row = result.first() as unknown as RawRow | null;
  return row ? toRow(row) : null;
}

export type OwnerAssetRef = {
  assetId: string;
  url: string;
  createdAt: Date;
};

// Every asset of one owner, newest first. Drives lifecycle cleanup
// (hard delete purges the gallery; gallery edits prune removed covers)
// without scanning the registry table.
export async function listAssetRowsByOwner(
  ownerType: string,
  ownerId: string,
): Promise<OwnerAssetRef[]> {
  const result = await scylla.execute(
    "SELECT asset_id, url, created_at FROM media_assets_by_owner WHERE owner_type = ? AND owner_id = ?",
    [ownerType, ownerId],
    { prepare: true },
  );
  const refs: OwnerAssetRef[] = [];
  for (const raw of result.rows as unknown as RawRow[]) {
    const createdAt = toDateOrNull(raw.created_at);
    if (typeof raw.asset_id === "undefined" || !createdAt) continue;
    refs.push({
      assetId: String(raw.asset_id),
      url: typeof raw.url === "string" ? raw.url : "",
      createdAt,
    });
  }
  return refs;
}

// Re-point an asset at its real owner after the owner row exists
// (uploads happen before the catalog dialog saves). Returns false
// when the asset does not exist; the index delete reuses the stored
// clustering values so the old position never orphans.
export async function relinkAssetOwner(
  assetId: string,
  ownerType: string,
  ownerId: string,
): Promise<boolean> {
  const row = await findAssetRowById(assetId);
  if (!row || !row.owner_type || !row.owner_id || !row.created_at) {
    return false;
  }
  await scylla.batch(
    [
      {
        query:
          "UPDATE media_assets SET owner_type = ?, owner_id = ? WHERE asset_id = ?",
        params: [ownerType, ownerId, assetId],
      },
      {
        query:
          "DELETE FROM media_assets_by_owner WHERE owner_type = ? AND owner_id = ? AND created_at = ? AND asset_id = ?",
        params: [row.owner_type, row.owner_id, row.created_at, assetId],
      },
      {
        query:
          "INSERT INTO media_assets_by_owner (owner_type, owner_id, created_at, asset_id, url) VALUES (?, ?, ?, ?, ?)",
        params: [ownerType, ownerId, row.created_at, assetId, row.url],
      },
    ],
    { prepare: true },
  );
  return true;
}

// The owner index row needs the original created_at clustering value,
// so deletes read the asset first (the service always does).
export async function deleteAssetRows(
  assetId: string,
  ownerType: string,
  ownerId: string,
  createdAt: Date,
): Promise<void> {
  await scylla.batch(
    [
      {
        query: "DELETE FROM media_assets WHERE asset_id = ?",
        params: [assetId],
      },
      {
        query:
          "DELETE FROM media_assets_by_owner WHERE owner_type = ? AND owner_id = ? AND created_at = ? AND asset_id = ?",
        params: [ownerType, ownerId, createdAt, assetId],
      },
    ],
    { prepare: true },
  );
}
