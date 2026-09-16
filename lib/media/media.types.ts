// Shared shapes for the media asset domain. Files live on disk under
// storage/uploads/<scope>/<YYYY-MM>/<uuid>.<ext>; ScyllaDB keeps only
// metadata plus the public URL. Repositories map rows; services decide.

export type MediaScope =
  | "avatar"
  | "service"
  | "category"
  | "part"
  | "booking"
  | "emergency"
  | "review"
  | "misc";

export type MediaAsset = {
  assetId: string;
  ownerType: string;
  ownerId: string;
  scope: MediaScope;
  filePath: string;
  url: string;
  mime: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  alt: string;
  createdBy: string;
  createdAt: string | null;
};

export type MediaAssetRow = {
  asset_id: string;
  owner_type: string | null;
  owner_id: string | null;
  scope: string | null;
  file_path: string | null;
  url: string | null;
  mime: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  created_by: string | null;
  created_at: Date | null;
};

export type CreateAssetInput = {
  ownerType: unknown;
  ownerId: unknown;
  scope: unknown;
  file: Buffer;
  mime: unknown;
  width?: unknown;
  height?: unknown;
  alt?: unknown;
};

export type MediaFieldErrors = Partial<
  Record<
    | "file"
    | "scope"
    | "ownerType"
    | "ownerId"
    | "alt"
    | "imageAssetId"
    | "form",
    string
  >
>;

export type MediaResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; errors: MediaFieldErrors };
