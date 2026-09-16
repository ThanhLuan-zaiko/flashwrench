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

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports, matching tests/integration/*.test.ts.
mock.module(
  "@/lib/catalog/service-categories.repository",
  () => categoryRepoMocks,
);
mock.module("@/lib/catalog/services.repository", () => catalogServiceRepoMocks);
mock.module("@/lib/media/media.repository", () => mediaRepoMocks);

import {
  createService,
  hardDeleteServiceWithConfirm,
  listServices,
  restoreService,
  softDeleteService,
  toggleServiceActive,
  updateService,
} from "@/lib/catalog/services.service";

const SERVICE_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const CATEGORY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

beforeEach(() => {
  resetServiceMocks();
  catalogStubs.categoryById = makeCategoryRow();
});

describe("listServices", () => {
  test("hides deleted rows and filters by category", async () => {
    catalogStubs.serviceRows = [
      makeServiceRow({ service_id: "s1", name: "B", category_id: CATEGORY_ID }),
      makeServiceRow({
        service_id: "s2",
        name: "A",
        category_id: "other-cat",
        category_name: "Other",
      }),
      makeServiceRow({ service_id: "s3", name: "Gone", is_deleted: true }),
    ];
    const all = await listServices();
    expect(all.ok).toBe(true);
    if (!all.ok) return;
    expect(all.data.map((s) => s.id)).toEqual(["s2", "s1"]);

    const filtered = await listServices({ categoryId: CATEGORY_ID });
    expect(filtered.ok).toBe(true);
    if (!filtered.ok) return;
    expect(filtered.data.map((s) => s.id)).toEqual(["s1"]);
  });

  test("includes trash when requested", async () => {
    catalogStubs.serviceRows = [makeServiceRow({ is_deleted: true })];
    const result = await listServices({ includeDeleted: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.length).toBe(1);
    expect(result.data[0]?.isDeleted).toBe(true);
  });
});

describe("createService", () => {
  test("creates and returns the new price row", async () => {
    catalogStubs.serviceSlugOwner = null;
    catalogStubs.serviceById = makeServiceRow({ slug: "thay-binh-ac-quy" });
    const result = await createService(makeServiceInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.slug).toBe("thay-binh-ac-quy");
    expect(catalogServiceRepoMocks.insertService.mock.calls.length).toBe(1);
  });

  test("rejects trashed categories, duplicate slugs and bad payloads", async () => {
    catalogStubs.categoryById = makeCategoryRow({ is_deleted: true });
    expect(await createService(makeServiceInput())).toMatchObject({
      ok: false,
      status: 400,
    });

    catalogStubs.categoryById = makeCategoryRow();
    catalogStubs.serviceSlugOwner = "someone-else";
    expect(await createService(makeServiceInput())).toMatchObject({
      ok: false,
      status: 409,
    });

    catalogStubs.serviceSlugOwner = null;
    expect(
      await createService(makeServiceInput({ basePrice: -5 })),
    ).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(catalogServiceRepoMocks.insertService.mock.calls.length).toBe(0);
  });

  test("returns 409 when the conditional slug claim loses a race", async () => {
    catalogStubs.serviceSlugOwner = null;
    catalogStubs.serviceSlugClaimed = false;
    const result = await createService(makeServiceInput());
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(catalogServiceRepoMocks.insertService.mock.calls.length).toBe(0);
  });

  test("releases the claimed slug when the main insert throws", async () => {
    catalogStubs.serviceSlugOwner = null;
    catalogStubs.serviceSlugClaimed = true;
    catalogServiceRepoMocks.insertService.mockRejectedValueOnce(
      new Error("db down"),
    );
    await expect(createService(makeServiceInput())).rejects.toThrow("db down");
    expect(
      catalogServiceRepoMocks.releaseServiceSlug.mock.calls[0]?.slice(0, 2),
    ).toEqual(["thay-binh-ac-quy", expect.any(String)]);
  });

  test("rejects non-boolean flags without touching storage", async () => {
    catalogStubs.serviceSlugOwner = null;
    const result = await createService(
      makeServiceInput({ isHomeSupported: "false" as never }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    if (result.ok) return;
    expect(result.errors.isHomeSupported).toEqual(expect.any(String));
    expect(catalogServiceRepoMocks.insertService.mock.calls.length).toBe(0);
  });
});

describe("updateService", () => {
  test("claims the new slug and releases the old one", async () => {
    catalogStubs.serviceById = makeServiceRow({
      service_id: SERVICE_ID,
      slug: "old-slug",
    });
    catalogStubs.serviceSlugOwner = null;
    catalogStubs.serviceSlugClaimed = true;
    const result = await updateService(SERVICE_ID, {
      ...makeServiceInput(),
      slug: "new-slug",
    });
    expect(result.ok).toBe(true);
    expect(catalogServiceRepoMocks.updateServiceRows.mock.calls.length).toBe(1);
    expect(
      catalogServiceRepoMocks.claimServiceSlug.mock.calls[0]?.slice(0, 2),
    ).toEqual(["new-slug", SERVICE_ID]);
    expect(
      catalogServiceRepoMocks.releaseServiceSlug.mock.calls[0]?.slice(0, 2),
    ).toEqual(["old-slug", SERVICE_ID]);
  });

  test("returns 409 when the rename claim loses a race", async () => {
    catalogStubs.serviceById = makeServiceRow({
      service_id: SERVICE_ID,
      slug: "old-slug",
    });
    catalogStubs.serviceSlugOwner = null;
    catalogStubs.serviceSlugClaimed = false;
    const result = await updateService(SERVICE_ID, {
      ...makeServiceInput(),
      slug: "taken-slug",
    });
    expect(result).toMatchObject({ ok: false, status: 409 });
    expect(catalogServiceRepoMocks.updateServiceRows.mock.calls.length).toBe(0);
  });

  test("returns 404 and refuses trashed rows", async () => {
    catalogStubs.serviceById = null;
    expect(await updateService("ghost", makeServiceInput())).toMatchObject({
      ok: false,
      status: 404,
    });
    catalogStubs.serviceById = makeServiceRow({ is_deleted: true });
    expect(await updateService(SERVICE_ID, makeServiceInput())).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});

describe("service cover images", () => {
  const COVER_URL = "/api/media/service/2026-09/cover.jpg";

  test("creates with a cover and relinks the asset to the new row", async () => {
    catalogStubs.serviceSlugOwner = null;
    catalogStubs.serviceById = makeServiceRow({
      slug: "thay-binh-ac-quy",
      image_url: COVER_URL,
    });
    const result = await createService(
      makeServiceInput({ imageUrl: COVER_URL, imageAssetId: "asset-1" }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.imageUrl).toBe(COVER_URL);
    expect(mediaRepoMocks.relinkAssetOwner.mock.calls[0]?.slice(0, 2)).toEqual([
      "asset-1",
      "service",
    ]);
    expect(catalogServiceRepoMocks.insertService.mock.calls.length).toBe(1);
  });

  test("returns 404 for an unknown asset without writing", async () => {
    catalogStubs.serviceSlugOwner = null;
    mediaRepoMocks.relinkAssetOwner.mockImplementationOnce(async () => false);
    const result = await createService(
      makeServiceInput({ imageUrl: COVER_URL, imageAssetId: "ghost" }),
    );
    expect(result).toMatchObject({ ok: false, status: 404 });
    if (result.ok) return;
    expect(result.errors.imageAssetId).toEqual(expect.any(String));
    expect(catalogServiceRepoMocks.insertService.mock.calls.length).toBe(0);
  });

  test("rejects external image URLs with 400", async () => {
    const result = await createService(
      makeServiceInput({ imageUrl: "https://cdn.test/cover.jpg" }),
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    if (result.ok) return;
    expect(result.errors.imageUrl).toEqual(expect.any(String));
    expect(mediaRepoMocks.relinkAssetOwner.mock.calls.length).toBe(0);
  });

  test("updates the cover and relinks the asset to the row", async () => {
    catalogStubs.serviceById = makeServiceRow({
      service_id: SERVICE_ID,
      slug: "thay-dau-dong-co",
    });
    catalogStubs.serviceSlugOwner = null;
    const result = await updateService(SERVICE_ID, {
      ...makeServiceInput(),
      slug: "thay-dau-dong-co",
      imageUrl: COVER_URL,
      imageAssetId: "asset-9",
    });
    expect(result.ok).toBe(true);
    expect(mediaRepoMocks.relinkAssetOwner.mock.calls[0]).toEqual([
      "asset-9",
      "service",
      SERVICE_ID,
    ]);
    expect(catalogServiceRepoMocks.updateServiceRows.mock.calls.length).toBe(1);
  });
});

describe("softDeleteService / restoreService", () => {
  test("soft deletes and restores a price row", async () => {
    catalogStubs.serviceById = makeServiceRow({ service_id: SERVICE_ID });
    const deleted = await softDeleteService(SERVICE_ID);
    expect(deleted.ok).toBe(true);
    expect(
      catalogServiceRepoMocks.setServiceDeleted.mock.calls[0]?.slice(0, 3),
    ).toEqual([SERVICE_ID, CATEGORY_ID, true]);

    catalogStubs.serviceById = makeServiceRow({
      service_id: SERVICE_ID,
      is_deleted: true,
    });
    const restored = await restoreService(SERVICE_ID);
    expect(restored.ok).toBe(true);
  });

  test("refuses double soft delete and restore outside trash", async () => {
    catalogStubs.serviceById = makeServiceRow({ is_deleted: true });
    expect(await softDeleteService(SERVICE_ID)).toMatchObject({
      ok: false,
      status: 400,
    });
    catalogStubs.serviceById = makeServiceRow({ is_deleted: false });
    expect(await restoreService(SERVICE_ID)).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  test("blocks restore while the parent category is trashed", async () => {
    catalogStubs.serviceById = makeServiceRow({
      service_id: SERVICE_ID,
      is_deleted: true,
    });
    catalogStubs.categoryById = makeCategoryRow({ is_deleted: true });
    const result = await restoreService(SERVICE_ID);
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(catalogServiceRepoMocks.setServiceDeleted.mock.calls.length).toBe(0);
  });

  test("reports a gone parent distinctly from a trashed one", async () => {
    catalogStubs.serviceById = makeServiceRow({
      service_id: SERVICE_ID,
      is_deleted: true,
    });
    catalogStubs.categoryById = null;
    const result = await restoreService(SERVICE_ID);
    expect(result).toMatchObject({ ok: false, status: 400 });
    if (result.ok) return;
    expect(result.errors.form).toMatch("không còn tồn tại");
    expect(catalogServiceRepoMocks.setServiceDeleted.mock.calls.length).toBe(0);
  });

  test("toggle refuses trashed rows", async () => {
    catalogStubs.serviceById = makeServiceRow({ is_deleted: true });
    expect(await toggleServiceActive(SERVICE_ID, false)).toMatchObject({
      ok: false,
      status: 400,
    });
  });
});

describe("hardDeleteServiceWithConfirm", () => {
  test("permanently deletes on slug confirm", async () => {
    catalogStubs.serviceById = makeServiceRow({
      service_id: SERVICE_ID,
      slug: "thay-dau-dong-co",
    });
    const result = await hardDeleteServiceWithConfirm(
      SERVICE_ID,
      "thay-dau-dong-co",
    );
    expect(result.ok).toBe(true);
    expect(catalogServiceRepoMocks.hardDeleteService.mock.calls[0]).toEqual([
      SERVICE_ID,
      CATEGORY_ID,
      "thay-dau-dong-co",
    ]);
  });

  test("rejects wrong confirm text without touching storage", async () => {
    catalogStubs.serviceById = makeServiceRow({ slug: "thay-dau-dong-co" });
    const result = await hardDeleteServiceWithConfirm(SERVICE_ID, "nope");
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(catalogServiceRepoMocks.hardDeleteService.mock.calls.length).toBe(0);
  });
});
