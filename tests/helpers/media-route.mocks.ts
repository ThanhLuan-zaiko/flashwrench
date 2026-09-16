// Route-level stubs for the media and avatar endpoints. Same pattern
// as route-mocks.ts: handlers only parse, call a service and shape the
// response. Suites drive outcomes through `mediaRouteStubs`.
import { mock } from "bun:test";
import type { MediaAsset, MediaResult } from "@/lib/media/media.types";

export const mediaRouteStubs = {
  mediaCreateResult: null as MediaResult<MediaAsset> | null,
  mediaDeleteResult: null as MediaResult<{ assetId: string }> | null,
  avatarResult: null as MediaResult<{ avatarUrl: string }> | null,
};

export function okMediaAsset(): MediaAsset {
  return {
    assetId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    ownerType: "avatar",
    ownerId: "11111111-1111-4111-8111-111111111111",
    scope: "avatar",
    filePath: "avatar/2026-09/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg",
    url: "/api/media/avatar/2026-09/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.jpg",
    mime: "image/jpeg",
    sizeBytes: 128,
    width: 800,
    height: 600,
    alt: "",
    createdBy: "11111111-1111-4111-8111-111111111111",
    createdAt: "2026-09-16T00:00:00.000Z",
  };
}

export const mediaServiceMocks = {
  createMediaAsset: mock(
    async (): Promise<MediaResult<MediaAsset>> =>
      mediaRouteStubs.mediaCreateResult ?? {
        ok: true,
        data: okMediaAsset(),
      },
  ),
  deleteMediaAsset: mock(
    async (): Promise<MediaResult<{ assetId: string }>> =>
      mediaRouteStubs.mediaDeleteResult ?? {
        ok: true,
        data: { assetId: okMediaAsset().assetId },
      },
  ),
};

export const avatarServiceMocks = {
  setMyAvatar: mock(
    async (): Promise<MediaResult<{ avatarUrl: string }>> =>
      mediaRouteStubs.avatarResult ?? {
        ok: true,
        data: { avatarUrl: okMediaAsset().url },
      },
  ),
};

export function resetMediaRouteMocks(): void {
  mediaRouteStubs.mediaCreateResult = null;
  mediaRouteStubs.mediaDeleteResult = null;
  mediaRouteStubs.avatarResult = null;
  for (const fn of Object.values(mediaServiceMocks)) fn.mockClear();
  for (const fn of Object.values(avatarServiceMocks)) fn.mockClear();
}
