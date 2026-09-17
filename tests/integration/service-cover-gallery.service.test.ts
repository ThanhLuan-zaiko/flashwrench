import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  makeCategoryRow,
  makeServiceInput,
  makeServiceRow,
} from "../helpers/catalog.fixtures";
import {
  catalogServiceRepoMocks,
  catalogStubs,
  categoryRepoMocks,
  mediaRepoMocks,
  resetServiceMocks,
} from "../helpers/service-mocks";

// Multi-cover gallery for price rows: deferred uploads land via
// images/imageAssetIds, the first URL mirrors image_url for legacy
// readers. Mirrors the category gallery suite.
mock.module(
  "@/lib/catalog/service-categories.repository",
  () => categoryRepoMocks,
);
mock.module("@/lib/catalog/services.repository", () => catalogServiceRepoMocks);
mock.module("@/lib/media/media.repository", () => mediaRepoMocks);

import { createService, updateService } from "@/lib/catalog/services.service";

const SERVICE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const FIRST = "/api/media/service/2026-09/first.jpg";
const SECOND = "/api/media/service/2026-09/second.jpg";

beforeEach(() => {
  resetServiceMocks();
  catalogStubs.categoryById = makeCategoryRow();
});

describe("service cover gallery", () => {
  test("creates with two covers, claims both, mirrors the first", async () => {
    catalogStubs.serviceSlugOwner = null;
    catalogStubs.serviceById = makeServiceRow({
      image_url: FIRST,
      images: [FIRST, SECOND],
    });
    const result = await createService(
      makeServiceInput({
        imageUrl: FIRST,
        imageAssetId: "asset-1",
        images: [FIRST, SECOND],
        imageAssetIds: ["asset-1", "asset-2"],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.imageUrl).toBe(FIRST);
    expect(result.data.images).toEqual([FIRST, SECOND]);
    expect(mediaRepoMocks.relinkAssetOwner.mock.calls.length).toBe(2);
    const inserted = catalogServiceRepoMocks.insertService.mock
      .calls[0]?.[0] as {
      imageUrl: string;
      images: string[];
    };
    expect(inserted.imageUrl).toBe(FIRST);
    expect(inserted.images).toEqual([FIRST, SECOND]);
  });

  test("legacy single-cover input still yields a one-item gallery", async () => {
    catalogStubs.serviceSlugOwner = null;
    catalogStubs.serviceById = makeServiceRow({
      image_url: FIRST,
      images: [FIRST],
    });
    const result = await createService(
      makeServiceInput({ imageUrl: FIRST, imageAssetId: "asset-1" }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.images).toEqual([FIRST]);
  });

  test("unknown gallery asset aborts without writing", async () => {
    catalogStubs.serviceSlugOwner = null;
    mediaRepoMocks.relinkAssetOwner.mockImplementationOnce(async () => false);
    const result = await createService(
      makeServiceInput({
        imageUrl: FIRST,
        images: [FIRST, SECOND],
        imageAssetIds: ["ghost", "asset-2"],
      }),
    );
    expect(result).toMatchObject({ ok: false, status: 404 });
    expect(catalogServiceRepoMocks.insertService.mock.calls.length).toBe(0);
  });

  test("updates reorder the gallery and keep the new cover first", async () => {
    catalogStubs.serviceById = makeServiceRow({
      service_id: SERVICE_ID,
      image_url: FIRST,
      images: [FIRST],
    });
    catalogStubs.serviceSlugOwner = null;
    const result = await updateService(SERVICE_ID, {
      ...makeServiceInput(),
      imageUrl: SECOND,
      images: [SECOND, FIRST],
      imageAssetIds: ["asset-9"],
    });
    expect(result.ok).toBe(true);
    const updated = catalogServiceRepoMocks.updateServiceRows.mock
      .calls[0]?.[0] as {
      imageUrl: string;
      images: string[];
    };
    expect(updated.imageUrl).toBe(SECOND);
    expect(updated.images).toEqual([SECOND, FIRST]);
  });
});
