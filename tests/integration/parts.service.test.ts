import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  makePartCategoryRow,
  makePartInput,
  makePartRow,
} from "../helpers/parts.fixtures";
import {
  partCategoryRepoMocks,
  partInventoryRepoMocks,
  partRepoMocks,
  partStubs,
  partsMediaServiceMocks,
  resetServiceMocks,
} from "../helpers/service-mocks";

// Helpers first, mocks second, system under test last: bun hoists
// mock.module above imports, matching tests/integration/*.test.ts.
mock.module("@/lib/parts/parts.repository", () => partRepoMocks);
mock.module(
  "@/lib/parts/parts-inventory.repository",
  () => partInventoryRepoMocks,
);
mock.module(
  "@/lib/parts/part-categories.repository",
  () => partCategoryRepoMocks,
);
mock.module("@/lib/media/media.service", () => partsMediaServiceMocks);

import { createPart } from "@/lib/parts/parts.service";
import {
  adjustPartStock,
  hardDeletePartWithConfirm,
  restorePart,
  softDeletePart,
} from "@/lib/parts/parts-lifecycle.service";

beforeEach(() => {
  resetServiceMocks();
});

describe("createPart", () => {
  test("creates a part when slug, sku and category are clear", async () => {
    partStubs.categoryById = makePartCategoryRow();
    partStubs.partById = makePartRow();
    const result = await createPart(makePartInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(partRepoMocks.claimPartSlug.mock.calls[0]?.[0]).toBe("bugi-ngk");
    expect(partRepoMocks.claimPartSku).toHaveBeenCalled();
    expect(partRepoMocks.insertPart).toHaveBeenCalled();
  });

  test("rejects invalid input before touching storage", async () => {
    const result = await createPart(makePartInput({ name: "  " }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.name).toBeTruthy();
    expect(partRepoMocks.insertPart).not.toHaveBeenCalled();
  });

  test("rejects a missing or trashed category", async () => {
    partStubs.categoryById = null;
    const result = await createPart(makePartInput());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(result.errors.categoryId).toBeTruthy();
    expect(partRepoMocks.insertPart).not.toHaveBeenCalled();
  });

  test("rejects a taken slug and never claims the sku", async () => {
    partStubs.categoryById = makePartCategoryRow();
    partStubs.partSlugOwner = "someone-else";
    const result = await createPart(makePartInput());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(result.errors.slug).toBeTruthy();
    expect(partRepoMocks.claimPartSlug).not.toHaveBeenCalled();
    expect(partRepoMocks.insertPart).not.toHaveBeenCalled();
  });

  test("releases the slug when the sku claim loses the race", async () => {
    partStubs.categoryById = makePartCategoryRow();
    partStubs.partSkuClaimed = false;
    const result = await createPart(makePartInput());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(409);
    expect(result.errors.sku).toBeTruthy();
    expect(partRepoMocks.releasePartSlug).toHaveBeenCalled();
    expect(partRepoMocks.insertPart).not.toHaveBeenCalled();
  });
});

describe("adjustPartStock", () => {
  test("rejects non-integer and negative stock without writing", async () => {
    for (const bad of [-1, 1.5, 1_000_001]) {
      const result = await adjustPartStock("p1", bad);
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.status).toBe(400);
      expect(result.errors.stock).toBeTruthy();
    }
    expect(partInventoryRepoMocks.setPartStock).not.toHaveBeenCalled();
  });

  test("writes the absolute stock for a live part", async () => {
    partStubs.partById = makePartRow({ stock_qty: 4 });
    const result = await adjustPartStock("p1", 42);
    expect(result.ok).toBe(true);
    const stockCall = partInventoryRepoMocks.setPartStock.mock.calls[0];
    expect(stockCall?.slice(0, 4)).toEqual([
      "p1",
      makePartRow().category_id,
      makePartRow().created_at,
      42,
    ]);
  });

  test("rejects a trashed part", async () => {
    partStubs.partById = makePartRow({ is_deleted: true });
    const result = await adjustPartStock("p1", 5);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(partInventoryRepoMocks.setPartStock).not.toHaveBeenCalled();
  });
});

describe("part delete lifecycle", () => {
  test("soft delete marks the row; restore requires a live category", async () => {
    partStubs.partById = makePartRow();
    const deleted = await softDeletePart("p1");
    expect(deleted.ok).toBe(true);
    const deleteCall = partInventoryRepoMocks.setPartDeleted.mock.calls[0];
    expect(deleteCall?.slice(0, 5)).toEqual([
      makePartRow().part_id,
      makePartRow().category_id,
      makePartRow().created_at,
      makePartRow().brand,
      true,
    ]);

    partStubs.partById = makePartRow({ is_deleted: true });
    partStubs.categoryById = makePartCategoryRow({ is_deleted: true });
    const blocked = await restorePart("p1");
    expect(blocked.ok).toBe(false);
    if (blocked.ok) return;
    expect(blocked.status).toBe(400);
  });

  test("hard delete only proceeds when the confirm echoes the slug", async () => {
    partStubs.partById = makePartRow({ slug: "dau-nhot-10w-40" });
    const wrong = await hardDeletePartWithConfirm("p1", "khac-slug");
    expect(wrong.ok).toBe(false);
    if (wrong.ok) return;
    expect(wrong.status).toBe(400);
    expect(wrong.errors.confirm).toBeTruthy();
    expect(partInventoryRepoMocks.hardDeletePart).not.toHaveBeenCalled();

    const right = await hardDeletePartWithConfirm("p1", "dau-nhot-10w-40");
    expect(right.ok).toBe(true);
    expect(partInventoryRepoMocks.hardDeletePart).toHaveBeenCalled();
    expect(partsMediaServiceMocks.pruneOwnerAssets.mock.calls[0]).toEqual([
      "part",
      "p1",
      [],
    ]);
  });
});
