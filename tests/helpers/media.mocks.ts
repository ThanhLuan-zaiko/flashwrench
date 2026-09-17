// Shared stubs for the media suites. Repository and storage handles
// live here so service tests assert writes without touching ScyllaDB
// or the disk. Extend these instead of file-local mocks.
import { mock } from "bun:test";
import type {
  InsertAssetParams,
  OwnerAssetRef,
} from "@/lib/media/media.repository";
import type { MediaAssetRow } from "@/lib/media/media.types";

export const mediaStubs = {
  assetById: null as MediaAssetRow | null,
  ownerAssets: [] as OwnerAssetRef[],
  insertError: null as Error | null,
  claimAssetResult: null as
    | { ok: true; data: { assetId: string } }
    | { ok: false; status: number; errors: { imageAssetId: string } }
    | null,
  files: new Map<string, Buffer>(),
};

export const mediaRepoMocks = {
  insertAsset: mock(async (params: InsertAssetParams): Promise<void> => {
    if (mediaStubs.insertError) throw mediaStubs.insertError;
    void params;
  }),
  findAssetRowById: mock(
    async (_assetId: string): Promise<MediaAssetRow | null> =>
      mediaStubs.assetById,
  ),
  listAssetRowsByOwner: mock(
    async (_ownerType: string, _ownerId: string): Promise<OwnerAssetRef[]> =>
      mediaStubs.ownerAssets,
  ),
  deleteAssetRows: mock(
    async (
      _assetId: string,
      _ownerType: string,
      _ownerId: string,
      _createdAt: Date,
    ): Promise<void> => undefined,
  ),
  relinkAssetOwner: mock(
    async (
      _assetId: string,
      _ownerType: string,
      _ownerId: string,
    ): Promise<boolean> => true,
  ),
};

export const mediaStorageMocks = {
  writeAssetFile: mock(async (key: string, data: Buffer): Promise<void> => {
    mediaStubs.files.set(key, data);
  }),
  deleteAssetFile: mock(async (key: string): Promise<void> => {
    mediaStubs.files.delete(key);
  }),
  readAssetFile: mock(async (key: string): Promise<Buffer> => {
    const data = mediaStubs.files.get(key);
    if (!data) {
      throw Object.assign(new Error("Missing file."), { code: "ENOENT" });
    }
    return data;
  }),
};

export function resetMediaMocks(): void {
  mediaStubs.assetById = null;
  mediaStubs.ownerAssets = [];
  mediaStubs.insertError = null;
  mediaStubs.claimAssetResult = null;
  mediaStubs.files.clear();
  for (const fn of Object.values(mediaRepoMocks)) fn.mockClear();
  for (const fn of Object.values(mediaStorageMocks)) fn.mockClear();
}
